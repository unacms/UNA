<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

if (!defined('CURL_SSLVERSION_TLSv1'))
    define('CURL_SSLVERSION_TLSv1', 1);

/**
 * File storage in Amazon S3.
 * @see BxDolStorage
 */
class BxDolStorageS3 extends BxDolStorage
{
    protected $_s3;
    protected $_sBucket;
    protected $_sDomain;
    protected $_sEndpoint;
    protected $_bSSL;
    protected $_bReducedRedundancy;

    /**
     * constructor
     */
    public function __construct($aObject)
    {
        parent::__construct($aObject);

        $this->_bSSL = (isset($this->_aParams['ssl']) && $this->_aParams['ssl']) || (!isset($this->_aParams['ssl']) && strncmp(BX_DOL_URL_ROOT, 'https://', 8) === 0) ? true : false;

        $this->_sEndpoint = getParam('sys_storage_s3_endpoint');
        $this->_sBucket = getParam('sys_storage_s3_bucket');
        $this->_sDomain = getParam('sys_storage_s3_domain');
        $this->_bReducedRedundancy = isset($this->_aParams['reduced_redundancy']) && $this->_aParams['reduced_redundancy'] ? true : false;

        $this->init($aObject);
    }

    protected function init ($aObject)
    {
        require_once(BX_DIRECTORY_PATH_PLUGINS . 'unacms/amazon-s3-php-class-hmac-v2/S3.php');
        $this->_s3 = new S3(
            getParam('sys_storage_s3_access_key'), 
            getParam('sys_storage_s3_secret_key'), 
            $this->_bSSL, 
            $this->_sEndpoint ? $this->_sEndpoint : 's3.amazonaws.com'
        );
        if ($this->_bSSL && getParam('sys_curl_ssl_allow_untrusted'))
             $this->_s3->setSSL($this->_bSSL, false);
        $this->_s3->setExceptions(true);
    }

    /**
     * Get file url.
     * @param $iFileId file
     * @return file url
     */
    public function getFileUrlById($iFileId)
    {
        $aFile = $this->_oDb->getFileById($iFileId);
        if (!$aFile)
            return false;

        if ($this->isAuthUrl($aFile)) {
            $sFileLocation = $this->getObjectBaseDir($aFile['private']) . $aFile['path'];

            if ($this->_sDomain)
                return $this->_s3->getAuthenticatedURL($this->_sDomain, $sFileLocation, $this->_aObject['token_life'], true, $this->_bSSL);
            else
                return $this->_s3->getAuthenticatedURL($this->_sBucket, $sFileLocation, $this->_aObject['token_life'], false, $this->_bSSL);
        }

        return $this->getObjectBaseUrl($aFile['private']) . $aFile['path'];
    }

    /**
     * Start file downloading by remote id. If file is private then token is checked.
     */
    public function download ($sRemoteId, $sToken = false, $bForceDownloadDialog = 'auto')
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

        $sUrl = $this->getFileUrlById($aFile['id']);

        if ($bForceDownloadDialog && $bForceDownloadDialog !== 'auto') {
            // download remote file to tmp
            $sTmpFilePath = BX_DIRECTORY_PATH_TMP . 'dwnld_'.$sRemoteId;
            if (!file_exists($sTmpFilePath)) {
                $sHttpCode = null;
                @file_put_contents($sTmpFilePath, bx_file_get_contents($sUrl, [], 'get', [], $sHttpCode, [], 0, [], true));
            }

            // read from a local storage to be able to send it as attachment and give it a proper name
            if (!file_exists($sTmpFilePath) || !($mixedResult = bx_smart_readfile($sTmpFilePath, $aFile['file_name'], $aFile['mime_type'], $aFile['private'] && $this->_iCacheControl > $this->_aObject['token_life'] ? $this->_aObject['token_life'] : $this->_iCacheControl, $aFile['private'] ? 'private' : 'public', 'attachment'))) {
                $this->setErrorCode(BX_DOL_STORAGE_ERR_ENGINE_GET);
                return false;
            }

            // HEAD, 304 and 416 answers don't send the file, so they aren't downloads
            if (true !== $mixedResult)
                return true;
        } else {
            header("Location: " . $sUrl);
        }

