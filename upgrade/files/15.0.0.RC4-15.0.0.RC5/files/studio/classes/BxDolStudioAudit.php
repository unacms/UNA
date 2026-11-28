<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

define('BX_DOL_STUDIO_AUD_TYPE_REPORTS', 'reports');
define('BX_DOL_STUDIO_AUD_TYPE_ADMIN', 'admin');
define('BX_DOL_STUDIO_AUD_TYPE_SETTINGS', 'settings');

define('BX_DOL_STUDIO_AUD_TYPE_DEFAULT', BX_DOL_STUDIO_AUD_TYPE_REPORTS);

class BxDolStudioAudit extends BxTemplStudioWidget
{
    protected $sPage;

    function __construct($sPage = "")
    {
        parent::__construct('audit');

        $this->sPage = BX_DOL_STUDIO_AUD_TYPE_DEFAULT;
        if(is_string($sPage) && !empty($sPage))
            $this->sPage = $sPage;
    }

    public function checkAction()
    {
        $sAction = bx_get('adt_action');
    	if($sAction === false)
            return false;

        $sAction = bx_process_input($sAction);

        $aResult = array('code' => 1, 'message' => _t('_adm_err_operation_failed'));
        switch($sAction) {
            
        }

        return $aResult;
    }
}

/** @} */
