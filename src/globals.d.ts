// Global type definitions for the widget

// CSS variable injected by inline-css-build.mjs in production
// In dev mode, this will be undefined (CSS loaded via Vite normally)
declare const __WIDGET_CSS__: string | undefined;

// Window augmentation for store URL and custom events
declare global {
  interface Window {
    __KALIFINDER_STORE_URL__?: string;
    KALIFIND_VENDOR_ID?: string;
    KALIFIND_STORE_ID?: string;
    KALIFIND_PLATFORM?: string;
    kalifindCart?: {
      totalValue: number;
      itemCount: number;
      productIds: string[];
    };
  }

  interface WindowEventMap {
    'shopify:checkout:completed': CustomEvent<{
      orderId?: string;
      total?: number;
      items?: Array<{ id: string }>;
      currency?: string;
    }>;
    'woocommerce:order_received': CustomEvent<{
      orderId?: string;
      total?: number;
      items?: Array<{ id: string }>;
      currency?: string;
    }>;
    'kalifind:purchase_completed': CustomEvent<{
      orderId: string;
      revenue: number;
      productIds: string[];
      currency: string;
    }>;
  }
}

export {};
