/**
 * usePaginationState Hook
 * Manages pagination and loading state
 * Replaces pagination-related useState calls
 */

import { useState, useCallback } from 'react';

export interface PaginationState {
  currentPage: number;
  hasMoreProducts: boolean;
  isLoadingMore: boolean;
  totalProducts: number;
  displayedProducts: number;
  isInitialLoading: boolean;
  isMobile: boolean;
}

export interface PaginationActions {
  setCurrentPage: (page: number) => void;
  incrementPage: () => void;
  resetPage: () => void;
  setHasMoreProducts: (hasMore: boolean) => void;
  setIsLoadingMore: (loading: boolean) => void;
  setTotalProducts: (total: number) => void;
  setDisplayedProducts: (displayed: number) => void;
  addDisplayedProducts: (count: number) => void;
  setIsInitialLoading: (loading: boolean) => void;
  setIsMobile: (mobile: boolean) => void;
  resetPagination: () => void;
}

export function usePaginationState() {
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const [displayedProducts, setDisplayedProducts] = useState(0);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1280;
    }
    return false;
  });

  // Increment page
  const incrementPage = useCallback(() => {
    setCurrentPage((prev) => prev + 1);
  }, []);

  // Reset page to 1
  const resetPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  // Add to displayed products count
  const addDisplayedProducts = useCallback((count: number) => {
    setDisplayedProducts((prev) => prev + count);
  }, []);

  // Reset all pagination state
  const resetPagination = useCallback(() => {
    setCurrentPage(1);
    setHasMoreProducts(true);
    setIsLoadingMore(false);
    setTotalProducts(0);
    setDisplayedProducts(0);
    setIsInitialLoading(true);
  }, []);

  const state: PaginationState = {
    currentPage,
    hasMoreProducts,
    isLoadingMore,
    totalProducts,
    displayedProducts,
    isInitialLoading,
    isMobile,
  };

  const actions: PaginationActions = {
    setCurrentPage,
    incrementPage,
    resetPage,
    setHasMoreProducts,
    setIsLoadingMore,
    setTotalProducts,
    setDisplayedProducts,
    addDisplayedProducts,
    setIsInitialLoading,
    setIsMobile,
    resetPagination,
  };

  return { ...state, ...actions };
}
