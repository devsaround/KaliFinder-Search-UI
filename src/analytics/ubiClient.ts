/**
 * UBI Client for Storefront
 * Handles UBI event tracking for the storefront embed
 */

class UBIClient {
  private events: any[] = [];
  private sessionId: string;
  private anonymousId: string;
  private vendorId: string;
  private storeId: string;
  private platform: string;
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.anonymousId = this.getOrCreateAnonymousId();
    this.vendorId = this.getVendorId();
    this.storeId = this.getStoreId();
    this.platform = this.getPlatform();

    // Set up page unload handler
    window.addEventListener('pagehide', () => this.flush());
    window.addEventListener('beforeunload', () => this.flush());
  }

  // Track search submission
  trackSearchSubmitted(query: string, querySuggestionsUsed: boolean = false) {
    this.addEvent({
      event_name: 'search_submitted',
      event_details: {
        search_query: query,
        query_suggestions_used: querySuggestionsUsed,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // Track filter clicks
  trackFilterClick(field: string, value: string) {
    this.addEvent({
      event_name: 'filter_clicked',
      event_details: { field, value },
      timestamp: new Date().toISOString(),
    });
  }

  // Track result clicks
  trackResultClick(productId: string, position: number, queryId?: string) {
    this.addEvent({
      event_name: 'result_clicked',
      event_details: {
        product_id: productId,
        position,
        query_id: queryId,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // Track button clicks
  trackButtonClick(buttonName: string, context: string) {
    this.addEvent({
      event_name: 'button_clicked',
      event_details: {
        button_name: buttonName,
        context,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // Track add-to-cart events
  trackAddToCart(productId: string, productTitle: string, price: number, quantity: number = 1) {
    this.addEvent({
      event_name: 'add_to_cart',
      event_details: {
        product_id: productId,
        product_title: productTitle,
        price: price,
        quantity: quantity,
        cart_value: price * quantity,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // Track checkout initiation
  trackCheckoutInitiated(cartValue: number, itemCount: number, productIds: string[]) {
    this.addEvent({
      event_name: 'checkout_initiated',
      event_details: {
        cart_value: cartValue,
        item_count: itemCount,
        product_ids: productIds,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // Track purchase completion
  trackPurchaseCompleted(
    orderId: string,
    revenue: number,
    productIds: string[],
    currency: string = 'USD'
  ) {
    this.addEvent({
      event_name: 'purchase_completed',
      event_details: {
        order_id: orderId,
        revenue: revenue,
        product_ids: productIds,
        currency: currency,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // Add event to batch
  private addEvent(event: any) {
    this.events.push({
      ...event,
      session_id: this.sessionId,
      anonymous_id: this.anonymousId,
      vendor_id: this.vendorId,
      store_id: this.storeId,
      platform: this.platform,
    });

    // Auto-flush if batch is full
    if (this.events.length >= 10) {
      this.flush();
    } else {
      // Set up delayed flush
      this.scheduleFlush();
    }
  }

  // Schedule delayed flush
  private scheduleFlush() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }

    this.flushTimer = setTimeout(() => {
      this.flush();
    }, 5000); // 5 second delay
  }

  // Flush events to backend
  private async flush() {
    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];
    this.events = [];

    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    // Require backend URL environment variable
    if (!import.meta.env.VITE_BACKEND_URL) {
      console.error('VITE_BACKEND_URL environment variable is required');
      return;
    }
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const collectUrl = `${backendUrl}/v1/analytics/ubi/collect`;

    console.log('UBI Client: Flushing events to backend:', {
      count: eventsToSend.length,
      events: eventsToSend,
      backendUrl: collectUrl,
    });

    try {
      // Use sendBeacon for reliability during page unload
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify({ events: eventsToSend })], {
          type: 'application/json',
        });
        const success = navigator.sendBeacon(collectUrl, blob);
        console.log('UBI Client: SendBeacon result:', success);
      } else {
        // Fallback to fetch
        const response = await fetch(collectUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events: eventsToSend }),
        });
        console.log('UBI Client: Fetch response:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to send UBI events:', error);
      // Re-add events to queue for retry
      this.events.unshift(...eventsToSend);
    }
  }

  // Get or create session ID
  private getOrCreateSessionId(): string {
    const sessionKey = 'ubi_session_id';
    const sessionExpiryKey = 'ubi_session_expiry';
    const now = Date.now();
    const sessionTimeout = 30 * 60 * 1000; // 30 minutes

    let sessionId = localStorage.getItem(sessionKey);
    const sessionExpiry = localStorage.getItem(sessionExpiryKey);

    // Check if session expired
    if (sessionId && sessionExpiry && now < parseInt(sessionExpiry)) {
      return sessionId;
    }

    // Create new session
    sessionId = `sess_${now}_${Math.random().toString(36).substr(2, 9)}`;
    const newExpiry = now + sessionTimeout;

    localStorage.setItem(sessionKey, sessionId);
    localStorage.setItem(sessionExpiryKey, newExpiry.toString());

    return sessionId;
  }

  // Get or create anonymous ID
  private getOrCreateAnonymousId(): string {
    const anonKey = 'ubi_anonymous_id';
    let anonymousId = localStorage.getItem(anonKey);

    if (!anonymousId) {
      anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(anonKey, anonymousId);
    }

    return anonymousId;
  }

  // Get vendor ID from global variable (set by embed script)
  private getVendorId(): string {
    // Check for global variable set by embed script
    if ((window as any).KALIFIND_VENDOR_ID) {
      const vendorId = (window as any).KALIFIND_VENDOR_ID;
      console.log('UBI Client: Found vendor ID from global variable:', vendorId);
      return vendorId;
    }

    console.warn('UBI Client: No vendor ID found, using unknown');
    return 'unknown';
  }

  // Get store ID from global variable (set by embed script)
  private getStoreId(): string {
    // Check for global variable set by embed script
    if ((window as any).KALIFIND_STORE_ID) {
      const storeId = (window as any).KALIFIND_STORE_ID;
      console.log('UBI Client: Found store ID from global variable:', storeId);
      return storeId;
    }

    console.warn('UBI Client: No store ID found, using unknown');
    return 'unknown';
  }

  // Get platform from page context
  private getPlatform(): string {
    // Try to get from data attributes or global variables
    const platformElement = document.querySelector('[data-platform]');
    if (platformElement) {
      return platformElement.getAttribute('data-platform') || 'unknown';
    }

    // Check for global variable
    if ((window as any).KALIFIND_PLATFORM) {
      return (window as any).KALIFIND_PLATFORM;
    }

    // Detect from URL or other indicators
    if (window.location.hostname.includes('shopify')) {
      return 'shopify';
    } else if (window.location.hostname.includes('woocommerce')) {
      return 'woocommerce';
    }

    return 'unknown';
  }
}

// Export singleton instance
export const getUBIClient = () => new UBIClient();
