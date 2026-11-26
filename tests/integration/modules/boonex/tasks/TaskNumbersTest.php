<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Tasks have numbers as Linear has them (UNA-12): a counter per community, a prefix made from the
 * community's name, which its administrators may change while its former prefixes still find the
 * tasks, and SEO links which are the numbers (view-task/una-12).
 *
 * The communities are profile ids no profile has, so the test touches no real community. It
 * removes its tasks, the rows of its communities, their prefixes and SEO links.
 */
#[Group('integration')]
class TaskNumbersTest extends BxDolIntegrationTestCase
{
    /** @var BxTasksModule */
    protected $_oModule;
    protected $_iContextA = 0;
    protected $_iContextB = 0;
    protected $_aTaskIds = [];
    protected $_sSeoLinksBackup = null;

    protected function setUp(): void
    {
        parent::setUp();

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_tasks'))
            $this->markTestSkipped('Tasks is not installed.');

        $this->_oModule = BxDolModule::getInstance('bx_tasks');

        $iMax = (int)BxDolDb::getInstance()->getOne("SELECT MAX(`id`) FROM `sys_profiles`");
        $this->_iContextA = $iMax + 900000 + mt_rand(1, 99999);
        $this->_iContextB = $this->_iContextA + 1;
    }

    protected function tearDown(): void
    {
        $oDb = BxDolDb::getInstance();
        if ($this->_aTaskIds) {
            $sIds = $this->bxIdList($this->_aTaskIds);
            $oDb->query("DELETE FROM `bx_tasks_tasks` WHERE `id` IN (" . $sIds . ")");
            $oDb->query("DELETE FROM `bx_tasks_former_links` WHERE `content_id` IN (" . $sIds . ")");
            $oDb->query("DELETE FROM `sys_seo_links` WHERE `module` = 'bx_tasks' AND `param_name` = 'id' AND `param_value` IN ('" . implode("','", array_map('intval', $this->_aTaskIds)) . "')");
        }
        if ($this->_iContextA) {
            $sContexts = $this->bxIdList([$this->_iContextA, $this->_iContextB]);
            $oDb->query("DELETE FROM `bx_tasks_contexts` WHERE `id` IN (" . $sContexts . ")");
            $oDb->query("DELETE FROM `bx_tasks_prefixes` WHERE `context_id` IN (" . $sContexts . ")");
        }
        if ($this->_sSeoLinksBackup !== null)
            setParam('permalinks_seo_links', $this->_sSeoLinksBackup);

        parent::tearDown();
    }

    public function testPrefixIsMadeFromTheName()
    {
        $this->assertSame('UCT', $this->_oModule->getPrefixCandidates('UNA Core Team', 5)[0]);
        $this->assertSame('MAR', $this->_oModule->getPrefixCandidates('Marketing', 5)[0]);
        // Cyrillic, by code points: "Veb studiya"
        $this->assertSame('VS', $this->_oModule->getPrefixCandidates("\u{0412}\u{0435}\u{0431} \u{0441}\u{0442}\u{0443}\u{0434}\u{0438}\u{044F}", 5)[0]);
        $this->assertSame('CAF', $this->_oModule->getPrefixCandidates('Caf' . "\u{00E9}", 5)[0]);
        // nothing to make a prefix of: T and the community's id
        $this->assertSame(['T5'], $this->_oModule->getPrefixCandidates('2024 !!!', 5));

        $aCandidates = $this->_oModule->getPrefixCandidates('Marketing', 5);
        $this->assertContains('MARK', $aCandidates, 'A longer start follows a taken prefix.');
        $this->assertContains('MAR2', $aCandidates);
        foreach ($aCandidates as $sCandidate)
            $this->assertMatchesRegularExpression('/^[A-Z][A-Z0-9]{1,9}$/', $sCandidate);
    }

