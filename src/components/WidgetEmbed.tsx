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
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Listen for host-page open/search events
   * - 'kalifinder:open' opens the widget and optionally seeds a query
   * detail: { query?: string }
   */
  useEffect(() => {
    const handleOpen = (evt: Event) => {
      // Using CustomEvent to access detail safely
      const ce = evt as KalifinderOpenEvent;
      const q = ce?.detail?.query ?? '';
      setIsOpen(true);
      if (typeof q === 'string') {
        setSearchQuery(q);
        setHasSearched(Boolean(q.trim()));
      }
      console.log('[KaliFinder] Received open event from host with query:', q);
    };

    window.addEventListener('kalifinder:open', handleOpen as EventListener);
    return () => {
      window.removeEventListener('kalifinder:open', handleOpen as EventListener);
    };
  }, []);

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
          </div>
        </div>
      )}
    </div>
  );
}
