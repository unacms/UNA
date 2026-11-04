<?php

/**
 * A one-column page with nothing to show the viewer (Explore for guests on a site without Timeline) says so, with
 * the message every empty list shows, instead of a blank area. A page with more columns keeps its empty cells.
 */
class BxBasePageEmptyTest extends BxDolTestCase
{
    private function pageVars(int $iCells): array
    {
        $oPage = BxDolPage::getObjectInstance('sys_explore');
        if (!$oPage)
            $this->markTestSkipped('The Explore page is not installed.');
        $oPage = clone $oPage;

        $aBlocks = [];
        for ($i = 1; $i <= $iCells; $i++)
            $aBlocks['cell_' . $i] = [];

        $oQuery = $this->createStub(BxDolPageQuery::class);
        $oQuery->method('getPageBlocks')->willReturn($aBlocks);
        $this->bxSetProtected($oPage, '_oQuery', $oQuery, BxDolPage::class);

        $aObject = $this->bxGetProtected($oPage, '_aObject', BxDolPage::class);
        $aObject['cells_number'] = $iCells;
        $this->bxSetProtected($oPage, '_aObject', $aObject, BxDolPage::class);

        return $this->bxCallProtected($oPage, '_getPageCodeVars');
    }

    public function testEmptyOneColumnPageSaysSo(): void
    {
        $aVars = $this->pageVars(1);
        $this->assertStringContainsString('bx-msg-box', $aVars['cell_1']);
        $this->assertStringContainsString(_t('_Empty'), $aVars['cell_1']);
        $this->assertNotSame('_Empty', _t('_Empty'), 'The language string is installed.');
    }

    public function testPageWithMoreColumnsKeepsItsEmptyCells(): void
    {
        $aVars = $this->pageVars(2);
        $this->assertSame('', $aVars['cell_1']);
        $this->assertSame('', $aVars['cell_2']);
    }
}
