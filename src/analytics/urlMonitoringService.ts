/**
 * URL Monitoring Service for Purchase Tracking
 * Monitors browser navigation to detect checkout and purchase completion events
 * Works with Shopify, WooCommerce, and other e-commerce platforms
 */

interface CheckoutPattern {
  platform: 'shopify' | 'woocommerce' | 'generic';
  checkoutPatterns: RegExp[];
  thankYouPatterns: RegExp[];
}

class URLMonitoringService {
  private static instance: URLMonitoringService;
  private isInitialized = false;
  private hasTrackedCheckout = false;
  private hasTrackedPurchase = false;
  private lastTrackedOrderId: string | null = null;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private currentUrl: string = '';

  // Platform-specific URL patterns
  private readonly checkoutPatterns: CheckoutPattern[] = [
    // Shopify patterns
    {
      platform: 'shopify',
      checkoutPatterns: [
        /\/checkout$/i,
        /\/checkout\//i,
        /\/cart\/checkout/i,
        /\/payment/i,
        /\/shop\/checkout/i,
      ],
      thankYouPatterns: [
        /\/thank_you/i,
        /\/thank-you/i,
        /\/order_confirmation/i,
        /\/order-confirmation/i,
        /\/checkout\/thank_you/i,
        /\/checkout\/thank-you/i,
        /\/orders\/[a-zA-Z0-9]+\/thank_you/i,
        /\/orders\/[a-zA-Z0-9]+\/thank-you/i,
      ],
    },
    // WooCommerce patterns
    {
      platform: 'woocommerce',
      checkoutPatterns: [
        /\/checkout\/?$/i,
        /\/cart\/?$/i,
        /\/?wc-checkout\//i,
        /\/checkout\/order-received\//i,
      ],
      thankYouPatterns: [
        /\/checkout\/order-received\//i,
        /\/order-received\//i,
        /\/wc-order\/received\//i,
        /\/order-received\//i,
        /\/thank-you\//i,
        /\/order-confirmation\//i,
      ],
    },
    // Generic patterns
    {
      platform: 'generic',
      checkoutPatterns: [/\/checkout/i, /\/payment/i, /\/cart\/checkout/i, /\/buy/i, /\/purchase/i],
      thankYouPatterns: [/\/thank/i, /\/success/i, /\/confirmation/i, /\/order/i, /\/complete/i],
    },
  ];

  private constructor() {
    this.currentUrl = window.location.href;
  }

  public static getInstance(): URLMonitoringService {
    if (!URLMonitoringService.instance) {
      URLMonitoringService.instance = new URLMonitoringService();
    }
    return URLMonitoringService.instance;
  }

  /**
   * Initialize URL monitoring
   */
  public initialize(): void {
    if (this.isInitialized) return;

    console.log('🔍 URL Monitoring Service: Initializing purchase tracking');
    this.isInitialized = true;

    // Monitor URL changes
    this.startUrlMonitoring();

    // Monitor page visibility changes (for single-page apps)
    this.startVisibilityMonitoring();

    // Monitor page unload events
    this.startUnloadMonitoring();
  }

  /**
   * Start monitoring URL changes
   */
  private startUrlMonitoring(): void {
    // Check URL immediately
    this.checkCurrentUrl();

    // Set up periodic checking
    this.monitoringInterval = setInterval(() => {
      this.checkCurrentUrl();
    }, 1000); // Check every second

    // Override pushState and replaceState for SPA support
    this.overrideHistoryMethods();
  }

