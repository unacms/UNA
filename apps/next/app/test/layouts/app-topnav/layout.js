// App Top Nav Layout - Server Component with caching
// Authenticated app layout with compact top navigation

import { AppTopNav } from 'app/ui/molecules/tests/layouts/nav-components'

export default async function AppTopNavLayout({ children }) {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <AppTopNav />
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    )
}

// Static generation with caching
export const dynamic = 'force-static'
export const revalidate = 3600




