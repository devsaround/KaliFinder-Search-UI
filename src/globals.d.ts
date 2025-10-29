// Global type definitions for the widget

// CSS variable injected by inline-css-build.mjs in production
// In dev mode, this will be undefined (CSS loaded via Vite normally)
declare const __WIDGET_CSS__: string | undefined;

// Window augmentation for store URL
declare global {
  interface Window {
    __KALIFINDER_STORE_URL__?: string;
  }
}

export {};
