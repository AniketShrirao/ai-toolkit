import React from 'react';
import { ActiveView } from '../../App';
import './Layout.css';
interface LayoutProps {
    children: React.ReactNode;
    activeView: ActiveView;
    onViewChange: (view: ActiveView) => void;
}
export declare const Layout: React.FC<LayoutProps>;
export {};
//# sourceMappingURL=Layout.d.ts.map