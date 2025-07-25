export interface AIQualityMetrics {
  accuracy: number;
  consistency: number;
  relevance: number;
  completeness: number;
  responseTime: number;
  overallScore: number;
}

export interface AITestCase {
  id: string;
  name: string;
  input: any;
  expectedOutput?: any;
  evaluationCriteria: EvaluationCriteria;
}

export interface EvaluationCriteria {
  accuracy?: {
    weight: number;
    evaluator: (actual: any, expected: any) => number;
  };
  consistency?: {
    weight: number;
    iterations: number;
    evaluator: (results: any[]) => number;
  };
  relevance?: {
    weight: number;
    evaluator: (input: any, output: any) => number;
  };
  completeness?: {
    weight: number;
    evaluator: (output: any) => number;
  };
}

export interface AIQualityTestResult {
  testCase: AITestCase;
  metrics: AIQualityMetrics;
  passed: boolean;
  details: {
    actualOutput: any;
    iterations?: any[];
    errors: Error[];
  };
}

export class AIQualityTester {
  private readonly minPassingScore = 0.7; // 70% minimum score to pass

  async runQualityTest(
    testCase: AITestCase,
    aiFunction: (input: any) => Promise<any>
  ): Promise<AIQualityTestResult> {
    const { id, name, input, expectedOutput, evaluationCriteria } = testCase;
    const errors: Error[] = [];
    let actualOutput: any;
    let iterations: any[] = [];

    console.log(`Running AI quality test: ${name}`);

    try {
      // Run the AI function
      const startTime = Date.now();
      actualOutput = await aiFunction(input);
      const responseTime = Date.now() - startTime;

      // Run consistency test if required
      if (evaluationCriteria.consistency) {
        const { iterations: iterationCount } = evaluationCriteria.consistency;
        iterations = [actualOutput];
        
        for (let i = 1; i < iterationCount; i++) {
          try {
            const result = await aiFunction(input);
            iterations.push(result);
          } catch (error) {
            errors.push(error as Error);
          }
        }
      }

      // Calculate metrics
      const metrics = this.calculateMetrics(
        input,
        actualOutput,
        expectedOutput,
        iterations,
        evaluationCriteria,
        responseTime
      );

      const passed = metrics.overallScore >= this.minPassingScore;

      return {
        testCase,
        metrics,
        passed,
        details: {
          actualOutput,
          iterations: iterations.length > 1 ? iterations : undefined,
          errors,
        },
      };
    } catch (error) {
      errors.push(error as Error);
      
      // Return failed result
      return {
        testCase,
        metrics: {
          accuracy: 0,
          consistency: 0,
          relevance: 0,
          completeness: 0,
          responseTime: 0,
          overallScore: 0,
        },
        passed: false,
        details: {
          actualOutput: null,
          errors,
        },
      };
    }
  }

  private calculateMetrics(
    input: any,
    actualOutput: any,
    expectedOutput: any,
    iterations: any[],
    criteria: EvaluationCriteria,
    responseTime: number
  ): AIQualityMetrics {
    let accuracy = 0;
    let consistency = 0;
    let relevance = 0;
    let completeness = 0;

    // Calculate accuracy
    if (criteria.accuracy && expectedOutput) {
      try {
        accuracy = criteria.accuracy.evaluator(actualOutput, expectedOutput);
      } catch (error) {
        console.warn('Error calculating accuracy:', error);
        accuracy = 0;
      }
    }

    // Calculate consistency
    if (criteria.consistency && iterations.length > 1) {
      try {
        consistency = criteria.consistency.evaluator(iterations);
      } catch (error) {
        console.warn('Error calculating consistency:', error);
        consistency = 0;
      }
    } else {
      consistency = 1; // Perfect consistency if only one iteration
    }

    // Calculate relevance
    if (criteria.relevance) {
      try {
        relevance = criteria.relevance.evaluator(input, actualOutput);
      } catch (error) {
        console.warn('Error calculating relevance:', error);
        relevance = 0;
      }
    }

    // Calculate completeness
    if (criteria.completeness) {
      try {
        completeness = criteria.completeness.evaluator(actualOutput);
      } catch (error) {
        console.warn('Error calculating completeness:', error);
        completeness = 0;
      }
    }

    // Calculate weighted overall score
    const weights = {
      accuracy: criteria.accuracy?.weight || 0,
      consistency: criteria.consistency?.weight || 0,
      relevance: criteria.relevance?.weight || 0,
      completeness: criteria.completeness?.weight || 0,
    };

    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    
    const overallScore = totalWeight > 0 
      ? (accuracy * weights.accuracy + 
         consistency * weights.consistency + 
         relevance * weights.relevance + 
         completeness * weights.completeness) / totalWeight
      : 0;

    return {
      accuracy,
      consistency,
      relevance,
      completeness,
      responseTime,
      overallScore,
    };
  }

