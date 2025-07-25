import { faker } from '@faker-js/faker';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface TestDocument {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'txt' | 'md';
  content: string;
  size: number;
  metadata: {
    author?: string;
    createdAt: Date;
    modifiedAt: Date;
    pages?: number;
    wordCount: number;
  };
}

export interface TestCodebase {
  id: string;
  name: string;
  language: string;
  files: TestCodeFile[];
  structure: ProjectStructure;
  metrics: CodeMetrics;
}

export interface TestCodeFile {
  path: string;
  content: string;
  language: string;
  size: number;
  complexity: number;
}

export interface ProjectStructure {
  directories: string[];
  fileCount: number;
  totalSize: number;
  languages: Record<string, number>;
}

export interface CodeMetrics {
  linesOfCode: number;
  cyclomaticComplexity: number;
  maintainabilityIndex: number;
  technicalDebt: number;
}

export interface TestWorkflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
  expectedDuration: number;
  complexity: 'simple' | 'medium' | 'complex';
}

export interface WorkflowStep {
  id: string;
  type: 'document-analysis' | 'estimation' | 'communication' | 'codebase-analysis';
  input: any;
  expectedOutput: any;
  duration: number;
}

export class TestDataManager {
  private testDataDir: string;
  private documentsDir: string;
  private codebasesDir: string;
  private workflowsDir: string;
  private cache: Map<string, any> = new Map();

  constructor() {
    this.testDataDir = path.join(__dirname, '../fixtures');
    this.documentsDir = path.join(this.testDataDir, 'documents');
    this.codebasesDir = path.join(this.testDataDir, 'codebases');
    this.workflowsDir = path.join(this.testDataDir, 'workflows');
  }

  async initialize(): Promise<void> {
    await this.ensureDirectories();
    await this.generateTestData();
  }

  private async ensureDirectories(): Promise<void> {
    const dirs = [
      this.testDataDir,
      this.documentsDir,
      this.codebasesDir,
      this.workflowsDir,
      path.join(this.testDataDir, 'expected-outputs'),
      path.join(this.testDataDir, 'performance'),
    ];

    for (const dir of dirs) {
      try {
        await fs.access(dir);
      } catch {
        await fs.mkdir(dir, { recursive: true });
      }
    }
  }

  async generateTestData(): Promise<void> {
    // Generate test documents if they don't exist
    const documentsExist = await this.checkIfDataExists('documents');
    if (!documentsExist) {
      await this.generateTestDocuments();
    }

    // Generate test codebases if they don't exist
    const codebasesExist = await this.checkIfDataExists('codebases');
    if (!codebasesExist) {
      await this.generateTestCodebases();
    }

    // Generate test workflows if they don't exist
    const workflowsExist = await this.checkIfDataExists('workflows');
    if (!workflowsExist) {
      await this.generateTestWorkflows();
    }
  }

  private async checkIfDataExists(type: string): Promise<boolean> {
    try {
      const dir = path.join(this.testDataDir, type);
      const files = await fs.readdir(dir);
      return files.length > 0;
    } catch {
      return false;
    }
  }

  async generateTestDocuments(): Promise<TestDocument[]> {
    const documents: TestDocument[] = [];
    const documentTypes = ['pdf', 'docx', 'txt', 'md'] as const;
    const scenarios = [
      'simple-requirements',
      'complex-project-spec',
      'technical-documentation',
      'business-proposal',
      'meeting-notes',
      'user-stories',
      'api-documentation',
      'large-document',
    ];

    for (const scenario of scenarios) {
      for (const type of documentTypes) {
        const doc = await this.createTestDocument(scenario, type);
        documents.push(doc);
        await this.saveTestDocument(doc);
      }
    }

    return documents;
  }

  private async createTestDocument(scenario: string, type: TestDocument['type']): Promise<TestDocument> {
    const id = faker.string.uuid();
    const content = this.generateDocumentContent(scenario, type);
    const wordCount = content.split(/\s+/).length;

    return {
      id,
      name: `${scenario}.${type}`,
      type,
      content,
      size: Buffer.byteLength(content, 'utf8'),
      metadata: {
        author: faker.person.fullName(),
        createdAt: faker.date.past(),
        modifiedAt: faker.date.recent(),
        pages: type === 'pdf' ? Math.ceil(wordCount / 250) : undefined,
        wordCount,
      },
    };
  }

