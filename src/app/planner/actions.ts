"use server";

import { Redis } from "@upstash/redis";
import { revalidatePath } from "next/cache";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  type: "school" | "home" | "hobby";
  date: string; // ISO string (YYYY-MM-DD)
  time?: string; // HH:mm format
}

export interface CapyState {
  oranges: number;
  level: number;
  equippedItems: string[];
  ownedItems: string[];
  stickers: string[];
  streak: number;
  lastActiveDate: string;
}

const TASKS_KEY_PREFIX = "tasks:"; // Standard prefix
const CAPY_KEY = "capy_state";

export async function getTasks(date: string): Promise<Task[]> {
  const tasks = await redis.get<Task[]>(`${TASKS_KEY_PREFIX}${date}`);
  return tasks || [];
}

export async function saveTask(task: Task): Promise<Task[]> {
  const tasks = await getTasks(task.date);
  const updatedTasks = [...tasks.filter(t => t.id !== task.id), task];
  await redis.set(`${TASKS_KEY_PREFIX}${task.date}`, updatedTasks);
  revalidatePath("/planner");
  return updatedTasks;
}

export async function deleteTask(id: string, date: string): Promise<Task[]> {
  const tasks = await getTasks(date);
  const updatedTasks = tasks.filter((t) => t.id !== id);
  await redis.set(`${TASKS_KEY_PREFIX}${date}`, updatedTasks);
  revalidatePath("/planner");
  return updatedTasks;
}

export async function getCapyState(): Promise<CapyState> {
  const state = await redis.get<CapyState>(CAPY_KEY);
  return state || { 
    oranges: 1, 
    level: 1, 
    equippedItems: [], 
    ownedItems: [], 
    stickers: [], 
    streak: 0, 
    lastActiveDate: "" 
  };
}

export async function updateCapyState(newState: Partial<CapyState>) {
  const currentState = await getCapyState();
  const updated = { ...currentState, ...newState };
  await redis.set(CAPY_KEY, updated);
  revalidatePath("/planner");
}
