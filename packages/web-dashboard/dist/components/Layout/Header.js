import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useWebSocket } from '@hooks/useWebSocket';
import { StatusIndicator } from '@components/UI';
import './Header.css';
export const Header = ({ onMenuToggle, sidebarOpen }) => {
    const { connectionStatus, lastUpdate } = useWebSocket();
    return (_jsx("header", { className: "header", children: _jsxs("div", { className: "header-content", children: [_jsxs("div", { className: "header-left", children: [_jsx("button", { className: "menu-button", onClick: onMenuToggle, "aria-label": "Toggle menu", children: _jsxs("span", { className: `hamburger ${sidebarOpen ? 'open' : ''}`, children: [_jsx("span", {}), _jsx("span", {}), _jsx("span", {})] }) }), _jsx("h1", { className: "header-title", children: "AI Toolkit Dashboard" })] }), _jsx("div", { className: "header-right", children: _jsx(StatusIndicator, { status: connectionStatus, lastUpdate: lastUpdate }) })] }) }));
};
//# sourceMappingURL=Header.js.map