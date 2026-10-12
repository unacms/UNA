<?php

/**
 * Mass Mailer report charts: the JSON from GetReportsData is a Chart.js 4 config
 * (plugins_public/chart.umd.min.js), not the Chart.js 2 one the module used to send.
 */
class BxMassMailerModuleTest extends BxDolTestCase
{
    protected $_oModule;
    protected $_aSegmentIds = [];

    protected function setUp(): void
    {
        bx_import('BxDolModule');
        $this->_oModule = BxDolModule::getInstance('bx_massmailer');
        if (!$this->_oModule)
            $this->markTestSkipped('bx_massmailer module is not installed.');
    }

    protected function tearDown(): void
    {
        foreach ($this->_aSegmentIds as $iId)
            $this->_oModule->_oDb->query("DELETE FROM `" . $this->_oModule->_oConfig->CNF['TABLE_SEGMENTS'] . "` WHERE `id` = :id", ['id' => $iId]);

        $this->_aSegmentIds = [];
    }

    public function testCustomSegmentEmailsAreSplitOnCommasSemicolonsAndSpaces()
    {
        $iId = $this->addSegment(" a@example.com,b@example.com;\n c@example.com\ta@example.com  not-an-email 123 ");

        $this->assertSame(['a@example.com', 'b@example.com', 'c@example.com'], $this->_oModule->_oDb->getSegmentEmails($iId));
        $this->assertSame([], $this->_oModule->_oDb->getSegmentEmails($this->addSegment('')));
    }

    public function testCustomSegmentKeepsOnlyListedAccounts()
    {
        //--- The accounts "All" reaches through a profile, cut down to the listed emails.
        $aAll = array_values(array_filter($this->accounts('lvl:0'), fn($a) => !empty($a['profile_id'])));
        $aListed = array_slice(array_values(array_unique(array_column($aAll, 'email'))), 0, 2);
        $iId = $this->addSegment(implode(', ', array_merge($aListed, ['nobody@example.invalid'])));

        $aExpected = array_values(array_filter($aAll, fn($a) => in_array($a['email'], $aListed)));
        $this->assertEqualsCanonicalizing($aExpected, $this->accounts('cst:' . $iId));
    }

    public function testMissingCustomSegmentReachesNobody()
    {
        $sSegment = 'cst:2147483000';
        $this->assertSame([], $this->accounts($sSegment));

        //--- The report used to count every account with a profile for a custom segment.
        $a = $this->_oModule->getReportsData('SUBSCRIBERS_INFO', 'content_total', '2026-01-01', '2026-01-31', $sSegment);
        foreach ($a['data']['datasets'] as $aDataset)
            $this->assertSame([0], array_values(array_unique(array_column($aDataset['data'], 'y'))));
    }

    public function testCampaignReportHasOneCategoryForItsBars()
    {
        $a = $this->_oModule->getReportsData('CAMPAIGN_REPORT', 0, '-', '-', '-');

        $this->assertSame('bar', $a['type']);
        // Chart.js 3+ places category bars by label, so without one no bar is drawn.
        $this->assertCount(1, $a['data']['labels']);
        $this->assertCount(5, $a['data']['datasets']);
        foreach ($a['data']['datasets'] as $aDataset)
            $this->assertCount(1, $aDataset['data']);

        $this->assertChartJs4Options($a['options']);
    }

    public function testSubscribersReportIsTimeSeries()
    {
        $a = $this->_oModule->getReportsData('SUBSCRIBERS_INFO', 'content_total', '2026-01-01', '2026-01-31', 'lvl:0');

        $this->assertSame('line', $a['type']);
        $this->assertCount(2, $a['data']['datasets']);
        $this->assertCount(30, $a['data']['datasets'][0]['data']);
        $this->assertSame(['x' => '2026-01-01', 'y' => $a['data']['datasets'][0]['data'][0]['y']], $a['data']['datasets'][0]['data'][0]);

        $aX = $a['options']['scales']['x'];
        $this->assertSame('time', $aX['type']);
        $this->assertSame('day', $aX['time']['unit']);
        $this->assertArrayNotHasKey('distribution', $aX);

        $this->assertChartJs4Options($a['options']);
    }

    private function accounts(string $sSegment): array
    {
        return $this->_oModule->_oDb->getAccountsByTerms($this->bxCallProtected($this->_oModule, 'getSqlBySegment', $sSegment));
    }

    private function addSegment(string $sEmails): int
    {
        $this->_oModule->_oDb->query("INSERT INTO `" . $this->_oModule->_oConfig->CNF['TABLE_SEGMENTS'] . "` (`title`, `info`, `email_list`) VALUES ('Test segment', '', :emails)", ['emails' => $sEmails]);

        return $this->_aSegmentIds[] = (int)$this->_oModule->_oDb->lastId();
    }

    private function assertChartJs4Options(array $aOptions): void
    {
        $this->assertArrayNotHasKey('legend', $aOptions);
        $this->assertSame('bottom', $aOptions['plugins']['legend']['position']);

        $this->assertArrayNotHasKey('xAxes', $aOptions['scales']);
        $this->assertArrayNotHasKey('yAxes', $aOptions['scales']);
        $this->assertArrayHasKey('x', $aOptions['scales']);

        $aY = $aOptions['scales']['y'];
        $this->assertSame(0, $aY['min']);
        $this->assertGreaterThanOrEqual($aY['min'], $aY['max']);
        $this->assertArrayNotHasKey('min', $aY['ticks']);
        $this->assertArrayNotHasKey('max', $aY['ticks']);
        $this->assertArrayHasKey('stepSize', $aY['ticks']);
    }
}
