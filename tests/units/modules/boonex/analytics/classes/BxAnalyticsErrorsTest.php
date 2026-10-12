<?php

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * What is kept of a client error: no query strings, tokens or addresses; the fingerprint that
 * groups its repeats across builds and ids; the route of the page it happened on.
 */
class BxAnalyticsErrorsTest extends \PHPUnit\Framework\TestCase
{
    protected $_aHosts = ['una.example.com'];

    public static function setUpBeforeClass(): void
    {
        require_once BX_DIRECTORY_PATH_MODULES . 'boonex/analytics/classes/BxAnalyticsErrors.php';
    }

    public static function providerSanitize()
    {
        return [
            'query and fragment' => ['Failed https://cdn.example.net/a.js?v=12&token=x#top', 'Failed https://cdn.example.net/a.js'],
            'own host' => ['at https://una.example.com/page/view-post?id=5', 'at /page/view-post'],
            'own host keeps the position' => ['at f (https://una.example.com/js/app.js?v=3:10:5)', 'at f (/js/app.js:10:5)'],
            'jwt' => ['bad eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl here', 'bad <redacted> here'],
            'bearer' => ['header Bearer abc.def-123 sent', 'header Bearer <redacted> sent'],
            'secret pairs' => ['api x=1 password=hunter2 api_key=k1 sid=777', 'api x=1 password=<redacted> api_key=<redacted> sid=<redacted>'],
            'serialized secrets' => ['Non-Error promise rejection: {"password":"hunter2","otp":"123456","name":"a"}', 'Non-Error promise rejection: {"password":<redacted>,"otp":<redacted>,"name":"a"}'],
            'colon secrets' => ["rejected {token: 'abc', pass : x1}", "rejected {token: <redacted>, pass : <redacted>}"],
            'relative query' => ['HTTP 502 /page.php?i=x&token2=abc&email=foo', 'HTTP 502 /page.php?i=x'],
            'relative query keeps the position' => ['at f (/js/app.js?v=3:10:5)', 'at f (/js/app.js:10:5)'],
            'email' => ['no user jane.doe+x@mail.example.org found', 'no user <redacted> found'],
            'hex' => ['hash 0123456789abcdef0123456789abcdef bad', 'hash <redacted> bad'],
            'base64' => ['key dGhpcyBpcyBhIHNlY3JldCBrZXkxMjM0NTY3 end', 'key <redacted> end'],
            'slug stays' => ['post /my-very-long-post-title-from-2026 broke', 'post /my-very-long-post-title-from-2026 broke'],
            'control characters' => ["a\x00b\x1Fc\nd", 'a b c d'],
        ];
    }

    #[DataProvider('providerSanitize')]
    public function testSanitize($sInput, $sExpected)
    {
        $this->assertSame($sExpected, BxAnalyticsErrors::sanitize($sInput, 255, $this->_aHosts));
    }

    public function testSanitizeCuts()
    {
        $this->assertSame(255, get_mb_len(BxAnalyticsErrors::sanitize(str_repeat('ж', 600), 255)), 'characters, not bytes');
        $this->assertSame('', BxAnalyticsErrors::sanitize('', 255));
        $this->assertNotSame('', BxAnalyticsErrors::sanitize("bad \xC3\x28 utf", 255), 'broken UTF-8 is repaired, not dropped');
    }

    public function testStack()
    {
        $sStack = "TypeError: x is undefined\n";
        for ($i = 0; $i < 40; $i++)
            $sStack .= "    at f$i (https://una.example.com/js/app.js?v=1:$i:2)\n";

        $s = BxAnalyticsErrors::sanitizeStack($sStack, "\n    in Feed\n    in App", $this->_aHosts);
        $aLines = explode("\n", $s);
        $this->assertSame('TypeError: x is undefined', $aLines[0]);
        $this->assertSame('    at f0 (/js/app.js:0:2)', $aLines[1], 'line breaks and indents stay, the query and host go');
        $this->assertSame(30 + 1 + 2, count($aLines), '30 frames, then the component stack after a separator');
        $this->assertSame('--', $aLines[30]);

        $this->assertSame(BxAnalyticsErrors::MAX_STACK, get_mb_len(BxAnalyticsErrors::sanitizeStack(str_repeat("at f (/x.js:1:1) " . str_repeat('z', 200) . "\n", 30))), 'at most 4000 characters');
    }

