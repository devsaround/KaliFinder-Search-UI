import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import ShadowDOMSearchDropdown from './components/ShadowDOMSearchDropdown.tsx';

import type { InitialData, KalifindWindow, Product, SearchConfig } from './types';

// Add comprehensive debugging at the start
console.log('Kalifind Search: Script loaded and executing');
console.log('Kalifind Search: Document ready state:', document.readyState);
console.log('Kalifind Search: Current URL:', window.location.href);
console.log(
  'Kalifind Search: All script tags:',
  document.querySelectorAll('script[src*="kalifind-search.js"]')
);

const prefetchData = async (storeUrl: string) => {
  try {
    const params = new URLSearchParams();
    params.append('storeUrl', storeUrl);

    if (!import.meta.env.VITE_BACKEND_URL) {
      console.error('VITE_BACKEND_URL environment variable is required');
      return;
    }
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const response = await fetch(`${backendUrl}/v1/search?${params.toString()}`, {});
    const result = await response.json();

    // Handle both array and object response formats
    let products: Product[];
    if (Array.isArray(result)) {
      products = result;
    } else if (result && Array.isArray(result.products)) {
      products = result.products;
    } else {
      console.error('Kalifind Search: Unexpected API response format:', result);
      return;
    }

    if (products && products.length > 0) {
      const prices = products.map((p: Product) => parseFloat(p.price)).filter((p) => !isNaN(p));
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
        products: products.map((product) => ({
          ...product,
          // Ensure cart fields are preserved
          shopifyVariantId: product.shopifyVariantId,
          shopifyProductId: product.shopifyProductId,
          wooProductId: product.wooProductId,
          productType: product.productType,
          storeType: product.storeType,
          storeUrl: product.storeUrl,
          productUrl: product.productUrl,
        })),
      };

      // Store initial data in a global variable instead of cache
      (window as KalifindWindow).kalifindInitialData = initialData;
    }
  } catch (err) {
    console.error('Failed to prefetch initial data:', err);
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
  return <ShadowDOMSearchDropdown isOpen={isOpen} onClose={handleClose} {...props} />;
};

/**
 * UNIVERSAL SEARCH TRIGGER DETECTOR
 * Finds ANY element in header with "search" keyword
 * Works on Shopify, WooCommerce, and custom themes
 *
 * Checks ALL elements for "search" keyword in:
 * - class names, id attributes, data-* attributes
 * - aria labels, name, placeholder, title, role
 * - text content (limited to avoid large blocks)
 *
 * Supports ALL element types: div, span, button, a, i, svg, input, etc.
 */
