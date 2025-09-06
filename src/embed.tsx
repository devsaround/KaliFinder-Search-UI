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
      </React.StrictMode>,
    );
  } else {
    console.error(`Could not find element with id "${config.containerId}"`);
  }
};

// Expose the init function to the global scope
(window as any).KalifindSearch = {
  init,
};
