<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaTemplate UNA Template Classes
 * @{
 */

class BxTemplFunctions extends BxBaseFunctions
{
    protected $_sModule;

    function __construct($oTemplate = null)
    {
        $this->_sModule = 'bx_lucid';

        parent::__construct($oTemplate);
    }

    protected function getInjHeadStylesCustom() 
    {
    	$sCss = trim(getParam($this->_sModule . '_styles_custom'));
        return !empty($sCss) ? $this->_oTemplate->_wrapInTagCssCode($sCss) : '';
    }

    protected function getInjFooterIncludeCssJs() 
    {
        // sidebar.js works the application page type's own sidebar (pt_application.html); no other page has its elements.
        if($this->_oTemplate->getPageType() != BX_PAGE_TYPE_APPLICATION) {
            return '';
        }

        return $this->_oTemplate->addJs([
            'modules/base/template/js/|sidebar.js',
        ], true);
    }

    protected function getInjFooterPopupMenus() 
    {
        $sContent = '';

        $oSearch = new BxTemplSearch();
        $oSearch->setLiveSearch(true);
        $sContent .= $this->_oTemplate->parsePageByName('search.html', array(
            'search_form' => $oSearch->getForm(BX_DB_CONTENT_ONLY),
            'results' => $oSearch->getResultsContainer(),
        ));

        if(isLogged()) {
            $sContent .= $this->_oTemplate->getMenu ('sys_add_content');
            $sContent .= $this->_oTemplate->getMenu ('sys_account_popup');
        }

        return $sContent;
    }

    protected function getInjFooterMenuDropdown() 
    {
        $bLogged = isLogged();
        $sCode = '';

        $oSearch = new BxTemplSearch();
        $oSearch->setLiveSearch(true);
        $sSearch = $oSearch->getForm(BX_DB_CONTENT_ONLY);

        $bTmplVarsLogin = false;
        $aTmplVarsLogin = array();
        /*
         * Note. For now, login form was removed from Dropdown Menu.
         * 
        $bTmplVarsLogin = !$bLogged;
        $aTmplVarsLogin = array();
        if($bTmplVarsLogin)
            $aTmplVarsLogin = array(
                'login' => bx_srv('bx_canonic', 'get_block_login', array('menu'))
            );
		 */

        $bTmplVarsProfile = false;
        $aTmplVarsProfile = array();
        /*
         * Note. For now, profile related items were removed from Dropdown Menu.
         * 
        $bTmplVarsProfile = $bLogged;
        $aTmplVarsProfile = array();
        if($bTmplVarsProfile) {
            $oProfile = BxDolProfile::getInstance(bx_get_logged_profile_id());

            $aTmplVarsProfile = array(
                'user_unit' => $oProfile->getUnit(0, array('template' => 'unit_wo_info_links')), 
                'user_name' => $oProfile->getDisplayName(),
                'user_link' => $oProfile->getUrl(), 
                'bx_repeat:profile_submenu_items' => BxDolMenu::getObjectInstance('sys_account_notifications')->getMenuItems() 
            );
            
            $sCode .= bx_srv('bx_notifications', 'get_include');
        }
        */

        $sLogoUrl = $this->getMainLogoUrl();
        $bLogoUrl = !empty($sLogoUrl);

        $sLogoText = BxDolDesigns::getInstance()->getSiteLogoAlt();
        if(empty($sLogoText))
            $sLogoText = getParam('site_title');

        $sCode .= $this->_oTemplate->parsePageByName('menu_dropdown.html', array(
			'bx_if:show_logo_image' => array(
				'condition' => $bLogoUrl,
				'content' => array(
					'logo_url' => $sLogoUrl,
                                        'logo_text' => $sLogoText
				)
			),
			'bx_if:show_logo_text' => array(
				'condition' => !$bLogoUrl,
				'content' => array(
					'logo_text' => $sLogoText
				)
			),
            'search_form' => $sSearch,
            'bx_if:show_login' => array(
                'condition' => $bTmplVarsLogin,
            	'content' => $aTmplVarsLogin
            ),
            'bx_if:show_profile' => array(
                'condition' => $bTmplVarsProfile,
            	'content' => $aTmplVarsProfile
            ),
        ));

        return $sCode;
    }
}

/** @} */
