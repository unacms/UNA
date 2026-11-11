<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Empty states for API clients (BxDolEmptyState): a module's default, a page block's "empty" app
 * config over it, language keys resolved, and only the site's own links.
 */
#[Group('integration')]
class EmptyStateApiTest extends BxDolIntegrationTestCase
{
    protected function tearDown(): void
    {
        BxDolPage::unsetBlockProcessing();
        parent::tearDown();
    }

    public function testKeysAreResolvedAndOnlySiteLinksKept(): void
    {
        $a = BxDolEmptyState::resolve([
            'title' => '_Empty',
            'text' => 'Plain <b>text</b>',
            'buttons' => [
                ['title' => 'Add', 'link' => 'page.php?i=create-post'],
                ['title' => 'Script', 'link' => 'javascript:alert(1)'],
                ['title' => 'Elsewhere', 'link' => 'https://elsewhere.example/x'],
                ['title' => 'Absolute', 'link' => BX_DOL_URL_ROOT . 'page.php?i=create-post'],
                ['title' => '', 'link' => 'page.php?i=create-post'],
            ],
        ]);

        $this->assertSame(_t('_Empty'), $a['title']);
        $this->assertSame('Plain text', $a['text'], 'Markup is not passed on.');
        $this->assertSame(['Add', 'Absolute'], array_column($a['buttons'], 'title'), 'Scripts, other hosts and untitled buttons are dropped.');
        $this->assertSame(['primary', 'secondary'], array_column($a['buttons'], 'style'));
        $this->assertStringStartsWith('/', $a['buttons'][0]['link'], 'Links are relative to the site, as the apps open them.');
        $this->assertNull(BxDolEmptyState::resolve(['title' => '', 'buttons' => []]), 'Nothing to say is null.');
    }

    public function testOnlyKnownActionsArePassedOn(): void
    {
        $a = BxDolEmptyState::resolve(['buttons' => [
            ['title' => 'Compose', 'link' => 'page.php?i=create-post', 'action' => 'compose'],
            ['title' => 'Create', 'link' => 'page.php?i=create-post', 'action' => 'create_menu'],
            ['title' => 'Other', 'link' => 'page.php?i=create-post', 'action' => 'delete_everything'],
        ]]);
        $this->assertSame(['compose', 'create_menu'], [$a['buttons'][0]['action'], $a['buttons'][1]['action']]);
        $this->assertArrayNotHasKey('action', $a['buttons'][2], 'An action the apps do not know is dropped; the link stays.');
    }

    public function testAtMostThreeButtons(): void
    {
        $aButtons = array_fill(0, 5, ['title' => 'Add', 'link' => 'page.php?i=create-post']);
        $this->assertCount(BxDolEmptyState::MAX_BUTTONS, BxDolEmptyState::resolve(['buttons' => $aButtons])['buttons']);
    }

    public function testBlockConfigOverridesTheDefaultKeyByKey(): void
    {
        $aDefault = ['title' => '_Empty', 'text' => 'Default text', 'buttons' => [['title' => 'Default', 'link' => 'page.php?i=create-post']]];

        BxDolPage::setBlockProcessing(['config_api' => ['empty' => ['text' => 'From Studio', 'buttons' => []]]]);
        $a = BxDolEmptyState::forApi($aDefault);
        $this->assertSame(_t('_Empty'), $a['title'], 'A key the block leaves out keeps the default.');
        $this->assertSame('From Studio', $a['text']);
        $this->assertArrayNotHasKey('buttons', $a, 'An empty list of buttons shows none.');

        BxDolPage::setBlockProcessing(['config_api' => 'not decoded']);
        $this->assertSame('Default text', BxDolEmptyState::forApi($aDefault)['text'], 'A config that is not JSON leaves the default.');
    }

    public function testTimelineFeedForAGuestHasNoButton(): void
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_timeline'))
            $this->markTestSkipped('Timeline is not installed.');

