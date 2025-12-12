import { View } from 'app/design/view'
import BottomSheet from 'app/ui/molecules/bottomsheet_content';
import { appStatic } from 'app/lib/app-static'
import { useCurrentUser } from 'app/context/user'
import { PageHeader } from 'app/ui/molecules/page_header';
export default function Layout({ data, children, layout }) {

    const { currentUser } = useCurrentUser()
    if (data?.page_status == 503 || currentUser?.page_status == 503) {
        return appStatic('maintenance_mode');
    }

    return (
        <View className={`text-neutral-900 dark:text-neutral-50 w-full h-full flex-1 bg-background`}>
            {layout.layoutName == 'home' && <PageHeader layoutName={layout.layoutName} pageData={data}/>}
            {children}
            <BottomSheet />
        </View>
    );
}
