// Site Top Nav Layout - Server Component with caching
// Unauthenticated layout with horizontal navigation bar

import { SiteTopNav } from 'app/ui/molecules/tests/layouts/nav-components'

export default async function SiteTopNavLayout({ children }) {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <SiteTopNav isAuthenticated={false} />
            <main className="flex-1">
                {children}
            </main>
            <footer className="border-t border-border py-8 px-4">
                <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
                    © 2024 NEO. All rights reserved.
                </div>
            </footer>
        </div>
    )
}

// Static generation with caching
export const dynamic = 'force-static'
export const revalidate = 3600




