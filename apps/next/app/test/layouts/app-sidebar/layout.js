// App Sidebar Layout - Server Component with caching
// Authenticated app layout with icon-focused sidebar navigation

import { AppSidebar } from 'app/ui/molecules/tests/layouts/nav-components'

export default async function AppSidebarLayout({ children }) {
    return (
        <div className="min-h-screen bg-background flex flex-row">
            <AppSidebar expanded={true} />
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    )
}

// Static generation with caching
export const dynamic = 'force-static'
export const revalidate = 3600






