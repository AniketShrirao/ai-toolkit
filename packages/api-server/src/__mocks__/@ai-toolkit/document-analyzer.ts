export class DocumentAnalyzer {
  async analyzeDocument(filePath: string, analysisType: string) {
    return {
      structure: {
        sections: ["Introduction", "Requirements", "Conclusion"],
        pageCount: 10,
      },
      requirements: [
        {
          id: "1",
          type: "functional",
          priority: "high",
          description: "Mock requirement from document analysis",
          acceptanceCriteria: ["Mock criteria 1", "Mock criteria 2"],
          complexity: 5,
          estimatedHours: 20,
        },
      ],
      keyPoints: ["Key point 1", "Key point 2"],
      actionItems: [
        {
          id: "1",
          description: "Mock action item",
          priority: "high",
          dueDate: new Date(),
        },
      ],
      summary: {
        content: "Mock document summary",
        length: "medium",
      },
      contentCategories: ["business", "technical"],
    };
  }
}