  // Predefined evaluators for common use cases
  static createAccuracyEvaluators() {
    return {
      // For JSON structure comparison
      jsonStructure: (actual: any, expected: any): number => {
        try {
          const actualKeys = Object.keys(actual || {}).sort();
          const expectedKeys = Object.keys(expected || {}).sort();
          
          const intersection = actualKeys.filter(key => expectedKeys.includes(key));
          const union = [...new Set([...actualKeys, ...expectedKeys])];
          
          return intersection.length / union.length;
        } catch {
          return 0;
        }
      },

      // For text similarity
      textSimilarity: (actual: string, expected: string): number => {
        if (!actual || !expected) return 0;
        
        const actualWords = actual.toLowerCase().split(/\s+/);
        const expectedWords = expected.toLowerCase().split(/\s+/);
        
        const intersection = actualWords.filter(word => expectedWords.includes(word));
        const union = [...new Set([...actualWords, ...expectedWords])];
        
        return intersection.length / union.length;
      },

      // For array content comparison
      arrayContent: (actual: any[], expected: any[]): number => {
        if (!Array.isArray(actual) || !Array.isArray(expected)) return 0;
        
        const actualSet = new Set(actual.map(item => JSON.stringify(item)));
        const expectedSet = new Set(expected.map(item => JSON.stringify(item)));
        
        const intersection = [...actualSet].filter(item => expectedSet.has(item));
        const union = [...new Set([...actualSet, ...expectedSet])];
        
        return intersection.length / union.length;
      },

      // For numeric values with tolerance
      numericTolerance: (tolerance: number) => (actual: number, expected: number): number => {
        if (typeof actual !== 'number' || typeof expected !== 'number') return 0;
        
        const diff = Math.abs(actual - expected);
        const maxValue = Math.max(Math.abs(actual), Math.abs(expected));
        
        if (maxValue === 0) return 1; // Both are zero
        
        const relativeError = diff / maxValue;
        return Math.max(0, 1 - relativeError / tolerance);
      },
    };
  }

  static createConsistencyEvaluators() {
    return {
      // For identical results
      identical: (results: any[]): number => {
        if (results.length <= 1) return 1;
        
        const first = JSON.stringify(results[0]);
        const allIdentical = results.every(result => JSON.stringify(result) === first);
        
        return allIdentical ? 1 : 0;
      },

      // For similar structure
      structuralSimilarity: (results: any[]): number => {
        if (results.length <= 1) return 1;
        
        const structures = results.map(result => {
          if (typeof result === 'object' && result !== null) {
            return Object.keys(result).sort().join(',');
          }
          return typeof result;
        });
        
        const uniqueStructures = new Set(structures);
        return uniqueStructures.size === 1 ? 1 : 0;
      },

      // For numeric variance
      numericVariance: (maxVariance: number) => (results: number[]): number => {
        if (results.length <= 1) return 1;
        
        const mean = results.reduce((sum, val) => sum + val, 0) / results.length;
        const variance = results.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / results.length;
        
        return Math.max(0, 1 - variance / maxVariance);
      },
    };
  }

