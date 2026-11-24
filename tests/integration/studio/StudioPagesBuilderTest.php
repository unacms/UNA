<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Studio > Pages for a new operator: it opens on the Homepage, "Add blocks" opens on the system blocks and offers each
 * block once with a named checkbox, a page's blocks have distinct names, the block form keeps its technical fields under
 * "Advanced", and the layout is sent back after blocks are added so it shows them at once.
 */
#[Group('integration')]
class StudioPagesBuilderTest extends BxDolIntegrationTestCase
{
    protected function builder(string $sPage = 'sys_about'): BxTemplStudioBuilderPage
    {
        return new BxTemplStudioBuilderPage('system', $sPage);
    }

    protected function invoke(object $oObject, string $sMethod, ...$aArgs)
    {
        return (new ReflectionMethod($oObject, $sMethod))->invoke($oObject, ...$aArgs);
    }

    public function testOpensOnTheHomepage(): void
    {
        $this->assertSame('sys_home', BxTemplStudioBuilderPage::getDefaultPage(''));
        $this->assertSame('sys_home', BxTemplStudioBuilderPage::getDefaultPage('system'));
        $this->assertSame('', BxTemplStudioBuilderPage::getDefaultPage('custom'));
        $this->assertSame('', BxTemplStudioBuilderPage::getDefaultPage('bx_posts'));

        $aPage = (new BxDolStudioBuilderPageQuery())->getPages(['type' => 'by_object_full', 'value' => BxTemplStudioBuilderPage::getDefaultPage()]);
        $this->assertNotEmpty($aPage, 'The default page exists.');
    }

    public function testAddBlocksOpensOnTheSystemBlocks(): void
    {
        $aResult = $this->invoke($this->builder(), 'actionBlockCreate');
        $sHtml = is_array($aResult['popup'] ?? null) ? $aResult['popup']['html'] : (string)($aResult['popup'] ?? '');

        $this->assertStringContainsString('id="adm-bpl-system"', $sHtml);
        $this->assertStringNotContainsString('id="adm-bpl-skeletons"', $sHtml);
        $this->assertLessThan(strpos($sHtml, "onChangeModule('skeletons'"), strpos($sHtml, "onChangeModule('system'"), 'System comes first.');
    }

    public function testTheSameBlockIsOfferedOnce(): void
    {
        $aService = 'a:2:{s:6:"module";s:6:"system";s:6:"method";s:7:"example";}';
        $aBlocks = [
            ['id' => 1, 'object' => 'sys_home', 'module' => 'system', 'type' => 'service', 'content' => $aService],
            ['id' => 2, 'object' => '', 'module' => 'system', 'type' => 'service', 'content' => $aService],
            ['id' => 3, 'object' => 'sys_dashboard', 'module' => 'system', 'type' => 'service', 'content' => $aService],
            ['id' => 4, 'object' => 'sys_home', 'module' => 'system', 'type' => 'menu', 'content' => 'sys_homepage'],
        ];

        $aIds = array_column($this->builder()->getDistinctBlocks($aBlocks), 'id');
        $this->assertSame([2, 4], $aIds, 'The page-less copy stands for all its copies on pages.');
    }

    public function testAddBlocksEntriesAreDistinctAndNamed(): void
    {
        $oBuilder = $this->builder();
        $aModules = array_unique(array_merge(['system'], (new BxDolStudioBuilderPageQuery())->getModulesWithCopyableBlocks()));

        foreach ($aModules as $sModule) {
            $sHtml = $this->invoke($oBuilder, 'getBlockList', $sModule);
            preg_match_all('/<input[^>]*type="checkbox"[^>]*>/', $sHtml, $aInputs);
            if (empty($aInputs[0]))
                continue;

            $aLabels = [];
            foreach ($aInputs[0] as $sInput) {
                $this->assertMatchesRegularExpression('/aria-label="[^"]+"/', $sInput, "Every block checkbox in $sModule has a name.");
                preg_match('/aria-label="([^"]+)"/', $sInput, $aMatch);
                $aLabels[] = $aMatch[1];
            }

            if ($sModule == 'system')
                $this->assertSame(count($aLabels), count(array_unique($aLabels)), 'No two system blocks share a name: ' . implode(', ', array_diff_assoc($aLabels, array_unique($aLabels))));
        }
    }

