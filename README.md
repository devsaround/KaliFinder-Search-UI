# KaliFinder Search UI

> **Embeddable AI-powered search widget for e-commerce**

[![React](https://img.shields.io/badge/react-19.2-blue)]() [![TypeScript](https://img.shields.io/badge/typescript-5.9-blue)]() [![Vite](https://img.shields.io/badge/vite-7.1-646CFF)]() [![Tailwind](https://img.shields.io/badge/tailwind-4.0-38B2AC)]()

Lightweight, fast, and fully isolated search widget that integrates seamlessly into any e-commerce website using Shadow DOM.

---

## 🚀 Quick Start

### CDN Installation

```html
<script
  src="https://cdn.kalifinder.com/kalifind-search.js?storeUrl=https://your-store.com"
  defer
></script>
```

Widget auto-injects search button → Click → Instant search with filters & cart integration

---

## 💻 Development

### Prerequisites

```bash
node >= 20
pnpm >= 10.19.0
```

### Setup

```bash
git clone https://github.com/devsaround/KaliFinder-Search-UI.git
cd KaliFinder-Search-UI
pnpm install
pnpm dev  # http://localhost:8080
```

### Commands

| Command             | Description            |
| ------------------- | ---------------------- |
| `pnpm dev`          | Dev server with HMR    |
| `pnpm build`        | Production build       |
| `pnpm build:dev`    | Dev build (unminified) |
| `pnpm test:cdn`     | Build + test locally   |
| `pnpm type-check`   | TypeScript checking    |
| `pnpm lint`         | ESLint                 |
| `pnpm format`       | Prettier               |
| `pnpm check:strict` | All checks + build     |

---

## 🌍 Environment

### ⚠️ Critical: Backend URL

`VITE_BACKEND_URL` should **NOT** include `/api` suffix:

```bash
# ✅ CORRECT
VITE_BACKEND_URL=https://api.kalifinder.com

# ❌ WRONG (creates /api/api/v1/...)
VITE_BACKEND_URL=https://api.kalifinder.com/api
```

**Why?** Endpoints already have full paths (`/api/v1/search/search`, not `/search`)

### Files

```bash
# .env.development
NODE_ENV=development
VITE_BACKEND_URL=https://api.kalifinder.com

# .env.production
NODE_ENV=production
VITE_BACKEND_URL=https://api.kalifinder.com
VITE_WIDGET_CDN_URL=https://cdn.kalifinder.com/kalifind-search.js
```

---

## 🔌 API

**Base:** https://api.kalifinder.com  
**Docs:** https://api.kalifinder.com/api-docs  
**Health:** https://api.kalifinder.com/health

### Endpoints

```
GET /api/v1/search/search?storeUrl={url}&q={query}
GET /api/v1/search/autocomplete?storeUrl={url}&q={query}
GET /api/v1/search/recommended?storeUrl={url}
GET /api/v1/facets/configured?storeUrl={url}
GET /api/v1/search/popular?storeUrl={url}
```

---

## 📂 Structure

```
src/
├── components/       # React components
├── hooks/            # useSearch, useFilters, useAutocomplete
├── stores/           # Zustand (search, filter, UI state)
├── services/         # API client & endpoints
├── analytics/        # UBI tracking
├── index.css         # Tailwind (single source)
├── main.tsx          # Dev entry
└── embed-search.tsx  # Production (Shadow DOM)
```

---

## 🧪 Testing

```bash
pnpm test:cdn
# Opens test-cdn.html → Click purple icon → Test search
```

**Different stores:** Edit `test-cdn.html` → Change `storeUrl` parameter

---

## 📦 Build

```bash
pnpm build
# Output: dist/kalifind-search.js (~465 KB)
```

### AWS Deployment

`buildspec.yml` → CodeBuild → S3 + CloudFront

**Required env vars:**

- `S3_BUCKET`
- `CLOUDFRONT_ID`

---

## 🚨 Troubleshooting

### Widget Not Loading

1. Verify script: `https://cdn.kalifinder.com/kalifind-search.js`
2. Check `storeUrl` parameter
3. Browser console for errors

### Blank Mod├── API: `curl https://api.kalifinder.com/health`

- Check `VITE_BACKEND_URL` (no `/api` suffix)
- Network tab → Verify endpoints

### 404 Errors

Endpoints must use `/api/v1/search/search` (not `/api/v1/search`)

---

## 📊 Performance

- Bundle: ~465 KB (gzipped: ~120 KB)
- First paint: < 500ms
- Supports 10,000+ products (virtualized)
- Zero host page impact

---

## 🤝 Contributing

```bash
pnpm check:strict  # Before PR
pnpm test:cdn
```

**Standards:**

- TypeScript strict
- Prettier (100 char, single quotes)
- Conventional commits

---

## 📝 Changelog

### v1.0.0 (Oct 29, 2025)

✅ Fixed API endpoint paths  
✅ Fixed environment config (removed `/api` suffix)  
✅ Updated autocomplete & facets endpoints

**Updated endpoints:**

- `/api/v1/search` → `/api/v1/search/search`
- `/v1/autocomplete` → `/api/v1/search/autocomplete`
- `/v1/facets` → `/api/v1/facets/configured`

---

**API Docs:** https://api.kalifinder.com/api-docs  
**Support:** support@kalifinder.com  
**Built with ❤️ by KaliFinder Team**
