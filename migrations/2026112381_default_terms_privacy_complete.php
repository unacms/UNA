<?php defined('BX_DOL') or die('hack attempt');
/*
 * UNA-Migration-Min-System-Version: 15.0.0-RC4
 *
 * Terms of Service and Privacy Policy (the sys_terms and sys_privacy lang blocks) become complete neutral texts: no
 * note for the operator and no [placeholders], which every visitor saw. A string changes only while it still has the
 * previous default (the template of 2026110510), so text an operator has written is left alone. While a page has the
 * default text, the operator sees a note to review it (`sys_page_lang_blocks_review`, BxDolPage::isLangBlockToReview)
 * until they save the block in Studio.
 *
 * The new texts come from the language files, and the previous defaults are matched by their SHA-256, so no
 * user-facing text is kept here.
 */

$aFiles = [
    'en' => 'boonex/english/data/langs/system/en.xml',
    'ru' => 'boonex/russian/data/langs/system/ru.xml',
];

// SHA-256 of the previous defaults, English and Russian.
$aOld = [
    '_sys_page_lang_block_terms' => [
        '35b56ec52a36913e78a9db809867801aa697889b8a6aa95baf9809815fbf1dca',
        'a637f37c8e90636fa0c7c27748d48aaf44e2b1b89f277d1a52a629bd5e5f11f5',
    ],
    '_sys_page_lang_block_privacy' => [
        'd38f3968fa0b1b9cfca10e6836e79faeef1ca041929c28eeb8145c3251b8f965',
        'a51f4fd1689ddec3acb908b6477145b14d9d673ae6adf857ed14c47bb78ed4d2',
    ],
];

$oDb = BxDolDb::getInstance();

$aReview = [];
foreach ($aFiles as $sLang => $sFile) {
    $iLanguage = (int)$oDb->getOne($oDb->prepare("SELECT `ID` FROM `sys_localization_languages` WHERE `Name` = ?", $sLang));
    if (!$iLanguage) {
        continue;
    }

    $sPath = BX_DIRECTORY_PATH_MODULES . $sFile;
    $oXml = is_file($sPath) ? simplexml_load_file($sPath, 'SimpleXMLElement', LIBXML_NOCDATA) : false;
    if ($oXml === false) {
        throw new UnexpectedValueException("cannot read $sFile");
    }

    foreach ($aOld as $sKey => $aHashes) {
        $aNodes = $oXml->xpath('//string[@name="' . $sKey . '"]');
        if (count($aNodes) !== 1) {
            throw new UnexpectedValueException("$sFile has no single $sKey");
        }
        $sNew = trim((string)$aNodes[0]);

        $aRow = $oDb->getRow($oDb->prepare("SELECT `s`.`IDKey`, `s`.`String` FROM `sys_localization_strings` AS `s`
            INNER JOIN `sys_localization_keys` AS `k` ON `k`.`ID` = `s`.`IDKey`
            WHERE `k`.`Key` = ? AND `s`.`IDLanguage` = ?", $sKey, $iLanguage));
        if (empty($aRow)) {
            continue;
        }

        $sString = trim($aRow['String']);
        if (in_array(hash('sha256', $sString), $aHashes, true)) {
            $oDb->query($oDb->prepare("UPDATE `sys_localization_strings` SET `String` = ? WHERE `IDKey` = ? AND `IDLanguage` = ? AND `String` = ?",
                $sNew, (int)$aRow['IDKey'], $iLanguage, $aRow['String']));
            $sString = $sNew;
        }

        // The shipped text, updated now or by an earlier migration: the operator is asked to review it.
        if ($sString === $sNew) {
            $aReview[$sKey] = true;
        }
    }
}

$oDb->query("INSERT INTO `sys_options` (`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`)
    SELECT `id`, 'sys_page_lang_blocks_review', '', '', 'text', '', '', '', 27 FROM `sys_options_categories`
    WHERE `name` = 'system' AND NOT EXISTS (SELECT 1 FROM `sys_options` WHERE `name` = 'sys_page_lang_blocks_review') LIMIT 1");

if ($aReview) {
    $sValue = (string)$oDb->getOne("SELECT `value` FROM `sys_options` WHERE `name` = 'sys_page_lang_blocks_review'");
    $aKeys = array_filter(array_map('trim', explode(',', $sValue)));
    $aKeys = array_values(array_unique(array_merge($aKeys, array_keys($aReview))));
    $oDb->query($oDb->prepare("UPDATE `sys_options` SET `value` = ? WHERE `name` = 'sys_page_lang_blocks_review'", implode(',', $aKeys)));
}
