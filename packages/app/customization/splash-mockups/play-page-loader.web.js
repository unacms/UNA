'use client'

import dynamic from 'next/dynamic'
import { View } from 'app/design/view'

const PlayPageFallback = () => (
    <View className="min-h-screen w-full h-full bg-background" />
)

const DynamicPlayPage = dynamic(
    () => import('app/customization/splash-mockups/play-page'),
    { ssr: false, loading: PlayPageFallback }
)

export default function PlayPageLoader() {
    return <DynamicPlayPage />
}
