import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import './Button.css';
export const Button = ({ variant = 'primary', size = 'md', loading = false, disabled, children, className = '', as = 'button', ...props }) => {
    const classes = [
        'button',
        `button-${variant}`,
        `button-${size}`,
        loading && 'button-loading',
        className,
    ]
        .filter(Boolean)
        .join(' ');
    const content = (_jsxs(_Fragment, { children: [loading && _jsx("span", { className: "button-spinner" }), _jsx("span", { className: loading ? 'button-content-loading' : '', children: children })] }));
    if (as === 'span') {
        return (_jsx("span", { className: classes, ...props, children: content }));
    }
    return (_jsx("button", { className: classes, disabled: disabled || loading, ...props, children: content }));
};
//# sourceMappingURL=Button.js.map