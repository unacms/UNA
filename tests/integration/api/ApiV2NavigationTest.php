<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * API v2 GET /navigation (BxBaseApiV2Navigation): the apps' sidebar from the Apps Sidebar menu
 * (`sys_apps_sidebar`, the apps' own), over real HTTP. Items a test puts in the site menu
 * (`sys_site`, the sidebar's Browse group) are deleted after it. Guests', members' and an
 * administrator's groups and items, "Active in apps" off, "Visible for", "Hidden on" per
 * platform, Studio's order (and a new order after a change, which the cache follows), a group one
 * is a member of in Member Memberships, where the site's own items open, the ETag, and how many
 * queries an answer takes; and that the menus the site and API v1 read have none of the apps'
 * items. The helpers' rules are checked on their own too.
 */
#[Group('integration')]
class ApiV2NavigationTest extends ApiV2TestCase
{
    /** Menu items a test added, deleted after it. */
    protected $_aItems = [];
    /** Follows a test added: [initiator, content]. */
    protected $_aFollows = [];

    protected function tearDown(): void
    {
        foreach ($this->_aItems as $iId)
            BxDolDb::getInstance()->query("DELETE FROM `sys_menu_items` WHERE `id` = :id", ['id' => $iId]);
        $oFollows = BxDolConnection::getObjectInstance('sys_profiles_subscriptions');
        foreach ($this->_aFollows as [$iInitiator, $iContent])
            $oFollows->removeConnection($iInitiator, $iContent);
        parent::tearDown();
    }

    /** A site menu item the test adds, active in the apps; its name. */
    protected function addItem(array $aFields = []): string
    {
        $sName = 'apiv2-nav-test-' . count($this->_aItems) . '-' . bin2hex(random_bytes(3));
        $oDb = BxDolDb::getInstance();
        $oDb->query("INSERT INTO `sys_menu_items` SET " . $oDb->arrayToSQL($aFields + [
            'set_name' => 'sys_site',
            'module' => 'system',
            'name' => $sName,
            'title_system' => '_sys_menu_item_title_system_about',
            'title' => '_sys_menu_item_title_about',
            'link' => 'page.php?i=about',
            'onclick' => '',
            'target' => '',
            'icon' => 'info-circle',
            'addon' => '',
            'markers' => '',
            'submenu_object' => '',
            'visibility_custom' => '',
            'config_api' => '',
            'visible_for_levels' => 2147483647,
            'active' => 0,
            'active_api' => 1,
            'order' => 9000 + count($this->_aItems),
        ]));
        $this->_aItems[] = (int)$oDb->lastId();
        return $sName;
    }

    protected function navigation(array $aAuth, string $sPlatform = 'desktop-app'): array
    {
        $a = $this->http('GET', 'navigation?platform=' . $sPlatform, $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Navigation', $a['json']);
        return $a['json'];
    }

    /** The groups by name. */
    protected static function groupsOf(array $aNavigation): array
    {
        return array_column($aNavigation['groups'], null, 'name');
    }

    /** Every item of the answer by id, tabs left out. */
    protected static function items(array $aNavigation): array
    {
        $aItems = [];
        foreach ($aNavigation['groups'] as $aGroup)
            foreach ($aGroup['items'] as $aItem)
                $aItems[$aItem['id']] = $aItem;
        return $aItems;
    }

    protected function requireAppsSidebar(): void
    {
        $oDb = BxDolDb::getInstance();
        if (!(int)$oDb->getOne("SELECT `active_api` FROM `sys_menu_items` WHERE `set_name` = 'sys_apps_sidebar' AND `module` = 'system' AND `name` = 'public-menu'"))
            $this->markTestSkipped('The Apps Sidebar\'s Public Menu is off in the apps here (migration 2026110900_apps_sidebar not run).');
    }

    /** Whether an item of the Apps Sidebar or the Apps Menu is on in the apps here. */
    protected static function isOn(string $sSet, string $sModule, string $sName): bool
    {
        return (bool)BxDolDb::getInstance()->getOne("SELECT `active_api` FROM `sys_menu_items` WHERE `set_name` = :set AND `module` = :module AND `name` = :name", ['set' => $sSet, 'module' => $sModule, 'name' => $sName]);
    }

    public function testGuestsMembersAndAdministratorsGetWhatTheyMaySee(): void
    {
        $this->requireAppsSidebar();
        [$iViewer, $sToken] = $this->userToken();
        $iAdmin = $this->adminProfileIdOtherThan([$iViewer]);
        $aMember = ['Authorization' => 'Bearer ' . $sToken];
        $aAdmin = ['Authorization' => 'Bearer ' . $this->profileToken($iAdmin)];

        $sEveryone = $this->addItem();
        $sMembers = $this->addItem(['visible_for_levels' => 2147483646]);
        $sAdmins = $this->addItem(['visible_for_levels' => pow(2, MEMBERSHIP_ID_ADMINISTRATOR - 1)]);
        $sWebOnly = $this->addItem(['active' => 1, 'active_api' => 0]);
        $sId = fn($s) => 'sys_site:system:' . $s;

        // a guest: Home and Explore of the apps' menu, and the site menu with what guests may see
        $aGuest = $this->navigation([]);
        $this->assertSame('sys_apps_sidebar', $aGuest['menu']);
        $this->assertSame('desktop-app', $aGuest['platform']);
        $aGroups = self::groupsOf($aGuest);
        $this->assertArrayHasKey('public-menu', $aGroups);
        $this->assertSame('items', $aGroups['public-menu']['kind']);
        $this->assertSame('sys_site_in_panel', $aGroups['public-menu']['menu']);
        foreach (['member-avatar', 'member-menu', 'member-followings', 'member-memberships'] as $sName)
            $this->assertArrayNotHasKey($sName, $aGroups, $sName . ' is for members');
        if (self::isOn('sys_apps_sidebar', 'system', 'apps-menu')) {
            $this->assertSame('sys_apps_menu', $aGroups['apps-menu']['menu'] ?? null);
            $aNames = array_column($aGroups['apps-menu']['items'], 'name');
            foreach (['profile', 'connections', 'convos-messages', 'messenger-messages', 'notifications-view'] as $sName)
                $this->assertNotContains($sName, $aNames, $sName . ' is for members');
            if (self::isOn('sys_apps_menu', 'system', 'home') && self::isOn('sys_apps_menu', 'system', 'explore'))
                $this->assertSame(['home', 'explore'], array_values(array_intersect($aNames, ['home', 'explore'])));
        }
        $aItems = self::items($aGuest);
        $this->assertArrayHasKey($sId($sEveryone), $aItems);
        $this->assertArrayNotHasKey($sId($sMembers), $aItems);
        $this->assertArrayNotHasKey($sId($sAdmins), $aItems);
        $this->assertArrayNotHasKey($sId($sWebOnly), $aItems, 'an item off in the apps is left out');
        $this->assertArrayHasKey('sys_site:system:home', $aItems);
        $this->assertSame(['kind' => 'section', 'section' => 'home', 'view' => null, 'id' => null, 'module' => null], array_diff_key($aItems['sys_site:system:home']['target'], ['path' => 1]));
        $this->assertSame('About', $aItems[$sId($sEveryone)]['title']);
        $this->assertSame('info', $aItems[$sId($sEveryone)]['icon']);
        $this->assertSame(BX_DOL_URL_ROOT, substr((string)$aItems[$sId($sEveryone)]['link'], 0, strlen(BX_DOL_URL_ROOT)));

        // a member: the profile, the member menu, and the members' item but not the admins'
        $aNavigation = $this->navigation($aMember);
        $aGroups = self::groupsOf($aNavigation);
        $this->assertSame('profile', $aGroups['member-avatar']['kind'] ?? null);
        $this->assertSame((string)$iViewer, $aGroups['member-avatar']['profile']['id']);
        $this->assertSame('sys_apps_menu', $aGroups['apps-menu']['menu'] ?? null);
        // as installed: one's main places first with no heading (Home, Explore, Profile, Messages,
        // Notifications, Connections), then the site menu headed Browse
        $this->assertSame('', $aGroups['apps-menu']['title']);
        $this->assertSame('Browse', $aGroups['public-menu']['title']);
        $aNames = array_column($aNavigation['groups'], 'name');
        $this->assertLessThan(array_search('public-menu', $aNames, true), array_search('apps-menu', $aNames, true));
        $oModules = BxDolModuleQuery::getInstance();
        $aWant = ['home', 'explore', 'profile'];
        // Messages is Messenger's where it is enabled, else Conversations'
        if ($oModules->isEnabledByName('bx_messenger'))
            $aWant[] = 'messenger-messages';
        else if ($oModules->isEnabledByName('bx_convos'))
            $aWant[] = 'convos-messages';
        if ($oModules->isEnabledByName('bx_notifications'))
            $aWant[] = 'notifications-view';
        $aWant[] = 'connections';
        $this->assertSame($aWant, array_values(array_intersect(array_column($aGroups['apps-menu']['items'], 'name'), ['home', 'explore', 'profile', 'convos-messages', 'messenger-messages', 'notifications-view', 'connections'])));
        // the site's own member menu (Profile Stats) and Member Following are in the sidebar's
        // menu for an owner to turn on: off as installed
        foreach (['member-menu', 'member-followings'] as $sName)
            if (!self::isOn('sys_apps_sidebar', 'system', $sName))
                $this->assertArrayNotHasKey($sName, $aGroups, $sName . ' is off in the apps as installed');
        if (isset($aGroups['member-followings']))
            $this->assertSame('Following', $aGroups['member-followings']['title']);
        $aItems = self::items($aNavigation);
        $this->assertArrayHasKey($sId($sEveryone), $aItems);
        $this->assertArrayHasKey($sId($sMembers), $aItems);
        $this->assertArrayNotHasKey($sId($sAdmins), $aItems);
        $this->assertArrayNotHasKey($sId($sWebOnly), $aItems);
        // the apps' menu's own profile, with the {member_url} marker
        $aProfile = $aItems['sys_apps_menu:system:profile'] ?? null;
        $this->assertNotNull($aProfile);
        $this->assertSame('profile', $aProfile['target']['kind']);
        $this->assertSame((string)$iViewer, $aProfile['target']['id']);
        // Home and Explore are the app's sections
        $this->assertSame('home', $aItems['sys_apps_menu:system:home']['target']['section'] ?? null);
        $this->assertSame('explore', $aItems['sys_apps_menu:system:explore']['target']['section'] ?? null);
        // Connections, with the friend requests' count
        if (isset($aItems['sys_apps_menu:system:connections'])) {
            $this->assertSame('connections', $aItems['sys_apps_menu:system:connections']['target']['section']);
            $this->assertIsInt($aItems['sys_apps_menu:system:connections']['counter']);
        }
        // Notifications and Messages open their sections, with their counters
        if (isset($aItems['sys_apps_menu:bx_notifications:notifications-view'])) {
            $this->assertSame('notifications', $aItems['sys_apps_menu:bx_notifications:notifications-view']['target']['section']);
            $this->assertIsInt($aItems['sys_apps_menu:bx_notifications:notifications-view']['counter']);
        }
        if (isset($aItems['sys_apps_menu:bx_convos:convos-messages']))
            $this->assertSame('conversations', $aItems['sys_apps_menu:bx_convos:convos-messages']['target']['section']);

        // an administrator: the admins' item too
        $aItems = self::items($this->navigation($aAdmin));
        $this->assertArrayHasKey($sId($sAdmins), $aItems);
        $this->assertArrayHasKey($sId($sMembers), $aItems);
    }

    public function testStudiosOrderAndChangesShowAtOnce(): void
    {
        $this->requireAppsSidebar();
        $sFirst = $this->addItem(['order' => 9101]);
        $sSecond = $this->addItem(['order' => 9102]);

        $fOrder = function () use ($sFirst, $sSecond) {
            $aIds = array_keys(self::items($this->navigation([])));
            return [array_search('sys_site:system:' . $sFirst, $aIds, true), array_search('sys_site:system:' . $sSecond, $aIds, true)];
        };

        [$iFirst, $iSecond] = $fOrder();
        $this->assertNotFalse($iFirst);
        $this->assertNotFalse($iSecond);
        $this->assertLessThan($iSecond, $iFirst);
        // About (9999) after the modules' items
        $aIds = array_keys(self::items($this->navigation([])));
        $this->assertLessThan(array_search('sys_site:system:about', $aIds, true), $iSecond);

        // reordered in Studio (straight in the database here: the cache's digest sees it too)
        BxDolDb::getInstance()->query("UPDATE `sys_menu_items` SET `order` = 9100 WHERE `id` = :id", ['id' => $this->_aItems[1]]);
        [$iFirst, $iSecond] = $fOrder();
        $this->assertLessThan($iFirst, $iSecond);

        // turned off for the apps
        BxDolDb::getInstance()->query("UPDATE `sys_menu_items` SET `active_api` = 0 WHERE `id` = :id", ['id' => $this->_aItems[1]]);
        [$iFirst, $iSecond] = $fOrder();
        $this->assertNotFalse($iFirst);
        $this->assertFalse($iSecond);
    }

    public function testHiddenOnPerPlatform(): void
    {
        $this->requireAppsSidebar();
        $iDesktop = pow(2, BX_DB_HIDDEN_DESKTOP - 1);
        $iMobile = pow(2, BX_DB_HIDDEN_MOBILE - 1);
        $sNotOnDesktop = 'sys_site:system:' . $this->addItem(['hidden_on' => (string)$iDesktop]);
        $sNotInMobileApp = 'sys_site:system:' . $this->addItem(['hidden_on' => (string)$iMobile]);

        $aDesktop = self::items($this->navigation([], 'desktop-app'));
        $this->assertArrayNotHasKey($sNotOnDesktop, $aDesktop);
        $this->assertSame(['mobile-app'], $aDesktop[$sNotInMobileApp]['hidden_on']);

        $aNative = self::items($this->navigation([], 'mobile-app'));
        $this->assertArrayNotHasKey($sNotInMobileApp, $aNative);
        $this->assertArrayHasKey($sNotOnDesktop, $aNative);

        // the web hides it on the desktop screen itself
        $aWeb = self::items($this->navigation([], 'web'));
        $this->assertSame(['desktop'], $aWeb[$sNotOnDesktop]['hidden_on']);

        $this->assertSame(422, $this->http('GET', 'navigation?platform=tv')['status']);
    }

    public function testYourGroupsAreTheOnesOneIsAMemberOf(): void
    {
        $this->requireAppsSidebar();
        $this->requireModule('bx_groups');
        [$iViewer, $sToken] = $this->userToken();
        $aMember = ['Authorization' => 'Bearer ' . $sToken];

        // a group the viewer only follows (not a member of) is not among theirs
        $oFollows = BxDolConnection::getObjectInstance('sys_profiles_subscriptions');
        $oFans = BxDolConnection::getObjectInstance('bx_groups_fans');
        $iFollowed = 0;
        foreach (self::seedOnly() ? [] : BxDolDb::getInstance()->getColumn("SELECT `id` FROM `sys_profiles` WHERE `type` = 'bx_groups' AND `status` = 'active' ORDER BY `id`") as $i)
            if (!$oFollows->isConnected($iViewer, (int)$i) && !$oFans->isConnected($iViewer, (int)$i)) {
                $iFollowed = (int)$i;
                break;
            }
        // none the site has: a group of a person made for the class
        if (!$iFollowed)
            $iFollowed = $this->seedGroup($this->ordinaryProfileIdOtherThan([$iViewer]));
        if ($iFollowed) {
            $oFollows->addConnection($iViewer, $iFollowed);
            $this->_aFollows[] = [$iViewer, $iFollowed];
        }
        // one who is in no group joins one made for the test: a member with no memberships at all
        // has no Member Memberships to look at
        if (!$oFans->getConnectedContentByType($iViewer, ['bx_groups'], true, 0, 1)) {
            $iJoined = $this->seedGroup($this->ordinaryProfileIdOtherThan([$iViewer]));
            $a = $this->http('POST', 'groups/' . $iJoined . '/membership', $aMember);
            $this->assertContains($a['status'], [200, 201, 204], $a['body']);
            BxDolDb::getInstance()->cleanMemoryAll();
            $this->assertTrue((bool)$oFans->isConnected($iViewer, $iJoined, true), 'the test user joined a group');
        }

        $aGroups = self::groupsOf($this->navigation($aMember));
        // the apps list Member Memberships, not Member Following, as installed, with no heading of
        // its own: each module's item is a section (Your groups, Your friends ...)
        $this->assertArrayNotHasKey('member-followings', $aGroups);
        $this->assertSame('followings', $aGroups['member-memberships']['kind'] ?? null);
        $this->assertSame('sys_profile_memberships', $aGroups['member-memberships']['menu']);
        $this->assertSame('', $aGroups['member-memberships']['title']);
        $aGroupsItem = null;
        foreach ($aGroups['member-memberships']['items'] as $aItem)
            if ($aItem['module'] === 'bx_groups')
                $aGroupsItem = $aItem;
        $aMine = $oFans->getConnectedContentByType($iViewer, ['bx_groups'], true, 0, BxBaseApiV2Navigation::CONTEXTS_MAX + 1, BX_CONNECTIONS_ORDER_ADDED_DESC);
        if (!$aMine) {
            $this->assertNull($aGroupsItem, 'no Your groups for one in no group');
            return;
        }
        $this->assertNotNull($aGroupsItem, 'the Groups item of Member Memberships');
        $this->assertSame('Your groups', $aGroupsItem['title']);
        $aIds = array_map(fn($c) => (int)$c['id'], $aGroupsItem['contexts']);
        $this->assertSame(array_map('intval', array_slice($aMine, 0, BxBaseApiV2Navigation::CONTEXTS_MAX)), $aIds, 'the groups one is a member of, the newest first');
        foreach ($aIds as $iId)
            $this->assertTrue((bool)$oFans->isConnected($iViewer, $iId, true));
        if ($iFollowed)
            $this->assertNotContains($iFollowed, $aIds, 'a group one only follows');
        $this->assertSame('group', $aGroupsItem['contexts'][0]['kind']);
        $this->assertSame(['kind' => 'section', 'section' => 'groups'], array_intersect_key($aGroupsItem['target'], ['kind' => 1, 'section' => 1]));
        $this->assertLessThanOrEqual(BxBaseApiV2Navigation::CONTEXTS_MAX, count($aGroupsItem['contexts']));
        // All your groups: the Groups section at the ones one joined; Browse is `target`
        $this->assertSame(['kind' => 'section', 'section' => 'groups', 'view' => 'joined'], array_intersect_key($aGroupsItem['all_target'], ['kind' => 1, 'section' => 1, 'view' => 1]));
        $this->assertSame(count($aMine) > BxBaseApiV2Navigation::CONTEXTS_MAX, $aGroupsItem['more_contexts']);
        // All your friends: People at Friends (Persons' section)
        foreach ($aGroups['member-memberships']['items'] as $aItem)
            if ($aItem['module'] === 'bx_persons')
                $this->assertSame(['section' => 'persons', 'view' => 'friends'], array_intersect_key($aItem['all_target'], ['section' => 1, 'view' => 1]));
    }

    public function testPeopleIsPersonsSectionAndYourFriendsBrowsesIt(): void
    {
        $this->requireAppsSidebar();
        $this->requireModule('bx_persons');
        $oDb = BxDolDb::getInstance();
        if (!(int)$oDb->getOne("SELECT `active_api` FROM `sys_menu_items` WHERE `set_name` = 'sys_site' AND `module` = 'bx_persons' AND `name` = 'persons-home'"))
            $this->markTestSkipped('People is off in the apps here.');
        $fSection = fn(array $a) => array_intersect_key($a, ['kind' => 1, 'section' => 1, 'view' => 1]);

        // the site menu's People and its submenu's Recent, Active, Online: Persons' section at that view, for guests too
        foreach ([[], ['Authorization' => 'Bearer ' . $this->userToken()[1]]] as $aAuth) {
            $aPeople = self::items($this->navigation($aAuth))['sys_site:bx_persons:persons-home'] ?? null;
            $this->assertNotNull($aPeople, 'People');
            $this->assertSame(['kind' => 'section', 'section' => 'persons', 'view' => 'recent'], $fSection($aPeople['target']));
            $aTabs = array_column($aPeople['tabs'], null, 'name');
            foreach (['persons-home' => 'recent', 'persons-active' => 'active', 'persons-online' => 'online'] as $sName => $sView)
                if (isset($aTabs[$sName]))
                    $this->assertSame(['kind' => 'section', 'section' => 'persons', 'view' => $sView], $fSection($aTabs[$sName]['target']), $sName);
            // Search is not one of the section's views
            if (isset($aTabs['persons-search']))
                $this->assertNotSame('persons', $aTabs['persons-search']['target']['section'] ?? null);
        }

        // Your friends: Browse is People (`target`), All your friends People at Friends
        [$iViewer, $sToken] = $this->userToken();
        $aGroups = self::groupsOf($this->navigation(['Authorization' => 'Bearer ' . $sToken]));
        $aFriends = null;
        foreach ($aGroups['member-memberships']['items'] ?? [] as $aItem)
            if ($aItem['module'] === 'bx_persons')
                $aFriends = $aItem;
        $oFriends = BxDolConnection::getObjectInstance('sys_profiles_friends');
        if (!$oFriends->getConnectedContentCount($iViewer, true)) {
            $this->assertNull($aFriends, 'no Your friends without friends');
            return;
        }
        $this->assertNotNull($aFriends, 'Your friends');
        $this->assertSame('Your friends', $aFriends['title']);
        $this->assertSame(['kind' => 'section', 'section' => 'persons', 'view' => null], $fSection($aFriends['target']));
        $this->assertSame(['kind' => 'section', 'section' => 'persons', 'view' => 'friends'], $fSection($aFriends['all_target']));
        // the apps' menu's own profile is still the profile
        $aProfile = self::items($this->navigation(['Authorization' => 'Bearer ' . $sToken]))['sys_apps_menu:system:profile'] ?? null;
        if ($aProfile)
            $this->assertSame('profile', $aProfile['target']['kind']);
    }

    /**
     * The apps' sidebar has menus of its own: the menus the site draws and API v1 gives NEO
     * (the site menu, the member menu, the Site Panel) have none of its items, so turning API
     * v2 on or editing the apps' sidebar changes nothing there.
     */
    public function testTheSitesMenusHaveNoneOfTheAppsItems(): void
    {
        $this->requireAppsSidebar();
        $oDb = BxDolDb::getInstance();

        foreach (['sys_apps_sidebar' => 'BxTemplMenuAppsSidebar', 'sys_apps_menu' => 'BxTemplMenuAppsMenu'] as $sObject => $sClass) {
            $aMenu = BxDolMenuQuery::getMenuObject($sObject);
            $this->assertNotEmpty($aMenu, $sObject);
            $this->assertSame($sObject, $aMenu['set_name'], 'a set of its own');
            $this->assertSame($sClass, $aMenu['override_class_name']);
            $this->assertInstanceOf($sClass, BxDolMenu::getObjectInstance($sObject));
        }
        // kept per profile: its items have the viewer's own profile link
        $this->assertSame('per_user', BxDolMenuQuery::getMenuObject('sys_apps_menu')['cache']);

        // what earlier copies of the sidebar put in the site's menus
        $aNot = [
            'sys_site' => ['explore', 'convos-messages', 'messenger-messages', 'notifications-view'],
            'sys_profile_stats' => ['profile-stats-home', 'profile-stats-messages', 'profile-stats-notifications'],
            'sys_site_panel' => ['member-memberships', 'apps-menu'],
        ];
        foreach ($aNot as $sSet => $aNames)
            $this->assertSame([], $oDb->getColumn("SELECT `name` FROM `sys_menu_items` WHERE `set_name` = :set AND `name` IN (" . $oDb->implode_escape($aNames) . ")", ['set' => $sSet]), $sSet);

        // API v1's menus (system/get_menu, the profile menu block) are the site's: none reads a set of the apps'
        foreach (['sys_site', 'sys_site_in_panel', 'sys_profile_stats', 'sys_profile_followings', 'sys_site_panel'] as $sObject) {
            $aMenu = BxDolMenuQuery::getMenuObject($sObject);
            $this->assertNotContains($aMenu['set_name'], ['sys_apps_sidebar', 'sys_apps_menu', 'sys_profile_memberships'], $sObject);
        }
        // and no menu of the site's draws one of the apps' menus as a submenu
        $this->assertSame([], $oDb->getColumn("SELECT CONCAT(`set_name`, ':', `name`) FROM `sys_menu_items` WHERE `submenu_object` IN ('sys_apps_sidebar', 'sys_apps_menu', 'sys_profile_memberships') AND `set_name` <> 'sys_apps_sidebar'"));
    }

    public function testTheFooter(): void
    {
        $oDb = BxDolDb::getInstance();
        if (!in_array('about', $oDb->getColumn("SELECT `name` FROM `sys_menu_items` WHERE `set_name` = 'sys_footer' AND `active_api` = 1"), true))
            $this->markTestSkipped('The footer\'s About is off in the apps here.');

        $sOff = $this->addItem(['set_name' => 'sys_footer', 'active' => 1, 'active_api' => 0]);
        $sOn = $this->addItem(['set_name' => 'sys_footer', 'link' => 'https://example.com/help', 'order' => 0]);
        $sDesktopHidden = $this->addItem(['set_name' => 'sys_footer', 'hidden_on' => (string)pow(2, BX_DB_HIDDEN_DESKTOP - 1)]);

        $aFooter = array_column($this->navigation([])['footer'], null, 'name');
        // a page of the site opens as that page in the apps: About is a text block (GET /layout/blocks/{id}/text)
        $this->assertSame('page', $aFooter['about']['target']['kind'] ?? null);
        $this->assertSame('/page/about', $aFooter['about']['target']['path']);
        // the copyright notice is text: its words, no link and nowhere to open
        if (isset($aFooter['copyright'])) {
            $this->assertStringContainsString(date('Y'), $aFooter['copyright']['title']);
            $this->assertNull($aFooter['copyright']['link']);
            $this->assertNull($aFooter['copyright']['target']);
        }
        // a link elsewhere keeps its link
        $this->assertSame('https://example.com/help', $aFooter[$sOn]['link']);
        $this->assertNull($aFooter[$sOn]['target']);
        // the site's tools are the site's, and the usual rules hold
        foreach (BxBaseMenuFooter::TOOLS as $sTool)
            $this->assertArrayNotHasKey($sTool, $aFooter);
        $this->assertArrayNotHasKey($sOff, $aFooter);
        $this->assertArrayNotHasKey($sDesktopHidden, $aFooter);
        $this->assertArrayHasKey($sDesktopHidden, array_column($this->navigation([], 'mobile-app')['footer'], null, 'name'));
        // Studio's order
        $aNames = array_keys($aFooter);
        $this->assertLessThan(array_search('about', $aNames, true), array_search($sOn, $aNames, true));
    }

    public function testTheAnswerHasAnEtag(): void
    {
        $this->requireAppsSidebar();
        $a = $this->http('GET', 'navigation?platform=desktop-app');
        $sTag = (string)BxDolTestPhpServer::header($a, 'etag');
        $this->assertStringStartsWith('W/"', $sTag);
        $this->assertSame(304, $this->http('GET', 'navigation?platform=desktop-app', ['If-None-Match' => $sTag])['status']);
    }

    /**
     * Queries of an answer, in this process, once its menus are kept (the second answer): a
     * guest's few, and a member's, whose counters and followed contexts are read each time, bounded.
     */
    public function testQueriesAreBounded(): void
    {
        $this->requireAppsSidebar();
        [$iViewer] = $this->userToken();

        $this->assertLessThanOrEqual(20, $this->countQueries(0), 'a guest');
        $this->assertLessThanOrEqual(200, $this->countQueries($iViewer), 'a member');
    }

    protected function countQueries(int $iProfile): int
    {
        $mBefore = $GLOBALS['glForceCurrentProfileId'] ?? null;
        if ($iProfile)
            $GLOBALS['glForceCurrentProfileId'] = $iProfile;
        else
            unset($GLOBALS['glForceCurrentProfileId']);
        $oAuth = new class($iProfile) extends BxDolApiV2Auth {
            public function __construct(int $i)
            {
                $this->_iProfileId = $i;
                $this->_sMode = $i ? self::MODE_TOKEN : self::MODE_GUEST;
            }
        };
        $oDb = BxDolDb::getInstance();
        $fQueries = fn() => (int)$oDb->getRow("SHOW SESSION STATUS LIKE 'Questions'")['Value'];
        try {
            $fRun = function () use ($oAuth) {
                foreach (array_keys($GLOBALS['bxDolClasses'] ?? []) as $sKey)
                    if (str_starts_with($sKey, 'BxDolMenu!'))
                        unset($GLOBALS['bxDolClasses'][$sKey]);
                BxBaseApiV2Navigation::reset();
                BxDolApiV2Map::reset();
                return (new BxBaseApiV2Navigation())->getNavigation(new BxDolApiV2Request('GET', [], ['platform' => 'desktop-app'], null, [], $oAuth));
            };
            $fRun();
            $iBefore = $fQueries();
            $a = $fRun();
            $iQueries = $fQueries() - $iBefore - 1;
            $this->assertNotEmpty($a['groups']);
            return $iQueries;
        }
        finally {
            if ($mBefore === null)
                unset($GLOBALS['glForceCurrentProfileId']);
            else
                $GLOBALS['glForceCurrentProfileId'] = $mBefore;
        }
    }

    public function testRules(): void
    {
        $this->assertSame(3, BxBaseApiV2Navigation::counter(3));
        $this->assertSame(12, BxBaseApiV2Navigation::counter(' <span>12</span> '));
        $this->assertNull(BxBaseApiV2Navigation::counter(''));
        $this->assertNull(BxBaseApiV2Navigation::counter('<a href="#">Edit</a>'));
        $this->assertNull(BxBaseApiV2Navigation::counter(false));

        $this->assertTrue(BxBaseApiV2Navigation::hiddenOnPlatform(['desktop'], 'desktop-app'));
        $this->assertFalse(BxBaseApiV2Navigation::hiddenOnPlatform(['phone', 'tablet'], 'desktop-app'));
        $this->assertTrue(BxBaseApiV2Navigation::hiddenOnPlatform(['mobile-app'], 'mobile-app'));
        $this->assertFalse(BxBaseApiV2Navigation::hiddenOnPlatform(['desktop'], 'web'));
        $this->assertTrue(BxBaseApiV2Navigation::hiddenOnPlatform(['phone', 'tablet', 'desktop'], 'web'));
        $this->assertFalse(BxBaseApiV2Navigation::hiddenOnPlatform(false, 'desktop-app'));

        $this->assertEquals((object)['button' => true], BxBaseApiV2Navigation::config('{"button":true}'));
        $this->assertEquals(new stdClass(), BxBaseApiV2Navigation::config('[1,2]'));
        $this->assertEquals(new stdClass(), BxBaseApiV2Navigation::config('nonsense'));

        $this->assertSame(BX_DOL_URL_ROOT, BxBaseApiV2Navigation::link('', 'system', 'home'));
        $this->assertNull(BxBaseApiV2Navigation::link('javascript:void(0)'));
        $this->assertNull(BxBaseApiV2Navigation::link(''));
    }
}
