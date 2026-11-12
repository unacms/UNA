<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

define('BX_DOL_QUEUE_PRUNE_FAILED', 604800); ///< timeout in seconds when 'failed' items are deleted
define('BX_DOL_QUEUE_PRUNE_PROCESSING', 86400); ///< timeout in seconds when 'processing' items are deleted, in case when something went wrong during processing

/**
 * @see BxDolTranscoder
 */
class BxDolTranscoderQuery extends BxDolDb
{
    const TABLE_QUEUE = 'sys_transcoder_queue';

    /** Open handler scopes, the last one in use: "table#transcoder#handler" => file id (@see openHandlersScope). */
    protected static $_aHandlerScopes = [];

    protected $_aObject;
    protected $_sTableQueue;
    protected $_sTableFiles;
    protected $_sTableFilters;
    protected $_sHandlerPrefix;

    public function __construct($aObject, $bUseQueue = false)
    {
        parent::__construct();
        $this->_aObject = $aObject;
        $this->_sTableQueue = $bUseQueue ? self::TABLE_QUEUE : '';
        $this->_sTableFiles = '`sys_transcoder_images_files`';
        $this->_sTableFilters = '`sys_transcoder_filters`';
        $this->_sHandlerPrefix = 'sys_image_transcoder_';
    }

    static public function getTranscoderObject ($sObject)
    {
        $oDb = BxDolDb::getInstance();
        // all the objects at once, once per request: a page asks for many, some a module has not
        return $oDb->getObjectRow('sys_objects_transcoder', 'object', $sObject);
    }

    static public function getTranscoderObjects ()
    {
        $oDb = BxDolDb::getInstance();
        $sQuery = $oDb->prepare("SELECT * FROM `sys_objects_transcoder`");
        return $oDb->getAll($sQuery);
    }

    public function getTranscoderFilters ($sFilterName = '')
    {
        $aBindings = array('object' => $this->_aObject['object']);
        $sWhere = '';
        if ($sFilterName) {
            $sWhere .= ' AND `filter` = :filter '; 
            $aBindings['filter'] = $sFilterName;
        }
        $sQuery = "SELECT * FROM {$this->_sTableFilters} WHERE `transcoder_object` = :object $sWhere ORDER BY `order` ASC";
        return $this->fromMemory('BxDolTranscoderQuery::getTranscoderFilters' . $this->_aObject['object'] . $sFilterName, 'getAll', $sQuery, $aBindings);

    }

    public function updateHandler ($iFileId, $mixedHandler)
    {
    	$aBindings = array(
    		'transcoder' => $this->_aObject['object'],
    		'file_id' => $iFileId,
    		'handler' => $mixedHandler
    	);

        $sUpdateATime = '';
        if ($this->_aObject['atime_tracking']) {
        	$aBindings['atime'] = time();

            $sUpdateATime = ", `atime` = :atime";
        }

        $this->_forgetScopedHandlers();
        return $this->query("INSERT INTO {$this->_sTableFiles} SET `transcoder_object` = :transcoder, `file_id` = :file_id, `handler` = :handler $sUpdateATime ON DUPLICATE KEY UPDATE `file_id` = :file_id $sUpdateATime", $aBindings);
    }

    public function getFileIdByHandler ($mixedHandler)
    {
        $sKey = $this->_handlerKey($this->_aObject['object'], $mixedHandler);
        $iScope = count(self::$_aHandlerScopes) - 1;
        if ($iScope >= 0 && array_key_exists($sKey, self::$_aHandlerScopes[$iScope]))
            return self::$_aHandlerScopes[$iScope][$sKey];

        // in a scope: the copies of this file by every transcoder of its storage with this
        // one's files table, at once (a page shows the same file in several sizes)
        if ($iScope >= 0 && count($aSiblings = $this->_siblingObjects()) > 1) {
            $this->primeHandlers([(string)$mixedHandler], $aSiblings);
            if (array_key_exists($sKey, self::$_aHandlerScopes[$iScope]))
                return self::$_aHandlerScopes[$iScope][$sKey];
        }

        $sQuery = $this->prepare("SELECT `file_id` FROM {$this->_sTableFiles} WHERE `transcoder_object` = ? AND `handler` = ? LIMIT 1", $this->_aObject['object'], (string)$mixedHandler);
        $mixedFileId = $this->getOne($sQuery);
        if ($iScope >= 0)
            self::$_aHandlerScopes[$iScope][$sKey] = $mixedFileId;
        return $mixedFileId;
    }

