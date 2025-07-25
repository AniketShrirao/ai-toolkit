# Testing Guide

This document provides comprehensive information about the testing infrastructure and practices for the AI Toolkit project.

## Overview

The AI Toolkit uses a multi-layered testing approach to ensure code quality, performance, and AI response consistency:

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test component interactions and external services
- **End-to-End Tests**: Test complete workflows and user scenarios
- **Performance Tests**: Test system performance under load
- **AI Quality Tests**: Test AI response quality and consistency

## Test Structure

```
test/
├── fixtures/           # Test data and sample files
├── utils/             # Testing utilities and helpers
├── unit/              # Unit tests
├── integration/       # Integration tests
├── e2e/               # End-to-end tests
├── performance/       # Performance tests
├── ai-quality/        # AI quality tests
└── setup.ts           # Global test setup
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:performance
npm run test:ai-quality

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Advanced Options

```bash
# Run tests with verbose output
npm test -- --verbose

# Run tests and stop on first failure
npm test -- --bail

# Run specific test file
npm test -- test/unit/example.test.ts

# Run tests matching pattern
npm test -- --grep "document processing"
```

## Test Utilities

### TestDataManager

Generates and manages test data for documents, codebases, and workflows.

```typescript
import { TestDataManager } from '@test/utils';

const testData = new TestDataManager();
await testData.initialize();

const document = await testData.getTestDocument('simple-requirements.pdf');
const codebase = await testData.getTestCodebase('simple-api-typescript');
```

### MockOllamaServer

Provides a mock Ollama server for testing AI integrations without external dependencies.

```typescript
import { MockOllamaServer } from '@test/utils';

const mockServer = new MockOllamaServer();
await mockServer.start();

// Customize responses
mockServer.setResponse('analyze-document', JSON.stringify({
  requirements: [...],
  keyPoints: [...],
}));
```

### TestHelpers

Utility functions for common testing operations.

```typescript
import { TestHelpers } from '@test/utils';

// Wait for condition
await TestHelpers.waitFor(() => condition, { timeout: 5000 });

// Measure performance
const { result, duration } = await TestHelpers.measureExecutionTime(operation);

// Create temporary files
const filePath = await TestHelpers.createTempFile(content, '.txt');
```

### PerformanceTestRunner

Runs performance tests with configurable metrics and thresholds.

```typescript
import { PerformanceTestRunner } from '@test/utils';

const runner = new PerformanceTestRunner();
const result = await runner.runTest(testFunction, {
  name: 'Document Processing',
  iterations: 10,
  maxDuration: 1000,
  maxMemoryUsage: 100 * 1024 * 1024,
});
```

### AIQualityTester

Tests AI response quality across multiple dimensions.

```typescript
import { AIQualityTester } from '@test/utils';

const tester = new AIQualityTester();
const result = await tester.runQualityTest(testCase, aiFunction);

console.log(`Overall Score: ${result.metrics.overallScore}`);
console.log(`Accuracy: ${result.metrics.accuracy}`);
console.log(`Consistency: ${result.metrics.consistency}`);
```

## Writing Tests

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';

describe('DocumentProcessor', () => {
  it('should extract text from PDF', async () => {
    const processor = new DocumentProcessor();
    const result = await processor.extractText(pdfBuffer);
    
    expect(result.text).toBeTruthy();
    expect(result.metadata.pages).toBeGreaterThan(0);
  });
});
```

### Integration Tests

```typescript
import { describe, it, expect, beforeAll } from 'vitest';

describe('Ollama Integration', () => {
  beforeAll(async () => {
    // Setup mock server
    await global.mockOllamaServer.start();
  });

  it('should analyze document with Ollama', async () => {
    const service = new OllamaService();
    const result = await service.analyzeDocument(content);
    
    expect(result.requirements).toBeDefined();
    expect(result.keyPoints).toHaveLength.greaterThan(0);
  });
});
```

### Performance Tests

