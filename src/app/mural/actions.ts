"use server";

import { Redis } from "@upstash/redis";
import { revalidatePath } from "next/cache";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export interface Note {
  id: string;
  content: string;
  color: string;
  author: string;
  audio?: string; // Base64 audio data
  x: number;
  y: number;
  rotation: number;
}

const MURAL_IDS_KEY_V1 = "mural_note_ids";
const NOTE_PREFIX_V1 = "note:";

const MURAL_IDS_KEY_V2 = "mural_note_ids_v2";
const NOTE_PREFIX_V2 = "note_v2:";

export async function getNotes(): Promise<Note[]> {
  console.log("[Mural] Lendo notas...");
  
  // Migration logic: check if V1 exists and V2 is empty
  const v1Exists = await redis.exists(MURAL_IDS_KEY_V1);
  const v2Count = await redis.scard(MURAL_IDS_KEY_V2);
  
  if (v1Exists && v2Count === 0) {
    console.log("[Mural] Iniciando migração V1 -> V2...");
    const ids = await redis.smembers(MURAL_IDS_KEY_V1);
    for (const id of ids) {
      const note = await redis.get<Note>(`${NOTE_PREFIX_V1}${id}`);
      if (note) {
        await redis.set(`${NOTE_PREFIX_V2}${id}`, note);
        await redis.sadd(MURAL_IDS_KEY_V2, id);
      }
    }
  }

  const ids = await redis.smembers(MURAL_IDS_KEY_V2);
  if (!ids || ids.length === 0) return [];
  
  const notes: Note[] = [];
  for (const id of ids) {
    const note = await redis.get<Note>(`${NOTE_PREFIX_V2}${id}`);
    if (note) notes.push(note);
  }
  
  return notes;
}

import { sendPushNotification } from "@/app/notifications/actions";

export async function addNote(note: Note) {
  console.log(`[Mural] Adicionando nota de ${note.author}`);
  await redis.set(`${NOTE_PREFIX_V2}${note.id}`, note);
  await redis.sadd(MURAL_IDS_KEY_V2, note.id);
  
  try {
    const typeStr = note.audio ? "um áudio 🎙️" : "um recado 📝";
    await sendPushNotification(
      "Recado no Mural! ✨",
      `${note.author} deixou ${typeStr} para você no mural.`,
      "/mural"
    );
  } catch (err) {
    console.error("Push Error (Silent):", err);
  }

  revalidatePath("/mural");
}

export async function deleteNote(id: string) {
  console.log(`[Mural] Deletando nota ${id}`);
  await redis.del(`${NOTE_PREFIX_V2}${id}`);
  await redis.srem(MURAL_IDS_KEY_V2, id);
  revalidatePath("/mural");
}

export async function updateNotePosition(id: string, x: number, y: number) {
  const note = await redis.get<Note>(`${NOTE_PREFIX_V2}${id}`);
  if (note) {
    note.x = x;
    note.y = y;
    await redis.set(`${NOTE_PREFIX_V2}${id}`, note);
  }
}
