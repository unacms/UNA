<?php

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Input typing, output escaping, and default password hashing.
 */
class UtilProcessTest extends \PHPUnit\Framework\TestCase
{
    #[DataProvider('providerForProcessInput')]
    public function testProcessInput($mixedIn, $iType, $mixedOut)
    {
        $this->assertSame($mixedOut, bx_process_input($mixedIn, $iType));
    }

    static public function providerForProcessInput()
    {
        return [
            ['42', BX_DATA_INT, 42],
            [' 42 ', BX_DATA_INT, 42],
            ['x', BX_DATA_INT, false],
            ['', BX_DATA_INT, false],
            ['3.14', BX_DATA_FLOAT, 3.14],
            [' 2.5 ', BX_DATA_FLOAT, 2.5],
            ['nope', BX_DATA_FLOAT, false],
            ['on', BX_DATA_CHECKBOX, 'on'],
            [' on ', BX_DATA_CHECKBOX, 'on'],
            ['off', BX_DATA_CHECKBOX, ''],
            ['1', BX_DATA_CHECKBOX, ''],
            ['1985-10-28', BX_DATA_DATE, '1985-10-28'],
            ['1985-1-2', BX_DATA_DATE, '1985-01-02'],
            ['not-a-date', BX_DATA_DATE, false],
            ['1985/10/28', BX_DATA_DATE, false],
            ['1985-10-28T00:59:35', BX_DATA_DATETIME, '1985-10-28 00:59:35'],
            ['1985-10-28 00:59:35', BX_DATA_DATETIME, '1985-10-28 00:59:35'],
            ['1985-10-28 00:59', BX_DATA_DATETIME, '1985-10-28 00:59:00'],
            ['1985-10-28', BX_DATA_DATETIME, '1985-10-28'],
            [['1', '2'], BX_DATA_INT, [1, 2]],
            ['plain', BX_DATA_TEXT, 'plain'],
        ];
    }

    #[DataProvider('providerForJsString')]
    public function testJsString($sIn, $iQuoteType, $sOut)
    {
        $this->assertSame($sOut, bx_js_string($sIn, $iQuoteType));
    }

    static public function providerForJsString()
    {
        return [
            ['say "hi"', BX_ESCAPE_STR_AUTO, 'say &quot;hi&quot;'],
            ["it's", BX_ESCAPE_STR_AUTO, 'it&apos;s'],
            ['<script>x</script>', BX_ESCAPE_STR_AUTO, '&lt;script&gt;x&lt;/script&gt;'],
            ["it's", BX_ESCAPE_STR_APOS, "it\\'s"],
            ['<script>x</script>', BX_ESCAPE_STR_APOS, "<scr' + 'ipt>x</scr' + 'ipt>"],
            ['say "hi"', BX_ESCAPE_STR_QUOTE, 'say \\"hi\\"'],
            ['<script>x</script>', BX_ESCAPE_STR_QUOTE, '<scr" + "ipt>x</scr" + "ipt>'],
            ["line\nbreak", BX_ESCAPE_STR_AUTO, 'line\\nbreak'],
        ];
    }

    #[DataProvider('providerForHtmlAttribute')]
    public function testHtmlAttribute($sIn, $iQuoteType, $sOut)
    {
        $this->assertSame($sOut, bx_html_attribute($sIn, $iQuoteType));
    }

    static public function providerForHtmlAttribute()
    {
        return [
            ['say "hi"', BX_ESCAPE_STR_AUTO, 'say &quot;hi&quot;'],
            ["it's", BX_ESCAPE_STR_AUTO, 'it&apos;s'],
            ["it's", BX_ESCAPE_STR_APOS, "it\\'s"],
            ['say "hi"', BX_ESCAPE_STR_QUOTE, 'say &quot;hi&quot;'],
            ["it's", BX_ESCAPE_STR_QUOTE, "it's"],
        ];
    }

    #[DataProvider('providerForHtmlspecialcharsAdv')]
    public function testHtmlspecialcharsAdv($sIn, $sOut)
    {
        $this->assertSame($sOut, htmlspecialchars_adv($sIn));
    }

    static public function providerForHtmlspecialcharsAdv()
    {
        return [
            ['a & b', 'a &amp; b'],
            ['say "hi"', 'say &quot;hi&quot;'],
            ["it's", "it's"],
            ['&amp;', '&amp;'],
        ];
    }

    public function testEncryptUserPwdDefaultAlgo()
    {
        $sAlgo = defined('BX_PWD_ALGO') ? BX_PWD_ALGO : '';
        if ($sAlgo && $sAlgo !== 'sha1_md5_salt')
            $this->markTestSkipped('BX_PWD_ALGO is not sha1_md5_salt');

        $sPwd = 'secret';
        $sSalt = 'pepper';
        $this->assertSame(sha1(md5($sPwd) . $sSalt), encryptUserPwd($sPwd, $sSalt));
    }
}
