export interface CacheOptions {
  ttl: number; // seconds
}

export const CACHE_TTL = {
  LIST: 300,      // 5 minutes
  DETAIL: 1800,   // 30 minutes
} as const;

export const CACHE_KEYS = {
  APPREHENSION_LIST: 'apprehensions:list',
  APPREHENSION_DETAIL: 'apprehensions:detail',
} as const;