const findUniversalSearchTrigger = (): Element[] => {
  const header = document.querySelector('header') || document.querySelector('[role="banner"]');

  console.log('🔍 Kalifind Search: Starting universal trigger detection');
  console.log('📍 Kalifind Search: Header element:', header);

  if (!header) {
    console.warn('⚠️ Kalifind Search: No header found');
    return [];
  }

  const elements: Element[] = [];
  const searchKeyword = 'search';

  // Get ALL elements in header (not just specific selectors)
  const allElements = header.querySelectorAll('*');
  console.log(`📦 Kalifind Search: Scanning ${allElements.length} elements in header`);

  allElements.forEach((el) => {
    // Collect all relevant attributes
    const attributes = {
      tagName: el.tagName.toLowerCase(),
      className: el.className || '',
      id: el.id || '',
      dataAttributes: {} as Record<string, string>,
      ariaLabel: el.getAttribute('aria-label') || '',
      name: el.getAttribute('name') || '',
      placeholder: el.getAttribute('placeholder') || '',
      title: el.getAttribute('title') || '',
      role: el.getAttribute('role') || '',
      textContent: el.textContent?.trim().toLowerCase() || '',
    };

    // Collect all data-* attributes
    Array.from(el.attributes).forEach((attr) => {
      if (attr.name.startsWith('data-')) {
        attributes.dataAttributes[attr.name] = attr.value;
      }
    });

    // Check if "search" keyword appears in ANY attribute
    const hasSearchInClass = attributes.className.toString().toLowerCase().includes(searchKeyword);
    const hasSearchInId = attributes.id.toLowerCase().includes(searchKeyword);
    const hasSearchInAriaLabel = attributes.ariaLabel.toLowerCase().includes(searchKeyword);
    const hasSearchInDataAttr = Object.entries(attributes.dataAttributes).some(
      ([key, value]) =>
        key.toLowerCase().includes(searchKeyword) || value.toLowerCase().includes(searchKeyword)
    );
    const hasSearchInName = attributes.name.toLowerCase().includes(searchKeyword);
    const hasSearchInPlaceholder = attributes.placeholder.toLowerCase().includes(searchKeyword);
    const hasSearchInTitle = attributes.title.toLowerCase().includes(searchKeyword);
    const hasSearchInRole = attributes.role.toLowerCase().includes(searchKeyword);
    // Only match short text content to avoid matching large blocks
    const hasSearchInText =
      attributes.textContent.includes(searchKeyword) && attributes.textContent.length < 50;

    // Element qualifies if "search" appears in ANY attribute
    if (
      hasSearchInClass ||
      hasSearchInId ||
      hasSearchInAriaLabel ||
      hasSearchInDataAttr ||
      hasSearchInName ||
      hasSearchInPlaceholder ||
      hasSearchInTitle ||
      hasSearchInRole ||
      hasSearchInText
    ) {
      console.log('✅ Kalifind Search: Found trigger element:', {
        tag: attributes.tagName,
        class: attributes.className.toString().substring(0, 100), // Truncate long class names
        id: attributes.id,
        ariaLabel: attributes.ariaLabel,
        dataAttributes: attributes.dataAttributes,
        matchedBy: {
          class: hasSearchInClass,
          id: hasSearchInId,
          ariaLabel: hasSearchInAriaLabel,
          dataAttr: hasSearchInDataAttr,
          name: hasSearchInName,
          placeholder: hasSearchInPlaceholder,
          title: hasSearchInTitle,
          role: hasSearchInRole,
          text: hasSearchInText,
        },
      });

      elements.push(el);
    }
  });

  console.log(`🎯 Kalifind Search: Found ${elements.length} trigger element(s) total`);
  return elements;
};

/**
 * COMPREHENSIVE EVENT HANDLER REMOVER
 * Removes ALL existing search functionality
 * Handles: Shopify (Svelte events), WooCommerce (WordPress hooks), inline handlers
 *
 * Removes:
 * - ALL event listeners (via cloning)
 * - Inline events (onclick, ondblclick, onkeydown, etc.)
 * - Svelte events (on:click, on:keydown, on:submit, etc.)
 * - WordPress/WooCommerce data attributes (data-toggle-target, data-modal, etc.)
 * - Problematic CSS classes that trigger native search
 */
