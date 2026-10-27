<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * Calendar objects representation.
 * @see BxDolCalendar
 */
class BxBaseCalendar extends BxDolCalendar
{
    protected $_bJsCssAdded = false;
    protected $_oTemplate;
    protected $_aOptions;

    public function __construct ($aOptions, $oTemplate = null)
    {
        parent::__construct ();        

        if ($oTemplate)
            $this->_oTemplate = $oTemplate;
        else
            $this->_oTemplate = BxDolTemplate::getInstance();

        $oConfig = BxTemplConfig::getInstance();
        
        $aOptionsDefault = array(
            'timeZone' => 'local',
            'eventColor' => $oConfig->aLessConfig['bx-color-active'],
            'eventTextColor' => $oConfig->aLessConfig['bx-font-color-default'],
            'locale' => $this->_getLang(),
        );
        $this->_aOptions = array_merge($aOptionsDefault, $aOptions);
    }

    public function display ($sTemplate = 'calendar.html')
    {
        $this->_addJsCss();
        return $this->_oTemplate->parseHtmlByName($sTemplate, array(
            'id' => 'bx_events_calendar_' . genRndPwd (8, false),
            'options' => json_encode($this->_aOptions),
        ));
    }

    protected function _getLang()
    {
        $aCalendarLangs = array('af' => 1, 'ar-dz' => 1, 'ar-kw' => 1, 'ar-ly' => 1, 'ar-ma' => 1, 'ar-sa' => 1, 'ar-tn' => 1, 'ar' => 1, 'az' => 1, 'bg' => 1, 'bn' => 1, 'bs' => 1, 'ca' => 1, 'cs' => 1, 'cy' => 1, 'da' => 1, 'de-at' => 1, 'de' => 1, 'el' => 1, 'en-au' => 1, 'en-gb' => 1, 'en-nz' => 1, 'eo' => 1, 'es-us' => 1, 'es' => 1, 'et' => 1, 'eu' => 1, 'fa' => 1, 'fi' => 1, 'fr-ca' => 1, 'fr-ch' => 1, 'fr' => 1, 'gl' => 1, 'he' => 1, 'hi' => 1, 'hr' => 1, 'hu' => 1, 'hy-am' => 1, 'id' => 1, 'is' => 1, 'it' => 1, 'ja' => 1, 'ka' => 1, 'kk' => 1, 'km' => 1, 'ko' => 1, 'ku' => 1, 'lb' => 1, 'lt' => 1, 'lv' => 1, 'mk' => 1, 'ms' => 1, 'nb' => 1, 'ne' => 1, 'nl' => 1, 'nn' => 1, 'pl' => 1, 'pt-br' => 1, 'pt' => 1, 'ro' => 1, 'ru' => 1, 'si-lk' => 1, 'sk' => 1, 'sl' => 1, 'sm' => 1, 'sq' => 1, 'sr-cyrl' => 1, 'sr' => 1, 'sv' => 1, 'ta-in' => 1, 'th' => 1, 'tr' => 1, 'ug' => 1, 'uk' => 1, 'uz-cy' => 1, 'uz' => 1, 'vi' => 1, 'zh-cn' => 1, 'zh-tw' => 1);
        return BxDolLanguages::getInstance()->detectLanguageFromArray ($aCalendarLangs, 'en', true);
    }

    /**
     * Add css/js files which are needed for display and functionality.
     */
    protected function _addJsCss()
    {
        if ($this->_bJsCssAdded)
            return;

        $this->_oTemplate->addCss(array(
            BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'fullcalendar/|skeleton.css',
            BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'fullcalendar/|theme.css',
            BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'fullcalendar/|palette.css',
            'fullcalendar.css',
        ));
        
        $sCalendarLang = $this->_getLang();
            
        $this->_oTemplate->addJs(array(
            'fullcalendar/index.global.min.js',
            'fullcalendar/locales/' . $sCalendarLang . '.global.min.js',
        ));
        
        $this->_bJsCssAdded = true;
    }    
}

/** @} */
