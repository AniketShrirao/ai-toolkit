import React from 'react';
import './ProgressBar.css';
interface ProgressBarProps {
    value: number;
    max?: number;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'success' | 'warning' | 'error';
    showLabel?: boolean;
    className?: string;
}
export declare const ProgressBar: React.FC<ProgressBarProps>;
export {};
//# sourceMappingURL=ProgressBar.d.ts.map