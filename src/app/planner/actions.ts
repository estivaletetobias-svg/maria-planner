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

const TASKS_KEY_PREFIX = "tasks_h:"; // Note the change to 'h' for hash
const CAPY_KEY = "capy_state";

export async function getTasks(date: string): Promise<Task[]> {
  console.log(`[Redis] Lendo tarefas para: ${date}`);
  const tasksObj = await redis.hgetall<Record<string, Task>>(`${TASKS_KEY_PREFIX}${date}`);
  if (!tasksObj) return [];
  return Object.values(tasksObj);
}

export async function saveTask(task: Task) {
  console.log(`[Redis] Salvando tarefa "${task.text}" em: ${task.date}`);
  await redis.hset(`${TASKS_KEY_PREFIX}${task.date}`, {
    [task.id]: task
  });
  revalidatePath("/planner");
}

export async function deleteTask(id: string, date: string) {
  await redis.hdel(`${TASKS_KEY_PREFIX}${date}`, id);
  revalidatePath("/planner");
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
