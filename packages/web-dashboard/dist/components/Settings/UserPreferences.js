import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, CardHeader, CardContent, Button } from '@components/UI';
import { useSettings } from '@hooks/useSettings';
export const UserPreferences = () => {
    const { settings, updateSettings } = useSettings();
    const [localSettings, setLocalSettings] = useState(settings?.preferences || {
        theme: 'auto',
        language: 'en',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        dateFormat: 'MM/dd/yyyy',
        notifications: {
            desktop: true,
            email: false,
            sound: true,
        },
    });
    const handleSave = async () => {
        try {
            await updateSettings({ preferences: localSettings });
        }
        catch (error) {
            console.error('Failed to save user preferences:', error);
        }
    };
    const timezones = [
        'America/New_York',
        'America/Chicago',
        'America/Denver',
        'America/Los_Angeles',
        'Europe/London',
        'Europe/Paris',
        'Europe/Berlin',
        'Asia/Tokyo',
        'Asia/Shanghai',
        'Australia/Sydney',
    ];
    const languages = [
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Español' },
        { code: 'fr', name: 'Français' },
        { code: 'de', name: 'Deutsch' },
        { code: 'it', name: 'Italiano' },
        { code: 'pt', name: 'Português' },
        { code: 'ja', name: '日本語' },
        { code: 'zh', name: '中文' },
    ];
    const dateFormats = [
        'MM/dd/yyyy',
        'dd/MM/yyyy',
        'yyyy-MM-dd',
        'dd-MM-yyyy',
        'MMM dd, yyyy',
    ];
    return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx("h2", { children: "User Preferences" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "setting-group", children: [_jsx("label", { className: "setting-label", children: "Theme" }), _jsxs("select", { className: "setting-select", value: localSettings.theme, onChange: (e) => setLocalSettings({
                                                ...localSettings,
                                                theme: e.target.value
                                            }), children: [_jsx("option", { value: "auto", children: "Auto (System)" }), _jsx("option", { value: "light", children: "Light" }), _jsx("option", { value: "dark", children: "Dark" })] })] }), _jsxs("div", { className: "setting-group", children: [_jsx("label", { className: "setting-label", children: "Language" }), _jsx("select", { className: "setting-select", value: localSettings.language, onChange: (e) => setLocalSettings({ ...localSettings, language: e.target.value }), children: languages.map(lang => (_jsx("option", { value: lang.code, children: lang.name }, lang.code))) })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "setting-group", children: [_jsx("label", { className: "setting-label", children: "Timezone" }), _jsx("select", { className: "setting-select", value: localSettings.timezone, onChange: (e) => setLocalSettings({ ...localSettings, timezone: e.target.value }), children: timezones.map(tz => (_jsx("option", { value: tz, children: tz }, tz))) })] }), _jsxs("div", { className: "setting-group", children: [_jsx("label", { className: "setting-label", children: "Date Format" }), _jsx("select", { className: "setting-select", value: localSettings.dateFormat, onChange: (e) => setLocalSettings({ ...localSettings, dateFormat: e.target.value }), children: dateFormats.map(format => (_jsx("option", { value: format, children: format }, format))) })] })] }), _jsxs("div", { className: "setting-group", children: [_jsx("label", { className: "setting-label", children: "Notifications" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("label", { className: "setting-checkbox", children: [_jsx("input", { type: "checkbox", checked: localSettings.notifications.desktop, onChange: (e) => setLocalSettings({
                                                        ...localSettings,
                                                        notifications: { ...localSettings.notifications, desktop: e.target.checked }
                                                    }) }), _jsx("span", { children: "Desktop notifications" })] }), _jsxs("label", { className: "setting-checkbox", children: [_jsx("input", { type: "checkbox", checked: localSettings.notifications.email, onChange: (e) => setLocalSettings({
                                                        ...localSettings,
                                                        notifications: { ...localSettings.notifications, email: e.target.checked }
                                                    }) }), _jsx("span", { children: "Email notifications" })] }), _jsxs("label", { className: "setting-checkbox", children: [_jsx("input", { type: "checkbox", checked: localSettings.notifications.sound, onChange: (e) => setLocalSettings({
                                                        ...localSettings,
                                                        notifications: { ...localSettings.notifications, sound: e.target.checked }
                                                    }) }), _jsx("span", { children: "Sound notifications" })] })] })] }), _jsx(Button, { variant: "primary", onClick: handleSave, children: "Save Preferences" })] }) })] }));
};
//# sourceMappingURL=UserPreferences.js.map