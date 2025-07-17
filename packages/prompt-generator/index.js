import { buildSummaryPrompt } from './templates/summarizer.js';
import { buildQnAPrompt } from './templates/qna.js';
import { buildTaggingPrompt } from './templates/tagger.js';

export function generatePrompt(type, normalizedContent) {
  switch (type) {
    case 'summary':
      return buildSummaryPrompt(normalizedContent);
    case 'qna':
      return buildQnAPrompt(normalizedContent);
    case 'tagger':
      return buildTaggingPrompt(normalizedContent);
    default:
      throw new Error(`❌ Unknown prompt type: ${type}`);
  }
}
