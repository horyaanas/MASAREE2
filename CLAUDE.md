# Masari — AI Agent Rules & Project Context

## Project Overview
**Masari** (مساري) is an Arabic-first PWA (Progressive Web App) for managing training courses and tracking learning progress. It works fully offline using IndexedDB as the primary data store.

## Tech Stack
- **Framework**: Next.js 16 (App Router), React 19, TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui components
- **State**: Zustand 5
- **Database (client)**: IndexedDB via `idb` library
- **Database (server)**: SQLite via Prisma 6
- **Package Manager**: Bun 1.3+
- **PWA**: Service Worker + Web App Manifest
- **i18n**: Custom dual-language (Arabic RTL + English LTR)

## Key Files to Know
- `src/lib/db-indexeddb.ts` — ALL client-side data operations (courses, progress, settings)
- `src/lib/store.ts` — Zustand global state (navigation, UI state, settings)
- `src/lib/i18n.ts` — ALL translations (add keys in BOTH ar and en)
- `src/app/page.tsx` — Main entry point, renders views based on `currentView` state
- `src/components/app/app-shell.tsx` — Navigation shell with bottom nav bar

## Critical Rules

### Language/i18n
- NEVER hardcode Arabic or English text in components
- ALWAYS use `t('key', language)` from `src/lib/i18n.ts`
- ALWAYS add new translation keys in BOTH `ar` and `en` objects in `i18n.ts`
- Translation keys: camelCase, grouped with section comments

### Data Layer
- ALL data operations go through `src/lib/db-indexeddb.ts`
- Do NOT access IndexedDB directly from components
- The Prisma/SQLite layer is for server-side API routes ONLY

### RTL/LTR Support
- Use Tailwind logical properties: `ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`
- NEVER use `ml-*`, `mr-*`, `pl-*`, `pr-*`, `left-*`, `right-*` for layout
- Direction is controlled by `document.documentElement.dir`

### Styling
- Dynamic theme colors applied via CSS variables: `--theme-primary`, `--theme-primary-light`, `--theme-primary-dark`
- Use `style={{ color: tc.primary }}` for dynamic color (not hardcoded Tailwind color classes)
- Dark mode applied via `.dark` class on `<html>`

### Components
- All app components in `src/components/app/`
- shadcn/ui components in `src/components/ui/` — do NOT edit these manually
- Client components need `'use client'` directive

### TypeScript
- Build has `ignoreBuildErrors: true` (Next.js config) — but still fix type errors
- Avoid `any` — use proper types from `db-indexeddb.ts` (Course, Level, Lesson, Progress)
- Do NOT add types from Prisma to client-side code

## Development Commands
```bash
bun run dev      # Dev server on port 3000
bun run build    # Production build
bun run lint     # ESLint check
bun run db:push  # Apply Prisma schema to SQLite
```

## Project Architecture Pattern
The app uses a **single-page shell** pattern:
1. `page.tsx` is the only page
2. `currentView` in Zustand determines what's shown
3. Views: `dashboard`, `courses`, `course-details`, `level-details`, `settings`
4. Modals are overlaid: `ImportModal`, `YouTubeImport`, `VideoPlayer`
5. Navigation via `setCurrentView()`, `selectCourse()`, `selectLevel()`, `goBack()`

## Environment Variables
- `DATABASE_URL` — SQLite path (required for server-side)
- `YOUTUBE_API_KEY` — YouTube Data API v3 key (optional, can be set in app settings)

## When Adding Features
1. Add translation keys in `i18n.ts` (both languages)
2. Add state in `store.ts` if globally needed
3. Add DB operations in `db-indexeddb.ts` if data persistence needed
4. Create component in `src/components/app/`
5. Register component in `page.tsx` or `app-shell.tsx`
6. Test: RTL (Arabic), LTR (English), dark mode, light mode
