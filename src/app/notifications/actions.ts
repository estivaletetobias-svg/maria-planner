"use server";

import { Redis } from "@upstash/redis";
import webpush from "web-push";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;

webpush.setVapidDetails(
  "mailto:contato@mariaplanner.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

const SUBSCRIPTIONS_KEY = "push_subscriptions";

export async function saveSubscription(subscription: any) {
  // Store multiple subscriptions (PWA might be on several devices)
  const existingSubStr = await redis.get<string[]>(SUBSCRIPTIONS_KEY);
  const subs = existingSubStr || [];
  
  // Check if already exists
  const subString = JSON.stringify(subscription);
  if (!subs.includes(subString)) {
    subs.push(subString);
    await redis.set(SUBSCRIPTIONS_KEY, subs);
  }
}

export async function sendPushNotification(title: string, body: string, url: string = "/") {
  const subs = await redis.get<string[]>(SUBSCRIPTIONS_KEY);
  if (!subs) return;

  const results = await Promise.allSettled(
    subs.map(async (subStr) => {
      try {
        const sub = JSON.parse(subStr);
        await webpush.sendNotification(
          sub,
          JSON.stringify({ title, body, url })
        );
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Subscription expired, remove it
          return subStr;
        }
        console.error("Error sending push:", err);
      }
    })
  );

  // Clean up expired subs
  const expired = results
    .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled" && !!r.value)
    .map(r => r.value);

  if (expired.length > 0) {
    const updated = subs.filter(s => !expired.includes(s));
    await redis.set(SUBSCRIPTIONS_KEY, updated);
  }
}
