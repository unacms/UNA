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
}
