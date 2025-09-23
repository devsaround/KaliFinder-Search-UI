import React, { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";

interface ScrollToTopProps {
  containerRef?: React.RefObject<HTMLElement>;
  showAfter?: number;
  className?: string;
}

const ScrollToTop: React.FC<ScrollToTopProps> = ({
  containerRef,
  showAfter = 300,
  className = "",
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      const scrollTop = containerRef?.current 
        ? containerRef.current.scrollTop 
        : window.pageYOffset;
        
      setIsVisible(scrollTop > showAfter);
    };

    const handleScroll = () => {
      toggleVisibility();
    };

    if (containerRef?.current) {
      containerRef.current.addEventListener("scroll", handleScroll);
    } else {
      window.addEventListener("scroll", handleScroll);
    }

    return () => {
      const container = containerRef?.current;
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      } else {
        window.removeEventListener("scroll", handleScroll);
      }
    };
  }, [containerRef, showAfter]);

  const scrollToTop = () => {
    if (containerRef?.current) {
      containerRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  return (
    <button
      onClick={scrollToTop}
      className={`
        !fixed !bottom-6 !right-6 !z-[1000] 
        !w-12 !h-12 !bg-primary !text-primary-foreground 
        !rounded-full !shadow-lg hover:!shadow-xl 
        !transition-all !duration-300 !ease-in-out
        hover:!scale-110 active:!scale-95
        !flex !items-center !justify-center
        ${isVisible ? "!opacity-100 !translate-y-0" : "!opacity-0 !translate-y-4 !pointer-events-none"}
        ${className}
      `}
      aria-label="Scroll to top"
      title="Back to top"
    >
      <ChevronUp className="!w-6 !h-6" />
    </button>
  );
};

export default ScrollToTop;