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
        $sQuery = $oDb->prepare("SELECT * FROM `sys_objects_transcoder` WHERE `object` = ?", $sObject);
        return $oDb->getRow($sQuery);
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

        return $this->query("INSERT INTO {$this->_sTableFiles} SET `transcoder_object` = :transcoder, `file_id` = :file_id, `handler` = :handler $sUpdateATime ON DUPLICATE KEY UPDATE `file_id` = :file_id $sUpdateATime", $aBindings);
    }

    public function getFileIdByHandler ($mixedHandler)
    {
        $sQuery = $this->prepare("SELECT `file_id` FROM {$this->_sTableFiles} WHERE `transcoder_object` = ? AND `handler` = ? LIMIT 1", $this->_aObject['object'], (string)$mixedHandler);
        return $this->getOne($sQuery);
    }

    public function updateObjectModificationTime($iTime = 0)
    {
        $sQuery = $this->prepare("UPDATE `sys_objects_transcoder` SET `ts` = ? WHERE `object` = ?", $iTime ? $iTime : time(), $this->_aObject['object']);
        return $this->res($sQuery);
    }

    public function updateAccessTime($mixedHandler)
    {
        $iTime = time();

        if ($this->getOne("SELECT `atime` FROM {$this->_sTableFiles} WHERE `transcoder_object` = :obj AND `handler` = :hndl AND `atime` > :ts LIMIT 1", array('obj' => $this->_aObject['object'], 'hndl' => (string)$mixedHandler, 'ts' => $iTime - BX_DOL_SKIP_ATIME_UPDATE))) // avoid deadlocks by making changes less frequent
            return true;

        $sQuery = $this->prepare("UPDATE {$this->_sTableFiles} SET `atime` = ? WHERE `transcoder_object` = ? AND `handler` = ? LIMIT 1", $iTime, $this->_aObject['object'], (string)$mixedHandler);
        $mixedRes = $this->res($sQuery);

        $this->setReadOnlyMode(true);

        return $mixedRes;
    }

    public function deleteFileTraces($iFileId)
    {
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

    public function addToQueue ($mixedId, $sFileUrl, $iProfileId)
    {
        if (!$this->_sTableQueue)
            return false;        
        $sQuery = $this->prepare("INSERT INTO `" . $this->_sTableQueue . "` SET `transcoder_object` = ?, `profile_id` = ?, `file_url_source` = ?, `file_id_source` = ?, `status` = ?, `added` = ?, changed = ?", $this->_aObject['object'], $iProfileId, $sFileUrl, $mixedId, BX_DOL_QUEUE_PENDING, time(), time());
        return $this->query($sQuery);
    }

    public function updateQueueStatus ($mixedId, $sStatus, $sLog = '', $sServer = '', $mixedIdResult = '', $sFileUrlResult = '', $sFileExtResult = '', $iPID = 0)
    {
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
