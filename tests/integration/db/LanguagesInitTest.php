<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Without a 'lang' request parameter the language is looked up once when the languages
 * start: the second pass, which only saves a requested language to the cookie, is skipped.
 */
#[Group('integration')]
class LanguagesInitTest extends BxDolIntegrationTestCase
{
    private array $_aBackup = [];

    protected function setUp(): void
    {
        parent::setUp();

        $this->_aBackup = [
            'get' => $_GET,
            'post' => $_POST,
            'cookie' => $_COOKIE,
            'accept' => $_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? null,
            'current' => $GLOBALS['sCurrentLanguage'] ?? null,
        ];
        unset($_GET['lang'], $_POST['lang'], $_COOKIE['lang'], $_SERVER['HTTP_ACCEPT_LANGUAGE']);
    }

    protected function tearDown(): void
    {
        $_GET = $this->_aBackup['get'];
        $_POST = $this->_aBackup['post'];
        $_COOKIE = $this->_aBackup['cookie'];
        if ($this->_aBackup['accept'] !== null)
            $_SERVER['HTTP_ACCEPT_LANGUAGE'] = $this->_aBackup['accept'];
        if ($this->_aBackup['current'] !== null)
            $GLOBALS['sCurrentLanguage'] = $this->_aBackup['current'];

        parent::tearDown();
    }

    public function testLanguageIsLookedUpOnceWithoutLangParameter(): void
    {
        $oRecorder = new class {
            public array $aQueries = [];
            public function beginQuery($sSql) { $this->aQueries[] = preg_replace('/\s+/', ' ', $sSql); }
            public function __call($sName, $aArgs) { return null; }
        };

        $sBefore = $GLOBALS['sCurrentLanguage'] ?? '';
        $mixedPrevious = $GLOBALS['bx_profiler'] ?? null;
        $GLOBALS['bx_profiler'] = $oRecorder;
        try {
            $this->bxCallProtected(BxDolLanguages::getInstance(), 'init');
        }
        finally {
            if ($mixedPrevious !== null)
                $GLOBALS['bx_profiler'] = $mixedPrevious;
            else
                unset($GLOBALS['bx_profiler']);
        }

        $aLookups = array_filter($oRecorder->aQueries, fn($s) => stripos($s, 'SELECT `ID` FROM `sys_localization_languages` WHERE `Name`=') !== false);
        $this->assertCount(1, $aLookups, 'One lookup of the default language.');
        $this->assertNotEmpty($GLOBALS['sCurrentLanguage']);
        if ($sBefore !== '')
            $this->assertSame($sBefore, $GLOBALS['sCurrentLanguage'], 'The same language as before.');
    }
}
