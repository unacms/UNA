import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { ButtonMenuActionDefault, legacyToNeoButtonProps } from 'app/design/controls'
import { appSetting } from 'app/lib/util';
import { useState } from 'react';
import { fetcher } from 'app/lib/fetcher';
import { components } from 'app/components/registry'
import { useBottomSheetData } from 'app/context/bottomsheet'
import { Platform } from 'react-native'

export default function ElementConnections(props) {
     const DropdownMenuItem = components['menu-item']['dropdown'];
    const [elementData, setElementData] = useState(props);
    const { setBottomSheetData } = useBottomSheetData();
    const settings = appSetting('social_actions', 'connection');
    const icons = elementData.o && settings[elementData.o]?.icons != undefined ? settings[elementData.o].icons : {
        add: 'UserCheck',
        remove: 'UserX'
    };

    const oButtonProps = {
        variant: elementData?.primary ? 'primary' : elementData.params?.button_variant,
        size: elementData.params?.button_size,
        rounded: elementData.params?.button_rounded,
        fullWidth: elementData.params?.button_full_width,
        showTitleFromSize: elementData.params?.button_show_title_from_size,
        hide_icon: elementData.params?.hide_icon,
        padding: elementData.params?.padding,
        ring: elementData.params?.button_ring
    };

    const handleClick = async (item, event) => {
        if (Platform.OS !== 'web') {
            setBottomSheetData(false);
        }
        const params = JSON.stringify({ o: elementData.o, iid: elementData.iid, cid: elementData.cid, a: item.link })
        const r = await fetcher(`/api.php?r=system/perform/TemplServiceConnections&params[]=${params}`);
        if (!r.data.message) {
            setElementData(prevData => ({
                ...prevData,
                ...r.data
            }))
        }
    };

    if (props.mode == 'dropdown-menu') {
        return <>
                    <DropdownMenuItem
                        item={{
                            title: elementData.title,
                            icon: icons[elementData.a]
                        }}
                        icon={icons[elementData.a]}
                        handleSelect={(event) => {handleClick({link: elementData.a}, event) }}
                    /></>;
    }

    if (!Array.isArray(elementData.a) || elementData.a.length === 1) {
        return <ButtonMenuActionDefault title={elementData.title} onPress={(event) => handleClick({link: elementData.a})} {...oButtonProps} />
    }

    return (
        <DropdownMenu
            onSelect={handleClick}
            items={elementData.a.map(
                (item, index) => {
                    return (
                        {
                            id: 'menu-' + index,
                            link: item,
                            title: elementData.titles[index],
                            icon: icons[item]
                        }
                    )
                }
            )}
            buttonProps={{ ...legacyToNeoButtonProps({ ...oButtonProps, title: elementData.title, startDecorator: icons['add'] }) }}
        />
    )
}