import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
// Mock data for development - replace with actual API calls
const mockDocuments = [
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
const getDocumentType = (filename) => {
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
export const useDocuments = () => {
    const [documents, setDocuments] = useState(mockDocuments);
    const [uploads, setUploads] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { socket, connectionStatus, on, off } = useWebSocket();
    // Listen for real-time document processing updates
    useEffect(() => {
        if (connectionStatus !== 'connected' || !on || !off)
            return;
        const handleProcessingUpdate = (result) => {
            setDocuments(prev => prev.map(doc => doc.id === result.documentId
                ? {
                    ...doc,
                    status: result.status,
                    progress: result.progress,
                    error: result.error,
                    processedAt: result.completedAt,
                    hasAnalysis: result.status === 'completed' && !!result.analysis
                }
                : doc));
            // Update upload progress if document is still uploading
            setUploads(prev => prev.map(upload => upload.id === result.documentId
                ? { ...upload, status: result.status, progress: result.progress, error: result.error }
                : upload));
        };
        on('document_processing_update', handleProcessingUpdate);
        return () => {
            off('document_processing_update', handleProcessingUpdate);
        };
    }, [connectionStatus, on, off]);
    const uploadFiles = useCallback(async (files) => {
        const newUploads = files.map(file => ({
            id: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            file,
            name: file.name,
            size: file.size,
            type: getDocumentType(file.name),
            status: 'uploading',
            progress: 0,
            uploadedAt: new Date(),
        }));
        setUploads(prev => [...prev, ...newUploads]);
        setError(null);
        // Simulate file upload and processing
        for (const upload of newUploads) {
            try {
                // Simulate upload progress
                for (let progress = 0; progress <= 100; progress += 10) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    setUploads(prev => prev.map(u => u.id === upload.id ? { ...u, progress } : u));
                }
                // Mark as uploaded and add to documents list
                const newDocument = {
                    id: upload.id,
                    name: upload.name,
                    type: upload.type,
                    size: upload.size,
                    status: 'processing',
                    progress: 0,
                    uploadedAt: upload.uploadedAt,
                    hasAnalysis: false,
                };
                setDocuments(prev => [newDocument, ...prev]);
                setUploads(prev => prev.map(u => u.id === upload.id
                    ? { ...u, status: 'processing' }
                    : u));
                // Simulate processing
                setTimeout(() => {
                    setDocuments(prev => prev.map(doc => doc.id === upload.id
                        ? {
                            ...doc,
                            status: 'completed',
                            processedAt: new Date(),
                            hasAnalysis: true
                        }
                        : doc));
                    // Remove from uploads after processing
                    setTimeout(() => {
                        setUploads(prev => prev.filter(u => u.id !== upload.id));
                    }, 2000);
                }, 3000);
            }
            catch (err) {
                setUploads(prev => prev.map(u => u.id === upload.id
                    ? {
                        ...u,
                        status: 'failed',
                        error: 'Upload failed'
                    }
                    : u));
            }
        }
    }, []);
    const deleteDocument = useCallback(async (documentId) => {
        try {
            setLoading(true);
            // TODO: Make actual API call
            await new Promise(resolve => setTimeout(resolve, 500));
            setDocuments(prev => prev.filter(doc => doc.id !== documentId));
            setError(null);
        }
        catch (err) {
            setError('Failed to delete document');
        }
        finally {
            setLoading(false);
        }
    }, []);
    const reprocessDocument = useCallback(async (documentId) => {
        try {
            setLoading(true);
            // TODO: Make actual API call
            await new Promise(resolve => setTimeout(resolve, 500));
            setDocuments(prev => prev.map(doc => doc.id === documentId
                ? { ...doc, status: 'processing', progress: 0 }
                : doc));
            // Simulate reprocessing
            setTimeout(() => {
                setDocuments(prev => prev.map(doc => doc.id === documentId
                    ? {
                        ...doc,
                        status: 'completed',
                        processedAt: new Date(),
                        hasAnalysis: true
                    }
                    : doc));
            }, 3000);
            setError(null);
        }
        catch (err) {
            setError('Failed to reprocess document');
        }
        finally {
            setLoading(false);
        }
    }, []);
    const getDocumentAnalysis = useCallback(async (documentId) => {
        try {
            // TODO: Make actual API call
            await new Promise(resolve => setTimeout(resolve, 500));
            // Mock analysis data
            const mockAnalysis = {
                structure: {
                    sections: [
                        { id: '1', title: 'Introduction', level: 1, content: 'Project overview...', startPage: 1, endPage: 2 },
                        { id: '2', title: 'Requirements', level: 1, content: 'System requirements...', startPage: 3, endPage: 8 },
                        { id: '3', title: 'Technical Specifications', level: 1, content: 'Technical details...', startPage: 9, endPage: 15 },
                    ],
                    headings: [
                        { level: 1, text: 'Introduction', page: 1 },
                        { level: 1, text: 'Requirements', page: 3 },
                        { level: 2, text: 'Functional Requirements', page: 4 },
                        { level: 2, text: 'Non-Functional Requirements', page: 6 },
                        { level: 1, text: 'Technical Specifications', page: 9 },
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
                                'Multiple file formats are supported'
                            ],
                            complexity: 3,
                            estimatedHours: 8,
                            category: 'File Management'
                        },
                        {
                            id: 'req-2',
                            type: 'functional',
                            priority: 'medium',
                            description: 'The system shall extract and categorize requirements from documents',
                            acceptanceCriteria: [
                                'Requirements are automatically identified',
                                'Functional and non-functional requirements are separated',
                                'Confidence scores are provided'
                            ],
                            complexity: 5,
                            estimatedHours: 16,
                            category: 'AI Processing'
                        }
                    ],
                    nonFunctional: [
                        {
                            id: 'req-3',
                            type: 'non-functional',
                            priority: 'high',
                            description: 'The system shall process documents within 2 minutes for files under 50MB',
                            acceptanceCriteria: [
                                'Processing time is under 2 minutes',
                                'Progress is shown to users',
                                'System remains responsive during processing'
                            ],
                            complexity: 4,
                            estimatedHours: 12,
                            category: 'Performance'
                        }
                    ],
                    totalCount: 3
                },
                keyPoints: [
                    {
                        id: 'kp-1',
                        text: 'The system must integrate with Ollama for local AI processing',
                        importance: 'high',
                        category: 'Architecture',
                        context: 'Mentioned in technical requirements section'
                    },
                    {
                        id: 'kp-2',
                        text: 'Real-time progress updates are critical for user experience',
                        importance: 'medium',
                        category: 'UX',
                        context: 'User feedback requirements'
                    }
                ],
                actionItems: [
                    {
                        id: 'ai-1',
                        description: 'Set up Ollama integration and test with sample models',
                        priority: 'high',
                        status: 'pending',
                        deadline: new Date('2024-02-01')
                    },
                    {
                        id: 'ai-2',
                        description: 'Implement drag-and-drop file upload component',
                        priority: 'medium',
                        status: 'in-progress'
                    }
                ],
                summary: {
                    length: 'medium',
                    content: 'This document outlines the requirements for an AI-powered document analysis system that integrates with Ollama for local processing. The system should support multiple file formats, provide real-time progress updates, and extract structured information including requirements, key points, and action items.',
                    keyPoints: [
                        'Local AI processing with Ollama integration',
                        'Support for multiple document formats',
                        'Real-time progress tracking',
                        'Structured information extraction'
                    ],
                    wordCount: 156
                },
                contentCategories: [
                    { type: 'Technical Requirements', confidence: 0.95, description: 'System and technical specifications' },
                    { type: 'User Stories', confidence: 0.87, description: 'User-focused requirements and scenarios' },
                    { type: 'Architecture', confidence: 0.78, description: 'System design and integration details' }
                ]
            };
            return mockAnalysis;
        }
        catch (err) {
            console.error('Failed to fetch document analysis:', err);
            return null;
        }
    }, []);
    const refreshDocuments = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            // TODO: Make actual API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            // For now, just reset to mock data
            setDocuments(mockDocuments);
        }
        catch (err) {
            setError('Failed to refresh documents');
        }
        finally {
            setLoading(false);
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
//# sourceMappingURL=useDocuments.js.map