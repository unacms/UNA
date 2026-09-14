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
            array('id;', true),
            array('`id`', false),
        );
    }

    #[DataProvider('providerForIsValidOperator')]
    public function testIsValidOperator($s, $bRes)
    {
        $this->assertSame($bRes, BxDolDb::getInstance()->isValidOperator($s));
    }

    static public function providerForIsValidOperator()
    {
        return [
            ['=', true],
            ['like', true],
            ['LIKE', true],
            ['  in  ', true],
            ['NOT IN', true],
            ['OR 1=1', false],
            [';DROP', false],
            ['', false],
            ['UNION', false],
        ];
    }
}
