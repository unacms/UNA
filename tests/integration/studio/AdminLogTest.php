<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Studio writes a row when a setting changes and when a Studio grid action runs.
 */
#[Group('integration')]
class AdminLogTest extends BxDolIntegrationTestCase
{
    private array $_aGetBackup = [];
    private string $_sOption = 'sys_audit_max_records';
    private $mixedOption = null;
    private $mixedEnable = null;
    private bool $_bEnableTouched = false;

    protected function setUp(): void
    {
        parent::setUp();
        require_once(BX_DIRECTORY_PATH_ROOT . 'studio/inc/utils.inc.php'); // bx_get_js_result, for the settings save's reply
        $this->_aGetBackup = $_GET;
    }

    protected function tearDown(): void
    {
        $_GET = $this->_aGetBackup;

        if ($this->mixedOption !== null)
            setParam($this->_sOption, $this->mixedOption);
        if ($this->_bEnableTouched)
            setParam('sys_admin_log_enable', $this->mixedEnable === false ? '' : (string)$this->mixedEnable);

        BxDolDb::getInstance()->cacheParams(true);

        parent::tearDown();
    }

    public function testSaveChangesLogsTheOptionThatChanged(): void
    {
        if (!$this->ready())
            $this->markTestSkipped('sys_admin_log is not installed.');

        $this->bxLoginAsAdmin();
        $this->turnLogOn();

        $sOld = (string)getParam($this->_sOption);
        $this->mixedOption = $sOld;
        $sNew = (string)((int)$sOld + 1);

        $aValues = $this->auditValues();
        $aValues[$this->_sOption] = $sNew;
        $aValues['categories'] = 'audit';
        $aValues['mix_id'] = '';

        $iBefore = $this->maxId();
        $oOptions = new BxTemplStudioOptions(BX_DOL_STUDIO_STG_TYPE_SYSTEM, BX_DOL_STUDIO_STG_CATEGORY_AUDIT);
        $oForm = $this->form($aValues);
        $sResult = $oOptions->saveChanges($oForm);

        $aRow = $this->latest('option', $this->_sOption, $iBefore);
        $this->assertIsArray($aRow, is_string($sResult) ? $sResult : 'no admin log row');
        $this->assertSame('save', $aRow['action']);
        $this->assertSame('studio', $aRow['source']);
        $this->assertStringContainsString($sOld, $aRow['before']);
        $this->assertStringContainsString($sNew, $aRow['after']);

        $iOthers = (int)BxDolDb::getInstance()->getOne(
            "SELECT COUNT(*) FROM `sys_admin_log` WHERE `id` > :id AND `object_type` = 'option' AND `object_id` <> :name",
            ['id' => $iBefore, 'name' => $this->_sOption]
        );
        $this->assertSame(0, $iOthers);

        BxDolDb::getInstance()->query("DELETE FROM `sys_admin_log` WHERE `id` = :id", ['id' => (int)$aRow['id']]);
    }

    public function testGridPhpLogsAStudioGridAction(): void
    {
        if (!$this->ready())
            $this->markTestSkipped('sys_admin_log is not installed.');

        $oDb = BxDolDb::getInstance();
        $aItem = $oDb->getRow("SELECT `id`, `active` FROM `sys_menu_items` ORDER BY `id` ASC LIMIT 1");
        if (!$aItem)
            $this->markTestSkipped('No menu item to switch.');

        $iItem = (int)$aItem['id'];
        $iActive = (int)$aItem['active'];

        $this->bxLoginAsAdmin();
        $this->turnLogOn();

        $iBefore = $this->maxId();
        try {
            $this->runGridPhp([
                'o' => 'sys_studio_nav_items',
                'a' => 'enable',
                'ids' => [$iItem],
                'checked' => 1 - $iActive,
                'sskin' => '',
                'csrf_token' => BxDolForm::getCsrfToken(),
            ]);
        }
        finally {
            $oDb->query("UPDATE `sys_menu_items` SET `active` = :active WHERE `id` = :id", ['active' => $iActive, 'id' => $iItem]);
        }

        $aRow = $this->latest('grid:sys_studio_nav_items', (string)$iItem, $iBefore);
        $this->assertIsArray($aRow);
        $this->assertSame($iActive ? 'disable' : 'enable', $aRow['action']);
        $this->assertSame('studio', $aRow['source']);
        $aBefore = json_decode($aRow['before'], true);
        $aAfter = json_decode($aRow['after'], true);
        $this->assertSame($iActive, (int)$aBefore[(string)$iItem]['active']);
        $this->assertSame(1 - $iActive, (int)$aAfter[(string)$iItem]['active']);

        $oDb->query("DELETE FROM `sys_admin_log` WHERE `id` = :id", ['id' => (int)$aRow['id']]);
    }

