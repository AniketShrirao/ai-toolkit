import React from 'react';
import { DocumentListItem } from '@ai-toolkit/shared';
import './DocumentList.css';
interface DocumentListProps {
    documents: DocumentListItem[];
    onDocumentSelect: (document: DocumentListItem) => void;
    onDocumentDelete: (documentId: string) => void;
    onRefresh: () => void;
    loading?: boolean;
}
export declare const DocumentList: React.FC<DocumentListProps>;
export {};
//# sourceMappingURL=DocumentList.d.ts.map