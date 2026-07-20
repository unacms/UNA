<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

require_once(BX_DIRECTORY_PATH_INC . "design.inc.php");

/**
 * Menu representation.
 * @see BxDolMenu
 */
class BxBaseMenu extends BxDolMenu
{
    protected $_oTemplate;
    protected $_iPageType; 
    protected $_aOptionalParams = array('target' => '', 'onclick' => '');
    protected $_bDisplayAddons = false;

    protected $_aSelected; // Selected menu item.

    public function __construct ($aObject, $oTemplate)
    {
        parent::__construct ($aObject);

        if ($oTemplate)
            $this->_oTemplate = $oTemplate;
        else
            $this->_oTemplate = BxDolTemplate::getInstance();

        $this->_iPageType = false;
        $this->_aSelected = [];
    }

    public function getDisplayAddons()
    {
        return $this->_bDisplayAddons;
    }   

    public function setDisplayAddons($b)
    {
        $bRet = $this->_bDisplayAddons;
        $this->_bDisplayAddons = $b;
        return $bRet;
    }

    /**
     * Get menu code.
     * @return string
     */
    public function getCode ()
    {
        $sMenuTitle = isset($this->_aObject['object']) ? $this->_aObject['object'] : 'Menu-' . rand(0, PHP_INT_MAX);
        if (isset($GLOBALS['bx_profiler']) && $GLOBALS['bx_profiler']->isMenu($sMenuTitle))
            $sMenuTitle .= rand(0, PHP_INT_MAX);
        if (isset($GLOBALS['bx_profiler'])) $GLOBALS['bx_profiler']->beginMenu($sMenuTitle);
        
        $sRet = '';
        $bCacheUsed = false;
        $sCacheKey = '';
        $mixedCache = null;
        // Use cache only if:
        //  - cache mode is set, AND
        //  - it's not disabled (`off`), AND
        //  - it's not "guest cache" while a user is logged in
        if (isset($this->_aObject['cache']) && !($this->_aObject['cache'] == 'off' || ($this->_aObject['cache'] == 'guest' && isLogged()))) {
            switch ($this->_aObject['cache']) {
                case 'global': // one cache for everyone
                case 'guest': // one cache for guests only
                    $sCacheKey = "menu_{$this->_sObject}";
                    break;                
                case 'per_user': // separate cache for each user
                    $sCacheKey = "menu_{$this->_sObject}_p" . bx_get_logged_profile_id();
                    break;                
                case 'per_acl': // separate cache for each ACL
                    $aAcl = BxDolAcl::getInstance()->getMemberMembershipInfo(bx_get_logged_profile_id());
                    $sCacheKey = "menu_{$this->_sObject}" . "_acl" . $aAcl['id'] . '_a' . (isAdmin() ? 1 : 0);
                    break;
                default:
                    trigger_error("Unknown cache mode for menu ({$this->_sObject}): {$this->_aObject['cache']}", E_USER_ERROR);
                    break;
            }            
            $mixedCache = bx_content_cache_get($sCacheKey);
        }
        if ($mixedCache !== null) {
            if ($mixedCache)
                $this->_addJsCss();
            $bCacheUsed = true;
            $sRet = $mixedCache;
        }
        else {

            /**
             * @hooks
             * @hookdef hook-menu-get_code_before 'menu', 'get_code_before' - hook before menu output
             * - $unit_name - equals `menu`
             * - $action - equals `get_code_before` 
             * - $object_id - not used 
             * - $sender_id - not used 
             * - $extra_params - array of additional params with the following array keys:
             *      - `object_name` - menu object name
             *      - `object_array` - menu object array
             *      - `object` - menu object
             *      - `override_result` - menu code
             * @hook @ref hook-menu-get_code_before
             */
            $mixedRes = null;
            bx_alert('menu', 'get_code_before', 0, 0, [
                'object_name' => $this->_sObject, 
                'object_array' => $this->_aObject, 
                'object' => $this, 
                'override_result' => &$mixedRes,
            ]);
            if ($mixedRes !== null) {            
                $sRet = $mixedRes;
            }
            else {
                if(!$this->_iPageType)
                    $this->_iPageType = BxDolTemplate::getInstance()->getPageType();

                $s = '';
                $aVars = $this->_getTemplateVars ();
                if (!empty($aVars['bx_repeat:menu_items'])) {
                    $this->_addJsCss();
                    $s = $this->_getCode($this->_aObject['template'], $aVars);
                }

                /**
                 * @hooks
                 * @hookdef hook-menu-get_code_after 'menu', 'get_code_after' - hook after menu output
                 * - $unit_name - equals `menu`
                 * - $action - equals `get_code_after` 
                 * - $object_id - not used 
                 * - $sender_id - not used 
                 * - $extra_params - array of additional params with the following array keys:
                 *      - `object_name` - menu object name
                 *      - `object_array` - menu object array
                 *      - `object` - menu object
                 *      - `override_result` - menu code
                 * @hook @ref hook-menu-get_code_after
                 */
                $mixedRes = null;
                bx_alert('menu', 'get_code_after', 0, 0, [
                    'object_name' => $this->_sObject, 
                    'object_array' => $this->_aObject, 
                    'object' => $this, 
                    'vars' => $aVars,
                    'override_result' => &$s,
                ]);
                $sRet = $s;
            }

            if ($sCacheKey)
                bx_content_cache_set($sCacheKey, $sRet);
        }

        if (isset($GLOBALS['bx_profiler'])) $GLOBALS['bx_profiler']->endMenu($sMenuTitle, $this->_aObject['cache'] ?? 'undefined', $bCacheUsed);
        
        return $sRet;
    }

