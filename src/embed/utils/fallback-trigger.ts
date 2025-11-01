/**
 * Fallback Trigger
 * Creates a floating search button when no native search elements are found
 */

import { log } from './logger';

export type OpenWidgetFn = (query?: string) => void;

/**
 * Create fallback trigger button with inline styles
 * Returns button element that can be removed later
 */
export function createFallbackTrigger(openWidget: OpenWidgetFn): HTMLButtonElement {
  log('No native search elements found, creating fallback trigger button');

  const trigger = document.createElement('button');
  trigger.setAttribute('aria-label', 'Open search');

  // Inline styles to avoid CSS dependencies
  trigger.style.position = 'fixed';
  trigger.style.bottom = '24px';
  trigger.style.right = '24px';
  trigger.style.width = '56px';
  trigger.style.height = '56px';
  trigger.style.display = 'flex';
  trigger.style.alignItems = 'center';
  trigger.style.justifyContent = 'center';
  trigger.style.borderRadius = '50%';
  trigger.style.border = 'none';
  trigger.style.cursor = 'pointer';
  trigger.style.zIndex = '2147483646'; // One below widget container
  trigger.style.pointerEvents = 'auto';
  trigger.style.color = '#fff';
  trigger.style.background = 'linear-gradient(135deg,#7c3aed 0%,#6d28d9 100%)';
  trigger.style.boxShadow = '0 4px 12px rgba(124,58,237,0.4)';

  // Search icon SVG
  trigger.innerHTML =
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:block;pointer-events:none"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>';

  trigger.onclick = () => openWidget('');

  document.body.appendChild(trigger);
  return trigger;
}

/**
 * Remove fallback trigger from DOM
 */
export function removeFallbackTrigger(trigger: HTMLButtonElement | null): void {
  if (trigger && document.body.contains(trigger)) {
    document.body.removeChild(trigger);
    log('Removed fallback trigger');
  }
}
