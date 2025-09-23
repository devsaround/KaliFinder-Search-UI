# Search Insight UI - Embeddable Search Widget

A modern, responsive React-based search widget that can be embedded into any website. Built with TypeScript, Tailwind CSS, and designed for e-commerce search functionality.

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Embedding in Websites

```html
<!-- Include the search widget script -->
<script src="https://your-domain.com/kalifind-search.js?storeUrl=https://your-store.com"></script>
```

## 📁 Project Structure

```
src/
├── components/           # React components
│   ├── ui/              # Reusable UI components (Radix UI)
│   ├── KalifindSearch.tsx           # Main search component
│   ├── KalifindSearchDesktop.tsx    # Desktop layout
│   ├── KalifindSearchMobile.tsx     # Mobile/tablet layout
│   ├── ShadowDOMSearchDropdown.tsx  # Shadow DOM wrapper
│   ├── SearchIcon.tsx               # Search trigger icon
│   └── ScrollToTop.tsx              # Scroll to top button
├── hooks/               # Custom React hooks
│   ├── use-debounce.tsx # Debounce hook for search
│   └── zustand.tsx     # Global state management
├── lib/                 # Utility libraries
│   ├── cssOverride.ts   # CSS override utilities
│   ├── styleIsolation.ts # Style isolation helpers
│   └── utils.ts         # General utilities
├── pages/               # Page components
│   ├── Index.tsx        # Main page
│   └── NotFound.tsx     # 404 page
├── types/               # TypeScript type definitions
│   └── index.ts         # Core interfaces
├── utils/               # Utility functions
│   └── cart.ts          # Shopping cart utilities
├── embed-search.tsx     # Embeddable search entry point
├── App.tsx              # Main app component
└── main.tsx             # Application entry point
```

## 🎯 Key Features

### 🔍 Advanced Search

- **Real-time Autocomplete**: Debounced search suggestions as users type
- **Fuzzy Matching**: Intelligent search with fuzzy matching algorithms
- **Vector Search**: AI-powered semantic search capabilities
- **Search History**: Recent searches stored in localStorage

### 🎨 Responsive Design

- **Desktop Layout**: Full-featured search with sidebar filters
- **Mobile/Tablet Layout**: Optimized mobile experience with touch-friendly interface
- **Adaptive UI**: Automatically switches between layouts based on screen size

### 🛒 E-commerce Integration

- **Multi-Platform Support**: Works with Shopify and WooCommerce
- **Add to Cart**: Direct cart integration with error handling
- **Product Details**: Rich product information display
- **Price Display**: Regular and sale price handling

### 🎛️ Advanced Filtering

- **Categories**: Filter by product categories
- **Brands**: Filter by brand names
- **Colors**: Filter by product colors
- **Sizes**: Filter by product sizes
- **Price Range**: Slider-based price filtering
- **Stock Status**: In-stock/out-of-stock filtering
- **Featured Products**: Show only featured items
- **Sale Status**: Filter by products on sale

### 🎨 Style Isolation

- **Shadow DOM**: Complete CSS isolation from host website
- **No Conflicts**: Prevents style conflicts with existing websites
- **Customizable**: Easy theming with CSS variables
- **Responsive**: Works on any website layout

## 🔧 Configuration

### Environment Variables

```env
VITE_BACKEND_URL=http://localhost:8000/api
```

### Build Configuration

The project builds as a UMD module for easy embedding:

```javascript
// vite.config.ts
build: {
  lib: {
    entry: "src/embed-search.tsx",
    name: "KalifindSearch",
    formats: ["umd"],
    fileName: () => `kalifind-search.js`
  }
}
```

## 🎨 Styling System

### CSS Variables

The widget uses CSS custom properties for theming:

```css
:root {
  --primary: 264 83% 58%;
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --muted: 250 7% 97%;
  --border: 220 13% 91%;
  /* ... more variables */
}
```

### Tailwind CSS

- **Utility-First**: Rapid UI development with Tailwind classes
- **Custom Components**: Radix UI components with custom styling
- **Responsive**: Mobile-first responsive design
- **Dark Mode**: Built-in dark mode support

## 🔌 API Integration

### Search API

```typescript
// Search request
const searchProducts = async (query: string, filters: FilterState) => {
  const params = new URLSearchParams({
    q: query,
    storeUrl: storeUrl,
    categories: filters.categories.join(","),
    minPrice: filters.priceRange[0].toString(),
    maxPrice: filters.priceRange[1].toString(),
    // ... more filters
  });

  const response = await fetch(`${BACKEND_URL}/v1/search?${params}`);
  return response.json();
};
```

