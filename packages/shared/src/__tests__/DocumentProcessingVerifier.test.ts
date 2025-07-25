import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { DocumentProcessingVerifier, VerifiableDocument } from '../integrity/DocumentProcessingVerifier.js';

describe('DocumentProcessingVerifier', () => {
  const testDir = path.join(process.cwd(), 'test-doc-processing-temp');
  let verifier: DocumentProcessingVerifier;

  beforeEach(async () => {
    // Create test directory
    await fs.mkdir(testDir, { recursive: true });
    
    verifier = new DocumentProcessingVerifier({
      documentsPath: testDir,
      minSummaryLength: 20
    });
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Document loading', () => {
    it('should load valid processed documents', async () => {
      const validDoc: VerifiableDocument = {
        id: 'doc-1',
        originalPath: '/test/document.pdf',
        type: 'pdf',
        status: 'completed',
        createdAt: new Date(),
        processedAt: new Date(),
        content: {
          text: 'This is the extracted text content',
          metadata: {
            fileSize: 1024,
            mimeType: 'application/pdf',
            lastModified: new Date().toISOString()
          }
        },
        analysis: {
          summary: 'This is a comprehensive summary of the document content',
          keyPoints: ['Point 1', 'Point 2'],
          actionItems: ['Action 1', 'Action 2']
        }
      };

      await fs.writeFile(
        path.join(testDir, 'doc-1.json'),
        JSON.stringify(validDoc, null, 2)
      );

      const report = await verifier.verifyDocumentProcessing();
      
      expect(report.totalDocuments).toBe(1);
      expect(report.processedDocuments).toBe(1);
      expect(report.failedDocuments).toBe(0);
    });

    it('should ignore invalid JSON files', async () => {
      await fs.writeFile(path.join(testDir, 'invalid.json'), 'invalid json content');
      await fs.writeFile(path.join(testDir, 'not-a-doc.json'), JSON.stringify({ random: 'data' }));

      const report = await verifier.verifyDocumentProcessing();
      
      expect(report.totalDocuments).toBe(0);
    });
  });

  describe('Extraction failure detection', () => {
    it('should detect failed document processing', async () => {
      const failedDoc: VerifiableDocument = {
        id: 'doc-failed',
        originalPath: '/test/failed.pdf',
        type: 'pdf',
        status: 'failed',
        createdAt: new Date(),
        error: 'Unable to extract text from PDF'
      };

      await fs.writeFile(
        path.join(testDir, 'failed.json'),
        JSON.stringify(failedDoc, null, 2)
      );

      const report = await verifier.verifyDocumentProcessing();
      
      expect(report.issuesByType.EXTRACTION_FAILURE).toBe(1);
      expect(report.issues[0].severity).toBe('high');
      expect(report.issues[0].message).toContain('Document processing failed');
    });

    it('should detect stuck processing documents', async () => {
      const stuckDoc: VerifiableDocument = {
        id: 'doc-stuck',
        originalPath: '/test/stuck.pdf',
        type: 'pdf',
        status: 'processing',
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000) // 25 hours ago
      };

      await fs.writeFile(
        path.join(testDir, 'stuck.json'),
        JSON.stringify(stuckDoc, null, 2)
      );

      const report = await verifier.verifyDocumentProcessing();
      
      expect(report.issuesByType.EXTRACTION_FAILURE).toBe(1);
      expect(report.issues[0].message).toContain('may be stuck');
    });
  });

  describe('Empty field detection', () => {
    it('should detect missing required fields', async () => {
      const incompleteDoc: VerifiableDocument = {
        id: 'doc-incomplete',
        originalPath: '/test/incomplete.pdf',
        type: 'pdf',
        status: 'completed',
        createdAt: new Date(),
        // Missing content.text
      };

      await fs.writeFile(
        path.join(testDir, 'incomplete.json'),
        JSON.stringify(incompleteDoc, null, 2)
      );

      const report = await verifier.verifyDocumentProcessing();
      
      expect(report.issuesByType.EMPTY_FIELD).toBeGreaterThan(0);
      const emptyFieldIssue = report.issues.find(i => i.field === 'content.text');
      expect(emptyFieldIssue).toBeDefined();
      expect(emptyFieldIssue?.severity).toBe('medium');
    });
  });

  describe('Summary validation', () => {
    it('should detect incomplete summaries', async () => {
      const shortSummaryDoc: VerifiableDocument = {
        id: 'doc-short',
        originalPath: '/test/short.pdf',
        type: 'pdf',
        status: 'completed',
        createdAt: new Date(),
        content: { text: 'Some content' },
        analysis: {
          summary: 'Too short' // Less than minSummaryLength (20)
        }
      };

      await fs.writeFile(
        path.join(testDir, 'short.json'),
        JSON.stringify(shortSummaryDoc, null, 2)
      );

      const report = await verifier.verifyDocumentProcessing();
      
      expect(report.issuesByType.INCOMPLETE_SUMMARY).toBe(1);
      expect(report.issues[0].message).toContain('too short');
    });

    it('should detect placeholder text in summaries', async () => {
      const placeholderDoc: VerifiableDocument = {
        id: 'doc-placeholder',
        originalPath: '/test/placeholder.pdf',
        type: 'pdf',
        status: 'completed',
        createdAt: new Date(),
        content: { text: 'Some content' },
        analysis: {
          summary: 'This summary contains [PLACEHOLDER] text that should be replaced'
        }
      };

      await fs.writeFile(
        path.join(testDir, 'placeholder.json'),
        JSON.stringify(placeholderDoc, null, 2)
      );

      const report = await verifier.verifyDocumentProcessing();
      
      expect(report.issuesByType.INCOMPLETE_SUMMARY).toBe(1);
      expect(report.issues[0].message).toContain('placeholder text');
    });
  });

  describe('Metadata validation', () => {
    it('should detect missing metadata', async () => {
      const noMetadataDoc: VerifiableDocument = {
        id: 'doc-no-meta',
        originalPath: '/test/no-meta.pdf',
        type: 'pdf',
        status: 'completed',
        createdAt: new Date(),
        content: { text: 'Some content' }
        // Missing metadata
      };

      await fs.writeFile(
        path.join(testDir, 'no-meta.json'),
        JSON.stringify(noMetadataDoc, null, 2)
      );

      const report = await verifier.verifyDocumentProcessing();
      
      expect(report.issuesByType.MISSING_METADATA).toBeGreaterThan(0);
      const metadataIssue = report.issues.find(i => i.field === 'content.metadata');
      expect(metadataIssue).toBeDefined();
    });

    it('should detect missing essential metadata fields', async () => {
      const incompleteMetadataDoc: VerifiableDocument = {
        id: 'doc-incomplete-meta',
        originalPath: '/test/incomplete-meta.pdf',
        type: 'pdf',
        status: 'completed',
        createdAt: new Date(),
        content: {
          text: 'Some content',
          metadata: {
            fileSize: 1024
            // Missing mimeType and lastModified
          }
        }
      };

      await fs.writeFile(
        path.join(testDir, 'incomplete-meta.json'),
        JSON.stringify(incompleteMetadataDoc, null, 2)
      );

      const report = await verifier.verifyDocumentProcessing();
      
      expect(report.issuesByType.MISSING_METADATA).toBe(2); // mimeType and lastModified
    });
  });

  describe('Data type validation', () => {
    it('should detect invalid array fields', async () => {
      const invalidDataDoc: VerifiableDocument = {
        id: 'doc-invalid',
        originalPath: '/test/invalid.pdf',
        type: 'pdf',
        status: 'completed',
        createdAt: new Date(),
        content: { text: 'Some content' },
        analysis: {
          keyPoints: 'Should be array but is string' as any,
          actionItems: { should: 'be array' } as any
        }
      };

      await fs.writeFile(
        path.join(testDir, 'invalid.json'),
        JSON.stringify(invalidDataDoc, null, 2)
      );

      const report = await verifier.verifyDocumentProcessing();
      
      expect(report.issuesByType.INVALID_DATA).toBe(2);
      expect(report.issues.some(i => i.field === 'analysis.keyPoints')).toBe(true);
      expect(report.issues.some(i => i.field === 'analysis.actionItems')).toBe(true);
    });

    it('should detect invalid date formats', async () => {
      const invalidDateDoc: VerifiableDocument = {
        id: 'doc-invalid-date',
        originalPath: '/test/invalid-date.pdf',
        type: 'pdf',
        status: 'completed',
        createdAt: new Date(),
        processedAt: 'invalid-date' as any,
        content: { 
          text: 'Some content',
          metadata: {
            fileSize: 1024,
            mimeType: 'application/pdf',
            lastModified: new Date().toISOString()
          }
        }
      };

      await fs.writeFile(
        path.join(testDir, 'invalid-date.json'),
        JSON.stringify(invalidDateDoc, null, 2)
      );

      const report = await verifier.verifyDocumentProcessing();
      
      expect(report.issuesByType.INVALID_DATA).toBe(1);
      const dateIssue = report.issues.find(i => i.field === 'processedAt');
      expect(dateIssue).toBeDefined();
      expect(dateIssue?.message).toContain('Invalid processedAt date format');
    });
  });

  describe('Report generation', () => {
    it('should calculate processing success rate correctly', async () => {
      const docs = [
        {
          id: 'doc-1',
          originalPath: '/test/doc1.pdf',
          type: 'pdf',
          status: 'completed',
          createdAt: new Date(),
          content: { text: 'Content 1' }
        },
        {
          id: 'doc-2',
          originalPath: '/test/doc2.pdf',
          type: 'pdf',
          status: 'failed',
          createdAt: new Date(),
          error: 'Processing failed'
        },
        {
          id: 'doc-3',
          originalPath: '/test/doc3.pdf',
          type: 'pdf',
          status: 'completed',
          createdAt: new Date(),
          content: { text: 'Content 3' }
        }
      ];

      for (let i = 0; i < docs.length; i++) {
        await fs.writeFile(
          path.join(testDir, `doc-${i + 1}.json`),
          JSON.stringify(docs[i], null, 2)
        );
      }

      const report = await verifier.verifyDocumentProcessing();
      
      expect(report.totalDocuments).toBe(3);
      expect(report.processedDocuments).toBe(2);
      expect(report.failedDocuments).toBe(1);
      expect(report.summary.processingSuccessRate).toBeCloseTo(66.67, 1);
    });

    it('should provide relevant recommendations', async () => {
      const failedDoc: VerifiableDocument = {
        id: 'doc-failed',
        originalPath: '/test/failed.pdf',
        type: 'pdf',
        status: 'failed',
        createdAt: new Date(),
        error: 'Extraction failed'
      };

      await fs.writeFile(
        path.join(testDir, 'failed.json'),
        JSON.stringify(failedDoc, null, 2)
      );

      const report = await verifier.verifyDocumentProcessing();
      
      expect(report.summary.recommendations).toBeInstanceOf(Array);
      expect(report.summary.recommendations.length).toBeGreaterThan(0);
      expect(report.summary.recommendations.some(r => r.includes('extraction failures'))).toBe(true);
    });
  });

  describe('Configuration options', () => {
    it('should respect custom required fields', async () => {
      const customVerifier = new DocumentProcessingVerifier({
        documentsPath: testDir,
        requiredFields: ['customField'],
        checkEmptyFields: true
      });

      const doc: VerifiableDocument = {
        id: 'doc-custom',
        originalPath: '/test/custom.pdf',
        type: 'pdf',
        status: 'completed',
        createdAt: new Date()
        // Missing customField
      };

      await fs.writeFile(
        path.join(testDir, 'custom.json'),
        JSON.stringify(doc, null, 2)
      );

      const report = await customVerifier.verifyDocumentProcessing();
      
      expect(report.issuesByType.EMPTY_FIELD).toBe(1);
      expect(report.issues[0].field).toBe('customField');
    });

    it('should allow disabling specific checks', async () => {
      const restrictiveVerifier = new DocumentProcessingVerifier({
        documentsPath: testDir,
        checkEmptyFields: false,
        checkMissingMetadata: false
      });

      const incompleteDoc: VerifiableDocument = {
        id: 'doc-incomplete',
        originalPath: '/test/incomplete.pdf',
        type: 'pdf',
        status: 'completed',
        createdAt: new Date()
        // Missing content and metadata
      };

      await fs.writeFile(
        path.join(testDir, 'incomplete.json'),
        JSON.stringify(incompleteDoc, null, 2)
      );

      const report = await restrictiveVerifier.verifyDocumentProcessing();
      
      expect(report.issuesByType.EMPTY_FIELD || 0).toBe(0);
      expect(report.issuesByType.MISSING_METADATA || 0).toBe(0);
    });
  });
});