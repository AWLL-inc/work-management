/**
 * useMediaQuery - Responsive media query hook
 *
 * Detects screen size and returns boolean flags for different breakpoints.
 * Uses Tailwind CSS breakpoints for consistency.
 *
 * @example
 * ```tsx
 * const { isMobile, isTablet, isDesktop } = useMediaQuery();
 * ```
 */

import { useEffect, useState } from "react";

export interface MediaQueryState {
  isMobile: boolean; // < 768px (sm and below)
  isTablet: boolean; // 768px - 1024px (md to lg)
  isDesktop: boolean; // >= 1024px (lg and above)
  width: number; // Current window width
}

/**
 * Tailwind CSS breakpoints
 * sm: 640px
 * md: 768px
 * lg: 1024px
 * xl: 1280px
 * 2xl: 1536px
 */
const BREAKPOINTS = {
  MOBILE_MAX: 768, // md breakpoint
  TABLET_MAX: 1024, // lg breakpoint
} as const;

export function useMediaQuery(): MediaQueryState {
  const [state, setState] = useState<MediaQueryState>(() => {
    // Initialize with SSR-safe default values
    if (typeof window === "undefined") {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true, // Default to desktop for SSR
        width: 1024, // Default width
      };
    }

    const width = window.innerWidth;
    return {
      isMobile: width < BREAKPOINTS.MOBILE_MAX,
      isTablet:
        width >= BREAKPOINTS.MOBILE_MAX && width < BREAKPOINTS.TABLET_MAX,
      isDesktop: width >= BREAKPOINTS.TABLET_MAX,
      width,
    };
  });

  useEffect(() => {
    // Skip if window is not available (SSR)
    if (typeof window === "undefined") {
      return;
    }

    const handleResize = () => {
      const width = window.innerWidth;
      setState({
        isMobile: width < BREAKPOINTS.MOBILE_MAX,
        isTablet:
          width >= BREAKPOINTS.MOBILE_MAX && width < BREAKPOINTS.TABLET_MAX,
        isDesktop: width >= BREAKPOINTS.TABLET_MAX,
        width,
      });
    };

    // Set initial state
    handleResize();

    // Add resize listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return state;
}
