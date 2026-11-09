<?php

/**
 * Markup fixes from the UNA Bench audit: named grid checkboxes, comment search results inside
 * their list, and notification counters with enough contrast.
 */
class BxBaseA11yMarkupTest extends BxDolTestCase
{
    public function testGridRowCheckboxIsNamed()
    {
        $oGrid = (new ReflectionClass('BxTemplGrid'))->newInstanceWithoutConstructor();
        $this->bxSetProtected($oGrid, '_bIsApi', false, BxDolGrid::class);
        $this->bxSetProtected($oGrid, '_sObject', 'test_grid', BxDolGrid::class);
        $this->bxSetProtected($oGrid, '_aOptions', ['field_id' => 'id', 'field_active' => ''], BxDolGrid::class);

        $s = $this->bxCallProtected($oGrid, '_getCellCheckbox', 5, 'checkbox', ['width' => '2%'], ['id' => 5]);

        $this->assertStringContainsString('aria-label="' . bx_html_attribute(_t('_sys_grid_lbl_select')) . '"', $s);
        $this->assertStringContainsString('value="5"', $s);
    }

    public function testCommentSearchResultsAreListItemsOfTheirList()
    {
        $o = (new ReflectionClass('BxBaseModGeneralCmtsSearchResult'))->newInstanceWithoutConstructor();

        $this->assertSame('<ul class="cmts"><li id="cmt1"></li></ul>', $this->bxCallProtected($o, 'wrapSearchUnits', '<li id="cmt1"></li>'));
    }

    public function testOtherSearchResultsAreNotWrapped()
    {
        $o = (new ReflectionClass('BxTemplSearchResult'))->newInstanceWithoutConstructor();

        $this->assertSame('<div>unit</div>', $this->bxCallProtected($o, 'wrapSearchUnits', '<div>unit</div>'));
    }

    public function testCounterBadgesHaveContrast()
    {
        // white on red-600 is 4.8:1, on red-400 2.8:1
        foreach (['template/menu_item_addon.html', 'template/menu_item_addon_small.html', 'template/menu_item_addon_middle.html', 'modules/boonex/messenger/template/menu_item_addon.html'] as $sFile) {
            $s = file_get_contents(BX_DIRECTORY_PATH_ROOT . $sFile);
            $this->assertStringContainsString('bg-red-600', $s, $sFile);
            $this->assertStringNotContainsString('bg-red-400', $s, $sFile);
        }
    }
}