    public function testOpeningAnEditFormIsNotLogged(): void
    {
        if (!$this->ready())
            $this->markTestSkipped('sys_admin_log is not installed.');

        $iMenu = (int)BxDolDb::getInstance()->getOne("SELECT `id` FROM `sys_objects_menu` ORDER BY `id` ASC LIMIT 1");
        if ($iMenu <= 0)
            $this->markTestSkipped('No menu to open.');

        $this->bxLoginAsAdmin();
        $this->turnLogOn();

        $iBefore = $this->maxId();
        $this->runGridPhp([
            'o' => 'sys_studio_nav_menus',
            'a' => 'edit',
            'ids' => [$iMenu],
            'sskin' => '',
            'csrf_token' => BxDolForm::getCsrfToken(),
        ]);

        $this->assertFalse($this->latest('grid:sys_studio_nav_menus', (string)$iMenu, $iBefore));
    }

    public function testAGridActionOfAMemberIsNotLoggedEvenWithTheStudioSkin(): void
    {
        if (!$this->ready())
            $this->markTestSkipped('sys_admin_log is not installed.');

        $this->bxLoginAsUser();
        $this->turnLogOn();

        $_GET['ids'] = ['1'];
        $oGrid = $this->fakeGrid();

        $iBefore = $this->maxId();
        $bRan = false;
        ob_start();
        BxDolAdminLog::runGrid($oGrid, 'delete', true, function () use (&$bRan) {
            $bRan = true;
            echoJson(['grid' => '', 'blink' => [1]]);
        });
        ob_end_clean();

        $this->assertTrue($bRan);
        $this->assertSame($iBefore, $this->maxId());
    }

    public function testAStudioPageActionIsLoggedOnceAndOnlyWhenItSucceeded(): void
    {
        if (!$this->ready())
            $this->markTestSkipped('sys_admin_log is not installed.');

        $this->bxLoginAsAdmin();
        $this->turnLogOn();

        $oPage = new BxDolStudioAdminLogTestPage();
        $iBefore = $this->maxId();

        // The form is only shown: nothing changed.
        $_GET = ['bp_action' => 'block_edit', 'id' => '7'];
        BxDolAdminLog::runStudioAction($oPage, fn() => ['popup' => ['html' => '']]);
        $this->assertSame($iBefore, $this->maxId());

        // A read is not a change.
        $_GET = ['bp_action' => 'get_page', 'id' => '7'];
        BxDolAdminLog::runStudioAction($oPage, fn() => ['code' => 0, 'content' => '']);
        $this->assertSame($iBefore, $this->maxId());

        // The form was saved.
        $_GET = ['bp_action' => 'block_edit', 'id' => '7', 'title' => 'New', 'password' => 'p'];
        BxDolAdminLog::runStudioAction($oPage, fn() => ['eval' => 'x']);
        $aRow = $this->latest('studio:admin_log_test_page', '7', $iBefore);
        $this->assertIsArray($aRow);
        $this->assertSame('block_edit', $aRow['action']);
        $this->assertStringContainsString('"title":"New"', $aRow['after']);
        $this->assertStringNotContainsString('"password":"p"', $aRow['after']);

        // A request the page refuses (no id) is answered with nothing too: not a change.
        $_GET = ['bp_action' => 'block_edit'];
        $_POST = [];
        $iMid = $this->maxId();
        BxDolAdminLog::runStudioAction($oPage, fn() => []);
        $this->assertSame($iMid, $this->maxId());

        // Page settings saved with the same layout answer with nothing to redraw: a posted form, so a change.
        $_GET = ['bp_action' => 'page_edit', 'id' => '8'];
        $_POST = ['title' => 'Page'];
        BxDolAdminLog::runStudioAction($oPage, fn() => []);
        $_POST = [];
        $aRow = $this->latest('studio:admin_log_test_page', '8', $iBefore);
        $this->assertIsArray($aRow);
        $this->assertSame('page_edit', $aRow['action']);

        // An action that wrote its own row is not written again.
        $iMid = $this->maxId();
        $_GET = ['bp_action' => 'activate', 'id' => '8'];
        BxDolAdminLog::runStudioAction($oPage, function () {
            BxDolAdminLog::record(['source' => 'studio', 'object_type' => 'module', 'object_id' => 'x', 'action' => 'enable']);
            return ['code' => 0];
        });
        $this->assertSame($iMid + 1, $this->maxId());

        BxDolDb::getInstance()->query("DELETE FROM `sys_admin_log` WHERE `id` > :id", ['id' => $iBefore]);
    }

