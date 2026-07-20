<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

define('BX_DOL_AI_ASSISTANT', 'assistant');
define('BX_DOL_AI_AUTOMATOR_EVENT', 'event');
define('BX_DOL_AI_AUTOMATOR_SCHEDULER', 'scheduler');
define('BX_DOL_AI_AUTOMATOR_WEBHOOK', 'webhook');

define('BX_DOL_AI_AUTOMATOR_STATUS_AUTO', 'auto');
define('BX_DOL_AI_AUTOMATOR_STATUS_MANUAL', 'manual');
define('BX_DOL_AI_AUTOMATOR_STATUS_READY', 'ready');

class BxDolAI extends BxDolFactory implements iBxDolSingleton
{
    protected $_oDb;
    protected $_iProfileId;
    
    protected $_aExcludeAlertUnits;

    protected $_sCmtsAutomators;
    protected $_sCmtsAssistantsChats;

    protected $_bWriteLog;

    protected function __construct()
    {
        if (isset($GLOBALS['bxDolClasses'][get_class($this)]))
            trigger_error ('Multiple instances are not allowed for the class: ' . get_class($this), E_USER_ERROR);

        parent::__construct();

        $this->_oDb = new BxDolAIQuery();

        $this->_iProfileId = (int)getParam('sys_profile_bot'); 

        $this->_aExcludeAlertUnits = [
            'system', 'module_template_method_call'
        ];

        $this->_sCmtsAutomators = 'sys_agents_automators';
        $this->_sCmtsAssistantsChats = 'sys_agents_assistants_chats';

        $this->_bWriteLog = true;
    }

    /**
     * Prevent cloning the instance
     */
    public function __clone()
    {
        if (isset($GLOBALS['bxDolClasses'][get_class($this)]))
            trigger_error('Clone is not allowed for the class: ' . get_class($this), E_USER_ERROR);
    }

    /**
     * Get singleton instance of the class
     */
    public static function getInstance()
    {
        if (!isset($GLOBALS['bxDolClasses'][__CLASS__])) {
            $GLOBALS['bxDolClasses'][__CLASS__] = BxDolDb::getInstance()->isTableExists('sys_agents_agents') ? new BxDolAI() : null;
        }

        return $GLOBALS['bxDolClasses'][__CLASS__];
    }

    public static function getAgentInstance(int $iId, array $aParams = []): NeuronAI\Agent\Agent
    {
        if (isset($GLOBALS['bxDolClasses'][__CLASS__ . '_Agent_' . $iId]))
            return $GLOBALS['bxDolClasses'][__CLASS__ . '_Agent_' . $iId];

        $a = BxDolAIQuery::getAgentObject($iId);
        if (!$a) {
            $s = "Agent with id {$iId} not found";
            bx_log('sys_agents', $s, BX_LOG_ERR);
            throw new Exception($s);
        }
        if (!$a['active']) {
            $s = "Agent with id {$iId} isn't active";
            bx_log('sys_agents', $s, BX_LOG_ERR);
            throw new Exception($s);
        }
        if (!$a['prompt_system'] || !$a['model_id']) {
            $s = "Agent with id {$iId} can't be used because it haven't prompt or AI model";
            bx_log('sys_agents', $s, BX_LOG_ERR);
            throw new Exception($s);
        }

        $o = BxDolAiAgent::make($a, $aParams);

        if ((int)$a['tools_max_run'] > 0)
            $o->toolMaxRuns($a['tools_max_run']);

        if ($a['vector_store_id']) {
            $aVectorStore = BxDolAIQuery::getVectorStoreObject($a['vector_store_id']);
            if ($aVectorStore && $aVectorStore['embedding_provider_id']) {
                $oEmbedder = self::getAiEmbeddingsProviderInstance($aVectorStore['embedding_provider_id']);
                $o->setEmbeddingsProvider($oEmbedder);
            }
        }

        $GLOBALS['bxDolClasses'][__CLASS__ . '_Agent_' . $iId] = $o;

        return $o;
    }

    public static function getAiProviderInstance(int $iId):NeuronAI\Providers\AIProviderInterface
    {
        return BxDolAIModelFactory::getModelInstance($iId);
    }   

    public static function getAiEmbeddingsProviderInstance(int $iId):NeuronAI\RAG\Embeddings\EmbeddingsProviderInterface
    {
        return BxDolAIModelFactory::getModelInstance($iId);
    }

