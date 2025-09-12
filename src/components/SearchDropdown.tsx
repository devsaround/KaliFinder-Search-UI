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
  storeType,
  storeId,
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
    <div className="!fixed !inset-0 !z-[999] !min-h-screen">
      {/* Backdrop */}
      <div
        className={`!fixed !inset-0 !bg-foreground/20 !backdrop-blur-sm !transition-opacity !duration-300 ${
          isOpen ? "!opacity-100" : "!opacity-0"
        }`}
        // onClick={onClose}
      />

      {/* Dropdown Panel */}
      <div
        ref={dropdownRef} // Re-enable ref for click outside
        className={`!fixed !inset-0 !bg-background !shadow-xl !transition-all !duration-500 !overflow-y-auto ${
          isOpen ? "!animate-slide-down" : "!animate-slide-up"
        } lg:!pt-2 !pb-4 !px-4`} // Add padding here
        style={{
          maxHeight: "92vh",
          overflowY: "auto",
        }}
      >
        {/* <div className="px-4 max-w-7xl mx-auto"> */}
        {/* <div className="px-4 w-full max-w-screen-2xl mx-auto py-6"> */}
        {/* <div className="!px-4 !w-full !max-w-screen-2xl !min-w-[100vw] !mx-auto !py-6"> */}
        <div className="!max-w-screen-2xl !mx-auto !h-full">
          {" "}
          {/* Use max-w and mx-auto for responsiveness */}
          <EcommerceSearch
            userId={userId}
            apiKey={apiKey}
            storeId={storeId}
            storeType={storeType}
            onClose={onClose} // Pass the onClose prop down
          />
        </div>
      </div>
    </div>
  );
};

export default SearchDropdown;
