<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Studio roles decide what an operator may do, not only which apps the launcher shows: a page's actions and its grids follow
 * the role, the Roles builder takes "Manage roles", and the Studio's own actions that change something take a POST with the
 * Studio's CSRF token.
 */
#[Group('integration')]
class StudioRoleChecksTest extends BxDolIntegrationTestCase
{
    protected $_aRoleMemberBackup;
    protected $_iAccountRoleBackup;
    protected $_aServerBackup;
    protected $_aActions2RolesBackup;
    protected $_sTokenEnableBackup;

    protected function setUp(): void
    {
        parent::setUp();

        $oDb = BxDolDb::getInstance();
        $oAccount = $this->bxAccount('admin');
        $this->_aRoleMemberBackup = $oDb->getRow("SELECT * FROM `sys_std_roles_members` WHERE `account_id` = :id", ['id' => $oAccount->id()]);
        $this->_iAccountRoleBackup = (int)$oDb->getOne("SELECT `role` FROM `sys_accounts` WHERE `id` = :id", ['id' => $oAccount->id()]);
        $this->_aActions2RolesBackup = $oDb->getAll("SELECT * FROM `sys_std_roles_actions2roles`");
        $this->_sTokenEnableBackup = getParam('sys_security_form_token_enable');
        $this->_aServerBackup = $_SERVER;

        $this->bxLoginAsAdmin();
    }

    protected function tearDown(): void
    {
        $oDb = BxDolDb::getInstance();
        $iAccountId = (int)$this->bxAccount('admin')->id();

        $oDb->query("DELETE FROM `sys_std_roles_members` WHERE `account_id` = :id", ['id' => $iAccountId]);
        if (!empty($this->_aRoleMemberBackup))
            $oDb->query("INSERT INTO `sys_std_roles_members` (`id`, `account_id`, `role`) VALUES (:id, :account_id, :role)", [
                'id' => $this->_aRoleMemberBackup['id'],
                'account_id' => $this->_aRoleMemberBackup['account_id'],
                'role' => $this->_aRoleMemberBackup['role'],
            ]);
        $oDb->query("UPDATE `sys_accounts` SET `role` = :role WHERE `id` = :id", ['role' => $this->_iAccountRoleBackup, 'id' => $iAccountId]);

        $oDb->query("DELETE FROM `sys_std_roles_actions2roles`");
        foreach ($this->_aActions2RolesBackup as $aRow)
            $oDb->query("INSERT INTO `sys_std_roles_actions2roles` (`role_id`, `action_id`) VALUES (:role_id, :action_id)", $aRow);

        setParam('sys_security_form_token_enable', $this->_sTokenEnableBackup);
        $_SERVER = $this->_aServerBackup;

        $oDb->cleanMemoryAll();
        BxDolAccount::getInstance($iAccountId, true);

        parent::tearDown();
    }

    /**
     * Gives the admin test account a Studio role: master or operator.
     */
    protected function setStudioRole(int $iRole): void
    {
        $iAccountId = (int)$this->bxAccount('admin')->id();
        BxDolStudioRolesUtils::getInstance()->setRole($iAccountId, [$iRole]);
        BxDolDb::getInstance()->cleanMemoryAll();
        BxDolAccount::getInstance($iAccountId, true);
    }

    /**
     * Takes "use <type>" away from the operator role.
     */
    protected function revokeFromOperator(string $sAction): void
    {
        $oDb = BxDolDb::getInstance();
        $iActionId = (int)$oDb->getOne("SELECT `id` FROM `sys_std_roles_actions` WHERE `name` = :name", ['name' => $sAction]);
        $this->assertGreaterThan(0, $iActionId, 'The role action ' . $sAction . ' exists.');

        $oDb->query("DELETE FROM `sys_std_roles_actions2roles` WHERE `role_id` = :role AND `action_id` = :action", [
            'role' => BX_DOL_STUDIO_ROLE_OPERATOR,
            'action' => $iActionId,
        ]);
        $oDb->cleanMemoryAll();
    }

