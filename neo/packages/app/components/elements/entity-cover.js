import { View } from 'app/design/view'
import Image from 'app/ui/atoms/image'
import { Text } from 'app/design/typography'
import { CoverMenuMeta, CoverMenu } from 'app/components/elements/covers/menu-cover'
import { appSetting, stripTags, LAYOUT_BREAKPOINTS } from 'app/lib/util'
import { BlockWrapper } from 'app/components/block-wrapper'
import { NeoButton } from 'app/design/controls/neo-button/neo-button'
import { useProfileImageUpload } from 'app/lib/image/use-profile-image-upload'
import { getCoverAspectClass } from 'app/lib/image/upload-settings'
import Loading from 'app/ui/atoms/loading'
import { useCurrentUser } from 'app/context/user'

/**
 * entity_cover with the page-header cover's upload: the same crop, camera
 * button and `useProfileImageUpload` flow. The header hides that button when
 * `cover.view_by_module` is `min` (projects), so the block is where the cover
 * is changed.
 *
 * UNA puts `allow_edit` on `cover_block`, not on this block. The edit-profile
 * action is the same check (`checkAllowedEdit`: owner account or moderator).
 */
function canChangeCover(data, currentUser) {
    if (!appSetting('cover', 'allow_edit')) return false
    if (data?.allow_edit) return true
    if (menuHasEditProfile(data?.actions_menu)) return true
    if (!currentUser) return false
    const profileId = data?.profile?.id
    if (profileId != null && String(currentUser.id) === String(profileId)) return true
    return !!(currentUser.moderator || currentUser.operator)
}

function menuHasEditProfile(menu) {
    const items = Array.isArray(menu?.items) ? menu.items : []
    for (const item of items) {
        const name = String(item?.name || '')
        const link = String(item?.link || item?.url || '')
        if (/^edit-.+-profile$/.test(name) || /edit-.+-profile/.test(link)) return true
        if (item?.list && menuHasEditProfile({ items: item.list })) return true
    }
    return false
}

export default function EntityCover({ data, block, blockWrapperProps, uri }) {
    const { currentUser } = useCurrentUser()
    const moduleName = data?.profile?.module || block?.module || ''
    const profile = data?.profile
    const allowEdit = canChangeCover(data, currentUser)
    const { imageUrl, isUploading, pick, modal } = useProfileImageUpload({
        kind: 'cover',
        profileId: data?.id || profile?.info?.id || 0,
        moduleName,
        storage: data?.cover?.storage || '',
        initialUrl: data?.cover?.src || '',
        isProfile: true,
    })

    const showPicture = moduleName === 'bx_persons'
        || (!!moduleName && !!appSetting('cover', 'show_pic_by_module', moduleName))
    const profileTitle = profile?.display_name || profile?.title || ''
    const showCover = !!imageUrl || allowEdit

    return (
        <BlockWrapper {...blockWrapperProps}>
            {showCover ? (
                <View className={`relative w-full overflow-hidden rounded-t-2xl bg-accent/50 ${getCoverAspectClass(moduleName, true)}`}>
                    {imageUrl ? (
                        <Image
                            alt={profileTitle}
                            view="cover"
                            sizes={LAYOUT_BREAKPOINTS.xl}
                            className="u-cover"
                            src={imageUrl}
                            priority
                        />
                    ) : null}
                    {imageUrl?.includes('data:') || isUploading ? (
                        <View className="absolute inset-0 h-full w-full opacity-60 bg-card justify-center items-center">
                            <Loading />
                        </View>
                    ) : null}
                    {allowEdit ? (
                        <View className="absolute top-3 right-3">
                            <NeoButton
                                image="Camera"
                                style="glass"
                                controlSize="regular"
                                borderShape="circle"
                                disabled={isUploading}
                                onPress={pick}
                            />
                        </View>
                    ) : null}
                </View>
            ) : null}
            <View className="p-4 w-full mx-auto bg-card h-min overflow-hidden rounded-2xl shadow-sm">
                {showPicture && !!data.image?.src ? (
                    <View className="w-28 h-28 overflow-hidden bg-background rounded-full">
                        <Image alt={profileTitle} className="rounded-full" view="cover" src={data.image.src} priority={!imageUrl} />
                    </View>
                ) : null}
                <View className="flex-row flex-wrap">
                    <View className="flex-auto">
                        <Text className="text-2xl pt-4 font-bold text-secondary-foreground">
                            {profileTitle}
                        </Text>
                    </View>
                </View>
                <View className="text-center flex-row py-3 gap-3 items-center">
                    <CoverMenuMeta {...data.meta_menu} />
                </View>
                <View className="w-full">
                    <CoverMenu isSplitMenu={false} size="sm" {...data.actions_menu} uri={uri} />
                </View>
                <Text numberOfLines={3} className="mt-2 text-base text-muted-foreground">{stripTags(data.description || data.space_desc)}</Text>
            </View>
            {modal}
        </BlockWrapper>
    )
}
