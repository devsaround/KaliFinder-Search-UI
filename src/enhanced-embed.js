(function () {
  // Helper function to add !important to Tailwind classes
  function makeTailwindImportant(htmlString) {
    return htmlString.replace(/class="([^"]*)"/g, function (match, classes) {
      const importantClasses = classes
        .split(" ")
        .map((cls) => {
          if (cls.startsWith("!")) return cls; // Already has !important
          if (cls.startsWith("data-")) return cls; // Skip data attributes
          if (cls.includes(":")) {
            // Handle responsive classes like sm:!text-red
            const parts = cls.split(":");
            const lastPart = parts[parts.length - 1];
            if (!lastPart.startsWith("!")) {
              parts[parts.length - 1] = "!" + lastPart;
              return parts.join(":");
            }
            return cls;
          }
          return "!" + cls;
        })
        .join(" ");
      return 'class="' + importantClasses + '"';
    });
  }

  // Function to remove existing search functionality
  function removeExistingSearch() {
    // Find elements with id or class containing "search" (case-insensitive)
    const searchElements = document.querySelectorAll('[id*="search" i], [class*="search" i]');
    
    searchElements.forEach(element => {
      // Remove event listeners by cloning the element
      const newElement = element.cloneNode(true);
      element.parentNode.replaceChild(newElement, element);
      
      // Clear content but preserve the element for our injection
      newElement.innerHTML = '';
      newElement.style.cssText = 'all: unset; display: block; width: 100%;';
    });
    
    return searchElements;
  }

  // Function to inject our enhanced search component
  function injectEnhancedSearch(targetElements, config) {
    targetElements.forEach(element => {
      // Create container for our search component
      const searchContainer = document.createElement('div');
      searchContainer.id = 'kalifind-enhanced-search';
      
      // Enhanced HTML with full-width layout
      const searchHTML = `
        <div class="!bg-background !min-h-screen !w-full !fixed !inset-0 !z-[10000]">
          <header class="!bg-background !py-3 !w-full !px-4">
            <div class="!flex !items-center justify-between lg:!gap-24 !max-w-7xl !mx-auto !flex-col lg:!flex-row !w-full">
              <div class="!flex !items-center !gap-2 justify-between md:justify-normal">
                <div class="!flex !items-center">
                  <a href="/" class="!flex !items-center">
                    <img
                      src="https://kalifinder-search.pages.dev/KalifindLogo.png"
                      alt="Kalifind"
                      class="!h-auto !w-full !max-w-[200px] !max-h-14 !object-contain !object-center"
                    />
                  </a>
                </div>
              </div>

              <div class="!flex-1 !relative !ml-2 !w-full !max-w-3xl">
                <div class="!flex !items-center !gap-2 !flex-1 !w-full">
                  <div class="!relative !flex-1 !w-full">
                    <svg class="!absolute !left-3 !top-1/2 !transform !-translate-y-1/2 !text-muted-foreground !w-5 !h-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="m21 21-4.3-4.3"></path>
                    </svg>
                    <input
                      type="text"
                      placeholder="Search"
                      class="!w-full !pl-10 !pr-4 !py-3 !border-b-2 !border-search-highlight !text-foreground !placeholder-muted-foreground focus:!outline-none focus:!border-none focus:!ring-0"
                      id="kalifind-search-input"
                    />
                    <div class="!absolute !right-3 !top-1/2 !transform !-translate-y-1/2 !flex !gap-2"></div>
                  </div>

                  <button class="!p-1 !rounded-lg hover:!bg-muted/20 !transition-colors !duration-200 !flex-shrink-0" aria-label="Close search" id="kalifind-close-button">
                    <svg class="!w-6 !h-6 !text-muted-foreground hover:!text-foreground !transition-colors !duration-200" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M18 6 6 18"></path>
                      <path d="m6 6 12 12"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </header>

          <div class="!block lg:!hidden !px-4 !py-3 !bg-background !w-full">
            <button class="!flex !items-center !gap-2 !px-4 !py-2 !bg-primary !text-primary-foreground !rounded-lg !font-medium hover:!bg-primary-hover !transition-colors">
              <svg class="!w-4 !h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              Filters
              <span class="!bg-primary-foreground !text-primary !px-2 !py-1 !rounded !text-xs !font-bold">0</span>
            </button>
          </div>

          <div class="!flex !w-full !max-w-7xl !mx-auto">
            <aside class="!w-64 !p-6 !bg-filter-bg !hidden lg:!block">
              <div class="!space-y-6">
                <div>
                  <h3 class="!font-medium !text-foreground !mb-3 !text-lg">Filters</h3>
                  <div class="!space-y-4">
                    <div>
                      <h4 class="!font-medium !text-foreground !mb-2">Category</h4>
                      <div class="!space-y-2">
                        <div class="!flex !items-center !gap-2">
                          <input type="checkbox" class="!w-4 !h-4 !text-primary !bg-background !border-border !rounded" />
                          <span class="!text-foreground">All Categories</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 class="!font-medium !text-foreground !mb-2">Price Range</h4>
                      <div class="!pt-2">
                        <div class="!flex !justify-between !text-sm !text-muted-foreground !mb-2">
                          <span>€0</span>
                          <span>€5000</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            <main class="!flex-1 !w-full !p-6">
              <div class="!pt-4 !pb-6">
                <h2 class="!text-xl !font-medium !text-foreground !mb-4">Recent Searches</h2>
                <div class="!flex !flex-wrap !gap-2">
                  <button class="!bg-muted !text-muted-foreground hover:!bg-muted/80 !px-3 !py-1 !rounded-full !text-sm">Sunglasses</button>
                  <button class="!bg-muted !text-muted-foreground hover:!bg-muted/80 !px-3 !py-1 !rounded-full !text-sm">Running Shoes</button>
                </div>
              </div>
              
              <div class="!w-full">
                <h2 class="!text-xl !font-medium !text-foreground !mb-6">Recommended Products</h2>
                <div class="!grid !grid-cols-1 sm:!grid-cols-2 lg:!grid-cols-3 xl:!grid-cols-4 !gap-6">
                  <!-- Loading skeletons will be added dynamically -->
                  <div class="!bg-loading !rounded-lg !p-4 !animate-pulse-slow">
                    <div class="!bg-loading-shimmer !h-48 !rounded-md !mb-4 !relative !overflow-hidden">
                      <div class="!absolute !inset-0 !bg-gradient-to-r !from-transparent !via-loading-shimmer !to-transparent !animate-shimmer"></div>
                    </div>
                    <div class="!bg-loading-shimmer !h-4 !rounded !mb-2"></div>
                    <div class="!bg-loading-shimmer !h-6 !rounded !w-20"></div>
                  </div>
                  <div class="!bg-loading !rounded-lg !p-4 !animate-pulse-slow">
                    <div class="!bg-loading-shimmer !h-48 !rounded-md !mb-4 !relative !overflow-hidden">
                      <div class="!absolute !inset-0 !bg-gradient-to-r !from-transparent !via-loading-shimmer !to-transparent !animate-shimmer"></div>
                    </div>
                    <div class="!bg-loading-shimmer !h-4 !rounded !mb-2"></div>
                    <div class="!bg-loading-shimmer !h-6 !rounded !w-20"></div>
                  </div>
                  <div class="!bg-loading !rounded-lg !p-4 !animate-pulse-slow">
                    <div class="!bg-loading-shimmer !h-48 !rounded-md !mb-4 !relative !overflow-hidden">
                      <div class="!absolute !inset-0 !bg-gradient-to-r !from-transparent !via-loading-shimmer !to-transparent !animate-shimmer"></div>
                    </div>
                    <div class="!bg-loading-shimmer !h-4 !rounded !mb-2"></div>
                    <div class="!bg-loading-shimmer !h-6 !rounded !w-20"></div>
                  </div>
                  <div class="!bg-loading !rounded-lg !p-4 !animate-pulse-slow">
                    <div class="!bg-loading-shimmer !h-48 !rounded-md !mb-4 !relative !overflow-hidden">
                      <div class="!absolute !inset-0 !bg-gradient-to-r !from-transparent !via-loading-shimmer !to-transparent !animate-shimmer"></div>
                    </div>
                    <div class="!bg-loading-shimmer !h-4 !rounded !mb-2"></div>
                    <div class="!bg-loading-shimmer !h-6 !rounded !w-20"></div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      `;
      
      // Apply !important to all Tailwind classes
      searchContainer.innerHTML = makeTailwindImportant(searchHTML);
      
      // Replace the existing search element with our enhanced version
      element.appendChild(searchContainer);
      
      // Add event listeners
      const closeButton = searchContainer.querySelector('#kalifind-close-button');
      if (closeButton) {
        closeButton.addEventListener('click', function() {
          document.body.removeChild(element);
        });
      }
      
      const searchInput = searchContainer.querySelector('#kalifind-search-input');
      if (searchInput) {
        searchInput.addEventListener('focus', function() {
          // Load the actual search functionality when input is focused
          loadKalifindSearch(config, element);
        });
      }
    });
  }

  // Function to load the actual Kalifind search functionality
  function loadKalifindSearch(config, containerElement) {
    // This would typically load your React component
    // For now, we're just showing how it would work
    
    // In a real implementation, this would:
    // 1. Dynamically load your React component
    // 2. Initialize it with the provided config
    // 3. Replace the static HTML with the actual component
    
    console.log("Loading Kalifind search with config:", config);
  }

  // Enhanced initialization function
  function enhancedInitialize() {
    // Wait for the original script to load
    const checkScript = setInterval(() => {
      if (typeof window.KalifindSearch !== 'undefined') {
        clearInterval(checkScript);
        
        // Remove existing search elements
        const searchElements = removeExistingSearch();
        
        // Get config from script tag
        const scriptTag = document.querySelector('script[src*="kalifind-search.js"]');
        if (scriptTag) {
          const scriptSrc = scriptTag.getAttribute("src");
          const url = new URL(scriptSrc, window.location.origin);
          
          const config = {
            storeId: url.searchParams.get("storeId") || undefined,
            storeType: url.searchParams.get("storeType") || undefined,
            userId: url.searchParams.get("userId") || undefined,
            apiKey: url.searchParams.get("apiKey") || undefined,
          };
          
          // Inject our enhanced search
          injectEnhancedSearch(searchElements, config);
        }
      }
    }, 100);
  }

  // Run when DOM is loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", enhancedInitialize);
  } else {
    enhancedInitialize();
  }
})();