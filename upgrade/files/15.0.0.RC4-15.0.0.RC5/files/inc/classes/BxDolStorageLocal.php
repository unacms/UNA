<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

define ('BX_DOL_STORAGE_DIR_RIGHTS', BX_DOL_DIR_RIGHTS);
define ('BX_DOL_STORAGE_FILE_RIGHTS', BX_DOL_FILE_RIGHTS);

/**
 * File storage in local folder.
 * @see BxDolStorage
 */
class BxDolStorageLocal extends BxDolStorage
{
    /**
     * constructor
     */
    public function __construct($aObject)
    {
        parent::__construct($aObject);
    }

    /**
     * Get file url.
     * @param $iFileId file
     * @return file url or false if file was not found
     */
    public function getFileUrlById($iFileId)
    {
        $aFile = $this->_oDb->getFileById($iFileId);
        if (!$aFile)
            return false;

        $sUrl =  $this->getObjectBaseUrl($aFile['private']) . $aFile['remote_id'] . '.' . $aFile['ext'];
        if ($aFile['private']) {
            $sToken = $this->_oDb->genToken($iFileId);
            $sUrl = bx_append_url_params($sUrl, array ('t' => $sToken));
        }
        return $sUrl;
    }

    /**
     * @see BxDolStorage::getFileUrlByIdShared
     */
    public function getFileUrlByIdShared($iFileId)
    {
        $aFile = $this->_oDb->getFileById($iFileId);
        if (!$aFile)
            return false;

        if (!$aFile['private'])
            return $this->getFileUrlById($iFileId);

        $iSince = $this->_sharedTokenPeriod();
        $sToken = $this->_oDb->getTokenSince($iFileId, $iSince);
        if ($sToken === false && ($sToken = $this->_oDb->genToken($iFileId)) !== false)
            $this->_oDb->rememberTokenSince($iFileId, $iSince, $sToken);
        if ($sToken === false)
            return false;

        return bx_append_url_params($this->getObjectBaseUrl(true) . $aFile['remote_id'] . '.' . $aFile['ext'], array('t' => $sToken));
    }

    /**
     * @see BxDolStorage::primeFileUrlsShared
     */
    public function primeFileUrlsShared($aIds, $bMake = true)
    {
        if (($a = $this->getSharedTokensToPrime($aIds)))
            $this->_oDb->primeTokensSince($a[1], $a[2], $bMake);
    }

    /**
     * @see BxDolStorage::getSharedTokensToPrime
     */
    public function getSharedTokensToPrime($aIds)
    {
        $aPrivate = [];
        foreach ((array)$aIds as $iFileId)
            if (($aFile = $this->_oDb->getFileById((int)$iFileId)) && !empty($aFile['private']))
                $aPrivate[] = (int)$iFileId;
        return $aPrivate ? [$this->_oDb, $aPrivate, $this->_sharedTokenPeriod()] : null;
    }

    /**
     * Time goes in periods of half the token's life; a shared link uses the first token made in
     * the current period, so it is the same link for the whole period and is still valid for at
     * least half the token's life after it ends. The start of the current period.
     */
    protected function _sharedTokenPeriod()
    {
        $iNow = time();
        $iHalf = max(1, (int)floor($this->_aObject['token_life'] / 2));
        return $iNow - $iNow % $iHalf;
    }

