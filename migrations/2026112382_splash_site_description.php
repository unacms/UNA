<?php defined('BX_DOL') or die('hack attempt');
/*
 * UNA-Migration-Min-System-Version: 15.0.0-RC4
 *
 * The guest splash's tagline is the site's description ({site_description}: the home page's description, else
 * `_sys_page_meta_description_default`), the words search results show, instead of a slogan of its own. The splash
 * code changes only where it still has the default tagline element and the slogan string is still the default one,
 * so a splash or a slogan an operator has written is left alone.
 */

$sOld = '<p class="bx-landing-text"><bx_text:_sys_txt_splash_slogan /></p>';
$sNew = '<p class="bx-landing-text">{site_description}</p>';

$oDb = BxDolDb::getInstance();

// The slogan in English as it ships: an operator who changed it keeps it.
$sPath = BX_DIRECTORY_PATH_MODULES . 'boonex/english/data/langs/system/en.xml';
$oXml = is_file($sPath) ? simplexml_load_file($sPath, 'SimpleXMLElement', LIBXML_NOCDATA) : false;
if ($oXml === false) {
    throw new UnexpectedValueException('cannot read en.xml');
}
$aNodes = $oXml->xpath('//string[@name="_sys_txt_splash_slogan"]');
if (count($aNodes) !== 1) {
    throw new UnexpectedValueException('en.xml has no single _sys_txt_splash_slogan');
}

$sSlogan = $oDb->getOne("SELECT `s`.`String` FROM `sys_localization_strings` AS `s`
    INNER JOIN `sys_localization_keys` AS `k` ON `k`.`ID` = `s`.`IDKey`
    INNER JOIN `sys_localization_languages` AS `l` ON `l`.`ID` = `s`.`IDLanguage`
    WHERE `k`.`Key` = '_sys_txt_splash_slogan' AND `l`.`Name` = 'en'");
if ($sSlogan !== false && $sSlogan !== null && trim($sSlogan) !== trim((string)$aNodes[0])) {
    return;
}

foreach (['sys_site_splash_code', 'sys_site_splash_code_web', 'sys_site_splash_code_ios', 'sys_site_splash_code_android'] as $sOption) {
    $oDb->query($oDb->prepare("UPDATE `sys_options` SET `value` = REPLACE(`value`, ?, ?) WHERE `name` = ? AND `value` LIKE ?",
        $sOld, $sNew, $sOption, '%' . $sOld . '%'));
}
