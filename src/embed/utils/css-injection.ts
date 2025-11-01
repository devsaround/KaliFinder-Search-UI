/**
 * CSS Injection Utility
 * Handles CSS loading and injection into Shadow DOM
 * CRITICAL: Shadow DOM adoptedStyleSheets does NOT support @import rules
 * We must use fully processed/bundled CSS without any @import statements
 */

import { warn, error } from './logger';

// This will be replaced with actual CSS string during build
declare const __INLINED_WIDGET_CSS__: string | undefined;

const MIN_CSS_BYTES = 512; // treat tiny strings as unavailable

/**
 * Load CSS from build-time inlined source
 * The shadowCssPlugin processes all @import statements and inlines fully resolved CSS
 */
async function loadCSS(): Promise<string> {
  // Build-time inlined CSS from shadowCssPlugin (fully processed, no @import)
  const css =
    typeof __INLINED_WIDGET_CSS__ !== 'undefined' && __INLINED_WIDGET_CSS__
      ? __INLINED_WIDGET_CSS__
      : '';

  // Diagnostics
  try {
    const cssLen = typeof __INLINED_WIDGET_CSS__ === 'string' ? __INLINED_WIDGET_CSS__.length : 0;
    console.log(`🧪 [Kalifinder] CSS from shadowCssPlugin: ${cssLen} bytes`);
  } catch {
    // no-op
  }

  if (!css) {
    error('No CSS available - shadowCssPlugin may have failed to inline CSS');
  }

  return css;
}

/**
 * Attempt to clone Tailwind styles from host document as last resort
 */
function cloneTailwindFromHost(shadowRoot: ShadowRoot): boolean {
  try {
    const styleEl = Array.from(document.querySelectorAll('style')).find((s) =>
      (s.textContent || '').includes('--tw-')
    );
    if (styleEl) {
      shadowRoot.appendChild(styleEl.cloneNode(true));
      warn('No inlined CSS found; cloned Tailwind <style> from host document into shadow root.');
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

/**
 * Inject CSS into Shadow DOM using <style> tag
 * This is the most reliable method for Shadow DOM CSS injection
 * The shadowCssPlugin ensures CSS is fully processed with no @import statements
 */
async function injectCSS(shadowRoot: ShadowRoot, css: string): Promise<void> {
  const cssSize = css.length;

  // Use <style> tag - most reliable for Shadow DOM
  const style = document.createElement('style');
  style.textContent = css;
  shadowRoot.appendChild(style);

  console.log(
    `🔧 [Kalifinder] CSS injected into Shadow DOM (${cssSize} bytes) at`,
    new Date().toISOString()
  );
}

/**
 * Main CSS injection function
 * Loads and injects CSS into Shadow DOM
 * CSS is provided by shadowCssPlugin during build with all @import statements resolved
 */
export async function createStyles(shadowRoot: ShadowRoot): Promise<void> {
  const css = await loadCSS();
  const cssLength = (css || '').trim().length;

  if (!css || cssLength <= MIN_CSS_BYTES) {
    // Try to clone from host document
    if (cloneTailwindFromHost(shadowRoot)) {
      return;
    }

    error('No CSS available for Shadow DOM injection');
    return;
  }

  await injectCSS(shadowRoot, css);
}