        return parent::download($aFile);
    }
    
    /**
     * Set file private or public.
     */
    public function setFilePrivate($iFileId, $isPrivate = true)
    {
        $aFile = $this->_oDb->getFileById($iFileId);
        if (!$aFile)
            return false;

        try {
            $sFileLocation = $this->getObjectBaseDir($aFile['private']) . $aFile['path'];
            if (($aACP = $this->_s3->getAccessControlPolicy($this->_sBucket, $sFileLocation)) === false) {
                $this->setErrorCode(BX_DOL_STORAGE_ERR_ENGINE_GET);
                return false;
            }

            if (!is_array($aACP['acl']) || !$aACP['acl']) {
                $this->setErrorCode(BX_DOL_STORAGE_ERR_ENGINE_GET);
                return false;
            }

            // check current permissions
            $aNewACP = $aACP;
            unset($aNewACP['acl']);
            $aNewACP['acl'] = array();
            $aGroupPublic = false;
            $aGroupPrivate = false;
            foreach ($aACP['acl'] as $r) {
                if ('Group' == $r['type']) {
                    if (isset($r['uri']) && $r['uri'] == 'http://acs.amazonaws.com/groups/global/AllUsers')
                        $aGroupPublic = $r;
                    elseif (isset($r['uri']) && $r['uri'] == 'http://acs.amazonaws.com/groups/global/AuthenticatedUsers')
                        $aGroupPrivate = $r;
                    else
                        $aNewACP['acl'][] = $r;
                } else {
                    $aNewACP['acl'][] = $r;
                }
            }

            // determine permissions changing

            $aGroupAdd = false;

            if ($isPrivate && (!$aGroupPrivate || $aGroupPublic)) {

                // make private
                $aGroupAdd = array (
                        'type' => 'Group',
                        'uri' => 'http://acs.amazonaws.com/groups/global/AuthenticatedUsers',
                        'permission' => 'READ',
                    );

            } elseif (!$isPrivate && ($aGroupPrivate || !$aGroupPublic)) {

                // make public
                $aGroupAdd = array (
                        'type' => 'Group',
                        'uri' => 'http://acs.amazonaws.com/groups/global/AllUsers',
                        'permission' => 'READ',
                    );

            }

            // change permission if necessary

            if ($aGroupAdd) {
                $aNewACP['acl'][] = $aGroupAdd;
                if (!$this->_s3->setAccessControlPolicy($this->_sBucket, $sFileLocation, $aNewACP)) {
                    $this->setErrorCode(BX_DOL_STORAGE_ERR_ENGINE_GET);
                    return false;
                }
            }
        } catch (Exception $e) {
            $this->setErrorCode(BX_DOL_STORAGE_ERR_ENGINE_GET);
            bx_log('sys_storage_s3', $e->getMessage(), BX_LOG_ERR);
            return false;
        }

        return parent::setFilePrivate($iFileId, $isPrivate);
    }

    // ----------------

    protected function generateHeaders($sFileName, $isPrivate, $sMimeType = '')
    {
        if (!$sMimeType)
            $sMimeType = $this->getMimeTypeByFileName($sFileName);

        $aRequestHeaders = array (
            "Content-Type"  => $sMimeType,
        );
        if ($this->_iCacheControl > 0) {
            $aRequestHeaders = array_merge ($aRequestHeaders, array (
                "Cache-Control" => "max-age=" . ($isPrivate && $this->_iCacheControl > $this->_aObject['token_life'] ? $this->_aObject['token_life'] : $this->_iCacheControl),
            ));
        }
    
        return $aRequestHeaders;
    }

    protected function addFileToEngine($sTmpFile, $sLocalId, $sName, $isPrivate, $iProfileId)
    {
        try {
            $sMimeType = $this->getMimeTypeByFileName($sName);
            $sExt = $this->getFileExt($sName);
            $sPath = $this->genPath($sLocalId, $this->_aObject['levels']);
            $sRemoteNamePath = $sPath . $sLocalId . ($sExt ? '.' . $sExt : '');
            $aRequestHeaders = $this->generateHeaders($sName, $isPrivate);
            $aMetaHeaders = array();

            $sStorageClass = $this->_bReducedRedundancy ? S3::STORAGE_CLASS_RRS : S3::STORAGE_CLASS_STANDARD;
            $sACL = $isPrivate ? S3::ACL_AUTHENTICATED_READ : S3::ACL_PUBLIC_READ;
            $aInputFile = $this->_s3->inputFile($sTmpFile);
            if (!$this->_s3->putObject($aInputFile, $this->_sBucket, $this->getObjectBaseDir($isPrivate) . $sRemoteNamePath, $sACL, $aMetaHeaders, $aRequestHeaders, $sStorageClass)) {
                $this->setErrorCode(BX_DOL_STORAGE_ERR_ENGINE_ADD);
                return false;
            }
        } catch (Exception $e) {
            $this->setErrorCode(BX_DOL_STORAGE_ERR_ENGINE_ADD);
            bx_log('sys_storage_s3', $e->getMessage(), BX_LOG_ERR);
            return false;
        }

        return true;
    }

    protected function deleteFileFromEngine($sFilePath, $isPrivate)
    {
        $sFileLocation = $this->getObjectBaseDir($isPrivate) . $sFilePath;

        try {
            if (!$this->_s3->deleteObject($this->_sBucket, $sFileLocation)) {
                $this->setErrorCode(BX_DOL_STORAGE_ERR_UNLINK);
                return false;
            }
        } catch (Exception $e) {
            $this->setErrorCode(BX_DOL_STORAGE_ERR_UNLINK);
            bx_log('sys_storage_s3', $e->getMessage(), BX_LOG_ERR);
            return false;
        }

        return true;
    }

    protected function genRemoteNamePath ($sPath, $sLocalId, $sExt)
    {
        return $sPath . $sLocalId . ($sExt ? '.' . $sExt : '');
    }

    protected function getObjectBaseDir ($isPrivate = false)
    {
        return $this->_aObject['object'] . '/';
    }

    protected function getObjectBaseUrl ($isPrivate = false)
    {
        $sPath = $this->_bSSL ? 'https://' : 'http://';
        if ($this->_sDomain)
            $sPath .= $this->_sDomain;
        elseif ($this->_sEndpoint)
            $sPath .= $this->_sEndpoint . '/' . $this->_sBucket;
        else
            $sPath .= $this->_sBucket . '.s3.amazonaws.com';
        return $sPath . '/' . $this->getObjectBaseDir($isPrivate);
    }
}

/** @} */
