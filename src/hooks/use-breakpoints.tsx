"use client"

import * as React from "react"

const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1400,
}

export function useBreakpoints() {
  const [breakpoints, setBreakpoints] = React.useState({
    isSm: false,
    isMd: false,
    isLg: false,
    isXl: false,
    is2xl: false,
    isMobile: false,
    isTablet: false,
    isMediumDesktop: false,
    isDesktop: false,
    isLessThanMediumDesktop: false,
  })

  React.useEffect(() => {
    function update() {
      const width = window.innerWidth
      const isSm = width < BREAKPOINTS.sm
      const isMd = width >= BREAKPOINTS.sm && width < BREAKPOINTS.md
      const isLg = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg
      const isXl = width >= BREAKPOINTS.lg && width < BREAKPOINTS.xl
      const is2xl = width >= BREAKPOINTS.xl
      setBreakpoints({
        isSm,
        isMd,
        isLg,
        isXl,
        is2xl,
        isMobile: width < BREAKPOINTS.md,
        isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
        isMediumDesktop: width >= BREAKPOINTS["xl"] && width < BREAKPOINTS["2xl"],
        isDesktop: width >= BREAKPOINTS["2xl"],
        isLessThanMediumDesktop: width < BREAKPOINTS["xl"],
      })
    }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  return breakpoints
}
