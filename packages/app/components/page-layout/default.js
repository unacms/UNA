import { View } from 'app/design/view';
import { appStatic } from 'app/lib/app-static';
import Page from 'app/ui/molecules/page';

export default function PageLayout({ children, data, pageClasses }) {
    const { width, contentWidth, padding, gap } = pageClasses ?? {};

    return (
        <Page data={data}>
            <View className={width}>
                <View className={`${contentWidth} ${padding} ${gap} mx-auto`}>
                    {children}
                </View>
            </View>
            {appStatic('components_footer')}
        </Page>
    );
}
