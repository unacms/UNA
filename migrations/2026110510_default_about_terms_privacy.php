<?php defined('BX_DOL') or die('hack attempt');
/*
 * UNA-Migration-Min-System-Version: 15.0.0-RC3
 *
 * Default texts of the About, Terms of Service and Privacy Policy pages (the sys_about, sys_terms
 * and sys_privacy lang blocks), in every installed language that ships them (English, Russian).
 * A string changes only while it still has the old one-line default, so text an operator has
 * written is left alone. About got its text in #6086, before migrations existed, so sites
 * installed earlier still have the old line.
 *
 * The new texts come from the language files, and the old defaults are matched by their SHA-256,
 * so no user-facing text is kept here.
 */

$aFiles = [
    'en' => 'boonex/english/data/langs/system/en.xml',
    'ru' => 'boonex/russian/data/langs/system/ru.xml',
];

// SHA-256 of the old defaults, English and Russian.
$aOld = [
    '_sys_page_lang_block_about' => [
        'c4b5d0d989da827f978764bde21a531b41e647eedc319d90b7f5463ad34f2558',
        '0bec3f948411c8a595c3345e302cc486618c2be301f0033e88918034b8f8884a',
    ],
    '_sys_page_lang_block_terms' => [
        '9d5d1e37e2a6c86bc99c1a69340740c5b9ddadac4a9747b0ed78b37b71fb6519',
        'd31e6cf2198efd453b618859b09aeb52ad7575e67203f65d693d5999118c39d2',
    ],
    '_sys_page_lang_block_privacy' => [
        'd6c535bd70648eaad69e6f73f898bbf229461b3a11a6dd9a15c4861c91834b94',
        'a8cdd7c7bab8d0cac491607bb153e76919687197fe0cb9afbecb87ca0db9ab99',
    ],
];

$oDb = BxDolDb::getInstance();

foreach ($aFiles as $sLang => $sFile) {
    $iLanguage = (int)$oDb->getOne($oDb->prepare("SELECT `ID` FROM `sys_localization_languages` WHERE `Name` = ?", $sLang));
    if (!$iLanguage)
        continue;

    $sPath = BX_DIRECTORY_PATH_MODULES . $sFile;
    $oXml = is_file($sPath) ? simplexml_load_file($sPath, 'SimpleXMLElement', LIBXML_NOCDATA) : false;
    if ($oXml === false)
        throw new RuntimeException("cannot read $sFile");

    foreach ($aOld as $sKey => $aHashes) {
        $aNodes = $oXml->xpath('//string[@name="' . $sKey . '"]');
        if (count($aNodes) !== 1)
            throw new RuntimeException("$sFile has no single $sKey");
        $sNew = trim((string)$aNodes[0]);

        $aRow = $oDb->getRow($oDb->prepare("SELECT `s`.`IDKey`, `s`.`String` FROM `sys_localization_strings` AS `s`
            INNER JOIN `sys_localization_keys` AS `k` ON `k`.`ID` = `s`.`IDKey`
            WHERE `k`.`Key` = ? AND `s`.`IDLanguage` = ?", $sKey, $iLanguage));
        if (empty($aRow) || !in_array(hash('sha256', trim($aRow['String'])), $aHashes, true))
            continue;

        $oDb->query($oDb->prepare("UPDATE `sys_localization_strings` SET `String` = ? WHERE `IDKey` = ? AND `IDLanguage` = ? AND `String` = ?",
            $sNew, (int)$aRow['IDKey'], $iLanguage, $aRow['String']));
    }
}
