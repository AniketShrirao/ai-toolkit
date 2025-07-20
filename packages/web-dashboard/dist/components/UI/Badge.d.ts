import React from 'react';
import './Badge.css';
interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
    size?: 'sm' | 'md';
    className?: string;
}
export declare const Badge: React.FC<BadgeProps>;
export {};
//# sourceMappingURL=Badge.d.ts.map