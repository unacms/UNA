<?php

/**
 * Profile-module DB helpers via Persons (no row writes).
 */
class BxPersonsDbTest extends BxPersonsTestCase
{
    public function testSearchByTermWithoutQuickSearchFields()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $aBackup = $CNF['FIELDS_QUICK_SEARCH'];
        $CNF['FIELDS_QUICK_SEARCH'] = [];
        try {
            $this->assertSame([], $this->_oModule->_oDb->searchByTerm('ada', 5));
        } finally {
            $CNF['FIELDS_QUICK_SEARCH'] = $aBackup;
        }
    }

    public function testSearchByIdsJoinsProfilesAndRequiresActive()
    {
        $oDb = $this->_oModule->_oDb;
        $aParams = [
            'search_params' => [
                'fullname' => ['operator' => 'like', 'value' => 'ada'],
            ],
            'per_page' => 5,
            'show_all_content' => true,
        ];
        $aMethod = ['name' => 'getAll', 'params' => [0 => 'query', 1 => []]];
        $sSelect = $sJoin = $sWhere = $sOrder = $sLimit = '';
        $aArgs = [$aParams, &$aMethod, &$sSelect, &$sJoin, &$sWhere, &$sOrder, &$sLimit];
        $this->bxCallProtectedArgs($oDb, '_getEntriesBySearchIds', $aArgs);

        $this->assertSame('getColumn', $aMethod['name']);
        $this->assertSame('bx_persons', $aMethod['params'][1]['profile_type']);
        $this->assertStringContainsString('LEFT JOIN `sys_profiles` AS `tp`', $sJoin);
        $this->assertStringContainsString("`tp`.`status`='active'", $sWhere);
        $this->assertStringContainsString('LIKE', $sWhere);
        $this->assertStringNotContainsString('sys_sessions', $sJoin);
    }

    public function testSearchByIdsOnlineJoinsSessions()
    {
        $oDb = $this->_oModule->_oDb;
        $aParams = [
            'search_params' => [
                'online' => ['operator' => '=', 'value' => 1],
            ],
            'show_all_content' => true,
        ];
        $aMethod = ['name' => 'getAll', 'params' => [0 => 'query', 1 => []]];
        $sSelect = $sJoin = $sWhere = $sOrder = $sLimit = '';
        $aArgs = [$aParams, &$aMethod, &$sSelect, &$sJoin, &$sWhere, &$sOrder, &$sLimit];
        $this->bxCallProtectedArgs($oDb, '_getEntriesBySearchIds', $aArgs);

        $this->assertArrayHasKey('online_time', $aMethod['params'][1]);
        $this->assertSame((int)getParam('sys_account_online_time'), $aMethod['params'][1]['online_time']);
        $this->assertStringContainsString('INNER JOIN `sys_accounts` AS `ta`', $sJoin);
        $this->assertStringContainsString('INNER JOIN `sys_sessions` AS `ts`', $sJoin);
        $this->assertStringContainsString('`ts`.`date` > (UNIX_TIMESTAMP() - 60 * :online_time)', $sWhere);
        $this->assertStringNotContainsString('`online`', $sWhere);
    }

    public function testGetEntriesNumByParamsEmptyAndInvalidOperator()
    {
        $i = $this->_oModule->_oDb->getEntriesNumByParams();
        $this->assertIsNumeric($i);
        $this->assertGreaterThanOrEqual(0, (int)$i);

        $this->expectException(Exception::class);
        $this->_oModule->_oDb->getEntriesNumByParams([
            ['key' => 'status', 'operator' => 'OR 1=1', 'value' => 'active'],
        ]);
    }
}
