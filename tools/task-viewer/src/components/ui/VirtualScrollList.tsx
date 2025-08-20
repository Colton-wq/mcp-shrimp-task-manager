import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styles from './VirtualScrollList.module.css';

interface VirtualScrollListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
  scrollToBottom?: boolean;
  maintainScrollPosition?: boolean;
}

/**
 * 虚拟滚动列表组件
 * 优化大量消息的渲染性能，只渲染可见区域的项目
 */
export function VirtualScrollList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className,
  onScroll,
  scrollToBottom = false,
  maintainScrollPosition = false,
}: VirtualScrollListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const lastItemCountRef = useRef(items.length);
  const lastScrollTopRef = useRef(0);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  // Get visible items
  const visibleItems = useMemo(() => {
    const { startIndex, endIndex } = visibleRange;
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index,
    }));
  }, [items, visibleRange]);

  // Total height of all items
  const totalHeight = items.length * itemHeight;

  // Offset for visible items
  const offsetY = visibleRange.startIndex * itemHeight;

  // Handle scroll events
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = event.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    setIsScrolling(true);
    
    onScroll?.(newScrollTop);

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Set scrolling to false after scroll ends
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, [onScroll]);

  // Scroll to bottom when new items are added
  useEffect(() => {
    if (!scrollElementRef.current) return;

    const currentItemCount = items.length;
    const previousItemCount = lastItemCountRef.current;
    const hasNewItems = currentItemCount > previousItemCount;

    if (scrollToBottom && hasNewItems) {
      const scrollElement = scrollElementRef.current;
      const isNearBottom = 
        scrollElement.scrollTop + scrollElement.clientHeight >= 
        scrollElement.scrollHeight - itemHeight * 2;

      // Only auto-scroll if user is near the bottom
      if (isNearBottom || previousItemCount === 0) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }

    lastItemCountRef.current = currentItemCount;
  }, [items.length, itemHeight, scrollToBottom]);

  // Maintain scroll position when items change
  useEffect(() => {
    if (!maintainScrollPosition || !scrollElementRef.current) return;

    const scrollElement = scrollElementRef.current;
    const currentScrollTop = lastScrollTopRef.current;
    
    if (Math.abs(scrollElement.scrollTop - currentScrollTop) > itemHeight) {
      scrollElement.scrollTop = currentScrollTop;
    }
  }, [items, itemHeight, maintainScrollPosition]);

  // Update last scroll position
  useEffect(() => {
    lastScrollTopRef.current = scrollTop;
  }, [scrollTop]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Public methods via ref
  const scrollToIndex = useCallback((index: number, align: 'start' | 'center' | 'end' = 'start') => {
    if (!scrollElementRef.current) return;

    let targetScrollTop: number;
    
    switch (align) {
      case 'center':
        targetScrollTop = index * itemHeight - containerHeight / 2 + itemHeight / 2;
        break;
      case 'end':
        targetScrollTop = index * itemHeight - containerHeight + itemHeight;
        break;
      default: // 'start'
        targetScrollTop = index * itemHeight;
    }

    targetScrollTop = Math.max(0, Math.min(targetScrollTop, totalHeight - containerHeight));
    scrollElementRef.current.scrollTop = targetScrollTop;
  }, [itemHeight, containerHeight, totalHeight]);

  const scrollToTop = useCallback(() => {
    if (scrollElementRef.current) {
      scrollElementRef.current.scrollTop = 0;
    }
  }, []);

  const scrollToBottomMethod = useCallback(() => {
    if (scrollElementRef.current) {
      scrollElementRef.current.scrollTop = scrollElementRef.current.scrollHeight;
    }
  }, []);

  // Expose methods via ref (if needed)
  React.useImperativeHandle(scrollElementRef, () => ({
    scrollToIndex,
    scrollToTop,
    scrollToBottom: scrollToBottomMethod,
    getScrollTop: () => scrollTop,
    getVisibleRange: () => visibleRange,
  }));

  return (
    <div
      ref={scrollElementRef}
      className={`${styles.container} ${isScrolling ? styles.scrolling : ''} ${className || ''}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
      role="list"
      aria-label="Virtual scroll list"
    >
      {/* Total height spacer */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Visible items container */}
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map(({ item, index }) => (
            <div
              key={index}
              style={{ height: itemHeight }}
              className={styles.item}
              role="listitem"
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicators */}
      {isScrolling && (
        <div className={styles.scrollIndicator}>
          <div className={styles.scrollThumb} />
        </div>
      )}
    </div>
  );
}

export default VirtualScrollList;