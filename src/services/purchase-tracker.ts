/**
 * Purchase Tracking Service
 * Monitors URL changes and platform-specific events to detect purchase completion
 */

import { getUBIClient } from '../analytics/ubiClient';
import { logger } from '../utils/logger';
import { safeLocalStorage, storageHelpers } from '../utils/safe-storage';

interface PurchaseData {
  orderId: string;
  revenue: number;
  productIds: string[];
  currency: string;
}

interface CartData {
  totalValue: number;
  itemCount: number;
  productIds: string[];
}

class PurchaseTracker {
  private lastUrl: string;
  private urlCheckInterval: NodeJS.Timeout | null = null;
  private purchaseDetected: boolean = false;

  constructor() {
    this.lastUrl = window.location.href;
    this.initializeTracking();
  }

  /**
   * Initialize purchase tracking
   */
  private initializeTracking(): void {
    // Start URL monitoring
    this.startURLMonitoring();

    // Listen for platform-specific events
    this.listenForPlatformEvents();

    // Check for purchase completion on page load
    this.checkForPurchaseOnLoad();

    logger.debug('Purchase tracking initialized');
  }

  /**
   * Start monitoring URL changes for thank you/order confirmation pages
   */
  private startURLMonitoring(): void {
    // Check URL every 500ms
    this.urlCheckInterval = setInterval(() => {
      this.checkURLForPurchase();
    }, 500);

    // Also check on popstate (browser back/forward)
    window.addEventListener('popstate', () => {
      this.checkURLForPurchase();
    });

    // Also check on hashchange
    window.addEventListener('hashchange', () => {
      this.checkURLForPurchase();
    });
  }

  /**
   * Listen for platform-specific purchase events
   */
  private listenForPlatformEvents(): void {
    // Shopify checkout completion event
    window.addEventListener('shopify:checkout:completed', ((event: CustomEvent) => {
      this.handleShopifyPurchase(event.detail);
    }) as EventListener);

    // WooCommerce order received event
    window.addEventListener('woocommerce:order_received', ((event: CustomEvent) => {
      this.handleWooCommercePurchase(event.detail);
    }) as EventListener);

    // Generic purchase completion event
    window.addEventListener('kalifind:purchase_completed', ((event: CustomEvent) => {
      this.handleGenericPurchase(event.detail);
    }) as EventListener);
  }

  /**
   * Check current URL for purchase completion indicators
   */
  private checkURLForPurchase(): void {
    const currentUrl = window.location.href;

    // Skip if URL hasn't changed
    if (currentUrl === this.lastUrl) {
      return;
    }

    this.lastUrl = currentUrl;

    // Check if URL indicates purchase completion
    if (this.isPurchaseCompletionURL(currentUrl)) {
      this.detectAndTrackPurchase();
    }
  }

  /**
   * Check if URL indicates a purchase completion page
   */
  private isPurchaseCompletionURL(url: string): boolean {
    const lowerUrl = url.toLowerCase();

    // Common thank you / order confirmation page patterns
    const purchasePatterns = [
      '/thank-you',
      '/thank_you',
      '/thankyou',
      '/order-received',
      '/order_received',
      '/order-confirmation',
      '/order_confirmation',
      '/checkout/success',
      '/checkout/thank-you',
      '/checkout/thank_you',
      '/orders/thank_you',
      '/orders/thank-you',
      '/checkouts/success',
      // Shopify specific
      '/checkouts/',
      '/thank_you',
      // WooCommerce specific
      '/order-received',
      '/checkout/order-received',
    ];

    return purchasePatterns.some((pattern) => lowerUrl.includes(pattern));
  }

  /**
   * Check for purchase completion on initial page load
   */
  private checkForPurchaseOnLoad(): void {
    if (this.isPurchaseCompletionURL(window.location.href)) {
      // Wait a bit for the page to fully load and DOM to be ready
      setTimeout(() => {
        this.detectAndTrackPurchase();
      }, 1000);
    }
  }

