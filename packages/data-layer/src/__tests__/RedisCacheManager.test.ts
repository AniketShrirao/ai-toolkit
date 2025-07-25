import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { RedisCacheManager } from "../RedisCacheManager.js";
import { CacheConfig } from "../types/database.js";

// Mock Redis client for testing
const mockRedisClient = {
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn().mockResolvedValue(undefined),
  on: vi.fn(),
  set: vi.fn().mockResolvedValue("OK"),
  setEx: vi.fn().mockResolvedValue("OK"),
  get: vi.fn().mockResolvedValue(null),
  del: vi.fn().mockResolvedValue(1),
  exists: vi.fn().mockResolvedValue(1),
  expire: vi.fn().mockResolvedValue(true),
  mGet: vi.fn().mockResolvedValue([]),
  keys: vi.fn().mockResolvedValue([]),
  hSet: vi.fn().mockResolvedValue(1),
  hGet: vi.fn().mockResolvedValue(undefined),
  hGetAll: vi.fn().mockResolvedValue({}),
  hDel: vi.fn().mockResolvedValue(1),
  hKeys: vi.fn().mockResolvedValue([]),
  lPush: vi.fn().mockResolvedValue(1),
  rPush: vi.fn().mockResolvedValue(1),
  lPop: vi.fn().mockResolvedValue(null),
  rPop: vi.fn().mockResolvedValue(null),
  lLen: vi.fn().mockResolvedValue(0),
  lRange: vi.fn().mockResolvedValue([]),
  sAdd: vi.fn().mockResolvedValue(1),
  sRem: vi.fn().mockResolvedValue(1),
  sMembers: vi.fn().mockResolvedValue([]),
  sIsMember: vi.fn().mockResolvedValue(false),
  flushDb: vi.fn().mockResolvedValue("OK"),
  info: vi.fn().mockResolvedValue("used_memory:1024"),
  dbSize: vi.fn().mockResolvedValue(0),
  ping: vi.fn().mockResolvedValue("PONG"),
  multi: vi.fn().mockReturnValue({
    set: vi.fn().mockReturnThis(),
    setEx: vi.fn().mockReturnThis(),
    sAdd: vi.fn().mockReturnThis(),
    expire: vi.fn().mockReturnThis(),
    exec: vi.fn().mockResolvedValue([]),
  }),
};

// Mock the redis module
vi.mock("redis", () => ({
  createClient: vi.fn(() => mockRedisClient),
}));

