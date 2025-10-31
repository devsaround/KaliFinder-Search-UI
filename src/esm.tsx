import React from 'react';
import ReactDOM from 'react-dom/client';
import WidgetEmbed from './components/WidgetEmbed';
// Import compiled CSS as a string (handled by vite-plugin-inline-css)
// This keeps the ESM build self-contained when used by SPAs.
import css from './index.css?inline';

export type ESMInitOptions = {
  storeUrl: string;
};

export type ESMController = {
  open: (query?: string) => void;
  destroy: () => void;
};

function createStyles(shadowRoot: ShadowRoot): void {
  const supportsAdopted =
    'adoptedStyleSheets' in Document.prototype && 'replace' in CSSStyleSheet.prototype;

  if (css && supportsAdopted) {
    const sheet = new CSSStyleSheet();
    void sheet.replace(css as unknown as string).then(() => {
      (shadowRoot as unknown as { adoptedStyleSheets: CSSStyleSheet[] }).adoptedStyleSheets = [
        sheet,
      ];
    });
    return;
  }

  const style = document.createElement('style');
  style.textContent = (css as unknown as string) || '';
  shadowRoot.appendChild(style);
}

function openWidget(query?: string) {
  const evt = new CustomEvent('kalifinder:open', { detail: { query: query ?? '' } });
  window.dispatchEvent(evt);
}

export function createKalifinderWidget(options: ESMInitOptions): ESMController {
  const container = document.createElement('div');
  container.style.cssText =
    'position: fixed; z-index: 2147483647; inset: 0; width: 100%; height: 100%; pointer-events: none;';
  document.body.appendChild(container);

  const shadowRoot = container.attachShadow({ mode: 'open' });
  createStyles(shadowRoot);

  const rootEl = document.createElement('div');
  rootEl.id = 'kalifinder-react-root';
  rootEl.style.cssText = 'width: 100%; height: 100%; pointer-events: none;';
  shadowRoot.appendChild(rootEl);

  const root = ReactDOM.createRoot(rootEl);
  root.render(
    <React.StrictMode>
      <WidgetEmbed storeUrl={options.storeUrl} />
    </React.StrictMode>
  );

  return {
    open: openWidget,
    destroy: () => {
      try {
        root.unmount();
      } catch (err) {
        if (import.meta.env?.DEV) console.warn('Failed to unmount widget root', err);
      }
      container.remove();
    },
  };
}

export default { createKalifinderWidget };