    public function testAStudioPageActionKeepsTheRowBeforeAndAfter(): void
    {
        if (!$this->ready())
            $this->markTestSkipped('sys_admin_log is not installed.');

        $this->bxLoginAsAdmin();
        $this->turnLogOn();

        $oPage = new BxDolStudioAdminLogSnapshotTestPage();
        $sType = 'studio:admin_log_snapshot_test_page';
        $iBefore = $this->maxId();

        // An edit keeps the old row and the new one.
        $oPage->aRow = ['id' => 7, 'title' => 'Old'];
        $_GET = ['bp_action' => 'block_edit', 'id' => '7'];
        $_POST = ['title' => 'New'];
        BxDolAdminLog::runStudioAction($oPage, function () use ($oPage) {
            $oPage->aRow['title'] = 'New';
            return ['eval' => 'x'];
        });
        $aRow = $this->latest($sType, '7', $iBefore);
        $this->assertIsArray($aRow);
        $this->assertStringContainsString('"title":"Old"', $aRow['before']);
        $this->assertStringContainsString('"title":"New"', $aRow['after']);

        // A delete keeps the row it removed and nothing after.
        $iMid = $this->maxId();
        $_GET = ['bp_action' => 'block_delete', 'id' => '7'];
        $_POST = [];
        BxDolAdminLog::runStudioAction($oPage, function () use ($oPage) {
            $oPage->aRow = [];
            return ['eval' => 'x'];
        });
        $aRow = $this->latest($sType, '7', $iMid);
        $this->assertIsArray($aRow);
        $this->assertSame('block_delete', $aRow['action']);
        $this->assertStringContainsString('"title":"New"', $aRow['before']);
        $this->assertSame('', (string)$aRow['after']);

        // A posted form for a block that is not there is refused with nothing: not a change.
        $iMid = $this->maxId();
        $_GET = ['bp_action' => 'block_edit'];
        $_POST = ['title' => 'New'];
        BxDolAdminLog::runStudioAction($oPage, fn() => []);
        $_POST = [];
        $this->assertSame($iMid, $this->maxId());

        BxDolDb::getInstance()->query("DELETE FROM `sys_admin_log` WHERE `id` > :id", ['id' => $iBefore]);
    }

    private function runGridPhp(array $aGet): void
    {
        $_GET = $aGet;

        $sCwd = getcwd();
        ob_start();
        try {
            chdir(BX_DIRECTORY_PATH_ROOT);
            require BX_DIRECTORY_PATH_ROOT . 'grid.php';
        }
        finally {
            ob_end_clean();
            if ($sCwd !== false)
                chdir($sCwd);
        }
    }

    private function fakeGrid(): object
    {
        return new class {
            public function getObject(): string
            {
                return 'sys_admin_log_test';
            }

            public function getSourceOptions(): array
            {
                return ['object' => 'sys_admin_log_test', 'source_type' => '', 'table' => '', 'field_id' => ''];
            }
        };
    }

    public function testAChangeMadeThroughMcpIsRecordedUnderTheMcpProtocol(): void
    {
        if (!$this->ready())
            $this->markTestSkipped('sys_admin_log is not installed.');

        $this->turnLogOn();
        $iBefore = $this->maxId();

        BxDolAdminLog::setProtocol('mcp');
        try {
            BxDolAdminLog::record(['source' => 'agent', 'object_type' => 'email', 'object_id' => 'mcp-test@example.com', 'action' => 'send']);
        }
        finally {
            BxDolAdminLog::setProtocol('');
        }
        BxDolAdminLog::record(['source' => 'agent', 'object_type' => 'email', 'object_id' => 'agent-test@example.com', 'action' => 'send']);

        $aMcp = $this->latest('email', 'mcp-test@example.com', $iBefore);
        $aAgent = $this->latest('email', 'agent-test@example.com', $iBefore);
        BxDolDb::getInstance()->query("DELETE FROM `sys_admin_log` WHERE `id` > :id", ['id' => $iBefore]);

        $this->assertIsArray($aMcp);
        $this->assertSame('mcp', $aMcp['source']);
        $this->assertIsArray($aAgent);
        $this->assertSame('agent', $aAgent['source']);
    }

