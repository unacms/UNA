<?php

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Macro parse errors and service-request path/class guards (no real module dispatch).
 */
class BxDolServiceMacroTest extends \PHPUnit\Framework\TestCase
{
    #[DataProvider('providerForMalformedMacro')]
    public function testCallMacroMalformed($s)
    {
        bx_import('BxDolLanguages');
        $this->assertSame(_t('_sys_macros_malformed'), BxDolService::callMacro($s));
    }

    static public function providerForMalformedMacro()
    {
        return [
            [''],
            ['not-a-macro'],
            ['system'],
            ['system:test{'],
            ['system:test{not json}'],
        ];
    }

    #[DataProvider('providerForMacrosInContent')]
    public function testIsMacrosInContent($s, $bOut)
    {
        $this->assertSame($bOut, bx_is_macros_in_content($s));
    }

    static public function providerForMacrosInContent()
    {
        return [
            ['plain text', false],
            ['before {{~system:method}} after', true],
            ['{{~', true],
            ['{~not a macro', false],
        ];
    }

    public function testCheckCallRejectsTraversalPath()
    {
        $aModule = [
            'name' => 'evil',
            'path' => '../evil/',
            'class_prefix' => 'Bx',
            'uri' => 'evil',
        ];
        $this->assertSame(1, BxDolRequest::checkCall($aModule, 'foo', [], 'Module'));
    }

    public function testCheckCallRejectsInvalidClassName()
    {
        $aModule = [
            'name' => 'test',
            'path' => 'boonex/test/',
            'class_prefix' => '',
            'uri' => 'test',
        ];
        $this->assertSame(1, BxDolRequest::checkCall($aModule, 'foo', [], 'Foo-Bar'));
    }
}