    public static function callHelper($mixedHelper, $sMessage)
    {
        $oAI = BxDolAI::getInstance();
        if (is_numeric($mixedHelper))
            $aHelper = $oAI->getHelperById($mixedHelper);
        else
             $aHelper = $oAI->getHelperByName($mixedHelper);
        $oAIModel = $oAI->getModelObject($aHelper['model_id']);
        return $oAIModel->getResponseText($aHelper['prompt'], $sMessage);
    }

    public static function pruning()
    {
        BxDolAIAssistant::pruning();
    }

    public static function getDefaultApiKey()
    {
        return getParam('sys_agents_api_key');
    }

    public static function getDefaultModel()
    {
        return (int)getParam('sys_agents_model');
    }

    public static function getAssistantForStudio()
    {
        return ($iId = (int)getParam('sys_agents_studio_assistant')) != 0 ? $iId : 0;
    }

    public static function getAssistantForLiveSearch()
    {
        return ($iId = (int)getParam('sys_agents_live_search_assistant')) != 0 ? $iId : 0;
    }

    public static function getAssistantForAskBlock()
    {
        return ($iId = (int)getParam('sys_agents_ask_block_assistant')) != 0 ? $iId : 0;
    }

    public function getProfileId()
    {
        return $this->_iProfileId;
    }

    public function getModels($aParams = [])
    {
        $aParamsDb = ['sample' => 'all_pairs'];
        if(isset($aParams['active']))
            $aParamsDb['active'] = $aParams['active'] === true ? 1 : 0;
        if(isset($aParams['capabilities']))
            $aParamsDb['capabilities'] = $aParams['capabilities'];

        return $aModel = $this->_oDb->getModelsBy($aParamsDb);
    }

    public function getModel($iId)
    {
        $aModel = $this->_oDb->getModelsBy(['sample' => 'id', 'id' => $iId]);
        if(!empty($aModel['params']))
            $aModel['params'] = json_decode($aModel['params'], true);

        return $aModel;
    }

    public function getModelObject($iId)
    {
        if(!$iId)
            $iId = $this->getDefaultModel();
        if(!$iId)
            return false;

        return BxDolAIModel::getObjectInstance($iId);
    }
    
    public function getProviderObject($iId)
    {
        if(!$iId)
            return false;

        return BxDolAIProvider::getObjectInstance($iId);
    }   

    public function getAssistants($aParams = [])
    {
        $aParamsDb = ['sample' => 'all_pairs'];
        if(isset($aParams['active']))
            $aParamsDb['active'] = $aParams['active'] === true ? 1 : 0;
        if(isset($aParams['hidden']))
            $aParamsDb['hidden'] = $aParams['hidden'] === true ? 1 : 0;

        return $aModel = $this->_oDb->getAssistantsBy($aParamsDb);
    }

    public function getAssistantById($iId)
    {
        return $this->_oDb->getAssistantsBy(['sample' => 'id', 'id' => $iId]);
    }

    public function getAssistantByName($sName)
    {
        return $this->_oDb->getAssistantsBy(['sample' => 'name', 'name' => $sName]);
    }

    public function getAssistantChatById($iId)
    {
        return $this->_oDb->getChatsBy(['sample' => 'id', 'id' => $iId]);
    }

    public function getAssistantChatsTransient($iLifetime = 0)
    {
        return $this->_oDb->getChatsBy(['sample' => 'type', 'type' => BX_DOL_AI_ASST_TYPE_TRANSIENT, 'lifetime' => $iLifetime]);
    }

    public function updateAssistantChatById($iId, $aSet)
    {
        return $this->_oDb->updateChats($aSet, ['id' => $iId]);
    }

    public function getAssistantChatCmts()
    {
        return $this->_sCmtsAssistantsChats;
    }

    public function getAssistantChatCmtsObject($iId, $oTemplate = false)
    {
        $oCmts = BxDolCmts::getObjectInstance($this->_sCmtsAssistantsChats, (int)$iId, true, $oTemplate);
        if(!$oCmts || !$oCmts->isEnabled())
            return false;

        return $oCmts;
    }

    public function getHelperById($iId)
    {
        return $this->_oDb->getHelpersBy(['sample' => 'id', 'id' => $iId]);
    }
    
