import { describe, it, expect, beforeEach } from 'vitest';
import { PromptManagerImpl } from '../PromptManagerImpl.js';
import { PromptTemplate, PromptVariable } from '../../interfaces/PromptManager.js';

describe('PromptManagerImpl', () => {
  let promptManager: PromptManagerImpl;

  beforeEach(() => {
    promptManager = new PromptManagerImpl();
  });

  describe('Template Management', () => {
    it('should initialize with default templates', () => {
      const templates = promptManager.listTemplates();
      
      expect(templates.length).toBeGreaterThan(0);
      expect(templates.some(t => t.id === 'requirements-extraction')).toBe(true);
      expect(templates.some(t => t.id === 'document-summary')).toBe(true);
      expect(templates.some(t => t.id === 'project-estimation')).toBe(true);
      expect(templates.some(t => t.id === 'codebase-analysis')).toBe(true);
    });

    it('should register a new template', () => {
      const template: PromptTemplate = {
        id: 'test-template',
        name: 'Test Template',
        description: 'A test template',
        template: 'Hello {{name}}!',
        analysisType: 'summary',
        variables: [
          {
            name: 'name',
            type: 'string',
            required: true,
            description: 'Name to greet'
          }
        ]
      };

      promptManager.registerTemplate(template);
      const retrieved = promptManager.getTemplate('test-template');
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Test Template');
    });

    it('should throw error for invalid template', () => {
      const invalidTemplate: PromptTemplate = {
        id: '',
        name: 'Invalid Template',
        description: 'Missing required fields',
        template: 'Hello {{name}}!',
        analysisType: 'summary',
        variables: []
      };

      expect(() => promptManager.registerTemplate(invalidTemplate))
        .toThrow('Invalid template');
    });

    it('should update existing template', () => {
      const template: PromptTemplate = {
        id: 'update-test',
        name: 'Original Name',
        description: 'Original description',
        template: 'Hello {{name}}!',
        analysisType: 'summary',
        variables: [
          {
            name: 'name',
            type: 'string',
            required: true,
            description: 'Name to greet'
          }
        ]
      };

      promptManager.registerTemplate(template);
      promptManager.updateTemplate('update-test', { name: 'Updated Name' });
      
      const updated = promptManager.getTemplate('update-test');
      expect(updated?.name).toBe('Updated Name');
      expect(updated?.description).toBe('Original description'); // Should preserve other fields
    });

    it('should remove template', () => {
      const template: PromptTemplate = {
        id: 'remove-test',
        name: 'Remove Test',
        description: 'Template to be removed',
        template: 'Hello {{name}}!',
        analysisType: 'summary',
        variables: [
          {
            name: 'name',
            type: 'string',
            required: true,
            description: 'Name to greet'
          }
        ]
      };

      promptManager.registerTemplate(template);
      expect(promptManager.getTemplate('remove-test')).toBeDefined();
      
      promptManager.removeTemplate('remove-test');
      expect(promptManager.getTemplate('remove-test')).toBeUndefined();
    });

    it('should list templates by analysis type', () => {
      const summaryTemplates = promptManager.listTemplates('summary');
      const requirementTemplates = promptManager.listTemplates('requirements');
      
      expect(summaryTemplates.every(t => t.analysisType === 'summary')).toBe(true);
      expect(requirementTemplates.every(t => t.analysisType === 'requirements')).toBe(true);
      expect(summaryTemplates.length).toBeGreaterThan(0);
      expect(requirementTemplates.length).toBeGreaterThan(0);
    });
  });

  describe('Prompt Rendering', () => {
    beforeEach(() => {
      const testTemplate: PromptTemplate = {
        id: 'render-test',
        name: 'Render Test',
        description: 'Template for testing rendering',
        template: `Hello {{name}}!
{{#if includeAge}}
You are {{age}} years old.
{{/if}}
{{#each hobbies}}
- {{this}}
{{/each}}`,
        analysisType: 'summary',
        variables: [
          {
            name: 'name',
            type: 'string',
            required: true,
            description: 'Name to greet'
          },
          {
            name: 'age',
            type: 'number',
            required: false,
            description: 'Age of the person'
          },
          {
            name: 'includeAge',
            type: 'boolean',
            required: false,
            description: 'Whether to include age',
            defaultValue: false
          },
          {
            name: 'hobbies',
            type: 'array',
            required: false,
            description: 'List of hobbies',
            defaultValue: []
          }
        ]
      };

      promptManager.registerTemplate(testTemplate);
    });

    it('should render simple template with variables', async () => {
      const result = await promptManager.renderPrompt('render-test', {
        name: 'John'
      });

      expect(result.content).toContain('Hello John!');
      expect(result.content).not.toContain('You are');
      expect(result.truncated).toBe(false);
      expect(result.tokenCount).toBeGreaterThan(0);
    });

    it('should render template with conditionals', async () => {
      const result = await promptManager.renderPrompt('render-test', {
        name: 'John',
        age: 25,
        includeAge: true
      });

      expect(result.content).toContain('Hello John!');
      expect(result.content).toContain('You are 25 years old.');
    });

    it('should render template with loops', async () => {
      const result = await promptManager.renderPrompt('render-test', {
        name: 'John',
        hobbies: ['reading', 'coding', 'gaming']
      });

      expect(result.content).toContain('Hello John!');
      expect(result.content).toContain('- reading');
      expect(result.content).toContain('- coding');
      expect(result.content).toContain('- gaming');
    });

    it('should use default values for missing variables', async () => {
      const result = await promptManager.renderPrompt('render-test', {
        name: 'John'
      });

      expect(result.variables.includeAge).toBe(false);
      expect(result.variables.hobbies).toEqual([]);
    });

    it('should handle length description for summary templates', async () => {
      const result = await promptManager.renderPrompt('document-summary', {
        content: 'Test document content',
        length: 'short'
      });

      expect(result.variables.lengthDescription).toBe('2-3 sentences');
    });

    it('should truncate content when exceeding max tokens', async () => {
      // Create a template with very long content that will exceed token limit
      const longTemplate: PromptTemplate = {
        id: 'long-template',
        name: 'Long Template',
        description: 'Template with long content',
        template: 'A'.repeat(1000) + ' {{name}}', // Very long template
        analysisType: 'summary',
        variables: [
          {
            name: 'name',
            type: 'string',
            required: true,
            description: 'Name to include'
          }
        ]
      };

      promptManager.registerTemplate(longTemplate);
      
      const result = await promptManager.renderPrompt('long-template', {
        name: 'John'
      }, { maxTokens: 100 });

      expect(result.truncated).toBe(true);
      expect(result.tokenCount).toBeLessThanOrEqual(100);
    });
  });

  describe('Token Estimation and Truncation', () => {
    it('should estimate tokens correctly', () => {
      const text = 'This is a test sentence with multiple words.';
      const tokens = promptManager.estimateTokens(text);
      
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBe(Math.ceil(text.length / 4));
    });

    it('should truncate content from end', () => {
      const content = 'This is a long piece of content that needs to be truncated.';
      const truncated = promptManager.truncateContent(content, 10, 'end');
      
      expect(truncated).toContain('...');
      expect(truncated.length).toBeLessThanOrEqual(43); // 10 tokens * 4 chars + 3 for '...'
      expect(truncated.startsWith('This is')).toBe(true);
    });

    it('should truncate content from start', () => {
      const content = 'This is a long piece of content that needs to be truncated.';
      const truncated = promptManager.truncateContent(content, 10, 'start');
      
      expect(truncated).toContain('...');
      expect(truncated.length).toBeLessThanOrEqual(43);
      expect(truncated.endsWith('truncated.')).toBe(true);
    });

    it('should truncate content from middle', () => {
      const content = 'This is a long piece of content that needs to be truncated.';
      const truncated = promptManager.truncateContent(content, 10, 'middle');
      
      expect(truncated).toContain(' ... ');
      expect(truncated.length).toBeLessThanOrEqual(45); // 10 tokens * 4 chars + 5 for ' ... '
    });

    it('should perform smart truncation', () => {
      const content = `Important requirement: User must be able to login.
This is less important text.
Critical: System shall validate passwords.
Some other text that is not as important.`;
      
      const truncated = promptManager.truncateContent(content, 50, 'smart'); // Increased token limit
      
      expect(truncated).toContain('Important requirement');
      // Smart truncation should preserve important content, but exact content may vary
      expect(truncated.length).toBeLessThanOrEqual(200); // 50 tokens * 4 chars
    });

    it('should not truncate if content is within limit', () => {
      const content = 'Short content';
      const truncated = promptManager.truncateContent(content, 100, 'end');
      
      expect(truncated).toBe(content);
    });
  });

  describe('Prompt Optimization', () => {
    it('should optimize prompt by removing redundant phrases', async () => {
      const content = 'Please note that this is important. It should be noted that we need to be careful.';
      const optimization = await promptManager.optimizePrompt(content);
      
      expect(optimization.originalLength).toBeGreaterThan(optimization.optimizedLength);
      expect(optimization.compressionRatio).toBeLessThan(1);
      expect(optimization.removedSections).toContain('please note that');
      expect(optimization.removedSections).toContain('it should be noted that');
    });

    it('should preserve important keywords', async () => {
      const content = 'This requirement is critical for user security and system performance.';
      const optimization = await promptManager.optimizePrompt(content);
      
      expect(optimization.preservedKeywords).toContain('requirement');
      expect(optimization.preservedKeywords).toContain('critical');
      expect(optimization.preservedKeywords).toContain('user');
      expect(optimization.preservedKeywords).toContain('system');
      expect(optimization.preservedKeywords).toContain('security');
      expect(optimization.preservedKeywords).toContain('performance');
    });

    it('should truncate to target length if specified', async () => {
      const content = 'A'.repeat(1000);
      const optimization = await promptManager.optimizePrompt(content, 100);
      
      expect(optimization.optimizedLength).toBeLessThanOrEqual(100);
    });
  });

  describe('Template Validation', () => {
    it('should validate valid template', () => {
      const template: PromptTemplate = {
        id: 'valid-template',
        name: 'Valid Template',
        description: 'A valid template',
        template: 'Hello {{name}}!',
        analysisType: 'summary',
        variables: [
          {
            name: 'name',
            type: 'string',
            required: true,
            description: 'Name to greet'
          }
        ]
      };

      const validation = promptManager.validateTemplate(template);
      
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const template: PromptTemplate = {
        id: '',
        name: '',
        description: 'Missing required fields',
        template: '',
        analysisType: 'summary',
        variables: []
      };

      const validation = promptManager.validateTemplate(template);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.field === 'id')).toBe(true);
      expect(validation.errors.some(e => e.field === 'name')).toBe(true);
      expect(validation.errors.some(e => e.field === 'template')).toBe(true);
    });

    it('should detect undefined variables in template', () => {
      const template: PromptTemplate = {
        id: 'undefined-var-template',
        name: 'Undefined Variable Template',
        description: 'Template with undefined variable',
        template: 'Hello {{name}}! Your age is {{age}}.',
        analysisType: 'summary',
        variables: [
          {
            name: 'name',
            type: 'string',
            required: true,
            description: 'Name to greet'
          }
          // Missing 'age' variable definition
        ]
      };

      const validation = promptManager.validateTemplate(template);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.message.includes('undefined variable \'age\''))).toBe(true);
    });

    it('should warn about unused variables', () => {
      const template: PromptTemplate = {
        id: 'unused-var-template',
        name: 'Unused Variable Template',
        description: 'Template with unused variable',
        template: 'Hello {{name}}!',
        analysisType: 'summary',
        variables: [
          {
            name: 'name',
            type: 'string',
            required: true,
            description: 'Name to greet'
          },
          {
            name: 'unused',
            type: 'string',
            required: false,
            description: 'Unused variable'
          }
        ]
      };

      const validation = promptManager.validateTemplate(template);
      
      expect(validation.valid).toBe(true);
      expect(validation.warnings.some(w => w.message.includes('not used in template'))).toBe(true);
    });
  });

  describe('Variable Validation', () => {
    let testTemplate: PromptTemplate;

    beforeEach(() => {
      testTemplate = {
        id: 'var-validation-test',
        name: 'Variable Validation Test',
        description: 'Template for testing variable validation',
        template: 'Hello {{name}}! You are {{age}} years old. Active: {{active}}',
        analysisType: 'summary',
        variables: [
          {
            name: 'name',
            type: 'string',
            required: true,
            description: 'Name of the person',
            validation: { minLength: 2, maxLength: 50 }
          },
          {
            name: 'age',
            type: 'number',
            required: true,
            description: 'Age of the person'
          },
          {
            name: 'active',
            type: 'boolean',
            required: false,
            description: 'Whether the person is active',
            defaultValue: true
          },
          {
            name: 'status',
            type: 'string',
            required: false,
            description: 'Status of the person',
            validation: { allowedValues: ['active', 'inactive', 'pending'] }
          }
        ]
      };
    });

    it('should validate correct variables', () => {
      const variables = {
        name: 'John',
        age: 25,
        active: true,
        status: 'active'
      };

      const validation = promptManager.validateVariables(testTemplate, variables);
      
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect missing required variables', () => {
      const variables = {
        age: 25
        // Missing required 'name'
      };

      const validation = promptManager.validateVariables(testTemplate, variables);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.field === 'name' && e.code === 'REQUIRED')).toBe(true);
    });

    it('should detect type mismatches', () => {
      const variables = {
        name: 'John',
        age: 'twenty-five', // Should be number
        active: 'yes' // Should be boolean
      };

      const validation = promptManager.validateVariables(testTemplate, variables);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.field === 'age' && e.code === 'TYPE_MISMATCH')).toBe(true);
      expect(validation.errors.some(e => e.field === 'active' && e.code === 'TYPE_MISMATCH')).toBe(true);
    });

    it('should validate string length constraints', () => {
      const variables = {
        name: 'J', // Too short (minLength: 2)
        age: 25
      };

      const validation = promptManager.validateVariables(testTemplate, variables);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.field === 'name' && e.code === 'MIN_LENGTH')).toBe(true);
    });

    it('should validate allowed values', () => {
      const variables = {
        name: 'John',
        age: 25,
        status: 'invalid-status' // Not in allowedValues
      };

      const validation = promptManager.validateVariables(testTemplate, variables);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.field === 'status' && e.code === 'INVALID_VALUE')).toBe(true);
    });

    it('should allow optional variables to be missing', () => {
      const variables = {
        name: 'John',
        age: 25
        // Missing optional 'active' and 'status'
      };

      const validation = promptManager.validateVariables(testTemplate, variables);
      
      expect(validation.valid).toBe(true);
    });
  });

  describe('Default Templates', () => {
    it('should have requirements extraction template', () => {
      const template = promptManager.getTemplate('requirements-extraction');
      
      expect(template).toBeDefined();
      expect(template?.analysisType).toBe('requirements');
      expect(template?.variables.some(v => v.name === 'content')).toBe(true);
    });

    it('should have document summary template', () => {
      const template = promptManager.getTemplate('document-summary');
      
      expect(template).toBeDefined();
      expect(template?.analysisType).toBe('summary');
      expect(template?.variables.some(v => v.name === 'content')).toBe(true);
      expect(template?.variables.some(v => v.name === 'length')).toBe(true);
    });

    it('should have project estimation template', () => {
      const template = promptManager.getTemplate('project-estimation');
      
      expect(template).toBeDefined();
      expect(template?.analysisType).toBe('estimation');
      expect(template?.variables.some(v => v.name === 'requirements')).toBe(true);
    });

    it('should have codebase analysis template', () => {
      const template = promptManager.getTemplate('codebase-analysis');
      
      expect(template).toBeDefined();
      expect(template?.analysisType).toBe('codebase');
      expect(template?.variables.some(v => v.name === 'structure')).toBe(true);
    });
  });
});