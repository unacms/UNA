<?php
/**
 * Add a missing language key for en or ru.
 *
 * The string is written into the module language XML (skipped when that
 * key is already there) and into the database, then the language cache
 * is recompiled. An existing translation is left unchanged.
 *
 * Usage:
 *   php scripts/add_lang_key.php <en|ru> <key> <translation>
 *   php scripts/add_lang_key.php <en|ru> <key> - <<'EOF'
 *   line one
 *   line two
 *   EOF
 *
 * A translation of "-" is read from stdin. A single trailing newline on
 * stdin is removed; newlines inside the text are kept.
 *
 * Run inside the php container:
 *   docker exec -i una-php-1 php /opt/una/scripts/add_lang_key.php en _sys_example "Hello"
 */

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "CLI only\n");
    exit(1);
}

$sLang = isset($argv[1]) ? strtolower($argv[1]) : '';
$sKey = isset($argv[2]) ? $argv[2] : '';
$bFromStdin = !isset($argv[3]) || $argv[3] === '-';

if (!in_array($sLang, array('en', 'ru'), true) || $sKey === '' || isset($argv[4])) {
    fwrite(STDERR, usage());
    exit(2);
}

if (strpbrk($sKey, "\r\n") !== false) {
    fwrite(STDERR, "Key must be a single line\n");
    exit(2);
}

if ($bFromStdin) {
    $sTranslation = stream_get_contents(STDIN);
    if ($sTranslation === false)
        $sTranslation = '';
    if (substr($sTranslation, -2) === "\r\n")
        $sTranslation = substr($sTranslation, 0, -2);
    else if (substr($sTranslation, -1) === "\n")
        $sTranslation = substr($sTranslation, 0, -1);
}
else {
    $sTranslation = $argv[3];
}

if ($sTranslation === '') {
    fwrite(STDERR, "Translation is empty\n");
    exit(2);
}

if (function_exists('mb_check_encoding') && !mb_check_encoding($sTranslation, 'UTF-8')) {
    fwrite(STDERR, "Translation is not valid UTF-8\n");
    exit(2);
}

$sRoot = dirname(__DIR__) . '/';
$aModules = loadModules($sRoot);
$aLangModules = loadLanguageModules($sRoot);

$aModule = findModuleByExistingKey($sRoot, $sKey, $aModules);
if (!$aModule)
    $aModule = inferModule($sKey, $aModules);

$sFile = resolveLangFile($sRoot, $sLang, $aModule, $aLangModules);
$sRel = ltrim(str_replace('\\', '/', substr($sFile, strlen($sRoot))), '/');

$sExisting = is_file($sFile) ? readLangString($sFile, $sKey) : null;
if ($sExisting !== null) {
    echo "xml: already present in $sRel\n";
    if ($sExisting !== $sTranslation)
        echo "kept the translation already in the language file\n";
    $sStore = $sExisting;
}
else {
    if (!writeLangString($sFile, $sLang, $sKey, $sTranslation)) {
        fwrite(STDERR, "Failed to write $sRel\n");
        exit(1);
    }
    echo "xml: added to $sRel\n";
    $sStore = $sTranslation;
}

if (dbAddMissing($sLang, $sKey, $sStore, $aModule['language_category']) === false)
    exit(1);

exit(0);

function usage()
{
    return <<<TXT
Usage: php add_lang_key.php <en|ru> <key> <translation>
       php add_lang_key.php <en|ru> <key> -    (translation from stdin, may span lines)

Adds the key only when that language does not already have it.

TXT;
}

function loadModules($sRoot)
{
    $a = array(
        'system' => array(
            'name' => 'system',
            'home_dir' => 'system/',
            'language_category' => 'System',
        ),
    );

    foreach (glob($sRoot . 'modules/*/*/install/config.php') as $sConfig) {
        $s = file_get_contents($sConfig);
        if ($s === false)
            continue;

        $sName = configValue($s, 'name');
        $sHome = configValue($s, 'home_dir');
        if ($sName === null || $sHome === null || $sName === '')
            continue;

        $sCategory = configValue($s, 'language_category');
        if ($sCategory === null || $sCategory === '')
            $sCategory = $sName;

        $a[$sName] = array(
            'name' => $sName,
            'home_dir' => rtrim($sHome, '/') . '/',
            'language_category' => $sCategory,
        );
    }

    return $a;
}

function loadLanguageModules($sRoot)
{
    $a = array(
        'en' => array('home_dir' => 'boonex/english/'),
        'ru' => array('home_dir' => 'boonex/russian/'),
    );

    foreach (glob($sRoot . 'modules/*/*/install/config.php') as $sConfig) {
        $s = file_get_contents($sConfig);
        if ($s === false)
            continue;

        $sUri = configValue($s, 'home_uri');
        $sHome = configValue($s, 'home_dir');
        if (($sUri !== 'en' && $sUri !== 'ru') || $sHome === null)
            continue;

        $a[$sUri] = array('home_dir' => rtrim($sHome, '/') . '/');
    }

    return $a;
}