    public function getHelperByName($sName)
    {
        return $this->_oDb->getHelpersBy(['sample' => 'name', 'name' => $sName]);
    }

    public function getAutomator($iId, $bFullInfo = false)
    {
        $aAutomator = $this->_oDb->getAutomatorsBy(['sample' => 'id' . ($bFullInfo ? '_full' : ''), 'id' => $iId]);
        if(!empty($aAutomator['params']))
            $aAutomator['params'] = json_decode($aAutomator['params'], true);
        if($bFullInfo && !empty($aAutomator['model_params']))
            $aAutomator['model_params'] = json_decode($aAutomator['model_params'], true);

        return $aAutomator;
    }

    public function getAutomatorInstruction($sType, $mixedParams = false)
    {
        $mixedResult = '';

        switch($sType) {
            case 'profile':
                $mixedResult = "\n ProfileId for system actions = " . $mixedParams;
                break;

            case 'providers':
                $aProviders = $this->_oDb->getProvidersBy(['sample' => 'ids', 'ids' => $mixedParams]);
                if(!empty($aProviders) && is_array($aProviders)) {
                    $mixedResult = "\n Proividers list = [";
                    foreach($aProviders as $aProvider)
                        $mixedResult .= "\n {'ProviderName' => '" . $aProvider['name'] . "',  'ProviderType' => '" . $aProvider['type_name'] . "'}";
                    $mixedResult .= "\n ]";
                }
                break;

            case 'helpers':
                $aHelpers = $this->_oDb->getHelpersBy(['sample' => 'ids', 'ids' => $mixedParams]);
                if(!empty($aHelpers) && is_array($aHelpers)) {
                    $mixedResult = "\n Helpers list = [";
                    foreach($aHelpers as $aHelper)
                        $mixedResult .= "\n {'" . $aHelper['name'] . "', 'HelperDescription' => '" . $aHelper['description'] . "'}";
                    $mixedResult .= "\n ]";
                }
                break;

            case 'assistants':
                $aAssistants = $this->_oDb->getAssistantsBy(['sample' => 'ids', 'ids' => $mixedParams]);
                if(!empty($aAssistants) && is_array($aAssistants)) {
                    $mixedResult = "\n Assistants list = [";
                    foreach($aAssistants as $aAssistant)
                        $mixedResult .= "\n {'" . $aAssistant['name'] . "', 'AssistantDescription' => '" . $aAssistant['description'] . "'}";
                    $mixedResult .= "\n ]";
                }
                break;
        }

        return $mixedResult;
    }

    public function getAutomatorCmts()
    {
        return $this->_sCmtsAutomators;
    }

    public function getAutomatorCmtsObject($iId, $oTemplate = false)
    {
        $oCmts = BxDolCmts::getObjectInstance($this->_sCmtsAutomators, (int)$iId, true, $oTemplate);
        if(!$oCmts || !$oCmts->isEnabled())
            return false;

        return $oCmts;
    }

    public function hasAutomators($sType, $bActive = null)
    {
        $aParams = [
            'sample' => 'type', 
            'type' => $sType
        ];
        if($bActive !== null)
            $aParams['active'] = $bActive;

        return ($aAutomators = $this->_oDb->getAutomatorsBy($aParams)) && is_array($aAutomators);
    }

    public function getAutomatorsEvent($sUnit, $sAction)
    {
        if(in_array($sUnit, $this->_aExcludeAlertUnits))
            return [];

        return $this->_oDb->getAutomatorsBy([
            'sample' => 'events', 
            'alert_unit' => $sUnit,
            'alert_action' => $sAction,
            'active' => true
        ]);
    }

    public function getAutomatorsScheduler()
    {
        $aAutomators = $this->_oDb->getAutomatorsBy(['sample' => 'schedulers', 'active' => true]);
        foreach($aAutomators as &$aAutomator)
            if(!empty($aAutomator['params']))
                $aAutomator['params'] = json_decode($aAutomator['params'], true);

        return $aAutomators;
    }

    public function getAutomatorsWebhook($iProviderId)
    {
        $aAutomators = $this->_oDb->getAutomatorsBy(['sample' => 'webhooks', 'provider_id' => $iProviderId, 'active' => true]);
        foreach($aAutomators as &$aAutomator)
            if(!empty($aAutomator['params']))
                $aAutomator['params'] = json_decode($aAutomator['params'], true);

        return $aAutomators;
    }

