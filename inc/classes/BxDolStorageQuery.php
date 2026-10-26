<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Database queries for File storage class.
 * @see BxDolStorage
 */
class BxDolStorageQuery extends BxDolDb
{
    protected static $_aFileRowsScopes = []; ///< open file rows scopes, the last one is in use, @see openFileRowsScope

    protected $_aObject;
    protected $_sTableFiles;

    public function __construct($aObject)
    {
        parent::__construct();
        $this->_aObject = $aObject;
        $this->_sTableFiles = '`' . $aObject['table_files'] . '`';
    }

    static public function getStorageObject ($sObject)
    {
        $oDb = BxDolDb::getInstance();
        $sQuery = $oDb->prepare("SELECT * FROM `sys_objects_storage` WHERE `object` = ?", $sObject);
        
        $aTmp = $oDb->getCache('sys_objects_storage_' . $sObject, 'getRow', $sQuery);
        if ($aTmp)
            return $aTmp;
        
        $aRow = $oDb->getRow($sQuery);
        if (isset($aRow['params'])){
            $mParams = unserialize($aRow['params']);
            if ($oDb->isFieldExists($aRow['table_files'], 'dimensions')){
                $aDim =  ['fields' => ['dimensions' => 'getFileDimensions']];
                if (is_array($mParams)){
                    $mParams = array_merge($mParams, $aDim);
                }
                else{
                    $mParams = $aDim;
                }
            }

            $aRow['params'] = serialize($mParams);
        }
        $oDb->setCache('sys_objects_storage_' . $sObject, $aRow);
        return $aRow;
    }

    static public function getStorageObjects ()
    {
        $oDb = BxDolDb::getInstance();
        $sQuery = "SELECT * FROM `sys_objects_storage`";
        return $oDb->getAll($sQuery);
    }

    static public function getAllGhosts ($aParams)
    {
        $oDb = BxDolDb::getInstance();
        $sQuery = "SELECT * FROM `sys_storage_ghosts` WHERE 2>1 ";
        if (isset($aParams['profile_id']))
            $sQuery .= " AND profile_id = :profile_id";
        if (isset($aParams['object']))
            $sQuery .= " AND object = :object";
        if (isset($aParams['content_id']))
            $sQuery .= " AND content_id = :content_id";
        if (isset($aParams['sort_field'])){
			$sQuery .= " ORDER BY `" . $aParams['sort_field'] . "` " . (isset($aParams['sort_direction']) ? $aParams['sort_direction'] : '');
			unset($aParams['sort_field']);
			unset($aParams['sort_direction']);
		}
        return $oDb->getAll($sQuery, $aParams);
    }
    
    public function changeStorageEngine ($sEngine)
    {
        $sQuery = $this->prepare("UPDATE `sys_objects_storage` SET `engine` = ? WHERE `object` = ?", $sEngine, $this->_aObject['object']);
        return $this->query($sQuery);
    }

    public function getMimeTypeByExt($sExt)
    {
        return $this->_getMimeTypeField($sExt, 'mime_type');
    }

    public function getIconByExt($sExt)
    {
        return $this->_getMimeTypeField($sExt, 'icon');
    }

    public function getIconFontByExt($sExt)
    {
        return $this->_getMimeTypeField($sExt, 'icon_font');
    }

    public function clearAllMimeTypes()
    {
        $mixedResult = $this->query("TRUNCATE TABLE `sys_storage_mime_types`");
        $this->cleanMemoryAll();

        return $mixedResult;
    }

    public function addMimeType($sMimeType, $sExt, $sIcon = '', $sIconFont = '')
    {
        $this->cleanMemory($this->_getMimeTypeMemoryKey($sExt));

        $sQuery = $this->prepare("INSERT IGNORE INTO `sys_storage_mime_types` SET `ext` = ?, `mime_type` = ?, `icon` = ?, `icon_font` = ?", $sExt, $sMimeType, $sIcon, $sIconFont);
        return $this->query($sQuery);
    }

    public function getStorageObjectQuota()
    {
        return $this->_aObject;
    }

