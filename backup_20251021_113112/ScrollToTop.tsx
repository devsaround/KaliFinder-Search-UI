import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

interface ScrollToTopProps {
  containerRef?: React.RefObject<HTMLElement>;
  showAfter?: number;
  className?: string;
}

const ScrollToTop: React.FC<ScrollToTopProps> = ({
  containerRef,
  showAfter = 300,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const container = containerRef?.current;
    const toggleVisibility = () => {
      const scrollTop = container ? container.scrollTop : window.pageYOffset;

      setIsVisible(scrollTop > showAfter);
    };

    const handleScroll = () => {
      toggleVisibility();
    };

    if (container) {
      container.addEventListener('scroll', handleScroll);
    } else {
      window.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      } else {
        window.removeEventListener('scroll', handleScroll);
      }
    };
  }, [containerRef, showAfter]);

  const scrollToTop = () => {
    if (containerRef?.current) {
      containerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } else {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  };

  return (
    <button
      onClick={scrollToTop}
      className={`kf:!bg-primary kf:!text-primary-foreground kf:!fixed kf:!right-6 kf:!bottom-6 kf:!z-[1000] kf:!flex kf:!h-12 kf:!w-12 kf:!items-center kf:!justify-center kf:!rounded-full kf:!shadow-lg kf:!transition-all kf:!duration-300 kf:!ease-in-out kf:hover:!scale-110 kf:hover:!shadow-xl kf:active:!scale-95 ${isVisible ? 'kf:!translate-y-0 kf:!opacity-100' : 'kf:!pointer-events-none kf:!translate-y-4 kf:!opacity-0'} ${className} `}
      aria-label="Scroll to top"
      title="Back to top"
    >
      <ChevronUp className="kf:!h-6 kf:!w-6" />
    </button>
  );
};

export default ScrollToTop;
