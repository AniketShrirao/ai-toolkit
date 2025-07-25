import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestHelpers } from '../utils/TestHelpers';

describe('Example Unit Test', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  it('should demonstrate basic testing', () => {
    const result = 2 + 2;
    expect(result).toBe(4);
  });

  it('should test async operations', async () => {
    const result = await Promise.resolve('test');
    expect(result).toBe('test');
  });

  it('should test error handling', async () => {
    const errorFn = async () => {
      throw new Error('Test error');
    };

    await expect(errorFn()).rejects.toThrow('Test error');
  });

  it('should test with timeout', async () => {
    const slowOperation = async () => {
      await TestHelpers.sleep(100);
      return 'completed';
    };

    const result = await TestHelpers.withTimeout(slowOperation(), 200);
    expect(result).toBe('completed');
  });

  it('should test performance', async () => {
    const performanceTest = TestHelpers.createPerformanceTest(
      'example-operation',
      async () => {
        // Simulate some work
        await TestHelpers.sleep(10);
      },
      { maxDuration: 50 }
    );

    const metrics = await performanceTest();
    expect(metrics.duration).toBeLessThan(50);
  });
});