/**
 * Purchase Tracking Debug Helper
 * Provides debugging utilities for purchase tracking functionality
 */

interface DebugInfo {
  timestamp: number;
  event: string;
  data: Record<string, unknown>;
  url: string;
  userAgent: string;
}

class PurchaseTrackingDebugHelper {
  private static instance: PurchaseTrackingDebugHelper;
  private debugLogs: DebugInfo[] = [];
  private isEnabled = false;
  private maxLogs = 100;

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): PurchaseTrackingDebugHelper {
    if (!PurchaseTrackingDebugHelper.instance) {
      PurchaseTrackingDebugHelper.instance = new PurchaseTrackingDebugHelper();
    }
    return PurchaseTrackingDebugHelper.instance;
  }

  /**
   * Enable/disable debug logging
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log(`🔍 Purchase Tracking Debug: ${enabled ? 'ENABLED' : 'DISABLED'}`);

    if (enabled) {
      this.log('debug_enabled', { enabled: true });
    }
  }

  /**
   * Log debug information
   */
  public log(event: string, data: Record<string, unknown> = {}): void {
    if (!this.isEnabled) return;

    const debugInfo: DebugInfo = {
      timestamp: Date.now(),
      event,
      data,
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    this.debugLogs.push(debugInfo);

    // Keep only the last maxLogs entries
    if (this.debugLogs.length > this.maxLogs) {
      this.debugLogs = this.debugLogs.slice(-this.maxLogs);
    }

    // Save to localStorage
    this.saveToStorage();

    // Console output
    console.group(`🔍 Purchase Tracking Debug: ${event}`);
    console.log('Timestamp:', new Date(debugInfo.timestamp).toISOString());
    console.log('URL:', debugInfo.url);
    console.log('Data:', data);
    console.groupEnd();
  }

  /**
   * Get all debug logs
   */
  public getLogs(): DebugInfo[] {
    return [...this.debugLogs];
  }

  /**
   * Get logs for a specific event
   */
  public getLogsByEvent(event: string): DebugInfo[] {
    return this.debugLogs.filter((log) => log.event === event);
  }

  /**
   * Get recent logs (last N entries)
   */
  public getRecentLogs(count: number = 10): DebugInfo[] {
    return this.debugLogs.slice(-count);
  }

  /**
   * Clear all debug logs
   */
  public clearLogs(): void {
    this.debugLogs = [];
    this.saveToStorage();
    console.log('🧹 Purchase Tracking Debug: Logs cleared');
  }

  /**
   * Export logs as JSON
   */
  public exportLogs(): string {
    const exportData = {
      exportTime: new Date().toISOString(),
      totalLogs: this.debugLogs.length,
      logs: this.debugLogs,
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Save logs to localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem('kalifind_purchase_debug_logs', JSON.stringify(this.debugLogs));
    } catch (error) {
      console.warn('Failed to save debug logs to storage:', error);
    }
  }

  /**
   * Load logs from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('kalifind_purchase_debug_logs');
      if (stored) {
        this.debugLogs = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load debug logs from storage:', error);
    }
  }

  /**
   * Test purchase tracking functionality
   */
  public runTests(): void {
    if (!this.isEnabled) {
      console.warn('Debug mode is not enabled. Call setEnabled(true) first.');
      return;
    }

    console.group('🧪 Running Purchase Tracking Tests');

    // Test 1: URL Monitoring
    this.testUrlMonitoring();

    // Test 2: Cart Data
    this.testCartData();

    // Test 3: UBI Client
    this.testUBIClient();

    // Test 4: Purchase Tracking Helper
    this.testPurchaseTrackingHelper();

    console.groupEnd();
  }

  /**
   * Test URL monitoring functionality
   */
  private testUrlMonitoring(): void {
    console.log('🔍 Testing URL Monitoring...');

    const currentUrl = window.location.href;
    const pathname = window.location.pathname;

    this.log('url_monitoring_test', {
      currentUrl,
      pathname,
      isCheckout: this.isCheckoutUrl(currentUrl),
      isThankYou: this.isThankYouUrl(currentUrl),
    });
  }

  /**
   * Test cart data functionality
   */
  private testCartData(): void {
    console.log('🛒 Testing Cart Data...');

    try {
      const kalifindCart = localStorage.getItem('kalifind_cart_data');
      const shopifyCart = localStorage.getItem('cart');

      this.log('cart_data_test', {
        kalifindCartExists: !!kalifindCart,
        shopifyCartExists: !!shopifyCart,
        kalifindCartData: kalifindCart ? JSON.parse(kalifindCart) : null,
        shopifyCartData: shopifyCart ? JSON.parse(shopifyCart) : null,
      });
    } catch (error) {
      this.log('cart_data_error', { error: (error as Error).message });
    }
  }

  /**
   * Test UBI client functionality
   */
  private testUBIClient(): void {
    console.log('📊 Testing UBI Client...');

    try {
      import('./ubiClient')
        .then(({ getUBIClient }) => {
          const ubiClient = getUBIClient();
          const clientData = ubiClient as unknown as {
            vendorId?: string;
            storeId?: string;
            sessionId?: string;
          } | null;

          this.log('ubi_client_test', {
            clientExists: !!ubiClient,
            vendorId: clientData?.vendorId,
            storeId: clientData?.storeId,
            sessionId: clientData?.sessionId,
          });
        })
        .catch((error) => {
          this.log('ubi_client_error', { error: error.message });
        });
    } catch (error) {
      this.log('ubi_client_import_error', { error: (error as Error).message });
    }
  }

  /**
   * Test purchase tracking helper functionality
   */
  private testPurchaseTrackingHelper(): void {
    console.log('🛒 Testing Purchase Tracking Helper...');

    try {
      import('./purchaseTrackingHelper')
        .then(({ purchaseTrackingHelper }) => {
          const config = purchaseTrackingHelper.getConfig();
          const stats = purchaseTrackingHelper.getTrackingStats();

          this.log('purchase_helper_test', {
            config,
            stats,
          });
        })
        .catch((error) => {
          this.log('purchase_helper_error', { error: error.message });
        });
    } catch (error) {
      this.log('purchase_helper_import_error', { error: (error as Error).message });
    }
  }

  /**
   * Check if URL is a checkout URL
   */
  private isCheckoutUrl(url: string): boolean {
    const checkoutPatterns = [
      /\/checkout$/i,
      /\/checkout\//i,
      /\/cart\/checkout/i,
      /\/payment/i,
      /\/shop\/checkout/i,
    ];

    return checkoutPatterns.some((pattern) => pattern.test(url));
  }

  /**
   * Check if URL is a thank you URL
   */
  private isThankYouUrl(url: string): boolean {
    const thankYouPatterns = [
      /\/thank_you/i,
      /\/thank-you/i,
      /\/order_confirmation/i,
      /\/order-confirmation/i,
      /\/checkout\/thank_you/i,
      /\/checkout\/thank-you/i,
    ];

    return thankYouPatterns.some((pattern) => pattern.test(url));
  }

  /**
   * Generate debug report
   */
  public generateReport(): string {
    const recentLogs = this.getRecentLogs(20);
    const summary = {
      totalLogs: this.debugLogs.length,
      recentLogs: recentLogs.length,
      currentUrl: window.location.href,
      timestamp: new Date().toISOString(),
      logs: recentLogs,
    };

    return JSON.stringify(summary, null, 2);
  }

  /**
   * Print debug summary to console
   */
  public printSummary(): void {
    if (!this.isEnabled) {
      console.log('🔍 Debug mode is disabled. Call debugHelper.setEnabled(true) to enable.');
      return;
    }

    console.group('🔍 Purchase Tracking Debug Summary');
    console.log('Total Logs:', this.debugLogs.length);
    console.log('Current URL:', window.location.href);
    console.log('Recent Events:');

    const recentLogs = this.getRecentLogs(5);
    recentLogs.forEach((log) => {
      console.log(`  ${new Date(log.timestamp).toLocaleTimeString()} - ${log.event}`);
    });

    console.log('');
    console.log('💡 Commands:');
    console.log('  debugHelper.getLogs() - Get all logs');
    console.log('  debugHelper.exportLogs() - Export logs as JSON');
    console.log('  debugHelper.runTests() - Run diagnostic tests');
    console.log('  debugHelper.clearLogs() - Clear all logs');

    console.groupEnd();
  }
}

// Export singleton instance
export const debugHelper = PurchaseTrackingDebugHelper.getInstance();

// Make available globally for easy access in browser console
if (typeof window !== 'undefined') {
  (window as Window & { kalifindDebug?: typeof debugHelper }).kalifindDebug = debugHelper;
}
