import { LRUCache } from 'lru-cache';
import { PriceBar } from '../types';

// Cache structure: Key -> StockCandle[]
// Key format: `${symbol}:${interval}:${fromDate}:${toDate}`
// Using 15-minute TTL as specified in the plan
const options = {
  max: 500, // Maximum number of items in cache
  ttl: 1000 * 60 * 15, // 15 minutes TTL
};

const cache = new LRUCache<string, PriceBar[]>(options);

export const memoryCache = {
  get: (key: string): PriceBar[] | undefined => {
    return cache.get(key);
  },
  
  set: (key: string, data: PriceBar[]) => {
    cache.set(key, data);
  },
  
  has: (key: string): boolean => {
    return cache.has(key);
  },
  
  delete: (key: string) => {
    cache.delete(key);
  },
  
  clear: () => {
    cache.clear();
  }
};