    public function testNumbersCountPerCommunityAndStayWithTheTask()
    {
        $sPrefixA = $this->bxPrefix();
        $sPrefixB = $this->bxPrefix();
        $this->assertTrue($this->_oModule->setContextPrefix($this->_iContextA, $sPrefixA));
        $this->assertTrue($this->_oModule->setContextPrefix($this->_iContextB, $sPrefixB));

        $iFirst = $this->bxTask($this->_iContextA);
        $iSecond = $this->bxTask($this->_iContextA);
        $iOther = $this->bxTask($this->_iContextB);

        $this->assertSame(1, $this->_oModule->assignNumber($iFirst));
        $this->assertSame(2, $this->_oModule->assignNumber($iSecond));
        $this->assertSame(1, $this->_oModule->assignNumber($iOther));
        $this->assertSame(0, $this->_oModule->assignNumber($iFirst), 'A task gets its number once.');

        $this->assertSame($sPrefixA . '-2', $this->_oModule->getIdentifier($iSecond));
        $this->assertSame($sPrefixB . '-1', $this->_oModule->getIdentifier($iOther));

        // moved to the other community, it keeps its number
        BxDolDb::getInstance()->query("UPDATE `bx_tasks_tasks` SET `allow_view_to` = :view WHERE `id` = :id", ['view' => '-' . $this->_iContextB, 'id' => $iSecond]);
        $this->assertSame($sPrefixA . '-2', $this->_oModule->getIdentifier($iSecond));
        $this->assertSame($iSecond, $this->_oModule->getContentIdByIdentifier(mb_strtolower($sPrefixA) . '-2'));
        $this->assertSame(2, $this->_oModule->assignNumber($this->bxTask($this->_iContextB)), 'The other community counts on.');
    }

    public function testPrefixIsMadeWithTheFirstTask()
    {
        $iTask = $this->bxTask($this->_iContextA);
        $this->assertSame(1, $this->_oModule->assignNumber($iTask));

        // no profile has the id: no name to make it of
        $this->assertSame('T' . $this->_iContextA . '-1', $this->_oModule->getIdentifier($iTask));
        $this->assertSame($this->_iContextA, (int)BxDolDb::getInstance()->getOne("SELECT `context_id` FROM `bx_tasks_prefixes` WHERE `prefix` = :prefix", ['prefix' => 'T' . $this->_iContextA]));
    }

    public function testFormerPrefixStaysTheCommunitys()
    {
        $sOld = $this->bxPrefix();
        $sNew = $this->bxPrefix();
        $this->assertTrue($this->_oModule->setContextPrefix($this->_iContextA, $sOld));
        $iTask = $this->bxTask($this->_iContextA);
        $this->_oModule->assignNumber($iTask);

        $this->assertFalse($this->_oModule->setContextPrefix($this->_iContextA, '1AB'), 'A prefix starts with a letter.');
        $this->assertFalse($this->_oModule->setContextPrefix($this->_iContextA, 'A'), 'A prefix has 2 characters at least.');

        $this->assertTrue($this->_oModule->setContextPrefix($this->_iContextA, mb_strtolower($sNew)));
        $this->assertSame($sNew . '-1', $this->_oModule->getIdentifier($iTask));
        $this->assertSame($iTask, $this->_oModule->getContentIdByIdentifier($sOld . '-1'));
        $this->assertSame($iTask, $this->_oModule->getContentIdByIdentifier($sNew . '-1'));

        // no other community takes it, the community itself may take it back
        $this->assertFalse($this->_oModule->isPrefixAvailable($sOld, $this->_iContextB));
        $this->assertFalse($this->_oModule->setContextPrefix($this->_iContextB, $sOld));
        $this->assertTrue($this->_oModule->isPrefixAvailable($sOld, $this->_iContextA));
        $this->assertTrue($this->_oModule->setContextPrefix($this->_iContextA, $sOld));
        $this->assertSame($sOld . '-1', $this->_oModule->getIdentifier($iTask));
    }

    public function testSeoLinkIsTheNumberAndFormerOnesLeadToIt()
    {
        $this->_sSeoLinksBackup = getParam('permalinks_seo_links');
        setParam('permalinks_seo_links', 'on');

        $sOld = $this->bxPrefix();
        $sNew = $this->bxPrefix();
        $this->assertTrue($this->_oModule->setContextPrefix($this->_iContextA, $sOld));
        $iTask = $this->bxTask($this->_iContextA);
        $this->_oModule->assignNumber($iTask);

        $sLink = BxDolPage::transformSeoLink('page.php?i=view-task&id=' . $iTask, BX_DOL_URL_ROOT);
        $this->assertSame(BX_DOL_URL_ROOT . 'view-task/' . mb_strtolower($sOld) . '-1', $sLink);

        $this->assertTrue($this->_oModule->setContextPrefix($this->_iContextA, $sNew));
        $aLink = BxDolPageQuery::getSeoLink('bx_tasks', 'view-task', ['param_value' => (string)$iTask]);
        $this->assertSame(mb_strtolower($sNew) . '-1', $aLink['uri']);

        // the former link: the content it named, and the site's redirect to the current one
        $this->assertSame(['param_name' => 'id', 'param_value' => (string)$iTask], BxDolPage::getSeoLinkFallback('bx_tasks', 'view-task', mb_strtolower($sOld) . '-1'));
        $this->assertFalse(BxDolPage::getSeoLinkFallback('bx_tasks', 'view-task', 'nothing-here'));
        $this->assertFalse(BxDolPage::getSeoLinkFallback('bx_posts', 'view-post', mb_strtolower($sOld) . '-1'), 'Only the module of the page answers.');

        $aGet = $_GET;
        $mixed = BxDolPage::getPageBySeoLink('view-task/' . mb_strtolower($sOld) . '-1');
        $_GET = $aGet;
        $this->assertSame(BX_DOL_URL_ROOT . 'view-task/' . mb_strtolower($sNew) . '-1', $mixed);
    }

