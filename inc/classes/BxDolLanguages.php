<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

define('BX_DOL_LANGUAGE_DEFAULT', 'en');

define('BX_DOL_LANGUAGE_DIRECTION_LTR', 'LTR');
define('BX_DOL_LANGUAGE_DIRECTION_RTL', 'RTL');

define('BX_DOL_LANGUAGE_CATEGORY_SYSTEM', 1);
define('BX_DOL_LANGUAGE_CATEGORY_CUSTOM', 2);

class BxDolLanguages extends BxDolFactory implements iBxDolSingleton
{
    protected $oDb;
    protected $sCurrentLanguage;

    protected function __construct()
    {
        if (isset($GLOBALS['bxDolClasses'][get_class($this)]))
            trigger_error ('Multiple instances are not allowed for the class: ' . get_class($this), E_USER_ERROR);

        parent::__construct();

        $this->oDb = BxDolLanguagesQuery::getInstance();
    }

    /**
     * Prevent cloning the instance
     */
    public function __clone()
    {
        if (isset($GLOBALS['bxDolClasses'][get_class($this)]))
            trigger_error('Clone is not allowed for the class: ' . get_class($this), E_USER_ERROR);
    }

    /**
     * Get singleton instance of the class
     */
    static function getInstance()
    {
        if(!isset($GLOBALS['bxDolClasses'][__CLASS__])) {
            $GLOBALS['bxDolClasses'][__CLASS__] = new BxDolLanguages();
            $GLOBALS['bxDolClasses'][__CLASS__]->init();
        }

        return $GLOBALS['bxDolClasses'][__CLASS__];
    }

    function getCurrentLangName($bSetCookie = true)
    {
        $sLang = '';

        if(!$sLang && !empty($_GET['lang']))
            $sLang = $this->tryToGetLang($_GET['lang'], $bSetCookie);

        if(!$sLang && !empty($_POST['lang']))
            $sLang = $this->tryToGetLang($_POST['lang'], $bSetCookie);

        if(!$sLang && !empty($_COOKIE['lang']))
            $sLang = $this->tryToGetLang($_COOKIE['lang']);

        if(!$sLang && !empty($_SERVER['HTTP_ACCEPT_LANGUAGE']))
            $sLang = $this->tryToGetLang($_SERVER['HTTP_ACCEPT_LANGUAGE']);

        if(!$sLang)
            $sLang = $this->tryToGetLang(getParam('lang_default'));

        if(!$sLang)
            $sLang = $this->tryToGetLang(BX_DOL_LANGUAGE_DEFAULT);

        $sLocale = $this->getLangCountryCode($sLang);
        if (!$sLocale)
            $sLocale = $sLang . '_' . strtoupper($sLang);
        
        setlocale(LC_TIME,
            $sLocale . '.utf-8',
            $sLocale . '.utf8',
            $sLang . '.utf-8',
            $sLang . '.utf8',
            $sLang);

        return $sLang;
    }

    function getCurrentLangId()
    {
        return $this->getLangId($this->getCurrentLanguage());
    }

    function getLangId($sLang)
    {
        return $this->oDb->getLanguageId($sLang);
    }

    function getLangName($iLangId)
    {
        return $this->oDb->getLanguageName($iLangId);
    }

    function getLangTitle($iLangId)
    {
        return $this->oDb->getLanguageTitle($iLangId);
    }

    function getLangFlag($sLang = '')
    {
        if (!$sLang)
            $sLang = $this->getCurrentLanguage();

        return $this->oDb->getLanguageFlag($sLang);
    }

    function getLangDirection($sLang = '')
    {
        if (!$sLang)
            $sLang = $this->getCurrentLanguage();

        return strtoupper($this->oDb->getLanguageDirection($sLang));
    }

    function getLangCountryCode($sLang = '')
    {
        if (!$sLang)
            $sLang = $this->getCurrentLanguage();

        return $this->oDb->getLangCountryCode($sLang);
    }
    
