<?php

/**
 * BxDolTemplate::getHtml reads each file once per template instance,
 * and any change of the template's locations starts that memo over.
 */
class BxDolTemplateGetHtmlTest extends BxDolTestCase
{
    private const FILE = 'bx_memo_test.html';

    private $_aKeys = [];
    private $_aDirs = [];

    protected function tearDown(): void
    {
        $oTemplate = BxDolTemplate::getInstance();
        foreach ($this->_aKeys as $sKey)
            $oTemplate->removeLocation($sKey);

        foreach ($this->_aDirs as $sDir) {
            @unlink($sDir . 'template' . DIRECTORY_SEPARATOR . self::FILE);
            @rmdir($sDir . 'template');
            @rmdir($sDir);
        }

        $this->_aKeys = [];
        $this->_aDirs = [];

        parent::tearDown();
    }

    public function testFileIsReadOnceWhileLocationsStayTheSame()
    {
        $oTemplate = BxDolTemplate::getInstance();
        $sDirA = $this->makeDir("  first \n");
        $this->addLocation('bx_memo_a', $sDirA);

        // The trim is kept.
        $this->assertSame('first', $oTemplate->getHtml(self::FILE));

        // The check-in is a part of the memo key.
        $this->assertFalse($oTemplate->getHtml(self::FILE, BX_DOL_TEMPLATE_CHECK_IN_TMPL));
        $this->assertSame('first', $oTemplate->getHtml(self::FILE, ['in' => BX_DOL_TEMPLATE_CHECK_IN_BOTH, 'sub' => 'bx_memo_a']));
        $this->assertFalse($oTemplate->getHtml(self::FILE, ['in' => BX_DOL_TEMPLATE_CHECK_IN_BOTH, 'sub' => 'mod_general']));

        // The file is not read again while the locations stay the same.
        $this->writeFile($sDirA, 'second');
        $this->assertSame('first', $oTemplate->getHtml(self::FILE));

        // A location added and removed again, as BxDolModuleTemplate::_addFiles does, keeps the memo.
        $oTemplate->addLocation('bx_memo_tmp', BX_DIRECTORY_PATH_TMP, BX_DOL_URL_ROOT);
        $oTemplate->removeLocation('bx_memo_tmp');
        $this->assertSame('first', $oTemplate->getHtml(self::FILE));

        // A new location starts the memo over, and the location added last wins.
        $this->addLocation('bx_memo_b', $this->makeDir('other'));
        $this->assertSame('other', $oTemplate->getHtml(self::FILE));

        // Removing it starts the memo over again, so the file is read again.
        $oTemplate->removeLocation('bx_memo_b');
        $this->assertSame('second', $oTemplate->getHtml(self::FILE));

        // A missing file is still false.
        $this->assertFalse($oTemplate->getHtml('bx_memo_missing.html'));
    }

    public function testPathQualifiedNameIsReadEveryTime()
    {
        $oTemplate = BxDolTemplate::getInstance();
        $sDir = $this->makeDir('first');
        $sName = str_replace(BX_DIRECTORY_PATH_ROOT, '', $sDir) . 'template|' . self::FILE;

        $this->assertSame('first', $oTemplate->getHtml($sName));

        $this->writeFile($sDir, 'second');
        $this->assertSame('second', $oTemplate->getHtml($sName));
    }

    private function makeDir($sContent)
    {
        $sDir = BX_DIRECTORY_PATH_TMP . 'tpl-memo-' . uniqid() . DIRECTORY_SEPARATOR;
        $this->assertTrue(mkdir($sDir . 'template', 0777, true));
        $this->_aDirs[] = $sDir;

        $this->writeFile($sDir, $sContent);

        return $sDir;
    }

    private function writeFile($sDir, $sContent)
    {
        $this->assertNotFalse(file_put_contents($sDir . 'template' . DIRECTORY_SEPARATOR . self::FILE, $sContent));
    }

    private function addLocation($sKey, $sDir)
    {
        $this->_aKeys[] = $sKey;
        BxDolTemplate::getInstance()->addLocation($sKey, $sDir, BX_DOL_URL_ROOT);
    }
}