  private generateDocumentContent(scenario: string, type: string): string {
    const generators = {
      'simple-requirements': () => this.generateSimpleRequirements(),
      'complex-project-spec': () => this.generateComplexProjectSpec(),
      'technical-documentation': () => this.generateTechnicalDocumentation(),
      'business-proposal': () => this.generateBusinessProposal(),
      'meeting-notes': () => this.generateMeetingNotes(),
      'user-stories': () => this.generateUserStories(),
      'api-documentation': () => this.generateApiDocumentation(),
      'large-document': () => this.generateLargeDocument(),
    };

    const generator = generators[scenario as keyof typeof generators];
    return generator ? generator() : faker.lorem.paragraphs(5);
  }

  private generateSimpleRequirements(): string {
    return `# Project Requirements

## Overview
${faker.lorem.paragraph()}

## Functional Requirements
1. User Authentication
   - Users must be able to register with email and password
   - Users must be able to login and logout
   - Password reset functionality required

2. Data Management
   - CRUD operations for user data
   - Data validation and sanitization
   - Backup and recovery procedures

## Non-Functional Requirements
- Performance: Response time < 2 seconds
- Security: Data encryption at rest and in transit
- Scalability: Support for 1000+ concurrent users
- Availability: 99.9% uptime requirement

## Acceptance Criteria
- All features must be tested
- Documentation must be provided
- Code coverage > 80%`;
  }

  private generateComplexProjectSpec(): string {
    return `# Complex E-commerce Platform Specification

## Executive Summary
${faker.lorem.paragraphs(2)}

## System Architecture
### Frontend Components
- React-based user interface
- Mobile-responsive design
- Progressive Web App capabilities

### Backend Services
- Microservices architecture
- API Gateway implementation
- Database clustering

### Third-party Integrations
- Payment processing (Stripe, PayPal)
- Shipping providers (FedEx, UPS)
- Analytics platforms (Google Analytics)

## Detailed Requirements

### User Management System
1. Registration and Authentication
   - Multi-factor authentication
   - Social login integration
   - Role-based access control

2. User Profiles
   - Personal information management
   - Preference settings
   - Order history tracking

### Product Catalog
1. Product Information Management
   - Rich product descriptions
   - Image gallery support
   - Inventory tracking
   - Category management

2. Search and Filtering
   - Full-text search capabilities
   - Advanced filtering options
   - Recommendation engine

### Order Management
1. Shopping Cart
   - Persistent cart across sessions
   - Guest checkout option
   - Promotional code support

2. Checkout Process
   - Multiple payment methods
   - Address validation
   - Order confirmation system

### Performance Requirements
- Page load time < 3 seconds
- Support for 10,000 concurrent users
- 99.95% uptime requirement
- Mobile performance optimization

### Security Requirements
- PCI DSS compliance
- Data encryption (AES-256)
- Regular security audits
- GDPR compliance

## Implementation Timeline
Phase 1: Core functionality (3 months)
Phase 2: Advanced features (2 months)
Phase 3: Performance optimization (1 month)
Phase 4: Testing and deployment (1 month)

## Risk Assessment
- Technical complexity: High
- Resource availability: Medium
- Market competition: High
- Regulatory compliance: Medium`;
  }

  private generateTechnicalDocumentation(): string {
    return `# API Documentation

## Authentication
All API requests require authentication using JWT tokens.

### Endpoints

#### POST /api/auth/login
Authenticate user and return JWT token.

**Request Body:**
\`\`\`json
{
  "email": "user@example.com",
  "password": "securepassword"
}
\`\`\`

**Response:**
\`\`\`json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123",
    "email": "user@example.com",
    "role": "user"
  }
}
\`\`\`

#### GET /api/users
Retrieve list of users (admin only).

**Query Parameters:**
- page: Page number (default: 1)
- limit: Items per page (default: 10)
- search: Search term

**Response:**
\`\`\`json
{
  "users": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100
  }
}
\`\`\`

## Error Handling
All errors follow the standard format:

\`\`\`json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {...}
  }
}
\`\`\`

## Rate Limiting
- 100 requests per minute per IP
- 1000 requests per hour per authenticated user`;
  }

