<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Menus.
 *
 * Menu uses some set of items and the template to display it,
 * so it is possible to have several menus which uses the same set of items but different templates.
 *
 * Menu is any set of some links or actions, for example menu can be links in site's footer or actions in profile view.
 *
 *
 * @section menu_create Creating the Menu object:
 *
 * 1. Add record to 'sys_objects_menu' table:
 *
 * - object: name of the menu object, in the format: vendor prefix, underscore, module prefix, underscore, internal identifier or nothing; for example: bx_groups_actions - actions menu in group view.
 * - title: name of the menu, displayed in the studio menu builder.
 * - set_name: name of items' set.
 * - module: the module this menu belongs to.
 * - template_id: the template to use for menu displaying, this is id from 'sys_menu_templates' table.
 * - deletable: it determines if menu can be deleted from the studio menu builder.
 * - active: it is possible to disable particular menu, then it will not be displayed.
 * - override_class_name: user defined class name which is derived from BxTemplMenu.
 * - override_class_file: the location of the user defined class, leave it empty if class is located in system folders.
 *
 * Menu templates are stored in 'sys_menu_templates' table:
 * - id: template id.
 * - template: template file.
 * - title: template title to display in the studio menu builder.
 * All menu templates iterate through 'bx_repeat:menu_items' and use the following template variables for each menu item: __link__, __target__, __onclick__, __title__, __class_add__.
 *
 *
 * 2. Add menu an empty menu set to 'sys_menu_sets' table (if you want to use new set of items for created menu):
 * - set_name: the set name.
 * - module: the module this set belongs to.
 * - title: name of the set, displayed in studio menu builder.
 * - deletable: it determines if the set can be deleted from menu builder.
 *
 *
 * 3. Add menu items to the set by adding records to 'sys_menu_items' table:
 * - set_name: the set name this item belogs to.
 * - module: the module this item belongs to.
 * - name: name of the item (not displayed to the end user), unique in the particular set.
 * - title: menu item title to display to the end user, please note that some templates can still display menu as icons without text titles.
 * - link: menu item URL.
 * - onclick: menu item onclick event.
 * - target: menu item target.
 * - icon: menu item icon, please note that some templates can still display menu as text without icons.
 * - addon: display additional data near menu item, only for supported menu templates, this is serialized array of service call parameters: module - module name, method - service method name, params - array of parameters.
 * - markers: service method to provide additional replacement markers, this is serialized array of service call parameters: module - module name, method - service method name, params - array of parameters.
 * - visible_for_levels: bit field with set of member level ids. To use member level id in bit field - the level id minus 1 as power of 2 is used, for example:
 *      - user level id = 1 -> 2^(1-1) = 1
 *      - user level id = 2 -> 2^(2-1) = 2
 *      - user level id = 3 -> 2^(3-1) = 4
 *      - user level id = 4 -> 2^(4-1) = 8
 * - active: it is possible to disable particular menu item, then it will not be displayed.
 * - order: menu item order in the particular set.
 *
 *
 * 4. Display Menu.
 * Use the following sample code to display menu:
 * @code
 *     $oMenu = BxTemplMenu::getObjectInstance('sample_menu'); // 'sample_menu' is 'object' field from 'sys_objects_menu' table.
 *     if ($oMenu)
 *         echo $oMenu->getCode; // display menu
 * @endcode
 *
 * But in most cases you don't need to use above code to display menu,
 * menu objects are integrated into pages - there is special 'menu' page block type for it.
 *
 */
class BxDolMenu extends BxDolFactory implements iBxDolFactoryObject, iBxDolReplaceable
{
    protected static $SEL_MODULE = '';
    protected static $SEL_NAME = '';

    protected $_bIsApi;

    protected $_bHx;
    protected $_bHxHead;
    protected $_mHxPreload;
    protected $_aHx;

    protected $_bDynamicMode;
    protected $_bAddNoFollow;