    /**
     * Start file downloading by remote id. If file is private then token is checked.
     */
    public function download ($sRemoteId, $sToken = false, $mixedForceDownloadDialog = 'auto')
    {
        $this->setErrorCode(BX_DOL_STORAGE_ERR_OK);

        $aFile = $this->_oDb->getFileByRemoteId($sRemoteId);
        if (!$aFile) {
            $this->setErrorCode(BX_DOL_STORAGE_ERR_FILE_NOT_FOUND);
            return false;
        }

        if ($aFile['private'] && !$this->_oDb->isTokenValid($aFile['id'], $sToken)) {
            $this->setErrorCode(BX_DOL_STORAGE_ERR_PERMISSION_DENIED);
            return false;
        }
        $sFileLocation = $this->getObjectBaseDir($aFile['private']) . $aFile['path'];
        if (!file_exists($sFileLocation)) {
            $this->setErrorCode(BX_DOL_STORAGE_ERR_FILE_NOT_FOUND);
            return false;
        }

        if ('auto' === $mixedForceDownloadDialog) {
            $bForceDownloadDialog = true;
            foreach ($this->_aMimeTypesViewable as $sType) {
                if (0 === strpos($aFile['mime_type'], $sType)) {
                    $bForceDownloadDialog = false;
                    break;
                }
            }
        } 
        else {
            $bForceDownloadDialog = $mixedForceDownloadDialog;
        }
        

        // a public file is never changed under its URL, so it is sent as immutable
        $mixedResult = bx_smart_readfile($sFileLocation, $aFile['file_name'], $aFile['mime_type'], $aFile['private'] && $this->_iCacheControl > $this->_aObject['token_life'] ? $this->_aObject['token_life'] : $this->_iCacheControl, $aFile['private'] ? 'private' : 'public', $bForceDownloadDialog ? 'attachment' : 'inline', !$aFile['private'] && !$bForceDownloadDialog);
        if (!$mixedResult) {
            $this->setErrorCode(BX_DOL_STORAGE_ERR_ENGINE_GET);
            return false;
        }

        // HEAD, 304 and 416 answers don't send the file, so they aren't downloads
        if (true !== $mixedResult)
            return true;

        return parent::download($aFile);
    }

    // ----------------

    protected function addFileToEngine($sTmpFile, $sLocalId, $sName, $isPrivate, $iProfileId)
    {
        $sPath = $this->genPath($sLocalId, $this->_aObject['levels']);
        $sNewFileDir = $this->getObjectBaseDir($isPrivate) . $sPath;
        $sNewFilePath = $sNewFileDir . $sLocalId;

        $this->mkdir($sNewFileDir);
        if (!file_exists($sNewFileDir) || !is_writable($sNewFileDir)) {
            $this->setErrorCode(BX_DOL_STORAGE_ERR_FILESYSTEM_PERM);
            return false;
        }

        if (!copy($sTmpFile, $sNewFilePath)) {
            $this->setErrorCode(BX_DOL_STORAGE_ERR_ENGINE_ADD);
            return false;
        }

        if (!chmod ($sNewFilePath, BX_DOL_STORAGE_FILE_RIGHTS)) {
            unlink($sNewFilePath);
            $this->setErrorCode(BX_DOL_STORAGE_ERR_ENGINE_ADD);
            return false;
        }

        return true;
    }

    protected function deleteFileFromEngine($sFilePath, $isPrivate)
    {
        $sFileLocation = $this->getObjectBaseDir($isPrivate) . $sFilePath;

        if (!file_exists($sFileLocation))
            return true;

        if (!unlink($sFileLocation)) {
            $this->setErrorCode(BX_DOL_STORAGE_ERR_UNLINK);
            return false;
        }

        return true;
    }

    /**
     * Get the absolute local filesystem path of a stored file, or false when it is
     * not available on disk.
     * @param $mixedHandler file id or remote id
     * @return string absolute path on success, false otherwise
     */
    public function getFileLocalPath ($mixedHandler)
    {
        $aFile = $this->getFile($mixedHandler);
        if (!$aFile || empty($aFile['path']))
            return false;

        $sPath = $this->getObjectBaseDir($aFile['private']) . $aFile['path'];
        return file_exists($sPath) ? $sPath : false;
    }

    protected function getObjectBaseDir ($isPrivate = false)
    {
        return BX_DIRECTORY_STORAGE . $this->_aObject['object'] . '/';
    }

    protected function getObjectBaseUrl ($isPrivate = false)
    {
        $o = BxDolPermalinks::getInstance();
        return bx_absolute_url($o->permalink('storage.php?o=') . $this->_aObject['object'] . ($o->_isEnabled('storage.php?o=') ? '/' : '&f='));
    }

    protected function mkdir($sDirName, $sRights = false)
    {
        if (false == $sRights) 
            $sRights = BX_DOL_STORAGE_DIR_RIGHTS;

        $sDirName = bx_ltrim_str($sDirName, BX_DIRECTORY_PATH_ROOT); 
        $aDirs = explode('/', $sDirName);
        $sDir = BX_DIRECTORY_PATH_ROOT;
        foreach ($aDirs as $sPart) {
            $sDir .= $sPart.'/';
            if (!is_dir($sDir) && strlen($sDir) > 0 && !file_exists($sDir)) {
                mkdir($sDir); 
                chmod($sDir, $sRights); 
            }
        }
    }
}

/** @} */