    public function testHomepageBlocksHaveDistinctNames(): void
    {
        $oBuilder = $this->builder('sys_home');
        // Shopify and Snipcart are alternatives with the same wording, so they are not compared.
        $aBlocks = BxDolDb::getInstance()->getAll("SELECT * FROM `sys_pages_blocks` WHERE `object` = 'sys_home' AND `module` NOT IN ('bx_shopify', 'bx_snipcart')");

        $aTitles = [];
        foreach ($aBlocks as $aBlock)
            $aTitles[] = $this->invoke($oBuilder, 'getBlockTitleForStudio', $aBlock);

        $this->assertSame([], array_values(array_unique(array_diff_assoc($aTitles, array_unique($aTitles)))));
    }

    public function testTechnicalFieldsAreUnderAdvanced(): void
    {
        $aBlock = BxDolDb::getInstance()->getRow("SELECT * FROM `sys_pages_blocks` WHERE `object` = 'sys_home' AND `type` = 'service' ORDER BY `id` LIMIT 1");
        if (empty($aBlock))
            $this->markTestSkipped('The Homepage has no service block.');

        $_GET['id'] = $_REQUEST['id'] = $aBlock['id'];
        try {
            $aResult = $this->invoke($this->builder('sys_home'), 'actionBlockEdit');
        } finally {
            unset($_GET['id'], $_REQUEST['id']);
        }

        $sHtml = $aResult['popup']['html'] ?? '';
        $this->assertSame(1, preg_match('/>\s*' . preg_quote(_t('_adm_bp_txt_block_advanced'), '/') . '\s*<\/button>/', $sHtml, $aMatch, PREG_OFFSET_CAPTURE), 'The form has a collapsed Advanced section.');
        $iAdvanced = $aMatch[0][1];
        $this->assertStringContainsString('bx-form-collapsed', $sHtml, 'Advanced starts collapsed.');

        foreach (['name="class"', 'name="cache_lifetime"', 'name="async"', _t('_adm_bp_txt_block_content_service_method')] as $sNeedle) {
            $iPos = strpos($sHtml, $sNeedle);
            $this->assertNotFalse($iPos, $sNeedle);
            $this->assertGreaterThan($iAdvanced, $iPos, "$sNeedle is under Advanced.");
        }

        foreach (['name="active"', 'name="designbox_id"'] as $sNeedle)
            $this->assertLessThan($iAdvanced, strpos($sHtml, $sNeedle), "$sNeedle stays up front.");

        $this->assertLessThan(strpos($sHtml, 'name="do_submit"'), $iAdvanced, 'The buttons stay last.');
    }

    public function testTheLayoutShowsThePageBlocks(): void
    {
        $sLayout = $this->builder('sys_about')->getPageLayout();

        $this->assertStringContainsString('adm-bpc-1', $sLayout);
        foreach (BxDolDb::getInstance()->getColumn("SELECT `id` FROM `sys_pages_blocks` WHERE `object` = 'sys_about'") as $iId)
            $this->assertStringContainsString('id="adm-bpb-' . $iId . '"', $sLayout);

        $this->assertSame('', (new BxTemplStudioBuilderPage('custom', ''))->getPageLayout(), 'No page, no layout.');
    }

    public function testGuestsLevelName(): void
    {
        if (BxDolLanguages::getInstance()->getCurrentLangName() != 'en')
            $this->markTestSkipped('English strings only.');

        $this->assertSame('Guests', BxDolStudioUtils::getVisibilityTitle(1));
    }
}
