import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import './StatusIndicator.css';
export const StatusIndicator = ({ status, lastUpdate, label, }) => {
    const getStatusColor = () => {
        switch (status) {
            case 'connected':
                return 'success';
            case 'connecting':
                return 'warning';
            case 'disconnected':
            case 'error':
                return 'error';
            default:
                return 'warning';
        }
    };
    const getStatusText = () => {
        // Use custom label if provided
        if (label)
            return label;
        switch (status) {
            case 'connected':
                return 'Connected';
            case 'connecting':
                return 'Connecting...';
            case 'disconnected':
                return 'Disconnected';
            case 'error':
                return 'Connection Error';
            default:
                return 'Unknown';
        }
    };
    const formatLastUpdate = () => {
        if (!lastUpdate)
            return '';
        const now = new Date();
        const diff = now.getTime() - lastUpdate.getTime();
        const seconds = Math.floor(diff / 1000);
        if (seconds < 60)
            return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60)
            return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ago`;
    };
    return (_jsxs("div", { className: "status-indicator", children: [_jsx("div", { className: `status-dot ${getStatusColor()}` }), _jsxs("div", { className: "status-text", children: [_jsx("span", { className: "status-label", children: label || getStatusText() }), lastUpdate && status === 'connected' && (_jsx("span", { className: "status-time", children: formatLastUpdate() }))] })] }));
};
//# sourceMappingURL=StatusIndicator.js.map