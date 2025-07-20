import { jsx as _jsx } from "react/jsx-runtime";
import './Badge.css';
export const Badge = ({ children, variant = 'default', size = 'md', className = '', }) => {
    const classes = [
        'badge',
        `badge-${variant}`,
        `badge-${size}`,
        className,
    ]
        .filter(Boolean)
        .join(' ');
    return _jsx("span", { className: classes, children: children });
};
//# sourceMappingURL=Badge.js.map