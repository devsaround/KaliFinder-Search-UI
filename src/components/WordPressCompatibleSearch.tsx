import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import KalifindSearch from "./KalifindSearch";
import { injectIsolatedStyles, applyScopedStyles } from "../lib/styleIsolation";
import { overrideCSSVariables } from "../lib/cssOverride";

interface WordPressCompatibleSearchProps {
  storeUrl?: string;
  onClose?: () => void;
  searchQuery?: string;
  hideHeader?: boolean;
  useShadowDOM?: boolean;
}

const WordPressCompatibleSearch: React.FC<WordPressCompatibleSearchProps> = ({
  useShadowDOM = false,
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Apply style isolation
    injectIsolatedStyles(document.body);
    overrideCSSVariables();
    applyScopedStyles(containerRef.current);

    setIsInitialized(true);

    return () => {
      // Cleanup on unmount
      const styleElement = document.getElementById("kalifind-isolated-styles");
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);

  if (!isInitialized) {
    return <div ref={containerRef} className="kalifind-search-widget" />;
  }

  return (
    <div ref={containerRef} className="kalifind-search-widget">
      <KalifindSearch {...props} />
    </div>
  );
};

export default WordPressCompatibleSearch;
