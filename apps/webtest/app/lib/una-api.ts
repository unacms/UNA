// UNA CMS API Client for webtest
// Server-side only - uses direct fetch to UNA backend

/**
 * UNA API Configuration
 */
const UNA_URL = process.env.UNA_URL || 'https://api.neo.so'
const UNA_API_KEY = process.env.UNA_API_KEY || ''

/**
 * UNA API Response Types
 */
export interface UNAPageResponse {
  status: number
  module?: string
  method?: string
  data?: UNAPageData
  hash?: string
}

export interface UNAPageData {
  id?: number
  title?: string
  name?: string
  description?: string
  uri?: string
  url?: string
  module?: string
  layout?: string
  elements?: Record<string, UNAElement[]>
  version?: string
  blocks?: Record<string, unknown>
  page_name?: string
  page_type?: string
}

export interface UNAElement {
  id?: number
  module?: string
  title?: string
  designbox_id?: number
  content?: UNAContent[]
  content_empty?: string
  source?: string
}

export interface UNAContent {
  id?: number
  type?: string
  data?: {
    title?: string
    content?: string
    [key: string]: unknown
  }
}

/**
 * Enhanced fetch result with timing and cache info
 */
export interface UNAFetchResult {
  response: UNAPageResponse | null
  timing: {
    fetchStarted: number
    fetchEnded: number
    durationMs: number
  }
  cache: {
    revalidateSeconds: number
    tags: string[]
    hit: 'MISS' | 'HIT' | 'STALE' | 'UNKNOWN'
  }
  meta: {
    url: string
    componentType: 'server'
  }
}

/**
 * Fetch page data from UNA CMS with timing and cache info
 * 
 * @param pagePath - The page path (e.g., "about", "home", "terms")
 * @returns Enhanced result with response, timing, and cache info
 */
export async function fetchUNAPage(pagePath: string): Promise<UNAFetchResult> {
  const endpoint = `/api.php?r=system/get_page_by_request/TemplServicePages&params[]=${pagePath}&lang=en`
  const fullUrl = UNA_URL + endpoint
  const revalidateSeconds = 60
  const cacheTags = [`una-page-${pagePath}`]
  
  const fetchStarted = performance.now()
  
  try {
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Authorization': UNA_API_KEY ? `Bearer ${UNA_API_KEY}` : '',
        'Accept': 'application/json',
      },
      // Next.js cache control - ISR with 60s revalidation
      next: { 
        revalidate: revalidateSeconds,
        tags: cacheTags
      }
    })

    const fetchEnded = performance.now()
    const durationMs = Math.round((fetchEnded - fetchStarted) * 100) / 100

    if (!response.ok) {
      console.error(`UNA API error: ${response.status} ${response.statusText}`)
      return {
        response: null,
        timing: { fetchStarted, fetchEnded, durationMs },
        cache: { 
          revalidateSeconds, 
          tags: cacheTags,
          hit: 'MISS'
        },
        meta: {
          url: fullUrl,
          componentType: 'server'
        }
      }
    }

    const data = await response.json() as UNAPageResponse
    
    // Detect cache hit based on response time
    // Cache hits are typically < 5ms, fresh fetches > 50ms
    const cacheHit = durationMs < 10 ? 'HIT' : durationMs < 50 ? 'STALE' : 'MISS'

    return {
      response: data,
      timing: { fetchStarted, fetchEnded, durationMs },
      cache: { 
        revalidateSeconds, 
        tags: cacheTags,
        hit: cacheHit
      },
      meta: {
        url: fullUrl,
        componentType: 'server'
      }
    }
  } catch (error) {
    const fetchEnded = performance.now()
    console.error('Failed to fetch UNA page:', error)
    return {
      response: null,
      timing: { 
        fetchStarted, 
        fetchEnded, 
        durationMs: Math.round((fetchEnded - fetchStarted) * 100) / 100 
      },
      cache: { 
        revalidateSeconds, 
        tags: cacheTags,
        hit: 'MISS'
      },
      meta: {
        url: fullUrl,
        componentType: 'server'
      }
    }
  }
}

/**
 * Extract all HTML content from UNA page elements
 */