    /**
     * Get menu code API.
     * @return array
     */
    public function getCodeAPI ()
    {
        $aItems = [];

        $aVars = $this->_getTemplateVars();
        if(!empty($aVars['bx_repeat:menu_items']))
            $aItems = $aVars['bx_repeat:menu_items'];

        return [
            'object' => $this->_sObject,
            'title' => _t($this->_aObject['title_public']),
            'config' => $this->_aObject['config_api'],
            'persistent' => $this->_aObject['persistent'],
            'params' => $this->getContentParams(),
            'items' => $aItems
        ];
    }

    /**
     * Get menu short code API.
     * @return array
     */
    public function getShortCodeAPI ()
    {
        return [
            'object' => $this->_sObject, 
            'title' => _t($this->_aObject['title_public']),
            'params' => $this->getContentParams()
        ];
    }

    protected function _getCode($sTmplName, $aTmplVars)
    {
        return $this->_oTemplate->parseHtmlByName($this->getTemplateName($sTmplName), $aTmplVars);
    }

    public function getCodeItem ($sName)
    {
        if(empty($sName))
            return '';

        $sCode = $this->_oTemplate->getHtml(str_replace('.html', '_item.html', $this->_aObject['template']));
        if(empty($sCode))
            return '';

        $mixedTmplVars = $this->getMenuItem($sName);
        if($mixedTmplVars === false)
            return '';

        return $this->_oTemplate->parseHtmlByContent($sCode, $mixedTmplVars);
    }

    /**
     * Get template variables array
     * @return array
     */
    protected function _getTemplateVars ()
    {
        $aMenuItems = $this->getMenuItems();
        $sMenuItemSelected = _t($aMenuItems && $this->_aSelected && !empty($this->_aSelected['title']) ? $this->_aSelected['title'] : '_Contents');

        return [
            'object' => $this->_sObject,
            'menu_item_selected' => $sMenuItemSelected,
            'bx_repeat:menu_items' => $aMenuItems,
        ];
    }

    /**
     * Get menu items array, which is ready to pass to menu template. 
     * @return array or false
     */
    public function getMenuItems ()
    {
        if (!isset($this->_aObject['menu_items']))
            $this->_aObject['menu_items'] = $this->getMenuItemsRaw ();

        $aItems = array();
        foreach ($this->_aObject['menu_items'] as $aItem) {
            $aItem = $this->_getMenuItem ($aItem);
            if($aItem !== false)
                $aItems[] = $aItem;
        }

        return $aItems;
    }
    