    /**
     * The transcoders that make copies of the same originals as this one (the same source
     * storage) and keep them in the same table (the same class), this one with them.
     */
    protected function _siblingObjects()
    {
        static $aSiblings = [];

        $sObject = $this->_aObject['object'];
        if (isset($aSiblings[$sObject]))
            return $aSiblings[$sObject];

        $aSiblings[$sObject] = [$sObject];
        $fSource = function ($aObject) {
            $m = $aObject['source_params'] ?? '';
            if (is_string($m))
                $m = $m !== '' ? @unserialize($m) : [];
            return ($aObject['source_type'] ?? '') . '#' . (is_array($m) ? (string)($m['object'] ?? '') : '');
        };
        $sSource = $fSource($this->_aObject);
        if ($sSource === '#' || substr($sSource, -1) === '#')
            return $aSiblings[$sObject];

        foreach (BxDolDb::getInstance()->getObjectRows('sys_objects_transcoder', 'object') as $sName => $aRow)
            if ((string)$sName !== $sObject && (string)($aRow['override_class_name'] ?? '') === (string)($this->_aObject['override_class_name'] ?? '') && $fSource($aRow) === $sSource)
                $aSiblings[$sObject][] = (string)$sName;

        return $aSiblings[$sObject];
    }

    /**
     * While a scope is open, the transcoded file of a transcoder and a handler is looked up once:
     * a page of an API that shows many files primes them (primeHandlers) and reads each copy's
     * readiness and url from memory. A write here (a new copy, a deleted one) forgets the scope's
     * rows of the table. Scopes nest, a nested one starts empty; outside of one, rows are always read.
     * @return the scope to give to @see closeHandlersScope
     */
    public static function openHandlersScope()
    {
        self::$_aHandlerScopes[] = [];
        return count(self::$_aHandlerScopes);
    }

    /**
     * Close the scope and any scope opened inside it that was left open.
     */
    public static function closeHandlersScope($iScope)
    {
        array_splice(self::$_aHandlerScopes, max(0, (int)$iScope - 1));
    }

    /**
     * In the open scope: the transcoded files of these handlers, for this transcoder and the
     * others of $aObjects that keep theirs in the same table, read in one query (0 for a handler
     * with none yet). Does nothing outside of a scope.
     * @return array the file ids found, of every transcoder
     */
    public function primeHandlers($aHandlers, $aObjects = [])
    {
        $iScope = count(self::$_aHandlerScopes) - 1;
        $aHandlers = array_values(array_unique(array_map('strval', (array)$aHandlers)));
        $aObjects = array_values(array_unique(array_merge([$this->_aObject['object']], (array)$aObjects)));
        if ($iScope < 0 || !$aHandlers)
            return [];

        foreach ($aObjects as $sObject)
            foreach ($aHandlers as $sHandler)
                self::$_aHandlerScopes[$iScope][$this->_handlerKey($sObject, $sHandler)] = false;

        $aRows = $this->getAll("SELECT `transcoder_object`, `handler`, `file_id`, `atime` FROM {$this->_sTableFiles} WHERE `transcoder_object` IN (" . $this->implode_escape($aObjects) . ") AND `handler` IN (" . $this->implode_escape($aHandlers) . ")");
        $aFileIds = [];
        foreach ($aRows as $aRow) {
            $sKey = $this->_handlerKey($aRow['transcoder_object'], $aRow['handler']);
            self::$_aHandlerScopes[$iScope][$sKey] = $aRow['file_id'];
            // the last access too, so updateAccessTime of a copy seen lately reads nothing
            self::$_aHandlerScopes[$iScope][$sKey . '#atime'] = (int)$aRow['atime'];
            $aFileIds[] = (int)$aRow['file_id'];
        }
        return $aFileIds;
    }