  static createRelevanceEvaluators() {
    return {
      // For keyword presence
      keywordPresence: (keywords: string[]) => (input: any, output: any): number => {
        const outputText = JSON.stringify(output).toLowerCase();
        const presentKeywords = keywords.filter(keyword => 
          outputText.includes(keyword.toLowerCase())
        );
        
        return presentKeywords.length / keywords.length;
      },

      // For input-output relationship
      inputOutputRelation: (relationChecker: (input: any, output: any) => boolean) => 
        (input: any, output: any): number => {
          try {
            return relationChecker(input, output) ? 1 : 0;
          } catch {
            return 0;
          }
        },
    };
  }

  static createCompletenessEvaluators() {
    return {
      // For required fields
      requiredFields: (requiredFields: string[]) => (output: any): number => {
        if (typeof output !== 'object' || output === null) return 0;
        
        const presentFields = requiredFields.filter(field => 
          output.hasOwnProperty(field) && output[field] !== null && output[field] !== undefined
        );
        
        return presentFields.length / requiredFields.length;
      },

      // For minimum content length
      minimumLength: (minLength: number) => (output: any): number => {
        const content = typeof output === 'string' ? output : JSON.stringify(output);
        return content.length >= minLength ? 1 : content.length / minLength;
      },

      // For array minimum size
      minimumArraySize: (minSize: number) => (output: any): number => {
        if (!Array.isArray(output)) return 0;
        return output.length >= minSize ? 1 : output.length / minSize;
      },
    };
  }

  async runBatchQualityTests(
    testCases: AITestCase[],
    aiFunction: (input: any) => Promise<any>
  ): Promise<AIQualityTestResult[]> {
    const results: AIQualityTestResult[] = [];
    
    for (const testCase of testCases) {
      const result = await this.runQualityTest(testCase, aiFunction);
      results.push(result);
    }
    
    return results;
  }

  generateQualityReport(results: AIQualityTestResult[]): string {
    const report = ['# AI Quality Test Report', ''];
    
    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;
    const overallPassRate = (passedTests / totalTests) * 100;
    
    report.push(`## Summary`);
    report.push(`- Total Tests: ${totalTests}`);
    report.push(`- Passed: ${passedTests}`);
    report.push(`- Failed: ${totalTests - passedTests}`);
    report.push(`- Pass Rate: ${overallPassRate.toFixed(1)}%`);
    report.push('');

    // Calculate average metrics
    const avgMetrics = results.reduce((acc, result) => {
      acc.accuracy += result.metrics.accuracy;
      acc.consistency += result.metrics.consistency;
      acc.relevance += result.metrics.relevance;
      acc.completeness += result.metrics.completeness;
      acc.responseTime += result.metrics.responseTime;
      acc.overallScore += result.metrics.overallScore;
      return acc;
    }, {
      accuracy: 0,
      consistency: 0,
      relevance: 0,
      completeness: 0,
      responseTime: 0,
      overallScore: 0,
    });

    Object.keys(avgMetrics).forEach(key => {
      (avgMetrics as any)[key] /= totalTests;
    });

    report.push(`## Average Metrics`);
    report.push(`- Accuracy: ${(avgMetrics.accuracy * 100).toFixed(1)}%`);
    report.push(`- Consistency: ${(avgMetrics.consistency * 100).toFixed(1)}%`);
    report.push(`- Relevance: ${(avgMetrics.relevance * 100).toFixed(1)}%`);
    report.push(`- Completeness: ${(avgMetrics.completeness * 100).toFixed(1)}%`);
    report.push(`- Average Response Time: ${avgMetrics.responseTime.toFixed(0)}ms`);
    report.push(`- Overall Score: ${(avgMetrics.overallScore * 100).toFixed(1)}%`);
    report.push('');

    // Individual test results
    report.push(`## Individual Test Results`);
    results.forEach(result => {
      const { testCase, metrics, passed, details } = result;
      const status = passed ? '✅' : '❌';
      
      report.push(`### ${status} ${testCase.name}`);
      report.push(`- Overall Score: ${(metrics.overallScore * 100).toFixed(1)}%`);
      report.push(`- Response Time: ${metrics.responseTime}ms`);
      
      if (details.errors.length > 0) {
        report.push(`- Errors: ${details.errors.length}`);
        details.errors.slice(0, 3).forEach(error => {
          report.push(`  - ${error.message}`);
        });
      }
      
      report.push('');
    });

    return report.join('\n');
  }
}