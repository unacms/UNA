<?php

/**
 * Ads promotion pie charts (summary and ROI) load Chart.js 4 themselves. addJs skips
 * a file it cannot find, so the old chart.min.js name left Chart undefined on any page
 * without another Chart.js block.
 */
class BxAdsTemplateTest extends BxDolTestCase
{
    protected $_oModule;
    protected $_iProfileIdBackup;
    protected $_aPageBackup;

    protected function setUp(): void
    {
        bx_import('BxDolModule');
        $this->_oModule = BxDolModule::getInstance('bx_ads');
        if (!$this->_oModule)
            $this->markTestSkipped('bx_ads module is not installed.');

        if (!BxDolDb::getInstance()->isTableExists('bx_ads_entries'))
            $this->markTestSkipped('bx_ads module is not installed (table bx_ads_entries is missing).');

        $this->_iProfileIdBackup = $this->bxGetProtected($this->_oModule, '_iProfileId', BxBaseModGeneralModule::class);
        $this->bxSetProtected($this->_oModule, '_iProfileId', 10, BxBaseModGeneralModule::class);

        //--- Start from an empty list so only the files added by the block are seen.
        $oTemplate = BxDolTemplate::getInstance();
        $this->_aPageBackup = $this->bxGetProtected($oTemplate, 'aPage');
        $this->bxSetProtected($oTemplate, 'aPage', array_merge($this->_aPageBackup, ['js_compiled' => []]));
    }

    protected function tearDown(): void
    {
        if ($this->_aPageBackup !== null)
            $this->bxSetProtected(BxDolTemplate::getInstance(), 'aPage', $this->_aPageBackup);

        if ($this->_oModule && $this->_iProfileIdBackup !== null)
            $this->bxSetProtected($this->_oModule, '_iProfileId', $this->_iProfileIdBackup, BxBaseModGeneralModule::class);
    }

    public function testPromotionSummaryLoadsChartJs4()
    {
        $s = $this->_oModule->_oTemplate->entryPromotionSummary($this->bxSampleAd());

        $this->assertStringContainsString('id="bx_ads_chart_summary"', $s);
        $this->assertChartJs4Added();
    }

    public function testPromotionRoiLoadsChartJs4()
    {
        $s = $this->_oModule->_oTemplate->entryPromotionRoi($this->bxSampleAd());

        $this->assertStringContainsString('id="bx_ads_chart_roi"', $s);
        $this->assertChartJs4Added();
    }

    public function testPromotionSummaryColoursAreSixDigitHex()
    {
        //--- With this seed the first two draws are below 0x100000, which dechex() wrote as 5 digits.
        mt_srand(47);
        try {
            $s = $this->_oModule->_oTemplate->entryPromotionSummary($this->bxSampleAd());
        }
        finally {
            mt_srand();
        }

        $this->assertSame(1, preg_match('/"backgroundColor":(\[[^\]]*\])/', $s, $aMatches));
        $aColours = json_decode($aMatches[1], true);

        $this->assertCount(2, $aColours);
        foreach ($aColours as $sColour)
            $this->assertMatchesRegularExpression('/^#[0-9a-f]{6}$/', $sColour);
    }

    private function assertChartJs4Added(): void
    {
        $aPaths = array_column($this->bxGetProtected(BxDolTemplate::getInstance(), 'aPage')['js_compiled'], 'path');
        $aChart = array_values(array_filter($aPaths, function ($sPath) {
            return basename($sPath) == 'chart.umd.min.js';
        }));

        $this->assertCount(1, $aChart, 'The block must add plugins_public/chart.umd.min.js.');
        $this->assertFileExists($aChart[0]);
    }

    private function bxSampleAd(): array
    {
        return [
            'id' => 2147483000,
            'author' => 10,
            'added' => 1700000000,
            'impressions' => 120,
            'clicks' => 7,
            'source_type' => '',
            'source' => '',
            'allow_view_to' => 3,
        ];
    }
}
