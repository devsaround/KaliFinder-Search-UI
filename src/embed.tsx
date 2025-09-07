import React from "react";
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
      </React.StrictMode>
    );
  } else {
    console.error(`Could not find element with id "${config.containerId}"`);
  }
};

(window as any).KalifindSearch = {
  init,
};

const findSearchTriggerElements = (): HTMLElement[] => {
  const headers = Array.from(document.getElementsByTagName('header'));
  const triggerElements: HTMLElement[] = [];
  const searchRegex = /search/i;
  headers.forEach(header => {
    const elements = Array.from(header.querySelectorAll('[class], [id]'));
    elements.forEach(element => {
      const classAttr = element.getAttribute('class') || '';
      const idAttr = element.getAttribute('id') || '';
      if (searchRegex.test(classAttr) || searchRegex.test(idAttr)) {
        triggerElements.push(element as HTMLElement);
      }
    });
  });
  return triggerElements;
};

(function () {
  const initialize = () => {
    const scriptTag = document.querySelector('script[src*="kalifind-search.js"]');
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
      // --- START OF NEW TOGGLE LOGIC ---
      let modalControl: { root: ReactDOM.Root | null; container: HTMLElement | null } = {
        root: null,
        container: null,
      };

      triggerElements.forEach(element => {
        element.style.cursor = 'pointer';
        element.addEventListener('click', (e) => {
          e.preventDefault();

          const isModalOpen = modalControl.root && modalControl.container;

          if (isModalOpen) {
            // If open, close and clean it up
            modalControl.root.unmount();
            modalControl.container.remove();
            modalControl.root = null;
            modalControl.container = null;
          } else {
            // If closed, create and open it
            const modalContainer = document.createElement('div');
            // Use a more specific ID to avoid potential conflicts
            modalContainer.id = `kalifind-modal-container-${Math.random().toString(36).substring(2, 9)}`;
            document.body.appendChild(modalContainer);

            const root = ReactDOM.createRoot(modalContainer);

            const handleClose = () => {
              root.unmount();
              modalContainer.remove();
              modalControl.root = null;
              modalControl.container = null;
            };
            
            // Store the state
            modalControl.root = root;
            modalControl.container = modalContainer;

            root.render(
              <React.StrictMode>
                <SearchDropdown
                  isOpen={true}
                  onClose={handleClose}
                  {...configFromUrl}
                />
              </React.StrictMode>
            );
          }
        });
      });
      // --- END OF NEW TOGGLE LOGIC ---
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