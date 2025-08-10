'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function Tooltip({ content, children, delay = 1000, className = "" }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for delay
    timeoutRef.current = setTimeout(() => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        // Position tooltip above the element, centered
        setPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 10
        });
        setIsVisible(true);
      }
    }, delay);
  };

  const handleMouseLeave = () => {
    // Clear timeout and hide tooltip
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={className}
      >
        {children}
      </div>
      
      {isVisible && (
        <div
          className="fixed z-50 max-w-xs bg-gray-900 text-white text-sm rounded-lg p-3 shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{
            left: position.x,
            top: position.y,
          }}
        >
          <div className="relative">
            {content}
            {/* Arrow pointing down */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </>
  );
}