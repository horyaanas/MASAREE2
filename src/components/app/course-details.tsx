'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useAppStore, themeColorMap } from '@/lib/store';
import { t } from '@/lib/i18n';
import {
  isLevelUnlocked, isLessonUnlocked, getLevelProgress,
  Lesson, Level, Course, toggleLessonComplete, getAllProgress, updateCourse,
} from '@/lib/db-indexeddb';
import {
  exportCourseToExcel, exportLevelToExcel, downloadBlob, sanitizeFilename,
} from '@/lib/excel';
import {
  ArrowRight, ArrowLeft, Lock, CheckCircle2, Clock, BookOpen, Trophy,
  Pencil, Trash2, X, ChevronLeft, ChevronRight, Layers,
  Download, Filter, SlidersHorizontal, Play,
} from 'lucide-react';
import { YouTubePlaylistPlayer, PlaylistPlayerVideo } from './youtube-playlist-player';

// ─── Duration parser helper ──────────────────────────────────────────────────
function parseDurationToSeconds(duration: string): number {
  if (!duration) return 0;
  const parts = duration.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parseFloat(duration) * 60 || 0;
}

// ─── Extract YouTube ID Helper ────────────────────────────────────────────────
function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com') && parsed.searchParams.get('v')) {
      return parsed.searchParams.get('v');
    }
    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.slice(1).split('/')[0] || null;
    }
    if (parsed.hostname.includes('youtube.com') && parsed.pathname.startsWith('/embed/')) {
      return parsed.pathname.split('/embed/')[1]?.split('/')[0] || null;
    }
    if (parsed.hostname.includes('youtube.com') && parsed.pathname.startsWith('/shorts/')) {
      return parsed.pathname.split('/shorts/')[1]?.split('/')[0] || null;
    }
  } catch {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (match) return match[1];
  }
  return null;
}

const isYouTubeLesson = (lesson: Lesson) => {
  return !!(lesson.videoId || extractYouTubeId(lesson.url));
};

// ─── Filter/Sort types ────────────────────────────────────────────────────────
type StatusFilter = 'all' | 'completed' | 'incomplete';
type DurationFilter = 'all' | 'short' | 'medium' | 'long';
type SortOption = 'order' | 'name' | 'durationAsc' | 'durationDesc';

