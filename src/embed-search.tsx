import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import SearchDropdown from "./components/SearchDropdown.tsx";
import "./index.css";
import { createCache } from "./lib/cache";

interface InitialData {
  totalProducts: number;
  maxPrice: number;
  availableCategories: string[];
  availableBrands: string[];
  categoryCounts: { [key: string]: number };
  brandCounts: { [key: string]: number };
}

export const cache = createCache<InitialData>();

const prefetchData = async (storeUrl: string) => {
  const cacheKey = `initialData-${storeUrl}`;
  if (cache.get(cacheKey)) {
    return;
  }

  try {
    const params = new URLSearchParams();
    params.append("storeUrl", storeUrl);

    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/v1/search?${params.toString()}`,
      {
        
      },
    );
    const result = await response.json();

    if (Array.isArray(result)) {
      const prices = result
        .map((p: any) => parseFloat(p.price))
        .filter((p) => !isNaN(p));
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 10000;

      const allCategories = new Set<string>();
      const allBrands = new Set<string>();
      const categoryCounts: { [key: string]: number } = {};
      const brandCounts: { [key: string]: number } = {};
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
      });

      const initialData: InitialData = {
        totalProducts: result.length,
        maxPrice,
        availableCategories: Array.from(allCategories),
        availableBrands: Array.from(allBrands),
        categoryCounts,
        brandCounts,
      };

      cache.set(cacheKey, initialData);
    }
  } catch (err) {
    console.error("Failed to prefetch initial data:", err);
  }
};

// --- Animation Manager Component ---
const ModalManager: React.FC<{
  onUnmount: () => void;
  [key: string]: any;
}> = ({ onUnmount, ...props }) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    // Wait for animation to finish, then call the unmount function
    setTimeout(onUnmount, 300);
  };

  return <SearchDropdown isOpen={isOpen} onClose={handleClose} {...props} />;
};

// Function to find elements in header with class or id containing "search"
const findSearchTriggerElements = (): Element[] => {
  const header = document.querySelector("header");
  if (!header) {
    console.log("Kalifind Search: No header found");
    return [];
  }

  const elements: Element[] = [];
  const allElements = header.querySelectorAll("*");

  allElements.forEach((element) => {
    const id = element.id;
    if (id && id.toLowerCase().includes("search")) {
      elements.push(element);
      return;
    }

    const className = element.className;
    if (typeof className === "string" && className) {
      const classes = className.split(/\s+/);
      for (const cls of classes) {
        if (cls.toLowerCase().includes("search")) {
          elements.push(element);
          return;
        }
      }
    }
  });

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
  const openSearchModal = (config: any) => {
    const existingModal = document.getElementById("kalifind-modal-container");
    if (existingModal) {
      return;
    }

    const modalContainer = document.createElement("div");
    modalContainer.id = "kalifind-modal-container";
    modalContainer.style.cssText = `
      all: initial !important;
      box-sizing: border-box !important;
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
      </React.StrictMode>,
    );
  };

  const initialize = () => {
    const scriptTag = document.querySelector(
      'script[src*="kalifind-search.js"]',
    );
    if (!scriptTag) {
      console.error("Kalifind Search script tag not found.");
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
      console.error("Kalifind Search: storeUrl parameter is missing.");
      return;
    }

    prefetchData(storeUrl);

    const triggerElements = findSearchTriggerElements();

    if (triggerElements.length > 0) {
      removeExistingSearch(triggerElements);

      triggerElements.forEach((element: any) => {
        element.style.cursor = "pointer";
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
          true,
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
          "Kalifind Search: No header found for fallback icon injection.",
        );
      }
    }
  };

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
})();
