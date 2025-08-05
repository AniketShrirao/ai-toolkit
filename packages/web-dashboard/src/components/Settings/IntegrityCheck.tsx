import React, { useState, useCallback } from 'react';
import './IntegrityCheck.scss';

interface IntegrityReport {
  timestamp: Date;
  totalIssues: number;
  issuesByType: Record<string, number>;
  issuesBySeverity: Record<string, number>;
  issues: Array<{
    type: string;
    severity: string;
    file: string;
    line?: number;
    message: string;
    context?: string;
  }>;
  summary: {
    codeQualityScore: number;
    readinessLevel: string;
    recommendations: string[];
  };
}

interface DocumentProcessingReport {
  timestamp: Date;
  totalDocuments: number;
  processedDocuments: number;
  failedDocuments: number;
  totalIssues: number;
  issuesByType: Record<string, number>;
  issuesBySeverity: Record<string, number>;
  issues: Array<{
    type: string;
    severity: string;
    documentPath: string;
    field?: string;
    message: string;
  }>;
  summary: {
    processingSuccessRate: number;
    dataQualityScore: number;
    recommendations: string[];
  };
}

type CheckType = 'code' | 'documents' | 'all';

export const IntegrityCheck: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [codeReport, setCodeReport] = useState<IntegrityReport | null>(null);
  const [documentReport, setDocumentReport] = useState<DocumentProcessingReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkType, setCheckType] = useState<CheckType>('all');

  const runIntegrityCheck = useCallback(async (type: CheckType) => {
    setIsRunning(true);
    setError(null);
    
    try {
      const response = await fetch('/api/integrity/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Integrity check failed');
      }

      const { data } = result;
      
      if (data.codeReport) {
        setCodeReport(data.codeReport);
      }
      
      if (data.documentReport) {
        setDocumentReport(data.documentReport);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsRunning(false);
    }
  }, []);

  const exportReport = useCallback(() => {
    const exportData = {
      timestamp: new Date().toISOString(),
      codeReport,
      documentReport
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `integrity-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [codeReport, documentReport]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getReadinessColor = (level: string) => {
    switch (level) {
      case 'ready': return '#28a745';
      case 'needs-attention': return '#ffc107';
      case 'not-ready': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <div className="integrity-check">
      <div className="integrity-check-header">
        <h2>System Integrity Check</h2>
        <p>Verify code quality and document processing integrity</p>
      </div>

      <div className="integrity-check-controls">
        <div className="check-type-selector">
          <label>Check Type:</label>
          <select 
            value={checkType} 
            onChange={(e) => setCheckType(e.target.value as CheckType)}
            disabled={isRunning}
          >
            <option value="all">All Checks</option>
            <option value="code">Code Quality Only</option>
            <option value="documents">Document Processing Only</option>
          </select>
        </div>

        <div className="check-actions">
          <button
            className="btn btn-primary"
            onClick={() => runIntegrityCheck(checkType)}
            disabled={isRunning}
          >
            {isRunning ? 'Running Check...' : 'Run Integrity Check'}
          </button>

          {(codeReport || documentReport) && (
            <button
              className="btn btn-secondary"
              onClick={exportReport}
              disabled={isRunning}
            >
              Export Report
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {isRunning && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <span>Running integrity checks...</span>
        </div>
      )}

      {/* Code Quality Report */}
      {codeReport && (
        <div className="report-section">
          <h3>Code Quality Report</h3>
          
          <div className="report-summary">
            <div className="summary-cards">
              <div className="summary-card">
                <div className="card-value">{codeReport.totalIssues}</div>
                <div className="card-label">Total Issues</div>
              </div>
              <div className="summary-card">
                <div className="card-value">{codeReport.summary.codeQualityScore}</div>
                <div className="card-label">Quality Score</div>
              </div>
              <div className="summary-card">
                <div 
                  className="card-value"
                  style={{ color: getReadinessColor(codeReport.summary.readinessLevel) }}
                >
                  {codeReport.summary.readinessLevel.replace('-', ' ').toUpperCase()}
                </div>
                <div className="card-label">Readiness Level</div>
              </div>
            </div>
          </div>

          <div className="issues-by-type">
            <h4>Issues by Type</h4>
            <div className="issue-type-grid">
              {Object.entries(codeReport.issuesByType).map(([type, count]) => (
                <div key={type} className="issue-type-item">
                  <span className="issue-type-name">{type}</span>
                  <span className="issue-type-count">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="issues-by-severity">
            <h4>Issues by Severity</h4>
            <div className="severity-grid">
              {Object.entries(codeReport.issuesBySeverity).map(([severity, count]) => (
                <div key={severity} className="severity-item">
                  <span 
                    className="severity-indicator"
                    style={{ backgroundColor: getSeverityColor(severity) }}
                  ></span>
                  <span className="severity-name">{severity.toUpperCase()}</span>
                  <span className="severity-count">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="recommendations">
            <h4>Recommendations</h4>
            <ul>
              {codeReport.summary.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>

          <details className="issues-details">
            <summary>View All Issues ({codeReport.issues.length})</summary>
            <div className="issues-list">
              {codeReport.issues.map((issue, index) => (
                <div key={index} className="issue-item">
                  <div className="issue-header">
                    <span 
                      className="issue-severity"
                      style={{ color: getSeverityColor(issue.severity) }}
                    >
                      {issue.severity.toUpperCase()}
                    </span>
                    <span className="issue-type">{issue.type}</span>
                    <span className="issue-file">{issue.file}</span>
                    {issue.line && <span className="issue-line">Line {issue.line}</span>}
                  </div>
                  <div className="issue-message">{issue.message}</div>
                  {issue.context && (
                    <div className="issue-context">
                      <code>{issue.context}</code>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </details>
        </div>
      )}

      {/* Document Processing Report */}
      {documentReport && (
        <div className="report-section">
          <h3>Document Processing Report</h3>
          
          <div className="report-summary">
            <div className="summary-cards">
              <div className="summary-card">
                <div className="card-value">{documentReport.totalDocuments}</div>
                <div className="card-label">Total Documents</div>
              </div>
              <div className="summary-card">
                <div className="card-value">{documentReport.processedDocuments}</div>
                <div className="card-label">Processed</div>
              </div>
              <div className="summary-card">
                <div className="card-value">{documentReport.failedDocuments}</div>
                <div className="card-label">Failed</div>
              </div>
              <div className="summary-card">
                <div className="card-value">{documentReport.summary.processingSuccessRate.toFixed(1)}%</div>
                <div className="card-label">Success Rate</div>
              </div>
              <div className="summary-card">
                <div className="card-value">{documentReport.summary.dataQualityScore}</div>
                <div className="card-label">Data Quality</div>
              </div>
            </div>
          </div>

          <div className="issues-by-type">
            <h4>Processing Issues by Type</h4>
            <div className="issue-type-grid">
              {Object.entries(documentReport.issuesByType).map(([type, count]) => (
                <div key={type} className="issue-type-item">
                  <span className="issue-type-name">{type.replace('_', ' ')}</span>
                  <span className="issue-type-count">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="recommendations">
            <h4>Recommendations</h4>
            <ul>
              {documentReport.summary.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>

          <details className="issues-details">
            <summary>View All Processing Issues ({documentReport.issues.length})</summary>
            <div className="issues-list">
              {documentReport.issues.map((issue, index) => (
                <div key={index} className="issue-item">
                  <div className="issue-header">
                    <span 
                      className="issue-severity"
                      style={{ color: getSeverityColor(issue.severity) }}
                    >
                      {issue.severity.toUpperCase()}
                    </span>
                    <span className="issue-type">{issue.type.replace('_', ' ')}</span>
                    <span className="issue-file">{issue.documentPath}</span>
                    {issue.field && <span className="issue-field">Field: {issue.field}</span>}
                  </div>
                  <div className="issue-message">{issue.message}</div>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
};