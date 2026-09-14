<?php

use PHPUnit\Framework\Attributes\DataProvider;

class BxDolAclTestDouble extends BxDolAcl
{
    public $iLevelBit = 0;

    public function __construct()
    {
    }

    public function getMemberLevelBit($iProfileId = 0)
    {
        return $this->iLevelBit;
    }
}

/**
 * Membership bitsets and search-condition structure (no DB tracking).
 */
class BxDolAclTest extends \PHPUnit\Framework\TestCase
{
    #[DataProvider('providerForMemberLevelInSet')]
    public function testIsMemberLevelInSet($iLevelBit, $mixedPermissions, $bOut)
    {
        $o = new BxDolAclTestDouble();
        $o->iLevelBit = $iLevelBit;
        $this->assertSame($bOut, (bool)$o->isMemberLevelInSet($mixedPermissions));
    }

    static public function providerForMemberLevelInSet()
    {
        $iStandardBit = (int)pow(2, MEMBERSHIP_ID_STANDARD - 1);
        $iAdminBit = (int)pow(2, MEMBERSHIP_ID_ADMINISTRATOR - 1);

        return [
            [$iStandardBit, [MEMBERSHIP_ID_STANDARD], true],
            [$iStandardBit, [MEMBERSHIP_ID_ADMINISTRATOR], false],
            [$iStandardBit, $iStandardBit, true],
            [$iStandardBit, $iAdminBit, false],
            [$iStandardBit, [MEMBERSHIP_ID_STANDARD, MEMBERSHIP_ID_ADMINISTRATOR], true],
            [$iStandardBit, [], false],
            [$iStandardBit, 0, false],
        ];
    }

    public function testContentByLevelAsConditionUnconfirmed()
    {
        $o = new BxDolAclTestDouble();
        $a = $o->getContentByLevelAsCondition('author_id', MEMBERSHIP_ID_UNCONFIRMED);

        $this->assertStringContainsString('email_confirmed` = 0', $a['restriction_sql']);
        $this->assertSame([], $a['restriction']);
        $this->assertSame([], $a['join']);
    }

    public function testContentByLevelAsConditionUnconfirmedFromSingleElementArray()
    {
        $o = new BxDolAclTestDouble();
        $a = $o->getContentByLevelAsCondition('author_id', [MEMBERSHIP_ID_UNCONFIRMED]);

        $this->assertStringContainsString('email_confirmed` = 0', $a['restriction_sql']);
        $this->assertSame([], $a['join']);
    }

    public function testContentByLevelAsConditionStandard()
    {
        $o = new BxDolAclTestDouble();
        $a = $o->getContentByLevelAsCondition('author_id', MEMBERSHIP_ID_STANDARD);

        $this->assertStringContainsString('IDMember` IS NULL', $a['restriction_sql']);
        $this->assertStringContainsString('email_confirmed` != 0', $a['restriction_sql']);
        $this->assertSame('LEFT', $a['join']['acl_members']['type']);
        $this->assertSame('author_id', $a['join']['acl_members']['mainField']);
        $this->assertSame([], $a['restriction']);
    }

    public function testContentByLevelAsConditionCustom()
    {
        $o = new BxDolAclTestDouble();
        $a = $o->getContentByLevelAsCondition('author_id', MEMBERSHIP_ID_MODERATOR);

        $this->assertSame('INNER', $a['join']['acl_members']['type']);
        $this->assertSame('=', $a['restriction']['acl_members']['operator']);
        $this->assertSame(MEMBERSHIP_ID_MODERATOR, $a['restriction']['acl_members']['value']);
        $this->assertStringContainsString('email_confirmed` != 0', $a['restriction_sql']);
    }

    public function testContentByLevelAsConditionCustomListUsesIn()
    {
        $o = new BxDolAclTestDouble();
        $aLevels = [MEMBERSHIP_ID_MODERATOR, MEMBERSHIP_ID_ADMINISTRATOR];
        $a = $o->getContentByLevelAsCondition('author_id', $aLevels);

        $this->assertSame('in', $a['restriction']['acl_members']['operator']);
        $this->assertSame($aLevels, $a['restriction']['acl_members']['value']);
        $this->assertSame('INNER', $a['join']['acl_members']['type']);
    }
}
