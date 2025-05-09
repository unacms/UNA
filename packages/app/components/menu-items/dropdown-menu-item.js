import { Pressable, View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Icon } from 'app/ui/atoms/icon';
import { isEmoji, appSetting } from 'app/lib/util';
import Link from 'app/ui/atoms/link'
const menuSettings = appSetting('theme', 'dropdown_menu');

const getIcon = (oItem, iconSize = 20) => {
    if (!oItem?.icon) return null;

    const className = oItem?.class_item_icon;

    if (isEmoji(oItem.icon)) {
        return <Text className={className}>{oItem.icon}</Text>;
    } else {
        return (
            <Icon
                className={className}
                icon={oItem.icon}
                size={oItem?.icon_size || iconSize}
            />
        );
    }
};

export default function DropdownMenuItem({ item, index, link, handleSelect, classes, counter, handleCounter, mode }) {
    const key = item.id ?? index;
    const iconSize = menuSettings.icon_size || 16;

    if (typeof item.title !== 'string') {
        return item.noAction ? <Pressable onPress={(event) => handleSelect(event, item)}>{item.title}</Pressable> : item.title;
    }

    if (item.type === 'separator') {
        return <View key={key}>{item.title}</View>;
    }

    const icon = getIcon(item, iconSize);

    const Wrapper = handleSelect ? Pressable : View;
    const Content = (
        <Wrapper
            className={menuSettings[classes?.item || 'item_ver']}
            key={key}
            onPress={(event) => handleSelect(event, item)}
        >
            <Row className={'justify-between ' + menuSettings.item_cnt}>
                <Row className="">
                {!!icon && <View className={menuSettings.item_icon}>{icon}</View>}
                {!!item?.title &&
                    (typeof item.title === 'string' ? (
                        <Text className={menuSettings[`item_text`]}>{item.title}</Text>
                    ) : (
                        item.title
                    ))
                }
                </Row>
                {!!counter && (
                    <Pressable className='mr-1'  onPress={(event) => handleCounter(event, item)}>
                        <Text className={menuSettings.item_text}>{counter}</Text>
                    </Pressable>
                )}
            </Row>
        </Wrapper>
    );

    return (

        link ? (
            <Link href={link}>
                {Content}
            </Link>
        ) : (
            Content
        )


    );
}
