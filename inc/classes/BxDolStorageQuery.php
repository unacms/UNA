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
     * In the open file rows scope: the rows of these files read in one query (an empty row for
     * one there is not), so getFileById of each reads none. Does nothing outside of a scope.
     */
    public function primeFileRows($aIds)
    {
        if(empty(self::$_aFileRowsScopes))
            return;

        $iScope = count(self::$_aFileRowsScopes) - 1;
        $aIds = array_values(array_unique(array_filter(array_map('intval', (array)$aIds))));
        $aMissing = [];
        foreach($aIds as $iId)
            if(!array_key_exists($this->_sTableFiles . '#' . $iId, self::$_aFileRowsScopes[$iScope]))
                $aMissing[] = $iId;
        if(!$aMissing)
            return;

        $aRows = $this->getAllWithKey("SELECT * FROM " . $this->_sTableFiles . " WHERE `id` IN (" . $this->implode_escape($aMissing) . ")", 'id');
        foreach($aMissing as $iId)
            self::$_aFileRowsScopes[$iScope][$this->_sTableFiles . '#' . $iId] = $aRows[$iId] ?? [];
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
        // API v2 only: what is not an extension has no row (a link's query string comes with the
        // name of a private file's link: getFileExt of '...jpg?t=...'), so there is nothing to
        // read. The site and API v1 ask the database, as they always did (it matches without
        // accents and trailing spaces, which this check does not).
        if(bx_is_api_v2() && is_string($sExt) && !preg_match('/^[A-Za-z0-9_.+-]*$/', $sExt))
            return false;

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

    /**
     * The first token of a private file made at or after $iSince, false when there is none: for
     * a link that is given out again while its token has life left (getFileUrlByIdShared). The
     * first one, so that tokens made later in the same period (by other links) don't change it.
     */
    public function getTokenSince($iFileId, $iSince)
    {
        // a page's links read at once (primeTokensSince)
        $sKey = $this->_tokenScopeKey($iFileId, $iSince);
        if(!empty(self::$_aFileRowsScopes) && array_key_exists($sKey, self::$_aFileRowsScopes[count(self::$_aFileRowsScopes) - 1]))
            return self::$_aFileRowsScopes[count(self::$_aFileRowsScopes) - 1][$sKey];

        $sQuery = $this->prepare("SELECT `hash` FROM `sys_storage_tokens` WHERE `id` = ? AND `object` = ? AND `created` >= ? ORDER BY `created` ASC, `iid` ASC", $iFileId, $this->_aObject['object'], (int)$iSince);
        $sToken = $this->getOne($sQuery);
        $sToken = is_string($sToken) && $sToken !== '' ? $sToken : false;
        // in a scope the first one is the first one for the rest of it (a page links a file in several sizes)
        if($sToken !== false)
            $this->rememberTokenSince($iFileId, $iSince, $sToken);
        return $sToken;
    }

    /**
     * In the open file rows scope: the first token of a file made at or after $iSince, which
     * getTokenSince then gives without reading it (one just made for a file that had none).
     */
    public function rememberTokenSince($iFileId, $iSince, $sToken)
    {
        if(!empty(self::$_aFileRowsScopes) && is_string($sToken) && $sToken !== '')
            self::$_aFileRowsScopes[count(self::$_aFileRowsScopes) - 1][$this->_tokenScopeKey($iFileId, $iSince)] = $sToken;
    }

    /**
     * In the open file rows scope: the first token made at or after $iSince of each of these
     * files (getTokenSince) read in one query, and one made in one more for each file that has
     * none, so getTokenSince of each reads and writes nothing: for a page of private files that
     * their owner gets the links of. Does nothing outside of a scope. $bMake false: only the
     * tokens there are (a file with none gets one when its link is asked for, as without priming).
     */
    public function primeTokensSince($aIds, $iSince, $bMake = true)
    {
        if(empty(self::$_aFileRowsScopes))
            return;

        $iScope = count(self::$_aFileRowsScopes) - 1;
        $aMissing = [];
        foreach(array_values(array_unique(array_filter(array_map('intval', (array)$aIds)))) as $iId)
            if(!array_key_exists($this->_tokenScopeKey($iId, $iSince), self::$_aFileRowsScopes[$iScope]))
                $aMissing[$iId] = $iId;
        if(!$aMissing)
            return;

        $aRows = $this->getAll("SELECT `id`, `hash` FROM `sys_storage_tokens` WHERE `object` = :object AND `created` >= :since AND `id` IN (" . $this->implode_escape(array_values($aMissing)) . ") ORDER BY `created` ASC, `iid` ASC", [
            'object' => $this->_aObject['object'],
            'since' => (int)$iSince,
        ]);
        foreach($aRows as $aRow) {
            $iId = (int)$aRow['id'];
            if(!isset($aMissing[$iId]) || (string)$aRow['hash'] === '')
                continue;
            self::$_aFileRowsScopes[$iScope][$this->_tokenScopeKey($iId, $iSince)] = (string)$aRow['hash'];
            unset($aMissing[$iId]);
        }
        if(!$aMissing || !$bMake)
            return;

        // the files with none get one each, in one statement
        $iTime = time();
        $aValues = $aTokens = [];
        foreach($aMissing as $iId) {
            $aTokens[$iId] = self::_newToken();
            $aValues[] = $this->prepareAsString("(?, ?, ?, ?)", $iId, $this->_aObject['object'], $aTokens[$iId], $iTime);
        }
        $bAdded = (bool)$this->query("INSERT INTO `sys_storage_tokens` (`id`, `object`, `hash`, `created`) VALUES " . implode(', ', $aValues));
        foreach($aTokens as $iId => $sToken)
            self::$_aFileRowsScopes[$iScope][$this->_tokenScopeKey($iId, $iSince)] = $bAdded ? $sToken : false;
    }

    /**
     * As primeTokensSince for the files of several storages, in a query per period start (one,
     * when the storages' tokens live as long) and one statement for the tokens made.
     * @param array $aItems [query object, file ids, period start] of each storage
     */
    public static function primeTokensSinceOfStorages($aItems, $bMake = true)
    {
        if(empty(self::$_aFileRowsScopes) || !$aItems)
            return;

        $iScope = count(self::$_aFileRowsScopes) - 1;
        $aMissing = []; // period start => object => id => [query, id]
        foreach($aItems as list($oQuery, $aIds, $iSince))
            foreach(array_unique(array_filter(array_map('intval', (array)$aIds))) as $iId)
                if(!array_key_exists($oQuery->_tokenScopeKey($iId, $iSince), self::$_aFileRowsScopes[$iScope]))
                    $aMissing[(int)$iSince][$oQuery->_aObject['object']][$iId] = $oQuery;
        if(!$aMissing)
            return;

        $oDb = BxDolDb::getInstance();
        foreach($aMissing as $iSince => $aByObject) {
            $aIds = [];
            foreach($aByObject as $aObjectIds)
                $aIds += array_combine(array_keys($aObjectIds), array_keys($aObjectIds));
            $aRows = $oDb->getAll("SELECT `id`, `object`, `hash` FROM `sys_storage_tokens` WHERE `object` IN (" . $oDb->implode_escape(array_keys($aByObject)) . ") AND `created` >= :since AND `id` IN (" . $oDb->implode_escape(array_values($aIds)) . ") ORDER BY `created` ASC, `iid` ASC", [
                'since' => $iSince,
            ]);
            foreach($aRows as $aRow) {
                $iId = (int)$aRow['id'];
                if(!isset($aMissing[$iSince][$aRow['object']][$iId]) || (string)$aRow['hash'] === '')
                    continue;
                $oQuery = $aMissing[$iSince][$aRow['object']][$iId];
                self::$_aFileRowsScopes[$iScope][$oQuery->_tokenScopeKey($iId, $iSince)] = (string)$aRow['hash'];
                unset($aMissing[$iSince][$aRow['object']][$iId]);
            }
        }
        if(!$bMake)
            return;

        // the files with none get one each, in one statement
        $iTime = time();
        $aValues = $aTokens = [];
        foreach($aMissing as $iSince => $aByObject)
            foreach($aByObject as $sObject => $aObjectIds)
                foreach($aObjectIds as $iId => $oQuery) {
                    $sToken = self::_newToken();
                    $aTokens[] = [$oQuery->_tokenScopeKey($iId, $iSince), $sToken];
                    $aValues[] = $oDb->prepareAsString("(?, ?, ?, ?)", $iId, $sObject, $sToken, $iTime);
                }
        if(!$aValues)
            return;
        $bAdded = (bool)$oDb->query("INSERT INTO `sys_storage_tokens` (`id`, `object`, `hash`, `created`) VALUES " . implode(', ', $aValues));
        foreach($aTokens as list($sKey, $sToken))
            self::$_aFileRowsScopes[$iScope][$sKey] = $bAdded ? $sToken : false;
    }

    /**
     * A token for a private file's link made here: 32 hex digits, as genToken's are (the
     * `hash` column holds as many), from the system's random source.
     */
    protected static function _newToken()
    {
        return bin2hex(random_bytes(16));
    }

    protected function _tokenScopeKey($iFileId, $iSince)
    {
        return 'token#' . $this->_aObject['object'] . '#' . (int)$iFileId . '#' . (int)$iSince;
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
        $this->_forgetScopedGhosts();
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
        $this->_forgetScopedGhosts();
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
        $this->_forgetScopedGhosts();
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
        $this->_forgetScopedGhosts();
        return $this->query("UPDATE `sys_storage_ghosts` SET `uploader_id` = :uploader_id WHERE `object` = :object AND `id` IN (" . $this->implode_escape($mixedFileIds) . ")", [
            'object' => $this->_aObject['object'],
            'uploader_id' => $iUploaderId
        ]);
    }

    public function deleteGhosts($mixedFileIds, $iProfileId, $iContentId = false)
    {
        $this->_forgetScopedGhosts();
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

    /**
     * In the open file rows scope: the ghosts of these contents (getGhosts of an author's
     * files of one content), read in one query, so getGhosts of each reads none. Does nothing
     * outside of a scope.
     * @return array the ids of the files of these contents' ghosts (of every author)
     */
    public function primeGhostsByContents($aContentIds)
    {
        if(empty(self::$_aFileRowsScopes))
            return [];

        $iScope = count(self::$_aFileRowsScopes) - 1;
        $aAll = $aIds = [];
        foreach((array)$aContentIds as $mId)
            if(($iId = (int)$mId) > 0) {
                $aAll[$iId] = $iId;
                if(!array_key_exists($this->_ghostsScopeKey($iId), self::$_aFileRowsScopes[$iScope]))
                    $aIds[$iId] = $iId;
            }
        if($aIds)
            $this->_primeGhosts($iScope, $aIds);

        $aFileIds = [];
        foreach($aAll as $iId)
            foreach(self::$_aFileRowsScopes[$iScope][$this->_ghostsScopeKey($iId)] ?? [] as $aRow)
                $aFileIds[] = (int)$aRow['id'];
        return $aFileIds;
    }

    protected function _primeGhosts($iScope, $aIds)
    {
        $aByContent = array_fill_keys(array_values($aIds), []);
        // as getFiles reads the ghosts of one content, in its order, with whose and which content
        // each is; ghosts in the same place keep the order they were added in, as getFiles reads
        // them by its profile, object and content key
        $aRows = $this->getAll("SELECT `f`.*, `g`.`uploader_id`, `g`.`created`, `g`.`content_id` AS `bx_ghost_content_id`, `g`.`profile_id` AS `bx_ghost_profile_id` FROM " . $this->_sTableFiles . " AS `f`  INNER JOIN `sys_storage_ghosts` AS `g` ON (`f`.`id` = `g`.`id` AND `g`.`object` = :object  AND `g`.`content_id` IN (" . $this->implode_escape(array_values($aIds)) . ")) ORDER BY `g`.`content_id`, `g`.`order` ASC, `g`.`created` DESC, `g`.`iid` ASC", [
            'object' => $this->_aObject['object'],
        ]);
        foreach($aRows as $aRow)
            $aByContent[(int)$aRow['bx_ghost_content_id']][] = $aRow;
        foreach($aByContent as $iId => $aGhosts)
            self::$_aFileRowsScopes[$iScope][$this->_ghostsScopeKey($iId)] = $aGhosts;
    }

    /**
     * @see BxDolStorage::primeGhostsOfStorages
     * @param array $aQueries storage object => its query object
     */
    public static function primeGhostsOfStorages($aQueries, $aContentIds)
    {
        if(empty(self::$_aFileRowsScopes) || !$aQueries)
            return [];

        $iScope = count(self::$_aFileRowsScopes) - 1;
        $aIds = $aMissing = [];
        foreach((array)$aContentIds as $mId)
            if(($iId = (int)$mId) > 0) {
                $aIds[$iId] = $iId;
                foreach($aQueries as $sObject => $oQuery)
                    if(!array_key_exists($oQuery->_ghostsScopeKey($iId), self::$_aFileRowsScopes[$iScope]))
                        $aMissing[$sObject][$iId] = $iId;
            }

        if($aMissing) {
            $oDb = BxDolDb::getInstance();
            $aContents = [];
            foreach($aMissing as $aObjectIds)
                $aContents += $aObjectIds;
            // in getFiles's order of one content's ghosts, the ones in the same place in the order they were added
            $aGhosts = [];
            foreach($oDb->getAll("SELECT * FROM `sys_storage_ghosts` WHERE `object` IN (" . $oDb->implode_escape(array_keys($aMissing)) . ") AND `content_id` IN (" . $oDb->implode_escape(array_values($aContents)) . ") ORDER BY `content_id`, `order` ASC, `created` DESC, `iid` ASC") as $aGhost)
                $aGhosts[$aGhost['object']][] = $aGhost;

            foreach($aMissing as $sObject => $aObjectIds) {
                $oQuery = $aQueries[$sObject];
                $aByContent = array_fill_keys(array_values($aObjectIds), []);
                $aOwn = array_filter($aGhosts[$sObject] ?? [], function ($aGhost) use ($aByContent) { return isset($aByContent[(int)$aGhost['content_id']]); });
                if($aOwn)
                    $oQuery->primeFileRows(array_column($aOwn, 'id'));
                // a row as getFiles joins it: the file's, with the ghost's uploader and time (an INNER JOIN: a ghost without its file is none)
                foreach($aOwn as $aGhost) {
                    $aRow = $oQuery->getFileById($aGhost['id']);
                    if(empty($aRow) || !is_array($aRow))
                        continue;
                    $aRow['uploader_id'] = $aGhost['uploader_id'];
                    $aRow['created'] = $aGhost['created'];
                    $aRow['bx_ghost_content_id'] = $aGhost['content_id'];
                    $aRow['bx_ghost_profile_id'] = $aGhost['profile_id'];
                    $aByContent[(int)$aGhost['content_id']][] = $aRow;
                }
                foreach($aByContent as $iId => $aRows)
                    self::$_aFileRowsScopes[$iScope][$oQuery->_ghostsScopeKey($iId)] = $aRows;
            }
        }

        $aResult = [];
        foreach($aQueries as $sObject => $oQuery)
            foreach($aIds as $iId)
                foreach(self::$_aFileRowsScopes[$iScope][$oQuery->_ghostsScopeKey($iId)] ?? [] as $aRow)
                    $aResult[$sObject][] = (int)$aRow['id'];
        return $aResult;
    }

    protected function _ghostsScopeKey($iContentId)
    {
        return 'ghosts#' . $this->_aObject['object'] . '#' . (int)$iContentId;
    }

    protected function _forgetScopedGhosts()
    {
        $sPrefix = 'ghosts#' . $this->_aObject['object'] . '#';
        foreach(array_keys(self::$_aFileRowsScopes) as $iScope)
            foreach(array_keys(self::$_aFileRowsScopes[$iScope]) as $sKey)
                if(strncmp($sKey, $sPrefix, strlen($sPrefix)) === 0)
                    unset(self::$_aFileRowsScopes[$iScope][$sKey]);
    }

    public function getFiles($mixedProfileId, $isGhostsOnly = false, $mixedContent = false, $isAdmin = false)
    {
        // an author's ghosts of one content primed in the open scope (@see primeGhostsByContents)
        if($isGhostsOnly && !$isAdmin && !empty(self::$_aFileRowsScopes) && is_numeric($mixedProfileId) && is_numeric($mixedContent)) {
            $sKey = $this->_ghostsScopeKey($mixedContent);
            $iScope = count(self::$_aFileRowsScopes) - 1;
            if(array_key_exists($sKey, self::$_aFileRowsScopes[$iScope])) {
                $aResult = [];
                foreach(self::$_aFileRowsScopes[$iScope][$sKey] as $aRow)
                    if((int)$aRow['bx_ghost_profile_id'] === (int)$mixedProfileId) {
                        unset($aRow['bx_ghost_content_id'], $aRow['bx_ghost_profile_id']);
                        $aResult[] = $aRow;
                    }
                return $aResult;
            }
        }

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