    /**
     * Get menu item array, which is ready to pass to whole menu or 
     * single menu item template. May return false if single menu item 
     * is requested but cannot be shown by circumstances.
     * @return array or false
     */
    public function getMenuItem ($sName)
    {
        if (!isset($this->_aObject['menu_items']))
            $this->_aObject['menu_items'] = $this->getMenuItemsRaw ();

        if(!empty($sName))
            return $this->_getMenuItem($this->_aObject['menu_items'][$sName]);
    }

    /**
     * Get menu items array, this is just a wrapper for DB function for make it easier to override.
     * It is used in @see BxBaseMenu::getMenuItems
     * @return array
     */
    protected function getMenuItemsRaw ()
    {
        if($this->isMultilevel())
            return $this->_oQuery->getMenuItemsHierarchy();
        else 
            return $this->_oQuery->getMenuItems();
    }

    protected function getMenuItemsRawProfileRelated ()
    {
        $oProfile = BxDolProfile::getInstance();
        if(!$oProfile)
            return [];

        $aItems = $this->_oQuery->getMenuItemsBy([
            'type' => 'set_name', 
            'set_name' => $this->_aObject['set_name']
        ]);

        $aDuplicates = $this->_oQuery->getMenuItemsBy([
            'type' => 'set_name_duplicates',
            'set_name' => $this->_aObject['set_name']
        ]);

        $sModule = $oProfile->getModule();

        $aResult = [];
        foreach($aItems as $aItem) {
            if(in_array($aItem['name'], $aDuplicates) && $aItem['module'] != $sModule)
                continue;
            
            $aResult[$aItem['name']] = $aItem;
        }

        return $aResult;
    }

