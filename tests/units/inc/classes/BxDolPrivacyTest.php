<?php

use PHPUnit\Framework\Attributes\DataProvider;

class BxDolPrivacyTestDouble extends BxDolPrivacy
{
    public function __construct()
    {
    }

    public function convertActionToFieldPublic($sAction)
    {
        return $this->convertActionToField($sAction);
    }

    public function getCheckMethodPublic($s)
    {
        return $this->getCheckMethod($s);
    }
}

/**
 * Privacy field and check-method naming.
 */
class BxDolPrivacyTest extends \PHPUnit\Framework\TestCase
{
    #[DataProvider('providerForConvertActionToField')]
    public function testConvertActionToField($sAction, $sField)
    {
        $o = new BxDolPrivacyTestDouble();
        $this->assertSame($sField, $o->convertActionToFieldPublic($sAction));
    }

    static public function providerForConvertActionToField()
    {
        return [
            ['view', 'allow_view_to'],
            ['comment', 'allow_comment_to'],
            ['view comments', 'allow_view-comments_to'],
            ['View', 'allow_view_to'],
        ];
    }

    #[DataProvider('providerForGetCheckMethod')]
    public function testGetCheckMethod($s, $mixedOut)
    {
        $o = new BxDolPrivacyTestDouble();
        $this->assertSame($mixedOut, $o->getCheckMethodPublic($s));
    }

    static public function providerForGetCheckMethod()
    {
        return [
            ['@foo', 'CheckFoo'],
            ['@foo_bar', 'CheckFooBar'],
            ['foo', false],
            ['check_foo', false],
        ];
    }
}
