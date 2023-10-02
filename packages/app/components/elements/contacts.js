import { View } from 'app/design/view';
import Link from 'app/ui/atoms/link';
import Profile from 'app/ui/molecules/profile';

export default function ElementContacts({ data }) {
    return <View className="px-4 overflow-y-scroll overflow-hidden">
                <View className="flex-col space-y-2">
                    { data?.length && data.map((item) => (
                        <Link key={item.id} href={item.url}>
                            <Profile { ...item } displayType="unit" displaySize="sm" />
                        </Link>
                    )) }
                </View>
           </View>
}
