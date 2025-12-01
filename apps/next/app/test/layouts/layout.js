// Isolated layout for test layouts - server component with caching
// This layout is separate from the main app layout for experimental purposes

export default async function TestLayoutsLayout({ children }) {
    return (
        <div className="min-h-screen bg-background">
            {children}
        </div>
    )
}

// Enable static generation for layout tests
export const dynamic = 'force-static'
export const revalidate = 3600 // Revalidate every hour





