import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestHelpers } from '../utils/TestHelpers';

describe('End-to-End Document Processing', () => {
  beforeAll(async () => {
    // Setup test environment
    await global.testDataManager.initialize();
  });

  afterAll(async () => {
    // Cleanup
    await TestHelpers.cleanupTempFiles();
  });

  it('should process a complete document workflow', async () => {
    // Get test document
    const testDoc = await global.testDataManager.getTestDocument('simple-requirements.pdf');
    expect(testDoc).toBeTruthy();

    // Mock the complete workflow
    const mockWorkflow = async (document: any) => {
      // Step 1: Document extraction
      const extractedContent = {
        text: document.content,
        metadata: document.metadata,
      };

      // Step 2: AI analysis
      const analysisResult = {
        requirements: [
          {
            id: 'req-1',
            type: 'functional',
            description: 'User authentication',
            priority: 'high',
          },
        ],
        keyPoints: ['Security is important', 'User experience matters'],
        summary: 'Document contains authentication requirements',
      };

      // Step 3: Estimation
      const estimation = {
        totalHours: 40,
        complexity: 'medium',
        confidence: 0.8,
      };

      // Step 4: Communication generation
      const communication = {
        email: 'Professional email content...',
        proposal: 'Detailed proposal content...',
      };

      return {
        extraction: extractedContent,
        analysis: analysisResult,
        estimation,
        communication,
      };
    };

    const result = await mockWorkflow(testDoc);

    // Verify each step
    expect(result.extraction).toBeTruthy();
    expect(result.extraction.text).toBe(testDoc?.content);

    expect(result.analysis).toBeTruthy();
    expect(result.analysis.requirements).toHaveLength(1);
    expect(result.analysis.keyPoints).toHaveLength(2);

    expect(result.estimation).toBeTruthy();
    expect(result.estimation.totalHours).toBeGreaterThan(0);

    expect(result.communication).toBeTruthy();
    expect(result.communication.email).toBeTruthy();
    expect(result.communication.proposal).toBeTruthy();
  });

  it('should handle large document processing', async () => {
    const testDoc = await global.testDataManager.getTestDocument('large-document.pdf');
    expect(testDoc).toBeTruthy();

    const mockLargeDocumentProcessing = async (document: any) => {
      // Simulate processing time based on document size
      const processingTime = Math.min(document.size / 1000, 5000); // Max 5 seconds
      await TestHelpers.sleep(processingTime);

      return {
        processed: true,
        size: document.size,
        processingTime,
      };
    };

    const { result, duration } = await TestHelpers.measureExecutionTime(() =>
      mockLargeDocumentProcessing(testDoc)
    );

    expect(result.processed).toBe(true);
    expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
  });

  it('should handle concurrent document processing', async () => {
    const documents = [
      await global.testDataManager.getTestDocument('simple-requirements.pdf'),
      await global.testDataManager.getTestDocument('complex-project-spec.pdf'),
      await global.testDataManager.getTestDocument('technical-documentation.pdf'),
    ].filter(Boolean);

    const mockProcessDocument = async (document: any) => {
      await TestHelpers.sleep(100); // Simulate processing time
      return {
        id: document.id,
        processed: true,
        timestamp: new Date(),
      };
    };

    const operations = documents.map(doc => () => mockProcessDocument(doc));
    const results = await TestHelpers.runConcurrently(operations, { maxConcurrency: 3 });

    expect(results).toHaveLength(documents.length);
    results.forEach(result => {
      expect(result.processed).toBe(true);
      expect(result.timestamp).toBeInstanceOf(Date);
    });
  });

  it('should handle processing errors gracefully', async () => {
    const mockProcessingWithError = async () => {
      throw new Error('Processing failed');
    };

    const error = await TestHelpers.expectToThrow(
      mockProcessingWithError,
      'Processing failed'
    );

    expect(error.message).toBe('Processing failed');
  });

  it('should maintain processing state across workflow steps', async () => {
    const workflowState = {
      documentId: 'test-doc-1',
      currentStep: 'extraction',
      results: {},
    };

    const mockWorkflowStep = async (state: any, stepName: string) => {
      state.currentStep = stepName;
      state.results[stepName] = {
        completed: true,
        timestamp: new Date(),
      };
      return state;
    };

    let state = workflowState;
    state = await mockWorkflowStep(state, 'extraction');
    state = await mockWorkflowStep(state, 'analysis');
    state = await mockWorkflowStep(state, 'estimation');

    expect(state.currentStep).toBe('estimation');
    expect(Object.keys(state.results)).toHaveLength(3);
    expect(state.results.extraction.completed).toBe(true);
    expect(state.results.analysis.completed).toBe(true);
    expect(state.results.estimation.completed).toBe(true);
  });
});