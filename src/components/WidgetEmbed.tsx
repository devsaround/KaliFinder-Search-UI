/**
 * WidgetEmbed Component
 * Handles event management for embedded widget inside Shadow DOM
 *
 * Key features:
 * - Rendered inside Shadow DOM for complete CSS/JS isolation
 * - Host website CSS cannot affect widget styles
 * - Widget CSS cannot leak to host website
 * - Event isolation with capture phase handling
 */

import { useEffect, useRef, useState } from 'react';
import KalifindSearch from './KalifindSearch';

interface WidgetEmbedProps {
  storeUrl: string;
}

// Type definition for custom Kalifinder events
interface KalifinderOpenEvent extends CustomEvent {
  detail: { query?: string };
}

export default function WidgetEmbed({ storeUrl }: WidgetEmbedProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Listen for host-page open/search events
   * - 'kalifinder:open' opens the widget and optionally seeds a query
   * detail: { query?: string }
   */
  useEffect(() => {
    async function checkWidgetReady(): Promise<void> {
      try {
        const baseUrl = import.meta.env.VITE_BACKEND_URL || '';
        // Resolve storeId and storeType from storeUrl
        const rcUrl = new URL('/api/v1/search/recommendations-config', baseUrl);
        rcUrl.searchParams.append('storeUrl', storeUrl);
        const rcRes = await fetch(rcUrl.toString());
        if (!rcRes.ok) {
          setIsReady(null);
          return;
        }
        const rcJson = (await rcRes.json()) as {
          storeId?: number;
          storeType?: 'shopify' | 'woocommerce';
        };
        if (!rcJson.storeId || !rcJson.storeType) {
          setIsReady(null);
          return;
        }
        // Call widget-ready
        const wrUrl = new URL('/api/v1/analytics-status/widget-ready', baseUrl);
        wrUrl.searchParams.append('storeId', String(rcJson.storeId));
        wrUrl.searchParams.append('storeType', rcJson.storeType);
        const wrRes = await fetch(wrUrl.toString());
        if (!wrRes.ok) {
          setIsReady(null);
          return;
        }
        const wrJson = (await wrRes.json()) as { ready: boolean };
        setIsReady(Boolean(wrJson.ready));
      } catch {
        setIsReady(null);
      }
    }

    const handleOpen = (evt: Event) => {
      // Using CustomEvent to access detail safely
      const ce = evt as KalifinderOpenEvent;
      const q = ce?.detail?.query ?? '';
      setIsOpen(true);
      if (typeof q === 'string') {
        setSearchQuery(q);
        setHasSearched(Boolean(q.trim()));
      }
      if (import.meta.env.DEV)
        console.warn('[KaliFinder] Received open event from host with query:', q);
      void checkWidgetReady();
    };

    window.addEventListener('kalifinder:open', handleOpen as EventListener);
    return () => {
      window.removeEventListener('kalifinder:open', handleOpen as EventListener);
    };
  }, [storeUrl]);

  /**
   * Close widget when clicking outside
   */
  const handleBackdropClick = () => {
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="kalifinder-widget-root" data-testid="widget-embed">
      {/* Full widget in modal - only visible when triggered by host page */}
      {isOpen && (
        <div className="kalifinder-widget-modal" onClick={handleBackdropClick}>
          <div
            className="kalifinder-widget-modal-content"
            onClick={(e) => e.stopPropagation()} // Prevent modal close on content click
          >
            {isReady === false && (
              <div className="kalifinder-widget-banner" role="status" aria-live="polite">
                Indexing in progress. Results may be limited.
              </div>
            )}
            {/* Close button */}
            <button
              className="kalifinder-widget-modal-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close search widget"
              title="Close"
            >
              ✕
            </button>

            {/* Search widget */}
            <div className="kalifinder-widget-content">
              <KalifindSearch
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                hasSearched={hasSearched}
                setHasSearched={setHasSearched}
                storeUrl={storeUrl}
              />
            </div>

            {/* Footer - floating at bottom right */}
            <div className="absolute right-0 bottom-0 z-50 mr-4 mb-4">
              <span className="text-muted-foreground rounded-full bg-white px-3 py-2 text-xs shadow-md">
                Powered by KaliFinder
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