    protected function _handlerKey($sObject, $mixedHandler)
    {
        return $this->_sTableFiles . '#' . $sObject . '#' . (string)$mixedHandler;
    }

    protected function _forgetScopedHandlers()
    {
        $sPrefix = $this->_sTableFiles . '#';
        foreach (array_keys(self::$_aHandlerScopes) as $iScope)
            foreach (array_keys(self::$_aHandlerScopes[$iScope]) as $sKey)
                if (strncmp($sKey, $sPrefix, strlen($sPrefix)) === 0)
                    unset(self::$_aHandlerScopes[$iScope][$sKey]);
    }

    public function updateObjectModificationTime($iTime = 0)
    {
        $sQuery = $this->prepare("UPDATE `sys_objects_transcoder` SET `ts` = ? WHERE `object` = ?", $iTime ? $iTime : time(), $this->_aObject['object']);
        return $this->res($sQuery);
    }

    public function updateAccessTime($mixedHandler)
    {
        $iTime = time();

        // a copy primed in the open handlers scope (@see primeHandlers) knows its last access
        $sKey = $this->_handlerKey($this->_aObject['object'], $mixedHandler) . '#atime';
        $iScope = count(self::$_aHandlerScopes) - 1;
        if ($iScope >= 0 && isset(self::$_aHandlerScopes[$iScope][$sKey]) && self::$_aHandlerScopes[$iScope][$sKey] > $iTime - BX_DOL_SKIP_ATIME_UPDATE)
            return true;

        if ($this->getOne("SELECT `atime` FROM {$this->_sTableFiles} WHERE `transcoder_object` = :obj AND `handler` = :hndl AND `atime` > :ts LIMIT 1", array('obj' => $this->_aObject['object'], 'hndl' => (string)$mixedHandler, 'ts' => $iTime - BX_DOL_SKIP_ATIME_UPDATE))) // avoid deadlocks by making changes less frequent
            return true;

        $sQuery = $this->prepare("UPDATE {$this->_sTableFiles} SET `atime` = ? WHERE `transcoder_object` = ? AND `handler` = ? LIMIT 1", $iTime, $this->_aObject['object'], (string)$mixedHandler);
        $mixedRes = $this->res($sQuery);
        if ($iScope >= 0)
            self::$_aHandlerScopes[$iScope][$sKey] = $iTime;

        $this->setReadOnlyMode(true);

        return $mixedRes;
    }

    public function deleteFileTraces($iFileId)
    {
        $this->_forgetScopedHandlers();
        $sQuery = $this->prepare("DELETE FROM {$this->_sTableFiles} WHERE `transcoder_object` = ? AND `file_id` = ?", $this->_aObject['object'], $iFileId);
        return $this->res($sQuery);
    }

    public function getFilesForPruning ()
    {
        if (!$this->_aObject['atime_tracking'] || !$this->_aObject['atime_pruning'])
            return array();

        $sQuery = $this->prepare("SELECT * FROM {$this->_sTableFiles} WHERE `transcoder_object` = ? AND `atime` != 0 AND `atime` < ?", $this->_aObject['object'], time() - $this->_aObject['atime_pruning']);
        return $this->getAll($sQuery);
    }

    public function registerHandlers ()
    {
        if (!$this->registerHandler ('getAlertHandlerNameLocal', 'alert_response_file_delete_local', $this->_aObject['object'], $this->_aObject['storage_object']))
            return false;

        // add handler for original storage engine
        if ('Storage' == $this->_aObject['source_type']) // if original storage is "Storage", not "Folder"
            if (!$this->registerHandler ('getAlertHandlerNameOrig', 'alert_response_file_delete_orig', $this->_aObject['object'], $this->_aObject['source_params']['object']))
                return false;

        return true;
    }

