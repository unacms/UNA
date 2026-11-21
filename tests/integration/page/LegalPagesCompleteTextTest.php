<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Terms of Service and Privacy Policy ship as complete texts (no operator note, no [placeholders]). Migration
 * 2026112181 brings them to sites that still have the previous template, and the operator sees a note to review them
 * (`sys_page_lang_blocks_review`) until the block is saved in Studio.
 */
#[Group('integration')]
class LegalPagesCompleteTextTest extends BxDolIntegrationTestCase
{
    private const MIGRATION = 'migrations/2026112381_default_terms_privacy_complete.php';

    private const KEYS = ['_sys_page_lang_block_terms', '_sys_page_lang_block_privacy'];

    private const FILES = [
        'en' => 'modules/boonex/english/data/langs/system/en.xml',
        'ru' => 'modules/boonex/russian/data/langs/system/ru.xml',
    ];

    private PDO $_oPdo;
    private array $_aBackup = [];
    private string $_sReviewBackup = '';
    private int $_iTempLanguage = 0;

    protected function setUp(): void
    {
        parent::setUp();
        BxDolDb::getInstance();
        $this->_oPdo = BxDolDb::getLink();
        $this->_sReviewBackup = (string)getParam('sys_page_lang_blocks_review');
    }

    protected function tearDown(): void
    {
        foreach ($this->_aBackup as $sLang => $aStrings)
            if (!($this->_iTempLanguage && $sLang === 'ru'))
                foreach ($aStrings as $sKey => $sValue)
                    $this->_setString($sLang, $sKey, $sValue);

        if ($this->_iTempLanguage) {
            $this->_oPdo->exec('DELETE FROM `sys_localization_strings` WHERE `IDLanguage` = ' . $this->_iTempLanguage);
            $this->_oPdo->exec('DELETE FROM `sys_localization_languages` WHERE `ID` = ' . $this->_iTempLanguage);
        }

        setParam('sys_page_lang_blocks_review', $this->_sReviewBackup);
        BxDolDb::getInstance()->cleanMemoryAll();
        parent::tearDown();
    }

    public function testShippedTextsAreComplete(): void
    {
        foreach (array_keys(self::FILES) as $sLang)
            foreach (self::KEYS as $sKey) {
                $sText = $this->_shipped($sLang, $sKey);
                $this->assertDoesNotMatchRegularExpression('/\[[^\]]*\]/u', $sText, "$sLang $sKey has no placeholder");
                $this->assertStringNotContainsString('<em>', $sText, "$sLang $sKey has no note to the operator");
                $this->assertStringContainsString('{site_title}', $sText, "$sLang $sKey names the site");
                // Sections are h2 under the page's h1 (Lighthouse heading-order).
                $this->assertStringNotContainsString('<h3>', $sText, "$sLang $sKey");
            }
    }

    public function testMigrationReplacesOnlyThePreviousTemplate(): void
    {
        if (!$this->_languageId('ru'))
            $this->_addTempLanguage('ru');

        foreach (array_keys(self::FILES) as $sLang)
            foreach (self::KEYS as $sKey)
                $this->_backup($sLang, $sKey);

        foreach (array_keys(self::FILES) as $sLang) {
            foreach (self::KEYS as $sKey) {
                // An operator's own texts everywhere else, so only this key can be marked for review.
                foreach (array_keys(self::FILES) as $sLangOther)
                    foreach (self::KEYS as $sKeyOther)
                        $this->_setString($sLangOther, $sKeyOther, 'Our own text.');
                setParam('sys_page_lang_blocks_review', '');

                $this->_setString($sLang, $sKey, $this->_previous($sLang, $sKey));
                $this->_runMigration();
                $this->assertSame($this->_shipped($sLang, $sKey), $this->_getString($sLang, $sKey), "$sLang $sKey: the previous template is replaced");
                $this->_clearOptionsCache();
                $this->assertTrue(BxDolPage::isLangBlockToReview($sKey), "$sLang $sKey: the operator is asked to review it");

                setParam('sys_page_lang_blocks_review', '');
                $this->_setString($sLang, $sKey, 'Our own text.');
                $this->_runMigration();
                $this->assertSame('Our own text.', $this->_getString($sLang, $sKey), "$sLang $sKey: the operator's text stays");
                $this->_clearOptionsCache();
                $this->assertFalse(BxDolPage::isLangBlockToReview($sKey), "$sLang $sKey: no review of the operator's text");
            }
        }
    }

