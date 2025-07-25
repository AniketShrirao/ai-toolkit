import { CacheConfig, CacheEntry } from "../types/database.js";

export interface CacheManager {
  // Initialization and configuration
  initialize(config: CacheConfig): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;

  // Basic cache operations
  set(key: string, value: any, ttl?: number): Promise<void>;
  get<T = any>(key: string): Promise<T | null>;
  delete(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
  expire(key: string, ttl: number): Promise<boolean>;

  // Batch operations
  mset(entries: Record<string, any>, ttl?: number): Promise<void>;
  mget<T = any>(keys: string[]): Promise<(T | null)[]>;
  mdel(keys: string[]): Promise<number>;

  // Pattern operations
  keys(pattern: string): Promise<string[]>;
  deleteByPattern(pattern: string): Promise<number>;

  // Hash operations (for structured data)
  hset(key: string, field: string, value: any): Promise<void>;
  hget<T = any>(key: string, field: string): Promise<T | null>;
  hgetall<T = any>(key: string): Promise<Record<string, T>>;
  hdel(key: string, field: string): Promise<boolean>;
  hkeys(key: string): Promise<string[]>;

  // List operations (for queues/logs)
  lpush(key: string, ...values: any[]): Promise<number>;
  rpush(key: string, ...values: any[]): Promise<number>;
  lpop<T = any>(key: string): Promise<T | null>;
  rpop<T = any>(key: string): Promise<T | null>;
  llen(key: string): Promise<number>;
  lrange<T = any>(key: string, start: number, stop: number): Promise<T[]>;

  // Set operations (for tags/categories)
  sadd(key: string, ...members: string[]): Promise<number>;
  srem(key: string, ...members: string[]): Promise<number>;
  smembers(key: string): Promise<string[]>;
  sismember(key: string, member: string): Promise<boolean>;

  // Tagged cache operations
  setWithTags(
    key: string,
    value: any,
    tags: string[],
    ttl?: number
  ): Promise<void>;
  deleteByTag(tag: string): Promise<number>;
  getByTag(tag: string): Promise<string[]>;

  // Cache statistics and maintenance
  flushAll(): Promise<void>;
  getStats(): Promise<{
    keyCount: number;
    memoryUsage: number;
    hitRate: number;
    missRate: number;
  }>;

  // Health check
  ping(): Promise<boolean>;
}
