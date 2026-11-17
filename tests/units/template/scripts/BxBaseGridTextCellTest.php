<?php

/**
 * A grid's text cell (a field with `chars_limit`, the characters that fit one line of its column): text that fits one
 * line stays as it is; longer text goes out whole in a two-line box (.bx-grid-cell-clamp, css/grid.css) that carries
 * the full text, which BxDolGrid.js makes its title where the two lines don't hold it, so pointing at the text shows
 * all of it. Before, the text was cut at one line's characters with a button after it, so most names in Studio's grids
 * were cut and the button took the room.
 */
class BxBaseGridTextCellTest extends BxDolTestCase
{
    protected function grid(): BxTemplGrid
    {
        $oGrid = (new ReflectionClass('BxTemplGrid'))->newInstanceWithoutConstructor();
        $this->bxSetProtected($oGrid, '_bIsApi', false, BxDolGrid::class);
        $this->bxSetProtected($oGrid, '_sObject', 'test_grid', BxDolGrid::class);
        $this->bxSetProtected($oGrid, '_oFunctions', BxTemplFunctions::getInstance(), BxBaseGrid::class);

        return $oGrid;
    }

    protected function limit(BxTemplGrid $oGrid, string $sText, int $iLimit, bool $bPopup = true, bool $bString = true)
    {
        return $this->bxCallProtected($oGrid, '_limitMaxLength', $sText, 'title', ['chars_limit' => $iLimit], [], $bPopup, $bString);
    }

    public function testTextWithinOneLineIsLeftAsItIs(): void
    {
        $oGrid = $this->grid();

        $this->assertSame('Site Menu', $this->limit($oGrid, 'Site Menu', 15));
        $this->assertSame(['Site Menu'], $this->limit($oGrid, 'Site Menu', 15, true, false));
        $this->assertSame('Any length without a limit, as before', $this->limit($oGrid, 'Any length without a limit, as before', 0));
        $this->assertSame('', $this->bxGetProtected($oGrid, '_sCellClampText', BxBaseGrid::class));
    }

    public function testLongerTextGoesOutWholeWithoutAButton(): void
    {
        $oGrid = $this->grid();
        $sText = 'Account Dashboard Manage Tools Menu';

        $this->assertSame($sText, $this->limit($oGrid, $sText, 15), 'The whole name, not its first 15 characters, and nothing after it.');
        $this->assertSame($sText, $this->bxGetProtected($oGrid, '_sCellClampText', BxBaseGrid::class));

        $this->assertSame([$sText], $this->limit($oGrid, $sText, 15, true, false));
    }

    public function testVeryLongTextIsStillCut(): void
    {
        $oGrid = $this->grid();
        $sText = trim(str_repeat('word ', 60));

        $s = $this->limit($oGrid, $sText, 10);
        $this->assertLessThanOrEqual(10 * 6, mb_strlen($s));
        $this->assertStringEndsWith('...', $s);
        $this->assertSame($sText, $this->bxGetProtected($oGrid, '_sCellClampText', BxBaseGrid::class), 'Pointing at it still shows all of it.');
    }

    public function testGridThatShowsNoTextInFullCutsAsBefore(): void
    {
        $oGrid = $this->grid();

        $s = $this->limit($oGrid, 'Account Dashboard Manage Tools Menu', 15, false);
        $this->assertStringEndsWith('...', $s);
        $this->assertLessThanOrEqual(15, mb_strlen($s));
        $this->assertSame('', $this->bxGetProtected($oGrid, '_sCellClampText', BxBaseGrid::class));
    }

    public function testCellWithLongerTextIsATwoLineBoxWithItsFullText(): void
    {
        $oGrid = $this->grid();
        $aField = ['name' => 'title', 'chars_limit' => 15, 'translatable' => 0, 'width' => '17%'];

        $sValue = $this->limit($oGrid, 'Tools & "Extras" Manage Menu', 15);
        $sCell = $this->bxCallProtected($oGrid, '_getCellDefault', '<a href="#">' . $sValue . '</a>', 'title', $aField, []);
        $this->assertStringContainsString('><div class="bx-grid-cell-clamp" data-full-text="' . bx_html_attribute('Tools & "Extras" Manage Menu') . '"><a href="#">', $sCell);
        $this->assertStringEndsWith('</a></div></td>', $sCell);
        $this->assertStringNotContainsString('bx-str-limit', $sCell);

        // the next cell is a plain one again
        $sCell = $this->bxCallProtected($oGrid, '_getCellDefault', $this->limit($oGrid, 'Site', 15), 'title', $aField, []);
        $this->assertStringNotContainsString('bx-grid-cell-clamp', $sCell);
        $this->assertStringEndsWith('>Site</td>', $sCell);
    }

    public function testStylesAndScriptHaveTheBox(): void
    {
        $sCss = file_get_contents(BX_DIRECTORY_PATH_ROOT . 'template/css/grid.css');
        $this->assertStringContainsString('.bx-grid-cell-clamp {', $sCss);
        $this->assertStringContainsString('-webkit-line-clamp: 2;', $sCss);
        $this->assertStringContainsString('line-height: 1.2;', $sCss);

        $sJs = file_get_contents(BX_DIRECTORY_PATH_ROOT . 'inc/js/classes/BxDolGrid.js');
        $this->assertStringContainsString('BxDolGrid.prototype.markClampedCells', $sJs);
        $this->assertStringContainsString("eCell.attr('title', sText)", $sJs);
    }
}
