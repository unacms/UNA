<?php

/**
 * A link kept as a link: bx_linkify_plain marks a text's external links, bx_linkify_embeded makes no card for them,
 * and the system embed provider gives the apps picture addresses they can load.
 */
class UtilLinkPlainTest extends \PHPUnit\Framework\TestCase
{
    /** @var callable|null the exception handler before the test: the embed object's first load sets its own */
    protected $handler;

    protected function setUp(): void
    {
        $this->handler = set_exception_handler(static function () {
        });
        restore_exception_handler();
    }

    protected function tearDown(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $current = set_exception_handler(static function () {
            });
            restore_exception_handler();
            if ($current === $this->handler)
                return;
            restore_exception_handler();
        }
    }

    public function testPlainMarksExternalLinksOnly()
    {
        $sLocal = BX_DOL_URL_ROOT . 'page/x';
        $sText = '<p><a href="https://example.com/a">a</a> and <a href="' . $sLocal . '">b</a></p>';

        $sOut = bx_linkify_plain($sText);

        $this->assertStringContainsString('<a href="https://example.com/a" class="' . BX_LINK_PLAIN_CLASS . '">a</a>', $sOut);
        $this->assertStringContainsString('<a href="' . $sLocal . '">b</a>', $sOut);
    }

    public function testPlainKeepsOtherClassesAndIsIdempotent()
    {
        $sText = '<a class="mention" href="https://example.com/a" rel="nofollow">a</a>';

        $sOnce = bx_linkify_plain($sText);
        $this->assertStringContainsString('class="mention ' . BX_LINK_PLAIN_CLASS . '"', $sOnce);
        $this->assertSame($sOnce, bx_linkify_plain($sOnce));
    }

    public function testPlainMarksABareAddressToo()
    {
        $sOut = bx_linkify_plain('<p>see https://example.com/a here</p>');

        $this->assertStringContainsString('class="' . BX_LINK_PLAIN_CLASS . '"', $sOut);
        $this->assertStringContainsString('href="https://example.com/a"', $sOut);
        $this->assertSame('', bx_linkify_embeded($sOut));
    }

    public function testPlainLeavesTextWithoutLinks()
    {
        $this->assertSame('', bx_linkify_plain(''));
        $this->assertSame('<p>no links</p>', bx_linkify_plain('<p>no links</p>'));
    }

    public function testStripPlainTakesOutMarkedLinksOnly()
    {
        $sText = '<p><a href="https://one.example/x" class="' . BX_LINK_PLAIN_CLASS . '">https://one.example/x</a> then https://two.example/y</p>';

        $sOut = bx_linkify_embeded_strip_plain($sText);

        $this->assertStringNotContainsString('one.example', $sOut);
        $this->assertStringContainsString('https://two.example/y', $sOut);
    }

    public function testNoCardForAPlainLink()
    {
        $sText = bx_linkify_plain('<p><a href="https://example.com/a">https://example.com/a</a> test</p>');

        $this->assertSame('', bx_linkify_embeded($sText));
    }

    public function testApiDataGivesLoadableAddresses()
    {
        $oEmbed = BxDolEmbed::getObjectInstance('sys_system');
        if (!$oEmbed)
            $this->markTestSkipped('The system embed provider is not installed');

        $f = (function ($a) { return $this->_getDataApi($a); })->bindTo($oEmbed, $oEmbed);

        // a remote picture that the site didn't store is kept; an icon given as a data: URI is not an address
        $a = $f([
            'url' => 'https://example.com/a',
            'image' => 'https://example.com/og.png',
            'logo' => 'https://example.com/a/data:image/png;base64,AAAA',
            'domain' => 'example.com',
        ]);
        $this->assertSame('https://example.com/og.png', $a['image']);
        $this->assertSame('', $a['logo']);
        $this->assertSame('https://example.com/a', $a['url']);

        // a picture with neither a stored copy nor an http(s) address is empty, not missing
        $a = $f(['url' => 'https://example.com/b', 'domain' => 'example.com']);
        $this->assertSame('', $a['image']);
        $this->assertSame('', $a['logo']);
    }
}
