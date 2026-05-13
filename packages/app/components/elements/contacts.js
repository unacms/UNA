import { View } from 'app/design/view';
import Link from 'app/ui/atoms/link';
import Profile from 'app/ui/molecules/profile';
import { BlockWrapper } from 'app/components/block-wrapper'

export default function ElementContacts({ data, blockWrapperProps }) {
    return <BlockWrapper {...blockWrapperProps}>
        <View className="px-4 overflow-y-scroll overflow-hidden">
            <View className="space-y-2">
                {data?.length && data.map((item) => (
                    <Link key={item.id} href={item.url}>
                        <Profile {...item} displayType="unit" displaySize="sm" />
                    </Link>
                ))}
            </View>
        </View>
    </BlockWrapper>
}