    protected function _getMenuItem ($a)
    {
        if (!$this->_isActive($a) || !$this->_isVisible($a))
            return false;

        if ($this->_bIsApi)
            return $this->_getMenuItemAPI ($a);

        $bIsSelected = $this->_isSelected($a);
        if($bIsSelected)
            $this->_aSelected = $a;

        $a['object'] = $this->_sObject;

        $a['title'] = _t($a['title']);
        $a['title_attr'] = $this->_getMenuTitle($a);
        $a['info'] = isset($a['info']) ? _t($a['info']) : '';

        $this->removeMarker('addon');

        $a = $this->_replaceMarkers($a);

        if ($this->_bDisplayAddons) {
            $mixedAddon = $this->_getMenuAddon($a);
            if (!is_array($mixedAddon)) {
                $this->addMarkers(array('addon' => $mixedAddon));
                $a = $this->_replaceMarkers($a);
            }
        }

        $aMarkers = $this->_getMenuMarkers($a);
        if ($aMarkers && is_array($aMarkers)) {
            $this->addMarkers($aMarkers);
            $a = $this->_replaceMarkers($a);
        }

        list ($sIcon, $sIconUrl, $sIconA, $sIconHtml) = $this->_getMenuIcon($a);

        if(!isset($a['class_add']))
            $a['class_add'] = '';
        if($bIsSelected)
            $a['class_add'] .= ' bx-menu-tab-active';
        $a['class_add'] .= $this->_getVisibilityClass($a);
        $a['class_link'] = '';

        $a['link'] = isset($a['link']) ? $this->_oPermalinks->permalink($a['link']) : 'javascript:void(0);';

        $a['attrs'] = $this->_getMenuAttrs($a);
        $a['attrs_wrp'] = '';

        if($this->_bHx && !empty($a['link']) && strpos($a['link'], 'javascript:') === false) {
            $this->_aHx['get'] = $a['link'];
            $a['attrs'] .= bx_get_htmx_attrs($this->_aHx, $this->_mHxPreload);

            if(!bx_is_htmx_request() && !$bIsSelected)
                $a['attrs_wrp'] .= bx_get_htmx_attrs([
                    'get' => $a['link'],
                    'trigger' => 'load',
                    'target' => '#bx-content-preload',
                    'swap' => 'beforeend',
                ]);
        }

        $a['bx_if:image'] = [
            'condition' => (bool)$sIconUrl,
            'content' => [
                'icon_url' => $sIconUrl,
                'attrs' => $this->_getMenuIconAttrs('image', $a)
            ],
        ];
        $a['bx_if:image_inline'] = array (
            'condition' => false,
            'content' => array('image' => ''),
        );
        $a['bx_if:icon'] = array (
            'condition' => (bool)$sIcon,
            'content' => array('icon' => $sIcon),
        );
        $a['bx_if:icon-html'] = array (
            'condition' => (bool)$sIconHtml,
            'content' => array('icon' => $sIconHtml),
        );
        $a['bx_if:icon-a'] = array (
            'condition' => (bool)$sIconA,
            'content' => array('icon-a' => $sIconA),
        );
        $a['bx_if:title'] = [
            'condition' => (bool)$a['title'] && (!isset($a['icon_only']) || (int)$a['icon_only'] == 0),
            'content' => [
                'title' => $a['title'],
                'title_attr' => $a['title_attr']
            ],
        ];
        $a['bx_if:info'] = [
            'condition' => (bool)$a['info'],
            'content' => [
                'info' => $a['info'],
            ],
        ];

        $bOnClick = !empty($a['onclick']);
        $aOnClick = $bOnClick ? [
            'onclick' => $a['onclick'],
        ] : [];

        $a['bx_if:onclick'] = [
            'condition' => $bOnClick,
            'content' => $aOnClick
        ];

        $aTmplVarsAddon = $this->_bDisplayAddons ? $this->_getTmplVarsAddon($mixedAddon, $a) : array('addon' => '', 'addonf' => '');
        $a['bx_if:addon'] = array (
            'condition' => $this->_bDisplayAddons && !empty($aTmplVarsAddon['addon']),
            'content' => $aTmplVarsAddon
        );

        $aTmplVarsSubitems = array('subitems' => '');
        $bTmplVarsSubitems = $this->isMultilevel() && !empty($a['subitems']);
        if($bTmplVarsSubitems) {
            $sClassCollpsed = 'bx-mi-collapsed';
            if(($iCollapsed = $this->getUserChoiceCollapsedSubmenu($a)) !== false)
                $a['class_add'] .= $iCollapsed ? ' ' . $sClassCollpsed : '';
            else if(isset($a['collapsed']) && $a['collapsed'])
                $a['class_add'] .= ' ' . $sClassCollpsed;

            $aSubitems = array();
            foreach($a['subitems'] as $aSubitem) {
                $aSubitem = $this->_getMenuItem($aSubitem);
                if($aSubitem !== false)
                    $aSubitems[] = $aSubitem;
            }

            if(!$bOnClick)
                $a['bx_if:onclick'] = [
                    'condition' => true,
                    'content' => [
                        'onclick' => "javascript:return bx_menu_toggle(this, '" . $this->_sObject . "', '" . $a['name'] . "')"
                    ]
                ];

            $aTmplVarsSubitems['subitems'] = $this->_oTemplate->parseHtmlByName(str_replace('.html', '_subitems.html', $this->getTemplateName()), array(
                'bx_repeat:menu_items' => $aSubitems,
            ));
        }

        $a['bx_if:show_toggler'] = [
            'condition' => $bTmplVarsSubitems,
            'content' => []
        ];
        $a['bx_if:show_subitems'] = array (
            'condition' => $bTmplVarsSubitems,
            'content' => $aTmplVarsSubitems
        );

        unset($a['subitems']);

        foreach ($this->_aOptionalParams as $sName => $sDefaultValue)
            if (!isset($a[$sName]))
                $a[$sName] = $sDefaultValue;

        return $a;
    }

