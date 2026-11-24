<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Staff don't act on staff above them: only an operator deletes, suspends or switches into an operator's profile or account,
 * and a moderator doesn't act on moderators or administrators (bx_acl_can_manage_profile).
 */
#[Group('integration')]
class StaffGuardsTest extends BxDolIntegrationTestCase
{
    protected $_aLevelsBackup;
    protected $_aProfileIds;
    protected $_aCurrentProfilesBackup;

    protected function setUp(): void
    {
        parent::setUp();

        $this->_aProfileIds = [];
        foreach (['admin', 'user'] as $sKind) {
            $iProfileId = (int)BxDolProfileQuery::getInstance()->getCurrentProfileByAccount((int)$this->bxAccount($sKind)->id(), true);
            if (!$iProfileId)
                $this->markTestSkipped('The ' . $sKind . ' test account has no profile.');

            $this->_aProfileIds[$sKind] = $iProfileId;
        }

        $this->_aCurrentProfilesBackup = [];
        foreach (['admin', 'user'] as $sKind)
            $this->_aCurrentProfilesBackup[(int)$this->bxAccount($sKind)->id()] = (int)BxDolDb::getInstance()->getOne("SELECT `profile_id` FROM `sys_accounts` WHERE `id` = :id", ['id' => $this->bxAccount($sKind)->id()]);

        $this->_aLevelsBackup = BxDolDb::getInstance()->getAll("SELECT * FROM `sys_acl_levels_members` WHERE `IDMember` IN (" . implode(',', array_map('intval', $this->_aProfileIds)) . ")");

        if (!isAdmin((int)$this->bxAccount('admin')->id()) || isAdmin((int)$this->bxAccount('user')->id()))
            $this->markTestSkipped('The admin test account is expected to be an operator and the user test account a member.');
    }

    protected function tearDown(): void
    {
        $oDb = BxDolDb::getInstance();
        $oDb->query("DELETE FROM `sys_acl_levels_members` WHERE `IDMember` IN (" . implode(',', array_map('intval', $this->_aProfileIds)) . ")");
        foreach ($this->_aLevelsBackup as $aRow)
            $oDb->query("INSERT INTO `sys_acl_levels_members` (`IDMember`, `IDLevel`, `DateStarts`, `DateExpires`, `State`, `TransactionID`) VALUES (:IDMember, :IDLevel, :DateStarts, :DateExpires, :State, :TransactionID)", $aRow);

        foreach ($this->_aCurrentProfilesBackup as $iAccountId => $iProfileId) {
            $oDb->query("UPDATE `sys_accounts` SET `profile_id` = :profile WHERE `id` = :id", ['profile' => $iProfileId, 'id' => $iAccountId]);
            BxDolAccount::getInstance($iAccountId, true);
        }

        $this->refreshLevels();

        parent::tearDown();
    }

    protected function setLevel(string $sKind, int $iLevel): void
    {
        $oDb = BxDolDb::getInstance();
        $iProfileId = $this->_aProfileIds[$sKind];

        $oDb->query("DELETE FROM `sys_acl_levels_members` WHERE `IDMember` = :id", ['id' => $iProfileId]);
        if ($iLevel != MEMBERSHIP_ID_STANDARD)
            $oDb->query("INSERT INTO `sys_acl_levels_members` (`IDMember`, `IDLevel`, `DateStarts`, `DateExpires`) VALUES (:id, :level, NOW() - INTERVAL 1 DAY, NULL)", ['id' => $iProfileId, 'level' => $iLevel]);

        $this->refreshLevels();
        $this->assertSame($iLevel, (int)BxDolAcl::getInstance()->getMemberMembershipInfo($iProfileId, 0, true)['id'], 'The ' . $sKind . ' profile has the level.');
    }

    protected function refreshLevels(): void
    {
        BxDolDb::getInstance()->cleanMemoryAll();
        foreach ($this->_aProfileIds as $iProfileId)
            BxDolAcl::getInstance()->getMemberMembershipInfo($iProfileId, 0, true);
    }

