import { createClient } from "redis";
import { MULTITENANT } from 'app/config';

declare global {
  // To avoid creating multiple clients in development with hot reload
  var redis: ReturnType<typeof createClient> | undefined;
}

export const redis: ReturnType<typeof createClient>  | undefined = MULTITENANT ? (global.redis ?? createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
})) : undefined;

if (!global.redis && MULTITENANT) {
  global.redis = redis;

  // Connect asynchronously and handle errors
  (async () => {
    try {
      if (redis) {
        await redis.connect();
        console.log("✅ Redis connected");
      }
    } catch (err) {
      console.error("❌ Redis connection failed:", err);
    }
  })();
}
