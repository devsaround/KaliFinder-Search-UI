import { useCallback, useEffect, useState } from 'react';

interface UseAutocompleteReturn {
  suggestions: string[];
  isLoading: boolean;
  showDropdown: boolean;
  setShowDropdown: (show: boolean) => void;
  highlightedIndex: number;
  setHighlightedIndex: (index: number) => void;
  handleSuggestionClick: (suggestion: string) => void;
}

interface UseAutocompleteOptions {
  query: string;
  storeUrl?: string;
  onSuggestionSelect?: (suggestion: string) => void;
  debounceMs?: number;
  enabled?: boolean;
}

export function useAutocomplete(options: UseAutocompleteOptions): UseAutocompleteReturn {
  const { query, storeUrl, onSuggestionSelect, debounceMs = 300, enabled = true } = options;

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Fuzzy matching for better suggestions
  const fuzzyMatch = useCallback((searchQuery: string, suggestion: string): boolean => {
    if (!searchQuery || !suggestion) return false;

    const queryLower = searchQuery.toLowerCase().trim();
    const suggestionLower = suggestion.toLowerCase().trim();

    if (suggestionLower.includes(queryLower)) return true;

    let queryIndex = 0;
    for (let i = 0; i < suggestionLower.length && queryIndex < queryLower.length; i++) {
      if (suggestionLower[i] === queryLower[queryIndex]) {
        queryIndex++;
      }
    }

    return queryIndex === queryLower.length;
  }, []);

  // Score suggestions by relevance
  const scoreSuggestion = useCallback(
    (searchQuery: string, suggestion: string): number => {
      if (!searchQuery || !suggestion) return 0;

      const queryLower = searchQuery.toLowerCase().trim();
      const suggestionLower = suggestion.toLowerCase().trim();

      if (suggestionLower === queryLower) return 100;
      if (suggestionLower.startsWith(queryLower)) return 90;
      if (suggestionLower.includes(queryLower)) return 70;
      if (fuzzyMatch(searchQuery, suggestion)) return 50;

      return 0;
    },
    [fuzzyMatch]
  );

  // Fetch autocomplete suggestions
  useEffect(() => {
    if (!enabled || !storeUrl || !query.trim()) {
      setSuggestions([]);
      setIsLoading(false);
      setShowDropdown(false);
      return;
    }

    setShowDropdown(true);
    const debounceTimer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.append('q', query);
        params.append('storeUrl', storeUrl);

        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/search/autocomplete?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error('Autocomplete request failed');
        }

        const json = await response.json();

        // Unwrap new API success wrapper
        const payload = json && json.success ? json.data : json;

        // Handle different response formats safely
        let rawSuggestions: string[] = [];
        if (payload && Array.isArray(payload.suggestions)) {
          rawSuggestions = payload.suggestions.map((s: string) => String(s));
        } else if (payload && Array.isArray(payload.products)) {
          rawSuggestions = payload.products
            .map((r: { title?: string; name?: string }) => r.title || r.name || String(r))
            .filter(Boolean);
        } else if (Array.isArray(payload)) {
          rawSuggestions = (payload as Array<{ title?: string; name?: string }>)
            .map((r) => r.title || r.name || '')
            .filter(Boolean) as string[];
        }

        // Apply fuzzy matching and scoring
        const scoredSuggestions = rawSuggestions
          .map((suggestion) => ({
            text: suggestion,
            score: scoreSuggestion(query, suggestion),
          }))
          .filter((item) => item.score > 0)
          .sort((a, b) => b.score - a.score)
          .map((item) => item.text)
          .slice(0, 10);

        setSuggestions(scoredSuggestions);
        setHighlightedIndex(-1);
      } catch (error) {
        console.error('Failed to fetch autocomplete suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(debounceTimer);
  }, [query, storeUrl, enabled, debounceMs, scoreSuggestion]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setShowDropdown(false);
      setHighlightedIndex(-1);
      setSuggestions([]);
      onSuggestionSelect?.(suggestion);
    },
    [onSuggestionSelect]
  );

  return {
    suggestions,
    isLoading,
    showDropdown,
    setShowDropdown,
    highlightedIndex,
    setHighlightedIndex,
    handleSuggestionClick,
  };
}
