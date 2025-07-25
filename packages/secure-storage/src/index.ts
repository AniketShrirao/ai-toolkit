// Main exports
export { SecureStorageManagerImpl } from "./SecureStorageManagerImpl.js";
export type { SecureStorageManager } from "./interfaces/SecureStorageManager.js";

// Types and interfaces
export * from "./types/storage.js";

// Import for factory function
import { SecureStorageManagerImpl } from "./SecureStorageManagerImpl.js";

// Factory function for easy instantiation
export function createSecureStorageManager(): SecureStorageManagerImpl {
  return new SecureStorageManagerImpl();
}
