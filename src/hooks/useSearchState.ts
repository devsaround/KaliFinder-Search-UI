/**
 * useSearchState Hook
 * Manages all search-related state in one organized place
 * Replaces 20+ individual useState calls
 */

import { useState, useRef, useTransition, useCallback } from 'react';
import type { Product } from '@/types';

export interface SearchState {
  // Core search
  showAutocomplete: boolean;
  isInteractingWithDropdown: boolean;
  filteredProducts: Product[];
  isLoading: boolean;
  isPending: boolean;

  // Autocomplete
  recentSearches: string[];
  autocompleteSuggestions: string[];
  isAutocompleteLoading: boolean;
  highlightedSuggestionIndex: number;

  // Search behavior
  showRecommendations: boolean;
  isSearchingFromSuggestion: boolean;
  forceSearch: number;
  searchAbortController: AbortController | null;
  isFromSuggestionSelection: boolean;

  // Recommendations
  recommendations: Product[];
  recommendationsFetched: boolean;
  isInitialState: boolean;

  // Sort
  sortOption: string;

  // Refs
  lastActionRef: React.MutableRefObject<'typing' | 'suggestion' | null>;
  userTypingRef: React.MutableRefObject<boolean>;
  lastSearchedQueryRef: React.MutableRefObject<string | null>;
  lastSearchedFiltersRef: React.MutableRefObject<string>;
}

export interface SearchActions {
  setShowAutocomplete: (show: boolean) => void;
  setIsInteractingWithDropdown: (value: boolean) => void;
  setFilteredProducts: (products: Product[]) => void;
  setIsLoading: (loading: boolean) => void;
  startTransition: (callback: () => void) => void;
  setRecentSearches: (searches: string[]) => void;
  addRecentSearch: (search: string) => void;
  setAutocompleteSuggestions: (suggestions: string[]) => void;
  setIsAutocompleteLoading: (loading: boolean) => void;
  setHighlightedSuggestionIndex: (index: number) => void;
  setShowRecommendations: (show: boolean) => void;
  setIsSearchingFromSuggestion: (value: boolean) => void;
  setForceSearch: (value: number) => void;
  incrementForceSearch: () => void;
  setSearchAbortController: (controller: AbortController | null) => void;
  setIsFromSuggestionSelection: (value: boolean) => void;
  setRecommendations: (products: Product[]) => void;
  setRecommendationsFetched: (fetched: boolean) => void;
  setIsInitialState: (isInitial: boolean) => void;
  setSortOption: (option: string) => void;
  getSortLabel: (option: string) => string;
  resetSearch: () => void;
}

export function useSearchState() {
  // Core search state
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [isInteractingWithDropdown, setIsInteractingWithDropdown] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Autocomplete state
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<string[]>([]);
  const [isAutocompleteLoading, setIsAutocompleteLoading] = useState(false);
  const [highlightedSuggestionIndex, setHighlightedSuggestionIndex] = useState(-1);

  // Search behavior state
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [isSearchingFromSuggestion, setIsSearchingFromSuggestion] = useState(false);
  const [forceSearch, setForceSearch] = useState(0);
  const [searchAbortController, setSearchAbortController] = useState<AbortController | null>(null);
  const [isFromSuggestionSelection, setIsFromSuggestionSelection] = useState(false);

  // Refs
  const lastActionRef = useRef<'typing' | 'suggestion' | null>(null);
  const userTypingRef = useRef(false);
  const lastSearchedQueryRef = useRef<string | null>(null);
  const lastSearchedFiltersRef = useRef<string>('');

  // Recommendations state
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [recommendationsFetched, setRecommendationsFetched] = useState(false);
  const [isInitialState, setIsInitialState] = useState(true);

  // Sort state
  const [sortOption, setSortOption] = useState('default');

  // Helper function to get sort option label
  const getSortLabel = useCallback((option: string) => {
    switch (option) {
      case 'a-z':
        return 'Name: A-Z';
      case 'z-a':
        return 'Name: Z-A';
      case 'price-asc':
        return 'Price: Low to High';
      case 'price-desc':
        return 'Price: High to Low';
      default:
        return 'Relevance';
    }
  }, []);

  // Add recent search (with deduplication and limit)
  const addRecentSearch = useCallback((search: string) => {
    if (!search.trim()) return;

    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s !== search);
      return [search, ...filtered].slice(0, 10); // Keep only 10 most recent
    });
  }, []);

  // Increment force search counter
  const incrementForceSearch = useCallback(() => {
    setForceSearch((prev) => prev + 1);
  }, []);

  // Reset all search state
  const resetSearch = useCallback(() => {
    setShowAutocomplete(false);
    setFilteredProducts([]);
    setIsLoading(false);
    setAutocompleteSuggestions([]);
    setHighlightedSuggestionIndex(-1);
    setShowRecommendations(true);
    setIsInitialState(true);
    lastSearchedQueryRef.current = null;
    lastSearchedFiltersRef.current = '';
  }, []);

  const state: SearchState = {
    showAutocomplete,
    isInteractingWithDropdown,
    filteredProducts,
    isLoading,
    isPending,
    recentSearches,
    autocompleteSuggestions,
    isAutocompleteLoading,
    highlightedSuggestionIndex,
    showRecommendations,
    isSearchingFromSuggestion,
    forceSearch,
    searchAbortController,
    isFromSuggestionSelection,
    recommendations,
    recommendationsFetched,
    isInitialState,
    sortOption,
    lastActionRef,
    userTypingRef,
    lastSearchedQueryRef,
    lastSearchedFiltersRef,
  };

  const actions: SearchActions = {
    setShowAutocomplete,
    setIsInteractingWithDropdown,
    setFilteredProducts,
    setIsLoading,
    startTransition,
    setRecentSearches,
    addRecentSearch,
    setAutocompleteSuggestions,
    setIsAutocompleteLoading,
    setHighlightedSuggestionIndex,
    setShowRecommendations,
    setIsSearchingFromSuggestion,
    setForceSearch,
    incrementForceSearch,
    setSearchAbortController,
    setIsFromSuggestionSelection,
    setRecommendations,
    setRecommendationsFetched,
    setIsInitialState,
    setSortOption,
    getSortLabel,
    resetSearch,
  };

  return { ...state, ...actions };
}