    function getDefaultLangName()
    {
        return getParam('lang_default');
    }

    function getLanguages($bIdAsKey = false, $bActiveOnly = false)
    {
        return $this->oDb->getLanguages($bIdAsKey, $bActiveOnly);
    }
    
    function getLanguagesExt($bIdAsKey = false, $bActiveOnly = false)
    {
        $aParams = array('type' => 'all_key_' . ($bIdAsKey ? 'id' : 'name'));
        if($bActiveOnly)
            $aParams['enabled'] = 1;

        $aResults = array();
        $this->oDb->getLanguagesBy($aParams, $aResults, false);
        return $aResults;
    }

    function getLanguageCategory($sName)
    {
        $iId = 0;
        $this->oDb->getCategoriesBy(array('type' => 'id_by_name', 'value' => $sName), $iId);

        return (int)$iId;
    }

    /**
     * It tries to match current language with provided languages array, if nothing is found $sFallbackLanguage is returned.
     * @param $aLangs - array of languages, example: array('ru' => 1, 'kg' => 1);
     * @param $sFallbackLanguage - language to return of nothis is found
     * @return language code string
     */
    function detectLanguageFromArray($aLangs, $sFallbackLanguage = 'en', $bLowercase = false)
    {
        if (isset($aLangs[$GLOBALS['sCurrentLanguage']])) {
            return $GLOBALS['sCurrentLanguage'];
        } 
        elseif ($sLangCountry = $this->getLangCountryCode()) {
            if ($bLowercase)
                $sLangCountry = strtolower($sLangCountry);

            if (isset($aLangs[$sLangCountry]))
                return $sLangCountry;
            
            $sLangCountry = str_replace('_', '-', $sLangCountry);
            if (isset($aLangs[$sLangCountry]))
                return $sLangCountry;            
        }

        return $sFallbackLanguage;
    }

    /**
     * Get current language.
     */
    function getCurrentLanguage()
    {
        return $GLOBALS['sCurrentLanguage'];
    }

    function _t()
    {
        global $LANG;

        $key = func_get_arg(0);
        if(isset($LANG[$key])) {
            $str = $LANG[$key];

            if(($iNumArgs = func_num_args()) > 1)
                for($i = 1; $i < $iNumArgs; $i++)
                    $str = str_replace('{' . ($i - 1) . '}', (string)func_get_arg($i), $str);

            return $str;
        } else
            return $key;
    }

    function _t_err()
    {
        return MsgBox(call_user_func_array(array($this, '_t'), func_get_args()));
    }

    function _t_action()
    {
        return MsgBox(call_user_func_array(array($this, '_t'), func_get_args()));
    }

    function _t_ext($key, $args)
    {
        global $LANG;

        if(isset($LANG[$key])) {
            $str = $LANG[$key];

            if(!is_array($args))
                return str_replace('{0}', $args, $str);

            foreach ($args as $key => $val)
                $str = str_replace('{'.$key.'}', $val, $str);

            return $str;
        } else
            return $key;
    }

    function _t_format_size ($iSize)
    {
        $a = array (
            '_sys_format_size_b'  => 1024,
            '_sys_format_size_kb' => 1024*1024,
            '_sys_format_size_mb' => 1024*1024*1024,
            '_sys_format_size_gb' => 1024*1024*1024*1024,
            '_sys_format_size_tb' => 1024*1024*1024*1024*1024,
        );

        foreach($a as $sKey => $i)
            if ($iSize < $i)
                return $this->_t($sKey, round($iSize / ($i / 1024), 1));

        return $this->_t('_sys_format_size_b', 0);
    }

    function _t_format_duration ($iTime)
    {
        $iTime = (int)$iTime;

        $sFormat = 'i:s';
        if($iTime > 3600)
            $sFormat = 'H:' . $sFormat;

        return date($sFormat, $iTime);
    }

