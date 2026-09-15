<?php

use PHPUnit\Framework\Attributes\DataProvider;

class BxDolStorageExtTestDouble extends BxDolStorage
{
    public function __construct($aObject)
    {
        $this->_aObject = $aObject;
    }

    public function isValidExtPublic($sExt)
    {
        return $this->isValidExt($sExt);
    }

    public function genPathPublic($s, $iLevels)
    {
        return $this->genPath($s, $iLevels);
    }
}

/**
 * Upload extension policy and generated storage paths (no disk I/O).
 */
class BxDolStorageExtTest extends \PHPUnit\Framework\TestCase
{
    #[DataProvider('providerForValidExt')]
    public function testIsValidExt($aObject, $sExt, $bOut)
    {
        $o = new BxDolStorageExtTestDouble($aObject);
        $this->assertSame($bOut, $o->isValidExtPublic($sExt));
    }

    static public function providerForValidExt()
    {
        return [
            [['ext_mode' => 'allow-deny', 'ext_allow' => 'jpg,png', 'ext_deny' => ''], 'jpg', true],
            [['ext_mode' => 'allow-deny', 'ext_allow' => 'jpg,png', 'ext_deny' => ''], 'exe', false],
            [['ext_mode' => 'allow-deny', 'ext_allow' => '', 'ext_deny' => ''], 'jpg', false],
            [['ext_mode' => 'deny-allow', 'ext_allow' => '', 'ext_deny' => 'exe,php'], 'jpg', true],
            [['ext_mode' => 'deny-allow', 'ext_allow' => '', 'ext_deny' => 'exe,php'], 'php', false],
            [['ext_mode' => 'deny-allow', 'ext_allow' => '', 'ext_deny' => ''], 'php', true],
            [['ext_mode' => 'unknown', 'ext_allow' => 'jpg', 'ext_deny' => ''], 'jpg', false],
        ];
    }

    #[DataProvider('providerForGenPath')]
    public function testGenPath($s, $iLevels, $sOut)
    {
        $o = new BxDolStorageExtTestDouble(['ext_mode' => 'allow-deny', 'ext_allow' => '', 'ext_deny' => '']);
        $this->assertSame($sOut, $o->genPathPublic($s, $iLevels));
    }

    static public function providerForGenPath()
    {
        return [
            ['abc', 2, 'a/ab/'],
            ['abc', 1, 'a/'],
            ['abc', 0, ''],
            ['abcdef', 3, 'a/ab/abc/'],
        ];
    }
}
