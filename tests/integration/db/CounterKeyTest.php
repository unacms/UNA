<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Keys of BxDolKey that count their uses, as two-factor login counts the tries of its codes:
 * each use is checked and counted by one query, so parallel requests can't use a key more times than it allows.
 */
#[Group('integration')]
class CounterKeyTest extends BxDolIntegrationTestCase
{
    private array $_aKeys = [];

    protected function tearDown(): void
    {
        foreach ($this->_aKeys as $sKey)
            BxDolKey::getInstance()->removeKey($sKey);

        parent::tearDown();
    }

    private function newKey(int $iExpire): string
    {
        $sKey = BxDolKey::getInstance()->getNewCounterKey($iExpire);
        $this->assertIsString($sKey);
        $this->_aKeys[] = $sKey;

        return $sKey;
    }

    public function testKeyAllowsItsUsesAndNoMore(): void
    {
        $oKey = BxDolKey::getInstance();
        $sKey = $this->newKey(60);

        for ($i = 1; $i <= 3; $i++) {
            $this->assertTrue($oKey->canUseCounterKey($sKey, 3));
            $this->assertSame($i, $oKey->useCounterKey($sKey, 3));
        }

        $this->assertFalse($oKey->canUseCounterKey($sKey, 3));
        $this->assertFalse($oKey->useCounterKey($sKey, 3));
        $this->assertSame('3', BxDolDb::getInstance()->getOne("SELECT `data` FROM `sys_keys` WHERE `key` = :key", ['key' => $sKey]), 'A refused use isn\'t counted.');
    }

    public function testGivenBackUseCanBeUsedAgain(): void
    {
        $oKey = BxDolKey::getInstance();
        $sKey = $this->newKey(60);

        $this->assertSame(1, $oKey->useCounterKey($sKey, 1));
        $this->assertTrue($oKey->giveBackCounterKey($sKey));
        $this->assertSame(1, $oKey->useCounterKey($sKey, 1));

        $this->assertTrue($oKey->giveBackCounterKey($sKey));
        $this->assertFalse($oKey->giveBackCounterKey($sKey), 'The count doesn\'t go below zero.');
    }

    public function testExpiredOrMissingKeyIsRefused(): void
    {
        $oKey = BxDolKey::getInstance();
        $sKey = $this->newKey(-1);

        $this->assertFalse($oKey->useCounterKey($sKey, 3));
        $this->assertFalse($oKey->canUseCounterKey($sKey, 3));
        $this->assertFalse($oKey->useCounterKey(md5('missing'), 3));

        $sKey = $this->newKey(60);
        $this->assertTrue($oKey->canUseCounterKey($sKey, 3, 30));
        $this->assertFalse($oKey->canUseCounterKey($sKey, 3, 120), 'Not for longer than the key works.');
    }
}
