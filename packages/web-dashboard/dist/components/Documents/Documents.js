import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, CardHeader, CardContent, Button } from '@components/UI';
import { FileUpload } from './FileUpload';
import { DocumentList } from './DocumentList';
import { DocumentViewer } from './DocumentViewer';
import { useDocuments } from '@hooks/useDocuments';
import './Documents.css';
export const Documents = () => {
    const [showUpload, setShowUpload] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [documentAnalysis, setDocumentAnalysis] = useState(null);
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);
    const { documents, uploads, loading, error, uploadFiles, deleteDocument, reprocessDocument, getDocumentAnalysis, refreshDocuments, } = useDocuments();
    const handleFilesSelected = (files) => {
        uploadFiles(files);
        setShowUpload(false);
    };
    const handleDocumentSelect = async (document) => {
        setSelectedDocument(document);
        setDocumentAnalysis(null);
        if (document.hasAnalysis) {
            setLoadingAnalysis(true);
            try {
                const analysis = await getDocumentAnalysis(document.id);
                setDocumentAnalysis(analysis);
            }
            catch (err) {
                console.error('Failed to load document analysis:', err);
            }
            finally {
                setLoadingAnalysis(false);
            }
        }
    };
    const handleDocumentClose = () => {
        setSelectedDocument(null);
        setDocumentAnalysis(null);
    };
    const handleReprocess = async (documentId) => {
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
        return (_jsx("div", { className: "documents documents-viewer-mode", children: _jsx(DocumentViewer, { document: selectedDocument, analysis: loadingAnalysis ? undefined : documentAnalysis || undefined, onClose: handleDocumentClose, onReprocess: handleReprocess }) }));
    }
    return (_jsxs("div", { className: "documents", children: [_jsxs("div", { className: "documents-header", children: [_jsx("h1", { children: "Documents" }), _jsx("p", { children: "Upload and manage your documents for AI processing" })] }), error && (_jsxs("div", { className: "documents-error", children: [_jsx("span", { className: "error-icon", children: "\u26A0\uFE0F" }), error] })), showUpload ? (_jsxs(Card, { className: "documents-upload-card", children: [_jsx(CardHeader, { children: _jsxs("div", { className: "upload-header", children: [_jsx("h2", { children: "Upload Documents" }), _jsx(Button, { variant: "ghost", onClick: () => setShowUpload(false), children: "\u2715" })] }) }), _jsx(CardContent, { children: _jsx(FileUpload, { onFilesSelected: handleFilesSelected, uploads: uploads, maxFileSize: 50, multiple: true }) })] })) : (_jsxs("div", { className: "documents-actions", children: [_jsx(Button, { variant: "primary", onClick: () => setShowUpload(true), children: "\uD83D\uDCC1 Upload Documents" }), _jsxs(Button, { variant: "outline", onClick: refreshDocuments, disabled: loading, children: [loading ? '🔄' : '↻', " Refresh"] })] })), documents.length === 0 && uploads.length === 0 && !showUpload ? (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx("h2", { children: "Document Library" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "empty-state", children: [_jsx("div", { className: "empty-icon", children: "\uD83D\uDCC4" }), _jsx("h3", { children: "No documents yet" }), _jsx("p", { children: "Upload your first document to get started with AI analysis" }), _jsx(Button, { variant: "primary", onClick: () => setShowUpload(true), children: "Upload Document" })] }) })] })) : (!showUpload && (_jsx(DocumentList, { documents: documents, onDocumentSelect: handleDocumentSelect, onDocumentDelete: deleteDocument, onRefresh: refreshDocuments, loading: loading })))] }));
};
//# sourceMappingURL=Documents.js.map