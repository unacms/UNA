import { View } from 'app/design/view'
import { appStatic } from 'app/lib/app-static'
import { useCurrentUser } from 'app/context/user'
import { PageHeader } from 'app/ui/molecules/page_header';

export default function Layout({ data, children, layout }) {

    const { currentUser } = useCurrentUser()
    if (data?.page_status == 503 || currentUser?.page_status == 503) {
        return appStatic('maintenance_mode');
    }

    return (
        <View className={`text-popover-foreground  w-full h-full flex-1 bg-background`}>
            <PageHeader layoutName={layout.layoutName} pageData={data}/>
            {children}
        </View>
    );
}
