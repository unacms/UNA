import { View } from 'app/design/view';
import Link from 'app/ui/atoms/link';
import Profile from 'app/ui/molecules/profile';
import { Dimensions, Platform } from 'react-native';

export default function ElementContacts({ profiles }) {
    let windowHeight = Dimensions.get('window').height

    let styles = {}
    if (Platform.OS === 'web') {
        styles = { maxHeight: windowHeight - 64 }
    }

    const handleLayout = (event) => {
        windowHeight = Dimensions.get('window').height
        if (Platform.OS === 'web') {
            styles = { maxHeight: windowHeight - 64 }
        }
    }

    return (
        <View style={styles} className="px-4 overflow-y-scroll overflow-hidden">
            <View className="flex-col space-y-2">
                {profiles.map((item, index) => (
                    <Link key={item.id} >
                        <Profile { ...item } displayType="unit" displaySize="sm" />
                    </Link>
                ))}
            </View>
        </View>
    )
}
