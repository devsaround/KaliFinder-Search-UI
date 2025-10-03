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
        query_suggestions_used: querySuggestionsUsed
      },
      timestamp: new Date().toISOString()
    });
  }
  
  // Track filter clicks
  trackFilterClick(field: string, value: string) {
    this.addEvent({
      event_name: 'filter_clicked',
      event_details: { field, value },
      timestamp: new Date().toISOString()
    });
  }
  
  // Track result clicks
  trackResultClick(productId: string, position: number, queryId?: string) {
    this.addEvent({
      event_name: 'result_clicked',
      event_details: { 
        product_id: productId, 
        position,
        query_id: queryId
      },
      timestamp: new Date().toISOString()
    });
  }
  
  // Track button clicks
  trackButtonClick(buttonName: string, context: string) {
    this.addEvent({
      event_name: 'button_clicked',
      event_details: { 
        button_name: buttonName,
        context
      },
      timestamp: new Date().toISOString()
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
      platform: this.platform
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
    
    try {
      // Use sendBeacon for reliability during page unload
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(eventsToSend)], {
          type: 'application/json'
        });
                navigator.sendBeacon('http://localhost:8000/api/ubi/collect', blob);
      } else {
        // Fallback to fetch
        await fetch('http://localhost:8000/api/ubi/collect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventsToSend)
        });
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
    let sessionExpiry = localStorage.getItem(sessionExpiryKey);
    
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
  
  // Get vendor ID from page context
  private getVendorId(): string {
    // Try to get from data attributes or global variables
    const vendorElement = document.querySelector('[data-vendor-id]');
    if (vendorElement) {
      return vendorElement.getAttribute('data-vendor-id') || 'unknown';
    }
    
    // Check for global variable
    if ((window as any).KALIFIND_VENDOR_ID) {
      return (window as any).KALIFIND_VENDOR_ID;
    }
    
    return 'unknown';
  }
  
  // Get store ID from page context
  private getStoreId(): string {
    // Try to get from data attributes or global variables
    const storeElement = document.querySelector('[data-store-id]');
    if (storeElement) {
      return storeElement.getAttribute('data-store-id') || 'unknown';
    }
    
    // Check for global variable
    if ((window as any).KALIFIND_STORE_ID) {
      return (window as any).KALIFIND_STORE_ID;
    }
    
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