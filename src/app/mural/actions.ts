"use server";

import { Redis } from "@upstash/redis";
import { revalidatePath } from "next/cache";

const redis = Redis.fromEnv();

export interface Note {
  id: string;
  content: string;
  color: string;
  author: string;
  x: number;
  y: number;
  rotation: number;
}

const MURAL_KEY = "mural_notes";

export async function getNotes(): Promise<Note[]> {
  const notes = await redis.get<Note[]>(MURAL_KEY);
  return notes || [];
}

export async function addNote(note: Note) {
  const notes = await getNotes();
  const updatedNotes = [...notes, note];
  await redis.set(MURAL_KEY, updatedNotes);
  revalidatePath("/mural");
}

export async function deleteNote(id: string) {
  const notes = await getNotes();
  const updatedNotes = notes.filter((n) => n.id !== id);
  await redis.set(MURAL_KEY, updatedNotes);
  revalidatePath("/mural");
}
