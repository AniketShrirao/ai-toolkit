export class DocumentAnalyzerImpl {
    ollamaService;
    analysisPreferences = {
        summaryStyle: "business",
        detailLevel: "standard",
    };
    constructor(ollamaService) {
        this.ollamaService = ollamaService;
    }
    async analyzeStructure(document, options) {
        const content = document.content.text;
        const prompt = `Analyze the structure of the following document and return a JSON object with the following format:
{
  "sections": [{"id": "string", "title": "string", "level": number, "content": "string"}],
  "headings": [{"level": number, "text": "string"}],
  "paragraphs": number,
  "lists": number,
  "tables": number,
  "images": number
}

Document content:
${content}`;
        try {
            const response = await this.ollamaService.generateText(prompt, {
                temperature: 0.3,
                maxTokens: 2000,
            });
            const parsed = this.parseJsonResponse(response);
            return {
                sections: parsed.sections || [],
                headings: parsed.headings || [],
                paragraphs: parsed.paragraphs || this.countParagraphs(content),
                lists: parsed.lists || this.countLists(content),
                tables: document.content.tables?.length || 0,
                images: document.content.images?.length || 0,
            };
        }
        catch (error) {
            // Fallback to basic structure analysis
            return this.performBasicStructureAnalysis(document);
        }
    }
    async extractRequirements(document, options) {
        const content = document.content.text;
        const prompt = `Extract all requirements from the following document. Categorize them as functional or non-functional requirements.
Return a JSON object with this format:
{
  "functional": [
    {
      "id": "string",
      "type": "functional",
      "priority": "high|medium|low",
      "description": "string",
      "acceptanceCriteria": ["string"],
      "complexity": number (1-10),
      "estimatedHours": number,
      "source": "string",
      "category": "string"
    }
  ],
  "nonFunctional": [
    {
      "id": "string", 
      "type": "non-functional",
      "priority": "high|medium|low",
      "description": "string",
      "acceptanceCriteria": ["string"],
      "complexity": number (1-10),
      "estimatedHours": number,
      "source": "string",
      "category": "string"
    }
  ]
}

Functional requirements describe what the system should do (features, functionality).
Non-functional requirements describe how the system should perform (performance, security, usability).

Document content:
${content}`;
        try {
            const response = await this.ollamaService.generateText(prompt, {
                temperature: 0.2,
                maxTokens: 3000,
            });
            const parsed = this.parseJsonResponse(response);
            const functional = this.validateRequirements(parsed.functional || []);
            const nonFunctional = this.validateRequirements(parsed.nonFunctional || []);
            return {
                functional,
                nonFunctional,
                totalCount: functional.length + nonFunctional.length,
            };
        }
        catch (error) {
            // Fallback to basic requirement extraction
            return this.performBasicRequirementExtraction(content);
        }
    }
    async categorizeContent(content, options) {
        const prompt = `Analyze the following content and categorize it. Return a JSON array of categories with this format:
[
  {
    "type": "string (e.g., 'technical-specification', 'business-requirements', 'user-story', 'process-description')",
    "confidence": number (0-1),
    "description": "string explaining why this category applies"
  }
]

Content:
${content}`;
        try {
            const response = await this.ollamaService.generateText(prompt, {
                temperature: 0.3,
                maxTokens: 1000,
            });
            const parsed = this.parseJsonResponse(response);
            return Array.isArray(parsed) ? parsed : [parsed];
        }
        catch (error) {
            // Fallback to basic categorization
            return this.performBasicContentCategorization(content);
        }
    }
    async identifyActionItems(content, options) {
        const prompt = `Identify all action items, tasks, and deliverables from the following content. Pay special attention to deadlines, dates, and priority indicators. Return a JSON array with this format:
[
  {
    "id": "string",
    "description": "string",
    "priority": "critical|high|medium|low",
    "deadline": "ISO date string or null (look for dates like 'by March 1st', 'due February 15th', 'before Q2', etc.)",
    "assignee": "string or null (look for 'assigned to', 'responsible:', etc.)",
    "status": "pending"
  }
]

Look for action indicators:
- "must do", "should implement", "need to", "action required", "deliverable", "task"
- "complete by", "due", "deadline", "before", "by [date]"
- Priority words: "critical", "urgent", "high priority", "important", "low priority"
- Assignment: "assigned to", "responsible for", "owner:", "lead:"

Content:
${content}`;
        try {
            const response = await this.ollamaService.generateText(prompt, {
                temperature: 0.3,
                maxTokens: 2000,
            });
            const parsed = this.parseJsonResponse(response);
            return Array.isArray(parsed) ? this.validateActionItems(parsed) : [];
        }
        catch (error) {
            // Fallback to basic action item extraction
            return this.performBasicActionItemExtraction(content);
        }
    }
    async extractKeyPoints(content, options) {
        const prompt = `Extract the most important key points from the following content. Return a JSON array with this format:
[
  {
    "id": "string",
    "text": "string",
    "importance": "high|medium|low",
    "category": "string (e.g., 'requirement', 'constraint', 'assumption', 'risk')",
    "context": "string (optional additional context)"
  }
]

Focus on the most critical information that someone would need to understand the document.

Content:
${content}`;
        try {
            const response = await this.ollamaService.generateText(prompt, {
                temperature: 0.3,
                maxTokens: 2000,
            });
            const parsed = this.parseJsonResponse(response);
            return Array.isArray(parsed) ? this.validateKeyPoints(parsed) : [];
        }
        catch (error) {
            // Fallback to basic key point extraction
            return this.performBasicKeyPointExtraction(content);
        }
    }
    async generateSummary(content, length, options) {
        const lengthInstructions = {
            short: "in 2-3 sentences (50-100 words)",
            medium: "in 1-2 paragraphs (150-300 words)",
            long: "in 3-4 paragraphs with detailed analysis (400-600 words)",
        };
        const styleInstruction = this.analysisPreferences.summaryStyle === "technical"
            ? "Focus on technical details and implementation aspects."
            : this.analysisPreferences.summaryStyle === "executive"
                ? "Focus on high-level business impact and strategic implications."
                : "Balance technical and business perspectives.";
        const prompt = `Create a ${length} summary of the following content ${lengthInstructions[length]}. ${styleInstruction}

Also extract 3-5 key points as bullet points.

Return a JSON object with this format:
{
  "content": "string (the summary text)",
  "keyPoints": ["string", "string", ...],
  "wordCount": number
}

Content:
${content}`;
        try {
            const response = await this.ollamaService.generateText(prompt, {
                temperature: 0.4,
                maxTokens: 1500,
            });
            const parsed = this.parseJsonResponse(response);
            return {
                length,
                content: parsed.content || "",
                keyPoints: parsed.keyPoints || [],
                wordCount: parsed.wordCount || this.countWords(parsed.content || ""),
            };
        }
        catch (error) {
            // Fallback to basic summarization
            return this.performBasicSummarization(content, length);
        }
    }
    async performFullAnalysis(document, options) {
        // Perform all analyses in parallel for efficiency
        const [structure, requirements, keyPoints, actionItems, summary, contentCategories,] = await Promise.all([
            this.analyzeStructure(document, options),
            this.extractRequirements(document, options),
            this.extractKeyPoints(document.content.text, options),
            this.identifyActionItems(document.content.text, options),
            this.generateSummary(document.content.text, "medium", options),
            this.categorizeContent(document.content.text, options),
        ]);
        return {
            structure,
            requirements,
            keyPoints,
            actionItems,
            summary,
            contentCategories,
        };
    }
    async buildContext(documents, options) {
        // Enhanced context building with relationship analysis
        const contextParts = await Promise.all(documents.map(async (doc) => {
            const title = doc.metadata.title || `Document ${doc.id}`;
            const summary = doc.analysis?.summary?.content ||
                (await this.generateSummary(doc.content.text, "short", options))
                    .content;
            // Extract key themes and topics for relationship mapping
            const keyPoints = doc.analysis?.keyPoints ||
                (await this.extractKeyPoints(doc.content.text, options));
            const themes = keyPoints
                .slice(0, 3)
                .map((kp) => kp.category)
                .join(", ");
            return `Document: ${title}
Type: ${this.inferDocumentType(doc)}
Key Themes: ${themes}
Summary: ${summary}
Key Requirements: ${doc.analysis?.requirements?.totalCount || 0}
Action Items: ${doc.analysis?.actionItems?.length || 0}`;
        }));
        // Add relationship analysis between documents
        const relationships = await this.analyzeDocumentRelationships(documents);
        let contextString = contextParts.join("\n---\n");
        if (relationships.length > 0) {
            contextString += "\n\n=== DOCUMENT RELATIONSHIPS ===\n";
            contextString += relationships.join("\n");
        }
        return contextString;
    }
    async maintainContext(previousContext, newDocument, options) {
        const newSummary = newDocument.analysis?.summary?.content ||
            (await this.generateSummary(newDocument.content.text, "short", options));
        const title = newDocument.metadata.title || `Document ${newDocument.id}`;
        const docType = this.inferDocumentType(newDocument);
        // Enhanced context with document relationships
        const keyPoints = newDocument.analysis?.keyPoints ||
            (await this.extractKeyPoints(newDocument.content.text, options));
        const themes = keyPoints
            .slice(0, 3)
            .map((kp) => kp.category)
            .join(", ");
        const newContext = `Document: ${title}
Type: ${docType}
Key Themes: ${themes}
Summary: ${typeof newSummary === "string" ? newSummary : newSummary.content}
Key Requirements: ${newDocument.analysis?.requirements?.totalCount || 0}
Action Items: ${newDocument.analysis?.actionItems?.length || 0}`;
        // Analyze how this document relates to previous context
        const relationshipAnalysis = await this.analyzeContextRelationship(previousContext, newDocument, options);
        let updatedContext = `${previousContext}\n---\n${newContext}`;
        if (relationshipAnalysis) {
            updatedContext += `\nRelationship: ${relationshipAnalysis}`;
        }
        return updatedContext;
    }
    // New method for analyzing relationships between documents
    async analyzeDocumentRelationships(documents) {
        if (documents.length < 2)
            return [];
        const relationships = [];
        // Simple keyword-based relationship detection
        for (let i = 0; i < documents.length; i++) {
            for (let j = i + 1; j < documents.length; j++) {
                const doc1 = documents[i];
                const doc2 = documents[j];
                const relationship = this.detectDocumentRelationship(doc1, doc2);
                if (relationship) {
                    relationships.push(relationship);
                }
            }
        }
        return relationships;
    }
    // New method for analyzing how a new document relates to existing context
    async analyzeContextRelationship(previousContext, newDocument, options) {
        try {
            const prompt = `Analyze how the new document relates to the existing context. Identify connections, dependencies, or conflicts.

Existing Context:
${previousContext.substring(0, 1500)}

New Document: ${newDocument.metadata.title || newDocument.id}
Content Summary: ${newDocument.content.text.substring(0, 500)}

Return a brief relationship analysis (1-2 sentences) or "No significant relationship" if none exists.`;
            const response = await this.ollamaService.generateText(prompt, {
                temperature: 0.3,
                maxTokens: 200,
            });
            return response.trim() !== "No significant relationship"
                ? response.trim()
                : null;
        }
        catch (error) {
            return null;
        }
    }
    // Helper method to detect relationships between two documents
    detectDocumentRelationship(doc1, doc2) {
        const title1 = doc1.metadata.title || doc1.id;
        const title2 = doc2.metadata.title || doc2.id;
        // Check for common themes in key points
        const keyPoints1 = doc1.analysis?.keyPoints?.map((kp) => kp.category.toLowerCase()) || [];
        const keyPoints2 = doc2.analysis?.keyPoints?.map((kp) => kp.category.toLowerCase()) || [];
        const commonThemes = keyPoints1.filter((theme) => keyPoints2.includes(theme));
        if (commonThemes.length > 0) {
            return `${title1} and ${title2} share common themes: ${commonThemes.join(", ")}`;
        }
        // Check for requirement dependencies
        const req1Count = doc1.analysis?.requirements?.totalCount || 0;
        const req2Count = doc2.analysis?.requirements?.totalCount || 0;
        if (req1Count > 0 && req2Count > 0) {
            const type1 = this.inferDocumentType(doc1);
            const type2 = this.inferDocumentType(doc2);
            if ((type1 === "requirements" && type2 === "technical") ||
                (type1 === "technical" && type2 === "requirements")) {
                return `${title1} (${type1}) and ${title2} (${type2}) appear to be related implementation documents`;
            }
        }
        return null;
    }
    // Helper method to infer document type from content and metadata
    inferDocumentType(document) {
        const title = (document.metadata.title || "").toLowerCase();
        const content = document.content.text.toLowerCase();
        // Requirements documents - check first as they're most specific
        if (title.includes("requirement") ||
            (content.includes("shall") && content.includes("must")) ||
            (title.includes("system") && title.includes("requirement"))) {
            return "requirements";
        }
        // Technical documents - check title first, then content
        if (title.includes("technical") ||
            title.includes("architecture") ||
            title.includes("implementation") ||
            title.includes("specification") ||
            content.includes("implementation") ||
            content.includes("database") ||
            content.includes("api") ||
            content.includes("ci/cd") ||
            content.includes("pipeline")) {
            return "technical";
        }
        // Proposal documents
        if (title.includes("proposal") ||
            content.includes("budget") ||
            content.includes("cost") ||
            content.includes("roi") ||
            content.includes("investment")) {
            return "proposal";
        }
        // Design documents
        if (title.includes("design") ||
            content.includes("wireframe") ||
            content.includes("mockup") ||
            content.includes("ui") ||
            content.includes("ux")) {
            return "design";
        }
        return "general";
    }
    async assessDocumentQuality(document) {
        const content = document.content.text;
        const prompt = `Assess the quality of the following document on a scale of 0-1 for each criterion:
- Clarity: How clear and understandable is the content?
- Completeness: How complete and comprehensive is the information?
- Structure: How well-organized and structured is the document?

Return a JSON object with this format:
{
  "clarity": number (0-1),
  "completeness": number (0-1), 
  "structure": number (0-1),
  "suggestions": ["string", "string", ...]
}

Document content:
${content.substring(0, 2000)}...`;
        try {
            const response = await this.ollamaService.generateText(prompt, {
                temperature: 0.3,
                maxTokens: 1000,
            });
            const parsed = this.parseJsonResponse(response);
            const overall = (parsed.clarity + parsed.completeness + parsed.structure) / 3;
            return {
                clarity: parsed.clarity || 0.5,
                completeness: parsed.completeness || 0.5,
                structure: parsed.structure || 0.5,
                overall,
                suggestions: parsed.suggestions || [],
            };
        }
        catch (error) {
            return {
                clarity: 0.5,
                completeness: 0.5,
                structure: 0.5,
                overall: 0.5,
                suggestions: [
                    "Unable to assess document quality due to analysis error",
                ],
            };
        }
    }
    async analyzeBatch(documents, options) {
        // Process documents in batches to avoid overwhelming the AI service
        const batchSize = 3;
        const results = [];
        for (let i = 0; i < documents.length; i += batchSize) {
            const batch = documents.slice(i, i + batchSize);
            const batchResults = await Promise.all(batch.map((doc) => this.performFullAnalysis(doc, options)));
            results.push(...batchResults);
        }
        return results;
    }
    setAnalysisPreferences(preferences) {
        this.analysisPreferences = { ...this.analysisPreferences, ...preferences };
    }
    // Private helper methods
    parseJsonResponse(response) {
        try {
            // Try to extract JSON from the response
            const jsonMatch = response.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return JSON.parse(response);
        }
        catch (error) {
            throw new Error(`Failed to parse JSON response: ${response}`);
        }
    }
    performBasicStructureAnalysis(document) {
        const content = document.content.text;
        const lines = content.split("\n");
        const headings = [];
        const sections = [];
        lines.forEach((line, index) => {
            const trimmed = line.trim();
            if (trimmed.match(/^#{1,6}\s/)) {
                const level = (trimmed.match(/^#+/) || [""])[0].length;
                headings.push({
                    level,
                    text: trimmed.replace(/^#+\s*/, ""),
                    page: Math.floor(index / 50) + 1,
                });
            }
        });
        return {
            sections,
            headings,
            paragraphs: this.countParagraphs(content),
            lists: this.countLists(content),
            tables: document.content.tables?.length || 0,
            images: document.content.images?.length || 0,
        };
    }
    performBasicRequirementExtraction(content) {
        const requirementKeywords = [
            "must",
            "shall",
            "should",
            "will",
            "need to",
            "required to",
            "system must",
            "application should",
            "user can",
            "system shall",
        ];
        const sentences = content
            .split(/[.!?]+/)
            .filter((s) => s.trim().length > 10);
        const requirements = [];
        sentences.forEach((sentence, index) => {
            const lowerSentence = sentence.toLowerCase();
            if (requirementKeywords.some((keyword) => lowerSentence.includes(keyword))) {
                const isNonFunctional = lowerSentence.includes("performance") ||
                    lowerSentence.includes("security") ||
                    lowerSentence.includes("usability") ||
                    lowerSentence.includes("reliability");
                requirements.push({
                    id: `req-${index + 1}`,
                    type: isNonFunctional ? "non-functional" : "functional",
                    priority: "medium",
                    description: sentence.trim(),
                    acceptanceCriteria: [],
                    complexity: 3,
                    estimatedHours: 8,
                });
            }
        });
        const functional = requirements.filter((r) => r.type === "functional");
        const nonFunctional = requirements.filter((r) => r.type === "non-functional");
        return {
            functional,
            nonFunctional,
            totalCount: requirements.length,
        };
    }
    performBasicContentCategorization(content) {
        const categories = [];
        const lowerContent = content.toLowerCase();
        if (lowerContent.includes("requirement") ||
            lowerContent.includes("shall") ||
            lowerContent.includes("must")) {
            categories.push({
                type: "business-requirements",
                confidence: 0.7,
                description: "Contains requirement-related language",
            });
        }
        if (lowerContent.includes("technical") ||
            lowerContent.includes("system") ||
            lowerContent.includes("architecture")) {
            categories.push({
                type: "technical-specification",
                confidence: 0.6,
                description: "Contains technical terminology",
            });
        }
        if (lowerContent.includes("user") ||
            lowerContent.includes("customer") ||
            lowerContent.includes("as a")) {
            categories.push({
                type: "user-story",
                confidence: 0.6,
                description: "Contains user-focused language",
            });
        }
        return categories.length > 0
            ? categories
            : [
                {
                    type: "general-document",
                    confidence: 0.5,
                    description: "General business document",
                },
            ];
    }
    performBasicActionItemExtraction(content) {
        return this.performEnhancedActionItemExtraction(content);
    }
    performEnhancedActionItemExtraction(content) {
        const actionKeywords = [
            "action required",
            "must do",
            "need to",
            "should implement",
            "deliverable",
            "task",
            "todo",
            "action item",
            "complete by",
            "due",
            "deadline",
            "implement",
            "develop",
            "create",
            "build",
            "set up",
            "conduct",
        ];
        const priorityKeywords = {
            critical: ["critical", "urgent", "asap", "immediately"],
            high: ["high priority", "important", "must", "shall", "required"],
            medium: ["should", "need to", "recommended"],
            low: ["could", "optional", "nice to have", "low priority"],
        };
        const sentences = content
            .split(/[.!?]+/)
            .filter((s) => s.trim().length > 10);
        const actionItems = [];
        sentences.forEach((sentence, index) => {
            const lowerSentence = sentence.toLowerCase();
            if (actionKeywords.some((keyword) => lowerSentence.includes(keyword))) {
                // Determine priority based on keywords
                let priority = "medium";
                for (const [level, keywords] of Object.entries(priorityKeywords)) {
                    if (keywords.some((keyword) => lowerSentence.includes(keyword))) {
                        priority = level;
                        break;
                    }
                }
                // Extract potential deadline
                let deadline;
                const datePatterns = [
                    /by\s+(\w+\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?)/i,
                    /due\s+(\w+\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?)/i,
                    /before\s+(\w+\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?)/i,
                    /deadline\s+(\w+\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?)/i,
                    /(\d{1,2}\/\d{1,2}\/\d{4})/,
                    /(\d{4}-\d{2}-\d{2})/,
                ];
                for (const pattern of datePatterns) {
                    const match = sentence.match(pattern);
                    if (match) {
                        try {
                            deadline = new Date(match[1]);
                            if (isNaN(deadline.getTime())) {
                                deadline = undefined;
                            }
                        }
                        catch {
                            deadline = undefined;
                        }
                        break;
                    }
                }
                // Extract potential assignee
                let assignee;
                const assigneePatterns = [
                    /assigned\s+to\s+([A-Za-z\s]+?)(?:\s|$|\.)/i,
                    /responsible\s*:\s*([A-Za-z\s]+?)(?:\s|$|\.)/i,
                    /owner\s*:\s*([A-Za-z\s]+?)(?:\s|$|\.)/i,
                    /lead\s*:\s*([A-Za-z\s]+?)(?:\s|$|\.)/i,
                ];
                for (const pattern of assigneePatterns) {
                    const match = sentence.match(pattern);
                    if (match) {
                        assignee = match[1].trim();
                        break;
                    }
                }
                actionItems.push({
                    id: `action-${index + 1}`,
                    description: sentence.trim(),
                    priority,
                    deadline,
                    assignee,
                    status: "pending",
                });
            }
        });
        return actionItems;
    }
    performBasicKeyPointExtraction(content) {
        const sentences = content
            .split(/[.!?]+/)
            .filter((s) => s.trim().length > 20);
        const keyPoints = [];
        // Take first few sentences as key points
        sentences.slice(0, 5).forEach((sentence, index) => {
            keyPoints.push({
                id: `key-${index + 1}`,
                text: sentence.trim(),
                importance: "medium",
                category: "general",
            });
        });
        return keyPoints;
    }
    performBasicSummarization(content, length) {
        const sentences = content
            .split(/[.!?]+/)
            .filter((s) => s.trim().length > 10);
        const targetSentences = length === "short" ? 2 : length === "medium" ? 4 : 6;
        const summaryContent = sentences.slice(0, targetSentences).join(". ") + ".";
        const keyPoints = sentences.slice(0, 3).map((s) => s.trim());
        return {
            length,
            content: summaryContent,
            keyPoints,
            wordCount: this.countWords(summaryContent),
        };
    }
    validateRequirements(requirements) {
        return requirements.map((req, index) => ({
            id: req.id || `req-${index + 1}`,
            type: req.type === "functional" || req.type === "non-functional"
                ? req.type
                : "functional",
            priority: req.priority === "critical" ||
                req.priority === "high" ||
                req.priority === "medium" ||
                req.priority === "low"
                ? req.priority
                : "medium",
            description: req.description || "",
            acceptanceCriteria: Array.isArray(req.acceptanceCriteria)
                ? req.acceptanceCriteria
                : [],
            complexity: typeof req.complexity === "number"
                ? Math.max(1, Math.min(10, req.complexity))
                : 3,
            estimatedHours: typeof req.estimatedHours === "number"
                ? Math.max(0, req.estimatedHours)
                : 8,
            source: req.source,
            category: req.category,
        }));
    }
    validateActionItems(items) {
        return items.map((item, index) => ({
            id: item.id || `action-${index + 1}`,
            description: item.description || "",
            priority: item.priority === "critical" ||
                item.priority === "high" ||
                item.priority === "medium" ||
                item.priority === "low"
                ? item.priority
                : "medium",
            deadline: item.deadline ? new Date(item.deadline) : undefined,
            assignee: item.assignee,
            status: "pending",
        }));
    }
    validateKeyPoints(points) {
        return points.map((point, index) => ({
            id: point.id || `key-${index + 1}`,
            text: point.text || "",
            importance: point.importance === "critical" ||
                point.importance === "high" ||
                point.importance === "medium" ||
                point.importance === "low"
                ? point.importance
                : "medium",
            category: point.category || "general",
            context: point.context,
        }));
    }
    countParagraphs(content) {
        return content.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length;
    }
    countLists(content) {
        const listItems = content.match(/^\s*[-*+]\s+/gm) || [];
        const numberedItems = content.match(/^\s*\d+\.\s+/gm) || [];
        return listItems.length + numberedItems.length;
    }
    countWords(text) {
        return text
            .trim()
            .split(/\s+/)
            .filter((word) => word.length > 0).length;
    }
}
//# sourceMappingURL=DocumentAnalyzerImpl.js.map