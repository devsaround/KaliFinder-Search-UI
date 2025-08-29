import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import KalifindSearch from './KalifindSearch';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="!fixed !inset-0 !z-[9999] !flex !items-start !justify-center">
      {/* Backdrop */}
      <div 
        className="!fixed !inset-0 !bg-black/60 !backdrop-blur-sm !transition-opacity !duration-300"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="!relative !w-full !h-full !max-w-none !bg-white !overflow-auto !animate-fade-in">
        {/* Header */}
        <div className="!sticky !top-0 !z-10 !bg-white !border-b !border-gray-200 !px-4 !py-3 !shadow-sm">
          <div className="!flex !items-center !justify-between !max-w-7xl !mx-auto">
            {/* Logo */}
            <div className="!flex !items-center !space-x-2">
              <span className="!text-2xl !font-bold !text-gray-900">Kalifind</span>
              <div className="!flex !space-x-1">
                <div className="!w-2 !h-2 !bg-purple-500 !rounded-full"></div>
                <div className="!w-2 !h-2 !bg-green-500 !rounded-full"></div>
                <div className="!w-2 !h-2 !bg-blue-500 !rounded-full"></div>
              </div>
            </div>
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="!p-2 !rounded-full !hover:bg-gray-100 !transition-colors !duration-200"
              aria-label="Close search"
            >
              <X className="!w-6 !h-6 !text-gray-600" />
            </button>
          </div>
        </div>

        {/* Search Component */}
        <div className="!px-4 !py-6">
          <KalifindSearch />
        </div>
      </div>
    </div>
  );
};

export default SearchModal;