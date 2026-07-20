<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

require_once(BX_DOL_DIR_STUDIO_INC . 'utils.inc.php');

define('BX_DOL_STUDIO_MT_LEFT', 'left');
define('BX_DOL_STUDIO_MT_CENTER', 'center');
define('BX_DOL_STUDIO_MT_RIGHT', 'right');

define('BX_DOL_STUDIO_MTB_CIRCLE', 'circ');
define('BX_DOL_STUDIO_MTB_RECTANGLE', 'rect');

class BxDolStudioMenuTop extends BxDol implements iBxDolSingleton
{
    public static $sHistorySessionKey = 'sys_studio_history';
    public static $iHistoryLength = 5;
    public static $iToolbarLength = 10;

    protected $sPageName;
    protected $aItems;
    protected $aVisible;
    protected $aSelected;

    public function __construct()
    {
        if (isset($GLOBALS['bxDolClasses'][get_class($this)]))
            trigger_error ('Multiple instances are not allowed for the class: ' . get_class($this), E_USER_ERROR);

        parent::__construct();

        $this->sPageName = '';

        $this->aVisible = array(
            BX_DOL_STUDIO_MT_LEFT => getParam('sys_std_show_header_left') == 'on',
            BX_DOL_STUDIO_MT_CENTER => getParam('sys_std_show_header_center') == 'on',
            BX_DOL_STUDIO_MT_RIGHT => getParam('sys_std_show_header_right') == 'on',
        );

        $this->aSelected = array(
            BX_DOL_STUDIO_MT_LEFT => '',
            BX_DOL_STUDIO_MT_CENTER => '',
            BX_DOL_STUDIO_MT_RIGHT => ''
        );

        $this->aItems = array(
            BX_DOL_STUDIO_MT_LEFT => '',
            BX_DOL_STUDIO_MT_CENTER => '',
            BX_DOL_STUDIO_MT_RIGHT => ''
        );

        $this->aItems[BX_DOL_STUDIO_MT_LEFT] = BxTemplStudioFunctions::getInstance()->getLogo();

        $this->aItems[BX_DOL_STUDIO_MT_CENTER] = [
            'template' => 'menu_top_center.html',
            'menu_items' => []
        ];

        $this->aItems[BX_DOL_STUDIO_MT_CENTER]['menu_items'] = [];
        if(!$this->aVisible[BX_DOL_STUDIO_MT_LEFT])
            $this->aItems[BX_DOL_STUDIO_MT_CENTER]['menu_items']['launcher'] = [
                'name' => 'launcher',
                'icon' => 'wi-home.svg',
                'link' => '{url_studio}',
                'title' => '_adm_tmi_cpt_launcher'
            ];

        //--- Get Featured
        $aMenuItems = array();
        $oRolesUtils = BxDolStudioRolesUtils::getInstance();
        $oWidgetsDb = BxDolStudioWidgetsQuery::getInstance();

        $aFeatured = $oWidgetsDb->getWidgets(array('type' => 'all_featured', 'featured' => 1));
        foreach($aFeatured as $aItem)
            if(empty($aItem['type']) || $oRolesUtils->isActionAllowed('use ' . $aItem['type']))
                $aMenuItems[$aItem['page_name']] = array(
                    'class' => 'bx-menu-item-static',
                    'name' => $aItem['page_name'],
                    'icon' => $aItem['icon'],
                    'link' => $aItem['url'],
                    'onclick' => $aItem['click'],
                    'title' => $aItem['caption']
                );

        //--- Get Bookmarks
        $aBookmarks = $oWidgetsDb->getWidgets(array('type' => 'all_bookmarks', 'bookmark' => 1, 'profile_id' => bx_get_logged_profile_id()));
        foreach($aBookmarks as $aBookmark) {
            if(array_key_exists($aBookmark['page_name'], $aMenuItems))
                continue;
            
            if(!empty($aBookmark['type']) && !$oRolesUtils->isActionAllowed('use ' . $aBookmark['type']))
                continue;

            $aMenuItems[$aBookmark['page_name']] = array(
                'class' => 'bx-menu-item-static',
                'name' => $aBookmark['page_name'],
                'icon' => $aBookmark['icon'],
                'link' => $aBookmark['url'],
                'onclick' => $aBookmark['click'],
                'title' => $aBookmark['caption']
            );
        }

        $aMenuItems['divider'] = [
            'class' => 'bx-menu-item-divider',
            'name' => 'divider',
            'icon' => '',
            'link' => '',
            'onclick' => '',
            'title' => ''
        ];
        
        //--- Get History
        $aHistory = self::historyGetList();
        if(!empty($aHistory) && is_array($aHistory))
            foreach($aHistory as $sPageName => $aMenuItem) {
                if(array_key_exists($sPageName, $aMenuItems))
                    continue;

                $aMenuItem['class'] = 'bx-menu-item-dynamic';
                $aMenuItems[$sPageName] = $aMenuItem;
            }

        if(!empty($aMenuItems) && is_array($aMenuItems)) {
            if(count($aMenuItems) > BxTemplStudioMenuTop::$iToolbarLength)
                $aMenuItems = array_slice($aMenuItems, 0, BxTemplStudioMenuTop::$iToolbarLength);

            if(($sKey = 'launcher') && isset($this->aItems[BX_DOL_STUDIO_MT_CENTER]['menu_items'][$sKey]))
                $this->aItems[BX_DOL_STUDIO_MT_CENTER]['menu_items'] = bx_array_insert_after($aMenuItems, $this->aItems[BX_DOL_STUDIO_MT_CENTER]['menu_items'], $sKey);
            else 
                $this->aItems[BX_DOL_STUDIO_MT_CENTER]['menu_items'] = $aMenuItems;
        }
    }