function configValue($sSource, $sKey)
{
    $sPattern = '/[\'"]' . preg_quote($sKey, '/') . '[\'"]\s*=>\s*[\'"]([^\'"]*)[\'"]/';
    if (!preg_match($sPattern, $sSource, $aMatch))
        return null;
    return $aMatch[1];
}

function findModuleByExistingKey($sRoot, $sKey, $aModules)
{
    $aFound = array();
    $aFiles = array_merge(
        glob($sRoot . 'modules/*/*/install/langs/*.xml') ?: array(),
        glob($sRoot . 'modules/*/*/data/langs/*/*.xml') ?: array()
    );

    foreach ($aFiles as $sFile) {
        if (!fileHasKey($sFile, $sKey))
            continue;

        $sNorm = str_replace('\\', '/', $sFile);
        $aModule = null;

        if (preg_match('#/data/langs/([^/]+)/[^/]+\.xml$#', $sNorm, $aMatch) && isset($aModules[$aMatch[1]]))
            $aModule = $aModules[$aMatch[1]];
        else if (preg_match('#/modules/(.+)/install/langs/[^/]+\.xml$#', $sNorm, $aMatch)) {
            $sHome = $aMatch[1] . '/';
            foreach ($aModules as $aCandidate) {
                if ($aCandidate['home_dir'] === $sHome) {
                    $aModule = $aCandidate;
                    break;
                }
            }
        }

        if ($aModule)
            $aFound[$aModule['name']] = $aModule;
    }

    if (!$aFound)
        return null;

    if (isset($aFound['system']) && count($aFound) > 1)
        unset($aFound['system']);

    return reset($aFound);
}

function inferModule($sKey, $aModules)
{
    $sBare = ltrim($sKey, '_');
    $aNames = array_keys($aModules);
    usort($aNames, function ($sA, $sB) {
        return strlen($sB) - strlen($sA);
    });

    foreach ($aNames as $sName) {
        if ($sName === 'system')
            continue;
        if ($sBare === $sName || strpos($sBare, $sName . '_') === 0)
            return $aModules[$sName];
    }

    return $aModules['system'];
}

function resolveLangFile($sRoot, $sLang, $aModule, $aLangModules)
{
    $sPack = $sRoot . 'modules/' . $aLangModules[$sLang]['home_dir'] . 'data/langs/' . $aModule['name'] . '/' . $sLang . '.xml';
    if (is_file($sPack))
        return $sPack;

    if ($aModule['name'] !== 'system') {
        $sInstall = $sRoot . 'modules/' . $aModule['home_dir'] . 'install/langs/' . $sLang . '.xml';
        if (is_file($sInstall) || $sLang === 'en')
            return $sInstall;
    }

    return $sPack;
}

function fileHasKey($sPath, $sKey)
{
    return readLangString($sPath, $sKey) !== null;
}

function readLangString($sPath, $sKey)
{
    $s = @file_get_contents($sPath);
    if ($s === false)
        return null;

    $aVariants = array_unique(array($sKey, htmlspecialchars($sKey, ENT_QUOTES | ENT_XML1, 'UTF-8')));
    foreach ($aVariants as $sVariant) {
        $sPattern = '/<string\b[^>]*\bname=(["\'])' . preg_quote($sVariant, '/') . '\\1[^>]*>(.*?)<\/string>/s';
        if (!preg_match($sPattern, $s, $aMatch))
            continue;

        $sInner = $aMatch[2];
        if (preg_match('/^\s*<!\[CDATA\[(.*)\]\]>\s*$/s', $sInner, $aCdata))
            return str_replace(']]]]><![CDATA[>', ']]>', $aCdata[1]);

        return html_entity_decode($sInner, ENT_QUOTES | ENT_XML1, 'UTF-8');
    }

    return null;
}

