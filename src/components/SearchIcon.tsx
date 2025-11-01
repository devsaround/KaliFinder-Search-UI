import { Search } from '@/components/icons';
import React from 'react';

const SearchIcon: React.FC = () => {
  return (
    <button
      className="group rounded-full p-3 transition-all duration-200 hover:bg-gray-100"
      aria-label="Search"
      title="Search products"
    >
      <Search className="h-5 w-5 text-gray-600 transition-colors duration-200 group-hover:text-purple-600" />
    </button>
  );
};

export default SearchIcon;