    public function testTheGridShowsTypesActionsAndObjectsByTheirTitles(): void
    {
        if (!$this->ready())
            $this->markTestSkipped('sys_admin_log is not installed.');
        if (_t('_adm_txt_admin_log_t_sys_options') === '_adm_txt_admin_log_t_sys_options')
            $this->markTestSkipped('The Studio log titles are not in the language yet.');

        $this->bxLoginAsAdmin();

        $oGrid = BxDolGrid::getObjectInstance('sys_admin_log_administration');
        $this->assertInstanceOf(BxDolStudioAdminLogGrid::class, $oGrid);

        // types: a short name, a table, a module's content, a type with no title
        $this->assertSame(_t('_adm_txt_admin_log_t_sys_options'), $oGrid->getObjectTypeTitle('option'));
        $this->assertSame(_t('_adm_txt_admin_log_t_sys_menu_items'), $oGrid->getObjectTypeTitle('menu_item'));
        $this->assertSame(_t('_adm_txt_admin_log_t_sys_menu_items'), $oGrid->getObjectTypeTitle('sys_menu_items'));
        $this->assertSame(_t('_adm_txt_admin_log_t_content', 'no_such_module'), $oGrid->getObjectTypeTitle('content:no_such_module'));
        $this->assertSame('sys_no_such_table', $oGrid->getObjectTypeTitle('sys_no_such_table'));

        // actions: the whole name, its last word, an agent's SQL verb, an action with no title
        $this->assertSame(_t('_adm_txt_admin_log_a_edit'), $oGrid->getActionTitle('block_edit'));
        $this->assertSame(_t('_adm_txt_admin_log_a_insert'), $oGrid->getActionTitle('INSERT'));
        $this->assertSame('no_such_action', $oGrid->getActionTitle('no_such_action'));

        // an object: the title of the changed row with its id, a module by its title
        $sName = $oGrid->getLoggedItemTitle([
            'object_type' => 'grid:sys_studio_nav_items',
            'object_id' => '5',
            'before' => '',
            'after' => json_encode(['5' => ['id' => 5, 'title_system' => 'Home']]),
        ]);
        $this->assertSame(_t('_adm_txt_admin_log_item', 'Home', '5'), $sName);

        // a long value that changes past what the window shows is still a change, shown around the difference
        $sLong = str_repeat('a', 5000);
        $oDiff = new ReflectionMethod($oGrid, 'diffRows');
        [$aChanged, $aSame] = $oDiff->invoke($oGrid, json_encode(['5' => ['text' => $sLong . 'b']]), json_encode(['5' => ['text' => $sLong . 'c']]));
        $this->assertCount(1, $aChanged);
        $this->assertSame([], $aSame);
        $this->assertStringStartsWith('...', $aChanged[0]['before']);
        $this->assertStringEndsWith('ab', $aChanged[0]['before']);
        $this->assertStringEndsWith('ac', $aChanged[0]['after']);
    }

    private function ready(): bool
    {
        $oDb = BxDolDb::getInstance();

        return $oDb->isTableExists('sys_admin_log')
            && $oDb->getOne("SELECT `name` FROM `sys_options` WHERE `name` = 'sys_admin_log_enable' LIMIT 1") === 'sys_admin_log_enable';
    }

    private function turnLogOn(): void
    {
        $this->mixedEnable = getParam('sys_admin_log_enable', false);
        if (getParam('sys_admin_log_enable') !== 'on')
            setParam('sys_admin_log_enable', 'on');
        if ($this->mixedEnable !== 'on')
            $this->_bEnableTouched = true;
    }

    private function auditValues(): array
    {
        $aRows = BxDolDb::getInstance()->getAll("SELECT `o`.`name`, `o`.`value` FROM `sys_options` AS `o` INNER JOIN `sys_options_categories` AS `c` ON `c`.`id` = `o`.`category_id` WHERE `c`.`name` = 'audit'");
        $a = [];
        foreach ($aRows as $aRow)
            $a[$aRow['name']] = (string)$aRow['value'];

        return $a;
    }

    private function form(array $aValues): object
    {
        return new class($aValues) {
            public function __construct(private array $aValues)
            {
            }

            public function getCleanValue($sName)
            {
                return array_key_exists($sName, $this->aValues) ? $this->aValues[$sName] : false;
            }

            public function getId(): string
            {
                return 'adm-settings-form';
            }

            public function getCsrfToken(): string
            {
                return 'token';
            }
        };
    }

    private function maxId(): int
    {
        return (int)BxDolDb::getInstance()->getOne("SELECT MAX(`id`) FROM `sys_admin_log`");
    }

    private function latest(string $sType, string $sId, int $iBefore): array|false
    {
        $a = BxDolDb::getInstance()->getRow(
            "SELECT * FROM `sys_admin_log` WHERE `id` > :id AND `object_type` = :type AND `object_id` = :object ORDER BY `id` DESC LIMIT 1",
            ['id' => $iBefore, 'type' => $sType, 'object' => $sId]
        );

        return $a ?: false;
    }
}

/**
 * A Studio page for BxDolAdminLog::runStudioAction: its type in the log is studio:admin_log_test_page.
 */
class BxDolStudioAdminLogTestPage
{
}

/**
 * A Studio page that names the row its block actions change, like BxDolStudioBuilderPage.
 */
class BxDolStudioAdminLogSnapshotTestPage
{
    public array $aRow = [];

    public function getLogSnapshot(string $sAction): ?array
    {
        if (!str_starts_with($sAction, 'block_'))
            return null;

        return (int)bx_get('id') ? $this->aRow : [];
    }
}
