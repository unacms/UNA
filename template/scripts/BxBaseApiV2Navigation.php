<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * API v2: the apps' sidebar, as the site's own sidebar menu sets it up (`GET /navigation`). The
 * desktop app draws its sidebar from it (neo/desktop/src/shell/sidebar-navigation.tsx), and
 * NEO's web sidebar is meant to. How a site owner edits it, menu by menu, is in docs/api-v2.md,
 * "Navigation: how the apps' sidebar is built and edited in Studio".
 *
 * The menu is Apps Sidebar (`sys_apps_sidebar`, Studio > Navigation > Apps Sidebar,
 * BxBaseMenuAppsSidebar), a menu of the apps' own: the site draws it nowhere and API v1 (NEO) is
 * not asked for it, so nothing here changes what they show. Each of its top-level items that is
 * active in the apps (`active_api`) and visible to the viewer is a group, in Studio's order:
 * Apps Menu (`apps-menu`, the submenu `sys_apps_menu`, a menu of the apps' own too: Home,
 * Explore, Profile, Messages, Notifications, Connections, with their counters), Public Menu
 * (`public-menu`, the submenu `sys_site_in_panel`, which is the site's main menu `sys_site`,
 * read as the site has it) and Member Memberships (`member-memberships`,
 * `sys_profile_memberships`, the contexts the viewer belongs to, by module: Your friends, Your
 * groups, Your spaces ...); Member Menu (`member-menu`, the site's `sys_profile_stats`) and
 * Member Following (`member-followings`, `sys_profile_followings`, the contexts the viewer
 * follows) are there off, for an owner to turn on. Member Avatar (`member-avatar`) is the
 * viewer's profile. A top-level item of another submenu is a group of that menu's items, and
 * one without a submenu but with a link is a group of that one item.
 *
 * The items are read through the menus' own classes (BxBaseMenu::getMenuItemsForApps), so the
 * site's checks decide: "Active in apps", "Visible for", the custom visibility, what a menu class
 * adds, and the markers ({member_id}, {member_url}). "Hidden on" hides an item on a platform's
 * screens (target()'s caller, hiddenOnPlatform()).
 *
 * Where an item opens in the apps is its `target`, decided in one place, target():
 * 1. the endpoint classes' apiV2NavigationTarget($aItem, $aPage) hook, the class of the item's
 *    module first (BxDolApiV2Router::hooks): a module (a third-party one too) says where its own
 *    items open; this class answers for the site's own pages (Home, Explore, Connections);
 * 2. a profile's or a context's page: that profile;
 * 3. a page of a module with an API (its `apiV2ModuleInfo` tag): the module's list (its home,
 *    popular or new page), one's own entries, the ones one joined or follows;
 * 4. any other page the viewer may see that has blocks the API feeds: that page, for
 *    GET /layout/resolve.
 * An item none of these places has `target` null: an app that can't open its `link` leaves it out.
 *
 * What the apps add of their own is not here: the desktop app's network switcher, search,
 * Settings and its Tasks' My timers (sidebar-navigation.tsx says so too).
 *
 * What stays the same until Studio changes something (a submenu's items, their titles, links
 * and targets) is kept in the content cache per the menu's own cache mode (`per_acl`: per
 * membership level; `per_user`: per profile; `off`: not kept), and rebuilt when a menu item, a
 * menu, a page or a page block changes (a digest of those tables is in the key), when Studio
 * clears the menu's caches, or after CACHE_TTL (_menuItemsCached). Counters are read each time
 * (kept COUNTERS_TTL for a per-profile menu), the followed contexts each time.
 *
 * docs/api-v2.md, "Navigation: how the apps' sidebar is built and edited in Studio", is the
 * site owner's and module author's side of this; neo/desktop/README.md, "Sidebar", the
 * desktop app's.
 */
class BxBaseApiV2Navigation
{
    /** The menu the apps' sidebar is: the apps' own, not the site's Site Panel (`sys_site_panel`). */
    const MENU = 'sys_apps_sidebar';

    /** The menu the apps' footer links are (`footer`). */
    const FOOTER_MENU = 'sys_footer';

    /** How many followed contexts of each module at most. */
    const CONTEXTS_MAX = 10;

    /** Seconds the built menus are kept at most (a language string changed in Studio shows after this). */
    const CACHE_TTL = 3600;

    /**
     * Seconds the counters of a menu kept per profile (`per_user`, the Apps Menu) are kept: the
     * site keeps them in that menu's HTML until the profile adds content; the apps' badges of
     * unread notifications, messages and friend requests come from GET /sync, not from here.
     */
    const COUNTERS_TTL = 60;

    /** Bumped when the shape of what is kept changes. */
    const CACHE_VERSION = 4;

    /** Group kinds. */
    const KIND_ITEMS = 'items';
    const KIND_PROFILE = 'profile';
    const KIND_FOLLOWINGS = 'followings';

    /** Target kinds. */
    const TARGET_SECTION = 'section';
    const TARGET_PROFILE = 'profile';
    const TARGET_CONTEXT = 'context';
    const TARGET_PAGE = 'page';

    /**
     * The views of a module's section, by the module's page (its config's name of it): the list
     * (null), its popular and new sorts, one's own entries, the ones one joined, follows or
     * keeps as favourites.
     */
    const MODULE_VIEWS = [
        'URL_HOME' => null,
        'URL_POPULAR' => 'popular',
        'URL_NEW' => 'new',
        'URI_AUTHOR_ENTRIES' => 'mine',
        'URI_JOINED_ENTRIES' => 'joined',
        'URI_FOLLOWED_ENTRIES' => 'followed',
        'URI_FAVORITES_LIST' => 'favorites',
    ];

    /** Pages of one's own, by their profile module's config name: the view of Connections each is. */
    const CONNECTIONS_VIEWS = [
        'URI_VIEW_FRIENDS' => 'friends',
        'URI_VIEW_FRIEND_REQUESTS' => 'requests',
        'URI_VIEW_SUBSCRIPTIONS' => 'following',
    ];

    protected static $_aTags = null;
    protected static $_aResolved = [];

    protected $_sPlatform = 'web';
    protected $_oReq = null;

