// PageFooter - Server Component wrapper for PerformanceFooter
// Fetches footer menu from UNA CMS and displays with performance report

import { PerformanceFooter, type PerformanceData, Separator } from '@neo/test-components'
import Link from 'next/link'
import { settings } from '../lib/settings'
import { fetchFooterMenu, type UNAMenuItem } from '../lib/una-api'
import { ThemeSwitcher } from './theme-switcher'
import { NavDropdowns } from './nav-dropdowns'
import { AuthStateSwitcher } from './auth-state-switcher'

// Static year - update annually if needed
const COPYRIGHT_YEAR = 2025

interface PageFooterProps {
  /** Performance data from the page's data fetching */
  data?: PerformanceData
  /** Override the settings-based show behavior */
  forceShow?: boolean
  /** Page name for the report header */
  pageName?: string
}

/**
 * Page Footer Component
 * Wraps PerformanceFooter with app settings integration and UNA CMS footer menu
 * 
 * @example
 * ```tsx
 * // In a page component
 * const result = await fetchUNAPage('about')
 * 
 * return (
 *   <>
 *     <PageContent />
 *     <PageFooter 
 *       pageName="About"
 *       data={{
 *         componentType: 'server',
 *         timing: { durationMs: result.timing.durationMs },
 *         cache: result.cache
 *       }} 
 *     />
 *   </>
 * )
 * ```
 */
export async function PageFooter({ data, forceShow, pageName }: PageFooterProps) {
  // Check settings to determine if we should show performance report
  const shouldShowReport = forceShow ?? settings.showPerformanceReport
  
  // Fetch footer menu from UNA CMS
  const footerMenuItems = await fetchFooterMenu()
  
  // Merge pageName into data if provided
  const enhancedData = data ? { ...data, pageName } : pageName ? { pageName, componentType: 'server' as const } : undefined

  return (
    <footer className="border-t border-border/40 mt-16">
      {/* Footer Menu from UNA CMS */}
      <FooterMenu items={footerMenuItems} />
      
      {/* Performance Report - controlled by settings */}
      {shouldShowReport && (
        <>
          <Separator className="opacity-40" />
          <PerformanceFooter 
            show={shouldShowReport}
            data={enhancedData}
          />
        </>
      )}
    </footer>
  )
}

/**
 * Footer Menu Component
 * Displays menu items from UNA CMS
 */
function FooterMenu({ items }: { items: UNAMenuItem[] }) {
  // Ensure items is always an array
  const menuItems = Array.isArray(items) ? items : []
  
  if (menuItems.length === 0) {
    // Fallback menu when UNA is not available
    return (
      <div className="bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col gap-6">
            {/* Top row: Brand, Navigation, Copyright */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              {/* Logo/Brand */}
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-foreground">NEO</span>
                <span className="text-sm text-muted-foreground">Testground</span>
              </div>
              
              {/* Fallback Links */}
              <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  About
                </Link>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Terms
                </Link>
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Privacy
                </Link>
                <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Documentation
                </Link>
              </nav>
              
              {/* Copyright */}
              <p className="text-xs text-muted-foreground">
                © {COPYRIGHT_YEAR} NEO Platform
              </p>
            </div>
            
            {/* Bottom row: Developer tools - Components, Docs, Theme, Auth State */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-border/40">
              <NavDropdowns />
              <ThemeSwitcher />
              <AuthStateSwitcher />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-6">
          {/* Top row: Brand, Navigation, Copyright */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Logo/Brand */}
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-foreground">NEO</span>
              <span className="text-sm text-muted-foreground">Testground</span>
            </div>
            
            {/* UNA CMS Footer Menu */}
            <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {menuItems.map((item, index) => (
                <FooterMenuItem key={item.name || index} item={item} />
              ))}
            </nav>
            
            {/* Copyright */}
            <p className="text-xs text-muted-foreground">
              © {COPYRIGHT_YEAR} NEO Platform
            </p>
          </div>
          
          {/* Bottom row: Developer tools - Components, Docs, Theme, Auth State */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-border/40">
            <NavDropdowns />
            <ThemeSwitcher />
            <AuthStateSwitcher />
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Individual footer menu item
 */
function FooterMenuItem({ item }: { item: UNAMenuItem }) {
  // Handle external links (starting with http)
  const isExternal = item.link?.startsWith('http')
  const href = item.link?.startsWith('/') ? item.link : `/${item.link}`
  
  if (isExternal) {
    return (
      <a 
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {item.title}
      </a>
    )
  }

  return (
    <Link 
      href={href}
      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      {item.title}
    </Link>
  )
}
