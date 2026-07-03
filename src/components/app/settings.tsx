'use client';

import React, { useEffect, useState } from 'react';
import { useAppStore, themeColorMap, fontSizeMap, ThemeColor, FontSize } from '@/lib/store';
import { t, Language } from '@/lib/i18n';
import { useSettingsActions } from '@/lib/use-app-init';
import { ArrowRight, ArrowLeft, Sun, Moon, Type, Palette, Globe, Bell, Info, Download, Monitor, Check, Key } from 'lucide-react';

export function Settings() {
  const { language, fontSize, themeColor, isDarkMode, notificationsEnabled, reminderTime, goBack } = useAppStore();
  const lang = language;
  const isRTL = lang === 'ar';
  const tc = themeColorMap[themeColor];
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;
  const { changeLanguage, changeFontSize, changeThemeColor, changeDarkMode, changeNotifications, changeReminderTime } = useSettingsActions();

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallSuccess, setShowInstallSuccess] = useState(false);
  const [youtubeApiKey, setYoutubeApiKey] = useState('');
  const [youtubeApiKeyLoaded, setYoutubeApiKeyLoaded] = useState(false);

  useEffect(() => {
    const loadApiKey = async () => {
      const { getSetting, setSetting } = await import('@/lib/db-indexeddb');
      const key = await getSetting('youtube_api_key');
      if (key) setYoutubeApiKey(key);
      setYoutubeApiKeyLoaded(true);
    };
    loadApiKey();
  }, []);

  const handleSaveApiKey = async () => {
    const { setSetting } = await import('@/lib/db-indexeddb');
    await setSetting('youtube_api_key', youtubeApiKey);
  };

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallSuccess(true);
      setTimeout(() => setShowInstallSuccess(false), 3000);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <button
          onClick={goBack}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
        >
          <BackArrow className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">{t('settingsTitle', lang)}</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Language */}
        <SettingsGroup
          icon={<Globe className="w-5 h-5" />}
          title={t('language', lang)}
          primaryColor={tc.primary}
          description={lang === 'ar' ? 'تغيير لغة واجهة التطبيق' : 'Change app interface language'}
        >
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => changeLanguage('ar')}
              className={`py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                language === 'ar' ? 'text-white shadow-md' : 'border hover:bg-accent'
              }`}
              style={language === 'ar' ? { backgroundColor: tc.primary } : {}}
            >
              {language === 'ar' && <Check className="w-4 h-4" />}
              العربية
            </button>
            <button
              onClick={() => changeLanguage('en')}
              className={`py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                language === 'en' ? 'text-white shadow-md' : 'border hover:bg-accent'
              }`}
              style={language === 'en' ? { backgroundColor: tc.primary } : {}}
            >
              {language === 'en' && <Check className="w-4 h-4" />}
              English
            </button>
          </div>
        </SettingsGroup>

        {/* Appearance */}
        <SettingsGroup
          icon={isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          title={lang === 'ar' ? 'المظهر' : 'Appearance'}
          primaryColor={tc.primary}
          description={isDarkMode ? t('darkMode', lang) : t('lightMode', lang)}
        >
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => changeDarkMode(false)}
              className={`py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                !isDarkMode ? 'text-white shadow-md' : 'border hover:bg-accent'
              }`}
              style={!isDarkMode ? { backgroundColor: tc.primary } : {}}
            >
              <Sun className="w-4 h-4" />
              {!isDarkMode && <Check className="w-3 h-3" />}
              {t('lightMode', lang)}
            </button>
            <button
              onClick={() => changeDarkMode(true)}
              className={`py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                isDarkMode ? 'text-white shadow-md' : 'border hover:bg-accent'
              }`}
              style={isDarkMode ? { backgroundColor: tc.primary } : {}}
            >
              <Moon className="w-4 h-4" />
              {isDarkMode && <Check className="w-3 h-3" />}
              {t('darkMode', lang)}
            </button>
          </div>
        </SettingsGroup>

        {/* Font Size */}
        <SettingsGroup
          icon={<Type className="w-5 h-5" />}
          title={t('fontSize', lang)}
          primaryColor={tc.primary}
          description={`${lang === 'ar' ? 'الحجم الحالي' : 'Current size'}: ${fontSizeMap[fontSize][lang === 'ar' ? 'nameAr' : 'name']}`}
        >
          <div className="grid grid-cols-3 gap-2">
            {(['small', 'medium', 'large'] as FontSize[]).map((size) => (
              <button
                key={size}
                onClick={() => changeFontSize(size)}
                className={`py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1 ${
                  fontSize === size ? 'text-white shadow-md' : 'border hover:bg-accent'
                }`}
                style={fontSize === size ? { backgroundColor: tc.primary } : {}}
              >
                {fontSize === size && <Check className="w-3.5 h-3.5" />}
                {fontSizeMap[size][lang === 'ar' ? 'nameAr' : 'name']}
              </button>
            ))}
          </div>
        </SettingsGroup>

        {/* Theme Color */}
        <SettingsGroup
          icon={<Palette className="w-5 h-5" />}
          title={t('themeColor', lang)}
          primaryColor={tc.primary}
          description={tc[lang === 'ar' ? 'nameAr' : 'name']}
        >
          <div className="flex gap-3 justify-center py-1">
            {(['emerald', 'teal', 'cyan', 'amber', 'rose', 'violet'] as ThemeColor[]).map((color) => (
              <button
                key={color}
                onClick={() => changeThemeColor(color)}
                className={`w-10 h-10 rounded-xl transition-all relative ${
                  themeColor === color ? 'ring-2 ring-offset-2 ring-offset-background scale-110' : 'hover:scale-105'
                }`}
                style={{
                  backgroundColor: themeColorMap[color].primary,
                  '--tw-ring-color': themeColor === color ? themeColorMap[color].primary : undefined,
                } as React.CSSProperties}
                title={themeColorMap[color][lang === 'ar' ? 'nameAr' : 'name']}
              >
                {themeColor === color && (
                  <Check className="w-4 h-4 text-white absolute inset-0 m-auto" />
                )}
              </button>
            ))}
          </div>
        </SettingsGroup>

        {/* YouTube API Key */}
        {youtubeApiKeyLoaded && (
          <SettingsGroup
            icon={<Key className="w-5 h-5" />}
            title={t('youtubeApiKey', lang)}
            primaryColor={tc.primary}
            description={t('youtubeApiKeyDesc', lang)}
          >
            <div className="space-y-3">
              <input
                type="password"
                value={youtubeApiKey}
                onChange={(e) => setYoutubeApiKey(e.target.value)}
                onBlur={handleSaveApiKey}
                className="w-full h-10 rounded-xl border bg-background px-4 text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': tc.primary } as React.CSSProperties}
                placeholder={t('youtubeApiKeyPlaceholder', lang)}
              />
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium flex items-center gap-1.5 hover:underline"
                style={{ color: tc.primary }}
              >
                <Download className="w-3.5 h-3.5" />
                {t('howToGetApiKey', lang)}
              </a>
              {!youtubeApiKey && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  {t('noApiKey', lang)}
                </p>
              )}
            </div>
          </SettingsGroup>
        )}

        {/* Notifications */}
        <SettingsGroup
          icon={<Bell className="w-5 h-5" />}
          title={t('notifications', lang)}
          primaryColor={tc.primary}
          description={notificationsEnabled
            ? (lang === 'ar' ? 'الإشعارات مفعلة' : 'Notifications enabled')
            : (lang === 'ar' ? 'الإشعارات معطلة' : 'Notifications disabled')
          }
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t('dailyReminder', lang)}</p>
                <p className="text-[10px] text-muted-foreground">
                  {lang === 'ar' ? 'تذكير يومي بمواصلة التعلم' : 'Daily reminder to continue learning'}
                </p>
              </div>
              <ToggleSwitch
                checked={notificationsEnabled}
                onChange={changeNotifications}
                primaryColor={tc.primary}
              />
            </div>
            {notificationsEnabled && (
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm">{t('reminderTime', lang)}</span>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => changeReminderTime(e.target.value)}
                  className="h-8 rounded-lg border bg-background px-2 text-sm"
                />
              </div>
            )}
          </div>
        </SettingsGroup>

        {/* Install App */}
        {deferredPrompt && (
          <SettingsGroup
            icon={<Download className="w-5 h-5" />}
            title={t('installApp', lang)}
            primaryColor={tc.primary}
            description={t('installAppDesc', lang)}
          >
            <button
              onClick={handleInstall}
              className="w-full py-2.5 rounded-xl text-white text-sm font-medium transition-transform active:scale-95 shadow-md"
              style={{ backgroundColor: tc.primary }}
            >
              {t('installApp', lang)}
            </button>
          </SettingsGroup>
        )}

        {/* About */}
        <SettingsGroup
          icon={<Info className="w-5 h-5" />}
          title={t('aboutApp', lang)}
          primaryColor={tc.primary}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('version', lang)}</span>
              <span className="text-sm font-medium">1.0.0</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{t('aboutDescription', lang)}</p>
            <div className="flex items-center gap-2 pt-2 border-t">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[8px] font-bold"
                style={{ backgroundColor: tc.primary }}
              >
                {lang === 'ar' ? 'م' : 'M'}
              </div>
              <span className="text-xs text-muted-foreground">
                {lang === 'ar' ? 'مبني بتقنية Next.js و PWA' : 'Built with Next.js & PWA'}
              </span>
            </div>
          </div>
        </SettingsGroup>
      </div>
    </div>
  );
}

function SettingsGroup({
  icon,
  title,
  primaryColor,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  primaryColor: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 space-y-3 shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${primaryColor}12`, color: primaryColor }}
        >
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-sm">{title}</h3>
          {description && (
            <p className="text-[10px] text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  primaryColor,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  primaryColor: string;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-12 h-6 rounded-full transition-colors relative ${
        checked ? '' : 'bg-muted'
      }`}
      style={checked ? { backgroundColor: primaryColor } : {}}
    >
      <div
        className="w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-all duration-200"
        style={{
          insetInlineStart: checked ? 'calc(100% - 22px)' : '2px',
        }}
      />
    </button>
  );
}