    public function testNoiseAndIgnore()
    {
        $this->assertTrue(BxAnalyticsErrors::isNoise('Script error.', '', ''), 'a hidden cross-origin error');
        $this->assertFalse(BxAnalyticsErrors::isNoise('Script error.', 'at f (/a.js:1:1)', ''));
        $this->assertTrue(BxAnalyticsErrors::isNoise('x', '', 'chrome-extension://abc/content.js'));
        $this->assertTrue(BxAnalyticsErrors::isNoise('x', "Error: x\n    at f (moz-extension://abc/c.js:1:1)", ''));
        $this->assertFalse(BxAnalyticsErrors::isNoise('x', "Error: x\n    at f (/js/app.js:1:1)", '/js/app.js'));

        $aPatterns = ['ResizeObserver loop*', 'Script error.*', '*Non-Error promise rejection*'];
        $this->assertTrue(BxAnalyticsErrors::isIgnored('ResizeObserver loop completed with undelivered notifications.', $aPatterns));
        $this->assertTrue(BxAnalyticsErrors::isIgnored('Uncaught Non-Error promise rejection captured', $aPatterns), 'case and position');
        $this->assertFalse(BxAnalyticsErrors::isIgnored('TypeError: ResizeObserver loop', $aPatterns), 'patterns match the whole message');
        $this->assertFalse(BxAnalyticsErrors::isIgnored('anything', []));
    }

    public function testTopFrame()
    {
        $this->assertSame(['function' => 'render', 'file' => '/js/app.js', 'line' => 10, 'col' => 5], BxAnalyticsErrors::getTopFrame("TypeError: x\n    at render (/js/app.js:10:5)\n    at main (/js/app.js:1:1)"));
        $this->assertSame(['function' => '', 'file' => '/js/app.js', 'line' => 3, 'col' => 7], BxAnalyticsErrors::getTopFrame("Error\n    at /js/app.js:3:7"));
        $this->assertSame(['function' => 'load', 'file' => 'https://cdn.example.net/a.js', 'line' => 2, 'col' => 9], BxAnalyticsErrors::getTopFrame("load@https://cdn.example.net/a.js:2:9\n@debugger eval code:1:1"), 'Firefox and Safari');
        $this->assertSame('index.android.bundle', BxAnalyticsErrors::getTopFrame("Error: x\n    at Feed (address at index.android.bundle:1:2345)")['file'], 'Hermes');
        $this->assertSame('Foo', BxAnalyticsErrors::getTopFrame("    at new Foo (/a.js:1:1)")['function']);
        $this->assertNull(BxAnalyticsErrors::getTopFrame("Error: no frames\n    at <anonymous>"));
    }

    public function testNormalizeMessage()
    {
        $this->assertSame(BxAnalyticsErrors::normalizeMessage('Cannot load item 5 of 12'), BxAnalyticsErrors::normalizeMessage('Cannot load item 77 of 1300'));
        $this->assertSame('Profile <uuid> not found', BxAnalyticsErrors::normalizeMessage('Profile 3f2504e0-4f89-11d3-9a0c-0305e82c3301 not found'));
        $this->assertSame('Cannot read properties of undefined (reading "")', BxAnalyticsErrors::normalizeMessage("Cannot read properties of undefined (reading 'title')"));
        $this->assertSame("can't find \"\"", BxAnalyticsErrors::normalizeMessage("can't find \"post\""), 'an apostrophe in a word is not a quote');
        $this->assertSame('a b', BxAnalyticsErrors::normalizeMessage("a \n  b"));
    }

