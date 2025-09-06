/**
 * Resizable Splitter Component
 * 
 * Allows users to resize panes by dragging a splitter bar
 */

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GripHorizontal } from 'lucide-react';

interface ResizableSplitterProps {
  children: [React.ReactNode, React.ReactNode]; // [top pane, bottom pane]
  defaultSplitRatio?: number; // 0.0 to 1.0, default height ratio for top pane
  minTopHeight?: number; // minimum height for top pane in pixels
  minBottomHeight?: number; // minimum height for bottom pane in pixels
  onSplitChange?: (ratio: number) => void;
  className?: string;
  splitterClassName?: string;
  isBottomMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export default function ResizableSplitter({
  children,
  defaultSplitRatio = 0.6,
  minTopHeight = 200,
  minBottomHeight = 150,
  onSplitChange,
  className = '',
  splitterClassName = '',
  isBottomMinimized = false,
  onToggleMinimize
}: ResizableSplitterProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [splitRatio, setSplitRatio] = useState(defaultSplitRatio);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  // Update container height on resize
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Handle mouse move during drag
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    const newRatio = relativeY / rect.height;

    // Enforce minimum heights
    const topHeight = newRatio * rect.height;
    const bottomHeight = (1 - newRatio) * rect.height;

    if (topHeight >= minTopHeight && bottomHeight >= minBottomHeight) {
      const clampedRatio = Math.max(0.1, Math.min(0.9, newRatio));
      setSplitRatio(clampedRatio);
      onSplitChange?.(clampedRatio);
    }
  }, [isDragging, minTopHeight, minBottomHeight, onSplitChange]);

  // Handle mouse up to stop dragging
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Set up global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDoubleClick = () => {
    // Double-click to reset to default ratio
    setSplitRatio(defaultSplitRatio);
    onSplitChange?.(defaultSplitRatio);
  };

  // Calculate heights
  const headerHeight = isBottomMinimized ? '60px' : '0px'; // Height for minimized header (adjusted for padding)
  const topHeight = isBottomMinimized ? `calc(100% - ${headerHeight})` : `${splitRatio * 100}%`;
  const bottomHeight = isBottomMinimized ? headerHeight : `${(1 - splitRatio) * 100}%`;

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col h-full ${className}`}
    >
      {/* Top Pane */}
      <div 
        className="overflow-hidden"
        style={{ height: topHeight }}
      >
        {children[0]}
      </div>

      {/* Splitter Bar */}
      {!isBottomMinimized && (
        <div
          className={`
            relative flex items-center justify-center
            bg-gray-200 dark:bg-gray-700 
            border-t border-b border-gray-300 dark:border-gray-600
            cursor-ns-resize select-none
            hover:bg-gray-300 dark:hover:bg-gray-600
            transition-colors duration-150
            ${isDragging ? 'bg-blue-300 dark:bg-blue-600' : ''}
            ${splitterClassName}
          `}
          style={{ height: '8px' }}
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
          title="Drag to resize panes, double-click to reset"
        >
          <GripHorizontal className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          
          {/* Visual feedback during drag */}
          {isDragging && (
            <div className="absolute inset-0 bg-blue-500 opacity-30 pointer-events-none" />
          )}
        </div>
      )}

      {/* Bottom Pane - Allow overflow for scrolling */}
      <div 
        className="flex flex-col transition-all duration-300"
        style={{ height: bottomHeight }}
      >
        {children[1]}
      </div>
    </div>
  );
}
