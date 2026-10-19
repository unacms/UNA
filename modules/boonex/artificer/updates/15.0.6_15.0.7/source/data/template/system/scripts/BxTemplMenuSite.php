<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaTemplate UNA Template Classes
 * @{
 */

/**
 * @see BxTemplMenuMoreAuto
 */
class BxTemplMenuSite extends BxTemplMenuMoreAuto
{
    protected $_sModule;
    protected $_oModule;

    protected $_bSiteMenu;
    protected $_bSiteMenuInPanel;
    protected $_bApplicationMenu;

    protected $_aHideFromSiteMenu;
    protected $_aHideFromSiteMenuInPanel;

    public function __construct ($aObject, $oTemplate = false)
    {
        parent::__construct ($aObject, $oTemplate);

        $this->_sModule = 'bx_artificer';
        $this->_oModule = BxDolModule::getInstance($this->_sModule);
        $this->_aHideFromSiteMenu = ['search'];
        $this->_aHideFromSiteMenuInPanel = ['more-auto'];

        $this->_sJsClassMoreAuto = 'BxArtificerMenuMoreAuto';
        $this->_bSiteMenu = $this->_sObject == 'sys_site';
        $this->_bSiteMenuInPanel = $this->_sObject == 'sys_site_in_panel';
        $this->_bApplicationMenu = $this->_sObject == 'sys_application';

        if($this->_bSiteMenu) {
            $this->_bHx = getParam('bx_artificer_use_htmx') == 'on';
            $this->_mHxPreload = $this->_bHx && true;
            $this->_aHx = [
                'get' => '',
                'trigger' => 'click',
                'target' => '#bx-content-with-cover-wrapper',
                'swap' => 'outerHTML settle:400ms',
                'push-url' => 'true',
                'on::after:swap' => 'oBxArtificerUtils.mmenuClickAl(this)'
            ];
        }
    }

    public function getCode ()
    {
        $sTemplate = 'menu_main_popup.html';
        $sClass = 'bx-popup-menu-main';
        $sStyle = 'display:none';
        if($this->_bSiteMenu || $this->_bSiteMenuInPanel || $this->_bApplicationMenu) {
            $sTemplate = 'menu_main_inline.html';
            $sClass = 'bx-inline-smenu-main';
            $sStyle = '';
        }

        $this->_oModule->_oTemplate->addJs(array('menu_site.js'));
        return $this->_oModule->_oTemplate->parseHtmlByName($sTemplate, array(
            'id' => 'bx-sliding-menu-' . $this->_sObject,
            'class' => $sClass . ' ' . str_replace('_', '-', $this->_sObject),
            'style' => $sStyle,
            'content' => parent::getCode()
        ));
    }

    protected function _getMenuItem ($a)
    {
    	//--- Hide '[Search]' from Site Menu
        if( $this->_bSiteMenu && in_array($a['name'], $this->_aHideFromSiteMenu))
            return false;

        //--- Hide '[More Auto]' from Site Menu in Panel
        if( $this->_bSiteMenuInPanel && in_array($a['name'], $this->_aHideFromSiteMenuInPanel))
            return false;

        return parent::_getMenuItem ($a);
    }
}

/** @} */