describe("RedisCacheManager", () => {
  let cacheManager: RedisCacheManager;
  let config: CacheConfig;

  beforeEach(async () => {
    config = {
      host: "localhost",
      port: 6379,
      database: 0,
      keyPrefix: "test:",
      defaultTTL: 3600,
    };

    cacheManager = new RedisCacheManager();

    // Reset all mocks
    vi.clearAllMocks();

    // Mock successful connection
    mockRedisClient.on.mockImplementation((event, callback) => {
      if (event === "connect") {
        // Simulate immediate connection
        process.nextTick(() => callback());
      }
    });

    await cacheManager.initialize(config);

    // Wait for connection event to be processed
    await new Promise((resolve) => process.nextTick(resolve));
  });

  afterEach(async () => {
    await cacheManager.disconnect();
  });

  describe("Initialization", () => {
    it("should initialize with correct configuration", () => {
      expect(cacheManager.isConnected()).toBe(true);
    });

    it("should handle connection events", async () => {
      expect(mockRedisClient.on).toHaveBeenCalledWith(
        "error",
        expect.any(Function)
      );
      expect(mockRedisClient.on).toHaveBeenCalledWith(
        "connect",
        expect.any(Function)
      );
      expect(mockRedisClient.on).toHaveBeenCalledWith(
        "disconnect",
        expect.any(Function)
      );
    });
  });

  describe("Basic Cache Operations", () => {
    it("should set and get a value", async () => {
      const testValue = { test: "data" };
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(testValue));

      await cacheManager.set("test-key", testValue);
      const result = await cacheManager.get("test-key");

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        "test:test-key",
        3600,
        JSON.stringify(testValue)
      );
      expect(result).toEqual(testValue);
    });

    it("should set value without TTL", async () => {
      const testValue = "simple string";

      await cacheManager.set("no-ttl-key", testValue, 0);

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        "test:no-ttl-key",
        JSON.stringify(testValue)
      );
    });

    it("should return null for non-existent key", async () => {
      mockRedisClient.get.mockResolvedValueOnce(null);

      const result = await cacheManager.get("non-existent");
      expect(result).toBeNull();
    });

    it("should delete a key", async () => {
      mockRedisClient.del.mockResolvedValueOnce(1);

      const result = await cacheManager.delete("test-key");

      expect(mockRedisClient.del).toHaveBeenCalledWith("test:test-key");
      expect(result).toBe(true);
    });

    it("should check if key exists", async () => {
      mockRedisClient.exists.mockResolvedValueOnce(1);

      const result = await cacheManager.exists("test-key");

      expect(mockRedisClient.exists).toHaveBeenCalledWith("test:test-key");
      expect(result).toBe(true);
    });

    it("should set expiration on key", async () => {
      mockRedisClient.expire.mockResolvedValueOnce(true);

      const result = await cacheManager.expire("test-key", 1800);

      expect(mockRedisClient.expire).toHaveBeenCalledWith(
        "test:test-key",
        1800
      );
      expect(result).toBe(true);
    });
  });

  describe("Batch Operations", () => {
    it("should set multiple values", async () => {
      const entries = {
        key1: "value1",
        key2: "value2",
      };

      await cacheManager.mset(entries, 1800);

      expect(mockRedisClient.multi).toHaveBeenCalled();
    });

    it("should get multiple values", async () => {
      const keys = ["key1", "key2"];
      const values = [JSON.stringify("value1"), JSON.stringify("value2")];
      mockRedisClient.mGet.mockResolvedValueOnce(values);

      const result = await cacheManager.mget(keys);

      expect(mockRedisClient.mGet).toHaveBeenCalledWith([
        "test:key1",
        "test:key2",
      ]);
      expect(result).toEqual(["value1", "value2"]);
    });

    it("should delete multiple keys", async () => {
      const keys = ["key1", "key2"];
      mockRedisClient.del.mockResolvedValueOnce(2);

      const result = await cacheManager.mdel(keys);

      expect(mockRedisClient.del).toHaveBeenCalledWith([
        "test:key1",
        "test:key2",
      ]);
      expect(result).toBe(2);
    });
  });

  describe("Pattern Operations", () => {
    it("should find keys by pattern", async () => {
      const keys = ["test:user:1", "test:user:2"];
      mockRedisClient.keys.mockResolvedValueOnce(keys);

      const result = await cacheManager.keys("user:*");

      expect(mockRedisClient.keys).toHaveBeenCalledWith("test:user:*");
      expect(result).toEqual(["user:1", "user:2"]);
    });

    it("should delete keys by pattern", async () => {
      const keys = ["user:1", "user:2"];
      mockRedisClient.keys.mockResolvedValueOnce([
        "test:user:1",
        "test:user:2",
      ]);
      mockRedisClient.del.mockResolvedValueOnce(2);

      const result = await cacheManager.deleteByPattern("user:*");

      expect(result).toBe(2);
    });
  });

  describe("Hash Operations", () => {
    it("should set and get hash field", async () => {
      const testValue = { nested: "data" };
      mockRedisClient.hGet.mockResolvedValueOnce(JSON.stringify(testValue));

      await cacheManager.hset("hash-key", "field1", testValue);
      const result = await cacheManager.hget("hash-key", "field1");

      expect(mockRedisClient.hSet).toHaveBeenCalledWith(
        "test:hash-key",
        "field1",
        JSON.stringify(testValue)
      );
      expect(result).toEqual(testValue);
    });

    it("should get all hash fields", async () => {
      const hashData = {
        field1: JSON.stringify("value1"),
        field2: JSON.stringify("value2"),
      };
      mockRedisClient.hGetAll.mockResolvedValueOnce(hashData);

      const result = await cacheManager.hgetall("hash-key");

      expect(result).toEqual({
        field1: "value1",
        field2: "value2",
      });
    });

    it("should delete hash field", async () => {
      mockRedisClient.hDel.mockResolvedValueOnce(1);

      const result = await cacheManager.hdel("hash-key", "field1");

      expect(mockRedisClient.hDel).toHaveBeenCalledWith(
        "test:hash-key",
        "field1"
      );
      expect(result).toBe(true);
    });

    it("should get hash keys", async () => {
      const keys = ["field1", "field2"];
      mockRedisClient.hKeys.mockResolvedValueOnce(keys);

      const result = await cacheManager.hkeys("hash-key");

      expect(mockRedisClient.hKeys).toHaveBeenCalledWith("test:hash-key");
      expect(result).toEqual(keys);
    });
  });

  describe("List Operations", () => {
    it("should push to left of list", async () => {
      mockRedisClient.lPush.mockResolvedValueOnce(2);

      const result = await cacheManager.lpush("list-key", "item1", "item2");

      expect(mockRedisClient.lPush).toHaveBeenCalledWith("test:list-key", [
        JSON.stringify("item1"),
        JSON.stringify("item2"),
      ]);
      expect(result).toBe(2);
    });

    it("should push to right of list", async () => {
      mockRedisClient.rPush.mockResolvedValueOnce(2);

      const result = await cacheManager.rpush("list-key", "item1", "item2");

      expect(mockRedisClient.rPush).toHaveBeenCalledWith("test:list-key", [
        JSON.stringify("item1"),
        JSON.stringify("item2"),
      ]);
      expect(result).toBe(2);
    });

    it("should pop from left of list", async () => {
      mockRedisClient.lPop.mockResolvedValueOnce(JSON.stringify("item1"));

      const result = await cacheManager.lpop("list-key");

      expect(mockRedisClient.lPop).toHaveBeenCalledWith("test:list-key");
      expect(result).toBe("item1");
    });

    it("should get list length", async () => {
      mockRedisClient.lLen.mockResolvedValueOnce(5);

      const result = await cacheManager.llen("list-key");

      expect(mockRedisClient.lLen).toHaveBeenCalledWith("test:list-key");
      expect(result).toBe(5);
    });

    it("should get list range", async () => {
      const items = [JSON.stringify("item1"), JSON.stringify("item2")];
      mockRedisClient.lRange.mockResolvedValueOnce(items);

      const result = await cacheManager.lrange("list-key", 0, -1);

      expect(mockRedisClient.lRange).toHaveBeenCalledWith(
        "test:list-key",
        0,
        -1
      );
      expect(result).toEqual(["item1", "item2"]);
    });
  });

  describe("Set Operations", () => {
    it("should add members to set", async () => {
      mockRedisClient.sAdd.mockResolvedValueOnce(2);

      const result = await cacheManager.sadd("set-key", "member1", "member2");

      expect(mockRedisClient.sAdd).toHaveBeenCalledWith("test:set-key", [
        "member1",
        "member2",
      ]);
      expect(result).toBe(2);
    });

    it("should remove members from set", async () => {
      mockRedisClient.sRem.mockResolvedValueOnce(1);

      const result = await cacheManager.srem("set-key", "member1");

      expect(mockRedisClient.sRem).toHaveBeenCalledWith("test:set-key", [
        "member1",
      ]);
      expect(result).toBe(1);
    });

    it("should get set members", async () => {
      const members = ["member1", "member2"];
      mockRedisClient.sMembers.mockResolvedValueOnce(members);

      const result = await cacheManager.smembers("set-key");

      expect(mockRedisClient.sMembers).toHaveBeenCalledWith("test:set-key");
      expect(result).toEqual(members);
    });

    it("should check set membership", async () => {
      mockRedisClient.sIsMember.mockResolvedValueOnce(true);

      const result = await cacheManager.sismember("set-key", "member1");

      expect(mockRedisClient.sIsMember).toHaveBeenCalledWith(
        "test:set-key",
        "member1"
      );
      expect(result).toBe(true);
    });
  });

  describe("Tagged Cache Operations", () => {
    it("should set value with tags", async () => {
      const testValue = { tagged: "data" };
      const tags = ["tag1", "tag2"];

      await cacheManager.setWithTags("tagged-key", testValue, tags, 1800);

      expect(mockRedisClient.multi).toHaveBeenCalled();
    });

    it("should get keys by tag", async () => {
      const keys = ["key1", "key2"];
      mockRedisClient.sMembers.mockResolvedValueOnce(keys);

      const result = await cacheManager.getByTag("tag1");

      expect(mockRedisClient.sMembers).toHaveBeenCalledWith("test:tag:tag1");
      expect(result).toEqual(keys);
    });

    it("should delete by tag", async () => {
      const keys = ["key1", "key2"];
      mockRedisClient.sMembers.mockResolvedValueOnce(keys);
      mockRedisClient.del.mockResolvedValueOnce(2);

      const result = await cacheManager.deleteByTag("tag1");

      expect(result).toBe(2);
    });
  });

  describe("Statistics and Maintenance", () => {
    it("should get cache statistics", async () => {
      mockRedisClient.info.mockResolvedValueOnce("used_memory:2048");
      mockRedisClient.dbSize.mockResolvedValueOnce(10);

      const stats = await cacheManager.getStats();

      expect(stats.keyCount).toBe(10);
      expect(stats.memoryUsage).toBe(2048);
      expect(stats.hitRate).toBeGreaterThanOrEqual(0);
      expect(stats.missRate).toBeGreaterThanOrEqual(0);
    });

    it("should flush all keys", async () => {
      await cacheManager.flushAll();

      expect(mockRedisClient.flushDb).toHaveBeenCalled();
    });

    it("should ping successfully", async () => {
      mockRedisClient.ping.mockResolvedValueOnce("PONG");

      const result = await cacheManager.ping();

      expect(result).toBe(true);
    });

    it("should handle ping failure", async () => {
      mockRedisClient.ping.mockRejectedValueOnce(
        new Error("Connection failed")
      );

      const result = await cacheManager.ping();

      expect(result).toBe(false);
    });
  });

  describe("Error Handling", () => {
    it("should handle JSON parse errors gracefully", async () => {
      mockRedisClient.get.mockResolvedValueOnce("invalid-json");

      const result = await cacheManager.get("bad-json-key");

      expect(result).toBeNull();
    });

    it("should throw error when not initialized", async () => {
      const uninitializedManager = new RedisCacheManager();

      await expect(uninitializedManager.set("key", "value")).rejects.toThrow(
        "Cache not initialized"
      );
    });
  });
});
