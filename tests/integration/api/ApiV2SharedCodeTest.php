<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Code API v2 shares with the site and API v1 does what only v2 wants in an API v2 request alone
 * (bx_is_api_v2, which BxDolApiV2Router::run marks). Everywhere else it asks the database what
 * it always asked: these cases compare the SQL of the two.
 */
#[Group('integration')]
class ApiV2SharedCodeTest extends BxDolIntegrationTestCase
{
    protected $_sApiV2Enable;

    protected function setUp(): void
    {
        parent::setUp();
        $this->_sApiV2Enable = getParam(BxDolApiV2Router::OPTION_ENABLE);
    }

    protected function tearDown(): void
    {
        bx_is_api_v2(false);
        BxDolDb::getInstance()->cleanMemoryAll();
        if (getParam(BxDolApiV2Router::OPTION_ENABLE) !== $this->_sApiV2Enable)
            setParam(BxDolApiV2Router::OPTION_ENABLE, $this->_sApiV2Enable);
        parent::tearDown();
    }

    public function testNothingIsAnApiV2RequestUntilTheRouterSaysSo(): void
    {
        $this->assertFalse(bx_is_api_v2());
        $this->assertTrue(bx_is_api_v2(true));
        $this->assertTrue(bx_is_api_v2());
        $this->assertFalse(bx_is_api_v2(false));
    }

    public function testCommentsByDateFollowTheirIdsOnlyInApiV2(): void
    {
        $sSystem = (string)BxDolDb::getInstance()->getOne("SELECT `Name` FROM `sys_objects_cmts` ORDER BY `ID` LIMIT 1");
        if ($sSystem === '' || !($oCmts = BxDolCmts::getObjectInstance($sSystem, 0)))
            $this->markTestSkipped('The site has no comments object.');
        $oQuery = $oCmts->getQueryObject();

        $fOrder = function (array $aOrder) use ($oQuery) {
            $a = $this->record(function () use ($oQuery, $aOrder) {
                $oQuery->getComments(0, 0, 0, '', $aOrder, 0, 3, true);
            });
            $a = array_values(array_filter($a, fn($s) => stripos($s, 'ORDER BY') !== false && stripos($s, 'cmt_time') !== false));
            $this->assertCount(1, $a);
            return preg_replace('/^.* ORDER BY (.*?) LIMIT .*$/s', '$1', $a[0]);
        };

        $aByDate = ['by' => BX_CMT_ORDER_BY_DATE, 'way' => BX_CMT_ORDER_WAY_DESC];
        $this->assertStringNotContainsString('cmt_id', $fOrder($aByDate), 'the site and API v1: by date alone');
        $this->assertStringContainsString('`cmt_id` DESC', $fOrder($aByDate + ['before' => 5]), 'a keyset page');

        bx_is_api_v2(true);
        $this->assertStringContainsString('`cmt_time` DESC, ', $fOrder($aByDate));
        $this->assertStringContainsString('`cmt_id` DESC', $fOrder($aByDate));
    }

    public function testConnectionsByDateFollowTheirIdsOnlyInApiV2(): void
    {
        if (!($oConnection = BxDolConnection::getObjectInstance('sys_profiles_friends')))
            $this->markTestSkipped('The friends connection is not installed.');

        $fOrder = function (int $iOrder) use ($oConnection) {
            $a = $this->record(function () use ($oConnection, $iOrder) {
                $oConnection->getConnectedContent(1, false, 0, 3, $iOrder);
            });
            $a = array_values(array_filter($a, fn($s) => stripos($s, 'ORDER BY') !== false));
            $this->assertCount(1, $a);
            return trim(preg_replace('/^.*(ORDER BY .*?) LIMIT .*$/s', '$1', $a[0]));
        };

        $this->assertSame('ORDER BY `c`.`added` DESC', $fOrder(BX_CONNECTIONS_ORDER_ADDED_DESC));
        $this->assertSame('ORDER BY `c`.`added` ASC', $fOrder(BX_CONNECTIONS_ORDER_ADDED_ASC));

        bx_is_api_v2(true);
        $this->assertSame('ORDER BY `c`.`added` DESC, `c`.`id` DESC', $fOrder(BX_CONNECTIONS_ORDER_ADDED_DESC));
        $this->assertSame('ORDER BY `c`.`added` ASC, `c`.`id` ASC', $fOrder(BX_CONNECTIONS_ORDER_ADDED_ASC));
    }

