<?php defined('BX_DOL') or defined('BX_DOL_INSTALL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

bx_import('BxDolDb');

/**
 * # Alert/Handler/Hooks engine.
 *
 * Is needed to fire some alert(event) in one place and caught it with a handler somewhere else.
 *
 * Related classes:
 *  BxDolAlertsResponse - abstract class for all response classes.
 *
 * ### Example of usage:
 * 
 * **First** Fire an alert
 *
 * @code
 * $oZ = new BxDolAlerts('unit_name', 'action', 'object_id', 'sender_id', array('of_extra_params'));
 * $oZ->alert();
 * @endcode
 * or
 * @code
 * bx_alert('unit_name', 'action', 'object_id', 'sender_id', ['extra', 'params']);
 * @endcode
 *
 * **Second** Add handler and caught alert(s)
 *  a. Create Response class by extending BxDolAlertsResponse class. It should process all necessary alerts which are passed to it.    
 *  b. Register your handler in the database by adding it in `sys_alerts_handlers` table.   
 *  c. Associate necessary alerts with the handler by adding them in the `sys_alerts` table.  
 */
class BxDolAlerts extends BxDol
{
    public $sUnit;
    public $sAction;
    public $iObject;
    public $iSender;
    public $aExtras;

    protected $_aAlerts;
    protected $_aHandlers;
    protected $_aCacheTriggers;
    protected $_aCacheTriggersMarkers;
    protected $_oCacheObject;
    
    protected static $_aCacheData;

    /**
     * Constructor
     * @param string $sType     - system type
     * @param string $sAction   - system action
     * @param int    $iObjectId - object id
     * @param int    $iSenderId - sender (action's author) profile id, if it is false - then currectly logged in profile id is used
     */
    public function __construct($sUnit, $sAction, $iObjectId, $iSender = false, $aExtras = array())
    {
        parent::__construct();

        if (!isset(self::$_aCacheData))
            self::$_aCacheData = $this->getAlertsData();
        
        $this->_aAlerts = self::$_aCacheData['alerts'];
        $this->_aHandlers = self::$_aCacheData['handlers'];
        $this->_aCacheTriggers = isset(self::$_aCacheData['cache_triggers']) ? self::$_aCacheData['cache_triggers'] : [];

        $this->sUnit = $sUnit;
        $this->sAction = $sAction;
        $this->iObject = $iObjectId;
        $this->aExtras = $aExtras;
        if (false === $iSender) {
            $oProfile = BxDolProfile::getInstance();
            $this->iSender = $oProfile ? $oProfile->id() : 0;
        } else {
            $this->iSender = (int)$iSender;
        }

        if (getParam('sys_db_cache_enable')) {
            $this->_aCacheTriggersMarkers = $this->aExtras;
            $this->_aCacheTriggersMarkers['_alert_content'] = $this->iObject;
            $this->_aCacheTriggersMarkers['_alert_sender'] = $this->iSender;
            $this->_aCacheTriggersMarkers['_hash'] = bx_site_hash();

    		$sEngine = getParam('sys_db_cache_engine');
	    	$this->_oCacheObject = bx_instance('BxDolCache'.$sEngine);
		    if(!$this->_oCacheObject->isAvailable())
			    $this->_oCacheObject = bx_instance('BxDolCacheFile');
        }
    }

    public static function cacheInvalidate()
    {
        return BxDolDb::getInstance()->cleanCache ('sys_alerts');
    }

    /**
     * Notifies the necessary handlers about the alert.
     */
    public function alert()
    {
        if (isset($this->_aAlerts[$this->sUnit]) && isset($this->_aAlerts[$this->sUnit][$this->sAction]))

            foreach($this->_aAlerts[$this->sUnit][$this->sAction] as $iHandlerId) {                
                $aHandler = $this->_aHandlers[$iHandlerId];                
                if(!$aHandler['active'])
                    continue;

                if (isset($GLOBALS['bx_profiler']) && 'bx_profiler' != $aHandler['name']) 
                    $GLOBALS['bx_profiler']->beginAlert($this->sUnit, $this->sAction, $aHandler['name']);
                $fStart = microtime(true);

                if (!empty($aHandler['file']) && !empty($aHandler['class']) && file_exists(BX_DIRECTORY_PATH_ROOT . $aHandler['file'])) {
                    if(!class_exists($aHandler['class'], false))
                        require_once(BX_DIRECTORY_PATH_ROOT . $aHandler['file']);

                    $oHandler = new $aHandler['class']();
                    $oHandler->response($this);
                } else if(!empty($aHandler['service_call']) && BxDolService::isSerializedService($aHandler['service_call'])) {
                    $aService = BxDolService::decodeServiceCall($aHandler['service_call']);
                    if (false === $aService)
                        continue;

                    $aParams = array($this);
                    if(isset($aService['params']) && is_array($aService['params']))
                        $aParams = array_merge($aParams, $aService['params']);

                    BxDolService::call($aService['module'], $aService['method'], $aParams, isset($aService['class']) ? $aService['class'] : 'Module');
                }
                
                BxDolAlertsStats::hit($aHandler['name'], microtime(true) - $fStart);
                if (isset($GLOBALS['bx_profiler']) && 'bx_profiler' != $aHandler['name']) 
                    $GLOBALS['bx_profiler']->endAlert($this->sUnit, $this->sAction, $aHandler['name']);
            }
        
        // process cache triggers

        if ($this->_oCacheObject && isset($this->_aCacheTriggers[$this->sUnit]) && isset($this->_aCacheTriggers[$this->sUnit][$this->sAction])) {
            foreach($this->_aCacheTriggers[$this->sUnit][$this->sAction] as $a) {
                $a['cache_key'] = preg_replace_callback('/({[\d\w]+})/', function ($m) {
                    $sKey = trim($m[1], '{}');
                    return $this->_aCacheTriggersMarkers[$sKey];
                }, $a['cache_key']);
                $this->_oCacheObject->delData($a['cache_key']);
            }
        }

        // log alert
        BxDolAlertsStats::log($this);

        // call agents
        $oAi = BxDolAI::getInstance();
        if($aAgents = $oAi->getAgentsByAlertUnitAndAction($this->sUnit, $this->sAction)) {
            foreach($aAgents as $a) {
                $aParams = [
                    'trigger' => 'alert',
                    'object_id' => $this->iObject,
                    'sender_profile_id' => $this->iSender,
                    'unit' => $this->sUnit, 
                    'action' => $this->sAction,
                    'extra' => $this->aExtras,
                ];
                if ($a['async']) {
                    BxDolBackgroundJobs::getInstance()->add(bin2hex(random_bytes(16)), [
                        'system', 'call_agent', 
                        ['alert', $a, $aParams], 
                        'TemplServices'
                    ]);
                }
                else {
                    $sExtraJSON = $oAi->callAgent('alert', $a, $aParams);

                    $aExtra = [];
                    if ($sExtraJSON && 0 === bx_mb_strpos($sExtraJSON, '{'))
                        $aExtra = json_decode($sExtraJSON, true);
                    
                    if ($aExtra && is_array($aExtra)) {
                        foreach ($aExtra as $k => $v) {
                            if (isset($this->aExtras[$k]))
                                $this->aExtras[$k] = $v;
                        }
                    }
                }
            }
        }

        // call automators
        $oAi = BxDolAI::getInstance();
        if($oAi->hasAutomators(BX_DOL_AI_AUTOMATOR_EVENT, true)) {
            $aAutomators = $oAi->getAutomatorsEvent($this->sUnit, $this->sAction);
            foreach($aAutomators as $aAutomator) {
                $oAi->callAutomator(BX_DOL_AI_AUTOMATOR_EVENT, [
                    'automator' => $aAutomator,
                    'alert' => $this
                ]);
            }
        }        
    }

    /**
     * Cache alerts and handlers.
     *
     * @return an array with all alerts and handlers.
     */
    public function getAlertsData()
    {
        $oDb = BxDolDb::getInstance();
        $aResult = array('alerts' => array(), 'handlers' => array());

        $aAlerts = $oDb->getAll("SELECT `unit`, `action`, `handler_id` FROM `sys_alerts` ORDER BY `id` ASC");
        foreach ($aAlerts as $aAlert)
            $aResult['alerts'][$aAlert['unit']][$aAlert['action']][] = $aAlert['handler_id'];

        $aHandlers = $oDb->getAll("SELECT * FROM `sys_alerts_handlers` ORDER BY `id` ASC");
        foreach ($aHandlers as $aHandler)
            $aResult['handlers'][$aHandler['id']] = [
                'name' => $aHandler['name'],
                'class' => $aHandler['class'], 
                'file' => $aHandler['file'], 
                'service_call' => $aHandler['service_call'],
                'active' => (int)$aHandler['active']
            ];

        $aCacheTriggers = $oDb->getAll("SELECT * FROM `sys_alerts_cache_triggers` ORDER BY `id` ASC");
        $aResult['cache_triggers'] = [];
        foreach ($aCacheTriggers as $r)
            $aResult['cache_triggers'][$r['unit']][$r['action']][] = [
                'cache_key' => $r['cache_key'],
            ];

        return $aResult;
    }

    static public function resetAlertsCounter24h()
    {
        $oDb = BxDolDb::getInstance();
        $oDb->query("UPDATE sys_alerts_log SET counter_24h = 0");
    }

    static public function deleteModuleAlerts($sUnit)
    {
        $oDb = BxDolDb::getInstance();
        $oDb->query("DELETE FROM sys_alerts_log WHERE unit = :unit", ['unit' => $sUnit]);
    }
}

class BxDolAlertsResponse extends BxDol
{
    public function __construct()
    {
        parent::__construct();
    }

    public function response($oAlert) {}
}

/** @} */
