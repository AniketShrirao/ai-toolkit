export class PromptManagerImpl {
    templates = new Map();
    defaultContext = {
        maxTokens: 4096,
        currentTokens: 0,
        truncationStrategy: 'smart'
    };
    constructor() {
        this.initializeDefaultTemplates();
    }
    initializeDefaultTemplates() {
        // Requirements extraction template
        this.registerTemplate({
            id: 'requirements-extraction',
            name: 'Requirements Extraction',
            description: 'Extract functional and non-functional requirements from documents',
            analysisType: 'requirements',
            maxTokens: 2048,
            template: `You are an expert business analyst. Analyze the following document and extract all requirements.

Instructions:
- Identify both functional and non-functional requirements
- Categorize each requirement by type and priority
- Provide clear acceptance criteria for each requirement
- Format the output as a JSON array

Document Content:
{{content}}

Return a JSON array with this structure:
[
  {
    "id": "REQ-001",
    "type": "functional|non-functional",
    "priority": "high|medium|low",
    "description": "Clear requirement description",
    "acceptanceCriteria": ["Criterion 1", "Criterion 2"],
    "category": "authentication|ui|performance|security|etc",
    "complexity": 1-5,
    "estimatedHours": number
  }
]`,
            variables: [
                {
                    name: 'content',
                    type: 'string',
                    required: true,
                    description: 'The document content to analyze',
                    validation: { minLength: 10 }
                }
            ]
        });
        // Document summarization template
        this.registerTemplate({
            id: 'document-summary',
            name: 'Document Summarization',
            description: 'Generate comprehensive summaries of documents',
            analysisType: 'summary',
            maxTokens: 1024,
            template: `Provide a {{length}} summary of the following document.

{{#if includeKeyPoints}}
Include key points and action items.
{{/if}}

{{#if audience}}
Tailor the summary for: {{audience}}
{{/if}}

Document Content:
{{content}}

Summary Requirements:
- {{length}} length ({{lengthDescription}})
- Professional tone
- Focus on main objectives and outcomes
{{#if includeKeyPoints}}
- List key points and action items separately
{{/if}}`,
            variables: [
                {
                    name: 'content',
                    type: 'string',
                    required: true,
                    description: 'The document content to summarize'
                },
                {
                    name: 'length',
                    type: 'string',
                    required: true,
                    description: 'Summary length',
                    defaultValue: 'medium',
                    validation: { allowedValues: ['short', 'medium', 'long'] }
                },
                {
                    name: 'lengthDescription',
                    type: 'string',
                    required: false,
                    description: 'Description of the length requirement'
                },
                {
                    name: 'includeKeyPoints',
                    type: 'boolean',
                    required: false,
                    description: 'Whether to include key points and action items',
                    defaultValue: true
                },
                {
                    name: 'audience',
                    type: 'string',
                    required: false,
                    description: 'Target audience for the summary'
                }
            ]
        });
        // Project estimation template
        this.registerTemplate({
            id: 'project-estimation',
            name: 'Project Estimation',
            description: 'Generate project estimates based on requirements',
            analysisType: 'estimation',
            maxTokens: 2048,
            template: `You are an experienced project manager and software architect. Analyze the following requirements and provide a detailed project estimate.

Requirements:
{{requirements}}

{{#if historicalData}}
Historical Project Data:
{{historicalData}}
{{/if}}

{{#if constraints}}
Project Constraints:
{{constraints}}
{{/if}}

Provide a detailed estimate including:
1. Time estimation (hours/days)
2. Cost calculation (if hourly rate provided: $\{{hourlyRate}}/hour)
3. Risk assessment
4. Assumptions made
5. Breakdown by feature/component
6. Confidence level (0-1)

Return as JSON:
{
  "totalHours": number,
  "totalCost": number,
  "breakdown": [
    {
      "category": "string",
      "hours": number,
      "description": "string",
      "requirements": ["req-id-1", "req-id-2"]
    }
  ],
  "risks": [
    {
      "id": "string",
      "name": "string",
      "probability": 0-1,
      "impact": "high|medium|low",
      "description": "string",
      "mitigation": "string"
    }
  ],
  "assumptions": ["assumption 1", "assumption 2"],
  "confidence": 0-1
}`,
            variables: [
                {
                    name: 'requirements',
                    type: 'string',
                    required: true,
                    description: 'JSON string of requirements to estimate'
                },
                {
                    name: 'hourlyRate',
                    type: 'number',
                    required: false,
                    description: 'Hourly rate for cost calculation',
                    defaultValue: 100
                },
                {
                    name: 'historicalData',
                    type: 'string',
                    required: false,
                    description: 'Historical project data for reference'
                },
                {
                    name: 'constraints',
                    type: 'string',
                    required: false,
                    description: 'Project constraints and limitations'
                }
            ]
        });
        // Codebase analysis template
        this.registerTemplate({
            id: 'codebase-analysis',
            name: 'Codebase Analysis',
            description: 'Analyze codebase structure and provide insights',
            analysisType: 'codebase',
            maxTokens: 3072,
            template: `You are a senior software architect. Analyze the following codebase information and provide comprehensive insights.

Codebase Structure:
{{structure}}

{{#if dependencies}}
Dependencies:
{{dependencies}}
{{/if}}

{{#if metrics}}
Code Metrics:
{{metrics}}
{{/if}}

Analysis Focus:
{{#each focusAreas}}
- {{this}}
{{/each}}

Provide analysis covering:
1. Architecture patterns and design quality
2. Code organization and structure
3. Dependency management
4. Potential issues and technical debt
5. Security considerations
6. Performance implications
7. Maintainability assessment
8. Improvement recommendations

Format as structured analysis with clear sections and actionable recommendations.`,
            variables: [
                {
                    name: 'structure',
                    type: 'string',
                    required: true,
                    description: 'Codebase structure information'
                },
                {
                    name: 'dependencies',
                    type: 'string',
                    required: false,
                    description: 'Dependency information'
                },
                {
                    name: 'metrics',
                    type: 'string',
                    required: false,
                    description: 'Code quality metrics'
                },
                {
                    name: 'focusAreas',
                    type: 'array',
                    required: false,
                    description: 'Specific areas to focus analysis on',
                    defaultValue: ['architecture', 'security', 'performance', 'maintainability']
                }
            ]
        });
    }
    registerTemplate(template) {
        const validation = this.validateTemplate(template);
        if (!validation.valid) {
            throw new Error(`Invalid template: ${validation.errors.map(e => e.message).join(', ')}`);
        }
        this.templates.set(template.id, { ...template });
    }
    getTemplate(id) {
        return this.templates.get(id);
    }
    listTemplates(analysisType) {
        const templates = Array.from(this.templates.values());
        if (analysisType) {
            return templates.filter(t => t.analysisType === analysisType);
        }
        return templates;
    }
    updateTemplate(id, updates) {
        const existing = this.templates.get(id);
        if (!existing) {
            throw new Error(`Template with id '${id}' not found`);
        }
        const updated = { ...existing, ...updates };
        const validation = this.validateTemplate(updated);
        if (!validation.valid) {
            throw new Error(`Invalid template update: ${validation.errors.map(e => e.message).join(', ')}`);
        }
        this.templates.set(id, updated);
    }
    removeTemplate(id) {
        if (!this.templates.has(id)) {
            throw new Error(`Template with id '${id}' not found`);
        }
        this.templates.delete(id);
    }
    async renderPrompt(templateId, variables, context) {
        const template = this.getTemplate(templateId);
        if (!template) {
            throw new Error(`Template with id '${templateId}' not found`);
        }
        // Validate variables
        const validation = this.validateVariables(template, variables);
        if (!validation.valid) {
            throw new Error(`Invalid variables: ${validation.errors.map(e => e.message).join(', ')}`);
        }
        // Merge context with defaults
        const fullContext = {
            ...this.defaultContext,
            maxTokens: template.maxTokens || this.defaultContext.maxTokens,
            ...context
        };
        // Fill in default values for missing variables
        const processedVariables = this.processVariables(template, variables);
        // Render the template
        let content = this.renderTemplate(template.template, processedVariables);
        // Estimate tokens
        const tokenCount = this.estimateTokens(content);
        let truncated = false;
        // Truncate if necessary
        if (tokenCount > fullContext.maxTokens) {
            content = this.truncateContent(content, fullContext.maxTokens, fullContext.truncationStrategy);
            truncated = true;
        }
        return {
            content,
            tokenCount: this.estimateTokens(content),
            truncated,
            variables: processedVariables,
            template
        };
    }
    processVariables(template, variables) {
        const processed = { ...variables };
        // Fill in default values
        for (const variable of template.variables) {
            if (!(variable.name in processed) && variable.defaultValue !== undefined) {
                processed[variable.name] = variable.defaultValue;
            }
        }
        // Process special variables for length descriptions
        if (processed.length && !processed.lengthDescription) {
            const lengthDescriptions = {
                short: '2-3 sentences',
                medium: '1-2 paragraphs',
                long: '3-4 paragraphs with detailed analysis'
            };
            processed.lengthDescription = lengthDescriptions[processed.length] || '1-2 paragraphs';
        }
        return processed;
    }
    renderTemplate(template, variables) {
        let rendered = template;
        // Simple template rendering - replace {{variable}} patterns
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            rendered = rendered.replace(regex, String(value));
        }
        // Handle conditional blocks {{#if variable}}...{{/if}}
        rendered = this.processConditionals(rendered, variables);
        // Handle loops {{#each array}}...{{/each}}
        rendered = this.processLoops(rendered, variables);
        return rendered.trim();
    }
    processConditionals(template, variables) {
        const conditionalRegex = /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g;
        return template.replace(conditionalRegex, (match, variable, content) => {
            const value = variables[variable];
            return value ? content : '';
        });
    }
    processLoops(template, variables) {
        const loopRegex = /{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g;
        return template.replace(loopRegex, (match, variable, content) => {
            const array = variables[variable];
            if (!Array.isArray(array)) {
                return '';
            }
            return array.map(item => {
                return content.replace(/{{this}}/g, String(item));
            }).join('\n');
        });
    }
    estimateTokens(text) {
        // Rough estimation: 1 token ≈ 4 characters for English text
        // This is a simplified estimation - real tokenization would be more accurate
        return Math.ceil(text.length / 4);
    }
    truncateContent(content, maxTokens, strategy = 'smart') {
        const maxChars = maxTokens * 4; // Rough conversion
        if (content.length <= maxChars) {
            return content;
        }
        switch (strategy) {
            case 'start':
                return '...' + content.slice(content.length - maxChars + 3);
            case 'end':
                return content.slice(0, maxChars - 3) + '...';
            case 'middle':
                const halfChars = Math.floor((maxChars - 5) / 2);
                return content.slice(0, halfChars) + ' ... ' + content.slice(content.length - halfChars);
            case 'smart':
            default:
                return this.smartTruncate(content, maxChars);
        }
    }
    smartTruncate(content, maxChars) {
        if (content.length <= maxChars) {
            return content;
        }
        // Try to preserve important sections and cut less important ones
        const lines = content.split('\n');
        const importantKeywords = ['requirement', 'must', 'shall', 'should', 'error', 'critical', 'important'];
        // Score lines by importance
        const scoredLines = lines.map(line => ({
            line,
            score: this.scoreLineImportance(line, importantKeywords),
            length: line.length
        }));
        // Sort by importance (descending)
        scoredLines.sort((a, b) => b.score - a.score);
        // Select lines that fit within the limit
        let totalLength = 0;
        const selectedLines = [];
        for (const { line, length } of scoredLines) {
            if (totalLength + length + 1 <= maxChars - 3) { // +1 for newline, -3 for '...'
                selectedLines.push(line);
                totalLength += length + 1;
            }
        }
        // Restore original order for selected lines
        const result = lines.filter(line => selectedLines.includes(line)).join('\n');
        return result + (result.length < content.length ? '\n...' : '');
    }
    scoreLineImportance(line, keywords) {
        let score = 0;
        const lowerLine = line.toLowerCase();
        // Score based on keywords
        for (const keyword of keywords) {
            if (lowerLine.includes(keyword)) {
                score += 2;
            }
        }
        // Score based on structure
        if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
            score += 1; // List items
        }
        if (line.includes(':')) {
            score += 1; // Likely key-value or definition
        }
        if (line.length > 100) {
            score += 1; // Longer lines might be more detailed
        }
        return score;
    }
    async optimizePrompt(content, targetLength) {
        const originalLength = content.length;
        let optimized = content;
        const preservedKeywords = [];
        const removedSections = [];
        // Remove excessive whitespace
        optimized = optimized.replace(/\s+/g, ' ').trim();
        // Remove redundant phrases
        const redundantPhrases = [
            'please note that',
            'it should be noted that',
            'it is important to mention',
            'as mentioned before',
            'in other words'
        ];
        for (const phrase of redundantPhrases) {
            const regex = new RegExp(phrase, 'gi');
            if (optimized.match(regex)) {
                removedSections.push(phrase);
                optimized = optimized.replace(regex, '');
            }
        }
        // Preserve important keywords
        const importantKeywords = [
            'requirement', 'must', 'shall', 'should', 'critical', 'important',
            'error', 'warning', 'security', 'performance', 'user', 'system'
        ];
        for (const keyword of importantKeywords) {
            if (optimized.toLowerCase().includes(keyword.toLowerCase())) {
                preservedKeywords.push(keyword);
            }
        }
        // If target length specified, truncate further if needed
        if (targetLength && optimized.length > targetLength) {
            optimized = this.truncateContent(optimized, Math.ceil(targetLength / 4), 'smart');
        }
        const optimizedLength = optimized.length;
        const compressionRatio = originalLength > 0 ? optimizedLength / originalLength : 1;
        return {
            originalLength,
            optimizedLength,
            compressionRatio,
            preservedKeywords,
            removedSections
        };
    }
    validateTemplate(template) {
        const errors = [];
        const warnings = [];
        // Required fields
        if (!template.id) {
            errors.push({ field: 'id', message: 'Template ID is required', code: 'REQUIRED' });
        }
        if (!template.name) {
            errors.push({ field: 'name', message: 'Template name is required', code: 'REQUIRED' });
        }
        if (!template.template) {
            errors.push({ field: 'template', message: 'Template content is required', code: 'REQUIRED' });
        }
        if (!template.analysisType) {
            errors.push({ field: 'analysisType', message: 'Analysis type is required', code: 'REQUIRED' });
        }
        // Validate variables
        if (template.variables) {
            for (let i = 0; i < template.variables.length; i++) {
                const variable = template.variables[i];
                const fieldPrefix = `variables[${i}]`;
                if (!variable.name) {
                    errors.push({
                        field: `${fieldPrefix}.name`,
                        message: 'Variable name is required',
                        code: 'REQUIRED'
                    });
                }
                if (!variable.type) {
                    errors.push({
                        field: `${fieldPrefix}.type`,
                        message: 'Variable type is required',
                        code: 'REQUIRED'
                    });
                }
                // Check if variable is used in template
                if (variable.name && !template.template.includes(`{{${variable.name}}}`)) {
                    warnings.push({
                        field: `${fieldPrefix}.name`,
                        message: `Variable '${variable.name}' is defined but not used in template`,
                        suggestion: `Remove unused variable or add {{${variable.name}}} to template`
                    });
                }
            }
        }
        // Check for undefined variables in template
        const variableMatches = template.template.match(/{{(\w+)}}/g);
        if (variableMatches) {
            const definedVariables = new Set(template.variables?.map(v => v.name) || []);
            const usedVariables = new Set(variableMatches.map(match => match.replace(/[{}]/g, '')));
            // Add special variables that are valid in template contexts
            const specialVariables = new Set(['this']); // 'this' is valid in {{#each}} loops
            for (const usedVar of usedVariables) {
                if (!definedVariables.has(usedVar) && !specialVariables.has(usedVar)) {
                    errors.push({
                        field: 'template',
                        message: `Template uses undefined variable '${usedVar}'`,
                        code: 'UNDEFINED_VARIABLE'
                    });
                }
            }
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
    validateVariables(template, variables) {
        const errors = [];
        const warnings = [];
        for (const templateVar of template.variables) {
            const value = variables[templateVar.name];
            // Check required variables
            if (templateVar.required && (value === undefined || value === null || value === '')) {
                errors.push({
                    field: templateVar.name,
                    message: `Required variable '${templateVar.name}' is missing`,
                    code: 'REQUIRED'
                });
                continue;
            }
            // Skip validation if variable is not provided and not required
            if (value === undefined || value === null) {
                continue;
            }
            // Type validation
            if (!this.validateVariableType(value, templateVar.type)) {
                errors.push({
                    field: templateVar.name,
                    message: `Variable '${templateVar.name}' must be of type ${templateVar.type}`,
                    code: 'TYPE_MISMATCH'
                });
            }
            // Validation rules
            if (templateVar.validation) {
                const validation = templateVar.validation;
                if (typeof value === 'string') {
                    if (validation.minLength && value.length < validation.minLength) {
                        errors.push({
                            field: templateVar.name,
                            message: `Variable '${templateVar.name}' must be at least ${validation.minLength} characters`,
                            code: 'MIN_LENGTH'
                        });
                    }
                    if (validation.maxLength && value.length > validation.maxLength) {
                        errors.push({
                            field: templateVar.name,
                            message: `Variable '${templateVar.name}' must be at most ${validation.maxLength} characters`,
                            code: 'MAX_LENGTH'
                        });
                    }
                    if (validation.pattern) {
                        const regex = new RegExp(validation.pattern);
                        if (!regex.test(value)) {
                            errors.push({
                                field: templateVar.name,
                                message: `Variable '${templateVar.name}' does not match required pattern`,
                                code: 'PATTERN_MISMATCH'
                            });
                        }
                    }
                }
                if (validation.allowedValues && !validation.allowedValues.includes(value)) {
                    errors.push({
                        field: templateVar.name,
                        message: `Variable '${templateVar.name}' must be one of: ${validation.allowedValues.join(', ')}`,
                        code: 'INVALID_VALUE'
                    });
                }
            }
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
    validateVariableType(value, expectedType) {
        switch (expectedType) {
            case 'string':
                return typeof value === 'string';
            case 'number':
                return typeof value === 'number' && !isNaN(value);
            case 'boolean':
                return typeof value === 'boolean';
            case 'array':
                return Array.isArray(value);
            default:
                return true;
        }
    }
}
//# sourceMappingURL=PromptManagerImpl.js.map