import React from 'react';
import ReactDOM from 'react-dom/client';
import WidgetEmbed from '../components/WidgetEmbed';
import '../index.css';

declare const __WIDGET_CSS__: string | undefined;

export type InitOptions = {
  storeUrl: string;
};

type Controller = {
  open: (query?: string) => void;
  destroy: () => void;
};

function createStyles(shadowRoot: ShadowRoot): void {
  const css = typeof __WIDGET_CSS__ !== 'undefined' ? __WIDGET_CSS__ : '';
  const supportsAdopted =
    'adoptedStyleSheets' in Document.prototype && 'replace' in CSSStyleSheet.prototype;

  if (css && supportsAdopted) {
    const sheet = new CSSStyleSheet();
    void sheet.replace(css).then(() => {
      (shadowRoot as unknown as { adoptedStyleSheets: CSSStyleSheet[] }).adoptedStyleSheets = [
        sheet,
      ];
    });
    return;
  }

  if (css) {
    const style = document.createElement('style');
    style.textContent = css;
    shadowRoot.appendChild(style);
    return;
  }

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/src/index.css';
  shadowRoot.appendChild(link);
}

function openWidget(query?: string) {
  const evt = new CustomEvent('kalifinder:open', { detail: { query: query ?? '' } });
  window.dispatchEvent(evt);
}

export function init(options: InitOptions): Controller {
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

  // Host-page trigger button (fixed) with inline styles so it doesn't depend on CSS
  const trigger = document.createElement('button');
  trigger.setAttribute('aria-label', 'Open search');
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
  trigger.style.zIndex = '2147483646';
  trigger.style.pointerEvents = 'auto';
  trigger.style.color = '#fff';
  trigger.style.background = 'linear-gradient(135deg,#7c3aed 0%,#6d28d9 100%)';
  trigger.style.boxShadow = '0 4px 12px rgba(124,58,237,0.4)';
  trigger.innerHTML =
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:block;pointer-events:none"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>';
  trigger.onclick = () => openWidget('');
  document.body.appendChild(trigger);

  return {
    open: openWidget,
    destroy: () => {
      try {
        root.unmount();
      } catch {
        // Root may already be unmounted
      }
      container.remove();
      try {
        document.body.removeChild(trigger);
      } catch {
        // Trigger may already be removed
      }
    },
  };
}

declare global {
  interface Window {
    Kalifinder?: { init: (opts: InitOptions) => Controller };
    KalifinderController?: Controller;
  }
}

// UMD global and auto-init from script query (?storeUrl=...)
(() => {
  try {
    (window as unknown as Window).Kalifinder = { init };
    const scripts = document.getElementsByTagName('script');
    const current = scripts[scripts.length - 1];
    if (current && current.src && current.src.includes('kalifind-search')) {
      const url = new URL(current.src);
      const storeUrl = url.searchParams.get('storeUrl');
      if (storeUrl) {
        const ctl = init({ storeUrl });
        (window as unknown as Window).KalifinderController = ctl;
      }
    }
  } catch {
    // no-op
  }
})();
