<?php

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * bx_api_cache_response answers 304 when the client already has the answer: its If-None-Match
 * names the ETag, also as a weak tag or with the suffix Apache's mod_deflate adds.
 */
class UtilApiCacheTest extends \PHPUnit\Framework\TestCase
{
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
