<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The dashboard's "Administration" tab is for operators and moderators, as its page is (sys_dashboard_admin): the apps
 * draw every item of the menu they get, and showed members a tab that opened empty.
 */
#[Group('integration')]
class DashboardAdminTabTest extends BxDolIntegrationTestCase
{
    public function testOnlyOperatorsAndModeratorsSeeTheTab(): void
    {
        $oDb = BxDolDb::getInstance();
        $iLevels = (int)$oDb->getOne("SELECT `visible_for_levels` FROM `sys_menu_items` WHERE `set_name` = 'sys_account_dashboard' AND `module` = 'system' AND `name` = 'dashboard-admin'");
        $iPageLevels = (int)$oDb->getOne("SELECT `visible_for_levels` FROM `sys_objects_page` WHERE `object` = 'sys_dashboard_admin'");

        $fBit = function($iLevelId) {
            return pow(2, $iLevelId - 1);
        };

        $this->assertSame(0, $iLevels & $fBit(MEMBERSHIP_ID_STANDARD), 'Members don\'t see it.');
        $this->assertSame(0, $iLevels & $fBit(MEMBERSHIP_ID_ACCOUNT), 'Accounts without a profile don\'t see it.');
        $this->assertNotSame(0, $iLevels & $fBit(MEMBERSHIP_ID_ADMINISTRATOR), 'Operators see it.');
        $this->assertSame(0, $iLevels & ~$iPageLevels, 'The tab is shown to no one its page is hidden from.');
    }
}
