<?php

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * URL helpers, link detection, markers, and method-name conversion.
 */
class UtilUrlTest extends \PHPUnit\Framework\TestCase
{
    #[DataProvider('providerForEncodeUrlParams')]
    public function testEncodeUrlParams($a, $aExclude, $aOnly, $sOut)
    {
        $this->assertSame($sOut, bx_encode_url_params($a, $aExclude, $aOnly));
    }

    static public function providerForEncodeUrlParams()
    {
        return [
            [['a' => '1', 'b' => '2'], [], false, 'a=1&b=2&'],
            [['a' => '1', 'b' => '2'], ['b'], false, 'a=1&'],
            [['a' => '1', 'b' => '2'], [], ['b'], 'b=2&'],
            [['q' => 'a b'], [], false, 'q=a%20b&'],
            [['ids' => ['1', '2']], [], false, 'ids[]=1&ids[]=2&'],
        ];
    }

    #[DataProvider('providerForParseStr')]
    public function testParseStr($sIn, $aOut)
    {
        $this->assertSame($aOut, bx_parse_str($sIn));
    }

    static public function providerForParseStr()
    {
        return [
            ['a=1&b=2', ['a' => '1', 'b' => '2']],
            ['q=%20', ['q' => '%20']],
            ['ids[]=1&ids[]=2', ['ids' => ['1', '2']]],
            ['a=1&a=2', ['a' => ['1', '2']]],
        ];
    }

    #[DataProvider('providerForAppendUrlParams')]
    public function testAppendUrlParams($sUrl, $mixedParams, $bEncode, $sOut)
    {
        $this->assertSame($sOut, bx_append_url_params($sUrl, $mixedParams, $bEncode));
    }

    static public function providerForAppendUrlParams()
    {
        return [
            ['http://example.com', ['a' => '1'], true, 'http://example.com?a=1'],
            ['http://example.com?x=1', ['a' => '1'], true, 'http://example.com?x=1&a=1'],
            ['http://example.com', ['q' => 'a b'], true, 'http://example.com?q=a%20b'],
            ['http://example.com', ['q' => 'a b'], false, 'http://example.com?q=a b'],
            ['http://example.com', [], true, 'http://example.com'],
            ['http://example.com', ['ids' => ['1', '2']], true, 'http://example.com?ids[]=1&ids[]=2'],
        ];
    }

    public function testLinkifyExternalUrl()
    {
        $s = bx_linkify('see www.example.com now');
        $this->assertStringContainsString('<a ', $s);
        $this->assertStringContainsString('href="http://www.example.com"', $s);
        $this->assertStringContainsString('target="_blank"', $s);
        if (getParam('sys_add_nofollow') == 'on')
            $this->assertStringContainsString('rel="nofollow"', $s);
        else
            $this->assertStringNotContainsString('rel="nofollow"', $s);
    }

    public function testLinkifyLocalUrlDoesNotAddTargetBlank()
    {
        if (!defined('BX_DOL_URL_ROOT') || !BX_DOL_URL_ROOT)
            $this->markTestSkipped('BX_DOL_URL_ROOT is not defined');

        $s = bx_linkify('go ' . BX_DOL_URL_ROOT . 'page');
        $this->assertStringContainsString('href="' . BX_DOL_URL_ROOT . 'page"', $s);
        $this->assertStringNotContainsString('target="_blank"', $s);
    }

    #[DataProvider('providerForIsUrlInContent')]
    public function testIsUrlInContent($sContent, $bSkipLocal, $bOut)
    {
        $this->assertSame($bOut, bx_is_url_in_content($sContent, $bSkipLocal));
    }

    static public function providerForIsUrlInContent()
    {
        return [
            ['hello http://example.com', false, true],
            ['hello https://example.com', false, true],
            ['visit www.example.com', false, true],
            ['file.com archive', false, true],
            ['no links here', false, false],
        ];
    }

    public function testIsUrlInContentSkipsLocal()
    {
        if (!defined('BX_DOL_URL_ROOT') || !BX_DOL_URL_ROOT)
            $this->markTestSkipped('BX_DOL_URL_ROOT is not defined');

        $this->assertFalse(bx_is_url_in_content(BX_DOL_URL_ROOT . 'only', true));
        $this->assertTrue(bx_is_url_in_content(BX_DOL_URL_ROOT . ' and http://example.com', true));
    }

    #[DataProvider('providerForGenMethodName')]
    public function testGenMethodName($sIn, $sOut)
    {
        $this->assertSame($sOut, bx_gen_method_name($sIn));
    }

    static public function providerForGenMethodName()
    {
        return [
            ['some_method', 'SomeMethod'],
            ['is_spam', 'IsSpam'],
            ['alreadyCamel', 'AlreadyCamel'],
            ['one', 'One'],
        ];
    }

    #[DataProvider('providerForLtrimStr')]
    public function testLtrimStr($sString, $sPrefix, $sReplace, $sOut)
    {
        $this->assertSame($sOut, bx_ltrim_str($sString, $sPrefix, $sReplace));
    }

    static public function providerForLtrimStr()
    {
        return [
            ['/var/www/file', '/var/www/', '', 'file'],
            ['file', '/var/www/', '', 'file'],
            ['/var/www/file', '/var/www/', 'ROOT/', 'ROOT/file'],
            ['ROOT/file', '/var/www/', 'ROOT/', 'ROOT/file'],
        ];
    }

    #[DataProvider('providerForReplaceMarkers')]
    public function testReplaceMarkers($mixed, $aMarkers, $mixedOut)
    {
        $this->assertSame($mixedOut, bx_replace_markers($mixed, $aMarkers));
    }

    static public function providerForReplaceMarkers()
    {
        return [
            ['Hello {name}', ['name' => 'Ada'], 'Hello Ada'],
            ['{a} and {b}', ['a' => '1', 'b' => '2'], '1 and 2'],
            ['unchanged', [], 'unchanged'],
            ['{missing}', ['name' => 'Ada'], '{missing}'],
            [['x' => 'hi {name}'], ['name' => 'Ada'], ['x' => 'hi Ada']],
            ['null {x}', ['x' => null], 'null '],
        ];
    }
}