    public function testOnlyOperatorsActOnOperators(): void
    {
        $this->setLevel('admin', MEMBERSHIP_ID_ADMINISTRATOR);
        $this->setLevel('user', MEMBERSHIP_ID_ADMINISTRATOR);

        $this->assertFalse(bx_acl_can_manage_profile($this->_aProfileIds['user'], $this->_aProfileIds['admin']), "An administrator who isn't an operator doesn't act on an operator.");
        $this->assertTrue(bx_acl_can_manage_profile($this->_aProfileIds['admin'], $this->_aProfileIds['user']), 'An operator acts on an administrator.');

        $this->setLevel('user', MEMBERSHIP_ID_STANDARD);
        $this->assertFalse(bx_acl_can_manage_profile($this->_aProfileIds['user'], $this->_aProfileIds['admin']), 'A member never acts on an operator.');
    }

    public function testModeratorsDontActOnStaff(): void
    {
        // The admin test account acts as a moderator here: the rule is about the level, whoever holds it.
        $this->setLevel('admin', MEMBERSHIP_ID_MODERATOR);

        $this->setLevel('user', MEMBERSHIP_ID_ADMINISTRATOR);
        $this->assertFalse(bx_acl_can_manage_profile($this->_aProfileIds['admin'], $this->_aProfileIds['user']), "A moderator doesn't act on an administrator.");

        $this->setLevel('user', MEMBERSHIP_ID_MODERATOR);
        $this->assertFalse(bx_acl_can_manage_profile($this->_aProfileIds['admin'], $this->_aProfileIds['user']), "A moderator doesn't act on a moderator.");

        $this->setLevel('user', MEMBERSHIP_ID_STANDARD);
        $this->assertTrue(bx_acl_can_manage_profile($this->_aProfileIds['admin'], $this->_aProfileIds['user']), 'A moderator acts on a member.');
    }

    public function testAccountsModuleGuards(): void
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_accounts'))
            $this->markTestSkipped('Accounts is not installed.');

        $oModule = BxDolModule::getInstance('bx_accounts');
        $iAdminAccountId = (int)$this->bxAccount('admin')->id();
        $iUserAccountId = (int)$this->bxAccount('user')->id();

        // A moderator (not an operator) signed in.
        $this->setLevel('user', MEMBERSHIP_ID_MODERATOR);
        $this->bxLoginAsUser();

        $this->assertFalse($oModule->isAllowDeleteOrDisableAccount($iAdminAccountId), "A moderator doesn't suspend or delete an operator's account.");
        $aAdminRow = ['id' => $iAdminAccountId];
        $this->assertNotSame(CHECK_ACTION_RESULT_ALLOWED, $oModule->checkAllowedDelete($aAdminRow), "A moderator can't delete an operator's account.");

        $this->setLevel('admin', MEMBERSHIP_ID_MODERATOR);
        $this->assertFalse($oModule->isAllowDeleteOrDisableAccount($iAdminAccountId), "A moderator doesn't act on a moderator's account either.");

        // The operator signed in acts on the moderator's account.
        $this->setLevel('admin', MEMBERSHIP_ID_ADMINISTRATOR);
        $this->bxLoginAsAdmin();
        $this->assertTrue($oModule->isAllowDeleteOrDisableAccount($iUserAccountId), 'An operator acts on a moderator.');
    }

    public function testSwitchToAnyProfileStopsAtStaff(): void
    {
        // An administrator who isn't an operator holds "switch to any profile".
        $this->setLevel('user', MEMBERSHIP_ID_ADMINISTRATOR);
        $this->setLevel('admin', MEMBERSHIP_ID_ADMINISTRATOR);
        $this->bxLoginAsUser();

        $aCheck = checkActionModule($this->_aProfileIds['user'], 'switch to any profile', 'system', false);
        if ($aCheck[CHECK_ACTION_RESULT] !== CHECK_ACTION_RESULT_ALLOWED)
            $this->markTestSkipped('Administrators may not switch to any profile on this site.');

        $iCurrentProfile = (int)bx_get_logged_profile_id();
        $mixedResult = (new BxTemplServiceAccount())->serviceSwitchProfile($this->_aProfileIds['admin']);
        $this->assertNotSame(true, $mixedResult, "An administrator doesn't switch into an operator's profile.");
        $this->assertSame($iCurrentProfile, (int)BxDolProfileQuery::getInstance()->getCurrentProfileByAccount((int)$this->bxAccount('user')->id(), true), 'The profile stays the same.');
    }
}
