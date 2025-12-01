// Performance Footer Types
// Shared types for the performance report footer component

/**
 * Performance data passed to the footer
 */
export interface PerformanceData {
  /** Component rendering type */
  componentType: 'server' | 'client' | 'hybrid'
  
  /** API timing information */
  timing?: {
    durationMs: number
  }
  
  /** Cache status */
  cache?: {
    revalidateSeconds: number
    tags: string[]
    hit: 'MISS' | 'HIT' | 'STALE' | 'UNKNOWN'
  }
  
  /** Page-specific metadata */
  pageName?: string
}

/**
 * Props for the PerformanceFooter component
 */
export interface PerformanceFooterProps {
  /** Performance data to display */
  data?: PerformanceData
  
  /** Whether to show the footer (can be controlled via settings) */
  show?: boolean
  
  /** Additional CSS classes */
  className?: string
}

