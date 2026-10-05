import { View, Row } from 'app/design/view'
import Image from 'app/ui/atoms/image'
import {
    appSetting,
    LAYOUT_BREAKPOINTS,
    isNativeTabsEnabled,
    FeedbackHaptics,
} from 'app/lib/util'
import Profile from 'app/ui/molecules/profile/profile'
import { NeoButton } from 'app/design/controls/neo-button/neo-button'
import { fetcher } from 'app/lib/fetcher'
import { useProfileImageUpload } from 'app/lib/image/use-profile-image-upload'
import { useCurrentUser } from 'app/context/user'
import Loading from 'app/ui/atoms/loading'
import { Platform } from 'react-native'
import { getWindowSafeAreaInsets, useRouter } from 'app/lib/hooks/router'
import { navigateBackInTab } from 'app/lib/navigation/tab-history'
import { useCoverBackTabKey, useShowCoverBackButton } from 'app/components/elements/use-cover-back'
import { useTranslation } from 'react-i18next'

// Matches `top-3` overlay spacing on the full cover.
const COVER_CONTROL_TOP = 10

function getNativeTabsTopInset() {
    return isNativeTabsEnabled() ? (getWindowSafeAreaInsets().top || 0) : 0
}

export function nativeTabsTopPadStyle() {
    const top = getNativeTabsTopInset()
    return top > 0 ? { paddingTop: top } : undefined
}

function BackButton() {
    const { t } = useTranslation()
    const router = useRouter()
    const { currentUser } = useCurrentUser()
    const currentTab = useCoverBackTabKey()
    const showBack = useShowCoverBackButton()

    const handleBackPress = () => {
        FeedbackHaptics('Medium')
        if (Platform.OS === 'web') {
            if (typeof window !== 'undefined' && window.history.length > 2) {
                window.history.back()
            } else if (router?.replace) {
                router.replace('/')
            }
            return
        }
        navigateBackInTab(router, currentTab, currentUser)
    }

    if (!showBack) {
        return null
    }

    return (
        <View className="self-center">
            <NeoButton
                image="ArrowLeft"
                style="glass"
                controlSize="regular"
                borderShape="circle"
                accessibilityLabel={t('Back')}
                onPress={handleBackPress}
            />
        </View>
    )
}

export function CoverBackButton() {
    return <BackButton />
}

export function getCoverBackButton() {
    return <CoverBackButton />
}

export function CoverImage({
    mode,
    profileData,
    coverData,
    allowEdit,
    allowSwitch,
    title,
    profileDisplaySize,
    is_person,
    suppressCoverBackButton = false,
    priority = false,
    animated = false,
}) {
    const { imageUrl, isUploading, pick, modal } = useProfileImageUpload({
        kind: mode,
        profileId: profileData?.info?.id || profileData?.id || 0,
        moduleName: profileData?.module || '',
        storage: coverData?.storage || '',
        initialUrl: mode == 'cover' ? coverData?.src : profileData?.url_avatar,
    })

    const handleSwitch = async (id) => {
        await fetcher(
            '/api.php?r=system/switch_profile/TemplServiceAccount&params[]=' +
            id,
        )
        location.reload()
    }

    if (mode == 'cover') {
        const isCover = !!imageUrl
        const overlayTop = COVER_CONTROL_TOP + getNativeTabsTopInset()
        return (
            <>
                <View
                    className={`bg-accent/50 lg:rounded-xl mx-auto gap-2 flex-1 overflow-hidden w-full
                    ${isCover ? `${appSetting('cover', 'aspect_ratio')}` : 'pb-32'}`}
                >
                    {isCover ? (
                        <Image
                            alt={title}
                            view="cover"
                            sizes={LAYOUT_BREAKPOINTS.xl}
                            className="u-cover"
                            src={imageUrl}
                            priority={priority}
                        />
                    ) : null}
                    {imageUrl?.includes('data:') || isUploading ? (
                        <View className="absolute inset-0 h-full w-full opacity-60 bg-card justify-center items-center">
                            <Loading />
                        </View>
                    ) : null}
                    <Row
                        className="justify-end gap-2 absolute right-3"
                        style={{ top: overlayTop }}
                    >
                        {allowSwitch ? (
                            <NeoButton
                                image="RefreshCw"
                                style="glass"
                                controlSize="regular"
                                borderShape="circle"
                                onPress={() => handleSwitch(allowSwitch)}
                            />
                        ) : null}
                        {allowEdit ? (
                            <NeoButton
                                image="Camera"
                                style="glass"
                                controlSize="regular"
                                borderShape="circle"
                                disabled={isUploading}
                                onPress={pick}
                            />
                        ) : null}
                    </Row>
                    <View
                        className="absolute lg:hidden left-3 z-50"
                        style={{ top: overlayTop }}
                    >
                        {!suppressCoverBackButton ? getCoverBackButton() : null}
                    </View>
                </View>
                {modal}
            </>
        )
    }

    if (mode == 'picture') {
        return (
            <>
                <View className="relative inline-flex">
                    <Profile
                        {...profileData}
                        url_avatar={imageUrl}
                        displayType="unit_wo_info"
                        displaySize={profileDisplaySize}
                        priority={priority}
                        animated={!!animated}
                    />
                    {isUploading ? (
                        <View className="absolute inset-0 rounded-full bg-card/80 items-center justify-center">
                            <Loading />
                        </View>
                    ) : null}
                    {allowEdit ? (
                        <View className="absolute bottom-0.5 lg:bottom-1 right-0.5 lg:right-1 rounded-full bg-card p-1">
                            <View className="lg:hidden">
                                <NeoButton
                                    image="Camera"
                                    style="glass"
                                    controlSize="mini"
                                    borderShape="circle"
                                    disabled={isUploading}
                                    onPress={pick}
                                />
                            </View>
                            <View className="hidden lg:flex">
                                <NeoButton
                                    image="Camera"
                                    style="glass"
                                    controlSize="small"
                                    borderShape="circle"
                                    disabled={isUploading}
                                    onPress={pick}
                                />
                            </View>
                        </View>
                    ) : null}
                </View>
                {modal}
            </>
        )
    }

    return null
}
