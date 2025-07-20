import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useState } from 'react';
import { Button, ProgressBar } from '@components/UI';
import './FileUpload.css';
const ACCEPTED_FILE_TYPES = {
    'pdf': '.pdf',
    'docx': '.docx,.doc',
    'txt': '.txt',
    'md': '.md',
    'html': '.html,.htm',
    'xlsx': '.xlsx,.xls',
    'csv': '.csv'
};
export const FileUpload = ({ onFilesSelected, uploads, maxFileSize = 50, // 50MB default
acceptedTypes = ['pdf', 'docx', 'txt', 'md', 'html', 'xlsx', 'csv'], multiple = true, }) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [error, setError] = useState(null);
    const acceptString = acceptedTypes
        .map(type => ACCEPTED_FILE_TYPES[type])
        .filter(Boolean)
        .join(',');
    const validateFile = (file) => {
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
    const handleFiles = useCallback((files) => {
        if (!files)
            return;
        const fileArray = Array.from(files);
        const validFiles = [];
        const errors = [];
        fileArray.forEach(file => {
            const error = validateFile(file);
            if (error) {
                errors.push(error);
            }
            else {
                validFiles.push(file);
            }
        });
        if (errors.length > 0) {
            setError(errors.join(' '));
        }
        else {
            setError(null);
        }
        if (validFiles.length > 0) {
            onFilesSelected(validFiles);
        }
    }, [onFilesSelected, maxFileSize, acceptedTypes]);
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    }, []);
    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    }, []);
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        handleFiles(e.dataTransfer.files);
    }, [handleFiles]);
    const handleFileInput = useCallback((e) => {
        handleFiles(e.target.files);
        // Reset input value to allow selecting the same file again
        e.target.value = '';
    }, [handleFiles]);
    const formatFileSize = (bytes) => {
        if (bytes === 0)
            return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    const getStatusIcon = (status) => {
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
    const getProgressVariant = (status) => {
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
    return (_jsxs("div", { className: "file-upload", children: [_jsx("div", { className: `file-upload-dropzone ${isDragOver ? 'dragover' : ''}`, onDragOver: handleDragOver, onDragLeave: handleDragLeave, onDrop: handleDrop, children: _jsxs("div", { className: "file-upload-content", children: [_jsx("div", { className: "file-upload-icon", children: "\uD83D\uDCC1" }), _jsx("h3", { children: "Drop files here or click to browse" }), _jsxs("p", { children: ["Supported formats: ", acceptedTypes.join(', ').toUpperCase(), _jsx("br", {}), "Maximum file size: ", maxFileSize, "MB"] }), _jsx("input", { type: "file", multiple: multiple, accept: acceptString, onChange: handleFileInput, className: "file-upload-input", id: "file-upload-input" }), _jsx("label", { htmlFor: "file-upload-input", children: _jsx(Button, { variant: "primary", as: "span", children: "Select Files" }) })] }) }), error && (_jsxs("div", { className: "file-upload-error", children: [_jsx("span", { className: "error-icon", children: "\u26A0\uFE0F" }), error] })), uploads.length > 0 && (_jsxs("div", { className: "file-upload-list", children: [_jsx("h4", { children: "Upload Progress" }), uploads.map((upload) => (_jsx("div", { className: "file-upload-item", children: _jsxs("div", { className: "file-upload-item-info", children: [_jsxs("div", { className: "file-upload-item-header", children: [_jsx("span", { className: "file-upload-item-icon", children: getStatusIcon(upload.status) }), _jsx("span", { className: "file-upload-item-name", children: upload.name }), _jsx("span", { className: "file-upload-item-size", children: formatFileSize(upload.size) })] }), _jsx("div", { className: "file-upload-item-progress", children: _jsx(ProgressBar, { value: upload.progress, variant: getProgressVariant(upload.status), size: "sm", showLabel: true }) }), upload.error && (_jsx("div", { className: "file-upload-item-error", children: upload.error }))] }) }, upload.id)))] }))] }));
};
//# sourceMappingURL=FileUpload.js.map