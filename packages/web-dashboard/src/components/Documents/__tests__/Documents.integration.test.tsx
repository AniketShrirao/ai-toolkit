import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Documents } from '../Documents';
import { useDocuments } from '../../../hooks/useDocuments';

// Mock the useDocuments hook
import { vi } from 'vitest';
vi.mock('../../../hooks/useDocuments');
const mockUseDocuments = useDocuments as any;

// Mock file for testing
const createMockFile = (name: string, size: number, type: string): File => {
  const file = new File(['test content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

const mockDocuments = [
  {
    id: '1',
    name: 'Project Requirements.pdf',
    type: 'pdf' as const,
    size: 2048576,
    status: 'completed' as const,
    uploadedAt: new Date('2024-01-15T10:30:00'),
    processedAt: new Date('2024-01-15T10:32:00'),
    hasAnalysis: true,
  },
  {
    id: '2',
    name: 'Technical Specification.docx',
    type: 'docx' as const,
    size: 1536000,
    status: 'processing' as const,
    progress: 75,
    uploadedAt: new Date('2024-01-15T11:00:00'),
    hasAnalysis: false,
  },
];

const mockAnalysis = {
  structure: {
    sections: [
      { id: '1', title: 'Introduction', level: 1, content: 'Project overview...', startPage: 1, endPage: 2 },
    ],
    headings: [
      { level: 1, text: 'Introduction', page: 1 },
    ],
    paragraphs: 45,
    lists: 12,
    tables: 3,
    images: 2,
  },
  requirements: {
    functional: [
      {
        id: 'req-1',
        type: 'functional' as const,
        priority: 'high' as const,
        description: 'The system shall allow users to upload documents for AI analysis',
        acceptanceCriteria: ['Users can drag and drop files'],
        complexity: 3,
        estimatedHours: 8,
        category: 'File Management'
      }
    ],
    nonFunctional: [],
    totalCount: 1
  },
  keyPoints: [
    {
      id: 'kp-1',
      text: 'The system must integrate with Ollama for local AI processing',
      importance: 'high' as const,
      category: 'Architecture',
      context: 'Mentioned in technical requirements section'
    }
  ],
  actionItems: [
    {
      id: 'ai-1',
      description: 'Set up Ollama integration and test with sample models',
      priority: 'high' as const,
      status: 'pending' as const,
      deadline: new Date('2024-02-01')
    }
  ],
  summary: {
    length: 'medium' as const,
    content: 'This document outlines the requirements for an AI-powered document analysis system.',
    keyPoints: ['Local AI processing with Ollama integration'],
    wordCount: 156
  },
  contentCategories: [
    { type: 'Technical Requirements', confidence: 0.95, description: 'System and technical specifications' }
  ]
};

describe('Documents Integration', () => {
  const mockHookReturn = {
    documents: mockDocuments,
    uploads: [],
    loading: false,
    error: null,
    uploadFiles: vi.fn(),
    deleteDocument: vi.fn(),
    reprocessDocument: vi.fn(),
    getDocumentAnalysis: vi.fn(),
    refreshDocuments: vi.fn(),
  };

  beforeEach(() => {
    mockUseDocuments.mockReturnValue(mockHookReturn);
    vi.clearAllMocks();
  });

  it('renders document list by default', () => {
    render(<Documents />);

    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('Upload and manage your documents for AI processing')).toBeInTheDocument();
    expect(screen.getByText('Project Requirements.pdf')).toBeInTheDocument();
    expect(screen.getByText('Technical Specification.docx')).toBeInTheDocument();
  });

  it('shows upload interface when upload button is clicked', async () => {
    render(<Documents />);

    const uploadButton = screen.getByText('📁 Upload Documents');
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText('Upload Documents')).toBeInTheDocument();
      expect(screen.getByText('Drop files here or click to browse')).toBeInTheDocument();
    });
  });

  it('handles file upload workflow', async () => {
    render(<Documents />);

    // Open upload interface
    const uploadButton = screen.getByText('📁 Upload Documents');
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText('Upload Documents')).toBeInTheDocument();
    });

    // Simulate file selection
    const fileInput = screen.getByLabelText(/select files/i);
    const testFile = createMockFile('test.pdf', 1024, 'application/pdf');

    fireEvent.change(fileInput, {
      target: { files: [testFile] }
    });

    await waitFor(() => {
      expect(mockHookReturn.uploadFiles).toHaveBeenCalledWith([testFile]);
    });
  });

  it('shows document viewer when document is selected', async () => {
    mockHookReturn.getDocumentAnalysis.mockResolvedValue(mockAnalysis);

    render(<Documents />);

    const documentRow = screen.getByText('Project Requirements.pdf').closest('.document-list-table-row');
    fireEvent.click(documentRow!);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Requirements')).toBeInTheDocument();
      expect(screen.getByText('Key Points')).toBeInTheDocument();
    });

    expect(mockHookReturn.getDocumentAnalysis).toHaveBeenCalledWith('1');
  });

  it('handles document viewer close', async () => {
    mockHookReturn.getDocumentAnalysis.mockResolvedValue(mockAnalysis);

    render(<Documents />);

    // Open document viewer
    const documentRow = screen.getByText('Project Requirements.pdf').closest('.document-list-table-row');
    fireEvent.click(documentRow!);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Close document viewer
    const closeButton = screen.getByText('✕');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.getByText('Project Requirements.pdf')).toBeInTheDocument();
      expect(screen.queryByText('Overview')).not.toBeInTheDocument();
    });
  });

  it('handles document reprocessing from viewer', async () => {
    mockHookReturn.getDocumentAnalysis.mockResolvedValue(mockAnalysis);

    render(<Documents />);

    // Open document viewer
    const documentRow = screen.getByText('Project Requirements.pdf').closest('.document-list-table-row');
    fireEvent.click(documentRow!);

    await waitFor(() => {
      expect(screen.getByText('🔄 Reprocess')).toBeInTheDocument();
    });

    // Click reprocess
    const reprocessButton = screen.getByText('🔄 Reprocess');
    fireEvent.click(reprocessButton);

    expect(mockHookReturn.reprocessDocument).toHaveBeenCalledWith('1');
  });

  it('handles document deletion', async () => {
    render(<Documents />);

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    expect(mockHookReturn.deleteDocument).toHaveBeenCalledWith('1');
  });

  it('handles refresh', async () => {
    render(<Documents />);

    const refreshButton = screen.getByText(/Refresh/);
    fireEvent.click(refreshButton);

    expect(mockHookReturn.refreshDocuments).toHaveBeenCalled();
  });

  it('shows empty state when no documents', () => {
    mockUseDocuments.mockReturnValue({
      ...mockHookReturn,
      documents: [],
    });

    render(<Documents />);

    expect(screen.getByText('No documents yet')).toBeInTheDocument();
    expect(screen.getByText('Upload your first document to get started with AI analysis')).toBeInTheDocument();
  });

  it('shows error state correctly', () => {
    mockUseDocuments.mockReturnValue({
      ...mockHookReturn,
      error: 'Failed to load documents',
    });

    render(<Documents />);

    expect(screen.getByText('Failed to load documents')).toBeInTheDocument();
  });

  it('shows upload progress when files are uploading', () => {
    const mockUploads = [
      {
        id: 'upload-1',
        file: createMockFile('test.pdf', 1024, 'application/pdf'),
        name: 'test.pdf',
        size: 1024,
        type: 'pdf' as const,
        status: 'uploading' as const,
        progress: 50,
        uploadedAt: new Date(),
      }
    ];

    mockUseDocuments.mockReturnValue({
      ...mockHookReturn,
      uploads: mockUploads,
    });

    render(<Documents />);

    // Open upload interface
    const uploadButton = screen.getByText('📁 Upload Documents');
    fireEvent.click(uploadButton);

    expect(screen.getByText('Upload Progress')).toBeInTheDocument();
    expect(screen.getByText('test.pdf')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('closes upload interface after file selection', async () => {
    render(<Documents />);

    // Open upload interface
    const uploadButton = screen.getByText('📁 Upload Documents');
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText('Upload Documents')).toBeInTheDocument();
    });

    // Simulate file selection
    const fileInput = screen.getByLabelText(/select files/i);
    const testFile = createMockFile('test.pdf', 1024, 'application/pdf');

    fireEvent.change(fileInput, {
      target: { files: [testFile] }
    });

    await waitFor(() => {
      expect(screen.queryByText('Upload Documents')).not.toBeInTheDocument();
    });
  });

  it('handles loading states correctly', () => {
    mockUseDocuments.mockReturnValue({
      ...mockHookReturn,
      loading: true,
    });

    render(<Documents />);

    const refreshButton = screen.getByText(/Refresh/);
    expect(refreshButton).toBeDisabled();
  });
});