    protected $_bSelModuleCheck;
    protected $_sSelModule;
    protected $_sSelName;

    protected $_sObject;
    protected $_aObject;
    protected $_oQuery;
    protected $_oPermalinks;
    protected $_aMarkers = array();
    protected $_isMultilevel = null;

    protected $_sSessionKeyCollapsed;

    protected $_aContentParams;

    /**
     * Constructor
     * @param $aObject array of menu options
     */
    protected function __construct($aObject)
    {
        parent::__construct();

        $this->_bIsApi = bx_is_api();

        $this->_bHx = false;
        $this->_aHx = [];

        $this->_bDynamicMode = false;
        $this->_bAddNoFollow = getParam('sys_add_nofollow') == 'on';

        $this->_bSelModuleCheck = false;

        $this->_sObject = isset($aObject['object']) ? $aObject['object'] : 'bx-menu-obj-' . time() . rand(0, PHP_INT_MAX);
        $this->_aObject = $aObject;
        $this->_oQuery = new BxDolMenuQuery($this->_aObject);
        $this->_oPermalinks = BxDolPermalinks::getInstance();        

        $this->_sSessionKeyCollapsed = 'bx_menu_collapsed_';

        $this->_aContentParams = [];

        $this->addMarkers([
            'object' => $this->_sObject
        ]);

        if(isLogged() && ($oProfile = BxDolProfile::getInstance()) !== false) {
            $sUrl = $oProfile->getUrl();
            if($this->_bIsApi)
                $sUrl = bx_api_get_relative_url($sUrl);

            $this->addMarkers([
                'member_id' => $oProfile->id(),
                'member_display_name' => $oProfile->getDisplayName(),
                'member_url' => $sUrl,
                'content_id' => $oProfile->getContentId()
            ]);
        }
    }

    /**
     * Get menu object instance by object name
     * @param $sObject object name
     * @return object instance or false on error
     */
    static public function getObjectInstance($sObject, $oTemplate = false)
    {
        $oMenu = false;
        if (!isset($GLOBALS['bxDolClasses']['BxDolMenu!'.$sObject])) {
            $aObject = BxDolMenuQuery::getMenuObject($sObject);
            if (!$aObject || !is_array($aObject) || (int)$aObject['active'] == 0)
                return false;

            $sClass = 'BxTemplMenu';
            if (!empty($aObject['override_class_name'])) {
                $sClass = $aObject['override_class_name'];
                if (!empty($aObject['override_class_file']))
                    require_once(BX_DIRECTORY_PATH_ROOT . $aObject['override_class_file']);
            }

            $oMenu = new $sClass($aObject, $oTemplate);
            $GLOBALS['bxDolClasses']['BxDolMenu!'.$sObject] = $oMenu;
        }
        else
            $oMenu = $GLOBALS['bxDolClasses']['BxDolMenu!'.$sObject];

        /**
         * @hooks
         * @hookdef hook-system-get_object 'system', 'get_object' - hook to override menu object
         * - $unit_name - equals `system`
         * - $action - equals `get_object`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `type` - [string] object type, equals to 'menu'
         *      - `name` - [string] menu object name
         *      - `object` - [object] by ref, an instance of menu, @see BxDolMenu, can be overridden in hook processing
         * @hook @ref hook-system-get_object
         */
        bx_alert('system', 'get_object', 0, false, [
            'type' => 'menu',
            'name' => $sObject,
            'object' => &$oMenu,
        ]);

        return $oMenu;
    }

    /**
     * Set selected menu item globally.
     * @param $sModule menu item module to set as selected
     * @param $sName menu item name to set as selected
     */
    static public function setSelectedGlobal ($sModule, $sName)
    {
        self::$SEL_MODULE = $sModule;
        self::$SEL_NAME = $sName;
    }