    protected function asGet(array $aParams): void
    {
        $_SERVER['REQUEST_METHOD'] = 'GET';
        $_GET = $aParams;
        $_POST = [];
        $_REQUEST = $aParams;
    }

    protected function asPost(array $aParams): void
    {
        $_SERVER['REQUEST_METHOD'] = 'POST';
        $_GET = [];
        $_POST = $aParams;
        $_REQUEST = $aParams;
    }

    public function testGridsFollowTheRole(): void
    {
        $this->setStudioRole(BX_DOL_STUDIO_ROLE_MASTER);
        foreach (['sys_studio_roles', 'sys_studio_roles_actions', 'sys_studio_acl', 'sys_studio_forms_fields', 'sys_studio_nav_items', 'sys_studio_lang_keys'] as $sObject)
            $this->assertTrue(BxDolStudioGrid::isAllowedForRole($sObject), 'A master uses ' . $sObject . '.');

        $this->setStudioRole(BX_DOL_STUDIO_ROLE_OPERATOR);
        $this->assertFalse(BxDolStudioGrid::isAllowedForRole('sys_studio_roles'), 'The Roles grid takes "Manage roles".');
        $this->assertFalse(BxDolStudioGrid::isAllowedForRole('sys_studio_roles_actions'), 'The Roles actions grid takes "Manage roles".');
        $this->assertTrue(BxDolStudioGrid::isAllowedForRole('sys_studio_acl'), 'An operator who may use Configuration uses Permissions.');
        $this->assertTrue(BxDolStudioGrid::isAllowedForRole('sys_studio_forms_fields'));

        $this->revokeFromOperator('use configuration');
        $this->assertFalse(BxDolStudioGrid::isAllowedForRole('sys_studio_acl'), 'Permissions are a Configuration app.');
        $this->assertFalse(BxDolStudioGrid::isAllowedForRole('sys_studio_acl_actions'));
        $this->assertFalse(BxDolStudioGrid::isAllowedForRole('sys_studio_api_keys'), 'API is a Configuration app.');
        $this->assertTrue(BxDolStudioGrid::isAllowedForRole('sys_studio_forms_fields'), 'Forms are a Structure app, still allowed.');

        $this->revokeFromOperator('use structure');
        $this->assertFalse(BxDolStudioGrid::isAllowedForRole('sys_studio_forms_fields'));
        $this->assertFalse(BxDolStudioGrid::isAllowedForRole('sys_studio_nav_items'));
        $this->assertFalse(BxDolStudioGrid::isAllowedForRole('sys_badges_administration'));

        // grid.php gets no grid object for a grid the role doesn't allow
        $this->assertFalse(BxDolGrid::getObjectInstance('sys_studio_forms_fields', BxDolStudioTemplate::getInstance()), 'The grid answers no request.');
    }

    public function testPagesAndTheirActionsFollowTheRole(): void
    {
        $this->setStudioRole(BX_DOL_STUDIO_ROLE_OPERATOR);
        $this->assertFalse((new BxTemplStudioRoles())->isAccessAllowed(), 'The Roles builder takes "Manage roles".');
        $this->assertTrue((new BxTemplStudioPermissions())->isAccessAllowed());
        $this->assertTrue((new BxTemplStudioStore())->isAccessAllowed());

        $this->revokeFromOperator('use extensions');
        $this->assertFalse((new BxTemplStudioStore())->isAccessAllowed(), 'The Store is an Extensions app.');

        $this->revokeFromOperator('use appearance');
        $this->assertFalse((new BxTemplStudioDesigner())->isAccessAllowed(), 'The Designer is an Appearance app.');

        $this->setStudioRole(BX_DOL_STUDIO_ROLE_MASTER);
        $this->assertTrue((new BxTemplStudioRoles())->isAccessAllowed());
        $this->assertTrue((new BxTemplStudioStore())->isAccessAllowed());
    }