    #[BxDolApiV2Operation(
        method: 'GET', path: '/navigation', id: 'getNavigation', tag: 'navigation',
        summary: 'The apps\' sidebar, as the site\'s Apps Sidebar menu sets it up',
        description: 'The viewer\'s sidebar from the site\'s Apps Sidebar menu (`sys_apps_sidebar`, Studio > Navigation), a menu of the apps\' own that the site itself does not draw: a group for each of its top-level items active in the apps (Studio\'s "Active in apps") that the viewer may see ("Visible for", custom visibility), in Studio\'s order. A group of items (`items`) is a submenu\'s items for the apps: one\'s main places with their counters (Apps Menu: Home, Explore, Profile, Messages, Notifications, Connections), the site\'s main menu (Public Menu), the site\'s member menu (Member Menu, off as installed); `profile` is the viewer (Member Avatar); `followings` is the contexts the viewer belongs to (Member Memberships: the groups, events, spaces ... one is a member of, one\'s friends; Your groups, Your friends ...), or follows (Member Following, off in the apps as installed), an item per module with its `contexts`. An item hidden on the platform\'s screens ("Hidden on": `desktop` for the desktop app, `mobile-app` for `native`, all three web screens for `web`) is left out, and `hidden_on` lists the screens the others are hidden on. Each item says where it opens in the apps (`target`): a section of the app (`section`: `home`, `explore`, `connections` or the tag of a module\'s paths, as `posts`), a profile, a context, or a page the client draws with GET /layout/resolve (`path`); null when it is none of these. Guests get the groups visible to guests. `footer` is the site\'s footer links (`sys_footer`, Studio > Navigation > Footer) for the apps\' footer bar: pages, links and the copyright text, without the site\'s footer tools. How each part is edited in Studio is in docs/api-v2.md, "Navigation".',
        params: [
            'platform' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/Platform']],
        ],
        responses: [200 => 'Navigation', 422 => null],
    )]
    public function getNavigation(BxDolApiV2Request $oReq)
    {
        $sPlatform = (string)$oReq->query('platform', 'web');
        if (!in_array($sPlatform, BxBaseApiV2Layout::PLATFORMS, true))
            throw BxDolApiV2Problem::validation([['field' => 'platform', 'code' => 'invalid_value', 'message' => 'One of ' . implode(', ', BxBaseApiV2Layout::PLATFORMS)]]);

        $this->_sPlatform = $sPlatform;
        $this->_oReq = $oReq;

        $aGroups = $this->_groups();

        // what is read each time: counters, the viewer and the followed contexts
        $aResult = [];
        foreach ($aGroups as $aGroup) {
            if ($aGroup['kind'] === self::KIND_PROFILE) {
                $aProfile = $oReq->viewerId() ? BxBaseApiV2Profiles::summaries([(int)$oReq->viewerId()])[(int)$oReq->viewerId()] ?? null : null;
                if (!$aProfile)
                    continue;
                $aGroup['profile'] = $aProfile;
            }
            else if ($aGroup['kind'] === self::KIND_FOLLOWINGS) {
                $aGroup['items'] = $this->_followings($aGroup['menu']);
                if (!$aGroup['items'])
                    continue;
            }
            else {
                $aGroup['items'] = $this->_withCountersCached($aGroup['items'], (string)$aGroup['menu']);
                if (!$aGroup['items'])
                    continue;
            }
            $aResult[] = $aGroup;
        }

        return [
            'menu' => self::MENU,
            'platform' => $sPlatform,
            'groups' => $aResult,
            'footer' => $this->_footer(),
        ];
    }

    /**
     * The footer's links for the apps (`footer`): the site's footer menu (`sys_footer`, Studio >
     * Navigation > Footer), its items active in the apps that the viewer may see and that are not
     * hidden on the platform, in Studio's order, read through its own class (BxBaseMenuFooter), as
     * the sidebar's menus are. A link to a page of the site has a `target` as a sidebar item has
     * (About, Terms, Privacy: the page, drawn with GET /layout/resolve), another link only its
     * `link`, and an item that is text on the site (the copyright notice, "(c) 2026 Site. All
     * rights reserved.", or a line the owner adds) is an item with that text as its `title` and
     * neither. The footer's tools (language, template, colour scheme, sounds, the Powered by
     * badge: BxBaseMenuFooter::TOOLS) are the site's and left out: the apps have their own. Kept
     * as the menu's other items are (_menuItemsCached, per membership level).
     */
    protected function _footer()
    {
        $oMenu = BxDolMenu::getObjectInstance(self::FOOTER_MENU);
        if (!$oMenu || !method_exists($oMenu, 'getMenuItemsForApps'))
            return [];

        $aMenu = BxDolMenuQuery::getMenuObject(self::FOOTER_MENU);
        $sSet = is_array($aMenu) ? (string)$aMenu['set_name'] : self::FOOTER_MENU;
        $aItems = $this->_menuItemsCached($oMenu, self::FOOTER_MENU, $sSet, function ($oMenu, $sMenu, $sSet) {
            $aTools = defined(get_class($oMenu) . '::TOOLS') ? $oMenu::TOOLS : [];
            $aRows = [];
            foreach ($oMenu->getMenuItemsForApps(false) as $a) {
                if (in_array($a['name'] ?? '', $aTools, true))
                    continue;
                // text on the site: its words are the item's title, and it opens nothing
                if (!empty($a['bx_if:text']['condition'])) {
                    $sText = trim(strip_tags((string)($a['bx_if:text']['content']['text'] ?? '')));
                    if ($sText === '' || stripos((string)($a['link_code'] ?? ''), 'javascript:') === 0)
                        continue;
                    $a['title'] = $sText;
                    $a['link'] = '';
                    $a['link_code'] = '';
                }
                $aRows[] = $a;
            }
            return $this->_items($aRows, $sMenu, $sSet, false, true);
        });

        foreach ($aItems as $i => $a)
            unset($aItems[$i]['_addon'], $aItems[$i]['_menu']);
        return array_values($aItems);
    }

    /**
     * A submenu's NavigationItems (without counters) as kept between requests: per the menu's
     * own cache mode (Studio > Navigation > Menus), as its HTML is kept on the site: one for
     * everyone (`global`, `guest` for guests), per membership level (`per_acl`), per profile
     * (`per_user`), or read each time (`off`); for this language (the content cache's key has it)
     * and platform. The key starts `menu_<object>`, so Studio's clearing of the menu's caches
     * clears it too, and it has a digest of the menus and pages, so any other change makes a new
     * one.
     */
    protected function _menuItemsCached($oMenu, $sMenu, $sSet, $fBuild = null)
    {
        $sKey = getParam('sys_content_cache_enable') ? $this->_cacheKey($sMenu) : '';
        if ($sKey !== '') {
            $m = bx_content_cache_get($sKey, self::CACHE_TTL);
            if (is_array($m))
                return $m;
        }

        $aItems = $fBuild ? $fBuild($oMenu, $sMenu, $sSet) : $this->_items($oMenu->getMenuItemsForApps(true), $sMenu, $sSet, true);

        if ($sKey !== '')
            bx_content_cache_set($sKey, $aItems, self::CACHE_TTL);
        return $aItems;
    }

    /**
     * The cache key of a menu's items for the viewer, '' when the menu is not kept (BxBaseMenu::getCode's modes).
     */
    protected function _cacheKey($sMenu)
    {
        $aMenu = BxDolMenuQuery::getMenuObject($sMenu);
        $sMode = is_array($aMenu) ? (string)($aMenu['cache'] ?? 'off') : 'off';
        $iViewer = (int)$this->_oReq->viewerId();
        switch ($sMode) {
            case 'global':
                $sPart = '';
                break;
            case 'guest':
                if ($iViewer)
                    return '';
                $sPart = '';
                break;
            case 'per_user':
                $sPart = '_p' . $iViewer;
                break;
            case 'per_acl':
                $aAcl = BxDolAcl::getInstance()->getMemberMembershipInfo($iViewer);
                $sPart = '_acl' . (int)($aAcl['id'] ?? 0) . '_a' . (isAdmin() ? 1 : 0);
                break;
            default:
                return '';
        }
        return 'menu_' . $sMenu . '_apiv2_v' . self::CACHE_VERSION . $sPart . '_' . $this->_sPlatform . '_' . $this->_digest();
    }

    /**
     * A digest of what the menus and pages are (every menu item and menu, page and page block,
     * and the enabled modules), in one query: any change in Studio, or straight in the
     * database, makes a new one.
     */
    protected function _digest()
    {
        static $sDigest = null;
        if ($sDigest !== null)
            return $sDigest;

        $s = BxDolDb::getInstance()->getOne("SELECT CONCAT_WS(':',
            (SELECT CONCAT(COUNT(*), '-', COALESCE(SUM(CRC32(CONCAT_WS('|', `id`, `parent_id`, `set_name`, `module`, `name`, `title`, `link`, `onclick`, `icon`, `addon`, `markers`, `submenu_object`, `visible_for_levels`, `visibility_custom`, `hidden_on`, `config_api`, `active`, `active_api`, `order`))), 0)) FROM `sys_menu_items`),
            (SELECT CONCAT(COUNT(*), '-', COALESCE(SUM(CRC32(CONCAT_WS('|', `id`, `object`, `set_name`, `module`, `active`, `cache`, `override_class_name`, `config_api`))), 0)) FROM `sys_objects_menu`),
            (SELECT CONCAT(COUNT(*), '-', COALESCE(SUM(CRC32(CONCAT_WS('|', `id`, `object`, `uri`, `module`, `layout_id`, `visible_for_levels`))), 0)) FROM `sys_objects_page`),
            (SELECT CONCAT(COUNT(*), '-', COALESCE(SUM(CRC32(CONCAT_WS('|', `id`, `object`, `cell_id`, `module`, `type`, `content`, `visible_for_levels`, `hidden_on`, `active_api`, `order`))), 0)) FROM `sys_pages_blocks` WHERE `active_api` = 1)
        )");

        return $sDigest = substr(md5((string)$s . '|' . getParam('sys_revision')), 0, 16);
    }

    /**
     * The groups of the Apps Sidebar for the viewer, without counters and followed contexts. The
     * sidebar's own items are read each time (one query; its menu is not kept); its submenus'
     * items as kept (_menuItemsCached).
     */
    protected function _groups()
    {
        $oPanel = BxDolMenu::getObjectInstance(self::MENU);
        if (!$oPanel || !method_exists($oPanel, 'getMenuItemsForApps'))
            return [];

        $aGroups = [];
        foreach ($oPanel->getMenuItemsForApps() as $aTop) {
            if (static::hiddenOnPlatform($aTop['hidden_on'] ?? false, $this->_sPlatform))
                continue;

            $sId = self::MENU . ':' . $aTop['module'] . ':' . $aTop['name'];
            $aGroup = [
                'id' => $sId,
                'name' => (string)$aTop['name'],
                'kind' => self::KIND_ITEMS,
                'title' => BxDolApiV2Map::text((string)$aTop['title']),
                'menu' => null,
                'profile' => null,
                'items' => [],
            ];

            // the viewer's picture and name
            if ($aTop['name'] === 'member-avatar') {
                $aGroup['kind'] = self::KIND_PROFILE;
                $aGroups[] = $aGroup;
                continue;
            }

            $sSubmenu = (string)($aTop['submenu'] ?? '');
            $oSubmenu = $sSubmenu !== '' ? BxDolMenu::getObjectInstance($sSubmenu) : false;
            if ($sSubmenu !== '' && (!$oSubmenu || !method_exists($oSubmenu, 'getMenuItemsForApps')))
                continue;

            if ($oSubmenu) {
                $aGroup['menu'] = $sSubmenu;
                if ($oSubmenu instanceof BxBaseMenuProfileFollowings) {
                    $aGroup['kind'] = self::KIND_FOLLOWINGS;
                    $aGroups[] = $aGroup;
                    continue;
                }
                $aMenu = BxDolMenuQuery::getMenuObject($sSubmenu);
                $aGroup['items'] = $this->_menuItemsCached($oSubmenu, $sSubmenu, is_array($aMenu) ? (string)$aMenu['set_name'] : $sSubmenu);
            }
            else {
                // a top-level item of its own: a link
                $aGroup['items'] = $this->_items([$aTop], self::MENU, self::MENU, true);
            }

            if ($aGroup['items'])
                $aGroups[] = $aGroup;
        }

        return $aGroups;
    }

    /**
     * NavigationItems of a menu's items for the apps: each item visible on the platform with a
     * title, and a link, a target or tabs; its submenu as `tabs` (one level).
     * @param string $sMenu the menu object they are from (its markers fill the counters)
     * @param string $sSet the set they are in (their id is set:module:name)
     * @param bool $bTabs read each item's submenu as its tabs
     * @param bool $bKeepAll keep an item with no link and nowhere to open (a followings heading)
     */
    protected function _items(array $aItems, $sMenu, $sSet, $bTabs, $bKeepAll = false)
    {
        $aResult = [];
        foreach ($aItems as $a) {
            if (!is_array($a) || static::hiddenOnPlatform($a['hidden_on'] ?? false, $this->_sPlatform))
                continue;

            $sTitle = BxDolApiV2Map::text((string)($a['title'] ?? ''));
            if ($sTitle === '')
                continue;

            $sModule = (string)($a['module'] ?? '');
            $sName = (string)($a['name'] ?? '');
            $sLink = static::link((string)($a['link'] ?? ''), $sModule, $sName);

            $aItem = [
                'id' => $sSet . ':' . $sModule . ':' . $sName,
                'set' => $sSet,
                'module' => $sModule,
                'name' => $sName,
                'title' => $sTitle,
                'icon' => static::icon((string)($a['icon_code'] ?? '')),
                'link' => $sLink,
                'counter' => null,
                'target' => null,
                'tabs' => [],
                'contexts' => [],
                'more_contexts' => false,
                'all_target' => null,
                'config' => static::config($a['config'] ?? ($a['config_api'] ?? '')),
                'hidden_on' => is_array($a['hidden_on'] ?? null) ? array_values($a['hidden_on']) : [],
                // read for the viewer each time (_withCounters), never sent
                '_addon' => (string)($a['addon_call'] ?? ''),
                '_menu' => $sMenu,
            ];
            $aItem['target'] = $this->target($aItem, (string)($a['link_code'] ?? ''));

            $sSubmenu = (string)($a['submenu'] ?? '');
            if ($bTabs && $sSubmenu !== '' && ($oSubmenu = BxDolMenu::getObjectInstance($sSubmenu)) && method_exists($oSubmenu, 'getMenuItemsForApps') && !($oSubmenu instanceof BxBaseMenuProfileFollowings)) {
                $aMenu = BxDolMenuQuery::getMenuObject($sSubmenu);
                $aItem['tabs'] = $this->_items($oSubmenu->getMenuItemsForApps(false), $sSubmenu, is_array($aMenu) ? (string)$aMenu['set_name'] : $sSubmenu, false);
            }

            if (!$bKeepAll && $aItem['link'] === null && $aItem['target'] === null && !$aItem['tabs'])
                continue;

            $aResult[] = $aItem;
        }
        return $aResult;
    }

    /**
     * The items with their counters (_withCounters), kept for COUNTERS_TTL when the menu is kept per
     * profile on the site (`per_user`), read each time otherwise.
     */
    protected function _withCountersCached(array $aItems, $sMenu)
    {
        $aMenu = $sMenu !== '' ? BxDolMenuQuery::getMenuObject($sMenu) : false;
        $iViewer = (int)$this->_oReq->viewerId();
        $sKey = $iViewer && is_array($aMenu) && ($aMenu['cache'] ?? '') === 'per_user' && getParam('sys_content_cache_enable')
            ? 'menu_' . $sMenu . '_apiv2_v' . self::CACHE_VERSION . '_counters_p' . $iViewer . '_' . $this->_sPlatform . '_' . $this->_digest() : '';

        $aCounters = $sKey !== '' ? bx_content_cache_get($sKey, self::COUNTERS_TTL) : null;
        if (is_array($aCounters)) {
            foreach ($aItems as $i => $a) {
                $aItems[$i]['counter'] = $aCounters[$a['id']] ?? null;
                unset($aItems[$i]['_addon'], $aItems[$i]['_menu']);
                if (!empty($a['tabs']))
                    $aItems[$i]['tabs'] = $this->_withCounters($a['tabs']);
            }
            return $aItems;
        }

        $aItems = $this->_withCounters($aItems);
        if ($sKey !== '')
            bx_content_cache_set($sKey, array_column($aItems, 'counter', 'id'), self::COUNTERS_TTL);
        return $aItems;
    }

    /**
     * The items with their counters read for the viewer (the menu's own service call, with its
     * markers), and without what was kept only for that.
     */
    protected function _withCounters(array $aItems)
    {
        foreach ($aItems as $i => $a) {
            if (($a['_addon'] ?? '') !== '' && ($oMenu = BxDolMenu::getObjectInstance($a['_menu'])))
                $aItems[$i]['counter'] = static::counter(BxDolService::callSerialized($a['_addon'], $oMenu->getMarkers()));
            unset($aItems[$i]['_addon'], $aItems[$i]['_menu']);
            if (!empty($a['tabs']))
                $aItems[$i]['tabs'] = $this->_withCounters($a['tabs']);
        }
        return $aItems;
    }

    /**
     * The contexts' items: one per module of Member Memberships or Member Following (the menu's own
     * items for the apps, through its class: BxBaseMenuProfileMemberships lists the contexts the
     * viewer belongs to, BxBaseMenuProfileFollowings the ones the viewer follows), each with their profiles
     * there, newest first, read at once.
     */
    protected function _followings($sMenu)
    {
        $oMenu = $sMenu ? BxDolMenu::getObjectInstance($sMenu) : false;
        if (!$oMenu || !($oMenu instanceof BxBaseMenuProfileFollowings) || !$this->_oReq->viewerId())
            return [];

        $aRows = $oMenu->getMenuItemsForApps(false, self::CONTEXTS_MAX);
        $aIds = [];
        foreach ($aRows as $a)
            foreach ($a['contexts'] ?? [] as $iId)
                $aIds[$iId] = $iId;
        $aProfiles = $aIds ? $this->_contexts(array_values($aIds)) : [];

        $aMenu = BxDolMenuQuery::getMenuObject($sMenu);
        $sSet = is_array($aMenu) ? (string)$aMenu['set_name'] : $sMenu;

        $aResult = [];
        foreach ($this->_items($aRows, $sMenu, $sSet, false, true) as $aItem) {
            unset($aItem['_addon'], $aItem['_menu']);
            foreach ($aRows as $a)
                if ($a['name'] === $aItem['name'] && $a['module'] === $aItem['module']) {
                    foreach ($a['contexts'] ?? [] as $iId)
                        if (!empty($aProfiles[$iId]))
                            $aItem['contexts'][] = $aProfiles[$iId];
                    $aItem['more_contexts'] = !empty($a['contexts_more']);
                    $aItem['all_target'] = $this->_allTarget($oMenu, $aItem);
                    break;
                }
            if ($aItem['contexts'])
                $aResult[] = $aItem;
        }
        return $aResult;
    }

    /**
     * Where all of a Member Memberships module's contexts open (All your groups): the module's
     * section at the ones one joined (`joined`), or for friends the module's section at
     * `friends` (Persons: People > Friends), Connections at Friends for a module without a
     * section; null for Member Following and for a module of contexts without a section in the
     * apps.
     */
    protected function _allTarget($oMenu, array $aItem)
    {
        if (!($oMenu instanceof BxBaseMenuProfileMemberships))
            return null;

        $aTarget = ['kind' => 'section', 'section' => null, 'view' => null, 'id' => null, 'module' => null, 'path' => null];
        $sObject = $oMenu->getMembersConnectionObject($aItem['module']);
        $aSection = $aItem['target'] ?? null;
        $bSection = is_array($aSection) && ($aSection['kind'] ?? '') === 'section' && !empty($aSection['section']);
        if ($sObject === 'sys_profiles_friends')
            return array_merge($aTarget, $bSection ? ['section' => $aSection['section'], 'view' => 'friends'] : ['section' => 'connections', 'view' => 'friends']);

        if ($sObject === '' || !$bSection)
            return null;

        return array_merge($aTarget, ['section' => $aSection['section'], 'view' => 'joined']);
    }

    /**
     * NavigationContexts of the followed contexts by id: what a sidebar row shows, the name and
     * the picture (when the viewer may see it, the module's checkAllowedViewProfileImage, as an
     * embedded Profile), with what their checks read (rows, fans, roles, invitations, pictures)
     * read at once (BxDolApiV2Targets::primeContexts in BxBaseApiV2Profiles::summaries' scopes).
     */
    protected function _contexts(array $aIds)
    {
        $iRows = BxDolStorageQuery::openFileRowsScope();
        $iHandlers = BxDolTranscoderQuery::openHandlersScope();
        $iSeo = BxDolPageQuery::openSeoLinksScope();
        try {
            BxDolApiV2Targets::primeContexts($aIds);
            $aResult = [];
            foreach ($aIds as $iId) {
                $oProfile = BxDolProfile::getInstance((int)$iId);
                if (!$oProfile || $oProfile->getStatus() !== BX_PROFILE_STATUS_ACTIVE)
                    continue;
                $sModule = $oProfile->getModule();
                $aContent = BxDolApiV2Map::profileContent($oProfile);
                $CNF = BxDolApiV2Map::profileCnf($sModule);
                $bPicture = !empty($aContent[$CNF['FIELD_PICTURE'] ?? '']);
                if ($bPicture && $sModule !== 'system' && ($oModule = BxDolModule::getInstance($sModule)) && method_exists($oModule, 'checkAllowedViewProfileImage'))
                    $bPicture = $oModule->checkAllowedViewProfileImage($aContent) === CHECK_ACTION_RESULT_ALLOWED;
                $aResult[(int)$iId] = [
                    'id' => BxDolApiV2Map::id($iId),
                    'kind' => BxDolApiV2Map::profileKind($sModule),
                    'module' => $sModule,
                    'display_name' => $oProfile->getDisplayName(),
                    'avatar' => $bPicture ? BxDolApiV2Map::absoluteUrl($oProfile->getAvatar()) : null,
                ];
            }
            return $aResult;
        }
        finally {
            BxDolPageQuery::closeSeoLinksScope($iSeo);
            BxDolTranscoderQuery::closeHandlersScope($iHandlers);
            BxDolStorageQuery::closeFileRowsScope($iRows);
        }
    }

    /**
     * Where an item opens in the apps (NavigationTarget), or null: the one place that decides
     * it (the class's comment says in which order). $aItem is a NavigationItem being built
     * (`module`, `name`, `set`, `link`); the hooks get it with `link_code`, the link as Studio
     * has it (before markers and permalinks), and `viewer_id`.
     * @param string $sLinkCode the item's link as Studio has it (its `#fragment` says which tab)
     */
    public function target(array $aItem, $sLinkCode = '')
    {
        $aPage = $this->_pageOf($aItem['link']);
        if ($aPage && ($i = bx_mb_strpos($sLinkCode, '#')) !== false)
            $aPage['fragment'] = get_mb_substr($sLinkCode, $i + 1, null);
        $aItem['viewer_id'] = (int)$this->_oReq->viewerId();
        $aItem['link_code'] = $sLinkCode;

        $aTarget = null;
        foreach (BxDolApiV2Router::hooks('apiV2NavigationTarget', $aItem['module']) as $oEndpoint) {
            $m = $oEndpoint->apiV2NavigationTarget($aItem, $aPage);
            if (is_array($m) && !empty($m['kind'])) {
                $aTarget = $m;
                break;
            }
        }

        if ($aTarget === null && $aPage)
            $aTarget = $this->_profileTarget($aPage);

        if ($aTarget === null)
            $aTarget = $this->_moduleTarget($aItem, $aPage);

        if ($aTarget === null && $aPage)
            $aTarget = ['kind' => self::TARGET_PAGE];

        if ($aTarget === null)
            return null;

        $aTarget = static::makeTarget($aTarget);
        // the page the item opens, for a client without a screen of its own for it
        $aTarget['path'] = $aPage && $this->_resolves($aPage['path']) ? $aPage['path'] : null;

        return $aTarget['kind'] === self::TARGET_PAGE && $aTarget['path'] === null ? null : $aTarget;
    }

    /**
     * A NavigationTarget of a hook's answer: kind, section, view, id, module (path is set after).
     */
    public static function makeTarget(array $a)
    {
        return [
            'kind' => (string)$a['kind'],
            'section' => isset($a['section']) && is_string($a['section']) && $a['section'] !== '' ? $a['section'] : null,
            'view' => isset($a['view']) && is_string($a['view']) && $a['view'] !== '' ? $a['view'] : null,
            'id' => isset($a['id']) && (int)$a['id'] > 0 ? BxDolApiV2Map::id($a['id']) : null,
            'module' => isset($a['module']) && is_string($a['module']) && $a['module'] !== '' ? $a['module'] : null,
            'path' => null,
        ];
    }

    /**
     * The site's own pages the apps have sections for: Home, Explore, Connections (the friend
     * suggestions page, the system's Connections item) and one's own friends, friend requests
     * and following pages of a profile module. Other modules' items are their own classes'.
     */
    public function apiV2NavigationTarget(array $aItem, array $aPage)
    {
        $sUri = $aPage['uri'] ?? '';
        if ($sUri === 'home')
            return ['kind' => self::TARGET_SECTION, 'section' => 'home'];
        if ($sUri === 'explore')
            return ['kind' => self::TARGET_SECTION, 'section' => 'explore'];
        if ($sUri === 'friend-suggestions')
            return ['kind' => self::TARGET_SECTION, 'section' => 'connections'];

        // a profile module's page of one's own connections (`profile_id` the viewer)
        $sModule = $aPage['module'] ?? '';
        if ($sUri === '' || $sModule === '' || $sModule === 'system' || !in_array($sModule, static::profileModules(), true))
            return null;
        $iOwner = (int)($aPage['params']['profile_id'] ?? 0);
        if (!$iOwner || $iOwner !== (int)$aItem['viewer_id'])
            return null;
        $CNF = BxDolApiV2Map::profileCnf($sModule);
        foreach (self::CONNECTIONS_VIEWS as $sCnf => $sView)
            if (($CNF[$sCnf] ?? '') === $sUri) {
                if ($sView === 'following' && ($aPage['fragment'] ?? '') === 'subscribers')
                    $sView = 'followers';
                return ['kind' => self::TARGET_SECTION, 'section' => 'connections', 'view' => $sView];
            }
        return null;
    }

    /**
     * A profile's or a context's page (its module's view page, by its id or SEO link): that
     * profile.
     */
    protected function _profileTarget(array $aPage)
    {
        $sModule = $aPage['module'];
        if ($sModule === '' || $sModule === 'system' || !BxDolRequest::serviceExists($sModule, 'act_as_profile'))
            return null;
        $CNF = BxDolApiV2Map::profileCnf($sModule);
        if (empty($CNF['URI_VIEW_ENTRY']) || $CNF['URI_VIEW_ENTRY'] !== $aPage['uri'])
            return null;
        $iProfile = BxBaseApiV2Layout::pageProfileId(['params' => $aPage['params'], 'page_module' => $sModule]);
        if (!$iProfile)
            return null;
        $sKind = BxDolApiV2Map::profileKind($sModule) === 'group' ? self::TARGET_CONTEXT : self::TARGET_PROFILE;
        return ['kind' => $sKind, 'id' => $iProfile, 'module' => $sModule];
    }

    /**
     * A page of a module with an API (its tag): the module's section, at the view that page is
     * (MODULE_VIEWS; one's own, joined and followed ones only for the viewer's own
     * `profile_id`). A module's item with no link at all (a followings heading) is its section.
     */
    protected function _moduleTarget(array $aItem, array $aPage)
    {
        $sModule = $aPage ? $aPage['module'] : $aItem['module'];
        $sTag = static::moduleTag($sModule);
        if ($sTag === null)
            return null;
        if (!$aPage)
            return $aItem['link'] === null && $aItem['module'] === $sModule ? ['kind' => self::TARGET_SECTION, 'section' => $sTag] : null;

        $CNF = BxDolApiV2Map::profileCnf($sModule);
        foreach (self::MODULE_VIEWS as $sCnf => $sView) {
            if (empty($CNF[$sCnf]))
                continue;
            $sUri = $CNF[$sCnf];
            if (str_starts_with($sUri, 'page.php?i='))
                $sUri = substr($sUri, strlen('page.php?i='));
            if ($sUri !== $aPage['uri'])
                continue;
            if (in_array($sView, ['mine', 'joined', 'followed', 'favorites'], true) && (int)($aPage['params']['profile_id'] ?? 0) !== (int)$aItem['viewer_id'])
                return null;
            return ['kind' => self::TARGET_SECTION, 'section' => $sTag, 'view' => $sView];
        }
        return null;
    }

    /**
     * The page a link on this site is, as GET /layout/resolve takes it: [path, uri, params,
     * module, fragment], or [] for a link that is no page of the site (another site, a module's
     * own URL, a script).
     */
    protected function _pageOf($sLink)
    {
        if ($sLink === null || $sLink === '')
            return [];
        $sRoot = BX_DOL_URL_ROOT;
        if (!str_starts_with($sLink, $sRoot))
            return [];
        $sRest = get_mb_substr($sLink, get_mb_len($sRoot), null);
        $sFragment = '';
        if (($i = bx_mb_strpos($sRest, '#')) !== false) {
            $sFragment = get_mb_substr($sRest, $i + 1, null);
            $sRest = get_mb_substr($sRest, 0, $i);
        }

        try {
            list($sUri, $aParams) = BxBaseApiV2Layout::pageOf('/' . $sRest);
        }
        catch (BxDolApiV2Problem $e) {
            return [];
        }

        $sObject = BxDolPageQuery::getPageObjectNameByURI($sUri, false, true);
        $aObject = $sObject ? BxDolPageQuery::getPageObject($sObject) : false;
        if (!$aObject)
            return [];

        // the page's own values, as GET /layout/resolve reads them back (an SEO link's value too)
        unset($aParams['owner']);
        $sPath = $sUri === 'home' ? '/' : '/page/' . $sUri;
        if ($aParams)
            $sPath .= '?' . http_build_query($aParams, '', '&', PHP_QUERY_RFC3986);

        return [
            'path' => $sPath,
            'uri' => $sUri,
            'params' => $aParams,
            'module' => (string)$aObject['module'],
            'object' => $sObject,
            'fragment' => $sFragment,
        ];
    }

    /**
     * Whether GET /layout/resolve draws the page for the viewer on this platform: it exists,
     * the viewer may see it, and it has a block the API feeds.
     */
    protected function _resolves($sPath)
    {
        $sKey = $this->_sPlatform . '|' . $sPath;
        if (array_key_exists($sKey, self::$_aResolved))
            return self::$_aResolved[$sKey];

        try {
            $aPage = (new BxBaseApiV2Layout())->resolvePage(new BxDolApiV2Request('GET', [], ['path' => $sPath, 'platform' => $this->_sPlatform], null, [], $this->_oReq->auth()));
        }
        catch (BxDolApiV2Problem $e) {
            return self::$_aResolved[$sKey] = false;
        }
        foreach ($aPage['cells'] as $aCell)
            if (!empty($aCell['blocks']))
                return self::$_aResolved[$sKey] = true;
        return self::$_aResolved[$sKey] = false;
    }

    /**
     * The tag of a module's paths, as its endpoint class says (apiV2ModuleInfo), or null for a
     * module without an API.
     */
    public static function moduleTag($sModule)
    {
        if (self::$_aTags === null) {
            self::$_aTags = [];
            foreach (BxBaseApiV2System::modules() as $a)
                if (!empty($a['tag']))
                    self::$_aTags[$a['module']] = $a['tag'];
        }
        return self::$_aTags[$sModule] ?? null;
    }

    /**
     * Enabled profile modules (persons, organizations).
     */
    protected static function profileModules()
    {
        static $aNames = null;
        if ($aNames === null) {
            $aNames = [];
            foreach (bx_srv('system', 'get_modules_by_type', ['profile']) as $aModule)
                $aNames[] = $aModule['name'];
        }
        return $aNames;
    }

    /**
     * An item's link as an absolute URL, null for none or a script. The site menu's Home, which
     * has no link, is the site's root.
     */
    public static function link($sLink, $sModule = '', $sName = '')
    {
        $sLink = trim($sLink);
        if ($sLink === '' && $sModule === 'system' && $sName === 'home')
            return BX_DOL_URL_ROOT;
        if ($sLink === '' || stripos($sLink, 'javascript:') === 0 || $sLink[0] === '#')
            return null;
        $sUrl = BxDolApiV2Map::absoluteUrl($sLink);
        return is_string($sUrl) && preg_match('#^https?://#i', $sUrl) ? $sUrl : null;
    }

    /**
     * The Lucide icon an item's icon code draws (a Font Awesome name the site's Lucide set maps,
     * or a Lucide name), null for none, an image or HTML.
     */
    public static function icon($sCode)
    {
        return BxDolApiV2Map::badgeIcon($sCode);
    }

    /**
     * A counter's answer as a number: the service gives a number, or text with one; null for
     * anything else (an empty string, HTML that is no number).
     */
    public static function counter($m)
    {
        if (is_int($m))
            return max(0, $m);
        if (is_float($m))
            return max(0, (int)$m);
        if (!is_string($m))
            return null;
        $s = trim(html_entity_decode(strip_tags($m), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
        return preg_match('/^\d{1,9}$/', $s) ? (int)$s : null;
    }

    /**
     * Studio's "Config API" of an item as an object ({} for none or for what is not a JSON object).
     */
    public static function config($m)
    {
        if (is_array($m))
            return (object)$m;
        $a = is_string($m) && $m !== '' ? json_decode($m, true) : null;
        return is_array($a) && !array_is_list($a) ? (object)$a : new stdClass();
    }

    /**
     * Whether "Hidden on" hides an item on the platform: a desktop app is the desktop screen, a
     * mobile app is `mobile-app`, and the web is hidden from on its three screens.
     * @param array|false $mHiddenOn the screens' names (BxDolMenu::_updateVisibilityParamsAPI)
     */
    public static function hiddenOnPlatform($mHiddenOn, $sPlatform)
    {
        if (!is_array($mHiddenOn) || !$mHiddenOn)
            return false;
        if ($sPlatform === 'desktop-app')
            return in_array('desktop', $mHiddenOn, true);
        if ($sPlatform === 'mobile-app')
            return in_array('mobile-app', $mHiddenOn, true);
        return !array_diff(['phone', 'tablet', 'desktop'], $mHiddenOn);
    }

    /**
     * Forget what this request read (tests that change menus in-process).
     */
    public static function reset()
    {
        self::$_aTags = null;
        self::$_aResolved = [];
    }

    public static function schemas()
    {
        $aScreens = ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/Screen']];
        return [
            'NavigationTarget' => [
                'type' => 'object',
                'description' => 'Where an item opens in the apps. `section`: a part of the app, `section` names it (`home`, `explore`, `connections`, or the tag of a module\'s paths: `notifications`, `conversations`, `posts`, `discussions`, `groups`, `spaces`, `events`, `tasks`, `videos`, `photos`, `persons` ...) and `view` a part of it (a module\'s `popular`, `new`, `mine`, `joined`, `followed`, `favorites`; People\'s (`persons`) `recent`, `active`, `online` and `friends`, the viewer\'s; Connections\' `friends`, `requests`, `following`, `followers`). `profile` and `context`: the profile with that `id` (of `module`). `page`: the site page at `path`, for GET /layout/resolve. Any kind has `path` when the page it is on the site resolves for the viewer, so a client without a screen of its own for it draws that page. Clients skip kinds and sections they don\'t know, after trying `path`.',
                'additionalProperties' => false,
                'required' => ['kind', 'section', 'view', 'id', 'module', 'path'],
                'properties' => [
                    'kind' => ['type' => 'string', 'enum' => [self::TARGET_SECTION, self::TARGET_PROFILE, self::TARGET_CONTEXT, self::TARGET_PAGE]],
                    'section' => ['type' => ['string', 'null'], 'example' => 'posts'],
                    'view' => ['type' => ['string', 'null'], 'example' => 'mine'],
                    'id' => ['oneOf' => [['$ref' => '#/components/schemas/Id'], ['type' => 'null']]],
                    'module' => ['type' => ['string', 'null'], 'example' => 'bx_groups'],
                    'path' => ['type' => ['string', 'null'], 'description' => 'A path for GET /layout/resolve', 'example' => '/page/posts-home'],
                ],
            ],
            'NavigationContext' => [
                'type' => 'object',
                'description' => 'A context (or a person) the viewer belongs to or follows, as a sidebar row shows it; GET /profiles/{id} has the rest',
                'additionalProperties' => false,
                'required' => ['id', 'kind', 'module', 'display_name', 'avatar'],
                'properties' => [
                    'id' => ['$ref' => '#/components/schemas/Id'],
                    'kind' => ['$ref' => '#/components/schemas/ProfileKind'],
                    'module' => ['type' => 'string', 'example' => 'bx_groups'],
                    'display_name' => ['type' => 'string'],
                    'avatar' => ['type' => ['string', 'null'], 'format' => 'uri', 'description' => 'Its picture (100x100) when it has one the viewer may see'],
                ],
            ],
            'NavigationItem' => [
                'type' => 'object',
                'description' => 'A menu item for the apps, as Studio > Navigation has it',
                'additionalProperties' => false,
                'required' => ['id', 'set', 'module', 'name', 'title', 'icon', 'link', 'counter', 'target', 'tabs', 'contexts', 'more_contexts', 'all_target', 'config', 'hidden_on'],
                'properties' => [
                    'id' => ['type' => 'string', 'description' => 'The item\'s set, module and name: the same for the same item on every request and site version', 'example' => 'sys_site:bx_posts:posts-home'],
                    'set' => ['type' => 'string', 'description' => 'The menu set it is in (Studio > Navigation > Sets)', 'example' => 'sys_site'],
                    'module' => ['type' => 'string', 'example' => 'bx_posts'],
                    'name' => ['type' => 'string', 'example' => 'posts-home'],
                    'title' => ['type' => 'string', 'description' => 'Plain text, in the viewer\'s language'],
                    'icon' => ['type' => ['string', 'null'], 'description' => 'A Lucide icon name (Studio\'s Font Awesome name as the site\'s Lucide set draws it); null for none, an image or HTML', 'example' => 'file-text'],
                    'link' => ['type' => ['string', 'null'], 'format' => 'uri', 'description' => 'Where it goes on the site, absolute; null for an item that only runs a script'],
                    'counter' => ['type' => ['integer', 'null'], 'minimum' => 0, 'description' => 'The number the site shows beside it (unread messages, friend requests, one\'s posts), read for the viewer; null for none'],
                    'target' => ['oneOf' => [['$ref' => '#/components/schemas/NavigationTarget'], ['type' => 'null']], 'description' => 'Where it opens in the apps; null for nowhere (an app that can\'t open `link` leaves it out)'],
                    'tabs' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/NavigationItem'], 'description' => 'Its submenu\'s items for the apps (a module\'s Latest, Popular ...), one level: theirs have no `tabs`'],
                    'contexts' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/NavigationContext'], 'description' => 'In a `followings` group: the contexts of this module the viewer belongs to (or follows), the newest first, at most ' . self::CONTEXTS_MAX . '; [] elsewhere'],
                    'more_contexts' => ['type' => 'boolean', 'description' => 'There are more of them than `contexts` has'],
                    'all_target' => ['oneOf' => [['$ref' => '#/components/schemas/NavigationTarget'], ['type' => 'null']], 'description' => 'In a Member Memberships group: where all of them open (All your groups: the module\'s section at the ones one joined, view `joined`; All your friends: `persons` at `friends`, or `connections` at `friends` on a site without Persons\' section); null elsewhere and for a module without a section in the apps. `target` is where the module\'s contexts are browsed'],
                    'config' => ['type' => 'object', 'description' => 'Studio\'s "Config API" of the item ({"button":true} for Log in and Sign up); {} for none'],
                    'hidden_on' => $aScreens + ['description' => 'The screens it is hidden on ("Hidden on"); on the platform asked for it is never hidden'],
                ],
            ],
            'NavigationGroup' => [
                'type' => 'object',
                'description' => 'A top-level item of the Apps Sidebar: `items` a submenu\'s items (`menu` names it), `profile` the viewer (Member Avatar), `followings` the contexts the viewer belongs to (or follows), an item per module',
                'additionalProperties' => false,
                'required' => ['id', 'name', 'kind', 'title', 'menu', 'profile', 'items'],
                'properties' => [
                    'id' => ['type' => 'string', 'example' => 'sys_apps_sidebar:system:apps-menu'],
                    'name' => ['type' => 'string', 'example' => 'apps-menu'],
                    'kind' => ['type' => 'string', 'enum' => [self::KIND_ITEMS, self::KIND_PROFILE, self::KIND_FOLLOWINGS]],
                    'title' => ['type' => 'string', 'description' => 'Its heading (the item\'s title in Studio), in the viewer\'s language; empty for none'],
                    'menu' => ['type' => ['string', 'null'], 'description' => 'The menu object of its items (Studio > Navigation > Menus)', 'example' => 'sys_apps_menu'],
                    'profile' => ['oneOf' => [['$ref' => '#/components/schemas/Profile'], ['type' => 'null']], 'description' => 'The viewer, in a `profile` group'],
                    'items' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/NavigationItem']],
                ],
            ],
            'Navigation' => [
                'type' => 'object',
                'additionalProperties' => false,
                'required' => ['menu', 'platform', 'groups'],
                'properties' => [
                    'menu' => ['type' => 'string', 'description' => 'The menu it is built from', 'example' => self::MENU],
                    'platform' => ['$ref' => '#/components/schemas/Platform'],
                    'groups' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/NavigationGroup']],
                    'footer' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/NavigationItem'], 'description' => 'The footer\'s links (Studio > Navigation > Footer, `sys_footer`), in Studio\'s order: a page of the site with its `target`, another link with its `link` only, and text (the copyright notice) with neither, its words the `title`. The site\'s footer tools (language, theme, sounds, Powered by) are left out.'],
                ],
            ],
        ];
    }
}

/** @} */
