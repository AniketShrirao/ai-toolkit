import { faker } from '@faker-js/faker';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { vi, expect } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface TestTimeout {
  timeout: number;
  cleanup?: () => Promise<void>;
}

export class TestHelpers {
  static async waitFor(
    condition: () => boolean | Promise<boolean>,
    options: { timeout?: number; interval?: number } = {}
  ): Promise<void> {
    const { timeout = 5000, interval = 100 } = options;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const result = await condition();
      if (result) {
        return;
      }
      await this.sleep(interval);
    }

    throw new Error(`Condition not met within ${timeout}ms`);
  }

  static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    errorMessage?: string
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(errorMessage || `Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  static createTempFile(content: string, extension = '.txt'): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const tempDir = path.join(__dirname, '../temp');
        await fs.mkdir(tempDir, { recursive: true });
        
        const fileName = `test-${faker.string.uuid()}${extension}`;
        const filePath = path.join(tempDir, fileName);
        
        await fs.writeFile(filePath, content);
        resolve(filePath);
      } catch (error) {
        reject(error);
      }
    });
  }

  static async cleanupTempFiles(): Promise<void> {
    try {
      const tempDir = path.join(__dirname, '../temp');
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }

  static generateRandomString(length: number): string {
    return faker.string.alpha(length);
  }

  static generateRandomNumber(min: number, max: number): number {
    return faker.number.int({ min, max });
  }

  static generateRandomEmail(): string {
    return faker.internet.email();
  }

  static generateRandomUrl(): string {
    return faker.internet.url();
  }

  static generateRandomDate(start?: Date, end?: Date): Date {
    return faker.date.between(start || new Date('2020-01-01'), end || new Date());
  }

  static async measureExecutionTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const startTime = process.hrtime.bigint();
    const result = await fn();
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

    return { result, duration };
  }

  static async measureMemoryUsage<T>(fn: () => Promise<T>): Promise<{ result: T; memoryUsage: NodeJS.MemoryUsage }> {
    const initialMemory = process.memoryUsage();
    const result = await fn();
    const finalMemory = process.memoryUsage();

    const memoryUsage: NodeJS.MemoryUsage = {
      rss: finalMemory.rss - initialMemory.rss,
      heapTotal: finalMemory.heapTotal - initialMemory.heapTotal,
      heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
      external: finalMemory.external - initialMemory.external,
      arrayBuffers: finalMemory.arrayBuffers - initialMemory.arrayBuffers,
    };

    return { result, memoryUsage };
  }

  static createMockFunction<T extends (...args: any[]) => any>(
    implementation?: T
  ) {
    return implementation ? vi.fn(implementation) : vi.fn();
  }

  static async retryOperation<T>(
    operation: () => Promise<T>,
    options: { maxRetries?: number; delay?: number; backoff?: boolean } = {}
  ): Promise<T> {
    const { maxRetries = 3, delay = 1000, backoff = true } = options;
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          break;
        }

        const waitTime = backoff ? delay * Math.pow(2, attempt) : delay;
        await this.sleep(waitTime);
      }
    }

    throw lastError!;
  }

  static deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  static compareObjects(obj1: any, obj2: any): boolean {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  }

  static async captureConsoleOutput<T>(fn: () => Promise<T>): Promise<{ result: T; output: string[] }> {
    const originalLog = console.log;
    const output: string[] = [];

    console.log = (...args: any[]) => {
      output.push(args.map(arg => String(arg)).join(' '));
    };

    try {
      const result = await fn();
      return { result, output };
    } finally {
      console.log = originalLog;
    }
  }

  static createTestError(message: string, code?: string): Error {
    const error = new Error(message);
    if (code) {
      (error as any).code = code;
    }
    return error;
  }

  static async expectToThrow<T>(
    fn: () => Promise<T>,
    expectedError?: string | RegExp | Error
  ): Promise<Error> {
    try {
      await fn();
      throw new Error('Expected function to throw, but it did not');
    } catch (error) {
      if (expectedError) {
        if (typeof expectedError === 'string') {
          expect((error as Error).message).toContain(expectedError);
        } else if (expectedError instanceof RegExp) {
          expect((error as Error).message).toMatch(expectedError);
        } else if (expectedError instanceof Error) {
          expect((error as Error).message).toBe(expectedError.message);
        }
      }
      return error as Error;
    }
  }

  static createPerformanceTest(
    name: string,
    fn: () => Promise<void>,
    options: { maxDuration?: number; maxMemory?: number } = {}
  ) {
    return async () => {
      const { maxDuration = 5000, maxMemory = 100 * 1024 * 1024 } = options; // 100MB default

      const { result, duration } = await TestHelpers.measureExecutionTime(async () => {
        return await TestHelpers.measureMemoryUsage(fn);
      });

      // Check performance constraints
      if (duration > maxDuration) {
        throw new Error(`Performance test "${name}" exceeded maximum duration: ${duration}ms > ${maxDuration}ms`);
      }

      if (result.memoryUsage.heapUsed > maxMemory) {
        throw new Error(`Performance test "${name}" exceeded maximum memory usage: ${result.memoryUsage.heapUsed} > ${maxMemory}`);
      }

      return {
        duration,
        memoryUsage: result.memoryUsage,
      };
    };
  }

  static async runConcurrently<T>(
    operations: (() => Promise<T>)[],
    options: { maxConcurrency?: number } = {}
  ): Promise<T[]> {
    const { maxConcurrency = 10 } = options;
    const results: T[] = [];
    
    for (let i = 0; i < operations.length; i += maxConcurrency) {
      const batch = operations.slice(i, i + maxConcurrency);
      const batchResults = await Promise.all(batch.map(op => op()));
      results.push(...batchResults);
    }

    return results;
  }
}