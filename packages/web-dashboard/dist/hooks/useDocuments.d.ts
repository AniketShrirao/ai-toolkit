import { DocumentListItem, DocumentUpload, DocumentAnalysis } from '@ai-toolkit/shared';
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
export declare const useDocuments: () => UseDocumentsReturn;
export {};
//# sourceMappingURL=useDocuments.d.ts.map