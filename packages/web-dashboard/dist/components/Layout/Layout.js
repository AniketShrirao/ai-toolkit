import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import './Layout.css';
export const Layout = ({ children, activeView, onViewChange, }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    return (_jsxs("div", { className: "layout", children: [_jsx(Header, { onMenuToggle: () => setSidebarOpen(!sidebarOpen), sidebarOpen: sidebarOpen }), _jsxs("div", { className: "layout-body", children: [_jsx(Sidebar, { activeView: activeView, onViewChange: onViewChange, isOpen: sidebarOpen, onClose: () => setSidebarOpen(false) }), _jsx("main", { className: "main-content", children: _jsx("div", { className: "content-wrapper", children: children }) })] })] }));
};
//# sourceMappingURL=Layout.js.map