<?php

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * CSV downloads: visitor text never reaches a spreadsheet as a formula, numbers stay numbers,
 * and the file name is made of known parts only.
 */
class BxAnalyticsCsvTest extends \PHPUnit\Framework\TestCase
{
    public static function setUpBeforeClass(): void
    {
        require_once BX_DIRECTORY_PATH_MODULES . 'boonex/analytics/classes/BxAnalyticsCsv.php';
    }

    public static function providerCell()
    {
        return [
            'formula' => ['=HYPERLINK("http://x.example","y")', '\'=HYPERLINK("http://x.example","y")'],
            'plus' => ['+1+1', "'+1+1"],
            'minus' => ['-2+3', "'-2+3"],
            'at' => ['@SUM(A1)', "'@SUM(A1)"],
            'tab' => ["\t=1", "'\t=1"],
            'carriage return' => ["\r=1", "'\r'=1"],
            'after a semicolon' => ['x;=1+1;', "x;'=1+1;"],
            'command after a semicolon' => ["/p;=cmd|'/Ccalc'!A0;", "/p;'=cmd|'/Ccalc'!A0;"],
            'after a semicolon and spaces' => ['a;  @SUM(A1)', "a;  '@SUM(A1)"],
            'after a line break' => ["a\n-1", "a\n'-1"],
            'every one' => ['=1;+2;-3', "'=1;'+2;'-3"],
            'semicolon without a formula' => ['a;b; c', 'a;b; c'],
            'leading spaces' => ['  =1', "  '=1"],
            'path' => ['/page/view-post?id=5', '/page/view-post?id=5'],
            'formula later in the text' => ['/a=1', '/a=1'],
            'multibyte' => ['Ünïcode 日本', 'Ünïcode 日本'],
            'empty' => ['', ''],
            'number' => [-5, -5],
            'decimal' => [-1.5, -1.5],
            'numeric text from a visitor' => ['-5', "'-5"],
            'bool' => [true, 1],
        ];
    }

    #[DataProvider('providerCell')]
    public function testCell($mixedInput, $mixedExpected)
    {
        $this->assertSame($mixedExpected, BxAnalyticsCsv::cell($mixedInput));
    }

    public function testFilename()
    {
        $this->assertSame('analytics-query-country-2026-09-01-2026-09-30.csv', BxAnalyticsCsv::getFilename(['query', 'country', '2026-09-01', '2026-09-30']));
        $this->assertSame('analytics-query-pathDROP-x.csv', BxAnalyticsCsv::getFilename(['query', "path`;DROP\r\n", '"x', '']), 'quotes, line breaks and separators never reach the header');
        $this->assertSame('analytics-etcpasswd.csv', BxAnalyticsCsv::getFilename(['../../etc/passwd']));
    }

    public function testWrite()
    {
        $r = fopen('php://memory', 'w+');
        BxAnalyticsCsv::write($r, ['Page', 'Unique visitors'], [['=cmd|"/c calc"!A1', 12], ['/a,b', 3.5], ['say "hi"', 0], ['x;=1+1;', 5]]);
        rewind($r);
        $s = stream_get_contents($r);
        fclose($r);

        $this->assertSame("\xEF\xBB\xBF", substr($s, 0, 3), 'a byte order mark, so spreadsheets read UTF-8');
        $this->assertSame([
            'Page,"Unique visitors"',
            '"\'=cmd|""/c calc""!A1",12',
            '"/a,b",3.5',
            '"say ""hi""",0',
            "x;'=1+1;,5",
            '',
        ], explode("\n", substr($s, 3)));
    }
}
