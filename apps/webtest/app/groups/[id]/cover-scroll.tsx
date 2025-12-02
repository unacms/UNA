'use client'

// CoverScroll - Pre-scrolls the page on desktop to show half of cover image
// Only activates on desktop viewports (lg+)

import { useEffect, useRef } from 'react'

interface CoverScrollProps {
  children: React.ReactNode
  /** ID of the cover element to measure */
  coverId?: string
}

export function CoverScroll({ children, coverId = 'group-cover' }: CoverScrollProps) {
  const hasScrolled = useRef(false)
  
  useEffect(() => {
    // Only run once on mount
    if (hasScrolled.current) return
    
    // Check if we're on desktop (lg breakpoint = 1024px)
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches
    if (!isDesktop) return
    
    // Find the cover element
    const coverElement = document.getElementById(coverId)
    if (!coverElement) return
    
    // Get cover height and scroll to show half
    const coverHeight = coverElement.offsetHeight
    const scrollAmount = coverHeight / 2
    
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      window.scrollTo({
        top: scrollAmount,
        behavior: 'instant'
      })
      hasScrolled.current = true
    })
  }, [coverId])
  
  return <>{children}</>
}

