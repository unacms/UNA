import { View } from 'app/design/view';
import { appStatic } from 'app/lib/app-static';
import Page from 'app/ui/molecules/page/page';

export default function PageLayout({ children, data, pageClasses }) {
    const { width, contentWidth, padding, gap } = pageClasses ?? {};

    return (
        <Page data={data}>
            {/* Page override slot: the static component `components_<uri>` renders above the
                UNA blocks when the registry has one (see appStatic). UNA shows nothing about it,
                and only layouts mapped to this component get it (page-layout/_map.js). */}
            {data?.uri ? appStatic('components_' + data?.uri, data) : null}
            <View className={width}>
                <View className={`${contentWidth} ${padding} ${gap} mx-auto`}>
                    {children}
                </View>
            </View>
            {appStatic('components_footer')}
        </Page>
    );
}
