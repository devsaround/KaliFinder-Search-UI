import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import SearchDropdown from "./components/SearchDropdown.tsx";
import ShadowDOMSearchDropdown from "./components/ShadowDOMSearchDropdown.tsx";

interface KalifindSearchConfig {
  containerId: string;
  userId?: string;
  apiKey?: string;
}

// Add debugging at the start
console.log("Kalifind Search: Script loaded and executing");

const init = (config: KalifindSearchConfig) => {
  const container = document.getElementById(config.containerId);
  if (container) {
    const root = ReactDOM.createRoot(container);
    root.render(
      <React.StrictMode>
        <App userId={config.userId} apiKey={config.apiKey} />
      </React.StrictMode>
    );
  } else {
    console.error(`Could not find element with id "${config.containerId}"`);
  }
};

(window as any).KalifindSearch = {
  init,
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

  // Use Shadow DOM for complete CSS isolation
  return (
    <ShadowDOMSearchDropdown isOpen={isOpen} onClose={handleClose} {...props} />
  );
};

// Function to find elements in header with class or id containing "search"
const findSearchTriggerElements = (): Element[] => {
  const header = document.querySelector("header");
  if (!header) {
    console.log("Kalifind Search: No header found");
    return [];
  }

  // Find all elements in header with class or id containing "search"
  // Case-insensitive match for "search" as a word or part of a word with separators
  const elements: Element[] = [];

  // Check all elements in header
  const allElements = header.querySelectorAll("*");
  console.log(
    "Kalifind Search: Checking",
    allElements.length,
    "elements in header"
  );

  allElements.forEach((element) => {
    // Check ID
    const id = element.id;
    if (id && id.toLowerCase().includes("search")) {
      console.log("Kalifind Search: Found search element by ID", id);
      elements.push(element);
      return;
    }

    // Check classes
    const className = element.className;
    if (typeof className === "string" && className) {
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
};

// Function to remove existing search functionality from elements
const removeExistingSearch = (elements: Element[]): void => {
  elements.forEach((element) => {
    // Remove inline event handlers
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

    // Remove existing event listeners by cloning (this removes listeners but keeps properties)
    // const clone = element.cloneNode(true) as Element;
    // element.parentNode?.replaceChild(clone, element);
  });
};

// Function to apply !important to all Tailwind classes in the component
const applyImportantStyles = (htmlString: string): string => {
  return htmlString.replace(/class="([^"]*)"/g, (match, classes) => {
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
    return `class="${importantClasses}"`;
  });
};

(function () {
  // Function to open the search modal
  const openSearchModal = (config: any) => {
    // Check if a modal is already open by looking for the container
    const existingModal = document.getElementById("kalifind-modal-container");
    if (existingModal) {
      return; // Do nothing if modal is already open
    }

    const modalContainer = document.createElement("div");
    modalContainer.id = "kalifind-modal-container";
    // Ensure the modal takes full width and aligns properly
    modalContainer.style.cssText = `
      /* Aggressive reset for the modal container itself */
      all: initial !important; /* Reset all inherited properties */
      box-sizing: border-box !important; /* Ensure consistent box model */
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100% !important;
      height: 100% !important;
      z-index: 10000 !important;
      background-color: transparent !important; /* Ensure no background from host */
      overflow: hidden !important; /* Prevent scrollbars on the container itself */
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
    const scriptTag = document.querySelector(
      'script[src*="kalifind-search.js"]'
    );
    if (!scriptTag) {
      console.error("Kalifind Search script tag not found.");
      return;
    }

    const scriptSrc = scriptTag.getAttribute("src");
    if (!scriptSrc) return;

    const url = new URL(scriptSrc, window.location.origin);
    const storeUrl = url.searchParams.get("storeUrl");
    const storeId = url.searchParams.get("storeId");
    const storeType = url.searchParams.get("storeType");

    // Handle both parameter formats
    let finalStoreUrl = storeUrl;
    if (!finalStoreUrl && storeId && storeType) {
      // Construct storeUrl from storeId and storeType
      finalStoreUrl = `https://api.kalifind.com/stores/${storeId}/${storeType}`;
    }

    const configFromUrl = {
      storeUrl: finalStoreUrl || undefined,
    };

    if (!finalStoreUrl) {
      console.error(
        "Kalifind Search: Either storeUrl or both storeId and storeType parameters are required."
      );
      console.log("Available parameters:", { storeUrl, storeId, storeType });
      return;
    }

    console.log("Kalifind Search: Using storeUrl:", finalStoreUrl);

    const triggerElements = findSearchTriggerElements();
    console.log(
      "Kalifind Search: Found",
      triggerElements.length,
      "search trigger elements"
    );
    console.log("Kalifind Search: Trigger elements", triggerElements);

    if (triggerElements.length > 0) {
      // Remove existing search functionality from the specific elements found
      removeExistingSearch(triggerElements);

      triggerElements.forEach((element: any) => {
        // Ensure the element is focusable and has a pointer cursor
        element.style.cursor = "pointer";
        element.setAttribute("tabindex", "0"); // Make it focusable if it isn't already
        element.setAttribute("role", "button"); // Semantically indicate it's a button
        element.setAttribute("aria-label", "Open search"); // Accessibility

        // Add click event listener to open our custom search modal
        element.addEventListener(
          "click",
          (e) => {
            e.preventDefault();
            e.stopPropagation(); // Prevent bubbling up
            e.stopImmediatePropagation(); // Prevent other listeners on the same element
            openSearchModal(configFromUrl);
          },
          true
        ); // Add listener in capture phase
      });
    } else {
      // Fallback logic: Inject a search icon/component
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
        // Simple search icon using SVG or text (you can replace this with a React component later)
        searchIconContainer.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        `;

        // Append the icon to the end of the first header
        firstHeader.appendChild(searchIconContainer);

        // Add click event listener to the icon to open the modal
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
  };

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
})();
