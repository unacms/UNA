<?php

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * bx_api_cache_response: which API answers shared caches may keep (bx_api_is_cacheable_response),
 * and the 304 for an If-None-Match that names the ETag, also as a weak tag or with the suffix
 * Apache's mod_deflate adds.
 */
class UtilApiCacheTest extends \PHPUnit\Framework\TestCase
{
    protected static function request($aOverride = [])
    {
        return array_merge([
            'http_method' => 'GET',
            'logged' => false,
            'lang' => 'en',
            'headers' => ['Content-Type: application/json'],
            'service_cacheable' => function() { return true; },
        ], $aOverride);
    }

    public function testGuestGetOfACacheableServiceIsPublic()
    {
        $this->assertTrue(bx_api_is_cacheable_response(self::request()));
    }

    #[DataProvider('providerForPrivate')]
    public function testOtherAnswersArePrivate($aOverride)
    {
        $this->assertFalse(bx_api_is_cacheable_response(self::request($aOverride)));
    }

    static public function providerForPrivate()
    {
        return [
            'member' => [['logged' => true]],
            'post' => [['http_method' => 'POST']],
            'no lang parameter' => [['lang' => false]],
            'empty lang parameter' => [['lang' => '']],
            'lang parameter not a string' => [['lang' => ['en']]],
            'cookie set' => [['headers' => ['Content-Type: application/json', 'Set-Cookie: lang=en; path=/']]],
            'service not cacheable' => [['service_cacheable' => function() { return false; }]],
        ];
    }

    public function testServiceIsAskedOnlyForAGuestGet()
    {
        $bAsked = false;
        bx_api_is_cacheable_response(self::request(['logged' => true, 'service_cacheable' => function() use (&$bAsked) { $bAsked = true; return true; }]));
        $this->assertFalse($bAsked);
    }

    public function testOwnCacheControlIsKept()
    {
        $this->assertNull(bx_api_is_cacheable_response(self::request(['headers' => ['Cache-Control: no-store']])));
    }

    #[DataProvider('providerForEtag')]
    public function testEtagMatches($sIfNoneMatch, $bMatches)
    {
        $this->assertSame($bMatches, bx_api_etag_matches($sIfNoneMatch, '"abc123"'));
    }

    static public function providerForEtag()
    {
        return [
            ['"abc123"', true],
            ['W/"abc123"', true],
            ['"abc123-gzip"', true],
            ['"abc123-br"', true],
            ['"other", "abc123"', true],
            ['*', true],
            ['"abc1234"', false],
            ['"other"', false],
            ['abc123', false],
            ['', false],
        ];
    }
}
