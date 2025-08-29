import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import KalifindSearch from './KalifindSearch';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIsAnimating(true);
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
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div className="!fixed !inset-0 !z-[9999] !w-screen !h-screen">
      {/* Backdrop */}
      <div 
        className={`!fixed !inset-0 !bg-black/60 !backdrop-blur-sm !transition-all !duration-300 !ease-out ${
          isAnimating ? '!opacity-100' : '!opacity-0'
        }`}
        onClick={handleClose}
      />
      
      {/* Modal Content */}
      <div className={`!fixed !inset-0 !w-full !h-full !bg-white !overflow-auto !transition-all !duration-300 !ease-out !transform ${
        isAnimating 
          ? '!translate-y-0 !opacity-100 !scale-100' 
          : '!translate-y-4 !opacity-0 !scale-95'
      }`}>
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
              onClick={handleClose}
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