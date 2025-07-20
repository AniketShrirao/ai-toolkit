// Test file to verify interface imports work correctly
import type { 
  QueueManager, 
  OrchestrationEngine 
} from './packages/core/src/index.js';

import type { 
  OllamaService 
} from './packages/ollama-interface/src/index.js';

import type { 
  DocumentAnalyzer 
} from './packages/document-analyzer/src/index.js';

import type { 
  EstimationEngine 
} from './packages/estimation-engine/src/index.js';

import type { 
  WorkflowEngine 
} from './packages/workflow-engine/src/index.js';

import type {
  ProcessedDocument,
  Requirement,
  ProjectEstimate,
  WorkflowDefinition
} from './packages/shared/src/index.js';

// Test that we can use the interfaces for type checking
const testFunction = (
  queueManager: QueueManager,
  orchestrationEngine: OrchestrationEngine,
  ollamaService: OllamaService,
  documentAnalyzer: DocumentAnalyzer,
  estimationEngine: EstimationEngine,
  workflowEngine: WorkflowEngine
) => {
  console.log('All interfaces are properly typed and accessible!');
};

export { testFunction };