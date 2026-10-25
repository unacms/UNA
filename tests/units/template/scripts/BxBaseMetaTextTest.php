<?php

/**
 * Page meta text (description, link previews) is plain text made of html: the words of separate paragraphs,
 * list items and headings don't run together, entities are decoded once and whitespace is collapsed.
 * Brand words and numbers stay as they are: the head used to turn "iPhone" into "i Phone" and "3.5" into "3. 5".
 */
class BxBaseMetaTextTest extends BxDolTestCase
{
    private function text(string $sHtml, int $iLength = 200): string
    {
        return BxTemplFunctions::getInstance()->getMetaText($sHtml, $iLength);
    }

    public function testBlocksDontRunTogether(): void
    {
        $this->assertSame('Keep the old ones. Show the activity', $this->text('<p>Keep the old ones.</p><p>Show the activity</p>'));
        $this->assertSame('Intro Item one Item two Heading Line one Line two', $this->text('Intro<ul><li>Item one</li><li>Item two</li></ul><h2>Heading</h2>Line one<br>Line two'));
    }

    public function testWordsAndNumbersStayIntact(): void
    {
        $this->assertSame('The new iPhone costs 3.5 times more, see https://example.com/a.b', $this->text('The new iPhone costs 3.5 times more, see https://example.com/a.b'));
    }

    public function testEntitiesAreDecodedOnceAndSpacesCollapsed(): void
    {
        $this->assertSame('R&D feed & more "quoted"', $this->text("R&amp;D&nbsp;feed &amp; more\n\t &quot;quoted&quot;"));
        $this->assertSame('&lt; stays text', $this->text('&amp;lt; stays text'));
    }

    public function testScriptsAndStylesAreDropped(): void
    {
        $this->assertSame('Before after', $this->text('Before <script>alert(1)</script><style>p{color:red}</style>after'));
    }

    public function testLongTextIsCutOnAWordBoundary(): void
    {
        $sText = str_repeat('Καλημέρα κόσμε ', 40);
        $s = $this->text('<p>' . $sText . '</p>');

        $this->assertLessThanOrEqual(200, mb_strlen($s));
        $this->assertMatchesRegularExpression('/(Καλημέρα|κόσμε)…$/u', $s, 'The cut falls between words.');
        $this->assertSame(trim(preg_replace('/\s+/u', ' ', $sText)), $this->text($sText, 0), 'No cut without a length.');
    }

    public function testLongWordIsCutInsideKeepingTheText(): void
    {
        $this->assertSame(str_repeat('a', 199) . '…', $this->text(str_repeat('a', 500)), 'One long word is cut inside it.');

        $s = $this->text('Short ' . str_repeat('b', 500));
        $this->assertSame(200, mb_strlen($s), 'A short word before a long one doesn\'t throw most of the text away.');
        $this->assertStringStartsWith('Short bbb', $s);

        $this->assertSame('One two three…', $this->text('One two three, four', 15), 'No dangling punctuation before the ellipsis.');
    }
}
