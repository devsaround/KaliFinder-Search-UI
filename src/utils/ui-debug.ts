/**
 * UI Scaling Debug Logger
 * Comprehensive logging to diagnose WordPress vs Shopify scaling issues
 */

interface WindowWithDebug extends Window {
  __KALIFINDER_UI_DEBUG__?: UIScalingDebugger;
  wp?: unknown;
}

class UIScalingDebugger {
  private static instance: UIScalingDebugger;
  private platformType: 'shopify' | 'wordpress' | 'unknown' = 'unknown';

  private constructor() {
    this.detectPlatform();
  }

  public static getInstance(): UIScalingDebugger {
    if (!UIScalingDebugger.instance) {
      UIScalingDebugger.instance = new UIScalingDebugger();
    }
    return UIScalingDebugger.instance;
  }

  private detectPlatform(): void {
    const hostname = window.location.hostname;
    const bodyClasses = document.body.className;
    const htmlClasses = document.documentElement.className;

    if (
      hostname.includes('myshopify.com') ||
      bodyClasses.includes('shopify') ||
      htmlClasses.includes('shopify')
    ) {
      this.platformType = 'shopify';
    } else if (
      bodyClasses.includes('wordpress') ||
      bodyClasses.includes('wp-') ||
      htmlClasses.includes('wp-') ||
      typeof (window as WindowWithDebug).wp !== 'undefined'
    ) {
      this.platformType = 'wordpress';
    }
  }
  public logInitialization(shadowRoot: ShadowRoot): void {
    console.group('🔍 KaliFinder UI Scaling Debug - Initialization');
    console.log('Platform:', this.platformType.toUpperCase());
    console.log('URL:', window.location.href);
    console.log('User Agent:', navigator.userAgent);
    console.log('Viewport:', `${window.innerWidth}x${window.innerHeight}`);
    console.log('Device Pixel Ratio:', window.devicePixelRatio);
    console.groupEnd();

    // Log parent page styles that might affect the widget
    this.logParentPageStyles();

    // Log shadow root styles
    this.logShadowRootStyles(shadowRoot);
  }

  private logParentPageStyles(): void {
    console.group('📄 Parent Page Styles (Potential Interference)');

    const bodyStyles = window.getComputedStyle(document.body);
    const htmlStyles = window.getComputedStyle(document.documentElement);

    console.log('HTML Element:');
    console.log('  - font-size:', htmlStyles.fontSize);
    console.log('  - zoom:', htmlStyles.zoom || '1');
    console.log('  - transform:', htmlStyles.transform);

    console.log('Body Element:');
    console.log('  - font-size:', bodyStyles.fontSize);
    console.log('  - zoom:', bodyStyles.zoom || '1');
    console.log('  - transform:', bodyStyles.transform);
    console.log('  - -webkit-text-size-adjust:', bodyStyles.webkitTextSizeAdjust || 'auto');

    console.groupEnd();
  }

  private logShadowRootStyles(shadowRoot: ShadowRoot): void {
    console.group('🌑 Shadow Root Styles');

    // Get the host element styles
    const hostElement = shadowRoot.host as HTMLElement;
    const hostStyles = window.getComputedStyle(hostElement);

    console.log('Host Element (:host):');
    console.log('  - font-size:', hostStyles.fontSize);
    console.log('  - zoom:', hostStyles.zoom || '1');
    console.log('  - transform:', hostStyles.transform);
    console.log('  - width:', hostStyles.width);
    console.log('  - height:', hostStyles.height);

    console.groupEnd();
  }

  public logWidgetMount(widgetRoot: HTMLElement): void {
    console.group('🎨 Widget Mount - Element Measurements');

    const rect = widgetRoot.getBoundingClientRect();
    const styles = window.getComputedStyle(widgetRoot);

    console.log('Widget Root Element:');
    console.log('  - Dimensions:', `${rect.width.toFixed(2)}px x ${rect.height.toFixed(2)}px`);
    console.log('  - Position:', `top: ${rect.top.toFixed(2)}px, left: ${rect.left.toFixed(2)}px`);
    console.log('  - font-size:', styles.fontSize);
    console.log('  - transform:', styles.transform);
    console.log('  - zoom:', styles.zoom || '1');
    console.log('  - scale:', this.calculateEffectiveScale(widgetRoot));

    console.groupEnd();
  }

  public logFilterSidebar(sidebarElement: HTMLElement | null): void {
    if (!sidebarElement) {
      console.warn('⚠️ Filter sidebar element not found');
      return;
    }

    console.group('📊 Filter Sidebar Measurements');

    const rect = sidebarElement.getBoundingClientRect();
    const styles = window.getComputedStyle(sidebarElement);

    console.log('Sidebar Element:');
    console.log('  - Dimensions:', `${rect.width.toFixed(2)}px x ${rect.height.toFixed(2)}px`);
    console.log('  - Expected width: 280px (--kf-sidebar-width)');
    console.log('  - Actual width:', styles.width);
    console.log('  - Scale ratio:', (rect.width / 280).toFixed(4));
    console.log('  - font-size:', styles.fontSize);
    console.log('  - transform:', styles.transform);

    console.groupEnd();
  }

