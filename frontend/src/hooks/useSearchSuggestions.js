import { useState, useEffect, useCallback, useRef } from 'react';
import { debounce } from 'lodash';

// Hook for search suggestions and autocomplete
const useSearchSuggestions = (searchFunction, delay = 300) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const abortControllerRef = useRef(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (term) => {
      if (!term || term.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      // Cancel previous request if exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      setLoading(true);
      setError(null);

      try {
        const results = await searchFunction(term, abortControllerRef.current.signal);
        
        if (!abortControllerRef.current.signal.aborted) {
          setSuggestions(results || []);
          setShowSuggestions(true);
        }
      } catch (err) {
        if (!abortControllerRef.current.signal.aborted && err.name !== 'AbortError') {
          setError(err.message);
          setSuggestions([]);
        }
      } finally {
        if (!abortControllerRef.current.signal.aborted) {
          setLoading(false);
        }
      }
    }, delay),
    [searchFunction, delay]
  );

  // Handle search term change
  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion) => {
    setSearchTerm(suggestion.value || suggestion.label || suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
  }, []);

  // Handle suggestion hover
  const handleSuggestionHover = useCallback((index) => {
    // Optional: Add hover effects or keyboard navigation
  }, []);

  // Clear suggestions
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setShowSuggestions(false);
    setSearchTerm('');
    setError(null);
  }, []);

  // Hide suggestions
  const hideSuggestions = useCallback(() => {
    setShowSuggestions(false);
  }, []);

  // Show suggestions
  const showSuggestionsList = useCallback(() => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  }, [suggestions.length]);

  // Filter suggestions based on search term
  const filteredSuggestions = useCallback((term) => {
    if (!term || !suggestions.length) return suggestions;
    
    return suggestions.filter(suggestion => {
      const searchValue = suggestion.value || suggestion.label || suggestion;
      return searchValue.toLowerCase().includes(term.toLowerCase());
    });
  }, [suggestions]);

  // Get suggestion display value
  const getSuggestionDisplayValue = useCallback((suggestion) => {
    if (typeof suggestion === 'string') return suggestion;
    return suggestion.label || suggestion.value || suggestion.id || suggestion;
  }, []);

  // Get suggestion value
  const getSuggestionValue = useCallback((suggestion) => {
    if (typeof suggestion === 'string') return suggestion;
    return suggestion.value || suggestion.id || suggestion;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  // Keyboard navigation
  const handleKeyDown = useCallback((event, onSelect) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        // Implement keyboard navigation logic
        break;
      case 'ArrowUp':
        event.preventDefault();
        // Implement keyboard navigation logic
        break;
      case 'Enter':
        event.preventDefault();
        if (suggestions.length > 0) {
          onSelect(suggestions[0]);
        }
        break;
      case 'Escape':
        hideSuggestions();
        break;
      default:
        break;
    }
  }, [showSuggestions, suggestions, hideSuggestions]);

  return {
    // State
    suggestions,
    loading,
    error,
    searchTerm,
    showSuggestions,
    
    // Actions
    handleSearchChange,
    handleSuggestionSelect,
    handleSuggestionHover,
    clearSuggestions,
    hideSuggestions,
    showSuggestionsList,
    handleKeyDown,
    
    // Computed values
    filteredSuggestions,
    getSuggestionDisplayValue,
    getSuggestionValue,
    
    // Utility functions
    hasSuggestions: suggestions.length > 0,
    isLoading: loading,
    hasError: !!error
  };
};

export default useSearchSuggestions;
