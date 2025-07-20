import React from 'react';
import './Button.css';
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    children: React.ReactNode;
    as?: 'button' | 'span';
}
export declare const Button: React.FC<ButtonProps>;
export {};
//# sourceMappingURL=Button.d.ts.map