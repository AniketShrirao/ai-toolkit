import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { DocumentList } from '../DocumentList';
import { DocumentListItem } from '@shared/types/document';

const mockDocuments: DocumentListItem[] = [
  {
    id: '1',
    name: 'Project Requirements.pdf',
    type: 'pdf',
    size: 2048576,
    status: 'completed',
    uploadedAt: new Date('2024-01-15T10:30:00'),
    processedAt: new Date('2024-01-15T10:32:00'),
    hasAnalysis: true,
  },
  {
    id: '2',
    name: 'Technical Specification.docx',
    type: 'docx',
    size: 1536000,
    status: 'processing',
    progress: 75,
    uploadedAt: new Date('2024-01-15T11:00:00'),
    hasAnalysis: false,
  },
  {
    id: '3',
    name: 'Meeting Notes.md',
    type: 'md',
    size: 8192,
    status: 'failed',
    uploadedAt: new Date('2024-01-15T09:15:00'),
    error: 'Failed to extract text content',
    hasAnalysis: false,
  },
];

describe('DocumentList', () => {
  const mockOnDocumentSelect = vi.fn();
  const mockOnDocumentDelete = vi.fn();
  const mockOnRefresh = vi.fn();

  beforeEach(() => {
    mockOnDocumentSelect.mockClear();
    mockOnDocumentDelete.mockClear();
    mockOnRefresh.mockClear();
  });

  it('renders document list correctly', () => {
    render(
      <DocumentList
        documents={mockDocuments}
        onDocumentSelect={mockOnDocumentSelect}
        onDocumentDelete={mockOnDocumentDelete}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText('Project Requirements.pdf')).toBeInTheDocument();
    expect(screen.getByText('Technical Specification.docx')).toBeInTheDocument();
    expect(screen.getByText('Meeting Notes.md')).toBeInTheDocument();
    expect(screen.getByText('Showing 3 of 3 documents')).toBeInTheDocument();
  });

  it('displays empty state when no documents', () => {
    render(
      <DocumentList
        documents={[]}
        onDocumentSelect={mockOnDocumentSelect}
        onDocumentDelete={mockOnDocumentDelete}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText('No documents found')).toBeInTheDocument();
    expect(screen.getByText('Upload your first document to get started')).toBeInTheDocument();
  });

  it('handles search filtering correctly', async () => {
    render(
      <DocumentList
        documents={mockDocuments}
        onDocumentSelect={mockOnDocumentSelect}
        onDocumentDelete={mockOnDocumentDelete}
        onRefresh={mockOnRefresh}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search documents...');
    fireEvent.change(searchInput, { target: { value: 'requirements' } });

    await waitFor(() => {
      expect(screen.getByText('Project Requirements.pdf')).toBeInTheDocument();
      expect(screen.queryByText('Technical Specification.docx')).not.toBeInTheDocument();
      expect(screen.queryByText('Meeting Notes.md')).not.toBeInTheDocument();
      expect(screen.getByText('Showing 1 of 3 documents')).toBeInTheDocument();
    });
  });

  it('handles type filtering correctly', async () => {
    render(
      <DocumentList
        documents={mockDocuments}
        onDocumentSelect={mockOnDocumentSelect}
        onDocumentDelete={mockOnDocumentDelete}
        onRefresh={mockOnRefresh}
      />
    );

    const typeFilter = screen.getByDisplayValue('All Types');
    fireEvent.change(typeFilter, { target: { value: 'pdf' } });

    await waitFor(() => {
      expect(screen.getByText('Project Requirements.pdf')).toBeInTheDocument();
      expect(screen.queryByText('Technical Specification.docx')).not.toBeInTheDocument();
      expect(screen.queryByText('Meeting Notes.md')).not.toBeInTheDocument();
      expect(screen.getByText('Showing 1 of 3 documents')).toBeInTheDocument();
    });
  });

  it('handles status filtering correctly', async () => {
    render(
      <DocumentList
        documents={mockDocuments}
        onDocumentSelect={mockOnDocumentSelect}
        onDocumentDelete={mockOnDocumentDelete}
        onRefresh={mockOnRefresh}
      />
    );

    const statusFilter = screen.getByDisplayValue('All Status');
    fireEvent.change(statusFilter, { target: { value: 'completed' } });

    await waitFor(() => {
      expect(screen.getByText('Project Requirements.pdf')).toBeInTheDocument();
      expect(screen.queryByText('Technical Specification.docx')).not.toBeInTheDocument();
      expect(screen.queryByText('Meeting Notes.md')).not.toBeInTheDocument();
      expect(screen.getByText('Showing 1 of 3 documents')).toBeInTheDocument();
    });
  });

  it('clears filters correctly', async () => {
    render(
      <DocumentList
        documents={mockDocuments}
        onDocumentSelect={mockOnDocumentSelect}
        onDocumentDelete={mockOnDocumentDelete}
        onRefresh={mockOnRefresh}
      />
    );

    // Apply a filter
    const searchInput = screen.getByPlaceholderText('Search documents...');
    fireEvent.change(searchInput, { target: { value: 'requirements' } });

    await waitFor(() => {
      expect(screen.getByText('Showing 1 of 3 documents')).toBeInTheDocument();
    });

    // Clear filters
    const clearButton = screen.getByText('Clear Filters');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(screen.getByText('Showing 3 of 3 documents')).toBeInTheDocument();
      expect(searchInput).toHaveValue('');
    });
  });

  it('handles sorting correctly', async () => {
    render(
      <DocumentList
        documents={mockDocuments}
        onDocumentSelect={mockOnDocumentSelect}
        onDocumentDelete={mockOnDocumentDelete}
        onRefresh={mockOnRefresh}
      />
    );

    const nameSortButton = screen.getByText(/Name/);
    fireEvent.click(nameSortButton);

    // Check if documents are sorted by name (alphabetically)
    const documentRows = screen.getAllByRole('button', { name: /View/ });
    expect(documentRows).toHaveLength(3);
  });

  it('handles document selection correctly', async () => {
    render(
      <DocumentList
        documents={mockDocuments}
        onDocumentSelect={mockOnDocumentSelect}
        onDocumentDelete={mockOnDocumentDelete}
        onRefresh={mockOnRefresh}
      />
    );

    const documentRow = screen.getByText('Project Requirements.pdf').closest('.document-list-table-row');
    fireEvent.click(documentRow!);

    expect(mockOnDocumentSelect).toHaveBeenCalledWith(mockDocuments[0]);
  });

  it('handles document deletion correctly', async () => {
    render(
      <DocumentList
        documents={mockDocuments}
        onDocumentSelect={mockOnDocumentSelect}
        onDocumentDelete={mockOnDocumentDelete}
        onRefresh={mockOnRefresh}
      />
    );

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    expect(mockOnDocumentDelete).toHaveBeenCalledWith('1');
  });

  it('handles refresh correctly', async () => {
    render(
      <DocumentList
        documents={mockDocuments}
        onDocumentSelect={mockOnDocumentSelect}
        onDocumentDelete={mockOnDocumentDelete}
        onRefresh={mockOnRefresh}
      />
    );

    const refreshButton = screen.getByText(/Refresh/);
    fireEvent.click(refreshButton);

    expect(mockOnRefresh).toHaveBeenCalled();
  });

  it('displays document status badges correctly', () => {
    render(
      <DocumentList
        documents={mockDocuments}
        onDocumentSelect={mockOnDocumentSelect}
        onDocumentDelete={mockOnDocumentDelete}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Processing')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('displays analysis indicator for analyzed documents', () => {
    render(
      <DocumentList
        documents={mockDocuments}
        onDocumentSelect={mockOnDocumentSelect}
        onDocumentDelete={mockOnDocumentDelete}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText('✨ Analyzed')).toBeInTheDocument();
  });

  it('formats file sizes correctly', () => {
    render(
      <DocumentList
        documents={mockDocuments}
        onDocumentSelect={mockOnDocumentSelect}
        onDocumentDelete={mockOnDocumentDelete}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText('2 MB')).toBeInTheDocument();
    expect(screen.getByText('1.46 MB')).toBeInTheDocument();
    expect(screen.getByText('8 KB')).toBeInTheDocument();
  });

  it('shows loading state correctly', () => {
    render(
      <DocumentList
        documents={mockDocuments}
        onDocumentSelect={mockOnDocumentSelect}
        onDocumentDelete={mockOnDocumentDelete}
        onRefresh={mockOnRefresh}
        loading={true}
      />
    );

    const refreshButton = screen.getByText(/Refresh/);
    expect(refreshButton).toBeDisabled();
  });
});