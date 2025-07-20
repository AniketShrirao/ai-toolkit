import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { FileUpload } from '../FileUpload';
import { DocumentUpload } from '@shared/types/document';

// Mock file for testing
const createMockFile = (name: string, size: number, type: string): File => {
  const file = new File(['test content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('FileUpload', () => {
  const mockOnFilesSelected = vi.fn();
  const mockUploads: DocumentUpload[] = [];

  beforeEach(() => {
    mockOnFilesSelected.mockClear();
  });

  it('renders upload dropzone correctly', () => {
    render(
      <FileUpload
        onFilesSelected={mockOnFilesSelected}
        uploads={mockUploads}
      />
    );

    expect(screen.getByText('Drop files here or click to browse')).toBeInTheDocument();
    expect(screen.getByText(/Supported formats:/)).toBeInTheDocument();
    expect(screen.getByText(/Maximum file size: 50MB/)).toBeInTheDocument();
    expect(screen.getByText('Select Files')).toBeInTheDocument();
  });

  it('handles file selection through input', async () => {
    render(
      <FileUpload
        onFilesSelected={mockOnFilesSelected}
        uploads={mockUploads}
      />
    );

    const fileInput = screen.getByLabelText(/select files/i);
    const testFile = createMockFile('test.pdf', 1024, 'application/pdf');

    fireEvent.change(fileInput, {
      target: { files: [testFile] }
    });

    await waitFor(() => {
      expect(mockOnFilesSelected).toHaveBeenCalledWith([testFile]);
    });
  });

  it('validates file size correctly', async () => {
    render(
      <FileUpload
        onFilesSelected={mockOnFilesSelected}
        uploads={mockUploads}
        maxFileSize={1} // 1MB limit
      />
    );

    const fileInput = screen.getByLabelText(/select files/i);
    const largeFile = createMockFile('large.pdf', 2 * 1024 * 1024, 'application/pdf'); // 2MB

    fireEvent.change(fileInput, {
      target: { files: [largeFile] }
    });

    await waitFor(() => {
      expect(screen.getByText(/File "large.pdf" is too large/)).toBeInTheDocument();
      expect(mockOnFilesSelected).not.toHaveBeenCalled();
    });
  });

  it('validates file type correctly', async () => {
    render(
      <FileUpload
        onFilesSelected={mockOnFilesSelected}
        uploads={mockUploads}
        acceptedTypes={['pdf']}
      />
    );

    const fileInput = screen.getByLabelText(/select files/i);
    const invalidFile = createMockFile('test.exe', 1024, 'application/exe');

    fireEvent.change(fileInput, {
      target: { files: [invalidFile] }
    });

    await waitFor(() => {
      expect(screen.getByText(/File "test.exe" has an unsupported format/)).toBeInTheDocument();
      expect(mockOnFilesSelected).not.toHaveBeenCalled();
    });
  });

  it('handles drag and drop correctly', async () => {
    render(
      <FileUpload
        onFilesSelected={mockOnFilesSelected}
        uploads={mockUploads}
      />
    );

    const dropzone = screen.getByText('Drop files here or click to browse').closest('.file-upload-dropzone');
    const testFile = createMockFile('test.pdf', 1024, 'application/pdf');

    // Simulate drag over
    fireEvent.dragOver(dropzone!, {
      dataTransfer: { files: [testFile] }
    });

    expect(dropzone).toHaveClass('dragover');

    // Simulate drop
    fireEvent.drop(dropzone!, {
      dataTransfer: { files: [testFile] }
    });

    await waitFor(() => {
      expect(mockOnFilesSelected).toHaveBeenCalledWith([testFile]);
      expect(dropzone).not.toHaveClass('dragover');
    });
  });

  it('displays upload progress correctly', () => {
    const uploadsWithProgress: DocumentUpload[] = [
      {
        id: '1',
        file: createMockFile('test.pdf', 1024, 'application/pdf'),
        name: 'test.pdf',
        size: 1024,
        type: 'pdf',
        status: 'uploading',
        progress: 50,
        uploadedAt: new Date(),
      },
      {
        id: '2',
        file: createMockFile('doc.docx', 2048, 'application/docx'),
        name: 'doc.docx',
        size: 2048,
        type: 'docx',
        status: 'completed',
        progress: 100,
        uploadedAt: new Date(),
      }
    ];

    render(
      <FileUpload
        onFilesSelected={mockOnFilesSelected}
        uploads={uploadsWithProgress}
      />
    );

    expect(screen.getByText('Upload Progress')).toBeInTheDocument();
    expect(screen.getByText('test.pdf')).toBeInTheDocument();
    expect(screen.getByText('doc.docx')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('displays upload errors correctly', () => {
    const uploadsWithError: DocumentUpload[] = [
      {
        id: '1',
        file: createMockFile('failed.pdf', 1024, 'application/pdf'),
        name: 'failed.pdf',
        size: 1024,
        type: 'pdf',
        status: 'failed',
        progress: 0,
        error: 'Upload failed due to network error',
        uploadedAt: new Date(),
      }
    ];

    render(
      <FileUpload
        onFilesSelected={mockOnFilesSelected}
        uploads={uploadsWithError}
      />
    );

    expect(screen.getByText('Upload failed due to network error')).toBeInTheDocument();
  });

  it('handles multiple file selection when enabled', async () => {
    render(
      <FileUpload
        onFilesSelected={mockOnFilesSelected}
        uploads={mockUploads}
        multiple={true}
      />
    );

    const fileInput = screen.getByLabelText(/select files/i);
    const file1 = createMockFile('test1.pdf', 1024, 'application/pdf');
    const file2 = createMockFile('test2.pdf', 1024, 'application/pdf');

    fireEvent.change(fileInput, {
      target: { files: [file1, file2] }
    });

    await waitFor(() => {
      expect(mockOnFilesSelected).toHaveBeenCalledWith([file1, file2]);
    });
  });

  it('formats file sizes correctly', () => {
    const uploadsWithDifferentSizes: DocumentUpload[] = [
      {
        id: '1',
        file: createMockFile('small.txt', 512, 'text/plain'),
        name: 'small.txt',
        size: 512,
        type: 'txt',
        status: 'completed',
        progress: 100,
        uploadedAt: new Date(),
      },
      {
        id: '2',
        file: createMockFile('medium.pdf', 1024 * 1024, 'application/pdf'),
        name: 'medium.pdf',
        size: 1024 * 1024,
        type: 'pdf',
        status: 'completed',
        progress: 100,
        uploadedAt: new Date(),
      }
    ];

    render(
      <FileUpload
        onFilesSelected={mockOnFilesSelected}
        uploads={uploadsWithDifferentSizes}
      />
    );

    expect(screen.getByText('512 Bytes')).toBeInTheDocument();
    expect(screen.getByText('1 MB')).toBeInTheDocument();
  });
});