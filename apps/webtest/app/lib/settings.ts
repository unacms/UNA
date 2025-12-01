// Webtest App Settings
// Configure app-level behavior and features

/**
 * Settings type definition
 */
export interface WebtestSettings {
  /** Show performance/render report in footer */
  showPerformanceReport: boolean
  
  /** App metadata */
  app: {
    title: string
    description: string
  }
  
  /** Debug options */
  debug: {
    /** Show verbose logging */
    verbose: boolean
  }
}

/**
 * Default settings for webtest app
 * Can be overridden via environment variables
 */
export const settings: WebtestSettings = {
  showPerformanceReport: process.env.NEXT_PUBLIC_SHOW_PERFORMANCE_REPORT !== 'false',
  
  app: {
    title: 'NEO Testground',
    description: 'Experimental UI patterns and server component testing',
  },
  
  debug: {
    verbose: process.env.NODE_ENV === 'development',
  },
}

/**
 * Get a specific setting value
 */
export function getSetting<K extends keyof WebtestSettings>(key: K): WebtestSettings[K] {
  return settings[key]
}

