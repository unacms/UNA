<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The default texts of the About, Terms of Service and Privacy Policy pages (the sys_about, sys_terms and
 * sys_privacy lang blocks): what a fresh install has, the migration that brings them to installed sites only
 * while they still have the old one-line default, and the {site_title} marker in the API, which NEO shows.
 */
#[Group('integration')]
class LegalPagesDefaultTextTest extends BxDolIntegrationTestCase
{
    private const MIGRATION = 'migrations/2026110510_default_about_terms_privacy.sql';

    private const OLD = [
        'en' => [
            '_sys_page_lang_block_about' => 'This site is powered by UNA. The rest is a mystery.',
            '_sys_page_lang_block_terms' => 'Our terms of use.',
            '_sys_page_lang_block_privacy' => 'Our privacy policy.',
        ],
        'ru' => [
            '_sys_page_lang_block_about' => 'Этот сайт сделан на UNA. Остальное - тайна, покрытая мраком.',
            '_sys_page_lang_block_terms' => 'Правила пользования нашим сайтом.',
            '_sys_page_lang_block_privacy' => 'Политика конфиденциальности нашего сайта.',
        ],
    ];

    private const FILES = [
        'en' => 'modules/boonex/english/data/langs/system/en.xml',
        'ru' => 'modules/boonex/russian/data/langs/system/ru.xml',
    ];

    private PDO $_oPdo;
    private array $_aBackup = [];
    private array $_aGetBackup = [];

    protected function setUp(): void
    {
        parent::setUp();
        BxDolDb::getInstance();
        $this->_oPdo = BxDolDb::getLink();
        $this->_aGetBackup = $_GET;
    }

    protected function tearDown(): void
    {
        foreach ($this->_aBackup as $sLang => $aStrings)
            foreach ($aStrings as $sKey => $sValue)
                $this->_setString($sLang, $sKey, $sValue);

        $_GET = $this->_aGetBackup;
        unset($GLOBALS['bxDolClasses']['BxDolPage!sys_terms'], $GLOBALS['bxDolClasses']['BxDolPage!sys_privacy']);
        BxDolDb::getInstance()->cleanMemoryAll();
        parent::tearDown();
    }

    public function testInstalledTextsAreTheShippedOnes(): void
    {
        $sLang = 'en';
        foreach (['_sys_page_lang_block_terms', '_sys_page_lang_block_privacy'] as $sKey) {
            $sShipped = $this->_shipped($sLang, $sKey);
            $this->assertSame($sShipped, $this->_getString($sLang, $sKey), $sKey);

            // The operator runs the site, not UNA, Inc.; the site's name comes from its settings.
            $this->assertStringContainsString('UNA, Inc.', $sShipped, $sKey);
            $this->assertStringContainsString('{site_title}', $sShipped, $sKey);
            $this->assertStringContainsString('Note for the site operator', $sShipped, $sKey);
        }
    }

    public function testMigrationReplacesOnlyTheOldDefault(): void
    {
        foreach (self::OLD as $sLang => $aOld) {
            if (!$this->_languageId($sLang))
                continue;

            foreach ($aOld as $sKey => $sOld) {
                if ($this->_getString($sLang, $sKey) === null)
                    continue;
                $this->_backup($sLang, $sKey);

                $this->_setString($sLang, $sKey, $sOld);
                $this->_runMigration();
                $this->assertSame($this->_shipped($sLang, $sKey), $this->_getString($sLang, $sKey), "$sLang $sKey: the old default is replaced");

                $sOwn = 'Our own text, written by the operator.';
                $this->_setString($sLang, $sKey, $sOwn);
                $this->_runMigration();
                $this->assertSame($sOwn, $this->_getString($sLang, $sKey), "$sLang $sKey: the operator's text stays");
            }
        }
    }

    public function testApiReplacesSiteTitle(): void
    {
        $this->bxBecomeGuest();
        $sSiteTitle = getParam('site_title');
        $this->assertNotSame('', $sSiteTitle);

        foreach (['terms', 'privacy'] as $sUri) {
            unset($GLOBALS['bxDolClasses']['BxDolPage!sys_' . $sUri]);
            $_GET = ['api' => 1];
            $aData = bx_srv('system', 'get_page_by_request', ['page/' . $sUri, '', '[]'], 'TemplServicePages');
            $this->assertIsArray($aData, $sUri);

            $aBlocks = $this->_findBlocks($aData, 'lang');
            $this->assertNotEmpty($aBlocks, "$sUri has a lang block");
            $sContent = $aBlocks[0]['data']['content'];
            $this->assertStringNotContainsString('{site_title}', $sContent, $sUri);
            $this->assertStringContainsString($sSiteTitle, $sContent, $sUri);
        }
    }

    private function _runMigration(): void
    {
        $this->_oPdo->exec("SET SESSION sql_mode = ''");
        foreach (BxDolMigrations::splitSql((string)file_get_contents(BX_DIRECTORY_PATH_ROOT . self::MIGRATION)) as $sStatement)
            $this->_oPdo->exec($sStatement);
    }

    private function _shipped(string $sLang, string $sKey): string
    {
        $oXml = simplexml_load_file(BX_DIRECTORY_PATH_ROOT . self::FILES[$sLang], 'SimpleXMLElement', LIBXML_NOCDATA);
        $aNodes = $oXml->xpath('//string[@name="' . $sKey . '"]');
        $this->assertCount(1, $aNodes, $sKey);

        return (string)$aNodes[0];
    }

    private function _languageId(string $sLang): int
    {
        $oStmt = $this->_oPdo->prepare("SELECT `ID` FROM `sys_localization_languages` WHERE `Name` = ?");
        $oStmt->execute([$sLang]);

        return (int)$oStmt->fetchColumn();
    }

    private function _getString(string $sLang, string $sKey): ?string
    {
        $oStmt = $this->_oPdo->prepare("SELECT `s`.`String` FROM `sys_localization_strings` AS `s`
            INNER JOIN `sys_localization_keys` AS `k` ON `k`.`ID` = `s`.`IDKey`
            INNER JOIN `sys_localization_languages` AS `l` ON `l`.`ID` = `s`.`IDLanguage`
            WHERE `k`.`Key` = ? AND `l`.`Name` = ?");
        $oStmt->execute([$sKey, $sLang]);
        $mixed = $oStmt->fetchColumn();

        return $mixed === false ? null : (string)$mixed;
    }

    private function _setString(string $sLang, string $sKey, string $sValue): void
    {
        $oStmt = $this->_oPdo->prepare("UPDATE `sys_localization_strings` AS `s`
            INNER JOIN `sys_localization_keys` AS `k` ON `k`.`ID` = `s`.`IDKey`
            INNER JOIN `sys_localization_languages` AS `l` ON `l`.`ID` = `s`.`IDLanguage`
            SET `s`.`String` = ? WHERE `k`.`Key` = ? AND `l`.`Name` = ?");
        $oStmt->execute([$sValue, $sKey, $sLang]);
    }

    private function _backup(string $sLang, string $sKey): void
    {
        if (!isset($this->_aBackup[$sLang][$sKey]))
            $this->_aBackup[$sLang][$sKey] = $this->_getString($sLang, $sKey);
    }

    /** Blocks of the given type anywhere in a page API response. */
    private function _findBlocks(array $a, string $sType): array
    {
        $aResult = [];
        if (($a['type'] ?? null) === $sType && isset($a['data']['content']))
            $aResult[] = $a;
        foreach ($a as $mixed)
            if (is_array($mixed))
                $aResult = array_merge($aResult, $this->_findBlocks($mixed, $sType));

        return $aResult;
    }
}
