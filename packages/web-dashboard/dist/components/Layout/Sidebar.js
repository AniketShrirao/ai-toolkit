import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import './Sidebar.css';
const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'documents', label: 'Documents', icon: '📄' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
];
export const Sidebar = ({ activeView, onViewChange, isOpen, onClose, }) => {
    const handleNavClick = (view) => {
        onViewChange(view);
        onClose(); // Close sidebar on mobile after selection
    };
    return (_jsxs(_Fragment, { children: [isOpen && _jsx("div", { className: "sidebar-overlay", onClick: onClose }), _jsx("aside", { className: `sidebar ${isOpen ? 'open' : ''}`, children: _jsx("nav", { className: "sidebar-nav", children: _jsx("ul", { className: "nav-list", children: navItems.map((item) => (_jsx("li", { children: _jsxs("button", { className: `nav-item ${activeView === item.id ? 'active' : ''}`, onClick: () => handleNavClick(item.id), children: [_jsx("span", { className: "nav-icon", children: item.icon }), _jsx("span", { className: "nav-label", children: item.label })] }) }, item.id))) }) }) })] }));
};
//# sourceMappingURL=Sidebar.js.map