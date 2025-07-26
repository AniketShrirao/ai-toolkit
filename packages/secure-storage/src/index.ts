// Main exports
export { SecureStorageManagerImpl } from "./SecureStorageManagerImpl.js";
export { ApiKeyManagerImpl } from "./ApiKeyManagerImpl.js";
export type { SecureStorageManager } from "./interfaces/SecureStorageManager.js";
export type { ApiKeyManager, ApiKeyConfig, ApiKeyValidationResult } from "./interfaces/ApiKeyManager.js";

// Types and interfaces
export * from "./types/storage.js";

// Import for factory functions
import { SecureStorageManagerImpl } from "./SecureStorageManagerImpl.js";
import { ApiKeyManagerImpl } from "./ApiKeyManagerImpl.js";

// Factory functions for easy instantiation
export function createSecureStorageManager(): SecureStorageManagerImpl {
  return new SecureStorageManagerImpl();
}

export function createApiKeyManager(secureStorage?: SecureStorageManagerImpl): ApiKeyManagerImpl {
  return new ApiKeyManagerImpl(secureStorage);
}
