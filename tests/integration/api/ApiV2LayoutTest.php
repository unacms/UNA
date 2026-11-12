<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * API v2 pages (GET /layout/resolve, BxBaseApiV2Layout) and the suggestions their blocks read
 * (GET /me/recommendations/friends and /follows), over real HTTP: blocks each test puts on the
 * home page (sys_home) and deletes after. A member's and a guest's blocks, "Visible for",
 * "Hidden on" (as design.hidden_on, and blocks hidden everywhere left out per platform), blocks
 * of a module that is not enabled and blocks the API can't feed left out, routes a guest can't
 * read left out for guests, and the page's layout and cells. The layout's and paths' rules are
 * checked on their own too. Then the pages the apps draw beside a profile's, a context's and a
 * module's own content, as the site installs them (API v2 changes no block of the site's pages):
 * a profile's Info and Friends, a group's Info and Members, Posts' and Discussions' Categories
 * (Featured stays on the site), SEO links as paths, and the routes those blocks read
 * (GET /profiles/{id}/info, categories with counts, featured discussions).
 */
#[Group('integration')]
class ApiV2LayoutTest extends ApiV2TestCase
{
    /** Blocks a test put on the home page, deleted after it. */
    protected $_aBlocks = [];

    protected function tearDown(): void
    {
        foreach ($this->_aBlocks as $iId)
            BxDolDb::getInstance()->query("DELETE FROM `sys_pages_blocks` WHERE `id` = :id", ['id' => $iId]);
        parent::tearDown();
    }

    /** The home page's cell that is not its main one: the right column on a three-column home, the first other otherwise. */
    protected function sideCell(): array
    {
        $aPage = BxDolPageQuery::getPageObject('sys_home');
        if (!$aPage)
            $this->markTestSkipped('No home page.');
        list(, $aNames) = BxBaseApiV2Layout::layoutOf(BxDolPageQuery::getLayoutColumnsAll()[(int)$aPage['layout_id']] ?? [], (int)$aPage['cells_number']);
        foreach (['right', 'side', 'left'] as $sWanted)
            foreach ($aNames as $iIndex => $sName)
                if ($sName === $sWanted)
                    return [$iIndex, $sName];
        $this->markTestSkipped('The home page has one column.');
    }

    /** A block on the home page, active in the apps; its id. */
    protected function addBlock(int $iCell, string $sContent, array $aFields = []): int
    {
        $oDb = BxDolDb::getInstance();
        $oDb->query("INSERT INTO `sys_pages_blocks` SET " . $oDb->arrayToSQL($aFields + [
            'object' => 'sys_home',
            'cell_id' => $iCell,
            'module' => 'system',
            'title' => 'ApiV2LayoutTest',
            'designbox_id' => 11,
            'visible_for_levels' => 2147483647,
            'type' => 'service',
            'content' => $sContent,
            'active' => 0,
            'active_api' => 1,
            'order' => 900 + count($this->_aBlocks),
        ]));
        $iId = (int)$oDb->lastId();
        $this->_aBlocks[] = $iId;
        return $iId;
    }

    protected static function service(string $sModule, string $sMethod, array $aParams = [], string $sClass = ''): string
    {
        return BxDolService::getSerializedService($sModule, $sMethod, $aParams, $sClass);
    }

    /** The blocks of the page's answer by id. */
    protected static function blocks(array $aPage): array
    {
        $aBlocks = [];
        foreach ($aPage['cells'] as $aCell)
            foreach ($aCell['blocks'] as $aBlock)
                $aBlocks[(int)$aBlock['id']] = $aBlock + ['cell' => $aCell['name']];
        return $aBlocks;
    }