    public function callAgent($sType, $aAgent, $mixedParams = [])
    {
        if ($mixedParams)
            $sParams = is_string($mixedParams) ? $mixedParams : json_encode($mixedParams);
        else
            $sParams = 'START';

        // update sample data
        $a = ['webhook' => 'webhook_sample'];
        if (isset($a[$sType]) && empty($aAgent[$a[$sType]])) {
            $this->_oDb->updateAgentField($aAgent['id'], $a[$sType], $sParams);
        }

        // set additional params
        $aParams = [];
        if ('message' == $sType || 'form-input' == $sType || 'alert' == $sType) {
            $aParams = ['chat_history_subindex' => $mixedParams['sender_profile_id']];
        }

        // call agent
        $mixed = '';
        try {                        
            $o = self::getAgentInstance($aAgent['id'], $aParams);
            if (!$o)
                return false;

            $oMessage = $o->chat(new NeuronAI\Chat\Messages\UserMessage($sParams))->getMessage();

            $mixed = $oMessage->getContent();

        } catch (Exception $exception) {            
            bx_log('sys_agents', "Exception in '{$aAgent['name']}' agent: " . $exception->getMessage() . " INPUT:" . $sParams, BX_LOG_ERR);
            $mixed = _t('_sys_agents_exception');
        }

        return $mixed;
    }

    public function sendMessengerMessage ($iSender, $iRecipient, $sMsg) 
    {        
        $oMessengerModule = BxDolModule::getInstance('bx_messenger');

        $aAutoReplyData = [
            'message' => $sMsg,
            'participants' => [$iSender, $iRecipient],
        ];

        $iSaveProfileId = $oMessengerModule->setProfileId($iSender);
        $a = $oMessengerModule->sendMessage($aAutoReplyData, $iRecipient, $iSender);
        $oMessengerModule->setProfileId($iSaveProfileId);

        return $a;
    }

    public function getAgentsByAlertUnitAndAction($sUnit, $sAction)
    {
        $aAgents = [];
        $a = $this->_oDb->getAgentsWithAlert();
        foreach ($a as $r) {
            $aAlert = explode(':', $r['alert']); // TODO: remake to concantenate $sUnit and $sAction and then compare
            if (count($aAlert) == 2 && $aAlert[0] == $sUnit && $aAlert[1] == $sAction)
                $aAgents[] = $r;
        }

        return $aAgents;
    }

    public function getAgentsBy($aParams)
    {
        return $this->_oDb->getAgentsBy($aParams);
    }

    public function getAgentsByProfileId($iProfileId)
    {
        return $this->_oDb->getAgentsByProfileId($iProfileId);
    }
    
    public function getAgentsByFormObject($sFormObject)
    {
        return $this->_oDb->getAgentsByFormObject($sFormObject);
    }

    public function getAgentsByTriggerType($sTrigger)
    {
        return $this->_oDb->getAgentsByTriggerType($sTrigger);
    }

    public function getAgentById($iId)
    {
        return $this->_oDb->getAgentById($iId);
    }

    public function getAgentByTriggerWebhookKey($sKey)
    {
        return $this->_oDb->getAgentByTriggerWebhookKey($sKey);
    }

    public function callAutomator($sType, $aParams = [])
    {
        $sMethod = '_callAutomator' . bx_gen_method_name($sType);
        if(!method_exists($this, $sMethod))
            return false;

        return $this->$sMethod($aParams);
    }

    protected function _callAutomatorEvent($aParams = [])
    {
        if(!isset($aParams['automator'], $aParams['alert']) || !is_a($aParams['alert'], 'BxDolAlerts'))
            return false;
        
        $oAlert = &$aParams['alert'];

        $this->evalCode($aParams['automator'], ['alert' => $oAlert]);
    }

    protected function _callAutomatorScheduler($aParams = [])
    {
        if(!isset($aParams['automator']))
            return false;
        
        $this->evalCode($aParams['automator']);
    }

    protected function _callAutomatorWebhook($aParams = [])
    {
        if(!isset($aParams['automator']))
            return false;

        $this->evalCode($aParams['automator']);
    }

    public function evalCode($aAutomator, $aParams = [])
    {
        try {
            $this->_evalCode($aAutomator, $aParams);
        }
        catch (Exception $oException) {
            $this->log($oException->getFile() . ':' . $oException->getLine() . ' ' . $oException->getMessage());
        }
        catch (Error $oError) {
            $this->log($oError->getFile() . ':' . $oError->getLine() . ' ' . $oError->getMessage());
        }
    }

