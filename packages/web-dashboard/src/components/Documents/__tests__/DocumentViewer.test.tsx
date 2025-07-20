import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { DocumentViewer } from '../DocumentViewer';
import { DocumentListItem, DocumentAnalysis } from '@ai-toolkit/shared';

const mockDocument: DocumentListItem = {
  id: '1',
  name: 'Project Requirements.pdf',
  type: 'pdf',
  size: 2048576,
  status: 'completed',
  uploadedAt: new Date('2024-01-15T10:30:00'),
  processedAt: new Date('2024-01-15T10:32:00'),
  hasAnalysis: true,
};

const mockAnalysis: DocumentAnalysis = {
  structure: {
    sections: [
      { id: '1', title: 'Introduction', level: 1, content: 'Project overview...', startPage: 1, endPage: 2 },
      { id: '2', title: 'Requirements', level: 1, content: 'System requirements...', startPage: 3, endPage: 8 },
    ],
    headings: [
      { level: 1, text: 'Introduction', page: 1 },
      { level: 1, text: 'Requirements', page: 3 },
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
        type: 'functional',
        priority: 'high',
        description: 'The system shall allow users to upload documents for AI analysis',
        acceptanceCriteria: [
          'Users can drag and drop files',
          'Progress indicators are shown during upload',
        ],
        complexity: 3,
        estimatedHours: 8,
        category: 'File Management'
      }
    ],
    nonFunctional: [
      {
        id: 'req-2',
        type: 'non-functional',
        priority: 'medium',
        description: 'The system shall process documents within 2 minutes',
        acceptanceCriteria: [
          'Processing time is under 2 minutes',
        ],
        complexity: 4,
        estimatedHours: 12,
        category: 'Performance'
      }
    ],
    totalCount: 2
  },
  keyPoints: [
    {
      id: 'kp-1',
      text: 'The system must integrate with Ollama for local AI processing',
      importance: 'high',
      category: 'Architecture',
      context: 'Mentioned in technical requirements section'
    }
  ],
  actionItems: [
    {
      id: 'ai-1',
      description: 'Set up Ollama integration and test with sample models',
      priority: 'high',
      status: 'pending',
      deadline: new Date('2024-02-01')
    }
  ],
  summary: {
    length: 'medium',
    content: 'This document outlines the requirements for an AI-powered document analysis system.',
    keyPoints: [
      'Local AI processing with Ollama integration',
      'Support for multiple document formats',
    ],
    wordCount: 156
  },
  contentCategories: [
    { type: 'Technical Requirements', confidence: 0.95, description: 'System and technical specifications' }
  ]
};

