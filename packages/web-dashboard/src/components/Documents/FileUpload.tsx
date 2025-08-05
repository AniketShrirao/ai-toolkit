import React, { useCallback, useState } from 'react';
import { Button, ProgressBar } from '@components/UI';
import { DocumentUpload, DocumentType } from '@ai-toolkit/shared';
import './FileUpload.scss';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  uploads: DocumentUpload[];
  maxFileSize?: number; // in MB
  acceptedTypes?: DocumentType[];
  multiple?: boolean;
}

const ACCEPTED_FILE_TYPES: Record<DocumentType, string> = {
  'pdf': '.pdf',
  'docx': '.docx,.doc',
  'txt': '.txt',
  'md': '.md',
  'html': '.html,.htm',
  'xlsx': '.xlsx,.xls',
  'csv': '.csv'
};

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  uploads,
  maxFileSize = 50, // 50MB default
  acceptedTypes = ['pdf', 'docx', 'txt', 'md', 'html', 'xlsx', 'csv'],
  multiple = true,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptString = acceptedTypes
    .map(type => ACCEPTED_FILE_TYPES[type])
    .filter(Boolean)
    .join(',');

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File "${file.name}" is too large. Maximum size is ${maxFileSize}MB.`;
    }

    // Check file type
    const extension = file.name.split('.').pop()?.toLowerCase();
    const isValidType = acceptedTypes.some(type => {
      const extensions = ACCEPTED_FILE_TYPES[type].split(',').map(ext => ext.replace('.', ''));
      return extensions.includes(extension || '');
    });

    if (!isValidType) {
      return `File "${file.name}" has an unsupported format. Supported formats: ${acceptedTypes.join(', ')}.`;
    }

    return null;
  };

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      setError(errors.join(' '));
    } else {
      setError(null);
    }

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  }, [onFilesSelected, maxFileSize, acceptedTypes]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [handleFiles]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
        return '⏳';
      case 'processing':
        return '🔄';
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      case 'queued':
        return '⏸️';
      default:
        return '📄';
    }
  };

  const getProgressVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'processing':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <div className="file-upload">
      <div
        className={`file-upload-dropzone ${isDragOver ? 'dragover' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="file-upload-content">
          <div className="file-upload-icon">📁</div>
          <h3>Drop files here or click to browse</h3>
          <p>
            Supported formats: {acceptedTypes.join(', ').toUpperCase()}
            <br />
            Maximum file size: {maxFileSize}MB
          </p>
          <input
            type="file"
            multiple={multiple}
            accept={acceptString}
            onChange={handleFileInput}
            className="file-upload-input"
            id="file-upload-input"
          />
          <label htmlFor="file-upload-input">
            <Button variant="primary" as="span">
              Select Files
            </Button>
          </label>
        </div>
      </div>

      {error && (
        <div className="file-upload-error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {uploads.length > 0 && (
        <div className="file-upload-list">
          <h4>Upload Progress</h4>
          {uploads.map((upload) => (
            <div key={upload.id} className="file-upload-item">
              <div className="file-upload-item-info">
                <div className="file-upload-item-header">
                  <span className="file-upload-item-icon">
                    {getStatusIcon(upload.status)}
                  </span>
                  <span className="file-upload-item-name">{upload.name}</span>
                  <span className="file-upload-item-size">
                    {formatFileSize(upload.size)}
                  </span>
                </div>
                <div className="file-upload-item-progress">
                  <ProgressBar
                    value={upload.progress}
                    variant={getProgressVariant(upload.status)}
                    size="sm"
                    showLabel
                  />
                </div>
                {upload.error && (
                  <div className="file-upload-item-error">
                    {upload.error}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};