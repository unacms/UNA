import { Text} from 'app/design/typography'
import { View } from 'app/design/view'
import { useCurrentUser } from 'app/context/user'
import { stripTags } from 'app/lib/util';
import { BlockWrapper } from 'app/components/block-wrapper'

const HIDDEN_IDS = ['sys-account-unconfirmed-email', 'sys-switch-profile-context', 'sys-account-profile-system'];

// Fixed bar at the bottom of the page (layout.web.js) with the viewer's informers.
// As a page block (`data` holds the informers, see page-layout/profile.js) it renders inline.
export default function ElementInformer({ data, blockWrapperProps }) {
    const { currentUser } = useCurrentUser();
    const inline = Array.isArray(data);

    const items = ((inline ? data : currentUser?.informer) || []).filter((item) => item?.msg && !HIDDEN_IDS.includes(item.id));
    if (!items.length)
        return null

    const list = items.map((item, index) => (
        <View
            key={item.id || 'informer' + index}
            className={`${inline ? 'w-full' : 'max-w-screen-lg w-full mx-auto'} bg-accent p-3 rounded-lg items-center`}
        >
            <Text className="text-accent-foreground text-center">{stripTags(item.msg)}</Text>
        </View>
    ));

    if (inline) {
        return (
            <BlockWrapper {...blockWrapperProps}>
                <View className="w-full gap-2">{list}</View>
            </BlockWrapper>
        );
    }

    return (
        <View className="fixed inset-x-0 bottom-16 lg:bottom-1 z-50 px-2 gap-2 pb-2" pointerEvents="box-none">
            {list}
        </View>
    );
}
