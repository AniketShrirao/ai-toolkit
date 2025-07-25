import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { IntegrityChecker } from '../integrity/IntegrityChecker.js';

describe('IntegrityChecker', () => {
  const testDir = path.join(process.cwd(), 'test-integrity-temp');
  let checker: IntegrityChecker;

  beforeEach(async () => {
    // Create test directory
    await fs.mkdir(testDir, { recursive: true });
    
    checker = new IntegrityChecker({
      rootPath: testDir,
      includePatterns: ['**/*.ts', '**/*.js'],
      excludePatterns: ['**/node_modules/**'],
      checkMissingModules: false // Disable for most tests
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

  describe('TODO detection', () => {
    it('should detect TODO comments', async () => {
      const testFile = path.join(testDir, 'test.ts');
      await fs.writeFile(testFile, `
        // TODO: Implement this function
        function test() {
          // FIXME: This is broken
          return null;
        }
      `);

      const report = await checker.checkIntegrity();
      
      expect(report.totalIssues).toBe(2);
      expect(report.issuesByType.TODO).toBe(2);
      
      const todoIssue = report.issues.find(i => i.context?.includes('TODO'));
      expect(todoIssue?.severity).toBe('low');
      
      const fixmeIssue = report.issues.find(i => i.context?.includes('FIXME'));
      expect(fixmeIssue?.severity).toBe('high');
    });

    it('should detect different TODO severities', async () => {
      const testFile = path.join(testDir, 'test.ts');
      await fs.writeFile(testFile, `
        // TODO: Low priority
        // FIXME: High priority
        // HACK: Medium-high priority
        // XXX: Medium priority
      `);

      const report = await checker.checkIntegrity();
      
      expect(report.issuesBySeverity.low).toBe(1);
      expect(report.issuesBySeverity.medium).toBe(1);
      expect(report.issuesBySeverity.high).toBe(2);
    });
  });

  describe('Mock detection', () => {
    it('should detect mock implementations in production code', async () => {
      const testFile = path.join(testDir, 'service.ts');
      await fs.writeFile(testFile, `
        export class UserService {
          async getUser() {
            return mockUser(); // This should be flagged
          }
          
          async createUser() {
            return stubUserCreation(); // This should be flagged
          }
        }
      `);

      const report = await checker.checkIntegrity();
      
      expect(report.issuesByType.MOCK).toBe(2);
      expect(report.issues.every(i => i.severity === 'medium')).toBe(true);
    });

    it('should not flag mocks in test files', async () => {
      const testFile = path.join(testDir, 'service.test.ts');
      await fs.writeFile(testFile, `
        describe('UserService', () => {
          it('should work', () => {
            const mockUser = jest.fn();
            expect(mockUser).toBeDefined();
          });
        });
      `);

      const report = await checker.checkIntegrity();
      
      expect(report.issuesByType.MOCK || 0).toBe(0);
    });
  });

  describe('Placeholder detection', () => {
    it('should detect placeholder text', async () => {
      const testFile = path.join(testDir, 'component.ts');
      await fs.writeFile(testFile, `
        export const config = {
          apiUrl: '[API_URL]', // Placeholder
          name: 'Not implemented yet',
          status: 'Under construction'
        };
      `);

      const report = await checker.checkIntegrity();
      
      expect(report.issuesByType.PLACEHOLDER).toBeGreaterThan(0);
      expect(report.issues.every(i => i.severity === 'medium')).toBe(true);
    });
  });

  describe('Unimplemented function detection', () => {
    it('should detect unimplemented functions', async () => {
      const testFile = path.join(testDir, 'api.ts');
      await fs.writeFile(testFile, `
        export class ApiService {
          async getData() {
            throw new Error('not implemented');
          }
          
          async saveData() {
            throw new Error('unimplemented');
          }
          
          async deleteData() {
            return null; // TODO: implement this
          }
        }
      `);

      const report = await checker.checkIntegrity();
      
      expect(report.issuesByType.UNIMPLEMENTED).toBe(3);
      expect(report.issues.filter(i => i.type === 'UNIMPLEMENTED').every(i => i.severity === 'high')).toBe(true);
    });
  });

  describe('Missing module detection', () => {
    it('should detect missing essential files', async () => {
      // Create a checker that checks for missing modules
      const moduleChecker = new IntegrityChecker({
        rootPath: testDir,
        checkMissingModules: true,
        checkTodos: false,
        checkMocks: false,
        checkPlaceholders: false,
        checkUnimplemented: false
      });
      
      const report = await moduleChecker.checkIntegrity();
      
      expect(report.issuesByType.MISSING_MODULE).toBeGreaterThan(0);
      expect(report.issues.some(i => i.severity === 'critical')).toBe(true);
    });
  });

  describe('Report generation', () => {
    it('should calculate quality score correctly', async () => {
      const testFile = path.join(testDir, 'mixed.ts');
      await fs.writeFile(testFile, `
        // TODO: Low impact
        function test() {
          throw new Error('not implemented'); // High impact
        }
      `);

      const report = await checker.checkIntegrity();
      
      expect(report.summary.codeQualityScore).toBeGreaterThan(0);
      expect(report.summary.codeQualityScore).toBeLessThan(100);
    });

    it('should determine readiness level correctly', async () => {
      // Test with no issues
      const report = await checker.checkIntegrity();
      
      if (report.totalIssues === 0) {
        expect(report.summary.readinessLevel).toBe('ready');
      } else {
        expect(['not-ready', 'needs-attention', 'ready']).toContain(report.summary.readinessLevel);
      }
    });

    it('should provide relevant recommendations', async () => {
      const testFile = path.join(testDir, 'issues.ts');
      await fs.writeFile(testFile, `
        // TODO: Fix this
        function broken() {
          throw new Error('not implemented');
        }
      `);

      const report = await checker.checkIntegrity();
      
      expect(report.summary.recommendations).toBeInstanceOf(Array);
      expect(report.summary.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Configuration options', () => {
    it('should respect include/exclude patterns', async () => {
      // Create files in different locations
      await fs.mkdir(path.join(testDir, 'src'), { recursive: true });
      await fs.mkdir(path.join(testDir, 'node_modules'), { recursive: true });
      
      await fs.writeFile(path.join(testDir, 'src', 'app.ts'), '// TODO: implement');
      await fs.writeFile(path.join(testDir, 'node_modules', 'lib.js'), '// TODO: should be ignored');

      const report = await checker.checkIntegrity();
      
      // Should only find the TODO in src, not in node_modules
      expect(report.totalIssues).toBe(1);
      expect(report.issues[0].file).toContain('src');
    });

    it('should allow disabling specific checks', async () => {
      const restrictiveChecker = new IntegrityChecker({
        rootPath: testDir,
        checkTodos: false,
        checkMocks: false
      });

      const testFile = path.join(testDir, 'test.ts');
      await fs.writeFile(testFile, `
        // TODO: This should be ignored
        function test() {
          return mockData(); // This should be ignored
        }
      `);

      const report = await restrictiveChecker.checkIntegrity();
      
      expect(report.issuesByType.TODO || 0).toBe(0);
      expect(report.issuesByType.MOCK || 0).toBe(0);
    });
  });
});