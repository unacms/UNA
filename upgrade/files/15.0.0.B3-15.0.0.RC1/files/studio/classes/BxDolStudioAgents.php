<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

define('BX_DOL_STUDIO_AGENTS_TYPE_SETTINGS', 'settings');
define('BX_DOL_STUDIO_AGENTS_TYPE_ASSISTANTS', 'assistants');

define('BX_DOL_STUDIO_AGENTS_TYPE_AI_PROVIDERS', 'ai_providers');
define('BX_DOL_STUDIO_AGENTS_TYPE_TOOLS', 'tools');
define('BX_DOL_STUDIO_AGENTS_TYPE_VECTOR_STORE', 'vector_store');
define('BX_DOL_STUDIO_AGENTS_TYPE_AGENTS', 'agents');

/*
 * Isn't used for now. Most probably they will be removed.
 */
define('BX_DOL_STUDIO_AGENTS_TYPE_AUTOMATORS', 'automators');
define('BX_DOL_STUDIO_AGENTS_TYPE_PROVIDERS', 'providers');
define('BX_DOL_STUDIO_AGENTS_TYPE_HELPERS', 'helpers');

define('BX_DOL_STUDIO_AGENTS_TYPE_DEFAULT', BX_DOL_STUDIO_AGENTS_TYPE_SETTINGS);

class BxDolStudioAgents extends BxTemplStudioWidget
{
    protected $oDbAi;

    protected $sPage;

    function __construct($sPage = "")
    {
        parent::__construct('agents');

        $this->oDbAi = new BxDolAIQuery();

        $this->sPage = BX_DOL_STUDIO_AGENTS_TYPE_DEFAULT;
        if(is_string($sPage) && !empty($sPage))
            $this->sPage = $sPage;
    }
    
    public function checkAction()
    {
        $sAction = bx_get('agt_action');
    	if($sAction === false)
            return false;

        $sAction = bx_process_input($sAction);

        $aResult = ['code' => 1, 'message' => _t('_adm_pgt_err_cannot_process_action')];
        switch($sAction) {
            case 'agent-check-name':
                $sValue = false;
                if(($sValue = bx_get('agt_value')) !== false)
                    $sValue = bx_process_input($sValue, BX_DATA_TEXT);
                else
                    break;

                $sNameFld = 'name';
                $sNameVal = '';
                if(($iId = (int)bx_get('id'))) {
                    $aAgent = $this->oDbAi->getAgentById($iId);
                    if(strcmp($sValue, $aAgent[$sNameFld]) == 0) 
                        $sNameVal = $sValue;
                }

                $aResult = [
                    'code' => 0,
                    'title' => $sValue,
                    'name' => $sNameVal ?: uriGenerate($sValue, 'sys_agents_agents', $sNameFld, ['lowercase' => true])
                ];
                break;
                
            case 'agent-activate':
                $iValue = 0;
                if(($iValue = bx_get('agt_value')) !== false)
                    $iValue = bx_process_input($iValue, BX_DATA_TEXT);
                else
                    break;
                
                $aAgent = $this->oDbAi->getAgentById($iValue);
                if(!$aAgent || !$this->oDbAi->updateAgentField($iValue, 'active', 1 - (int)$aAgent['active']))
                    $aResult = ['coed' => 2, 'message' => _t('_sys_txt_error_occured')];
                else
                    $aResult = ['coed' => 0];
                break;
        }

        return $aResult;
    }
}

/** @} */
