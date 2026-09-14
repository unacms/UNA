<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

class BxDolAiQuery extends BxDolDb
{
    public function __construct()
    {
        parent::__construct();
    }

    static protected function _getObject(int $iId, string $sTable): array|bool
    {
        $oDb = BxDolDb::getInstance();

        $a = $oDb->getRow("SELECT * FROM `$sTable` WHERE `id` = :id", ['id' => $iId]);
        if(!$a || !is_array($a))
            return false;

        return $a;
    }

    static public function getModelObject(int $iId): array|bool
    {
        return self::_getObject($iId, 'sys_agents_models');
    }

    static public function getVectorStoreObject(int $iId): array|bool
    {
        return self::_getObject($iId, 'sys_agents_vector_store');
    }

    static public function getAgentObject(int $iId): array|bool
    {
        return self::_getObject($iId, 'sys_agents_agents');
    }

    static public function getToolObject(int $iId): array|bool
    {
        return self::_getObject($iId, 'sys_agents_tools');
    }

    public function insertModel($aModel)
    {
        if(empty($aModel))
            return false;

        return (int)$this->query("INSERT INTO `sys_agents_models` SET " . $this->arrayToSQL($aModel));
    }

    public function getModelsBy($aParams = [])
    {
        $aMethod = ['name' => 'getAll', 'params' => [0 => 'query']];
    	$sWhereClause = "";

        switch($aParams['sample']) {
            case 'id':
            	$aMethod['name'] = 'getRow';
            	$aMethod['params'][1] = [
                    'id' => $aParams['id']
                ];

                $sWhereClause .= " AND `id`=:id";
                break;

            case 'all_pairs':
                $aMethod['name'] = 'getPairs';
                $aMethod['params'][1] = 'id';
                $aMethod['params'][2] = 'title';
                $aMethod['params'][3] = [];

                if(isset($aParams['active'])) {
                    $aMethod['params'][3]['active'] = $aParams['active'];

                    $sWhereClause .= " AND `active`=:active";
                }

                if(isset($aParams['capabilities'])) {
                    if (is_array($aParams['capabilities']))
                    {                        
                        $sWhereClause .= " AND `capabilities` IN (" . $this->implode_escape($aParams['capabilities']) . ")"; 
                    }
                    else {
                        $aMethod['params'][3]['capabilities'] = $aParams['capabilities'];
                        $sWhereClause .= " AND `capabilities` = :capabilities";
                    }
                }
                break;
        }

        $aMethod['params'][0] = "SELECT * 
            FROM `sys_agents_models`
            WHERE 1" . $sWhereClause;

        return call_user_func_array([$this, $aMethod['name']], $aMethod['params']);
    }

    public function getVectorStores (): mixed
    {
        $sQuery = "SELECT `id`, `title` FROM `sys_agents_vector_store` WHERE `active` = 1 ORDER BY `title` ASC";
        return $this->getPairs($sQuery, 'id', 'title'); 
    }

    public function getVectorStoreById (int $iId): mixed
    {
        $sQuery = "SELECT * FROM `sys_agents_vector_store` WHERE `id` = :id";
        return $this->getRow($sQuery, ['id' => $iId]); 
    }

    public function insertVectorStore($aVectorStore)
    {
        if(empty($aVectorStore) || !is_array($aVectorStore))
            return false;

        return (int)$this->query("INSERT INTO `sys_agents_vector_store` SET " . $this->arrayToSQL($aVectorStore));
    }

    public function getVectorStoreDataNum (int $iVectorStoreId): int
    {
        $sQuery = "SELECT COUNT(*) FROM `sys_agents_vector_store_data` WHERE `vector_store_id` = :vector_store_id";
        return (int)$this->getOne($sQuery, ['vector_store_id' => $iVectorStoreId]);
    }

    public function addVectorStoreData (int $iVectorStoreId, string $sType, string $sName, int $iFileSize, string $sMetadata, string $sSettings, string $sContent): bool
    {
        $sQuery = "INSERT INTO `sys_agents_vector_store_data` SET  
            `vector_store_id` = :vector_store_id,
            `type` = :type, 
            `name` = :name, 
            `size` = :size,
            `metadata` = :metadata, 
            `settings` = :settings, 
            `content` = :content,
            `added` = :ts
        ";
        return $this->query($sQuery, [
            'vector_store_id' => $iVectorStoreId,
            'type' => $sType, 
            'name' => $sName, 
            'size' => $iFileSize,
            'metadata' => $sMetadata, 
            'settings' => $sSettings, 
            'content' => $sContent,
            'ts' => time()]) > 0;
    }