function writeLangString($sFile, $sLang, $sKey, $sTranslation)
{
    $aMeta = array(
        'en' => array('flag' => 'gb', 'title' => 'English'),
        'ru' => array('flag' => 'ru', 'title' => 'Russian'),
    );

    $sNl = "\n";
    if (is_file($sFile)) {
        $sXml = file_get_contents($sFile);
        if ($sXml === false)
            return false;
        if (strpos($sXml, "\r\n") !== false)
            $sNl = "\r\n";
    }
    else {
        $sDir = dirname($sFile);
        if (!is_dir($sDir) && !mkdir($sDir, 0775, true))
            return false;

        $sXml = '<?xml version="1.0" encoding="utf-8"?>' . $sNl
            . '<resources name="' . $sLang . '" flag="' . $aMeta[$sLang]['flag'] . '" title="' . $aMeta[$sLang]['title'] . '">' . $sNl
            . '</resources>' . $sNl;
    }

    $iPos = insertionOffset($sXml, $sKey);
    if ($iPos === false)
        return false;

    $sIndent = indentAt($sXml, $iPos);
    $sLine = $sIndent . '<string name="' . htmlspecialchars($sKey, ENT_QUOTES | ENT_XML1, 'UTF-8') . '"><![CDATA[' . cdata($sTranslation) . ']]></string>' . $sNl;
    if ($iPos > 0 && $sXml[$iPos - 1] !== "\n")
        $sLine = $sNl . $sLine;

    $sXml = substr($sXml, 0, $iPos) . $sLine . substr($sXml, $iPos);
    return file_put_contents($sFile, $sXml, LOCK_EX) !== false;
}

/**
 * Byte offset where $sKey should be inserted: after the closest earlier
 * sibling, or before </resources> when nothing shares a meaningful prefix.
 * Sibling groups stay intact, so a new key lands beside a family rather
 * than between two keys that belong together.
 */
function insertionOffset($sXml, $sKey)
{
    $iFallback = strrpos($sXml, '</resources>');
    if ($iFallback === false)
        return false;

    $aEntries = langStringEntries($sXml);
    if (!$aEntries)
        return $iFallback;

    $iBest = 0;
    foreach ($aEntries as $aEntry) {
        $iScore = commonNonEmptySegments($sKey, $aEntry['name']);
        if ($iScore > $iBest)
            $iBest = $iScore;
    }
    if ($iBest < 2)
        return $iFallback;

    $aClose = array();
    foreach ($aEntries as $i => $aEntry) {
        if (commonNonEmptySegments($sKey, $aEntry['name']) === $iBest)
            $aClose[$i] = $aEntry;
    }

    $iPred = null;
    $sPredName = null;
    foreach ($aClose as $i => $aEntry) {
        if (strcmp($aEntry['name'], $sKey) < 0 && ($sPredName === null || strcmp($aEntry['name'], $sPredName) > 0)) {
            $iPred = $i;
            $sPredName = $aEntry['name'];
        }
    }
    if ($iPred !== null)
        return clusterEdge($aEntries, $iPred, $iBest, false);

    $iSucc = null;
    $sSuccName = null;
    foreach ($aClose as $i => $aEntry) {
        if (strcmp($aEntry['name'], $sKey) > 0 && ($sSuccName === null || strcmp($aEntry['name'], $sSuccName) < 0)) {
            $iSucc = $i;
            $sSuccName = $aEntry['name'];
        }
    }
    if ($iSucc !== null)
        return clusterEdge($aEntries, $iSucc, $iBest, true);

    return $iFallback;
}

function clusterEdge($aEntries, $iAnchor, $iMinScore, $bStart)
{
    $sAnchor = $aEntries[$iAnchor]['name'];
    $iEdge = $iAnchor;

    if ($bStart) {
        for ($i = $iAnchor - 1; $i >= 0; $i--) {
            if (commonNonEmptySegments($sAnchor, $aEntries[$i]['name']) <= $iMinScore)
                break;
            $iEdge = $i;
        }
        return $aEntries[$iEdge]['start'];
    }

    $iCount = count($aEntries);
    for ($i = $iAnchor + 1; $i < $iCount; $i++) {
        if (commonNonEmptySegments($sAnchor, $aEntries[$i]['name']) <= $iMinScore)
            break;
        $iEdge = $i;
    }
    return $aEntries[$iEdge]['end'];
}

function langStringEntries($sXml)
{
    $aEntries = array();
    $sPattern = '/^([ \t]*)<string\b[^>]*\bname=(["\'])(.*?)\2[^>]*>.*?<\/string>[ \t]*(?:\r?\n)?/ms';
    if (!preg_match_all($sPattern, $sXml, $aMatches, PREG_OFFSET_CAPTURE))
        return $aEntries;

    foreach ($aMatches[0] as $i => $aFull) {
        $aEntries[] = array(
            'name' => html_entity_decode($aMatches[3][$i][0], ENT_QUOTES | ENT_XML1, 'UTF-8'),
            'indent' => $aMatches[1][$i][0],
            'start' => $aFull[1],
            'end' => $aFull[1] + strlen($aFull[0]),
        );
    }
    return $aEntries;
}

function commonNonEmptySegments($sA, $sB)
{
    $aA = explode('_', $sA);
    $aB = explode('_', $sB);
    $n = min(count($aA), count($aB));
    $iNonEmpty = 0;
    for ($i = 0; $i < $n; $i++) {
        if ($aA[$i] !== $aB[$i])
            break;
        if ($aA[$i] !== '')
            $iNonEmpty++;
    }
    return $iNonEmpty;
}

