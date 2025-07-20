import React from 'react';
import './Input.css';
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    variant?: 'default' | 'search';
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}
export declare const Input: React.FC<InputProps>;
export {};
//# sourceMappingURL=Input.d.ts.map