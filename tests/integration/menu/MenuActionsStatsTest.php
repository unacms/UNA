<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * A content page's actions and their stats row on the site (`menu_actions_stats.html`), and the counters an action
 * shows its count with: as text when the count is the action's label, the number alone for comments.
 */
#[Group('integration')]
class MenuActionsStatsTest extends BxDolIntegrationTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        if(!BxDolModuleQuery::getInstance()->isEnabledByName('bx_posts'))
            $this->markTestSkipped('Posts are not installed.');
    }

    protected int $_iPostId = 0;

    protected function tearDown(): void
    {
        if($this->_iPostId) {
            $oDb = BxDolDb::getInstance();
            $oDb->query("DELETE FROM `bx_posts_posts` WHERE `id` = :id", ['id' => $this->_iPostId]);
            $oDb->cleanMemoryAll();
            $this->_iPostId = 0;
        }

        parent::tearDown();
    }

    /** A post of the test's own, with the given views and comments counted on it (the counts the counters read). */
    protected function addPost(int $iViews, int $iComments): int
    {
        $iAuthor = (int)BxDolProfile::getInstanceAccountProfile($this->bxAccount('admin')->id())->id();
        $iNow = time();

        $oDb = BxDolDb::getInstance();
        $oDb->query("INSERT INTO `bx_posts_posts` SET " . $oDb->arrayToSQL([
            'author' => $iAuthor,
            'added' => $iNow,
            'changed' => $iNow,
            'published' => $iNow,
            'thumb' => 0,
            'thumb_data' => '',
            'title' => 'MenuActionsStatsTest post',
            'cat' => 0,
            'multicat' => '',
            'abstract' => '',
            'text' => '<p>MenuActionsStatsTest</p>',
            'labels' => '',
            'location' => '',
            'allow_view_to' => BX_DOL_PG_ALL,
            'status' => 'active',
            'status_admin' => 'active',
            'views' => $iViews,
            'comments' => $iComments,
        ]));
        $this->_iPostId = (int)$oDb->lastId();
        $oDb->cleanMemoryAll();

        return $this->_iPostId;
    }

    /** The posts' actions menu for a post, with the given Counters. */
    protected function actionsMenu(int $iId, string $sCounters): BxBaseModGeneralMenuViewActions
    {
        $oMenu = BxDolMenu::getObjectInstance('bx_posts_view_actions');
        $this->assertInstanceOf(BxBaseModGeneralMenuViewActions::class, $oMenu);

        $oMenu = clone $oMenu;
        $oProp = new ReflectionProperty($oMenu, '_aObject');
        $oProp->setValue($oMenu, array_merge($oProp->getValue($oMenu), ['counters' => $sCounters]));
        $oMenu->setContentId($iId);

        // The menu reads its template's markup when it is made, which a test may do before the template is ready.
        $oTmpl = new ReflectionProperty($oMenu, '_sTmplContent');
        if($oTmpl->getValue($oMenu) == '')
            $oTmpl->setValue($oMenu, BxDolTemplate::getInstance()->getHtml($oMenu->getTemplateName()));

        return $oMenu;
    }

    public function testViewCountAsLabelIsText(): void
    {
        $this->bxLoginAsAdmin();
        $iId = $this->addPost(3, 0);

        $oView = BxDolView::getObjectInstance('bx_posts', $iId);
        $this->assertNotNull($oView);

        $sText = $oView->getCounter(['show_counter_active' => false]);
        $this->assertStringNotContainsString('toggleByPopup', $sText, 'A count that is the action\'s label opens no list.');

        if($oView->isAllowedViewViewViewers())
            $this->assertStringContainsString('toggleByPopup', $oView->getCounter(), 'A count of its own opens who viewed.');
    }

    public function testCommentsCountNumberOnly(): void
    {
        $this->bxLoginAsAdmin();
        $iId = $this->addPost(0, 2);

        $oCmts = BxDolCmts::getObjectInstance('bx_posts', $iId);
        $this->assertNotNull($oCmts);

        $sCounter = $oCmts->getCounter(['show_counter' => true, 'show_counter_number_only' => true, 'show_script' => false]);
        $this->assertStringNotContainsString('<img', $sCounter, 'No commenters\' avatars beside the number.');
        $sText = trim(strip_tags(preg_replace('#<script\b.*?</script>#s', '', $sCounter)));
        $this->assertSame((string)$oCmts->getCommentsCountAll(), $sText, 'The counter is the number alone.');
    }

    public function testStatsRowFollowsCounters(): void
    {
        $this->bxLoginAsAdmin();
        $iId = $this->addPost(3, 0);

        $sGroup = $this->actionsMenu($iId, 'group')->getCode();
        $this->assertStringNotContainsString('bx-menu-actions-stats', (string)$sGroup, 'Button groups have no stats row.');

        $sLabel = $this->actionsMenu($iId, 'label')->getCode();
        $this->assertStringContainsString('bx-menu-actions-stats-stats', (string)$sLabel, 'Labels have their counts in a stats row.');
        $this->assertMatchesRegularExpression('/bx-menu-actions-stats-stats[^>]*>.*sys-action-counter/s', (string)$sLabel, 'The views count is in it.');

        $sCount = $this->actionsMenu($iId, 'count')->getCode();
        $sStats = preg_match('/bx-menu-actions-stats-stats[^>]*>(.*)$/s', (string)$sCount, $m) ? $m[1] : '';
        $this->assertStringNotContainsString('bx-view-counter', $sStats, 'Beside counts the views count is on its action, not in the stats.');
    }
}
