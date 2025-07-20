import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import './Input.css';
export const Input = ({ label, error, variant = 'default', leftIcon, rightIcon, className = '', ...props }) => {
    const classes = [
        'input-wrapper',
        variant && `input-${variant}`,
        error && 'input-error',
        leftIcon && 'input-with-left-icon',
        rightIcon && 'input-with-right-icon',
        className,
    ]
        .filter(Boolean)
        .join(' ');
    return (_jsxs("div", { className: classes, children: [label && _jsx("label", { className: "input-label", children: label }), _jsxs("div", { className: "input-container", children: [leftIcon && _jsx("div", { className: "input-icon input-icon-left", children: leftIcon }), _jsx("input", { className: "input", ...props }), rightIcon && _jsx("div", { className: "input-icon input-icon-right", children: rightIcon })] }), error && _jsx("span", { className: "input-error-text", children: error })] }));
};
//# sourceMappingURL=Input.js.map