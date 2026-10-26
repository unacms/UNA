<?php

/**
 * Feed files: a file's icon or thumbnail is all its link shows, so it has an alt that names the file (its name, or
 * the post), and a photo that opens in place still links to itself.
 */
class BxTimelineTemplateFilesTest extends BxDolTestCase
{
    protected $_oTemplate;

    protected function setUp(): void
    {
        bx_import('BxDolModule');
        $oModule = BxDolModule::getInstance('bx_timeline');
        if (!$oModule)
            $this->markTestSkipped('bx_timeline module is not installed.');

        $oTemplate = $oModule->_oTemplate;
        if ($oTemplate instanceof BxDolModuleProxy)
            $oTemplate = $this->bxGetProtected($oTemplate, '_oProxifiedObject', BxDolModuleProxy::class);

        $this->_oTemplate = $oTemplate;
    }

    private function files(array $aFiles, string $sTitle = ''): array
    {
        $aEvent = ['id' => 42, 'content' => ['title' => $sTitle]];
        $aBrowseParams = ['view' => 'timeline', 'type' => 'feed'];

        $a = $this->bxCallProtectedArgs($this->_oTemplate, '_getTmplVarsFiles', [$aFiles, &$aEvent, &$aBrowseParams]);

        return array_map(fn($aItem) => $aItem['item'], $a['items']);
    }

    /**
     * The translated text. Fails when the key has no translation: `_t()` returns a missing key
     * unchanged, so comparing the output with another `_t()` call alone would accept it.
     */
    private function translated(string $sKey, ...$aArgs): string
    {
        $s = _t($sKey, ...$aArgs);
        $this->assertStringNotContainsString($sKey, $s, $sKey . ' has no translation in the site\'s language.');

        return $s;
    }

    private function document(int $i, string $sName = ''): array
    {
        $a = [
            'id' => $i,
            'src' => 'https://example.test/icons/txt.svg',
            'src_medium' => 'https://example.test/icons/txt.svg',
            'src_orig' => '',
            'url' => 'https://example.test/s/files/' . $i . '.txt',
        ];
        if ($sName !== '')
            $a['title'] = $sName;

        return $a;
    }

    private function photo(int $i, string $sName = ''): array
    {
        $a = [
            'id' => $i,
            'src' => 'https://example.test/' . $i . '-300.jpg',
            'src_medium' => 'https://example.test/' . $i . '-300.jpg',
            'src_orig' => 'https://example.test/' . $i . '.jpg',
            'url' => '',
        ];
        if ($sName !== '')
            $a['title'] = $sName;

        return $a;
    }

    public function testFileIsNamedAfterItself(): void
    {
        [$s] = $this->files([$this->document(1, 'agenda "draft".txt')], 'Community call');

        $this->assertStringContainsString('alt="agenda &quot;draft&quot;.txt"', $s);
        $this->assertStringContainsString('href="https://example.test/s/files/1.txt"', $s);
        $this->assertMatchesRegularExpression('/^<a [^>]*>\s*<img [^>]*alt="[^"]+"/', $s, 'The icon is the link\'s only content, so its alt names the link.');
    }

    public function testPhotoOpenedInPlaceLinksToItself(): void
    {
        [$s] = $this->files([$this->photo(1, 'lake.jpg')]);

        $this->assertStringContainsString('href="https://example.test/1.jpg"', $s, 'An empty href is a link to the page itself.');
        $this->assertStringContainsString('.showItem(this, ', $s, 'Clicking still opens the photo in place.');
        $this->assertStringContainsString('alt="lake.jpg"', $s);
    }

    public function testFileWithoutNameIsNamedAfterThePost(): void
    {
        [$s] = $this->files([$this->document(1)], 'Community call');
        $this->assertStringContainsString('alt="Community call"', $s);

        [$s] = $this->files([$this->document(1)]);
        $this->assertStringContainsString('alt="' . $this->translated('_bx_timeline_txt_file_alt') . '"', $s);
    }

    public function testSeveralFilesWithoutNamesAreNumbered(): void
    {
        $a = $this->files([$this->photo(1), $this->photo(2), $this->document(3)], 'Walk');
        $this->assertStringContainsString('alt="' . $this->translated('_bx_timeline_txt_file_alt_title_n', 'Walk', 3, 3) . '"', $a[2]);

        $a = $this->files([$this->photo(1), $this->photo(2)]);
        $this->assertStringContainsString('alt="' . $this->translated('_bx_timeline_txt_file_alt_n', 2, 2) . '"', $a[1]);
    }

    public function testFileNameIsNotReadAsATemplateKey(): void
    {
        [$s] = $this->files([$this->document(1, '__href__.txt')]);

        $this->assertStringContainsString('alt="&#95;&#95;href&#95;&#95;.txt"', $s);
        $this->assertStringNotContainsString('alt="https://', $s);
    }
}