    public function testFingerprint()
    {
        $aError = ['kind' => 'js', 'message' => 'TypeError: item 5 is undefined', 'stack' => "TypeError: item 5 is undefined\n    at render (/_next/static/chunks/app/page-3f9a1b2c4d5e6f70.js:1:2034)", 'source' => '', 'status' => 0];
        $sFingerprint = BxAnalyticsErrors::getFingerprint($aError);
        $this->assertSame(16, strlen($sFingerprint));

        $aNextBuild = array_merge($aError, ['message' => 'TypeError: item 912 is undefined', 'stack' => "TypeError: item 912 is undefined\n    at render (/_next/static/chunks/app/page-a0b1c2d3e4f5a6b7.js:1:1988)"]);
        $this->assertSame($sFingerprint, BxAnalyticsErrors::getFingerprint($aNextBuild), 'ids, chunk names and positions change, the error does not');

        $aCombined = ['kind' => 'js', 'message' => 'x', 'stack' => "x\n    at f (/cache_public/bx_templ_js_0a1b2c3d4e5f60718293a4b5c6d7e8f9.js:1:1)", 'source' => '', 'status' => 0];
        $aCombinedNext = array_merge($aCombined, ['stack' => "x\n    at f (/cache_public/bx_templ_js_ffeeddccbbaa99887766554433221100.js:9:9)"]);
        $this->assertSame(BxAnalyticsErrors::getFingerprint($aCombined), BxAnalyticsErrors::getFingerprint($aCombinedNext), "UNA's combined scripts get a new hash name");

        $this->assertNotSame($sFingerprint, BxAnalyticsErrors::getFingerprint(array_merge($aError, ['stack' => str_replace('render', 'paint', $aError['stack'])])), 'another function is another error');
        $this->assertNotSame($sFingerprint, BxAnalyticsErrors::getFingerprint(array_merge($aError, ['kind' => 'promise'])), 'another kind');

        $aHttp = ['kind' => 'http', 'message' => 'HTTP 502 /api.php', 'stack' => '', 'source' => '/api.php', 'status' => 502];
        $this->assertNotSame(BxAnalyticsErrors::getFingerprint($aHttp), BxAnalyticsErrors::getFingerprint(array_merge($aHttp, ['message' => 'HTTP 503 /api.php', 'status' => 503])), 'the status is kept apart from the message numbers');

        $this->assertSame(BxAnalyticsErrors::getFingerprint(BxAnalyticsErrors::getOverflowError()), BxAnalyticsErrors::getFingerprint(BxAnalyticsErrors::getOverflowError() + ['repeats' => 3]), 'one catch-all group');

        $aPage = ['kind' => 'js', 'message' => "TypeError: Cannot read properties of undefined (reading 'title')", 'stack' => "TypeError: x\n    at e (/_next/static/chunks/app/%5B...path%5D/page-1a2b3c4d5e.js:1:2345)", 'source' => '', 'status' => 0];
        $aShared = array_merge($aPage, ['message' => "TypeError: Cannot read properties of undefined (reading 'avatar')", 'stack' => "TypeError: x\n    at e (/_next/static/chunks/5123-9f8e7d6c5b4a.js:1:99)"]);
        $this->assertNotSame(BxAnalyticsErrors::getFingerprint($aPage), BxAnalyticsErrors::getFingerprint($aShared), 'errors in different chunks are different errors');
        $this->assertSame('/_next/static/chunks/app/[...path]/page-*.js', BxAnalyticsErrors::normalizeFile('/_next/static/chunks/app/[...path]/page-1a2b3c4d5e.js'));
        $this->assertSame('/_next/static/chunks/*.js', BxAnalyticsErrors::normalizeFile('/_next/static/chunks/0a1b2c3d4e5f6789.js'), 'a chunk named by its hash');
        $this->assertSame('/js/tracker.js', BxAnalyticsErrors::normalizeFile('/js/tracker.js'));
    }

    public function testCleanPath()
    {
        $this->assertSame('/page/view-post', BxAnalyticsErrors::getCleanPath('/page/view-post?id=252'));
        $this->assertSame('/page.php?i=view-post', BxAnalyticsErrors::getCleanPath('/page.php?id=5&i=view-post#c'));
        $this->assertSame('/api.php?i=x&r=system/get', BxAnalyticsErrors::getCleanPath('/api.php?r=system/get&token=abc&i=x'), 'the page parameters in one order');
        $this->assertSame('/u/<redacted>', BxAnalyticsErrors::getCleanPath('/u/jane@mail.example.org'));
        $this->assertSame('/page.php', BxAnalyticsErrors::getCleanPath('/page.php?i='));
        $this->assertSame(BxAnalyticsErrors::getCleanPath('/a?i=x&r=y'), BxAnalyticsErrors::getCleanPath(BxAnalyticsErrors::getCleanPath('/a?r=y&i=x&id=1')), 'the same twice');
    }

    public static function providerRoute()
    {
        return [
            'classic page' => ['/page.php?i=view-post&id=5', '/page.php?i=view-post'],
            'permalink' => ['/page/view-post?id=5&utm_source=x', '/page/view-post'],
            'numeric id' => ['/view-post/123', '/view-post/*'],
            'uuid' => ['/files/3f2504e0-4f89-11d3-9a0c-0305e82c3301/view', '/files/*/view'],
            'hex hash' => ['/s/9f86d081884c7d65', '/s/*'],
            'token' => ['/reset/Ab3dEf6hIj9kLmNoPqRsTu', '/reset/*'],
            'slug stays' => ['/blog/my-first-post', '/blog/my-first-post'],
            'root' => ['/', '/'],
            'empty i' => ['/page.php?i=', '/page.php'],
        ];
    }

    #[DataProvider('providerRoute')]
    public function testRoute($sPath, $sExpected)
    {
        $this->assertSame($sExpected, BxAnalyticsErrors::getRoute($sPath));
    }

    public function testRouteLength()
    {
        $this->assertSame(128, get_mb_len(BxAnalyticsErrors::getRoute('/' . str_repeat('a', 300))));
    }
}
