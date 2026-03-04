
import { memo, useState, useEffect, useCallback, useMemo } from 'react';
import { parseUrl } from 'app/lib/util'
import Messenger from 'app/components/elements/messenger/parts/common'
import { CreateConvoButton } from 'app/components/elements/messenger/parts/new-convo';
import { fetcher } from 'app/lib/fetcher';
import { Platform } from 'react-native'
import { useLayoutSettings } from 'app/context/layout-settings';
import { useIsDesktop, useWindowHeight } from 'app/context/measure';
import { BlockWrapper } from 'app/components/block-wrapper'
import { useSafeAreaInsets } from 'app/lib/hooks/router'

export default function MessengerEl(props) {
    const url = props.url;

    let defaultMenuName = 'inbox';
    let defaultConvoId = '';
    let b = parseUrl(url);
    const aUrl = b['path'].split('/');
    if (aUrl.length > 1)
        defaultMenuName = aUrl[1];
    if (aUrl.length > 2)
        defaultConvoId = aUrl[2];

    const { layoutName: layout } = useLayoutSettings();

    const menuDefaultList = useMemo(() => {
        return props.data.menu.items.filter(item => ['inbox', 'direct'].includes(item.name));
    }, [props]);

    const [menu, setMenu] = useState({ data: menuDefaultList, index: menuDefaultList.findIndex(item => item.name == defaultMenuName) });
    const [convos, setConvos] = useState(false);
    const [initedConvoId, setInitedConvoId] = useState(defaultConvoId);

    const windowWHeight = useWindowHeight();
    const fetchConvos = useCallback(async (term) => {
        if (menu) {
            const menuItem = menu?.data[menu?.index].name;
            if (menuItem) {
                if (term) {
                    let request_url = '/api.php?r=bx_messenger/search_lots/Services&params=' + JSON.stringify({ term: term });
                    const sResponse = await fetcher(request_url);
                    setConvos({ data: sResponse.data.lots ? sResponse.data.lots : [] });
                }
                else {
                    let request_url = '/api.php?r=bx_messenger/get_convos_list/Services&params[]=' + JSON.stringify({ group: menuItem, count: 0 });
                    const sResponse = await fetcher(request_url);
                    setConvos({ data: sResponse.data });
                }

            }
        }
    }, []);

    useEffect(() => {
        fetchConvos();
    }, [menu.index]);

    const onSave = useCallback((data) => {
        setConvos(prevConvos => ({
            ...prevConvos,
            data: [data.convo, ...prevConvos.data]
        }));
        setInitedConvoId(data.convo.id)
    }, []);

    const changeMenu = useCallback((index) => {
        setMenu(prevMenu => ({ ...prevMenu, index: index }));
        setInitedConvoId(convos.data[0].id)
    }, []);

    const addButtons = useMemo(() => {
        return [
            <CreateConvoButton key="a" onSave={onSave} variant='secondary' />
        ]
    }, []);

    const messengerContainer = (menu && convos) && <MessengerContainer
        fetchConvos={fetchConvos}
        convos={convos}
        data={props}
        selectedMenu={menu?.data[menu?.index].name}
        defaultConvoId={initedConvoId}
        windowWHeight={windowWHeight}
        layout={layout}
        onSave={onSave}
        addButtons={addButtons}
    />

    return messengerContainer;
}

const MessengerContainer = memo(({ convos, selectedMenu, url, data, windowWHeight, layout, fetchConvos, defaultConvoId, onSave, addButtons }) => {
    const isWeb = Platform.OS == 'web'
    const isDesktop = useIsDesktop();
    const layoutHeaderHeight = 64;
    const insets = useSafeAreaInsets();
    let height = useMemo(() => {
        let heightInit = windowWHeight;
        if (layout == 'ver') {
            heightInit = windowWHeight;
        }
        if (layout == 'hor') {
            heightInit = windowWHeight - layoutHeaderHeight;
        }
        if (layout == 'mixed') {
            heightInit = windowWHeight - layoutHeaderHeight;
        }
        if (!isDesktop) {
            heightInit = windowWHeight - layoutHeaderHeight
        }
        if (!isWeb) {
            heightInit = windowWHeight - insets.bottom - insets.top;
            if (Platform.OS == 'ios') {
                heightInit = windowWHeight - insets.bottom - insets.top - 64;
            }
        }
        return heightInit;
    }, [windowWHeight, layout])

    return (
        <BlockWrapper >
            <Messenger addButtons={addButtons} onSave={onSave} fetchConvos={fetchConvos} layoutHeight={height} {...data} url={url} selectedMenu={selectedMenu} convos={convos} defaultConvoId={defaultConvoId} />
        </BlockWrapper>
    );
});