    public function testAnOddExtensionIsAskedOfTheDatabaseOutsideApiV2(): void
    {
        $aObject = BxDolStorageQuery::getStorageObject('sys_images');
        if (empty($aObject))
            $this->markTestSkipped('The sys_images storage is not installed.');
        $oQuery = new BxDolStorageQuery($aObject);

        $fQueries = function (string $sExt) use ($oQuery) {
            $oQuery->cleanMemoryAll();
            return count(array_filter($this->record(function () use ($oQuery, $sExt) {
                $oQuery->getMimeTypeByExt($sExt);
            }), fn($s) => stripos($s, 'sys_storage_mime_types') !== false));
        };

        $this->assertSame(1, $fQueries('jpg?t=1'), 'the site and API v1 ask, as they always did');

        bx_is_api_v2(true);
        $this->assertSame(0, $fQueries('jpg?t=1'));
        $this->assertFalse($oQuery->getMimeTypeByExt('jpg?t=1'));
        $this->assertSame(1, $fQueries('jpg'));
    }

    public function testALevelsActionIsReadAloneOutsideApiV2(): void
    {
        $oQuery = BxDolAclQuery::getInstance();
        $iAction = (int)$oQuery->getOne("SELECT `ID` FROM `sys_acl_actions` ORDER BY `ID` LIMIT 1");
        if (!$iAction)
            $this->markTestSkipped('The site has no ACL actions.');

        $oMemory = new ReflectionProperty(BxDolDb::class, '_aDbCacheData');

        $fQueries = function () use ($oQuery, $iAction) {
            $oQuery->cleanMemoryAll();
            return array_values(array_filter($this->record(function () use ($oQuery, $iAction) {
                $oQuery->getAction(MEMBERSHIP_ID_STANDARD, $iAction);
            }), fn($s) => stripos($s, 'sys_acl_matrix') !== false));
        };

        // the site and API v1: that action's row, kept under the key it always had
        $a = $fQueries();
        $this->assertCount(1, $a);
        $this->assertStringContainsString('WHERE `taa`.`ID` =', $a[0]);
        $this->assertSame(['BxDolAclQuery::getAction' . MEMBERSHIP_ID_STANDARD . $iAction], array_values(array_filter(array_keys($oMemory->getValue()), fn($s) => str_starts_with($s, 'BxDolAclQuery::getAction'))));

        // API v2: the level's rights for every action in one query, the level and the action apart in the key
        bx_is_api_v2(true);
        $a = $fQueries();
        $this->assertCount(1, $a);
        $this->assertStringNotContainsString('WHERE `taa`.`ID` =', $a[0]);
        $this->assertArrayHasKey('BxDolAclQuery::getAction' . MEMBERSHIP_ID_STANDARD . '_' . $iAction, $oMemory->getValue());
        $this->assertArrayNotHasKey('BxDolAclQuery::getAction' . MEMBERSHIP_ID_STANDARD . $iAction, $oMemory->getValue());
    }

    public function testPruningLeavesApiV2AloneWhileItIsOff(): void
    {
        $oCron = new BxDolCronPruning();

        setParam(BxDolApiV2Router::OPTION_ENABLE, '');
        $aQueries = [];
        $bRan = null;
        $aQueries = $this->record(function () use ($oCron, &$bRan) {
            $bRan = $oCron->cleanApiV2();
        });
        $this->assertFalse($bRan);
        $this->assertSame([], array_values(array_filter($aQueries, fn($s) => stripos($s, 'sys_api_') !== false && stripos($s, 'sys_options') === false)), 'no table of API v2 is touched');

        setParam(BxDolApiV2Router::OPTION_ENABLE, 'on');
        $this->assertTrue($oCron->cleanApiV2());
    }

    /**
     * Run the callback and return the SQL statements it made.
     */
    protected function record(callable $fCallback): array
    {
        $oRecorder = new class {
            public array $aQueries = [];
            public function beginQuery($sSql) { $this->aQueries[] = preg_replace('/\s+/', ' ', $sSql); }
            public function __call($sName, $aArgs) { return null; }
        };

        $mixedPrevious = $GLOBALS['bx_profiler'] ?? null;
        $GLOBALS['bx_profiler'] = $oRecorder;
        try {
            $fCallback();
        }
        finally {
            if ($mixedPrevious !== null)
                $GLOBALS['bx_profiler'] = $mixedPrevious;
            else
                unset($GLOBALS['bx_profiler']);
        }

        return $oRecorder->aQueries;
    }
}
