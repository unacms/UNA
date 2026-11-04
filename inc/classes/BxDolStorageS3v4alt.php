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

if (!defined('BX_DOL_STORAGE_S3V4_MULTIPART_UPLOAD'))
    define('BX_DOL_STORAGE_S3V4_MULTIPART_UPLOAD', 5*1024*1024);

defined('AKEEBAENGINE') or define('AKEEBAENGINE', 1);

/**
 * Alternatove file storage implementation for Amazon S3 
 * compatible storge with Signature v4 support.
 * @see BxDolStorage
 */
class BxDolStorageS3v4alt extends BxDolStorageS3
{
    protected function init ($aObject)
    {
        $sAccessKey = getParam('sys_storage_s3_access_key');
        $sSecretKey = getParam('sys_storage_s3_secret_key');
        $aCredentials = [];
        if (getParam('sys_storage_s3_amz_iam_role')) {
            $sHttpCode = null;
            $sToken = bx_file_get_contents('http://169.254.169.254/latest/api/token', [], 'PUT', ['X-aws-ec2-metadata-token-ttl-seconds: 600'], $sHttpCode, [], 0, [], true);
            $sRole = bx_file_get_contents('http://169.254.169.254/latest/meta-data/iam/security-credentials/', [], 'GET', ["X-aws-ec2-metadata-token: $sToken"], $sHttpCode, [], 0, [], true);
            $sCredentials = bx_file_get_contents('http://169.254.169.254/latest/meta-data/iam/security-credentials/' . $sRole, [], 'GET', ["X-aws-ec2-metadata-token: $sToken"], $sHttpCode, [], 0, [], true);
            if ($sCredentials && ($aCredentials = @json_decode($sCredentials, true))) {
                $sAccessKey = $aCredentials['AccessKeyId'];
                $sSecretKey = $aCredentials['SecretAccessKey'];
            }
        }

        if (!$sAccessKey)
            return;

        $oConfiguration = new Akeeba\Engine\Postproc\Connector\S3v4\Configuration(
            $sAccessKey,
            $sSecretKey,
            getParam('sys_storage_s3_sig_ver'),
            getParam('sys_storage_s3_region')
        );
        if ($aCredentials && isset($aCredentials['Token']))
            $oConfiguration->setToken($aCredentials['Token']);
        if ($this->_sEndpoint)
            $oConfiguration->setEndpoint($this->_sEndpoint);

        $this->_s3 = new Akeeba\Engine\Postproc\Connector\S3v4\Connector($oConfiguration);
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
            $sRet = $this->_s3->getAuthenticatedURL($this->_sBucket, $sFileLocation, $this->_aObject['token_life'], $this->_bSSL);
        }
        else {
            $sRet = $this->getObjectBaseUrl($aFile['private']) . $aFile['path'];
        }
    
        if ('s3.wasabisys.com' === $this->_sEndpoint)
            $sRet = str_replace('//s3.', '//' . $this->_sBucket . '.s3.', $sRet);

