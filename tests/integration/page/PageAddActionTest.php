<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * A section's "add" action: the + at the end of its title row on the site (cover.html, BxBasePage::getAddEntryAction)
 * and the "Add" button the apps draw from the page's `menu` (`add_url`, `add_title`, `add_allowed`). Both come from the
 * module's create page and the same permission check as that page (ACL "create entry"), so they always agree: guests and
 * members whose level may not create that item type get no button; the apps keep `add_url` for the section's Search.
 */
#[Group('integration')]
class PageAddActionTest extends BxDolIntegrationTestCase
{
    private const MODULE = 'bx_groups';
    private const URI = 'groups-home';

    private $_aGetBackup;
    private ?array $_aMatrixBackup = null;

    protected function setUp(): void
    {
        parent::setUp();

        if (!BxDolModuleQuery::getInstance()->isEnabledByName(self::MODULE))
            $this->markTestSkipped(self::MODULE . ' is not installed.');

        $this->_aGetBackup = $_GET;
        $this->bxBecomeGuest();
        BxDolDb::getInstance()->cleanMemoryAll();
    }

    protected function tearDown(): void
    {
        if ($this->_aMatrixBackup !== null)
            BxDolDb::getInstance()->query("UPDATE `sys_acl_matrix` SET `AllowedPeriodEnd` = :end WHERE `IDLevel` = :level AND `IDAction` = :action", $this->_aMatrixBackup);

        $_GET = $this->_aGetBackup ?? [];
        $this->bxBecomeGuest();
        BxDolDb::getInstance()->cleanMemoryAll();
        $GLOBALS['glMemCache'] = [];
        parent::tearDown();
    }

    /** The section's page as NEO asks for it; page, menu and module objects are cached per request, so drop them. */
    private function requestMenu(): array
    {
        $this->resetObjects();

        $_GET = ['api' => 1];
        $aData = BxDolService::call('system', 'get_page_by_request', ['page/' . self::URI, '', json_encode(new stdClass())], 'TemplServicePages', true);
        $this->assertIsArray($aData);
        $this->assertIsArray($aData['menu'] ?? null);

        return $aData['menu'];
    }

    /** The section's page as the site draws it. */
    private function siteAction(): array
    {
        $this->resetObjects();
        $_GET = [];

        $oPage = BxDolPage::getObjectInstanceByURI(self::URI);
        $this->assertInstanceOf(BxBasePage::class, $oPage);

        return $oPage->getAddEntryAction();
    }

    private function resetObjects(): void
    {
        if (($sObject = BxDolPageQuery::getPageObjectNameByURI(self::URI)))
            unset($GLOBALS['bxDolClasses']['BxDolPage!' . $sObject]);
        foreach (array_keys($GLOBALS['bxDolClasses'] ?? []) as $sKey)
            if (strpos($sKey, 'BxDolMenu!') === 0)
                unset($GLOBALS['bxDolClasses'][$sKey]);
        // The module keeps the profile it was made for.
        unset($GLOBALS['bxDolClasses']['Module' . self::MODULE], $GLOBALS['bxDolClasses'][self::MODULE]);
        foreach (array_keys($GLOBALS['bxDolClasses'] ?? []) as $sKey)
            if (stripos($sKey, 'BxGroupsModule') !== false)
                unset($GLOBALS['bxDolClasses'][$sKey]);
        BxDolMenu::setSelectedGlobal('', '');
        BxDolDb::getInstance()->cleanMemoryAll();
    }

    public function testGuestsGetNoAddButton(): void
    {
        $aMenu = $this->requestMenu();
        $this->assertSame('create-group-profile', $aMenu['add_url'] ?? null, 'The apps keep the create page for the section\'s Search.');
        $this->assertFalse($aMenu['add_allowed'] ?? null);

        $this->assertSame([], $this->siteAction());
    }

