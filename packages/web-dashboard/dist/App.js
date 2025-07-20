import { jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { Layout } from '@components/Layout';
import { WebSocketProvider } from '@hooks/useWebSocket';
import { SettingsProvider } from '@hooks/useSettings';
import { Dashboard } from '@components/Dashboard';
import { Documents } from '@components/Documents';
import { Settings } from '@components/Settings';
function App() {
    const [activeView, setActiveView] = useState('dashboard');
    const renderContent = () => {
        switch (activeView) {
            case 'dashboard':
                return _jsx(Dashboard, {});
            case 'documents':
                return _jsx(Documents, {});
            case 'settings':
                return _jsx(Settings, {});
            default:
                return _jsx(Dashboard, {});
        }
    };
    return (_jsx(SettingsProvider, { children: _jsx(WebSocketProvider, { children: _jsx(Layout, { activeView: activeView, onViewChange: setActiveView, children: renderContent() }) }) }));
}
export default App;
//# sourceMappingURL=App.js.map