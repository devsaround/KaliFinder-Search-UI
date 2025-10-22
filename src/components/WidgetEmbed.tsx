/**
 * WidgetEmbed Component
 * Handles Shadow DOM isolation and event management for embedded widget
 *
 * Key features:
 * - Shadow DOM prevents CSS conflicts with host website
 * - Only listens to Kalifinder search icon clicks
 * - Does NOT intercept host website search elements
 * - Self-contained styling and behavior
 */

import { useEffect, useRef, useState } from 'react';
import styles from '../index.css?inline';
import KalifindSearch from './KalifindSearch';
import WidgetTrigger from './WidgetTrigger';

interface WidgetEmbedProps {
  containerId: string;
  storeUrl: string;
}

export default function WidgetEmbed({ containerId, storeUrl }: WidgetEmbedProps) {
  const [isOpen, setIsOpen] = useState(false);
  const shadowRootRef = useRef<ShadowRoot | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Create Shadow DOM for style isolation
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`[KaliFinder] Container ${containerId} not found`);
      return;
    }

    // Attach shadow root with 'open' mode for debugging (use 'closed' for production security)
    if (!shadowRootRef.current) {
      shadowRootRef.current = container.attachShadow({ mode: 'open' });

      // Inject styles into shadow DOM
      const styleSheet = document.createElement('style');
      styleSheet.textContent = styles;
      shadowRootRef.current.appendChild(styleSheet);

      // Create content wrapper
      const contentWrapper = document.createElement('div');
      contentWrapper.className = 'kalifinder-widget-embed';
      contentWrapper.setAttribute('data-store-url', storeUrl);
      shadowRootRef.current.appendChild(contentWrapper);

      console.log('[KaliFinder] Shadow DOM created for isolation');
    }
  }, [containerId, storeUrl]);

  /**
   * Handle trigger button click - only responds to Kalifinder icon
   */
  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling to host page
    setIsOpen(!isOpen);
    console.log('[KaliFinder] Widget toggled:', isOpen ? 'closed' : 'open');
  };

  /**
   * Close widget when clicking outside
   */
  const handleBackdropClick = () => {
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="kalifinder-widget-root" data-testid="widget-embed">
      {/* Minimal trigger button - search icon only */}
      {!isOpen && <WidgetTrigger onClick={handleTriggerClick} storeUrl={storeUrl} />}

      {/* Full widget in modal - only visible when triggered */}
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
                searchQuery=""
                setSearchQuery={() => {}}
                hasSearched={false}
                setHasSearched={() => {}}
                storeUrl={storeUrl}
              />
            </div>
          </div>
        </div>
      )}

      {/* Hidden trigger button indicator when widget is open (accessibility) */}
      {isOpen && (
        <div className="kalifinder-widget-trigger-hidden" role="status" aria-live="polite">
          Search widget is open
        </div>
      )}
    </div>
  );
}
