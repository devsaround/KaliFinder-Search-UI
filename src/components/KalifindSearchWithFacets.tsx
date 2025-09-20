import { cache } from "../embed-search.tsx";
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

interface ConfiguredFacet {
  field: string;
  label: string;
  visible: boolean;
  terms: number;
}

interface FilterState {
  categories: string[];
  priceRange: [number, number];
  colors: string[];
  sizes: number[];
  brands: string[];
  genders: string[];
  tags: string[];
}

const KalifindSearchWithFacets: React.FC<{
  storeUrl?: string;
  onClose?: () => void;
  searchQuery?: string;
  hideHeader?: boolean;
}> = ({
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
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [availableSizes, setAvailableSizes] = useState<number[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState<{
    [key: string]: number;
  }>({});
  const [brandCounts, setBrandCounts] = useState<{
    [key: string]: number;
  }>({});
  const [colorCounts, setColorCounts] = useState<{
    [key: string]: number;
  }>({});
  const [sizeCounts, setSizeCounts] = useState<{
    [key: number]: number;
  }>({});
  const [tagCounts, setTagCounts] = useState<{
    [key: string]: number;
  }>({});
  const [sortOption, setSortOption] = useState("default");
  const [configuredFacets, setConfiguredFacets] = useState<ConfiguredFacet[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    priceRange: [0, 10000],
    colors: [],
    sizes: [],
    brands: [],
    genders: [],
    tags: [],
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

  // Load configured facets from backend
  useEffect(() => {
    const loadConfiguredFacets = async () => {
      if (!storeUrl) return;

      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/v1/facets/configured?storeUrl=${storeUrl}`,
        );

        if (response.ok) {
          const facets = await response.json();
          setConfiguredFacets(facets);
        }
      } catch (error) {
        console.error("Failed to load configured facets:", error);
      }
    };

    loadConfiguredFacets();
  }, [storeUrl]);

  const isAnyFilterActive =
    !!debouncedSearchQuery ||
    filters.categories.length > 0 ||
    filters.brands.length > 0 ||
    filters.colors.length > 0 ||
    filters.sizes.length > 0 ||
    filters.tags.length > 0 ||
    filters.priceRange[1] < maxPrice;

  useEffect(() => {
    const initFilters = async () => {
      if (!storeUrl) return;

      const cacheKey = `initialData-${storeUrl}`;
      const cachedData = cache.get(cacheKey);

      if (cachedData) {
        setTotalProducts(cachedData.totalProducts);
        setMaxPrice(cachedData.maxPrice);
        setFilters((prev: any) => ({
          ...prev,
          priceRange: [0, cachedData.maxPrice],
        }));
        setAvailableCategories(cachedData.availableCategories);
        setAvailableBrands(cachedData.availableBrands);
        setAvailableColors(cachedData.availableColors || []);
        setAvailableSizes(cachedData.availableSizes || []);
        setAvailableTags(cachedData.availableTags || []);
        setCategoryCounts(cachedData.categoryCounts);
        setBrandCounts(cachedData.brandCounts);
        setColorCounts(cachedData.colorCounts || {});
        setSizeCounts(cachedData.sizeCounts || {});
        setTagCounts(cachedData.tagCounts || {});
        setIsPriceLoading(false);
        return;
      }

      const fetchWithRetry = async (retries = 3) => {
        try {
          const params = new URLSearchParams();
          params.append("storeUrl", storeUrl);

          const response = await fetch(
            `${import.meta.env.VITE_BACKEND_URL}/v1/search?${params.toString()}`,
            {},
          );

          if (!response.ok) {
            throw new Error("bad response");
          }

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
            const allColors = new Set<string>();
            const allSizes = new Set<number>();
            const allTags = new Set<string>();
            const categoryCounts: { [key: string]: number } = {};
            const brandCounts: { [key: string]: number } = {};
            const colorCounts: { [key: string]: number } = {};
            const sizeCounts: { [key: number]: number } = {};
            const tagCounts: { [key: string]: number } = {};

            result.forEach((product: any) => {
              if (product.categories) {
                product.categories.forEach((cat: string) => {
                  allCategories.add(cat);
                  categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
                });
              }
              if (product.brands) {
                product.brands.forEach((brand: string) => {
                  allBrands.add(brand);
                  brandCounts[brand] = (brandCounts[brand] || 0) + 1;
                });
              }
              if (product.colors) {
                product.colors.forEach((color: string) => {
                  allColors.add(color);
                  colorCounts[color] = (colorCounts[color] || 0) + 1;
                });
              }
              if (product.sizes) {
                product.sizes.forEach((size: number) => {
                  allSizes.add(size);
                  sizeCounts[size] = (sizeCounts[size] || 0) + 1;
                });
              }
              if (product.tags) {
                product.tags.forEach((tag: string) => {
                  allTags.add(tag);
                  tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
              }
            });

            setAvailableCategories(Array.from(allCategories));
            setAvailableBrands(Array.from(allBrands));
            setAvailableColors(Array.from(allColors));
            setAvailableSizes(Array.from(allSizes));
            setAvailableTags(Array.from(allTags));
            setCategoryCounts(categoryCounts);
            setBrandCounts(brandCounts);
            setColorCounts(colorCounts);
            setSizeCounts(sizeCounts);
            setTagCounts(tagCounts);

            const initialData = {
              totalProducts: result.length,
              maxPrice: maxPrice,
              availableCategories: Array.from(allCategories),
              availableBrands: Array.from(allBrands),
              availableColors: Array.from(allColors),
              availableSizes: Array.from(allSizes),
              availableTags: Array.from(allTags),
              categoryCounts: categoryCounts,
              brandCounts: brandCounts,
              colorCounts: colorCounts,
              sizeCounts: sizeCounts,
              tagCounts: tagCounts,
            };
            cache.set(cacheKey, initialData);
          } else {
            console.error("Initial search result is not an array:", result);
          }
        } catch (err) {
          if (retries > 0) {
            setTimeout(() => fetchWithRetry(retries - 1), 1000);
          } else {
            console.error("Failed to fetch initial filter data:", err);
          }
        } finally {
          setIsPriceLoading(false);
        }
      };

      fetchWithRetry();
    };

    initFilters();
  }, [storeUrl]);

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
    if (!storeUrl) return;
    if (debouncedSearchQuery) {
      startTransition(() => {
        setIsAutocompleteLoading(true);
        (async () => {
          try {
            const params = new URLSearchParams();
            if (debouncedSearchQuery) {
              params.append("q", debouncedSearchQuery);
            }
            if (storeUrl) {
              params.append("storeUrl", storeUrl);
            }

            const response = await fetch(
              `${
                import.meta.env.VITE_BACKEND_URL
              }/v1/autocomplete?${params.toString()}`,
              {},
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
  }, [debouncedSearchQuery, storeUrl]);

  // search products
  useEffect(() => {
    if (isPriceLoading || !storeUrl) {
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
          if (storeUrl) {
            params.append("storeUrl", storeUrl);
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
          if (filters.tags.length > 0) {
            params.append("tags", filters.tags.join(","));
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
            {},
          );

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
    isPriceLoading,
    debouncedSearchQuery,
    filters.categories,
    filters.colors,
    filters.sizes,
    filters.brands,
    filters.tags,
    filters.priceRange,
    debouncedPriceRange,
    storeUrl,
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

  const handleTagChange = (tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  // Helper function to render facet based on configuration
  const renderFacet = (facet: ConfiguredFacet) => {
    switch (facet.field) {
      case "category":
        return (
          <AccordionItem key={facet.field} value={facet.field}>
            <AccordionTrigger className="text-[16px] lg:text-[18px] !text-foreground">
              <b>{facet.label}</b>
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
        );

      case "brand":
        return (
          <AccordionItem key={facet.field} value={facet.field}>
            <AccordionTrigger className="text-[16px] lg:text-[18px] !font-extrabold !text-foreground">
              <b>{facet.label}</b>
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
        );

      case "price":
        return (
          <AccordionItem key={facet.field} value={facet.field}>
            <AccordionTrigger className="text-[16px] lg:text-[18px] !font-[800] !text-foreground">
              <b className="font-extrabold">{facet.label}</b>
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
        );

      case "size":
        return (
          <AccordionItem key={facet.field} value={facet.field}>
            <AccordionTrigger className="text-[16px] lg:text-[18px] !font-[700] !text-foreground">
              <b className="font-extrabold">{facet.label}</b>
            </AccordionTrigger>
            <AccordionContent>
              <div className="!grid !grid-cols-4 !gap-[8px]">
                {availableSizes.map((size) => (
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
        );

      case "color":
        return (
          <AccordionItem key={facet.field} value={facet.field}>
            <AccordionTrigger className="text-[16px] lg:text-[18px] !font-[700] !text-foreground">
              <b className="font-extrabold">{facet.label}</b>
            </AccordionTrigger>
            <AccordionContent>
              <div className="!flex !gap-[8px]">
                {availableColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorChange(color)}
                    className={`!w-[24px] !h-[24px] lg:!w-[32px] lg:!h-[32px] !rounded-full !border-2 ${
                      filters.colors.includes(color)
                        ? "!border-primary !scale-110"
                        : "!border-border"
                    }`}
                    style={{
                      backgroundColor: color.toLowerCase(),
                      transform: filters.colors.includes(color)
                        ? "scale(1.1)"
                        : "scale(1)",
                    }}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        );

      case "tags":
        return (
          <AccordionItem key={facet.field} value={facet.field}>
            <AccordionTrigger className="text-[16px] lg:text-[18px] !font-[700] !text-foreground">
              <b className="font-extrabold">{facet.label}</b>
            </AccordionTrigger>
            <AccordionContent>
              <div className="!space-y-[8px]">
                {availableTags.map((tag) => (
                  <label
                    key={tag}
                    className="!flex !items-center !justify-between !cursor-pointer"
                  >
                    <div className="!flex !items-center !gap-[10px]">
                      <input
                        type="checkbox"
                        checked={filters.tags.includes(tag)}
                        onChange={() => handleTagChange(tag)}
                        className="!w-[16px] !h-[16px] lg:!w-5 lg:!h-5 top-0 !text-primary !bg-background !border-border !rounded "
                      />
                      <span className="!text-foreground text-[14px] lg:text-[16px]">
                        {tag}
                      </span>
                    </div>
                    <span className="!text-muted-foreground !text-[12px] lg:text-[14px] mr-[8px]">
                      {tagCounts[tag] || 0}
                    </span>
                  </label>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        );

      default:
        return null;
    }
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
                  filters.brands.length +
                  filters.tags.length}
              </span>
            </button>
          </DrawerTrigger>
          <DrawerContent className="!z-[100000] !flex !flex-col max-h-[93vh]">
            <div className="!px-[16px] sm:!p-[16px] !overflow-y-auto !flex-1">
              <Accordion
                type="multiple"
                defaultValue={configuredFacets.map(f => f.field)}
                className="!w-full"
              >
                {configuredFacets.map(renderFacet)}
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
                      tags: [],
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
            defaultValue={configuredFacets.map(f => f.field)}
          >
            {configuredFacets.map(renderFacet)}
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
                  tags: [],
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

export default KalifindSearchWithFacets;