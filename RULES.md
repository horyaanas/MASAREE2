# قواعد المشروع — مساري
# Project Rules — Masari

## 🏗️ هيكل الكود / Code Structure

### المجلدات الرئيسية
- `src/app/` — Next.js App Router: الصفحات وAPI Routes
- `src/components/app/` — مكونات التطبيق الرئيسية
- `src/components/ui/` — مكتبة shadcn/ui (لا تُعدَّل يدوياً)
- `src/lib/` — المنطق الأساسي: قاعدة البيانات، الترجمة، الحالة
- `public/` — الملفات العامة: PWA manifest، Service Worker، الأيقونات

---

## 📝 قواعد الكود / Coding Rules

### TypeScript
- استخدم TypeScript بشكل صارم — لا `any` إلا عند الضرورة القصوى
- صرِّح دائماً عن أنواع props المكونات
- استخدم `interface` للكائنات المشتركة و`type` للأنواع المعقدة

### المكونات
- كل مكون في ملف منفصل داخل `src/components/app/`
- استخدم `'use client'` للمكونات التفاعلية
- ضع المنطق المشترك في hooks مخصصة داخل `src/hooks/`
- لا تستورد مكونات `ui/` مباشرة في الصفحات — استخدم مكونات `app/` كوسيط

### التسمية
- **الملفات**: kebab-case: `course-details.tsx`
- **المكونات**: PascalCase: `CourseDetails`
- **الدوال والمتغيرات**: camelCase: `handleDelete`
- **الثوابت**: SCREAMING_SNAKE_CASE: `MAX_COURSES`
- **الأنواع والواجهات**: PascalCase: `CourseState`

### الترجمة (i18n)
- **لا تضع نصوصاً عربية أو إنجليزية مباشرة في المكونات**
- استخدم دائماً `t('key', language)` من `src/lib/i18n.ts`
- أضف كل مفتاح جديد في كلا اللغتين (AR/EN) في `i18n.ts`
- المفاتيح: camelCase، وصفية، مجمَّعة بتعليقات (e.g. `// YouTube Import`)

### قاعدة البيانات (IndexedDB)
- جميع عمليات القراءة/الكتابة تمر عبر `src/lib/db-indexeddb.ts`
- لا تتعامل مع IndexedDB مباشرة من المكونات
- أضف دوال جديدة في الملف المذكور واستوردها حيث تحتاج

### الحالة العامة (Zustand Store)
- الحالة العامة فقط في `src/lib/store.ts`
- الحالة المحلية (useState) للمكونات الفردية — لا تضع كل شيء في Store
- لا تستدعِ `useAppStore.getState()` إلا خارج React (مثل effects)

---

## 🎨 قواعد التصميم / Design Rules

### Tailwind CSS
- استخدم Tailwind 4 — لا utility classes خارج نطاقه
- الألوان الديناميكية تُطبَّق عبر CSS variables (`--theme-primary` إلخ)
- لا تستخدم inline styles إلا للمتغيرات الديناميكية
- اتجاه RTL: استخدم `start/end` بدلاً من `left/right`

### الأنماط المعتمدة
```css
/* RTL-safe - CORRECT */
ms-2 me-4 ps-3 pe-6

/* RTL-unsafe - WRONG */
ml-2 mr-4 pl-3 pr-6
```

### shadcn/ui
- استخدم مكونات shadcn/ui من `src/components/ui/`
- لا تعدِّل ملفات `ui/` يدوياً — استخدم `npx shadcn-ui@latest add <component>`
- التخصيص يتم عبر `className` props فقط

---

## 🌐 قواعد API / API Rules

### Server-side API Routes
- جميع API routes في `src/app/api/`
- استخدم `NextResponse` لإعادة الردود
- تحقق دائماً من المعاملات (params) قبل المعالجة
- أعِد رمز HTTP صحيح: 200, 400, 404, 500

### YouTube API
- مفتاح API يُقرأ من: `process.env.YOUTUBE_API_KEY` أولاً، ثم من `apiKey` query param
- لا تُعيد مفتاح API في الردود
- تعامل مع حدود الـ quota (429) بشكل صحيح

---

## 📱 قواعد PWA / PWA Rules

### Service Worker
- ملف SW في `public/sw.js` — لا تعدِّله مباشرة (مولَّد)
- يتم تسجيله في `src/app/page.tsx` في `useEffect`

### الأيقونات
- يجب أن تكون جميع أحجام الأيقونات موجودة في `public/icons/`
- الأحجام المطلوبة: 72, 96, 128, 144, 152, 192, 384, 512

### Manifest
- يُحدَّث `public/manifest.json` عند تغيير اسم التطبيق أو الألوان فقط
- `theme_color` و`background_color` يجب أن يتطابقا مع قيم CSS

---

## 🔒 قواعد الأمان / Security Rules

- **لا تُخزِّن بيانات حساسة في IndexedDB** (مفاتيح API تُشفَّر أو تُخزَّن بحذر)
- **لا تُلجِئ نتائج API مباشرة** — تحقق وفلتر دائماً
- **لا تثق بـ user input** — تحقق على الخادم وعلى العميل
- **متغيرات البيئة**: لا تضع أي سر في الكود — استخدم `.env` دائماً
- **`.env` لا يُرفع إلى Git** — تأكد أنه في `.gitignore`

---

## 🧪 قواعد الجودة / Quality Rules

### قبل كل Commit
- [ ] `bun run lint` — لا أخطاء ESLint
- [ ] البناء يعمل: `bun run build`
- [ ] لا `console.log` في كود الإنتاج
- [ ] جميع مفاتيح الترجمة الجديدة موجودة في AR وEN

### التعليقات
- علِّق على المنطق المعقد فقط
- تعليقات كود الإنتاج بالإنجليزية (للتوافقية)
- وثِّق الدوال العامة في `lib/`

---

## 🚀 سير العمل / Workflow

### إضافة ميزة جديدة
1. أضف مفاتيح الترجمة في `src/lib/i18n.ts` (AR + EN)
2. إن احتجت حالة عامة، أضفها في `src/lib/store.ts`
3. إن احتجت تخزيناً، أضف الدوال في `src/lib/db-indexeddb.ts`
4. أنشئ المكوِّن في `src/components/app/`
5. سجِّل المكوِّن في `src/app/page.tsx` أو الـ shell المناسب
6. اختبر: RTL + LTR، الوضع الليلي والنهاري، الأحجام المختلفة

### إضافة مكوِّن shadcn/ui جديد
```bash
npx shadcn-ui@latest add <component-name>
```
