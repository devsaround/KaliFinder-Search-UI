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
        className="kf:bg-background kf:hover:bg-muted kf:focus:ring-primary kf:group kf:relative kf:rounded-lg kf:p-2 kf:transition-colors kf:duration-200 kf:focus:ring-2 kf:focus:ring-offset-2 kf:focus:outline-none"
        aria-label="Toggle search"
      >
        <Search className="kf:text-muted-foreground kf:group-hover:text-primary kf:h-6 kf:w-6 kf:transition-colors kf:duration-200" />
      </button>

      {/* Search Dropdown */}
      <ShadowDOMSearchDropdown isOpen={isOpen} onClose={toggleIsOpen} storeUrl={storeUrl} />
    </>
  );
};

export default SearchIcon;
