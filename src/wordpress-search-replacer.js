/**
 * WordPress Search Replacer
 * Replaces existing WordPress search functionality with custom search
 */

(function() {
  'use strict';

  // Function to find elements in header with class or id containing "search"
  function findSearchTriggerElements() {
    const header = document.querySelector("header");
    if (!header) {
      console.log("Kalifind Search: No header found");
      return [];
    }

    // Find all elements in header with class or id containing "search"
    // Case-insensitive match for "search" as a word or part of a word with separators
    const elements = [];
    
    // Check all elements in header
    const allElements = header.querySelectorAll("*");
    console.log("Kalifind Search: Checking", allElements.length, "elements in header");
    
    allElements.forEach(element => {
      // Check ID
      const id = element.id;
      if (id && id.toLowerCase().includes("search")) {
        console.log("Kalifind Search: Found search element by ID", id);
        elements.push(element);
        return;
      }
      
      // Check classes
      const className = element.className;
      if (typeof className === 'string' && className) {
        const classes = className.split(/\s+/);
        for (const cls of classes) {
          if (cls.toLowerCase().includes("search")) {
            console.log("Kalifind Search: Found search element by class", cls);
            elements.push(element);
            return;
          }
        }
      }
    });
    
    return elements;
  }

  // Function to thoroughly remove existing search functionality from elements
  function removeExistingSearch(elements) {
    elements.forEach((element) => {
      // Remove all inline event handlers
      const eventAttributes = [
        "onclick", "ondblclick", "onmousedown", "onmouseup", 
        "onmouseover", "onmouseout", "onmouseenter", "onmouseleave",
        "onkeydown", "onkeyup", "onkeypress", "onfocus", "onblur",
        "onchange", "oninput", "onsubmit"
      ];

      eventAttributes.forEach((attr) => {
        if (element.hasAttribute(attr)) {
          element.removeAttribute(attr);
        }
      });

      // Remove all event listeners by cloning the element
      // This is the most effective way to remove existing event listeners
      const clone = element.cloneNode(true);
      element.parentNode?.replaceChild(clone, element);
      
      // Return the cloned element for further manipulation
      return clone;
    });
  }

  // Function to inject our custom search functionality
  function injectCustomSearch(elements, config) {
    elements.forEach((element) => {
      // Ensure the element is focusable and has a pointer cursor
      element.style.cursor = "pointer";
      element.setAttribute("tabindex", "0"); // Make it focusable if it isn't already
      element.setAttribute("role", "button"); // Semantically indicate it's a button
      element.setAttribute("aria-label", "Open search"); // Accessibility

      // Remove any existing click handlers to prevent conflicts
      const clone = element.cloneNode(true);
      element.parentNode?.replaceChild(clone, element);
      
      // Add click event listener to open our custom search modal
      clone.addEventListener("click", function(e) {
        e.preventDefault();
        e.stopPropagation(); // Prevent bubbling up
        openSearchModal(config);
      });
      
      // Also add keyboard support
      clone.addEventListener("keydown", function(e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openSearchModal(config);
        }
      });
    });
  }

  // Function to open the search modal
  function openSearchModal(config) {
    // Check if a modal is already open by looking for the container
    const existingModal = document.getElementById("kalifind-modal-container");
    if (existingModal) {
      return; // Do nothing if modal is already open
    }

    const modalContainer = document.createElement("div");
    modalContainer.id = "kalifind-modal-container";
    // Ensure the modal takes full width and aligns properly
    modalContainer.style.cssText = `
      position: fixed;
      top: 0;
      padding-top: 24px!important;
      padding-bottom: 1.5rem !important;
      padding-left: 1rem !important;
      padding-right: 1rem !important;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100%;
      height: 100%;
      z-index: 10000;
    `;
    document.body.appendChild(modalContainer);

    // Render React component into the modal
    if (typeof window.KalifindSearch !== 'undefined' && window.KalifindSearch.init) {
      // If we have the KalifindSearch object, use it
      const containerId = "kalifind-search-container-" + Date.now();
      const container = document.createElement("div");
      container.id = containerId;
      modalContainer.appendChild(container);
      
      window.KalifindSearch.init({
        containerId: containerId,
        ...config
      });
    } else {
      // Fallback: show an error or simple search interface
      modalContainer.innerHTML = `
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                    background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h3>Search</h3>
          <p>Custom search functionality would appear here.</p>
          <button id="close-modal" style="margin-top: 10px; padding: 5px 10px;">Close</button>
        </div>
      `;
      
      document.getElementById("close-modal").addEventListener("click", function() {
        modalContainer.remove();
      });
    }
  }

  // Function to inject a fallback search icon if no search elements are found
  function injectFallbackSearchIcon(config) {
    // Find the first header element
    const firstHeader = document.querySelector("header");
    if (firstHeader) {
      // Create a container for the search icon
      const searchIconContainer = document.createElement("div");
      searchIconContainer.id = "kalifind-fallback-search-icon";
      searchIconContainer.style.cssText = `
        cursor: pointer;
        padding: 10px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      `;
      // Simple search icon using SVG
      searchIconContainer.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      `;

      // Append the icon to the end of the first header
      firstHeader.appendChild(searchIconContainer);

      // Add click event listener to the icon to open the modal
      searchIconContainer.addEventListener("click", function(e) {
        e.preventDefault();
        openSearchModal(config);
      });
    } else {
      console.warn(
        "Kalifind Search: No header found for fallback icon injection.",
      );
    }
  }

  // Main initialization function
  function initialize() {
    // Extract configuration from script tag
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
    const storeId = url.searchParams.get("storeId");
    const storeType = url.searchParams.get("storeType");
    const userId = url.searchParams.get("userId");
    const apiKey = url.searchParams.get("apiKey");

    const configFromUrl = {
      storeId: storeId || undefined,
      storeType: storeType || undefined,
      userId: userId || undefined,
      apiKey: apiKey || undefined,
    };

    // Only proceed if we have configuration parameters
    if (!storeId && !storeType && !userId && !apiKey) {
      return;
    }

    const triggerElements = findSearchTriggerElements();
    console.log("Kalifind Search: Found", triggerElements.length, "search trigger elements");
    console.log("Kalifind Search: Trigger elements", triggerElements);

    if (triggerElements.length > 0) {
      // Remove existing search functionality from the specific elements found
      removeExistingSearch(triggerElements);

      // Inject our custom search functionality
      injectCustomSearch(triggerElements, configFromUrl);
    } else {
      // Fallback logic: Inject a search icon/component
      injectFallbackSearchIcon(configFromUrl);
    }
  }

  // Run initialization when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
})();