    /**
     * Process menu triggers.
     * Menu triggers allow to automatically add menu items to modules with no different if dependant module was install before or after the module menu item belongs to.
     * For example module "Notes" adds menu items to all profiles modules (Persons, Organizations, etc)
     * with no difference if persons module was installed before or after "Notes" module was installed.
     * @param $sMenuTriggerName trigger name to process, usually specified in module installer class - @see BxBaseModGeneralInstaller
     * @return always true, always success
     */
    static public function processMenuTrigger ($sMenuTriggerName)
    {
        // get list of active modules
        $aModules = BxDolModuleQuery::getInstance()->getModulesBy(array(
            'type' => 'modules',
            'active' => 1,
        ));

        // get list of menu triggers
        $aMenuItems = BxDolMenuQuery::getMenuTriggers($sMenuTriggerName);

        // check each menu item trigger for all modules
        foreach ($aMenuItems as $aMenuItem) {
            foreach ($aModules as $aModule) {
                if (!BxDolRequest::serviceExists($aModule['name'], 'get_menu_set_name_for_menu_trigger'))
                    continue;

                $mixedMenuSet = BxDolService::call($aModule['name'], 'get_menu_set_name_for_menu_trigger', array($sMenuTriggerName));
                if(empty($mixedMenuSet))
                    continue;

                if(is_string($mixedMenuSet))
                    $mixedMenuSet = array($mixedMenuSet);

                foreach($mixedMenuSet as $sMenuSet) {
                    if(empty($sMenuSet))
                        continue;

                    $aMenuItem['set_name'] = $sMenuSet;
                    BxDolMenuQuery::addMenuItemToSet($aMenuItem);
                }
            }
        }

        return true;
    }

    public function isHtmx()
    {
        return $this->_bHx;
    }

    /**
     * Whether a guest's copy of this menu may be kept by browsers and shared caches (see
     * bx_api_cache_response): its items depend on nothing but the viewer's cookies, the language
     * and the menu's own parameters. A menu that reads a request header (Referer, User-Agent, ...)
     * returns false.
     * @return boolean
     */
    public function isCacheable()
    {
        return true;
    }

    /**
     * Check if the menu is visible. The menu is visible if at least one menu item is visible.
     * @return boolean
     */
    public function isVisible()
    {
        if((int)$this->_aObject['active'] == 0)
            return false;

    	if(!isset($this->_aObject['menu_items']))
            $this->_aObject['menu_items'] = $this->_oQuery->getMenuItems();

    	$bVisible = false;
    	foreach ($this->_aObject['menu_items'] as $a) {
            if(!$this->_isActive($a) || !$this->_isVisible($a))
                continue;

            $bVisible = true;
            break;
    	}

    	return $bVisible;
    }

    public function getQueryObject()
    {
        return $this->_oQuery;
    }

    public function getTemplateId()
    {
        return $this->_aObject['template_id'];
    }

    /**
     * Get template name with checking for custom template related to exactly this menu object.
     * @return string with template name.
     */
    public function getTemplateName($sName = '')
    {
        if(empty($sName))
            $sName = $this->_aObject['template'];

        $sNameCustom = str_replace('.html', '_' . $this->_sObject . '.html', $sName);
        return $this->_oTemplate->isHtml($sNameCustom) ? $sNameCustom : $sName;
    }

    public function setTemplateById ($iTemplateId)
    {
        $aTemplate = $this->_oQuery->getMenuTemplateById($iTemplateId);
        if(empty($aTemplate) || !is_array($aTemplate))
            return;

        $this->_aObject['template'] = $aTemplate['template'];
    }
    
    /**
     * Set selected menu item for current menu object only.
     * @param $sModule menu item module to set as selected
     * @param $sName menu item name to set as selected
     */
    public function setSelected ($sModule, $sName)
    {
        $this->_sSelModule = $sModule;
        $this->_sSelName = $sName;
    }

    public function setDynamicMode ($bDynamicMode)
    {
        $this->_bDynamicMode = $bDynamicMode;
    }

    public function setHtmx($bHx)
    {
        $this->_bHx = $bHx;
    }

