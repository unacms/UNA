import { Platform } from 'react-native';
import { 
    Root as NmRoot,
    List as NmList,
    Item as NmItem,
    Trigger as NmTrigger,
    Content as NmContent,
    Link as NmLink,
    Indicator as NmIndicator,
    Viewport as NmViewport
} from '@radix-ui/react-navigation-menu';
import { isEmoji } from 'app/lib/util';
import { Text } from 'app/design/typography';
import { View, Row } from 'app/design/view';
import Link from 'app/ui/atoms/link';
import { Icon } from 'app/ui/atoms/icon';

import 'app/styles/navigation.css';

export default function DropdownMore(oProps) {
    const bWeb = Platform.OS === 'web';

    const aDmItems = oProps.items.map((oItem, iIndex) => {
        let sIcon = undefined;
        if(!!oItem?.icon) {
            if(isEmoji(oItem.icon))
                sIcon = (
                    <Text className={oItem?.class_item_icon}>{oItem.icon}</Text>
                );
            else
                sIcon = (
                    <Icon className={oItem?.class_item_icon} icon={oItem.icon} size="lg" />
                );
        }

        return (
            <NmLink key={`link-${iIndex}`} asChild>
                <Link href={oItem.link}>
                    <Row className="flex flex-row items-center space-x-2 select-none rounded-[4px] px-3 py-2 text-[15px] font-medium leading-none no-underline outline-none hover:bg-bgrbutton-hover dark:hover:bg-bgrbutton-darkhover font-medium">
                        {!!sIcon && <View className="w-8 h-8">{sIcon}</View>}
                        {!!oItem?.title && <View {...(bWeb ? {className: 'font-medium leading-[1.2] ' + oItem?.class_item_title} : {})}><Text className="text-neutral-700 dark:text-neutral-200 dark:hover:text-white">{oItem.title}</Text></View>}
                    </Row>    
                </Link>
            </NmLink>
        );
    });

    return (
        <NmRoot className="relative z-[1] flex justify-center">
            <NmList className="center m-0 flex list-none">
                <NmItem>
                    <NmTrigger className="group flex items-center justify-between font-medium leading-none outline-none select-none">{oProps.children}</NmTrigger>
                    <NmContent className="NavigationMenuContent absolute top-0 left-0 w-full sm:w-auto">
                        <View className="grid list-none m-0 gap-x-[10px] p-[22px] sm:w-[320px] sm:grid-flow-col sm:grid-rows-2">{aDmItems}</View>
                    </NmContent>
                </NmItem>
                <NmIndicator className="data-[state=visible]:animate-fadeIn data-[state=hidden]:animate-fadeOut top-full z-[1] flex h-[10px] items-end justify-center overflow-hidden transition-[width,transform_250ms_ease]">
                    <View className="relative top-[70%] h-[10px] w-[10px] rotate-[45deg] rounded-tl-[2px] bg-bgrmodal dark:bg-bgrmodal-dark" />
                </NmIndicator>
            </NmList>
            <View className="perspective-[2000px] absolute top-full left-0 flex w-full justify-center">
                <NmViewport className="NavigationMenuViewport data-[state=open]:animate-scaleIn data-[state=closed]:animate-scaleOut relative mt-[10px] h-[var(--radix-navigation-menu-viewport-height)] w-full origin-[top_center] overflow-hidden rounded-[6px] bg-bgrmodal dark:bg-bgrmodal-dark transition-[width,_height] duration-300 sm:w-[var(--radix-navigation-menu-viewport-width)]" />
            </View>
        </NmRoot>
    );
}