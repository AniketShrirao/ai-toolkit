import React, { useState, useMemo } from 'react';
import { Input, Button, Badge, Card, CardContent } from '@components/UI';
import { DocumentListItem, DocumentFilter, DocumentType, DocumentStatus } from '@ai-toolkit/shared';
import './DocumentList.scss';


interface DocumentListProps {
  documents: DocumentListItem[];
  onDocumentSelect: (document: DocumentListItem) => void;
  onDocumentDelete: (documentId: string) => void;
  onRefresh: () => void;
  loading?: boolean;
}

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  pdf: 'PDF',
  docx: 'Word',
  txt: 'Text',
  md: 'Markdown',
  html: 'HTML',
  xlsx: 'Excel',
  csv: 'CSV',
};

const STATUS_LABELS: Record<DocumentStatus, string> = {
  uploading: 'Uploading',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
  queued: 'Queued',
};

const STATUS_VARIANTS: Record<DocumentStatus, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  uploading: 'info',
  processing: 'warning',
  completed: 'success',
  failed: 'error',
  queued: 'default',
};

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onDocumentSelect,
  onDocumentDelete,
  onRefresh,
  loading = false,
}) => {
  const [filter, setFilter] = useState<DocumentFilter>({});
  const [sortBy, setSortBy] = useState<'name' | 'uploadedAt' | 'size'>('uploadedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredAndSortedDocuments = useMemo(() => {
    let filtered = documents;

    // Apply filters
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.name.toLowerCase().includes(searchLower)
      );
    }

    if (filter.type) {
      filtered = filtered.filter(doc => doc.type === filter.type);
    }

    if (filter.status) {
      filtered = filtered.filter(doc => doc.status === filter.status);
    }

    if (filter.dateFrom) {
      filtered = filtered.filter(doc => doc.uploadedAt >= filter.dateFrom!);
    }

    if (filter.dateTo) {
      filtered = filtered.filter(doc => doc.uploadedAt <= filter.dateTo!);
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

  const handleFilterChange = (key: keyof DocumentFilter, value: any) => {
    setFilter((prev: DocumentFilter) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilter({});
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getDocumentIcon = (type: DocumentType): string => {
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

  const handleSort = (field: 'name' | 'uploadedAt' | 'size') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: 'name' | 'uploadedAt' | 'size') => {
    if (sortBy !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="document-list">
      <div className="document-list-header">
        <div className="document-list-filters">
          <Input
            placeholder="Search documents..."
            value={filter.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            leftIcon="🔍"
            variant="search"
          />
          
          <select
            value={filter.type || ''}
            onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
            className="document-filter-select"
          >
            <option value="">All Types</option>
            {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <select
            value={filter.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
            className="document-filter-select"
          >
            <option value="">All Status</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          {(filter.search || filter.type || filter.status) && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>

        <div className="document-list-actions">
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={loading}
          >
            {loading ? '🔄' : '↻'} Refresh
          </Button>
        </div>
      </div>

      <Card padding="none">
        <CardContent>
          {filteredAndSortedDocuments.length === 0 ? (
            <div className="document-list-empty">
              <div className="empty-icon">📄</div>
              <h3>No documents found</h3>
              <p>
                {documents.length === 0
                  ? 'Upload your first document to get started'
                  : 'Try adjusting your filters to see more results'
                }
              </p>
            </div>
          ) : (
            <div className="document-list-table">
              <div className="document-list-table-header">
                <button
                  className="document-list-sort-button"
                  onClick={() => handleSort('name')}
                >
                  Name {getSortIcon('name')}
                </button>
                <span>Type</span>
                <span>Status</span>
                <button
                  className="document-list-sort-button"
                  onClick={() => handleSort('size')}
                >
                  Size {getSortIcon('size')}
                </button>
                <button
                  className="document-list-sort-button"
                  onClick={() => handleSort('uploadedAt')}
                >
                  Uploaded {getSortIcon('uploadedAt')}
                </button>
                <span>Actions</span>
              </div>

              {filteredAndSortedDocuments.map((document) => (
                <div
                  key={document.id}
                  className="document-list-table-row"
                  onClick={() => onDocumentSelect(document)}
                >
                  <div className="document-list-name">
                    <span className="document-icon">
                      {getDocumentIcon(document.type)}
                    </span>
                    <div className="document-name-info">
                      <span className="document-name">{document.name}</span>
                      {document.hasAnalysis && (
                        <span className="document-analysis-indicator">
                          ✨ Analyzed
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="document-list-type">
                    <Badge variant="default" size="sm">
                      {DOCUMENT_TYPE_LABELS[document.type]}
                    </Badge>
                  </div>

                  <div className="document-list-status">
                    <Badge variant={STATUS_VARIANTS[document.status]} size="sm">
                      {STATUS_LABELS[document.status]}
                    </Badge>
                  </div>

                  <div className="document-list-size">
                    {formatFileSize(document.size)}
                  </div>

                  <div className="document-list-date">
                    {formatDate(document.uploadedAt)}
                  </div>

                  <div className="document-list-actions">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDocumentSelect(document);
                      }}
                    >
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDocumentDelete(document.id);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="document-list-summary">
        Showing {filteredAndSortedDocuments.length} of {documents.length} documents
      </div>
    </div>
  );
};