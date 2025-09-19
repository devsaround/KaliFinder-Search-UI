import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import KalifindSearch from "./KalifindSearch";

interface CompleteShadowDOMWrapperProps {
  storeUrl?: string;
  onClose?: () => void;
  searchQuery?: string;
  hideHeader?: boolean;
}

const CompleteShadowDOMWrapper: React.FC<CompleteShadowDOMWrapperProps> = (
  props
) => {
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

      // Inject comprehensive CSS into shadow DOM
      const styleElement = document.createElement("style");
      styleElement.textContent = `
        /* Complete CSS Reset and Tailwind CSS */
        @import url('https://cdn.tailwindcss.com/3.4.0');
        
        /* CSS Reset */
        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        /* Base styles */
        .kalifind-container {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.5;
          color: #1f2937;
          background-color: #ffffff;
          font-size: 16px;
        }

        /* CSS Custom Properties for consistent theming */
        .kalifind-container {
          --background: 0 0% 100%;
          --foreground: 222.2 84% 4.9%;
          --card: 0 0% 100%;
          --card-foreground: 222.2 84% 4.9%;
          --popover: 0 0% 100%;
          --popover-foreground: 222.2 84% 4.9%;
          --primary: 264 83% 58%;
          --primary-foreground: 0 0% 100%;
          --primary-hover: 264 83% 52%;
          --secondary: 250 7% 97%;
          --secondary-foreground: 222.2 47.4% 11.2%;
          --muted: 250 7% 97%;
          --muted-foreground: 215.4 16.3% 46.9%;
          --accent: 264 83% 95%;
          --accent-foreground: 264 83% 25%;
          --destructive: 0 84.2% 60.2%;
          --destructive-foreground: 210 40% 98%;
          --border: 220 13% 91%;
          --input: 220 13% 91%;
          --ring: 264 83% 58%;
          --search-highlight: 264 83% 58%;
          --search-bar: 0 0% 98%;
          --filter-bg: 0 0% 100%;
          --loading: 220 13% 91%;
          --loading-shimmer: 0 0% 98%;
          --radius: 0.5rem;
        }

        /* Ensure all elements inherit proper styles */
        .kalifind-container * {
          font-family: inherit;
          line-height: inherit;
          color: inherit;
        }

        /* Override any potential conflicts */
        .kalifind-container input,
        .kalifind-container button,
        .kalifind-container div,
        .kalifind-container span,
        .kalifind-container p,
        .kalifind-container h1,
        .kalifind-container h2,
        .kalifind-container h3,
        .kalifind-container h4,
        .kalifind-container h5,
        .kalifind-container h6 {
          font-family: inherit;
          line-height: inherit;
          color: inherit;
        }

        /* Ensure proper display properties */
        .kalifind-container div { display: block; }
        .kalifind-container span { display: inline; }
        .kalifind-container button { 
          display: inline-block; 
          cursor: pointer;
        }
        .kalifind-container input { display: inline-block; }
        .kalifind-container img { 
          display: block; 
          max-width: 100%; 
          height: auto; 
        }

        /* Custom animations */
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        @keyframes slide-down {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(-100%);
            opacity: 0;
          }
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* Apply animations */
        .kalifind-container .animate-shimmer {
          animation: shimmer 2s infinite;
        }

        .kalifind-container .animate-pulse-slow {
          animation: pulse-slow 2s infinite;
        }

        .kalifind-container .animate-slide-down {
          animation: slide-down 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .kalifind-container .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.4, 0, 0.6, 1);
        }

        .kalifind-container .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .kalifind-container {
            font-size: 14px;
          }
        }

        @media (max-width: 480px) {
          .kalifind-container {
            font-size: 12px;
          }
        }

        /* Ensure z-index is always highest */
        .kalifind-container {
          z-index: 999999;
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

export default CompleteShadowDOMWrapper;
