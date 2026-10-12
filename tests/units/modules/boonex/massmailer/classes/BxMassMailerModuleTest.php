<?php

/**
 * Mass Mailer report charts: the JSON from GetReportsData is a Chart.js 4 config
 * (plugins_public/chart.umd.min.js), not the Chart.js 2 one the module used to send.
 */
class BxMassMailerModuleTest extends BxDolTestCase
{
    protected $_oModule;

    protected function setUp(): void
    {
        bx_import('BxDolModule');
        $this->_oModule = BxDolModule::getInstance('bx_massmailer');
        if (!$this->_oModule)
            $this->markTestSkipped('bx_massmailer module is not installed.');
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
