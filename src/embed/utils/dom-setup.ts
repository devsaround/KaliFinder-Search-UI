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

/**
 * Create Shadow DOM container and attach it to document body
 */
function createContainer(): { container: HTMLDivElement; shadowRoot: ShadowRoot } {
  const container = document.createElement('div');
  container.style.cssText =
    'position: fixed; z-index: 2147483647; inset: 0; width: 100%; height: 100%; pointer-events: none;';
  document.body.appendChild(container);

  const shadowRoot = container.attachShadow({ mode: 'open' });

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
    'position: absolute; inset: 0; z-index: 2147483647; pointer-events: none;';
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
