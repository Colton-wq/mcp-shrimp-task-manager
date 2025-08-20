import { useState, useEffect, useCallback } from 'react';

// Breakpoint definitions
export const breakpoints = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400,
} as const;

export type Breakpoint = keyof typeof breakpoints;

// Screen size interface
export interface ScreenSize {
  width: number;
  height: number;
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouch: boolean;
  orientation: 'portrait' | 'landscape';
}

/**
 * 响应式设计Hook
 * 提供屏幕尺寸、断点检测和响应式工具
 */
export function useResponsive() {
  const [screenSize, setScreenSize] = useState<ScreenSize>(() => {
    if (typeof window === 'undefined') {
      return {
        width: 1200,
        height: 800,
        breakpoint: 'lg',
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouch: false,
        orientation: 'landscape',
      };
    }

    return calculateScreenSize();
  });

  // Calculate screen size and breakpoint
  function calculateScreenSize(): ScreenSize {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Determine breakpoint
    let breakpoint: Breakpoint = 'xs';
    for (const [bp, minWidth] of Object.entries(breakpoints).reverse()) {
      if (width >= minWidth) {
        breakpoint = bp as Breakpoint;
        break;
      }
    }

    // Determine device type
    const isMobile = width < breakpoints.md;
    const isTablet = width >= breakpoints.md && width < breakpoints.lg;
    const isDesktop = width >= breakpoints.lg;

    // Check for touch support
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Determine orientation
    const orientation = width > height ? 'landscape' : 'portrait';

    return {
      width,
      height,
      breakpoint,
      isMobile,
      isTablet,
      isDesktop,
      isTouch,
      orientation,
    };
  }

  // Handle resize events
  const handleResize = useCallback(() => {
    setScreenSize(calculateScreenSize());
  }, []);

  // Set up event listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initial calculation
    setScreenSize(calculateScreenSize());

    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    // Add orientation change listener for mobile devices
    window.addEventListener('orientationchange', () => {
      // Delay to ensure dimensions are updated
      setTimeout(handleResize, 100);
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [handleResize]);

  // Utility functions
  const isBreakpoint = useCallback((bp: Breakpoint) => {
    return screenSize.breakpoint === bp;
  }, [screenSize.breakpoint]);

  const isBreakpointUp = useCallback((bp: Breakpoint) => {
    return screenSize.width >= breakpoints[bp];
  }, [screenSize.width]);

  const isBreakpointDown = useCallback((bp: Breakpoint) => {
    return screenSize.width < breakpoints[bp];
  }, [screenSize.width]);

  const isBreakpointBetween = useCallback((minBp: Breakpoint, maxBp: Breakpoint) => {
    return screenSize.width >= breakpoints[minBp] && screenSize.width < breakpoints[maxBp];
  }, [screenSize.width]);

  // Get responsive value based on breakpoints
  const getResponsiveValue = useCallback(<T>(values: Partial<Record<Breakpoint, T>>): T | undefined => {
    // Find the largest breakpoint that matches current screen size
    const sortedBreakpoints = Object.keys(breakpoints).reverse() as Breakpoint[];
    
    for (const bp of sortedBreakpoints) {
      if (screenSize.width >= breakpoints[bp] && values[bp] !== undefined) {
        return values[bp];
      }
    }

    return undefined;
  }, [screenSize.width]);

  // Get CSS media query string
  const getMediaQuery = useCallback((bp: Breakpoint, direction: 'up' | 'down' = 'up') => {
    if (direction === 'up') {
      return `(min-width: ${breakpoints[bp]}px)`;
    } else {
      return `(max-width: ${breakpoints[bp] - 1}px)`;
    }
  }, []);

  // Check if media query matches
  const matchesMediaQuery = useCallback((query: string) => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  }, []);

  // Get container padding based on screen size
  const getContainerPadding = useCallback(() => {
    if (screenSize.isMobile) return '0.75rem';
    if (screenSize.isTablet) return '1rem';
    return '1.5rem';
  }, [screenSize.isMobile, screenSize.isTablet]);

  // Get font size scale based on screen size
  const getFontScale = useCallback(() => {
    if (screenSize.isMobile) return 0.875;
    if (screenSize.isTablet) return 0.9375;
    return 1;
  }, [screenSize.isMobile, screenSize.isTablet]);

  // Get grid columns based on screen size
  const getGridColumns = useCallback((
    mobile: number = 1,
    tablet: number = 2,
    desktop: number = 3
  ) => {
    if (screenSize.isMobile) return mobile;
    if (screenSize.isTablet) return tablet;
    return desktop;
  }, [screenSize.isMobile, screenSize.isTablet]);

  // Check if should use compact layout
  const shouldUseCompactLayout = useCallback(() => {
    return screenSize.isMobile || (screenSize.isTablet && screenSize.orientation === 'portrait');
  }, [screenSize.isMobile, screenSize.isTablet, screenSize.orientation]);

  // Get safe area insets for mobile devices
  const getSafeAreaInsets = useCallback(() => {
    if (typeof window === 'undefined' || !screenSize.isMobile) {
      return { top: 0, right: 0, bottom: 0, left: 0 };
    }

    const style = getComputedStyle(document.documentElement);
    return {
      top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0'),
      right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0'),
      bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0'),
      left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0'),
    };
  }, [screenSize.isMobile]);

  return {
    screenSize,
    breakpoints,
    isBreakpoint,
    isBreakpointUp,
    isBreakpointDown,
    isBreakpointBetween,
    getResponsiveValue,
    getMediaQuery,
    matchesMediaQuery,
    getContainerPadding,
    getFontScale,
    getGridColumns,
    shouldUseCompactLayout,
    getSafeAreaInsets,
  };
}

// Hook for specific breakpoint detection
export function useBreakpoint(bp: Breakpoint, direction: 'up' | 'down' = 'up') {
  const { isBreakpointUp, isBreakpointDown } = useResponsive();
  
  return direction === 'up' ? isBreakpointUp(bp) : isBreakpointDown(bp);
}

// Hook for mobile detection
export function useIsMobile() {
  const { screenSize } = useResponsive();
  return screenSize.isMobile;
}

// Hook for touch device detection
export function useIsTouch() {
  const { screenSize } = useResponsive();
  return screenSize.isTouch;
}

export default useResponsive;