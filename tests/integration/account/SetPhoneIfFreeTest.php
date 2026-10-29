<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * BxDolAccountQuery::setPhoneIfFree, which two-factor login uses to save a new phone:
 * an account without a phone gets one only while no other account has it, and gives it up
 * if another account turns out to have it after the save, so two accounts saving one phone
 * at once don't both keep it.
 *
 * The test changes the phones of the admin test account and of another account and puts them back.
 */
#[Group('integration')]
class SetPhoneIfFreeTest extends BxDolIntegrationTestCase
{
    private array $_aBackup = [];
    private int $_iId = 0;
    private int $_iOther = 0;

    protected function setUp(): void
    {
        parent::setUp();

        $oDb = BxDolDb::getInstance();
        $this->_iId = (int)$this->bxAccount('admin')->id();
        $this->_iOther = (int)$oDb->getOne("SELECT `id` FROM `sys_accounts` WHERE `id` != :id ORDER BY `id` LIMIT 1", ['id' => $this->_iId]);
        if (!$this->_iOther)
            $this->markTestSkipped('There is no other account.');

        $this->_aBackup = $oDb->getAll("SELECT `id`, `phone`, `phone_confirmed` FROM `sys_accounts` WHERE `id` IN (:id, :other)", ['id' => $this->_iId, 'other' => $this->_iOther]);
        $this->setPhone($this->_iId, '');
        $this->setPhone($this->_iOther, '');
    }

    protected function tearDown(): void
    {
        foreach ($this->_aBackup as $aRow)
            BxDolDb::getInstance()->query("UPDATE `sys_accounts` SET `phone` = :phone, `phone_confirmed` = :phone_confirmed WHERE `id` = :id", $aRow);

        parent::tearDown();
    }

    private function setPhone(int $iId, string $sPhone): void
    {
        BxDolDb::getInstance()->query("UPDATE `sys_accounts` SET `phone` = :phone, `phone_confirmed` = 1 WHERE `id` = :id", ['phone' => $sPhone, 'id' => $iId]);
    }

    private function phone(int $iId): array
    {
        BxDolDb::getInstance()->cleanMemoryAll();
        return BxDolDb::getInstance()->getRow("SELECT `phone`, `phone_confirmed` FROM `sys_accounts` WHERE `id` = :id", ['id' => $iId]);
    }

    private function newPhone(): string
    {
        return '+1 555 014 ' . random_int(1000, 9999);
    }

    public function testFreePhoneIsSavedUnconfirmed(): void
    {
        $sPhone = $this->newPhone();

        $this->assertTrue(BxDolAccountQuery::getInstance()->setPhoneIfFree($sPhone, $this->_iId));
        $this->assertSame(['phone' => $sPhone, 'phone_confirmed' => '0'], array_map('strval', $this->phone($this->_iId)));
    }

    public function testPhoneOfAnotherAccountIsGivenUp(): void
    {
        $sPhone = $this->newPhone();

        // The other account saved it first, or at the same moment and hasn't looked yet: either way it's there now.
        $this->setPhone($this->_iOther, $sPhone);

        $this->assertFalse(BxDolAccountQuery::getInstance()->setPhoneIfFree($sPhone, $this->_iId));
        $this->assertSame('', $this->phone($this->_iId)['phone'], 'Given up after the save.');
        $this->assertSame($sPhone, $this->phone($this->_iOther)['phone']);

        // The other account then looks for another owner, finds none and keeps it.
        $this->assertSame(0, (int)BxDolDb::getInstance()->getOne("SELECT `id` FROM `sys_accounts` WHERE `phone` = :phone AND `id` != :id LIMIT 1", ['phone' => $sPhone, 'id' => $this->_iOther]));
    }

    public function testPhoneOfTheAccountIsntReplaced(): void
    {
        $sPhone = $this->newPhone();
        $this->setPhone($this->_iId, $sPhone);

        $this->assertFalse(BxDolAccountQuery::getInstance()->setPhoneIfFree($this->newPhone(), $this->_iId));
        $this->assertSame($sPhone, $this->phone($this->_iId)['phone']);
    }
}