const removeAllSearchHandlers = (element: Element): Element => {
  console.log('🧹 Kalifind Search: Removing ALL handlers from element:', {
    tag: element.tagName,
    class: element.className.toString().substring(0, 100),
    id: element.id,
  });

  // Clone element to remove ALL event listeners
  const clonedElement = element.cloneNode(true) as Element;

  // Remove inline event handlers (onclick, ondblclick, onkeydown, etc.)
  const inlineEvents = [
    'onclick',
    'ondblclick',
    'onmousedown',
    'onmouseup',
    'onkeydown',
    'onkeyup',
    'onkeypress',
    'onfocus',
    'onblur',
    'onsubmit',
    'onchange',
    'oninput',
    'onmouseenter',
    'onmouseleave',
    'onmouseover',
    'onmouseout',
    'ontouchstart',
    'ontouchend',
  ];

  inlineEvents.forEach((event) => {
    if (clonedElement.hasAttribute(event)) {
      console.log(`  ❌ Kalifind Search: Removed inline event: ${event}`);
      clonedElement.removeAttribute(event);
    }
  });

  // Remove Svelte events (Shopify themes use Svelte)
  const svelteEvents = [
    'on:click',
    'on:keydown',
    'on:submit',
    'on:change',
    'on:input',
    'on:focus',
    'on:blur',
    'on:mouseenter',
    'on:mouseleave',
    'on:keyup',
    'on:keypress',
    'on:dblclick',
    'on:mousedown',
    'on:mouseup',
    'on:mouseover',
    'on:mouseout',
    'on:touchstart',
    'on:touchend',
  ];

  svelteEvents.forEach((event) => {
    if (clonedElement.hasAttribute(event)) {
      console.log(`  ❌ Kalifind Search: Removed Svelte event: ${event}`);
      clonedElement.removeAttribute(event);
    }
  });

  // Remove WordPress/WooCommerce data attributes
  const wordpressAttributes = [
    'data-toggle-target',
    'data-modal',
    'data-drawer',
    'data-popup',
    'data-search-modal',
    'data-micromodal-trigger',
    'data-toggle',
    'data-target',
    'data-bs-toggle',
    'data-bs-target',
    'data-search',
    'data-modal-trigger',
  ];

  wordpressAttributes.forEach((attr) => {
    if (clonedElement.hasAttribute(attr)) {
      console.log(`  ❌ Kalifind Search: Removed WordPress attribute: ${attr}`);
      clonedElement.removeAttribute(attr);
    }
  });

  // Remove problematic CSS classes that might trigger native search
  const problematicClasses = [
    'search-modal__button',
    'modal__toggle',
    'drawer__toggle',
    'popup__trigger',
    'micromodal-trigger',
    'js-search-toggle',
    'search-modal',
    'cover-modal',
    'search-action',
    'search-trigger',
  ];

  problematicClasses.forEach((cls) => {
    if (clonedElement.classList.contains(cls)) {
      console.log(`  ❌ Kalifind Search: Removed problematic class: ${cls}`);
      clonedElement.classList.remove(cls);
    }
  });

  // Prevent default link behavior for <a> elements
  if (clonedElement.tagName === 'A') {
    const href = clonedElement.getAttribute('href');
    if (href && (href === '#' || href.includes('search') || href.includes('modal'))) {
      clonedElement.removeAttribute('href');
      console.log('  ❌ Kalifind Search: Removed problematic href from <a> element');
    }
  }

  // Also check child elements for Svelte/WordPress attributes
  const childElements = clonedElement.querySelectorAll('*');
  childElements.forEach((child) => {
    svelteEvents.forEach((event) => {
      if (child.hasAttribute(event)) {
        console.log(`  ❌ Kalifind Search: Removed ${event} from child:`, child.tagName);
        child.removeAttribute(event);
      }
    });
  });

  console.log('✅ Kalifind Search: Element cleaned and ready for Kalifind handler');
  return clonedElement;
};

// Function to remove existing search functionality from elements
const removeExistingSearch = (elements: Element[]): void => {
  console.log('🧹 Kalifind Search: Processing', elements.length, 'elements with universal cleaner');

  elements.forEach((element, index) => {
    console.log(`  🔧 Kalifind Search: Processing element ${index + 1}/${elements.length}`);

    // Use comprehensive handler removal
    const cleanedElement = removeAllSearchHandlers(element);

    // Replace the original element with the cleaned one
    if (element.parentNode) {
      element.parentNode.replaceChild(cleanedElement, element);
      console.log(`  ✅ Kalifind Search: Replaced element ${index + 1} with cleaned version`);
    } else {
      console.warn(
        `  ⚠️ Kalifind Search: Element ${index + 1} has no parent node, skipping replacement`
      );
    }
  });

  console.log('✅ Kalifind Search: All elements cleaned successfully');
};

