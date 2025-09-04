import React, { useState, useTransition, useRef, useEffect } from "react";
import { Search, ShoppingCart, X, Filter, ChevronDown } from "lucide-react";

interface Product {
  id: string;
  name: string;
  image: string;
  originalPrice: number;
  currentPrice: number;
  category: string;
}

interface FilterState {
  categories: string[];
  priceRange: [number, number];
  colors: string[];
  sizes: number[];
  brands: string[];
}

// Mock recommendations data
const getSearchRecommendations = (query: string) => {
  const recommendations: { [key: string]: string[] } = {
    'adidas': ['adidas shoes', 'adidas sportswear', 'adidas performance', 'adidas originals', 'adidas running'],
    'nike': ['nike shoes', 'nike sportswear', 'nike performance', 'nike wmns teck', 'nike sportswear cotton'],
    'shoe': ['running shoes', 'casual shoes', 'sport shoes', 'basketball shoes', 'tennis shoes'],
    'dress': ['summer dress', 'casual dress', 'formal dress', 'party dress', 'midi dress'],
    'shirt': ['t-shirt', 'dress shirt', 'polo shirt', 'button shirt', 'long sleeve shirt'],
    'jacket': ['leather jacket', 'denim jacket', 'bomber jacket', 'winter jacket', 'sport jacket']
  };

  const lowerQuery = query.toLowerCase().trim();
  
  // Find recommendations for the query
  for (const [key, values] of Object.entries(recommendations)) {
    if (lowerQuery.includes(key) || key.includes(lowerQuery)) {
      return values.filter(rec => rec.toLowerCase() !== lowerQuery);
    }
  }

  return [];
};

const useDebounce = (value: any, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Mock Accordion components
const Accordion = ({ children, type, defaultValue, className }: any) => (
  <div className={className}>{children}</div>
);

const AccordionItem = ({ children, value }: any) => (
  <div className="border-b border-gray-200 py-4">{children}</div>
);

const AccordionTrigger = ({ children, className }: any) => (
  <button className={`flex justify-between items-center w-full text-left font-medium ${className || ''}`}>
    {children}
    <ChevronDown className="w-4 h-4" />
  </button>
);

const AccordionContent = ({ children }: any) => (
  <div className="pt-4">{children}</div>
);

// Mock Slider component
const Slider = ({ value, onValueChange, max, step, className }: any) => (
  <input
    type="range"
    min="0"
    max={max}
    step={step}
    value={value[0]}
    onChange={(e) => onValueChange([parseInt(e.target.value)])}
    className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${className || ''}`}
  />
);

// Mock Button component
const Button = ({ children, variant, className, onClick }: any) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg ${variant === 'ghost' ? 'hover:bg-gray-100' : 'bg-blue-600 text-white hover:bg-blue-700'} ${className || ''}`}
  >
    {children}
  </button>
);