  /**
   * Detect and track purchase from URL and page content
   */
  private detectAndTrackPurchase(): void {
    // Prevent duplicate tracking
    if (this.purchaseDetected) {
      logger.debug('Purchase already tracked, skipping');
      return;
    }

    try {
      const purchaseData = this.extractPurchaseData();

      if (purchaseData) {
        this.trackPurchase(purchaseData);
        this.purchaseDetected = true;

        // Clear cart data after successful purchase
        this.clearCartData();
      }
    } catch (error) {
      logger.warn('Failed to detect purchase from page', error);
    }
  }

  /**
   * Extract purchase data from URL and page content
   */
  private extractPurchaseData(): PurchaseData | null {
    const url = window.location.href;

    // Try to extract order ID from URL
    const orderId = this.extractOrderIdFromURL(url);

    if (!orderId) {
      logger.debug('No order ID found in URL');
      return null;
    }

    // Try to extract revenue from page content
    const revenue = this.extractRevenueFromPage();

    // Get cart data from localStorage
    const cartData = this.getCartData();

    return {
      orderId,
      revenue: revenue || cartData?.totalValue || 0,
      productIds: cartData?.productIds || [],
      currency: this.extractCurrencyFromPage() || 'USD',
    };
  }

  /**
   * Extract order ID from URL
   */
  private extractOrderIdFromURL(url: string): string | null {
    // Common order ID URL patterns
    const patterns = [
      /order[_-]?id[=/](\d+)/i,
      /order[=/](\d+)/i,
      /\/orders?\/(\d+)/i,
      /\/thank[_-]?you\/(\d+)/i,
      /\/checkouts?\/([a-zA-Z0-9]+)/i,
      /order[_-]?received[=/](\d+)/i,
      /key=wc_order_([a-zA-Z0-9]+)/i,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    // Try to find order ID in page content
    return this.extractOrderIdFromPage();
  }

  /**
   * Extract order ID from page content
   */
  private extractOrderIdFromPage(): string | null {
    // Look for common order number elements
    const selectors = [
      '[class*="order-number"]',
      '[class*="order_number"]',
      '[class*="orderNumber"]',
      '[id*="order-number"]',
      '[id*="order_number"]',
      '[data-order-id]',
      '[data-order-number]',
      '.thank-you__order-number',
      '.woocommerce-order-overview__order',
      '.order-confirm__order-number',
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent?.trim();
        if (text) {
          // Extract number from text
          const match = text.match(/\d+/);
          if (match) {
            return match[0];
          }
        }

        // Check data attributes
        const orderId =
          element.getAttribute('data-order-id') || element.getAttribute('data-order-number');
        if (orderId) {
          return orderId;
        }
      }
    }

    return null;
  }

