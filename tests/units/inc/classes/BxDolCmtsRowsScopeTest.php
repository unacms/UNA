<?php

/**
 * Comment rows read through BxDolCmts::getCommentRow: every time by default, once per comment
 * while a rows scope is open (_getStructureAPI opens one while it builds a comment's menus).
 */
class BxDolCmtsRowsScopeTestQuery
{
    public int $iCalls = 0;

    public function getComment($iObjectId, $iCmtId)
    {
        $this->iCalls++;
        return ['cmt_id' => $iCmtId, 'cmt_object_id' => $iObjectId, 'read' => $this->iCalls];
    }
}

class BxDolCmtsRowsScopeTest extends BxDolTestCase
{
    private function cmts(BxDolCmtsRowsScopeTestQuery $oQuery): BxDolCmts
    {
        $o = (new ReflectionClass(BxDolCmts::class))->newInstanceWithoutConstructor();
        $this->bxSetProtected($o, '_iId', 7, BxDolCmts::class);
        $this->bxSetProtected($o, '_oQuery', $oQuery, BxDolCmts::class);

        return $o;
    }

    public function testRowsAreReadEveryTimeOutsideAScope(): void
    {
        $oQuery = new BxDolCmtsRowsScopeTestQuery();
        $oCmts = $this->cmts($oQuery);

        $oCmts->getCommentRow(3);
        $aRow = $oCmts->getCommentRow(3);

        $this->assertSame(2, $oQuery->iCalls);
        $this->assertSame(2, $aRow['read'], 'Without a scope a write in between is seen.');
    }

    public function testRowsAreReadOncePerCommentInAScope(): void
    {
        $oQuery = new BxDolCmtsRowsScopeTestQuery();
        $oCmts = $this->cmts($oQuery);
        $this->bxSetProtected($oCmts, '_aCmtRowsScope', [], BxDolCmts::class);

        $aFirst = $oCmts->getCommentRow(3);
        $this->assertSame($aFirst, $oCmts->getCommentRow('3'));
        $this->assertSame(['cmt_id' => 4, 'cmt_object_id' => 7, 'read' => 2], $oCmts->getCommentRow(4));
        $this->assertSame(2, $oQuery->iCalls);
    }
}
