// PerformanceFooter - Server Component
// Displays render performance metrics in development/debug mode

import type { PerformanceFooterProps } from './types'

/**
 * Performance Footer Component
 * Shows render timing, cache status, and component type information
 * 
 * @example
 * ```tsx
 * <PerformanceFooter 
 *   show={settings.showPerformanceReport}
 *   data={{
 *     componentType: 'server',
 *     timing: { durationMs: 45 },
 *     cache: { hit: 'HIT', revalidateSeconds: 60, tags: ['page'] }
 *   }}
 * />
 * ```
 */
export function PerformanceFooter({ 
  data, 
  show = true,
  className = '' 
}: PerformanceFooterProps) {
  // Don't render if disabled
  if (!show) return null
  
  const componentType = data?.componentType || 'server'
  const timing = data?.timing
  const cache = data?.cache
  const pageName = data?.pageName
  
  // Determine cache status color
  const getCacheColor = (hit?: string) => {
    switch (hit) {
      case 'HIT': return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
      case 'STALE': return 'text-amber-600 dark:text-amber-400 bg-amber-500/10'
      case 'MISS': return 'text-orange-600 dark:text-orange-400 bg-orange-500/10'
      default: return 'text-zinc-600 dark:text-zinc-400 bg-zinc-500/10'
    }
  }
  
  // Determine timing color
  const getTimingColor = (ms?: number) => {
    if (!ms) return 'text-zinc-600 dark:text-zinc-400 bg-zinc-500/10'
    if (ms < 50) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
    if (ms < 200) return 'text-amber-600 dark:text-amber-400 bg-amber-500/10'
    return 'text-red-600 dark:text-red-400 bg-red-500/10'
  }

  return (
    <footer className={`border-t border-border/40 bg-muted/30 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Title */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <h3 className="text-sm font-semibold text-foreground tracking-tight">
            Render Performance Report
          </h3>
          {pageName && (
            <span className="text-xs text-muted-foreground">
              — {pageName}
            </span>
          )}
        </div>
        
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Component Type */}
          <div className="flex flex-col gap-1 p-3 rounded-lg bg-card/50 border border-border/40">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Component
            </span>
            <span className="text-sm font-semibold text-primary capitalize">
              {componentType}
            </span>
          </div>
          
          {/* API Response Time */}
          {timing && (
            <div className="flex flex-col gap-1 p-3 rounded-lg bg-card/50 border border-border/40">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                API Time
              </span>
              <span className={`text-sm font-semibold px-2 py-0.5 rounded-md w-fit ${getTimingColor(timing.durationMs)}`}>
                {timing.durationMs}ms
              </span>
            </div>
          )}
          
          {/* Cache Status */}
          {cache && (
            <div className="flex flex-col gap-1 p-3 rounded-lg bg-card/50 border border-border/40">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Cache
              </span>
              <span className={`text-sm font-semibold px-2 py-0.5 rounded-md w-fit ${getCacheColor(cache.hit)}`}>
                {cache.hit}
              </span>
            </div>
          )}
          
          {/* Revalidation */}
          {cache && (
            <div className="flex flex-col gap-1 p-3 rounded-lg bg-card/50 border border-border/40">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Revalidate
              </span>
              <span className="text-sm font-semibold text-foreground">
                {cache.revalidateSeconds}s
              </span>
            </div>
          )}
        </div>
        
        {/* Footer Note */}
        <p className="mt-4 text-xs text-muted-foreground text-center">
          <span className="font-medium text-foreground">React Server Component</span>
          {' '}• Pre-rendered with ISR • HeroUI v3 components
        </p>
      </div>
    </footer>
  )
}