    public function getVectorStoreDataById (int $iId): mixed
    {
        $sQuery = "SELECT * FROM `sys_agents_vector_store_data` WHERE `id` = :id";
        return $this->getRow($sQuery, ['id' => $iId]);
    }

    static public function getVectorStorePendingData (int $iLimit = 1): mixed
    {
        $oDb = BxDolDb::getInstance();
        $sQuery = "SELECT * FROM `sys_agents_vector_store_data` WHERE `status` = 'pending' ORDER BY `added` ASC LIMIT :limit";
        return $oDb->getAll($sQuery, ['limit' => $iLimit]);
    }

    static public function updateVectorStoreDataStatus (int $iId, string $sStatus): mixed
    {
        $oDb = BxDolDb::getInstance();
        $sQuery = "UPDATE `sys_agents_vector_store_data` SET `status` = :status WHERE `id` = :id";
        return $oDb->query($sQuery, ['status' => $sStatus, 'id' => $iId]);
    }

    public function getAgentsWithAlert($bActiveOnly = true)
    {
        return $this->fromCache('sys_agents_with_alert', 'getAll', "SELECT * FROM `sys_agents_agents` WHERE `trigger` = 'alert' AND `active` = :active", ['active' => $bActiveOnly ? 1 : 0]);
    }

    public function getAgentsByProfileId($iProfileId, $bActiveOnly = true)
    {
        return $this->getAll("SELECT * FROM `sys_agents_agents` WHERE `trigger` = 'message' AND `profile_id` = :profile AND `active` = :active", ['profile' => $iProfileId, 'active' => $bActiveOnly ? 1 : 0]);
    }

    public function getAgentsByFormObject($sFormObject, $bActiveOnly = true)
    {
        return $this->fromMemory('sys_agents_with_form_' . $sFormObject, 'getAll', "SELECT * FROM `sys_agents_agents` WHERE `trigger` = 'form-input' AND `form_object` = :form_object AND `active` = :active", ['form_object' => $sFormObject, 'active' => $bActiveOnly ? 1 : 0]);
    }

    public function getAgentsBy($aParams = [])
    {
        $aMethod = ['name' => 'getAll', 'params' => [0 => 'query']];
    	$sWhereClause = "";

        switch($aParams['sample']) {
            case 'id':
            	$aMethod['name'] = 'getRow';
            	$aMethod['params'][1] = [
                    'id' => $aParams['id']
                ];

                $sWhereClause .= " AND `id`=:id";
                break;

            case 'all':
                if(isset($aParams['active'])) {
                    $aMethod['params'][3]['active'] = $aParams['active'];

                    $sWhereClause .= " AND `active`=:active";
                }
                break;
        }

        $aMethod['params'][0] = "SELECT * 
            FROM `sys_agents_agents`
            WHERE 1" . $sWhereClause;

        return call_user_func_array([$this, $aMethod['name']], $aMethod['params']);
    }

    public function getAgentById(int $iId): mixed
    {
        return $this->getAgentsBy(['sample' => 'id', 'id' => $iId]);
    }

    public function getAgentByTriggerWebhookKey($sKey, $bActiveOnly = true)
    {
        return $this->getRow("SELECT * FROM `sys_agents_agents` WHERE `trigger` = 'webhook' AND `webhook_key` = :key AND `active` = :active", ['key' => $sKey, 'active' => $bActiveOnly ? 1 : 0]);
    }
    
    public function getAgentsByTriggerType($sTrigger, $bActiveOnly = true)
    {
        return $this->getAll("SELECT * FROM `sys_agents_agents` WHERE `trigger` = :trigger AND `active` = :active", ['trigger' => $sTrigger, 'active' => $bActiveOnly ? 1 : 0]);
    }

    public function updateAgentField($iId, $sField, $sValue)
    {
        return $this->query("UPDATE `sys_agents_agents` SET `$sField` = :value WHERE `id` = :id", ['value' => $sValue, 'id' => $iId]);
    }

    public function getToolById (int $iId): mixed
    {
        $sQuery = "SELECT * FROM `sys_agents_tools` WHERE `id` = :id";
        return $this->getRow($sQuery, ['id' => $iId]); 
    }

    public function insertTool(array $aFields): int
    {
        if(empty($aFields) || !is_array($aFields))
            return false;

        return (int)$this->query("INSERT INTO `sys_agents_tools` SET " . $this->arrayToSQL($aFields));
    }