function indentAt($sXml, $iPos)
{
    $aEntries = langStringEntries($sXml);
    $sIndent = '    ';
    foreach ($aEntries as $aEntry) {
        if ($aEntry['start'] <= $iPos)
            $sIndent = $aEntry['indent'];
        if ($aEntry['start'] >= $iPos)
            return $aEntry['indent'] !== '' ? $aEntry['indent'] : $sIndent;
    }
    return $sIndent;
}

function cdata($s)
{
    return str_replace(']]>', ']]]]><![CDATA[>', $s);
}

function dbAddMissing($sLang, $sKey, $sTranslation, $sCategory)
{
    bootUna();

    $oDb = BxDolDb::getInstance();
    $aLang = $oDb->getRow($oDb->prepare("SELECT `ID` AS `id` FROM `sys_localization_languages` WHERE `Name` = ? LIMIT 1", $sLang));
    if (!$aLang) {
        fwrite(STDERR, "Language '$sLang' is not installed in the database\n");
        return false;
    }
    $iLangId = (int)$aLang['id'];

    $aKey = $oDb->getRow($oDb->prepare("SELECT `ID` AS `id` FROM `sys_localization_keys` WHERE `Key` = ? LIMIT 1", $sKey));
    if (!$aKey) {
        $iCategoryId = categoryId($oDb, $sCategory);
        if (!$iCategoryId) {
            fwrite(STDERR, "Could not resolve language category '$sCategory'\n");
            return false;
        }

        $iInserted = (int)$oDb->query($oDb->prepare(
            "INSERT INTO `sys_localization_keys` (`IDCategory`, `Key`) VALUES (?, ?)",
            $iCategoryId,
            $sKey
        ));
        if ($iInserted <= 0) {
            fwrite(STDERR, "Could not insert language key\n");
            return false;
        }
        $iKeyId = (int)$oDb->lastId();
        echo "db: created key $iKeyId in '$sCategory'\n";
    }
    else {
        $iKeyId = (int)$aKey['id'];
    }

    $aString = $oDb->getRow($oDb->prepare(
        "SELECT `IDKey` AS `id` FROM `sys_localization_strings` WHERE `IDKey` = ? AND `IDLanguage` = ? LIMIT 1",
        $iKeyId,
        $iLangId
    ));
    if ($aString) {
        echo "db: already present for $sLang\n";
        return true;
    }

    $iInserted = (int)$oDb->query($oDb->prepare(
        "INSERT INTO `sys_localization_strings` (`IDKey`, `IDLanguage`, `String`) VALUES (?, ?, ?)",
        $iKeyId,
        $iLangId,
        $sTranslation
    ));
    if ($iInserted <= 0) {
        fwrite(STDERR, "Could not insert translation\n");
        return false;
    }

    bx_import('BxDolStudioLanguagesUtils');
    BxDolLanguages::getInstance();
    if (!BxDolStudioLanguagesUtils::getInstance()->compileLanguage($iLangId, true)) {
        fwrite(STDERR, "Translation stored, but the language cache was not recompiled\n");
        return false;
    }

    echo "db: added translation for $sLang and recompiled\n";
    return true;
}

function categoryId($oDb, $sCategory)
{
    $aCategory = $oDb->getRow($oDb->prepare(
        "SELECT `ID` AS `id` FROM `sys_localization_categories` WHERE `Name` = ? LIMIT 1",
        $sCategory
    ));
    if ($aCategory)
        return (int)$aCategory['id'];

    $iInserted = (int)$oDb->query($oDb->prepare(
        "INSERT INTO `sys_localization_categories` (`Name`) VALUES (?)",
        $sCategory
    ));
    if ($iInserted <= 0)
        return 0;

    return (int)$oDb->lastId();
}

function bootUna()
{
    $GLOBALS['bx_profiler_disable'] = true;
    if (!defined('BX_DOL_CRON_EXECUTE'))
        define('BX_DOL_CRON_EXECUTE', '1');

    $_ENV['UNA_SKIP_REDIRECT'] = '1';
    $_ENV['UNA_SKIP_MINIMAL_REQUIREMENTS'] = '1';
    $_ENV['UNA_SKIP_INSTALL_FOLDER_CHECK'] = '1';

    if (empty($_SERVER['HTTP_HOST'])) {
        $_SERVER['HTTP_HOST'] = 'hihi.com';
        $_SERVER['REQUEST_URI'] = '/una/';
        $_SERVER['SERVER_NAME'] = 'hihi.com';
        $_SERVER['REMOTE_ADDR'] = '127.0.0.1';
    }

    require_once dirname(__DIR__) . '/inc/header.inc.php';
    require_once BX_DIRECTORY_PATH_INC . 'design.inc.php';
}
