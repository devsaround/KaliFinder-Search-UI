/**
 * Shadow Root Context
 *
 * Provides access to the shadow root container for Radix UI Portal components.
 * This ensures dropdowns, tooltips, and dialogs render inside the shadow DOM
 * instead of in document.body (where they won't receive shadow-scoped styles).
 *
 * Usage:
 * 1. Wrap your app with <ShadowRootProvider container={shadowRoot}>
 * 2. Use useShadowRoot() hook in components that need portal container
 * 3. Pass container to Radix Portal components: <DropdownMenuPortal container={container}>
 */

import { createContext, useContext, type ReactNode } from 'react';

interface ShadowRootContextValue {
  /**
   * The shadow root element where portals should render.
   * If null, components will fall back to default behavior (document.body).
   */
  container: HTMLElement | ShadowRoot | null;
}

const ShadowRootContext = createContext<ShadowRootContextValue>({
  container: null,
});

export interface ShadowRootProviderProps {
  /**
   * The shadow root or container element for Radix Portal components
   */
  container: HTMLElement | ShadowRoot | null;
  children: ReactNode;
}

/**
 * Provider component that shares the shadow root with all child components
 */
export function ShadowRootProvider({ container, children }: ShadowRootProviderProps) {
  return <ShadowRootContext.Provider value={{ container }}>{children}</ShadowRootContext.Provider>;
}

/**
 * Hook to access the shadow root container for Radix Portal components
 *
 * @returns The shadow root container element, or null if not in a shadow DOM
 *
 * @example
 * const { container } = useShadowRoot();
 * return (
 *   <DropdownMenuPortal container={container}>
 *     <DropdownMenuContent>...</DropdownMenuContent>
 *   </DropdownMenuPortal>
 * );
 */
export function useShadowRoot(): ShadowRootContextValue {
  return useContext(ShadowRootContext);
}
