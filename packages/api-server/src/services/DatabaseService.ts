import { JSONDatabaseManager } from "@ai-toolkit/data-layer";

class DatabaseService {
  private static instance: JSONDatabaseManager | null = null;
  private static initialized = false;

  static async getInstance(): Promise<JSONDatabaseManager> {
    if (!this.instance) {
      this.instance = new JSONDatabaseManager();
    }

    if (!this.initialized) {
      await this.instance.initialize({
        databasePath: "./data/ai-toolkit.db",
        enableWAL: true,
        enableForeignKeys: true,
        busyTimeout: 5000,
        maxConnections: 10,
      });
      this.initialized = true;
    }

    return this.instance;
  }

  static async close(): Promise<void> {
    if (this.instance) {
      await this.instance.close();
      this.instance = null;
      this.initialized = false;
    }
  }
}

export { DatabaseService };