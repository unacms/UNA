import { lazy, Suspense } from 'react'
import { View } from 'app/design/view'

const PlayPageLoader = lazy(() =>
    import('app/customization/splash-mockups/play-page-loader')
)

export default function PageLayoutPlay() {
    return (
        <View className="flex-1 w-full h-full min-h-screen bg-background">
            <Suspense fallback={null}>
                <PlayPageLoader />
            </Suspense>
        </View>
    )
}
