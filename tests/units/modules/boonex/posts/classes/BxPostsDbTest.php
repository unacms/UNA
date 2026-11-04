<?php

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Content-module DB helpers via Posts (no row writes).
 */
class BxPostsDbTest extends BxPostsTestCase
{
    #[DataProvider('providerForEbsiLike')]
    public function testGetEbsiLike($sIn, $sNeedle)
    {
        $s = $this->bxCallProtected($this->_oModule->_oDb, '_getEbsiLike', $sIn);
        $this->assertStringContainsString($sNeedle, $s);
    }

    static public function providerForEbsiLike()
    {
        return [
            ['hello', '%hello%'],
            ['hello world', '%hello%world%'],
            ['a   b', '%a%b%'],
        ];
    }

    public function testSearchByIdsAddsActiveStatusAndOperators()
    {
        $oDb = $this->_oModule->_oDb;
        $aParams = [
            'search_params' => [
                'title' => ['operator' => 'like', 'value' => 'hello world'],
                'author' => ['operator' => 'in', 'value' => [10, 11]],
                'cat' => ['operator' => '=', 'value' => 3],
            ],
            'per_page' => 5,
            'start' => 10,
            'show_all_content' => true,
        ];
        $aMethod = ['name' => 'getAll', 'params' => [0 => 'query']];
        $sSelect = $sJoin = $sWhere = $sOrder = $sLimit = '';
        $aArgs = [$aParams, &$aMethod, &$sSelect, &$sJoin, &$sWhere, &$sOrder, &$sLimit];
        $this->bxCallProtectedArgs($oDb, '_getEntriesBySearchIds', $aArgs);

        $this->assertSame('getColumn', $aMethod['name']);
        $this->assertStringContainsString('`bx_posts_posts`.`status`=\'active\'', $sWhere);
        $this->assertStringContainsString('`bx_posts_posts`.`status_admin`=\'active\'', $sWhere);
        $this->assertStringContainsString('LIKE', $sWhere);
        $this->assertStringContainsString('%hello%world%', $sWhere);
        $this->assertStringContainsString(' IN (', $sWhere);
        $this->assertStringContainsString('`cat` =', $sWhere);
        $this->assertSame(3, $aMethod['params'][1]['cat']);
        $this->assertNotEmpty($sLimit);
        $this->assertStringNotContainsString('INNER JOIN `sys_profiles`', $sJoin);
    }

    public function testSearchByIdsLikeArrayAndInvalidOperator()
    {
        $oDb = $this->_oModule->_oDb;
        $aParams = [
            'search_params' => [
                'title' => ['operator' => 'like', 'value' => ['one', 'two']],
                'cf' => ['operator' => 'and', 'value' => [1, 3]],
            ],
            'show_all_content' => true,
        ];
        $aMethod = ['name' => 'getAll', 'params' => [0 => 'query']];
        $sSelect = $sJoin = $sWhere = $sOrder = $sLimit = '';
        $aArgs = [$aParams, &$aMethod, &$sSelect, &$sJoin, &$sWhere, &$sOrder, &$sLimit];
        $this->bxCallProtectedArgs($oDb, '_getEntriesBySearchIds', $aArgs);

        $this->assertStringContainsString(' OR ', $sWhere);
        $this->assertStringContainsString(' & ', $sWhere);

        $this->expectException(Exception::class);
        $aParamsBad = [
            'search_params' => [
                'title' => ['operator' => 'OR 1=1', 'value' => 'x'],
            ],
            'show_all_content' => true,
        ];
        $aArgsBad = [$aParamsBad, &$aMethod, &$sSelect, &$sJoin, &$sWhere, &$sOrder, &$sLimit];
        $this->bxCallProtectedArgs($oDb, '_getEntriesBySearchIds', $aArgsBad);
    }

    public function testSearchByIdsIgnoresUnknownFieldNames()
    {
        $oDb = $this->_oModule->_oDb;
        $aParams = [
            'search_params' => [
                'title' => ['operator' => 'like', 'value' => 'hello'],
                'id` OR 1' => ['operator' => 'and', 'value' => '1'],
                'not_a_real_column' => ['operator' => '=', 'value' => '1'],
                'order' => [['field' => 'added', 'direction' => 'ASC']],
            ],
            'show_all_content' => true,
        ];
        $aMethod = ['name' => 'getAll', 'params' => [0 => 'query', 1 => []]];
        $sSelect = $sJoin = $sWhere = $sOrder = $sLimit = '';
        $aArgs = [$aParams, &$aMethod, &$sSelect, &$sJoin, &$sWhere, &$sOrder, &$sLimit];
        $this->bxCallProtectedArgs($oDb, '_getEntriesBySearchIds', $aArgs);

        $this->assertStringContainsString('`bx_posts_posts`.`title`', $sWhere);
        $this->assertStringContainsString('LIKE', $sWhere);
        $this->assertStringNotContainsString('OR 1', $sWhere);
        $this->assertStringNotContainsString('not_a_real_column', $sWhere);
        $this->assertStringContainsString('`bx_posts_posts`.`added` ASC', $sOrder);
        $this->assertArrayNotHasKey('id` OR 1', $aMethod['params'][1]);
    }

    public function testSearchByIdsOrderRejectsBadIdentifier()
    {
        $oDb = $this->_oModule->_oDb;
        $aMethod = ['name' => 'getAll', 'params' => [0 => 'query', 1 => []]];
        $sSelect = $sJoin = $sWhere = $sOrder = $sLimit = '';
        $aParams = [
            'search_params' => [
                'order' => [['table' => 'bx_posts_posts`', 'field' => 'added']],
            ],
            'show_all_content' => true,
        ];
        $aArgs = [$aParams, &$aMethod, &$sSelect, &$sJoin, &$sWhere, &$sOrder, &$sLimit];

        $this->expectException(Exception::class);
        $this->bxCallProtectedArgs($oDb, '_getEntriesBySearchIds', $aArgs);
    }

    public function testProcessParamsIgnoresUnknownFieldNames()
    {
        $aBindings = [];
        $sWhere = '';
        BxDolSearchExtended::processParams([
            'title' => ['operator' => 'like', 'value' => 'hello'],
            'id` OR 1' => ['operator' => 'and', 'value' => '1'],
            'not_a_real_column' => ['operator' => '=', 'value' => '1'],
            'order' => [['field' => 'added', 'direction' => 'ASC']],
        ], [
            'table' => 'bx_posts_posts',
            'bindings' => &$aBindings,
            'where_clause' => &$sWhere,
        ]);

        $this->assertStringContainsString('`bx_posts_posts`.`title`', $sWhere);
        $this->assertStringContainsString('LIKE', $sWhere);
        $this->assertStringNotContainsString('OR 1', $sWhere);
        $this->assertStringNotContainsString('not_a_real_column', $sWhere);
        $this->assertArrayNotHasKey('id` OR 1', $aBindings);
    }

    public function testUpdateEntriesByRejectsEmpty()
    {
        $this->assertFalse($this->_oModule->_oDb->updateEntriesBy([], ['id' => 1]));
        $this->assertFalse($this->_oModule->_oDb->updateEntriesBy(['status' => 'hidden'], []));
    }

    public function testLinksHelpersWhenAttachEnabled()
    {
        $this->assertTrue($this->_oModule->_oConfig->isAttachLinks());
        $this->assertIsArray($this->_oModule->_oDb->getLinks(0));
        $this->assertIsArray($this->_oModule->_oDb->getUnusedLinks(0));
    }
}
