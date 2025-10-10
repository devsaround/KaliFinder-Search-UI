# GitHub Copilot Instructions - KaliFinder Search UI

## Project Overview

KaliFinder Search UI is an embeddable search widget built with React, TypeScript, and Shadow DOM. It provides intelligent product search experiences that can be embedded in any e-commerce website without style conflicts.

---

## Code Style & Standards

### TypeScript

- Use strict TypeScript with explicit types
- Avoid `any` types - use proper interfaces/types
- Define prop types for all components
- Export types for public APIs

### Naming Conventions

- **Files**: PascalCase for components (`SearchBar.tsx`), kebab-case for utilities (`api-service.ts`)
- **Components**: PascalCase (`ProductCard`, `SearchDropdown`)
- **Functions/Variables**: camelCase (`fetchProducts`, `isOpen`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RESULTS`, `API_ENDPOINT`)
- **Interfaces**: PascalCase (`Product`, `SearchConfig`)
- **Types**: PascalCase (`SearchParams`, `FilterOptions`)

### Component Structure

```typescript
// 1. Imports
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types";

// 2. Types/Interfaces
interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

// 3. Component
export function SearchBar({
  onSearch,
  placeholder = "Search products...",
}: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    onSearch(query);
  };

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
      />
      <button onClick={handleSearch}>Search</button>
    </div>
  );
}
```

---

## Shadow DOM Integration

### Why Shadow DOM?

- **Style Isolation**: Widget styles don't affect host page
- **No Conflicts**: Host page styles don't affect widget
- **Encapsulation**: Widget is self-contained

### Shadow DOM Wrapper

```typescript
import { createRoot } from "react-dom/client";
import App from "./App";
import styles from "./styles.css?inline";

export function initWidget(containerId: string, config: WidgetConfig) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container ${containerId} not found`);
    return;
  }

  // Create shadow root
  const shadowRoot = container.attachShadow({ mode: "open" });

  // Inject styles
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  shadowRoot.appendChild(styleSheet);

  // Create app container
  const appContainer = document.createElement("div");
  shadowRoot.appendChild(appContainer);

  // Render React app
  const root = createRoot(appContainer);
  root.render(<App config={config} />);
}
```

---

## Component Best Practices

### Functional Components

```typescript
// ✅ Good: Functional component with hooks
export function ProductCard({ product, onClick }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick(product.id)}
    >
      <h3>{product.title}</h3>
      <p>${product.price}</p>
    </div>
  );
}
```

### Props Destructuring

```typescript
// ✅ Good: Destructure props with defaults
export function SearchBar({
  placeholder = "Search...",
  onSearch,
  debounceMs = 300,
}: SearchBarProps) {
  return <input placeholder={placeholder} />;
}

// ❌ Avoid: Using props object
export function SearchBar(props: SearchBarProps) {
  return <input placeholder={props.placeholder} />;
}
```

---

## State Management (Zustand)

### Store Pattern

```typescript
// hooks/zustand.tsx
import { create } from "zustand";

interface SearchStore {
  query: string;
  products: Product[];
  isLoading: boolean;
  filters: FilterOptions;
  setQuery: (query: string) => void;
  setProducts: (products: Product[]) => void;
  setFilters: (filters: FilterOptions) => void;
  search: (query: string) => Promise<void>;
}

export const useSearchStore = create<SearchStore>((set, get) => ({
  query: "",
  products: [],
  isLoading: false,
  filters: {},

  setQuery: (query) => set({ query }),
  setProducts: (products) => set({ products }),
  setFilters: (filters) => set({ filters }),

  search: async (query) => {
    set({ isLoading: true, query });
    const products = await api.searchProducts(query, get().filters);
    set({ products, isLoading: false });
  },
}));
```

### Usage

```typescript
function SearchResults() {
  const { products, isLoading, search } = useSearchStore();

  useEffect(() => {
    search("laptop");
  }, [search]);

  if (isLoading) return <Spinner />;
  return (
    <div>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
```

---

## API Integration

### Service Pattern

```typescript
// services/api.service.ts
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

export const searchApi = {
  search: async (
    query: string,
    filters?: FilterOptions
  ): Promise<Product[]> => {
    const response = await fetch(
      `${API_BASE_URL}/search?q=${encodeURIComponent(query)}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.ok) {
      throw new Error("Search failed");
    }

    const data = await response.json();
    return data.products;
  },

  autocomplete: async (query: string): Promise<string[]> => {
    const response = await fetch(
      `${API_BASE_URL}/autocomplete?q=${encodeURIComponent(query)}`
    );
    const data = await response.json();
    return data.suggestions;
  },
};
```

### Error Handling

```typescript
try {
  const products = await searchApi.search(query);
  setProducts(products);
} catch (error) {
  console.error("Search failed:", error);
  showErrorToast("Failed to search products");
}
```

---

## Debouncing Search Input

### Custom Hook

```typescript
// hooks/use-debounce.tsx
import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

### Usage

```typescript
function SearchBar() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const { search } = useSearchStore();

  useEffect(() => {
    if (debouncedQuery) {
      search(debouncedQuery);
    }
  }, [debouncedQuery, search]);

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

---

## Analytics (UBI)

### UBI Client

```typescript
// analytics/ubiClient.ts
export class UBIClient {
  private apiUrl: string;
  private vendorId: string;