  private generateBusinessProposal(): string {
    return `# Business Proposal: Digital Transformation Initiative

## Executive Summary
${faker.company.name()} proposes a comprehensive digital transformation solution to modernize your business operations and improve efficiency.

## Proposed Solution
### Phase 1: Assessment and Planning
- Current system analysis
- Gap identification
- Technology roadmap development
- Risk assessment

### Phase 2: Implementation
- System integration
- Data migration
- User training
- Quality assurance

### Phase 3: Optimization
- Performance monitoring
- Continuous improvement
- Support and maintenance

## Investment Overview
- Total project cost: $${faker.number.int({ min: 100000, max: 500000 })}
- Timeline: ${faker.number.int({ min: 6, max: 18 })} months
- ROI expected: ${faker.number.int({ min: 150, max: 300 })}% within 2 years

## Benefits
- Increased operational efficiency
- Reduced manual processes
- Improved data accuracy
- Enhanced customer experience
- Scalable infrastructure

## Next Steps
1. Proposal review and approval
2. Contract negotiation
3. Project kickoff meeting
4. Detailed planning phase`;
  }

  private generateMeetingNotes(): string {
    return `# Project Kickoff Meeting Notes

**Date:** ${faker.date.recent().toISOString().split('T')[0]}
**Attendees:** ${Array.from({ length: 5 }, () => faker.person.fullName()).join(', ')}

## Agenda Items

### 1. Project Overview
- Discussed project scope and objectives
- Reviewed timeline and milestones
- Identified key stakeholders

### 2. Technical Requirements
- Database requirements: PostgreSQL
- Frontend framework: React
- Backend: Node.js with Express
- Deployment: AWS infrastructure

### 3. Action Items
- [ ] Set up development environment (${faker.person.firstName()})
- [ ] Create project repository (${faker.person.firstName()})
- [ ] Design database schema (${faker.person.firstName()})
- [ ] Prepare UI mockups (${faker.person.firstName()})

### 4. Risks and Concerns
- Tight timeline may require additional resources
- Third-party API dependencies need evaluation
- Security requirements need clarification

### 5. Next Meeting
**Date:** ${faker.date.future().toISOString().split('T')[0]}
**Agenda:** Review initial development progress`;
  }

  private generateUserStories(): string {
    return `# User Stories

## Epic: User Management

### Story 1: User Registration
**As a** new user
**I want to** create an account
**So that** I can access the platform

**Acceptance Criteria:**
- User can register with email and password
- Email verification is required
- Password must meet security requirements
- User receives welcome email

### Story 2: User Login
**As a** registered user
**I want to** log into my account
**So that** I can access my personal data

**Acceptance Criteria:**
- User can login with email/password
- Invalid credentials show error message
- Successful login redirects to dashboard
- Remember me option available

### Story 3: Password Reset
**As a** user who forgot password
**I want to** reset my password
**So that** I can regain access to my account

**Acceptance Criteria:**
- User can request password reset via email
- Reset link expires after 24 hours
- New password must meet requirements
- User is notified of successful reset

## Epic: Product Management

### Story 4: Browse Products
**As a** customer
**I want to** browse available products
**So that** I can find items to purchase

**Acceptance Criteria:**
- Products are displayed in grid layout
- Pagination is available for large catalogs
- Product images and basic info are shown
- Categories filter is available`;
  }

