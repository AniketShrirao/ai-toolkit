import React, { useState } from 'react';
import { Button, Card, CardHeader, CardContent, Badge } from '@components/UI';
import { DocumentListItem, DocumentAnalysis, Requirement, KeyPoint, ActionItem } from '@ai-toolkit/shared';
import './DocumentViewer.scss';

interface DocumentViewerProps {
  document: DocumentListItem;
  analysis?: DocumentAnalysis;
  onClose: () => void;
  onReprocess?: (documentId: string) => void;
}

type ViewTab = 'overview' | 'requirements' | 'keypoints' | 'actions' | 'summary' | 'raw';

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  analysis,
  onClose,
  onReprocess,
}) => {
  const [activeTab, setActiveTab] = useState<ViewTab>('overview');

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const getRequirementTypeColor = (type: string) => {
    return type === 'functional' ? 'success' : 'info';
  };

  const renderOverview = () => (
    <div className="document-viewer-overview">
      <div className="document-info-grid">
        <div className="document-info-item">
          <label>File Name</label>
          <span>{document.name}</span>
        </div>
        <div className="document-info-item">
          <label>File Size</label>
          <span>{formatFileSize(document.size)}</span>
        </div>
        <div className="document-info-item">
          <label>Type</label>
          <Badge variant="default">{document.type.toUpperCase()}</Badge>
        </div>
        <div className="document-info-item">
          <label>Status</label>
          <Badge variant={document.status === 'completed' ? 'success' : 'warning'}>
            {document.status}
          </Badge>
        </div>
        <div className="document-info-item">
          <label>Uploaded</label>
          <span>{formatDate(document.uploadedAt)}</span>
        </div>
        {document.processedAt && (
          <div className="document-info-item">
            <label>Processed</label>
            <span>{formatDate(document.processedAt)}</span>
          </div>
        )}
      </div>

      {analysis && (
        <div className="analysis-summary">
          <h3>Analysis Summary</h3>
          <div className="analysis-stats">
            <div className="analysis-stat">
              <span className="stat-number">{analysis.requirements.totalCount}</span>
              <span className="stat-label">Requirements</span>
            </div>
            <div className="analysis-stat">
              <span className="stat-number">{analysis.keyPoints.length}</span>
              <span className="stat-label">Key Points</span>
            </div>
            <div className="analysis-stat">
              <span className="stat-number">{analysis.actionItems.length}</span>
              <span className="stat-label">Action Items</span>
            </div>
            <div className="analysis-stat">
              <span className="stat-number">{analysis.structure.sections.length}</span>
              <span className="stat-label">Sections</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderRequirements = () => {
    if (!analysis?.requirements) {
      return <div className="no-data">No requirements extracted</div>;
    }

    const { functional, nonFunctional } = analysis.requirements;

    return (
      <div className="requirements-view">
        {functional.length > 0 && (
          <div className="requirements-section">
            <h3>Functional Requirements ({functional.length})</h3>
            {functional.map((req: Requirement) => (
              <Card key={req.id} className="requirement-card">
                <CardContent>
                  <div className="requirement-header">
                    <Badge variant={getPriorityColor(req.priority)} size="sm">
                      {req.priority}
                    </Badge>
                    <Badge variant={getRequirementTypeColor(req.type)} size="sm">
                      {req.type}
                    </Badge>
                    {req.estimatedHours > 0 && (
                      <span className="requirement-hours">
                        {req.estimatedHours}h
                      </span>
                    )}
                  </div>
                  <p className="requirement-description">{req.description}</p>
                  {req.acceptanceCriteria.length > 0 && (
                    <div className="acceptance-criteria">
                      <h4>Acceptance Criteria:</h4>
                      <ul>
                        {req.acceptanceCriteria.map((criteria: string, index: number) => (
                          <li key={index}>{criteria}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {nonFunctional.length > 0 && (
          <div className="requirements-section">
            <h3>Non-Functional Requirements ({nonFunctional.length})</h3>
            {nonFunctional.map((req: Requirement) => (
              <Card key={req.id} className="requirement-card">
                <CardContent>
                  <div className="requirement-header">
                    <Badge variant={getPriorityColor(req.priority)} size="sm">
                      {req.priority}
                    </Badge>
                    <Badge variant={getRequirementTypeColor(req.type)} size="sm">
                      {req.type}
                    </Badge>
                    {req.estimatedHours > 0 && (
                      <span className="requirement-hours">
                        {req.estimatedHours}h
                      </span>
                    )}
                  </div>
                  <p className="requirement-description">{req.description}</p>
                  {req.acceptanceCriteria.length > 0 && (
                    <div className="acceptance-criteria">
                      <h4>Acceptance Criteria:</h4>
                      <ul>
                        {req.acceptanceCriteria.map((criteria: string, index: number) => (
                          <li key={index}>{criteria}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderKeyPoints = () => {
    if (!analysis?.keyPoints || analysis.keyPoints.length === 0) {
      return <div className="no-data">No key points extracted</div>;
    }

    return (
      <div className="keypoints-view">
        {analysis.keyPoints.map((point: KeyPoint) => (
          <Card key={point.id} className="keypoint-card">
            <CardContent>
              <div className="keypoint-header">
                <Badge variant={getPriorityColor(point.importance)} size="sm">
                  {point.importance}
                </Badge>
                <span className="keypoint-category">{point.category}</span>
              </div>
              <p className="keypoint-text">{point.text}</p>
              {point.context && (
                <div className="keypoint-context">
                  <strong>Context:</strong> {point.context}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderActionItems = () => {
    if (!analysis?.actionItems || analysis.actionItems.length === 0) {
      return <div className="no-data">No action items extracted</div>;
    }

    return (
      <div className="actions-view">
        {analysis.actionItems.map((action: ActionItem) => (
          <Card key={action.id} className="action-card">
            <CardContent>
              <div className="action-header">
                <Badge variant={getPriorityColor(action.priority)} size="sm">
                  {action.priority}
                </Badge>
                <Badge 
                  variant={action.status === 'completed' ? 'success' : 'default'} 
                  size="sm"
                >
                  {action.status}
                </Badge>
                {action.deadline && (
                  <span className="action-deadline">
                    Due: {formatDate(action.deadline)}
                  </span>
                )}
              </div>
              <p className="action-description">{action.description}</p>
              {action.assignee && (
                <div className="action-assignee">
                  <strong>Assigned to:</strong> {action.assignee}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderSummary = () => {
    if (!analysis?.summary) {
      return <div className="no-data">No summary available</div>;
    }

    return (
      <div className="summary-view">
        <div className="summary-meta">
          <Badge variant="info" size="sm">
            {analysis.summary.length} summary
          </Badge>
          <span className="summary-word-count">
            {analysis.summary.wordCount} words
          </span>
        </div>
        <div className="summary-content">
          <p>{analysis.summary.content}</p>
        </div>
        {analysis.summary.keyPoints.length > 0 && (
          <div className="summary-keypoints">
            <h4>Key Points:</h4>
            <ul>
              {analysis.summary.keyPoints.map((point: string, index: number) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'requirements', label: 'Requirements', icon: '📝', count: analysis?.requirements.totalCount },
    { id: 'keypoints', label: 'Key Points', icon: '💡', count: analysis?.keyPoints.length },
    { id: 'actions', label: 'Actions', icon: '✅', count: analysis?.actionItems.length },
    { id: 'summary', label: 'Summary', icon: '📄' },
  ];

  return (
    <div className="document-viewer">
      <div className="document-viewer-header">
        <div className="document-viewer-title">
          <h2>{document.name}</h2>
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </div>
        
        <div className="document-viewer-actions">
          {onReprocess && document.status === 'completed' && (
            <Button variant="outline" onClick={() => onReprocess(document.id)}>
              🔄 Reprocess
            </Button>
          )}
        </div>
      </div>

      <div className="document-viewer-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`document-viewer-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id as ViewTab)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <Badge variant="default" size="sm">{tab.count}</Badge>
            )}
          </button>
        ))}
      </div>

      <div className="document-viewer-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'requirements' && renderRequirements()}
        {activeTab === 'keypoints' && renderKeyPoints()}
        {activeTab === 'actions' && renderActionItems()}
        {activeTab === 'summary' && renderSummary()}
      </div>
    </div>
  );
};