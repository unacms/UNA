<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Workspaces Workspaces
 * @ingroup     UnaModules
 *
 * @{
 */

class BxWorkspacesAlertsResponse extends BxBaseModProfileAlertsResponse
{
    public function __construct()
    {
    	$this->MODULE = 'bx_workspaces';
        parent::__construct();
    }

    public function response($oAlert)
    {
        parent::response($oAlert);

        if('system' != $oAlert->sUnit)
            return;

        switch($oAlert->sAction) {
            // In a workspace the logo leads to its context.
            case 'get_logo':
                if(($iContext = bx_get_context_workspace()) && ($o = BxDolProfile::getInstance($iContext)))
                    $oAlert->aExtras['tmpl_vars']['attrs'] = preg_replace('/href="([^"]+)" title="([^"]+)"/', 'href="' . $o->getUrl() . '" title="' . bx_html_attribute($o->getDisplayName()) . '"', $oAlert->aExtras['tmpl_vars']['attrs']);
                break;

            case 'connection_before_add':
                if(($oAlert->aExtras['object_name'] ?? '') === $this->_oModule->getContextConnection())
                    $this->_oModule->onContextConnectionBeforeAdd($oAlert);
                break;

            case 'connection_removed':
                if(($oAlert->aExtras['object_name'] ?? '') === $this->_oModule->getContextConnection())
                    $this->_oModule->onContextConnectionRemoved($oAlert);
                break;
        }
    }
}

/** @} */
