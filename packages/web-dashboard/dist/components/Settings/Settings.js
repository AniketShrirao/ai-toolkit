import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { OllamaSettings } from './OllamaSettings';
import { ProcessingSettings } from './ProcessingSettings';
import { SystemMonitoring } from './SystemMonitoring';
import { WorkflowConfiguration } from './WorkflowConfiguration';
import { UserPreferences } from './UserPreferences';
import './Settings.css';
export const Settings = () => {
    const [activeTab, setActiveTab] = useState('ollama');
    const tabs = [
        { id: 'ollama', label: 'Ollama', icon: '🤖' },
        { id: 'processing', label: 'Processing', icon: '⚙️' },
        { id: 'monitoring', label: 'Monitoring', icon: '📊' },
        { id: 'workflows', label: 'Workflows', icon: '🔄' },
        { id: 'preferences', label: 'Preferences', icon: '👤' },
    ];
    const renderTabContent = () => {
        switch (activeTab) {
            case 'ollama':
                return _jsx(OllamaSettings, {});
            case 'processing':
                return _jsx(ProcessingSettings, {});
            case 'monitoring':
                return _jsx(SystemMonitoring, {});
            case 'workflows':
                return _jsx(WorkflowConfiguration, {});
            case 'preferences':
                return _jsx(UserPreferences, {});
            default:
                return _jsx(OllamaSettings, {});
        }
    };
    return (_jsxs("div", { className: "settings", children: [_jsxs("div", { className: "settings-header", children: [_jsx("h1", { children: "Settings" }), _jsx("p", { children: "Configure your AI toolkit preferences and system settings" })] }), _jsxs("div", { className: "settings-layout", children: [_jsx("div", { className: "settings-sidebar", children: _jsx("nav", { className: "settings-nav", children: tabs.map((tab) => (_jsxs("button", { className: `settings-nav-item ${activeTab === tab.id ? 'active' : ''}`, onClick: () => setActiveTab(tab.id), children: [_jsx("span", { className: "nav-icon", children: tab.icon }), _jsx("span", { className: "nav-label", children: tab.label })] }, tab.id))) }) }), _jsx("div", { className: "settings-content", children: renderTabContent() })] })] }));
};
//# sourceMappingURL=Settings.js.map