  private generateApiDocumentation(): string {
    return `# REST API Documentation v1.0

## Base URL
\`https://api.example.com/v1\`

## Authentication
Bearer token required for all endpoints except public ones.

## Endpoints

### Users
- \`GET /users\` - List users
- \`POST /users\` - Create user
- \`GET /users/{id}\` - Get user by ID
- \`PUT /users/{id}\` - Update user
- \`DELETE /users/{id}\` - Delete user

### Products
- \`GET /products\` - List products
- \`POST /products\` - Create product
- \`GET /products/{id}\` - Get product by ID
- \`PUT /products/{id}\` - Update product
- \`DELETE /products/{id}\` - Delete product

### Orders
- \`GET /orders\` - List orders
- \`POST /orders\` - Create order
- \`GET /orders/{id}\` - Get order by ID
- \`PUT /orders/{id}/status\` - Update order status

## Response Formats
All responses are in JSON format with consistent structure:

\`\`\`json
{
  "success": true,
  "data": {...},
  "message": "Operation completed successfully"
}
\`\`\`

## Error Codes
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error`;
  }

  private generateLargeDocument(): string {
    const sections: string[] = [];
    for (let i = 0; i < 50; i++) {
      sections.push(`## Section ${i + 1}: ${faker.lorem.words({ min: 2, max: 4 })}`);
      sections.push(faker.lorem.paragraphs({ min: 8, max: 12 }));
    }
    return sections.join('\n\n');
  }

  async generateTestCodebases(): Promise<TestCodebase[]> {
    const codebases: TestCodebase[] = [];
    const languages = ['typescript', 'javascript', 'python', 'java', 'csharp'];
    const scenarios = [
      'simple-api',
      'complex-microservices',
      'frontend-app',
      'legacy-system',
      'monorepo',
    ];

    for (const scenario of scenarios) {
      for (const language of languages) {
        const codebase = await this.createTestCodebase(scenario, language);
        codebases.push(codebase);
        await this.saveTestCodebase(codebase);
      }
    }

    return codebases;
  }

  private async createTestCodebase(scenario: string, language: string): Promise<TestCodebase> {
    const id = faker.string.uuid();
    const files = this.generateCodeFiles(scenario, language);
    const structure = this.calculateProjectStructure(files);
    const metrics = this.calculateCodeMetrics(files);

    return {
      id,
      name: `${scenario}-${language}`,
      language,
      files,
      structure,
      metrics,
    };
  }

  private generateCodeFiles(scenario: string, language: string): TestCodeFile[] {
    const generators = {
      'simple-api': () => this.generateSimpleApiFiles(language),
      'complex-microservices': () => this.generateMicroservicesFiles(language),
      'frontend-app': () => this.generateFrontendFiles(language),
      'legacy-system': () => this.generateLegacyFiles(language),
      'monorepo': () => this.generateMonorepoFiles(language),
    };

    const generator = generators[scenario as keyof typeof generators];
    return generator ? generator() : [];
  }

  private generateSimpleApiFiles(language: string): TestCodeFile[] {
    const files: TestCodeFile[] = [];
    const extensions = {
      typescript: 'ts',
      javascript: 'js',
      python: 'py',
      java: 'java',
      csharp: 'cs',
    };

    const ext = extensions[language as keyof typeof extensions] || 'txt';

    // Main application file
    files.push({
      path: `src/app.${ext}`,
      content: this.generateAppCode(language),
      language,
      size: 1500,
      complexity: 3,
    });

    // Route handlers
    files.push({
      path: `src/routes/users.${ext}`,
      content: this.generateRouteCode(language, 'users'),
      language,
      size: 800,
      complexity: 2,
    });

    // Database models
    files.push({
      path: `src/models/User.${ext}`,
      content: this.generateModelCode(language, 'User'),
      language,
      size: 600,
      complexity: 2,
    });

    // Configuration
    files.push({
      path: `src/config/database.${ext}`,
      content: this.generateConfigCode(language),
      language,
      size: 400,
      complexity: 1,
    });

    return files;
  }

  private generateMicroservicesFiles(language: string): TestCodeFile[] {
    // Generate multiple service files for microservices architecture
    const files: TestCodeFile[] = [];
    const services = ['user-service', 'product-service', 'order-service', 'notification-service'];
    
    for (const service of services) {
      files.push(...this.generateServiceFiles(service, language));
    }

    return files;
  }

