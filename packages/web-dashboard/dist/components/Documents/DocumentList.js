import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { Input, Button, Badge, Card, CardContent } from '@components/UI';
import './DocumentList.css';
const DOCUMENT_TYPE_LABELS = {
    pdf: 'PDF',
    docx: 'Word',
    txt: 'Text',
    md: 'Markdown',
    html: 'HTML',
    xlsx: 'Excel',
    csv: 'CSV',
};
const STATUS_LABELS = {
    uploading: 'Uploading',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed',
    queued: 'Queued',
};
const STATUS_VARIANTS = {
    uploading: 'info',
    processing: 'warning',
    completed: 'success',
    failed: 'error',
    queued: 'default',
};
export const DocumentList = ({ documents, onDocumentSelect, onDocumentDelete, onRefresh, loading = false, }) => {
    const [filter, setFilter] = useState({});
    const [sortBy, setSortBy] = useState('uploadedAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const filteredAndSortedDocuments = useMemo(() => {
        let filtered = documents;
        // Apply filters
        if (filter.search) {
            const searchLower = filter.search.toLowerCase();
            filtered = filtered.filter(doc => doc.name.toLowerCase().includes(searchLower));
        }
        if (filter.type) {
            filtered = filtered.filter(doc => doc.type === filter.type);
        }
        if (filter.status) {
            filtered = filtered.filter(doc => doc.status === filter.status);
        }
        if (filter.dateFrom) {
            filtered = filtered.filter(doc => doc.uploadedAt >= filter.dateFrom);
        }
        if (filter.dateTo) {
            filtered = filtered.filter(doc => doc.uploadedAt <= filter.dateTo);
        }
        // Apply sorting
        filtered.sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'uploadedAt':
                    comparison = a.uploadedAt.getTime() - b.uploadedAt.getTime();
                    break;
                case 'size':
                    comparison = a.size - b.size;
                    break;
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });
        return filtered;
    }, [documents, filter, sortBy, sortOrder]);
    const handleFilterChange = (key, value) => {
        setFilter((prev) => ({ ...prev, [key]: value }));
    };
    const clearFilters = () => {
        setFilter({});
    };
    const formatFileSize = (bytes) => {
        if (bytes === 0)
            return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    const formatDate = (date) => {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };
    const getDocumentIcon = (type) => {
        switch (type) {
            case 'pdf':
                return '📄';
            case 'docx':
                return '📝';
            case 'txt':
                return '📃';
            case 'md':
                return '📋';
            case 'html':
                return '🌐';
            case 'xlsx':
                return '📊';
            case 'csv':
                return '📈';
            default:
                return '📄';
        }
    };
    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        }
        else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };
    const getSortIcon = (field) => {
        if (sortBy !== field)
            return '↕️';
        return sortOrder === 'asc' ? '↑' : '↓';
    };
    return (_jsxs("div", { className: "document-list", children: [_jsxs("div", { className: "document-list-header", children: [_jsxs("div", { className: "document-list-filters", children: [_jsx(Input, { placeholder: "Search documents...", value: filter.search || '', onChange: (e) => handleFilterChange('search', e.target.value), leftIcon: "\uD83D\uDD0D", variant: "search" }), _jsxs("select", { value: filter.type || '', onChange: (e) => handleFilterChange('type', e.target.value || undefined), className: "document-filter-select", children: [_jsx("option", { value: "", children: "All Types" }), Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (_jsx("option", { value: value, children: label }, value)))] }), _jsxs("select", { value: filter.status || '', onChange: (e) => handleFilterChange('status', e.target.value || undefined), className: "document-filter-select", children: [_jsx("option", { value: "", children: "All Status" }), Object.entries(STATUS_LABELS).map(([value, label]) => (_jsx("option", { value: value, children: label }, value)))] }), (filter.search || filter.type || filter.status) && (_jsx(Button, { variant: "outline", size: "sm", onClick: clearFilters, children: "Clear Filters" }))] }), _jsx("div", { className: "document-list-actions", children: _jsxs(Button, { variant: "outline", onClick: onRefresh, disabled: loading, children: [loading ? '🔄' : '↻', " Refresh"] }) })] }), _jsx(Card, { padding: "none", children: _jsx(CardContent, { children: filteredAndSortedDocuments.length === 0 ? (_jsxs("div", { className: "document-list-empty", children: [_jsx("div", { className: "empty-icon", children: "\uD83D\uDCC4" }), _jsx("h3", { children: "No documents found" }), _jsx("p", { children: documents.length === 0
                                    ? 'Upload your first document to get started'
                                    : 'Try adjusting your filters to see more results' })] })) : (_jsxs("div", { className: "document-list-table", children: [_jsxs("div", { className: "document-list-table-header", children: [_jsxs("button", { className: "document-list-sort-button", onClick: () => handleSort('name'), children: ["Name ", getSortIcon('name')] }), _jsx("span", { children: "Type" }), _jsx("span", { children: "Status" }), _jsxs("button", { className: "document-list-sort-button", onClick: () => handleSort('size'), children: ["Size ", getSortIcon('size')] }), _jsxs("button", { className: "document-list-sort-button", onClick: () => handleSort('uploadedAt'), children: ["Uploaded ", getSortIcon('uploadedAt')] }), _jsx("span", { children: "Actions" })] }), filteredAndSortedDocuments.map((document) => (_jsxs("div", { className: "document-list-table-row", onClick: () => onDocumentSelect(document), children: [_jsxs("div", { className: "document-list-name", children: [_jsx("span", { className: "document-icon", children: getDocumentIcon(document.type) }), _jsxs("div", { className: "document-name-info", children: [_jsx("span", { className: "document-name", children: document.name }), document.hasAnalysis && (_jsx("span", { className: "document-analysis-indicator", children: "\u2728 Analyzed" }))] })] }), _jsx("div", { className: "document-list-type", children: _jsx(Badge, { variant: "default", size: "sm", children: DOCUMENT_TYPE_LABELS[document.type] }) }), _jsx("div", { className: "document-list-status", children: _jsx(Badge, { variant: STATUS_VARIANTS[document.status], size: "sm", children: STATUS_LABELS[document.status] }) }), _jsx("div", { className: "document-list-size", children: formatFileSize(document.size) }), _jsx("div", { className: "document-list-date", children: formatDate(document.uploadedAt) }), _jsxs("div", { className: "document-list-actions", children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: (e) => {
                                                    e.stopPropagation();
                                                    onDocumentSelect(document);
                                                }, children: "View" }), _jsx(Button, { variant: "ghost", size: "sm", onClick: (e) => {
                                                    e.stopPropagation();
                                                    onDocumentDelete(document.id);
                                                }, children: "Delete" })] })] }, document.id)))] })) }) }), _jsxs("div", { className: "document-list-summary", children: ["Showing ", filteredAndSortedDocuments.length, " of ", documents.length, " documents"] })] }));
};
//# sourceMappingURL=DocumentList.js.map