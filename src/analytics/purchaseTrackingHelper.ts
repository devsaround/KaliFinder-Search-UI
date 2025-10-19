/**
 * Purchase Tracking Helper Utility
 * Provides enhanced purchase tracking capabilities and helper functions
 */

interface PurchaseTrackingConfig {
  enableCheckoutInitiation: boolean;
  enablePurchaseCompletion: boolean;
  minItemsForCheckout: number;
  minValueForCheckout: number;
  trackingDelay: number;
}

class PurchaseTrackingHelper {
  private static instance: PurchaseTrackingHelper;
  private config: PurchaseTrackingConfig;
  private isInitialized = false;

  private constructor() {
    this.config = {
      enableCheckoutInitiation: true,
      enablePurchaseCompletion: true,
      minItemsForCheckout: 2,
      minValueForCheckout: 50,
      trackingDelay: 1000,
    };
  }

  public static getInstance(): PurchaseTrackingHelper {
    if (!PurchaseTrackingHelper.instance) {
      PurchaseTrackingHelper.instance = new PurchaseTrackingHelper();
    }
    return PurchaseTrackingHelper.instance;
  }

  /**
   * Initialize purchase tracking with custom configuration
   */
  public initialize(config?: Partial<PurchaseTrackingConfig>): void {
    if (this.isInitialized) return;

    if (config) {
      this.config = { ...this.config, ...config };
    }

    console.log('🛒 Purchase Tracking Helper: Initialized with config:', this.config);
    this.isInitialized = true;

    // Set up enhanced tracking
    this.setupEnhancedTracking();
  }

  /**
   * Setup enhanced tracking features
   */
  private setupEnhancedTracking(): void {
    // Monitor cart changes
    this.monitorCartChanges();

    // Monitor for purchase signals
    this.monitorPurchaseSignals();

    // Setup session persistence
    this.setupSessionPersistence();
  }

  /**
   * Monitor cart changes for tracking opportunities
   */
  private monitorCartChanges(): void {
    // Override localStorage setItem to detect cart changes
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = (key: string, value: string) => {
      const result = originalSetItem.call(localStorage, key, value);

      // Check if cart was updated
      if (key === 'cart' || key === 'kalifind_cart_data') {
        setTimeout(() => this.checkCartForTracking(), this.config.trackingDelay);
      }

      return result;
    };
  }

  /**
   * Check cart for tracking opportunities
   */
  private checkCartForTracking(): void {
    if (!this.config.enableCheckoutInitiation) return;

    try {
      const cartData = this.getCartData();
      const shouldTrack = this.shouldTrackCheckoutInitiation(cartData);

      if (shouldTrack) {
        this.trackCheckoutInitiation(cartData);
      }
    } catch (error) {
      console.warn('Failed to check cart for tracking:', error);
    }
  }

  /**
   * Determine if checkout initiation should be tracked
   */
  private shouldTrackCheckoutInitiation(cartData: {
    totalValue: number;
    itemCount: number;
    productIds: string[];
  }): boolean {
    const hasEnoughItems = cartData.itemCount >= this.config.minItemsForCheckout;
    const hasEnoughValue = cartData.totalValue >= this.config.minValueForCheckout;
    const hasTrackedRecently = this.hasTrackedCheckoutRecently();

    return (hasEnoughItems || hasEnoughValue) && !hasTrackedRecently;
  }

