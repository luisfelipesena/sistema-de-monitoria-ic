import { useEffect, useState } from 'react';

/**
 * A hook that detects if the current viewport width is within mobile dimensions.
 * Returns true for mobile devices, false otherwise.
 *
 * @param breakpoint - The width threshold in pixels that defines a mobile device (default: 768px)
 * @returns Boolean indicating if the current device is considered mobile
 */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // Check on mount
    if (typeof window !== 'undefined') {
      checkMobile();
    }

    // Add event listener for resize
    window.addEventListener('resize', checkMobile);

    // Clean up
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [breakpoint]);

  return isMobile;
}
