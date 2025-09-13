import React, {
  useState,
  useTransition,
  useRef,
  useEffect,
  useMemo,
} from "react";
import { Search, ShoppingCart, X, Filter, ChevronDown } from "lucide-react";

import { useDebounce } from "@/hooks/use-debounce";
import { Slider } from "@/components/ui/slider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

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
  onClose?: () => void;
  searchQuery?: string; // Accept search query from parent
  hideHeader?: boolean; // Hide header for mobile/tablet
}> = ({
  userId,
  apiKey,
  storeId,
  storeType,
  onClose,
  searchQuery: initialSearchQuery,
  hideHeader = false,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || "");
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<
    string[]
  >([]);
  const [isAutocompleteLoading, setIsAutocompleteLoading] = useState(false);
  const [isPriceLoading, setIsPriceLoading] = useState(true);
  const [maxPrice, setMaxPrice] = useState<number>(10000); // Default max price
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState<{
    [key: string]: number;
  }>({});
  const [sortOption, setSortOption] = useState("default");
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    priceRange: [0, 5000], // Default price range
    colors: [],
    sizes: [],
    brands: [],
    genders: [],
  });

  // Sync search query from parent (for mobile/tablet)
  useEffect(() => {
    if (
      initialSearchQuery !== undefined &&
      initialSearchQuery !== searchQuery
    ) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const debouncedPriceRange = useDebounce(filters.priceRange, 500);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sizes = [38, 39, 40, 41, 42, 43, 44, 45];
  const colors = ["black", "white", "red", "blue", "yellow"];

  const isAnyFilterActive =
    !!debouncedSearchQuery ||
    filters.categories.length > 0 ||
    filters.brands.length > 0 ||
    filters.colors.length > 0 ||
    filters.sizes.length > 0 ||
    filters.priceRange[1] < maxPrice;

  useEffect(() => {
    const initFilters = async () => {
      // if (!storeId || !storeType) return; // Don't fetch if we don't have the required params
      setIsPriceLoading(true);
      try {
        const params = new URLSearchParams();
        // params.append("storeId", storeId.toString());
        // params.append("storeType", storeType);
        params.append("storeId", "28");
        params.append("storeType", "woocommerce");

        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/v1/search?${params.toString()}`,
          {
            headers: { "X-Api-Key": apiKey || "" },
          },
        );
        const result = await response.json();
        if (Array.isArray(result)) {
          setTotalProducts(result.length);
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

          const allCategories = new Set<string>();
          const allBrands = new Set<string>();
          const counts: { [key: string]: number } = {};
          result.forEach((product: any) => {
            if (product.categories) {
              product.categories.forEach((cat: string) => {
                allCategories.add(cat);
                counts[cat] = (counts[cat] || 0) + 1;
              });
            }
            if (product.brands) {
              product.brands.forEach((brand: string) => allBrands.add(brand));
            }
          });
          setAvailableCategories(Array.from(allCategories));
          setAvailableBrands(Array.from(allBrands));
          setCategoryCounts(counts);
        } else {
          console.error("Initial search result is not an array:", result);
        }
      } catch (err) {
        console.error("Failed to fetch initial filter data:", err);
      } finally {
        setIsPriceLoading(false);
      }
    };

    initFilters();
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
            // if (storeId) {
            //   params.append("storeId", storeId.toString());
            // }
            // if (storeType) {
            //   params.append("storeType", storeType);
            // }

            params.append("storeId", "28");
            params.append("storeType", "woocommerce");

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
          // if (storeId) {
          //   params.append("storeId", storeId.toString());
          // }
          // if (storeType) {
          //   params.append("storeType", storeType);
          // }
          params.append("storeId", "28");
          params.append("storeType", "woocommerce");

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

  const sortedProducts = useMemo(() => {
    const productsToSort = [...filteredProducts];
    switch (sortOption) {
      case "a-z":
        return productsToSort.sort((a, b) => a.title.localeCompare(b.title));
      case "z-a":
        return productsToSort.sort((a, b) => b.title.localeCompare(a.title));
      case "price-asc":
        return productsToSort.sort(
          (a, b) => parseFloat(a.price) - parseFloat(b.price),
        );
      case "price-desc":
        return productsToSort.sort(
          (a, b) => parseFloat(b.price) - parseFloat(a.price),
        );
      default:
        return productsToSort;
    }
  }, [filteredProducts, sortOption]);

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
    <div className="!grid !grid-cols-1 sm:!grid-cols-2 lg:!grid-cols-3 xl:!grid-cols-4 !gap-6 !w-full">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="!bg-loading !rounded-lg !p-4 !animate-pulse-slow !w-full"
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
      {!hideHeader && (
        <header className="!bg-background !py-3 !w-screen">
          <div className="!flex !items-center justify-center lg:!gap-24 !mx-auto flex-col lg:flex-row !w-full">
            <div className="!flex !items-center !gap-2 justify-between md:justify-normal">
              <div className="lg:!flex !items-center !hidden">
                <a href="/" className="!s-center">
                  <img
                    src={`https://kalifinder-search.pages.dev/KalifindLogo.png`}
                    alt="Kalifind"
                    // className="!h-auto !w-full !max-w-[200px] !max-h-14 !object-contain !object-center"
                    className="!h-auto !w-full !max-w-[200px] !max-h-14 !object-contain !object-center"
                  />
                </a>
              </div>
            </div>

            <div className="!flex-1 !relative !w-full" ref={searchRef}>
              <div
                className="!flex !items-center !gap-2 !flex-1 !w-full"
                ref={searchRef}
              >
                <div className="!w-full flex">
                  <div className="!relative !flex-1 !w-full">
                    <Search className="!absolute !left-2 !top-1/2 !transform !-translate-y-1/2 !text-muted-foreground !w-5 !h-5" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      onFocus={() => setShowAutocomplete(true)}
                      onKeyDown={handleKeyDown}
                      placeholder="Search"
                      className="!w-full !pl-9 !pr-4 !py-3 !border-b-2 !border-search-highlight !text-foreground !placeholder-muted-foreground focus:!outline-none focus:!border-none focus:!ring-0"
                    />

                    {/* <div className="!absolute !right-3 !top-1/2 !transform !-translate-y-1/2 !flex !gap-2"></div> */}
                  </div>
                  <button
                    className="!rounded-lg hover:!bg-muted/20 !transition-colors !duration-200 !flex-shrink-0"
                    aria-label="Close search"
                    onClick={onClose}
                  >
                    <X className="!mr-6 !w-6 !h-6 !text-muted-foreground hover:!text-foreground !transition-colors !duration-200" />
                  </button>
                </div>
              </div>

              {showAutocomplete &&
                (autocompleteSuggestions.length > 0 ||
                  isAutocompleteLoading ||
                  debouncedSearchQuery) && (
                  <div className="!absolute !top-full !left-0 !right-0 !bg-background !border !border-border !rounded-lg !shadow-lg !z-50 !mt-1 !w-full">
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
                            {autocompleteSuggestions.map(
                              (suggestion, index) => (
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
                              ),
                            )}
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
      )}

      <div className="!fixed !bottom-4 !left-1/2 !-translate-x-1/2 !z-50 !block lg:!hidden">
        <Drawer>
          <DrawerTrigger asChild>
            <button className="!flex !items-center !gap-2 !px-4 !py-3 !bg-primary !text-primary-foreground !rounded-full !font-medium !shadow-lg !hover:!bg-primary-hover !transition-all !duration-300 !transform !hover:!scale-105">
              <Filter className="!w-4 !h-4" />
              Filters
              <span className="!bg-primary-foreground !text-primary !px-2 !py-1 !rounded !text-xs !font-bold">
                {filters.categories.length +
                  filters.colors.length +
                  filters.sizes.length +
                  filters.brands.length}
              </span>
            </button>
          </DrawerTrigger>
          <DrawerContent className="z-[1000]">
            <div className=" !flex !items-center !justify-between p-4 !bg-background !sticky !top-0 !z-10">
              <h2 className="pl-2 text-xs !text-foreground">
                <b>{totalProducts}</b> products found
              </h2>
              <DrawerClose asChild>
                <button className="!pr-1 hover:!bg-muted !rounded-full !transition-colors">
                  <X className="!w-5 !h-5 !text-foreground" />
                </button>
              </DrawerClose>
            </div>

            <div className="!px-4 sm:!p-4 overflow-y-auto max-h-[87vh]">
              <Accordion
                type="multiple"
                defaultValue={["category", "price", "size", "color", "brand"]}
                className="!w-full"
              >
                <AccordionItem value="category">
                  <AccordionTrigger className="!font-extrabold">
                    Categories
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="!space-y-2">
                      {availableCategories.map((category) => (
                        <label
                          key={category}
                          className="!flex !items-center !justify-between !cursor-pointer !p-1 sm:!p-2 hover:!bg-muted !rounded-lg"
                        >
                          <div className="!flex !items-center !gap-3">
                            <input
                              type="checkbox"
                              checked={filters.categories.includes(category)}
                              onChange={() => handleCategoryChange(category)}
                              className="!w-4 !h-4 sm:!w-5 sm:!h-5 !text-primary !bg-background !border-border !rounded "
                            />
                            <span className="!text-foreground !text-sm sm:!text-base">
                              {category}
                            </span>
                          </div>
                          <span className="!text-muted-foreground !text-sm !bg-muted !px-2 !py-1 !rounded">
                            {categoryCounts[category] || 0}
                          </span>
                        </label>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="brand">
                  <AccordionTrigger className="!font-extrabold">
                    Brand
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="!space-y-2">
                      {availableBrands.map((brand) => (
                        <label
                          key={brand}
                          className="!flex !items-center !justify-between !cursor-pointer !p-1 sm:!p-2 hover:!bg-muted !rounded-lg"
                        >
                          <div className="!flex !items-center !gap-3">
                            <input
                              type="checkbox"
                              checked={filters.brands.includes(brand)}
                              onChange={() => handleBrandChange(brand)}
                              className="!w-4 !h-4 sm:!w-5 sm:!h-5 !text-primary !bg-background !border-border !rounded "
                            />
                            <span className="!text-foreground !text-sm sm:!text-base">
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
                    <AccordionTrigger className="!font-extrabold">
                      Price
                    </AccordionTrigger>
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
                  <AccordionTrigger className="!font-extrabold">
                    Size
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="!grid !grid-cols-4 !gap-2 !pt-4">
                      {sizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => handleSizeChange(size)}
                          className={`!border !border-border !rounded-lg !py-2 !text-sm sm:!py-3 sm:!text-base !font-medium ${
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
                  <AccordionTrigger className="!font-extrabold">
                    Color
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="!flex !gap-2 !flex-wrap !pt-4">
                      {colors.map((color) => (
                        <button
                          key={color}
                          onClick={() => handleColorChange(color)}
                          className={`!w-10 !h-10 sm:!w-12 sm:!h-12 !rounded-full !border-4 !transition-all ${
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

              <div className="!flex !gap-2 !py-4 !border-t !border-border">
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
                  className="!flex-1 !py-2 sm:!py-3 !border !border-border !text-foreground !rounded-lg !font-medium hover:!bg-muted !transition-colors"
                >
                  Clear All
                </button>
                <DrawerClose asChild>
                  <button className="!flex-1 !py-2 sm:!py-3 !bg-primary !text-primary-foreground !rounded-lg !font-medium hover:!bg-primary-hover !transition-colors">
                    Apply Filters
                  </button>
                </DrawerClose>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      {/* <div className="!flex !w-full !max-w-7xl !mx-auto"> */}
      <div className="!flex !w-full pl-4 !mx-auto">
        <aside className="!w-64 !p-4 !bg-filter-bg !hidden lg:!block">
          <Accordion
            type="multiple"
            defaultValue={["category", "price", "size", "color", "brand"]}
          >
            <AccordionItem value="category">
              <AccordionTrigger className="!font-bold !text-foreground">
                Category
              </AccordionTrigger>
              <AccordionContent>
                <div className="!space-y-2">
                  {availableCategories.map((category) => (
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
                      <span className="!text-muted-foreground !text-sm mr-2">
                        {categoryCounts[category] || 0}
                      </span>
                    </label>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="brand">
              <AccordionTrigger className="!font-bold !text-foreground">
                Brand
              </AccordionTrigger>
              <AccordionContent>
                <div className="!space-y-2">
                  {availableBrands.map((brand) => (
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
                <AccordionTrigger className="!font-bold !text-foreground">
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
              <AccordionTrigger className="!font-bold !text-foreground">
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
              <AccordionTrigger className="!font-bold !text-foreground">
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

        <main className="!flex-1 !w-full">
          {recentSearches.length > 0 && (
            <div className="!pt-2 sm:!pt-8 !px-4 sm:!px-0 sm:!pl-6 !pb-4 !w-full">
              <h2 className="!text-base sm:!text-xl !font-medium !text-foreground !mb-2">
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
          <div className="!pr-4 sm:!pr-4 lg:!pr-8 !w-full">
            {/* <div className=""> */}
            <h2 className="!text-base sm:!text-xl !font-medium !text-foreground !mb-2">
              {isAnyFilterActive ? "Search Results" : "Recommended products"}
            </h2>
            <div className="!mb-4 flex justify-between items-center text-xs !text-muted-foreground">
              {isAnyFilterActive ? (
                <div>
                  <b>{filteredProducts.length}</b> products found
                </div>
              ) : (
                <div>
                  <b>{totalProducts}</b> products found
                </div>
              )}
              <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <div className="!flex !items-center !border !border-border !px-3 !py-2 !rounded-md">
                      Sort By
                      <ChevronDown className="!w-4 !h-4 !ml-2" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="z-[100000]"
                    container={document.body}
                  >
                    <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setSortOption("default");
                      }}
                    >
                      Default
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setSortOption("a-z");
                      }}
                    >
                      Name: A-Z
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setSortOption("z-a");
                      }}
                    >
                      Name: Z-A
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setSortOption("price-asc");
                      }}
                    >
                      Price: Low to High
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setSortOption("price-desc");
                      }}
                    >
                      Price: High to Low
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {isLoading || isPending ? (
              <LoadingSkeleton />
            ) : (
              <div className="!grid !grid-cols-1 sm:!grid-cols-2 lg:!grid-cols-3 xl:!grid-cols-4 !gap-4 sm:!gap-6 !w-full">
                {sortedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="!bg-background !border !border-border !rounded-lg !p-2 sm:!p-4 hover:!shadow-lg !transition-shadow !w-full"
                  >
                    <div className="!relative !mb-4">
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="!w-full !h-36 sm:!h-48 !object-cover !rounded-md"
                      />
                    </div>
                    <h3 className="!text-sm sm:!text-base !font-medium !text-foreground !mb-2">
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

            {!isLoading && !isPending && sortedProducts.length === 0 && (
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
