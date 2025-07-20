import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button, Card, CardContent, Badge } from '@components/UI';
import './DocumentViewer.css';
export const DocumentViewer = ({ document, analysis, onClose, onReprocess, }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const formatDate = (date) => {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };
    const formatFileSize = (bytes) => {
        if (bytes === 0)
            return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    const getPriorityColor = (priority) => {
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
    const getRequirementTypeColor = (type) => {
        return type === 'functional' ? 'success' : 'info';
    };
    const renderOverview = () => (_jsxs("div", { className: "document-viewer-overview", children: [_jsxs("div", { className: "document-info-grid", children: [_jsxs("div", { className: "document-info-item", children: [_jsx("label", { children: "File Name" }), _jsx("span", { children: document.name })] }), _jsxs("div", { className: "document-info-item", children: [_jsx("label", { children: "File Size" }), _jsx("span", { children: formatFileSize(document.size) })] }), _jsxs("div", { className: "document-info-item", children: [_jsx("label", { children: "Type" }), _jsx(Badge, { variant: "default", children: document.type.toUpperCase() })] }), _jsxs("div", { className: "document-info-item", children: [_jsx("label", { children: "Status" }), _jsx(Badge, { variant: document.status === 'completed' ? 'success' : 'warning', children: document.status })] }), _jsxs("div", { className: "document-info-item", children: [_jsx("label", { children: "Uploaded" }), _jsx("span", { children: formatDate(document.uploadedAt) })] }), document.processedAt && (_jsxs("div", { className: "document-info-item", children: [_jsx("label", { children: "Processed" }), _jsx("span", { children: formatDate(document.processedAt) })] }))] }), analysis && (_jsxs("div", { className: "analysis-summary", children: [_jsx("h3", { children: "Analysis Summary" }), _jsxs("div", { className: "analysis-stats", children: [_jsxs("div", { className: "analysis-stat", children: [_jsx("span", { className: "stat-number", children: analysis.requirements.totalCount }), _jsx("span", { className: "stat-label", children: "Requirements" })] }), _jsxs("div", { className: "analysis-stat", children: [_jsx("span", { className: "stat-number", children: analysis.keyPoints.length }), _jsx("span", { className: "stat-label", children: "Key Points" })] }), _jsxs("div", { className: "analysis-stat", children: [_jsx("span", { className: "stat-number", children: analysis.actionItems.length }), _jsx("span", { className: "stat-label", children: "Action Items" })] }), _jsxs("div", { className: "analysis-stat", children: [_jsx("span", { className: "stat-number", children: analysis.structure.sections.length }), _jsx("span", { className: "stat-label", children: "Sections" })] })] })] }))] }));
    const renderRequirements = () => {
        if (!analysis?.requirements) {
            return _jsx("div", { className: "no-data", children: "No requirements extracted" });
        }
        const { functional, nonFunctional } = analysis.requirements;
        return (_jsxs("div", { className: "requirements-view", children: [functional.length > 0 && (_jsxs("div", { className: "requirements-section", children: [_jsxs("h3", { children: ["Functional Requirements (", functional.length, ")"] }), functional.map((req) => (_jsx(Card, { className: "requirement-card", children: _jsxs(CardContent, { children: [_jsxs("div", { className: "requirement-header", children: [_jsx(Badge, { variant: getPriorityColor(req.priority), size: "sm", children: req.priority }), _jsx(Badge, { variant: getRequirementTypeColor(req.type), size: "sm", children: req.type }), req.estimatedHours > 0 && (_jsxs("span", { className: "requirement-hours", children: [req.estimatedHours, "h"] }))] }), _jsx("p", { className: "requirement-description", children: req.description }), req.acceptanceCriteria.length > 0 && (_jsxs("div", { className: "acceptance-criteria", children: [_jsx("h4", { children: "Acceptance Criteria:" }), _jsx("ul", { children: req.acceptanceCriteria.map((criteria, index) => (_jsx("li", { children: criteria }, index))) })] }))] }) }, req.id)))] })), nonFunctional.length > 0 && (_jsxs("div", { className: "requirements-section", children: [_jsxs("h3", { children: ["Non-Functional Requirements (", nonFunctional.length, ")"] }), nonFunctional.map((req) => (_jsx(Card, { className: "requirement-card", children: _jsxs(CardContent, { children: [_jsxs("div", { className: "requirement-header", children: [_jsx(Badge, { variant: getPriorityColor(req.priority), size: "sm", children: req.priority }), _jsx(Badge, { variant: getRequirementTypeColor(req.type), size: "sm", children: req.type }), req.estimatedHours > 0 && (_jsxs("span", { className: "requirement-hours", children: [req.estimatedHours, "h"] }))] }), _jsx("p", { className: "requirement-description", children: req.description }), req.acceptanceCriteria.length > 0 && (_jsxs("div", { className: "acceptance-criteria", children: [_jsx("h4", { children: "Acceptance Criteria:" }), _jsx("ul", { children: req.acceptanceCriteria.map((criteria, index) => (_jsx("li", { children: criteria }, index))) })] }))] }) }, req.id)))] }))] }));
    };
    const renderKeyPoints = () => {
        if (!analysis?.keyPoints || analysis.keyPoints.length === 0) {
            return _jsx("div", { className: "no-data", children: "No key points extracted" });
        }
        return (_jsx("div", { className: "keypoints-view", children: analysis.keyPoints.map((point) => (_jsx(Card, { className: "keypoint-card", children: _jsxs(CardContent, { children: [_jsxs("div", { className: "keypoint-header", children: [_jsx(Badge, { variant: getPriorityColor(point.importance), size: "sm", children: point.importance }), _jsx("span", { className: "keypoint-category", children: point.category })] }), _jsx("p", { className: "keypoint-text", children: point.text }), point.context && (_jsxs("div", { className: "keypoint-context", children: [_jsx("strong", { children: "Context:" }), " ", point.context] }))] }) }, point.id))) }));
    };
    const renderActionItems = () => {
        if (!analysis?.actionItems || analysis.actionItems.length === 0) {
            return _jsx("div", { className: "no-data", children: "No action items extracted" });
        }
        return (_jsx("div", { className: "actions-view", children: analysis.actionItems.map((action) => (_jsx(Card, { className: "action-card", children: _jsxs(CardContent, { children: [_jsxs("div", { className: "action-header", children: [_jsx(Badge, { variant: getPriorityColor(action.priority), size: "sm", children: action.priority }), _jsx(Badge, { variant: action.status === 'completed' ? 'success' : 'default', size: "sm", children: action.status }), action.deadline && (_jsxs("span", { className: "action-deadline", children: ["Due: ", formatDate(action.deadline)] }))] }), _jsx("p", { className: "action-description", children: action.description }), action.assignee && (_jsxs("div", { className: "action-assignee", children: [_jsx("strong", { children: "Assigned to:" }), " ", action.assignee] }))] }) }, action.id))) }));
    };
    const renderSummary = () => {
        if (!analysis?.summary) {
            return _jsx("div", { className: "no-data", children: "No summary available" });
        }
        return (_jsxs("div", { className: "summary-view", children: [_jsxs("div", { className: "summary-meta", children: [_jsxs(Badge, { variant: "info", size: "sm", children: [analysis.summary.length, " summary"] }), _jsxs("span", { className: "summary-word-count", children: [analysis.summary.wordCount, " words"] })] }), _jsx("div", { className: "summary-content", children: _jsx("p", { children: analysis.summary.content }) }), analysis.summary.keyPoints.length > 0 && (_jsxs("div", { className: "summary-keypoints", children: [_jsx("h4", { children: "Key Points:" }), _jsx("ul", { children: analysis.summary.keyPoints.map((point, index) => (_jsx("li", { children: point }, index))) })] }))] }));
    };
    const tabs = [
        { id: 'overview', label: 'Overview', icon: '📋' },
        { id: 'requirements', label: 'Requirements', icon: '📝', count: analysis?.requirements.totalCount },
        { id: 'keypoints', label: 'Key Points', icon: '💡', count: analysis?.keyPoints.length },
        { id: 'actions', label: 'Actions', icon: '✅', count: analysis?.actionItems.length },
        { id: 'summary', label: 'Summary', icon: '📄' },
    ];
    return (_jsxs("div", { className: "document-viewer", children: [_jsxs("div", { className: "document-viewer-header", children: [_jsxs("div", { className: "document-viewer-title", children: [_jsx("h2", { children: document.name }), _jsx(Button, { variant: "ghost", onClick: onClose, children: "\u2715" })] }), _jsx("div", { className: "document-viewer-actions", children: onReprocess && document.status === 'completed' && (_jsx(Button, { variant: "outline", onClick: () => onReprocess(document.id), children: "\uD83D\uDD04 Reprocess" })) })] }), _jsx("div", { className: "document-viewer-tabs", children: tabs.map((tab) => (_jsxs("button", { className: `document-viewer-tab ${activeTab === tab.id ? 'active' : ''}`, onClick: () => setActiveTab(tab.id), children: [_jsx("span", { className: "tab-icon", children: tab.icon }), _jsx("span", { className: "tab-label", children: tab.label }), tab.count !== undefined && tab.count > 0 && (_jsx(Badge, { variant: "default", size: "sm", children: tab.count }))] }, tab.id))) }), _jsxs("div", { className: "document-viewer-content", children: [activeTab === 'overview' && renderOverview(), activeTab === 'requirements' && renderRequirements(), activeTab === 'keypoints' && renderKeyPoints(), activeTab === 'actions' && renderActionItems(), activeTab === 'summary' && renderSummary()] })] }));
};
//# sourceMappingURL=DocumentViewer.js.map