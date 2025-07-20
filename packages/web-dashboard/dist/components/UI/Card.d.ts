import React from 'react';
import './Card.css';
interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
}
export declare const Card: React.FC<CardProps>;
interface CardHeaderProps {
    children: React.ReactNode;
    className?: string;
}
export declare const CardHeader: React.FC<CardHeaderProps>;
interface CardContentProps {
    children: React.ReactNode;
    className?: string;
}
export declare const CardContent: React.FC<CardContentProps>;
interface CardFooterProps {
    children: React.ReactNode;
    className?: string;
}
export declare const CardFooter: React.FC<CardFooterProps>;
export {};
//# sourceMappingURL=Card.d.ts.map