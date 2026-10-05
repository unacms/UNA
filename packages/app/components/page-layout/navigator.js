import { DataByName } from 'app/components/block'
import { Conductor } from 'app/ui/molecules/sections/conductor';
import { useMemo } from 'react';
import { useLayoutSettings } from 'app/context/layout-settings';
import { useEffect } from 'react';
import { appSetting, clearNotif, cloneObject } from 'app/lib/util';
import { useCurrentUser } from 'app/context/user'


function removeBlockFromData(dataOrig, blockName) {
    if (!blockName || !dataOrig?.elements) return dataOrig;
    const data = cloneObject(dataOrig);
    const name = blockName.toString();
    for (const cell of Object.values(data.elements)) {
        if (!cell || typeof cell !== 'object') continue;
        for (const key in cell) {
            if (cell[key]?.source === name) delete cell[key];
        }
    }
    return data;
}

function getMenuAndData(props, layout) {
    let menu = Object.assign({}, props.data.menu);
    if (!menu.items) menu.items = [];
    let data = props.data;
    const categoriesConfig = props.blocks?.categories;
    const categories = DataByName(props.data, categoriesConfig);
    if (categoriesConfig && categories && layout === 'hor') {
        // 1. build menu items from categories
        const menuItems = categories?.content[0]?.data?.map((obj, index) => ({
            id: index + menu.items.length,
            name: obj.url,
            title: obj.name + ' (' + obj.num + ')',
            link: obj.url.replace('/', ''),
            icon: obj.icon,
            ident: 1,
            hideInTop: false,
        })) ?? [];
        menu.items = [...menu.items, ...menuItems];
        // 2. remove block from data
        data = removeBlockFromData(props.data, categoriesConfig.name);
    }
    return { menu, data };
}

export default function PageLayout(props) {
    const { currentUser, setCurrentUser } = useCurrentUser();
    const { layoutName: layout } = useLayoutSettings();
    const { menu: menuData, data: pageData } = useMemo(
        () => getMenuAndData(props, layout),
        [props.data, props.blocks, layout]
    );

    // Copy, never push into `props.data.menu.items`: that array is the page data's own.
    const menu = useMemo(() => {
        const uri = props.data.uri;
        const items = [...(menuData?.items || [])];
        if (items.some(item => item.name === uri)) return { ...menuData, items };
        // A submenu titled after this page stands for it (UNA shows the title as
        // that page's entry), e.g. sys_ntfs_submenu "Notifications" with only an
        // Invitations item: show the page first as its own tab. Any other page
        // missing from the menu stays a hidden route.
        const sameTitle = (a, b) => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();
        if (sameTitle(menuData?.title, props.data.title) || sameTitle(menuData?.title, props.data.name)) {
            return { ...menuData, items: [{ id: -1, name: uri, title: menuData.title, link: props.data.url }, ...items] };
        }
        return { ...menuData, items: [...items, { id: -1, name: uri, title: '', link: props.data.url, hideInTop: true }] };
    }, [menuData, props.data.uri, props.data.url, props.data.title, props.data.name]);

    useEffect(() => {
        if (appSetting('notifications', 'url') === '/' + props?.data?.url) {
            clearNotif();
            setCurrentUser({
                notifications: 0,
                notificationsTs: Date.now(),
                counters: {
                    ...(currentUser?.counters || {}),
                    bx_notifications: 0,
                },
            });
        }

    }, [])

    return (
        <Conductor
            layoutName={props.layoutName}
            isHideDefaultHeader={false}
            menu={menu}
            ts={props.data.ts}
            data={pageData}
            blocks={props.blocks}
            useSectionAsMenu={false}
        />
    )
}