### Autocomplete API

```typescript
// Autocomplete suggestions
const getAutocompleteSuggestions = async (query: string) => {
  const params = new URLSearchParams({
    q: query,
    storeUrl: storeUrl,
  });

  const response = await fetch(`${BACKEND_URL}/v1/autocomplete?${params}`);
  return response.json();
};
```

## 🧩 Component Architecture

### Main Components

#### KalifindSearch

- **Purpose**: Main search component with all functionality
- **Features**: Search, filtering, pagination, recommendations
- **State**: Manages search state, filters, and results

#### ShadowDOMSearchDropdown

- **Purpose**: Shadow DOM wrapper for style isolation
- **Features**: Modal overlay, responsive layout switching
- **Isolation**: Complete CSS isolation from host website

#### KalifindSearchDesktop

- **Purpose**: Desktop-specific search layout
- **Features**: Full sidebar filters, large product grid
- **Layout**: Sidebar + main content area

#### KalifindSearchMobile

- **Purpose**: Mobile/tablet search layout
- **Features**: Collapsible filters, touch-friendly interface
- **Layout**: Stacked layout with mobile optimizations

## 🔄 State Management

### Local State (React)

- Search query and results
- Filter states and UI state
- Loading and error states

### Global State (Zustand)

- User preferences
- Cart state
- Application settings

### Persistent State (localStorage)

- Recent searches
- User preferences
- Search history

## 🎯 Embedding Guide

### Basic Embedding

```html
<script src="https://your-domain.com/kalifind-search.js?storeUrl=https://your-store.com"></script>
```

### Advanced Configuration

```html
<script
  src="https://your-domain.com/kalifind-search.js"
  data-store-url="https://your-store.com"
  data-theme="dark"
  data-autocomplete="true"
></script>
```

### Custom Styling

```css
/* Override CSS variables for custom theming */
.kalifind-search-widget {
  --primary: 220 70% 50%;
  --background: 0 0% 100%;
}
```

## 🧪 Testing

### Test Structure

```
search-test.spec.ts    # Playwright E2E tests
test-results/          # Test execution results
```

### Running Tests

```bash
# Run tests
npx playwright test

# Run with UI
npx playwright test --ui

# Generate test report
npx playwright show-report
```

## 🚀 Deployment

### Production Build

```bash
# Build for production
npm run build:embed.production

# Build for development
npm run build:embed.development
```

### CDN Deployment

The built `kalifind-search.js` file should be deployed to a CDN for optimal performance and global availability.

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:embed.production` - Build embeddable widget for production
- `npm run build:embed.development` - Build embeddable widget for development
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Quality

- **TypeScript**: Full type safety
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting (via ESLint)
- **Husky**: Git hooks for quality checks

## 🐛 Troubleshooting

### Common Issues

1. **Widget not loading**

   - Check if script URL is correct
   - Verify `storeUrl` parameter is provided
   - Check browser console for errors

2. **Styling conflicts**

   - Widget uses Shadow DOM for isolation
   - Check if host website has restrictive CSP policies

3. **Search not working**

   - Verify backend URL is accessible
   - Check network requests in browser dev tools
   - Ensure store URL is correctly configured

4. **Mobile layout issues**
   - Check viewport meta tag on host website
   - Verify responsive breakpoints are working
   - Test on actual mobile devices

## 📊 Performance

### Optimization Features

- **Code Splitting**: Lazy loading of components
- **Debounced Search**: Reduces API calls
- **Virtual Scrolling**: Handles large result sets
- **Image Lazy Loading**: Optimizes image loading
- **Bundle Size**: Optimized bundle for fast loading

### Metrics

- **Initial Load**: ~200KB gzipped
- **Time to Interactive**: <2 seconds on 3G
- **Search Response**: <300ms average
- **Autocomplete**: <150ms average

## 🤝 Contributing

### Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Make your changes
5. Run tests: `npm test`
6. Submit a pull request

### Code Style

- Use TypeScript for all new code
- Follow existing component patterns
- Write tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the ISC License.

## 🔗 Related Projects

- **KaliFinder-Backend**: The backend API that powers this search widget
- **Search Analytics**: Analytics dashboard for search performance
- **Admin Panel**: Management interface for search configuration

---

For more detailed information, see the individual component documentation and the backend API documentation.