    public function updateStorageObjectQuota($iSize, $iNumber = 1)
    {
        $iTime = time();
        $sQuery = $this->prepare("
            UPDATE `sys_objects_storage`
            SET `current_size` = `current_size` + ?, `current_number` = `current_number` + (?), `ts` = ?
            WHERE `object` = ?",
            $iSize, $iNumber, $iTime, $this->_aObject['object']
        );
        if ($this->query($sQuery)) {
            $this->_aObject = $this->getStorageObject($this->_aObject['object']);
            return true;
        } else {
            return false;
        }
    }

    public function getUserQuota($iProfileId)
    {
        return BxDolProfileQuery::getInstance()->getProfileQuota($iProfileId);
    }

    public function updateUserQuota($iProfileId, $iSize, $iNumber = 1)
    {
        return BxDolProfileQuery::getInstance()->updateProfileQuota($iProfileId, $iSize, $iNumber);
    }

    public function addFile($iProfileId, $sLocalId, $sPath, $aFileName, $sMimeType, $sExt, $iSize, $iTime, $isPrivate, $aAdditionalFields = array())
    {
        $aBind = array('profile_id' => $iProfileId, 'local_id' => $sLocalId, 'path' => $sPath, 'file_name' => $aFileName, 'mime_type' => $sMimeType, 'ext' => $sExt, 'size' => $iSize, 'time' => $iTime, 'private' => $isPrivate ? 1 : 0);

        $sQuery = "INSERT INTO " . $this->_sTableFiles . " SET
            `profile_id` = :profile_id, `remote_id` = :local_id, `path` = :path, `file_name` = :file_name, `mime_type` = :mime_type, `ext` = :ext, `size` = :size, `added` = :time, `modified` = :time, `private` = :private";

        if ($aAdditionalFields && is_array($aAdditionalFields)) {
            foreach ($aAdditionalFields as $sField => $sValue) {
                $aBind[$sField] = $sValue;
                $sQuery .= ", `$sField` = :$sField";
            }
        }

        return $this->query($sQuery, $aBind);
    }

    public function modifyFilePrivate($iFileId, $isPrivate)
    {
        return $this->modifyCustomField($iFileId, 'private', $isPrivate ? 1 : 0);
    }

    public function modifyCustomField($iFileId, $sField, $sValue, $isUpdateModifiedField = true)
    {
    	$aBindings = array(
    		$sField => $sValue,
    		'id' => $iFileId
    	);
    	
        $sAdd = '';
        if ($isUpdateModifiedField) {
        	$aBindings['modified'] = time();

            $sAdd = ", `modified` = :modified";
        }

        $sQuery = "UPDATE " . $this->_sTableFiles . " SET `{$sField}` = :{$sField} {$sAdd} WHERE `id` = :id";
        $mixedResult = $this->query($sQuery, $aBindings);
        $this->_forgetScopedFileRow($iFileId);

        return $mixedResult;
    }

    public function deleteFile($iFileId)
    {
        // delete queued record for the file
        $sQuery = $this->prepare("DELETE FROM `sys_storage_deletions` WHERE `object` = ? AND `file_id` = ?", $this->_aObject['object'], $iFileId);
        $this->query($sQuery);

        // delete file record
        $sQuery = $this->prepare("DELETE FROM " . $this->_sTableFiles . " WHERE `id` = ?", $iFileId);
        $mixedResult = $this->query($sQuery);
        $this->_forgetScopedFileRow($iFileId);
        if (!$mixedResult)
            return false;

        // delete any file traces in ghosts table
        $sQuery = $this->prepare("DELETE FROM `sys_storage_ghosts` WHERE `object` = ? AND `id` = ?", $this->_aObject['object'], $iFileId);
        $this->query($sQuery);

        return true;
    }

    public function getFileByFileName($sValue)
    {
        return $this->_getFileBy('`file_name`', $sValue);
    }

