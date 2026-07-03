'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAppStore, themeColorMap, fontSizeMap } from '@/lib/store';
import { useAppInit } from '@/lib/use-app-init';
import { AppShell } from '@/components/app/app-shell';
import { Dashboard } from '@/components/app/dashboard';
import { CoursesList } from '@/components/app/courses-list';
import { CourseDetails, LevelDetails } from '@/components/app/course-details';
import { Settings } from '@/components/app/settings';
import { ImportModal } from '@/components/app/import-modal';
import { YouTubeImport } from '@/components/app/youtube-import';
import { VideoPlayer } from '@/components/app/video-player';
import { t } from '@/lib/i18n';
import { toggleLessonComplete, getAllProgress, Lesson } from '@/lib/db-indexeddb';

export default function Home() {
  const { currentView, language, fontSize, themeColor, isDarkMode, isLoading } = useAppStore();
  const tc = themeColorMap[themeColor];
  const fs = fontSizeMap[fontSize];

  // Video player state
  const [activeVideoLesson, setActiveVideoLesson] = useState<{
    lesson: Lesson;
    courseId: string;
    levelId: string;
  } | null>(null);

  // Initialize app data
  useAppInit();

  // Apply dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // Apply font size
  useEffect(() => {
    document.documentElement.style.fontSize = fs.base;
  }, [fs.base]);

  // Apply theme color CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-primary', tc.primary);
    document.documentElement.style.setProperty('--theme-primary-light', tc.primaryLight);
    document.documentElement.style.setProperty('--theme-primary-dark', tc.primaryDark);

    // Update meta theme-color for PWA
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', isDarkMode ? '#0f172a' : tc.primary);
    }
  }, [tc, isDarkMode]);

  // Apply direction
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // SW registration failed - app still works
      });
    }
  }, []);

  // Request notification permission when enabled
  useEffect(() => {
    if ('Notification' in window && useAppStore.getState().notificationsEnabled) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [useAppStore.getState().notificationsEnabled]);

  // Schedule daily reminder
  useEffect(() => {
    if (!useAppStore.getState().notificationsEnabled) return;

    const checkReminder = () => {
      const now = new Date();
      const reminderTime = useAppStore.getState().reminderTime;
      const [hours, minutes] = reminderTime.split(':').map(Number);

      if (now.getHours() === hours && now.getMinutes() === minutes) {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(language === 'ar' ? 'تذكير بالدراسة 📚' : 'Study Reminder 📚', {
            body: language === 'ar' ? 'حان وقت الدراسة! واصل تقدمك.' : "It's time to study! Keep up your progress.",
            icon: '/icons/icon-192x192.png',
            tag: 'daily-reminder',
          });
        }
      }
    };

    const interval = setInterval(checkReminder, 60000);
    return () => clearInterval(interval);
  }, [language]);

  // Handle opening video player
  const handleOpenVideoPlayer = useCallback((lesson: Lesson, courseId: string, levelId: string) => {
    setActiveVideoLesson({ lesson, courseId, levelId });
  }, []);

  // Handle completing lesson from video player
  const handleVideoComplete = useCallback(async (courseId: string, levelId: string, lessonId: string) => {
    const updated = await toggleLessonComplete(courseId, levelId, lessonId);
    if (updated) {
      useAppStore.getState().updateCourseInList(updated);
      const progress = await getAllProgress();
      useAppStore.getState().setProgress(progress);
    }
  }, []);

  // Handle closing video player
  const handleCloseVideoPlayer = useCallback(() => {
    setActiveVideoLesson(null);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg"
              style={{ backgroundColor: tc.primary }}
            >
              {language === 'ar' ? 'م' : 'M'}
            </div>
            <div
              className="absolute -inset-2 rounded-3xl animate-ping opacity-20"
              style={{ backgroundColor: tc.primary }}
            />
          </div>
          <div className="text-center">
            <p className="font-bold text-lg" style={{ color: tc.primary }}>
              {t('appName', language)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="animate-fade-in">
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'courses' && <CoursesList />}
        {currentView === 'course-details' && <CourseDetails />}
        {currentView === 'level-details' && <LevelDetails onOpenVideoPlayer={handleOpenVideoPlayer} />}
        {currentView === 'settings' && <Settings />}
      </div>
      <ImportModal />
      <YouTubeImport />

      {/* Video Player Overlay */}
      {activeVideoLesson && (
        <VideoPlayer
          lessonName={activeVideoLesson.lesson.name}
          lessonUrl={activeVideoLesson.lesson.url}
          lessonId={activeVideoLesson.lesson.id}
          courseId={activeVideoLesson.courseId}
          levelId={activeVideoLesson.levelId}
          onClose={handleCloseVideoPlayer}
          onComplete={handleVideoComplete}
        />
      )}
    </AppShell>
  );
}
