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
                    <Row className="ListItemLink flex flex-row items-center space-x-2">
                        {!!sIcon && <View className="w-8 h-8">{sIcon}</View>}
                        {!!oItem?.title && <View className=""><Text {...(bWeb ? {className: 'ListItemHeading ' + oItem?.class_item_title} : {})}>{oItem.title}</Text></View>}
                    </Row>    
                </Link>
            </NmLink>
        );
    });

    return (
        <NmRoot className="NavigationMenuRoot">
            <NmList className="NavigationMenuList">
                <NmItem>
                    <NmTrigger className="NavigationMenuTrigger">{oProps.children}</NmTrigger>
                    <NmContent className="NavigationMenuContent">
                        <View className="List two">{aDmItems}</View>
                    </NmContent>
                </NmItem>
                <NmIndicator className="NavigationMenuIndicator">
                    <View className="Arrow" />
                </NmIndicator>
            </NmList>
            <View className="ViewportPosition">
                <NmViewport className="NavigationMenuViewport" />
            </View>
        </NmRoot>
    );
}