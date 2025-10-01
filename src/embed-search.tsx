import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import ShadowDOMSearchDropdown from "./components/ShadowDOMSearchDropdown.tsx";
import "./index.css";
import { injectIsolatedStyles, applyScopedStyles } from "./lib/styleIsolation";

import { InitialData, Product, SearchConfig, KalifindWindow } from "./types";


// Add comprehensive debugging at the start
console.log("Kalifind Search: Script loaded and executing");
console.log("Kalifind Search: Document ready state:", document.readyState);
console.log("Kalifind Search: Current URL:", window.location.href);
console.log(
  "Kalifind Search: All script tags:",
  document.querySelectorAll('script[src*="kalifind-search.js"]')
);

const prefetchData = async (storeUrl: string) => {
  try {
    const params = new URLSearchParams();
    params.append("storeUrl", storeUrl);

    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/v1/search?${params.toString()}`,
      {}
    );
    const result = await response.json();

    // Handle both array and object response formats
    let products: Product[];
    if (Array.isArray(result)) {
      products = result;
    } else if (result && Array.isArray(result.products)) {
      products = result.products;
    } else {
      console.error("Kalifind Search: Unexpected API response format:", result);
      return;
    }

    if (products && products.length > 0) {
      const prices = products
        .map((p: Product) => parseFloat(p.price))
        .filter((p) => !isNaN(p));
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 10000;

      const allCategories = new Set<string>();
      const allBrands = new Set<string>();
      const categoryCounts: { [key: string]: number } = {};
      const brandCounts: { [key: string]: number } = {};
      products.forEach((product: Product) => {
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
      });

      const initialData: InitialData = {
        totalProducts: products.length,
        maxPrice,
        availableCategories: Array.from(allCategories),
        availableBrands: Array.from(allBrands),
        categoryCounts,
        brandCounts,
        // Store the actual products with cart fields for cart operations
        products: products.map(product => ({
          ...product,
          // Ensure cart fields are preserved
          shopifyVariantId: product.shopifyVariantId,
          shopifyProductId: product.shopifyProductId,
          wooProductId: product.wooProductId,
          productType: product.productType,
          storeType: product.storeType,
          storeUrl: product.storeUrl,
          productUrl: product.productUrl,
        }))
      };

      // Store initial data in a global variable instead of cache
      (window as KalifindWindow).kalifindInitialData = initialData;
    }
  } catch (err) {
    console.error("Failed to prefetch initial data:", err);
  }
};

// --- Animation Manager Component ---
const ModalManager: React.FC<{
  onUnmount: () => void;
  [key: string]: unknown;
}> = ({ onUnmount, ...props }) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    // Wait for animation to finish, then call the unmount function
    setTimeout(onUnmount, 300);
  };

  // Use Shadow DOM for complete CSS isolation
  return (
    <ShadowDOMSearchDropdown isOpen={isOpen} onClose={handleClose} {...props} />
  );
};

// Function to find elements in header with class or id containing "search"
const findSearchTriggerElements = (): Element[] => {
  const header = document.querySelector("header");
  console.log("Kalifind Search: Header found:", header);
  if (!header) {
    console.log("Kalifind Search: No header found");
    return [];
  }

  const elements: Element[] = [];
  
  // Look for specific search icon/button elements only - be more restrictive
  const searchSelectors = [
    // Shopify specific - target the actual search buttons
    'search-button',
    '.search-action',
    '.search-button', 
    '.search-trigger',
    'button.search-modal__button',
    'button[class*="search"]',
    // Generic search buttons/icons
    'button[aria-label*="search" i]',
    'button[aria-label*="Search" i]',
    'button[aria-label*="Open search" i]',
    // WordPress specific - but only buttons, not divs
    'button.search-toggle',
    'button[data-toggle-target*="search"]',
    'button[data-toggle-target*="Search"]'
  ];

  searchSelectors.forEach(selector => {
    try {
      const foundElements = header.querySelectorAll(selector);
      foundElements.forEach(el => {
        // Only include actual buttons or clickable elements, not containers
        if ((el.tagName === 'BUTTON' || el.tagName === 'A' || el.hasAttribute('onclick')) && !elements.includes(el)) {
          console.log("Kalifind Search: Found search element in header:", el, "selector:", selector);
          elements.push(el);
        }
      });
    } catch (e) {
      console.log("Kalifind Search: Selector not supported:", selector);
    }
  });

  // Also look for buttons with search-related text content (but be more specific)
  const allButtons = header.querySelectorAll('button');
  allButtons.forEach(button => {
    const text = button.textContent?.toLowerCase().trim() || '';
    const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
    const className = button.className?.toLowerCase() || '';
    
    // Only include buttons that are clearly search buttons
    if ((text === 'search' || text === 'open search' || ariaLabel.includes('search') || className.includes('search')) && !elements.includes(button)) {
      console.log("Kalifind Search: Found search button by text content:", button);
      elements.push(button);
    }
  });

  console.log("Kalifind Search: Final trigger elements:", elements);
  return elements;
};

// Function to remove existing search functionality from elements
const removeExistingSearch = (elements: Element[]): void => {
  console.log("Kalifind Search: removeExistingSearch called with elements:", elements);
  elements.forEach((element) => {
    console.log("Kalifind Search: Processing element:", element);
    console.log("Kalifind Search: Element attributes:", Array.from(element.attributes).map(attr => `${attr.name}="${attr.value}"`));
    
    // Remove all event listeners by cloning the element (this removes all attached event listeners)
    const newElement = element.cloneNode(true) as Element;
    if (element.parentNode) {
      element.parentNode.replaceChild(newElement, element);
    }
    
    // Remove standard HTML event attributes
    const eventAttributes = [
      "onclick",
      "ondblclick",
      "onmousedown",
      "onmouseup",
      "onmouseover",
      "onmouseout",
      "onkeydown",
      "onkeyup",
      "onkeypress",
    ];

    eventAttributes.forEach((attr) => {
      if (newElement.hasAttribute(attr)) {
        newElement.removeAttribute(attr);
      }
    });

    // Remove Svelte-style event attributes (like on:click)
    const svelteEventAttributes = [
      "on:click",
      "on:dblclick",
      "on:mousedown",
      "on:mouseup",
      "on:mouseover",
      "on:mouseout",
      "on:keydown",
      "on:keyup",
      "on:keypress",
      "on:touchstart",
      "on:touchend"
    ];

    svelteEventAttributes.forEach((attr) => {
      if (newElement.hasAttribute(attr)) {
        console.log("Kalifind Search: Removing Svelte event attribute:", attr, "from element:", newElement);
        newElement.removeAttribute(attr);
        console.log("Kalifind Search: Attribute removed, element now:", newElement);
      }
    });

    // Also check for any remaining event attributes that might contain search or modal
    const allAttributes = Array.from(newElement.attributes);
    allAttributes.forEach(attr => {
      if (attr.name.includes('on') && (attr.value.includes('search') || attr.value.includes('modal'))) {
        console.log("Kalifind Search: Removing event attribute with search/modal:", attr.name, "=", attr.value, "from element:", newElement);
        newElement.removeAttribute(attr.name);
      }
    });

    // Also check child elements for on:click attributes
    const childButtons = newElement.querySelectorAll('button[on\\:click]');
    childButtons.forEach(button => {
      console.log("Kalifind Search: Found child button with on:click:", button);
      if (button.hasAttribute('on:click')) {
        console.log("Kalifind Search: Removing on:click from child button:", button);
        button.removeAttribute('on:click');
      }
    });

    // For WordPress, also remove any data attributes that might trigger search
    const dataAttributes = Array.from(newElement.attributes).filter(attr => 
      attr.name.startsWith('data-') && 
      (attr.value.includes('search') || attr.value.includes('modal') || attr.value.includes('toggle'))
    );
    dataAttributes.forEach(attr => {
      console.log("Kalifind Search: Removing data attribute:", attr.name, "=", attr.value);
      newElement.removeAttribute(attr.name);
    });

    // Remove any WordPress-specific classes that might trigger search
    const searchClasses = ['search-modal', 'cover-modal', 'header-footer-group'];
    searchClasses.forEach(className => {
      if (newElement.classList.contains(className)) {
        console.log("Kalifind Search: Removing search class:", className);
        newElement.classList.remove(className);
      }
    });

    // Remove Shopify-specific classes and attributes
    const shopifySearchClasses = ['search-modal__button', 'search-action', 'search-trigger'];
    shopifySearchClasses.forEach(className => {
      if (newElement.classList.contains(className)) {
        console.log("Kalifind Search: Removing Shopify search class:", className);
        newElement.classList.remove(className);
      }
    });

    // Remove any Shopify-specific data attributes
    const shopifyDataAttributes = ['data-modal', 'data-search', 'data-toggle'];
    shopifyDataAttributes.forEach(attr => {
      if (newElement.hasAttribute(attr)) {
        console.log("Kalifind Search: Removing Shopify data attribute:", attr);
        newElement.removeAttribute(attr);
      }
    });

    // Update the elements array to use the new element
    const index = elements.indexOf(element);
    if (index !== -1) {
      elements[index] = newElement;
    }
  });
};

(function () {
  // Function to open the search modal
  const openSearchModal = (config: SearchConfig) => {
    const existingModal = document.getElementById("kalifind-modal-container");
    if (existingModal) {
      console.warn("Kalifind Search: Modal already exists, preventing duplicate creation");
      return;
    }

    // Inject isolated styles first
    injectIsolatedStyles(document.body);

    const modalContainer = document.createElement("div");
    modalContainer.id = "kalifind-modal-container";
    modalContainer.className = "kalifind-search-widget";

    // Apply scoped styles
    applyScopedStyles(modalContainer);

    modalContainer.style.cssText += `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100% !important;
      height: 100% !important;
      z-index: 10000 !important;
      background-color: transparent !important;
      overflow: hidden !important;
    `;
    document.body.appendChild(modalContainer);

    const root = ReactDOM.createRoot(modalContainer);

    const handleUnmount = () => {
      root.unmount();
      modalContainer.remove();
    };

    root.render(
      <React.StrictMode>
        <ModalManager onUnmount={handleUnmount} {...config} />
      </React.StrictMode>
    );
  };

  const initialize = () => {
    // Prevent multiple initializations
    if ((window as KalifindWindow).kalifindInitialized) {
      console.warn("Kalifind Search: Already initialized, skipping");
      return;
    }
    
    console.log("Kalifind Search: Initialize function called");
    const scriptTag = document.querySelector(
      'script[src*="kalifind-search.js"]'
    );
    console.log("Kalifind Search: Script tag found:", scriptTag);
    if (!scriptTag) {
      console.error("Kalifind Search script tag not found.");
      console.log(
        "Kalifind Search: Available script tags:",
        document.querySelectorAll("script")
      );
      return;
    }

    const scriptSrc = scriptTag.getAttribute("src");
    if (!scriptSrc) return;

    const url = new URL(scriptSrc, window.location.origin);
    const storeUrl = url.searchParams.get("storeUrl");

    const configFromUrl = {
      storeUrl: storeUrl || undefined,
    };

    if (!storeUrl) {
      console.error(
        "Kalifind Search: storeUrl parameter is required."
      );
      console.log("Available parameters:", { storeUrl });
      return;
    }

    console.log("Kalifind Search: Using storeUrl:", storeUrl);
    prefetchData(storeUrl);

    const triggerElements = findSearchTriggerElements();
    console.log("Kalifind Search: Found trigger elements:", triggerElements);
    console.log(
      "Kalifind Search: Number of trigger elements:",
      triggerElements.length
    );

    if (triggerElements.length > 0) {
      removeExistingSearch(triggerElements);

      triggerElements.forEach((element: Element) => {
        (element as HTMLElement).style.cursor = "pointer";
        element.setAttribute("tabindex", "0");
        element.setAttribute("role", "button");
        element.setAttribute("aria-label", "Open search");

        element.addEventListener(
          "click",
          (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            // Prevent any Shopify search modal from opening
            const existingShopifyModal = document.querySelector('.search-modal, [data-modal], .modal');
            if (existingShopifyModal) {
              existingShopifyModal.style.display = 'none';
              existingShopifyModal.remove();
            }
            
            // Prevent body scroll lock that Shopify might apply
            document.body.style.overflow = 'unset';
            document.body.classList.remove('search-modal-open', 'modal-open');
            
            openSearchModal(configFromUrl);
          },
          true
        );
      });
    } else {
      const firstHeader = document.querySelector("header");
      if (firstHeader) {
        const searchIconContainer = document.createElement("div");
        searchIconContainer.id = "kalifind-fallback-search-icon";
        searchIconContainer.style.cssText = `
          cursor: pointer;
          padding: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        `;
        searchIconContainer.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        `;

        firstHeader.appendChild(searchIconContainer);

        searchIconContainer.addEventListener("click", (e) => {
          e.preventDefault();
          openSearchModal(configFromUrl);
        });
      } else {
        console.warn(
          "Kalifind Search: No header found for fallback icon injection."
        );
      }
    }
    
    // Mark as initialized to prevent multiple initializations
    (window as KalifindWindow).kalifindInitialized = true;
  };

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
})();