        $this->bxBecomeGuest();
        $a = BxDolModule::getInstance('bx_timeline')->getEmptyStateApi();
        $this->assertSame(_t('_bx_timeline_txt_empty_feed_title'), $a['title']);
        $this->assertArrayNotHasKey('text', $a);
        $this->assertArrayNotHasKey('buttons', $a, 'A guest cannot post.');
    }

    public function testBrowseResponseCarriesTheEmptyStateOnlyWhereTheListIsEmpty(): void
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_posts'))
            $this->markTestSkipped('Posts is not installed.');

        $this->bxBecomeGuest();
        $aFirst = $this->browsePosts(0);
        if (empty($aFirst['data'])) {
            $this->assertSame(_t('_bx_posts_txt_empty_title'), $aFirst['empty_state']['title'], 'The module\'s own title.');
            $this->assertArrayNotHasKey('buttons', $aFirst['empty_state'], 'A guest is offered no add button.');
        }
        else {
            $this->assertArrayNotHasKey('empty_state', $aFirst, 'A page of items does not work out an empty state.');
        }

        $this->assertArrayNotHasKey('empty_state', $this->browsePosts(1000000), 'A later page never shows one.');
    }

    /**
     * An empty channel list says how channels appear, for the list it is, and offers no button:
     * channels come from hashtags, not from an add form.
     */
    public function testEmptyChannelListExplainsHowChannelsAppear(): void
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_channels'))
            $this->markTestSkipped('Channels is not installed.');

        BxDolModule::getInstance('bx_channels');
        bx_import('SearchResult', 'bx_channels');
        $fState = fn($sMode, $aParams = []) => BxDolEmptyState::resolve((new BxCnlSearchResult($sMode, $aParams))->getEmptyStateApi());

        $aLevel = $fState('level', ['level' => 0]);
        $this->assertSame(_t('_bx_channels_txt_empty_title'), $aLevel['title']);
        $this->assertSame(_t('_bx_channels_txt_empty_text_level'), $aLevel['text']);
        $this->assertArrayNotHasKey('buttons', $aLevel);

        $this->assertSame(_t('_bx_channels_txt_empty_text'), $fState('recent')['text']);
        $this->assertSame(_t('_bx_channels_txt_empty_text_favorite'), $fState('favorite', ['user' => 0])['text']);
    }

    private function browsePosts(int $iStart): array
    {
        $o = BxDolModule::getInstance('bx_posts');
        $this->bxSetProtected($o, '_bIsApi', true, BxBaseModGeneralModule::class);
        try {
            return $o->serviceBrowse(json_encode(['params' => ['type' => 'recent', 'start' => $iStart, 'per_page' => 1]]))[0]['data'];
        }
        finally {
            $this->bxSetProtected($o, '_bIsApi', false, BxBaseModGeneralModule::class);
        }
    }

    public function testEmptyNotificationsSayWhatShowsThere(): void
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_notifications'))
            $this->markTestSkipped('Notifications is not installed.');

        $this->bxLoginAsUser();
        $o = BxDolModule::getInstance('bx_notifications');
        $this->bxSetProtected($o, '_bIsApi', true, BxBaseModGeneralModule::class);
        try {
            // A module nobody posts from: the first page comes back empty.
            $aBlock = $o->serviceGetBlockView('', 0, 5, ['bx_no_such_module'])[0]['data'];
            $aLater = $o->serviceGetBlockView('', 7, 5, ['bx_no_such_module'])[0]['data'];
        }
        finally {
            $this->bxSetProtected($o, '_bIsApi', false, BxBaseModGeneralModule::class);
        }

        $this->assertSame([], $aBlock['data']);
        $this->assertSame(_t('_bx_ntfs_txt_empty_title'), $aBlock['empty_state']['title']);
        $this->assertSame(_t('_bx_ntfs_txt_empty_text'), $aBlock['empty_state']['text']);
        $this->assertArrayNotHasKey('empty_state', $aLater, 'A later page never shows one.');
    }

    public function testEmptyInvitationsSayWhatShowsThere(): void
    {
        $this->bxLoginAsUser();
        $o = new BxTemplServiceProfiles();
        // As a page block calls it (the Invitations tab's block, without an app config).
        BxDolPage::setBlockProcessing(['config_api' => []]);
        $this->bxSetProtected($o, '_bIsApi', true, BxBaseServiceProfiles::class);
        try {
            $aBlocks = $o->serviceBrowseInvitations(0, ['params' => ['modules' => ['bx_no_such_module']]]);
        }
        finally {
            $this->bxSetProtected($o, '_bIsApi', false, BxBaseServiceProfiles::class);
        }

        $aBlock = $aBlocks[0]['data'];
        $this->assertSame([], $aBlock['data']);
        $this->assertSame(_t('_sys_txt_empty_invitations_title'), $aBlock['empty_state']['title']);
        $this->assertArrayNotHasKey('buttons', $aBlock['empty_state']);
    }

    public function testPersonalListsExplainThemselvesWithoutAnAddButton(): void
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_posts'))
            $this->markTestSkipped('Posts is not installed.');

        $this->bxLoginAsUser();
        $oModule = BxDolModule::getInstance('bx_posts');
        bx_import('SearchResult', $oModule->_aModule);
        $o = new BxPostsSearchResult('recent');

        $iViewer = (int)bx_get_logged_profile_id();
        $aModes = [
            'favorite' => ['_sys_txt_empty_list_text_favorite', 'user'],
            'joined_entries' => ['_sys_txt_empty_list_text_joined', 'joined_profile'],
            'online' => ['_sys_txt_empty_list_text_online', ''],
        ];
        foreach ($aModes as $sMode => [$sKey, $sOwnerParam]) {
            $this->bxSetProtected($o, '_sMode', $sMode, BxDolSearchResult::class);
            $this->bxSetProtected($o, '_aParams', $sOwnerParam ? [$sOwnerParam => $iViewer] : [], BxBaseModGeneralSearchResult::class);
            $a = BxDolEmptyState::resolve($o->getEmptyStateApi());
            $this->assertSame(_t('_bx_posts_txt_empty_title'), $a['title'], $sMode . ': the module\'s own title.');
            $this->assertSame(_t($sKey), $a['text'], $sMode);
            $this->assertArrayNotHasKey('buttons', $a, $sMode . ': nothing to add there.');

            if ($sOwnerParam) {
                // A page block's `{profile_id}` marker: the list is the viewer's, as the list itself takes it.
                $this->bxSetProtected($o, '_aParams', [$sOwnerParam => '{profile_id}'], BxBaseModGeneralSearchResult::class);
                $this->assertSame(_t($sKey), BxDolEmptyState::resolve($o->getEmptyStateApi())['text'], $sMode . ' from a page block.');

                // Someone else's list: the line about how the viewer's own fills is not for it.
                $this->bxSetProtected($o, '_aParams', [$sOwnerParam => $iViewer + 1000000], BxBaseModGeneralSearchResult::class);
                $a = BxDolEmptyState::resolve($o->getEmptyStateApi());
                $this->assertArrayNotHasKey('text', $a, $sMode . ' of another profile.');
                $this->assertArrayNotHasKey('buttons', $a, $sMode . ' of another profile.');
            }
        }
    }

    public function testASearchThatFoundNothingSaysSo(): void
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_posts'))
            $this->markTestSkipped('Posts is not installed.');

        $o = BxDolSearchExtended::getObjectInstance('bx_posts');
        if (!$o)
            $this->markTestSkipped('Posts has no extended search.');

        $aFound = $o->getResultsAPI([], 0, 10, ['keyword' => 'nothing']);
        $this->assertSame(_t('_sys_txt_empty_search_title'), $aFound['data']['empty_state']['title']);

        $aBefore = $o->getResultsAPI([], 0, 10, '');
        $this->assertArrayNotHasKey('empty_state', $aBefore['data'], 'Before any search there is nothing to say.');
    }

    public function testTheAudienceIsNoSearchTermWithTheContentFilterOff(): void
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_groups'))
            $this->markTestSkipped('Groups is not installed.');
        if (BxDolContentFilter::getInstance()->isEnabled())
            $this->markTestSkipped('The content filter is on.');

        $o = BxDolSearchExtended::getObjectInstance('bx_groups');
        $this->bxSetProtected($o, '_bIsApi', true);
        $aBackup = $_POST;
        try {
            // As an app's filter form sends it: the hidden audience with its default, and a name.
            $_POST = ['group_name' => 'zz-nothing-zz', 'cf' => 1, 'searchbx_groups' => 'Search'];
            $aBlock = $o->getResults(['search_params' => ''])[0]['data'];
        }
        finally {
            $_POST = $aBackup;
            $this->bxSetProtected($o, '_bIsApi', false);
        }

        $this->assertArrayHasKey('group_name', $aBlock['params']['search_params']);
        $this->assertArrayNotHasKey('cf', $aBlock['params']['search_params'], 'With the filter off the audience narrows nothing.');
    }
}