    public function unregisterHandlers ()
    {
        if (!$this->unregisterHandler('getAlertHandlerNameLocal', $this->_aObject['storage_object']))
            return false;

        // remove handler for original storage engine
        if ('Storage' == $this->_aObject['source_type']) // if original storage is "Storage", not "Folder"
            if (!$this->unregisterHandler('getAlertHandlerNameOrig', $this->_aObject['source_params']['object']))
                return false;

        return true;
    }

    static public function getForDeletionFromQueue ($sServer, $iLimit = 10)
    {
        $oDb = BxDolDb::getInstance();

        // check if files which are processing are alive
        if (function_exists('posix_kill')) {
            $sQuery = $oDb->prepare("SELECT * FROM `" . self::TABLE_QUEUE . "` WHERE `server` = ? AND `status` = 'processing'", $sServer);
            if ($a = $oDb->getAll($sQuery)) {
                foreach ($a as $r) {
                    $o = BxDolTranscoder::getObjectInstance($r['transcoder_object']);
                    if ($o && $r['pid'] && !posix_kill($r['pid'], 0)) {
                        $o->getDb()->updateQueueStatus($r['file_id_source'], BX_DOL_QUEUE_FAILED, "transcoding process died unexpectedly\n");
                    }
                }
            }
        }

        // delete items which are stuck in processing status
        $sQuery = $oDb->prepare("DELETE FROM `" . self::TABLE_QUEUE . "` WHERE `server` = ? AND `status` = ? AND `changed` < ? - ?", $sServer, BX_DOL_QUEUE_PROCESSING, time(), BX_DOL_QUEUE_PRUNE_PROCESSING);
        $oDb->query($sQuery);

        // get files which are subject to delete: with status 'delete' and expired 'failed' items
        $sQuery = $oDb->prepare("SELECT * FROM `" . self::TABLE_QUEUE . "` WHERE `server` = ? AND ((`status` = ? AND `changed` < ? - ?) OR `status` = ?)", $sServer, BX_DOL_QUEUE_FAILED, time(), BX_DOL_QUEUE_PRUNE_FAILED, BX_DOL_QUEUE_DELETE);
        return $oDb->getAll($sQuery);
    }

    static public function deleteFromQueueById ($iId)
    {
        $oDb = BxDolDb::getInstance();
        $sQuery = $oDb->prepare("SELECT * FROM `" . self::TABLE_QUEUE . "` WHERE `id` = ?", $iId);
        return $oDb->query($sQuery);
    }

    static public function getCompletedFromQueue ($iLimit = 10)
    {
        $oDb = BxDolDb::getInstance();
        $sQuery = $oDb->prepare("SELECT * FROM `" . self::TABLE_QUEUE . "` WHERE `status` = 'complete' ORDER BY `added` ASC LIMIT ?", $iLimit);
        return $oDb->getAll($sQuery);
    }

    static public function getNextInQueue ($sServer, $iLimit = 5)
    {
        $oDb = BxDolDb::getInstance();
        $sQuery = $oDb->prepare("SELECT COUNT(*) FROM `" . self::TABLE_QUEUE . "` WHERE `server` = ? AND `status` = 'processing'", $sServer);
        if ($oDb->getOne($sQuery))
            return array();

        /**
         * Rows of a transcoder that isn't registered (its module was uninstalled) are skipped, or they'd
         * take a place in every run and, once there are $iLimit of them, stop transcoding altogether.
         * They are kept: the module may come back, and Studio's dashboard can clear the queue.
         */
        $sQuery = $oDb->prepare("SELECT `tq`.* FROM `" . self::TABLE_QUEUE . "` AS `tq` INNER JOIN `sys_objects_transcoder` AS `tot` ON `tq`.`transcoder_object` = `tot`.`object` WHERE `tq`.`status` = 'pending' ORDER BY `tq`.`added` ASC LIMIT ?", $iLimit);
        return $oDb->getAll($sQuery);
    }

