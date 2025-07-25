// Main exports
export { JSONDatabaseManager } from "./JSONDatabaseManager.js";
export { RedisCacheManager } from "./RedisCacheManager.js";

// Import for factory functions
import { JSONDatabaseManager } from "./JSONDatabaseManager.js";
import { RedisCacheManager } from "./RedisCacheManager.js";

// Interfaces
export type { DatabaseManager } from "./interfaces/DatabaseManager.js";
export type { CacheManager } from "./interfaces/CacheManager.js";

// Types
export * from "./types/database.js";

// Factory functions
export function createDatabaseManager(): JSONDatabaseManager {
  return new JSONDatabaseManager();
}

export function createCacheManager(): RedisCacheManager {
  return new RedisCacheManager();
}

// Combined data layer manager
export class DataLayerManager {
  private databaseManager?: JSONDatabaseManager;
  private cacheManager?: RedisCacheManager;

  async initializeDatabase(
    config: import("./types/database.js").DatabaseConfig
  ): Promise<void> {
    this.databaseManager = new JSONDatabaseManager();
    await this.databaseManager.initialize(config);
  }

  async initializeCache(
    config: import("./types/database.js").CacheConfig
  ): Promise<void> {
    this.cacheManager = new RedisCacheManager();
    await this.cacheManager.initialize(config);
  }

  getDatabase(): JSONDatabaseManager {
    if (!this.databaseManager) {
      throw new Error("Database not initialized");
    }
    return this.databaseManager;
  }

  getCache(): RedisCacheManager {
    if (!this.cacheManager) {
      throw new Error("Cache not initialized");
    }
    return this.cacheManager;
  }

  async close(): Promise<void> {
    if (this.databaseManager) {
      await this.databaseManager.close();
    }
    if (this.cacheManager) {
      await this.cacheManager.disconnect();
    }
  }
}