  /**
   * Override browser history methods to detect SPA navigation
   */
  private overrideHistoryMethods(): void {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      setTimeout(() => this.checkCurrentUrl(), 100);
    };

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      setTimeout(() => this.checkCurrentUrl(), 100);
    };

    // Override popstate for back/forward navigation
    window.addEventListener('popstate', () => {
      setTimeout(() => this.checkCurrentUrl(), 100);
    });
  }

  /**
   * Check current URL for checkout or thank you page patterns
   */
  private checkCurrentUrl(): void {
    const currentUrl = window.location.href;
    if (currentUrl === this.currentUrl) return;

    this.currentUrl = currentUrl;
    const url = currentUrl.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();

    // Check for checkout patterns
    if (!this.hasTrackedCheckout) {
      for (const pattern of this.checkoutPatterns) {
        if (this.matchesPatterns(url, pathname, pattern.checkoutPatterns)) {
          this.trackCheckoutInitiation(pattern.platform);
          break;
        }
      }
    }

    // Check for thank you page patterns
    if (!this.hasTrackedPurchase) {
      for (const pattern of this.checkoutPatterns) {
        if (this.matchesPatterns(url, pathname, pattern.thankYouPatterns)) {
          this.trackPurchaseCompletion(pattern.platform);
          break;
        }
      }
    }
  }

  /**
   * Check if URL matches any of the provided patterns
   */
  private matchesPatterns(url: string, pathname: string, patterns: RegExp[]): boolean {
    return patterns.some((pattern) => pattern.test(url) || pattern.test(pathname));
  }

  /**
   * Track checkout initiation
   */
  private trackCheckoutInitiation(platform: string): void {
    if (this.hasTrackedCheckout) return;

    console.log(`🛒 Checkout Initiation Detected (${platform}): ${this.currentUrl}`);
    this.hasTrackedCheckout = true;

    // Get cart data from localStorage or global state
    const cartData = this.getCartData();

    // Import and use UBI client
    import('./ubiClient')
      .then(({ getUBIClient }) => {
        const ubiClient = getUBIClient();
        if (ubiClient) {
          ubiClient.trackCheckoutInitiated(
            cartData.totalValue,
            cartData.itemCount,
            cartData.productIds
          );
        }
      })
      .catch((error) => {
        console.warn('Failed to track checkout initiation:', error);
      });

    // Reset purchase tracking for new checkout
    this.hasTrackedPurchase = false;
    this.lastTrackedOrderId = null;
  }

  /**
   * Track purchase completion
   */
  private trackPurchaseCompletion(platform: string): void {
    if (this.hasTrackedPurchase) return;

    console.log(`✅ Purchase Completion Detected (${platform}): ${this.currentUrl}`);
    this.hasTrackedPurchase = true;

    // Extract order information from URL
    const orderInfo = this.extractOrderInfo(platform);

    // Get cart data
    const cartData = this.getCartData();

    // Import and use UBI client
    import('./ubiClient')
      .then(({ getUBIClient }) => {
        const ubiClient = getUBIClient();
        if (ubiClient) {
          ubiClient.trackPurchaseCompleted(
            orderInfo.orderId,
            cartData.totalValue,
            cartData.productIds,
            orderInfo.currency
          );
        }
      })
      .catch((error) => {
        console.warn('Failed to track purchase completion:', error);
      });
  }

  /**
   * Extract order information from URL
   */
  private extractOrderInfo(platform: string): { orderId: string; currency: string } {
    const url = new URL(this.currentUrl);
    const pathname = url.pathname.toLowerCase();

    // Default values
    let orderId = this.generateOrderId();
    let currency = 'USD';

    // Shopify order ID extraction
    if (platform === 'shopify') {
      const shopifyMatch = pathname.match(/\/orders\/([a-zA-Z0-9]+)/);
      if (shopifyMatch) {
        orderId = shopifyMatch[1] || orderId;
      }

      // Check for order number in URL params
      const orderParam = url.searchParams.get('order') || url.searchParams.get('order_number');
      if (orderParam) {
        orderId = orderParam;
      }
    }

    // WooCommerce order ID extraction
    if (platform === 'woocommerce') {
      const wcMatch = pathname.match(/\/order-received\/(\d+)/);
      if (wcMatch) {
        orderId = wcMatch[1] || orderId;
      }

      // Check for order key in URL params
      const orderKey = url.searchParams.get('key');
      if (orderKey) {
        orderId = orderKey;
      }
    }

    // Try to extract from URL parameters
    const orderIdParam = url.searchParams.get('order_id') || url.searchParams.get('orderId');
    if (orderIdParam) {
      orderId = orderIdParam;
    }

    // Try to extract currency
    const currencyParam = url.searchParams.get('currency');
    if (currencyParam) {
      currency = currencyParam.toUpperCase();
    }

    // Prevent duplicate tracking
    if (this.lastTrackedOrderId === orderId) {
      return { orderId: '', currency };
    }

    this.lastTrackedOrderId = orderId;
    return { orderId, currency };
  }

  /**
   * Get cart data from localStorage or global state
   */
  private getCartData(): { totalValue: number; itemCount: number; productIds: string[] } {
    const defaultData = { totalValue: 0, itemCount: 0, productIds: [] };

    try {
      // Try to get cart data from localStorage
      const cartData = localStorage.getItem('kalifind_cart_data');
      if (cartData) {
        const parsed = JSON.parse(cartData);
        return {
          totalValue: parsed.totalValue || 0,
          itemCount: parsed.itemCount || 0,
          productIds: parsed.productIds || [],
        };
      }

      // Try to get from global cart state (if available)
      if ((window as any).kalifindCart) {
        return {
          totalValue: (window as any).kalifindCart.totalValue || 0,
          itemCount: (window as any).kalifindCart.itemCount || 0,
          productIds: (window as any).kalifindCart.productIds || [],
        };
      }

      // Try to extract from common cart localStorage keys
      const shopifyCart = localStorage.getItem('cart');
      if (shopifyCart) {
        const parsed = JSON.parse(shopifyCart);
        const totalValue = parsed.total_price || parsed.total || 0;
        const itemCount = parsed.item_count || parsed.items?.length || 0;
        const productIds = parsed.items?.map((item: any) => item.product_id || item.id) || [];

        return { totalValue, itemCount, productIds };
      }
    } catch (error) {
      console.warn('Failed to get cart data:', error);
    }

    return defaultData;
  }

  /**
   * Generate a unique order ID
   */
  private generateOrderId(): string {
    return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start monitoring page visibility changes
   */
  private startVisibilityMonitoring(): void {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // Page became visible again, check URL
        setTimeout(() => this.checkCurrentUrl(), 500);
      }
    });
  }

  /**
   * Start monitoring page unload events
   */
  private startUnloadMonitoring(): void {
    window.addEventListener('beforeunload', () => {
      // Save current state to localStorage
      localStorage.setItem(
        'kalifind_url_monitoring_state',
        JSON.stringify({
          hasTrackedCheckout: this.hasTrackedCheckout,
          hasTrackedPurchase: this.hasTrackedPurchase,
          lastTrackedOrderId: this.lastTrackedOrderId,
          currentUrl: this.currentUrl,
        })
      );
    });

    // Restore state on page load
    this.restoreState();
  }

  /**
   * Restore monitoring state from localStorage
   */
  private restoreState(): void {
    try {
      const savedState = localStorage.getItem('kalifind_url_monitoring_state');
      if (savedState) {
        const state = JSON.parse(savedState);
        this.hasTrackedCheckout = state.hasTrackedCheckout || false;
        this.hasTrackedPurchase = state.hasTrackedPurchase || false;
        this.lastTrackedOrderId = state.lastTrackedOrderId || null;

        // Clear saved state
        localStorage.removeItem('kalifind_url_monitoring_state');
      }
    } catch (error) {
      console.warn('Failed to restore monitoring state:', error);
    }
  }

  /**
   * Reset tracking state (for new sessions)
   */
  public resetTracking(): void {
    this.hasTrackedCheckout = false;
    this.hasTrackedPurchase = false;
    this.lastTrackedOrderId = null;
    console.log('🔄 URL Monitoring Service: Tracking state reset');
  }

  /**
   * Stop monitoring
   */
  public stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isInitialized = false;
    console.log('🛑 URL Monitoring Service: Stopped');
  }
}

// Export singleton instance
export const urlMonitoringService = URLMonitoringService.getInstance();
