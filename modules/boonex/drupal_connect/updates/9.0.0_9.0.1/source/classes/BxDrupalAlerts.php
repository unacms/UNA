<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    DrupalConnect Drupal Connect
 * @ingroup     UnaModules
 *
 * @{
 */

class BxDrupalAlerts extends BxBaseModConnectAlerts
{
    function __construct()
    {
        parent::__construct();
        $this->oModule = BxDolModule::getInstance('bx_drupal');
    }

    public function response($o)
    {
        parent::response($o);
        
        if ('profile' == $o->sUnit && 'show_login_form' == $o->sAction && $this->oModule->isConfigured()) {
            $o->aExtras['sParams'] .= ' no_auth_buttons no_join_text';
            $o->aExtras['oForm'] = BxDolForm::getObjectInstance('bx_drupal_login', 'bx_drupal_login');
        }
    }
}

/** @} */