const KalifindSearchTest: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showRecentSearch, setShowRecentSearch] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [recentSearches, setRecentSearches] = useState([
    "Sunglass",
    "Adidas shoes",
  ]);
  const [searchRecommendations, setSearchRecommendations] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    priceRange: [0, 1000],
    colors: [],
    sizes: [],
    brands: [],
  });

  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const debouncedPriceRange = useDebounce(filters.priceRange, 500);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileFiltersRef = useRef<HTMLDivElement>(null);

  const categories = [
    { name: "Men", count: 40 },
    { name: "Women", count: 37 },
    { name: "Kids", count: 12 },
  ];
  const sizes = [38, 39, 40, 41, 42, 43, 44, 45];
  const colors = ["black", "white", "red", "blue", "yellow"];
  const brands = [
    { name: "Nike", count: 25 },
    { name: "Adidas", count: 18 },
    { name: "Puma", count: 10 },
  ];

  const isAnyFilterActive =
    filters.categories.length > 0 ||
    filters.brands.length > 0 ||
    filters.colors.length > 0 ||
    filters.sizes.length > 0 ||
    filters.priceRange[1] < 1000;

  // Update search recommendations when query changes
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const recommendations = getSearchRecommendations(searchQuery);
      setSearchRecommendations(recommendations);
    } else {
      setSearchRecommendations([]);
    }
  }, [searchQuery]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowRecentSearch(false);
      }
      if (
        mobileFiltersRef.current &&
        !mobileFiltersRef.current.contains(event.target as Node)
      ) {
        setShowMobileFilters(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mock search products
  useEffect(() => {
    startTransition(() => {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        const mockProducts = [
          {
            id: '1',
            title: 'Adidas Running Shoes',
            imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop',
            price: '89.99 €'
          },
          {
            id: '2',
            title: 'Nike Air Max',
            imageUrl: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=300&h=300&fit=crop',
            price: '129.99 €'
          },
          {
            id: '3',
            title: 'Casual Sneakers',
            imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=300&fit=crop',
            price: '59.99 €'
          },
          {
            id: '4',
            title: 'Sport Jacket',
            imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=300&h=300&fit=crop',
            price: '79.99 €'
          }
        ];
        setFilteredProducts(mockProducts);
        setIsLoading(false);
      }, 1000);
    });
  }, [
    debouncedSearchQuery,
    filters.categories,
    filters.colors,
    filters.sizes,
    filters.brands,
    debouncedPriceRange,
  ]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query && !recentSearches.includes(query)) {
      setRecentSearches((prev) => [query, ...prev.slice(0, 4)]);
    }
  };

  const handleRecommendationClick = (recommendation: string) => {
    setSearchQuery(recommendation);
    setShowRecentSearch(false);
  };

  const handleCategoryChange = (category: string) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  const handleBrandChange = (brand: string) => {
    setFilters((prev) => ({
      ...prev,
      brands: prev.brands.includes(brand)
        ? prev.brands.filter((b) => b !== brand)
        : [...prev.brands, brand],
    }));
  };

  const handleSizeChange = (size: number) => {
    setFilters((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }));
  };

  const handleColorChange = (color: string) => {
    setFilters((prev) => ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter((c) => c !== color)
        : [...prev.colors, color],
    }));
  };

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-gray-200 rounded-lg p-4 animate-pulse">
          <div className="bg-gray-300 h-48 rounded-md mb-4"></div>
          <div className="bg-gray-300 h-4 rounded mb-2"></div>
          <div className="bg-gray-300 h-6 rounded w-20"></div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-white min-h-screen">
      <header className="bg-white py-3 border-b">
        <div className="flex items-center justify-between lg:gap-24 max-w-7xl mx-auto px-4 flex-col lg:flex-row">
          <div className="flex items-center gap-2 justify-between md:justify-normal">
            <div className="flex items-center">
              <a href="/" className="flex items-center">
                <img
                  src="https://via.placeholder.com/200x60/4F46E5/FFFFFF?text=Kalifind"
                  alt="Kalifind"
                  className="h-auto w-full max-w-[200px] max-h-14 object-contain object-center"
                />
              </a>
            </div>
          </div>

          <div className="flex-1 relative ml-2 w-full" ref={searchRef}>
            <div className="flex items-center gap-2 flex-1 w-full">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => setShowRecentSearch(true)}
                  placeholder="Search"
                  className="w-full pl-10 pr-4 py-3 border-b-2 border-blue-500 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-none focus:ring-0"
                />
              </div>

              <button
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors duration-200 flex-shrink-0"
                aria-label="Close search"
                onClick={() => setSearchQuery("")}
              >
                <X className="w-6 h-6 text-gray-400 hover:text-gray-600 transition-colors duration-200" />
              </button>
            </div>

            {showRecentSearch && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 mt-1">
                <div className="z-[999] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-900">
                      Recent Search
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {recentSearches.map((search, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded"
                        onClick={() => {
                          setSearchQuery(search);
                          setShowRecentSearch(false);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Search className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{search}</span>
                        </div>
                        <X
                          onClick={(e) => {
                            e.stopPropagation();
                            setRecentSearches(
                              recentSearches.filter((s) => s !== search),
                            );
                          }}
                          className="w-4 h-4 text-gray-400 hover:text-gray-600"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Search Recommendations */}
      {searchRecommendations.length > 0 && (
        <div className="bg-gray-50 border-b border-gray-200 py-4">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-wrap gap-2">
              {searchRecommendations.map((recommendation, index) => (
                <button
                  key={index}
                  onClick={() => handleRecommendationClick(recommendation)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all duration-200 capitalize"
                >
                  {recommendation}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="block lg:hidden px-4 py-3 bg-white">
        <button
          onClick={() => setShowMobileFilters(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Filter className="w-4 h-4" />
          Filters
          <span className="bg-white text-blue-600 px-2 py-1 rounded text-xs font-bold">
            {filters.categories.length +
              filters.colors.length +
              filters.sizes.length +
              filters.brands.length}
          </span>
        </button>
      </div>

      {showMobileFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden">
          <div
            ref={mobileFiltersRef}
            className="absolute top-0 left-0 right-0 bg-white max-h-screen overflow-y-auto shadow-xl"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-900" />
              </button>
            </div>

            <div className="p-4">
              <Accordion
                type="multiple"
                defaultValue={["category", "price", "size", "color", "brand"]}
                className="w-full"
              >
                <AccordionItem value="category">
                  <AccordionTrigger>Category</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      {categories.map((category) => (
                        <label
                          key={category.name}
                          className="flex items-center justify-between cursor-pointer p-2 hover:bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={filters.categories.includes(category.name)}
                              onChange={() => handleCategoryChange(category.name)}
                              className="w-5 h-5 text-blue-600 bg-white border-gray-300 rounded"
                            />
                            <span className="text-gray-900 text-base">
                              {category.name}
                            </span>
                          </div>
                          <span className="text-gray-500 text-sm bg-gray-100 px-2 py-1 rounded">
                            {category.count}
                          </span>
                        </label>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                {/* Add other filter sections similar to the original */}
              </Accordion>
            </div>
          </div>
        </div>
      )}

      <div className="flex max-w-7xl mx-auto">
        <aside className="w-64 p-6 bg-gray-50 hidden lg:block">
          <Accordion
            type="multiple"
            defaultValue={["category", "price", "size", "color", "brand"]}
          >
            <AccordionItem value="category">
              <AccordionTrigger className="font-medium text-gray-900">
                Category
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <label
                      key={category.name}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={filters.categories.includes(category.name)}
                          onChange={() => handleCategoryChange(category.name)}
                          className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded"
                        />
                        <span className="text-gray-900">{category.name}</span>
                      </div>
                      <span className="text-gray-500 text-sm">
                        {category.count}
                      </span>
                    </label>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            {/* Add other filter sections */}
          </Accordion>
        </aside>

        <main className="flex-1">
          <div className="p-6">
            <h2 className="text-xl font-medium text-gray-900 mb-6">
              Recommended products
            </h2>

            {isLoading || isPending ? (
              <LoadingSkeleton />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
                  >
                    <div className="relative mb-4">
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="w-full h-48 object-cover rounded-md"
                      />
                    </div>
                    <h3 className="font-medium text-gray-900 mb-2">
                      {product.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 text-sm">
                          {product.price}
                        </span>
                      </div>
                      <button className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md transition-colors">
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isLoading && !isPending && filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  No products found matching your criteria.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default KalifindSearchTest;