```typescript
import { describe, it, expect } from 'vitest';
import { PerformanceTestRunner } from '@test/utils';

describe('Performance Tests', () => {
  it('should process documents within time limits', async () => {
    const runner = new PerformanceTestRunner();
    
    const result = await runner.runTest(processDocument, {
      name: 'Document Processing',
      maxDuration: 2000,
      iterations: 5,
    });
    
    expect(result.passed).toBe(true);
  });
});
```

### AI Quality Tests

```typescript
import { describe, it, expect } from 'vitest';
import { AIQualityTester } from '@test/utils';

describe('AI Quality Tests', () => {
  it('should generate consistent summaries', async () => {
    const tester = new AIQualityTester();
    
    const testCase = {
      id: 'summary-test',
      name: 'Summary Generation',
      input: { content: documentContent },
      evaluationCriteria: {
        consistency: {
          weight: 0.8,
          iterations: 5,
          evaluator: AIQualityTester.createConsistencyEvaluators().structuralSimilarity,
        },
      },
    };
    
    const result = await tester.runQualityTest(testCase, generateSummary);
    expect(result.passed).toBe(true);
  });
});
```

## Test Configuration

### Vitest Configuration

The project uses Vitest for testing with the following key configurations:

- **Coverage**: V8 provider with 80% threshold
- **Timeout**: 30 seconds for long-running AI operations
- **Threads**: Parallel execution for faster test runs
- **Aliases**: Path aliases for easy imports

### Environment Variables

```bash
NODE_ENV=test              # Test environment
TEST_MODE=true            # Enable test mode
OLLAMA_HOST=localhost:11434  # Mock Ollama server
TEST_VERBOSE=true         # Verbose logging (optional)
```

## Continuous Integration

### GitHub Actions

The project includes comprehensive CI/CD workflows:

- **Test Suite**: Runs all test types on multiple Node.js versions
- **SonarCloud**: Code quality analysis and coverage reporting
- **Performance Benchmark**: Tracks performance regressions

### Pre-commit Hooks

Automated checks before each commit:

- Code linting (ESLint)
- Code formatting (Prettier)
- Unit tests
- Type checking

## Best Practices

### Test Organization

1. **Group related tests** using `describe` blocks
2. **Use descriptive test names** that explain the expected behavior
3. **Follow AAA pattern**: Arrange, Act, Assert
4. **Keep tests independent** and avoid shared state

### Mocking

1. **Mock external dependencies** (Ollama, file system, network)
2. **Use realistic mock data** that represents actual usage
3. **Test error scenarios** with appropriate mocks
4. **Verify mock interactions** when testing integrations

### Performance Testing

1. **Set realistic thresholds** based on actual requirements
2. **Test with various data sizes** to identify scaling issues
3. **Monitor memory usage** to prevent memory leaks
4. **Use consistent test environments** for reliable results

### AI Quality Testing

1. **Define clear evaluation criteria** for each AI operation
2. **Test consistency** across multiple runs
3. **Validate output structure** and required fields
4. **Test edge cases** and error conditions

## Troubleshooting

### Common Issues

1. **Tests timeout**: Increase timeout or optimize test performance
2. **Mock server not responding**: Check server startup in test setup
3. **Coverage below threshold**: Add tests for uncovered code paths
4. **Flaky tests**: Identify and fix race conditions or timing issues

### Debugging

```bash
# Run tests with debug output
DEBUG=* npm test

# Run single test with verbose output
npm test -- --verbose test/unit/specific.test.ts

# Generate detailed coverage report
npm run test:coverage -- --reporter=html
```

## Contributing

When adding new features:

1. **Write tests first** (TDD approach)
2. **Ensure adequate coverage** (minimum 80%)
3. **Add performance tests** for critical paths
4. **Include AI quality tests** for AI-powered features
5. **Update documentation** as needed

For more information, see the [Contributing Guide](CONTRIBUTING.md).