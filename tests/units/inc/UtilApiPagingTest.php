<?php

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Paging values an API client sends: per page is a whole number from 1 to 50, otherwise the
 * service's default, and start is a whole number from 0 to 100000.
 */
class UtilApiPagingTest extends \PHPUnit\Framework\TestCase
{
    #[DataProvider('providerForPerPage')]
    public function testPerPage($mixedIn, $mixedOut)
    {
        $this->assertSame($mixedOut, bx_api_get_per_page($mixedIn, 12));
    }

    static public function providerForPerPage()
    {
        return [
            [12, 12],
            ['12', 12],
            [1, 1],
            [50, 50],
            ['24', 24],
            [12.9, 12],
            [51, 12],
            [500, 12],
            ['500', 12],
            ['99999999999999999999', 12],
            [0, 12],
            [-1, 12],
            ['-20', 12],
            ['', 12],
            [null, 12],
            [false, 12],
            [true, 12],
            ['12abc', 12],
            ['sys_per_page_browse_showcase', 12],
            [[30], 12],
        ];
    }

    public function testPerPageDefaultAndMax()
    {
        $this->assertSame(10, bx_api_get_per_page(0, 10));
        $this->assertSame(0, bx_api_get_per_page(500, 0), 'The default may say "use the module\'s own".');
        $this->assertFalse(bx_api_get_per_page('x', false));
        $this->assertSame(100, bx_api_get_per_page(100, 12, 100));
        $this->assertSame(12, bx_api_get_per_page(101, 12, 100));
    }

    #[DataProvider('providerForStart')]
    public function testStart($mixedIn, $iOut)
    {
        $this->assertSame($iOut, bx_api_get_start($mixedIn));
    }

    static public function providerForStart()
    {
        return [
            [0, 0],
            [12, 12],
            ['24', 24],
            [100000, 100000],
            [100001, 100000],
            ['99999999999999999999', 100000],
            [-1, 0],
            ['-12', 0],
            ['', 0],
            [null, 0],
            ['12abc', 0],
            [[12], 0],
        ];
    }
}
