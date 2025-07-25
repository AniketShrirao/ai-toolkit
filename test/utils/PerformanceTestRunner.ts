import { TestHelpers } from './TestHelpers';

export interface PerformanceMetrics {
  duration: number;
  memoryUsage: NodeJS.MemoryUsage;
  throughput?: number;
  errorRate?: number;
}

export interface PerformanceTestConfig {
  name: string;
  iterations?: number;
  concurrency?: number;
  warmupIterations?: number;
  maxDuration?: number;
  maxMemoryUsage?: number;
  targetThroughput?: number;
  maxErrorRate?: number;
}

export interface PerformanceTestResult {
  config: PerformanceTestConfig;
  metrics: PerformanceMetrics;
  iterations: PerformanceMetrics[];
  passed: boolean;
  errors: Error[];
}

export class PerformanceTestRunner {
  async runTest<T>(
    testFn: () => Promise<T>,
    config: PerformanceTestConfig
  ): Promise<PerformanceTestResult> {
    const {
      name,
      iterations = 10,
      concurrency = 1,
      warmupIterations = 2,
      maxDuration = 10000,
      maxMemoryUsage = 500 * 1024 * 1024, // 500MB
      targetThroughput,
      maxErrorRate = 0.1, // 10%
    } = config;

    const errors: Error[] = [];
    const iterationResults: PerformanceMetrics[] = [];

    // Warmup phase
    console.log(`Running warmup for ${name}...`);
    for (let i = 0; i < warmupIterations; i++) {
      try {
        await testFn();
      } catch (error) {
        // Ignore warmup errors
      }
    }

    // Main test phase
    console.log(`Running performance test: ${name}`);
    const startTime = Date.now();

    if (concurrency === 1) {
      // Sequential execution
      for (let i = 0; i < iterations; i++) {
        try {
          const metrics = await this.measureIteration(testFn);
          iterationResults.push(metrics);
        } catch (error) {
          errors.push(error as Error);
        }
      }
    } else {
      // Concurrent execution
      const batches = Math.ceil(iterations / concurrency);
      for (let batch = 0; batch < batches; batch++) {
        const batchSize = Math.min(concurrency, iterations - batch * concurrency);
        const batchPromises = Array.from({ length: batchSize }, async () => {
          try {
            const metrics = await this.measureIteration(testFn);
            return metrics;
          } catch (error) {
            errors.push(error as Error);
            return null;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        iterationResults.push(...batchResults.filter(result => result !== null) as PerformanceMetrics[]);
      }
    }

    const totalDuration = Date.now() - startTime;
    const successfulIterations = iterationResults.length;
    const errorRate = errors.length / iterations;

    // Calculate aggregate metrics
    const avgDuration = iterationResults.reduce((sum, m) => sum + m.duration, 0) / successfulIterations;
    const avgMemoryUsage = this.calculateAverageMemoryUsage(iterationResults);
    const throughput = successfulIterations / (totalDuration / 1000); // operations per second

    const aggregateMetrics: PerformanceMetrics = {
      duration: avgDuration,
      memoryUsage: avgMemoryUsage,
      throughput,
      errorRate,
    };

    // Determine if test passed
    const passed = this.evaluatePerformance(aggregateMetrics, {
      maxDuration,
      maxMemoryUsage,
      targetThroughput,
      maxErrorRate,
    });

    return {
      config,
      metrics: aggregateMetrics,
      iterations: iterationResults,
      passed,
      errors,
    };
  }

  private async measureIteration<T>(testFn: () => Promise<T>): Promise<PerformanceMetrics> {
    const { result, duration } = await TestHelpers.measureExecutionTime(async () => {
      return await TestHelpers.measureMemoryUsage(testFn);
    });

    return {
      duration,
      memoryUsage: result.memoryUsage,
    };
  }

  private calculateAverageMemoryUsage(results: PerformanceMetrics[]): NodeJS.MemoryUsage {
    const count = results.length;
    return {
      rss: results.reduce((sum, r) => sum + r.memoryUsage.rss, 0) / count,
      heapTotal: results.reduce((sum, r) => sum + r.memoryUsage.heapTotal, 0) / count,
      heapUsed: results.reduce((sum, r) => sum + r.memoryUsage.heapUsed, 0) / count,
      external: results.reduce((sum, r) => sum + r.memoryUsage.external, 0) / count,
      arrayBuffers: results.reduce((sum, r) => sum + r.memoryUsage.arrayBuffers, 0) / count,
    };
  }

  private evaluatePerformance(
    metrics: PerformanceMetrics,
    thresholds: {
      maxDuration: number;
      maxMemoryUsage: number;
      targetThroughput?: number;
      maxErrorRate: number;
    }
  ): boolean {
    const { maxDuration, maxMemoryUsage, targetThroughput, maxErrorRate } = thresholds;

    // Check duration threshold
    if (metrics.duration > maxDuration) {
      console.warn(`Duration exceeded threshold: ${metrics.duration}ms > ${maxDuration}ms`);
      return false;
    }

    // Check memory usage threshold
    if (metrics.memoryUsage.heapUsed > maxMemoryUsage) {
      console.warn(`Memory usage exceeded threshold: ${metrics.memoryUsage.heapUsed} > ${maxMemoryUsage}`);
      return false;
    }

    // Check throughput threshold
    if (targetThroughput && metrics.throughput && metrics.throughput < targetThroughput) {
      console.warn(`Throughput below target: ${metrics.throughput} < ${targetThroughput} ops/sec`);
      return false;
    }

    // Check error rate threshold
    if (metrics.errorRate && metrics.errorRate > maxErrorRate) {
      console.warn(`Error rate exceeded threshold: ${metrics.errorRate} > ${maxErrorRate}`);
      return false;
    }

    return true;
  }

  async runLoadTest<T>(
    testFn: () => Promise<T>,
    config: {
      name: string;
      duration: number; // Test duration in milliseconds
      rampUpTime?: number; // Time to reach max concurrency
      maxConcurrency: number;
      targetRPS?: number; // Requests per second
    }
  ): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    throughput: number;
    errors: Error[];
  }> {
    const {
      name,
      duration,
      rampUpTime = duration * 0.1, // 10% of total duration for ramp-up
      maxConcurrency,
      targetRPS,
    } = config;

    console.log(`Starting load test: ${name}`);
    console.log(`Duration: ${duration}ms, Max Concurrency: ${maxConcurrency}`);

    const startTime = Date.now();
    const endTime = startTime + duration;
    const rampUpEndTime = startTime + rampUpTime;

    let totalRequests = 0;
    let successfulRequests = 0;
    let failedRequests = 0;
    let totalResponseTime = 0;
    const errors: Error[] = [];

    const workers: Promise<void>[] = [];

    // Create worker functions
    for (let i = 0; i < maxConcurrency; i++) {
      const worker = async () => {
        while (Date.now() < endTime) {
          // Calculate current concurrency based on ramp-up
          const currentTime = Date.now();
          const shouldRun = currentTime > rampUpEndTime || 
            (i < (maxConcurrency * (currentTime - startTime) / rampUpTime));

          if (!shouldRun) {
            await TestHelpers.sleep(100);
            continue;
          }

          try {
            const { duration: requestDuration } = await TestHelpers.measureExecutionTime(testFn);
            totalRequests++;
            successfulRequests++;
            totalResponseTime += requestDuration;

            // Rate limiting if targetRPS is specified
            if (targetRPS) {
              const expectedInterval = 1000 / (targetRPS / maxConcurrency);
              await TestHelpers.sleep(Math.max(0, expectedInterval - requestDuration));
            }
          } catch (error) {
            totalRequests++;
            failedRequests++;
            errors.push(error as Error);
          }
        }
      };

      workers.push(worker());
    }

    // Wait for all workers to complete
    await Promise.all(workers);

    const actualDuration = Date.now() - startTime;
    const averageResponseTime = totalResponseTime / successfulRequests;
    const throughput = totalRequests / (actualDuration / 1000);

    console.log(`Load test completed: ${name}`);
    console.log(`Total requests: ${totalRequests}`);
    console.log(`Successful: ${successfulRequests}, Failed: ${failedRequests}`);
    console.log(`Average response time: ${averageResponseTime.toFixed(2)}ms`);
    console.log(`Throughput: ${throughput.toFixed(2)} requests/sec`);

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      throughput,
      errors,
    };
  }

  generatePerformanceReport(results: PerformanceTestResult[]): string {
    const report = ['# Performance Test Report', ''];

    results.forEach(result => {
      const { config, metrics, passed, errors } = result;
      
      report.push(`## ${config.name}`);
      report.push(`**Status:** ${passed ? '✅ PASSED' : '❌ FAILED'}`);
      report.push('');
      
      report.push('### Metrics');
      report.push(`- Average Duration: ${metrics.duration.toFixed(2)}ms`);
      report.push(`- Memory Usage: ${(metrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      
      if (metrics.throughput) {
        report.push(`- Throughput: ${metrics.throughput.toFixed(2)} ops/sec`);
      }
      
      if (metrics.errorRate) {
        report.push(`- Error Rate: ${(metrics.errorRate * 100).toFixed(2)}%`);
      }
      
      report.push('');

      if (errors.length > 0) {
        report.push('### Errors');
        errors.slice(0, 5).forEach((error, index) => {
          report.push(`${index + 1}. ${error.message}`);
        });
        
        if (errors.length > 5) {
          report.push(`... and ${errors.length - 5} more errors`);
        }
        
        report.push('');
      }
    });

    return report.join('\n');
  }
}