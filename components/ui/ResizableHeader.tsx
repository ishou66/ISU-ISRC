

import React, { useState, useRef, useEffect } from 'react';

interface ResizableHeaderProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  minWidth?: number;
}

export const ResizableHeader: React.FC<ResizableHeaderProps> = ({ 
  children, 
  minWidth = 60, 
  className = "", 
  style,
  ...props 
}) => {
  const [width, setWidth] = useState<number | undefined>(undefined);
  const thRef = useRef<HTMLTableCellElement>(null);
  const startX = useRef<number>(0);
  const startWidth = useRef<number>(0);

  // Initialize width on mount to prevent jumping
  useEffect(() => {
    if (thRef.current) {
        // Only set if not already set (keep auto layout initially if preferred, or lock it down)
        // setWidth(thRef.current.offsetWidth); 
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!thRef.current) return;

    startX.current = e.pageX;
    startWidth.current = thRef.current.offsetWidth;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
  };

  const handleMouseMove = (e: MouseEvent) => {
    const currentX = e.pageX;
    const diff = currentX - startX.current;
    const newWidth = Math.max(minWidth, startWidth.current + diff);
    setWidth(newWidth);
  };

  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'default';
  };

  return (
    <th
      ref={thRef}
      className={`relative group bg-neutral-bg text-neutral-text border-b border-neutral-border font-bold text-left select-none ${className}`}
      style={{ 
        ...style, 
        width: width, 
        minWidth: width ? `${width}px` : undefined,
        // Using box-sizing border-box is usually default in Tailwind/Bootstrap
      }}
      {...props}
    >
      <div className="flex items-center w-full h-full px-1">
        <span className="flex-1 truncate block">{children}</span>
      </div>
      
      {/* Resizer Handle */}
      <div
        onMouseDown={handleMouseDown}
        onClick={(e) => e.stopPropagation()}
        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/50 group-hover:bg-gray-300 z-10 transition-colors"
        title="拖曳調整欄寬"
      />
    </th>
  );
};
