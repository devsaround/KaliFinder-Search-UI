import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
// import EcommerceSearch from "./KalifindSearch.tsx";
import EcommerceSearch from "./KalifindSearchTest.tsx";
// import EcommerceSearch from "./KalifindSearchOld.tsx";

interface SearchDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  apiKey?: string;
  storeId?: string;
  storeType?: string;
}

const SearchDropdown: React.FC<SearchDropdownProps> = ({
  isOpen,
  onClose,
  userId,
  apiKey,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = "hidden";
    } else {
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 300);
      document.body.style.overflow = "unset";
      return () => clearTimeout(timer);
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen && !isAnimating) return null;

  return (
    <div className="fixed inset-0 z-[9999] !min-h-screen">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-foreground/20 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        // onClick={onClose}
      />

      {/* Dropdown Panel */}
      <div
        // ref={dropdownRef}
        className={`fixed top-0 left-0 right-0 bg-background border-b border-border shadow-xl transition-all duration-500 ${
          isOpen ? "animate-slide-down" : "animate-slide-up"
        }`}
        style={{
          // maxHeight: "85vh",
          maxHeight: "92vh",
          overflowY: "auto",
        }}
      >
        {/* <div className="px-4 max-w-7xl mx-auto"> */}
        <div className="px-4 w-full max-w-screen-2xl mx-auto py-6">
          <EcommerceSearch
            userId={userId}
            apiKey={apiKey}
            storeId={storeId}
            storeType={storeType}
          />
        </div>
      </div>
    </div>
  );
};

export default SearchDropdown;
