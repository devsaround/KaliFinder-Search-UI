import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import SearchDropdown from "./SearchDropdown";
import ShadowDOMWrapper from "./ShadowDOMWrapper";
import { injectIsolatedStyles, applyScopedStyles } from "../lib/styleIsolation";
import { overrideCSSVariables } from "../lib/cssOverride";

interface EnhancedSearchModalProps {
  storeUrl?: string;
  onClose?: () => void;
  searchQuery?: string;
  hideHeader?: boolean;
  useShadowDOM?: boolean;
}

const EnhancedSearchModal: React.FC<EnhancedSearchModalProps> = ({
  useShadowDOM = false,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    // Wait for animation to finish, then call the unmount function
    setTimeout(() => {
      const modal = document.getElementById("kalifind-modal-container");
      if (modal) {
        modal.remove();
      }
    }, 300);
  };

  if (!isOpen) return null;

  if (useShadowDOM) {
    // Use Shadow DOM for complete isolation
    return <ShadowDOMWrapper {...props} onClose={handleClose} />;
  } else {
    // Use regular CSS isolation
    return <SearchDropdown isOpen={isOpen} onClose={handleClose} {...props} />;
  }
};

// Function to open the search modal with Shadow DOM option
const openSearchModal = (config: any) => {
  const existingModal = document.getElementById("kalifind-modal-container");
  if (existingModal) {
    return;
  }

  // Check if Shadow DOM should be used (from URL parameter or config)
  const useShadowDOM =
    config.useShadowDOM ||
    new URLSearchParams(window.location.search).get("shadowDOM") === "true";

  if (useShadowDOM) {
    // Apply style isolation for Shadow DOM
    injectIsolatedStyles(document.body);
    overrideCSSVariables();
  }

  const modalContainer = document.createElement("div");
  modalContainer.id = "kalifind-modal-container";
  modalContainer.className = "kalifind-search-widget";

  if (!useShadowDOM) {
    // Apply scoped styles for regular mode
    applyScopedStyles(modalContainer);
  }

  modalContainer.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    width: 100% !important;
    height: 100% !important;
    z-index: 10000 !important;
    background-color: transparent !important;
    overflow: hidden !important;
  `;

  document.body.appendChild(modalContainer);

  const root = ReactDOM.createRoot(modalContainer);

  const handleUnmount = () => {
    root.unmount();
    modalContainer.remove();
  };

  root.render(
    <React.StrictMode>
      <EnhancedSearchModal
        onUnmount={handleUnmount}
        useShadowDOM={useShadowDOM}
        {...config}
      />
    </React.StrictMode>
  );
};

export default EnhancedSearchModal;
export { openSearchModal };
