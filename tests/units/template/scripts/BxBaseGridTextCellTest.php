<?php

/**
 * A grid's text cell (a field with `chars_limit`, the characters that fit one line of its column): text that fits one
 * line stays as it is; longer text goes out whole in a two-line box (.bx-grid-cell-clamp, css/grid.css) with the button
 * that shows it in full, which BxDolGrid.js shows only where the two lines don't hold the text. Before, the text was
 * cut at one line's characters, so most names in Studio's grids were cut.
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
        $this->assertFalse($this->bxGetProtected($oGrid, '_bCellClamp', BxBaseGrid::class));
    }

    public function testLongerTextGoesOutWholeWithTheButton(): void
    {
        $oGrid = $this->grid();
        $sText = 'Account Dashboard Manage Tools Menu';

        $s = $this->limit($oGrid, $sText, 15);
        $this->assertStringStartsWith($sText . '<button', $s, 'The whole name, not its first 15 characters.');
        $this->assertStringContainsString('class="bx-str-limit', $s);
        $this->assertTrue($this->bxGetProtected($oGrid, '_bCellClamp', BxBaseGrid::class));

        $a = $this->limit($oGrid, $sText, 15, true, false);
        $this->assertCount(2, $a);
        $this->assertSame($sText, $a[0]);
        $this->assertStringContainsString('bx-str-limit', $a[1]);
    }

    public function testVeryLongTextIsStillCut(): void
    {
        $oGrid = $this->grid();
        $sText = trim(str_repeat('word ', 60));

        $a = $this->limit($oGrid, $sText, 10, true, false);
        $this->assertLessThanOrEqual(10 * 6, mb_strlen($a[0]));
        $this->assertStringEndsWith('...', $a[0]);
        $this->assertStringContainsString($sText, $a[1], 'The button still shows all of it.');
    }

    public function testGridWithoutTheButtonCutsAsBefore(): void
    {
        $oGrid = $this->grid();

        $s = $this->limit($oGrid, 'Account Dashboard Manage Tools Menu', 15, false);
        $this->assertStringEndsWith('...', $s);
        $this->assertLessThanOrEqual(15, mb_strlen($s));
        $this->assertStringNotContainsString('<button', $s);
        $this->assertFalse($this->bxGetProtected($oGrid, '_bCellClamp', BxBaseGrid::class));
    }

    public function testCellWithLongerTextIsATwoLineBox(): void
    {
        $oGrid = $this->grid();
        $aField = ['name' => 'title', 'chars_limit' => 15, 'translatable' => 0, 'width' => '17%'];

        $sValue = $this->limit($oGrid, 'Account Dashboard Manage Tools Menu', 15);
        $sCell = $this->bxCallProtected($oGrid, '_getCellDefault', $sValue, 'title', $aField, []);
        $this->assertStringContainsString('><div class="bx-grid-cell-clamp">Account Dashboard Manage Tools Menu<button', $sCell);
        $this->assertStringEndsWith('</div></td>', $sCell);

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
        $this->assertStringContainsString('.bx-grid-cell-clamp.bx-grid-cell-clamped .bx-str-limit {', $sCss);

        $sJs = file_get_contents(BX_DIRECTORY_PATH_ROOT . 'inc/js/classes/BxDolGrid.js');
        $this->assertStringContainsString('BxDolGrid.prototype.markClampedCells', $sJs);
        $this->assertStringContainsString("toggleClass('bx-grid-cell-clamped'", $sJs);
    }
}
