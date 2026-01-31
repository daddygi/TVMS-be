export interface CacheOptions {
  ttl: number; // seconds
}

export const CACHE_TTL = {
  LIST: 300,      // 5 minutes
  DETAIL: 1800,   // 30 minutes
  STATS: 300,     // 5 minutes
} as const;

export const CACHE_KEYS = {
  APPREHENSION_LIST: 'apprehensions:list',
  APPREHENSION_DETAIL: 'apprehensions:detail',
  APPREHENSION_STATS: 'apprehensions:stats',
  ANALYTICS_TRENDS: 'analytics:trends',
  ANALYTICS_DISTRIBUTIONS: 'analytics:distributions',
  ANALYTICS_TIME_PATTERNS: 'analytics:time-patterns',
  ANALYTICS_SUMMARY: 'analytics:summary',
} as const;
