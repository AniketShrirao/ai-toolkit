import React from 'react';
import { DocumentUpload, DocumentType } from '@ai-toolkit/shared';
import './FileUpload.css';
interface FileUploadProps {
    onFilesSelected: (files: File[]) => void;
    uploads: DocumentUpload[];
    maxFileSize?: number;
    acceptedTypes?: DocumentType[];
    multiple?: boolean;
}
export declare const FileUpload: React.FC<FileUploadProps>;
export {};
//# sourceMappingURL=FileUpload.d.ts.map