  /**
   * Track checkout initiation
   */
  private trackCheckoutInitiation(cartData: {
    totalValue: number;
    itemCount: number;
    productIds: string[];
  }): void {
    console.log('🛒 Enhanced checkout initiation tracking:', cartData);

    // Mark as tracked to prevent duplicates
    this.markCheckoutTracked();

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
        console.warn('Failed to track enhanced checkout initiation:', error);
      });
  }

  /**
   * Monitor for purchase completion signals
   */
  private monitorPurchaseSignals(): void {
    // Monitor for order confirmation elements
    this.monitorOrderConfirmationElements();

    // Monitor for purchase success messages
    this.monitorPurchaseSuccessMessages();

    // Monitor for URL changes (handled by URL monitoring service)
  }

  /**
   * Monitor for order confirmation elements on the page
   */
  private monitorOrderConfirmationElements(): void {
    const observer = new MutationObserver(() => {
      this.checkForOrderConfirmationElements();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Initial check
    this.checkForOrderConfirmationElements();
  }

  /**
   * Check for order confirmation elements
   */
  private checkForOrderConfirmationElements(): void {
    if (!this.config.enablePurchaseCompletion) return;

    const confirmationSelectors = [
      '.order-confirmation',
      '.thank-you',
      '.order-success',
      '.purchase-success',
      '[data-order-confirmation]',
      '[data-order-id]',
      '.order-number',
      '.checkout-success',
    ];

    confirmationSelectors.some((selector) => {
      const element = document.querySelector(selector);
      if (element) {
        this.trackPurchaseCompletionFromElement(element);
        return true;
      }
      return false;
    });
  }

  /**
   * Track purchase completion from page element
   */
  private trackPurchaseCompletionFromElement(element: Element): void {
    console.log('✅ Purchase completion detected from element:', element);

    // Extract order information
    const orderInfo = this.extractOrderInfoFromElement(element);
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
        console.warn('Failed to track purchase completion from element:', error);
      });
  }

  /**
   * Extract order information from page element
   */
  private extractOrderInfoFromElement(element: Element): {
    orderId: string;
    currency: string;
  } {
    // Try to extract order ID from element
    const orderId =
      element.getAttribute('data-order-id') ||
      element.getAttribute('data-order-number') ||
      element.textContent?.match(/order\s*#?\s*([A-Z0-9-]+)/i)?.[1] ||
      element.textContent?.match(/([A-Z0-9-]+)/)?.[0] ||
      this.generateOrderId();

    // Try to extract currency
    const currency =
      element.getAttribute('data-currency') || element.textContent?.match(/\$(\w+)/)?.[1] || 'USD';

    return { orderId, currency };
  }

  /**
   * Monitor for purchase success messages
   */
  private monitorPurchaseSuccessMessages(): void {
    // Monitor for toast notifications or success messages
    const observer = new MutationObserver(() => {
      this.checkForPurchaseSuccessMessages();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Check for purchase success messages
   */
  private checkForPurchaseSuccessMessages(): void {
    const successTexts = [
      'order confirmed',
      'purchase successful',
      'payment successful',
      'thank you for your order',
      'order received',
      'checkout complete',
    ];

    const elements = document.querySelectorAll('*');
    for (const element of elements) {
      const text = element.textContent?.toLowerCase() || '';
      if (successTexts.some((successText) => text.includes(successText))) {
        this.trackPurchaseCompletionFromElement(element);
        break;
      }
    }
  }

  /**
   * Get cart data from various sources
   */
  private getCartData(): {
    totalValue: number;
    itemCount: number;
    productIds: string[];
  } {
    const defaultData = { totalValue: 0, itemCount: 0, productIds: [] };

    try {
      // Try kalifind cart data first
      const kalifindCart = localStorage.getItem('kalifind_cart_data');
      if (kalifindCart) {
        return JSON.parse(kalifindCart);
      }

      // Try Shopify cart
      const shopifyCart = localStorage.getItem('cart');
      if (shopifyCart) {
        const parsed = JSON.parse(shopifyCart) as { total_price?: number; total?: number; item_count?: number; items?: Array<{ product_id?: string; id?: string }> };
        return {
          totalValue: parsed.total_price || parsed.total || 0,
          itemCount: parsed.item_count || parsed.items?.length || 0,
          productIds: parsed.items?.map((item) => item.product_id || item.id || '') || [],
        };
      }

      // Try global state
      const globalWindow = window as Window & { kalifindCart?: typeof defaultData };
      if (globalWindow.kalifindCart) {
        return globalWindow.kalifindCart;
      }
    } catch (error) {
      console.warn('Failed to get cart data:', error);
    }

    return defaultData;
  }

  /**
   * Setup session persistence for tracking state
   */
  private setupSessionPersistence(): void {
    // Restore tracking state on page load
    this.restoreTrackingState();

    // Save tracking state before page unload
    window.addEventListener('beforeunload', () => {
      this.saveTrackingState();
    });
  }

  /**
   * Restore tracking state from localStorage
   */
  private restoreTrackingState(): void {
    try {
      const state = localStorage.getItem('kalifind_purchase_tracking_state');
      if (state) {
        const parsed = JSON.parse(state);
        // Restore any necessary tracking state
        console.log('📋 Purchase tracking state restored:', parsed);
        localStorage.removeItem('kalifind_purchase_tracking_state');
      }
    } catch (error) {
      console.warn('Failed to restore tracking state:', error);
    }
  }

  /**
   * Save tracking state to localStorage
   */
  private saveTrackingState(): void {
    try {
      const state = {
        lastTracked: Date.now(),
        config: this.config,
      };
      localStorage.setItem('kalifind_purchase_tracking_state', JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save tracking state:', error);
    }
  }

  /**
   * Mark checkout as tracked to prevent duplicates
   */
  private markCheckoutTracked(): void {
    localStorage.setItem('kalifind_checkout_tracked', Date.now().toString());
  }

  /**
   * Check if checkout was tracked recently
   */
  private hasTrackedCheckoutRecently(): boolean {
    try {
      const tracked = localStorage.getItem('kalifind_checkout_tracked');
      if (!tracked) return false;

      const trackedTime = parseInt(tracked);
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      return trackedTime > fiveMinutesAgo;
    } catch (_error) {
      return false;
    }
  }

  /**
   * Generate a unique order ID
   */
  private generateOrderId(): string {
    return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Reset tracking state
   */
  public resetTracking(): void {
    localStorage.removeItem('kalifind_checkout_tracked');
    localStorage.removeItem('kalifind_purchase_tracking_state');
    console.log('🔄 Purchase tracking state reset');
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<PurchaseTrackingConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('⚙️ Purchase tracking config updated:', this.config);
  }

  /**
   * Get current configuration
   */
  public getConfig(): PurchaseTrackingConfig {
    return { ...this.config };
  }

  /**
   * Get tracking statistics
   */
  public getTrackingStats(): {
    checkoutTracked: boolean;
    lastTrackedTime: number | null;
    cartData: { totalValue: number; itemCount: number; productIds: string[] };
  } {
    return {
      checkoutTracked: this.hasTrackedCheckoutRecently(),
      lastTrackedTime: this.getLastTrackedTime(),
      cartData: this.getCartData(),
    };
  }

  /**
   * Get last tracked time
   */
  private getLastTrackedTime(): number | null {
    try {
      const tracked = localStorage.getItem('kalifind_checkout_tracked');
      return tracked ? parseInt(tracked) : null;
    } catch (_error) {
      return null;
    }
  }
}

// Export singleton instance
export const purchaseTrackingHelper = PurchaseTrackingHelper.getInstance();
