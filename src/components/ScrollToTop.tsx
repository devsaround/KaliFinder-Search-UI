import { ChevronUp } from '@/components/icons';
import { useEffect, useState } from 'react';

interface ScrollToTopProps {
  containerRef?: React.RefObject<HTMLElement | null>;
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
      className={`bg-primary text-primary-foreground fixed right-6 bottom-6 z-[1000] flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-xl active:scale-95 ${isVisible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'} ${className} `}
      aria-label="Scroll to top"
      title="Back to top"
    >
      <ChevronUp className="h-6 w-6" />
    </button>
  );
};

export default ScrollToTop;
