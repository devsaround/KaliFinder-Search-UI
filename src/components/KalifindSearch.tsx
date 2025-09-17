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
  storeUrl?: string;
}> = ({
  userId,
  apiKey,
  storeId = "2",
  storeType = "woocommerce",
  onClose,
  searchQuery: initialSearchQuery,
  hideHeader = false,
  storeUrl = "https://findifly.kinsta.cloud",
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

  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const storedSearches = localStorage.getItem("recentSearches");
      if (storedSearches) {
        setRecentSearches(JSON.parse(storedSearches));
      }
    } catch (error) {
      console.error("Failed to parse recent searches from localStorage", error);
      setRecentSearches([]);
    }
  }, []);

  // Save recent searches to localStorage
  useEffect(() => {
    try {
      if (recentSearches.length > 0) {
        localStorage.setItem("recentSearches", JSON.stringify(recentSearches));
      } else {
        localStorage.removeItem("recentSearches");
      }
    } catch (error) {
      console.error("Failed to save recent searches to localStorage", error);
    }
  }, [recentSearches]);

  // Sync search query from parent (for mobile/tablet)
  useEffect(() => {
    if (
      initialSearchQuery !== undefined &&
      initialSearchQuery !== searchQuery
    ) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const debouncedPriceRange = useDebounce(filters.priceRange, 300);

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
      if (!storeUrl) return;
      setIsPriceLoading(true);
      try {
        const params = new URLSearchParams();
        // params.append("storeId", storeId.toString());
        params.append("storeUrl", storeUrl);
        // params.append("storeId", "28");
        // params.append("storeType", "woocommerce");

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
  }, [apiKey, storeUrl]);

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
            if (storeUrl) {
              params.append("storeUrl", storeUrl);
            }

            // params.append("storeId", "28");
            // params.append("storeType", "woocommerce");

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
          if (storeUrl) {
            params.append("storeUrl", storeUrl);
          }
          // params.append("storeId", "28");
          // params.append("storeType", "woocommerce");

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
          const newSearches = [
            query,
            ...prev.filter((item) => item !== query),
          ].slice(0, 10);
          return newSearches;
        });
        setShowAutocomplete(false);
        inputRef.current?.blur();
      }
    }
  };

  const handleRemoveRecentSearch = (search: string) => {
    setRecentSearches((prev) => prev.filter((item) => item !== search));
  };

  const handleClearRecentSearches = () => {
    setRecentSearches([]);
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
    <div className="!grid !grid-cols-2 sm:!grid-cols-2 xl:grid-cols-3 2xl:!grid-cols-4 !gap-[16px] !w-full">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="!bg-loading !rounded-lg !p-[8px] md:!p-[16px] !animate-pulse-slow !w-full"
        >
          <div className="!bg-loading-shimmer !h-[128px] md:!h-[192px] !rounded-md !mb-[12px] md:!mb-[16px] !relative !overflow-hidden">
            <div className="!absolute !inset-0 !bg-gradient-to-r !from-transparent !via-loading-shimmer !to-transparent !animate-shimmer"></div>
          </div>
          <div className="!bg-loading-shimmer !h-[16px] !rounded !mb-[8px]"></div>
          <div className="!bg-loading-shimmer !h-[24px] !rounded !w-[80px]"></div>
        </div>
      ))}
    </div>
  );

  return (
    // <div className="box-border !bg-background !min-h-screen w-screen lg:pt-[4px] lg:px-[96px]">
    <div className="box-border !bg-background !min-h-screen w-screen lg:pt-[4px]">
      {!hideHeader && (
        <div className="!bg-background !w-full pt-[12px] lg:px-[48px]">
          <div className="!flex !items-center justify-center !mx-auto flex-col lg:flex-row !w-full ">
            <div className="!flex !items-center !gap-[8px] justify-between md:justify-normal">
              <div className="lg:!flex !items-center !hidden w-[340px]">
                <a href="/" className="!s-center">
                  <img
                    src={`https://kalifinder-search.pages.dev/KalifindLogo.png`}
                    alt="Kalifind"
                    className="mt-[8px] !h-auto w-[210px] !object-contain !object-center"
                  />
                </a>
              </div>
            </div>

            <div
              className="lg:pl-[0px] !flex-1 !relative !w-full px-[16px] md:px-0"
              ref={searchRef}
            >
              <div
                className="!flex !items-center !gap-[8px] !flex-1 !w-full"
                ref={searchRef}
              >
                <div className="!w-full flex ">
                  <div className="!relative !flex-1 !w-full !border-b-2 !border-search-highlight">
                    <Search className="!absolute !left-[7px] !top-1/2 !transform !-translate-y-1/2 !text-muted-foreground !w-[20px] !h-[20px]" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      onFocus={() => setShowAutocomplete(true)}
                      onKeyDown={handleKeyDown}
                      placeholder="Search"
                      className="!w-full !pl-[30px] !pr-[16px] !py-[12px] !text-foreground !placeholder-muted-foreground focus:!outline-none focus:!border-none focus:!ring-0"
                      style={{
                        background: "inherit",
                        border: "none",
                        color: "inherit",
                        paddingLeft: "30px",
                      }}
                    />

                    {/* <div className="!absolute !right-[12px] !top-1/2 !transform !-translate-y-1/2 !flex !gap-[8px]"></div> */}
                  </div>
                  <button
                    className="!rounded-lg hover:!bg-muted/20 !transition-colors !duration-200 !flex-shrink-0"
                    aria-label="Close search"
                    onClick={onClose}
                  >
                    <X className="font-bold !mr-[10px] !w-[25px] !h-[25px] !text-muted-foreground hover:!text-foreground !transition-colors !duration-200" />
                  </button>
                </div>
              </div>

              {showAutocomplete &&
                (autocompleteSuggestions.length > 0 ||
                  isAutocompleteLoading ||
                  debouncedSearchQuery) && (
                  <div className="!absolute !top-full !left-0 !right-0 !bg-background !border !border-border !rounded-lg !shadow-lg !z-50 !mt-[4px] !w-full">
                    <div className="!z-[999] !p-[16px]">
                      {isAutocompleteLoading ? (
                        <div className="!text-center !py-[8px] !text-muted-foreground">
                          Loading suggestions...
                        </div>
                      ) : autocompleteSuggestions.length > 0 ? (
                        <>
                          <h3 className="!text-[14px] leading-[6px] !font-medium !text-foreground !mb-[12px]">
                            Suggestions
                          </h3>
                          <div className="!space-y-[8px]">
                            {autocompleteSuggestions.map(
                              (suggestion, index) => (
                                <div
                                  key={index}
                                  className="!flex !items-center !gap-[8px] !cursor-pointer hover:!bg-muted !p-[8px] !rounded"
                                  onClick={() => {
                                    handleSearch(suggestion);
                                    setShowAutocomplete(false);
                                  }}
                                >
                                  <Search className="!w-[16px] !h-[16px] !text-muted-foreground" />
                                  <span className="!text-muted-foreground">
                                    {suggestion}
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        </>
                      ) : debouncedSearchQuery && !isAutocompleteLoading ? (
                        <div className="!text-center !py-[8px] !text-muted-foreground">
                          No suggestions found for {debouncedSearchQuery}.
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      <div className="!fixed !bottom-[16px] !left-1/2 !-translate-x-1/2 !z-50 !block lg:!hidden">
        <Drawer>
          <DrawerTrigger asChild>
            <button className="!flex !items-center !gap-[8px] !px-[16px] !py-[12px] !bg-primary !text-primary-foreground !rounded-full !font-medium !shadow-lg !hover:!bg-primary-hover !transition-all !duration-300 !transform !hover:!scale-105">
              <Filter className="!w-[16px] !h-[16px]" />
              Filters
              <span className="!bg-primary-foreground !text-primary !px-[8px] !py-[4px] !rounded-full !text-xs !font-bold">
                {filters.categories.length +
                  filters.colors.length +
                  filters.sizes.length +
                  filters.brands.length}
              </span>
            </button>
          </DrawerTrigger>
          <DrawerContent className="!z-[100000] !flex !flex-col max-h-[93vh]">
            <div className="!px-[16px] sm:!p-[16px] !overflow-y-auto !flex-1">
              <Accordion
                type="multiple"
                defaultValue={["category", "price", "size", "color", "brand"]}
                className="!w-full"
              >
                <AccordionItem value="category">
                  <AccordionTrigger className="!font-extrabold text-[16px]">
                    Categories
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="!space-y-[8px]">
                      {availableCategories.map((category) => (
                        <label
                          key={category}
                          className="!flex !items-center !justify-between !cursor-pointer !p-[4px] sm:!p-[8px] hover:!bg-muted !rounded-lg"
                        >
                          <div className="!flex !items-center !gap-[12px]">
                            <input
                              type="checkbox"
                              checked={filters.categories.includes(category)}
                              onChange={() => handleCategoryChange(category)}
                              className="!w-[16px] !h-[16px] sm:!w-5 sm:!h-5 !text-primary !bg-background !border-border !rounded "
                            />
                            <span className="!text-foreground !text-[14px] sm:!text-[16px] lg:leading-[24px]">
                              {category}
                            </span>
                          </div>
                          <span className="!text-muted-foreground !text-[12px] sm:!text-[14px] !bg-muted !px-[8px] !py-[4px] !rounded">
                            {categoryCounts[category] || 0}
                          </span>
                        </label>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="brand">
                  <AccordionTrigger className="!font-extrabold text-[16px]">
                    Brand
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="!space-y-[8px]">
                      {availableBrands.map((brand) => (
                        <label
                          key={brand}
                          className="!flex !items-center !justify-between !cursor-pointer !p-[4px] sm:!p-[8px] hover:!bg-muted !rounded-lg"
                        >
                          <div className="!flex !items-center !gap-[12px]">
                            <input
                              type="checkbox"
                              checked={filters.brands.includes(brand)}
                              onChange={() => handleBrandChange(brand)}
                              className="!w-[16px] !h-[16px] sm:!w-5 sm:!h-5 !text-primary !bg-background !border-border !rounded "
                            />
                            <span className="!text-foreground !text-[14px] sm:!text-[16px] lg:leading-[16px]">
                              {brand}
                            </span>
                          </div>
                          <span className="!text-muted-foreground !text-[12px] sm:!text-[14px] !bg-muted !px-[8px] !py-[4px] !rounded">
                            {/* {brand.length} */}
                          </span>
                        </label>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                {!isPriceLoading && (
                  <AccordionItem value="price">
                    <AccordionTrigger className="!font-extrabold text-[16px]">
                      <b className="!font-extrabold">Price</b>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="!space-y-[16px] !pt-[16px]">
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
                        <div className="!flex !justify-between !text-[14px] !text-muted-foreground">
                          <span>{filters.priceRange[0]} €</span>
                          <span>{filters.priceRange[1]} €</span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
                <AccordionItem value="size">
                  <AccordionTrigger className="!font-extrabold text-[16px]">
                    <b className="!font-extrabold">Size</b>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="!grid !grid-cols-4 !gap-[8px] !pt-[16px]">
                      {sizes.map((size) => (
                        <div
                          key={size}
                          onClick={() => handleSizeChange(size)}
                          className="my-border !rounded-lg !py-[8px] !text-[12px] sm:!py-[12px] sm:!text-[14px] !font-medium text-center"
                        >
                          {size}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                {/* <AccordionItem value="color"> */}
                {/*   <AccordionTrigger className="!font-extrabold text-[16px]"> */}
                {/*     <b className="!font-extrabold">Color</b> */}
                {/*   </AccordionTrigger> */}
                {/*   <AccordionContent> */}
                {/*     <div className="!flex !gap-[8px] !flex-wrap !pt-[16px]"> */}
                {/*       {colors.map((color) => ( */}
                {/*         <button */}
                {/*           key={color} */}
                {/*           onClick={() => handleColorChange(color)} */}
                {/*           className={`!w-[32px] !h-[32px] sm:!w-[40px] sm:!h-[40px] !rounded-full !border-4 !transition-all ${ */}
                {/*             filters.colors.includes(color) */}
                {/*               ? "!border-primary !scale-110 !shadow-lg" */}
                {/*               : "!border-border hover:!border-muted-foreground" */}
                {/*           } ${ */}
                {/*             color === "black" */}
                {/*               ? "!bg-black" */}
                {/*               : color === "white" */}
                {/*                 ? "!bg-white !border-gray-300" */}
                {/*                 : color === "red" */}
                {/*                   ? "!bg-red-500" */}
                {/*                   : color === "blue" */}
                {/*                     ? "!bg-blue-500" */}
                {/*                     : color === "yellow" */}
                {/*                       ? "!bg-yellow-500" */}
                {/*                       : "" */}
                {/*           }`} */}
                {/*         /> */}
                {/*       ))} */}
                {/*     </div> */}
                {/*   </AccordionContent> */}
                {/* </AccordionItem> */}
              </Accordion>
            </div>

            <div className="!mt-auto !bg-background">
              <div className="!flex !items-center !justify-between !p-[12px] !bg-gray-50">
                <div className="pl-[8px] text-[14px] !text-foreground">
                  <b>{totalProducts}</b> products found
                </div>
                <DrawerClose asChild>
                  <button className="!pr-[4px] hover:!bg-muted !rounded-full !transition-colors">
                    <X className="!w-[20px] !h-[20px] border bg-[#823BED] rounded-[9999px] !text-white" />
                  </button>
                </DrawerClose>
              </div>
              <div className="!flex !gap-[8px] !p-[16px] !border-t !border-border">
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
                  className="!flex-1 !py-[12px] !border !border-border !text-foreground !rounded-lg !font-medium hover:!bg-muted !transition-colors text-[14px]"
                >
                  Clear All
                </button>
                <DrawerClose asChild>
                  <button className="!flex-1 !py-[12px] !bg-primary !text-primary-foreground !rounded-lg !font-medium hover:!bg-primary-hover !transition-colors text-[14px]">
                    Apply Filters
                  </button>
                </DrawerClose>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      <div className="!flex !w-full lg:px-[64px] !mx-auto">
        <aside className="w-80 lg:!w-[312px] !p-[16px] !bg-filter-bg !hidden lg:!block">
          <Accordion
            type="multiple"
            defaultValue={["category", "price", "size", "color", "brand"]}
          >
            <AccordionItem value="category">
              <AccordionTrigger className="text-[16px] lg:text-[18px] !text-foreground">
                <b>Category</b>
              </AccordionTrigger>
              <AccordionContent>
                <div className="!space-y-[8px]">
                  {availableCategories.map((category) => (
                    <label
                      key={category}
                      className="!flex !items-center !justify-between !cursor-pointer"
                    >
                      <div className="!flex !items-center !gap-[10px]">
                        <input
                          type="checkbox"
                          checked={filters.categories.includes(category)}
                          onChange={() => handleCategoryChange(category)}
                          className="!w-[16px] !h-[16px] lg:!w-5 lg:!h-5 top-0 !text-primary !bg-background !border-border !rounded "
                        />
                        <span className="!text-foreground text-[14px] lg:text-[16px]">
                          {category}
                        </span>
                      </div>
                      <span className="!text-muted-foreground !text-[12px] lg:text-[14px] mr-[8px]">
                        {categoryCounts[category] || 0}
                      </span>
                    </label>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="brand">
              <AccordionTrigger className="text-[16px] lg:text-[18px] !font-extrabold !text-foreground">
                <b>Brand</b>
              </AccordionTrigger>
              <AccordionContent>
                <div className="!space-y-[8px]">
                  {availableBrands.map((brand) => (
                    <label
                      key={brand}
                      className="!flex !items-center !justify-between !cursor-pointer"
                    >
                      <div className="!flex !items-center !gap-[8px]">
                        <input
                          type="checkbox"
                          checked={filters.brands.includes(brand)}
                          onChange={() => handleBrandChange(brand)}
                          className="!w-[16px] !h-[16px] lg:!w-5 lg:!h-5 !text-primary !bg-background !border-border !rounded "
                        />
                        <span className="!text-foreground text-[14px] lg:text-[16px]">
                          {brand}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            {!isPriceLoading && (
              <AccordionItem value="price">
                <AccordionTrigger className="text-[16px] lg:text-[18px] !font-[800] !text-foreground">
                  <b className="font-extrabold">Price</b>
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
                    className="!w-full !mb-[16px] !mt-[8px]"
                  />
                  <div className="!flex !justify-between !text-[12px] lg:text-[14px] !text-muted-foreground">
                    <span>{filters.priceRange[0]} €</span>
                    <span>{filters.priceRange[1]} €</span>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
            <AccordionItem value="size">
              <AccordionTrigger className="text-[16px] lg:text-[18px] !font-[700] !text-foreground">
                <b className="font-extrabold">Size</b>
              </AccordionTrigger>
              <AccordionContent>
                <div className="!grid !grid-cols-4 !gap-[8px]">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => handleSizeChange(size)}
                      className={`my-border !rounded !py-[8px] !text-[12px] lg:text-[14px] !font-medium ${filters.sizes.includes(
                        size,
                      )}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="color">
              <AccordionTrigger className="text-[16px] lg:text-[18px] !font-[700] !text-foreground">
                <b className="font-extrabold">Color</b>
              </AccordionTrigger>
              <AccordionContent>
                <div className="!flex !gap-[8px]">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleColorChange(color)}
                      className={`!w-[24px] !h-[24px] lg:!w-[32px] lg:!h-[32px] !rounded-full !border-2 ${
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
              size="lg"
              className="w-full mt-[16px] text-[14px] lg:text-[16px] py-[16px] !border-search-highlight font-bold rounded-lg"
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

        <main className="!flex-1 pb-[16px] sm:pb-[32px] !w-full !px-[8px] sm:!px-[16px]">
          <div className="!pr-[16px] sm:!pr-[32px] lg:pr-0 !w-full">
            {recentSearches.length > 0 && (
              <div className="!mt-8">
                <div className="!flex !justify-between !items-center !mb-[12px]">
                  <h3 className="!text-[16px] !font-bold !text-foreground">
                    Recent Searches
                  </h3>
                  <button
                    onClick={handleClearRecentSearches}
                    className="!text-sm !text-muted-foreground hover:!text-foreground"
                  >
                    Clear all
                  </button>
                </div>
                <div className="!flex !flex-wrap !gap-[8px]">
                  {recentSearches.map((search, index) => (
                    <div
                      key={index}
                      className="!flex !items-center !gap-[4px] !bg-muted !rounded-full !px-[12px] !py-[6px]"
                    >
                      <span
                        className="!text-sm !text-foreground !cursor-pointer"
                        onClick={() => {
                          handleSearch(search);
                        }}
                      >
                        {search}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveRecentSearch(search);
                        }}
                        className="!rounded-full hover:!bg-background !p-1"
                      >
                        <X className="!w-[12px] !h-[12px] !text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="hidden lg:flex pt-[22px] pb-[4px]  !text-[14px] sm:!text-[16px] lg:text-[18px] !font-bold !text-foreground !mb-[8px] mt-[8px]">
              {/* {isAnyFilterActive ? "Search Results" : ""} */}
              Search Results
            </div>
            <div className="pt-[16px] lg:pt-[0px] !mb-[16px] flex justify-between items-center text-[12px] lg:text-[16px] !text-muted-foreground">
              {isAnyFilterActive ? (
                <div className="!ml-[8px]">
                  <b className="!font-extrabold text-foreground">
                    {filteredProducts.length}
                  </b>{" "}
                  products found
                </div>
              ) : (
                <div className="!ml-[8px]">
                  <b className="!font-extrabold text-foreground">
                    {totalProducts}
                  </b>{" "}
                  products found
                </div>
              )}
              <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <div className="!flex !items-center !border !border-border !px-[8px] !py-[4px] md:!px-[12px] md:!py-[8px] !rounded-md text-[12px] lg:text-[14px]">
                      Sort By
                      <ChevronDown className="!w-[12px] !h-[12px] md:!w-[16px] md:!h-[16px] !ml-[4px] md:!ml-[8px]" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="z-[100000]"
                    container={document.body}
                  >
                    <DropdownMenuLabel className="!font-semibold text-[14px]">
                      Sort by
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setSortOption("default");
                      }}
                      className="text-[14px]"
                    >
                      Relevance
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setSortOption("a-z");
                      }}
                      className="text-[14px]"
                    >
                      Name: A-Z
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setSortOption("z-a");
                      }}
                      className="text-[14px]"
                    >
                      Name: Z-A
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setSortOption("price-asc");
                      }}
                      className="text-[14px]"
                    >
                      Price: Low to High
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setSortOption("price-desc");
                      }}
                      className="text-[14px]"
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
              <div className="!grid !grid-cols-2 sm:!grid-cols-2 xl:grid-cols-3 2xl:!grid-cols-4 !gap-[8px] sm:!gap-[16px] !w-full">
                {sortedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="!bg-background !border !border-border !rounded-lg !p-[8px] sm:!p-[12px] hover:!shadow-lg !transition-shadow !w-full !flex !flex-col"
                  >
                    <div className="!relative !mb-[8px]">
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="!w-full !h-[112px] sm:!h-[144px] !object-cover !rounded-md"
                      />
                    </div>
                    <h3 className="!text-[14px] sm:!text-[16px] !font-bold !text-foreground !mb-[4px] sm:!mb-[8px] h-[40px] sm:h-[48px] overflow-hidden">
                      {product.title}
                    </h3>
                    <div className="!flex !items-center !justify-between mt-auto">
                      <div className="!flex !items-center !gap-[8px]">
                        <span className="!text-muted-foreground !text-[12px] sm:!text-[14px]">
                          {product.price}
                        </span>
                      </div>
                      <button className="!bg-primary hover:!bg-primary-hover !text-primary-foreground !p-[6px] sm:!p-[8px] !rounded-md !transition-colors">
                        <ShoppingCart className="!w-[12px] !h-[12px] sm:!w-[16px] sm:!h-[16px]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isLoading && !isPending && sortedProducts.length === 0 && (
              <div className="!text-center !py-[48px] !w-full">
                <p className="!text-muted-foreground text-[16px] lg:text-[18px]">
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
