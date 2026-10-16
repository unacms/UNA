<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaTemplate UNA Template Classes
 * @{
 */

/**
 * @see BxDolMenu
 */
class BxTemplMenuToolbar extends BxBaseMenuToolbar
{
    protected $_bSiteToolbar;

    public function __construct ($aObject, $oTemplate = false)
    {
        parent::__construct ($aObject, $oTemplate);

        $this->_bSiteToolbar = $this->_sObject == 'sys_toolbar_site';
    }

    protected function _getMenuItem ($a)
    {
    	//--- Hide 'Search' from both toolbars
        if(in_array($a['name'], array('search')))
            return false;

        $a = parent::_getMenuItem ($a);
        if($a === false)
            return $a;

        $a['class_add_a'] = '';
        switch ($a['name']) {
            case 'main-menu':
                $a['class_add'] = ' bx-def-media-desktop-hide bx-def-media-tablet-hide';
                $a['class_add_a'] = ' cd-nav-trigger';
                $a['link'] = 'javascript:void(0)';
                $a['onclick'] = '';
                break;
        }

        return $a;
    }
}

/** @} */