    public function testChangesTakeAPostWithTheToken(): void
    {
        setParam('sys_security_form_token_enable', 'on');
        BxDolDb::getInstance()->cleanMemoryAll();

        $sToken = BxDolForm::getCsrfToken();
        $this->assertNotEmpty($sToken);

        $this->asGet(['csrf_token' => $sToken]);
        $this->assertFalse(BxDolStudioPage::isWriteRequest(), 'A GET is not a change.');

        $this->asPost(['csrf_token' => 'not-a-token']);
        $this->assertFalse(BxDolStudioPage::isWriteRequest(), 'A POST with a bad token is refused.');

        $this->asPost([]);
        $this->assertFalse(BxDolStudioPage::isWriteRequest(), 'A POST without a token is refused.');

        $this->asPost(['csrf_token' => $sToken]);
        $this->assertTrue(BxDolStudioPage::isWriteRequest());
        $this->assertTrue(BxDolStudioPage::isWriteRequest(), 'The token is kept for the next change.');
    }

    /**
     * The requests below name apps, pages and blocks that don't exist, so that on a site without these checks they change nothing.
     */
    public function testLauncherActions(): void
    {
        setParam('sys_security_form_token_enable', 'on');
        BxDolDb::getInstance()->cleanMemoryAll();
        $oLauncher = BxTemplStudioLauncher::getInstance();

        $this->setStudioRole(BX_DOL_STUDIO_ROLE_MASTER);

        foreach (['page-bookmark', 'page-featured', 'widget-rearrange', 'launcher-reorder'] as $sAction) {
            $this->asGet(['action' => $sAction, 'page' => 'no_such_app', 'widget_id' => 0, 'type' => 'content']);
            $this->assertSame(3, $oLauncher->checkAction()['code'], $sAction . ' over GET is refused.');
        }

        // An operator doesn't move an app to another type (which decides the roles that may use it), nor pin it for everyone.
        $this->setStudioRole(BX_DOL_STUDIO_ROLE_OPERATOR);
        $sToken = BxDolForm::getCsrfToken();

        $this->asPost(['action' => 'widget-rearrange', 'widget_id' => 0, 'type' => 'content', 'csrf_token' => $sToken]);
        $this->assertSame(BxDolStudioPage::getAccessDeniedError(), $oLauncher->checkAction());

        $this->asPost(['action' => 'page-featured', 'page' => 'no_such_app', 'csrf_token' => $sToken]);
        $this->assertSame(BxDolStudioPage::getAccessDeniedError(), $oLauncher->checkAction());
    }

    public function testStoreDesignerAndPagesBuilderChanges(): void
    {
        setParam('sys_security_form_token_enable', 'on');
        BxDolDb::getInstance()->cleanMemoryAll();
        $this->setStudioRole(BX_DOL_STUDIO_ROLE_MASTER);

        foreach (['install', 'update', 'delete', 'get-file', 'get-update', 'get-update-and-install', 'add-to-cart', 'delete-from-cart'] as $sAction) {
            $this->asGet(['str_action' => $sAction, 'str_value' => 'boonex/no_such_app/', 'str_id' => 'bx_no_such_app']);
            $this->assertSame(3, (new BxTemplStudioStore())->checkAction()['code'], 'Store ' . $sAction . ' over GET is refused.');
        }

        // Other spellings reach the same methods (block__switch and BLOCK_SWITCH reach actionBlockSwitch), so they are changes too.
        foreach (['block_delete', 'block_switch', 'page_delete', 'reorder', 'block__switch', 'BLOCK_SWITCH', 'block__delete', 'page__delete', 'Page_Delete', 'REORDER'] as $sAction) {
            $this->asGet(['bp_action' => $sAction, 'bp_type' => 'custom', 'bp_page' => 'no_such_page', 'id' => 0, 'field' => 'active', 'checked' => 0]);
            $this->assertSame(3, (new BxTemplStudioBuilderPage('custom', 'no_such_page'))->checkAction()['code'], 'Pages ' . $sAction . ' over GET is refused.');
        }

        foreach (['delete_icon', 'delete_cover'] as $sAction) {
            $oDesigner = new BxTemplStudioDesigner();
            $sPrefix = (new ReflectionProperty($oDesigner, 'sParamPrefix'))->getValue($oDesigner);
            $this->asGet([$sPrefix . '_action' => $sAction, $sPrefix . '_value' => 'no_such_file']);
            $this->assertSame(3, $oDesigner->checkAction()['code'], 'Designer ' . $sAction . ' over GET is refused.');
        }
    }

