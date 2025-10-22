/**
 * Widget Factory and Bootstrap
 * Initializes and configures the search widget instance
 */

import type { WidgetConfig } from '@/config/widget-config';
import {
  DEFAULT_WIDGET_CONFIG,
  mergeWidgetConfig,
  validateWidgetConfig,
} from '@/config/widget-config';
import { ApiClient } from '@/services/api-client';

/**
 * Singleton pattern for widget instances
 */
const widgetInstances = new Map<string, WidgetFactory>();

/**
 * Widget Factory Class
 * Manages widget creation, configuration, and lifecycle
 */
export class WidgetFactory {
  private config: WidgetConfig;
  private apiClient: ApiClient;
  private isInitialized: boolean = false;

  constructor(userConfig?: Partial<WidgetConfig>) {
    // Merge user config with defaults
    this.config = mergeWidgetConfig(userConfig || {}, DEFAULT_WIDGET_CONFIG);

    // Validate configuration
    const validation = validateWidgetConfig(this.config);
    if (!validation.valid) {
      console.error('Invalid widget configuration:', validation.errors);
      throw new Error(`Widget configuration validation failed: ${validation.errors.join(', ')}`);
    }

    // Initialize API client
    this.apiClient = new ApiClient(this.config);
  }

  /**
   * Get widget configuration
   */
  getConfig(): WidgetConfig {
    return this.config;
  }

  /**
   * Get API client instance
   */
  getApiClient(): ApiClient {
    return this.apiClient;
  }

  /**
   * Update configuration at runtime
   */
  updateConfig(updates: Partial<WidgetConfig>): void {
    this.config = mergeWidgetConfig(updates, this.config);

    const validation = validateWidgetConfig(this.config);
    if (!validation.valid) {
      throw new Error(`Invalid configuration update: ${validation.errors.join(', ')}`);
    }
  }

  /**
   * Initialize widget
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('Widget already initialized');
      return;
    }

    try {
      // Pre-load popular searches if enabled
      if (this.config.features.enableAutocomplete) {
        // This would be called from components when needed
      }

      this.isInitialized = true;
      console.log(`[${this.config.instanceId}] Widget initialized successfully`);
    } catch (error) {
      console.error('Widget initialization failed:', error);
      throw error;
    }
  }

  /**
   * Destroy widget and clean up resources
   */
  destroy(): void {
    this.apiClient.clearCache();
    this.isInitialized = false;
    console.log(`[${this.config.instanceId}] Widget destroyed`);
  }

  /**
   * Check if widget is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

/**
 * Create or get widget factory instance
 */
export function createWidgetFactory(userConfig?: Partial<WidgetConfig>): WidgetFactory {
  const config = mergeWidgetConfig(userConfig || {}, DEFAULT_WIDGET_CONFIG);
  const instanceId = config.instanceId;

  // Return existing instance if already created
  if (widgetInstances.has(instanceId)) {
    return widgetInstances.get(instanceId)!;
  }

  // Create new instance
  const factory = new WidgetFactory(userConfig);
  widgetInstances.set(instanceId, factory);

  return factory;
}

/**
 * Get existing widget factory instance
 */
export function getWidgetFactory(instanceId: string): WidgetFactory | undefined {
  return widgetInstances.get(instanceId);
}

/**
 * List all active widget instances
 */
export function getActiveWidgets(): WidgetFactory[] {
  return Array.from(widgetInstances.values());
}

/**
 * Destroy specific widget instance
 */
export function destroyWidget(instanceId: string): void {
  const widget = widgetInstances.get(instanceId);
  if (widget) {
    widget.destroy();
    widgetInstances.delete(instanceId);
  }
}

/**
 * Destroy all widget instances
 */
export function destroyAllWidgets(): void {
  widgetInstances.forEach((widget) => {
    widget.destroy();
  });
  widgetInstances.clear();
}

/**
 * Global window API for embedding
 */
declare global {
  interface Window {
    KalifinderSearch: {
      create: (config?: Partial<WidgetConfig>) => WidgetFactory;
      get: (instanceId: string) => WidgetFactory | undefined;
      destroy: (instanceId: string) => void;
      destroyAll: () => void;
      getActive: () => WidgetFactory[];
    };
  }
}

/**
 * Initialize global API
 */
export function initializeGlobalAPI(): void {
  if (!window.KalifinderSearch) {
    window.KalifinderSearch = {
      create: createWidgetFactory,
      get: getWidgetFactory,
      destroy: destroyWidget,
      destroyAll: destroyAllWidgets,
      getActive: getActiveWidgets,
    };
  }
}
