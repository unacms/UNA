<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Object data for the app (element, action response, socket payload, comments
 * list) carries `ts`, the server time it was built. NEO compares it to tell
 * whether props or its shared object state is newer.
 */
#[Group('integration')]
class ObjectApiTimestampTest extends BxDolIntegrationTestCase
{
    protected $_aGetBackup;

    protected function setUp(): void
    {
        parent::setUp();
        $this->_aGetBackup = $_GET;
    }

    protected function tearDown(): void
    {
        $_GET = $this->_aGetBackup ?? [];
        parent::tearDown();
    }

    public function testLikesApiHasTs(): void
    {
        $oVote = BxDolVote::getObjectInstance('sys_cmts', 1, false);
        $this->assertInstanceOf(BxDolVote::class, $oVote);

        $fBefore = microtime(true);
        $aResult = $this->bxCallProtected($oVote, '_returnVoteData', 1, 0, '', ['value' => 1], false);

        $this->assertIsFloat($aResult['api']['ts']);
        $this->assertGreaterThanOrEqual($fBefore, $aResult['api']['ts']);
    }

    public function testReactionsApiHasTs(): void
    {
        $oVote = BxDolVote::getObjectInstance('sys_cmts_reactions', 1, false);
        $this->assertInstanceOf(BxDolVoteReactions::class, $oVote);

        $fBefore = microtime(true);
        $aResult = $this->bxCallProtected($oVote, '_returnVoteData', 1, 0, '', ['value' => 1, 'reaction' => $oVote->getDefault()], false);

        $this->assertIsFloat($aResult['api']['ts']);
        $this->assertGreaterThanOrEqual($fBefore, $aResult['api']['ts']);
    }

    public function testVoteSocketPayloadKeepsTs(): void
    {
        $oVote = BxDolVote::getObjectInstance('sys_cmts_reactions', 1, false);
        $aResult = $this->bxCallProtected($oVote, '_returnVoteData', 1, 0, '', ['value' => 1, 'reaction' => $oVote->getDefault()], false);
        $aSocket = $this->bxCallProtected($oVote, '_returnVoteDataForSocket', $aResult);

        $this->assertSame($aResult['api']['ts'], $aSocket['api']['ts']);
    }

    public function testReportApiHasTs(): void
    {
        $oReport = BxDolReport::getObjectInstance('sys_cmts', 1, false);
        $this->assertInstanceOf(BxDolReport::class, $oReport);

        $fBefore = microtime(true);
        $aResult = $this->bxCallProtected($oReport, '_returnReportData', 1, 0, 0, [], false);

        $this->assertIsFloat($aResult['api']['ts']);
        $this->assertGreaterThanOrEqual($fBefore, $aResult['api']['ts']);
    }

    public function testElementApiHasTs(): void
    {
        $this->bxLoginAsAdmin();
        $_GET['api'] = 1;

        $oVote = BxDolVote::getObjectInstance('sys_cmts', 1);
        $this->assertInstanceOf(BxDolVote::class, $oVote);

        $fBefore = microtime(true);
        $aElement = $oVote->getElementAPI();
        if (!is_array($aElement) || empty($aElement['object_id']))
            $this->markTestSkipped('The like element is hidden for the admin.');

        $this->assertSame(1, (int)$aElement['object_id']);
        $this->assertIsFloat($aElement['ts']);
        $this->assertGreaterThanOrEqual($fBefore, $aElement['ts']);
    }

    public function testCommentsApiHasTs(): void
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_timeline'))
            $this->markTestSkipped('Timeline is not installed.');

        $iEventId = (int)BxDolDb::getInstance()->getOne("SELECT `id` FROM `bx_timeline_events` WHERE `active` = 1 ORDER BY `id` DESC LIMIT 1");
        if (!$iEventId)
            $this->markTestSkipped('There are no timeline events.');

        $this->bxLoginAsAdmin();
        $_GET['api'] = 1;

        $oCmts = BxDolCmts::getObjectInstance('bx_timeline', $iEventId);
        if (!$oCmts || !$oCmts->isEnabled())
            $this->markTestSkipped('Timeline comments are not enabled.');

        $aData = bx_srv('system', 'get_comments_api', [$oCmts, [
            'mode' => 'feed',
            'order_way' => 'desc',
            'start_from' => 0,
            'per_view' => 1,
            'is_form' => false,
        ]], 'TemplCmtsServices');
        if (!is_array($aData))
            $this->markTestSkipped('The admin may not view timeline comments.');

        $this->assertSame('comments', $aData['unit']);
        $this->assertSame($iEventId, (int)$aData['object_id']);
        $this->assertIsFloat($aData['ts']);
    }
}
