import SearchIcon from '../components/SearchIcon';
import { Search } from 'lucide-react';

const Index = () => {
  return (
    <div className="!min-h-screen !bg-gray-50 !flex !items-center !justify-center">
      {/* Header Bar */}
      <div className="!fixed !top-0 !left-0 !right-0 !bg-white !border-b !border-gray-200 !px-4 !py-3 !shadow-sm !z-50">
        <div className="!flex !items-center !justify-between !max-w-7xl !mx-auto">
          {/* Left side - Country/Currency */}
          <div className="!flex !items-center !space-x-4 !text-sm !text-gray-600">
            <span>Spain | EUR €</span>
            <span>English</span>
          </div>
          
          {/* Right side - Icons */}
          <div className="!flex !items-center !space-x-4">
            <SearchIcon />
            <button className="!p-2 !rounded-full !hover:bg-gray-100 !transition-colors !duration-200">
              <div className="!w-6 !h-6 !border-2 !border-gray-700 !rounded"></div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="!mt-20 !text-center">
        <h1 className="!text-4xl !font-bold !text-gray-900 !mb-4">Welcome to Kalifind</h1>
        <p className="!text-lg !text-gray-600 !mb-8">Click the search icon above to start exploring</p>
        <div className="!flex !items-center !justify-center !space-x-2 !text-gray-500">
          <span>Try clicking the</span>
          <Search className="!w-5 !h-5 !text-purple-600" />
          <span>icon in the header</span>
        </div>
      </div>
    </div>
  );
};

export default Index;
