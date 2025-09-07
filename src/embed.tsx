import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

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

// Expose the init function to the global scope for manual initialization
(window as any).KalifindSearch = {
  init,
};

// Self-executing function for automatic initialization
(function () {
  const initialize = () => {
    // Find the script tag
    const scriptTag = document.querySelector('script[src*="kalifind-search.js"]');
    if (!scriptTag) {
      console.error("Kalifind Search script tag not found.");
      return;
    }

    // Parse URL to get parameters
    const scriptSrc = scriptTag.getAttribute("src");
    if (!scriptSrc) {
      return; // Should not happen if scriptTag is found
    }
    const url = new URL(scriptSrc, window.location.origin);
    const storeId = url.searchParams.get("storeId");
    const storeType = url.searchParams.get("storeType");
    const userId = url.searchParams.get("userId");
    const apiKey = url.searchParams.get("apiKey");

    // If no params, don't auto-init. Rely on manual init.
    if (!storeId && !storeType && !userId && !apiKey) {
      return;
    }

    // Use an existing container or create one
    const containerId = "kalifind-search-container";
    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement("div");
      container.id = containerId;
      // Insert container before the script tag
      if (scriptTag.parentNode) {
        scriptTag.parentNode.insertBefore(container, scriptTag);
      }
    }

    // Initialize the app
    const config: KalifindSearchConfig = {
      containerId: containerId,
      storeId: storeId || undefined,
      storeType: storeType || undefined,
      userId: userId || undefined,
      apiKey: apiKey || undefined,
    };

    init(config);
  };

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
})();