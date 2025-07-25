export class DatabaseManager {
  private documents = new Map();
  private workflows = new Map();
  private estimations: any[] = [];

  async getDocuments(options: any = {}) {
    const { page = 1, limit = 10, projectId, status } = options;
    let docs = Array.from(this.documents.values());

    if (projectId) {
      docs = docs.filter((doc) => doc.projectId === projectId);
    }
    if (status) {
      docs = docs.filter((doc) => doc.status === status);
    }

    const total = docs.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedDocs = docs.slice(startIndex, endIndex);

    return {
      documents: paginatedDocs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getDocument(id: string) {
    return this.documents.get(id) || null;
  }

  async createDocument(data: any) {
    const document = {
      id: Math.random().toString(36).substr(2, 9),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.documents.set(document.id, document);
    return document;
  }

  async updateDocument(id: string, updates: any) {
    const document = this.documents.get(id);
    if (!document) return null;

    const updatedDocument = {
      ...document,
      ...updates,
      updatedAt: new Date(),
    };

    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }

  async deleteDocument(id: string) {
    return this.documents.delete(id);
  }

  async getWorkflows(options: any = {}) {
    const { page = 1, limit = 10, status } = options;
    let workflows = Array.from(this.workflows.values());

    if (status) {
      workflows = workflows.filter((workflow) => workflow.status === status);
    }

    const total = workflows.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedWorkflows = workflows.slice(startIndex, endIndex);

    return {
      workflows: paginatedWorkflows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getWorkflow(id: string) {
    return this.workflows.get(id) || null;
  }

  async updateWorkflow(id: string, updates: any) {
    const workflow = this.workflows.get(id);
    if (!workflow) return null;

    const updatedWorkflow = {
      ...workflow,
      ...updates,
      updatedAt: new Date(),
    };

    this.workflows.set(id, updatedWorkflow);
    return updatedWorkflow;
  }

  async deleteWorkflow(id: string) {
    return this.workflows.delete(id);
  }

  async saveEstimation(data: any) {
    const estimation = {
      id: Math.random().toString(36).substr(2, 9),
      ...data,
    };

    this.estimations.push(estimation);
    return estimation;
  }

  async getEstimationHistory(options: any = {}) {
    const { page = 1, limit = 10 } = options;
    const total = this.estimations.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedEstimations = this.estimations.slice(startIndex, endIndex);

    return {
      estimations: paginatedEstimations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}