    public function getFileById($sValue)
    {
        if(empty(self::$_aFileRowsScopes))
            return $this->_getFileBy('`id`', $sValue);

        $iScope = count(self::$_aFileRowsScopes) - 1;
        $sKey = $this->_sTableFiles . '#' . $sValue;
        if(!array_key_exists($sKey, self::$_aFileRowsScopes[$iScope]))
            self::$_aFileRowsScopes[$iScope][$sKey] = $this->_getFileBy('`id`', $sValue);

        return self::$_aFileRowsScopes[$iScope][$sKey];
    }

    /**
     * While a scope is open a file row is read once. bx_api_get_image opens one: the
     * file's url, its info and its local path all read the same row. A row changed or
     * deleted here (BxDolStorage::getFile fills in missing dimensions, for one) is read
     * again, in this scope and in the ones around it. Scopes nest, a nested one starts
     * empty; outside of one rows are always read.
     * @return the scope to give to @see closeFileRowsScope
     */
    public static function openFileRowsScope()
    {
        self::$_aFileRowsScopes[] = [];

        return count(self::$_aFileRowsScopes);
    }

    /**
     * Close the scope and any scope opened inside it that was left open.
     */
    public static function closeFileRowsScope($iScope)
    {
        array_splice(self::$_aFileRowsScopes, max(0, (int)$iScope - 1));
    }

    protected function _forgetScopedFileRow($iFileId)
    {
        $sKey = $this->_sTableFiles . '#' . $iFileId;
        foreach(array_keys(self::$_aFileRowsScopes) as $iScope)
            unset(self::$_aFileRowsScopes[$iScope][$sKey]);
    }

    public function getFileByRemoteId($sValue)
    {
        return $this->_getFileBy('`remote_id`', $sValue);
    }

    protected function _getFileBy($sField, $sValue)
    {
        $sQuery = $this->prepare("SELECT * FROM " . $this->_sTableFiles . " WHERE " . $sField . " = ?", $sValue);
        return $this->getRow($sQuery);
    }

    /**
     * The mime type, icon and font icon of an extension are read with one query, once per
     * request, and forgotten when mime types are added or cleared here or the database memory is cleaned.
     */
    protected function _getMimeTypeField($sExt, $sField)
    {
        $sQuery = $this->prepare("SELECT `mime_type`, `icon`, `icon_font` FROM `sys_storage_mime_types` WHERE `ext` = ?", $sExt);
        $aRow = is_string($sExt) ? $this->fromMemory($this->_getMimeTypeMemoryKey($sExt), 'getRow', $sQuery) : $this->getRow($sQuery);

        return isset($aRow[$sField]) ? $aRow[$sField] : false;
    }

    protected function _getMimeTypeMemoryKey($sExt)
    {
        return 'BxDolStorageQuery::getMimeTypeByExt' . $sExt;
    }

    public function isTokenValid($iFileId, $sToken)
    {
        $iTime = time();
        $sQuery = $this->prepare("SELECT `created` FROM `sys_storage_tokens` WHERE `id` = ? AND `object` = ? AND `hash` = ? AND `created` > ?", $iFileId, $this->_aObject['object'], $sToken, $iTime - $this->_aObject['token_life']);
        return $this->getOne($sQuery) ? true : false;
    }

    public function genToken($iFileId)
    {
        $iTime = time();
        $sToken = md5($iTime . mt_rand() . BX_DOL_SECRET);
        $sQuery = $this->prepare("INSERT INTO `sys_storage_tokens` SET `id` = ?, `object` = ?, `hash` = ?, `created` = ?", $iFileId, $this->_aObject['object'], $sToken, $iTime);
        if ($this->query($sQuery))
            return $sToken;
        else
            return false;
    }

