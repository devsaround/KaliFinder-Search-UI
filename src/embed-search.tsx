import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import SearchDropdown from "./components/SearchDropdown.tsx";
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
  const allElements = header.querySelectorAll("*");
  console.log("Kalifind Search: All elements in header:", allElements);

  allElements.forEach((element) => {
    const id = element.id;
    const className = element.className;
    console.log(
      "Kalifind Search: Checking element:",
      element,
      "id:",
      id,
      "className:",
      className
    );

    if (id && id.toLowerCase().includes("search")) {
      console.log("Kalifind Search: Found element by ID:", element);
      elements.push(element);
      return;
    }

    if (typeof className === "string" && className) {
      const classes = className.split(/\s+/);
      for (const cls of classes) {
        if (cls.toLowerCase().includes("search")) {
          console.log(
            "Kalifind Search: Found element by class:",
            element,
            "class:",
            cls
          );
          elements.push(element);
          return;
        }
      }
    }
  });

  console.log("Kalifind Search: Final trigger elements:", elements);
  return elements;
};

// Function to remove existing search functionality from elements
const removeExistingSearch = (elements: Element[]): void => {
  elements.forEach((element) => {
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
      if (element.hasAttribute(attr)) {
        element.removeAttribute(attr);
      }
    });
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