(function () {
  // Function to open the search modal
  const openSearchModal = (config: SearchConfig) => {
    const existingModal = document.getElementById('kalifind-modal-container');
    if (existingModal) {
      console.warn('Kalifind Search: Modal already exists, preventing duplicate creation');
      return;
    }

    const modalContainer = document.createElement('div');
    modalContainer.id = 'kalifind-modal-container';
    modalContainer.style.cssText = `
      all: initial;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      z-index: 2147483646;
      background-color: transparent;
      overflow: hidden;
      box-sizing: border-box;
      display: block;
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
      console.warn('⚠️ Kalifind Search: Already initialized, skipping');
      return;
    }

    console.log('🚀 Kalifind Search: Initialize function called');
    console.log('📄 Kalifind Search: Document state:', document.readyState);
    console.log('🌐 Kalifind Search: Current URL:', window.location.href);

    const scriptTag = document.querySelector('script[src*="kalifind-search.js"]');
    console.log('📜 Kalifind Search: Script tag found:', scriptTag);

    if (!scriptTag) {
      console.error('❌ Kalifind Search: Script tag not found');
      console.log(
        '🔍 Kalifind Search: Available script tags:',
        document.querySelectorAll('script')
      );
      return;
    }

    const scriptSrc = scriptTag.getAttribute('src');
    if (!scriptSrc) {
      console.error('❌ Kalifind Search: No src attribute on script tag');
      return;
    }

    console.log('📜 Kalifind Search: Script src:', scriptSrc);

    const url = new URL(scriptSrc, window.location.origin);
    const storeUrl = url.searchParams.get('storeUrl');

    const configFromUrl = {
      storeUrl: storeUrl || undefined,
      vendorId: url.searchParams.get('vendorId') || undefined,
      storeId: url.searchParams.get('storeId') || undefined,
    };

    console.log('🏪 Kalifind Search: Store configuration:', configFromUrl);

    if (!storeUrl) {
      console.error('❌ Kalifind Search: storeUrl parameter is required');
      console.error(
        '💡 Kalifind Search: Script must include: ?storeUrl=...&vendorId=...&storeId=...'
      );
      return;
    }

    // Set global variables for UBI client
    if (configFromUrl.vendorId) {
      (window as unknown as Record<string, unknown>).KALIFIND_VENDOR_ID = configFromUrl.vendorId;
      console.log('✅ Kalifind Search: Set KALIFIND_VENDOR_ID:', configFromUrl.vendorId);
    }
    if (configFromUrl.storeId) {
      (window as unknown as Record<string, unknown>).KALIFIND_STORE_ID = configFromUrl.storeId;
      console.log('✅ Kalifind Search: Set KALIFIND_STORE_ID:', configFromUrl.storeId);
    }

    // Initialize purchase tracking
    console.log('🛒 Kalifind Search: Initializing purchase tracking...');
    import('./analytics/purchaseTrackingHelper')
      .then(({ purchaseTrackingHelper }) => {
        purchaseTrackingHelper.initialize({
          enableCheckoutInitiation: true,
          enablePurchaseCompletion: true,
          minItemsForCheckout: 2,
          minValueForCheckout: 50,
        });
        console.log('✅ Kalifind Search: Purchase tracking initialized');
      })
      .catch((error) => {
        console.warn('⚠️ Kalifind Search: Failed to initialize purchase tracking:', error);
      });

    console.log('🔄 Kalifind Search: Prefetching data...');
    prefetchData(storeUrl);

    console.log('🔍 Kalifind Search: Starting universal trigger detection...');
    const triggerElements = findUniversalSearchTrigger();
    console.log(`🎯 Kalifind Search: Found ${triggerElements.length} trigger element(s)`);

    if (triggerElements.length > 0) {
      console.log('🧹 Kalifind Search: Removing existing search functionality...');
      removeExistingSearch(triggerElements);

      // Get fresh references to the cleaned elements
      console.log('🔄 Kalifind Search: Getting fresh element references...');
      const updatedElements = findUniversalSearchTrigger();

      console.log('📌 Kalifind Search: Attaching Kalifind click handlers...');
      updatedElements.forEach((element: Element, index) => {
        console.log(
          `  📌 Kalifind Search: Attaching to element ${index + 1}/${updatedElements.length}:`,
          {
            tag: element.tagName,
            class: element.className.toString().substring(0, 100),
            id: element.id,
          }
        );

        if (element instanceof HTMLElement) {
          element.style.cursor = 'pointer';
        }
        element.setAttribute('tabindex', '0');
        element.setAttribute('role', 'button');
        element.setAttribute('aria-label', 'Open Kalifind search');

        element.addEventListener(
          'click',
          (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            console.log('🔍 Kalifind Search: Trigger clicked!');
            console.log('  📍 Clicked element:', {
              tag: element.tagName,
              class: element.className.toString().substring(0, 100),
              id: element.id,
            });

            // Prevent any Shopify search modal from opening
            const existingShopifyModal = document.querySelector(
              '.search-modal, [data-modal], .modal'
            ) as HTMLElement;
            if (existingShopifyModal) {
              console.log('  🧹 Kalifind Search: Removing existing Shopify modal');
              existingShopifyModal.style.display = 'none';
              existingShopifyModal.remove();
            }

            // Prevent body scroll lock that Shopify might apply (store original first)
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = originalOverflow || '';
            document.body.classList.remove('search-modal-open', 'modal-open');

            console.log('🚀 Kalifind Search: Opening Kalifind modal...');
            openSearchModal(configFromUrl);
          },
          true
        );
      });

      console.log('✅ Kalifind Search: Successfully attached handlers to all trigger elements');
      console.log('🎉 Kalifind Search: Universal search initialization complete!');
    } else {
      console.warn('⚠️ Kalifind Search: No search triggers found in header');
      console.log('💡 Kalifind Search: Creating fallback search icon...');
      const firstHeader = document.querySelector('header');
      if (firstHeader) {
        const searchIconContainer = document.createElement('div');
        searchIconContainer.id = 'kalifind-fallback-search-icon';
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

        searchIconContainer.addEventListener('click', (e) => {
          e.preventDefault();
          openSearchModal(configFromUrl);
        });
      } else {
        console.warn('Kalifind Search: No header found for fallback icon injection.');
      }
    }

    // Mark as initialized to prevent multiple initializations
    (window as KalifindWindow).kalifindInitialized = true;
  };

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  // Listen for Shopify checkout completion
  const shopifyWindow = window as unknown as Record<string, unknown>;
  if (shopifyWindow.Shopify && typeof shopifyWindow.Shopify === 'object') {
    const shopify = shopifyWindow.Shopify as Record<string, unknown>;
    if (shopify.checkout) {
      window.addEventListener('shopify:checkout:complete', (event: Event) => {
        try {
          const detailEvent = event as CustomEvent;
          const { getUBIClient } = require('../analytics/ubiClient');
          const ubiClient = getUBIClient();
          if (ubiClient && detailEvent.detail) {
            const { order_id, total_price, line_items } = detailEvent.detail as Record<
              string,
              unknown
            >;
            const productIds =
              (line_items as Array<Record<string, unknown>>)?.map((item) => item.product_id) || [];
            ubiClient.trackPurchaseCompleted(
              order_id as string,
              parseFloat(total_price as string) || 0,
              productIds,
              'USD'
            );
          }
        } catch (error) {
          console.warn('Shopify purchase tracking failed:', error);
        }
      });
    }
  }

  // Listen for WooCommerce checkout completion
  window.addEventListener('woocommerce_order_completed', (event: Event) => {
    try {
      const detailEvent = event as CustomEvent;
      const { getUBIClient } = require('../analytics/ubiClient');
      const ubiClient = getUBIClient();
      if (ubiClient && detailEvent.detail) {
        const { order_id, total, items } = detailEvent.detail as Record<string, unknown>;
        const productIds =
          (items as Array<Record<string, unknown>>)?.map((item) => item.product_id) || [];
        ubiClient.trackPurchaseCompleted(
          order_id as string,
          parseFloat(total as string) || 0,
          productIds,
          'USD'
        );
      }
    } catch (error) {
      console.warn('WooCommerce purchase tracking failed:', error);
    }
  });
})();
