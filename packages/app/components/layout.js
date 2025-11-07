import { View } from 'app/design/view'
import BottomSheet from 'app/ui/molecules/bottomsheet_content';
import { appStatic } from 'app/lib/app-static'
import { useCurrentUser } from 'app/context/user'

export default function Layout(props) {
    const { currentUser } = useCurrentUser()
    if (props.data?.page_status == 503 || currentUser?.page_status == 503) {
        return appStatic('maintenance_mode');
    }

    return (
        <View className={`text-neutral-900 dark:text-neutral-50 w-full h-full flex-1 bg-background`}>
            {props.children}
            <BottomSheet />
        </View>
    );
}
