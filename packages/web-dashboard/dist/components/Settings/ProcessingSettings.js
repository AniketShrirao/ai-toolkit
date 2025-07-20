import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, CardHeader, CardContent, Button, Input } from '@components/UI';
import { useSettings } from '@hooks/useSettings';
export const ProcessingSettings = () => {
    const { settings, updateSettings } = useSettings();
    const [localSettings, setLocalSettings] = useState(settings?.processing || {
        autoProcess: true,
        maxConcurrentJobs: 3,
        enableNotifications: true,
        defaultAnalysisTypes: ['requirements', 'summary'],
        outputFormat: 'json',
    });
    const handleSave = async () => {
        try {
            await updateSettings({ processing: localSettings });
        }
        catch (error) {
            console.error('Failed to save processing settings:', error);
        }
    };
    const handleAnalysisTypeChange = (type, checked) => {
        const updatedTypes = checked
            ? [...localSettings.defaultAnalysisTypes, type]
            : localSettings.defaultAnalysisTypes.filter((t) => t !== type);
        setLocalSettings({ ...localSettings, defaultAnalysisTypes: updatedTypes });
    };
    const analysisTypes = [
        { id: 'requirements', label: 'Requirements Extraction' },
        { id: 'summary', label: 'Document Summarization' },
        { id: 'structure', label: 'Structure Analysis' },
        { id: 'estimation', label: 'Project Estimation' },
        { id: 'codebase', label: 'Codebase Analysis' },
    ];
    return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx("h2", { children: "Processing Preferences" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "setting-group", children: [_jsxs("label", { className: "setting-checkbox", children: [_jsx("input", { type: "checkbox", checked: localSettings.autoProcess, onChange: (e) => setLocalSettings({ ...localSettings, autoProcess: e.target.checked }) }), _jsx("span", { children: "Auto-process uploaded documents" })] }), _jsx("p", { className: "setting-description", children: "Automatically start processing documents when they are uploaded" })] }), _jsxs("div", { className: "setting-group", children: [_jsxs("label", { className: "setting-checkbox", children: [_jsx("input", { type: "checkbox", checked: localSettings.enableNotifications, onChange: (e) => setLocalSettings({ ...localSettings, enableNotifications: e.target.checked }) }), _jsx("span", { children: "Enable real-time notifications" })] }), _jsx("p", { className: "setting-description", children: "Show notifications when processing completes or fails" })] }), _jsxs("div", { className: "setting-group", children: [_jsx("label", { className: "setting-label", children: "Max concurrent jobs" }), _jsx(Input, { type: "number", value: localSettings.maxConcurrentJobs, onChange: (e) => setLocalSettings({ ...localSettings, maxConcurrentJobs: parseInt(e.target.value) }), min: "1", max: "10" }), _jsx("p", { className: "setting-description", children: "Maximum number of documents to process simultaneously" })] }), _jsxs("div", { className: "setting-group", children: [_jsx("label", { className: "setting-label", children: "Output Format" }), _jsxs("select", { className: "setting-select", value: localSettings.outputFormat, onChange: (e) => setLocalSettings({ ...localSettings, outputFormat: e.target.value }), children: [_jsx("option", { value: "json", children: "JSON" }), _jsx("option", { value: "markdown", children: "Markdown" }), _jsx("option", { value: "html", children: "HTML" })] }), _jsx("p", { className: "setting-description", children: "Default format for processed document outputs" })] }), _jsxs("div", { className: "setting-group", children: [_jsx("label", { className: "setting-label", children: "Default Analysis Types" }), _jsx("div", { className: "checkbox-group", children: analysisTypes.map(type => (_jsxs("label", { className: "setting-checkbox", children: [_jsx("input", { type: "checkbox", checked: localSettings.defaultAnalysisTypes.includes(type.id), onChange: (e) => handleAnalysisTypeChange(type.id, e.target.checked) }), _jsx("span", { children: type.label })] }, type.id))) }), _jsx("p", { className: "setting-description", children: "Analysis types to run by default on uploaded documents" })] }), _jsx(Button, { variant: "primary", onClick: handleSave, children: "Save Settings" })] }) })] }));
};
//# sourceMappingURL=ProcessingSettings.js.map