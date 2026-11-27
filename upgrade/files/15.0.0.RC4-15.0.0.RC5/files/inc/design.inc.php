<?php defined('BX_DOL') or defined('BX_DOL_INSTALL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCoreFunctions UNA Core Functions
 * @{
 */

/**
 * design box with content only - no borders, no background, no caption
 * @see DesignBoxContent
 */
define('BX_DB_CONTENT_ONLY', 0);

/**
 * default design box with content, borders and caption
 * @see DesignBoxContent
 */
define('BX_DB_DEF', 1);

/**
 * just empty design box, without anything
 * @see DesignBoxContent
 */
define('BX_DB_EMPTY', 2);

/**
 * design box with content, like BX_DB_DEF but without caption
 * @see DesignBoxContent
 */
define('BX_DB_NO_CAPTION', 3);

/**
 * design box with content only wrapped with default padding - no borders, no background, no caption
 * it can be used to just wrap content with default padding
 * @see DesignBoxContent
 */
define('BX_DB_PADDING_CONTENT_ONLY', 10);

/**
 * default design box with content wrapped with default padding, borders and caption
 * @see DesignBoxContent
 */
define('BX_DB_PADDING_DEF', 11);

/**
 * design box with content wrapped with default padding, like BX_DB_DEF but without caption
 * @see DesignBoxContent
 */
define('BX_DB_PADDING_NO_CAPTION', 13);

/*
 * Menu template IDs for block submenu
 */
define('BX_DB_MENU_TEMPLATE_TABS', 25);
define('BX_DB_MENU_TEMPLATE_POPUP', 26);

define('BX_DB_HIDDEN_PHONE', 1);
define('BX_DB_HIDDEN_TABLET', 2);
define('BX_DB_HIDDEN_DESKTOP', 3);
define('BX_DB_HIDDEN_MOBILE', 4);

define('BX_FORMAT_DATE', 'sys_format_date'); ///< date format identifier for use in @see bx_time_js function
define('BX_FORMAT_TIME', 'sys_format_time'); ///< time format identifier for use in @see bx_time_js function
define('BX_FORMAT_DATE_TIME', 'sys_format_datetime'); ///< datetime format identifier for use in @see bx_time_js function

/*
 * Menu template IDs for page submenus
 */
define('BX_MENU_TEMPLATE_SUBMENU', 8);
define('BX_MENU_TEMPLATE_SUBMENU_MORE_AUTO', 18);

/*
 * Menu template IDs for Custom menu
 */
define('BX_MENU_TEMPLATE_CUSTOM_HOR', 15);
define('BX_MENU_TEMPLATE_CUSTOM_VER', 20);

/*
 * Menu template ID for tiles (menu_tiles.html)
 */
define('BX_MENU_TEMPLATE_TILES', 37);

/**
 * Display "design box" HTML code
 *
 * @see BxBaseFunctions::DesignBoxContent
 *
 * @see BX_DB_CONTENT_ONLY
 * @see BX_DB_DEF
 * @see BX_DB_EMPTY
 * @see BX_DB_NO_CAPTION
 * @see BX_DB_PADDING_CONTENT_ONLY
 * @see BX_DB_PADDING_DEF
 * @see BX_DB_PADDING_NO_CAPTION
 */
function DesignBoxContent ($sTitle, $sContent, $iTemplateNum = BX_DB_DEF, $mixedMenu = false)
{
    return BxTemplFunctions::getInstance()->designBoxContent ($sTitle, $sContent, $iTemplateNum, $mixedMenu);
}

/**
 * Use this function in pages if you want to not cache it.
 **/
function send_headers_page_changed()
{
    $now = gmdate('D, d M Y H:i:s') . ' GMT';

    header("Expires: $now");
    header("Last-Modified: $now");
    header("Cache-Control: no-cache, must-revalidate");
    header("Pragma: no-cache");
}

function MsgBox($sText, $iTimer = 0)
{
    return BxTemplFunctions::getInstance()->msgBox($sText, $iTimer);
}

function PopupBox($sName, $sTitle, $sContent, $isHiddenByDefault = false)
{
    return BxTemplFunctions::getInstance()->popupBox($sName, $sTitle, $sContent, $isHiddenByDefault);
}

function getVersionComment()
{
    $aVer = explode('.', bx_get_ver());

    // version output made for debug possibilities.
    // randomizing made for security issues. do not change it...
    $aVerR[0] = $aVer[0];
    $aVerR[1] = rand( 0, 100 );
    $aVerR[2] = $aVer[1];
    $aVerR[3] = rand( 0, 100 );
    $aVerR[4] = $aVer[2];

    return '<!-- ' . implode(' ', $aVerR) . ' -->';
}

function getSiteStatUser()
{
    $sqlQuery = "SELECT * FROM `sys_statistics` ORDER BY `order`";

    $aStat = BxDolDb::getInstance()->fromCache('sys_statistics', 'getAllWithKey', $sqlQuery, 'name');

    return "<pre>TODO: nice output\n" . print_r($aStat, true) . '</pre>';
}

/**
 * Output time wrapped in &lt;time&gt; tag in HTML.
 * Then time is autoformatted using JS upon page load, this is aumatically converted to user's timezone and
 * updated in realtime in case of short periods of 'from now' time format.
 *
 * This is just short version for:
 * @see BxTemplFunctions::timeForJs
 *
 * @param $iUnixTimestamp time as unixtimestamp
 * @param $sFormatIdentifier output format identifier
 *     @see BX_FORMAT_DATE
 *     @see BX_FORMAT_TIME
 *     @see BX_FORMAT_DATE_TIME
 * @param $bForceFormat force provided format and don't use "from now" time autoformat.
 */
function bx_time_js ($iUnixTimestamp, $sFormatIdentifier = BX_FORMAT_DATE, $bForceFormat = false)
{
    return BxTemplFunctions::getInstance()->timeForJs ($iUnixTimestamp, $sFormatIdentifier, $bForceFormat);
}

/**
 * Get UTC/GMT time string in ISO8601 date format from provided unix timestamp
 * @param $iUnixTimestamp - unix timestamp
 * @return ISO8601 formatted date/time string
 */
function bx_time_utc ($iUnixTimestamp)
{
    return gmdate(DATE_ISO8601, (int)$iUnixTimestamp);
}

$oZ = new BxDolAlerts('system', 'design_included', 0);
$oZ->alert();

/** @} */
