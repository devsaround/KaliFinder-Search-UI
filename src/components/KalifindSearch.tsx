import React, { useState, useTransition, useRef, useEffect } from 'react';
import { Search, ShoppingCart, X, Mic, Camera, Filter, ChevronDown } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  image: string;
  originalPrice: number;
  currentPrice: number;
  category: string;
  color: string;
  sizes: number[];
}

interface FilterState {
  categories: string[];
  priceRange: [number, number];
  sizes: number[];
  colors: string[];
}

const KalifindSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showRecentSearch, setShowRecentSearch] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [recentSearches, setRecentSearches] = useState(['Sunglass', 'Adidas shoes']);
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    priceRange: [0, 250],
    sizes: [],
    colors: []
  });

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileFiltersRef = useRef<HTMLDivElement>(null);

  // Mock data
  const mockProducts: Product[] = [
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
    {
      id: '2', 
      name: 'Sunglass',
      image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=300&h=200&fit=crop',
      originalPrice: 140,
      currentPrice: 120,
      category: 'Men',
      color: 'black',
      sizes: [39, 40, 41]
    },
    {
      id: '3',
      name: 'Sunglass', 
      image: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=300&h=200&fit=crop',
      originalPrice: 140,
      currentPrice: 120,
      category: 'Women',
      color: 'white',
      sizes: [38, 39, 40]
    },
    {
      id: '4',
      name: 'Sunglass',
      image: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=300&h=200&fit=crop',
      originalPrice: 140,
      currentPrice: 120,
      category: 'Women',
      color: 'brown',
      sizes: [40, 41, 42, 43]
    },
    {
      id: '5',
      name: 'Sunglass',
      image: 'https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=300&h=200&fit=crop',
      originalPrice: 140,
      currentPrice: 120,
      category: 'Men',
      color: 'black',
      sizes: [41, 42, 43]
    },
    {
      id: '6',
      name: 'Sunglass',
      image: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=300&h=200&fit=crop',
      originalPrice: 140,
      currentPrice: 120,
      category: 'Women',
      color: 'brown',
      sizes: [38, 39, 40, 41]
    },
    {
      id: '7',
      name: 'Sunglass',
      image: 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=300&h=200&fit=crop',
      originalPrice: 140,
      currentPrice: 120,
      category: 'Men',
      color: 'black',
      sizes: [40, 41, 42]
    },
    {
      id: '8',
      name: 'Sunglass',
      image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300&h=200&fit=crop',
      originalPrice: 140,
      currentPrice: 120,
      category: 'Women',
      color: 'white',
      sizes: [39, 40, 41, 42]
    }
  ];

  const categories = [
    { name: 'Men', count: 40 },
    { name: 'Women', count: 37 },
    { name: 'Kids', count: 12 }
  ];

  const sizes = [38, 39, 40, 41, 42, 43, 44, 45];
  const colors = ['black', 'white', 'red', 'blue', 'yellow'];

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowRecentSearch(false);
      }
      if (mobileFiltersRef.current && !mobileFiltersRef.current.contains(event.target as Node)) {
        setShowMobileFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter products
  useEffect(() => {
    startTransition(() => {
      setIsLoading(true);
      setTimeout(() => {
        let filtered = mockProducts;
        
        if (searchQuery) {
          filtered = filtered.filter(product => 
            product.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }

        if (filters.categories.length > 0) {
          filtered = filtered.filter(product => 
            filters.categories.includes(product.category)
          );
        }

        if (filters.colors.length > 0) {
          filtered = filtered.filter(product => 
            filters.colors.includes(product.color)
          );
        }

        if (filters.sizes.length > 0) {
          filtered = filtered.filter(product => 
            product.sizes.some(size => filters.sizes.includes(size))
          );
        }

        filtered = filtered.filter(product => 
          product.currentPrice >= filters.priceRange[0] && 
          product.currentPrice <= filters.priceRange[1]
        );

        setFilteredProducts(filtered);
        setIsLoading(false);
      }, 500);
    });
  }, [searchQuery, filters]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query && !recentSearches.includes(query)) {
      setRecentSearches(prev => [query, ...prev.slice(0, 4)]);
    }
  };

  const handleCategoryChange = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleSizeChange = (size: number) => {
    setFilters(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size]
    }));
  };

  const handleColorChange = (color: string) => {
    setFilters(prev => ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter(c => c !== color)
        : [...prev.colors, color]
    }));
  };

  const LoadingSkeleton = () => (
    <div className="!grid !grid-cols-1 sm:!grid-cols-2 lg:!grid-cols-3 xl:!grid-cols-4 !gap-4 !p-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="!bg-loading !rounded-lg !p-4 !animate-pulse-slow">
          <div className="!bg-loading-shimmer !h-48 !rounded-md !mb-4 !relative !overflow-hidden">
            <div className="!absolute !inset-0 !bg-gradient-to-r !from-transparent !via-loading-shimmer !to-transparent !animate-shimmer"></div>
          </div>
          <div className="!bg-loading-shimmer !h-4 !rounded !mb-2"></div>
          <div className="!bg-loading-shimmer !h-6 !rounded !w-20"></div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="!bg-background !min-h-screen">
      {/* Header */}
      <header className="!bg-background !border-b !border-border !px-4 !py-3">
        <div className="!flex !items-center !gap-4 !max-w-6xl !mx-auto">
          <div className="!flex !items-center !gap-2">
            <span className="!text-2xl !font-bold !text-foreground">Kalifind</span>
            <div className="!flex !gap-1">
              <div className="!w-2 !h-2 !bg-primary !rounded-full"></div>
              <div className="!w-2 !h-2 !bg-search-highlight !rounded-full"></div>
              <div className="!w-2 !h-2 !bg-yellow-500 !rounded-full"></div>
              <div className="!w-2 !h-2 !bg-red-500 !rounded-full"></div>
            </div>
          </div>

          <div className="!flex-1 !relative" ref={searchRef}>
            <div className="!relative">
              <Search className="!absolute !left-3 !top-1/2 !transform !-translate-y-1/2 !text-muted-foreground !w-5 !h-5" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => setShowRecentSearch(true)}
                placeholder="Search"
                className="!w-full !pl-10 !pr-20 !py-3 !bg-search-bar !border !border-search-highlight !rounded-full !text-foreground !placeholder-muted-foreground focus:!outline-none focus:!ring-2 focus:!ring-search-highlight focus:!border-transparent"
              />
              <div className="!absolute !right-3 !top-1/2 !transform !-translate-y-1/2 !flex !gap-2">
                <Mic className="!text-muted-foreground !w-5 !h-5 !cursor-pointer hover:!text-foreground" />
                <Camera className="!text-muted-foreground !w-5 !h-5 !cursor-pointer hover:!text-foreground" />
                <X className="!text-muted-foreground !w-5 !h-5 !cursor-pointer hover:!text-foreground" />
              </div>
            </div>

            {/* Recent Search Dropdown */}
            {showRecentSearch && (
              <div className="!absolute !top-full !left-0 !right-0 !bg-background !border !border-border !rounded-lg !shadow-lg !z-50 !mt-1">
                <div className="!p-4">
                  <div className="!flex !items-center !justify-between !mb-3">
                    <h3 className="!text-sm !font-medium !text-foreground">Recent Search</h3>
                    <span className="!text-xs !bg-red-100 !text-red-600 !px-2 !py-1 !rounded !uppercase">LIVE</span>
                  </div>
                  <div className="!space-y-2">
                    {recentSearches.map((search, index) => (
                      <div
                        key={index}
                        className="!flex !items-center !justify-between !cursor-pointer hover:!bg-muted !p-2 !rounded"
                        onClick={() => {
                          setSearchQuery(search);
                          setShowRecentSearch(false);
                        }}
                      >
                        <div className="!flex !items-center !gap-2">
                          <Search className="!w-4 !h-4 !text-muted-foreground" />
                          <span className="!text-muted-foreground">{search}</span>
                        </div>
                        <X className="!w-4 !h-4 !text-muted-foreground hover:!text-foreground" />
                      </div>
                    ))}
                  </div>
                  {searchQuery && (
                    <div className="!mt-4 !p-3 !bg-accent !rounded-lg">
                      <div className="!flex !items-start !gap-2">
                        <span className="!text-sm !font-medium !text-accent-foreground">AI Overview</span>
                      </div>
                      <p className="!text-sm !text-accent-foreground !mt-1">
                        You searched for {searchQuery}. We have different sizes, colors, brands that goes well for your choice.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Filter Button - Only visible on tablet/mobile */}
      <div className="!block lg:!hidden !px-4 !py-3 !border-b !border-border !bg-background">
        <button
          onClick={() => setShowMobileFilters(true)}
          className="!flex !items-center !gap-2 !px-4 !py-2 !bg-primary !text-primary-foreground !rounded-lg !font-medium hover:!bg-primary-hover !transition-colors"
        >
          <Filter className="!w-4 !h-4" />
          Filters
          <span className="!bg-primary-foreground !text-primary !px-2 !py-1 !rounded !text-xs !font-bold">
            {filters.categories.length + filters.sizes.length + filters.colors.length}
          </span>
        </button>
      </div>

      {/* Mobile Filter Modal Overlay */}
      {showMobileFilters && (
        <div className="!fixed !inset-0 !bg-black !bg-opacity-50 !z-50 lg:!hidden">
          <div 
            ref={mobileFiltersRef}
            className="!absolute !top-0 !left-0 !right-0 !bg-background !max-h-screen !overflow-y-auto !shadow-xl"
          >
            {/* Mobile Filter Header */}
            <div className="!flex !items-center !justify-between !p-4 !border-b !border-border !bg-background !sticky !top-0 !z-10">
              <h2 className="!text-lg !font-semibold !text-foreground">Filters</h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="!p-2 !hover:bg-muted !rounded-full !transition-colors"
              >
                <X className="!w-5 !h-5 !text-foreground" />
              </button>
            </div>

            {/* Mobile Filter Content */}
            <div className="!p-4 !space-y-6">
              {/* Category Filter */}
              <div>
                <h3 className="!font-medium !text-foreground !mb-3 !flex !items-center !justify-between">
                  Category
                  <ChevronDown className="!w-4 !h-4" />
                </h3>
                <div className="!space-y-3">
                  {categories.map((category) => (
                    <label key={category.name} className="!flex !items-center !justify-between !cursor-pointer !p-2 !hover:bg-muted !rounded-lg">
                      <div className="!flex !items-center !gap-3">
                        <input
                          type="checkbox"
                          checked={filters.categories.includes(category.name)}
                          onChange={() => handleCategoryChange(category.name)}
                          className="!w-5 !h-5 !text-primary !bg-background !border-border !rounded focus:!ring-primary"
                        />
                        <span className="!text-foreground !text-base">{category.name}</span>
                      </div>
                      <span className="!text-muted-foreground !text-sm !bg-muted !px-2 !py-1 !rounded">{category.count}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="!font-medium !text-foreground !mb-3 !flex !items-center !justify-between">
                  Price
                  <ChevronDown className="!w-4 !h-4" />
                </h3>
                <div className="!space-y-4">
                  <div className="!relative">
                    <input
                      type="range"
                      min="0"
                      max="250"
                      value={filters.priceRange[1]}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        priceRange: [prev.priceRange[0], parseInt(e.target.value)]
                      }))}
                      className="!w-full !h-3 !bg-muted !rounded-lg !appearance-none !cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${(filters.priceRange[1] / 250) * 100}%, hsl(var(--muted)) ${(filters.priceRange[1] / 250) * 100}%, hsl(var(--muted)) 100%)`
                      }}
                    />
                  </div>
                  <div className="!flex !justify-between !text-sm !text-muted-foreground">
                    <span>0 €</span>
                    <span>{filters.priceRange[1]} €</span>
                  </div>
                </div>
              </div>

              {/* Size Filter */}
              <div>
                <h3 className="!font-medium !text-foreground !mb-3 !flex !items-center !justify-between">
                  Size
                  <ChevronDown className="!w-4 !h-4" />
                </h3>
                <div className="!grid !grid-cols-4 !gap-3">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => handleSizeChange(size)}
                      className={`!border !border-border !rounded-lg !py-3 !text-base !font-medium ${
                        filters.sizes.includes(size)
                          ? '!bg-primary !text-primary-foreground !border-primary'
                          : '!bg-background !text-foreground hover:!bg-muted'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Filter */}
              <div>
                <h3 className="!font-medium !text-foreground !mb-3 !flex !items-center !justify-between">
                  Color
                  <ChevronDown className="!w-4 !h-4" />
                </h3>
                <div className="!flex !gap-4 !flex-wrap">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleColorChange(color)}
                      className={`!w-12 !h-12 !rounded-full !border-4 !transition-all ${
                        filters.colors.includes(color)
                          ? '!border-primary !scale-110 !shadow-lg'
                          : '!border-border hover:!border-muted-foreground'
                      } ${
                        color === 'black' ? '!bg-black' :
                        color === 'white' ? '!bg-white !border-gray-300' :
                        color === 'red' ? '!bg-red-500' :
                        color === 'blue' ? '!bg-blue-500' :
                        color === 'yellow' ? '!bg-yellow-500' : ''
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Apply/Clear Buttons */}
              <div className="!flex !gap-3 !pt-4 !border-t !border-border">
                <button
                  onClick={() => {
                    setFilters({
                      categories: [],
                      priceRange: [0, 250],
                      sizes: [],
                      colors: []
                    });
                  }}
                  className="!flex-1 !py-3 !border !border-border !text-foreground !rounded-lg !font-medium hover:!bg-muted !transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="!flex-1 !py-3 !bg-primary !text-primary-foreground !rounded-lg !font-medium hover:!bg-primary-hover !transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="!flex !max-w-6xl !mx-auto">
        {/* Sidebar Filters */}
        <aside className="!w-64 !p-6 !bg-filter-bg !border-r !border-border !hidden lg:!block">
          {/* Category Filter */}
          <div className="!mb-6">
            <h3 className="!font-medium !text-foreground !mb-3 !flex !items-center !justify-between">
              Category
              <svg className="!w-4 !h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </h3>
            <div className="!space-y-2">
              {categories.map((category) => (
                <label key={category.name} className="!flex !items-center !justify-between !cursor-pointer">
                  <div className="!flex !items-center !gap-2">
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(category.name)}
                      onChange={() => handleCategoryChange(category.name)}
                      className="!w-4 !h-4 !text-primary !bg-background !border-border !rounded focus:!ring-primary"
                    />
                    <span className="!text-foreground">{category.name}</span>
                  </div>
                  <span className="!text-muted-foreground !text-sm">{category.count}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="!mb-6">
            <h3 className="!font-medium !text-foreground !mb-3 !flex !items-center !justify-between">
              Price
              <svg className="!w-4 !h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </h3>
            <div className="!relative !mb-4">
              <input
                type="range"
                min="0"
                max="250"
                value={filters.priceRange[1]}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  priceRange: [prev.priceRange[0], parseInt(e.target.value)]
                }))}
                className="!w-full !h-2 !bg-muted !rounded-lg !appearance-none !cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${(filters.priceRange[1] / 250) * 100}%, hsl(var(--muted)) ${(filters.priceRange[1] / 250) * 100}%, hsl(var(--muted)) 100%)`
                }}
              />
            </div>
            <div className="!flex !justify-between !text-sm !text-muted-foreground">
              <span>0 €</span>
              <span>24+ €</span>
            </div>
          </div>

          {/* Size Filter */}
          <div className="!mb-6">
            <h3 className="!font-medium !text-foreground !mb-3 !flex !items-center !justify-between">
              Size
              <svg className="!w-4 !h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </h3>
            <div className="!grid !grid-cols-4 !gap-2">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => handleSizeChange(size)}
                  className={`!border !border-border !rounded !py-2 !text-sm ${
                    filters.sizes.includes(size)
                      ? '!bg-primary !text-primary-foreground !border-primary'
                      : '!bg-background !text-foreground hover:!bg-muted'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Color Filter */}
          <div className="!mb-6">
            <h3 className="!font-medium !text-foreground !mb-3 !flex !items-center !justify-between">
              Color
              <svg className="!w-4 !h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </h3>
            <div className="!flex !gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorChange(color)}
                  className={`!w-8 !h-8 !rounded-full !border-2 ${
                    filters.colors.includes(color)
                      ? '!border-primary !scale-110'
                      : '!border-border'
                  } ${
                    color === 'black' ? '!bg-black' :
                    color === 'white' ? '!bg-white' :
                    color === 'red' ? '!bg-red-500' :
                    color === 'blue' ? '!bg-blue-500' :
                    color === 'yellow' ? '!bg-yellow-500' : ''
                  }`}
                  style={{
                    transform: filters.colors.includes(color) ? 'scale(1.1)' : 'scale(1)'
                  }}
                />
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="!flex-1">
          {/* Recommended Products */}
          <div className="!p-6">
            <h2 className="!text-xl !font-medium !text-foreground !mb-6">Recommended products</h2>
            
            {isLoading || isPending ? (
              <LoadingSkeleton />
            ) : (
              <div className="!grid !grid-cols-1 sm:!grid-cols-2 lg:!grid-cols-3 xl:!grid-cols-4 !gap-6">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="!bg-background !border !border-border !rounded-lg !p-4 hover:!shadow-lg !transition-shadow">
                    <div className="!relative !mb-4">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="!w-full !h-48 !object-cover !rounded-md"
                      />
                    </div>
                    <h3 className="!font-medium !text-foreground !mb-2">{product.name}</h3>
                    <div className="!flex !items-center !justify-between">
                      <div className="!flex !items-center !gap-2">
                        <span className="!text-muted-foreground !line-through !text-sm">{product.originalPrice} €</span>
                        <span className="!font-bold !text-foreground">{product.currentPrice} €</span>
                      </div>
                      <button className="!bg-primary hover:!bg-primary-hover !text-primary-foreground !p-2 !rounded-md !transition-colors">
                        <ShoppingCart className="!w-4 !h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isLoading && !isPending && filteredProducts.length === 0 && (
              <div className="!text-center !py-12">
                <p className="!text-muted-foreground">No products found matching your criteria.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default KalifindSearch;