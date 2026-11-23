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
        $oOptions = new BxDolStudioOptions(BX_DOL_STUDIO_STG_TYPE_SYSTEM, BX_DOL_STUDIO_STG_CATEGORY_AUDIT);
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

        $iMenu = (int)BxDolDb::getInstance()->getOne("SELECT `id` FROM `sys_objects_menu` ORDER BY `id` ASC LIMIT 1");
        if ($iMenu <= 0)
            $this->markTestSkipped('No menu to open.');

        $this->bxLoginAsAdmin();
        $this->turnLogOn();

        $iBefore = $this->maxId();
        $_GET = [
            'o' => 'sys_studio_nav_menus',
            'a' => 'edit',
            'ids' => [$iMenu],
            'sskin' => '',
            'csrf_token' => BxDolForm::getCsrfToken(),
        ];

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

        $aRow = $this->latest('grid:sys_studio_nav_menus', (string)$iMenu, $iBefore);
        $this->assertIsArray($aRow);
        $this->assertSame('edit', $aRow['action']);
        $this->assertSame('studio', $aRow['source']);
        $this->assertStringContainsString('"' . $iMenu . '"', $aRow['before']);
        $this->assertNotSame('', $aRow['after']);

        BxDolDb::getInstance()->query("DELETE FROM `sys_admin_log` WHERE `id` = :id", ['id' => (int)$aRow['id']]);
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