    /**
     * Get an arrey of replacable markers.
     * @return an array with markers
     */
    public function getMarkers()
    {
        return $this->_aMarkers;
    }
    
    /**
     * Add replace markers.
     * @param $a array of markers as key => value
     * @return true on success or false on error
     */
    public function addMarkers ($a)
    {
        if (empty($a) || !is_array($a))
            return false;
        $this->_aMarkers = array_merge ($this->_aMarkers, $a);
        return true;
    }

    /**
     * Remove marker
     * @param $s marker key
     */
    public function removeMarker ($s) 
    {
        unset($this->_aMarkers[$s]);
    }

    public function initContentParams()
    {
        $this->_aContentParams = [];
    }

    public function setContentParams($aParams)
    {
        $this->_aContentParams = $aParams;

        return true;
    }

    public function getContentParams()
    {
        if(!$this->_aContentParams)
            $this->initContentParams();

        return $this->_aContentParams;
    }

    public function performActionSetCollapsed($mixedValue)
    {
        $this->_setCollapsed($this->_sObject, (int)$mixedValue);
    }

    public function performActionSetCollapsedSubmenu($sMenuItem, $mixedValue)
    {
        $this->_setCollapsed($this->_sObject . '_' . $sMenuItem, (int)$mixedValue);
    }

    public function getUserChoiceCollapsed($sObject = '')
    {
        $iProfile = bx_get_logged_profile_id();
        if(!$iProfile)
            return false;

        if(!$sObject)
            $sObject = $this->_sObject;

        $sSessionKey = $this->_sSessionKeyCollapsed . $iProfile;
        $aCollapsed = BxDolSession::getInstance()->getValue($sSessionKey);
        if(!isset($aCollapsed[$sObject]))
            return false;

        return (int)$aCollapsed[$sObject];
    }

    public function getUserChoiceCollapsedSubmenu($mixedItem, $sObject = '')
    {
        if(!$sObject)
            $sObject = $this->_sObject;

        if(is_array($mixedItem) && isset($mixedItem['name']))
            $sObject .= '_' . $mixedItem['name'];
        else if(is_string($mixedItem))
            $sObject .= '_' . $mixedItem;

        return $this->getUserChoiceCollapsed($sObject);
    }

    protected function _setCollapsed($sName, $mixedValue)
    {
        $iProfile = bx_get_logged_profile_id();
        if(!$iProfile)
            return;

        $oSession = BxDolSession::getInstance();
        $sSessionKey = $this->_sSessionKeyCollapsed . $iProfile;

        $aCollapsed = $oSession->getValue($sSessionKey);
        if(!is_array($aCollapsed))
            $aCollapsed = [];

        $aCollapsed[$sName] = $mixedValue;
        $oSession->setValue($sSessionKey, $aCollapsed);
    }

    /**
     * Check if menu items is selected.
     * @param $a menu item array
     * @return boolean
     */
    protected function _isSelected ($a)
    {
        if($this->_sSelModule || $this->_sSelName)
            return (!$this->_bSelModuleCheck || !isset($a['module']) || $a['module'] == $this->_sSelModule) && (isset($a['name']) && $a['name'] == $this->_sSelName) ? true : false;

        return (!$this->_bSelModuleCheck || !isset($a['module']) || $a['module'] == self::$SEL_MODULE) && (isset($a['name']) && $a['name'] == self::$SEL_NAME) ? true : false;
    }

    /**
     * Check if menu items is active.
     * @param $a menu item array
     * @return boolean
     */
    protected function _isActive ($a)
    {
        if($this->_bIsApi)
            return !isset($a['active_api']) || (int)$a['active_api'] !=0;
        else
            return !isset($a['active']) || (int)$a['active'] != 0;
    }

