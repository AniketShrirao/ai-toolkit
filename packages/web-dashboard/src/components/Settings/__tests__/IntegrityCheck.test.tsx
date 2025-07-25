import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IntegrityCheck } from '../IntegrityCheck';

// Mock fetch API
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock URL.createObjectURL and related APIs
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mock-url'),
    revokeObjectURL: vi.fn()
  }
});

describe('IntegrityCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock response
    mockFetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        success: true,
        data: {
          codeReport: {
            timestamp: new Date(),
            totalIssues: 5,
            issuesByType: { TODO: 3, MOCK: 2 },
            issuesBySeverity: { low: 3, medium: 2 },
            issues: [
              {
                type: 'TODO',
                severity: 'low',
                file: 'test.ts',
                line: 10,
                message: 'Found TODO: implement this',
                context: '// TODO: implement this'
              },
              {
                type: 'MOCK',
                severity: 'medium',
                file: 'service.ts',
                line: 25,
                message: 'Found mock implementation',
                context: 'return mockData();'
              }
            ],
            summary: {
              codeQualityScore: 85,
              readinessLevel: 'needs-attention',
              recommendations: ['Fix TODO items', 'Replace mock implementations']
            }
          },
          documentReport: {
            timestamp: new Date(),
            totalDocuments: 10,
            processedDocuments: 8,
            failedDocuments: 2,
            totalIssues: 3,
            issuesByType: { EXTRACTION_FAILURE: 2, EMPTY_FIELD: 1 },
            issuesBySeverity: { high: 2, medium: 1 },
            issues: [
              {
                type: 'EXTRACTION_FAILURE',
                severity: 'high',
                documentPath: '/test/doc1.pdf',
                message: 'Document processing failed'
              },
              {
                type: 'EMPTY_FIELD',
                severity: 'medium',
                documentPath: '/test/doc2.pdf',
                field: 'content.text',
                message: 'Required field is empty'
              }
            ],
            summary: {
              processingSuccessRate: 80,
              dataQualityScore: 75,
              recommendations: ['Fix extraction failures', 'Address empty fields']
            }
          }
        }
      })
    });
  });

  it('renders the integrity check interface', () => {
    render(<IntegrityCheck />);
    
    expect(screen.getByText('System Integrity Check')).toBeInTheDocument();
    expect(screen.getByText('Verify code quality and document processing integrity')).toBeInTheDocument();
    expect(screen.getByText('Run Integrity Check')).toBeInTheDocument();
  });

  it('shows check type selector with options', () => {
    render(<IntegrityCheck />);
    
    const selector = screen.getByDisplayValue('All Checks');
    expect(selector).toBeInTheDocument();
    
    fireEvent.click(selector);
    expect(screen.getByText('Code Quality Only')).toBeInTheDocument();
    expect(screen.getByText('Document Processing Only')).toBeInTheDocument();
  });

  it('runs integrity check and displays results', async () => {
    render(<IntegrityCheck />);
    
    const runButton = screen.getByText('Run Integrity Check');
    fireEvent.click(runButton);
    
    // Should show loading state
    expect(screen.getByText('Running integrity checks...')).toBeInTheDocument();
    
    // Wait for results to appear
    await waitFor(() => {
      expect(screen.getByText('Code Quality Report')).toBeInTheDocument();
    });
    
    await waitFor(() => {
      expect(screen.getByText('Document Processing Report')).toBeInTheDocument();
    });
    
    // Check code quality report content
    expect(screen.getByText('5')).toBeInTheDocument(); // Total issues
    expect(screen.getByText('85')).toBeInTheDocument(); // Quality score
    expect(screen.getByText('NEEDS ATTENTION')).toBeInTheDocument(); // Readiness level
    
    // Check document processing report content
    expect(screen.getByText('10')).toBeInTheDocument(); // Total documents
    expect(screen.getByText('8')).toBeInTheDocument(); // Processed documents
    expect(screen.getByText('80.0%')).toBeInTheDocument(); // Success rate
  });

  it('allows selecting different check types', async () => {
    // Mock response for code-only check
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({
        success: true,
        data: {
          codeReport: {
            timestamp: new Date(),
            totalIssues: 5,
            issuesByType: { TODO: 3, MOCK: 2 },
            issuesBySeverity: { low: 3, medium: 2 },
            issues: [],
            summary: {
              codeQualityScore: 85,
              readinessLevel: 'needs-attention',
              recommendations: ['Fix TODO items']
            }
          }
          // No documentReport for code-only check
        }
      })
    });

    render(<IntegrityCheck />);
    
    const selector = screen.getByDisplayValue('All Checks');
    fireEvent.change(selector, { target: { value: 'code' } });
    
    expect(screen.getByDisplayValue('Code Quality Only')).toBeInTheDocument();
    
    const runButton = screen.getByText('Run Integrity Check');
    fireEvent.click(runButton);
    
    await waitFor(() => {
      expect(screen.getByText('Code Quality Report')).toBeInTheDocument();
    });
    
    // Should not show document processing report for code-only check
    expect(screen.queryByText('Document Processing Report')).not.toBeInTheDocument();
  });

  it('shows export button after running checks', async () => {
    render(<IntegrityCheck />);
    
    const runButton = screen.getByText('Run Integrity Check');
    fireEvent.click(runButton);
    
    await waitFor(() => {
      expect(screen.getByText('Export Report')).toBeInTheDocument();
    });
  });

  it('exports report when export button is clicked', async () => {
    // Mock document.createElement and related DOM methods
    const mockAnchor = {
      href: '',
      download: '',
      click: vi.fn()
    };
    
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor as any);
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor as any);
    
    render(<IntegrityCheck />);
    
    // Run check first
    const runButton = screen.getByText('Run Integrity Check');
    fireEvent.click(runButton);
    
    await waitFor(() => {
      expect(screen.getByText('Export Report')).toBeInTheDocument();
    });
    
    // Click export
    const exportButton = screen.getByText('Export Report');
    fireEvent.click(exportButton);
    
    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(mockAnchor.click).toHaveBeenCalled();
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
    
    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });

  it('displays issue details when expanded', async () => {
    render(<IntegrityCheck />);
    
    const runButton = screen.getByText('Run Integrity Check');
    fireEvent.click(runButton);
    
    await waitFor(() => {
      expect(screen.getByText('Code Quality Report')).toBeInTheDocument();
    });
    
    // Expand code issues
    const codeIssuesDetails = screen.getByText('View All Issues (2)');
    fireEvent.click(codeIssuesDetails);
    
    expect(screen.getByText('Found TODO: implement this')).toBeInTheDocument();
    expect(screen.getByText('Found mock implementation')).toBeInTheDocument();
    expect(screen.getByText('test.ts')).toBeInTheDocument();
    expect(screen.getByText('Line 10')).toBeInTheDocument();
  });

  it('shows recommendations for both reports', async () => {
    render(<IntegrityCheck />);
    
    const runButton = screen.getByText('Run Integrity Check');
    fireEvent.click(runButton);
    
    await waitFor(() => {
      expect(screen.getByText('Fix TODO items')).toBeInTheDocument();
      expect(screen.getByText('Replace mock implementations')).toBeInTheDocument();
      expect(screen.getByText('Fix extraction failures')).toBeInTheDocument();
      expect(screen.getByText('Address empty fields')).toBeInTheDocument();
    });
  });

  it('disables controls while check is running', async () => {
    render(<IntegrityCheck />);
    
    const runButton = screen.getByText('Run Integrity Check');
    const selector = screen.getByDisplayValue('All Checks');
    
    fireEvent.click(runButton);
    
    expect(runButton).toBeDisabled();
    expect(selector).toBeDisabled();
    
    await waitFor(() => {
      expect(runButton).not.toBeDisabled();
      expect(selector).not.toBeDisabled();
    });
  });
});