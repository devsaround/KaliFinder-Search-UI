import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
// import EcommerceSearch from './EcommerceSearch';
import EcommerceSearch from "./KalifindSearch";

interface SearchDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchDropdown: React.FC<SearchDropdownProps> = ({ isOpen, onClose }) => {
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
    // <div className="fixed inset-0 z-[9999]">
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
        {/* Header */}
        {/* <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border px-4 py-4"> */}
        {/*   <div className="flex items-center justify-between max-w-7xl mx-auto"> */}
        {/*     <div className="flex items-center space-x-3"> */}
        {/*       <span className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent"> */}
        {/*         Kalifind */}
        {/*       </span> */}
        {/*       <div className="flex space-x-1.5"> */}
        {/*         <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div> */}
        {/*         <div className="w-2 h-2 bg-secondary rounded-full animate-pulse delay-100"></div> */}
        {/*         <div className="w-2 h-2 bg-accent rounded-full animate-pulse delay-200"></div> */}
        {/*       </div> */}
        {/*     </div> */}
        {/**/}
        {/*     <button */}
        {/*       onClick={onClose} */}
        {/*       className="p-2 rounded-lg hover:bg-muted transition-colors duration-200 group" */}
        {/*       aria-label="Close search" */}
        {/*     > */}
        {/*       <X className="w-6 h-6 text-muted-foreground group-hover:text-foreground transition-colors duration-200" /> */}
        {/*     </button> */}
        {/*   </div> */}
        {/* </div> */}

        {/* Search Component */}
        {/* <div className="px-4 py-8 max-w-7xl mx-auto"> */}
        <div className="px-4 max-w-7xl mx-auto">
          {/* <EcommerceSearch onClose={onClose}/> */}
          <EcommerceSearch />
        </div>
      </div>
    </div>
  );
};

export default SearchDropdown;
