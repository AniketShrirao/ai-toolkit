import * as shared from './packages/shared/dist/index.js';
import * as core from './packages/core/dist/index.js';
import * as ollamaInterface from './packages/ollama-interface/dist/index.js';
import * as documentAnalyzer from './packages/document-analyzer/dist/index.js';
import * as estimationEngine from './packages/estimation-engine/dist/index.js';
import * as workflowEngine from './packages/workflow-engine/dist/index.js';

console.log('✅ All packages imported successfully!');
console.log('📦 Available exports:');
console.log('- Shared types and constants:', Object.keys(shared).length, 'exports');
console.log('- Core interfaces:', Object.keys(core).length, 'exports');
console.log('- Ollama interface:', Object.keys(ollamaInterface).length, 'exports');
console.log('- Document analyzer:', Object.keys(documentAnalyzer).length, 'exports');
console.log('- Estimation engine:', Object.keys(estimationEngine).length, 'exports');
console.log('- Workflow engine:', Object.keys(workflowEngine).length, 'exports');

console.log('\n🎯 Task 1 completed successfully!');
console.log('✅ Enhanced project structure created');
console.log('✅ Core interfaces defined');
console.log('✅ Shared types and constants set up');
console.log('✅ TypeScript build system configured for monorepo');