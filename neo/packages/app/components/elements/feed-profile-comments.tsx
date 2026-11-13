import { useMemo, type ComponentType } from 'react'
import { useQuery } from '@tanstack/react-query'
import { View } from 'app/design/view'
import { appSetting } from 'app/lib/util'
import { fetcher } from 'app/lib/fetcher'
import Loading from 'app/ui/atoms/loading'
import { ProfileMiniCard } from 'app/ui/molecules/profile/profile-hover-card'
import { ActionMenu as ActionMenuJs } from 'app/components/elements/feed-item-parts'
import { CommentsBrowse as CommentsBrowseJs, CommentsForm as CommentsFormJs } from 'app/components/elements/comments-browse'

// JavaScript components: their inferred props mark every destructured prop as required.
const ActionMenu = ActionMenuJs as ComponentType<any>
const CommentsBrowse = CommentsBrowseJs as ComponentType<any>
const CommentsForm = CommentsFormJs as ComponentType<any>

type MenuItem = {
    name?: string;
    data?: { type?: string; system?: string; object_id?: number | string } | unknown[];
};

type FeedEntry = {
    author_data?: { id?: number | string; display_name?: string; url?: string } | null;
    menu_actions?: { items?: MenuItem[] } | null;
};

/** The comments object behind the entry's Comment action: UNA's comments system and object id. */
function commentsTarget(entry: FeedEntry): { module: string; objectId: number | string } | null {
    const item = entry.menu_actions?.items?.find((x) => x.name === 'item-comment')
    const data = item?.data
    if (!data || Array.isArray(data) || !data.system || data.object_id == null) return null
    return { module: data.system, objectId: data.object_id }
}

/**
 * Body of the modal a profile entry's Comment opens (see `isProfileFeedEntry`): a small card of
 * the profile, the entry's reactions and share, then the profile's comments and the composer.
 * The modal scrolls it as one column, so the comments list lays out in flow (`embedded`), and the
 * modal pads it, so the list and the composer are `flush`.
 */
export default function FeedProfileComments({ data }: Readonly<{ data: FeedEntry }>) {
    const target = commentsTarget(data)
    const request = target ? JSON.stringify({ module: target.module, object_id: target.objectId }) : ''

    const { data: comments, isLoading } = useQuery({
        queryKey: ['feed_profile_comments', request],
        queryFn: () =>
            fetcher(`/api.php?r=${appSetting('urls', 'cmts')}/&params[]=${request}`).then((res: any) => res?.data || null),
        enabled: !!request,
    })

    // The modal is the comments already: no Comment button inside it.
    const menu = useMemo(() => {
        const items = data.menu_actions?.items
        return items ? { ...data.menu_actions, items: items.filter((x) => x.name !== 'item-comment') } : null
    }, [data.menu_actions])

    return (
        <View className="w-full gap-y-4">
            <ProfileMiniCard profileData={data.author_data} />
            {!!menu?.items?.length && (
                <View className="flex-row items-center border-b border-border/60 pb-4">
                    <ActionMenu data={menu} />
                </View>
            )}
            {isLoading ? (
                <View className="py-6 items-center"><Loading /></View>
            ) : null}
            {/* One group, so an empty list adds no gap; the negative margin takes back the composer's
                own bottom padding, which the modal's padding already gives. */}
            <View className="w-full -mb-2 sm:-mb-4">
                {comments?.browse ? (
                    <CommentsBrowse
                        embedded
                        flush
                        browse={comments.browse}
                        module={target?.module}
                        requestUrl={comments.url}
                    />
                ) : null}
                {comments?.form ? (
                    <CommentsForm
                        flush
                        form={comments.form}
                        module={target?.module}
                        objectId={target?.objectId}
                        requestUrl={comments.url}
                    />
                ) : null}
            </View>
        </View>
    )
}
