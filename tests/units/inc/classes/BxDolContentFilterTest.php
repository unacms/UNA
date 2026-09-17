<?php

use PHPUnit\Framework\Attributes\DataProvider;

class BxDolContentFilterTestDouble extends BxDolContentFilter
{
    public $aProhibited = [];
    public $aUnauthenticated = [];
    public $aViewerInfo = false;

    public function __construct()
    {
        $this->_iDefaultValue = 1;
        $this->_iViewerId = 0;
    }

    public function getProhibited()
    {
        return $this->aProhibited;
    }

    public function getUnauthenticated()
    {
        return $this->aUnauthenticated;
    }

    public function isAllowedByViewer($iValue, $iViewerId = 0)
    {
        $iCfDefault = $this->getDefaultValue();
        if (!$iValue)
            $iValue = $iCfDefault;

        if (is_array($this->aViewerInfo) && isset($this->aViewerInfo['cfw_value']))
            $iCfwValue = $this->aViewerInfo['cfw_value'];
        else
            $iCfwValue = $this->getDefaultValueUnauthenticated();

        return (1 << ($iValue - 1)) & $iCfwValue;
    }
}

/**
 * Content-filter bitmasks and guest defaults (no SQL execution).
 */
class BxDolContentFilterTest extends \PHPUnit\Framework\TestCase
{
    #[DataProvider('providerForAllowedBySetting')]
    public function testIsAllowedBySetting($aProhibited, $iValue, $bOut)
    {
        $o = new BxDolContentFilterTestDouble();
        $o->aProhibited = $aProhibited;
        $this->assertSame($bOut, $o->isAllowedBySetting($iValue));
    }

    static public function providerForAllowedBySetting()
    {
        return [
            [[], 2, true],
            [['3'], 1, true],
            [['3'], 3, false],
            [[2, 3], 2, false],
        ];
    }

    public function testDefaultValueUnauthenticatedBitmask()
    {
        $o = new BxDolContentFilterTestDouble();
        $o->aUnauthenticated = [1, 3];
        $this->assertSame((1 << 0) | (1 << 2), $o->getDefaultValueUnauthenticated());
    }

    public function testDefaultValueUnauthenticatedEmpty()
    {
        $o = new BxDolContentFilterTestDouble();
        $o->aUnauthenticated = [];
        $this->assertSame(0, $o->getDefaultValueUnauthenticated());
    }

    public function testIsAllowedByViewerWithProfileBits()
    {
        $o = new BxDolContentFilterTestDouble();
        $o->aViewerInfo = ['cfw_value' => (1 << 0) | (1 << 2)];

        $this->assertNotFalse($o->isAllowedByViewer(1));
        $this->assertFalse((bool)$o->isAllowedByViewer(2));
        $this->assertNotFalse($o->isAllowedByViewer(3));
    }

    public function testIsAllowedByViewerGuestUsesUnauthenticatedDefault()
    {
        $o = new BxDolContentFilterTestDouble();
        $o->aViewerInfo = false;
        $o->aUnauthenticated = [1];

        $this->assertNotFalse($o->isAllowedByViewer(1));
        $this->assertFalse((bool)$o->isAllowedByViewer(2));
    }

    public function testIsAllowedByViewerZeroValueUsesDefaultFilter()
    {
        $o = new BxDolContentFilterTestDouble();
        $o->aViewerInfo = ['cfw_value' => 1];

        $this->assertNotFalse($o->isAllowedByViewer(0));
    }
}