describe('DocumentViewer', () => {
  const mockOnClose = vi.fn();
  const mockOnReprocess = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnReprocess.mockClear();
  });

  it('renders document viewer correctly', () => {
    render(
      <DocumentViewer
        document={mockDocument}
        analysis={mockAnalysis}
        onClose={mockOnClose}
        onReprocess={mockOnReprocess}
      />
    );

    expect(screen.getByRole('heading', { name: 'Project Requirements.pdf' })).toBeInTheDocument();
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Requirements/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Key Points/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Actions/ })).toBeInTheDocument();
    expect(screen.getByText('Summary')).toBeInTheDocument();
  });

  it('handles close button correctly', () => {
    render(
      <DocumentViewer
        document={mockDocument}
        analysis={mockAnalysis}
        onClose={mockOnClose}
        onReprocess={mockOnReprocess}
      />
    );

    const closeButton = screen.getByText('✕');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles reprocess button correctly', () => {
    render(
      <DocumentViewer
        document={mockDocument}
        analysis={mockAnalysis}
        onClose={mockOnClose}
        onReprocess={mockOnReprocess}
      />
    );

    const reprocessButton = screen.getByText(/Reprocess/);
    fireEvent.click(reprocessButton);

    expect(mockOnReprocess).toHaveBeenCalledWith('1');
  });

  it('displays overview tab correctly', () => {
    render(
      <DocumentViewer
        document={mockDocument}
        analysis={mockAnalysis}
        onClose={mockOnClose}
        onReprocess={mockOnReprocess}
      />
    );

    expect(screen.getByText('File Name')).toBeInTheDocument();
    expect(screen.getByText('File Size')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Uploaded')).toBeInTheDocument();
    expect(screen.getByText('Processed')).toBeInTheDocument();
    expect(screen.getByText('Analysis Summary')).toBeInTheDocument();
  });

  it('switches tabs correctly', () => {
    render(
      <DocumentViewer
        document={mockDocument}
        analysis={mockAnalysis}
        onClose={mockOnClose}
        onReprocess={mockOnReprocess}
      />
    );

    // Click on Requirements tab using role
    const requirementsTab = screen.getByRole('button', { name: /Requirements/ });
    fireEvent.click(requirementsTab);

    expect(screen.getByText('Functional Requirements (1)')).toBeInTheDocument();
    expect(screen.getByText('Non-Functional Requirements (1)')).toBeInTheDocument();
    expect(screen.getByText('The system shall allow users to upload documents for AI analysis')).toBeInTheDocument();
  });

  it('displays requirements correctly', () => {
    render(
      <DocumentViewer
        document={mockDocument}
        analysis={mockAnalysis}
        onClose={mockOnClose}
        onReprocess={mockOnReprocess}
      />
    );

    // Switch to requirements tab using role
    const requirementsTab = screen.getByRole('button', { name: /Requirements/ });
    fireEvent.click(requirementsTab);

    expect(screen.getByText('high')).toBeInTheDocument();
    expect(screen.getByText('functional')).toBeInTheDocument();
    expect(screen.getByText('8h')).toBeInTheDocument();
    expect(screen.getAllByText('Acceptance Criteria:')).toHaveLength(2); // One for each requirement
    expect(screen.getByText('Users can drag and drop files')).toBeInTheDocument();
  });

  it('displays key points correctly', () => {
    render(
      <DocumentViewer
        document={mockDocument}
        analysis={mockAnalysis}
        onClose={mockOnClose}
        onReprocess={mockOnReprocess}
      />
    );

    // Switch to key points tab using role
    const keyPointsTab = screen.getByRole('button', { name: /Key Points/ });
    fireEvent.click(keyPointsTab);

    expect(screen.getByText('The system must integrate with Ollama for local AI processing')).toBeInTheDocument();
    expect(screen.getByText('Architecture')).toBeInTheDocument();
    expect(screen.getByText('Context:')).toBeInTheDocument();
    expect(screen.getByText('Mentioned in technical requirements section')).toBeInTheDocument();
  });

  it('displays action items correctly', () => {
    render(
      <DocumentViewer
        document={mockDocument}
        analysis={mockAnalysis}
        onClose={mockOnClose}
        onReprocess={mockOnReprocess}
      />
    );

    // Switch to actions tab
    const actionsTab = screen.getByText('Actions');
    fireEvent.click(actionsTab);

    expect(screen.getByText('Set up Ollama integration and test with sample models')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
    expect(screen.getByText(/Due:/)).toBeInTheDocument();
  });

  it('displays summary correctly', () => {
    render(
      <DocumentViewer
        document={mockDocument}
        analysis={mockAnalysis}
        onClose={mockOnClose}
        onReprocess={mockOnReprocess}
      />
    );

    // Switch to summary tab
    const summaryTab = screen.getByText('Summary');
    fireEvent.click(summaryTab);

    expect(screen.getByText('medium summary')).toBeInTheDocument();
    expect(screen.getByText('156 words')).toBeInTheDocument();
    expect(screen.getByText('This document outlines the requirements for an AI-powered document analysis system.')).toBeInTheDocument();
    expect(screen.getByText('Key Points:')).toBeInTheDocument();
    expect(screen.getByText('Local AI processing with Ollama integration')).toBeInTheDocument();
  });

  it('displays tab counts correctly', () => {
    render(
      <DocumentViewer
        document={mockDocument}
        analysis={mockAnalysis}
        onClose={mockOnClose}
        onReprocess={mockOnReprocess}
      />
    );

    // Check that tabs show correct counts by looking for badges in tabs
    const requirementsTab = screen.getByRole('button', { name: /Requirements/ });
    expect(requirementsTab).toHaveTextContent('2');
    
    const keyPointsTab = screen.getByRole('button', { name: /Key Points/ });
    expect(keyPointsTab).toHaveTextContent('1');
  });

  it('handles document without analysis', () => {
    const documentWithoutAnalysis = { ...mockDocument, hasAnalysis: false };

    render(
      <DocumentViewer
        document={documentWithoutAnalysis}
        onClose={mockOnClose}
        onReprocess={mockOnReprocess}
      />
    );

    // Switch to requirements tab
    const requirementsTab = screen.getByText('Requirements');
    fireEvent.click(requirementsTab);

    expect(screen.getByText('No requirements extracted')).toBeInTheDocument();
  });

  it('formats dates correctly', () => {
    render(
      <DocumentViewer
        document={mockDocument}
        analysis={mockAnalysis}
        onClose={mockOnClose}
        onReprocess={mockOnReprocess}
      />
    );

    expect(screen.getAllByText(/January 15, 2024/)).toHaveLength(2); // Upload and processed dates
  });

  it('formats file sizes correctly', () => {
    render(
      <DocumentViewer
        document={mockDocument}
        analysis={mockAnalysis}
        onClose={mockOnClose}
        onReprocess={mockOnReprocess}
      />
    );

    expect(screen.getByText('1.95 MB')).toBeInTheDocument();
  });
});