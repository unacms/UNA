<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * BxDolPrivacy::_check() with stored privacy values that are not a valid group.
 * An empty value used to reach checkSpace(), where negating '' throws a TypeError
 * under PHP 8 and took down every page that checked it (the timeline feed among them).
 */
#[Group('integration')]
class PrivacyCheckGroupIdTest extends BxDolIntegrationTestCase
{
    private const OWNER_ID = 2147483000;

    private function privacy(): BxDolPrivacy
    {
        $sObject = BxDolDb::getInstance()->getOne("SELECT `object` FROM `sys_objects_privacy` ORDER BY `id` LIMIT 1");
        if (!$sObject)
            $this->markTestSkipped('No privacy objects are installed.');

        $oPrivacy = BxDolPrivacy::getObjectInstance($sObject);
        if (!$oPrivacy)
            $this->markTestSkipped('Privacy object ' . $sObject . ' did not load.');

        return $oPrivacy;
    }

    private function check(BxDolPrivacy $oPrivacy, $mixedGroupId): bool
    {
        $oMethod = new ReflectionMethod($oPrivacy, '_check');

        return $oMethod->invoke($oPrivacy, 1, 0, ['group_id' => $mixedGroupId, 'owner_id' => self::OWNER_ID]);
    }

    public function testEmptyGroupIdDeniesWithoutError(): void
    {
        $this->assertFalse($this->check($this->privacy(), ''));
    }

    public function testNonNumericGroupIdDeniesWithoutError(): void
    {
        $this->assertFalse($this->check($this->privacy(), 'x'));
    }

    public function testMissingSpaceDenies(): void
    {
        $this->assertFalse($this->check($this->privacy(), (string)-self::OWNER_ID));
    }

    public function testPublicGroupAsStringStillAllows(): void
    {
        $this->assertTrue($this->check($this->privacy(), (string)BX_DOL_PG_ALL));
    }
}