    public function getQueueTable ()
    {
        return $this->_sTableQueue;
    }

    public function deleteFromQueue ($mixedId)
    {
        self::$_aQueueStatus = [];
        if (!$this->_sTableQueue)
            return false;

        $sQuery = $this->prepare("DELETE FROM `" . $this->_sTableQueue . "` WHERE `transcoder_object` = ? AND `file_id_source` = ?", $this->_aObject['object'], $mixedId);
        return $this->query($sQuery);
    }

    public function getFromQueue ($mixedId)
    {
        if (!$this->_sTableQueue)
            return false;

        $sQuery = $this->prepare("SELECT * FROM `" . $this->_sTableQueue . "` WHERE `transcoder_object` = ? AND `file_id_source` = ?", $this->_aObject['object'], $mixedId);
        return $this->getRow($sQuery);
    }

    /**
     * Where these files are in this transcoder's queue (pending, processing, complete, failed,
     * delete; null for none), read in one query and kept for this request, so getQueueStatus of
     * each reads nothing: for a page of an API that says which videos are being converted.
     */
    public function primeQueue ($aHandlers)
    {
        $aHandlers = array_values(array_unique(array_map('strval', array_filter((array)$aHandlers))));
        if (!$this->_sTableQueue || !$aHandlers)
            return;

        $aStatus = $this->getPairs("SELECT `file_id_source`, `status` FROM `" . $this->_sTableQueue . "` WHERE `transcoder_object` = :object AND `file_id_source` IN (" . $this->implode_escape($aHandlers) . ")", 'file_id_source', 'status', ['object' => $this->_aObject['object']]);
        foreach ($aHandlers as $sHandler)
            self::$_aQueueStatus[$this->_aObject['object'] . '#' . $sHandler] = isset($aStatus[$sHandler]) ? (string)$aStatus[$sHandler] : null;
    }

    /** Where a file is in this transcoder's queue (see primeQueue), null for nowhere. */
    public function getQueueStatus ($mixedId)
    {
        if (!$this->_sTableQueue)
            return null;
        $sKey = $this->_aObject['object'] . '#' . (string)$mixedId;
        if (!array_key_exists($sKey, self::$_aQueueStatus))
            self::$_aQueueStatus[$sKey] = ($s = $this->getOne("SELECT `status` FROM `" . $this->_sTableQueue . "` WHERE `transcoder_object` = :object AND `file_id_source` = :id", ['object' => $this->_aObject['object'], 'id' => (string)$mixedId])) !== false && $s !== null && $s !== '' ? (string)$s : null;
        return self::$_aQueueStatus[$sKey];
    }

    /** What primeQueue and getQueueStatus read: object#handler => status or null; forgotten when the queue changes here. */
    protected static $_aQueueStatus = [];

    public function addToQueue ($mixedId, $sFileUrl, $iProfileId)
    {
        self::$_aQueueStatus = [];
        if (!$this->_sTableQueue)
            return false;
        $sQuery = $this->prepare("INSERT INTO `" . $this->_sTableQueue . "` SET `transcoder_object` = ?, `profile_id` = ?, `file_url_source` = ?, `file_id_source` = ?, `status` = ?, `added` = ?, changed = ?", $this->_aObject['object'], $iProfileId, $sFileUrl, $mixedId, BX_DOL_QUEUE_PENDING, time(), time());
        return $this->query($sQuery);
    }

