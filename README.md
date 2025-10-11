# KaliFinder Search UI

> **Embeddable search widget for intelligent e-commerce product discovery**

[![Status](https://img.shields.io/badge/status-production-brightgreen)]()
[![React](https://img.shields.io/badge/react-18.3%2B-blue)]()
[![TypeScript](https://img.shields.io/badge/typescript-5.0%2B-blue)]()
[![Shadow DOM](https://img.shields.io/badge/Shadow%20DOM-isolated-purple)]()

---

## 🚀 Overview

KaliFinder Search UI is a lightweight, embeddable search widget that provides intelligent product search experiences for e-commerce websites. Built with React and Shadow DOM isolation, it integrates seamlessly into any website without style conflicts.

### Key Features

- 🔍 **Instant Search** - Real-time product search as you type
- ⚡ **Smart Autocomplete** - Context-aware suggestions with images
- 🎯 **Faceted Filters** - Category, price, brand filtering
- 📱 **Mobile Responsive** - Perfect experience on all devices
- 🎨 **Style Isolation** - Shadow DOM prevents CSS conflicts
- 🚀 **Lightning Fast** - Optimized bundle size < 100KB
- 📊 **Analytics Built-in** - User behavior tracking (UBI)
- 🌐 **Universal** - Works with any e-commerce platform

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│          E-commerce Website (Any Platform)           │
│                                                       │
│  <script src="kalifinder-search.js"></script>       │
│  <div id="kalifinder-search"></div>                 │
│                                                       │
│  ┌────────────────────────────────────────────┐    │
│  │        Shadow DOM (Style Isolated)          │    │
│  │  ┌──────────────┐  ┌───────────────────┐   │    │
│  │  │   Search     │  │   Autocomplete    │   │    │
│  │  │    Input     │  │    Dropdown       │   │    │
│  │  └──────────────┘  └───────────────────┘   │    │
│  │  ┌──────────────┐  ┌───────────────────┐   │    │
│  │  │   Filters    │  │   Product Grid    │   │    │
│  │  │   Sidebar    │  │     Results       │   │    │
│  │  └──────────────┘  └───────────────────┘   │    │
│  └────────────────────────────────────────────┘    │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │   Backend REST API     │
        │   (KaliFinder-Backend) │
        └────────────────────────┘
```

### Tech Stack

**Core**:

- React 18.3 - UI library
- TypeScript 5+ - Type safety
- Vite 5 - Build tool
- Bun - Fast package manager

**UI & Styling**:

- TailwindCSS - Utility-first CSS
- Shadcn/ui - Component library
- Radix UI - Accessible primitives
- Shadow DOM - Style isolation

**State Management**:

- Zustand - Lightweight state
- React Query - Server state

**Analytics**:

- UBI Client - User behavior tracking
- Custom events - Search, clicks, conversions

---

## 📦 Installation

### Prerequisites

- Bun runtime (or Node.js 18+)
- Backend API running (KaliFinder-Backend)

### Quick Start

```bash
# Clone repository
git clone https://github.com/devsaround/KaliFinder-Search-UI.git
cd KaliFinder-Search-UI

# Install dependencies
bun install

# Setup environment
cp .env.example .env
# Edit .env with your API URL

# Start development server
bun dev
```

Widget will be available at `http://localhost:5174`

---

## ⚙️ Environment Configuration

Create `.env` file from `.env.example`:

```env
# Backend API URL
VITE_BACKEND_URL=http://localhost:8000/api
```

For production, use `.env.production` with your production API URL.

---

## 🛠️ Development

### Available Scripts

```bash
# Start development server
bun dev

# Build for production
bun run build

# Preview production build
bun run preview

# Lint code
bun run lint

# Format code
bun run format

# Type check
bun run type-check
```

### Project Structure

```
KaliFinder-Search-UI/
├── src/
│   ├── components/              # React components
│   │   ├── ui/                  # Shadcn/ui components
│   │   ├── KalifindSearch.tsx   # Main search component
│   │   ├── SearchIcon.tsx       # Search icon/trigger
│   │   ├── Recommendations.tsx  # Product recommendations
│   │   └── ShadowDOMWrapper.tsx # Shadow DOM wrapper
│   ├── services/                # API services
│   │   └── api.service.ts       # Search API calls
│   ├── analytics/               # UBI analytics
│   │   └── ubiClient.ts         # Analytics client
│   ├── hooks/                   # Custom hooks
│   ├── lib/                     # Utilities
│   │   ├── styleIsolation.ts    # Shadow DOM styles
│   │   └── cssOverride.ts       # CSS injection
│   ├── types/                   # TypeScript types
│   ├── embed-search.tsx         # Embeddable entry point
│   └── main.tsx                 # Standalone entry point
├── public/                      # Static assets
├── index.html                   # Development HTML
└── vite.config.ts               # Vite configuration
```

---

## 🔌 Integration

### Embed in Website

Add this to your website's HTML:

```html
<!-- Step 1: Add container -->
<div id="kalifinder-search"></div>

<!-- Step 2: Load script -->
<script src="https://cdn.kalifinder.com/search-widget.js"></script>

<!-- Step 3: Initialize -->
<script>
  KalifinderSearch.init({
    containerId: 'kalifinder-search',
    apiUrl: 'https://api.kalifinder.com/api',
    vendorId: 'your-vendor-id',
    theme: 'light', // or 'dark'
    language: 'en',
  });
</script>
```

### Configuration Options

```typescript
interface KalifinderConfig {
  containerId: string; // Container element ID
  apiUrl: string; // Backend API URL
  vendorId: string; // Your vendor ID
  theme?: 'light' | 'dark'; // Theme mode
  language?: string; // UI language (en, es, fr, etc.)
  placeholder?: string; // Search input placeholder
  showRecommendations?: boolean; // Show product recommendations
  maxResults?: number; // Max search results (default: 20)
  enableAnalytics?: boolean; // Enable UBI tracking (default: true)
  customStyles?: CSSProperties; // Custom CSS overrides
}
```

### WordPress Integration

```html
<!-- Add to theme's header.php or footer.php -->
<div id="kalifinder-search"></div>
<script src="https://cdn.kalifinder.com/search-widget.js"></script>
<script>
  KalifinderSearch.init({
    containerId: 'kalifinder-search',
    apiUrl: '<?php echo get_option('kalifinder_api_url'); ?>',
    vendorId: '<?php echo get_option('kalifinder_vendor_id'); ?>',
  });
</script>
```

### Shopify Integration

```liquid
<!-- Add to theme.liquid -->
<div id="kalifinder-search"></div>
<script src="https://cdn.kalifinder.com/search-widget.js"></script>
<script>
  KalifinderSearch.init({
    containerId: 'kalifinder-search',
    apiUrl: '{{ settings.kalifinder_api_url }}',
    vendorId: '{{ settings.kalifinder_vendor_id }}',
  });
</script>
```

---

## 🎨 Customization

### Styling

The widget uses Shadow DOM for style isolation. Customize via config:

```javascript
KalifinderSearch.init({
  // ... other config
  customStyles: {
    primaryColor: '#FF6B6B',
    borderRadius: '8px',
    fontFamily: 'Inter, sans-serif',
  },
});
```

### Theme

Switch between light and dark themes:

```javascript
KalifinderSearch.setTheme('dark'); // or 'light'
```

### Language

Change UI language dynamically:

```javascript
KalifinderSearch.setLanguage('es'); // Spanish
```

---

## 📊 Analytics

The widget tracks user behavior automatically:

### Tracked Events

- **Search Queries** - What users search for
- **Product Clicks** - Which products users click
- **Filter Usage** - How users refine results
- **Conversions** - Add to cart, purchases

### Disable Analytics

```javascript
KalifinderSearch.init({
  // ... other config
  enableAnalytics: false,
});
```

### Custom Events

Track custom events:

```javascript
KalifinderSearch.trackEvent('custom_event', {
  eventType: 'button_click',
  data: { buttonId: 'buy-now' },
});
```

---

## 🚀 Deployment

### Build for Production

```bash
# Create optimized production build
bun run build

# Output: dist/kalifinder-search.js (~80KB gzipped)
```

### Deploy to CDN

1. Build production bundle: `bun run build`
2. Upload `dist/kalifinder-search.js` to CDN
3. Use CDN URL in integration code

### Deploy to AWS

```bash
# Upload to S3
aws s3 cp dist/kalifinder-search.js s3://your-bucket/search-widget.js

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/search-widget.js"
```

---

## 🎯 Performance

- **Bundle Size**: < 100KB (gzipped)
- **First Paint**: < 500ms
- **Search Latency**: < 100ms
- **Memory**: < 10MB

### Optimization Features

- Code splitting
- Lazy loading for images
- Debounced search input
- Virtual scrolling for large lists
- Shadow DOM isolation
- Tree shaking

---

## 🔧 Troubleshooting

### Common Issues

**Widget Not Showing**

```javascript
// Check container exists
console.log(document.getElementById('kalifinder-search'));

// Check script loaded
console.log(window.KalifinderSearch);
```

**API Connection Error**

```javascript
// Check API URL is correct
// Verify CORS is configured
// Check network tab in DevTools
```

**Style Conflicts**

```javascript
// Widget uses Shadow DOM for isolation
// If styles leak, check Shadow DOM boundary
```

---

## 📱 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari 14+ (Shadow DOM supported)
- Mobile browsers (iOS Safari 14+, Chrome Mobile)

---

## 📝 License

Proprietary - All rights reserved by devsaround

---

## 🤝 Contributing

This is a private repository. For internal development:

1. Create feature branch from `main`
2. Follow React best practices
3. Test on multiple browsers
4. Update documentation
5. Submit PR for review

---

## 📞 Support

For issues or questions:

- **GitHub Issues**: [Create an issue](https://github.com/devsaround/KaliFinder-Search-UI/issues)
- **Email**: support@kalifinder.com
- **Documentation**: See integration examples above

---

## 🔗 Related Projects

- [KaliFinder-Backend](https://github.com/devsaround/KaliFinder-Backend) - REST API
- [KaliFinder-Frontend](https://github.com/devsaround/KaliFinder-Frontend) - Admin Dashboard

---

**Built with ❤️ by the devsaround team**
