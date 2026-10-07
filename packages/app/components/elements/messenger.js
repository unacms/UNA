
import { memo, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { parseUrl } from 'app/lib/util'
import Messenger from 'app/components/elements/messenger/parts/common'
import { CreateConvoButton } from 'app/components/elements/messenger/parts/new-convo'
import { fetcher } from 'app/lib/fetcher';
import { Platform } from 'react-native'
import { useIsDesktop } from 'app/context/measure';
import { BlockWrapper } from 'app/components/block-wrapper'

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

    const menuDefaultList = useMemo(() => {
        return props.data.menu.items.filter(item => ['inbox', 'direct'].includes(item.name));
    }, [props]);

    const [menu, setMenu] = useState(() => {
        const index = menuDefaultList.findIndex(item => item.name == defaultMenuName);
        return { data: menuDefaultList, index: index >= 0 ? index : 0 };
    });
    const [convos, setConvos] = useState(false);
    const [initedConvoId, setInitedConvoId] = useState(defaultConvoId);
    const menuRef = useRef(menu);
    menuRef.current = menu;
    const fetchRequestId = useRef(0);

    const fetchConvos = useCallback(async (term = '') => {
        const menuItem = menuRef.current?.data?.[menuRef.current?.index]?.name;
        if (!menuItem) return;

        const requestId = ++fetchRequestId.current;
        const request_url = term
            ? '/api.php?r=bx_messenger/search_lots/Services&params=' + JSON.stringify({ term })
            : '/api.php?r=bx_messenger/get_convos_list/Services&params[]=' + JSON.stringify({ group: menuItem, count: 0 });

        try {
            const sResponse = await fetcher(request_url);
            if (requestId !== fetchRequestId.current) return;
            setConvos({
                data: term
                    ? (sResponse.data?.lots ? sResponse.data.lots : [])
                    : sResponse.data,
                // Which inbox/direct group this list belongs to — consumers use
                // it to ignore stale lists right after a menu switch.
                menu: menuItem,
            });
        } catch {
            if (requestId !== fetchRequestId.current) return;
        }
    }, []);

    useEffect(() => {
        fetchConvos();
    }, [menu.index, fetchConvos]);

    const onSave = useCallback((data) => {
        setConvos(prevConvos => ({
            ...prevConvos,
            data: [data.convo, ...prevConvos.data]
        }));
        setInitedConvoId(data.convo.id)
    }, []);

    // Inbox / direct switch: drop any deep-linked conversation so the new
    // list drives selection (desktop auto-selects its first conversation).
    const onMenuChange = useCallback((index) => {
        setInitedConvoId('');
        setMenu(prev => (prev.index === index ? prev : { ...prev, index }));
    }, []);

    const addButtons = useMemo(() => {
        if (!props.data?.config?.permissions || props.data?.config?.permissions?.create_talk == 1){
        return [
            <CreateConvoButton key="a" onSave={onSave} style="glass" />
        ]
        }
        return null
    }, []);

    const messengerContainer = (menu && convos) && <MessengerContainer
        fetchConvos={fetchConvos}
        convos={convos}
        blockData={props.data}
        pageData={props.pageData}
        block={props.block}
        alreadyWrapped={Boolean(props.blockWrapperProps)}
        selectedMenu={menu?.data[menu?.index]?.name}
        menuItems={menu.data}
        menuIndex={menu.index}
        onMenuChange={onMenuChange}
        defaultConvoId={initedConvoId}
        onSave={onSave}
        addButtons={addButtons}
    />

    return messengerContainer;
}

const MessengerContainer = memo(({ convos, selectedMenu, blockData, pageData, fetchConvos, defaultConvoId, onSave, addButtons, menuItems, menuIndex, onMenuChange, block, alreadyWrapped }) => {
    const isWeb = Platform.OS == 'web'
    const isDesktop = useIsDesktop();

    const messenger = (
        <Messenger
            pageData={pageData}
            data={blockData}
            addButtons={addButtons}
            onSave={onSave}
            fetchConvos={fetchConvos}
            selectedMenu={selectedMenu}
            menuItems={menuItems}
            menuIndex={menuIndex}
            onMenuChange={onMenuChange}
            convos={convos}
            defaultConvoId={defaultConvoId}
        />
    );

    // Cell already wraps. Native uses the injected page header only.
    // Web always goes through BlockWrapper so desktop ↔ mobile does not
    // remount; contentOnly skips UNA chrome on small screens.
    // Inbox/direct live in the conversation list — drop block.menu so
    // BlockWrapper does not force a header (or duplicate those tabs)
    // when UNA has the title designbox off.
    if (alreadyWrapped || !isWeb) {
        return messenger;
    }

    const blockForWrapper = block?.menu ? { ...block, menu: undefined } : block;

    return (
        <BlockWrapper
            block={blockForWrapper}
            config={block?.config_api}
            fullWidth
            fill={isDesktop}
            contentOnly={!isDesktop}
            wrapperClassses={isDesktop ? 'h-full min-h-0' : undefined}
        >
            {messenger}
        </BlockWrapper>
    );
});
