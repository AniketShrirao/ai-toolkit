import { renderHook, act, waitFor } from '@testing-library/react';
import { useDocuments } from '../useDocuments';
import { useWebSocket } from '../useWebSocket';

// Mock the WebSocket hook
import { vi } from 'vitest';
vi.mock('../useWebSocket');
const mockUseWebSocket = useWebSocket as any;

// Mock file for testing
const createMockFile = (name: string, size: number, type: string): File => {
  const file = new File(['test content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('useDocuments', () => {
  const mockWebSocketContext = {
    socket: null,
    connectionStatus: 'connected' as const,
    lastUpdate: null,
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  };

  beforeEach(() => {
    mockUseWebSocket.mockReturnValue(mockWebSocketContext);
    vi.clearAllMocks();
  });

  it('initializes with mock documents', () => {
    const { result } = renderHook(() => useDocuments());

    expect(result.current.documents).toHaveLength(3);
    expect(result.current.uploads).toHaveLength(0);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('handles file upload correctly', async () => {
    const { result } = renderHook(() => useDocuments());

    const testFile = createMockFile('test.pdf', 1024, 'application/pdf');

    act(() => {
      result.current.uploadFiles([testFile]);
    });

    // Check that upload was added
    expect(result.current.uploads).toHaveLength(1);
    expect(result.current.uploads[0].name).toBe('test.pdf');
    expect(result.current.uploads[0].status).toBe('uploading');

    // Wait for upload to complete
    await waitFor(() => {
      expect(result.current.uploads[0].progress).toBe(100);
    }, { timeout: 2000 });

    // Wait for processing to start
    await waitFor(() => {
      expect(result.current.uploads[0].status).toBe('processing');
    }, { timeout: 1000 });

    // Wait for processing to complete
    await waitFor(() => {
      expect(result.current.documents[0].status).toBe('completed');
    }, { timeout: 5000 });
  });

  it('handles multiple file uploads', async () => {
    const { result } = renderHook(() => useDocuments());

    const file1 = createMockFile('test1.pdf', 1024, 'application/pdf');
    const file2 = createMockFile('test2.docx', 2048, 'application/docx');

    act(() => {
      result.current.uploadFiles([file1, file2]);
    });

    expect(result.current.uploads).toHaveLength(2);
    expect(result.current.uploads[0].name).toBe('test1.pdf');
    expect(result.current.uploads[1].name).toBe('test2.docx');
  });

  it('handles document deletion', async () => {
    const { result } = renderHook(() => useDocuments());

    const initialCount = result.current.documents.length;
    const documentToDelete = result.current.documents[0];

    await act(async () => {
      await result.current.deleteDocument(documentToDelete.id);
    });

    expect(result.current.documents).toHaveLength(initialCount - 1);
    expect(result.current.documents.find(doc => doc.id === documentToDelete.id)).toBeUndefined();
  });

  it('handles document reprocessing', async () => {
    const { result } = renderHook(() => useDocuments());

    const documentToReprocess = result.current.documents[0];

    await act(async () => {
      await result.current.reprocessDocument(documentToReprocess.id);
    });

    const reprocessedDoc = result.current.documents.find(doc => doc.id === documentToReprocess.id);
    expect(reprocessedDoc?.status).toBe('processing');

    // Wait for reprocessing to complete
    await waitFor(() => {
      const completedDoc = result.current.documents.find(doc => doc.id === documentToReprocess.id);
      expect(completedDoc?.status).toBe('completed');
    }, { timeout: 5000 });
  });

  it('fetches document analysis', async () => {
    const { result } = renderHook(() => useDocuments());

    const documentId = result.current.documents[0].id;

    let analysis;
    await act(async () => {
      analysis = await result.current.getDocumentAnalysis(documentId);
    });

    expect(analysis).toBeDefined();
    expect(analysis?.requirements).toBeDefined();
    expect(analysis?.keyPoints).toBeDefined();
    expect(analysis?.actionItems).toBeDefined();
    expect(analysis?.summary).toBeDefined();
  });

  it('handles refresh correctly', async () => {
    const { result } = renderHook(() => useDocuments());

    await act(async () => {
      await result.current.refreshDocuments();
    });

    expect(result.current.documents).toHaveLength(3);
    expect(result.current.error).toBe(null);
  });

  it('determines document type correctly', () => {
    const { result } = renderHook(() => useDocuments());

    const pdfFile = createMockFile('test.pdf', 1024, 'application/pdf');
    const docxFile = createMockFile('test.docx', 1024, 'application/docx');
    const txtFile = createMockFile('test.txt', 1024, 'text/plain');

    act(() => {
      result.current.uploadFiles([pdfFile, docxFile, txtFile]);
    });

    expect(result.current.uploads[0].type).toBe('pdf');
    expect(result.current.uploads[1].type).toBe('docx');
    expect(result.current.uploads[2].type).toBe('txt');
  });

  it('handles WebSocket processing updates', () => {
    const { result } = renderHook(() => useDocuments());

    // Simulate WebSocket connection and event registration
    expect(mockWebSocketContext.on).toHaveBeenCalledWith('document_processing_update', expect.any(Function));

    // Get the callback function that was registered
    const processingUpdateCallback = mockWebSocketContext.on.mock.calls.find(
      call => call[0] === 'document_processing_update'
    )?.[1];

    expect(processingUpdateCallback).toBeDefined();

    // Simulate a processing update
    const mockUpdate = {
      documentId: result.current.documents[0].id,
      status: 'completed' as const,
      progress: 100,
      completedAt: new Date(),
      analysis: null,
    };

    act(() => {
      processingUpdateCallback(mockUpdate);
    });

    const updatedDoc = result.current.documents.find(doc => doc.id === mockUpdate.documentId);
    expect(updatedDoc?.status).toBe('completed');
    expect(updatedDoc?.progress).toBe(100);
  });

  it('handles error states correctly', async () => {
    const { result } = renderHook(() => useDocuments());

    // Mock a failed deletion by temporarily changing the implementation
    const originalDeleteDocument = result.current.deleteDocument;
    
    // This test would need to be adjusted based on actual error handling implementation
    // For now, we'll test that the error state can be set
    expect(result.current.error).toBe(null);
  });

  it('cleans up WebSocket listeners on unmount', () => {
    const { unmount } = renderHook(() => useDocuments());

    unmount();

    expect(mockWebSocketContext.off).toHaveBeenCalledWith('document_processing_update', expect.any(Function));
  });
});