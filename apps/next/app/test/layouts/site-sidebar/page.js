// Site Sidebar Demo Page - Server Component
import { DashboardContent } from 'app/ui/molecules/tests/layouts/demo-content'

export default async function SiteSidebarPage() {
    return <DashboardContent />
}

// Static generation
export const dynamic = 'force-static'
export const revalidate = 3600




