<?php

/**
 * Service-call codec: JSON writes, safe decode of old PHP serialize, no object injection.
 * Loads the codec file directly so it can run without a full UNA install.
 */
class BxDolServiceCallCodecTest extends \PHPUnit\Framework\TestCase
{
    public static function setUpBeforeClass(): void
    {
        if (!defined('BX_DOL'))
            define('BX_DOL', 1);
        if (!class_exists('BxDolServiceCallCodec', false)) {
            require_once dirname(__DIR__, 4) . '/inc/classes/BxDolServiceCallCodec.php';
        }
    }

    public function testEncodeIsJsonWithModuleAndMethod()
    {
        $s = BxDolServiceCallCodec::encode('system', 'test', array('a' => 1), 'Module');
        $this->assertSame('{', $s[0]);
        $a = json_decode($s, true);
        $this->assertSame('system', $a['module']);
        $this->assertSame('test', $a['method']);
        $this->assertSame(array('a' => 1), $a['params']);
        $this->assertTrue(BxDolServiceCallCodec::isEncoded($s));
        $this->assertSame($a, BxDolServiceCallCodec::decode($s));
    }

    public function testDecodeLegacySerializedArray()
    {
        $s = serialize(array(
            'module' => 'system',
            'method' => 'test',
            'params' => array(1, 2),
        ));
        $this->assertTrue(BxDolServiceCallCodec::isEncoded($s));
        $a = BxDolServiceCallCodec::decode($s);
        $this->assertSame('system', $a['module']);
        $this->assertSame('test', $a['method']);
        $this->assertSame(array(1, 2), $a['params']);
    }

    public function testRejectSerializedObject()
    {
        $s = serialize(new stdClass());
        $this->assertFalse(BxDolServiceCallCodec::isEncoded($s));
        $this->assertFalse(BxDolServiceCallCodec::decode($s));
    }

    public function testRejectSerializedArrayContainingObject()
    {
        $s = serialize(array(
            'module' => 'system',
            'method' => 'test',
            'params' => array(new stdClass()),
        ));
        $this->assertFalse(BxDolServiceCallCodec::decode($s));
    }

    public function testRejectGarbageAndEmpty()
    {
        $this->assertFalse(BxDolServiceCallCodec::decode(''));
        $this->assertFalse(BxDolServiceCallCodec::decode('not a blob'));
        $this->assertFalse(BxDolServiceCallCodec::decode('{"foo":1}'));
        $this->assertFalse(BxDolServiceCallCodec::decode(null));
    }

    /**
     * Lock CVE-2025-32101 / CVE-2025-66571: posted profile_id is json_decode, never unserialize.
     */
    public function testAclPostedProfileIdDoesNotUnserialize()
    {
        $this->assertSame('12', BxDolServiceCallCodec::decodeAclProfileId('12'));
        $this->assertSame(array(1, 2), BxDolServiceCallCodec::decodeAclProfileId(urlencode(json_encode(array(1, 2)))));

        $serializedObject = serialize(new stdClass());
        $this->assertNull(BxDolServiceCallCodec::decodeAclProfileId($serializedObject));
        $this->assertNull(BxDolServiceCallCodec::decodeAclProfileId(urlencode($serializedObject)));
    }
}
