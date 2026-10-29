<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Forwards every call to a comments query object and counts the getComment calls by comment id.
 */
class CmtsRowsScopeApiTestQuery
{
    public array $aCalls = [];

    public function __construct(private $oQuery)
    {
    }

    public function getComment($iObjectId, $iCmtId)
    {
        $this->aCalls[(int)$iCmtId] = ($this->aCalls[(int)$iCmtId] ?? 0) + 1;
        return $this->oQuery->getComment($iObjectId, $iCmtId);
    }

    public function __call($sName, $aArgs)
    {
        return $this->oQuery->$sName(...$aArgs);
    }
}

/**
 * A comment built for the app reads its row once while its actions and manage menus are built,
 * instead of once per menu and check, and the rows scope is closed again afterwards.
 * It uses an existing Timeline comment without replies and skips when there is none.
 */
#[Group('integration')]
class CmtsRowsScopeApiTest extends BxDolIntegrationTestCase
{
    protected $_aGetBackup;
    protected $_aClassesBefore = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->_aGetBackup = $_GET;
        $this->_aClassesBefore = array_keys($GLOBALS['bxDolClasses'] ?? []);
    }

    protected function tearDown(): void
    {
        /**
         * Modules, menus and comments objects made here are shared by the process and keep the
         * admin's profile and the API mode they were made with: drop them for the next tests.
         */
        foreach (array_diff(array_keys($GLOBALS['bxDolClasses'] ?? []), $this->_aClassesBefore) as $sKey)
            unset($GLOBALS['bxDolClasses'][$sKey]);

        $_GET = $this->_aGetBackup ?? [];
        parent::tearDown();
    }

    public function testCommentRowIsReadOnceForItsMenus(): void
    {
        $oDb = BxDolDb::getInstance();
        $oModules = BxDolModuleQuery::getInstance();

        //--- The latest comment without replies of the first comments system that has one.
        $sSystem = '';
        $aCmt = [];
        foreach ($oDb->getAll("SELECT `Name`, `Module`, `Table` FROM `sys_objects_cmts` WHERE `IsOn` = 1 ORDER BY `ID`") as $aSystem) {
            if (!$oModules->isEnabledByName($aSystem['Module']) || !$oDb->isTableExists($aSystem['Table']))
                continue;

            $aCmt = $oDb->getRow("SELECT `cmt_id`, `cmt_object_id` FROM `" . $aSystem['Table'] . "` WHERE `cmt_replies` = 0 ORDER BY `cmt_id` DESC LIMIT 1");
            if (!empty($aCmt)) {
                $sSystem = $aSystem['Name'];
                break;
            }
        }
        if (!$sSystem)
            $this->markTestSkipped('There are no comments.');

        $this->bxLoginAsAdmin();
        $_GET['api'] = 1;

        // A fresh instance in API mode; the shared one may have been built for the web.
        $sKey = 'BxDolCmts!' . $sSystem . (int)$aCmt['cmt_object_id'];
        unset($GLOBALS['bxDolClasses'][$sKey]);
        try {
            $oCmts = BxDolCmts::getObjectInstance($sSystem, (int)$aCmt['cmt_object_id']);
            $this->assertInstanceOf(BxDolCmts::class, $oCmts);

            $oQuery = new CmtsRowsScopeApiTestQuery($this->bxGetProtected($oCmts, '_oQuery', BxDolCmts::class));
            $this->bxSetProtected($oCmts, '_oQuery', $oQuery, BxDolCmts::class);

            $aStructure = $oCmts->getCommentStructure((int)$aCmt['cmt_id'], [], ['type' => BX_CMT_DISPLAY_THREADED]);
        }
        finally {
            unset($GLOBALS['bxDolClasses'][$sKey]);
        }

        $this->assertIsArray($aStructure);
        $this->assertArrayHasKey('i' . $aCmt['cmt_id'], $aStructure);
        $this->assertLessThanOrEqual(2, $oQuery->aCalls[(int)$aCmt['cmt_id']] ?? 0, 'Once for the root, once while the menus are built.');
        $this->assertNull($this->bxGetProtected($oCmts, '_aCmtRowsScope', BxDolCmts::class), 'The scope is closed again.');
    }
}
