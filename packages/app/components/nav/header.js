import { View, Pressable, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon';
import { Theme } from 'app/design/theme';
import { useRouter } from "expo-router";
import { useColorScheme } from 'react-native';
import { FeedbackHaptics } from 'app/lib/util';
import { useCurrentUser } from 'app/context/user';
import { appStatic } from 'app/lib/app-static';
import { menuItemsFilter } from 'app/lib/util';
import MenuAdd from 'app/components/nav/menu-add'
import { menuItemsByName, appSetting } from 'app/lib/util'
import Search from 'app/ui/molecules/search';
import { Button } from 'app/design/controls';
import Link from 'app/ui/atoms/link'
import { isValidElement, useMemo, memo } from 'react';
import { parseUrl } from 'app/lib/util'

function SvgLogoNative() {
    const scheme = useColorScheme();
    const logo = scheme === 'dark' ? 'logo_nativedark' : 'logo_native';

    return <View className='w-32 h-10'>{appStatic(logo)}</View>;
};

function getRightHeader(items, currentUser, pagePath) {
    items = menuItemsFilter(items, currentUser);
    let addMenu = null;
    if (pagePath == '/home' && currentUser) {
        const menu_add_items = menuItemsByName('', appSetting('menu_items', 'menu_add'), currentUser);
        if (menu_add_items.length) {
            addMenu = <MenuAdd key='menu-add' buttonProps={{ variant: "secondary", rounded: 'rounded', startDecorator: "Plus", id: "m3" }} />;
        }
    }
    if (items?.length == 0 && !addMenu)
        return null;

    return <Row className='gap-x-2'>{
        items?.map((button) => {
            let btn = undefined;
            if (button.section || button.link == 'search')
                btn = <Search section={button.section} params={{ trigger: { size: 'base', variant: 'secondary' } }} />
            else {
                btn = <Button rounded title={button.title} variant='secondary' startDecorator={button.icon} size="base" />;
                btn = button.link ? <Link href={button.link} >{btn}</Link> : btn
            }

            return (
                <View className="w-11" key={`add-${button.icon}`} >{btn}</View>
            )
        })

    }
        {!!addMenu && <View>{addMenu}</View>}
    </Row>;
};

const Header = memo(({ backButtonPresented, header, pagePath, rightComponents }) => {

    const { currentUser } = useCurrentUser();

    const memoizedRightComponents = useMemo(() => {
        if (Array.isArray(rightComponents) && rightComponents.length && !isValidElement(rightComponents[0])) {
            return getRightHeader(rightComponents, currentUser, pagePath);
        }
        return rightComponents;
    }, [rightComponents, currentUser, pagePath]);

    const type = typeof header;
    let text = type === 'string' ? header : '';

    const routerExpo = useRouter();
    const { colors } = Theme();
    //let a = parseUrl(pagePath);
    let b = pagePath;
    if (pagePath){
        let a = parseUrl(pagePath);
        b = a.path
    }
    const isHome = b === '/home';
    if (isHome /*&& currentUser*/) {
        text = '';
    }

    text = text.replace('__notification__', '');

    return (
        <Row style={{ backgroundColor: colors.barsBackground }} className="w-full justify-between items-center h-12 px-3">
            <Row>
                {(isHome && currentUser) && <SvgLogoNative />}
                {backButtonPresented && (
                    <Pressable className="mr-3 rounded-full justify-center items-center" onPress={() => {
                        FeedbackHaptics('Medium');
                        routerExpo.back();
                    }}>
                        <Icon icon="ArrowLeft" width={24} height={24} color={colors.barsColor} />
                    </Pressable>
                )}
                {text && (
                    <View>
                        <Text className="font-bold text-neutral-800 dark:text-neutral-200 text-3xl tracking-tighter">
                            {text}
                        </Text>
                    </View>
                )}
            </Row>
            {type !== 'string' && <View className="flex-auto">{header}</View>}
            {memoizedRightComponents && <Row className="gap-x-2">{memoizedRightComponents}</Row>}
        </Row>
    );
});

export default Header;
