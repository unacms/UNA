// Site Sidebar Layout - Server Component with caching
// Authenticated layout with vertical sidebar navigation

import { SiteSidebar } from 'app/ui/molecules/tests/layouts/nav-components'

export default async function SiteSidebarLayout({ children }) {
    return (
        <div className="min-h-screen bg-background flex flex-row">
            <SiteSidebar />
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    )
}

// Static generation with caching
export const dynamic = 'force-static'
export const revalidate = 3600