    protected function resolve(array $aAuth, string $sPath, string $sPlatform = 'desktop-app'): array
    {
        $a = $this->http('GET', 'layout/resolve?path=' . rawurlencode($sPath) . '&platform=' . $sPlatform, $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('ResolvedPage', $a['json']);
        return $a['json'];
    }

    public function testMembersAndGuestsGetTheBlocksTheyMaySee(): void
    {
        [$iViewer, $sToken] = $this->userToken();
        $aMember = ['Authorization' => 'Bearer ' . $sToken];
        [$iCell, $sCell] = $this->sideCell();

        $iSuggestions = $this->addBlock($iCell, self::service('system', 'browse_recommendations_friends', [0, ['per_page' => 4]], 'TemplServiceProfiles'), ['visible_for_levels' => 2147483644, 'hidden_on' => 3]);
        $iGuestsOnly = $this->addBlock($iCell, self::service('system', 'browse_recommendations_subscriptions', [], 'TemplServiceProfiles'), ['visible_for_levels' => 1]);
        $iFriends = $this->addBlock($iCell, self::service('system', 'browse_friends', [0], 'TemplServiceProfiles'));
        $iAnothersFriends = $this->addBlock($iCell, self::service('system', 'browse_friends', ['{profile_id}'], 'TemplServiceProfiles'));
        $iHtml = $this->addBlock($iCell, '<p>Hello</p>', ['type' => 'raw']);
        $iMenu = $this->addBlock($iCell, 'sys_homepage', ['type' => 'menu']);
        $iWebOnly = $this->addBlock($iCell, self::service('system', 'browse_recommendations_friends', [], 'TemplServiceProfiles'), ['active_api' => 0, 'active' => 1]);
        $iOff = $this->addBlock(0, self::service('system', 'browse_recommendations_friends', [], 'TemplServiceProfiles'));

        $aPage = $this->resolve($aMember, '/');
        $this->assertSame('/', $aPage['uri']);
        $this->assertContains($aPage['layout'], BxBaseApiV2Layout::LAYOUTS);
        $this->assertContains('main', array_column($aPage['cells'], 'name'));
        $aBlocks = self::blocks($aPage);

        $this->assertArrayHasKey($iSuggestions, $aBlocks);
        $this->assertSame('graph.friend_suggestions', $aBlocks[$iSuggestions]['kind']);
        $this->assertSame($sCell, $aBlocks[$iSuggestions]['cell']);
        $this->assertSame('/me/recommendations/friends?limit=4', $aBlocks[$iSuggestions]['endpoint']);
        $this->assertTrue($aBlocks[$iSuggestions]['paged']);
        $this->assertSame(['phone', 'tablet'], $aBlocks[$iSuggestions]['design']['hidden_on']);
        $this->assertSame(['title' => true, 'bg' => true, 'padding' => true], $aBlocks[$iSuggestions]['design']['frame']);

        $this->assertArrayHasKey($iFriends, $aBlocks);
        $this->assertSame('graph.friends', $aBlocks[$iFriends]['kind']);
        $this->assertSame('/profiles/' . $iViewer . '/friends?limit=' . BxBaseApiV2Layout::SIDE_LIMIT, $aBlocks[$iFriends]['endpoint']);

        foreach (['guests only' => $iGuestsOnly, 'another profile\'s friends' => $iAnothersFriends, 'HTML' => $iHtml, 'a menu' => $iMenu, 'off in the apps' => $iWebOnly, 'taken off the page' => $iOff] as $sWhat => $iId)
            $this->assertArrayNotHasKey($iId, $aBlocks, $sWhat . ' is left out');

        // the order of the cell is the page's
        $aIds = array_map('intval', array_column($aPage['cells'][array_search($sCell, array_column($aPage['cells'], 'name'), true)]['blocks'], 'id'));
        $this->assertLessThan(array_search($iFriends, $aIds, true), array_search($iSuggestions, $aIds, true));

        // a guest: neither the members' blocks nor the guests' one, whose route needs a sign-in
        $aGuest = self::blocks($this->resolve([], '/'));
        foreach ([$iSuggestions, $iGuestsOnly, $iFriends] as $iId)
            $this->assertArrayNotHasKey($iId, $aGuest);
    }

    public function testTextBlocks(): void
    {
        [, $sToken] = $this->userToken();
        $aMember = ['Authorization' => 'Bearer ' . $sToken];
        [$iCell] = $this->sideCell();

        $iLang = $this->addBlock($iCell, '_sys_page_lang_block_about', ['type' => 'lang', 'title' => '_sys_page_block_title_about']);
        $iHtml = $this->addBlock($iCell, '<p>Welcome to {site_title}</p>', ['type' => 'html']);
        $iMembers = $this->addBlock($iCell, '<p>Members only</p>', ['type' => 'html', 'visible_for_levels' => 2147483646]);
        $iRaw = $this->addBlock($iCell, '<script>x()</script>', ['type' => 'raw']);
        $iWebOnly = $this->addBlock($iCell, '<p>Web</p>', ['type' => 'html', 'active_api' => 0, 'active' => 1]);

        $aBlocks = self::blocks($this->resolve($aMember, '/'));
        foreach ([$iLang, $iHtml, $iMembers] as $iId) {
            $this->assertArrayHasKey($iId, $aBlocks);
            $this->assertSame('text.html', $aBlocks[$iId]['kind']);
            $this->assertSame('/layout/blocks/' . $iId . '/text', $aBlocks[$iId]['endpoint']);
            $this->assertFalse($aBlocks[$iId]['paged']);
        }
        $this->assertArrayNotHasKey($iRaw, $aBlocks, 'raw code is left out');
        $this->assertArrayNotHasKey($iWebOnly, $aBlocks);

        // the language string, and the HTML with its markers filled in
        $a = $this->http('GET', 'layout/blocks/' . $iLang . '/text', $aMember);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('BlockText', $a['json']);
        $this->assertSame((string)$iLang, $a['json']['id']);
        $this->assertSame(_t('_sys_page_block_title_about'), $a['json']['title']);
        $this->assertNotSame('', trim($a['json']['html']));
        $a = $this->http('GET', 'layout/blocks/' . $iHtml . '/text', []);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSame('<p>Welcome to ' . getParam('site_title') . '</p>', $a['json']['html']);

        // members only, raw code, off in the apps, a service block, no block: 404
        $this->assertSame(200, $this->http('GET', 'layout/blocks/' . $iMembers . '/text', $aMember)['status']);
        $this->assertSame(404, $this->http('GET', 'layout/blocks/' . $iMembers . '/text', [])['status'], 'a guest may not see it');
        foreach ([$iRaw, $iWebOnly, 999999999] as $iId)
            $this->assertSame(404, $this->http('GET', 'layout/blocks/' . $iId . '/text', $aMember)['status']);
        $iService = $this->addBlock($iCell, self::service('system', 'browse_friends', [0], 'TemplServiceProfiles'));
        $this->assertSame(404, $this->http('GET', 'layout/blocks/' . $iService . '/text', $aMember)['status']);
    }

    public function testHiddenOnAndPlatforms(): void
    {
        [, $sToken] = $this->userToken();
        $aMember = ['Authorization' => 'Bearer ' . $sToken];
        [$iCell] = $this->sideCell();

        $sContent = self::service('system', 'browse_recommendations_friends', [], 'TemplServiceProfiles');
        $iEverywhereOnTheWeb = $this->addBlock($iCell, $sContent, ['hidden_on' => 7]);
        $iInTheMobileApp = $this->addBlock($iCell, $sContent, ['hidden_on' => 8, 'title_hidden_on' => 1, 'bg_hidden_on' => 2]);
        $iNoTitle = $this->addBlock($iCell, $sContent, ['designbox_id' => 13, 'title_hidden_on' => 1]);

        $aDesktop = self::blocks($this->resolve($aMember, '/', 'desktop-app'));
        $this->assertArrayNotHasKey($iEverywhereOnTheWeb, $aDesktop);
        $this->assertArrayHasKey($iInTheMobileApp, $aDesktop);
        $this->assertSame(['mobile-app'], $aDesktop[$iInTheMobileApp]['design']['hidden_on']);
        $this->assertSame(['phone'], $aDesktop[$iInTheMobileApp]['design']['title_hidden_on']);
        $this->assertSame(['tablet'], $aDesktop[$iInTheMobileApp]['design']['bg_hidden_on']);
        // design box 13 has no title: its title's screens are none
        $this->assertFalse($aDesktop[$iNoTitle]['design']['frame']['title']);
        $this->assertSame([], $aDesktop[$iNoTitle]['design']['title_hidden_on']);

        $this->assertArrayNotHasKey($iEverywhereOnTheWeb, self::blocks($this->resolve($aMember, '/', 'web')));

        $aNative = self::blocks($this->resolve($aMember, '/', 'mobile-app'));
        $this->assertArrayHasKey($iEverywhereOnTheWeb, $aNative);
        $this->assertArrayNotHasKey($iInTheMobileApp, $aNative);
    }

    public function testBlocksOfModulesThatAreNotEnabledAreLeftOut(): void
    {
        [, $sToken] = $this->userToken();
        $aMember = ['Authorization' => 'Bearer ' . $sToken];
        [$iCell] = $this->sideCell();
        $this->assertFalse(BxDolModuleQuery::getInstance()->isEnabledByName('bx_apiv2_absent'));

        $iBlockOfAbsent = $this->addBlock($iCell, self::service('system', 'browse_recommendations_friends', [], 'TemplServiceProfiles'), ['module' => 'bx_apiv2_absent']);
        $iCallToAbsent = $this->addBlock($iCell, self::service('bx_apiv2_absent', 'browse_featured'));
        $iPresent = $this->addBlock($iCell, self::service('system', 'browse_recommendations_friends', [], 'TemplServiceProfiles'));

        $aBlocks = self::blocks($this->resolve($aMember, '/'));
        $this->assertArrayNotHasKey($iBlockOfAbsent, $aBlocks);
        $this->assertArrayNotHasKey($iCallToAbsent, $aBlocks);
        $this->assertArrayHasKey($iPresent, $aBlocks);

        if (BxDolModuleQuery::getInstance()->isEnabledByName('bx_posts')) {
            $iFeatured = $this->addBlock($iCell, self::service('bx_posts', 'browse_featured', ['showcase']), ['module' => 'bx_posts']);
            $iUnknownSort = $this->addBlock($iCell, self::service('bx_posts', 'browse_by_label'), ['module' => 'bx_posts']);
            $aBlocks = self::blocks($this->resolve([], '/'));
            $this->assertSame('posts.list', $aBlocks[$iFeatured]['kind'] ?? null, 'Featured posts, for guests too');
            $this->assertSame('/posts?sort=featured&limit=' . BxBaseApiV2Layout::SIDE_LIMIT, $aBlocks[$iFeatured]['endpoint']);
            $this->assertSame('bx_posts', $aBlocks[$iFeatured]['module']);
            $this->assertArrayNotHasKey($iUnknownSort, $aBlocks);
        }
    }

    public function testPathsAndRefusals(): void
    {
        $this->assertSame(['home', []], BxBaseApiV2Layout::pageOf('/'));
        $this->assertSame(['home', []], BxBaseApiV2Layout::pageOf('/index.php'));
        $this->assertSame(['explore', []], BxBaseApiV2Layout::pageOf('/page/explore'));
        $this->assertSame(['explore', ['id' => '3']], BxBaseApiV2Layout::pageOf('/page.php?i=explore&id=3'));
        $this->assertSame(['dashboard', ['tab' => 'a']], BxBaseApiV2Layout::pageOf('/dashboard?tab=a&Bad-Key=1'));

        $this->assertSame(422, $this->http('GET', 'layout/resolve?path=home')['status']);
        $this->assertSame(422, $this->http('GET', 'layout/resolve?path=%2F&platform=tv')['status']);
        $this->assertSame(404, $this->http('GET', 'layout/resolve?path=' . rawurlencode('/page/no-such-page-apiv2'))['status']);
        $this->assertSame(404, $this->http('GET', 'layout/resolve?path=' . rawurlencode('/a/b/c'))['status']);

        // a page for administrators only is no page to others
        $aAdminPage = BxDolDb::getInstance()->getRow("SELECT `uri` FROM `sys_objects_page` WHERE `visible_for_levels` = 192 AND `uri` <> '' LIMIT 1");
        if ($aAdminPage)
            $this->assertSame(404, $this->http('GET', 'layout/resolve?path=' . rawurlencode('/page/' . $aAdminPage['uri']))['status']);
    }

    public function testLayouts(): void
    {
        $fColumns = function (array $aNames) {
            $a = [];
            foreach ($aNames as $i => $sName)
                $a[$i + 1] = ['name' => $sName, 'width' => '1'];
            return $a;
        };
        $this->assertSame(['single', [1 => 'main']], BxBaseApiV2Layout::layoutOf($fColumns(['center'])));
        $this->assertSame(['sidebar_right', [1 => 'top', 2 => 'main', 3 => 'side']], BxBaseApiV2Layout::layoutOf($fColumns(['top', 'center', 'right'])));
        $this->assertSame(['sidebar_left', [1 => 'side', 2 => 'main']], BxBaseApiV2Layout::layoutOf($fColumns(['left', 'center'])));
        $this->assertSame(['three_columns', [1 => 'top', 2 => 'left', 3 => 'main', 4 => 'right', 5 => 'bottom']], BxBaseApiV2Layout::layoutOf($fColumns(['top', 'left', 'center', 'right', 'bottom'])));
        // two halves without a center: the left one is the main one
        $this->assertSame(['sidebar_right', [1 => 'main', 2 => 'side']], BxBaseApiV2Layout::layoutOf($fColumns(['left', 'right'])));
        $this->assertSame(['single', [1 => 'main', 2 => 'cell_2']], BxBaseApiV2Layout::layoutOf([], 2));

        $this->assertTrue(BxBaseApiV2Layout::hiddenEverywhere(7, 'desktop-app'));
        $this->assertFalse(BxBaseApiV2Layout::hiddenEverywhere(3, 'web'));
        $this->assertFalse(BxBaseApiV2Layout::hiddenEverywhere(7, 'mobile-app'));
        $this->assertTrue(BxBaseApiV2Layout::hiddenEverywhere(8, 'mobile-app'));
    }

    public function testSuggestions(): void
    {
        [$iViewer, $sToken] = $this->userToken();
        $aMember = ['Authorization' => 'Bearer ' . $sToken];

        foreach (['friends', 'follows'] as $sList) {
            $this->assertSame(401, $this->http('GET', 'me/recommendations/' . $sList)['status']);

            $a = $this->http('GET', 'me/recommendations/' . $sList . '?limit=2', $aMember);
            $this->assertSame(200, $a['status'], $a['body']);
            $this->assertSchema('Page_Suggestion', $a['json']);
            $this->assertLessThanOrEqual(2, count($a['json']['items']));
            foreach ($a['json']['items'] as $aItem) {
                $this->assertNotSame((string)$iViewer, $aItem['profile']['id']);
                $this->assertSame('active', $aItem['profile']['status']);
            }
        }

        // the site's own suggestions for the viewer, in its order, page after page
        $oRecommendation = BxDolRecommendation::getObjectInstance('sys_friends');
        if (!$oRecommendation)
            return;
        $aRows = $oRecommendation->getList($iViewer, ['start' => 0, 'per_page' => 4]);
        $aSeen = [];
        $sCursor = null;
        do {
            $a = $this->http('GET', 'me/recommendations/friends?limit=2' . ($sCursor ? '&cursor=' . rawurlencode($sCursor) : ''), $aMember);
            $this->assertSame(200, $a['status'], $a['body']);
            foreach ($a['json']['items'] as $aItem)
                $aSeen[] = (int)$aItem['profile']['id'];
            $sCursor = $a['json']['next_cursor'];
        } while ($sCursor && count($aSeen) < 4);
        $aActive = array_values(array_filter(array_map('intval', array_keys(is_array($aRows) ? $aRows : [])), function ($i) use ($iViewer) {
            return $i !== (int)$iViewer && ($o = BxDolProfile::getInstance($i)) && $o->isActive();
        }));
        $this->assertSame(array_slice($aActive, 0, count($aSeen)), array_slice($aSeen, 0, count($aActive)));
    }

    /** The blocks of a page's answer by kind: kind => [block, ...]. */
    protected static function byKind(array $aPage): array
    {
        $a = [];
        foreach (self::blocks($aPage) as $aBlock)
            $a[$aBlock['kind']][] = $aBlock;
        return $a;
    }

    public function testProfilePageHasInfoAndFriendsWhereTheSiteHasThem(): void
    {
        $this->requireModule('bx_persons');
        [$iViewer, $sToken] = $this->userToken();
        $aMember = ['Authorization' => 'Bearer ' . $sToken];
        $oProfile = BxDolProfile::getInstance($iViewer);
        $this->assertSame('bx_persons', $oProfile->getModule(), 'the test user acts as a person');
        $iContent = (int)$oProfile->getContentId();

        $aPage = $this->resolve($aMember, '/page/view-persons-profile?id=' . $iContent);
        $this->assertSame('/page/view-persons-profile', $aPage['uri']);
        $this->assertSame(['id' => (string)$iContent], $aPage['params']);
        $this->assertStringNotContainsString('{', $aPage['title'], 'the page\'s markers are not sent');
        $aKinds = self::byKind($aPage);

        $this->assertArrayHasKey('profile.info', $aKinds);
        $aInfo = $aKinds['profile.info'][0];
        $this->assertSame('/profiles/' . $iViewer . '/info', $aInfo['endpoint']);
        $this->assertSame('side', $aInfo['cell']);
        $this->assertSame([], $aInfo['design']['hidden_on'], 'Info shows on phones too');

        $this->assertArrayHasKey('graph.friends', $aKinds);
        $aFriends = $aKinds['graph.friends'][0];
        // Friends is where the site's page has it: as installed in the main column, on every screen
        // (API v2 changes no block of the site's pages), so it is a whole page of friends, not a side block's few
        $this->assertSame('/profiles/' . $iViewer . '/friends', $aFriends['endpoint']);
        $this->assertSame('main', $aFriends['cell'], 'Friends is in the main column, as on the site');
        $this->assertSame([], $aFriends['design']['hidden_on'], 'Friends shows on phones too, as on the site');

        // the same page by the profile's id, and by its SEO link (the profile's url), to a guest too
        $this->assertSame('/profiles/' . $iViewer . '/info', self::byKind($this->resolve($aMember, '/page/view-persons-profile?profile_id=' . $iViewer))['profile.info'][0]['endpoint']);
        $sUrl = (string)(BxDolApiV2Map::profile($iViewer)['url'] ?? '');
        $sPath = (string)parse_url($sUrl, PHP_URL_PATH) . (parse_url($sUrl, PHP_URL_QUERY) ? '?' . parse_url($sUrl, PHP_URL_QUERY) : '');
        if ($sPath !== '') {
            $aSeo = $this->resolve([], $sPath);
            $this->assertSame((string)$iContent, $aSeo['params']['id'] ?? null, $sPath);
            $this->assertSame('/profiles/' . $iViewer . '/info', self::byKind($aSeo)['profile.info'][0]['endpoint'] ?? null);
        }
        $this->assertSame(404, $this->http('GET', 'layout/resolve?path=' . rawurlencode('/view-persons-profile/no-such-seo-link-apiv2'))['status']);

        // no profile on the page: its profile blocks are left out
        $this->assertArrayNotHasKey('profile.info', self::byKind($this->resolve($aMember, '/page/view-persons-profile')));
    }

    public function testContextPageHasInfoAndMembers(): void
    {
        $this->requireModule('bx_groups');
        [$iViewer, $sToken] = $this->userToken();
        $aMember = ['Authorization' => 'Bearer ' . $sToken];
        $iGroupProfile = $this->seedAnyPublicGroup();
        $aGroup = ['id' => (string)$iGroupProfile, 'content_id' => (string)BxDolProfile::getInstance($iGroupProfile)->getContentId()];

        $aKinds = self::byKind($this->resolve($aMember, '/page/view-group-profile?id=' . $aGroup['content_id']));
        $this->assertSame('/profiles/' . $aGroup['id'] . '/info', $aKinds['profile.info'][0]['endpoint'] ?? null);
        $this->assertSame('/groups/' . $aGroup['id'] . '/members?limit=' . BxBaseApiV2Layout::SIDE_LIMIT, $aKinds['groups.members'][0]['endpoint'] ?? null);
        $this->assertSame([], $aKinds['groups.members'][0]['design']['hidden_on'], 'Members shows on phones too, as on the site');
        $this->assertSame('bx_groups', $aKinds['groups.members'][0]['module']);

        // another module's profile named on the page: no Members of it
        $this->assertArrayNotHasKey('groups.members', self::byKind($this->resolve($aMember, '/page/view-group-profile?profile_id=' . $iViewer)));

        $a = $this->http('GET', 'groups/' . $aGroup['id'] . '/members?limit=2', $aMember);
        if ($a['status'] === 200)
            $this->assertSchema('Page_Member', $a['json']);
        else
            $this->assertSame(403, $a['status'], $a['body']);
    }

    public function testModuleHomePagesHaveCategoriesAndNoFeatured(): void
    {
        [, $sToken] = $this->userToken();
        $aMember = ['Authorization' => 'Bearer ' . $sToken];
        $iChecked = 0;
        foreach (['bx_posts' => ['posts-home', 'posts'], 'bx_forum' => ['discussions-home', 'discussions']] as $sModule => list($sUri, $sTag)) {
            if (!BxDolModuleQuery::getInstance()->isEnabledByName($sModule))
                continue;
            ++$iChecked;
            $aKinds = self::byKind($this->resolve($aMember, '/page/' . $sUri));
            $this->assertSame('/' . $sTag . '/categories?counts=true', $aKinds[$sTag . '.categories'][0]['endpoint'] ?? null, $sUri);
            $this->assertSame('side', $aKinds[$sTag . '.categories'][0]['cell']);
            $this->assertFalse($aKinds[$sTag . '.categories'][0]['paged']);
            // Featured is on the site only (the apps list the latest entries): a block switched on in
            // Studio > Pages for the apps is mapped by testBlocksOfModulesThatAreNotEnabledAreLeftOut's kind.
            $aFeatured = array_filter($aKinds[$sTag . '.list'] ?? [], function ($a) { return str_contains((string)$a['endpoint'], 'sort=featured'); });
            $this->assertEmpty($aFeatured, $sUri . ': Featured stays on the site');

            // to guests too: both routes take them
            $this->assertArrayHasKey($sTag . '.categories', self::byKind($this->resolve([], '/page/' . $sUri)));
        }
        if (!$iChecked)
            $this->markTestSkipped('Neither Posts nor Discussions is installed.');

        // a module's menu block it does not map is left out
        if (BxDolModuleQuery::getInstance()->isEnabledByName('bx_posts')) {
            [$iCell] = $this->sideCell();
            $iMenu = $this->addBlock($iCell, 'bx_posts_submenu', ['type' => 'menu', 'module' => 'bx_posts']);
            $iCategories = $this->addBlock($iCell, 'bx_posts_categories', ['type' => 'menu', 'module' => 'bx_posts']);
            $aBlocks = self::blocks($this->resolve($aMember, '/'));
            $this->assertArrayNotHasKey($iMenu, $aBlocks);
            $this->assertSame('posts.categories', $aBlocks[$iCategories]['kind'] ?? null);
        }
    }

    public function testProfileInfo(): void
    {
        [$iViewer, $sToken] = $this->userToken();
        $aMember = ['Authorization' => 'Bearer ' . $sToken];

        $a = $this->http('GET', 'profiles/' . $iViewer . '/info', $aMember);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('ProfileInfo', $a['json']);
        $oModule = BxDolModule::getInstance(BxDolProfile::getInstance($iViewer)->getModule());
        $sName = (string)($oModule->_oConfig->CNF['FIELD_NAME'] ?? '');
        foreach ($a['json']['fields'] as $aField) {
            $this->assertNotSame($sName, $aField['name'], 'the name is the page\'s heading');
            $this->assertNotSame('', $aField['value']);
            $this->assertStringNotContainsString('<', $aField['label'] . $aField['value']);
        }

        $this->assertSame(404, $this->http('GET', 'profiles/999999999/info')['status']);

        // a group's Info, to a guest: the module's own view check (a closed group's shows from outside, as on the site)
        $iGroup = BxDolModuleQuery::getInstance()->isEnabledByName('bx_groups') ? $this->seedAnyPublicGroup() : 0;
        if ($iGroup) {
            $a = $this->http('GET', 'profiles/' . $iGroup . '/info');
            $this->assertContains($a['status'], [200, 403, 404], $a['body']);
            if ($a['status'] === 200)
                $this->assertSchema('ProfileInfo', $a['json']);
        }
    }

    public function testCategoriesWithCounts(): void
    {
        $iChecked = 0;
        foreach (['bx_posts' => ['posts/categories', null], 'bx_forum' => ['discussions/categories', 'categories']] as $sModule => list($sRoute, $sKey)) {
            if (!BxDolModuleQuery::getInstance()->isEnabledByName($sModule))
                continue;
            ++$iChecked;
            $aPlain = $this->http('GET', $sRoute);
            $this->assertSame(200, $aPlain['status'], $aPlain['body']);
            $aList = $sKey ? $aPlain['json'][$sKey] : $aPlain['json'];
            foreach ($aList as $aCategory)
                $this->assertArrayNotHasKey('count', $aCategory);

            $aCounted = $this->http('GET', $sRoute . '?counts=true');
            $this->assertSame(200, $aCounted['status'], $aCounted['body']);
            $aCountedList = $sKey ? $aCounted['json'][$sKey] : $aCounted['json'];
            $this->assertSame(array_column($aList, 'id'), array_column($aCountedList, 'id'));

            // the site's own count of each, as its Categories block has it (a query per category there), for a guest
            $CNF = &BxDolModule::getInstance($sModule)->_oConfig->CNF;
            $oCategory = BxDolCategory::getObjectInstance($CNF['OBJECT_CATEGORY']);
            foreach ($aCountedList as $aCategory)
                $this->assertSame((int)$oCategory->getItemsNum($aCategory['id']), $aCategory['count'], $sRoute . ' ' . $aCategory['id']);

            $this->assertSame(422, $this->http('GET', $sRoute . '?counts=maybe')['status']);
        }
        if (!$iChecked)
            $this->markTestSkipped('Neither Posts nor Discussions is installed.');
    }

    public function testFeaturedDiscussions(): void
    {
        $this->requireModule('bx_forum');
        $a = $this->http('GET', 'discussions?sort=featured&limit=50');
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Page_Discussion', $a['json']);
        $aFeatured = array_map('strval', BxDolDb::getInstance()->getColumn("SELECT `id` FROM `bx_forum_discussions` WHERE `featured` <> 0"));
        foreach ($a['json']['items'] as $aItem)
            $this->assertContains($aItem['id'], $aFeatured);
        $this->assertSame(422, $this->http('GET', 'discussions?sort=hot')['status']);
    }
}
