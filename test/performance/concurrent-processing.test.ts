import { describe, it, expect, beforeAll } from 'vitest';
import { PerformanceTestRunner } from '../utils/PerformanceTestRunner';
import { TestHelpers } from '../utils/TestHelpers';

describe('Performance Tests - Concurrent Processing', () => {
  let performanceRunner: PerformanceTestRunner;

  beforeAll(() => {
    performanceRunner = new PerformanceTestRunner();
  });

  it('should handle single document processing within performance limits', async () => {
    const mockDocumentProcessing = async () => {
      // Simulate document processing
      await TestHelpers.sleep(100);
      
      // Simulate memory usage
      const data = new Array(1000).fill('test data');
      
      return {
        processed: true,
        dataSize: data.length,
      };
    };

    const result = await performanceRunner.runTest(mockDocumentProcessing, {
      name: 'Single Document Processing',
      iterations: 10,
      maxDuration: 200, // 200ms max per operation
      maxMemoryUsage: 50 * 1024 * 1024, // 50MB max
    });

    expect(result.passed).toBe(true);
    expect(result.metrics.duration).toBeLessThan(200);
    expect(result.metrics.errorRate).toBe(0);
  });

  it('should handle concurrent document processing', async () => {
    const mockConcurrentProcessing = async () => {
      // Simulate concurrent processing of multiple documents
      const operations = Array.from({ length: 5 }, (_, i) => async () => {
        await TestHelpers.sleep(50 + Math.random() * 50); // 50-100ms processing time
        return { documentId: i, processed: true };
      });

      const results = await TestHelpers.runConcurrently(operations, { maxConcurrency: 3 });
      return results;
    };

    const result = await performanceRunner.runTest(mockConcurrentProcessing, {
      name: 'Concurrent Document Processing',
      iterations: 5,
      maxDuration: 500, // 500ms max for processing 5 documents
      maxMemoryUsage: 100 * 1024 * 1024, // 100MB max
      targetThroughput: 2, // At least 2 operations per second
    });

    expect(result.passed).toBe(true);
    expect(result.metrics.throughput).toBeGreaterThanOrEqual(2);
  });

  it('should handle large document processing', async () => {
    const mockLargeDocumentProcessing = async () => {
      // Simulate processing a large document
      const largeContent = new Array(10000).fill('Large document content ').join('');
      
      // Simulate AI processing time based on content size
      const processingTime = Math.min(largeContent.length / 10000, 1000);
      await TestHelpers.sleep(processingTime);

      return {
        contentSize: largeContent.length,
        processed: true,
      };
    };

    const result = await performanceRunner.runTest(mockLargeDocumentProcessing, {
      name: 'Large Document Processing',
      iterations: 3,
      maxDuration: 2000, // 2 seconds max
      maxMemoryUsage: 200 * 1024 * 1024, // 200MB max
    });

    expect(result.passed).toBe(true);
    expect(result.metrics.duration).toBeLessThan(2000);
  });

  it('should handle batch processing load test', async () => {
    const mockBatchProcessing = async () => {
      // Simulate processing a batch of documents
      await TestHelpers.sleep(20 + Math.random() * 30); // 20-50ms per document
      return { processed: true };
    };

    const loadTestResult = await performanceRunner.runLoadTest(mockBatchProcessing, {
      name: 'Batch Processing Load Test',
      duration: 5000, // 5 seconds
      maxConcurrency: 10,
      targetRPS: 20, // 20 requests per second
    });

    expect(loadTestResult.successfulRequests).toBeGreaterThan(80); // At least 80 successful requests in 5 seconds
    expect(loadTestResult.failedRequests).toBe(0);
    expect(loadTestResult.averageResponseTime).toBeLessThan(100);
    expect(loadTestResult.throughput).toBeGreaterThanOrEqual(15); // At least 15 RPS
  });

  it('should handle memory-intensive operations', async () => {
    const mockMemoryIntensiveOperation = async () => {
      // Simulate memory-intensive AI processing
      const largeArray = new Array(100000).fill(0).map((_, i) => ({
        id: i,
        data: `Item ${i}`,
        metadata: { processed: true, timestamp: Date.now() },
      }));

      // Process the array
      const processed = largeArray.filter(item => item.metadata.processed);
      
      return {
        totalItems: largeArray.length,
        processedItems: processed.length,
      };
    };

    const result = await performanceRunner.runTest(mockMemoryIntensiveOperation, {
      name: 'Memory Intensive Operation',
      iterations: 3,
      maxDuration: 1000,
      maxMemoryUsage: 500 * 1024 * 1024, // 500MB max
    });

    expect(result.passed).toBe(true);
    expect(result.metrics.memoryUsage.heapUsed).toBeLessThan(500 * 1024 * 1024);
  });

  it('should handle error recovery performance', async () => {
    let attemptCount = 0;
    
    const mockOperationWithErrors = async () => {
      attemptCount++;
      
      // Fail first few attempts to test retry performance
      if (attemptCount <= 2) {
        throw new Error('Temporary failure');
      }
      
      return { success: true, attempts: attemptCount };
    };

    const mockRetryWrapper = async () => {
      attemptCount = 0; // Reset for each test iteration
      return await TestHelpers.retryOperation(mockOperationWithErrors, {
        maxRetries: 3,
        delay: 10,
        backoff: true,
      });
    };

    const result = await performanceRunner.runTest(mockRetryWrapper, {
      name: 'Error Recovery Performance',
      iterations: 5,
      maxDuration: 200, // Should complete retries quickly
      maxErrorRate: 0, // No final errors expected
    });

    expect(result.passed).toBe(true);
    expect(result.metrics.errorRate).toBe(0);
  });

  it('should generate performance report', async () => {
    const testResults = [
      await performanceRunner.runTest(
        async () => ({ result: 'test1' }),
        { name: 'Test 1', iterations: 3, maxDuration: 100 }
      ),
      await performanceRunner.runTest(
        async () => ({ result: 'test2' }),
        { name: 'Test 2', iterations: 3, maxDuration: 100 }
      ),
    ];

    const report = performanceRunner.generatePerformanceReport(testResults);
    
    expect(report).toContain('# Performance Test Report');
    expect(report).toContain('Test 1');
    expect(report).toContain('Test 2');
    expect(report).toContain('Average Duration');
    expect(report).toContain('Memory Usage');
  });
});