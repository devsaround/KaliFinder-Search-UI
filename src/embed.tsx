import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import SearchDropdown from "./components/SearchDropdown.tsx";

interface KalifindSearchConfig {
  containerId: string;
  userId?: string;
  apiKey?: string;
  storeId?: string;
  storeType?: string;
}

const init = (config: KalifindSearchConfig) => {
  const container = document.getElementById(config.containerId);
  if (container) {
    const root = ReactDOM.createRoot(container);
    root.render(
      <React.StrictMode>
        <App
          storeId={config.storeId}
          storeType={config.storeType}
          userId={config.userId}
          apiKey={config.apiKey}
        />
      </React.StrictMode>,
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

  return <SearchDropdown isOpen={isOpen} onClose={handleClose} {...props} />;
};

const findSearchTriggerElements = (): HTMLElement[] => {
  const headers = Array.from(document.getElementsByTagName("header"));
  const triggerElements: HTMLElement[] = [];
  const searchRegex = /search/i;
  headers.forEach((header) => {
    const elements = Array.from(header.querySelectorAll("[class], [id]"));
    elements.forEach((element) => {
      const classAttr = element.getAttribute("class") || "";
      const idAttr = element.getAttribute("id") || "";
      if (searchRegex.test(classAttr) || searchRegex.test(idAttr)) {
        triggerElements.push(element as HTMLElement);
      }
    });
  });
  return triggerElements;
};

(function () {
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

    if (!storeId && !storeType && !userId && !apiKey) {
      return;
    }

    const triggerElements = findSearchTriggerElements();

    if (triggerElements.length > 0) {
      triggerElements.forEach((element) => {
        element.style.cursor = "pointer";
        element.addEventListener("click", (e) => {
          e.preventDefault();

          // Check if a modal is already open by looking for the container
          const existingModal = document.getElementById(
            "kalifind-modal-container",
          );
          if (existingModal) {
            return; // Do nothing if modal is already open
          }

          const modalContainer = document.createElement("div");
          modalContainer.id = "kalifind-modal-container";
          document.body.appendChild(modalContainer);

          const root = ReactDOM.createRoot(modalContainer);

          const handleUnmount = () => {
            root.unmount();
            modalContainer.remove();
          };

          root.render(
            <React.StrictMode>
              <ModalManager onUnmount={handleUnmount} {...configFromUrl} />
            </React.StrictMode>,
          );
        });
      });
    } else {
      // Fallback logic
      const containerId = "kalifind-search-container";
      let container = document.getElementById(containerId);
      if (!container) {
        container = document.createElement("div");
        container.id = containerId;
        if (scriptTag.parentNode) {
          scriptTag.parentNode.insertBefore(container, scriptTag);
        }
      }

      const config = {
        ...configFromUrl,
        containerId: containerId,
      };
      init(config);
    }
  };

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
})();
