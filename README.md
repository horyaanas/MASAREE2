# مساري — تطبيق إدارة الدورات التدريبية
> **Masari** – Progressive Web App for managing and tracking training courses  
> يعمل بالكامل بدون إنترنت · Fully offline-capable

---

## 📖 نظرة عامة / Overview

**مساري** هو تطبيق PWA (Progressive Web App) يُتيح للمستخدمين:
- 📚 إدارة دوراتهم التدريبية وتتبع تقدمهم
- 📥 استيراد الدورات من ملفات Excel أو قوائم تشغيل YouTube
- 🎬 تشغيل الفيديوهات وتسجيل الإنجاز تلقائياً
- 🔔 ضبط تذكيرات يومية للدراسة
- 🌙 دعم الوضع الليلي وتخصيص الألوان والخطوط
- 🌍 واجهة ثنائية اللغة (العربية / الإنجليزية) مع دعم RTL

---

## 🏗️ هيكل المشروع / Project Structure

```
masari/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── route.ts              # Health check endpoint
│   │   │   └── youtube/
│   │   │       └── playlist/
│   │   │           └── route.ts      # YouTube Data API proxy
│   │   ├── globals.css               # Global styles + CSS variables
│   │   ├── layout.tsx                # Root layout (PWA metadata, fonts)
│   │   └── page.tsx                  # Main app entry point
│   ├── components/
│   │   ├── app/
│   │   │   ├── app-shell.tsx         # Navigation shell (bottom nav)
│   │   │   ├── dashboard.tsx         # Home/dashboard view
│   │   │   ├── courses-list.tsx      # Courses list view
│   │   │   ├── course-details.tsx    # Course & level detail views
│   │   │   ├── import-modal.tsx      # Excel import wizard
│   │   │   ├── youtube-import.tsx    # YouTube playlist import wizard
│   │   │   ├── youtube-playlist-player.tsx  # YouTube playlist player
│   │   │   ├── video-player.tsx      # Embedded video player
│   │   │   └── settings.tsx          # App settings
│   │   └── ui/                       # shadcn/ui component library
│   ├── hooks/                        # Custom React hooks
│   └── lib/
│       ├── db-indexeddb.ts           # IndexedDB (main data store)
│       ├── db.ts                     # Prisma client (server-side)
│       ├── excel.ts                  # Excel export utilities
│       ├── i18n.ts                   # Translations (AR/EN)
│       ├── store.ts                  # Zustand global state
│       ├── use-app-init.ts           # App initialization hook
│       └── utils.ts                  # Utility helpers
├── prisma/
│   └── schema.prisma                 # Database schema (SQLite)
├── public/
│   ├── manifest.json                 # PWA manifest
│   ├── sw.js                         # Service Worker
│   ├── robots.txt                    # SEO robots file
│   ├── logo.svg                      # App logo
│   └── icons/                        # PWA icons (72–512px)
├── db/                               # SQLite database files
├── .env                              # Environment variables (not committed)
├── .env.example                      # Environment variables template
├── next.config.ts                    # Next.js configuration
├── tailwind.config.ts                # Tailwind CSS configuration
├── components.json                   # shadcn/ui configuration
├── tsconfig.json                     # TypeScript configuration
├── eslint.config.mjs                 # ESLint configuration
└── Caddyfile                         # Caddy reverse proxy config
```

---

## ⚙️ متطلبات التشغيل / Prerequisites

