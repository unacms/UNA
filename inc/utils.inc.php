<?php defined('BX_DOL') or defined('BX_DOL_INSTALL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCoreFunctions UNA Core Functions
 * @{
 */

define('BX_DOL_LINK_CLASS', 'bx-link'); ///< class to add to every link in user content

define('BX_DATA_TEXT', 1); ///< regular text data type
define('BX_DATA_TEXT_MULTILINE', 2); ///< regular multiline text data type
define('BX_DATA_INT', 3); ///< integer data type
define('BX_DATA_FLOAT', 4); ///< float data type
define('BX_DATA_CHECKBOX', 5); ///< checkbox data type, 'on' or empty value
define('BX_DATA_HTML', 6); ///< HTML data type
define('BX_DATA_DATE', 7); ///< date data type stored as yyyy-mm-dd
define('BX_DATA_DATETIME', 12); ///< date/time data type stored as yyyy-mm-dd hh:mm:ss
define('BX_DATA_DATE_TS', 8); ///< date data type stored as unixtimestamp
define('BX_DATA_DATETIME_TS', 9); ///< date/time data type stored as unixtimestamp
define('BX_DATA_DATE_TS_UTC', 10); ///< date data type stored as unixtimestamp from UTC time
define('BX_DATA_DATETIME_TS_UTC', 11); ///< date/time data type stored as unixtimestamp from UTC time
define('BX_DATA_DATE_UTC', 13); ///< date data type stored as yyyy-mm-dd in UTC time
define('BX_DATA_DATETIME_UTC', 14); ///< date/time data type stored as yyyy-mm-dd in UTC time

define('BX_SLASHES_AUTO', 0);
define('BX_SLASHES_ADD', 1);
define('BX_SLASHES_STRIP', 2);
define('BX_SLASHES_NO_ACTION', 3);

define('BX_ESCAPE_STR_AUTO', 0); ///< turn apostropes and quote signs into html special chars, for use in @see bx_js_string and @see bx_html_attribute
define('BX_ESCAPE_STR_APOS', 1); ///< escape apostrophes only, for js strings enclosed in apostrophes, for use in @see bx_js_string and @see bx_html_attribute
define('BX_ESCAPE_STR_QUOTE', 2); ///< escape quotes only, for js strings enclosed in quotes, for use in @see bx_js_string and @see bx_html_attribute

define('BX_EMAIL_SYSTEM', 0); ///< system email without unsubscribe link, like forgot password or email verification
define('BX_EMAIL_NOTIFY', 1); ///< notification message, with unsubscribe link
define('BX_EMAIL_MASS', 2); ///< mass email, one mesage send to manu users, with unsubscribe link

define('BX_MAINTENANCE_FILE', '.bx_maintenance'); ///< file name to use as mantenance mode indicator

define('BX_LOG_ERR', 1); ///< error log level format @see bx_log
define('BX_LOG_WARN', 2); ///< warning log level format @see bx_log
define('BX_LOG_INFO', 4); ///< info log level format @see bx_log
define('BX_LOG_DEBUG', 8); ///< debug log level format @see bx_log

/**
 * The following two functions are needed to convert title to uri and back.
 * It usefull when titles are used in URLs, like in Categories and Tags.
 */
function title2uri($sValue)
{
    return str_replace(
        array('&', '/', '\\', '"', '+'),
        array('[and]', '[slash]', '[backslash]', '[quote]', '[plus]'),
        $sValue
    );
}
function uri2title($sValue)
{
    return str_replace(
        array('[and]', '[slash]', '[backslash]', '[quote]', '[plus]'),
        array('&', '/', '\\', '"', '+'),
        $sValue
    );
}

/*
 * functions for limiting maximal text length
 */
function strmaxtextlen($sInput, $iMaxLen = 60, $sEllipsisSign = '&#8230;')
{
    $sTail = '';
    $s = trim(strip_tags($sInput));
    if (mb_strlen($s) > $iMaxLen) {
        $s = mb_substr($s, 0, $iMaxLen);
        $sTail = $sEllipsisSign;
    }
    return htmlspecialchars_adv($s) . $sTail;
}

function html2txt($content, $tags = "")
{
    while($content != strip_tags($content, $tags)) {
        $content = strip_tags($content, $tags);
    }

    return $content;
}

/**
 * Functions to process user input.
 * DON'T use to process data before passing to SQL query - use db prepare instead @see BxDolDb::prepare.
 * It is ok to use bx_process_input and then db prepare.
 * @param $mixedData data to process
 * @param $iDataType how to handle data, possible valies:
 *      @code
 *          BX_DATA_INT - integer value
 *          BX_DATA_FLOAT - float values
 *          BX_DATA_CHECKBOX - 'on' or empty string
 *          BX_DATA_TEXT - text data, single line (default)
 *          BX_DATA_TEXT_MULTILINE - text data, multiple lines
 *          BX_DATA_HTML - HTML data
 *          BX_DATA_DATE - date data type stored as yyyy-mm-dd
 *          BX_DATA_DATETIME - date/time data type stored as yyyy-mm-dd hh:mm:ss
 *          BX_DATA_DATE_TS' -  date data type stored as unixtimestamp
 *          BX_DATA_DATETIME_TS - date/time data type stored as unixtimestamp
 *          BX_DATA_DATE_TS_UTC - date data type stored as unixtimestamp from UTC time
 *          BX_DATA_DATETIME_TS_UTC - date/time data type stored as unixtimestamp from UTC time
 *      @endcode
 * @param $mixedParams optional parameters to pass for validation
 * @param $isCheckMagicQuotes deprecated
 * @return the filtered data, or FALSE if the filter fails.
 */
function bx_process_input ($mixedData, $iDataType = BX_DATA_TEXT, $mixedParams = false, $isCheckMagicQuotes = true)
{
    if (is_array($mixedData)) {
        foreach ($mixedData as $k => $v)
            $mixedData[$k] = bx_process_input($v, $iDataType, $mixedParams);
        return $mixedData;
    }

    switch ($iDataType) {
    case BX_DATA_INT:
        return filter_var(trim($mixedData), FILTER_VALIDATE_INT);
    case BX_DATA_FLOAT:
        return filter_var(trim($mixedData), FILTER_VALIDATE_FLOAT);
    case BX_DATA_CHECKBOX:
        return 'on' == trim($mixedData) ? 'on' : '';

    case BX_DATA_DATE:
        // maybe consider using strtotime
        $mixedData = trim($mixedData);
        if (!preg_match('/^\d{4}-\d{1,2}-\d{1,2}$/', $mixedData))
            return false;
        list($iYear, $iMonth, $iDay) = explode('-', $mixedData); // 1985-10-28
        $iDay   = intval($iDay);
        $iMonth = intval($iMonth);
        $iYear  = intval($iYear);
        return sprintf("%04d-%02d-%02d", $iYear, $iMonth, $iDay);
    case BX_DATA_DATETIME:
        // maybe consider using strtotime
        $mixedData = trim($mixedData);
        if (!preg_match('#(\d+)\-(\d+)\-(\d+)[\sT]{1}(\d+):(\d+):(\d+)#', $mixedData, $m) && !preg_match('#(\d+)\-(\d+)\-(\d+)[\sT]{1}(\d+):(\d+)#', $mixedData, $m))
            return bx_process_input ($mixedData, BX_DATA_DATE, $mixedParams, $isCheckMagicQuotes);
        $iDay   = intval($m[3]);
        $iMonth = intval($m[2]);
        $iYear  = intval($m[1]);
        $iH = intval($m[4]);
        $iM = intval($m[5]);
        $iS = isset($m[6]) ? intval($m[6]) : 0;
        return sprintf("%04d-%02d-%02d %02d:%02d:%02d", $iYear, $iMonth, $iDay, $iH, $iM, $iS); // 1985-10-28 00:59:35
    case BX_DATA_DATE_TS:
    case BX_DATA_DATE_TS_UTC:
        $mixedData = trim($mixedData);
        if (!preg_match('/^\d{4}-\d{1,2}-\d{1,2}$/', $mixedData))
            return false;
        list($iYear, $iMonth, $iDay) = explode('-', $mixedData);
        $iDay   = intval($iDay);
        $iMonth = intval($iMonth);
        $iYear  = intval($iYear);
        $sFunc = BX_DATA_DATE_TS_UTC == $iDataType ? 'gmmktime' : 'mktime';
        $iRet = $sFunc (0, 0, 0, $iMonth, $iDay, $iYear);
        return $iRet > 0 ? $iRet : false;
    case BX_DATA_DATETIME_TS:
    case BX_DATA_DATETIME_TS_UTC:
        if (!preg_match('#(\d+)\-(\d+)\-(\d+)[\s]{1}(\d+):(\d+):(\d+)[\s]{1}([+\-\d:Z]+)#', $mixedData, $m) && !preg_match('#(\d+)\-(\d+)\-(\d+)[\sT]{1}(\d+):(\d+):(\d+)#', $mixedData, $m) && !preg_match('#(\d+)\-(\d+)\-(\d+)[\sT]{1}(\d+):(\d+)#', $mixedData, $m))
            return bx_process_input ($mixedData, BX_DATA_DATETIME_TS == $iDataType ? BX_DATA_DATE_TS : BX_DATA_DATE_TS_UTC, $mixedParams, $isCheckMagicQuotes);
        $iDay   = $m[3];
        $iMonth = $m[2];
        $iYear  = $m[1];
        $iH = $m[4];
        $iM = $m[5];
        $iS = isset($m[6]) ? $m[6] : 0;        
        $iTimezoneOffset = 0;
        if (isset($m[7])) {
            $oTz = new DateTimeZone($m[7]);
            $oUtc = new DateTime(str_replace($m[7], '', $mixedData), new DateTimeZone('UTC'));
            if ($oTz && $oUtc)
                $iTimezoneOffset = $oTz->getOffset($oUtc);
        }
        $sFunc = BX_DATA_DATETIME_TS_UTC == $iDataType ? 'gmmktime' : 'mktime';
        $iRet = $sFunc ($iH, $iM, $iS, $iMonth, $iDay, $iYear) - $iTimezoneOffset;

        return $iRet > 0 ? $iRet : false;

    case BX_DATA_HTML:
        return clear_xss($mixedData);
    case BX_DATA_TEXT_MULTILINE:
        return nl2br(htmlspecialchars_adv($mixedData));
    case BX_DATA_TEXT:
    default:
        return $mixedData;
    }
}

/*
 * Functions to process user output.
 * Always use this function before output data which was entered by user before.
 * @param $mixedData string to process
 * @param $iDataType how to handle data, possible valies the same as in bx_process_input function, see bx_process_input.
 * @param $mixedParams optional parameters to pass for validation
 * @return the filtered data, or FALSE if the filter fails.
 */
function bx_process_output ($mixedData, $iDataType = BX_DATA_TEXT, $mixedParams = false)
{
    if (is_array($mixedData)) {
        foreach ($mixedData as $k => $v)
            $mixedData[$k] = bx_process_output($v, $iDataType, $mixedParams);
        return $mixedData;
    }

    switch ($iDataType) {
    case BX_DATA_INT:
        return filter_var($mixedData, FILTER_VALIDATE_INT);
    case BX_DATA_FLOAT:
        return filter_var($mixedData, FILTER_VALIDATE_FLOAT);
    case BX_DATA_CHECKBOX:
        return 'on' == trim($mixedData) ? 'on' : '';

    case BX_DATA_DATE:
    case BX_DATA_DATETIME:
        return $mixedData;
    case BX_DATA_DATE_UTC:
        if (!preg_match('/^(\d{4})-(\d{1,2})-(\d{1,2})$/', $mixedData, $m))
            return '';
        return sprintf("%04d-%02d-%02d 00:00:00Z", $m[1], $m[2], $m[3]);
        return $mixedData . "Z";
    case BX_DATA_DATETIME_UTC:
        return $mixedData . "Z";
    case BX_DATA_DATE_TS:
        return empty($mixedData) ? '' : date("Y-m-d", (int)$mixedData);
    case BX_DATA_DATE_TS_UTC:
        return empty($mixedData) ? '' : gmdate("Y-m-d", (int)$mixedData);
    case BX_DATA_DATETIME_TS:
        return empty($mixedData) ? '' : date("Y-m-d H:i", (int)$mixedData);
    case BX_DATA_DATETIME_TS_UTC:
        return empty($mixedData) ? '' : gmdate("Y-m-d H:i:s\Z", (int)$mixedData);

    case BX_DATA_HTML:
        $s = bx_linkify_html($mixedData, 'class="' . BX_DOL_LINK_CLASS . '"');

        // remove empty tags from html content: #4203, #4486, #4827, #4979
        $s = preg_replace('/<(div|p|blockquote|pre|section|article)(?:\s[^>]*)?'.'>((?:\s|<br\s*\/?'.'>)*)<\/\1>/i', '', $s);
        $s = preg_replace('/(<br\s*\/?'.'>\s*){2,}/i', '<br>', $s);
        return $mixedParams && is_array($mixedParams) && in_array('no_process_macro', $mixedParams) ? $s : bx_process_macros($s);
    case BX_DATA_TEXT_MULTILINE:
        $s = $mixedData;
        return $mixedParams && is_array($mixedParams) && in_array('no_process_macros', $mixedParams) ? $s : bx_process_macros($s);
    case BX_DATA_TEXT:
    default:
        $s = htmlspecialchars_adv($mixedData);
        return $mixedParams && is_array($mixedParams) && in_array('no_process_macros', $mixedParams) ? $s : bx_process_macros($s);
    }
}

function bx_is_macros_in_content (&$s) 
{
    return false === strpos($s, '{{~') ? false : true; 
}

/**
 * This function converts macros upon text output. 
 * Macros represents constructions like this:
 * @code
 * {{!module_name:function[param1, "param2"]}}
 * @endcode
 * For example, to display some content from module Posts:
 * @code
 * {{!bx_posts:get_search_result_unit[3]}}
 * @endcode
 * Only users which have "use macros" ACL action enabled can use this functionlity.
 *
 * @param $s text to process
 * @return modified or not modified text
 */
function bx_process_macros ($s)
{
    if (!bx_is_macros_in_content($s))
        return $s;

    $aCode = [];
    $c = 1;

    $s = preg_replace_callback(
        "/(<code>)(.*?)(<\/code>)/s",
        function ($aMatches) use (&$c, &$aCode) {
            $aCode[$c] = $aMatches[2];
            return $aMatches[1] . '___' . $c++ . '___' . $aMatches[3];
        },
        $s);

    $s = preg_replace_callback(
        "/{{\~(.*?)\~}}/",
        function ($aMatches) {
            return BxDolService::callMacro($aMatches[1]);
        },
        $s);

    $s = preg_replace_callback(
        "/(<code>)___(.*?)___(<\/code>)/s",
        function ($aMatches) use (&$aCode) {
            $sCode = isset($aCode[$aMatches[2]]) ? $aCode[$aMatches[2]] : 'n/a';
            return $aMatches[1] . $sCode . $aMatches[3];
        },
        $s);

    return $s;
}

/*
 * This function apply bx_process_input and then bx_process_output.
 * Use this function to output data immediately after receiving, without saving to database.
 * Patams are the same as bx_process_input function - @see bx_process_input
 */
function bx_process_pass ($mixedData, $iDataType = BX_DATA_TEXT, $mixedParams = false, $isCheckMagicQuotes = true)
{
    return bx_process_output(bx_process_input ($mixedData, $iDataType, $mixedParams, $isCheckMagicQuotes), $iDataType, $mixedParams);
}

/**
 * DEPRECATED
 * use bx_process_input + bx_process_output instead
 * --------
 * function for processing pass data
 *
 * This function cleans the GET/POST/COOKIE data if magic_quotes_gpc() is on
 * for data which should be outputed immediately after submit
 */
/*
function process_pass_data( $text, $strip_tags = 0 )
{
    if ( $strip_tags )
        $text = strip_tags($text);
    if ( !get_magic_quotes_gpc() )
        return $text;
    else
        return stripslashes($text);
}
*/

/*
 * function for output data from database into html
 */
function htmlspecialchars_adv( $string )
{
    return htmlspecialchars($string, ENT_COMPAT, 'UTF-8', false);
}

/**
 * Send mail to user by parsing email template
 */
function sendMailTemplate($sTemplateName, $iAccountId = 0, $iProfileId = 0, $aReplaceVars = array(), $iEmailType = BX_EMAIL_NOTIFY, $bAddToQueue = false)
{
    $oProfile = $iProfileId ? BxDolProfile::getInstance($iProfileId) : null;

    $oAccount = $iAccountId ? BxDolAccount::getInstance($iAccountId) : ($oProfile ? $oProfile->getAccountObject() : null);

    $oEmailTemplates = BxDolEmailTemplates::getInstance();

    if (!($oAccount || $oProfile) || !$oEmailTemplates)
        return false;

    $aTemplate = $oEmailTemplates->parseTemplate($sTemplateName, $aReplaceVars, $oAccount ? $oAccount->id() : 0, (int)$iProfileId);
    if (!$aTemplate)
        return false;

    return sendMail($oAccount->getEmail(), $aTemplate['Subject'], $aTemplate['Body'], 0, array(), $iEmailType, 'html', false, array(), $bAddToQueue);
}

/**
 * Send system email 
 */
function sendMailTemplateSystem($sTemplateName, $aReplaceVars = array(), $iEmailType = BX_EMAIL_SYSTEM, $bAddToQueue = false)
{
    $oEmailTemplates = BxDolEmailTemplates::getInstance();

    if (!$oEmailTemplates)
        return false;

    $aTemplate = $oEmailTemplates->parseTemplate($sTemplateName, $aReplaceVars);
    if (!$aTemplate)
        return false;

    return sendMail(getParam('site_email'), $aTemplate['Subject'], $aTemplate['Body'], 0, array(), $iEmailType, 'html', false, array(), $bAddToQueue);
}
/**
 * Send email function
 *
 * @param $mRecipientEmails - Email where email should be send, can be array, string with one email or comma separated
 * @param $sMailSubject - subject of the message
 * @param $sMailBody - Body of the message
 * @param $iRecipientID - ID of recipient profile
 * @param $aPlus - Array of additional information
 * @param $iEmailType - email message type: BX_EMAIL_SYSTEM, BX_EMAIL_NOTIFY or BX_EMAIL_MASS
 * @param $sEmailFlag - use 'html' for HTML email message
 * @param $isDisableAlert - disable alert
 * @param $aCustomHeaders - custom email headers
 * @param $bAddToQueue - add message to email queue
 * @return true if message was send or false otherwise
 */
function sendMail($mRecipientEmails, $sMailSubject, $sMailBody, $iRecipientID = 0, $aPlus = array(), $iEmailType = BX_EMAIL_NOTIFY, $sEmailFlag = 'html', $isDisableAlert = false, $aCustomHeaders = array(), $bAddToQueue = false)
{
    if (is_string($mRecipientEmails)){
        if(strpos($mRecipientEmails, ',') !== false){
            $mRecipientEmails = explode(',', $mRecipientEmails);
        }
        else{
            return _sendMail($mRecipientEmails, $sMailSubject, $sMailBody, $iRecipientID, $aPlus, $iEmailType, $sEmailFlag, $isDisableAlert, $aCustomHeaders, $bAddToQueue);
        }
    }
    
    if (is_array($mRecipientEmails)) {
        $bReturn = false;
        foreach($mRecipientEmails as $sRecipientEmail) {
            $sRecipientEmail = trim($sRecipientEmail);
            if (_sendMail($sRecipientEmail, $sMailSubject, $sMailBody, $iRecipientID, $aPlus, $iEmailType, $sEmailFlag, $isDisableAlert, $aCustomHeaders, $bAddToQueue))
                $bReturn = true;
        }
        return $bReturn;
    }
}

function _sendMail($sRecipientEmail, $sMailSubject, $sMailBody, $iRecipientID = 0, $aPlus = array(), $iEmailType = BX_EMAIL_NOTIFY, $sEmailFlag = 'html', $isDisableAlert = false, $aCustomHeaders = array(), $bAddToQueue = false)
{
    // make sure that recipient's email is valid and message isn't empty
    if (!$sMailBody || !$sRecipientEmail || preg_match('/\(2\)$/', $sRecipientEmail))
        return false;

    // get recipient account
    $oAccount = !$isDisableAlert ? BxDolAccount::getInstance($sRecipientEmail) : null;
    $aAccountInfo = $oAccount ? $oAccount->getInfo() : false;

    // don't send bulk emails if user didn't subscribed to site news or email is unconfirmed
    if ($aAccountInfo && BX_EMAIL_MASS == $iEmailType && (!$aAccountInfo['email_confirmed'] || !$aAccountInfo['receive_news']))
        return false;

    // don't send email notifications if user didn't subscribed to notifications or email is unconfirmed
    if ($aAccountInfo && BX_EMAIL_NOTIFY == $iEmailType && (!$aAccountInfo['email_confirmed'] || !$aAccountInfo['receive_updates']))
        return false;

    // decode HTML entities in the subj
    $sMailSubject = html_entity_decode($sMailSubject, ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML401, 'UTF-8');

    if($bAddToQueue && BxDolQueueEmail::getInstance()->add($sRecipientEmail, $sMailSubject, $sMailBody, $iRecipientID, $aPlus, $iEmailType, $sEmailFlag, $isDisableAlert, $aCustomHeaders))
        return true;

    // if profile id is provided - get profile's info
    $aRecipientInfo = false;
    if ($iRecipientID) {
        $oProfile = BxDolProfile::getInstance($iRecipientID);
        if ($oProfile)
            $aRecipientInfo = $oProfile->getInfo();
    }

    // get site vars
    $sEmailNotify = !$isDisableAlert ? getParam('site_email_notify') : $sRecipientEmail;
    $sSiteTitle = !$isDisableAlert ? getParam('site_title') : 'UNA ' . BX_DOL_VERSION;

    // add unsubscribe link
    if (!$isDisableAlert && empty($aPlus['unsubscribe'])) {
        $aPlus['unsubscribe'] = '';
        if ($oAccount && (BX_EMAIL_MASS == $iEmailType || BX_EMAIL_NOTIFY == $iEmailType))
            $aPlus['unsubscribe'] = ($sLink = $oAccount->getUnsubscribeLink($iEmailType)) ? '<a href="' . BX_DOL_URL_ROOT . $sLink . '">' . _t('_sys_et_txt_unsubscribe') . '</a>' : '';
    }

    // parse template
    if ($aPlus || $iRecipientID || $oAccount) {
        if(!is_array($aPlus))
            $aPlus = [];

        $oEmailTemplates = BxDolEmailTemplates::getInstance();
        $sMailSubject = $oEmailTemplates->parseContent($sMailSubject, $aPlus, !$iRecipientID && $oAccount ? $oAccount->id() : 0, $iRecipientID);
        $sMailBody = $oEmailTemplates->parseContent($sMailBody, $aPlus, !$iRecipientID && $oAccount ? $oAccount->id() : 0, $iRecipientID);
    }

    if(($sRootUrl = getParam('sys_api_url_root_email')) !== '') {
        if(substr(BX_DOL_URL_ROOT, -1) == '/' && substr($sRootUrl, -1) != '/')
            $sRootUrl .= '/';

        $sMailBody = str_replace(BX_DOL_URL_ROOT, $sRootUrl, $sMailBody);

        // restore URLs in images
        $sMailBody = str_replace([
            'src="' . $sRootUrl, 
            "src='" . $sRootUrl
        ], [
            'src="' . BX_DOL_URL_ROOT, 
            "src='" . BX_DOL_URL_ROOT
        ], $sMailBody);
    }

    // email message headers
    $sMailHeader = '';
    foreach ($aCustomHeaders as $sHeaderName => $sHeaderValue)
        $sMailHeader = "$sHeaderName: $sHeaderValue\r\n" . $sMailHeader;

    if (!isset($aCustomHeaders['From']))
        $sMailHeader = "From: =?UTF-8?B?" . base64_encode( $sSiteTitle ) . "?= <{$sEmailNotify}>";

    if (!isset($aCustomHeaders['MIME-Version']))
        $sMailHeader = "MIME-Version: 1.0\r\n" . $sMailHeader;

    $sMailParameters = isset($aCustomHeaders['Sender']) ? "-f{$aCustomHeaders['Sender']}" : "-f{$sEmailNotify}";

    if (isset($aCustomHeaders['Subject']))
        $sMailSubject = $aCustomHeaders['Subject'];

    // build data for alert handler
    $bResult = null;
    $aAlert = array(
        'email' => $sRecipientEmail,
        'subject' => $sMailSubject,
        'body' => $sMailBody,
        'header' => $sMailHeader,
        'params' => $sMailParameters,
        'recipient' => $aRecipientInfo,
        'email_type' => $iEmailType,
        'html' => 'html' == $sEmailFlag ? true : false,
        'custom_headers' => $aCustomHeaders,
        'override_result' => &$bResult,
    );
    
    /**
     * @hooks
     * @hookdef hook-system-check_send_mail 'system', 'check_send_mail' - hook for disabling mail sending 
     * - $unit_name - equals `system`
     * - $action - equals `check_send_mail` 
     * - $object_id - recipient profile id 
     * - $sender_id - not used 
     * - $extra_params - array of additional params with the following array keys:
     *      - `email` - [string] recipient email 
     *      - `subject` - [string] email subject 
     *      - `body` - [string] email body 
     *      - `header` - [string] email headers, headers are separated with double new line character
     *      - `params` - [string] parameters for php mail function 
     *      - `recipient` - [array] recipient info array
     *      - `email_type` - [int] email type, one of the following BX_EMAIL_SYSTEM, BX_EMAIL_NOTIFY, BX_EMAIL_MASS
     *      - `html` - [boolean] `true` if email content is HTML, if `false` then email content is text
     *      - `custom_headers` - [array] custom email headers array as key&value pairs
     *      - `override_result` - [boolean] override result of `sendMail` function, if `true` then mail sending should continue as usual, if `false` then mail sending should stop
     * @hook @ref hook-system-check_send_mail
     */
    bx_alert('system', 'check_send_mail', (isset($aRecipientInfo['ID']) ? $aRecipientInfo['ID'] : 0), '', $aAlert);
    
    if ($bResult !== null)
        return $bResult;

    // system alert
    if (!$isDisableAlert) {
        /**
         * @hooks
         * @hookdef hook-system-before_send_mail 'system', 'before_send_mail' - hook before mail sending
         * It's equivalent to @ref hook-system-check_send_mail 
         * @hook @ref hook-system-before_send_mail
         */
        bx_alert('system', 'before_send_mail', (isset($aRecipientInfo['ID']) ? $aRecipientInfo['ID'] : 0), '', $aAlert);
        if ($bResult !== null)
            return $bResult;
        unset($aAlert['override_result']);
    }

    // prepare HTML/Plain message
    if($sEmailFlag == 'html')
        $sMailHeader = "Content-type: text/html; charset=UTF-8\r\n" . $sMailHeader;
    else {
        $sMailHeader = "Content-type: text/plain; charset=UTF-8\r\n" . $sMailHeader;
        $sMailBody = html2txt($sMailBody);
    }

    // encode subject
    if (0 !== strncasecmp($sMailSubject, '=?UTF-8?B?', 10))
        $sMailSubject = '=?UTF-8?B?' . base64_encode($sMailSubject) . '?=';

    // send mail or put it into queue
    $bResult = mail($sRecipientEmail, $sMailSubject, $sMailBody, $sMailHeader, $sMailParameters);

    // system alert
    if (!$isDisableAlert) {
        /**
         * @hooks
         * @hookdef hook-system-send_mail 'system', 'send_mail' - hook when mail was sent
         * It's equivalent to @ref hook-system-check_send_mail 
         * except `override_result` parameter in $extra_params is missing
         * @hook @ref hook-system-send_mail
         */
        bx_alert('system', 'send_mail', (isset($aRecipientInfo['ID']) ? $aRecipientInfo['ID'] : 0), '', $aAlert);
    }

    return $bResult;
}

/*
 * Getting an array with Templates' Names
 */
function get_templates_array($bEnabledOnly = true, $bShortInfo = true)
{
    $oDb = BxDolDb::getInstance();

    $sWhereAddon = $bEnabledOnly ? " AND `enabled`='1'" : "";

    if($bShortInfo)
        return $oDb->getPairs("SELECT `uri`, `title` FROM `sys_modules` WHERE 1 AND `type`='" . BX_DOL_MODULE_TYPE_TEMPLATE . "'" . $sWhereAddon, "uri", "title");
    else
        return $oDb->getAllWithKey("SELECT * FROM `sys_modules` WHERE 1 AND `type`='" . BX_DOL_MODULE_TYPE_TEMPLATE . "'" . $sWhereAddon, "uri");
}

function bx_get_image_exif_and_size($oStorage, $oTranscoder, $iContentId){
    $sData = '';
    $sExif = '';
    $aExif = false;
    $aPhoto = $oStorage->getFile($iContentId);
    if ($oTranscoder->isMimeTypeSupported($aPhoto['mime_type'])) {
        $oImageReize = BxDolImageResize::getInstance();
        
        $a = $oImageReize->getImageSize($oTranscoder->getFileUrl($iContentId));
        $sData = isset($a['w']) && isset($a['h']) ? $a['w'] . 'x' . $a['h'] : '';
        
        if ($aExif = $oImageReize->getExifInfo($oStorage->getFileUrlById($iContentId))) {
            $a = array('Make', 'Model', 'FocalLength', 'ShutterSpeedValue', 'ExposureTime', 'ISOSpeedRatings', 'Orientation', 'Artist', 'Copyright', 'Flash', 'WhiteBalance', 'DateTimeOriginal', 'DateTimeDigitized', 'ExifVersion', 'COMPUTED', 'GPSLatitudeRef', 'GPSLatitude', 'GPSLongitudeRef', 'GPSLongitude', 'GPSAltitudeRef', 'GPSAltitude', 'GPSTimeStamp', 'GPSImgDirectionRef', 'GPSImgDirection', 'GPSDateStamp');
            $aExifFiltered = array();
            foreach ($a as $sIndex)
                if (isset($aExif[$sIndex]))
                    $aExifFiltered[$sIndex] = $aExif[$sIndex];
            $sExif = serialize($aExifFiltered);
        }
    }
    return array('exif' => $sExif, 'size' => $sData);
}

function bx_get_svg_image_size($sUrl)
{
    $iWidth = $iHeight = 0;

    $sContent = '';
    if (defined('BX_DOL_URL_ROOT') && defined('BX_DIRECTORY_PATH_ROOT') && BX_DOL_URL_ROOT != '' && 0 === strpos($sUrl, BX_DOL_URL_ROOT)) {
        $sRel = substr($sUrl, strlen(BX_DOL_URL_ROOT));
        if (false !== ($iQ = strpos($sRel, '?')))
            $sRel = substr($sRel, 0, $iQ);
        if (false !== ($iH = strpos($sRel, '#')))
            $sRel = substr($sRel, 0, $iH);
        $sRel = rawurldecode(str_replace('\\', '/', $sRel));
        if ('' !== $sRel && false === strpos($sRel, '..')) {
            $sLocal = BX_DIRECTORY_PATH_ROOT . $sRel;
            if (is_file($sLocal) && is_readable($sLocal))
                $sContent = file_get_contents($sLocal);
        }
    }
    else {
        $sContent = bx_file_get_contents($sUrl);
    }

    if(empty($sContent))
        return [$iWidth, $iHeight];

    $aAttributes = BxDolXmlParser::getInstance()->getAttributes($sContent, 'SVG', 0);
    if(isset($aAttributes['VIEWBOX'])) {
        $aViewBox = explode(' ', $aAttributes['VIEWBOX']);
        if(!empty($aViewBox) && is_array($aViewBox) && count($aViewBox) == 4) {
            $iWidth = (float)$aViewBox[2];
            $iHeight = (float)$aViewBox[3];
        }
    }

    if(!$iWidth && isset($aAttributes['WIDTH']))
        $iWidth = $this->_str2px($aAttributes['WIDTH']);

    if(!$iHeight && isset($aAttributes['HEIGHT']))
        $iHeight = $this->_str2px($aAttributes['HEIGHT']);

    return [$iWidth, $iHeight];
}

function extFileExists( $sFileSrc )
{
    return (file_exists( $sFileSrc ) && is_file( $sFileSrc )) ? true : false;
}

function getVisitorIP()
{
    $ip = "0.0.0.0";
    if (isset($_SERVER['HTTP_X_FORWARDED_FOR']) && !empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
    } elseif (isset($_SERVER['HTTP_CLIENT_IP']) && !empty($_SERVER['HTTP_CLIENT_IP'])) {
        $ip = $_SERVER['HTTP_CLIENT_IP'];
    } elseif (!isset( $_SERVER['HTTP_X_FORWARDED_FOR']) || empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        if (!isset( $_SERVER['HTTP_CLIENT_IP']) && empty($_SERVER['HTTP_CLIENT_IP']) && isset($_SERVER['REMOTE_ADDR']))
            $ip = $_SERVER['REMOTE_ADDR'];
    }

    return filter_var($ip, FILTER_VALIDATE_IP) ? $ip : "0.0.0.0";
}

function genFlag($sLang = '', $oTemplate = null)
{
    if (!$oTemplate)
        $oTemplate = BxDolTemplate::getInstance();
    $oTemplate->addCss(BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'flag-icons/css/|flag-icons.min.css');
    $sFlag = BxDolLanguages::getInstance()->getLangFlag($sLang);
    return '<span title="' . $sFlag . '" class="fi fi-' . $sFlag . '"></span>';
}

// print debug information ( e.g. arrays )
function echoDbg( $what, $desc = '' )
{
    if ( $desc )
        echo "<b>$desc:</b> ";
    echo "<pre>";
        print_r( $what );
    echo "</pre>\n";
}

function echoDbgLog($mWhat, $sDesc = 'unused', $sFileName = 'unused')
{
    bx_log('sys_debug', $mWhat, BX_LOG_DEBUG);
}

function bx_is_dbg()
{
    return (defined('BX_DBG_COOKIE') && !empty($_COOKIE[BX_DBG_COOKIE])) || (defined('BX_DBG_PROFILES') && in_array(bx_get_logged_profile_id(), BX_DBG_PROFILES));
}

function dbgTiming($sStartMicrotime)
{
    $i1 = explode(' ', microtime ());
    $i2 = explode(' ', $sStartMicrotime);
    $iTime = ($i1[0]+$i1[1]) - ($i2[0]+$i2[1]);
    return round($iTime, 6) . ' sec';
}

function echoJson($a)
{
	header('Content-Type: application/json; charset=utf-8');

	echo json_encode($a);
}

function clear_xss($val)
{
    // HTML Purifier plugin
    global $logged;
    global $oHtmlPurifier;

    $bAdmin = isset($logged) && $logged['admin'];

    if (!isset($oHtmlPurifier) && !$bAdmin) {
        HTMLPurifier_Bootstrap::registerAutoload();

        $oConfig = HTMLPurifier_Config::createDefault();

        $oConfig->set('Cache.SerializerPath', rtrim(BX_DIRECTORY_PATH_CACHE, '/'));
        $oConfig->set('Cache.SerializerPermissions', BX_DOL_DIR_RIGHTS);

        $oConfig->set('HTML.SafeObject', 'true');
        $oConfig->set('Output.FlashCompat', 'true');
        $oConfig->set('HTML.FlashAllowFullScreen', 'true');
        $oConfig->set('Attr.AllowedFrameTargets', array('_blank', '_self', '_parent', '_top'));

        if (getParam('sys_add_nofollow')) {
            $sHost = parse_url(BX_DOL_URL_ROOT, PHP_URL_HOST);
            $oConfig->set('URI.Host', $sHost);
            $oConfig->set('HTML.Nofollow', 'true');
        }

        $oConfig->set('Filter.Custom', array (
            new BxDolHTMLPurifierFilterYouTube(), 
            new BxDolHTMLPurifierFilterYoutubeIframe(), 
            new BxDolHTMLPurifierFilterAddBxLinksClass(), 
            new BxDolHTMLPurifierFilterLocalIframe(),
            new BxDolHTMLPurifierFilterEmbed(),
        ));
   
	    $oConfig->set('HTML.DefinitionID', 'html5-definitions');
		$oConfig->set('HTML.DefinitionRev', 1);
      
		if ($def = $oConfig->maybeGetRawHTMLDefinition()) {
		    $def->addElement('section', 'Block', 'Flow', 'Common');
		    $def->addElement('nav',     'Block', 'Flow', 'Common');
		    $def->addElement('article', 'Block', 'Flow', 'Common');
		    $def->addElement('aside',   'Block', 'Flow', 'Common');
		    $def->addElement('header',  'Block', 'Flow', 'Common');
		    $def->addElement('footer',  'Block', 'Flow', 'Common');
		    $def->addElement('video', 'Block', 'Optional: (source, Flow) | (Flow, source) | Flow', 'Common', array(
		        'src' => 'URI',
		        'type' => 'Text',
		        'width' => 'Length',
		        'height' => 'Length',
		        'poster' => 'URI',
		        'preload' => 'Enum#auto,metadata,none',
		        'controls' => 'Bool',
		    ));
		    $def->addElement('source', 'Block', 'Flow', 'Common', array(
		        'src' => 'URI',
		        'type' => 'Text',
            ));
            $def->addAttribute('a', 'data-profile-id', 'Text');
            $def->addAttribute('a', 'dchar', 'Text');
            $def->addAttribute('div', 'source', 'Text');
		}

        $oHtmlPurifier = new HTMLPurifier($oConfig);
    }

    /**
     * Note. I'm not sure if double 'purify' is needed for non-admins.
     */
    if(!$bAdmin)
        $val = $oHtmlPurifier->purify($val);

    $sNewVal = $val;
    if(!$bAdmin)
        $sNewVal = $oHtmlPurifier->purify($val);

    /**
     * @hooks
     * @hookdef hook-account-clear_xss 'account', 'clear_xss' - hook after string is checked for xss
     * - $unit_name - equals `system`
     * - $action - equals `clear_xss` 
     * - $object_id - not used 
     * - $sender_id - not used 
     * - $extra_params - array of additional params with the following array keys:
     *      - `oHtmlPurifier` - [object] HtmlPurifier object 
     *      - `input_data` - [string] string before check xss
     *      - `return_data` - [string] by ref, string before check xss, can be overridden in hook processing
     * @hook @ref hook-system-clear_xss
     */
    bx_alert('system', 'clear_xss', 0, 0, array('oHtmlPurifier' => $oHtmlPurifier, 'input_data' => $val, 'return_data' => &$sNewVal));

    return $val;
}

//--------------------------------------- friendly permalinks --------------------------------------//
//------------------------------------------- main functions ---------------------------------------//
function uriGenerate ($sValue, $sTable, $sField, $aParams = [])
{
    $sDivider = isset($aParams['divider']) ? $aParams['divider'] : '-';
    $aCond = isset($aParams['cond']) && is_array($aParams['cond']) ? $aParams['cond'] : [];

    $sValue = uriFilter($sValue, $aParams);
    if(uriCheckUniq($sValue, $sTable, $sField, $aCond))
        return $sValue;

    // cut off redundant part
    if(get_mb_len($sValue) > 240)
        $sValue = get_mb_substr($sValue, 0, 240);

    // try to add number
    for($i = 0 ; $i < 999 ; ++$i) {
        $iRnd = mt_rand(1000, 9999);
        if(uriCheckUniq($sValue . $sDivider . $iRnd, $sTable, $sField, $aCond))
            return ($sValue . $sDivider . $iRnd);
    }

    return rand(0, PHP_INT_MAX);
}

function uriFilter ($s, $aParams = [])
{
    $sEmpty = isset($aParams['empty']) ? $aParams['empty'] : '-';
    $sDivider = isset($aParams['divider']) ? $aParams['divider'] : '-';

    if(BxTemplConfig::getInstance()->bAllowUnicodeInPreg)
        $s = get_mb_replace ('/[^\pL^\pN^_]+/u', $sDivider, $s); // unicode characters
    else
        $s = get_mb_replace ('/([^\d^\w]+)/u', $sDivider, $s); // latin characters only

    $s = get_mb_replace ('/([' . $sDivider . '^]+)/', $sDivider, $s);
    $s = get_mb_replace ('/([' . $sDivider . ']+)$/', '', $s); // remove trailing dash
    if(!$s) 
        $s = $sEmpty;

    return !isset($aParams['lowercase']) || $aParams['lowercase'] === true ? mb_strtolower($s) : $s;
}

function uriCheckUniq ($sValue, $sTable, $sField, $aCond = [])
{
    $oDb = BxDolDb::getInstance();

    $sWhere = $aCond ? $oDb->arrayToSQL($aCond, ' AND ') : '1';
    $sSql = $oDb->prepare("SELECT 1 FROM `$sTable` WHERE $sWhere AND `$sField`=? LIMIT 1", $sValue);
    return !$oDb->query($sSql);
}

function get_mb_replace ($sPattern, $sReplace, $s)
{
    return preg_replace ($sPattern, $sReplace, $s);
}

function get_mb_len ($s)
{
    return (function_exists('mb_strlen')) ? mb_strlen($s) : strlen($s);
}

function get_mb_substr ($s, $iStart, $iLen)
{
    return (function_exists('mb_substr')) ? mb_substr ($s, $iStart, $iLen) : substr ($s, $iStart, $iLen);
}

function bx_mb_substr_replace($s, $sReplace, $iPosStart, $iLength)
{
    return mb_substr($s, 0, $iPosStart) . $sReplace . mb_substr($s, $iPosStart + $iLength);
}

function bx_mb_strpos ($s, $sReplacement, $iStart = 0)
{
    return mb_strpos($s, $sReplacement, $iStart);
}

/**
 * Import class file, it automatically detects class path by its prefix or module array/name
 *
 * @param $sClassName - full class name or class postfix(withoit prefix) in the case of module class
 * @param $mixedModule - module array or module name in the case of module class
 */
function bx_import($sClassName, $mixedModule = array())
{
    if (class_exists($sClassName, false))
        return;

    $aModule = false;
    if ($mixedModule) {
        if (is_array($mixedModule)) {
            $aModule = $mixedModule;
        } elseif (is_string($mixedModule)) {
            $o = BxDolModule::getInstance($mixedModule);
            $aModule = $o->_aModule;
        } elseif (is_bool($mixedModule) && true === $mixedModule) {
            $aModule = $GLOBALS['aModule'];
        }
    }

    if ($aModule) {
        if (class_exists($aModule['class_prefix'] . $sClassName, false))
            return;
        require_once (BX_DIRECTORY_PATH_MODULES . $aModule['path'] . 'classes/' . $aModule['class_prefix'] . $sClassName . '.php');
        return;
    }

    if (0 === strncmp($sClassName, 'BxDol', 5)) {
        if (0 === strncmp($sClassName, 'BxDolStudio', 11))
            require_once(BX_DOL_DIR_STUDIO_CLASSES . $sClassName . '.php');
        else
            require_once(BX_DIRECTORY_PATH_CLASSES . $sClassName . '.php');
        return;
    }

    if (0 === strncmp($sClassName, 'BxBase', 6)) {
        if (0 === strncmp($sClassName, 'BxBaseMod', 9)) {
            $aMatches = array();
            if (preg_match('/BxBaseMod([A-Z][a-z]+)/', $sClassName, $aMatches)) {
                require_once(BX_DIRECTORY_PATH_MODULES . 'base/' . strtolower($aMatches[1]) . '/classes/' . $sClassName . '.php');
                return;
            }
        } if (0 === strncmp($sClassName, 'BxBaseStudio', 12)) {
            require_once(BX_DOL_DIR_STUDIO_BASE . 'scripts/' . $sClassName . '.php');
            return;
        } else {
            require_once(BX_DIRECTORY_PATH_BASE . 'scripts/' . $sClassName . '.php');
            return;
        }
    }

    if (0 === strncmp($sClassName, 'BxTempl', 7)) {
        if(0 === strncmp($sClassName, 'BxTemplStudio', 13)) {
            $sPath = BX_DIRECTORY_PATH_MODULES . BxDolStudioTemplate::getInstance()->getPath() . 'data/template/studio/scripts/' . $sClassName . '.php';
            if (!file_exists($sPath))
                $sPath = BX_DOL_DIR_STUDIO_BASE . 'scripts_templ/' . $sClassName . '.php';
        } else {
            $sPath = BX_DIRECTORY_PATH_MODULES . BxDolTemplate::getInstance()->getPath() . 'data/template/system/scripts/' . $sClassName . '.php';
        }

        if (file_exists($sPath)) {
            require_once($sPath);
            return;
        }
        else{
            require_once(BX_DIRECTORY_PATH_BASE . 'scripts_templ/' . $sClassName . '.php');
            return;
        }

        trigger_error ("bx_import fatal error: class (" . $sClassName . ") wasn't found", E_USER_ERROR);
    }
}

/**
 * used in spl_autoload_register() function, so no need to call bx_import for system classes
 */
function bx_autoload($sClassName)
{
    if (0 === strncmp($sClassName, 'BxDol', 5) || 0 === strncmp($sClassName, 'BxBase', 6) || 0 === strncmp($sClassName, 'BxTempl', 7))
        bx_import($sClassName);
}

/**
 * Gets an instance of class pathing necessary parameters if it's necessary.
 *
 * @param string $sClassName class name.
 * @param array $aParams an array of parameters to be pathed to the constructor of the class.
 * @param array $mixedModule an array with module description. Is used when the requested class is located in some module.
 * @return unknown
 */
function bx_instance($sClassName, $aParams = array(), $mixedModule = array())
{
    if(isset($GLOBALS['bxDolClasses'][$sClassName]))
        return $GLOBALS['bxDolClasses'][$sClassName];

    if ($mixedModule) {
        if (!is_array($mixedModule)) {
            $o = BxDolModule::getInstance($mixedModule);
            $mixedModule = $o->_aModule;
        }
        $sClassName = bx_ltrim_str($sClassName, $mixedModule['class_prefix']);
        bx_import($sClassName, $mixedModule);
        $sClassName = $mixedModule['class_prefix'] . $sClassName;
    }

    $oClass = new ReflectionClass($sClassName);

    $GLOBALS['bxDolClasses'][$sClassName] = empty($aParams) ? $oClass->newInstance() : $oClass->newInstanceArgs($aParams);

    return $GLOBALS['bxDolClasses'][$sClassName];
}


/**
 * Escapes string/array ready to pass to js script with filtered symbols like ', " etc
 *
 * @param $mixedInput - string/array which should be filtered
 * @param $iQuoteType - string escaping method: BX_ESCAPE_STR_AUTO(default), BX_ESCAPE_STR_APOS or BX_ESCAPE_STR_QUOTE
 * @return converted string / array
 */
function bx_js_string ($mixedInput, $iQuoteType = BX_ESCAPE_STR_AUTO)
{
    $aUnits = array(
        "\n" => "\\n",
        "\r" => "",
    );
    if (BX_ESCAPE_STR_APOS == $iQuoteType) {
        $aUnits["'"] = "\\'";
        $aUnits['<script'] = "<scr' + 'ipt";
        $aUnits['</script>'] = "</scr' + 'ipt>";
    } elseif (BX_ESCAPE_STR_QUOTE == $iQuoteType) {
        $aUnits['"'] = '\\"';
        $aUnits['<script'] = '<scr" + "ipt';
        $aUnits['</script>'] = '</scr" + "ipt>';
    } else {
        $aUnits['"'] = '&quot;';
        $aUnits["'"] = '&apos;';
        $aUnits["<script>"] = '&lt;script&gt;';
        $aUnits["</script>"] = '&lt;/script&gt;';
    }
    return str_replace(array_keys($aUnits), array_values($aUnits), $mixedInput);
}

/**
 * Return input string/array ready to pass to html attribute with filtered symbols like ', " etc
 *
 * @param $mixedInput - string/array which should be filtered
 * @param $iQuoteType - string escaping BX_ESCAPE_STR_AUTO, BX_ESCAPE_STR_APOS or BX_ESCAPE_STR_QUOTE
 * @return converted string / array
 */
function bx_html_attribute ($mixedInput, $iQuoteType = BX_ESCAPE_STR_AUTO)
{
    $aUnits = array ();
    if (BX_ESCAPE_STR_APOS == $iQuoteType)
        $aUnits["'"] = "\\'";
    elseif (BX_ESCAPE_STR_QUOTE == $iQuoteType)
        $aUnits['"'] = '&quot;';
    else
        $aUnits = array("\"" => "&quot;", "'" => "&apos;");

    return str_replace(array_keys($aUnits), array_values($aUnits), $mixedInput);
}

/**
 * Escapes string/array ready to pass to php script with filtered symbols like ', " etc
 *
 * @param mixed $mixedInput - string/array which should be filtered
 * @return converted string / array
 */
function bx_php_string_apos ($mixedInput)
{
    return str_replace("'", "\\'", $mixedInput);
}
function bx_php_string_quot ($mixedInput)
{
    return str_replace('"', '\\"', $mixedInput);
}

/**
 * Gets file contents by URL.
 *
 * @param string $sFileUrl - file URL to be read.
 * @param array $aParams - an array of parameters to be pathed with URL.
 * @param string $sMethod - post or get.
 * @param array $aHeaders - custom headers.
 * @param string $sHttpCode - HTTP code to return
 * @param array $aBasicAuth - array with 'user' and 'password' for Basic HTTP Auth
 * @return string the file's contents.
 */
function bx_file_get_contents($sFileUrl, $aParams = array(), $sMethod = 'get', $aHeaders = array(), &$sHttpCode = null, $aBasicAuth = array(), $iTimeout = 0, $aCustomCurlParams = array())
{
    if(!in_array($sMethod, ['post', 'post-raw', 'post-json', 'post-json-object']))
    	$sFileUrl = bx_append_url_params($sFileUrl, $aParams);

    $sResult = '';
    if(function_exists('curl_init')) {
        $rConnect = curl_init();

        curl_setopt($rConnect, CURLOPT_USERAGENT, 'UNA ' . (defined('BX_DOL_VERSION') ? constant('BX_DOL_VERSION') : ''));
        curl_setopt($rConnect, CURLOPT_TIMEOUT, BxDolDb::getInstance() ? getParam('sys_default_curl_timeout') : 10);
        curl_setopt($rConnect, CURLOPT_URL, $sFileUrl);
        curl_setopt($rConnect, CURLOPT_RETURNTRANSFER, 1);

        if (0 !== $iTimeout) {
            curl_setopt($rConnect, CURLOPT_CONNECTTIMEOUT, $iTimeout);
            curl_setopt($rConnect, CURLOPT_TIMEOUT, $iTimeout);
        }
        
        if(getParam('sys_curl_ssl_allow_untrusted') == 'on'){
            curl_setopt($rConnect, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($rConnect, CURLOPT_SSL_VERIFYHOST, false);
        }

        if (!ini_get('open_basedir'))
            curl_setopt($rConnect, CURLOPT_FOLLOWLOCATION, 1);

        if ($aBasicAuth)
            curl_setopt($rConnect, CURLOPT_USERPWD, $aBasicAuth['user'] . ':' . $aBasicAuth['password']);

        if ('post' == $sMethod) {
            curl_setopt($rConnect, CURLOPT_POST, true);
            curl_setopt($rConnect, CURLOPT_POSTFIELDS, http_build_query($aParams));
        }
        elseif ('post-raw' == $sMethod) {
            curl_setopt($rConnect, CURLOPT_POST, true);
            curl_setopt($rConnect, CURLOPT_POSTFIELDS, $aParams);
        }
        elseif ('post-json' == $sMethod) {
            curl_setopt($rConnect, CURLOPT_POST, true);
            curl_setopt($rConnect, CURLOPT_POSTFIELDS, json_encode($aParams));
            $aHeaders[] = 'Content-Type: application/json';
        }
        elseif ('post-json-object' == $sMethod) {
            curl_setopt($rConnect, CURLOPT_POST, true);
            curl_setopt($rConnect, CURLOPT_POSTFIELDS, json_encode($aParams, JSON_FORCE_OBJECT));
            $aHeaders[] = 'Content-Type: application/json';
        }
        elseif ($sMethod != 'get') {
            curl_setopt($rConnect, CURLOPT_CUSTOMREQUEST, $sMethod);
        }

        if ($aHeaders)
            curl_setopt($rConnect, CURLOPT_HTTPHEADER, $aHeaders);

        if (defined('BX_DOL_URL_ROOT') && 0 === strpos($sFileUrl, BX_DOL_URL_ROOT)) {
            curl_setopt($rConnect, CURLOPT_COOKIE, http_build_query($_COOKIE, '', '; ', PHP_QUERY_RFC3986));
        }

        if ($aCustomCurlParams)
            foreach ($aCustomCurlParams as $sName => $mixedValue)
                curl_setopt($rConnect, $sName, $mixedValue);

        $sResult = curl_exec($rConnect);

        if (curl_errno($rConnect) == 60) { // CURLE_SSL_CACERT
            curl_setopt($rConnect, CURLOPT_CAINFO, BX_DIRECTORY_PATH_PLUGINS . 'curl/cacert/cacert.pem');
            $sResult = curl_exec($rConnect);
        }

        if (NULL !== $sHttpCode)
            $sHttpCode = curl_getinfo($rConnect, CURLINFO_HTTP_CODE);

    }
    else {

        $iSaveTimeout = false;
        if (0 !== $iTimeout) {
            $iSaveTimeout = ini_get('default_socket_timeout');
            ini_set('default_socket_timeout', $iTimeout);
        }

        $sResult = @file_get_contents($sFileUrl);

        if (0 !== $iTimeout && false !== $iSaveTimeout) {
            ini_set('default_socket_timeout', $iSaveTimeout);
        }
    }

    return $sResult;
}

function bx_make_utf8($s)
{
    // Test it and see if it is UTF-8 or not
    if (false !== mb_detect_encoding($s, ["UTF-8"], true))
        return $s;

    $sEncoding = mb_detect_encoding($s, ['ASCII', 'BASE64', 'HTML-ENTITIES', 'Windows-1251', 'KOI8-R'], true);
    if ($sEncoding === false)
        return $s;

    return mb_convert_encoding($s, "UTF-8", $sEncoding);
}

function bx_get_site_info($sSourceUrl, $aProcessAdditionalTags = array())
{
    $aResult = array();
    $sContent = bx_file_get_contents($sSourceUrl);

    if ($sContent) {
        $sCharset = '';
        preg_match("/<meta.+charset=([A-Za-z0-9-]+).+>/i", $sContent, $aMatch);
        if (isset($aMatch[1]))
            $sCharset = $aMatch[1];

        $sContent = preg_replace("/<script[^>]*>(.*?)<\/script>/i", '', $sContent);
        $sContent = preg_replace("/<style[^>]*>(.*?)<\/style>/i", '', $sContent);
        if (preg_match("/<title[^>]*>(.*?)<\/title>/i", $sContent, $aMatch))
            $aResult['title'] = bx_make_utf8(strip_tags($aMatch[1]), $sCharset);
        else
            $aResult['title'] = parse_url($sSourceUrl, PHP_URL_HOST);

        $aResult['description'] = bx_make_utf8(bx_parse_html_tag($sContent, 'meta', 'name', 'description', 'content', $sCharset), $sCharset);
        $aResult['keywords'] = bx_make_utf8(bx_parse_html_tag($sContent, 'meta', 'name', 'keywords', 'content', $sCharset), $sCharset);

        if ($aProcessAdditionalTags) {

            foreach ($aProcessAdditionalTags as $k => $a) {
                $aResult[$k] = bx_parse_html_tag(
                    $sContent, 
                    isset($a['tag']) ? $a['tag'] : 'meta', 
                    isset($a['name_attr']) ? $a['name_attr'] : 'itemprop', 
                    isset($a['name']) ? $a['name'] : $k, 
                    isset($a['content_attr']) ? $a['content_attr'] : 'content', 
                    $sCharset,
                    isset($a['specialchars_decode']) ? $a['specialchars_decode'] : true); 

                if ((isset($a['name']) && 'og:image' == $a['name']) || (isset($a['tag']) && 'link' == $a['tag'])) {
                    $aResult[$k] = bx_get_site_info_fix_relative_url ($sSourceUrl, $aResult[$k]);
                }
            }

        }
    }

    return $aResult;
}

/**
 * Fix relative URL to make it absolute
 * @param $sSourceUrl main URL
 * @param $s URL to fix
 * @return absolute URL or URL wothout changes
 */ 
function bx_get_site_info_fix_relative_url ($sSourceUrl, $s)
{
    if (0 === stripos($s, 'http://') || 0 === stripos($s, 'https://') || 0 === stripos($s, 'ftp://') || !$s)
        return $s;

    if ('/' == $s[0]) {
        $a = parse_url($sSourceUrl);
        return $a['scheme'] . '://' . $a['host'] . (empty($a['port']) || 80 == $a['port'] || 443 == $a['port'] ? '' : ':' . $a['port']) . $s;
    }

    return $sSourceUrl . ('/' === substr($sSourceUrl, -1) ? $s : '/' . $s);
}

function bx_parse_html_tag ($sContent, $sTag, $sAttrNameName, $sAttrNameValue, $sAttrContentName, $sCharset = false, $bSpecialCharsDecode = true)
{
    // This regex is designed to be more flexible with attribute orders and spacing
    $regex = "/<{$sTag}\s+(?:[^>]*?\s+)?{$sAttrNameName}\s*=\s*['\"]?{$sAttrNameValue}['\"]?\s+[^>]*{$sAttrContentName}\s*=\s*['\"]([^'\"]*)['\"][^>]*>/i";
    if (!preg_match($regex, $sContent, $aMatch)) {
        // Try reversing the attribute order in case the first regex fails
        $regex = "/<{$sTag}\s+(?:[^>]*?\s+)?{$sAttrContentName}\s*=\s*['\"]([^'\"]*)['\"]\s+[^>]*{$sAttrNameName}\s*=\s*['\"]?{$sAttrNameValue}['\"]?[^>]*>/i";
        preg_match($regex, $sContent, $aMatch);
    }

    // Extract the attribute content if available
    $s = isset($aMatch[1]) ? $aMatch[1] : '';

    // Optionally convert character encoding
    if ($s && $sCharset) {
        $s = mb_convert_encoding($s, 'UTF-8', $sCharset);
    }

    // Optionally decode special HTML characters
    if ($bSpecialCharsDecode) {
        $s = htmlspecialchars_decode($s);
    }

    return $s;
}

// calculation ini_get('upload_max_filesize') in bytes as example
function return_bytes($val)
{
    $val = trim($val);
    $last = strtolower($val[strlen($val)-1]);
    $val = (int)$val;
    switch($last) {
        // The 'G' modifier is available since PHP 5.1.0
        case 'k':
            $val *= 1024;
            break;
        case 'm':
            $val *= 1024 * 1024;
            break;
        case 'g':
            $val *= 1024 * 1024 * 1024;
            break;
    }
    return $val;
}

/**
 * Format bytes to human-readable format
 * @param $iBytes - number of bytes
 * @param $iPrecision - decimal places (default 1)
 * @return formatted string like "2.5M", "512K", "1024B"
 */
function bx_format_bytes($iBytes)
{
    return _t_format_size($iBytes);
}

// Generate Random Password
function genRndPwd($iLength = 8, $bSpecialCharacters = true)
{
    $sPassword = '';
    $sChars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    if($bSpecialCharacters === true)
        $sChars .= "!?=/&+,.";

    for($i = 0; $i < $iLength; $i++) {
        $x = mt_rand(0, strlen($sChars) -1);
        $sPassword .= $sChars[$x];
    }

    return $sPassword;
}

// Generate Random Salt for Password encryption
function genRndSalt()
{
    return genRndPwd(8, true);
}

function bx_gen_secret($sV)
{
    $iL = strlen($sV);
    $iV = ceil(0.1 * $iL);
    return substr($sV, 0, $iV) . str_repeat('*', floor(0.8 * $iL)) . substr($sV, -$iV);
}

/**
 * Encrypt user password.
 * When BX_PWD_ALGO is 'custom', then bx_custom_pwd_encrypt function with custom algorythm must be defined in inc/header.inc.php file.
 * @param $sPwd clear password
 * @param $sSalt salt
 * @return password hash
 */ 
function encryptUserPwd($sPwd, $sSalt)
{
	$sAlgo = defined('BX_PWD_ALGO') ? BX_PWD_ALGO : '';

    switch ($sAlgo) {
        
        case 'custom':
            return bx_custom_pwd_encrypt($sPwd, $sSalt); 

    	case 'crypt':
            return crypt($sPwd, BX_PWD_ALGO_SALT);

        case 'sha1_crypt_salt':
            return sha1(crypt($sPwd, BX_PWD_ALGO_SALT) . $sSalt);

        case 'sha1_md5_salt':
        default:
            return sha1(md5($sPwd) . $sSalt);
    }
}

/**
 * Hash profile ID
 */
function encryptUserId($sId)
{
    if (!($oProfile = BxDolProfile::getInstance($sId)))
        return false;

    if (!($oAccount = $oProfile->getAccountObject()))
        return false;

    $aAccountInfo = $oAccount->getInfo();
    return sha1(md5($sId) . md5($aAccountInfo['salt']) . BX_DOL_SECRET);
}

function bx_get_reset_password_key($sValue, $sField = 'email', $iLifetime = 0)
{
    if(empty($iLifetime)) {
        $iLifetime = (int)getParam('sys_account_reset_password_key_lifetime');
        if(empty($iLifetime)) 
            $iLifetime = 86400;
    }

    $oKey = BxDolKey::getInstance();
    if(!$oKey)
        return false;

    return $oKey->getNewKey(array($sField => $sValue), $iLifetime);
}

function bx_get_reset_password_link($sValue, $sField = 'email', $iLifetime = 0)
{
    $sKey = bx_get_reset_password_key($sValue, $sField, $iLifetime);
    if(!$sKey)
        return false;

    return bx_get_reset_password_link_by_key($sKey);
}

function bx_get_reset_password_link_by_key($sKey)
{
    return bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=forgot-password', array('key' => $sKey)));
}

function bx_get_reset_password_redirect($iAccountId)
{
    $sResult = '';
    $sRedirect = getParam('sys_account_reset_password_redirect');
    switch($sRedirect) {
        case 'home':
            $sResult = BxDolPermalinks::getInstance()->permalink('page.php?i=home');
            break;
        
        case 'profile':
        case 'profile_edit':
            if(empty($iAccountId))
                break;
            
            $oAccount = BxDolAccount::getInstance($iAccountId);
            if(!$oAccount)
                break;
            
            $aAccountInfo = $oAccount->getInfo();
            if(empty($aAccountInfo) || !is_array($aAccountInfo) || empty($aAccountInfo['profile_id']))
                break;

            $oProfile = BxDolProfile::getInstance((int)$aAccountInfo['profile_id']);
            if(!$oProfile)
                break;

            $sResult = $oProfile->{'get' . ($sRedirect == 'profile_edit' ? 'Edit' : '') . 'Url'}();
            break;

        case 'custom':
            $sResult = getParam('sys_account_reset_password_redirect_custom');
            break;
    }

    if(!empty($sResult))
        $sResult = bx_absolute_url($sResult);

    return $sResult;
}

function bx_get ($sName, $sMethod = false)
{
    if (isset($_GET[$sName]) && ('get' == $sMethod || !$sMethod))
        return $_GET[$sName];
    elseif (isset($_POST[$sName]) && ('post' == $sMethod || !$sMethod))
        return $_POST[$sName];
    else
        return false;
}

function bx_set ($sName, $sValue, $sMethod = false)
{
    if(!$sMethod)
        $sMethod = 'get';

    $bResult = true;
    switch($sMethod) {
        case 'get':
            $_GET[$sName] = $sValue;
            break;
        
        case 'post':
            $_POST[$sName] = $sValue;
            break;

        default:
            $bResult = false;
    }

    return $bResult;
}

function bx_get_with_prefix ($sPrefix, $sMethod = false)
{
    $aSources = array('get' => &$_GET, 'post' => &$_POST);

    $aFiltered = array();
    foreach($aSources as $sName => $aSource)
        if($sMethod == $sName || !$sMethod)
            $aFiltered = array_merge($aFiltered, array_filter($aSource, function($sKey) use ($sPrefix) {
                return strpos($sKey, $sPrefix) === 0;
            }, ARRAY_FILTER_USE_KEY));

    $aUpdated = array();
    array_walk($aFiltered, function($sValue, $sKey) use ($sPrefix, &$aUpdated) {
        $aUpdated[trim(str_replace($sPrefix, '', $sKey), '_-')] = $sValue;
    });

    return $aUpdated;
}

function bx_get_base_url_inline($aParams = array())
{
    $aBaseLink = parse_url(BX_DOL_URL_ROOT);
    $sPageLink = (!empty($aBaseLink['scheme']) ? $aBaseLink['scheme'] : 'http') . '://' . $aBaseLink['host'] . (!empty($aBaseLink['port']) ? ':' . $aBaseLink['port'] : '');
    if(!empty($_SERVER['REQUEST_URI']))
        $sPageLink .= $_SERVER['REQUEST_URI'];

    list($sPageLink, $aPageParams) = bx_get_base_url($sPageLink);

    if(!empty($_SERVER['QUERY_STRING'])) {
        $aPageParamsAdd = array();
        parse_str($_SERVER['QUERY_STRING'], $aPageParamsAdd);
        if(!empty($aPageParamsAdd) && is_array($aPageParamsAdd))
            $aPageParams = array_merge($aPageParams, $aPageParamsAdd);
    }

    if(!empty($aParams) && is_array($aParams))
        $aPageParams = array_merge($aPageParams, $aParams);

    return array($sPageLink, $aPageParams);
}

function bx_get_base_url_popup($aParams = array())
{
    list($sPageLink, $aPageParams) = bx_get_base_url($_SERVER['HTTP_REFERER']);

    if(!empty($aParams) && is_array($aParams))
        $aPageParams = array_merge($aPageParams, $aParams);

    return array($sPageLink, $aPageParams);
}

function bx_get_base_url($sPageLink)
{
    $sPageLink = BxDolPermalinks::getInstance()->unpermalink($sPageLink, false);

    $sPageParams = '';
    if(strpos($sPageLink, '?') !== false)
        list($sPageLink, $sPageParams) = explode('?', $sPageLink);

    $aPageParams = array();
    if(!empty($sPageParams))
        parse_str($sPageParams, $aPageParams);

    return array($sPageLink, $aPageParams);
}

function bx_get_page_info()
{
    list($sPageLink, $aPageParams) = bx_get_base_url_inline();

    if(isset($aPageParams['i'], $aPageParams['id']) && ($oPage = BxDolPage::getObjectInstanceByURI($aPageParams['i'])) !== false) {
        $sPageModule = $oPage->getModule();
        if(bx_srv('system', 'is_module_context', [$sPageModule]) && ($oProfile = BxDolProfile::getInstanceByContentAndType($aPageParams['id'], $sPageModule)) !== false)
            return [
                'context_module' => $sPageModule, 
                'context_id' => $aPageParams['id'], 
                'context_profile_id' => $oProfile->id()
            ];
    }

    if(isset($aPageParams['profile_id']) && ($oProfile = BxDolProfile::getInstance($aPageParams['profile_id'])) !== false) {
        $sProfileModule = $oProfile->getModule();
        if(bx_srv('system', 'is_module_context', [$sProfileModule]))
            return [
                'context_module' => $sProfileModule, 
                'context_id' => $oProfile->getContentId(), 
                'context_profile_id' => $aPageParams['profile_id']
            ];
    }

    return false;
}

function bx_get_location_bounds_latlng($fLatitude, $fLongitude, $iRadiusInKm)
{
    $fEquatorLatInKm = 111.321;
    $aRv = array();
    $aRv['max_lat'] = $fLatitude + $iRadiusInKm / $fEquatorLatInKm;
    $aRv['min_lat'] = $fLatitude - ($aRv['max_lat'] - $fLatitude);
    $aRv['max_lng'] = $fLongitude + $iRadiusInKm / (cos($aRv['min_lat'] * M_PI / 180) * $fEquatorLatInKm);
    $aRv['min_lng'] = $fLongitude - ($aRv['max_lng'] - $fLongitude);
    return $aRv;
    
}

function bx_encode_url_params ($a, $aExcludeKeys = array (), $aOnlyKeys = false)
{
    $s = '';
    foreach ($a as $sKey => $sVal) {
        if (in_array($sKey, $aExcludeKeys))
            continue;
        if (false !== $aOnlyKeys && !in_array($sKey, $aOnlyKeys))
            continue;
        if (is_array($sVal)) {
            foreach ($sVal as $sSubVal) {
                $s .= rawurlencode($sKey) . '[]=' . rawurlencode(is_array($sSubVal) ? 'array' : $sSubVal) . '&';
            }
        } else {
            $s .= rawurlencode($sKey) . '=' . rawurlencode($sVal) . '&';
        }
    }
    return $s;
}

/**
 * It works similar to `parse_str` php function, but it doesn't decode URL params
 */
function bx_parse_str($s) 
{
    $a = [];
    $aPairs = explode('&', $s);

    foreach ($aPairs as $i) {
        list($sName, $mixedValue) = explode('=', $i, 2);
        $sName = rtrim($sName, '[]');

        if (isset($a[$sName])) {
            if (is_array($a[$sName]))
                $a[$sName][] = $mixedValue;
            else 
                $a[$sName] = [$a[$sName], $mixedValue];
        }
        else {
            $a[$sName] = $mixedValue;
        }
    }

    return $a;
}

function bx_append_url_params ($sUrl, $mixedParams, $bEncodeParams = true, $aIgnoreParams = [])
{
    if (!$mixedParams)
        return $sUrl;

    $sParams = false === strpos($sUrl, '?') ? '?' : '&';

    if (is_array($mixedParams)) {
        foreach($mixedParams as $sKey => $sValue) {
            if (!is_array($sValue)) {
                if ($bEncodeParams) {
                    if ($sKey && !in_array($sKey, $aIgnoreParams))
                        $sKey = rawurlencode($sKey);
                    if ($sValue && !in_array($sValue, $aIgnoreParams))
                        $sValue = rawurlencode($sValue);
                }
                $sParams .= $sKey . '=' . $sValue . '&';
            }
            else {
                foreach($sValue as $sSubValue) {
                    if ($bEncodeParams) {
                        if ($sKey && !in_array($sKey, $aIgnoreParams))
                            $sKey = rawurlencode($sKey);
                        if ($sSubValue && !in_array($sSubValue, $aIgnoreParams))
                            $sSubValue = rawurlencode($sSubValue);
                    }
                    $sParams .= $sKey . '[]=' . $sSubValue . '&';
                }
            }
        }
        $sParams = substr($sParams, 0, -1);
    } else {
        $sParams .= $mixedParams;
    }
    return $sUrl . $sParams;
}

function bx_process_url_param($sValue, $sPattern = "/^[\d\w_-]+$/")
{
    $mixedValue = bx_process_input($sValue);
    return $mixedValue !== false && preg_match($sPattern, $mixedValue) ? $mixedValue : '';
}

function bx_rrmdir($directory)
{
    if (substr($directory,-1) == "/")
        $directory = substr($directory,0,-1);

    if (!file_exists($directory) || !is_dir($directory))
        return false;
    elseif (!is_readable($directory))
        return false;

    if (!($directoryHandle = opendir($directory)))
        return false;

    while ($contents = readdir($directoryHandle)) {
        if ($contents != '.' && $contents != '..') {
            $path = $directory . "/" . $contents;

            if (is_dir($path))
                bx_rrmdir($path);
            else
                unlink($path);
        }
    }

    closedir($directoryHandle);

    if (!rmdir($directory))
        return false;

    return true;
}

function bx_clear_folder ($sPath, $aExts = array ())
{
    if (substr($$sPath,-1) == "/")
        $sPath = substr($sPath,0,-1);

    if (!file_exists($sPath) || !is_dir($sPath))
        return false;
    elseif (!is_readable($sPath))
        return false;

    if (!($h = opendir($sPath)))
        return false;

    while ($sFile = readdir($h)) {
        if ('.' == $sFile || '..' == $sFile)
            continue;

        $sFullPath = $sPath . '/' . $sFile;

        if (is_dir($sFullPath))
            continue;

        if (!$aExts || (($sExt = pathinfo($sFullPath, PATHINFO_EXTENSION)) && in_array($sExt, $aExts)))
            @unlink($sFullPath);
    }

    closedir($h);

    return true;
}

function bx_ltrim_str ($sString, $sPrefix, $sReplace = '')
{
    if ($sReplace && substr($sString, 0, strlen($sReplace)) == $sReplace)
        return $sString;
    if (substr($sString, 0, strlen($sPrefix)) == $sPrefix)
        return $sReplace . substr($sString, strlen($sPrefix));
    return $sString;
}

function bx_rtrim_str ($sString, $sPrefix, $sReplace = '')
{
    if ($sReplace && substr($sString, -strlen($sReplace)) == $sReplace)
        return $sString;
    if (substr($sString, -strlen($sPrefix)) == $sPrefix)
        return substr($sString, 0, -strlen($sPrefix)) . $sReplace;
    return $sString;
}

/**
 * Strip all lines with no information for example: <p></p>, <br /><br />
 */ 
function bx_trim_nl_duplicates($s)
{
    $sStrip = implode('', array_keys(get_html_translation_table(HTML_ENTITIES)));
    return implode('', array_filter(mb_split("[\n\r]", $s), function($s) use ($sStrip) {
        return trim(strip_tags($s, '<button><canvas><embed><hr><iframe><img><input><object><select><svg><video>'), $sStrip) !== '';
    }));
}

/**
 * Convert array to attributes string
 *
 * Example:
 * @code
 * $a = array('name' => 'test', 'value' => 5);
 * $s = bx_convert_array2attrs($a);
 * echo $s; // outputs: name="test" value="5"
 * @endcode
 *
 * @param $a - array of attributes
 * @param $sClasses - classes to merge with 'class' attribute
 * @param $sStyles - styles to merge with 'style' attribute
 * @return string
 */
function bx_convert_array2attrs ($a, $sClasses = false, $sStyles = false)
{
    $sRet = '';

    if (!$a || !is_array($a))
        $a = array();

    if ($sClasses) {
        $sClasses = trim($sClasses);
        $a['class'] = $sClasses . (!empty($a['class']) ? ' ' . $a['class'] : '');
    }

    if ($sStyles) {
        $sStyles = trim($sStyles);
        if (';' != $sStyles[strlen($sStyles)-1])
            $sStyles .= ';';
        $a['style'] = $sStyles . (!empty($a['style']) ? ' ' . $a['style'] : '');
    }

    foreach ($a as $sKey => $sValue) {
        if(is_null($sValue)) // pass NULL values
            continue;

        $sValueC = bx_html_attribute($sValue, BX_ESCAPE_STR_QUOTE);

        $sRet .= " $sKey=\"$sValueC\"";
    }

    return $sRet;
}

function bx_unicode_urldecode($s)
{
    preg_match_all('/%u([[:alnum:]]{4})/', $s, $a);

    foreach ($a[1] as $uniord) {
        $dec = hexdec($uniord);
        $utf = '';

        if ($dec < 128) {
            $utf = chr($dec);
        } else if ($dec < 2048) {
            $utf = chr(192 + (($dec - ($dec % 64)) / 64));
            $utf .= chr(128 + ($dec % 64));
        } else {
            $utf = chr(224 + (($dec - ($dec % 4096)) / 4096));
            $utf .= chr(128 + ((($dec % 4096) - ($dec % 64)) / 64));
            $utf .= chr(128 + ($dec % 64));
        }

        $s = str_replace('%u'.$uniord, $utf, $s);
    }

    return urldecode($s);
}

/**
 * Raise an audit event
 * @param int $iContentId - content id
 * @param string $sContentModule - module name
 * @param string $sAction - system action key
 * @param array $aParams - array of parameters 
 */
function bx_audit($iContentId, $sContentModule, $sAction, $aParams, $iProfileId = 0)
{
    if (!getParam('sys_audit_enable') || getParam('sys_audit_acl_levels') == '')
        return;
    
    if ($iProfileId == 0)
        $iProfileId = bx_get_logged_profile_id();
    
    if (!BxDolAcl::getInstance()->isMemberLevelInSet(explode(',', getParam('sys_audit_acl_levels')), $iProfileId))
        return;
    
    $sContentTitle = $sContentInfoObject = $sContextProfileTitle = $sData = $sActionParams = '';
    $iContextProfileId = 0;
    
    if (isset($aParams['profile_id']))
        $iProfileId = (int)$aParams['profile_id'];
    
    if (isset($aParams['content_title']))
        $sContentTitle = $aParams['content_title'];
    
    if (isset($aParams['context_profile_id']))
        $iContextProfileId = (int)$aParams['context_profile_id'];
    
    if (isset($aParams['context_profile_title']))
        $sContextProfileTitle = $aParams['context_profile_title'];
    
    if (isset($aParams['action_params']) && is_array($aParams['action_params']) && count($aParams['action_params']))
        $sActionParams = serialize($aParams['action_params']);
    
    if (isset($aParams['content_info_object']))
        $sContentInfoObject = $aParams['content_info_object'];
     
    if (isset($aParams['data']) && is_array($aParams['data']) && count($aParams['data']))
        $sData = serialize($aParams['data']);
    
    $sProfileTitle = BxDolProfile::getInstance($iProfileId)->getDisplayName();
    
    $oDb = BxDolDb::getInstance();
    $sSql = $oDb->prepare("INSERT INTO `sys_audit`(`added`, `profile_id`, `profile_title`, `content_id`, `content_title`, `content_module`, `context_profile_id`, `context_profile_title`, `action_lang_key`, `action_lang_key_params`, `content_info_object`, `extras`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
     ,time(), $iProfileId, $sProfileTitle, $iContentId, $sContentTitle, $sContentModule, $iContextProfileId, $sContextProfileTitle, $sAction, $sActionParams ,$sContentInfoObject, $sData);
    return !$oDb->query($sSql);
}

/**
 * Raise an alert
 * @param string $sUnit - system type
 * @param string $sAction - system action
 * @param int $iObjectId - object id
 * @param int $iSender - sender (action's author) profile id, if it is false - then currectly logged in profile id is used
 * @param array $aExtras - extra parameters 
 */
function bx_alert($sUnit, $sAction, $iObjectId, $iSender = false, $aExtras = array())
{
    $o = new BxDolAlerts($sUnit, $sAction, $iObjectId, $iSender, $aExtras);
    $o->alert();
}

/**
 * Check whether serice method exists or not
 * @param $mixed module name or module id
 * @param $sMethod service method name in format 'method_name', corresponding class metod is serviceMethodName
 * @param $sClass class to search for service method, by default it is main module class
 * @return boolean check result
 */
function bx_is_srv($mixedModule, $sMethod, $sClass = "Module", $bIgnoreInactive = false)
{
    return BxDolRequest::serviceExists($mixedModule, $sMethod, $sClass, $bIgnoreInactive);
}

/**
 * Check whether serice method exists or not in 'Ignore Inactive' mode.
 */
function bx_is_srv_ii($mixedModule, $sMethod, $sClass = "Module")
{
    return BxDolRequest::serviceExists($mixedModule, $sMethod, $sClass, true);
}

/**
 * Perform serice call
 * @param $mixed module name or module id
 * @param $sMethod service method name in format 'method_name', corresponding class metod is serviceMethodName
 * @param $aParams params to pass to service method
 * @param $sClass class to search for service method, by default it is main module class
 * @return service call result
 */
function bx_srv($mixed, $sMethod, $aParams = array(), $sClass = 'Module', $bIgnoreCache = false, $bIgnoreInactive = false)
{
    return BxDolService::call($mixed, $sMethod, $aParams, $sClass, $bIgnoreCache, $bIgnoreInactive);
}

/**
 * Perform serice call in 'Ignore Inactive' mode.
 */
function bx_srv_ii($mixed, $sMethod, $aParams = array(), $sClass = 'Module', $bIgnoreCache = false)
{
    return BxDolService::call($mixed, $sMethod, $aParams, $sClass, $bIgnoreCache, true);
}

/**
 * Perform serice call in 'Ignore Cache' mode.
 */
function bx_srv_ic($mixed, $sMethod, $aParams = array(), $sClass = 'Module', $bIgnoreInactive = false)
{
    return BxDolService::call($mixed, $sMethod, $aParams, $sClass, true, $bIgnoreInactive);
}

function bx_replace_markers($mixed, $aMarkers)
{
    if (empty($mixed) || empty($aMarkers))
        return $mixed;

    if (is_array($mixed)) {
        foreach ($mixed as $sKey => $sValue)
            $mixed[$sKey] = bx_replace_markers ($sValue, $aMarkers);
    } else {
        foreach ($aMarkers as $sKey => $sValue)
            $mixed = str_replace('{' . $sKey . '}', is_null($sValue) ? '' : $sValue, $mixed);
    }

    return $mixed;
}

function bx_site_hash($sSalt = '', $isSkipVersion = false)
{
    return md5($sSalt . ($isSkipVersion ? '' : bx_get_ver() . getParam('sys_revision')) . BX_DOL_SECRET . BX_DOL_URL_ROOT);
}

/**
 * Transform string to method name string, for example it changes 'some_method' string to 'SomeMethod' string
 * @param $s string where words are separated with underscore
 * @param $aWordsDelimiter word delimeters
 * @return string where every word begins with capital letter
 */
function bx_gen_method_name ($s, $aWordsDelimiter = array('_'))
{
    return str_replace(' ', '', ucwords(str_replace($aWordsDelimiter, ' ', $s)));
}

/**
 * Trigger user error
 * @param $sMsg message to display
 * @param $iNumLevelsBack add additional debug backtracing N levels back
 */
function bx_trigger_error ($sMsg, $iNumLevelsBack = 0)
{
    $a = debug_backtrace();
    $sMsgAdd = "<br />\n related code in <b>{$a[$iNumLevelsBack]['file']}</b> on line <b>{$a[$iNumLevelsBack]['line']}</b> <br />\n";
    trigger_error ($sMsg . $sMsgAdd, E_USER_ERROR);
}

/**
 * Get system DB version, for files version @see BX_DOL_VERSION, these versions must match
 */
function bx_get_ver ($bInvalidateCache = false)
{
    $oDb = BxDolDb::getInstance();

    if ($bInvalidateCache)
        $oDb->cleanMemory('sys_version');
    
    $sQuery = $oDb->prepare("SELECT `version` FROM `sys_modules` WHERE `name` = 'system'");
    return $oDb->fromMemory('sys_version', 'getOne', $sQuery);
}

function bx_check_debug_mode() 
{
    if(!bx_is_dbg()) 
        return;

    ini_set('display_errors', 'On');
    error_reporting(E_ALL);
}

/**
 * Check if site maintetance mode is enabled.
 * Maintetance mode is enabled when '.bx_maintenance' file exists in the script root folder, 
 * please note that this is hidden file and some file managers don't show it.
 * @param $bShowHttpError show 503 HTTP error if site is in mainenance mode
 * @return true if site is in maintenance mode, or false otherwise
 */
function bx_check_maintenance_mode ($bShowHttpError = false)
{
    $bMaintetance = file_exists(BX_DIRECTORY_PATH_ROOT . BX_MAINTENANCE_FILE) && !defined('BX_DOL_UPGRADING');

    if ($bMaintetance && $bShowHttpError)
        bx_show_service_unavailable_error_and_exit ('Site is temporarily unavailable due to scheduled maintenance, please try again in a minute.', 600);

    return $bMaintetance;
}

/**
 * Check if site soft maintetance mode is enabled.
 * Soft maintetance mode is enabled when maintenance mode is enabled via studio setting.
 */
function bx_check_maintenance_mode_soft ()
{
    if (isset($_SERVER['HTTP_HOST'])) {
        $sUrl = bx_proto() . '://' . $_SERVER['HTTP_HOST'] . $_SERVER['PHP_SELF'];
        if (0 === strpos($sUrl, BX_DOL_URL_STUDIO)) // allow to view studio
            return;
        if (0 === strpos($sUrl, BX_DOL_URL_ROOT . 'member.php') && $_SERVER['REQUEST_METHOD'] === 'POST') // make studio login form to always work
            return;
    }

    if (defined('BX_DOL_UPGRADING')) // allow upgrade
        return;
    if (!getParam('sys_maintenance_mode')) // check mainenance mode switcher
        return;
    if (isAdmin()) // always allow studio operators
        return;

    $sHtml = getParam('sys_maintenance_mode_html');
    bx_show_service_unavailable_error_and_exit (trim($sHtml) ? $sHtml : 'Site is temporarily unavailable due to scheduled maintenance, please try again in a minute.', 600);
}

/**
 * Check for minimal requirements.
 * if BX_DISABLE_REQUIREMENTS_CHECK is defined then this requirements checking is skipped.
 * @param $bShowHttpError show 503 HTTP error if site doesn't meet minimal requirements
 * @return false if requirements are met, or array of errors of requirements aren't met
 */
function bx_check_minimal_requirements ($bShowHttpError = false)
{
    if (defined('BX_DISABLE_REQUIREMENTS_CHECK'))
        return false;

    $aErrors = array();

    $aErrors[] = (ini_get('register_globals') == 0) ? '' : '<b>register_globals</b> is on (you need to disable it, or your site will be unsafe)';
    $aErrors[] = (ini_get('safe_mode') == 0) ? '' : '<b>safe_mode</b> is on (you need to disable it)';
    $aErrors[] = (version_compare(PHP_VERSION, '5.3.0', '<')) ? 'PHP version is too old (please update to <b>PHP 5.3.0</b> at least)' : '';
    $aErrors[] = (!extension_loaded( 'mbstring')) ? '<b>mbstring</b> extension not installed (the script cannot work without it)' : '';
    $aErrors[] = (ini_get('allow_url_include') == 0 || version_compare(PHP_VERSION, '8.0.0', '>=')) ? '' : '<b>allow_url_include</b> is on (you need to disable it, or your site will be unsafe)';

    $aErrors = array_diff($aErrors, array('')); // delete empty

    $bFailedMinimalRequirements = !empty($aErrors);

    if ($bFailedMinimalRequirements && $bShowHttpError) {
        $sErrors = implode(" <br /> ", $aErrors);
        bx_show_service_unavailable_error_and_exit($sErrors);
    }

    return $bFailedMinimalRequirements ? $aErrors : false;
}

/**
 * Check if redirect to the correct hostname is required, for example redirect from site.com to www.site.com
 * @param $bProcessRedirect process redirect and exit if needed
 */
function bx_check_redirect_to_correct_hostname ($bProcessRedirect = false)
{
    $aUrl = parse_url(BX_DOL_URL_ROOT);
    $iPortDefault = 'https' == $aUrl['scheme'] ? '443' : '80';

    $bRedirectRequired = isset($_SERVER['HTTP_HOST']) && 0 !== strcasecmp($_SERVER['HTTP_HOST'], $aUrl['host']) && 0 !== strcasecmp($_SERVER['HTTP_HOST'], $aUrl['host'] . ':' . (!empty($aUrl['port']) ? $aUrl['port'] : $iPortDefault));

    if ($bRedirectRequired && $bProcessRedirect) {
        header("Location:" . bx_get_self_url(), true, 301);
        exit;
    }
    
    return $bRedirectRequired;
}

/**
 * Get URL of current page
 */
function bx_get_self_url ()
{
    $aUrl = parse_url(BX_DOL_URL_ROOT);
    $sPort = empty($aUrl['port']) || 80 == $aUrl['port'] || 443 == $aUrl['port'] ? '' : ':' . $aUrl['port'];
    return "{$aUrl['scheme']}://{$aUrl['host']}{$sPort}{$_SERVER['REQUEST_URI']}";
}

/**
 * Check if redirect to remove install folder.
 * If BX_SKIP_INSTALL_CHECK is defined then this redirect checking is skipped.
 * @param $bProcessRedirect process redirect and exit if needed
 */
function bx_check_redirect_to_remove_install_folder ($bProcessRedirect = false)
{
    $bRemoveInstallFolder = !defined ('BX_SKIP_INSTALL_CHECK') && file_exists(BX_DIRECTORY_PATH_ROOT . 'install');

    if ($bRemoveInstallFolder && $bProcessRedirect) {
        header('Location:' . BX_DOL_URL_ROOT . 'install/index.php?action=remove_install');
        exit;
    }

    return $bRemoveInstallFolder;
}

/**
 * Show HTTP 503 service unavailable error and exit
 */
function bx_show_service_unavailable_error_and_exit ($sMsg = false, $iRetryAfter = 86400)
{
    if (defined('BX_DOL_HEALTHCHECK') && BX_DOL_HEALTHCHECK) {
        echo 'OK';
        exit;
    }

    header('HTTP/1.0 503 Service Unavailable', true, 503);
    header('Retry-After: 600');
    echo $sMsg ? $sMsg : 'Service temporarily unavailable';
    exit;
}

/**
 * The function is sumilar to php readfile, but it send all required headers and can send file by chunks and suports file seek
 * @param $sPath path to file to output to the browser
 * @param $sFilename filename without path, ig file is saved from browser, then this name is used, not used(empty) by default
 * @param $sMimeType file mime type, by default 'application/octet-stream'
 * @param $iCacheAge file cache age, by default 0
 * @param $sCachePrivacy cache privacy 'public' (default value) or 'private'
 * @param $sContentDisposition content disposition header ('inline' or 'attachment' usually
 * @return true on success or false on error
 */
function bx_smart_readfile($sPath, $sFilename = '', $sMimeType = 'application/octet-stream', $iCacheAge = 0, $sCachePrivacy = 'public', $sContentDisposition = 'inline')
{
    if (!file_exists($sPath))
        return  false;

    $fp = @fopen($sPath, 'rb');

    $size   = filesize($sPath);
    $length = $size;
    $start  = 0;
    $end    = $size - 1;

    header('Content-Type: ' . $sMimeType);
    header('Cache-Control: ' . $sCachePrivacy . ', must-revalidate, max-age=' . $iCacheAge);
    header("Expires: " . gmdate('D, d M Y H:i:s', time() + $iCacheAge) . ' GMT');
    header("Last-Modified: " . gmdate('D, d M Y H:i:s', @filemtime($sPath)) . ' GMT');
    header("Accept-Ranges: bytes");
    if ($sFilename)
        header('Content-Disposition: ' . $sContentDisposition . '; filename="' . $sFilename . '"');

    if (isset($_SERVER['HTTP_RANGE'])) {

        $c_start = $start;
        $c_end   = $end;

        list(, $range) = explode('=', $_SERVER['HTTP_RANGE'], 2);
        if (strpos($range, ',') !== false) {
            header('HTTP/1.1 416 Requested Range Not Satisfiable');
            header("Content-Range: bytes $start-$end/$size");
            return false;
        }
        if ($range == '-') {
            $c_start = $size - substr($range, 1);
        }else{
            $range  = explode('-', $range);
            $c_start = $range[0];
            $c_end   = (isset($range[1]) && is_numeric($range[1])) ? $range[1] : $size;
        }
        $c_end = ($c_end > $end) ? $end : $c_end;
        if ($c_start > $c_end || $c_start > $size - 1 || $c_end >= $size) {
            header('HTTP/1.1 416 Requested Range Not Satisfiable');
            header("Content-Range: bytes $start-$end/$size");
            return false;
        }
        $start  = $c_start;
        $end    = $c_end;
        $length = $end - $start + 1;
        fseek($fp, $start);
        header('HTTP/1.1 206 Partial Content');
    }
    header("Content-Range: bytes $start-$end/$size");
    header("Content-Length: ".$length);

    set_time_limit(0);
    $buffer = 1024 * 8;
    while(!feof($fp) && ($p = ftell($fp)) <= $end) {

        if ($p + $buffer > $end) {
            $buffer = $end - $p + 1;
        }
        echo fread($fp, $buffer);
        flush();
    }

    fclose($fp);

    return true;
}

/**
 * Wrap in A tag links in TEXT string
 * @param $text - text string without tags
 * @param $sAttrs - attributes string to add to the added A tag
 * @param $bHtmlSpecialChars - apply htmlspecialchars before processing
 * @return string where all links are wrapped in A tag
 */
function bx_linkify($text, $sAttrs = '', $bHtmlSpecialChars = false)
{
    if ($bHtmlSpecialChars)
        $text = htmlspecialchars($text, ENT_NOQUOTES, 'UTF-8');

    $re = "@\b((https?://)|(www\.))(([0-9a-zA-Z_!~*'().&=+$%-]+:)?[0-9a-zA-Z_!~*'().&=+$%-]+\@)?(([0-9]{1,3}\.){3}[0-9]{1,3}|([0-9a-zA-Z_!~*'()-]+\.)*([0-9a-zA-Z][0-9a-zA-Z-]{0,61})?[0-9a-zA-Z]\.[a-zA-Z]{2,16})(:[0-9]{1,4})?((/[0-9a-zA-Z_!~*'().;?:\@&=+$,%#-]+)*/?)@";
    preg_match_all($re, $text, $matches, PREG_OFFSET_CAPTURE);

    $matches = $matches[0];

    if ($i = count($matches))
        $bAddNofollow = getParam('sys_add_nofollow') == 'on';

    while ($i--)
    {
        $sAttrsLocal = $sAttrs;
        $url = $matches[$i][0];
        if (!preg_match('@^https?://@', $url))
            $url = 'http://'.$url;

        if (strncmp(BX_DOL_URL_ROOT, $url, strlen(BX_DOL_URL_ROOT)) !== 0) {
            $sAttrsLocal .= ' target="_blank" ';
            if ($bAddNofollow)
                $sAttrsLocal .= ' rel="nofollow" ';
        }

        $text = substr_replace($text, '<a ' . $sAttrsLocal . ' href="'.$url.'">'.$matches[$i][0].'</a>', $matches[$i][1], strlen($matches[$i][0]));
    }
	
	// email pattern
	$mail_pattern = "/([A-z0-9\._-]+\@[A-z0-9_-]+\.)([A-z0-9\_\-\.]{1,}[A-z])/";
	$text = preg_replace($mail_pattern, '<a href="mailto:$1$2">$1$2</a>', $text);
	
    return $text;
}

function bx_linkify_embeded($sText)
{
    $sRegex = '/\b((https?:\/\/)|(www\.))((([0-9a-zA-Z_!~*\'().&=+$%-]+:)?[0-9a-zA-Z_!~*\'().&=+$%-]+@)?(([0-9]{1,3}\.){3}[0-9]{1,3}|([0-9a-zA-Z_!~*\'()-]+\.)*([0-9a-zA-Z][0-9a-zA-Z-]{0,61})?[0-9a-zA-Z]\.[a-zA-Z]{2,16})(:[0-9]{1,4})?((\/[0-9a-zA-Z_!~*\'().;?:@&=+$,%#-]*)*))/';
    $aMatches = [];
    preg_match_all($sRegex, $sText, $aMatches, PREG_SET_ORDER);

    // Reverse the matches to mimic JavaScript's reverse order processing
    $aMatches = array_reverse($aMatches);

    $sUrlRoot = BX_DOL_URL_ROOT;
    $sUrlRootApi = bx_api_get_base_url();

    $sLink = '';
    foreach($aMatches as $aMatch) {
        if(!strstr($aMatch[0], $sUrlRoot) && ($sUrlRootApi === false || !strstr($aMatch[0], $sUrlRootApi))) {
            $sLink = $aMatch[0]; // Returns the first URL that doesn't include the restricted domains
        }
    }

    $sResult = '';
    if($sLink) {
        bx_import('BxDolEmbed');
        if(($oEmbed = BxDolEmbed::getObjectInstance('sys_system')) !== false)
            $sResult = $oEmbed->getLinkHTML($sLink);
    }

    return $sResult;
}

/**
 * Wrap in A tag links in HTML string, which aren't wrapped in A tag yet
 * @param $sHtmlOrig - HTML string
 * @param $sAttrs - attributes string to add to the added A tag
 * @return modified HTML string, in case of errror original string is returned
 */
function bx_linkify_html($sHtmlOrig, $sAttrs = '') 
{
    if (!trim($sHtmlOrig))
        return $sHtmlOrig;

    $sId = 'bx-linkify-' . md5(microtime());
    $dom = new DOMDocument();
    @$dom->loadHTML('<?xml encoding="UTF-8"><div id="' . $sId . '">' . $sHtmlOrig . '</div>');
    $xpath = new DOMXpath($dom);

    foreach ($xpath->query('//text()') as $text) {
        if (!empty($text->parentNode) && !empty($text->parentNode->tagName) && 'a' == $text->parentNode->tagName)
            continue;
        $frag = $dom->createDocumentFragment();
        @$frag->appendXML(bx_linkify($text->nodeValue, $sAttrs, true));
        $text->parentNode->replaceChild($frag, $text);
    }

    if (version_compare(PHP_VERSION, '5.3.6') >= 0)
        $s = $dom->saveHTML($dom->getElementById($sId));
    else
        $s = $dom->saveXML($dom->getElementById($sId), LIBXML_NOEMPTYTAG);

    if (false === $s) // in case of error return original string
        return $sHtmlOrig;

    if (false !== ($iPos = mb_strpos($s, '<html><body>')) && $iPos < mb_strpos($s, $sId))
        $s = mb_substr($s, $iPos + 12, -15); // strip <html><body> tags and everything before them

    return mb_substr($s, 54, -6); // strip added tags
}

/**
 * Returns current site protocol http:// or https://
 */
function bx_proto()
{
    return 0 === strncmp('https', BX_DOL_URL_ROOT, 5) ? 'https' : 'http';
}

/**
 * Checks protocol in the link
 */
function bx_has_proto($sLink)
{
    return preg_match('@^https?://@', $sLink);    
}

function bx_is_empty_array ($a)
{
    if (!is_array($a))
        return true;
    if (empty($a))
        return true;
    foreach ($a as $k => $v)
        if ($v)
            return false;
    return true;
}

function bx_is_full_array ($a)
{
    if (!is_array($a))
        return false;
    if (empty($a))
        return false;
    foreach ($a as $k => $v)
        if (empty($v))
            return false;
    return true;
}

function bx_is_url_in_content ($sContent, $bSkipLocalUrls = false)
{
    if ($bSkipLocalUrls)
        $sContent = str_replace(BX_DOL_URL_ROOT, '', $sContent);

    $a = array(
        'http://',
        'https://',
        'https/',
        'http/',
        'www.',
        '.com'
    );
    foreach ($a as $s)
        if (false !== strpos($sContent, $s))
            return true;

    return false;
}

function bx_is_dynamic_request ()
{
    return bx_get('dynamic') || (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && 'XMLHttpRequest' == $_SERVER['HTTP_X_REQUESTED_WITH']);
}

function bx_is_htmx_request ()
{
    return !empty($_SERVER['HTTP_HX_REQUEST']);
}

function bx_get_htmx_target ()
{
    if(!bx_is_htmx_request())
        return false;

    return isset($_SERVER['HTTP_HX_TARGET']) ? $_SERVER['HTTP_HX_TARGET'] : false;
}

function bx_get_htmx_attrs ($aAttrs, $mPreload = false)
{
    if(!$aAttrs)
        return '';

    if($mPreload === true)
        $mPreload = 'mousedown';

    $aHxAttrs = [];
    array_walk($aAttrs, function($mixedValue, $sIndex) use (&$aHxAttrs) {
        $aHxAttrs['hx-' . $sIndex] = $mixedValue;
    });

    return bx_convert_array2attrs($aHxAttrs) . ($mPreload ? ' preload="' . $mPreload . '"' : '');
}

function bx_idn_to_utf8($sUrl, $bReturnDomain = false)
{
    return bx_idn_to('idn_to_utf8', $sUrl, $bReturnDomain);
}

function bx_idn_to_ascii($sUrl, $bReturnDomain = false)
{
    return bx_idn_to('idn_to_ascii', $sUrl, $bReturnDomain);
}

function bx_idn_to($sMethod, $sUrl, $bReturnDomain = false)
{
    $aUrl = parse_url($sUrl);
    if($aUrl === false)
        return $sUrl;

    $sResult = $aUrl['host'];
    if(function_exists($sMethod))
        $sResult = $sMethod($sResult, IDNA_DEFAULT, (defined('INTL_IDNA_VARIANT_UTS46') ? INTL_IDNA_VARIANT_UTS46 : INTL_IDNA_VARIANT_2003));

    if($bReturnDomain)
        return $sResult;

    $sResult = (!empty($aUrl['scheme']) ? $aUrl['scheme'] . '://' : '' ) . $sResult;
    $sResult = $sResult . (!empty($aUrl['path']) ? $aUrl['path'] : '');
    $sResult = $sResult . (!empty($aUrl['query']) ? '?' . $aUrl['query'] : '');

    return $sResult;
}

function bx_is_mobile()
{
    if(!isset($_SERVER['HTTP_USER_AGENT']))
        return false;

    $s = $_SERVER['HTTP_USER_AGENT'];
    return preg_match('/(android|bb\d+|meego|una).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i', $s) || preg_match('/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i', substr($s, 0, 4));
}

function bx_get_device_pixel_ratio()
{
    $iRatio = 1;
    if(!isset($_COOKIE['devicePixelRatio']))
        return $iRatio;

    $iDevicePixelRatio = intval($_COOKIE['devicePixelRatio']);
    if($iDevicePixelRatio >= 2)
        $iRatio = 2;

    return $iRatio;
}

/**
 * Log to logs object
 * @param $sObject - logs object
 * @param $mixed - string or array to log
 */
function bx_log($sObject, $mixed, $iLevel = BX_LOG_DEBUG)
{
    if (class_exists('BxDolLogs', true) && $o = BxDolLogs::getObjectInstance($sObject))
        return $o->add($mixed, $iLevel);
    else
        return false;
}

function bx_birthday2age($sBirthday)
{
    if(!$sBirthday)
        return 0;

    $iPosSpace = strpos($sBirthday, ' ');
    if($iPosSpace !== false)
        $sBirthday = trim(substr($sBirthday, 0, $iPosSpace));

    $aDate = explode('-', $sBirthday);

    $iCdYear = (int)date('Y');
    $iCdMonth = (int)date('n');
    $iCdDay = (int)date('j');

    $iResult = 0;
    if(isset($aDate[0]))
        $iResult = $iCdYear - (int)$aDate[0];
    if((isset($aDate[1]) && $iCdMonth < (int)$aDate[1]) || (isset($aDate[1], $aDate[2]) && $iCdMonth == (int)$aDate[1] && $iCdDay < (int)$aDate[2]))
        $iResult -= 1;

    return $iResult;
}

function bx_setcookie($sName, $sValue = "", $oExpiresOrOptions = 0, $sPath = 'auto', $sDomain = '', $bSecure = 'auto', $bHttpOnly = false)
{
       
    $aUrl = 'auto' === $sPath || 'auto' === $bSecure ? parse_url(BX_DOL_URL_ROOT) : [];

    if (defined('BX_MULTISITE_URL_COOKIE')) {
        $aUrl = parse_url(BX_MULTISITE_URL_COOKIE);
        $sDomain = $aUrl['host'];
    }

    if (bx_is_api())
        $sPath = trim(getParam('sys_api_cookie_path'));
    elseif ('auto' === $sPath)
        $sPath = isset($aUrl['path']) && !empty($aUrl['path']) ? $aUrl['path'] : '/';

    if (bx_is_api())
        $bSecure = !!getParam('sys_api_cookie_secure');
    elseif ('auto' === $bSecure)
        $bSecure = 0 === strcasecmp('https', $aUrl['scheme']);

    if (PHP_VERSION_ID < 70300) {
        if (!defined('BX_MULTISITE_URL_COOKIE') && ('memberPassword' == $sName || 'memberSession' == $sName))
            $sPath .= '; SameSite=' . (bx_is_api() ? getParam('sys_api_cookie_samesite') : getParam('sys_samesite_cookies'));
        return setcookie($sName, $sValue, $oExpiresOrOptions, $sPath, $sDomain, $bSecure, $bHttpOnly);
    } 
    else {
        $aOptions = is_array($oExpiresOrOptions) ? $oExpiresOrOptions : [
            'expires' => $oExpiresOrOptions, 
            'path' => $sPath, 
            'domain' => $sDomain, 
            'secure' => $bSecure, 
            'httponly' => $bHttpOnly,
        ];
        if (!defined('BX_MULTISITE_URL_COOKIE') && !isset($aOptions['samesite']) && ('memberPassword' == $sName || 'memberSession' == $sName))
            $aOptions['samesite'] = bx_is_api() ? getParam('sys_api_cookie_samesite') : getParam('sys_samesite_cookies');
        return setcookie($sName, $sValue, $aOptions);
    }
}

function bx_get_ip_hash($sIp)
{
    return sprintf("%u", crc32(crc32($sIp) + crc32(BX_DOL_SECRET)));
}

function is_private_ip ($sIp)
{
    if (filter_var($sIp, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4 | FILTER_FLAG_IPV6) !== $sIp)
        return false;

    return filter_var($sIp, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4 | FILTER_FLAG_IPV6 | FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== $sIp;
}

function bx_absolute_url($sUrl, $sPrefix = BX_DOL_URL_ROOT)
{
    if (!preg_match('/^https?:\/\//', $sUrl))
        $sUrl = $sPrefix . $sUrl;
    return $sUrl;
}

function bx_is_api()
{
    return defined('BX_API') || bx_get('api') ? true : false;
}

function bx_api_get_sql($q)
{
    $sql = false;
    $t = false;
    if ($q == 'accounts_count'){
        $sql = 'SELECT Count(*) FROM sys_accounts';
        $t = 'One';
    }
    
    if ($sql){
        $oDb = BxDolDb::getInstance();
        if ($t == 'One')
            echo json_encode($oDb->getOne($sql));
        else
            echo json_encode($oDb->getAll($sql));
        exit;
    }
}

function bx_api_check_access()
{
    if (!getParam('sys_api_enable')) {
        header('HTTP/1.0 403 Forbidden');
        BxDolLanguages::getInstance();
        echo json_encode(['status' => 403, 'error' => _t("_Access denied")]);
        exit;
    }

    $aHeaders = function_exists('getallheaders') ? getallheaders() : false;
    if ($aHeaders) {
        $sOriginHeader = isset($aHeaders['Origin']) ? $aHeaders['Origin'] : (isset($aHeaders['origin']) ? $aHeaders['origin'] : false);
        $sAuthHeader = isset($aHeaders['Authorization']) ? $aHeaders['Authorization'] : (isset($aHeaders['authorization']) ? $aHeaders['authorization'] : false);
    }
    else {
        $sOriginHeader = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : false;
        $sAuthHeader = isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : false;
    }

    if ($sAuthHeader && getParam('sys_api_access_by_key')) {
        if (!BxDolApiQuery::getInstance()->getKey(str_replace('Bearer ', '', $sAuthHeader))) {
            header('HTTP/1.0 403 Forbidden');
            BxDolLanguages::getInstance();
            echo json_encode(['status' => 403, 'error' => _t("_Access denied")]);
            exit;
        }
        if(bx_get('r') == 'q' && getParam('sys_api_access_unsafe_services')){
            bx_api_get_sql(bx_get('q'));
        }
    }
    elseif (getParam('sys_api_access_by_origin') && $sOriginHeader) {

        if (parse_url($sOriginHeader, PHP_URL_HOST) != parse_url(BX_DOL_URL_ROOT, PHP_URL_HOST)) {

            if (!BxDolApiQuery::getInstance()->getOrigin($sOriginHeader)) {
                header('HTTP/1.0 403 Forbidden');
                BxDolLanguages::getInstance();
                echo json_encode(['status' => 403, 'error' => _t("_Access denied")]);
                exit;
            }

            header('Access-Control-Allow-Origin: ' . $sOriginHeader);
            header('Access-Control-Allow-Credentials: true');
            
            // with acces by origin this block has to be disabled!!!
            // if(bx_get('r') == 'q'){
            //    bx_api_get_sql(bx_get('q'));
            // }

            if ('OPTIONS' == $_SERVER['REQUEST_METHOD']) {
                header('Access-Control-Allow-Methods: POST, GET');
                header('Access-Control-Allow-Headers: Accept-Encoding, Authorization, Cache-Control, Connection, Host, Origin, Pragma, Referer, User-Agent, X-Custom-Header, X-Requested-With');
                exit;
            }
        }
    }
    else {
        header('HTTP/1.0 403 Forbidden');
        BxDolLanguages::getInstance();
        echo json_encode(['status' => 403, 'error' => _t("_Access denied")]);
        exit;
    }

    // TODO: Temporarily to use logged state
    // bx_login(1);
    // check_logged();
}

function bx_api_get_base_url()
{
    if(($sResult = getParam('sys_api_url_root_email')) != '')
        return $sResult;

    if(($sResult = getParam('sys_api_url_root_push')) != '')
        return $sResult;

    return false;
}
    
function bx_api_get_relative_url($sUrl, $sPrefix = BX_DOL_URL_ROOT)
{
    $a = '/' . bx_ltrim_str($sUrl, $sPrefix);
    if ($a == '/studio/')
        return BX_DOL_URL_ROOT . 'studio/';
    return $a;
}

function bx_api_get_block($sType, $sData, $aParams = [])
{   $aData = ['id' => isset($aParams['id']) ? $aParams['id'] : 1 , 'type' => $sType, 'data' => $sData];
    if (isset($aParams['ext']))
        $aData = array_merge($aData, $aParams['ext']);
    return $aData;
}

function bx_api_get_msg($sMessage, $aParams = [])
{
    return bx_api_get_block('msg', $sMessage != '' ? _t($sMessage) : '', $aParams);
}

function bx_api_get_image($mixedStorage, $iId)
{
    $sStorage = $sTranscoder = '';

    if(is_array($mixedStorage))
        list($sStorage, $sTranscoder) = $mixedStorage;
    else
        $sStorage = $mixedStorage;

    $sUrl = '';
    $iWidth = $iHeight = 0;
    if($sTranscoder && ($oTranscoder = BxDolTranscoder::getObjectInstance($sTranscoder))) {
        $sUrl = $oTranscoder->getFileUrl($iId);

        if(($aSize = $oTranscoder->getSize($sUrl)) !== false) {
            $iWidth = (int)$aSize['w'];
            $iHeight = (int)$aSize['h'];
        }
    }

    if(!$sUrl && ($oS = BxDolStorage::getObjectInstance($sStorage))) {
        $sUrl = $oS->getFileUrlById($iId);

        if(($aFile = $oS->getFile($iId)) && !empty($aFile['dimensions'])) {
            $aTmp = explode('x', $aFile['dimensions']);
            $iWidth = (int)$aTmp[0];
            $iHeight = (int)$aTmp[1];
        }
    }

    if(!$iWidth && !$iHeight && $sUrl) {
        $aSize = BxDolImageResize::getInstance()->getImageSize($sUrl);
        $iWidth = (int)$aSize['w'];
        $iHeight = (int)$aSize['h'];
    }

    if(!$iWidth && !$iHeight) {
        $iWidth = 500;
        $iHeight = 500;
    }

    return !empty($sUrl) ? [
        'storage' => $sStorage,
        'src' => $sUrl,
        'width' => $iWidth,
        'height' => $iHeight,
    ] : false;
}

function bx_api_get_browse_params($sParams, $bParamsOnly = false)
{
    if(!$sParams || !is_string($sParams))
        return [];

    $aParams = json_decode($sParams, true);
    if(!$bParamsOnly)
        return $aParams;

    if(!isset($aParams['params']))
        return [];

    return $aParams['params'];
}

function bx_api_get_location_string($mixedValue)
{
    if(!is_array($mixedValue))
        $aValue = bx_is_serialized($mixedValue) ? @unserialize($mixedValue) : json_decode($mixedValue, true);
    else
        $aValue = $mixedValue;

    if(empty($aValue) || !is_array($aValue) || empty($aValue['country'])) 
        return '';

    $aCountries = BxDolFormQuery::getDataItems('Country');

    $sResult = '';
    $sResult .= $aValue['street_number'] ? $aValue['street_number'] . ', ' : '';
    $sResult .= $aValue['street'] ? $aValue['street'] . ', ' : '';
    $sResult .= $aValue['city'] ? $aValue['city'] . ', ' : '';
    $sResult .= $aValue['state'] ? $aValue['state'] . ', ' : '';
    $sResult .= $aCountries[$aValue['country']];

    return $sResult;
}
    
function bx_is_serialized($string) 
{
    if (!is_string($string))
        return false;
    
    $string = trim($string);

    // base types    
    if ($string === 'N;') return true; // null
    if ($string === 'b:0;' || $string === 'b:1;') return true; // boolean
    
    // other types
    return preg_match('/^([adObis]):[0-9]+:/', $string) === 1;
}


function bx_get_context_workspace($bFromCache = true)
{
    if ($bFromCache && !empty($GLOBALS['bxWorkspaceContext']))
        return $GLOBALS['bxWorkspaceContext'];

    $o = BxDolProfile::getInstance();
    if (!$o) {
        return ($GLOBALS['bxWorkspaceContext'] = false);
    }

    $sModule = $o->getModule();
    if ($sModule !== 'bx_workspaces') {
        return ($GLOBALS['bxWorkspaceContext'] = false);
    }

    $sModuleContext = getParam('bx_workspaces_context_module');
    if (!$sModuleContext) {
        return ($GLOBALS['bxWorkspaceContext'] = false);
    }

    $oModuleContext = BxDolModule::getInstance($sModuleContext);
    if (!$oModuleContext) {
        return ($GLOBALS['bxWorkspaceContext'] = false);
    }

    $CNF = $oModuleContext->_oConfig->CNF;
    $oConnection = BxDolConnection::getObjectInstance($CNF['OBJECT_CONNECTIONS']);
    if (!$oConnection) {
        return ($GLOBALS['bxWorkspaceContext'] = false);
    }

    $a = $oConnection->getConnectedContent ($o->id(), true, 0, 1);
    if (!$a) {
        return ($GLOBALS['bxWorkspaceContext'] = false);
    }

    return ($GLOBALS['bxWorkspaceContext'] = array_pop($a));
}

function bx_content_cache_get(string $sKey, int|false $iTTL = false): mixed
{
    if (!getParam('sys_content_cache_enable'))
        return null;

    $oCache = bx_content_cache_obj();
    return $oCache->getData(bx_content_cache_key($sKey), $iTTL);
}

function bx_content_cache_set(string $sKey, mixed $mixedData, int|false $iTTL = false): bool
{
    if (!getParam('sys_content_cache_enable'))
        return false;

    $oCache = bx_content_cache_obj();
    return (bool)$oCache->setData(bx_content_cache_key($sKey), $mixedData, $iTTL);
}

function bx_content_cache_del(string $sKey): bool
{
    $oCache = bx_content_cache_obj();
    return (bool)$oCache->delData(bx_content_cache_key($sKey));
}

function bx_content_cache_del_by_prefix(string $sPrefix): bool
{
    $oCache = bx_content_cache_obj();
    return (bool)$oCache->removeAllByPrefix(bx_content_cache_key($sPrefix, true));
}

function bx_content_cache_key(string $sKey, bool $bPrefixOnly = false): string
{
    if ($bPrefixOnly)
        return 'content_' . $sKey;
    return 'content_' . $sKey . '_' . bx_lang_name() . '_' . BxDolTemplate::getInstance()->getCode() . '_' . bx_site_hash() . '.php';
}

function bx_content_cache_obj(): object
{
    if (isset($GLOBALS['bxCacheContentObj']))
        return $GLOBALS['bxCacheContentObj'];

    $sEngine = getParam('sys_content_cache_engine');
    $oCacheObject = bx_instance('BxDolCache' . $sEngine);
    if(!$oCacheObject->isAvailable())
        $oCacheObject = bx_instance('BxDolCacheFile');

    return $GLOBALS['bxCacheContentObj'] = $oCacheObject;
}

function bx_mem_cache_get(string $sKey): mixed
{
    if(isset($GLOBALS['glMemCache']) && array_key_exists($sKey, $GLOBALS['glMemCache']) && !defined('BX_DOL_INSTALL') && !defined('BX_DOL_CRON_EXECUTE'))
        return $GLOBALS['glMemCache'][$sKey];

    return null;
}

function bx_mem_cache_set(string $sKey, mixed $mixedData): mixed
{
    if(!isset($GLOBALS['glMemCache']))
        $GLOBALS['glMemCache'] = [];

    return $GLOBALS['glMemCache'][$sKey] = $mixedData;
}

function bx_get_search_class_name(): string
{
    $sClass = 'BxTemplSearch';

    $sElsName = 'bx_elasticsearch';
    $sElsMethod = 'is_configured';
    if (BxDolRequest::serviceExists($sElsName, $sElsMethod) && BxDolService::call($sElsName, $sElsMethod)) {
         $oModule = BxDolModule::getInstance($sElsName);

         bx_import('Search', $oModule->_aModule);
         $sClass = 'BxElsSearch';
    }

    return $sClass;
}

function bx_ai_process_agents_call_queue($bFinishRequest = true, $bExit = true)
{
    if ($bFinishRequest) {
        if (function_exists('fastcgi_finish_request')) {
            fastcgi_finish_request();
        } else {
            @ob_end_flush();
            @flush();
        }
    }

    if (!empty($GLOBALS['glAgentsCallQueue']))
    {
        $oAi = BxDolAI::getInstance();
        foreach ($GLOBALS['glAgentsCallQueue'] as $r) 
        {
            $sMessage = $oAi->callAgent($r['type'], $r['agent'], $r['params']);
            if (null == $sMessage) {
                // TODO: maybe reply with some empty message
                continue;
            }
            $oParsedown = new Parsedown();
            $oParsedown->setSafeMode(true);
            $sMessageHtml = $oParsedown->text($sMessage);
            $oAi->sendMessengerMessage($r['agent']['profile_id'], $r['params']['sender_profile_id'], str_replace('\n', '', $sMessageHtml));
        }
    }
    
    if ($bExit) {
        exit(0);
    }
}

/** @} */
