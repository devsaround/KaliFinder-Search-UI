import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import KalifindSearch from "./KalifindSearch";
import SearchDropdown from "./SearchDropdown";
import "./index.css"; // Import all styles

interface ShadowDOMWrapperProps {
  storeUrl?: string;
  onClose?: () => void;
  searchQuery?: string;
  hideHeader?: boolean;
}

const ShadowDOMWrapper: React.FC<ShadowDOMWrapperProps> = (props) => {
  const shadowHostRef = useRef<HTMLDivElement>(null);
  const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null);
  const [reactRoot, setReactRoot] = useState<any>(null);

  useEffect(() => {
    if (shadowHostRef.current && !shadowRoot) {
      // Create shadow root with closed mode for better isolation
      const shadow = shadowHostRef.current.attachShadow({ mode: "closed" });
      setShadowRoot(shadow);

      // Create a container div inside shadow DOM
      const shadowContainer = document.createElement("div");
      shadowContainer.id = "kalifind-shadow-container";
      shadow.appendChild(shadowContainer);

      // Create React root inside shadow DOM
      const root = createRoot(shadowContainer);
      setReactRoot(root);

      // Inject CSS into shadow DOM
      const styleElement = document.createElement("style");
      styleElement.textContent = `
        /* Reset all inherited styles */
        * {
          all: unset;
          display: revert;
          box-sizing: border-box;
        }

        /* Import Tailwind CSS */
        @import url('https://cdn.tailwindcss.com/3.4.0');
        
        /* Your custom styles */
        .kalifind-container {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.5;
          color: #1f2937;
          background-color: #ffffff;
        }

        /* Ensure all your component styles are scoped */
        .kalifind-container * {
          font-family: inherit;
        }

        /* Override any potential WordPress theme styles */
        .kalifind-container input,
        .kalifind-container button,
        .kalifind-container div,
        .kalifind-container span {
          all: unset;
          display: revert;
          box-sizing: border-box;
        }
      `;
      shadow.appendChild(styleElement);
    }

    return () => {
      if (reactRoot) {
        reactRoot.unmount();
      }
    };
  }, []);

  useEffect(() => {
    if (reactRoot && shadowRoot) {
      // Render your component inside shadow DOM
      reactRoot.render(
        <div className="kalifind-container">
          <KalifindSearch {...props} />
        </div>
      );
    }
  }, [reactRoot, shadowRoot, props]);

  return <div ref={shadowHostRef} style={{ display: "contents" }} />;
};

export default ShadowDOMWrapper;