| الأداة | الإصدار المطلوب |
|--------|----------------|
| [Bun](https://bun.sh) | `>= 1.3` |
| [Node.js](https://nodejs.org) | `>= 20` |

> يُستخدم **Bun** كـ package manager وكـ runtime للإنتاج.

---

## 🚀 البدء السريع / Quick Start

### 1. نسخ الإعدادات البيئية
```bash
copy .env.example .env
```

### 2. تعديل `.env`
```env
DATABASE_URL=file:./db/masari.db
# اختياري: مفتاح YouTube API
# YOUTUBE_API_KEY=AIzaSy...
```

### 3. تثبيت الاعتمادات
```bash
bun install
```

### 4. إنشاء قاعدة البيانات (Prisma - server-side فقط)
```bash
bun run db:push
```
> ملاحظة: البيانات الرئيسية للتطبيق تُخزَّن في **IndexedDB** في المتصفح (لا تحتاج إعداداً).

### 5. تشغيل بيئة التطوير
```bash
bun run dev
```
افتح المتصفح على: **http://localhost:3000**

---

## 📦 أوامر المشروع / Scripts

| الأمر | الوصف |
|-------|--------|
| `bun run dev` | تشغيل خادم التطوير على المنفذ 3000 |
| `bun run build` | بناء نسخة الإنتاج (standalone) |
| `bun run start` | تشغيل نسخة الإنتاج |
| `bun run lint` | فحص الكود بـ ESLint |
| `bun run db:push` | رفع schema Prisma إلى قاعدة البيانات |
| `bun run db:generate` | إعادة توليد Prisma Client |
| `bun run db:migrate` | تشغيل migrations |
| `bun run db:reset` | إعادة ضبط قاعدة البيانات |

---

## 🗄️ قاعدة البيانات / Database

### IndexedDB (Client-side) — المخزن الرئيسي
التطبيق يعتمد على **IndexedDB** عبر مكتبة `idb` لتخزين:
- **`courses`** — الدورات التدريبية مع مستوياتها ودروسها
- **`progress`** — تقدم الإنجاز لكل دورة
- **`settings`** — إعدادات المستخدم (اللغة، الثيم، إلخ)

### SQLite via Prisma (Server-side)
يستخدمه الـ API Routes فقط للبيانات الخادمية. الـ Schema الحالي يحتوي على:
- **`User`** — مستخدمون (غير مستخدم حالياً في الواجهة)
- **`Post`** — منشورات (placeholder)

---

## 🔑 متغيرات البيئة / Environment Variables

| المتغير | مطلوب | الوصف |
|---------|--------|--------|
| `DATABASE_URL` | ✅ | مسار قاعدة بيانات SQLite |
| `YOUTUBE_API_KEY` | ❌ | مفتاح YouTube Data API v3 (يمكن تعيينه من الإعدادات أيضاً) |
| `NODE_ENV` | ❌ | بيئة التشغيل: `development` أو `production` |

---

## 🎨 ميزات التخصيص / Customization

- **6 ألوان للثيم**: Emerald · Teal · Cyan · Amber · Rose · Violet
- **3 أحجام للخط**: صغير (14px) · متوسط (16px) · كبير (18px)
- **الوضع الليلي/النهاري**: مدعوم بالكامل
- **اللغة**: العربية (RTL) · الإنجليزية (LTR)

---

## 🌐 API Endpoints

### `GET /api` — Health Check
يعيد حالة الخادم.

### `GET /api/youtube/playlist`
جلب بيانات قائمة تشغيل YouTube.

**Query Parameters:**
| المعامل | مطلوب | الوصف |
|---------|--------|--------|
| `playlistId` | ✅ | معرف قائمة التشغيل |
| `apiKey` | ❌ | مفتاح API (يُستخدم `YOUTUBE_API_KEY` من `.env` إذا لم يُمرَّر) |

---

## 📱 PWA — التثبيت كتطبيق

التطبيق قابل للتثبيت على:
- **Android**: Chrome → "إضافة إلى الشاشة الرئيسية"
- **iOS**: Safari → مشاركة → "إضافة إلى الشاشة الرئيسية"
- **Desktop**: Chrome/Edge → أيقونة التثبيت في شريط العنوان

يعمل بالكامل **بدون إنترنت** بعد التثبيت الأول (Service Worker).

---

## 🛠️ التقنيات المستخدمة / Tech Stack

| التقنية | الغرض |
|---------|--------|
| [Next.js 16](https://nextjs.org) | إطار العمل الرئيسي (App Router) |
| [React 19](https://react.dev) | واجهة المستخدم |
| [TypeScript 5](https://typescriptlang.org) | الكتابة الصارمة |
| [Tailwind CSS 4](https://tailwindcss.com) | التنسيق |
| [shadcn/ui](https://ui.shadcn.com) | مكتبة المكونات |
| [Zustand 5](https://zustand.docs.pmnd.rs) | إدارة الحالة |
| [IndexedDB (idb)](https://github.com/jakearchibald/idb) | قاعدة البيانات المحلية |
| [Prisma 6](https://prisma.io) | ORM لقاعدة البيانات الخادمية |
| [Framer Motion](https://framer.com/motion) | الحركات والانتقالات |
| [TanStack Query 5](https://tanstack.com/query) | إدارة البيانات |
| [React Hook Form](https://react-hook-form.com) | إدارة النماذج |
| [Zod 4](https://zod.dev) | التحقق من البيانات |
| [xlsx](https://sheetjs.com) | قراءة/كتابة ملفات Excel |
| [date-fns 4](https://date-fns.org) | معالجة التواريخ |
| [Bun](https://bun.sh) | Package manager + Runtime |

---

## 🚢 النشر / Deployment

### الإنتاج (Standalone)
```bash
bun run build
bun run start
```

### مع Caddy (Reverse Proxy)
الملف `Caddyfile` جاهز للنشر على المنفذ 81، يوجّه الطلبات إلى Next.js على المنفذ 3000.

```bash
caddy run --config Caddyfile
```

---

## 📝 سجل التغييرات / Changelog

### v0.2.0
- ✅ استيراد قوائم تشغيل YouTube (3 خطوات)
- ✅ تصفية الفيديوهات حسب المدة والتاريخ
- ✅ ترتيب الفيديوهات بأكثر من 7 طرق
- ✅ تصدير إلى Excel (كل الفيديوهات أو المُصفّاة)
- ✅ مشغل قوائم التشغيل مع التحكم الكامل

### v0.1.0
- ✅ الإطار الأساسي للتطبيق PWA
- ✅ استيراد الدورات من Excel
- ✅ تتبع التقدم بـ IndexedDB
- ✅ مشغل فيديو مع تسجيل الإنجاز
- ✅ تذكيرات يومية بالإشعارات
- ✅ دعم ثنائي اللغة (AR/EN)

---

## 📄 الترخيص / License

هذا المشروع خاص. جميع الحقوق محفوظة.
