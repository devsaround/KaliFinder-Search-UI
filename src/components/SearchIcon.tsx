import React from 'react';
import { Search } from 'lucide-react';
import ShadowDOMSearchDropdown from './ShadowDOMSearchDropdown';
import { useIsOpen } from '@/hooks/zustand';
import type { SearchIconProps } from '../types';

const SearchIcon: React.FC<SearchIconProps> = ({ storeUrl }) => {
  const isOpen = useIsOpen((state) => state.isOpen);
  const toggleIsOpen = useIsOpen((state) => state.toggleIsOpen);

  return (
    <>
      {/* Search Icon Button */}
      <button
        onClick={toggleIsOpen}
        className="!bg-background hover:!bg-muted focus:!ring-primary group !relative !rounded-lg !p-2 !transition-colors !duration-200 focus:!ring-2 focus:!ring-offset-2 focus:!outline-none"
        aria-label="Toggle search"
      >
        <Search className="!text-muted-foreground group-hover:!text-primary !h-6 !w-6 !transition-colors !duration-200" />
      </button>

      {/* Search Dropdown */}
      <ShadowDOMSearchDropdown isOpen={isOpen} onClose={toggleIsOpen} storeUrl={storeUrl} />
    </>
  );
};

export default SearchIcon;
