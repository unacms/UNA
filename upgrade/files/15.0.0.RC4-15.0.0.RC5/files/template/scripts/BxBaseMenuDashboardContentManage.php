<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * Menu representation.
 * @see BxDolMenu
 */
class BxBaseMenuDashboardContentManage extends BxTemplMenuCustom
{
    protected $_aModulesList;
    protected $_bShowDivider;

    public function __construct ($aObject, $oTemplate)
    {
        parent::__construct ($aObject);
        
        $this->_aObject['menu_id'] = 'sys-dashboard-content-manage-menu';

        $this->_bShowDivider = false;
    }

    public function setMenuData ($aModulesList)
    {
        $this->_aModulesList = $aModulesList;
    }

    protected function getMenuItemsRaw ()
    {
        $aResult = parent::getMenuItemsRaw();

        $aUrl = bx_get_base_url_inline();
        foreach($this->_aModulesList as $aModule){
            $aResult[] = [
                'module' => $aModule['name'],
                'name' => $aModule['uri'],
                'title' => $aModule['title'],
                'link' => bx_append_url_params($aUrl[0], array_merge($aUrl[1], ['module' => $aModule['uri']])),
                'active' => 1,
            ];
    	}

        if(!empty($aResult) && is_array($aResult)) {
            $aResult['more-auto'] = [
                'module' => 'system', 
                'id' => 'more-auto', 
                'name' => 'more-auto',
                'active' => true,
                'title' => '_sys_menu_item_title_va_more_auto', 
                'href' => 'javascript:void(0)', 
                'icon' => 'ellipsis-vertical',
            ];
        }

        return $aResult;
    }
}

/** @} */
