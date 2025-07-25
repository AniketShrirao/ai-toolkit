import { createClient, RedisClientType } from "redis";
import { CacheManager } from "./interfaces/CacheManager.js";
import { CacheConfig } from "./types/database.js";

export class RedisCacheManager implements CacheManager {
  private client?: RedisClientType;
  private config?: CacheConfig;
  private connected = false;
  private stats = {
    hits: 0,
    misses: 0,
  };

  async initialize(config: CacheConfig): Promise<void> {
    this.config = config;

    this.client = createClient({
      socket: {
        host: config.host,
        port: config.port,
      },
      password: config.password,
      database: config.database,
    });

    this.client.on("error", (err) => {
      console.error("Redis Client Error:", err);
      this.connected = false;
    });

    this.client.on("connect", () => {
      this.connected = true;
    });

    this.client.on("disconnect", () => {
      this.connected = false;
    });

    await this.client.connect();
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.connected = false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  // Basic cache operations
  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.client) throw new Error("Cache not initialized");

    const fullKey = this.getFullKey(key);
    const serializedValue = JSON.stringify(value);

    if (ttl !== undefined && ttl > 0) {
      await this.client.setEx(fullKey, ttl, serializedValue);
    } else if (ttl === undefined && this.config?.defaultTTL) {
      await this.client.setEx(fullKey, this.config.defaultTTL, serializedValue);
    } else {
      await this.client.set(fullKey, serializedValue);
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    if (!this.client) throw new Error("Cache not initialized");

    const fullKey = this.getFullKey(key);
    const value = await this.client.get(fullKey);

    if (value === null) {
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.warn(`Failed to parse cached value for key ${key}:`, error);
      return null;
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.client) throw new Error("Cache not initialized");

    const fullKey = this.getFullKey(key);
    const result = await this.client.del(fullKey);
    return result > 0;
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client) throw new Error("Cache not initialized");

    const fullKey = this.getFullKey(key);
    const result = await this.client.exists(fullKey);
    return result > 0;
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    if (!this.client) throw new Error("Cache not initialized");