    public function testLinkFromTheTitleLeadsToTheNumber()
    {
        $this->_sSeoLinksBackup = getParam('permalinks_seo_links');
        setParam('permalinks_seo_links', 'on');

        $sPrefix = $this->bxPrefix();
        $this->assertTrue($this->_oModule->setContextPrefix($this->_iContextA, $sPrefix));

        // tasks from before numbers, with the links the site made from their titles; the second
        // one's title made the link the first one's number takes (a task titled "UNA 1")
        $iTask = $this->bxTask($this->_iContextA);
        $iOther = $this->bxTask($this->_iContextA);
        $sTitleUri = 'tasknumberstest-' . mb_strtolower($this->bxPrefix());
        $sNumberUri = mb_strtolower($sPrefix) . '-1';
        BxDolPageQuery::insertSeoLink('bx_tasks', 'view-task', 'id', (string)$iTask, $sTitleUri);
        BxDolPageQuery::insertSeoLink('bx_tasks', 'view-task', 'id', (string)$iOther, $sNumberUri);

        // as the migration does it
        $this->assertTrue($this->_oModule->_oDb->saveFormerSeoLinks());
        $this->assertSame(1, $this->_oModule->assignNumber($iTask));
        $this->assertSame(2, $this->_oModule->assignNumber($iOther));

        $this->assertSame($sNumberUri, BxDolPageQuery::getSeoLink('bx_tasks', 'view-task', ['param_value' => (string)$iTask])['uri']);
        $this->assertSame(mb_strtolower($sPrefix) . '-2', BxDolPageQuery::getSeoLink('bx_tasks', 'view-task', ['param_value' => (string)$iOther])['uri']);

        $aGet = $_GET;
        $mixed = BxDolPage::getPageBySeoLink('view-task/' . $sTitleUri);
        $_GET = $aGet;
        $this->assertSame(BX_DOL_URL_ROOT . 'view-task/' . $sNumberUri, $mixed);
    }

    public function testPrefixOfTasksInNoCommunityIsTheOption()
    {
        // the candidates of context 0 start with the option's value as it is, not its first letters
        $this->assertSame('TAS', $this->_oModule->getPrefixCandidates('TASK', 0)[0], 'A name gives its start.');

        $oDb = BxDolDb::getInstance();
        if ($oDb->getOne("SELECT `prefix` FROM `bx_tasks_contexts` WHERE `id` = 0") !== false)
            $this->markTestSkipped('The site has a prefix of tasks in no community already.');

        try {
            $this->assertSame(strtoupper(getParam('bx_tasks_personal_prefix')), $this->_oModule->getContextPrefix(0));
        } finally {
            // the site gets its own when it needs it
            $oDb->query("DELETE FROM `bx_tasks_prefixes` WHERE `context_id` = 0");
            $oDb->query("DELETE FROM `bx_tasks_contexts` WHERE `id` = 0");
        }
    }

    protected function bxPrefix(): string
    {
        $sPrefix = 'Z';
        for ($i = 0; $i < 7; $i++)
            $sPrefix .= chr(mt_rand(65, 90));

        return $sPrefix;
    }

    protected function bxIdList(array $aIds): string
    {
        return implode(',', array_map('intval', $aIds));
    }

    protected function bxTask(int $iContextId): int
    {
        $oDb = BxDolDb::getInstance();
        $iNow = time();
        $oDb->query("INSERT INTO `bx_tasks_tasks` SET `author` = 0, `added` = :now, `changed` = :now, `published` = :now, `thumb` = 0, `title` = 'TaskNumbersTest', `cat` = 0, `multicat` = '', `text` = '', `labels` = '', `due_date` = 0, `tasks_list` = 0, `allow_view_to` = :view", [
            'now' => $iNow,
            'view' => '-' . $iContextId,
        ]);
        $iId = (int)$oDb->lastId();
        $this->assertGreaterThan(0, $iId);
        $this->_aTaskIds[] = $iId;

        return $iId;
    }
}
