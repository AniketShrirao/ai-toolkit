import React from 'react';
import { ActiveView } from '../../App';
import './Sidebar.css';
interface SidebarProps {
    activeView: ActiveView;
    onViewChange: (view: ActiveView) => void;
    isOpen: boolean;
    onClose: () => void;
}
export declare const Sidebar: React.FC<SidebarProps>;
export {};
//# sourceMappingURL=Sidebar.d.ts.map