    public function testUninstallTakesManageApps(): void
    {
        setParam('sys_security_form_token_enable', 'on');
        BxDolDb::getInstance()->cleanMemoryAll();

        $oModule = BxTemplStudioModule::getObjectInstance('bx_no_such_app', '');
        $sPrefix = (new ReflectionProperty($oModule, 'sParamPrefix'))->getValue($oModule);

        $this->setStudioRole(BX_DOL_STUDIO_ROLE_MASTER);
        foreach (['activate', 'uninstall'] as $sAction) {
            $this->asGet([$sPrefix . '_action' => $sAction, $sPrefix . '_value' => 'bx_no_such_app']);
            $this->assertSame(3, $oModule->checkAction()['code'], 'Apps ' . $sAction . ' over GET is refused.');
        }

        $this->setStudioRole(BX_DOL_STUDIO_ROLE_OPERATOR);
        $this->asPost([$sPrefix . '_action' => 'uninstall', $sPrefix . '_value' => 'bx_no_such_app', 'csrf_token' => BxDolForm::getCsrfToken()]);
        $this->assertSame(BxDolStudioPage::getAccessDeniedError(), $oModule->checkAction(), 'Uninstalling is for app managers.');
    }

    /**
     * An app's actions name the app they act on, which may not be the app whose page sent them: the role needs that app's type.
     */
    public function testAppActionsFollowTheRoleOfTheAppTheyName(): void
    {
        setParam('sys_security_form_token_enable', 'on');
        $oDb = BxDolDb::getInstance();
        $oDb->cleanMemoryAll();

        $sTypesQuery = "SELECT `p`.`name`, `w`.`type` FROM `sys_std_pages` AS `p` INNER JOIN `sys_std_widgets` AS `w` ON `w`.`page_id` = `p`.`id` INNER JOIN `sys_modules` AS `m` ON `m`.`name` = `w`.`module` WHERE `w`.`module` <> 'system' AND `w`.`module` = `p`.`name` AND `w`.`type` <> '' ORDER BY `p`.`id`";
        $aPages = $oDb->getPairs($sTypesQuery, 'name', 'type');
        $sThrough = $sTarget = '';
        foreach ($aPages as $sName => $sType) {
            if ($sThrough === '')
                $sThrough = $sName;
            else if ($sType != $aPages[$sThrough]) {
                $sTarget = $sName;
                break;
            }
        }
        if ($sTarget === '')
            $this->markTestSkipped('The site has no two installed apps of different types.');

        $this->setStudioRole(BX_DOL_STUDIO_ROLE_OPERATOR);
        $this->revokeFromOperator('use ' . $aPages[$sTarget]);
        $this->assertFalse(BxDolStudioRolesUtils::getInstance()->isPageAllowed($sTarget));
        $this->assertTrue(BxDolStudioRolesUtils::getInstance()->isPageAllowed($sThrough));

        $oModule = BxTemplStudioModule::getObjectInstance($sThrough, '');
        $this->assertTrue($oModule->isAccessAllowed(), 'The page the request comes through is allowed.');
        $sPrefix = (new ReflectionProperty($oModule, 'sParamPrefix'))->getValue($oModule);

        // The read-only actions go first, so that a site without the check doesn't reach activate.
        foreach (['context', 'settings', 'activate'] as $sAction) {
            $this->asPost([$sPrefix . '_action' => $sAction, $sPrefix . '_value' => $sTarget, $sPrefix . '_widget_id' => 1, 'csrf_token' => BxDolForm::getCsrfToken()]);
            $this->assertSame(BxDolStudioPage::getAccessDeniedError(), $oModule->checkAction(), $sAction . ' on an app the role may not use is refused.');
        }
    }
}
