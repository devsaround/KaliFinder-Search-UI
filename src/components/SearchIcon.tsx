import React, { useState } from "react";
import { Search } from "lucide-react";
import SearchDropdown from "./SearchDropdown";
import { useIsOpen } from "@/hooks/zustand";

const SearchIcon: React.FC<{ userId?: string; apiKey?: string }> = ({ userId, apiKey }) => {
  // const [isOpen, setIsOpen] = useState(false);
  const isOpen = useIsOpen((state: any) => state.isOpen);
  const toggleIsOpen = useIsOpen((state: any) => state.toggleIsOpen);

  // const toggleSearch = () => {
  //   // setIsOpen(!isOpen);
  //   toggleIsOpen;
  // };
  //
  // const closeSearch = () => {
  //   // setIsOpen(false);
  //   toggleIsOpen;
  // };
  console.log(isOpen);

  return (
    <>
      {/* Search Icon Button */}
      <button
        onClick={toggleIsOpen}
        className="relative p-2 rounded-lg bg-background hover:bg-muted transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 group"
        aria-label="Toggle search"
      >
        <Search className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
      </button>

      {/* Search Dropdown */}
      <SearchDropdown isOpen={isOpen} onClose={toggleIsOpen} userId={userId} apiKey={apiKey} />
    </>
  );
};

export default SearchIcon;
