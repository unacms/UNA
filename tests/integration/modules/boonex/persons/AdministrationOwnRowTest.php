<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * People > Manage and Accounts: the operator's own row has no checkbox and no Active switch, and suspending or deleting
 * it from there is refused, so an operator can't lock themselves out from a grid.
 */
#[Group('integration')]
class AdministrationOwnRowTest extends BxDolIntegrationTestCase
{
    private function call($oGrid, string $sMethod, ...$aArgs)
    {
        $oMethod = new ReflectionMethod($oGrid, $sMethod);
        return $oMethod->invoke($oGrid, ...$aArgs);
    }

    public function testPeopleGridProtectsTheOperatorsOwnProfiles(): void
    {
        if(!BxDolModuleQuery::getInstance()->isEnabledByName('bx_persons'))
            $this->markTestSkipped('People are not installed.');

        $this->bxLoginAsAdmin();
        $iOwnProfile = (int)bx_get_logged_profile_id();
        $oOwn = BxDolProfile::getInstance($iOwnProfile);
        if(!$oOwn || $oOwn->getModule() != 'bx_persons')
            $this->markTestSkipped('The admin account has no person profile.');

        $oGrid = BxDolGrid::getObjectInstance('bx_persons_administration');
        $this->assertNotFalse($oGrid);

        $aOwnRow = ['id' => $oOwn->getContentId(), 'profile_id' => $iOwnProfile];
        $this->assertTrue($this->call($oGrid, '_isOwnRow', $aOwnRow));
        $this->assertTrue($this->call($oGrid, '_isCheckboxDisabled', $aOwnRow), 'no checkbox for bulk delete');
        $this->assertFalse($this->call($oGrid, '_enable', $oOwn->getContentId(), 0), 'not suspended from the grid');
        $this->assertSame('active', $oOwn->getStatus());

        $iOther = (int)BxDolDb::getInstance()->getOne("SELECT `p`.`id` FROM `sys_profiles` AS `p` WHERE `p`.`type` = 'bx_persons' AND `p`.`account_id` != :account LIMIT 1", ['account' => (int)getLoggedId()]);
        if($iOther) {
            $oOther = BxDolProfile::getInstance($iOther);
            $this->assertFalse($this->call($oGrid, '_isOwnRow', ['id' => $oOther->getContentId(), 'profile_id' => $iOther]), 'other people keep their switch');
        }
    }

    public function testAccountsGridProtectsTheOperatorsOwnAccount(): void
    {
        if(!BxDolModuleQuery::getInstance()->isEnabledByName('bx_accounts'))
            $this->markTestSkipped('Accounts are not installed.');

        $this->bxLoginAsAdmin();
        $oGrid = BxDolGrid::getObjectInstance('bx_accounts_administration');
        $this->assertNotFalse($oGrid);

        $iOwn = (int)getLoggedId();
        $this->assertTrue($this->call($oGrid, '_isCheckboxDisabled', ['id' => $iOwn]));
        $this->assertFalse($this->call($oGrid, '_isCheckboxDisabled', ['id' => $iOwn + 100000]));
        $this->assertFalse($this->call($oGrid, '_enable', $iOwn, 0), 'not suspended from the grid');
        $this->assertFalse($this->call($oGrid, '_doDelete', $iOwn), 'not deleted from the grid');
        $this->assertNotFalse(BxDolAccount::getInstance($iOwn));
    }
}
