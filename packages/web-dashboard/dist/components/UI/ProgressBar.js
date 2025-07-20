import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import './ProgressBar.css';
export const ProgressBar = ({ value, max = 100, size = 'md', variant = 'default', showLabel = false, className = '', }) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const classes = [
        'progress-bar',
        `progress-bar-${size}`,
        `progress-bar-${variant}`,
        className,
    ]
        .filter(Boolean)
        .join(' ');
    return (_jsxs("div", { className: classes, children: [_jsx("div", { className: "progress-bar-track", children: _jsx("div", { className: "progress-bar-fill", style: { width: `${percentage}%` } }) }), showLabel && (_jsxs("span", { className: "progress-bar-label", children: [Math.round(percentage), "%"] }))] }));
};
//# sourceMappingURL=ProgressBar.js.map