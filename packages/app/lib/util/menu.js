import { fetcher } from 'app/lib/fetcher';
import { UNA_URL } from 'app/config';
import { appSetting } from './settings';
import { strToObj } from './object';
import { getURI } from './url';

const getNameFromSetting = (setting) => {
    if (typeof setting === 'string') {
        return setting;
    } else if (setting && typeof setting === 'object' && setting.name) {
        return setting.name;
    }
    return null;
};

export async function getDataForMenu(menu, callback) {
    const data = await fetcher(
        '/api.php?r=system/get_menu/TemplServices&params[]={"object":"' + menu?.object + '","params":' + JSON.stringify(menu?.params) + '}'
    )
    callback?.(data.data)
    return data.data
}

export function findIconFromRemote(s) {
    if (!s || /^[A-Z][^\s]*$/.test(s))
        return s;
    const data = appSetting('menu_items', 'iconset');
    for (let word of s.replace(/\bcol-\S*\b/g, '').trim().split(/\s+/)) {

        if (data[word]) {
            return data[word];
        }
    }

    return s;
}

export function menuItemsByNameNew(name, menu, currentUser, url = '') {
    return menuItemsByName(name, menu?.items, currentUser, url, menu?.config)
}

export function menuItemsByName(name, items, currentUser, url = '', config = null) {
    if (!items)
        return [];

    const menuSettings = getMenuSettings(name, config);//appSetting('menu_items', name)
    let menuSettingNames = []

    if (menuSettings) {
        if (menuSettings.items) {
            if (typeof menuSettings.items[0] === 'string') {
                items = items.filter((item) => (item.hideInTop || (!!item.name && menuSettings.items.includes(item.name)) || (!!item.link && menuSettings.items.includes(getURI(item.link)))));
            }
            else {
                menuSettingNames = menuSettings.items.map(getNameFromSetting);
                items = items.filter((item) => (item.hideInTop || (!!item.name && menuSettingNames.includes(item.name)) || (!!item.link && menuSettingNames.includes(getURI(item.link)))));

                menuSettingNames = [];
                items = items.map(item1 => {
                    const item2 = menuSettings.items.find(item2 => item2.name === item1.name);
                    return item2 ? { ...item1, ...item2 } : item1;
                });
            }
        }
        else {
            if (menuSettings.items) {
                menuSettingNames = menuSettings.map(getNameFromSetting);
                items = items.filter((item) => (item.hideInTop || (!!item.name && menuSettingNames.includes(item.name)) || (!!item.link && menuSettingNames.includes(getURI(item.link)))));
            }
        }
        if (menuSettingNames) {
            items.forEach(item => {
                if (menuSettingNames.includes(item.name)) {
                    let matchedSettings = menuSettings.filter(item2 => item.name === item2.name);

                    if (matchedSettings.length > 0) {

                        item.settings = matchedSettings[0].settings;
                    }
                }
            });
        }

        return menuItemsFilter(items, currentUser);
    }
    if (!items)
        items = [{ link: url, title: '' }];

    return menuItemsFilter(items, currentUser);
}

export function menuItemsFilter(items, currentUser) {
    if (!items)
        return items;
    if (!currentUser) {
        items = items.filter(item => item.nonlogged !== false && item.nonoperator !== false);
    }
    else {
        items = items.filter(item => item.logged !== false);
        if (!currentUser.operator) {
            items = items.filter(item => item.nonoperator !== false);
        }

        items = items.filter(item => {
            return !item.membership_level || (item.membership_level & Math.pow(2, currentUser.membership)) == Math.pow(2, currentUser.membership)
        });
    }

    items = items.map(item => {
        if (item.link === '{studio}') {
            return { ...item, link: UNA_URL + '/studio/launcher.php' };
        }
        if (item.link === '{profile}') {
            return { ...item, link: currentUser?.url };
        }
        if (item?.link && item?.link?.includes("{profile_url_postfix}")) { // SHOULD BE IMPROVED by url_postfix

            return { ...item, link: item.link.replace("{profile_url_postfix}", currentUser?.url.replace('/view-persons-profile/', '')) };
        }
        return item;
    });
    return items;
}

export function getMenuSettings(object, config, menu) {
    if (!appSetting('layout', 'user_remote_config'))
        return appSetting('menu_items', object);

    let a = {}
    if (appSetting('layout', 'user_remote_config') && config)
        a = strToObj(config);

    if (a && !a.name && menu?.title)
        a.name = menu.title;

    return a
}
