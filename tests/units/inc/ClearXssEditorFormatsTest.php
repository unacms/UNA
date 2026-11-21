<?php

/**
 * What the rich text editors offer survives the save filter for members (HTML Purifier): headings, bold, italic,
 * underline, links, lists, quotes, code, images and the Marker's highlight. Quill's alignment and indent are classes
 * and stay too (styled in shown text by .bx-def-vanilla-html).
 */
class ClearXssEditorFormatsTest extends BxDolTestCase
{
    private $_aLoggedBackup;

    protected function setUp(): void
    {
        parent::setUp();
        $this->_aLoggedBackup = $GLOBALS['logged'] ?? null;
        $GLOBALS['logged'] = ['admin' => false, 'member' => true];
        unset($GLOBALS['oHtmlPurifier']); // built for a member, not an admin
    }

    protected function tearDown(): void
    {
        $GLOBALS['logged'] = $this->_aLoggedBackup;
        unset($GLOBALS['oHtmlPurifier']);
        parent::tearDown();
    }

    public static function formats(): array
    {
        return [
            'heading 2' => ['<h2>About</h2>', '<h2>About</h2>'],
            'heading 3' => ['<h3>Work</h3>', '<h3>Work</h3>'],
            'bold and italic' => ['<p><b>b</b> <i>i</i> <strong>s</strong> <em>e</em> <u>u</u></p>', '<p><b>b</b> <i>i</i> <strong>s</strong> <em>e</em> <u>u</u></p>'],
            'bullets' => ['<ul><li>one</li></ul>', '<ul><li>one</li></ul>'],
            'numbers' => ['<ol><li>one</li></ol>', '<ol><li>one</li></ol>'],
            'quote' => ['<blockquote>q</blockquote>', '<blockquote>q</blockquote>'],
            'code' => ['<pre><code>x()</code></pre>', '<pre><code>x()</code></pre>'],
            'marker' => ['<p><mark class="cdx-marker">m</mark></p>', '<mark class="cdx-marker">m</mark>'],
            'quill alignment' => ['<p class="ql-align-center">c</p>', '<p class="ql-align-center">c</p>'],
            'quill indent' => ['<p class="ql-indent-1">i</p>', '<p class="ql-indent-1">i</p>'],
        ];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('formats')]
    public function testFormatSurvivesTheSaveFilter(string $sHtml, string $sKept): void
    {
        $this->assertStringContainsString($sKept, clear_xss($sHtml));
    }

    public function testLinkIsKept(): void
    {
        $this->assertMatchesRegularExpression('/<a href="https:\/\/example\.com"[^>]*>link<\/a>/', clear_xss('<p><a href="https://example.com">link</a></p>'));
    }

    public function testScriptIsStillRemoved(): void
    {
        $s = clear_xss('<p><mark onclick="alert(1)">m</mark><script>alert(1)</script></p>');

        $this->assertStringNotContainsString('onclick', $s);
        $this->assertStringNotContainsString('<script', $s);
    }
}
