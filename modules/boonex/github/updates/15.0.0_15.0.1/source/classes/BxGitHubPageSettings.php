<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    GitHub GitHub
 * @ingroup     UnaModules
 *
 * @{
 */

class BxGitHubPageSettings extends BxTemplPage
{
    protected $_sModule;
    protected $_oModule;

    public function __construct($aObject, $oTemplate = false)
    {
        $this->_sModule = 'bx_github';
        $this->_oModule = BxDolModule::getInstance($this->_sModule);

        parent::__construct($aObject, $oTemplate);

        $oMenuSubmenu = BxDolMenu::getObjectInstance('sys_site_submenu');
        if($oMenuSubmenu) {
            $sSubmenu = 'sys_account_settings_submenu';
            $oMenuSubmenu->setObjectSubmenu($sSubmenu, [
                'title' => _t('_sys_menu_item_title_account_settings'), 
                'link' => '', 
                'icon' => ''
            ]);

            BxDolMenu::getObjectInstance($sSubmenu)->setSelected($this->_sModule, 'github-settings');
        }
    }
}

/** @} */