  /**
   * Extract revenue from page content
   */
  private extractRevenueFromPage(): number | null {
    // Look for total/revenue elements
    const selectors = [
      '[class*="total"]',
      '[class*="grand-total"]',
      '[class*="order-total"]',
      '[class*="order_total"]',
      '.woocommerce-order-overview__total',
      '.thank-you__order-total',
      '.order-confirm__total',
    ];

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const text = element.textContent?.trim();
        if (text) {
          // Extract price (handle formats like $123.45, 123.45, USD 123.45)
          const match = text.match(/[\d,]+\.?\d*/);
          if (match) {
            const price = parseFloat(match[0].replace(/,/g, ''));
            if (!isNaN(price) && price > 0) {
              return price;
            }
          }
        }
      }
    }

    return null;
  }

  /**
   * Extract currency from page content
   */
  private extractCurrencyFromPage(): string | null {
    // Look for currency symbols or codes
    const pageText = document.body.textContent || '';

    // Common currency patterns
    const currencyPatterns = [
      { pattern: /USD/i, code: 'USD' },
      { pattern: /\$/i, code: 'USD' },
      { pattern: /EUR/i, code: 'EUR' },
      { pattern: /€/i, code: 'EUR' },
      { pattern: /GBP/i, code: 'GBP' },
      { pattern: /£/i, code: 'GBP' },
      { pattern: /CAD/i, code: 'CAD' },
      { pattern: /AUD/i, code: 'AUD' },
    ];

    for (const { pattern, code } of currencyPatterns) {
      if (pattern.test(pageText)) {
        return code;
      }
    }

    return null;
  }

  /**
   * Get cart data from localStorage
   */
  private getCartData(): CartData | null {
    try {
      return storageHelpers.getJSON<CartData>(safeLocalStorage, 'kalifind_cart_data');
    } catch (error) {
      logger.warn('Failed to get cart data', error);
      return null;
    }
  }

  /**
   * Track purchase completion
   */
  private trackPurchase(purchaseData: PurchaseData): void {
    logger.info('Purchase detected', purchaseData);

    try {
      const ubiClient = getUBIClient();
      if (ubiClient) {
        ubiClient.trackPurchaseCompleted(
          purchaseData.orderId,
          purchaseData.revenue,
          purchaseData.productIds,
          purchaseData.currency
        );
        logger.debug('Purchase tracked successfully', purchaseData);
      }
    } catch (error) {
      logger.error('Failed to track purchase', error);
    }
  }

  /**
   * Handle Shopify purchase event
   */
  private handleShopifyPurchase(data: unknown): void {
    logger.debug('Shopify purchase event received', data);

    try {
      const purchaseData = data as {
        orderId?: string;
        total?: number;
        items?: Array<{ id: string }>;
        currency?: string;
      };

      if (purchaseData.orderId) {
        this.trackPurchase({
          orderId: purchaseData.orderId,
          revenue: purchaseData.total || 0,
          productIds: purchaseData.items?.map((item) => item.id) || [],
          currency: purchaseData.currency || 'USD',
        });
        this.purchaseDetected = true;
        this.clearCartData();
      }
    } catch (error) {
      logger.warn('Failed to handle Shopify purchase event', error);
    }
  }

  /**
   * Handle WooCommerce purchase event
   */
  private handleWooCommercePurchase(data: unknown): void {
    logger.debug('WooCommerce purchase event received', data);

    try {
      const purchaseData = data as {
        orderId?: string;
        total?: number;
        items?: Array<{ id: string }>;
        currency?: string;
      };

      if (purchaseData.orderId) {
        this.trackPurchase({
          orderId: purchaseData.orderId,
          revenue: purchaseData.total || 0,
          productIds: purchaseData.items?.map((item) => item.id) || [],
          currency: purchaseData.currency || 'USD',
        });
        this.purchaseDetected = true;
        this.clearCartData();
      }
    } catch (error) {
      logger.warn('Failed to handle WooCommerce purchase event', error);
    }
  }

  /**
   * Handle generic purchase event
   */
  private handleGenericPurchase(data: unknown): void {
    logger.debug('Generic purchase event received', data);

    try {
      const purchaseData = data as PurchaseData;

      if (purchaseData.orderId) {
        this.trackPurchase(purchaseData);
        this.purchaseDetected = true;
        this.clearCartData();
      }
    } catch (error) {
      logger.warn('Failed to handle generic purchase event', error);
    }
  }

  /**
   * Clear cart data after purchase
   */
  private clearCartData(): void {
    try {
      safeLocalStorage.removeItem('kalifind_cart_data');
      (window as Window & { kalifindCart?: CartData }).kalifindCart = undefined;
      logger.debug('Cart data cleared after purchase');
    } catch (error) {
      logger.warn('Failed to clear cart data', error);
    }
  }

  /**
   * Stop tracking (cleanup)
   */
  public destroy(): void {
    if (this.urlCheckInterval) {
      clearInterval(this.urlCheckInterval);
      this.urlCheckInterval = null;
    }
    logger.debug('Purchase tracking destroyed');
  }
}

// Export singleton instance
let purchaseTrackerInstance: PurchaseTracker | null = null;

export const initializePurchaseTracking = (): PurchaseTracker => {
  if (!purchaseTrackerInstance) {
    purchaseTrackerInstance = new PurchaseTracker();
  }
  return purchaseTrackerInstance;
};

export const destroyPurchaseTracking = (): void => {
  if (purchaseTrackerInstance) {
    purchaseTrackerInstance.destroy();
    purchaseTrackerInstance = null;
  }
};
