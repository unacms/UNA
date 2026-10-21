<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * Railway: language strings that modules gained since the site was installed.
 * Runs from entrypoint.sh on every container start. A deploy brings new code over an existing
 * database, and new language keys reach the database only through install or an upgrade pack,
 * so a key added in a PR would show as its raw name (`_bx_..._txt_...`). This adds every key
 * that an installed module's language file has and the database lacks, for every installed
 * language, then recompiles that language. Existing strings are never changed, so translations
 * edited in Studio stay. Studio's "restore" (BxDolStudioLanguagesUtils::restoreLanguage) is not
 * used: it deletes and re-adds a module's strings, which would drop those edits.
 */

$_SERVER['HTTP_HOST'] = getenv('RAILWAY_PUBLIC_DOMAIN') ?: 'localhost';
$_SERVER['REQUEST_URI'] = '/';
$_SERVER['SERVER_NAME'] = $_SERVER['HTTP_HOST'];
$GLOBALS['bx_profiler_disable'] = true;

// UNA_HEADER: another install's header, for running this outside the image.
require_once(getenv('UNA_HEADER') ?: '/var/www/html/inc/header.inc.php');

function languagesLog(string $s): void
{
    fwrite(STDERR, "[languages] $s\n");
}

/**
 * Language file of a module for a language: the language module's `data/langs/<module>/` copy
 * first, then the module's own `install/langs/` (the order Studio's restore uses).
 */
function languageFile(array $aLanguageModule, array $aLanguage, array $aModule): string
{
    $sPath = BX_DIRECTORY_PATH_MODULES . $aLanguageModule['path'] . 'data/langs/' . $aModule['name'] . '/' . $aLanguage['name'] . '.xml';
    if (file_exists($sPath))
        return $sPath;

    $sPath = BX_DIRECTORY_PATH_MODULES . $aModule['path'] . 'install/langs/' . $aLanguage['name'] . '.xml';
    return file_exists($sPath) ? $sPath : '';
}

$oUtils = BxDolStudioLanguagesUtils::getInstance();
$oQuery = new BxDolStudioLanguagesUtilsQuery();
$oModuleQuery = BxDolModuleQuery::getInstance();

$aLanguages = [];
$oQuery->getLanguagesBy(['type' => 'all'], $aLanguages, false);
$aModules = $oModuleQuery->getModules();

$iTotal = 0;
foreach ($aLanguages as $aLanguage) {
    $aLanguageModule = $oModuleQuery->getModuleByUri($aLanguage['name']);
    if (empty($aLanguageModule) || !is_array($aLanguageModule))
        continue;

    $aHave = [];
    $oQuery->getKeysBy(['type' => 'by_language_id_key_key', 'value' => (int)$aLanguage['id']], $aHave);

    $iAdded = 0;
    foreach ($aModules as $aModule) {
        if (empty($aModule['name']) || empty($aModule['lang_category']))
            continue;

        $sPath = languageFile($aLanguageModule, $aLanguage, $aModule);
        if ($sPath === '')
            continue;

        $aFile = $oUtils->readLanguage($sPath);
        if (empty($aFile['strings']) || ($aFile['name'] ?? '') !== $aLanguage['name'])
            continue;

        $aMissing = array_diff_key($aFile['strings'], $aHave);
        unset($aMissing['']);
        if (!$aMissing)
            continue;

        $aCategory = [];
        $oQuery->getCategoriesBy(['type' => 'by_name', 'value' => $aModule['lang_category']], $aCategory, false);
        $iCategoryId = !empty($aCategory['id']) ? (int)$aCategory['id'] : (int)$oUtils->addLanguageCategory($aModule['lang_category']);
        if (!$iCategoryId)
            continue;

        foreach ($aMissing as $sKey => $sValue)
            if ($oUtils->addLanguageString($sKey, $sValue, (int)$aLanguage['id'], $iCategoryId, false))
                $iAdded++;
    }

    if ($iAdded) {
        $oUtils->compileLanguage((int)$aLanguage['id']);
        languagesLog($aLanguage['name'] . ': added ' . $iAdded . ' missing string(s)');
    }
    $iTotal += $iAdded;
}

if (!$iTotal)
    languagesLog('nothing missing');
