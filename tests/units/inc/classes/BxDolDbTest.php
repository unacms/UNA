<?php

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Test Antispam module
 */
class BxDolDbTest extends BxDolTestCase
{
    #[DataProvider('providerForIsValidFieldName')]
    public function testIsValidFieldName($s, $bRes)
    {
        $this->assertEquals($bRes, (bool)BxDolDb::getInstance()->isValidFieldName($s));
    }

    static public function providerForIsValidFieldName()
    {
        return array(
            array('', false),
            array(' ', false),
            array('`', false),
            array('name', true),
            array('имя', true),
            array('name ', false),
            array("na\0me", false),
            array('na`me1', false),
            array('na``me2', true),
            array('1234a', true),
            array('12345', false),
            array('💡', false),
        );
    }
}