  private generateFrontendFiles(language: string): TestCodeFile[] {
    const files: TestCodeFile[] = [];
    
    // React components
    files.push({
      path: 'src/components/Header.tsx',
      content: this.generateReactComponent('Header'),
      language: 'typescript',
      size: 500,
      complexity: 2,
    });

    files.push({
      path: 'src/pages/Dashboard.tsx',
      content: this.generateReactComponent('Dashboard'),
      language: 'typescript',
      size: 1200,
      complexity: 4,
    });

    return files;
  }

  private generateLegacyFiles(language: string): TestCodeFile[] {
    // Generate files that simulate legacy code patterns
    return this.generateSimpleApiFiles(language).map(file => ({
      ...file,
      complexity: file.complexity + 2, // Legacy code is more complex
      content: `// Legacy code - needs refactoring\n${file.content}`,
    }));
  }

  private generateMonorepoFiles(language: string): TestCodeFile[] {
    const files: TestCodeFile[] = [];
    const packages = ['core', 'ui', 'api', 'utils'];

    for (const pkg of packages) {
      files.push(...this.generatePackageFiles(pkg, language));
    }

    return files;
  }

  private generateServiceFiles(serviceName: string, language: string): TestCodeFile[] {
    const ext = language === 'typescript' ? 'ts' : 'js';
    return [
      {
        path: `services/${serviceName}/src/index.${ext}`,
        content: `// ${serviceName} main entry point\n${faker.lorem.paragraph()}`,
        language,
        size: 800,
        complexity: 3,
      },
      {
        path: `services/${serviceName}/src/controller.${ext}`,
        content: `// ${serviceName} controller\n${faker.lorem.paragraph()}`,
        language,
        size: 600,
        complexity: 2,
      },
    ];
  }

  private generatePackageFiles(packageName: string, language: string): TestCodeFile[] {
    const ext = language === 'typescript' ? 'ts' : 'js';
    return [
      {
        path: `packages/${packageName}/src/index.${ext}`,
        content: `// ${packageName} package\n${faker.lorem.paragraph()}`,
        language,
        size: 400,
        complexity: 2,
      },
    ];
  }

  private generateAppCode(language: string): string {
    const templates = {
      typescript: `import express from 'express';
import { userRoutes } from './routes/users';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api/users', userRoutes);

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`,
      javascript: `const express = require('express');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api/users', userRoutes);

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`,
      python: `from flask import Flask
from routes.users import user_bp

app = Flask(__name__)
app.register_blueprint(user_bp, url_prefix='/api/users')

if __name__ == '__main__':
    app.run(debug=True)`,
    };

    return templates[language as keyof typeof templates] || `// ${language} application code`;
  }

  private generateRouteCode(language: string, entity: string): string {
    return `// ${entity} routes for ${language}\n${faker.lorem.paragraph()}`;
  }

  private generateModelCode(language: string, model: string): string {
    return `// ${model} model for ${language}\n${faker.lorem.paragraph()}`;
  }

  private generateConfigCode(language: string): string {
    return `// Configuration for ${language}\n${faker.lorem.paragraph()}`;
  }

  private generateReactComponent(componentName: string): string {
    return `import React from 'react';

interface ${componentName}Props {
  // Props interface
}

export const ${componentName}: React.FC<${componentName}Props> = () => {
  return (
    <div>
      <h1>${componentName}</h1>
    </div>
  );
};`;
  }

  private calculateProjectStructure(files: TestCodeFile[]): ProjectStructure {
    const directories = new Set<string>();
    const languages: Record<string, number> = {};
    let totalSize = 0;

    files.forEach(file => {
      const dir = path.dirname(file.path);
      directories.add(dir);
      languages[file.language] = (languages[file.language] || 0) + 1;
      totalSize += file.size;
    });

    return {
      directories: Array.from(directories),
      fileCount: files.length,
      totalSize,
      languages,
    };
  }

