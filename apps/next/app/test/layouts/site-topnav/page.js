// Site Top Nav Demo Page - Server Component
import { HeroSection, FeatureGrid } from 'app/ui/molecules/tests/layouts/demo-content'

export default async function SiteTopNavPage() {
    return (
        <>
            <HeroSection />
            <FeatureGrid />
        </>
    )
}

// Static generation
export const dynamic = 'force-static'
export const revalidate = 3600