    function _t_format_currency ($fPrice, $iPrecision = 2, $bFormatThousands = true, $sSign = '')
    {
        if(empty($sSign)) {
            $sSign = BxDolPayments::getInstance()->getOption('default_currency_sign');
            if(empty($sSign))
                $sSign = getParam('currency_sign');
        }

        if($bFormatThousands)
            $fPrice = number_format((float)$fPrice, $iPrecision);
        else
            $fPrice = sprintf("%." . $iPrecision . "f", (float)$fPrice);

        return $this->_t('_sys_currency', html_entity_decode($sSign), $fPrice);
    }

    function _t_format_extensions ($mixedExtensions)
    {
        if (!is_array($mixedExtensions))
            $a = explode(',', $mixedExtensions);
        else
            $a = $mixedExtensions;
        if (!$a)
            return '';
        return '.' . implode(', .', $a);
    }

    protected function init()
    {
        /**
         * Trying to initialize default language.
         */
        $GLOBALS['sCurrentLanguage'] = $GLOBALS['bxDolClasses'][__CLASS__]->getCurrentLangName(false);
        if($GLOBALS['sCurrentLanguage'] != '') {
            $sPath = BX_DIRECTORY_PATH_CACHE . 'lang-' . $GLOBALS['sCurrentLanguage'] . '.php';
            if(!file_exists($sPath))
                BxDolStudioLanguagesUtils::getInstance()->compileLanguage();

            require($sPath);

            if($this->getLangDirection($GLOBALS['sCurrentLanguage']) == BX_DOL_LANGUAGE_DIRECTION_RTL)
                BxDolTemplate::getInstance()->addCss('rtl.css');
        }

        /**
         * The second pass only differs when the language comes from the 'lang' request parameter:
         * then it saves that language to the cookie. Otherwise it finds the same language again.
         */
        if(!empty($_GET['lang']) || !empty($_POST['lang']))
            $GLOBALS['bxDolClasses'][__CLASS__]->getCurrentLangName(true);

        if(isset($_GET['lang'])) {
            if(BxDolPermalinks::getInstance()->redirectIfNecessary(array('lang')))
                exit;
        }
    }

    protected function tryToGetLang($sLangs, $bSetCookie = false)
    {
        $sLangs = trim($sLangs);
        if(!$sLangs)
            return '';

        $sLangs = preg_replace( '/[^a-zA-Z0-9,;-]/m', '', $sLangs ); // we do not need 'q=0.3'. we are using live queue :)
        $sLangs = strtolower($sLangs);

        if(!$sLangs)
            return '';

        $aLangs = explode(',', $sLangs); // ru,en-us;q=0.7,en;q=0.3 => array( 'ru' , 'en-us;q=0.7' , 'en;q=0.3' );
        foreach($aLangs as $sLang) {
            if(!$sLang)
                continue;

            list($sLang) = explode(';', $sLang, 2); // en-us;q=0.7 => en-us
            if(!$sLang)
                continue;

            // check with country
            if($this->checkLangExists($sLang)) {
                if( $bSetCookie && (!isset($_COOKIE['lang']) || $_COOKIE['lang'] != $sLang) && (!isset($GLOBALS['glLangSet']) || $GLOBALS['glLangSet'] != $sLang)) {
                    $this->setLangCookie( $sLang );
                    $GLOBALS['glLangSet'] = $sLang;
                }
                return $sLang;
            }

            //drop country
            if(strpos($sLang, '-') === false)
                continue;

            list($sLang, $sCntr) = explode('-', $sLang, 2); // en-us => en
            if(!$sLang or !$sCntr)
                continue; //no lang or nothing changed

            //check again. without country
            if($this->checkLangExists($sLang)) {
                if($bSetCookie)
                    $this->setLangCookie($sLang);
                return $sLang;
            }
        }
        return '';
    }
    protected function checkLangExists( $sLang )
    {
        if(!preg_match('/^[A-Za-z0-9_-]+$/', $sLang))
            return false;

        $iLangId = $this->oDb->getLanguageId($sLang, false);
        if(!$iLangId)
            return false;

        if(file_exists( BX_DIRECTORY_PATH_CACHE . "lang-{$sLang}.php"))
            return true;

        if(BxDolStudioLanguagesUtils::getInstance()->compileLanguage($iLangId))
            return true;

        return false;
    }

