# CRUSH.md - KaliFinder Search UI

## Commands

### Development
- `pnpm dev` - Start development server
- `pnpm build` - Production build (clean + typecheck + build)
- `pnpm build:dev` - Development build with typecheck
- `pnpm preview` - Preview production build

### Code Quality
- `pnpm type-check` - TypeScript type checking (no emit)
- `pnpm lint` - ESLint check
- `pnpm lint:fix` - ESLint with auto-fix
- `pnpm format` - Prettier formatting
- `pnpm format:check` - Prettier validation
- `pnpm check:all` - Run typecheck + format:check + lint
- `pnpm check:strict` - Run typecheck + format + lint + build

### Utilities
- `pnpm clean` - Remove dist and .tsbuildinfo
- `pnpm build:analyze` - Analyze bundle size

## Code Style Guidelines

### TypeScript & Imports
- Use strict TypeScript, avoid `any` types
- Import order: 1) React/libraries, 2) Components, 3) Types, 4) Utils
- Use absolute imports with `@/` prefix for internal modules
- Export component props interfaces, use `type` for type-only imports

### Component Structure
```typescript
// 1. Imports
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types";

// 2. Component Props Interface
interface ProductCardProps {
  product: Product;
  onClick?: (id: string) => void;
}

// 3. Component (export function syntax)
export function ProductCard({ product, onClick }: ProductCardProps) {
  return <div />;
}
```

### Naming Conventions
- Files: PascalCase components (`ProductCard.tsx`), kebab-case utilities (`api.service.ts`)
- Components: PascalCase (`ProductCard`, `SearchDropdown`)
- Functions/Variables: camelCase (`fetchProducts`, `isOpen`)
- Constants: UPPER_SNAKE_CASE (`MAX_RESULTS`, `API_ENDPOINT`)
- Interfaces/Types: PascalCase (`Product`, `SearchParams`)

### Error Handling
- Use try/catch for async operations
- Console error for logging
- Show user-friendly error messages via toast notifications
- Always handle promise rejections in API calls

### Shadow DOM Rules
- Widget must be style-isolated using Shadow DOM
- Styles must be inline (`?inline` import)
- Test widget embedding in different websites
- No style leakage to/from host page

### Build Requirements
- Use pnpm only (no npm, yarn, or bun)
- Type checking required before build
- ES modules with Vite library mode for widget distribution
- Bundle size optimization target: <100KB