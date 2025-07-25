import { describe, it, expect, beforeAll } from 'vitest';
import { AIQualityTester, AITestCase } from '../utils/AIQualityTester';

describe('AI Quality Tests - Document Analysis', () => {
  let qualityTester: AIQualityTester;

  beforeAll(() => {
    qualityTester = new AIQualityTester();
  });

  it('should analyze document structure with high accuracy', async () => {
    const testCase: AITestCase = {
      id: 'doc-structure-001',
      name: 'Document Structure Analysis',
      input: {
        content: `# Project Requirements
        
## Introduction
This document outlines the requirements for a web application.

## Functional Requirements
1. User authentication
2. Data management
3. Reporting features

## Non-Functional Requirements
- Performance: < 2 seconds response time
- Security: Data encryption required
- Scalability: Support 1000+ users`,
      },
      expectedOutput: {
        sections: ['Introduction', 'Functional Requirements', 'Non-Functional Requirements'],
        headings: 4,
        requirements: {
          functional: 3,
          nonFunctional: 3,
        },
      },
      evaluationCriteria: {
        accuracy: {
          weight: 0.4,
          evaluator: AIQualityTester.createAccuracyEvaluators().jsonStructure,
        },
        consistency: {
          weight: 0.3,
          iterations: 3,
          evaluator: AIQualityTester.createConsistencyEvaluators().structuralSimilarity,
        },
        relevance: {
          weight: 0.2,
          evaluator: AIQualityTester.createRelevanceEvaluators().keywordPresence([
            'requirements', 'functional', 'non-functional', 'authentication'
          ]),
        },
        completeness: {
          weight: 0.1,
          evaluator: AIQualityTester.createCompletenessEvaluators().requiredFields([
            'sections', 'headings', 'requirements'
          ]),
        },
      },
    };

    const mockDocumentAnalysis = async (input: any) => {
      // Mock AI analysis that would normally call Ollama
      const content = input.content;
      
      // Simulate structure analysis
      const sections = content.match(/## (.+)/g)?.map((match: string) => match.replace('## ', '')) || [];
      const headings = (content.match(/#+ /g) || []).length;
      
      // Simulate requirement extraction
      const functionalMatches = content.match(/\d+\.\s+(.+)/g) || [];
      const nonFunctionalMatches = content.match(/- (.+):/g) || [];
      
      return {
        sections,
        headings,
        requirements: {
          functional: functionalMatches.length,
          nonFunctional: nonFunctionalMatches.length,
        },
        keyPoints: [
          'User authentication is required',
          'Performance requirements are strict',
          'System must be scalable',
        ],
      };
    };

    const result = await qualityTester.runQualityTest(testCase, mockDocumentAnalysis);

    expect(result.passed).toBe(true);
    expect(result.metrics.overallScore).toBeGreaterThan(0.7);
    expect(result.metrics.accuracy).toBeGreaterThan(0.8);
    expect(result.metrics.consistency).toBeGreaterThan(0.9);
  });

  it('should extract requirements with proper categorization', async () => {
    const testCase: AITestCase = {
      id: 'req-extraction-001',
      name: 'Requirement Extraction',
      input: {
        content: `The system shall allow users to login with email and password.
        The system must respond within 2 seconds.
        Users should be able to reset their passwords.
        The application must support 1000 concurrent users.`,
      },
      expectedOutput: {
        requirements: [
          { type: 'functional', description: 'login with email and password' },
          { type: 'non-functional', description: 'respond within 2 seconds' },
          { type: 'functional', description: 'reset their passwords' },
          { type: 'non-functional', description: 'support 1000 concurrent users' },
        ],
      },
      evaluationCriteria: {
        accuracy: {
          weight: 0.5,
          evaluator: (actual: any, expected: any) => {
            const actualCount = actual.requirements?.length || 0;
            const expectedCount = expected.requirements?.length || 0;
            return Math.min(actualCount, expectedCount) / Math.max(actualCount, expectedCount);
          },
        },
        completeness: {
          weight: 0.3,
          evaluator: (output: any) => {
            const requirements = output.requirements || [];
            const hasTypes = requirements.every((req: any) => req.type);
            const hasDescriptions = requirements.every((req: any) => req.description);
            return (hasTypes && hasDescriptions) ? 1 : 0.5;
          },
        },
        relevance: {
          weight: 0.2,
          evaluator: AIQualityTester.createRelevanceEvaluators().keywordPresence([
            'login', 'password', 'respond', 'users', 'concurrent'
          ]),
        },
      },
    };

    const mockRequirementExtraction = async (input: any) => {
      const content = input.content;
      const sentences = content.split('.').filter((s: string) => s.trim());
      
      const requirements = sentences.map((sentence: string) => {
        const isPerformance = sentence.includes('seconds') || sentence.includes('concurrent');
        return {
          type: isPerformance ? 'non-functional' : 'functional',
          description: sentence.trim().toLowerCase(),
          priority: 'medium',
        };
      });

      return { requirements };
    };

    const result = await qualityTester.runQualityTest(testCase, mockRequirementExtraction);

    expect(result.passed).toBe(true);
    expect(result.details.actualOutput.requirements).toBeDefined();
    expect(result.details.actualOutput.requirements.length).toBeGreaterThan(0);
  });

  it('should generate consistent summaries', async () => {
    const testCase: AITestCase = {
      id: 'summary-consistency-001',
      name: 'Summary Consistency',
      input: {
        content: `This is a comprehensive project specification for developing a modern web application 
        with user authentication, data management, and reporting capabilities. The system must be 
        scalable, secure, and performant.`,
      },
      evaluationCriteria: {
        consistency: {
          weight: 0.6,
          iterations: 5,
          evaluator: (results: any[]) => {
            const summaries = results.map(r => r.summary);
            const avgLength = summaries.reduce((sum: number, s: string) => sum + s.length, 0) / summaries.length;
            const lengthVariance = summaries.reduce((sum: number, s: string) => 
              sum + Math.pow(s.length - avgLength, 2), 0) / summaries.length;
            
            // Consider consistent if length variance is low
            return lengthVariance < 100 ? 1 : Math.max(0, 1 - lengthVariance / 1000);
          },
        },
        relevance: {
          weight: 0.3,
          evaluator: AIQualityTester.createRelevanceEvaluators().keywordPresence([
            'web application', 'authentication', 'data', 'reporting', 'scalable'
          ]),
        },
        completeness: {
          weight: 0.1,
          evaluator: AIQualityTester.createCompletenessEvaluators().minimumLength(50),
        },
      },
    };

    const mockSummaryGeneration = async (input: any) => {
      const content = input.content;
      
      // Simulate AI summary generation with slight variations
      const summaries = [
        'This document describes a web application with authentication, data management, and reporting features.',
        'The specification outlines a scalable web application with user authentication and data management capabilities.',
        'A comprehensive web application specification covering authentication, data handling, and reporting functionality.',
      ];
      
      const randomSummary = summaries[Math.floor(Math.random() * summaries.length)];
      
      return {
        summary: randomSummary,
        keyPoints: ['Authentication required', 'Data management needed', 'Reporting features'],
        wordCount: content.split(' ').length,
      };
    };

    const result = await qualityTester.runQualityTest(testCase, mockSummaryGeneration);

    expect(result.passed).toBe(true);
    expect(result.metrics.consistency).toBeGreaterThan(0.7);
    expect(result.details.iterations).toBeDefined();
    expect(result.details.iterations?.length).toBe(5);
  });

  it('should handle edge cases gracefully', async () => {
    const edgeCases = [
      { name: 'Empty Content', input: { content: '' } },
      { name: 'Very Short Content', input: { content: 'Test.' } },
      { name: 'Very Long Content', input: { content: 'A'.repeat(10000) } },
      { name: 'Special Characters', input: { content: '!@#$%^&*()_+{}|:"<>?[]\\;\',./' } },
      { name: 'Non-English Content', input: { content: 'Ceci est un document en français.' } },
    ];

    const mockRobustAnalysis = async (input: any) => {
      const content = input.content || '';
      
      if (content.length === 0) {
        return { error: 'Empty content', analysis: null };
      }
      
      if (content.length < 10) {
        return { warning: 'Content too short for meaningful analysis', analysis: { basic: true } };
      }
      
      return {
        analysis: {
          length: content.length,
          hasContent: content.length > 0,
          processed: true,
        },
      };
    };

    for (const edgeCase of edgeCases) {
      const testCase: AITestCase = {
        id: `edge-case-${edgeCase.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: `Edge Case: ${edgeCase.name}`,
        input: edgeCase.input,
        evaluationCriteria: {
          completeness: {
            weight: 1.0,
            evaluator: (output: any) => {
              // Should always return some result, even for edge cases
              return output && (output.analysis || output.error || output.warning) ? 1 : 0;
            },
          },
        },
      };

      const result = await qualityTester.runQualityTest(testCase, mockRobustAnalysis);
      expect(result.passed).toBe(true);
    }
  });

  it('should generate comprehensive quality report', async () => {
    const testCases: AITestCase[] = [
      {
        id: 'test-1',
        name: 'Basic Analysis',
        input: { content: 'Test content' },
        evaluationCriteria: {
          accuracy: { weight: 1.0, evaluator: () => 0.9 },
        },
      },
      {
        id: 'test-2',
        name: 'Advanced Analysis',
        input: { content: 'Advanced test content' },
        evaluationCriteria: {
          accuracy: { weight: 0.5, evaluator: () => 0.8 },
          consistency: { weight: 0.5, iterations: 2, evaluator: () => 0.95 },
        },
      },
    ];

    const mockAnalysis = async (input: any) => ({
      processed: true,
      content: input.content,
    });

    const results = await qualityTester.runBatchQualityTests(testCases, mockAnalysis);
    const report = qualityTester.generateQualityReport(results);

    expect(report).toContain('# AI Quality Test Report');
    expect(report).toContain('## Summary');
    expect(report).toContain('Total Tests: 2');
    expect(report).toContain('## Average Metrics');
    expect(report).toContain('## Individual Test Results');
    expect(report).toContain('Basic Analysis');
    expect(report).toContain('Advanced Analysis');
  });
});