        return $sRet;
    }

    public function setFilePrivate($iFileId, $isPrivate = true)
    {
        // since in S3v4 lib this feature not implemented then we need to get file and upload it back with new ACL

        $aFile = $this->_oDb->getFileById($iFileId);
        if (!$aFile)
            return false;

        if (!getParam('sys_storage_s3_acl_enable'))
            return parent::setFilePrivate($iFileId, 0);

        $sFileLocation = $this->getObjectBaseDir($aFile['private']) . $aFile['path'];
        
        $sTmpFile = tempnam(BX_DIRECTORY_PATH_TMP, $this->_aObject['object']);
        if (!$sTmpFile) {
            $this->setErrorCode(BX_DOL_STORAGE_ERR_FILESYSTEM_PERM);
            return false;
        }

        try {
            $this->_s3->getObject($this->_sBucket, $sFileLocation, $sTmpFile);
        } catch (Exception $e) {
            @unlink($sTmpFile);
            $this->setErrorCode(BX_DOL_STORAGE_ERR_UNLINK);
            bx_log('sys_storage_s3v4alt', $e->getMessage(), BX_LOG_ERR);
            return false;
        }

        if (getParam('sys_storage_s3_acl_enable'))
            $sACL = $isPrivate ? Akeeba\Engine\Postproc\Connector\S3v4\Acl::ACL_AUTHENTICATED_READ : Akeeba\Engine\Postproc\Connector\S3v4\Acl::ACL_PUBLIC_READ;
        else
            $sACL = '';
        $aRequestHeaders = $this->generateHeaders('', $isPrivate, $aFile['mime_type']);
        if (!$this->_upload($sTmpFile, $sFileLocation, $sACL, $aRequestHeaders))
            return false;

        return BxDolStorage::setFilePrivate($iFileId, $isPrivate);
    }
    
    // ----------------

    protected function addFileToEngine($sTmpFile, $sLocalId, $sName, $isPrivate, $iProfileId)
    {
        $sExt = $this->getFileExt($sName);
        $sPath = $this->genPath($sLocalId, $this->_aObject['levels']);
        $sRemoteNamePath = $sPath . $sLocalId . ($sExt ? '.' . $sExt : '');
        $aRequestHeaders = $this->generateHeaders($sName, $isPrivate);
        if (getParam('sys_storage_s3_acl_enable'))
            $sACL = $isPrivate ? Akeeba\Engine\Postproc\Connector\S3v4\Acl::ACL_AUTHENTICATED_READ : Akeeba\Engine\Postproc\Connector\S3v4\Acl::ACL_PUBLIC_READ;
        else
            $sACL = '';
        return $this->_upload($sTmpFile, $this->getObjectBaseDir($isPrivate) . $sRemoteNamePath, $sACL, $aRequestHeaders);
    }

    protected function _upload($sInputFile, $sUri, $sACL, $aRequestHeaders)
    {
        try {
            $oInputFile = Akeeba\Engine\Postproc\Connector\S3v4\Input::createFromFile($sInputFile);
            if (filesize($sInputFile) < BX_DOL_STORAGE_S3V4_MULTIPART_UPLOAD) {
                $this->_s3->putObject($oInputFile, $this->_sBucket, $sUri, $sACL, $aRequestHeaders);
            }
            else {
                $sUploadSessionId = $this->_s3->startMultipart($oInputFile, $this->_sBucket, $sUri, $sACL, $aRequestHeaders);

                $sETags = array();
                $sETag = null;
                $iPartNumber = 0;

                do
                {
                    // IMPORTANT: You MUST create the input afresh before each uploadMultipart call
                    $oInput = Akeeba\Engine\Postproc\Connector\S3v4\Input::createFromFile($sInputFile);
                    $oInput->setUploadID($sUploadSessionId);
                    $oInput->setPartNumber(++$iPartNumber);
                    
                    $sETag = $this->_s3->uploadMultipart($oInput, $this->_sBucket, $sUri);

                    if (!is_null($sETag))
                        $sETags[] = $sETag;
                }
                while (!is_null($sETag));

                // IMPORTANT: You MUST create the input afresh before finalising the multipart upload
                $oInput = Akeeba\Engine\Postproc\Connector\S3v4\Input::createFromFile($sInputFile);
                $oInput->setUploadID($sUploadSessionId);
                $oInput->setEtags($sETags);

                $this->_s3->finalizeMultipart($oInput, $this->_sBucket, $sUri);
            }

        } catch (Exception $e) {
            $this->setErrorCode(BX_DOL_STORAGE_ERR_ENGINE_ADD);
            bx_log('sys_storage_s3v4alt', $e->getMessage(), BX_LOG_ERR);
            return false;
        }

        return true;
    }

    protected function deleteFileFromEngine($sFilePath, $isPrivate)
    {
        $sFileLocation = $this->getObjectBaseDir($isPrivate) . $sFilePath;

        try {
            $this->_s3->deleteObject($this->_sBucket, $sFileLocation);
        } catch (Exception $e) {
            $this->setErrorCode(BX_DOL_STORAGE_ERR_UNLINK);
            bx_log('sys_storage_s3v4alt', $e->getMessage(), BX_LOG_ERR);
            return false;
        }

        return true;
    }
}

/** @} */
