// Standalone embeddable script for Kalifind Search
(function() {
  'use strict';

  // Check if React is already loaded
  if (typeof React === 'undefined') {
    console.warn('Kalifind Search requires React to be loaded. Please include React before this script.');
    return;
  }

  const { useState, useTransition, useRef, useEffect } = React;

  // Search component
  const KalifindSearch = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [showRecentSearch, setShowRecentSearch] = useState(false);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [recentSearches, setRecentSearches] = useState(['Sunglass', 'Adidas shoes']);
    const [filters, setFilters] = useState({
      categories: [],
      priceRange: [0, 250],
      sizes: [],
      colors: []
    });

    const searchRef = useRef(null);

    // Mock products
    const mockProducts = [
      {
        id: '1',
        name: 'Sunglass',
        image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=300&h=200&fit=crop',
        originalPrice: 140,
        currentPrice: 120,
        category: 'Men',
        color: 'black',
        sizes: [40, 41, 42]
      },
      // Add more products as needed...
    ];

    // Component logic (simplified for embeddable version)
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (searchRef.current && !searchRef.current.contains(event.target)) {
          setShowRecentSearch(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return React.createElement('div', {
      className: 'kalifind-search-container',
      style: {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        minHeight: '100vh',
        backgroundColor: '#ffffff'
      }
    }, 'Kalifind Search Component Loaded');
  };

  // Auto-embed function
  window.KalifindSearch = {
    embed: function(containerId) {
      const container = document.getElementById(containerId);
      if (container && typeof ReactDOM !== 'undefined') {
        const root = ReactDOM.createRoot(container);
        root.render(React.createElement(KalifindSearch));
      } else {
        console.error('Container not found or ReactDOM not loaded');
      }
    }
  };

  // Auto-embed if container exists
  document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('kalifind-search-container');
    if (container) {
      window.KalifindSearch.embed('kalifind-search-container');
    }
  });

})();