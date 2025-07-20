import { jsx as _jsx } from "react/jsx-runtime";
import './Card.css';
export const Card = ({ children, className = '', padding = 'md', }) => {
    const classes = [
        'card',
        `card-padding-${padding}`,
        className,
    ]
        .filter(Boolean)
        .join(' ');
    return _jsx("div", { className: classes, children: children });
};
export const CardHeader = ({ children, className = '', }) => {
    return _jsx("div", { className: `card-header ${className}`, children: children });
};
export const CardContent = ({ children, className = '', }) => {
    return _jsx("div", { className: `card-content ${className}`, children: children });
};
export const CardFooter = ({ children, className = '', }) => {
    return _jsx("div", { className: `card-footer ${className}`, children: children });
};
//# sourceMappingURL=Card.js.map