    protected function _getMenuItemAPI ($a)
    {
        list ($sIcon, $sIconUrl, $sIconA, $sIconHtml) = $this->_getMenuIcon($a);

        $aResult = [
            'id' => $a['id'],
            'name' => $a['name'],
            'title' => _t($a['title']),
            'info' => isset($a['info']) ? _t($a['info']) : '',
            'link' => isset($a['link']) ? $a['link'] : '',
            'icon' => $sIcon ? BxDolIconset::getObjectInstance()->getIcon($sIcon) : ($sIconHtml ? $sIconHtml : ''),
            'image' => $sIconUrl ? $sIconUrl : '',
            'submenu' => !empty($a['submenu_object']) ? $a['submenu_object'] : '',
            'addon' => $this->_bDisplayAddons ? $this->_getMenuAddon($a) : '',
            'hidden_on' => isset($a['hidden_on']) ? $a['hidden_on'] : false,
            'hidden_on_col' => isset($a['hidden_on_col']) ? $a['hidden_on_col'] : false,
            'config' => isset($a['config_api']) ? $a['config_api'] : '',
            'primary' => isset($a['primary']) ? $a['primary'] : 0,
            'persistent' => isset($a['persistent']) ? $a['persistent'] : 0,
        ];

        if(!empty($a['onclick']))
            $aResult = array_merge($aResult, [
                'display_type' => 'callback',
                'data' => $this->_getMenuCallbackDataAPI($a)
            ]);

        $this->_updateVisibilityParamsAPI($aResult);

        if(($aMarkers = $this->_getMenuMarkers($a)) && is_array($aMarkers))
            $this->addMarkers($aMarkers);
        $aResult = $this->_replaceMarkers($aResult);

        if(!empty($aResult['link'])) {
            if(($sSubstr = 'javascript') && substr($aResult['link'], 0, strlen($sSubstr)) == $sSubstr)
                $aResult['link'] = '';
            else
                $aResult['link'] = $this->_oPermalinks->permalink($aResult['link']);
        }

        if($this->isMultilevel() && !empty($a['subitems'])) {
            $aSubitems = [];
            foreach($a['subitems'] as $aSubitem) {
                $aSubitem = $this->_getMenuItem($aSubitem);
                if($aSubitem !== false)
                    $aSubitems[] = $aSubitem;
            }

            $aResult['subitems'] = $aSubitems;
        }

        return $aResult;
    }

    protected function _getMenuIcon ($a)
    {
        return BxTemplFunctions::getInstanceWithTemplate($this->_oTemplate)->getIcon(!empty($a['icon']) ? $a['icon'] : '');
    }

    protected function _getMenuIconAttrs ($sType, $a)
    {
        $sAttrs = '';

        if($sType == 'image' && ($sTitleAttr = $this->_getMenuTitle($a)))
            $sAttrs .= ' alt="' . $sTitleAttr . '"';

        return $sAttrs;
    }

    protected function _getMenuTitle($a)
    {
        return bx_html_attribute(strip_tags(!empty($a['title_attr']) && ($sTitleAttr = _t($a['title_attr'])) ? $sTitleAttr : $a['title']));
    }

    protected function _getMenuCallbackDataAPI($a)
    {
        return [];
    }

    public function getMenuIconHtml($sIcon)
    {
        list ($sIcon, $sIconUrl, $sIconA, $sIconHtml) = BxTemplFunctions::getInstanceWithTemplate($this->_oTemplate)->getIcon($sIcon);

        $a['bx_if:image'] = [
            'condition' => (bool)$sIconUrl,
            'content' => [
                'icon_url' => $sIconUrl,
                'attrs' => ''
            ],
        ];
        $a['bx_if:icon'] = array (
            'condition' => (bool)$sIcon,
            'content' => array('icon' => $sIcon),
        );
        $a['bx_if:icon-a'] = array (
            'condition' => (bool)$sIconA,
            'content' => array('icon-a' => $sIconA),
        );
        $a['bx_if:icon-html'] = array (
            'condition' => (bool)$sIconHtml,
            'content' => array('icon' => $sIconHtml),
        );

        return $this->_oTemplate->parseHtmlByName('menu_icon.html', $a);
    }

    protected function _getMenuAddon ($aMenuItem)
    {
        if (empty($aMenuItem['addon']))
            return '';

        if (isset($aMenuItem['addon_cache']) && $aMenuItem['addon_cache']) {
            $oCache = BxDolDb::getInstance()->getDbCacheObject();
            $sKey = 'menu_' . $this->_sObject . '_' . $aMenuItem['name'] . '_' . bx_get_logged_profile_id() . '_' . bx_site_hash() . '.php';
            $s = $oCache->getData($sKey);
            if ($s !== null) {
                return $s;
            }
            else {
                $s = BxDolService::callSerialized($aMenuItem['addon'], $this->_aMarkers);
                $oCache->setData($sKey, $s);
            }

            return $s;
        }
        else {
            return BxDolService::callSerialized($aMenuItem['addon'], $this->_aMarkers);
        }
    }