    public function emulCode($aAutomator, $aParams = [])
    {
        ob_start();

        try {
            $this->_evalCode($aAutomator, $aParams);
        }
        catch (Exception $oException) {
            return $oException->getMessage();
        }
        catch (Error $oError) {
            return $oError->getMessage();
        }
        finally {
            $sOutput = ob_get_clean();

            if(!empty($sOutput))
                return $sOutput;
        }
    }

    public function log($mixedContents, $sSection = '')
    {
        if(!$this->_bWriteLog)
            return;

        if(is_array($mixedContents))
            $mixedContents = var_export($mixedContents, true);	
        else if(is_object($mixedContents))
            $mixedContents = json_encode($mixedContents);

        if(empty($sSection))
            $sSection = "Core";

        bx_log('sys_agents', ":\n[" . $sSection . "] " . $mixedContents, BX_LOG_ERR);
    }

    protected function _evalCode($aAutomator, $aParams = [])
    {
        $sCode = '';
        switch($aAutomator['type']) {
            case BX_DOL_AI_AUTOMATOR_EVENT:
                $sCode = $aAutomator['code']. '; onAlert($aParams["alert"]->iObject , $aParams["alert"]->iSender , $aParams["alert"]->aExtras);';
                break;

            case BX_DOL_AI_AUTOMATOR_SCHEDULER:
                $sCode = $aAutomator['code'] . '; onCron();';
                break;

            case BX_DOL_AI_AUTOMATOR_WEBHOOK:
                $sCode = $aAutomator['code'] . '; onHook();';
                break;
        }

        eval($sCode);
    }
}

class BxDolAIMessage
{
    /**
     * @var string - message Type with following values: hb, ai 
     */
    protected $_sType;
    
    /**
     * @var mixed - an array of message parts (text, image_url) or a string.
     */
    protected $_mixedContent;
    
    /**
     * @var array - an array of of files attached to the message.
     */
    protected $_aAttachments;

    public function __construct($sType)
    {
        $this->_sType = $sType;
    }

    public function isAi()
    {
        return $this->_sType == 'ai';
    }

    public function getContent()
    {
        return $this->_mixedContent;
    }

    public function getAttachments()
    {
        return $this->_aAttachments;
    }
}

class BxDolAIMessageString extends BxDolAIMessage
{
    public function __construct($sType, $sContent)
    {
        parent::__construct($sType);

        $this->_mixedContent = is_string($sContent) ? $sContent : '';
    }
}

class BxDolAIMessageArray extends BxDolAIMessage
{
    public function __construct($sType, $aContent = '')
    {
        parent::__construct($sType);

        $this->_mixedContent = is_array($aContent) ? $aContent : [];
    }

    public function addText($sText)
    {
        $this->_mixedContent[] = [
            'type' => 'text',
            'text' => $sText
        ];
    }

    public function addImageUrl($sUrl, $sDetail = 'high')
    {
        $this->_mixedContent[] = [
            'type' => 'image_url',
            'image_url' => [
                'url' => $sUrl,
                'detail' => $sDetail
            ]
        ];
    }

    public function addAttachments($mixedAttachments, $mixedTools = false)
    {
        if(!is_array($mixedAttachments))
            $mixedAttachments = [$mixedAttachments];

        if(!$mixedTools)
            $mixedTools = [['type' => 'file_search']];

        foreach($mixedAttachments as $sAttachment)
            $this->_aAttachments[] = [
                'file_id' => $sAttachment,
                'tools' => $mixedTools
            ];
    }
}

class BxDolAIMessages
{
    /**
     * @var array - an array of items (messages)
     */
    protected $_aItems;

    public function __construct($aItems = [])
    {
        $this->_aItems = !empty($aItems) && is_array($aItems) ? $aItems : [];
    }

    public function add($sType, $mixedMessage)
    {
        $sClass = 'BxDolAIMessage' . (is_string($mixedMessage) ? 'String' : 'Array');
        $this->_aItems[] = new $sClass($sType, $mixedMessage);
    }

    public function getAll()
    {
        return $this->_aItems;
    }

    public function getLast()
    {
        return end($this->_aItems);
    }
}