    public function testAMemberWhoMayCreateGetsTheButtonOnBothSides(): void
    {
        $this->bxLoginAsUser();

        $aMenu = $this->requestMenu();
        $this->assertTrue($aMenu['add_allowed'] ?? null);
        $this->assertSame(_t('_sys_txt_add_entry', _t('_bx_groups_txt_sample_single')), $aMenu['add_title'] ?? null);

        $aAction = $this->siteAction();
        $this->assertSame(bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=create-group-profile')), $aAction['url'] ?? null);
        $this->assertSame($aMenu['add_title'], $aAction['title'] ?? null);

        // The module's own add icon: its create item in its "My" menu, the same on both sides.
        $aMenuObject = BxDolMenuQuery::getMenuObject('bx_groups_my');
        $sIcon = BxDolMenuQuery::getMenuItemIconByLink($aMenuObject['set_name'], 'page.php?i=create-group-profile') ?: 'plus';
        $this->assertSame($sIcon, $aMenu['add_icon'] ?? null);
        $this->assertSame($sIcon, $aAction['icon'] ?? null);
    }

    public function testAMemberWhoseLevelMayNotCreateGetsNoButton(): void
    {
        $this->bxLoginAsUser();

        // The create page's own check: the member's level loses "create entry" (its period ends in the past).
        $oDb = BxDolDb::getInstance();
        $iProfileId = (int)bx_get_logged_profile_id();
        $aLevel = BxDolAcl::getInstance()->getMemberMembershipInfo($iProfileId);
        $iAction = (int)BxDolAcl::getInstance()->getMembershipActionId('create entry', self::MODULE);
        $aRow = $oDb->getRow("SELECT `AllowedPeriodEnd` FROM `sys_acl_matrix` WHERE `IDLevel` = :level AND `IDAction` = :action", ['level' => (int)$aLevel['id'], 'action' => $iAction]);
        if (!$aRow)
            $this->markTestSkipped('The member\'s level may not create groups on this site.');

        $this->_aMatrixBackup = ['end' => $aRow['AllowedPeriodEnd'], 'level' => (int)$aLevel['id'], 'action' => $iAction];
        $oDb->query("UPDATE `sys_acl_matrix` SET `AllowedPeriodEnd` = '2000-01-01 00:00:00' WHERE `IDLevel` = :level AND `IDAction` = :action", ['level' => (int)$aLevel['id'], 'action' => $iAction]);

        $aMenu = $this->requestMenu();
        $this->assertFalse($aMenu['add_allowed'] ?? null);
        $this->assertSame('create-group-profile', $aMenu['add_url'] ?? null);

        $this->assertSame([], $this->siteAction());
    }

    public function testNoButtonOnAPageTheMemberCannotOpen(): void
    {
        $this->bxLoginAsUser();
        if (isAdmin())
            $this->markTestSkipped('The user account is an operator.');

        $this->resetObjects();
        $_GET = [];
        $oPage = BxDolPage::getObjectInstanceByURI('groups-administration');
        if (!$oPage)
            $this->markTestSkipped('No groups-administration page.');

        $this->assertSame([], $oPage->getAddEntryAction(), 'An operator\'s page: the apps show its 403 card.');
    }

    /** Channels have no "create entry" action (they are made from hashtags): no button, and the page still loads. */
    public function testAModuleWithoutTheCreateActionGetsNoButton(): void
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_channels'))
            $this->markTestSkipped('bx_channels is not installed.');

        $this->bxLoginAsUser();
        $oModule = BxDolModule::getInstance('bx_channels');
        $this->assertSame(0, BxDolAcl::getInstance()->getMembershipActionId('create entry', 'bx_channels'));

        $aAdd = BxBasePage::getAddEntryParams($oModule);
        $this->assertNotSame([], $aAdd);
        $this->assertFalse($aAdd['allowed']);
    }

    /** Only a Lucide name reaches the button: an uploaded picture (a number) or markup there gives the plus on both sides. */
    public function testAnIconThatIsNotALucideNameGivesThePlus(): void
    {
        $oDb = BxDolDb::getInstance();
        $aMenuObject = BxDolMenuQuery::getMenuObject('bx_groups_my');
        $aBind = ['set' => $aMenuObject['set_name'], 'link' => 'page.php?i=create-group-profile'];
        $sOld = BxDolMenuQuery::getMenuItemIconByLink($aBind['set'], $aBind['link']);
        if ($sOld === '')
            $this->markTestSkipped('No create item in the Groups "My" menu.');

        try {
            $oDb->query("UPDATE `sys_menu_items` SET `icon` = '123' WHERE `set_name` = :set AND `link` = :link", $aBind);
            $this->assertSame('plus', BxBasePage::getAddEntryParams(BxDolModule::getInstance(self::MODULE))['icon']);
        }
        finally {
            $oDb->query("UPDATE `sys_menu_items` SET `icon` = :icon WHERE `set_name` = :set AND `link` = :link", $aBind + ['icon' => $sOld]);
        }
    }
}