    public function insertGhosts($mixedFileIds, $iProfileId, $iContentId = 0)
    {
        $iTime = time();
        if (!is_array($mixedFileIds))
            $mixedFileIds = array($mixedFileIds);

        $iCount = 0;
        foreach ($mixedFileIds as $iFileId) {
            $sQuery = $this->prepare("INSERT INTO `sys_storage_ghosts`
                SET `id` = ?, `object` = ?, `profile_id` = ?, `content_id` = ?, `created` = ?
                ON DUPLICATE KEY UPDATE `profile_id` = ?, `content_id` = ?, `created` = ?", $iFileId, $this->_aObject['object'], $iProfileId, $iContentId, $iTime, $iProfileId, $iContentId, $iTime);
            $iCount += $this->query($sQuery);
        }
        return $iCount;
    }

    public function updateGhostOrder($iProfileId, $iContentId, $iFileId, $iOrder)
    {
        $aBindings = array(
            'object' => $this->_aObject['object'],
            'content_id' => $iContentId,
            'id' => $iFileId,
            'order' => $iOrder,
        );

        $sWhereClause = " AND `object`=:object AND `content_id`=:content_id AND `id`=:id";

        if(!empty($iProfileId)) {
            $aBindings['profile_id'] = $iProfileId;
            
            $sWhereClause .= " AND `profile_id`=:profile_id";
        }

        return $this->query("UPDATE `sys_storage_ghosts` SET `order`=:order WHERE 1" . $sWhereClause, $aBindings) !== false;
    }

    public function updateGhostsContentId($mixedFileIds, $iProfileId, $iContentId, $aProfiles = array(), $isAdmin = false)
    {
        $aBindings = array(
            'content' => $iContentId,
    		'profile' => $iProfileId,
    		'object' => $this->_aObject['object']
        );

        $sSetAddon = '';
        $sWhere = " AND `profile_id` = :profile ";
        if ($aProfiles || $isAdmin) {
            $sSetAddon = ', `profile_id` = :profile ';
            $sWhere = $isAdmin ? "" : " AND `profile_id` IN(" . $this->implode_escape($aProfiles) . ")";
        }
        
        $sQuery = $this->prepare("UPDATE `sys_storage_ghosts` SET `content_id` = :content $sSetAddon WHERE `object` = :object $sWhere AND `id` IN (" . $this->implode_escape($mixedFileIds) . ")");
        return $this->res($sQuery, $aBindings);
    }
    
    public function updateGhostsUploaderId($mixedFileIds, $iUploaderId)
    {
        return $this->query("UPDATE `sys_storage_ghosts` SET `uploader_id` = :uploader_id WHERE `object` = :object AND `id` IN (" . $this->implode_escape($mixedFileIds) . ")", [
            'object' => $this->_aObject['object'],
            'uploader_id' => $iUploaderId
        ]);
    }

    public function deleteGhosts($mixedFileIds, $iProfileId, $iContentId = false)
    {
    	$aBindings = array(
    		'profile_id' => $iProfileId,
    		'object' => $this->_aObject['object']
    	);
        $sQuery = "DELETE FROM `sys_storage_ghosts` WHERE `profile_id` = :profile_id AND `object` = :object AND `id` IN (" . $this->implode_escape($mixedFileIds) . ")";
        if (false !== $iContentId) {
        	$aBindings['content_id'] = $iContentId;

            $sQuery .= " AND `content_id` = :content_id";
        }
        $iCount = $this->query($sQuery, $aBindings);
        if ($iCount)
            $this->query("OPTIMIZE TABLE `sys_storage_ghosts`");
        return $iCount;
    }

    public function getGhosts($mixedProfileId, $mixedContent = false, $isAdmin = false)
    {
        return $this->getFiles($mixedProfileId, true, $mixedContent, $isAdmin);
    }

    public function getGhost($iFileId)
    {
        $sQuery = $this->prepare("SELECT * FROM `sys_storage_ghosts` WHERE `object` = ? AND `id` = ?", $this->_aObject['object'], $iFileId);
        return $this->getRow($sQuery);
    }

    public function getFiles($mixedProfileId, $isGhostsOnly = false, $mixedContent = false, $isAdmin = false)
    {
        $aBindings = [];

        $sSelect = '`f`.*';
        $sWhere = $sJoin = $sOrder = '';
        if ($isGhostsOnly) {
            $aBindings['object'] = $this->_aObject['object'];

            $sOnProfile = '';
            if ($isAdmin && $mixedContent) {
                // don't check profile id for admins, so admin can edit any entry
            }
            elseif (is_array($mixedProfileId) && $mixedProfileId) {
                $sOnProfile = " AND `g`.`profile_id` IN(" . $this->implode_escape($mixedProfileId) . ") ";
            } 
            elseif (!is_array($mixedProfileId) && false !== $mixedProfileId) {
                $aBindings['profile_id'] = $mixedProfileId;
                
                $sOnProfile = " AND `g`.`profile_id` = :profile_id ";                
            }

            $sSelect .= ", `g`.`uploader_id`, `g`.`created`";
            $sJoin .= " INNER JOIN `sys_storage_ghosts` AS `g` ON (`f`.`id` = `g`.`id` AND `g`.`object` = :object " . $sOnProfile;
            if ($mixedContent !== false) {
                if(!is_array($mixedContent)) {
                    $aBindings['content_id'] = $mixedContent;
                    $sJoin .= " AND `g`.`content_id` = :content_id";
                }
                else {
                    list($aBindings['content_id'], $aBindings['uploader_id']) = $mixedContent;
                    $sJoin .= " AND `g`.`content_id` = :content_id AND `g`.`uploader_id` = :uploader_id";
                }
            }

            $sJoin .= ')';

            $sOrder = ' ORDER BY `g`.`order` ASC, `g`.`created` DESC';
        } 
        else {
            if (is_array($mixedProfileId) && $mixedProfileId) {
                $sWhere = " WHERE `f`.`profile_id` IN(" . $this->implode_escape($mixedProfileId) . ") ";
            }
            elseif (!is_array($mixedProfileId) && false !== $mixedProfileId) {
                $aBindings['profile_id'] = $mixedProfileId;

                $sWhere = " WHERE `f`.`profile_id` = :profile_id ";
            }
        }

        $sQuery = "SELECT " . $sSelect . " FROM " . $this->_sTableFiles . " AS `f` " . $sJoin . $sWhere . $sOrder;
        return $this->getAll($sQuery, $aBindings);
    }

    public function getFilesAll($iStart, $iPerPage)
    {
        $sQuery = $this->prepare("SELECT * FROM " . $this->_sTableFiles . " LIMIT ?, ?", (int)$iStart, (int)$iPerPage);
        return $this->getAll($sQuery);
    }

    public function prune()
    {
        $iTime = time();
        $sQuery = $this->prepare("DELETE FROM `sys_storage_tokens` WHERE `object` = ? AND `created` < ?", $this->_aObject['object'], $iTime - $this->_aObject['token_life']);
        $iCount = $this->query($sQuery);
        if ($iCount)
            $this->query("OPTIMIZE TABLE `sys_storage_tokens`");
        return $iCount;
    }

    public function queueFilesForDeletion ($a)
    {
        $iTime = time();
        $iAdded = 0;
        foreach ($a as $iFileId) {
            $sQuery = $this->prepare("INSERT IGNORE INTO `sys_storage_deletions` SET `object` = ?, `file_id` = ?, `requested` = ?", $this->_aObject['object'], (int)$iFileId, $iTime);
            $iAdded += ($this->query($sQuery) ? 1 : 0);
        }
        return $iAdded;
    }

    public static function getQueuedFilesForDeletion ($iLimit = 1000)
    {
        $oDb = BxDolDb::getInstance();
        $sQuery = $oDb->prepare("SELECT `object`, `file_id` FROM `sys_storage_deletions` ORDER BY `requested` ASC LIMIT ?", $iLimit);
        return $oDb->getAll($sQuery);
    }

    public static function isQueuedFilesForDeletion ($sPrefix)
    {
        $oDb = BxDolDb::getInstance();
        $sQuery = $oDb->prepare("SELECT COUNT(*) FROM `sys_storage_deletions` WHERE `object` LIKE ?", $sPrefix . '%');
        return $oDb->getOne($sQuery);
    }

    public static function getOutdatedUnusedGhosts($iLifetime)
    {
        return BxDolDb::getInstance()->getAll("SELECT * FROM `sys_storage_ghosts` WHERE `content_id` = '0' AND `created` < (UNIX_TIMESTAMP() - :lifetime)", [
            'lifetime' => $iLifetime
        ]);
    }
}

/** @} */
