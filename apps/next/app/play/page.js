import { Suspense } from 'react'
import PlayPageLoader from 'app/customization/splash-mockups/play-page-loader'

export const metadata = {
    title: 'Play',
    description: 'Interactive mockups.',
}

export default function PlayRoutePage() {
    return (
        <Suspense fallback={null}>
            <PlayPageLoader />
        </Suspense>
    )
}
