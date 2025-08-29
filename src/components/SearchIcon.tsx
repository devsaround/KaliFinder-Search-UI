import React, { useState } from 'react';
import { Search } from 'lucide-react';
import SearchModal from './SearchModal';

const SearchIcon: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      {/* Search Icon Button */}
      <button
        onClick={openModal}
        className="!p-2 !rounded-full !hover:bg-gray-100 !transition-all !duration-200 !hover:scale-105 !focus:outline-none !focus:ring-2 !focus:ring-purple-500 !focus:ring-offset-2"
        aria-label="Open search"
      >
        <Search className="!w-6 !h-6 !text-gray-700 !hover:text-purple-600 !transition-colors !duration-200" />
      </button>

      {/* Search Modal */}
      <SearchModal isOpen={isModalOpen} onClose={closeModal} />
    </>
  );
};

export default SearchIcon;