  constructor(apiUrl: string, vendorId: string) {
    this.apiUrl = apiUrl;
    this.vendorId = vendorId;
  }

  trackSearch(query: string, resultCount: number) {
    this.sendEvent({
      eventType: "search",
      query,
      resultCount,
      timestamp: new Date().toISOString(),
    });
  }

  trackClick(productId: string, position: number) {
    this.sendEvent({
      eventType: "product_click",
      productId,
      position,
      timestamp: new Date().toISOString(),
    });
  }

  private async sendEvent(event: any) {
    try {
      await fetch(`${this.apiUrl}/analytics/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...event, vendorId: this.vendorId }),
      });
    } catch (error) {
      console.error("Failed to send analytics event:", error);
    }
  }
}
```

### Usage

```typescript
const ubiClient = new UBIClient(config.apiUrl, config.vendorId);

// Track search
ubiClient.trackSearch("laptop", 25);

// Track product click
ubiClient.trackClick("product-123", 3);
```

---

## Responsive Design

### Mobile-First Approach

```typescript
<div
  className="
  flex flex-col gap-2        // Mobile: vertical stack
  md:flex-row md:gap-4       // Tablet+: horizontal
  lg:gap-6                   // Desktop: larger gaps
"
>
  <div className="w-full md:w-1/3">Filters</div>
  <div className="w-full md:w-2/3">Products</div>
</div>
```

### Mobile vs Desktop Components

```typescript
import { useMediaQuery } from "@/hooks/use-media-query";

function SearchWidget() {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return isMobile ? <MobileSearch /> : <DesktopSearch />;
}
```

---

## Performance Optimization

### Virtual Scrolling for Large Lists

```typescript
import { useVirtualizer } from "@tanstack/react-virtual";

function ProductList({ products }: { products: Product[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: products.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
  });

  return (
    <div ref={parentRef} style={{ height: "400px", overflow: "auto" }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.index}
            style={{ transform: `translateY(${virtualItem.start}px)` }}
          >
            <ProductCard product={products[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Image Lazy Loading

```typescript
<img src={product.image} alt={product.title} loading="lazy" decoding="async" />
```

---

## Styling with TailwindCSS

### Component Styling

```typescript
// Use Tailwind utility classes
<div className="rounded-lg bg-white p-4 shadow-md hover:shadow-lg transition-shadow">
  <h3 className="text-lg font-semibold text-gray-900">{product.title}</h3>
  <p className="text-sm text-gray-600">${product.price}</p>
</div>
```

### Conditional Classes

```typescript
import { clsx } from "clsx";

<button
  className={clsx(
    "rounded px-4 py-2 font-medium",
    isActive ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700",
    isDisabled && "opacity-50 cursor-not-allowed"
  )}
>
  {label}
</button>;
```

---

## Configuration & Initialization

### Widget Configuration

```typescript
export interface WidgetConfig {
  apiUrl: string;
  vendorId: string;
  containerId: string;
  theme?: "light" | "dark";
  language?: string;
  placeholder?: string;
  maxResults?: number;
  enableAnalytics?: boolean;
}

// Global initialization
window.KalifinderSearch = {
  init: (config: WidgetConfig) => {
    initWidget(config.containerId, config);
  },

  setTheme: (theme: "light" | "dark") => {
    // Update theme dynamically
  },

  setLanguage: (language: string) => {
    // Update language dynamically
  },
};
```

---

## Build Configuration

### Vite Config for Widget

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    lib: {
      entry: "src/embed-search.tsx",
      name: "KalifinderSearch",
      fileName: "kalifinder-search",
      formats: ["umd"],
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
```

---

## Testing

### Component Testing

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchBar } from "./SearchBar";

describe("SearchBar", () => {
  it("calls onSearch when enter is pressed", () => {
    const onSearch = jest.fn();
    render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByPlaceholderText("Search...");
    fireEvent.change(input, { target: { value: "laptop" } });
    fireEvent.keyPress(input, { key: "Enter" });

    expect(onSearch).toHaveBeenCalledWith("laptop");
  });
});
```

---

## Code Review Checklist

Before submitting PR:

- [ ] All TypeScript types are properly defined
- [ ] Components are properly isolated in Shadow DOM
- [ ] No style leakage to/from host page
- [ ] Debouncing is implemented for search input
- [ ] Analytics events are tracked
- [ ] Responsive design works on mobile/desktop
- [ ] Images use lazy loading
- [ ] Bundle size is optimized
- [ ] Error handling is implemented
- [ ] Code is formatted (Prettier)

---

## Remember

- **Shadow DOM Isolation**: Always test widget in different websites
- **Bundle Size**: Keep widget lightweight (< 100KB)
- **Performance**: Optimize for fast initial load and smooth interactions
- **Accessibility**: Use semantic HTML and keyboard navigation
- **Analytics**: Track user behavior for insights
- **Responsiveness**: Test on multiple screen sizes
- **Compatibility**: Ensure works with different e-commerce platforms
