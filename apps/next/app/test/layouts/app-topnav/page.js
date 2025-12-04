// App Top Nav Demo Page - Server Component
import { FeedContent } from 'app/ui/molecules/tests/layouts/demo-content'

export default async function AppTopNavPage() {
    return <FeedContent />
}

// Static generation
export const dynamic = 'force-static'
export const revalidate = 3600