    public static function getInstance()
    {
        if (!isset($GLOBALS['bxDolClasses']['BxBaseStudioMenuTop']))
            $GLOBALS['bxDolClasses']['BxBaseStudioMenuTop'] = new BxTemplStudioMenuTop();

        return $GLOBALS['bxDolClasses']['BxBaseStudioMenuTop'];
    }

    public static function historyGetList()
    {
        $aHistory = BxDolSession::getInstance()->getValue(self::$sHistorySessionKey);
        if(empty($aHistory) || !is_array($aHistory))
            return array();

        if(count($aHistory) > BxTemplStudioMenuTop::$iHistoryLength)
            $aHistory = array_slice($aHistory, -BxTemplStudioMenuTop::$iHistoryLength);

        return array_reverse($aHistory);
    }
    
    public static function historyAdd($aPage)
    {
        $oSession = BxDolSession::getInstance();
        $aHistory = $oSession->getValue(self::$sHistorySessionKey);
        if(!empty($aHistory) && isset($aHistory[$aPage['name']]))
            return;

        if (!is_array($aHistory))
            $aHistory = [];
        $aHistory[$aPage['name']] = array(
            'name' => $aPage['name'],
            'icon' => $aPage['wid_icon'],
            'link' => $aPage['wid_url'],
            'onclick' => $aPage['wid_click'],
            'title' => $aPage['wid_caption']
        );
        if(count($aHistory) > BxTemplStudioMenuTop::$iHistoryLength)
            $aHistory = array_slice($aHistory, -BxTemplStudioMenuTop::$iHistoryLength);
        $oSession->setValue(self::$sHistorySessionKey, $aHistory);
    }

    public static function historyDelete($mixedPage)
    {
        if(is_array($mixedPage)) {
            if(!isset($mixedPage['name']))
                return;

            $mixedPage = $mixedPage['name'];
        }

        $oSession = BxDolSession::getInstance();
        $aHistory = $oSession->getValue(self::$sHistorySessionKey);
        if(empty($aHistory) || !isset($aHistory[$mixedPage]))
            return;

        unset($aHistory[$mixedPage]);
        $oSession->setValue(self::$sHistorySessionKey, $aHistory);
    }

    public function setPageName($sName)
    {
        $this->sPageName = $sName;
    }

    public function setContent($sPosition, $mixedContent)
    {
        $this->aItems[$sPosition] = $mixedContent;
    }

    public function setSelected($sPosition, $sValue)
    {
        if(!isset($this->aItems[$sPosition]['menu_items'][$sValue]))
            return;

        $this->aItems[$sPosition]['menu_items'][$sValue]['selected'] = true;
    }

    public function setVisible($sPosition, $bValue = true)
    {
        $this->aVisible[$sPosition] = $bValue;
    }

    public function setVisibleAll($bValue = true)
    {
        $this->aVisible = array(
            BX_DOL_STUDIO_MT_LEFT => $bValue,
            BX_DOL_STUDIO_MT_CENTER => $bValue,
            BX_DOL_STUDIO_MT_RIGHT => $bValue
        );
    }
}

/** @} */
