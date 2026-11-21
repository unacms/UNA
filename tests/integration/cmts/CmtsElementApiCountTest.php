<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The comments element for the app counts the comments once: getElementAPI
 * hands its count to getCounterApi, so the action and the counter show the
 * same number. A direct getCounterApi call still counts on its own.
 */
#[Group('integration')]
class CmtsElementApiCountTest extends BxDolIntegrationTestCase
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

    /**
     * Timeline comments for the latest event, in API mode, counting getCommentsCountAll calls.
     * Built with new, so the shared instance in bxDolClasses is untouched.
     */
    protected function countingCmts(): BxTemplCmts
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_timeline'))
            $this->markTestSkipped('Timeline is not installed.');

        $iEventId = (int)BxDolDb::getInstance()->getOne("SELECT `id` FROM `bx_timeline_events` WHERE `active` = 1 ORDER BY `id` DESC LIMIT 1");
        if (!$iEventId)
            $this->markTestSkipped('There are no timeline events.');

        $this->bxLoginAsAdmin();
        $_GET['api'] = 1;

        $oCmts = new class('bx_timeline', $iEventId) extends BxTemplCmts {
            public int $iCountCalls = 0;

            public function getCommentsCountAll($iObjectId = 0, $bForceCalculate = false)
            {
                $this->iCountCalls++;
                return parent::getCommentsCountAll($iObjectId, $bForceCalculate);
            }
        };
        if (!$oCmts->isEnabled())
            $this->markTestSkipped('Timeline comments are not enabled.');

        return $oCmts;
    }

    public function testElementApiCountsCommentsOnce(): void
    {
        $oCmts = $this->countingCmts();

        $aElement = $oCmts->getElementAPI();
        if (!is_array($aElement) || empty($aElement['counter']))
            $this->markTestSkipped('The comments counter is hidden for the admin.');

        $this->assertSame(1, $oCmts->iCountCalls);
        $this->assertArrayHasKey('count', $aElement['action']);
        $this->assertSame($aElement['action']['count'], $aElement['counter']['count']);
        $this->assertSame((int)$oCmts->getCommentsCountAll(), $aElement['counter']['count']);
        $this->assertIsArray($aElement['counter']['authors']);
    }

    public function testCounterApiWithoutCountStillCounts(): void
    {
        $oCmts = $this->countingCmts();

        $aCounter = $oCmts->getCounterApi();

        $this->assertSame(1, $oCmts->iCountCalls);
        $this->assertSame((int)$oCmts->getCommentsCountAll(), $aCounter['count']);
        $this->assertIsArray($aCounter['authors']);
    }

    public function testReplyToANewCommentCarriesTheCounter(): void
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_timeline'))
            $this->markTestSkipped('Timeline is not installed.');

        $oDb = BxDolDb::getInstance();
        $sTable = $oDb->getOne("SELECT `Table` FROM `sys_objects_cmts` WHERE `Name` = 'bx_timeline'");
        $aCmt = $sTable ? $oDb->getRow("SELECT `cmt_id`, `cmt_object_id` FROM `" . $sTable . "` ORDER BY `cmt_id` DESC LIMIT 1") : [];
        if (empty($aCmt))
            $this->markTestSkipped('There are no timeline comments.');
        $iCmtId = (int)$aCmt['cmt_id'];

        $this->bxLoginAsAdmin();
        $_GET['api'] = 1;

        $oCmts = new BxTemplCmts('bx_timeline', (int)$aCmt['cmt_object_id']);
        if (!$oCmts->isEnabled())
            $this->markTestSkipped('Timeline comments are not enabled.');

        $oServices = new BxTemplCmtsServices();
        $aRv = $oServices->serviceGetCommentsApi($oCmts, ['comment_id' => (string)$iCmtId]);

        // The apps show the comment and update the object's counter beside the list from it.
        $this->assertSame([$iCmtId], array_map('intval', $aRv['new']));
        $this->assertSame('comments', $aRv['element']['type']);
        $this->assertSame('bx_timeline', $aRv['element']['system']);
        $this->assertSame($oCmts->getId(), (int)$aRv['element']['object_id']);
        $this->assertSame((int)$oCmts->getCommentsCountAll(), (int)($aRv['element']['counter']['count'] ?? $aRv['element']['action']['count']));

        $this->assertArrayNotHasKey('element', $oServices->serviceGetCommentsApi($oCmts, []), 'A plain page of comments goes without it.');
    }
}
