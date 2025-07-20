import React, { useState } from 'react';
import { Card, CardHeader, CardContent, Button } from '@components/UI';
import { FileUpload } from './FileUpload';
import { DocumentList } from './DocumentList';
import { DocumentViewer } from './DocumentViewer';
import { useDocuments } from '@hooks/useDocuments';
import { DocumentListItem, DocumentAnalysis } from '@ai-toolkit/shared';
import './Documents.css';

export const Documents: React.FC = () => {
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentListItem | null>(null);
  const [documentAnalysis, setDocumentAnalysis] = useState<DocumentAnalysis | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const {
    documents,
    uploads,
    loading,
    error,
    uploadFiles,
    deleteDocument,
    reprocessDocument,
    getDocumentAnalysis,
    refreshDocuments,
  } = useDocuments();

  const handleFilesSelected = (files: File[]) => {
    uploadFiles(files);
    setShowUpload(false);
  };

  const handleDocumentSelect = async (document: DocumentListItem) => {
    setSelectedDocument(document);
    setDocumentAnalysis(null);
    
    if (document.hasAnalysis) {
      setLoadingAnalysis(true);
      try {
        const analysis = await getDocumentAnalysis(document.id);
        setDocumentAnalysis(analysis);
      } catch (err) {
        console.error('Failed to load document analysis:', err);
      } finally {
        setLoadingAnalysis(false);
      }
    }
  };

  const handleDocumentClose = () => {
    setSelectedDocument(null);
    setDocumentAnalysis(null);
  };

  const handleReprocess = async (documentId: string) => {
    await reprocessDocument(documentId);
    // Refresh analysis if this document is currently selected
    if (selectedDocument?.id === documentId) {
      setTimeout(async () => {
        const analysis = await getDocumentAnalysis(documentId);
        setDocumentAnalysis(analysis);
      }, 3000);
    }
  };

  if (selectedDocument) {
    return (
      <div className="documents documents-viewer-mode">
        <DocumentViewer
          document={selectedDocument}
          analysis={loadingAnalysis ? undefined : documentAnalysis || undefined}
          onClose={handleDocumentClose}
          onReprocess={handleReprocess}
        />
      </div>
    );
  }

  return (
    <div className="documents">
      <div className="documents-header">
        <h1>Documents</h1>
        <p>Upload and manage your documents for AI processing</p>
      </div>

      {error && (
        <div className="documents-error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {showUpload ? (
        <Card className="documents-upload-card">
          <CardHeader>
            <div className="upload-header">
              <h2>Upload Documents</h2>
              <Button 
                variant="ghost" 
                onClick={() => setShowUpload(false)}
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <FileUpload
              onFilesSelected={handleFilesSelected}
              uploads={uploads}
              maxFileSize={50}
              multiple={true}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="documents-actions">
          <Button 
            variant="primary"
            onClick={() => setShowUpload(true)}
          >
            📁 Upload Documents
          </Button>
          <Button 
            variant="outline"
            onClick={refreshDocuments}
            disabled={loading}
          >
            {loading ? '🔄' : '↻'} Refresh
          </Button>
        </div>
      )}

      {documents.length === 0 && uploads.length === 0 && !showUpload ? (
        <Card>
          <CardHeader>
            <h2>Document Library</h2>
          </CardHeader>
          <CardContent>
            <div className="empty-state">
              <div className="empty-icon">📄</div>
              <h3>No documents yet</h3>
              <p>Upload your first document to get started with AI analysis</p>
              <Button 
                variant="primary"
                onClick={() => setShowUpload(true)}
              >
                Upload Document
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        !showUpload && (
          <DocumentList
            documents={documents}
            onDocumentSelect={handleDocumentSelect}
            onDocumentDelete={deleteDocument}
            onRefresh={refreshDocuments}
            loading={loading}
          />
        )
      )}
    </div>
  );
};