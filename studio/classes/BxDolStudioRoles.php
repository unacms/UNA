<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

define('BX_DOL_STUDIO_RL_TYPE_LEVELS', 'rlevels');
define('BX_DOL_STUDIO_RL_TYPE_ACTIONS', 'ractions');
define('BX_DOL_STUDIO_RL_TYPE_DEFAULT', BX_DOL_STUDIO_RL_TYPE_LEVELS);

class BxDolStudioRoles extends BxTemplStudioWidget
{
    protected $sPage;

    function __construct($sPage = "")
    {
        parent::__construct('builder_roles');

        $this->oDb = BxDolStudioRolesQuery::getInstance();

        $this->sPage = BX_DOL_STUDIO_RL_TYPE_DEFAULT;
        if(is_string($sPage) && !empty($sPage))
            $this->sPage = $sPage;
    }

    /**
     * Roles decide what every operator may do, so changing them takes "Manage roles" too.
     */
    public function isAccessAllowed()
    {
        return parent::isAccessAllowed() && BxDolStudioRolesUtils::getInstance()->isActionAllowed(BX_SRA_MANAGE_ROLES);
    }

    public function checkAction()
    {
        $sAction = bx_get('rl_action');
    	if($sAction === false)
            return false;

        $sAction = bx_process_input($sAction);

        $aResult = array('code' => 1, 'message' => _t('_adm_rl_err_cannot_process_action'));
        switch($sAction) {
            case 'get-page-by-type':
                $sValue = bx_process_input(bx_get('rl_value'));
                if(empty($sValue))
                    break;

                $this->sPage = $sValue;
                $aResult = array('code' => 0, 'content' => $this->getPageCode());
                break;
        }

        return $aResult;
    }
}

/** @} */
