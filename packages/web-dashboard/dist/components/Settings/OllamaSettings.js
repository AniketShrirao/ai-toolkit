import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, CardHeader, CardContent, Button, Input } from '@components/UI';
import { StatusIndicator } from '@components/UI/StatusIndicator';
import { useSettings } from '@hooks/useSettings';
export const OllamaSettings = () => {
    const { settings, health, updateSettings } = useSettings();
    const [localSettings, setLocalSettings] = useState(settings?.ollama || {
        serverUrl: 'http://localhost:11434',
        defaultModel: '',
        timeout: 30000,
        maxRetries: 3,
        connectionPoolSize: 5,
    });
    const [testing, setTesting] = useState(false);
    const handleSave = async () => {
        try {
            await updateSettings({ ollama: localSettings });
        }
        catch (error) {
            console.error('Failed to save Ollama settings:', error);
        }
    };
    const handleTestConnection = async () => {
        setTesting(true);
        try {
            // In real implementation, this would test the actual connection
            await new Promise(resolve => setTimeout(resolve, 2000));
            // Mock success/failure
            if (Math.random() > 0.3) {
                alert('Connection successful!');
            }
            else {
                alert('Connection failed. Please check your settings.');
            }
        }
        catch (error) {
            alert('Connection test failed.');
        }
        finally {
            setTesting(false);
        }
    };
    const isConnected = health?.ollama.connected ?? false;
    return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { children: "Ollama Configuration" }), _jsx(StatusIndicator, { status: isConnected ? 'connected' : 'disconnected', lastUpdate: isConnected ? new Date() : null })] }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "setting-group", children: [_jsx("label", { className: "setting-label", children: "Server URL" }), _jsx(Input, { type: "text", value: localSettings.serverUrl, onChange: (e) => setLocalSettings({ ...localSettings, serverUrl: e.target.value }), placeholder: "http://localhost:11434" })] }), _jsxs("div", { className: "setting-group", children: [_jsx("label", { className: "setting-label", children: "Default Model" }), _jsxs("select", { className: "setting-select", value: localSettings.defaultModel, onChange: (e) => setLocalSettings({ ...localSettings, defaultModel: e.target.value }), children: [_jsx("option", { value: "", children: "Select a model..." }), health?.ollama.availableModels.map((model) => (_jsx("option", { value: model, children: model }, model)))] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "setting-group", children: [_jsx("label", { className: "setting-label", children: "Timeout (ms)" }), _jsx(Input, { type: "number", value: localSettings.timeout, onChange: (e) => setLocalSettings({ ...localSettings, timeout: parseInt(e.target.value) }), min: "1000", max: "300000" })] }), _jsxs("div", { className: "setting-group", children: [_jsx("label", { className: "setting-label", children: "Max Retries" }), _jsx(Input, { type: "number", value: localSettings.maxRetries, onChange: (e) => setLocalSettings({ ...localSettings, maxRetries: parseInt(e.target.value) }), min: "0", max: "10" })] })] }), _jsxs("div", { className: "setting-group", children: [_jsx("label", { className: "setting-label", children: "Connection Pool Size" }), _jsx(Input, { type: "number", value: localSettings.connectionPoolSize, onChange: (e) => setLocalSettings({ ...localSettings, connectionPoolSize: parseInt(e.target.value) }), min: "1", max: "20" })] }), health?.ollama && (_jsxs("div", { className: "ollama-status", children: [_jsx("h4", { children: "Status Information" }), _jsxs("div", { className: "status-grid", children: [_jsxs("div", { className: "status-item", children: [_jsx("span", { className: "status-label", children: "Version:" }), _jsx("span", { className: "status-value", children: health.ollama.version })] }), _jsxs("div", { className: "status-item", children: [_jsx("span", { className: "status-label", children: "Loaded Model:" }), _jsx("span", { className: "status-value", children: health.ollama.loadedModel || 'None' })] }), _jsxs("div", { className: "status-item", children: [_jsx("span", { className: "status-label", children: "Memory Usage:" }), _jsxs("span", { className: "status-value", children: [Math.round(health.ollama.memoryUsage), " MB"] })] }), _jsxs("div", { className: "status-item", children: [_jsx("span", { className: "status-label", children: "Response Time:" }), _jsxs("span", { className: "status-value", children: [Math.round(health.ollama.responseTime), " ms"] })] })] })] })), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "secondary", onClick: handleTestConnection, disabled: testing, children: testing ? 'Testing...' : 'Test Connection' }), _jsx(Button, { variant: "primary", onClick: handleSave, children: "Save Settings" })] })] }) })] }));
};
//# sourceMappingURL=OllamaSettings.js.map