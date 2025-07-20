import React, { useState } from 'react';
import { Card, CardHeader, CardContent, Button, Input } from '@components/UI';
import { useSettings } from '@hooks/useSettings';
import { UserPreferences as UserPreferencesType } from '@ai-toolkit/shared';

export const UserPreferences: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState<UserPreferencesType>(
    settings?.preferences || {
      theme: 'auto',
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      dateFormat: 'MM/dd/yyyy',
      notifications: {
        desktop: true,
        email: false,
        sound: true,
      },
    }
  );

  const handleSave = async () => {
    try {
      await updateSettings({ preferences: localSettings });
    } catch (error) {
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

  return (
    <Card>
      <CardHeader>
        <h2>User Preferences</h2>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="setting-group">
              <label className="setting-label">Theme</label>
              <select
                className="setting-select"
                value={localSettings.theme}
                onChange={(e) => setLocalSettings({ 
                  ...localSettings, 
                  theme: e.target.value as 'light' | 'dark' | 'auto' 
                })}
              >
                <option value="auto">Auto (System)</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            <div className="setting-group">
              <label className="setting-label">Language</label>
              <select
                className="setting-select"
                value={localSettings.language}
                onChange={(e) => setLocalSettings({ ...localSettings, language: e.target.value })}
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="setting-group">
              <label className="setting-label">Timezone</label>
              <select
                className="setting-select"
                value={localSettings.timezone}
                onChange={(e) => setLocalSettings({ ...localSettings, timezone: e.target.value })}
              >
                {timezones.map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>

            <div className="setting-group">
              <label className="setting-label">Date Format</label>
              <select
                className="setting-select"
                value={localSettings.dateFormat}
                onChange={(e) => setLocalSettings({ ...localSettings, dateFormat: e.target.value })}
              >
                {dateFormats.map(format => (
                  <option key={format} value={format}>{format}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="setting-group">
            <label className="setting-label">Notifications</label>
            <div className="space-y-2">
              <label className="setting-checkbox">
                <input
                  type="checkbox"
                  checked={localSettings.notifications.desktop}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    notifications: { ...localSettings.notifications, desktop: e.target.checked }
                  })}
                />
                <span>Desktop notifications</span>
              </label>
              
              <label className="setting-checkbox">
                <input
                  type="checkbox"
                  checked={localSettings.notifications.email}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    notifications: { ...localSettings.notifications, email: e.target.checked }
                  })}
                />
                <span>Email notifications</span>
              </label>
              
              <label className="setting-checkbox">
                <input
                  type="checkbox"
                  checked={localSettings.notifications.sound}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    notifications: { ...localSettings.notifications, sound: e.target.checked }
                  })}
                />
                <span>Sound notifications</span>
              </label>
            </div>
          </div>

          <Button variant="primary" onClick={handleSave}>
            Save Preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};