export function extractPageContent(data: UNAPageData | undefined): string | null {
  if (!data?.elements) return null
  
  const contentParts: string[] = []
  
  for (const cellKey of Object.keys(data.elements)) {
    const elements = data.elements[cellKey]
    if (!Array.isArray(elements)) continue
    
    for (const element of elements) {
      if (!element.content) continue
      
      for (const contentItem of element.content) {
        if (contentItem.data?.content) {
          contentParts.push(contentItem.data.content)
        }
      }
    }
  }
  
  return contentParts.length > 0 ? contentParts.join('\n') : null
}

/**
 * Get specific element by title or module
 */
export function getElement(data: UNAPageData | undefined, identifier: string): UNAElement | null {
  if (!data?.elements) return null
  
  for (const cellKey of Object.keys(data.elements)) {
    const elements = data.elements[cellKey]
    if (!Array.isArray(elements)) continue
    
    const found = elements.find(el => 
      el.title?.toLowerCase().includes(identifier.toLowerCase()) ||
      el.module?.toLowerCase().includes(identifier.toLowerCase())
    )
    
    if (found) return found
  }
  
  return null
}

/**
 * Extract text content from UNA HTML
 */
export function extractTextFromHTML(html: string): string {
  if (!html) return ''
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Menu item from UNA CMS
 */
export interface UNAMenuItem {
  name: string
  title: string
  link: string
  icon?: string
  onclick?: string
  active?: boolean
  primary?: boolean
  submenu?: UNAMenuItem[]
}

/**
 * Menu response from UNA API
 * The API returns { data: UNAMenuItem[] } or an array directly
 */
export interface UNAMenuResponse {
  data?: UNAMenuItem[]
  status?: number
}

/**
 * Fetch menu from UNA CMS
 * 
 * @param menuObject - The menu object name (e.g., "sys_footer", "sys_homepage")
 * @returns Array of menu items
 */
export async function fetchUNAMenu(menuObject: string): Promise<UNAMenuItem[]> {
  const params = JSON.stringify({ object: menuObject, params: null })
  const endpoint = `/api.php?r=system/get_menu/TemplServices&params[]=${encodeURIComponent(params)}`
  const fullUrl = UNA_URL + endpoint
  
  try {
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Authorization': UNA_API_KEY ? `Bearer ${UNA_API_KEY}` : '',
        'Accept': 'application/json',
      },
      // Cache the menu for 5 minutes
      next: { 
        revalidate: 300,
        tags: [`una-menu-${menuObject}`]
      }
    })

    if (!response.ok) {
      console.error(`UNA Menu API error: ${response.status} ${response.statusText}`)
      return []
    }

    const responseData = await response.json()
    
    // Handle different response formats:
    // 1. { data: [...] } - wrapped response
    // 2. [...] - direct array
    // 3. { items: [...] } - items property
    // 4. { data: { items: [...] } } - nested items
    // 5. { menu_name: [...], menu_name2: [...] } - object with menu arrays
    // 6. null/undefined - no data
    
    if (Array.isArray(responseData)) {
      return responseData
    }
    
    if (responseData && typeof responseData === 'object') {
      // Check for data.items
      if (Array.isArray(responseData.data?.items)) {
        return responseData.data.items
      }
      // Check for data array
      if (Array.isArray(responseData.data)) {
        return responseData.data
      }
      // Check for items array
      if (Array.isArray(responseData.items)) {
        return responseData.items
      }
      // Check if the object keys are menu items (object with name/title/link)
      const keys = Object.keys(responseData)
      if (keys.length > 0) {
        // If values are arrays, concatenate them
        const allItems: UNAMenuItem[] = []
        for (const key of keys) {
          const value = responseData[key]
          if (Array.isArray(value)) {
            allItems.push(...value)
          } else if (value && typeof value === 'object' && 'title' in value) {
            // Individual menu item
            allItems.push(value as UNAMenuItem)
          }
        }
        if (allItems.length > 0) {
          return allItems
        }
      }
    }
    
    // Only log if we truly can't parse - include structure hint
    if (process.env.NODE_ENV === 'development') {
      console.warn('UNA Menu API returned unexpected format for', menuObject, '- keys:', 
        responseData ? Object.keys(responseData).slice(0, 5) : 'null')
    }
    return []
  } catch (error) {
    console.error('Failed to fetch UNA menu:', error)
    return []
  }
}

/**
 * Fetch footer menu from UNA CMS
 * Convenience function for the sys_footer menu
 */
export async function fetchFooterMenu(): Promise<UNAMenuItem[]> {
  return fetchUNAMenu('sys_footer')
}