    public function getTools()
    {
        $sQuery = "SELECT `id`, `title` FROM `sys_agents_tools` WHERE `active` = 1 ORDER BY `title` ASC";
        return $this->getPairs($sQuery, 'id', 'title'); 
    }

    public function wipeAgentChatHistory($aAgent) 
    {
        $sQuery = "DELETE FROM `sys_agents_chat_history` WHERE `thread_id` LIKE :val";
        $iAffected = 0;
        $iAffected += $this->query($sQuery, ['val' => $aAgent['trigger'] . ':' . $aAgent['id'] . ':%']);
        $iAffected += $this->query($sQuery, ['val' => $aAgent['trigger'] . ':' . $aAgent['id']]);
        return $iAffected;
    }

    public function getAgentChatHistoryRows($aAgent)
    {
        $sExact = ($aAgent['trigger'] ?? '') . ':' . ($aAgent['id'] ?? '');
        $sFields = "`id`, `thread_id`, `messages`, `created_at`, `updated_at`";
        if ($this->isFieldExists('sys_agents_chat_history', 'closed_reason'))
            $sFields .= ", `closed_reason`";
        return $this->getAll("
            SELECT $sFields
            FROM `sys_agents_chat_history`
            WHERE `thread_id` = :exact OR `thread_id` LIKE :prefix
            ORDER BY `updated_at` DESC
            LIMIT 200
        ", [
            'exact' => $sExact,
            'prefix' => $sExact . ':%',
        ]);
    }

    public function getChatHistoryIdByThreadId($sThreadId)
    {
        $sThreadId = (string)$sThreadId;
        if ($sThreadId === '' || $sThreadId === ':')
            return 0;
        return (int)$this->getOne("SELECT `id` FROM `sys_agents_chat_history` WHERE `thread_id` = :t", [
            't' => $sThreadId,
        ]);
    }

    public function getChatHistoryMessagesByThreadId($sThreadId)
    {
        $sThreadId = (string)$sThreadId;
        if ($sThreadId === '')
            return '';
        return $this->getOne("SELECT `messages` FROM `sys_agents_chat_history` WHERE `thread_id` = :t", [
            't' => $sThreadId,
        ]);
    }

    public function getChatHistoryClosedReasonById($iHistoryId)
    {
        $iHistoryId = (int)$iHistoryId;
        if ($iHistoryId <= 0 || !$this->isFieldExists('sys_agents_chat_history', 'closed_reason'))
            return '';
        return (string)$this->getOne(
            "SELECT `closed_reason` FROM `sys_agents_chat_history` WHERE `id` = :id",
            ['id' => $iHistoryId]
        );
    }

    public function isNewChatSession($sThreadId)
    {
        $sThreadId = (string)$sThreadId;
        if ($sThreadId === '')
            return true;

        $aRow = $this->getRow("SELECT `ip`, `messages` FROM `sys_agents_chat_history` WHERE `thread_id` = :t", [
            't' => $sThreadId,
        ]);
        if (!$aRow)
            return true;

        $iIp = (int)($aRow['ip'] ?? 0);
        $sMessages = trim((string)($aRow['messages'] ?? ''));
        return $iIp <= 0 || $sMessages === '' || $sMessages === '[]';
    }

    public function countChatSessionsByIp($sIp, $sPrefix, $iWindowSec)
    {
        $sSince = date('Y-m-d H:i:s', time() - (int)$iWindowSec);
        return (int)$this->getOne("
            SELECT COUNT(*) FROM `sys_agents_chat_history`
            WHERE `ip` = :ip
              AND (`thread_id` = :prefix OR `thread_id` LIKE :prefix_like)
              AND `created_at` >= :since
        ", [
            'ip' => $sIp,
            'prefix' => $sPrefix,
            'prefix_like' => $sPrefix . ':%',
            'since' => $sSince,
        ]);
    }

    public function getChatArtifactsByHistoryIds($aIds)
    {
        $aIds = array_values(array_unique(array_filter(array_map('intval', (array)$aIds))));
        if (!$aIds)
            return [];

        $sIn = implode(',', $aIds);
        $aRows = $this->getAll("
            SELECT `history_id`, `field_name`, `field_value`
            FROM `sys_agents_chat_artifacts`
            WHERE `history_id` IN ($sIn)
            ORDER BY `id` ASC
        ");
        return $this->mapChatArtifactRows($aRows);
    }

    public function getChatArtifactsByThreadId($sThreadId)
    {
        $sThreadId = (string)$sThreadId;
        if ($sThreadId === '')
            return [];

        $aRows = $this->getAll("
            SELECT `a`.`history_id`, `a`.`field_name`, `a`.`field_value`
            FROM `sys_agents_chat_artifacts` AS `a`
            INNER JOIN `sys_agents_chat_history` AS `h` ON `h`.`id` = `a`.`history_id`
            WHERE `h`.`thread_id` = :t
            ORDER BY `a`.`id` ASC
        ", [
            't' => $sThreadId,
        ]);
        $aMap = $this->mapChatArtifactRows($aRows);
        if (!$aMap)
            return [];
        return (array)reset($aMap);
    }

    public function getChatArtifactsForAgent($aAgent)
    {
        $sExact = ($aAgent['trigger'] ?? '') . ':' . ($aAgent['id'] ?? '');
        if ($sExact === ':')
            return [];

        $aRows = $this->getAll("
            SELECT `a`.`history_id`, `a`.`field_name`, `a`.`field_value`
            FROM `sys_agents_chat_artifacts` AS `a`
            INNER JOIN `sys_agents_chat_history` AS `h` ON `h`.`id` = `a`.`history_id`
            WHERE `h`.`thread_id` = :exact OR `h`.`thread_id` LIKE :prefix
            ORDER BY `a`.`id` ASC
        ", [
            'exact' => $sExact,
            'prefix' => $sExact . ':%',
        ]);
        return $this->mapChatArtifactRows($aRows);
    }

    protected function mapChatArtifactRows($aRows)
    {
        if (!is_array($aRows) || !$aRows)
            return [];

        $aOut = [];
        foreach ($aRows as $aRow) {
            if (!is_array($aRow))
                continue;
            $iHistoryId = (int)($aRow['history_id'] ?? 0);
            $sName = trim((string)($aRow['field_name'] ?? ''));
            if ($iHistoryId <= 0 || $sName === '')
                continue;
            $aOut[$iHistoryId][] = [
                'field_name' => $sName,
                'field_value' => (string)($aRow['field_value'] ?? ''),
            ];
        }
        return $aOut;
    }

    public function getExpiredAgentChatHistoryIds($aAgent, $iTtlMin)
    {
        if (!$this->isFieldExists('sys_agents_chat_history', 'closed_reason'))
            return [];

        $sExact = ($aAgent['trigger'] ?? '') . ':' . ($aAgent['id'] ?? '');
        $iTtlMin = (int)$iTtlMin;
        if ($sExact === ':' || $iTtlMin <= 0)
            return [];

        return $this->getColumn("
            SELECT `id` FROM `sys_agents_chat_history`
            WHERE (`thread_id` = :exact OR `thread_id` LIKE :prefix)
              AND `messages` IS NOT NULL AND `messages` != '' AND `messages` != '[]'
              AND (`closed_reason` = '' OR `closed_reason` IS NULL)
              AND `updated_at` <= DATE_SUB(NOW(), INTERVAL :ttl MINUTE)
        ", [
            'exact' => $sExact,
            'prefix' => $sExact . ':%',
            'ttl' => $iTtlMin,
        ]);
    }

    /**
     * Rename this agent's guest threads (`…:{sessionId}`) onto a profile id.
     * If the member thread already has messages, drop the guest copy.
     */
    public function adoptGuestChatHistory($aAgent, $sSessionId, $iProfileId)
    {
        $sSessionId = (string)$sSessionId;
        $iProfileId = (int)$iProfileId;
        if ($sSessionId === '' || !$iProfileId || empty($aAgent['id']))
            return 0;

        $sPrefix = $aAgent['trigger'] . ':' . $aAgent['id'] . ':';
        $sOldSuffix = ':' . $sSessionId;
        $sNewSuffix = ':' . $iProfileId;
        $iLen = strlen($sOldSuffix);
        $aBindings = [
            'p' => $sPrefix . '%',
            'o' => $sOldSuffix,
            'n' => $sNewSuffix,
        ];

        $this->query("
            DELETE `g` FROM `sys_agents_chat_history` AS `g`
            INNER JOIN `sys_agents_chat_history` AS `m`
                ON `m`.`thread_id` = CONCAT(LEFT(`g`.`thread_id`, CHAR_LENGTH(`g`.`thread_id`) - $iLen), :n)
            WHERE `g`.`thread_id` LIKE :p AND RIGHT(`g`.`thread_id`, $iLen) = :o
              AND `m`.`messages` IS NOT NULL AND `m`.`messages` != '' AND `m`.`messages` != '[]'
        ", $aBindings);

        $this->query("
            DELETE `m` FROM `sys_agents_chat_history` AS `m`
            INNER JOIN `sys_agents_chat_history` AS `g`
                ON `g`.`thread_id` LIKE :p AND RIGHT(`g`.`thread_id`, $iLen) = :o
               AND `m`.`thread_id` = CONCAT(LEFT(`g`.`thread_id`, CHAR_LENGTH(`g`.`thread_id`) - $iLen), :n)
            WHERE `m`.`messages` = '' OR `m`.`messages` = '[]' OR `m`.`messages` IS NULL
        ", $aBindings);

        $iAffected = (int)$this->query("
            UPDATE `sys_agents_chat_history`
            SET `thread_id` = CONCAT(LEFT(`thread_id`, CHAR_LENGTH(`thread_id`) - $iLen), :n)
            WHERE `thread_id` LIKE :p AND RIGHT(`thread_id`, $iLen) = :o
        ", $aBindings);

        return $iAffected;
    }

    static public function getAlert($s) {
        if (!$s)
            return false;        
        $a = explode(':', $s);
        $oDb = BxDolDb::getInstance();
        return $oDb->getRow("SELECT * FROM `sys_alerts_log` WHERE `unit` = :unit AND `action` = :action", [
            'unit' => $a[0] ?? '',
            'action' => $a[1] ?? '',
        ]);
    }

    public function getAlerts()
    {
        $aValues = [];
        $aAlerts = $this->getAll("SELECT `unit`, `action`, `counter_24h`, `counter_per_request` FROM `sys_alerts_log` ORDER BY `unit`, `action`");
        foreach ($aAlerts as $a) {
            $sKey = $a['unit'] . ':' . $a['action'];
            $aValues[$sKey] = [
                'key' => $sKey,
                'unit' => $a['unit'],
                'action' => $a['action'],
                'name' => $a['unit'] . ' - ' . $a['action'],
                'desc' => $this->getAlertDesc($a['unit'] . ':' . $a['action']),
                'counter_24h' => $a['counter_24h'],
                'counter_per_request' => $a['counter_per_request'],
            ];
        }
        return $aValues;
    }

    public function getFormDisplay($sObject)
    {
        $aDisplays = $this->getColumn("SELECT `display_name` FROM `sys_form_displays` WHERE `object` = :object", ['object' => $sObject]);
        return $aDisplays ? current($aDisplays) : null;
    }

    public function getFormObjects()
    {
        $aValues = [];
        $aForms = $this->getAll("SELECT `f`.`object`, `f`.`title`, `f`.`module`, `m`.`title` AS `module_title` FROM `sys_objects_form` AS f INNER JOIN `sys_modules` as `m` ON `m`.`name` = `f`.`module` ORDER BY `f`.`module`, `f`.`object` ASC");
        foreach ($aForms as $r) {
            if ('system' != $r['module']) {
                $oModule = BxDolModule::getInstance($r['module']);
                if (!$oModule || !$oModule->isEnabled())
                    continue;
            }
            
            $sDisplay = $this->getFormDisplay($r['object']);
            if (!$sDisplay) 
                continue;
            $oForm = BxDolForm::getObjectInstance($r['object'], $sDisplay);
            $sFormId = $oForm->getId();
            $aValues[$r['object']] = [
                'form_id' => $sFormId,
                'form_object' => $r['object'],
                'module' => $r['module'],
                'module_title' => $r['module_title'],
                'form_title' => _t($r['title']),
            ];
        }
        return $aValues;
    }

    static public function getAlertDesc($sAlert) 
    {
        if (!$sAlert)
            return '';
        $oDb = BxDolDb::getInstance();
        [$sUnit, $sAction] = explode(':', $sAlert);
        $sDesc = $oDb->getOne("SELECT `description` FROM `sys_alerts_desc` WHERE `unit` = :unit AND `action` = :action LIMIT 1", [
            'unit' => $sUnit,
            'action' => $sAction,
        ]);
        if (!$sDesc) {
            $sDesc = $oDb->getOne("SELECT `description` FROM `sys_alerts_desc` WHERE `unit` LIKE '{%}' AND `action` = :action LIMIT 1", [
                'action' => $sAction,
            ]);
        }
        return $sDesc;
    }
}

/** @} */
