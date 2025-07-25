import { Router, Request, Response } from 'express';
import { IntegrityChecker, DocumentProcessingVerifier } from '@ai-toolkit/shared';
import path from 'path';

const router = Router();

interface IntegrityCheckRequest {
  type: 'code' | 'documents' | 'all';
  rootPath?: string;
  documentsPath?: string;
}

/**
 * POST /api/integrity/check
 * Run integrity checks on code and/or document processing
 */
router.post('/check', async (req: Request, res: Response) => {
  try {
    const { type = 'all', rootPath, documentsPath }: IntegrityCheckRequest = req.body;
    
    const results: any = {
      timestamp: new Date(),
      type
    };

    // Run code integrity check
    if (type === 'code' || type === 'all') {
      const checker = new IntegrityChecker({
        rootPath: rootPath || process.cwd(),
        includePatterns: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
        excludePatterns: [
          '**/node_modules/**',
          '**/dist/**',
          '**/build/**',
          '**/*.test.*',
          '**/*.spec.*',
          '**/coverage/**',
          '**/.git/**',
          '**/uploads/**'
        ]
      });
      
      results.codeReport = await checker.checkIntegrity();
    }

    // Run document processing verification
    if (type === 'documents' || type === 'all') {
      const verifier = new DocumentProcessingVerifier({
        documentsPath: documentsPath || path.join(process.cwd(), 'data', 'processed')
      });
      
      results.documentReport = await verifier.verifyDocumentProcessing();
    }

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Integrity check failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * GET /api/integrity/status
 * Get the status of the integrity checking system
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = {
      available: true,
      lastCheck: null, // Could be stored in database
      supportedChecks: ['code', 'documents', 'all']
    };

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Failed to get integrity status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

export { router as integrityRouter };