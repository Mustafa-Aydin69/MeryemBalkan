/**
 * Admin Panel Client-Side Cache Store
 * 
 * Module-level cache that persists across component re-renders and page navigations.
 * Cache is cleared only on full page refresh (F5) or when explicitly invalidated.
 * 
 * Cache Strategy:
 * - Data is fetched ONCE from Supabase on first visit to each admin section
 * - Subsequent visits use cached data (instant render)
 * - CRUD operations update cache locally (no refetch needed)
 * - Cache can be manually invalidated per section if needed
 */

// Types for each data section
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface AdminCacheStore {
  orders: CacheEntry<any[]> | null;
  products: CacheEntry<any[]> | null;
  rentals: CacheEntry<any[]> | null;
  messages: CacheEntry<any[]> | null;
  instagram: CacheEntry<any[]> | null;
}

const CACHE_TTL_MS = 15 * 60 * 1000; // JWT süresiyle uyumlu

function isFresh(key: CacheKey): boolean {
  const entry = cache[key];
  if (!entry) return false;
  return Date.now() - entry.timestamp <= CACHE_TTL_MS;
}

// Module-level cache - persists across re-renders
const cache: AdminCacheStore = {
  orders: null,
  products: null,
  rentals: null,
  messages: null,
  instagram: null,
};

// Cache keys type
export type CacheKey = keyof AdminCacheStore;

/**
 * Get cached data for a section
 */
export function getCache<T>(key: CacheKey): T[] | null {
  const entry = cache[key];
  if (!entry) return null;
  return entry.data as T[];
}

/**
 * Set cache for a section
 */
export function setCache<T>(key: CacheKey, data: T[]): void {
  cache[key] = {
    data,
    timestamp: Date.now(),
  };
}

/**
 * Check if cache exists and is still fresh
 */
export function hasCache(key: CacheKey): boolean {
  return cache[key] !== null && isFresh(key);
}

/**
 * Invalidate (clear) cache for a specific section
 */
export function invalidateCache(key: CacheKey): void {
  cache[key] = null;
}

/**
 * Invalidate all caches
 */
export function invalidateAllCaches(): void {
  cache.orders = null;
  cache.products = null;
  cache.rentals = null;
  cache.messages = null;
  cache.instagram = null;
}

/**
 * Update a single item in cache (for edit operations)
 */
export function updateCacheItem<T extends { id: number }>(
  key: CacheKey,
  id: number,
  updater: (item: T) => T
): void {
  const entry = cache[key];
  if (!entry) return;
  
  cache[key] = {
    ...entry,
    data: entry.data.map((item: T) => 
      item.id === id ? updater(item) : item
    ),
  };
}

/**
 * Add item to cache (for create operations)
 */
export function addToCacheStart<T>(key: CacheKey, item: T): void {
  const entry = cache[key];
  if (!entry) return;
  
  cache[key] = {
    ...entry,
    data: [item, ...entry.data],
  };
}

/**
 * Add item to cache end (for create operations)
 */
export function addToCacheEnd<T>(key: CacheKey, item: T): void {
  const entry = cache[key];
  if (!entry) return;
  
  cache[key] = {
    ...entry,
    data: [...entry.data, item],
  };
}

/**
 * Remove item from cache (for delete operations)
 */
export function removeFromCache(key: CacheKey, id: number): void {
  const entry = cache[key];
  if (!entry) return;
  
  cache[key] = {
    ...entry,
    data: entry.data.filter((item: any) => item.id !== id),
  };
}

/**
 * Replace entire cache data (for bulk operations)
 */
export function replaceCache<T>(key: CacheKey, data: T[]): void {
  cache[key] = {
    data,
    timestamp: Date.now(),
  };
}

/**
 * Get cache timestamp (for debugging)
 */
export function getCacheTimestamp(key: CacheKey): number | null {
  return cache[key]?.timestamp ?? null;
}

/**
 * Check if cache is stale (older than maxAge in ms)
 * Note: Currently we don't auto-invalidate, but this can be used if needed
 */
export function isCacheStale(key: CacheKey, maxAgeMs: number = 5 * 60 * 1000): boolean {
  const entry = cache[key];
  if (!entry) return true;
  return Date.now() - entry.timestamp > maxAgeMs;
}