    public function updateQueueStatus ($mixedId, $sStatus, $sLog = '', $sServer = '', $mixedIdResult = '', $sFileUrlResult = '', $sFileExtResult = '', $iPID = 0)
    {
        self::$_aQueueStatus = [];
        if (!$this->_sTableQueue)
            return false;

		$aSet = array(
			'status' => $sStatus,
			'changed' => time()
		);

		if($sLog)
			$aSet['log'] = $sLog;
        if($sServer)
        	$aSet['server'] = $sServer;
        if($iPID)
            $aSet['pid'] = $iPID;
		if($mixedIdResult && $sFileUrlResult)
			$aSet = array_merge($aSet, array(
				'file_id_result' => $mixedIdResult,
				'file_url_result' => $sFileUrlResult,
				'file_ext_result' => $sFileExtResult
			));

        $sQuery = $this->prepare("UPDATE `" . $this->_sTableQueue . "` SET " . $this->arrayToSQL($aSet) . " WHERE `transcoder_object` = ? AND `file_id_source` = ?", $this->_aObject['object'], $mixedId);
        return $this->query($sQuery);
    }

    protected function registerHandler ($sHandlerNameFunc, $sServiceFunc, $sObject, $sUnit)
    {
        $sHandlerName = $this->$sHandlerNameFunc ();
        $iHandlerId = $this->getAlertHandlerId ($sHandlerName);
        if ($iHandlerId) // if handler already exists, do nothing
            return true;

        $sServiceCall = serialize(array(
            'module' => 'system',
            'method' => $sServiceFunc,
            'params' => array($sObject),
            'class' => 'TemplImageServices'
        ));
        $sQuery = $this->prepare("INSERT INTO `sys_alerts_handlers` SET `name` = ?, `service_call` = ?", $sHandlerName, $sServiceCall);
        if (!$this->query($sQuery))
            return false;
        $iHandlerId = $this->lastId();
        $sQuery = $this->prepare("INSERT INTO `sys_alerts` SET `unit` = ?, `action` = ?, `handler_id` = ?", $sUnit, 'file_deleted', $iHandlerId);
        if (!$this->query($sQuery)) {
            $this->unregisterHandlers ();
            return false;
        }

        return true;
    }

    protected function unregisterHandler ($sHandlerNameFunc, $sUnit)
    {
        $sHandlerName = $this->$sHandlerNameFunc ();
        $iHandlerId = $this->getAlertHandlerId ($sHandlerName);
        if (!$iHandlerId) // if handler is alrady missing, do nothing
            return true;

        $sQuery = $this->prepare("DELETE FROM `sys_alerts` WHERE `unit` = ? AND `action` = ? AND `handler_id` = ?", $sUnit, 'file_deleted', $iHandlerId);
        if (!$this->query($sQuery))
            return false;

        $sQuery = $this->prepare("DELETE FROM `sys_alerts_handlers` WHERE `id` = ?", $iHandlerId);
        return $this->query($sQuery);
    }

    protected function getAlertHandlerNameLocal ()
    {
        return $this->_sHandlerPrefix . 'local_file_delete_' . $this->_aObject['object'];
    }

    protected function getAlertHandlerNameOrig ()
    {
        return $this->_sHandlerPrefix . 'orig_file_delete_' . $this->_aObject['object'];
    }

    protected function getAlertHandlerId ($sHandlerName)
    {
        $sQuery = $this->prepare("SELECT `id` FROM `sys_alerts_handlers` WHERE `name` = ?", $sHandlerName);
        return $this->getOne($sQuery);
    }

    public function getTranscodedFileData($mixedHandler)
    {
        $sQuery = $this->prepare("SELECT `data` FROM {$this->_sTableFiles} WHERE `transcoder_object` = ? AND `handler` = ? LIMIT 1", $this->_aObject['object'], (string)$mixedHandler);
        $s = $this->getOne($sQuery);
        if (!$s)
            return false;
        return unserialize($s);
    }

    public function updateTranscodedFileData($mixedHandler, $mixedData)
    {
        $sData = $mixedData ? serialize($mixedData) : '';
        $sQuery = $this->prepare("UPDATE {$this->_sTableFiles} SET `data` = ? WHERE `transcoder_object` = ? AND `handler` = ? LIMIT 1", $sData, $this->_aObject['object'], (string)$mixedHandler);

        return $this->res($sQuery);
    }
}

/** @} */