    protected function _getMenuMarkers ($aMenuItem)
    {
        if (empty($aMenuItem['markers']))
            return '';

        return BxDolService::callSerialized($aMenuItem['markers'], $this->_aMarkers);
    }

    protected function _getMenuAttrs ($aMenuItem)
    {
        $sAttrs = '';
        if(($sTitleAttr = $this->_getMenuTitle($aMenuItem)))
            $sAttrs .= ' title="' . $sTitleAttr . '"';

        if(!empty($aMenuItem['target']))
            $sAttrs .= ' target="' . $aMenuItem['target'] . '"';

        if($this->_bAddNoFollow && !empty($aMenuItem['link']) && preg_match('@^https?://@', $aMenuItem['link']) && strncmp($aMenuItem['link'], BX_DOL_URL_ROOT, strlen(BX_DOL_URL_ROOT)) !== 0)
            $sAttrs .= ' rel="noreferrer"';

        if(!empty($aMenuItem['area_label']))
            $sAttrs .= ' area-label="' . bx_html_attribute(_t($aMenuItem['area_label'])) . '"';

        return $sAttrs;
    }

    protected function _addMenuItemsMoreLess($aItems, $iMenuItemsMin)
    {
        $iMenuItems = count($aItems);
        if($iMenuItems <= $iMenuItemsMin)
            return $aItems;

        $mixedCollpsed = $this->getUserChoiceCollapsed();
        $bCollpsed = $mixedCollpsed === false || $mixedCollpsed == 1;

        for($i = $iMenuItemsMin; $i < $iMenuItems; $i++)
            $aItems[$i]['class_add'] .= ' bx-mi-aux' . ($bCollpsed ? ' bx-mi-hidden' : '');

        $aShowMoreLinks = [
            'more' => ['title' => '_sys_show_more', 'icon' => 'chevron-down', 'class' => $bCollpsed ? '' : 'bx-mi-hidden'],
            'less' => ['title' => '_sys_show_less', 'icon' => 'chevron-up', 'class' => !$bCollpsed ? '' : 'bx-mi-hidden']
        ];

        foreach($aShowMoreLinks as $sLink => $aLink)
            $aItems[] = [
                'class_add' => 'bx-psmi-show-' . $sLink . ' ' . $aLink['class'],
                'name' => 'show-' . $sLink,
                'title' => _t($aLink['title']),
                'link' => 'javascript:void(0)',
                'bx_if:onclick' => [
                    'condition' => true,
                    'content' => [
                        'onclick' => 'bx_menu_show_more_less(this, \'' . $this->_sObject . '\', \'.bx-menu-object-' . $this->_sObject . '\')',
                    ]
                ],
                'attrs' => '',
                'bx_if:image' => [
                    'condition' => false,
                    'content' => ['icon_url' => ''],
                ],
                'bx_if:image_inline' => [
                    'condition' => false,
                    'content' => ['image' => ''],
                ],
                'bx_if:icon' => [
                    'condition' => true,
                    'content' => ['icon' => $aLink['icon']],
                ],
                'bx_if:icon-html' => [
                    'condition' => false,
                    'content' => ['icon-a' => ''],
                ],
                'bx_if:icon-a' => [
                    'condition' => false,
                    'content' => ['icon-a' => ''],
                ],
                'bx_if:addon' => [
                    'condition' => false,
                    'content' => []
                ]
            ];

        return $aItems;
    }

    /**
     * Add css/js files which are needed for menu display and functionality.
     */
    protected function _addJsCss()
    {
        $this->_oTemplate->addCss('menu.css');
    }

    protected function _getTmplVarsAddon($mixedAddon, $aMenuItem) 
    {
        $sAddon = '';
        if(!is_array($mixedAddon))
            $sAddon = $mixedAddon;
        else if(!empty($mixedAddon['addon']))
            $sAddon = $mixedAddon['addon'];

        return array(
            'addon' => $sAddon,
            'addonf' => ''
        );
    }
}

/** @} */
