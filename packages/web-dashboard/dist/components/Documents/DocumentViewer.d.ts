import React from 'react';
import { DocumentListItem, DocumentAnalysis } from '@ai-toolkit/shared';
import './DocumentViewer.css';
interface DocumentViewerProps {
    document: DocumentListItem;
    analysis?: DocumentAnalysis;
    onClose: () => void;
    onReprocess?: (documentId: string) => void;
}
export declare const DocumentViewer: React.FC<DocumentViewerProps>;
export {};
//# sourceMappingURL=DocumentViewer.d.ts.map