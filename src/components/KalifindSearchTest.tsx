import React, { useState, useTransition, useRef, useEffect } from "react";
import { Search, ShoppingCart, X, Filter } from "lucide-react";

import { useDebounce } from "@/hooks/use-debounce";
import { Slider } from "@/components/ui/slider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

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
  genders: string[];
}

const KalifindSearchTest: React.FC<{
  storeId?: string;
  storeType?: string;
  userId?: string;
  apiKey?: string;
  onClose?: () => void; // Add onClose to props
}> = ({ userId, apiKey, storeId, storeType, onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [recentSearches, setRecentSearches] = useState([
    // "Sunglass",
    // "Adidas shoes",
    "",
  ]);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<
    string[]
  >([]);
  const [isAutocompleteLoading, setIsAutocompleteLoading] = useState(false);
  const [isPriceLoading, setIsPriceLoading] = useState(true);
  const [maxPrice, setMaxPrice] = useState<number>(5000); // Default max price
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    priceRange: [0, 5000], // Default price range
    colors: [],
    sizes: [],
    brands: [],
    genders: [],
  });

  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const debouncedPriceRange = useDebounce(filters.priceRange, 500);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileFiltersRef = useRef<HTMLDivElement>(null);

  const sizes = [38, 39, 40, 41, 42, 43, 44, 45];
  const colors = ["black", "white", "red", "blue", "yellow"];

  const isAnyFilterActive =
    filters.categories.length > 0 ||
    filters.brands.length > 0 ||
    filters.colors.length > 0 ||
    filters.sizes.length > 0 ||
    filters.priceRange[1] < maxPrice;

  useEffect(() => {
    const initMaxPrice = async () => {
      if (!storeId || !storeType) return; // Don't fetch if we don't have the required params
      setIsPriceLoading(true);
      try {
        const params = new URLSearchParams();
        params.append("storeId", storeId.toString());
        params.append("storeType", storeType);

        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/v1/search?${params.toString()}`,
          {
            headers: { "X-Api-Key": apiKey || "" },
          },
        );
        const result = await response.json();
        if (Array.isArray(result)) {
          const prices = result
            .map((p: any) => parseFloat(p.price))
            .filter((p) => !isNaN(p));
          if (prices.length > 0) {
            const max = Math.max(...prices);
            setMaxPrice(max);
            setFilters((prev: any) => ({
              ...prev,
              priceRange: [0, max],
            }));
          }
        } else {
          console.error("Initial search result is not an array:", result);
        }
      } catch (err) {
        console.error("Failed to fetch initial max price:", err);
      } finally {
        setIsPriceLoading(false);
      }
    };

    initMaxPrice();
  }, [apiKey, storeId, storeType]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowAutocomplete(false);
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

  // Autocomplete search
  useEffect(() => {
    if (debouncedSearchQuery) {
      startTransition(() => {
        setIsAutocompleteLoading(true);
        (async () => {
          try {
            const params = new URLSearchParams();
            if (debouncedSearchQuery) {
              params.append("q", debouncedSearchQuery);
            }
            if (storeId) {
              params.append("storeId", storeId.toString());
            }
            if (storeType) {
              params.append("storeType", storeType);
            }
            const response = await fetch(
              `${
                import.meta.env.VITE_BACKEND_URL
              }/v1/autocomplete?${params.toString()}`,
              {
                headers: {
                  "X-Api-Key": apiKey || "",
                },
              },
            );

            if (!response.ok) {
              throw new Error("bad response");
            }

            const result = await response.json();
            console.log("auto", result);
            setAutocompleteSuggestions(result.map((r: any) => r.title) || []);
          } catch (error) {
            console.error("Failed to fetch autocomplete suggestions:", error);
            setAutocompleteSuggestions([]);
          } finally {
            setIsAutocompleteLoading(false);
          }
        })();
      });
    } else {
      setAutocompleteSuggestions([]);
    }
  }, [debouncedSearchQuery, apiKey]);

  // search products
  useEffect(() => {
    if (isPriceLoading) {
      return; // Wait for the initial price to be loaded
    }

    startTransition(() => {
      setIsLoading(true);
      const fetchProducts = async () => {
        if (
          typeof debouncedPriceRange[0] === "undefined" ||
          typeof debouncedPriceRange[1] === "undefined"
        ) {
          setFilteredProducts([]);
          setIsLoading(false);
          return;
        }

        try {
          const params = new URLSearchParams();
          if (debouncedSearchQuery) {
            params.append("q", debouncedSearchQuery);
          }
          if (storeId) {
            params.append("storeId", storeId.toString());
          }
          if (storeType) {
            params.append("storeType", storeType);
          }

          if (filters.categories.length > 0) {
            params.append("categories", filters.categories.join(","));
          }
          if (filters.colors.length > 0) {
            params.append("colors", filters.colors.join(","));
          }
          if (filters.sizes.length > 0) {
            params.append("sizes", filters.sizes.join(","));
          }
          if (filters.brands.length > 0) {
            params.append("brands", filters.brands.join(","));
          }
          params.append("minPrice", debouncedPriceRange[0].toString());
          params.append(
            "maxPrice",
            debouncedPriceRange[1].toString() ?? "999999",
          );

          const response = await fetch(
            `${
              import.meta.env.VITE_BACKEND_URL
            }/v1/search?${params.toString()}`,
            {
              headers: {
                "X-Api-Key": apiKey || "",
              },
            },
          );
          console.log("User ID:", userId);
          console.log(
            `${import.meta.env.VITE_BACKEND_URL}/v1/search?${params.toString()}`,
          );
          if (!response.ok) {
            throw new Error("bad response");
          }
          const result = await response.json();
          setFilteredProducts(result);
          console.log(result);
        } catch (error) {
          console.error("Failed to fetch products:", error);
          setFilteredProducts([]);
        } finally {
          setIsLoading(false);
        }
      };

      fetchProducts();
    });
  }, [
    isPriceLoading, // Add this
    debouncedSearchQuery,
    filters.categories,
    filters.colors,
    filters.sizes,
    filters.brands,
    filters.priceRange,
    debouncedPriceRange,
    apiKey,
    userId,
  ]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const query = event.currentTarget.value;
      if (query) {
        setRecentSearches((prev) => {
          if (prev.includes(query)) {
            return [query, ...prev.filter((item) => item !== query)].slice(
              0,
              10,
            );
          }
          return [query, ...prev].slice(0, 10);
        });
        setShowAutocomplete(false);
        inputRef.current?.blur();
      }
    }
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
    <div className="!grid !grid-cols-1 sm:!grid-cols-2 lg:!grid-cols-3 xl:!grid-cols-4 !gap-4 !p-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="!bg-loading !rounded-lg !p-4 !animate-pulse-slow"
        >
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
      <header className="!bg-background !py-3">
        <div className="!flex !items-center justify-between lg:!gap-24 !max-w-7xl flex-col lg:flex-row">
          <div className="!flex !items-center !gap-2 justify-between md:justify-normal">
            <div className="!flex !items-center">
              <a href="/" className="!flex !items-center">
                <img
                  src={`https://kalifinder-search.pages.dev/KalifindLogo.png`}
                  alt="Kalifind"
                  className="!h-auto !w-full !max-w-[200px] !max-h-14 object-contain object-center"
                />
              </a>
            </div>
          </div>

          <div className="!flex-1 !relative ml-2 w-full" ref={searchRef}>
            <div
              className="!flex !items-center !gap-2 !flex-1 w-full"
              ref={searchRef}
            >
              <div className="!relative !flex-1">
                <Search className="!absolute !left-3 !top-1/2 !transform !-translate-y-1/2 !text-muted-foreground !w-5 !h-5" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => setShowAutocomplete(true)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search"
                  className="!w-full !pl-10 !pr-4 !py-3 !border-b-2 !border-search-highlight !text-foreground !placeholder-muted-foreground focus:!outline-none focus:!border-none focus:!ring-0"
                />

                <div className="!absolute !right-3 !top-1/2 !transform !-translate-y-1/2 !flex !gap-2"></div>
              </div>

              <button
                className="p-1 rounded-lg hover:bg-muted/20 transition-colors duration-200 flex-shrink-0"
                aria-label="Close search"
                onClick={onClose}
              >
                <X className="w-6 h-6 text-muted-foreground hover:text-foreground transition-colors duration-200" />
              </button>
            </div>

            {showAutocomplete &&
              (autocompleteSuggestions.length > 0 ||
                isAutocompleteLoading ||
                debouncedSearchQuery) && (
                <div className="!absolute !top-full !left-0 !right-0 !bg-background !border !border-border !rounded-lg !shadow-lg !z-50 !mt-1">
                  <div className="!z-[999] !p-4">
                    {isAutocompleteLoading ? (
                      <div className="!text-center !py-2 !text-muted-foreground">
                        Loading suggestions...
                      </div>
                    ) : autocompleteSuggestions.length > 0 ? (
                      <>
                        <h3 className="!text-sm !font-medium !text-foreground !mb-3">
                          Suggestions
                        </h3>
                        <div className="!space-y-2">
                          {autocompleteSuggestions.map((suggestion, index) => (
                            <div
                              key={index}
                              className="!flex !items-center !gap-2 !cursor-pointer hover:!bg-muted !p-2 !rounded"
                              onClick={() => {
                                handleSearch(suggestion);
                                setShowAutocomplete(false);
                              }}
                            >
                              <Search className="!w-4 !h-4 !text-muted-foreground" />
                              <span className="!text-muted-foreground">
                                {suggestion}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : debouncedSearchQuery && !isAutocompleteLoading ? (
                      <div className="!text-center !py-2 !text-muted-foreground">
                        No suggestions found.
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
          </div>
        </div>
      </header>

      <div className="!block lg:!hidden !px-4 !py-3 !bg-background ">
        <button
          onClick={() => setShowMobileFilters(true)}
          className="!flex !items-center !gap-2 !px-4 !py-2 !bg-primary !text-primary-foreground !rounded-lg !font-medium hover:!bg-primary-hover !transition-colors"
        >
          <Filter className="!w-4 !h-4" />
          Filters
          <span className="!bg-primary-foreground !text-primary !px-2 !py-1 !rounded !text-xs !font-bold">
            {filters.categories.length +
              filters.colors.length +
              filters.sizes.length +
              filters.brands.length}
          </span>
        </button>
      </div>

      {showMobileFilters && (
        <div className="!fixed !inset-0 !bg-black !bg-opacity-50 !z-50 lg:!hidden">
          <div
            ref={mobileFiltersRef}
            className="!absolute !top-0 !left-0 !right-0 !bg-background !max-h-screen !overflow-y-auto !shadow-xl"
          >
            <div className="!flex !items-center !justify-between !p-4 !border-b !border-border !bg-background !sticky !top-0 !z-10">
              <h2 className="!text-lg !font-semibold !text-foreground">
                Filters
              </h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="!p-2 !hover:bg-muted !rounded-full !transition-colors"
              >
                <X className="!w-5 !h-5 !text-foreground" />
              </button>
            </div>

            <div className="!p-4">
              <Accordion
                type="multiple"
                defaultValue={["category", "price", "size", "color", "brand"]}
                className="!w-full"
              >
                <AccordionItem value="category">
                  <AccordionTrigger>Category</AccordionTrigger>
                  <AccordionContent>
                    <div className="!space-y-3">
                      {filters.categories.map((category) => (
                        <label
                          key={category}
                          className="!flex !items-center !justify-between !cursor-pointer !p-2 hover:!bg-muted !rounded-lg"
                        >
                          <div className="!flex !items-center !gap-3">
                            <input
                              type="checkbox"
                              checked={filters.categories.includes(category)}
                              onChange={() => handleCategoryChange(category)}
                              className="!w-5 !h-5 !text-primary !bg-background !border-border !rounded "
                            />
                            <span className="!text-foreground !text-base">
                              {category}
                            </span>
                          </div>
                          <span className="!text-muted-foreground !text-sm !bg-muted !px-2 !py-1 !rounded">
                            {/* {category.length} */}
                          </span>
                        </label>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="brand">
                  <AccordionTrigger>Brand</AccordionTrigger>
                  <AccordionContent>
                    <div className="!space-y-3">
                      {filters.brands.map((brand) => (
                        <label
                          key={brand}
                          className="!flex !items-center !justify-between !cursor-pointer !p-2 hover:!bg-muted !rounded-lg"
                        >
                          <div className="!flex !items-center !gap-3">
                            <input
                              type="checkbox"
                              checked={filters.brands.includes(brand)}
                              onChange={() => handleBrandChange(brand)}
                              className="!w-5 !h-5 !text-primary !bg-background !border-border !rounded "
                            />
                            <span className="!text-foreground !text-base">
                              {brand}
                            </span>
                          </div>
                          <span className="!text-muted-foreground !text-sm !bg-muted !px-2 !py-1 !rounded">
                            {/* {brand.length} */}
                          </span>
                        </label>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                {!isPriceLoading && (
                  <AccordionItem value="price">
                    <AccordionTrigger>Price</AccordionTrigger>
                    <AccordionContent>
                      <div className="!space-y-4 !pt-4">
                        <Slider
                          value={[filters.priceRange[1]]}
                          onValueChange={(value: any) =>
                            setFilters((prev: any) => ({
                              ...prev,
                              priceRange: [prev.priceRange[0], value[0]],
                            }))
                          }
                          max={maxPrice}
                          step={10}
                          className="!w-full"
                        />
                        <div className="!flex !justify-between !text-sm !text-muted-foreground">
                          <span>{filters.priceRange[0]} €</span>
                          <span>{filters.priceRange[1]} €</span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
                <AccordionItem value="size">
                  <AccordionTrigger>Size</AccordionTrigger>
                  <AccordionContent>
                    <div className="!grid !grid-cols-4 !gap-3 !pt-4">
                      {sizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => handleSizeChange(size)}
                          className={`!border !border-border !rounded-lg !py-3 !text-base !font-medium ${
                            filters.sizes.includes(size)
                              ? "!bg-primary !text-primary-foreground !border-primary"
                              : "!bg-background !text-foreground hover:!bg-muted"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="color">
                  <AccordionTrigger>Color</AccordionTrigger>
                  <AccordionContent>
                    <div className="!flex !gap-4 !flex-wrap !pt-4">
                      {colors.map((color) => (
                        <button
                          key={color}
                          onClick={() => handleColorChange(color)}
                          className={`!w-12 !h-12 !rounded-full !border-4 !transition-all ${
                            filters.colors.includes(color)
                              ? "!border-primary !scale-110 !shadow-lg"
                              : "!border-border hover:!border-muted-foreground"
                          } ${
                            color === "black"
                              ? "!bg-black"
                              : color === "white"
                                ? "!bg-white !border-gray-300"
                                : color === "red"
                                  ? "!bg-red-500"
                                  : color === "blue"
                                    ? "!bg-blue-500"
                                    : color === "yellow"
                                      ? "!bg-yellow-500"
                                      : ""
                          }`}
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="!flex !gap-3 !pt-4 !border-t !border-border">
                <button
                  onClick={() => {
                    setFilters({
                      categories: [],
                      priceRange: [0, maxPrice],
                      colors: [],
                      sizes: [],
                      brands: [],
                      genders: [],
                    });
                  }}
                  className="!flex-1 !py-3 !border !border-border !text-foreground !rounded-lg !font-medium  hover:!bg-muted !transition-colors"
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

      <div className="!flex !w-full">
        <aside className="!w-64 !p-6 !bg-filter-bg !hidden lg:!block">
          <Accordion
            type="multiple"
            defaultValue={["category", "price", "size", "color", "brand"]}
          >
            <AccordionItem value="category">
              <AccordionTrigger className="!font-medium !text-foreground">
                Category
              </AccordionTrigger>
              <AccordionContent>
                <div className="!space-y-2">
                  {filters.categories.map((category) => (
                    <label
                      key={category}
                      className="!flex !items-center !justify-between !cursor-pointer"
                    >
                      <div className="!flex !items-center !gap-2">
                        <input
                          type="checkbox"
                          checked={filters.categories.includes(category)}
                          onChange={() => handleCategoryChange(category)}
                          className="!w-4 !h-4 !text-primary !bg-background !border-border !rounded "
                        />
                        <span className="!text-foreground">{category}</span>
                      </div>
                      {/* <span className="!text-muted-foreground !text-sm"> */}
                      {/*   {category.length} */}
                      {/* </span> */}
                    </label>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="brand">
              <AccordionTrigger className="!font-medium !text-foreground">
                Brand
              </AccordionTrigger>
              <AccordionContent>
                <div className="!space-y-2">
                  {filters.brands.map((brand) => (
                    <label
                      key={brand}
                      className="!flex !items-center !justify-between !cursor-pointer"
                    >
                      <div className="!flex !items-center !gap-2">
                        <input
                          type="checkbox"
                          checked={filters.brands.includes(brand)}
                          onChange={() => handleBrandChange(brand)}
                          className="!w-4 !h-4 !text-primary !bg-background !border-border !rounded "
                        />
                        <span className="!text-foreground">{brand}</span>
                      </div>
                      {/* <span className="!text-muted-foreground !text-sm"> */}
                      {/*   {brand.length} */}
                      {/* </span> */}
                    </label>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            {!isPriceLoading && (
              <AccordionItem value="price">
                <AccordionTrigger className="!font-medium !text-foreground">
                  Price
                </AccordionTrigger>
                <AccordionContent>
                  <Slider
                    value={[filters.priceRange[1]]}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        priceRange: [prev.priceRange[0], value[0]],
                      }))
                    }
                    max={maxPrice}
                    step={10}
                    className="!w-full !mb-4 !mt-2"
                  />
                  <div className="!flex !justify-between !text-sm !text-muted-foreground">
                    <span>{filters.priceRange[0]} €</span>
                    <span>{filters.priceRange[1]} €</span>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
            <AccordionItem value="size">
              <AccordionTrigger className="!font-medium !text-foreground">
                Size
              </AccordionTrigger>
              <AccordionContent>
                <div className="!grid !grid-cols-4 !gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => handleSizeChange(size)}
                      className={`!border !border-border !rounded !py-2 !text-sm ${
                        filters.sizes.includes(size)
                          ? "!bg-primary !text-primary-foreground !border-primary"
                          : "!bg-background !text-foreground hover:!bg-muted"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="color">
              <AccordionTrigger className="!font-medium !text-foreground">
                Color
              </AccordionTrigger>
              <AccordionContent>
                <div className="!flex !gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleColorChange(color)}
                      className={`!w-8 !h-8 !rounded-full !border-2 ${
                        filters.colors.includes(color)
                          ? "!border-primary !scale-110"
                          : "!border-border"
                      } ${
                        color === "black"
                          ? "!bg-black"
                          : color === "white"
                            ? "!bg-white"
                            : color === "red"
                              ? "!bg-red-500"
                              : color === "blue"
                                ? "!bg-blue-500"
                                : color === "yellow"
                                  ? "!bg-yellow-500"
                                  : ""
                      }`}
                      style={{
                        transform: filters.colors.includes(color)
                          ? "scale(1.1)"
                          : "scale(1)",
                      }}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          {isAnyFilterActive && (
            <Button
              variant="ghost"
              className="!w-full !mt-4"
              onClick={() => {
                setFilters({
                  categories: [],
                  priceRange: [0, 1000],
                  colors: [],
                  sizes: [],
                  brands: [],
                  genders: [],
                });
              }}
            >
              Clear All Filters
            </Button>
          )}
        </aside>

        <main className="!flex-1">
          {recentSearches.length > 0 && (
            <div className="!pt-10 !pl-6 !pb-4">
              <h2 className="!text-xl !font-medium !text-foreground !mb-2">
                Recent Searches
              </h2>
              <div className="!flex !flex-wrap !gap-2">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(search)}
                    className="!bg-muted !text-muted-foreground hover:!bg-muted/80 !px-3 !py-1 !rounded-full !text-sm"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="!px-6">
            <h2 className="!text-xl !font-medium !text-foreground !mb-6">
              Recommended products
            </h2>

            {isLoading || isPending ? (
              <LoadingSkeleton />
            ) : (
              <div className="!grid !grid-cols-1 sm:!grid-cols-2 lg:!grid-cols-3 xl:!grid-cols-4 !gap-6">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="!bg-background !border !border-border !rounded-lg !p-4 hover:!shadow-lg !transition-shadow"
                  >
                    <div className="!relative !mb-4">
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="!w-full !h-48 !object-cover !rounded-md"
                      />
                    </div>
                    <h3 className="!font-medium !text-foreground !mb-2">
                      {product.title}
                    </h3>
                    <div className="!flex !items-center !justify-between">
                      <div className="!flex !items-center !gap-2">
                        <span className="!text-muted-foreground !text-sm">
                          {product.price}
                        </span>
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
                <p className="!text-muted-foreground">
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
