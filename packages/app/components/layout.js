import { View } from 'app/design/view'
import BottomSheet from 'app/ui/molecules/bottomsheet_content';
import { appStatic } from 'app/lib/app-static'
import { useCurrentUser } from 'app/context/user'
import { Platform } from 'react-native';

export default function Layout(props) {
    const { currentUser } = useCurrentUser()
    if (props.data?.page_status == 503 || currentUser?.page_status == 503) {
        return <>
            {appStatic('maintenance_mode')}
        </>
    }

    const nativeBackground = Platform.OS !== 'web' ? 'bg-screen-light dark:bg-screen-dark' : 'bg-bgrbody dark:bg-bgrbody-d';

    return (
        <View className={`text-neutral-900 dark:text-neutral-50 w-full h-full flex-1 ${nativeBackground}`}>
            {props.children}
            <BottomSheet />
        </View>
    );
}
