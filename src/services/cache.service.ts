import { redis } from '../config/redis';

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  const data = await redis.get(key);
  if (!data) return null;
  return JSON.parse(data) as T;
};

export const cacheSet = async <T>(key: string, value: T, ttl: number): Promise<void> => {
  await redis.set(key, JSON.stringify(value), 'EX', ttl);
};

export const cacheDelete = async (key: string): Promise<void> => {
  await redis.del(key);
};

export const cacheDeletePattern = async (pattern: string): Promise<void> => {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
};
