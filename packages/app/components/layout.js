import { View } from 'app/design/view'
import BottomSheet from 'app/ui/molecules/bottomsheet_content';
import { appStatic } from 'app/lib/app-static'

export default function Layout(props) {
    if (props.data.page_status == 503) {
        return <>
            {appStatic('maintenance_mode')}
        </>
    }

    return (
        <View className=" bg-bgrbody dark:bg-bgrbody-d text-neutral-900 dark:text-neutral-50 w-full h-full flex-1">
            {props.children}
            <BottomSheet />
        </View>
    );
}
