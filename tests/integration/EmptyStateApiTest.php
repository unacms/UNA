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
            $this->assertSame(_t('_Empty'), $aFirst['empty_state']['title']);
            $this->assertArrayNotHasKey('buttons', $aFirst['empty_state'], 'A guest is offered no add button.');
        }
        else {
            $this->assertArrayNotHasKey('empty_state', $aFirst, 'A page of items does not work out an empty state.');
        }

        $this->assertArrayNotHasKey('empty_state', $this->browsePosts(1000000), 'A later page never shows one.');
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
}
