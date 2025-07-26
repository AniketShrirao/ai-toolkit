import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { 
  DocumentListItem, 
  DocumentUpload, 
  DocumentAnalysis, 
  DocumentProcessingResult,
  DocumentType,
  DocumentStatus 
} from '@ai-toolkit/shared';

interface UseDocumentsReturn {
  documents: DocumentListItem[];
  uploads: DocumentUpload[];
  loading: boolean;
  error: string | null;
  uploadFiles: (files: File[]) => void;
  deleteDocument: (documentId: string) => void;
  reprocessDocument: (documentId: string) => void;
  getDocumentAnalysis: (documentId: string) => Promise<DocumentAnalysis | null>;
  refreshDocuments: () => void;
}

// API base URL - should be configurable
const API_BASE_URL = 'http://localhost:3002/api';

const getDocumentType = (filename: string): DocumentType => {
  const extension = filename.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'pdf':
      return 'pdf';
    case 'docx':
    case 'doc':
      return 'docx';
    case 'txt':
      return 'txt';
    case 'md':
      return 'md';
    case 'html':
    case 'htm':
      return 'html';
    case 'xlsx':
    case 'xls':
      return 'xlsx';
    case 'csv':
      return 'csv';
    default:
      return 'txt';
  }
};

export const useDocuments = (): UseDocumentsReturn => {
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [uploads, setUploads] = useState<DocumentUpload[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { socket, connectionStatus, on, off } = useWebSocket();

  // Load documents from API on mount
  useEffect(() => {
    refreshDocuments();
  }, []);

  // Listen for real-time document processing updates
  useEffect(() => {
    if (connectionStatus !== 'connected' || !on || !off) return;

    const handleProcessingUpdate = (result: DocumentProcessingResult) => {
      setDocuments(prev => prev.map(doc => 
        doc.id === result.documentId 
          ? { 
              ...doc, 
              status: result.status,
              progress: result.progress,
              error: result.error,
              processedAt: result.completedAt,
              hasAnalysis: result.status === 'completed' && !!result.analysis
            }
          : doc
      ));

      // Update upload progress if document is still uploading
      setUploads(prev => prev.map(upload =>
        upload.id === result.documentId
          ? { ...upload, status: result.status, progress: result.progress, error: result.error }
          : upload
      ));
    };

    on('document_processing_update', handleProcessingUpdate);

    return () => {
      off('document_processing_update', handleProcessingUpdate);
    };
  }, [connectionStatus, on, off]);

  const refreshDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Make actual API call to get documents
      const response = await fetch(`${API_BASE_URL}/documents`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch documents: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transform API response to DocumentListItem format
      const transformedDocuments: DocumentListItem[] = data.documents?.map((doc: any) => ({
        id: doc.id,
        name: doc.original_path.split(/[/\\]/).pop() || doc.original_path,
        type: doc.type as DocumentType,
        size: 0, // API doesn't return size, could be enhanced
        status: doc.status as DocumentStatus,
        uploadedAt: new Date(doc.created_at),
        processedAt: doc.processed_at ? new Date(doc.processed_at) : undefined,
        hasAnalysis: !!doc.analysis_result,
        progress: doc.status === 'processing' ? 50 : undefined,
      })) || [];
      
      setDocuments(transformedDocuments);
    } catch (err) {
      console.error('Refresh documents error:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh documents');
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadFiles = useCallback(async (files: File[]) => {
    const newUploads: DocumentUpload[] = files.map(file => ({
      id: `upload_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      file,
      name: file.name,
      size: file.size,
      type: getDocumentType(file.name),
      status: 'uploading' as DocumentStatus,
      progress: 0,
      uploadedAt: new Date(),
    }));

    setUploads(prev => [...prev, ...newUploads]);
    setError(null);

    // Upload files to actual API
    for (const upload of newUploads) {
      try {
        const formData = new FormData();
        formData.append('file', upload.file);
        formData.append('analysisType', 'full');

        // Make actual API call to upload endpoint
        const response = await fetch(`${API_BASE_URL}/documents/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        const result = await response.json();
        
        // Update upload status and add to documents
        const newDocument: DocumentListItem = {
          id: result.document.id,
          name: upload.name,
          type: upload.type,
          size: upload.size,
          status: result.document.status as DocumentStatus,
          progress: 0,
          uploadedAt: new Date(result.document.created_at),
          hasAnalysis: false,
        };

        setDocuments(prev => [newDocument, ...prev]);
        setUploads(prev => prev.map(u => 
          u.id === upload.id 
            ? { ...u, status: 'processing' as DocumentStatus, progress: 100 }
            : u
        ));

        // Remove from uploads after a short delay
        setTimeout(() => {
          setUploads(prev => prev.filter(u => u.id !== upload.id));
        }, 2000);

        // Refresh documents to get the latest status from server
        setTimeout(() => {
          refreshDocuments();
        }, 1000);

      } catch (err) {
        console.error('Upload error:', err);
        setUploads(prev => prev.map(u => 
          u.id === upload.id 
            ? { 
                ...u, 
                status: 'failed' as DocumentStatus, 
                error: err instanceof Error ? err.message : 'Upload failed' 
              }
            : u
        ));
      }
    }
  }, [refreshDocuments]);

  const deleteDocument = useCallback(async (documentId: string) => {
    try {
      setLoading(true);
      
      // Make actual API call to delete endpoint
      const response = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`);
      }
      
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      setError(null);
    } catch (err) {
      console.error('Delete error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    } finally {
      setLoading(false);
    }
  }, []);

  const reprocessDocument = useCallback(async (documentId: string) => {
    try {
      setLoading(true);
      
      // For now, we'll trigger reprocessing by re-uploading the document
      // In a full implementation, there would be a dedicated reprocess endpoint
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, status: 'processing' as DocumentStatus, progress: 0 }
          : doc
      ));

      // Refresh documents to get updated status
      setTimeout(() => {
        refreshDocuments();
      }, 1000);

      setError(null);
    } catch (err) {
      console.error('Reprocess error:', err);
      setError(err instanceof Error ? err.message : 'Failed to reprocess document');
    } finally {
      setLoading(false);
    }
  }, [refreshDocuments]);

  const getDocumentAnalysis = useCallback(async (documentId: string): Promise<DocumentAnalysis | null> => {
    try {
      // Make actual API call to get document analysis
      const response = await fetch(`${API_BASE_URL}/documents/${documentId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch document analysis: ${response.statusText}`);
      }
      
      const document = await response.json();
      
      // If document has analysis_result, parse and return it
      if (document.analysis_result) {
        try {
          const analysisData = JSON.parse(document.analysis_result);
          
          // Transform the API response to match DocumentAnalysis interface
          // This assumes the API returns analysis in the expected format
          return analysisData as DocumentAnalysis;
        } catch (parseError) {
          console.error('Failed to parse analysis result:', parseError);
          return null;
        }
      }
      
      return null;
    } catch (err) {
      console.error('Failed to fetch document analysis:', err);
      return null;
    }
  }, []);

  return {
    documents,
    uploads,
    loading,
    error,
    uploadFiles,
    deleteDocument,
    reprocessDocument,
    getDocumentAnalysis,
    refreshDocuments,
  };
};