  private calculateCodeMetrics(files: TestCodeFile[]): CodeMetrics {
    const totalComplexity = files.reduce((sum, file) => sum + file.complexity, 0);
    const avgComplexity = totalComplexity / files.length;

    return {
      linesOfCode: files.reduce((sum, file) => sum + file.content.split('\n').length, 0),
      cyclomaticComplexity: avgComplexity,
      maintainabilityIndex: Math.max(0, 100 - avgComplexity * 10),
      technicalDebt: avgComplexity * 1000,
    };
  }

  async generateTestWorkflows(): Promise<TestWorkflow[]> {
    const workflows: TestWorkflow[] = [];
    const scenarios = [
      'simple-document-processing',
      'complex-project-analysis',
      'batch-processing',
      'error-recovery',
      'performance-intensive',
    ];

    for (const scenario of scenarios) {
      const workflow = this.createTestWorkflow(scenario);
      workflows.push(workflow);
      await this.saveTestWorkflow(workflow);
    }

    return workflows;
  }

  private createTestWorkflow(scenario: string): TestWorkflow {
    const workflows = {
      'simple-document-processing': {
        steps: [
          {
            id: '1',
            type: 'document-analysis' as const,
            input: { documentId: 'test-doc-1' },
            expectedOutput: { requirements: [], keyPoints: [] },
            duration: 5000,
          },
        ],
        complexity: 'simple' as const,
      },
      'complex-project-analysis': {
        steps: [
          {
            id: '1',
            type: 'document-analysis' as const,
            input: { documentId: 'complex-spec' },
            expectedOutput: { requirements: [], keyPoints: [] },
            duration: 15000,
          },
          {
            id: '2',
            type: 'estimation' as const,
            input: { requirements: [] },
            expectedOutput: { estimate: {} },
            duration: 10000,
          },
          {
            id: '3',
            type: 'communication' as const,
            input: { estimate: {} },
            expectedOutput: { proposal: '' },
            duration: 8000,
          },
        ],
        complexity: 'complex' as const,
      },
    };

    const config = workflows[scenario as keyof typeof workflows] || workflows['simple-document-processing'];

    return {
      id: faker.string.uuid(),
      name: scenario,
      steps: config.steps,
      expectedDuration: config.steps.reduce((sum, step) => sum + step.duration, 0),
      complexity: config.complexity,
    };
  }

  private async saveTestDocument(document: TestDocument): Promise<void> {
    const filePath = path.join(this.documentsDir, `${document.name}.json`);
    await fs.writeFile(filePath, JSON.stringify(document, null, 2));
  }

  private async saveTestCodebase(codebase: TestCodebase): Promise<void> {
    const filePath = path.join(this.codebasesDir, `${codebase.name}.json`);
    await fs.writeFile(filePath, JSON.stringify(codebase, null, 2));
  }

  private async saveTestWorkflow(workflow: TestWorkflow): Promise<void> {
    const filePath = path.join(this.workflowsDir, `${workflow.name}.json`);
    await fs.writeFile(filePath, JSON.stringify(workflow, null, 2));
  }

  async getTestDocument(name: string): Promise<TestDocument | null> {
    const cacheKey = `doc-${name}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const filePath = path.join(this.documentsDir, `${name}.json`);
      const content = await fs.readFile(filePath, 'utf8');
      const document = JSON.parse(content);
      this.cache.set(cacheKey, document);
      return document;
    } catch {
      return null;
    }
  }

  async getTestCodebase(name: string): Promise<TestCodebase | null> {
    const cacheKey = `codebase-${name}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const filePath = path.join(this.codebasesDir, `${name}.json`);
      const content = await fs.readFile(filePath, 'utf8');
      const codebase = JSON.parse(content);
      this.cache.set(cacheKey, codebase);
      return codebase;
    } catch {
      return null;
    }
  }

  async getTestWorkflow(name: string): Promise<TestWorkflow | null> {
    const cacheKey = `workflow-${name}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const filePath = path.join(this.workflowsDir, `${name}.json`);
      const content = await fs.readFile(filePath, 'utf8');
      const workflow = JSON.parse(content);
      this.cache.set(cacheKey, workflow);
      return workflow;
    } catch {
      return null;
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  async cleanup(): Promise<void> {
    // Clean up temporary test files if needed
    this.clearCache();
  }
}