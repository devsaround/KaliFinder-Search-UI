import React from 'react';
import { Search } from 'lucide-react';
import ShadowDOMSearchDropdown from './ShadowDOMSearchDropdown';
import { useIsOpen } from '@/hooks/zustand';
import { SearchIconProps } from '../types';

const SearchIcon: React.FC<SearchIconProps> = ({ storeUrl }) => {
  const isOpen = useIsOpen((state) => state.isOpen);
  const toggleIsOpen = useIsOpen((state) => state.toggleIsOpen);

  return (
    <>
      {/* Search Icon Button */}
      <button
        onClick={toggleIsOpen}
        className="!relative !p-2 !rounded-lg !bg-background hover:!bg-muted !transition-colors !duration-200 focus:!outline-none focus:!ring-2 focus:!ring-primary focus:!ring-offset-2 group"
        aria-label="Toggle search"
      >
        <Search className="!w-6 !h-6 !text-muted-foreground group-hover:!text-primary !transition-colors !duration-200" />
      </button>

      {/* Search Dropdown */}
      <ShadowDOMSearchDropdown isOpen={isOpen} onClose={toggleIsOpen} storeUrl={storeUrl} />
    </>
  );
};

export default SearchIcon;
