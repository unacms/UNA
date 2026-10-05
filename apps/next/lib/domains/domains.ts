import { redis } from "./redis";
import { randomUUID } from "crypto";

export async function updateDomain(
  domainId: string,
  updates: {
    hostname?: string;
    unaUrl?: string;
    unaApiKey?: string;
  }
) {
  if (!redis) {
    throw new Error('Redis client is not initialized');
  }

  const key = `domain:${domainId}`;

  const domain = await redis.hGetAll(key);
  if (!domain || !domain.id) throw new Error("Domain not found");

  const multi = redis.multi();

  if (updates.hostname && updates.hostname !== domain.hostname) {
    // Remove old hostname index
    multi.del(`hostname:${domain.hostname}`);

    // Add new hostname index
    multi.set(`hostname:${updates.hostname}`, domainId);

    multi.hSet(key, "hostname", updates.hostname);
  }

  if (updates.unaUrl) multi.hSet(key, "unaUrl", updates.unaUrl);
  if (updates.unaApiKey) multi.hSet(key, "unaApiKey", updates.unaApiKey);

  // bump revision
  multi.hIncrBy(key, "revision", 1);

  await multi.exec();
}

export async function createDomain(userId: string, data: {
  hostname: string;
  unaUrl: string;
  unaApiKey: string;
}) {
  if (!redis) {
    throw new Error('Redis client is not initialized');
  }

  const id = randomUUID();
  const domainKey = `domain:${id}`;
  const hostnameKey = `hostname:${data.hostname}`;

  // Check if hostname already exists
  const exists = await redis.exists(hostnameKey);
  if (exists) throw new Error("Hostname already exists");

  await redis
    .multi()
    .hSet(domainKey, {
      id,
      hostname: data.hostname,
      unaUrl: data.unaUrl,
      unaApiKey: data.unaApiKey,
      revision: 1,
      userId,
    })
    .sAdd(`user:${userId}:domains`, id)
    .set(hostnameKey, id) // store mapping hostname → domainId
    .exec();

  return id;
}

export async function getUserDomains(userId: string) {
  if (!redis) {
    throw new Error('Redis client is not initialized');
  }
  const ids = await redis.sMembers(`user:${userId}:domains`);
  if (ids.length === 0) return [];

  const pipeline = redis.multi();
  ids.forEach((id) => pipeline.hGetAll(`domain:${id}`));
  const result = await pipeline.exec();
  return result.filter((domain) => Object.keys(domain).length > 0);
}

export async function getDomainByHostname(hostname: string) {
  if (!redis) {
    throw new Error('Redis client is not initialized');
  }
  
  const domainId = await redis.get(`hostname:${hostname}`);
  if (!domainId) return null;

  const domain = await redis.hGetAll(`domain:${domainId}`);
  return Object.keys(domain).length === 0 ? null : domain;
}