  public logProductCard(cardElement: HTMLElement | null): void {
    if (!cardElement) {
      console.warn('⚠️ Product card element not found');
      return;
    }

    console.group('🛍️ Product Card Measurements');

    const rect = cardElement.getBoundingClientRect();
    const styles = window.getComputedStyle(cardElement);

    console.log('Product Card Element:');
    console.log('  - Dimensions:', `${rect.width.toFixed(2)}px x ${rect.height.toFixed(2)}px`);
    console.log('  - font-size:', styles.fontSize);
    console.log('  - transform:', styles.transform);
    console.log('  - Scale:', this.calculateEffectiveScale(cardElement));

    console.groupEnd();
  }

  private calculateEffectiveScale(element: HTMLElement): string {
    const rect = element.getBoundingClientRect();
    const computed = window.getComputedStyle(element);

    // Try to get declared width from CSS
    const declaredWidth = parseFloat(computed.width);

    if (declaredWidth && rect.width) {
      const scale = rect.width / declaredWidth;
      return `${scale.toFixed(4)} (${scale === 1 ? '✅ correct' : '⚠️ scaled'})`;
    }

    return 'unknown';
  }

  public logResponsiveBreakpoint(): void {
    const width = window.innerWidth;
    let breakpoint = '';

    if (width < 640) breakpoint = 'mobile (<640px)';
    else if (width < 768) breakpoint = 'sm (640-767px)';
    else if (width < 1024) breakpoint = 'md (768-1023px)';
    else if (width < 1280) breakpoint = 'lg (1024-1279px)';
    else if (width < 1536) breakpoint = 'xl (1280-1535px)';
    else breakpoint = '2xl (≥1536px)';

    console.log(`📱 Current Breakpoint: ${breakpoint} (width: ${width}px)`);
  }

  public logScalingIssue(element: HTMLElement, expected: string, actual: string): void {
    console.group('❌ SCALING ISSUE DETECTED');
    console.error('Element:', element);
    console.error('Expected:', expected);
    console.error('Actual:', actual);
    console.error('Platform:', this.platformType);

    const styles = window.getComputedStyle(element);
    const extendedStyles = styles as CSSStyleDeclaration & {
      webkitTransform?: string;
      webkitTextSizeAdjust?: string;
    };

    console.error('Computed Styles:', {
      fontSize: styles.fontSize,
      zoom: styles.zoom || '1',
      transform: styles.transform,
      webkitTransform: extendedStyles.webkitTransform,
      webkitTextSizeAdjust: extendedStyles.webkitTextSizeAdjust,
    });

    console.groupEnd();
  }
  public logPerformanceMetrics(): void {
    if (typeof performance === 'undefined') return;

    console.group('⚡ Performance Metrics');

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      console.log('Page Load Time:', `${navigation.loadEventEnd - navigation.fetchStart}ms`);
      console.log(
        'DOM Content Loaded:',
        `${navigation.domContentLoadedEventEnd - navigation.fetchStart}ms`
      );
    }

    const paint = performance.getEntriesByType('paint');
    paint.forEach((entry) => {
      console.log(`${entry.name}:`, `${entry.startTime.toFixed(2)}ms`);
    });

    console.groupEnd();
  }

  public enableContinuousMonitoring(): void {
    console.log('🔄 Enabling continuous UI monitoring...');

    // Monitor for any transform/zoom changes every 2 seconds
    setInterval(() => {
      const widgetRoot = document.querySelector('.kalifinder-widget-root') as HTMLElement;
      if (widgetRoot) {
        const styles = window.getComputedStyle(widgetRoot);
        const transform = styles.transform;
        const zoom = styles.zoom || '1';

        if (transform !== 'none') {
          console.warn('⚠️ Transform detected on widget root:', transform);
        }

        if (zoom !== '1') {
          console.warn('⚠️ Zoom detected on widget root:', zoom);
        }
      }
    }, 2000);
  }

  public getPlatform(): string {
    return this.platformType;
  }
}

// Export singleton instance
export const uiDebugger = UIScalingDebugger.getInstance();

// Make available globally for console debugging
if (typeof window !== 'undefined') {
  (window as WindowWithDebug).__KALIFINDER_UI_DEBUG__ = uiDebugger;
  console.log('💡 UI Debug utility available at: window.__KALIFINDER_UI_DEBUG__');
}