    /**
     * Check if menu items is visible.
     * @param $a menu item array
     * @return boolean
     */
    protected function _isVisible ($a)
    {
        if(isset($a['visible_for_levels']) && !BxDolAcl::getInstance()->isMemberLevelInSet($a['visible_for_levels']))
            return false;

        if(!empty($a['visibility_custom']) && !BxDolService::callSerialized($a['visibility_custom'], $this->_aMarkers))
            return false;

        if($this->_iPageType && !empty($a['hidden_on_pt']) && ((1 << ($this->_iPageType - 2)) & (int)$a['hidden_on_pt']))
            return false;

        return true;
    }

    protected function isMultilevel ()
    {
        if($this->_isMultilevel === null)
            $this->_isMultilevel = !empty($this->_aObject['set_name']) && $this->_oQuery->isSetMultilevel($this->_aObject['set_name']);

        return $this->_isMultilevel;
    }

    protected function _getVisibilityClass($a)
    {
        $aHiddenOn = array(
            pow(2, BX_DB_HIDDEN_PHONE - 1) => 'bx-def-media-phone-hide',
            pow(2, BX_DB_HIDDEN_TABLET - 1) => 'bx-def-media-tablet-hide',
            pow(2, BX_DB_HIDDEN_DESKTOP - 1) => 'bx-def-media-desktop-hide',
            pow(2, BX_DB_HIDDEN_MOBILE - 1) => 'bx-def-mobile-app-hide'
        );
        
        $aHiddenOnCol = array(
            pow(2, 1) => 'bx-def-thin-col-hide',
            pow(2, 2) => 'bx-def-half-col-hide',
            pow(2, 3) => 'bx-def-wide-col-hide',
            pow(2, 4) => 'bx-def-full-col-hide'
        );
        
        $sHiddenOnCssClasses = '';
        if(!empty($a['hidden_on']))
            foreach($aHiddenOn as $iHiddenOn => $sClass)
                if((int)$a['hidden_on'] & $iHiddenOn)
                    $sHiddenOnCssClasses .= ' ' . $sClass;
        
        
        if(!empty($a['hidden_on_col'])){    
            foreach($aHiddenOnCol as $iHiddenOn => $sClass)
                if((int)$a['hidden_on_col'] & $iHiddenOn)
                    $sHiddenOnCssClasses .= ' ' . $sClass;
        }
        
        return $sHiddenOnCssClasses;
    }

    protected function _updateVisibilityParamsAPI(&$a)
    {
        $aValues = [
            'hidden_on' => [
                pow(2, BX_DB_HIDDEN_PHONE - 1) => 'phone',
                pow(2, BX_DB_HIDDEN_TABLET - 1) => 'tablet',
                pow(2, BX_DB_HIDDEN_DESKTOP - 1) => 'desktop',
                pow(2, BX_DB_HIDDEN_MOBILE - 1) => 'mobile-app'
            ],
            'hidden_on_col' => [
                pow(2, 0) => 'thin-col',
                pow(2, 1) => 'half-col',
                pow(2, 2) => 'wide-col',
                pow(2, 3) => 'full-col'
            ]
        ];

        foreach(['hidden_on', 'hidden_on_col'] as $sK)
            if(!empty($a[$sK])) {
                $aHoResults = [];
                foreach($aValues[$sK] as $iHiddenOn => $sHiddenOn)
                    if((int)$a[$sK] & $iHiddenOn)
                        $aHoResults[] = $sHiddenOn;

                $a[$sK] = $aHoResults;
            }
            else
                $a[$sK] = false;
    }

    /**
     * Replace provided markers in menu item array, curently markers are replaced in title, link and onclick fields.
     * @param $a menu item array
     * @return array where markes are replaced with real values
     */
    protected function _replaceMarkers ($a)
    {
        if(empty($this->_aMarkers))
            return $a;

        $aReplacebleFields = ['title', 'title_attr', 'link', 'onclick'];
        foreach($aReplacebleFields as $sField)
            if(isset($a[$sField]))
                $a[$sField] = bx_replace_markers($a[$sField], $this->_aMarkers);

        return $a;
    }

}

/** @} */
