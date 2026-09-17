<?php

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Form field validators (no captcha, location, or spam checks).
 */
class BxDolFormCheckerHelperTest extends \PHPUnit\Framework\TestCase
{
    public static function setUpBeforeClass(): void
    {
        if (!class_exists('BxDolFormCheckerHelper', false))
            bx_import('BxDolForm');
    }

    #[DataProvider('providerForCheckEmail')]
    public function testCheckEmail($s, $bOut)
    {
        $this->assertSame($bOut, (bool)BxDolFormCheckerHelper::checkEmail($s));
    }

    static public function providerForCheckEmail()
    {
        return [
            ['user@example.com', true],
            ['тест@example.com', true],
            ['user.name@example.com', true],
            ['user_name@example.com', true],
            ['', false],
            ['no-at', false],
            ['a@b@c.com', false],
            ['.user@example.com', false],
            ['user@exam_ple.com', false],
        ];
    }

    public function testCheckEmailPlusAddressing()
    {
        $sKey = 'sys_account_allow_plus_in_email';
        $oProp = new ReflectionProperty(BxDolDb::class, '_aParams');
        $aParams = $oProp->getValue();
        $sOld = $aParams[$sKey] ?? '';

        try {
            $aParams[$sKey] = 'on';
            $oProp->setValue(null, $aParams);
            $this->assertTrue((bool)BxDolFormCheckerHelper::checkEmail('user+tag@example.com'));

            $aParams[$sKey] = '';
            $oProp->setValue(null, $aParams);
            $this->assertFalse((bool)BxDolFormCheckerHelper::checkEmail('user+tag@example.com'));
        } finally {
            $aParams[$sKey] = $sOld;
            $oProp->setValue(null, $aParams);
        }
    }

    public function testCheckEmailOrEmpty()
    {
        $this->assertTrue((bool)BxDolFormCheckerHelper::checkEmailOrEmpty(''));
        $this->assertTrue((bool)BxDolFormCheckerHelper::checkEmailOrEmpty('user@example.com'));
        $this->assertFalse((bool)BxDolFormCheckerHelper::checkEmailOrEmpty('no-at'));
    }

    #[DataProvider('providerForCheckLength')]
    public function testCheckLength($mixed, $iMin, $iMax, $bOut)
    {
        $this->assertSame($bOut, (bool)BxDolFormCheckerHelper::checkLength($mixed, $iMin, $iMax));
    }

    static public function providerForCheckLength()
    {
        return [
            ['ab', 1, 3, true],
            ['abcd', 1, 3, false],
            ['', 1, 3, false],
            ['a', 1, 1, true],
            [['ab', 'cd'], 1, 3, true],
            [['abcd'], 1, 3, false],
            ['тест', 1, 4, true],
            ['тест', 1, 3, false],
        ];
    }

    #[DataProvider('providerForCheckPreg')]
    public function testCheckPreg($mixed, $sRegex, $bOut)
    {
        $this->assertSame($bOut, (bool)BxDolFormCheckerHelper::checkPreg($mixed, $sRegex));
    }

    static public function providerForCheckPreg()
    {
        return [
            ['abc', '#^ab#', true],
            ['x', '#^ab#', false],
            [['abc', 'abd'], '#^ab#', true],
            [['abc', 'x'], '#^ab#', false],
        ];
    }

    #[DataProvider('providerForCheckAvail')]
    public function testCheckAvail($mixed, $bOut)
    {
        $this->assertSame($bOut, (bool)BxDolFormCheckerHelper::checkAvail($mixed));
    }

    static public function providerForCheckAvail()
    {
        return [
            ['x', true],
            ['', false],
            ['0', false],
            [[], false],
            [['x'], true],
            [[''], false],
        ];
    }

    #[DataProvider('providerForCheckJson')]
    public function testCheckJson($mixed, $bAllowEmpty, $bOut)
    {
        $this->assertSame($bOut, (bool)BxDolFormCheckerHelper::checkJson($mixed, $bAllowEmpty));
    }

    static public function providerForCheckJson()
    {
        return [
            ['{"a":1}', false, true],
            ['[]', false, true],
            ['null', false, true],
            ['not json', false, false],
            ['', false, false],
            ['', true, true],
        ];
    }

    #[DataProvider('providerForCheckDate')]
    public function testCheckDate($s, $bOut)
    {
        $this->assertSame($bOut, (bool)BxDolFormCheckerHelper::checkDate($s));
    }

    static public function providerForCheckDate()
    {
        return [
            ['2024-01-15', true],
            ['2024/01/15', false],
            ['15-01-2024', true],
            ['not-a-date', false],
            ['', false],
        ];
    }

    #[DataProvider('providerForCheckDateTime')]
    public function testCheckDateTime($s, $bOut)
    {
        $this->assertSame($bOut, (bool)BxDolFormCheckerHelper::checkDateTime($s));
    }

    static public function providerForCheckDateTime()
    {
        return [
            ['2024-01-15 10:30', true],
            ['2024-01-15 10:30:00', true],
            ['2024-01-15T10:30:00', true],
            ['2024-01-15', false],
            ['not-a-date', false],
        ];
    }

    #[DataProvider('providerForCheckProfileName')]
    public function testCheckProfileName($s, $bOut)
    {
        $this->assertSame($bOut, (bool)BxDolFormCheckerHelper::checkProfileName($s));
    }

    static public function providerForCheckProfileName()
    {
        return [
            ['Ada', true],
            ['Ada Lovelace', true],
            ['', false],
            ['@handle', false],
        ];
    }
}