// ============ COURSE DETAILS VIEW (shows level cards) ========================
export function CourseDetails() {
  const { courses, selectedCourseId, language, goBack, themeColor, selectLevel } = useAppStore();
  const lang = language;
  const isRTL = lang === 'ar';
  const tc = themeColorMap[themeColor];
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;
  const LevelArrow = isRTL ? ChevronLeft : ChevronRight;

  const course = courses.find((c) => c.id === selectedCourseId);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('');
  const [confirmDeleteCourse, setConfirmDeleteCourse] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const handleEdit = () => {
    if (!course) return;
    setEditName(course.name);
    setEditType(course.type);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!course) return;
    const updated = { ...course, name: editName, type: editType, updatedAt: Date.now() };
    await updateCourse(updated);
    useAppStore.getState().updateCourseInList(updated);
    const progress = await getAllProgress();
    useAppStore.getState().setProgress(progress);
    setEditModalOpen(false);
  };

  const handleDeleteCourse = async () => {
    if (!course) return;
    if (!confirmDeleteCourse) {
      setConfirmDeleteCourse(true);
      setTimeout(() => setConfirmDeleteCourse(false), 3000);
      return;
    }
    const { deleteCourse } = await import('@/lib/db-indexeddb');
    await deleteCourse(course.id);
    useAppStore.getState().removeCourseFromList(course.id);
    goBack();
  };

  const handleExportCourse = useCallback(() => {
    if (!course) return;
    setExportLoading(true);
    try {
      const blob = exportCourseToExcel(course);
      downloadBlob(blob, `${sanitizeFilename(course.name)}_course.xlsx`);
    } finally {
      setExportLoading(false);
    }
  }, [course]);

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: `${tc.primary}10` }}>
          <BookOpen className="w-8 h-8" style={{ color: tc.primary }} />
        </div>
        <p className="text-muted-foreground">{t('noCourses', lang)}</p>
      </div>
    );
  }

  const totalLessons = course.levels.reduce((sum, l) => sum + l.lessons.length, 0);
  const completedLessons = course.levels.reduce((sum, l) => sum + l.lessons.filter((ls) => ls.completed).length, 0);
  const overallPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const isCompleted = overallPercentage === 100;

  return (
    <div className="pb-4">
      {/* Header */}
      <div
        className="p-4 pb-5"
        style={{
          background: isCompleted
            ? `linear-gradient(135deg, #059669, #22c55e)`
            : `linear-gradient(135deg, ${tc.primaryDark}, ${tc.primary})`,
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={goBack}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20 text-white hover:bg-white/30 transition-colors"
          >
            <BackArrow className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-white truncate flex-1">{course.name}</h1>

          {/* Export Course Button */}
          <button
            onClick={handleExportCourse}
            disabled={exportLoading}
            title={t('exportCourse', lang)}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20 text-white hover:bg-white/30 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={handleEdit}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20 text-white hover:bg-white/30 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={handleDeleteCourse}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              confirmDeleteCourse ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-3">
          {course.type && (
            <span className="text-xs px-3 py-1 rounded-full bg-white/20 text-white font-medium">
              {course.type}
            </span>
          )}
          <span className="text-xs text-white/80 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            {completedLessons}/{totalLessons} {t('lesson', lang)}
          </span>
        </div>

        <div className="h-2.5 rounded-full bg-white/20 overflow-hidden">
          <div
            className="h-full rounded-full bg-white transition-all duration-700 ease-out"
            style={{ width: `${overallPercentage}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-white/80">
            {isCompleted ? (lang === 'ar' ? 'أكملت الدورة! 🎉' : 'Course completed! 🎉') : `${overallPercentage}% ${t('completion', lang)}`}
          </p>
          {isCompleted && <Trophy className="w-4 h-4 text-yellow-300" />}
        </div>
      </div>

      {/* Level Cards */}
      <div className="p-4 space-y-3">
        <h2 className="text-base font-bold flex items-center gap-2">
          <Layers className="w-4 h-4" style={{ color: tc.primary }} />
          {t('levels', lang)}
        </h2>

        {course.levels.map((level) => {
          const unlocked = isLevelUnlocked(course, level.order);
          const lp = getLevelProgress(level);

          return (
            <div
              key={level.id}
              className={`rounded-2xl border overflow-hidden transition-all hover:shadow-md active:scale-[0.98] ${
                unlocked ? 'bg-card cursor-pointer' : 'bg-muted/20 cursor-not-allowed opacity-60'
              }`}
              onClick={() => unlocked && selectLevel(level.id)}
            >
              {/* Top accent bar */}
              <div
                className="h-1"
                style={{
                  background: lp.percentage === 100
                    ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                    : unlocked
                      ? `linear-gradient(90deg, ${tc.primaryDark}, ${tc.primary})`
                      : 'var(--muted)',
                }}
              />

              <div className="p-4">
                <div className="flex items-center gap-3">
                  {/* Level number badge */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0"
                    style={{
                      backgroundColor: lp.percentage === 100 ? '#22c55e' : unlocked ? tc.primary : 'var(--muted)',
                    }}
                  >
                    {lp.percentage === 100 ? <CheckCircle2 className="w-6 h-6" /> : unlocked ? level.order + 1 : <Lock className="w-5 h-5 text-white/60" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-base truncate">{level.name}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {lp.completed}/{lp.total} {t('lesson', lang)}
                      </span>
                      {!unlocked && (
                        <span className="flex items-center gap-1 text-destructive">
                          <Lock className="w-3 h-3" />
                          {t('levelLocked', lang)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress + arrow */}
                  {unlocked && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-center">
                        <span className="text-sm font-bold" style={{ color: lp.percentage === 100 ? '#22c55e' : tc.primary }}>
                          {lp.percentage}%
                        </span>
                      </div>
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${tc.primary}10` }}
                      >
                        <LevelArrow className="w-4 h-4" style={{ color: tc.primary }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                {unlocked && (
                  <div className="mt-3">
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${lp.percentage}%`,
                          background: lp.percentage === 100
                            ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                            : `linear-gradient(90deg, ${tc.primaryDark}, ${tc.primary})`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Course Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditModalOpen(false)} />
          <div className="relative w-full max-w-sm mx-4 bg-background rounded-2xl p-5 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base">{t('editCourse', lang)}</h3>
              <button onClick={() => setEditModalOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-accent">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">{t('courseName', lang)}</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-11 rounded-xl border bg-background px-4 text-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': tc.primary } as React.CSSProperties}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t('courseTypeLabel', lang)}</label>
                <input
                  type="text"
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  className="w-full h-11 rounded-xl border bg-background px-4 text-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': tc.primary } as React.CSSProperties}
                />
              </div>
              <button
                onClick={handleSaveEdit}
                className="w-full py-3 rounded-xl text-white text-sm font-bold transition-transform active:scale-95 shadow-md"
                style={{ backgroundColor: tc.primary }}
              >
                {t('save', lang)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ LEVEL DETAILS VIEW (shows large lesson cards) ==================
export function LevelDetails({ onOpenVideoPlayer }: { onOpenVideoPlayer: (lesson: Lesson, courseId: string, levelId: string) => void }) {
  const { courses, selectedCourseId, selectedLevelId, language, goBack, themeColor } = useAppStore();
  const lang = language;
  const isRTL = lang === 'ar';
  const tc = themeColorMap[themeColor];
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  const course = courses.find((c) => c.id === selectedCourseId);
  const level = course?.levels.find((l) => l.id === selectedLevelId);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [confirmDeleteLevel, setConfirmDeleteLevel] = useState(false);

  // ─── Filter & Sort state ────────────────────────────────────────────────
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [durationFilter, setDurationFilter] = useState<DurationFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('order');
  const [exportLoading, setExportLoading] = useState(false);

  // Playlist player state
  const [showPlaylistPlayer, setShowPlaylistPlayer] = useState(false);
  const [playerStartIndex, setPlayerStartIndex] = useState(0);

  const isFilterActive = statusFilter !== 'all' || durationFilter !== 'all' || sortOption !== 'order';

  // ─── Filtered + sorted lessons ──────────────────────────────────────────
  const filteredLessons = useMemo(() => {
    if (!level) return [];
    let lessons = [...level.lessons];

    // Status filter
    if (statusFilter === 'completed') lessons = lessons.filter((l) => l.completed);
    else if (statusFilter === 'incomplete') lessons = lessons.filter((l) => !l.completed);

    // Duration filter
    if (durationFilter !== 'all') {
      lessons = lessons.filter((l) => {
        const secs = parseDurationToSeconds(l.duration);
        const mins = secs / 60;
        if (durationFilter === 'short') return mins < 5;
        if (durationFilter === 'medium') return mins >= 5 && mins <= 20;
        if (durationFilter === 'long') return mins > 20;
        return true;
      });
    }

    // Sort
    if (sortOption === 'name') {
      lessons.sort((a, b) => a.name.localeCompare(b.name, lang));
    } else if (sortOption === 'durationAsc') {
      lessons.sort((a, b) => parseDurationToSeconds(a.duration) - parseDurationToSeconds(b.duration));
    } else if (sortOption === 'durationDesc') {
      lessons.sort((a, b) => parseDurationToSeconds(b.duration) - parseDurationToSeconds(a.duration));
    } else {
      lessons.sort((a, b) => a.order - b.order);
    }

    return lessons;
  }, [level, statusFilter, durationFilter, sortOption, lang]);

  // Playlist video mapping
  const playerVideos = useMemo<PlaylistPlayerVideo[]>(() => {
    if (!course) return [];
    return filteredLessons.map((l, index) => {
      const videoId = l.videoId || extractYouTubeId(l.url) || '';
      return {
        id: l.id,
        videoId,
        title: l.name,
        thumbnail: l.thumbnail || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : ''),
        duration: l.duration || '0:00',
        durationSeconds: parseDurationToSeconds(l.duration),
        position: index,
        channelTitle: course.channelTitle || '',
        publishedAt: '',
        completed: l.completed,
      };
    }).filter((v) => v.videoId !== '');
  }, [filteredLessons, course]);

  const handleEdit = () => {
    if (!level) return;
    setEditName(level.name);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!course || !level) return;
    const updatedLevels = course.levels.map((l) =>
      l.id === level.id ? { ...l, name: editName } : l
    );
    const updated = { ...course, levels: updatedLevels, updatedAt: Date.now() };
    await updateCourse(updated);
    useAppStore.getState().updateCourseInList(updated);
    setEditModalOpen(false);
  };

  const handleDeleteLevel = async () => {
    if (!course || !level) return;
    if (!confirmDeleteLevel) {
      setConfirmDeleteLevel(true);
      setTimeout(() => setConfirmDeleteLevel(false), 3000);
      return;
    }
    const updatedLevels = course.levels.filter((l) => l.id !== level.id);
    const updated = { ...course, levels: updatedLevels, updatedAt: Date.now() };
    await updateCourse(updated);
    useAppStore.getState().updateCourseInList(updated);
    const progress = await getAllProgress();
    useAppStore.getState().setProgress(progress);
    goBack();
  };

  const handleExportLevel = useCallback(() => {
    if (!course || !level) return;
    setExportLoading(true);
    try {
      const lessonsToExport = isFilterActive ? filteredLessons : undefined;
      const blob = exportLevelToExcel(course, level, lessonsToExport);
      const suffix = isFilterActive ? '_filtered' : '';
      downloadBlob(blob, `${sanitizeFilename(level.name)}${suffix}.xlsx`);
    } finally {
      setExportLoading(false);
    }
  }, [course, level, isFilterActive, filteredLessons]);

  const handleClearFilters = () => {
    setStatusFilter('all');
    setDurationFilter('all');
    setSortOption('order');
  };

  const handlePlayPlaylist = useCallback((startIndex: number) => {
    setPlayerStartIndex(startIndex);
    setShowPlaylistPlayer(true);
  }, []);

  const handleCompleteLesson = useCallback(async (lessonId: string) => {
    if (!course || !level) return;
    const updated = await toggleLessonComplete(course.id, level.id, lessonId);
    if (updated) {
      useAppStore.getState().updateCourseInList(updated);
      const progress = await getAllProgress();
      useAppStore.getState().setProgress(progress);
    }
  }, [course, level]);

  const handleLessonOpen = useCallback((lesson: Lesson, index: number) => {
    if (!course || !level) return;
    if (isYouTubeLesson(lesson)) {
      // Find the index of this lesson inside the playerVideos list
      const idxInPlayer = playerVideos.findIndex((v) => v.id === lesson.id);
      if (idxInPlayer !== -1) {
        handlePlayPlaylist(idxInPlayer);
        return;
      }
    }
    // Fallback to standard player for non-YouTube links
    onOpenVideoPlayer(lesson, course.id, level.id);
  }, [course, level, playerVideos, handlePlayPlaylist, onOpenVideoPlayer]);

  if (!course || !level) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: `${tc.primary}10` }}>
          <BookOpen className="w-8 h-8" style={{ color: tc.primary }} />
        </div>
        <p className="text-muted-foreground">{t('noCourses', lang)}</p>
      </div>
    );
  }

  const lp = getLevelProgress(level);
  const unlocked = isLevelUnlocked(course, level.order);

  return (
    <div className="pb-4">
      {/* Header */}
      <div
        className="p-4 pb-5"
        style={{
          background: lp.percentage === 100
            ? `linear-gradient(135deg, #059669, #22c55e)`
            : `linear-gradient(135deg, ${tc.primaryDark}, ${tc.primary})`,
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={goBack}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20 text-white hover:bg-white/30 transition-colors"
          >
            <BackArrow className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-white truncate flex-1">{level.name}</h1>

          {/* Filter toggle button */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            title={t('filterLessons', lang)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors relative ${
              isFilterActive ? 'bg-yellow-400 text-yellow-900' : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <Filter className="w-4 h-4" />
            {isFilterActive && (
              <span className="absolute -top-1 -end-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
            )}
          </button>

          {/* Export Level Button */}
          <button
            onClick={handleExportLevel}
            disabled={exportLoading}
            title={isFilterActive ? t('exportFiltered', lang) : t('exportLevel', lang)}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20 text-white hover:bg-white/30 transition-colors disabled:opacity-50 relative"
          >
            <Download className="w-4 h-4" />
            {isFilterActive && (
              <span className="absolute -top-1 -end-1 w-2 h-2 bg-yellow-400 rounded-full" />
            )}
          </button>

          <button
            onClick={handleEdit}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20 text-white hover:bg-white/30 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={handleDeleteLevel}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              confirmDeleteLevel ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs text-white/80 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            {lp.completed}/{lp.total} {t('lesson', lang)}
          </span>
          {isFilterActive && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-400/30 text-yellow-100 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              {filteredLessons.length} {t('filterResultsCount', lang)}
            </span>
          )}
        </div>

        <div className="h-2.5 rounded-full bg-white/20 overflow-hidden">
          <div
            className="h-full rounded-full bg-white transition-all duration-700 ease-out"
            style={{ width: `${lp.percentage}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-white/80">
            {lp.percentage === 100 ? (lang === 'ar' ? 'أكملت المستوى! 🎉' : 'Level completed! 🎉') : `${lp.percentage}% ${t('completion', lang)}`}
          </p>
          {lp.percentage === 100 && <Trophy className="w-4 h-4 text-yellow-300" />}
        </div>
      </div>

      {/* ─── Filter Panel ──────────────────────────────────────────────────── */}
      {showFilters && (
        <div className="mx-4 mt-3 rounded-2xl border bg-card p-4 shadow-sm animate-fade-in space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" style={{ color: tc.primary }} />
              {t('filterLessons', lang)}
            </span>
            {isFilterActive && (
              <button
                onClick={handleClearFilters}
                className="text-xs text-destructive hover:underline flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                {t('clearFilter', lang)}
              </button>
            )}
          </div>

          {/* Status filter */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">{t('filterByStatus', lang)}</p>
            <div className="flex gap-2 flex-wrap">
              {(['all', 'completed', 'incomplete'] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    statusFilter === s ? 'text-white shadow-sm' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                  style={statusFilter === s ? { backgroundColor: tc.primary } : {}}
                >
                  {s === 'all' ? t('allLessons', lang) : s === 'completed' ? t('completedOnly', lang) : t('incompleteOnly', lang)}
                </button>
              ))}
            </div>
          </div>

          {/* Duration filter */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">{t('filterByDurationLesson', lang)}</p>
            <div className="flex gap-2 flex-wrap">
              {(['all', 'short', 'medium', 'long'] as DurationFilter[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDurationFilter(d)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    durationFilter === d ? 'text-white shadow-sm' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                  style={durationFilter === d ? { backgroundColor: tc.primary } : {}}
                >
                  {d === 'all'
                    ? t('allLessons', lang)
                    : d === 'short' ? t('shortVideos', lang)
                    : d === 'medium' ? t('mediumVideos', lang)
                    : t('longVideos', lang)}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">{t('sortLessons', lang)}</p>
            <div className="flex gap-2 flex-wrap">
              {(['order', 'name', 'durationAsc', 'durationDesc'] as SortOption[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSortOption(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    sortOption === s ? 'text-white shadow-sm' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                  style={sortOption === s ? { backgroundColor: tc.primary } : {}}
                >
                  {s === 'order' ? t('sortByOrder', lang)
                    : s === 'name' ? t('sortByName', lang)
                    : s === 'durationAsc' ? t('sortByDurationAsc', lang)
                    : t('sortByDurationDesc', lang)}
                </button>
              ))}
            </div>
          </div>

          {/* Export filtered button */}
          <button
            onClick={handleExportLevel}
            disabled={exportLoading || filteredLessons.length === 0}
            className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            style={{ backgroundColor: `${tc.primary}15`, color: tc.primary, border: `1px solid ${tc.primary}30` }}
          >
            <Download className="w-4 h-4" />
            {isFilterActive
              ? `${t('exportFiltered', lang)} (${filteredLessons.length})`
              : t('exportLevel', lang)}
          </button>
        </div>
      )}

      {/* Play by Filter Button */}
      {unlocked && playerVideos.length > 0 && (
        <div className="mx-4 mt-3">
          <button
            onClick={() => handlePlayPlaylist(0)}
            className="w-full py-3 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
            style={{ background: `linear-gradient(135deg, ${tc.primaryDark}, ${tc.primary})` }}
          >
            <Play className="w-4 h-4 fill-current animate-pulse" />
            {isFilterActive
              ? `${lang === 'ar' ? 'تشغيل حسب الفلتر المختار' : 'Play by Selected Filter'} (${playerVideos.length})`
              : (lang === 'ar' ? 'تشغيل الكل بالتسلسل' : 'Play All in Sequence')
            }
          </button>
        </div>
      )}

      {/* Lesson Cards */}
      <div className="p-4 space-y-4">
        {!unlocked ? (
          <div className="text-center py-8">
            <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">{t('levelLocked', lang)}</p>
          </div>
        ) : filteredLessons.length === 0 ? (
          <div className="text-center py-12">
            <Filter className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground font-medium">
              {lang === 'ar' ? 'لا توجد دروس تطابق الفلتر' : 'No lessons match the filter'}
            </p>
            <button
              onClick={handleClearFilters}
              className="mt-3 text-sm font-medium hover:underline"
              style={{ color: tc.primary }}
            >
              {t('clearFilter', lang)}
            </button>
          </div>
        ) : (
          filteredLessons.map((lesson, idx) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              unlocked={isLessonUnlocked(course, level.id, lesson.order)}
              primaryColor={tc.primary}
              primaryDark={tc.primaryDark}
              lang={lang}
              courseId={course.id}
              levelId={level.id}
              onOpenVideoPlayer={() => handleLessonOpen(lesson, idx)}
            />
          ))
        )}
      </div>

      {/* Edit Level Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditModalOpen(false)} />
          <div className="relative w-full max-w-sm mx-4 bg-background rounded-2xl p-5 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base">{t('editLevel', lang)}</h3>
              <button onClick={() => setEditModalOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-accent">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">{lang === 'ar' ? 'اسم المستوى' : 'Level Name'}</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-11 rounded-xl border bg-background px-4 text-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': tc.primary } as React.CSSProperties}
                />
              </div>
              <button
                onClick={handleSaveEdit}
                className="w-full py-3 rounded-xl text-white text-sm font-bold transition-transform active:scale-95 shadow-md"
                style={{ backgroundColor: tc.primary }}
              >
                {t('save', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Playlist Player Overlay */}
      {showPlaylistPlayer && playerVideos.length > 0 && (
        <YouTubePlaylistPlayer
          videos={playerVideos}
          playlist={{
            id: level.id,
            title: level.name,
            thumbnail: level.lessons.find((l) => l.thumbnail)?.thumbnail || '',
            channelTitle: course.name,
          }}
          startIndex={playerStartIndex}
          onClose={() => setShowPlaylistPlayer(false)}
          onCompleteLesson={handleCompleteLesson}
        />
      )}
    </div>
  );
}

// ============ LARGE LESSON CARD ==============================================
function LessonCard({
  lesson,
  unlocked,
  primaryColor,
  primaryDark,
  lang,
  courseId,
  levelId,
  onOpenVideoPlayer,
}: {
  lesson: Lesson;
  unlocked: boolean;
  primaryColor: string;
  primaryDark: string;
  lang: 'ar' | 'en';
  courseId: string;
  levelId: string;
  onOpenVideoPlayer: (lesson: Lesson, courseId: string, levelId: string) => void;
}) {
  const handleOpenLesson = () => {
    if (!unlocked) return;
    onOpenVideoPlayer(lesson, courseId, levelId);
  };

  return (
    <div
      className={`rounded-2xl border overflow-hidden transition-all shadow-sm ${
        lesson.completed
          ? 'bg-gradient-to-br from-green-50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/10 border-green-200 dark:border-green-900/50'
          : unlocked
            ? 'bg-card hover:shadow-lg border-border'
            : 'bg-muted/20 opacity-50 border-muted'
      }`}
    >
      {/* Top accent */}
      {unlocked && !lesson.completed && (
        <div
          className="h-1"
          style={{ background: `linear-gradient(90deg, ${primaryDark}, ${primaryColor})` }}
        />
      )}
      {lesson.completed && (
        <div className="h-1 bg-gradient-to-r from-green-500 to-emerald-400" />
      )}

      <div className="p-5">
        {/* Lesson number badge + status */}
        <div className="flex items-start gap-3 mb-3">
          {/* Number badge */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm"
            style={{
              backgroundColor: lesson.completed ? '#22c55e' : unlocked ? primaryColor : 'var(--muted)',
            }}
          >
            {lesson.completed ? <CheckCircle2 className="w-5 h-5" /> : unlocked ? lesson.order + 1 : <Lock className="w-4 h-4 text-white/60" />}
          </div>

          <div className="flex-1 min-w-0">
            <p className={`font-bold text-base leading-tight ${lesson.completed ? 'line-through text-muted-foreground' : ''}`}>
              {lesson.name}
            </p>
            <div className="flex items-center gap-3 mt-1.5">
              {lesson.duration && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  {lesson.duration}
                </span>
              )}
              {lesson.completed && (
                <span className="text-xs font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {t('completed', lang)}
                </span>
              )}
              {!unlocked && (
                <span className="text-xs text-destructive flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  {t('locked', lang)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Open Lesson Button - WIDE and PROMINENT */}
        {unlocked && (
          <button
            onClick={handleOpenLesson}
            className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-md ${
              lesson.completed
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'text-white'
            }`}
            style={!lesson.completed ? { background: `linear-gradient(135deg, ${primaryDark}, ${primaryColor})` } : {}}
          >
            {lesson.completed ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                {lang === 'ar' ? 'إعادة مشاهدة الدرس' : 'Re-watch Lesson'}
              </>
            ) : (
              <>{t('openLesson', lang)}</>
            )}
          </button>
        )}

        {/* Locked overlay message */}
        {!unlocked && (
          <div className="w-full py-3.5 rounded-xl bg-muted/30 text-center">
            <p className="text-xs text-muted-foreground">{t('lessonLocked', lang)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
