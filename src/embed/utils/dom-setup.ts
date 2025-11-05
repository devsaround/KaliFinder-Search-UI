/**
 * DOM Setup
 * Creates and configures Shadow DOM and React root
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import WidgetEmbed from '../../components/WidgetEmbed';
import { ShadowRootProvider } from '../../contexts/ShadowRootContext';

export interface DOMElements {
  container: HTMLDivElement;
  shadowRoot: ShadowRoot;
  rootEl: HTMLDivElement;
  portalContainer: HTMLDivElement;
  root: ReactDOM.Root;
}

// ------------------------------------------------------------
// Diagnostics (helps identify host-page scaling issues)
// ------------------------------------------------------------
function parseScaleFromTransform(transform: string | null): { x: number; y: number } | null {
  if (!transform || transform === 'none') return null;
  const m = transform.match(/matrix\(([^)]+)\)/);
  if (!m || !m[1]) return null;
  const parts = m[1]
    .split(',')
    .map((v) => Number(String(v).trim()))
    .filter((n) => Number.isFinite(n));
  if (parts.length < 4) return null;
  const sx = parts[0];
  const sy = parts[3];
  if (!Number.isFinite(sx) || !Number.isFinite(sy)) return null;
  return { x: sx as number, y: sy as number };
}

function logEnvironmentDiagnostics(container: HTMLDivElement): void {
  if ((window as any).__KF_DIAG_LOGGED__) return;
  (window as any).__KF_DIAG_LOGGED__ = true;

  try {
    const html = document.documentElement;
    const body = document.body;

    const htmlCS = getComputedStyle(html);
    const bodyCS = getComputedStyle(body);

    const htmlTransform = htmlCS.transform;
    const bodyTransform = bodyCS.transform;
    const htmlZoom = (htmlCS as unknown as { zoom?: string }).zoom || 'normal';
    const bodyZoom = (bodyCS as unknown as { zoom?: string }).zoom || 'normal';

    const htmlScale = parseScaleFromTransform(htmlTransform);
    const bodyScale = parseScaleFromTransform(bodyTransform);

    const vv = (window as any).visualViewport as VisualViewport | undefined;
    const viewportMeta =
      (document.querySelector('meta[name="viewport"]') as HTMLMetaElement | null)?.content || '';

    const rect = container.getBoundingClientRect();
    const widthMismatch = {
      devicePixelRatio: window.devicePixelRatio,
      visualViewportWidth: vv?.width ?? null,
      innerWidth: window.innerWidth,
      clientWidth: html.clientWidth,
    };

    // 100vw risk: presence of vertical scrollbar reduces clientWidth vs innerWidth
    const hasScrollbar = window.innerWidth > html.clientWidth;

    console.groupCollapsed('[Kalifinder][diag] Host-page environment');
    console.table([
      { key: 'viewportMeta', value: viewportMeta },
      {
        key: 'html.transform',
        value: htmlTransform,
        scale: htmlScale ? `${htmlScale.x.toFixed(3)} x ${htmlScale.y.toFixed(3)}` : '',
      },
      { key: 'html.zoom', value: htmlZoom },
      {
        key: 'body.transform',
        value: bodyTransform,
        scale: bodyScale ? `${bodyScale.x.toFixed(3)} x ${bodyScale.y.toFixed(3)}` : '',
      },
      { key: 'body.zoom', value: bodyZoom },
      { key: 'devicePixelRatio', value: window.devicePixelRatio },
      { key: 'visualViewport.scale', value: vv?.scale ?? '' },
      {
        key: 'container.rect',
        value: `${Math.round(rect.width)}x${Math.round(rect.height)} @ (${Math.round(rect.left)},${Math.round(rect.top)})`,
      },
      { key: 'hasScrollbar(inner>client)', value: String(hasScrollbar) },
      {
        key: 'innerWidth vs clientWidth',
        value: `${widthMismatch.innerWidth} vs ${widthMismatch.clientWidth}`,
      },
    ]);
    console.groupEnd();
  } catch (_e) {
    // no-op
  }
}

/**
 * Create Shadow DOM container and attach it to document body
 */
function createContainer(): { container: HTMLDivElement; shadowRoot: ShadowRoot } {
  const container = document.createElement('div');
  container.style.cssText =
    'position: fixed; z-index: 2147483647; inset: 0; width: 100%; height: 100%; pointer-events: none;';
  document.body.appendChild(container);

  const shadowRoot = container.attachShadow({ mode: 'open' });

  // Log diagnostics once for this page load
  logEnvironmentDiagnostics(container);

  return { container, shadowRoot };
}

/**
 * Create React root element inside shadow root
 */
function createReactRoot(shadowRoot: ShadowRoot): HTMLDivElement {
  const rootEl = document.createElement('div');
  rootEl.id = 'kalifinder-react-root';
  rootEl.style.cssText = 'width: 100%; height: 100%; pointer-events: none;';
  shadowRoot.appendChild(rootEl);
  return rootEl;
}

/**
 * Create portal container for Radix UI components
 */
function createPortalContainer(shadowRoot: ShadowRoot): HTMLDivElement {
  const portalContainer = document.createElement('div');
  portalContainer.id = 'kalifinder-portal-container';
  portalContainer.style.cssText =
    'position: fixed; inset: 0; z-index: 2147483647; pointer-events: none;';
  shadowRoot.appendChild(portalContainer);
  return portalContainer;
}

/**
 * Setup complete DOM structure for widget
 * Creates container, shadow root, React root, and portal container
 */
export function setupDOM(): DOMElements {
  const { container, shadowRoot } = createContainer();
  const rootEl = createReactRoot(shadowRoot);
  const portalContainer = createPortalContainer(shadowRoot);
  const root = ReactDOM.createRoot(rootEl);

  return {
    container,
    shadowRoot,
    rootEl,
    portalContainer,
    root,
  };
}

/**
 * Render React app into shadow root
 */
export function renderWidget(
  root: ReactDOM.Root,
  portalContainer: HTMLDivElement,
  storeUrl: string
): void {
  const widgetElement = React.createElement(WidgetEmbed, { storeUrl });
  const providerElement = React.createElement(ShadowRootProvider, {
    container: portalContainer,
    children: widgetElement,
  });
  const strictModeElement = React.createElement(React.StrictMode, null, providerElement);

  root.render(strictModeElement);
}
