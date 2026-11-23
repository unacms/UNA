<?php

/**
 * A module's Search tab looks the same on the site and in NEO: from lg, a block on the left with just the search form,
 * the results in the content column beside it; below lg, the form above the results. Read from the files, so a change on
 * one side only fails here.
 */
class SearchPageLayoutParityTest extends BxDolTestCase
{
    private static function read(string $sPath): string
    {
        $s = file_get_contents(__DIR__ . '/../../../' . $sPath);
        if ($s === false)
            self::fail($sPath . ' is not readable.');

        return str_replace("\r\n", "\n", $s);
    }

    /**
     * Every module's search page (`*_search` with the search form and results blocks) ships on layout 1, bar_left:
     * the forms in cell 1, the results in cell 2.
     */
    public function testModuleSearchPagesUseBarLeft(): void
    {
        $sRoot = __DIR__ . '/../../../';
        $aFiles = glob($sRoot . 'modules/*/*/install/sql/enable.sql');
        $this->assertNotEmpty($aFiles);

        $iPages = 0;
        foreach ($aFiles as $sFile) {
            $sModule = basename(dirname($sFile, 3));
            $s = str_replace("\r\n", "\n", file_get_contents($sFile));
            if (!preg_match_all("/^\('(bx_[a-z_]+_search)', (.*)$/m", $s, $aRows, PREG_SET_ORDER))
                continue;

            foreach ($aRows as $aRow) {
                $sLine = $aRow[2];
                if (preg_match("/_page_block_title_[a-z_]*search_(form|results)/", $sLine, $m)) {
                    // Cell 0 is a block that is not on the page (Stories' comment search).
                    $this->assertMatchesRegularExpression('/^(0|' . ($m[1] == 'form' ? 1 : 2) . '), /', $sLine, "$sModule: search $m[1] blocks go in cell " . ($m[1] == 'form' ? 1 : 2) . '.');
                    continue;
                }

                if (preg_match("/_page_title_entries_search'/", $sLine)) {
                    $iPages++;
                    $this->assertMatchesRegularExpression("/(?:'bx_[a-z_]+'|@sName), 1, 2147483647, 1, /", $sLine, "$sModule: the search page uses layout 1 (bar_left).");
                }
            }
        }

        $this->assertGreaterThanOrEqual(20, $iPages, 'The modules\' search pages were found.');
    }

    public function testNeoFormColumnIsAPlainBlock(): void
    {
        $s = self::read('neo/packages/app/ui/molecules/sections/conductor/web-ui.js');
        $this->assertStringContainsString("const isPlain = layoutName != 'profile' && !isSectionSidebar && !hasMenuBlocks", $s, 'No repeated section title, icon or Add button without a section nav or menus.');
        $this->assertStringContainsString('mt-0.5 sm:mt-0 sm:-me-4 sm:p-4 ${appSetting(\'conductor\', \'sidebar_container\')}', $s, 'The blocks alone, placed as the right column\'s.');

        $sIndex = self::read('neo/packages/app/ui/molecules/sections/conductor/index.web.js');
        $this->assertStringContainsString('hasMenuBlocks={leftColumnMenuBlocks.length > 0}', $sIndex);
    }

    public function testNeoFormStaysAboveTheListBelowLg(): void
    {
        $s = self::read('neo/packages/app/ui/molecules/sections/conductor/helpers.js');
        $this->assertStringContainsString('export const isLeftColumnFilterForm = (item) => !!item?.data?.config_api?.use_as_filter', $s);
        $this->assertStringContainsString('if (isLeftColumnFilterForm(item)) return false', $s, 'Not in the Filters sheet.');
        $this->assertStringContainsString(".filter((item) => !isLeftColumnFilterForm(item))\n", $s, 'Not excluded from the list on the navigator.');
    }

    public function testNeoLeftColumnIsAThirdAsOnTheSite(): void
    {
        $this->assertStringContainsString('md:w-1/3', self::read('template/layout_bar_left.html'));

        $s = self::read('neo/packages/app/settings/layout.js');
        $this->assertMatchesRegularExpression("/'cols-l-c': \{\s*adjustable: true,\s*sizable: true,\s*cells: \{\s*left: \{\s*defaultSize: 33\.33,/", $s);
    }

    public function testNoEmptyPlateBeforeASearch(): void
    {
        $s = self::read('template/scripts/BxBaseSearchExtendedServices.php');
        $this->assertStringNotContainsString("MsgBox(_t('_Empty'))", $s, 'Nothing searched for yet: no "Nothing here yet".');

        $s = self::read('template/scripts/BxBaseSearchExtended.php');
        $this->assertStringContainsString("emptyState(_t('_sys_txt_empty_search_text'), [], 'search', _t('_sys_txt_empty_search_title'))", $s, 'Nothing found: the apps\' empty state.');
    }

    public function testNeoSearchResultsSitInTheirBlock(): void
    {
        $s = self::read('neo/packages/app/ui/molecules/sections/conductor/helpers.js');
        $this->assertStringContainsString("export const isSearchResultsBlock = (block) => block?.source === 'system:get_results'", $s, 'Only a search\'s results, not every list.');
        $this->assertStringContainsString('...(payload.block ? { block: payload.block } : null),', $s, 'Parsed pages keep the shell on the endpoint.');
        $this->assertStringContainsString('...(b.list_block ? { block: b.list_block } : null),', $s, 'Classic pages too.');

        $s = self::read('neo/packages/app/ui/molecules/sections/conductor/shared-ui.js');
        $this->assertStringContainsString('const inShell = !headerInList && !!shell && (!scene.isEmpty || scene.showNoContent || (wantsPreload && isSearched))', $s, 'No block before a search, not even while the first reply loads.');
        $this->assertStringContainsString("designbox: { ...route?.endpoint?.designbox, bg: false }", $s, 'One card: the block, not the list too.');
        $this->assertStringContainsString("listRows: scene.rows.filter((item) => item?.type !== 'block')", $s, 'Other blocks stay outside the results block.');
        $this->assertStringContainsString('<BlockWrapper block={shell} config={shell.config} listShell', $s);
        $this->assertStringContainsString('fill={!inShell}', $s, 'The empty state is only as tall as its words in the block.');

        $this->assertStringContainsString("&& !listShell)\n        contentOnly = true;", self::read('neo/packages/app/components/block-wrapper.js'), 'Other lists stay without a shell.');
    }
}
