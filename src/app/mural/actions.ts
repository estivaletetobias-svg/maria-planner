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

const MURAL_IDS_KEY = "mural_note_ids";
const NOTE_PREFIX = "note:";

export async function getNotes(): Promise<Note[]> {
  const ids = await redis.smembers(MURAL_IDS_KEY);
  if (!ids || ids.length === 0) return [];
  
  // Fetch all notes in parallel using MGET or individual GETs
  const noteKeys = ids.map(id => `${NOTE_PREFIX}${id}`);
  const notes = await redis.mget<Note[]>(...noteKeys);
  
  // Filter out nulls (in case some notes were deleted but ID stayed)
  return notes.filter((n): n is Note => n !== null);
}

import { sendPushNotification } from "@/app/notifications/actions";

export async function addNote(note: Note) {
  // Save individual note
  await redis.set(`${NOTE_PREFIX}${note.id}`, note);
  // Add ID to the set
  await redis.sadd(MURAL_IDS_KEY, note.id);
  
  // Trigger Push
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
  // Remove individual key
  await redis.del(`${NOTE_PREFIX}${id}`);
  // Remove ID from set
  await redis.srem(MURAL_IDS_KEY, id);
  revalidatePath("/mural");
}