    protected function setLangCookie( $sLang )
    {
        $sLang = bx_process_input($sLang);

        if(isLogged()) {
            $iLangId = $this->oDb->getLanguageId($sLang, false);
            if(!$iLangId)
                $iLangId = 0;

            $iAccountId = getLoggedId();
            $oAccountQuery = BxDolAccountQuery::getInstance();
            $oAccountQuery->updateLanguage($iAccountId, $iLangId);
        }

        bx_setcookie('lang', '',     time() - 60*60*24);
        bx_setcookie('lang', $sLang, time() + 60*60*24*365);
    }
}

if (!function_exists('_t')) {
    function _t()
    {
        return call_user_func_array(array(BxDolLanguages::getInstance(), '_t'), func_get_args());
    }
}

function _t_err()
{
    return call_user_func_array(array(BxDolLanguages::getInstance(), '_t_err'), func_get_args());
}

function _t_action()
{
    return call_user_func_array(array(BxDolLanguages::getInstance(), '_t_action'), func_get_args());
}

function _t_ext($key, $args)
{
    return BxDolLanguages::getInstance()->_t_ext($key, $args);
}

function _t_format_size($iSize)
{
    return BxDolLanguages::getInstance()->_t_format_size($iSize);
}

function _t_format_duration($iTime)
{
    return BxDolLanguages::getInstance()->_t_format_duration($iTime);
}

function _t_format_currency($fPrice, $iPrecision = 2, $bFormatThousands = true)
{
    return BxDolLanguages::getInstance()->_t_format_currency($fPrice, $iPrecision, $bFormatThousands);
}

function _t_format_currency_ext($fPrice, $aParams = [])
{
    $sSign = isset($aParams['sign']) ? $aParams['sign'] : '';
    $iPrecision = isset($aParams['precision']) ? (int)$aParams['precision'] : 2;
    $bFormatThousands = isset($aParams['format_thousands']) ? $aParams['format_thousands'] : true;

    return BxDolLanguages::getInstance()->_t_format_currency($fPrice, $iPrecision, $bFormatThousands, $sSign);
}

function _t_format_extensions($mixedExtensions)
{
    return BxDolLanguages::getInstance()->_t_format_extensions($mixedExtensions);
}

function bx_lang_name()
{
    return BxDolLanguages::getInstance()->getCurrentLanguage();
}

function bx_lang_code()
{
    $sResult = bx_lang_name();
    if(strpos($sResult, '-') !== false)
        list($sResult) = explode('-', $sResult);

    return $sResult;
}

function bx_lang_code_with_country()
{
    $oLanguages = BxDolLanguages::getInstance();

    $sName = $oLanguages->getCurrentLanguage();
    $sCountry = '';
    if(strpos($sName, '-') !== false)
        list($sName, $sCountry) = explode('-', $sName);

    if(($sCountryDb = $oLanguages->getLangCountryCode()))
        $sCountry = $sCountryDb;

    return $sName . ($sCountry ? '-' . $sCountry : '');
}

function bx_lang_country()
{
    $oLanguages = BxDolLanguages::getInstance();

    if(($sCountryDb = $oLanguages->getLangCountryCode()))
        return $sCountryDb;

    $sResult = $oLanguages->getCurrentLanguage();
    if(strpos($sResult, '-') !== false)
        list($sCode, $sResult) = explode('-', $sResult);

    return $sResult;
}

function bx_lang_direction($sLanguage = '')
{
    return BxDolLanguages::getInstance()->getLangDirection($sLanguage);
}

/** @} */