    public function testSavingTheBlockEndsTheReview(): void
    {
        setParam('sys_page_lang_blocks_review', '_sys_page_lang_block_terms,_sys_page_lang_block_privacy');
        $this->assertTrue(BxDolPage::isLangBlockToReview('_sys_page_lang_block_terms'));
        $this->assertFalse(BxDolPage::isLangBlockToReview('_sys_page_lang_block_about'));
        $this->assertFalse(BxDolPage::isLangBlockToReview(''));

        BxDolPage::setLangBlockReviewed('_sys_page_lang_block_terms');
        $this->assertFalse(BxDolPage::isLangBlockToReview('_sys_page_lang_block_terms'));
        $this->assertTrue(BxDolPage::isLangBlockToReview('_sys_page_lang_block_privacy'));
        $this->assertSame('_sys_page_lang_block_privacy', getParam('sys_page_lang_blocks_review'));

        // A key that isn't waiting changes nothing.
        BxDolPage::setLangBlockReviewed('_sys_page_lang_block_about');
        $this->assertSame('_sys_page_lang_block_privacy', getParam('sys_page_lang_blocks_review'));
    }

    private function _runMigration(): void
    {
        (static function (string $sPath) {
            return require $sPath; // NOSONAR
        })(BX_DIRECTORY_PATH_ROOT . self::MIGRATION);
    }

    /**
     * The migration writes the option with SQL, as BxDolMigrations runs it (and then clears the caches): put the
     * stored value into the options cache with setParam, which keeps the other options there.
     */
    private function _clearOptionsCache(): void
    {
        setParam('sys_page_lang_blocks_review', (string)BxDolDb::getInstance()->getOne("SELECT `value` FROM `sys_options` WHERE `name` = 'sys_page_lang_blocks_review'"));
    }

    /** The template a site had before this change (2026110510), kept as fixtures. */
    private function _previous(string $sLang, string $sKey): string
    {
        $sName = str_replace('_sys_page_lang_block_', '', $sKey);
        $sText = file_get_contents(__DIR__ . '/fixtures/legal_2026110510_' . $sName . '_' . $sLang . '.html');
        $this->assertNotFalse($sText);

        return $sText;
    }

    private function _shipped(string $sLang, string $sKey): string
    {
        $oXml = simplexml_load_file(BX_DIRECTORY_PATH_ROOT . self::FILES[$sLang], 'SimpleXMLElement', LIBXML_NOCDATA);
        $aNodes = $oXml->xpath('//string[@name="' . $sKey . '"]');
        $this->assertCount(1, $aNodes, $sKey);

        return trim((string)$aNodes[0]);
    }

    private function _addTempLanguage(string $sLang): void
    {
        $this->_oPdo->prepare("INSERT INTO `sys_localization_languages` (`Name`, `Title`, `LanguageCountry`, `Enabled`) VALUES (?, 'PHPUnit', '', 0)")->execute([$sLang]);
        $this->_iTempLanguage = (int)$this->_oPdo->lastInsertId();

        $oStmt = $this->_oPdo->prepare("INSERT INTO `sys_localization_strings` (`IDKey`, `IDLanguage`, `String`)
            SELECT `ID`, ?, '' FROM `sys_localization_keys` WHERE `Key` = ?");
        foreach (self::KEYS as $sKey)
            $oStmt->execute([$this->_iTempLanguage, $sKey]);
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
        if (!array_key_exists($sKey, $this->_aBackup[$sLang] ?? []))
            $this->_aBackup[$sLang][$sKey] = $this->_getString($sLang, $sKey);
    }
}
