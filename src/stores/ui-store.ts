/**
 * UI Store (Zustand)
 * Manages UI state (modals, dropdowns, sidebar visibility, etc.)
 */

import { create } from 'zustand';

export type ViewMode = 'grid' | 'list';
export type SortOrder = 'relevance' | 'price-asc' | 'price-desc' | 'newest' | 'popular';

export interface UIState {
  /** Whether search widget is open */
  isWidgetOpen: boolean;
  setIsWidgetOpen: (open: boolean) => void;

  /** Whether filter panel is open */
  isFilterPanelOpen: boolean;
  setIsFilterPanelOpen: (open: boolean) => void;

  /** Whether autocomplete dropdown is visible */
  showAutocomplete: boolean;
  setShowAutocomplete: (show: boolean) => void;

  /** View mode (grid or list) */
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  /** Current sort order */
  sortOrder: SortOrder;
  setSortOrder: (order: SortOrder) => void;

  /** Items per page */
  itemsPerPage: number;
  setItemsPerPage: (items: number) => void;

  /** Whether sidebar is sticky */
  isStickyFilters: boolean;
  setIsStickyFilters: (sticky: boolean) => void;

  /** Mobile view indicator */
  isMobileView: boolean;
  setIsMobileView: (mobile: boolean) => void;

  /** Generic modal open/close */
  modals: Record<string, boolean>;
  openModal: (modalName: string) => void;
  closeModal: (modalName: string) => void;
  closeAllModals: () => void;

  /** Reset to initial state */
  reset: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isWidgetOpen: true,
  setIsWidgetOpen: (open) => set({ isWidgetOpen: open }),

  isFilterPanelOpen: false,
  setIsFilterPanelOpen: (open) => set({ isFilterPanelOpen: open }),

  showAutocomplete: false,
  setShowAutocomplete: (show) => set({ showAutocomplete: show }),

  viewMode: 'grid',
  setViewMode: (mode) => set({ viewMode: mode }),

  sortOrder: 'relevance',
  setSortOrder: (order) => set({ sortOrder: order }),

  itemsPerPage: 20,
  setItemsPerPage: (items) => set({ itemsPerPage: items }),

  isStickyFilters: true,
  setIsStickyFilters: (sticky) => set({ isStickyFilters: sticky }),

  isMobileView: false,
  setIsMobileView: (mobile) => set({ isMobileView: mobile }),

  modals: {},
  openModal: (modalName) =>
    set((state) => ({
      modals: { ...state.modals, [modalName]: true },
    })),
  closeModal: (modalName) =>
    set((state) => ({
      modals: { ...state.modals, [modalName]: false },
    })),
  closeAllModals: () => set({ modals: {} }),

  reset: () =>
    set({
      isWidgetOpen: true,
      isFilterPanelOpen: false,
      showAutocomplete: false,
      viewMode: 'grid',
      sortOrder: 'relevance',
      itemsPerPage: 20,
      isStickyFilters: true,
      isMobileView: false,
      modals: {},
    }),
}));