    const fullKey = this.getFullKey(key);
    const result = await this.client.expire(fullKey, ttl);
    return result;
  }

  // Batch operations
  async mset(entries: Record<string, any>, ttl?: number): Promise<void> {
    if (!this.client) throw new Error("Cache not initialized");

    const pipeline = this.client.multi();

    for (const [key, value] of Object.entries(entries)) {
      const fullKey = this.getFullKey(key);
      const serializedValue = JSON.stringify(value);

      if (ttl || this.config?.defaultTTL) {
        pipeline.setEx(
          fullKey,
          ttl || this.config!.defaultTTL,
          serializedValue
        );
      } else {
        pipeline.set(fullKey, serializedValue);
      }
    }

    await pipeline.exec();
  }

  async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
    if (!this.client) throw new Error("Cache not initialized");

    const fullKeys = keys.map((key) => this.getFullKey(key));
    const values = await this.client.mGet(fullKeys);

    return values.map((value, index) => {
      if (value === null) {
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;
      try {
        return JSON.parse(value) as T;
      } catch (error) {
        console.warn(
          `Failed to parse cached value for key ${keys[index]}:`,
          error
        );
        return null;
      }
    });
  }

  async mdel(keys: string[]): Promise<number> {
    if (!this.client) throw new Error("Cache not initialized");

    const fullKeys = keys.map((key) => this.getFullKey(key));
    return await this.client.del(fullKeys);
  }

  // Pattern operations
  async keys(pattern: string): Promise<string[]> {
    if (!this.client) throw new Error("Cache not initialized");

    const fullPattern = this.getFullKey(pattern);
    const keys = await this.client.keys(fullPattern);

    // Remove prefix from returned keys
    const prefixLength = this.config!.keyPrefix.length;
    return keys.map((key) => key.substring(prefixLength));
  }

  async deleteByPattern(pattern: string): Promise<number> {
    if (!this.client) throw new Error("Cache not initialized");

    const keys = await this.keys(pattern);
    if (keys.length === 0) return 0;

    return await this.mdel(keys);
  }

  // Hash operations
  async hset(key: string, field: string, value: any): Promise<void> {
    if (!this.client) throw new Error("Cache not initialized");

    const fullKey = this.getFullKey(key);
    const serializedValue = JSON.stringify(value);
    await this.client.hSet(fullKey, field, serializedValue);
  }

  async hget<T = any>(key: string, field: string): Promise<T | null> {
    if (!this.client) throw new Error("Cache not initialized");

    const fullKey = this.getFullKey(key);
    const value = await this.client.hGet(fullKey, field);

    if (value === undefined) {
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.warn(
        `Failed to parse cached hash value for key ${key}, field ${field}:`,
        error
      );
      return null;
    }
  }

  async hgetall<T = any>(key: string): Promise<Record<string, T>> {
    if (!this.client) throw new Error("Cache not initialized");

    const fullKey = this.getFullKey(key);
    const hash = await this.client.hGetAll(fullKey);

    const result: Record<string, T> = {};
    for (const [field, value] of Object.entries(hash)) {
      try {
        result[field] = JSON.parse(value) as T;
      } catch (error) {
        console.warn(
          `Failed to parse cached hash value for key ${key}, field ${field}:`,
          error
        );
      }
    }

    return result;
  }

  async hdel(key: string, field: string): Promise<boolean> {
    if (!this.client) throw new Error("Cache not initialized");

    const fullKey = this.getFullKey(key);
    const result = await this.client.hDel(fullKey, field);
    return result > 0;
  }

  async hkeys(key: string): Promise<string[]> {
    if (!this.client) throw new Error("Cache not initialized");

    const fullKey = this.getFullKey(key);
    return await this.client.hKeys(fullKey);
  }

  // List operations
  async lpush(key: string, ...values: any[]): Promise<number> {
    if (!this.client) throw new Error("Cache not initialized");

    const fullKey = this.getFullKey(key);
    const serializedValues = values.map((value) => JSON.stringify(value));
    return await this.client.lPush(fullKey, serializedValues);
  }

  async rpush(key: string, ...values: any[]): Promise<number> {
    if (!this.client) throw new Error("Cache not initialized");

    const fullKey = this.getFullKey(key);
    const serializedValues = values.map((value) => JSON.stringify(value));
    return await this.client.rPush(fullKey, serializedValues);
  }

  async lpop<T = any>(key: string): Promise<T | null> {
    if (!this.client) throw new Error("Cache not initialized");

    const fullKey = this.getFullKey(key);
    const value = await this.client.lPop(fullKey);

    if (value === null) return null;

    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.warn(`Failed to parse popped value from list ${key}:`, error);
      return null;
    }
  }

  async rpop<T = any>(key: string): Promise<T | null> {
    if (!this.client) throw new Error("Cache not initialized");

    const fullKey = this.getFullKey(key);
    const value = await this.client.rPop(fullKey);

    if (value === null) return null;

    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.warn(`Failed to parse popped value from list ${key}:`, error);
      return null;
    }
  }

  async llen(key: string): Promise<number> {
    if (!this.client) throw new Error("Cache not initialized");

    const fullKey = this.getFullKey(key);
    return await this.client.lLen(fullKey);
  }

  async lrange<T = any>(
    key: string,
    start: number,
    stop: number
  ): Promise<T[]> {
    if (!this.client) throw new Error("Cache not initialized");

    const fullKey = this.getFullKey(key);
    const values = await this.client.lRange(fullKey, start, stop);

    return values
      .map((value, index) => {
        try {
          return JSON.parse(value) as T;
        } catch (error) {
          console.warn(
            `Failed to parse list value at index ${index} for key ${key}:`,
            error
          );
          return null as T;
        }
      })
      .filter((value) => value !== null);
  }

  // Set operations
  async sadd(key: string, ...members: string[]): Promise<number> {
    if (!this.client) throw new Error("Cache not initialized");

    const fullKey = this.getFullKey(key);
    return await this.client.sAdd(fullKey, members);
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    if (!this.client) throw new Error("Cache not initialized");

    const fullKey = this.getFullKey(key);
    return await this.client.sRem(fullKey, members);
  }

  async smembers(key: string): Promise<string[]> {
    if (!this.client) throw new Error("Cache not initialized");

    const fullKey = this.getFullKey(key);
    return await this.client.sMembers(fullKey);
  }

  async sismember(key: string, member: string): Promise<boolean> {
    if (!this.client) throw new Error("Cache not initialized");

    const fullKey = this.getFullKey(key);
    return await this.client.sIsMember(fullKey, member);
  }

  // Tagged cache operations
  async setWithTags(
    key: string,
    value: any,
    tags: string[],
    ttl?: number
  ): Promise<void> {
    if (!this.client) throw new Error("Cache not initialized");

    // Set the main value
    await this.set(key, value, ttl);

    // Add key to each tag set
    const pipeline = this.client.multi();
    for (const tag of tags) {
      const tagKey = this.getTagKey(tag);
      pipeline.sAdd(tagKey, key);

      // Set TTL for tag set if specified
      if (ttl || this.config?.defaultTTL) {
        pipeline.expire(tagKey, ttl || this.config!.defaultTTL);
      }
    }

    await pipeline.exec();
  }

  async deleteByTag(tag: string): Promise<number> {
    if (!this.client) throw new Error("Cache not initialized");

    const tagKey = this.getTagKey(tag);
    const keys = await this.client.sMembers(tagKey);

    if (keys.length === 0) return 0;

    // Delete all keys associated with the tag
    const deletedCount = await this.mdel(keys);

    // Delete the tag set itself
    await this.client.del(tagKey);

    return deletedCount;
  }

  async getByTag(tag: string): Promise<string[]> {
    if (!this.client) throw new Error("Cache not initialized");

    const tagKey = this.getTagKey(tag);
    return await this.client.sMembers(tagKey);
  }

  // Cache statistics and maintenance
  async flushAll(): Promise<void> {
    if (!this.client) throw new Error("Cache not initialized");

    await this.client.flushDb();
    this.stats.hits = 0;
    this.stats.misses = 0;
  }

  async getStats(): Promise<{
    keyCount: number;
    memoryUsage: number;
    hitRate: number;
    missRate: number;
  }> {
    if (!this.client) throw new Error("Cache not initialized");

    const info = await this.client.info("memory");
    const keyCount = await this.client.dbSize();

    // Parse memory usage from info string
    const memoryMatch = info.match(/used_memory:(\d+)/);
    const memoryUsage = memoryMatch ? parseInt(memoryMatch[1]) : 0;

    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;
    const missRate = totalRequests > 0 ? this.stats.misses / totalRequests : 0;

    return {
      keyCount,
      memoryUsage,
      hitRate,
      missRate,
    };
  }

  // Health check
  async ping(): Promise<boolean> {
    if (!this.client) return false;

    try {
      const result = await this.client.ping();
      return result === "PONG";
    } catch (error) {
      return false;
    }
  }

  // Helper methods
  private getFullKey(key: string): string {
    return `${this.config!.keyPrefix}${key}`;
  }

  private getTagKey(tag: string): string {
    return this.getFullKey(`tag:${tag}`);
  }
}
