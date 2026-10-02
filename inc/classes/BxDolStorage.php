<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

define('BX_DOL_STORAGE_ERR_OK', 0);

// 1-8 are standard upload form errors
/*
UPLOAD_ERR_INI_SIZE
Value: 1; The uploaded file exceeds the upload_max_filesize directive in php.ini.

UPLOAD_ERR_FORM_SIZE
Value: 2; The uploaded file exceeds the MAX_FILE_SIZE directive that was specified in the HTML form.

UPLOAD_ERR_PARTIAL
Value: 3; The uploaded file was only partially uploaded.

UPLOAD_ERR_NO_FILE
Value: 4; No file was uploaded.

UPLOAD_ERR_NO_TMP_DIR
Value: 6; Missing a temporary folder. Introduced in PHP 4.3.10 and PHP 5.0.3.

UPLOAD_ERR_CANT_WRITE
Value: 7; Failed to write file to disk. Introduced in PHP 5.1.0.

UPLOAD_ERR_EXTENSION
Value: 8; A PHP extension stopped the file upload. PHP does not provide a way to ascertain which extension caused the file upload to stop; examining the list of loaded extensions with phpinfo() may help. Introduced in PHP 5.2.0.
*/

define('BX_DOL_STORAGE_ERR_NO_INPUT_METHOD', 1000); ///< there is such input method available
define('BX_DOL_STORAGE_ERR_NO_FILE', 1001); ///< there is no file to upload
define('BX_DOL_STORAGE_INVALID_FILE', 1002); ///< uploaded file is invalid or hack attempts
define('BX_DOL_STORAGE_ERR_FILE_TOO_BIG', 1003); ///< file is too big
define('BX_DOL_STORAGE_ERR_WRONG_EXT', 1004); ///< wrong file extension
define('BX_DOL_STORAGE_ERR_USER_QUOTA_EXCEEDED', 1005); ///< user quota exceeded
define('BX_DOL_STORAGE_ERR_OBJECT_QUOTA_EXCEEDED', 1006); ///< storage object quota exceeded
define('BX_DOL_STORAGE_ERR_SITE_QUOTA_EXCEEDED', 1007); ///< site quota exceeded
define('BX_DOL_STORAGE_ERR_ENGINE_ADD', 1008); ///< some other error during file adding occured, related to particular storage engine

define('BX_DOL_STORAGE_ERR_FILE_NOT_FOUND', 2001); ///< file not found
define('BX_DOL_STORAGE_ERR_UNLINK', 2002); ///< file deletion failed

define('BX_DOL_STORAGE_ERR_DB', 5001); ///< database error
define('BX_DOL_STORAGE_ERR_FILESYSTEM_PERM', 5002); ///< filesystem permissions error
define('BX_DOL_STORAGE_ERR_PERMISSION_DENIED', 5003); ///< permission denied
define('BX_DOL_STORAGE_ERR_ENGINE_GET', 5004); ///< some other error during file getting occured, related to particular storage engine
define('BX_DOL_STORAGE_ERR_NOT_IMPLEMENTED', 5005); ///< this feature isn't implemented in storage engine

define('BX_DOL_STORAGE_DEFAULT_MIME_TYPE', 'octet/stream'); ///< default mime type if it is not find by extension

define('BX_DOL_STORAGE_DEFAULT_ICON', 'mime-type-any.svg'); ///< default icon if no other icon can be determined by file extension
define('BX_DOL_STORAGE_DEFAULT_ICON_FONT', 'far file'); ///< default font icon if no other icon can be determined by file extension

define('BX_DOL_STORAGE_QUEUED_DELETIONS_PER_RUN', 200); ///< max number of file deletions per one cron run, @see BxDolStorage::pruneDeletions

define('BX_DOL_STORAGE_GHOST_LIFETIME', 600); ///< ununsed ghost lifetime, @see BxDolStorage::pruneGhosts

/**
 * This class unify storage.
 * As the result there are many advantages:
 * - files can be stored as on localhost as on remote storage, for example Amazon s3
 * - all files are in one place and separated from other files, so the data can be organised more easily,
 *   for example moved to dedicated disk if there is not enough storage
 * - simplicity of usage, there are hight level classes to handle all necessary operations, including upload and security
 * - quotas settings, so you always control how much space you are going to use
 * - persistent storage; uploaded, but not saved files appear upon page reload or future submission of the same form
 *
 *
 * Usage.
 *
 * Step 1:
 * Add record to 'sys_objects_storage' table, like you doing this for Comments or Voting objects:
 * - object - your storage object name, usually it is in the following format - vendor prefix, underscore, module prefix;
 *   for example for BoonEx Forum module it can be bx_forum.
 * - engine - storage engine, for now the following engines are supported:
 *     1. Local - local storage, by default files are stored in /storage/ subfolder 
 *     2. S3 - Amazon S3 storage, files are stored on Amazon S3 storage, you need to point AWS Access Key, AWS Secret Key and AWS Bucket in the settings
 * - params - custom storage engine params as php serialized string, supported params:
 *      1. fields - list of additional fields to add to database as key(field name) and value(func or serialized service call to get the value)
 * - token_life - life of the security token in seconds for private files
 * - cache_control - control browser cache, allow browser to store files in browser's cache for this number of seconds, to disable browser cache,
 *   or let browser to decide on its own set it to 0(zero)
 * - levels - store files in subfolders, generated from filename; it is useful when there is limit of number of files/folders per directory;
 *   for example if level is 2 and file name is abc.jpg then the file will be stored in a/b/abc.jpg folder, set to to 0(zero) to disable this feature
 * - table_files - table where file info is stored, please refer to step 2 for more details
 * - ext_mode - file extensions restriction mode:
 *     1. allow-deny - allow only file types in ext_allow field and deny all other file types, ext_deny field is ignored.
 *     2. deny-allow - allow all files except the ones specified in ext_deny field, ext_allow field is ignored.
 * - ext_allow - allowed file extensions, comma separated, it is in effect when ext_mode is allow-deny; example - jpg,gif,png
 * - ext_deny - denied file extensions, comma separated, it is in effect when ext_mode is deny-allow; example - exe,com,bat
 * - quota_size - storage engine quota in bytes, the summary of all uploaded files can not be bigger than this number
 * - current_size - current storage engine usage, the sum of all uploaded file sizes
 * - quota_number - max number of files allowed in this storage engine
 * - current_number - current number of files in this storage engine
 * - max_file_size - max file size for this storage engine, please note that other server settings are used if they are less than this setting option
 * - ts - unix timestamp of the last file upload
 *
 *
 * Step 2:
 * Create table for files.
 *
 * @code
 * CREATE TABLE `my_sample_files` (
 *   `id` int(11) NOT NULL AUTO_INCREMENT,
 *   `profile_id` int(10) unsigned NOT NULL,
 *   `remote_id` varchar(255) NOT NULL,
 *   `path` varchar(255) NOT NULL,
 *   `file_name` varchar(255) NOT NULL,
 *   `mime_type` varchar(128) NOT NULL,
 *   `ext` varchar(32) NOT NULL,
 *   `size` int(11) NOT NULL,
 *   `added` int(11) NOT NULL,
 *   `modified` int(11) NOT NULL,
 *   `private` int(11) NOT NULL,
 *   PRIMARY KEY (`id`),
 *   UNIQUE KEY `remote_id` (`remote_id`)
 * );
 * @endcode
 *
 * You need to enter this table name in 'table_files' field in 'sys_objects_storage' table, mentioned in step 1.
 * The files will be added to this table automatically, all you need is to save 'id' from this table, so you can refer to the file by the 'id'.
 * It is not recommended to change this table, it is better to create another table which will be connected with this one by file 'id'.
 *
 *
 * Step 3:
 * Handling upload.
 *
 * Sample HTML form:
 *  @code
 * <form enctype="multipart/form-data" method="POST" action="store_file.php">
 *     Choose a file to upload:
 *     <input name="file" type="file" />
 *     <br />
 *     <input type="submit" name="add" value="Upload File" />
 * </form>
 * @endcode
 *
 * Add server code in sample store_file.php file:
 *
 * @code
 * require_once('./inc/header.inc.php');
 * require_once(BX_DIRECTORY_PATH_INC . "design.inc.php");
 *
 * BxDolStorage::pruning(); // pruning is needed to clear expired security tokens, you can call it on cron when your server is not busy
 * $oStorage = BxDolStorage::getObjectInstance('my_module'); // create storage object instance, 'my_module' is value of 'object' field in 'sys_objects_storage' table
 *
 * if (isset($_POST['add'])) { // if form is submitted
 *         $iId = $oStorage->storeFileFromForm($_FILES['file'], true, 0); // store file from submitted HTML form, 'file' is input name with field, true means store file as private, 0 is profile id
 *         if ($iId) { // storeFileFromForm returns file id, not false value means operation is successful.
 *             // save $iId somewhere, so you can refer to the file after
 *             $iCount = $oStorage->afterUploadCleanup($iId, $iProfileId); // since we saved $iId, we remove it from the orphans list, so it will not appear on the form next time (persistent storage)
 *             echo "uploaded file id: " . $iId . "(deleted orphans:" . $iCount . ")";
 *         } else {
 *             // something went wrong - print the error
 *             echo "error uploading file: " . $oStorage->getErrorString()
 *         }
 * }
 * @endcode
 *
 * Please refer to the functions definition for more additional description of functions params.
 *
 *
 * Step 4:
 * Displaying the file.
 *
 * Use the following code to retrieve saved file. Remember you saved filed id somewhere in the previous step.
 * Lets assume that the uploaded file is image, then we can show it using the following code:
 *
 * @code
 * require_once('./inc/header.inc.php');
 * require_once(BX_DIRECTORY_PATH_INC . "design.inc.php");
 *
 * $oStorage = BxDolStorage::getObjectInstance('my_module');
 *
 * $iId = 1234; // since you've saved it somewhere in the previous step, you can retrieve it here
 *
 * echo "Uploaded image: <img src="' . $oStorage->getFileUrlById($iId) . '" />;";
 * @endcode
 *
 * It will show the file, regardless if it is private or public.
 * You need to control it by yourself who will view the file.
 * The difference in viewing private files is that link to the file is expiring after N seconds,
 * you control this period using 'token_life' field in 'sys_objects_storage' table.
 *
 */

abstract class BxDolStorage extends BxDolFactory implements iBxDolFactoryObject
{
    protected $_aObject; ///< object properties
    protected $_iCacheControl; ///< browser cache in seconds, 0 - disabled
    protected $_aParams; ///< custom params
    protected $_iErrorCode; ///< last error code
    protected $_oDb; ///< database relates function are in this object
    protected $_aMimeTypesViewable = ['audio/', 'image/', 'video/']; ///< file types (by mime type) to allow view file in browser instead of downloading
    protected $_bSanitizeSvg = true; ///< enable/disable SVG sanitization
    
    /**
     * constructor
     */
    protected function __construct($aObject)
    {
        parent::__construct();
        $this->_aObject = $aObject;
        $this->_iCacheControl = $aObject['cache_control'];
        $this->_aParams = $aObject['params'] ? unserialize($aObject['params']) : '';
        $this->_oDb = new BxDolStorageQuery($aObject);
    }

    /**
     * Get storage object instance by object name
     * @param $sObject object name
     * @return object instance or false on error
     */
    public static function getObjectInstance($sObject)
    {
        if (isset($GLOBALS['bxDolClasses']['BxDolStorage!'.$sObject]))
            return $GLOBALS['bxDolClasses']['BxDolStorage!'.$sObject];

        $aObject = BxDolStorageQuery::getStorageObject($sObject);        
        if (!$aObject || !is_array($aObject))
            return false;

        $aExtMarkers = [
            'image' => getParam('sys_files_ext_images'),
            'video' => getParam('sys_files_ext_video'),
            'imagevideo' => getParam('sys_files_ext_imagevideo'), 
            'audio' => getParam('sys_files_ext_audio'),
            'dangerous' => getParam('sys_files_ext_dangerous')
        ];
        
        $aObject['ext_allow'] = bx_replace_markers($aObject['ext_allow'], $aExtMarkers);
        $aObject['ext_deny'] = bx_replace_markers($aObject['ext_deny'], $aExtMarkers);

        $sClass = 'BxDolStorage' . $aObject['engine'];
        $o = new $sClass($aObject);

        if (!$o->isInstalled() || !$o->isAvailable())
            return false;

        return ($GLOBALS['bxDolClasses']['BxDolStorage!'.$sObject] = $o);
    }

    public static function getGhostLifetime()
    {
        return ($iLifetime = getParam('sys_storage_ghost_lifetime')) !== false ? (int)$iLifetime * 60 : BX_DOL_STORAGE_GHOST_LIFETIME;
    }

    /**
     * Delete old security tokens from database.
     * It is alutomatically called upin cron execution, usually once in a day.
     * @return number of deleted records
     */
    public static function pruning()
    {
        $iDeleted = 0;
        $a = BxDolStorageQuery::getStorageObjects();
        foreach ($a as $aObject) {
            $oDb = new BxDolStorageQuery($aObject);
            $iDeleted += $oDb->prune();
        }
        return $iDeleted;
    }

    /**
     * Delete files queued for deletions
     * It is alutomatically called upon cron execution, usually one time per minute.
     * Max number of deletetion per time is defined in @see BX_DOL_STORAGE_QUEUED_DELETIONS_PER_RUN
     * @return number of deleted records
     */
    public static function pruneDeletions()
    {
        $iDeleted = 0;
        $a = BxDolStorageQuery::getQueuedFilesForDeletion(BX_DOL_STORAGE_QUEUED_DELETIONS_PER_RUN);
        foreach ($a as $r) {
            $o = BxDolStorage::getObjectInstance($r['object']);
            $iDeleted += ($o && $o->deleteFile($r['file_id']) ? 1 : 0);
        }

        return $iDeleted;
    }

    /**
     * Delete outdated ghosts
     * It is alutomatically called upon cron execution, usually one time per minute.
     */
    public static function pruneGhosts()
    {
        $iLifetime = self::getGhostLifetime();
        if($iLifetime == 0)
            return;

        $iDeleted = 0;

        $aGhosts = BxDolStorageQuery::getOutdatedUnusedGhosts($iLifetime);
        foreach($aGhosts as $aGhost)
            if(($oStorage = BxDolStorage::getObjectInstance($aGhost['object'])) !== false)
                $iDeleted += $oStorage->deleteFile($aGhost['id']);

        return $iDeleted;
    }

    /**
     * Check if module has any files pending for deletion, it is supposed that all module storage object names are prefixed with module name
     * @param $sPrefix - usually module name
     * @return number of files pending for deletion which were found by prefix
     */
    public static function isQueuedFilesForDeletion ($sPrefix)
    {
        return BxDolStorageQuery::isQueuedFilesForDeletion($sPrefix);
    }

    /**
     * Get file token for private files.
     * @param $iFileId file
     * @return file token string
     */
    public function genToken($iFileId)
    {
        return $this->_oDb->genToken($iFileId);
    }
    
    /**
     * Change storage engine. It's possible to change it when there is no files in storage engine.
     * @param $sEngine new storage engine
     * @return true on success or false on error
     */ 
    public function changeStorageEngine ($sEngine)
    {
        if (0 == $this->_aObject['current_size'] && 0 == $this->_aObject['current_number'])
            return $this->_oDb->changeStorageEngine($sEngine);
        return false;
    }

    /**
     * Is storage engine available?
     * @return boolean
     */
    function isAvailable()
    {
        return true;
    }

    /**
     * Are required php modules installed for this storage engine ?
     * @return boolean
     */
    public function isInstalled()
    {
        return true;
    }

    public function getObject()
    {
    	return $this->_aObject['object'];
    }

    public function getObjectData()
    {
    	return $this->_aObject;
    }

    /**
     * Get error code from the last occured error
     * @return error code
     */
    public function getErrorCode()
    {
        return $this->_iErrorCode;
    }

    /**
     * Get error string from the last occured error
     * @return error string
     */
    public function getErrorString()
    {
        bx_import('BxDolLanguages');
        $a = array (
            1000 => '_sys_storage_err_no_input_method',
            1001 => '_sys_storage_err_no_file',
            1002 => '_sys_storage_invalid_file',
            1003 => '_sys_storage_err_file_too_big',
            1004 => '_sys_storage_err_wrong_ext',
            1005 => '_sys_storage_err_user_quota_exceeded',
            1006 => '_sys_storage_err_object_quota_exceeded',
            1007 => '_sys_storage_err_site_quota_exceeded',
            1008 => '_sys_storage_err_engine_add',

            2001 => '_sys_storage_err_file_not_found',
            2002 => '_sys_storage_err_unlink',

            5001 => '_sys_storage_err_db',
            5002 => '_sys_storage_err_filesystem_perm',
            5003 => '_sys_storage_err_permission_denied',
            5004 => '_sys_storage_err_engine_get',
            5005 => '_sys_storage_err_not_implemented',
        );
        return _t($a[$this->_iErrorCode]);
    }

    /**
     * Get max file size allowed for current user, it checks user quota, object quota, site quota and php setting
     * @param $iProfileId profile id to check quota for
     * @return quota size in bytes
     */
    public function getMaxUploadFileSize ($iProfileId)
    {
        $iMin = PHP_INT_MAX;

        $aUserQuota = $this->_oDb->getUserQuota($iProfileId);
        if ($aUserQuota['max_file_size'] && $aUserQuota['max_file_size'] < $iMin)
            $iMin = $aUserQuota['max_file_size'];

        $aObjectQuota = $this->_oDb->getStorageObjectQuota();
        if ($aObjectQuota['max_file_size'] && $aObjectQuota['max_file_size'] < $iMin)
            $iMin = $aObjectQuota['max_file_size'];

        // TODO: get and check site quota

        if (!defined('BX_DOL_CRON_EXECUTE')) {
            $iUploadMaxFilesize = return_bytes(ini_get('upload_max_filesize'));
            if ($iUploadMaxFilesize && $iUploadMaxFilesize < $iMin)
                $iMin = $iUploadMaxFilesize;
        }

        return $iMin;
    }

    /**
     * Store file in the storage area. It is not recommended to use this function directly,
     * use other funtions like: storeFileFromForm, storeFileFromXhr, storeFileFromPath, storeFileFromUrl
     * @param $sMethod upload method, like regular Form upload, upload from URL, etc
     * @param $aMethodParams upload method params
     * @param $sName file name with extention
     * @param $isPrivate private or public file
     * @param $iProfileId profile id of the upload action performer
     * @param $iContentId content id to associate with ghost file
     * @return id of added file on success, false on error - to get exact error string call getErrorString()
     */
    public function storeFile($sMethod, $aMethodParams, $sName = false, $isPrivate = true, $iProfileId = 0, $iContentId = 0)
    {
        // setup input source using helper classes, like $_FILES or some URL for example

        $sHelperClass = 'BxDolStorageHelper' . $sMethod;
        if (!class_exists($sHelperClass)) {
            $this->setErrorCode(BX_DOL_STORAGE_ERR_NO_INPUT_METHOD);
            return false;
        }

        $oHelper = new $sHelperClass($aMethodParams);

        // check for errors, like size and extentions checking

        if ($iImmediateError = $oHelper->getImmediateError()) {
            $this->setErrorCode($iImmediateError);
            return false;
        }

        $sExt = $this->getFileExt($oHelper->getName());
        $sMimeType = $this->getMimeTypeByFileName($oHelper->getName());

        if (!$this->isValidExt($sExt)) {
            $this->setErrorCode(BX_DOL_STORAGE_ERR_WRONG_EXT);
            return false;
        }

        // before upload callback + additional checking

        if (!$this->onBeforeFileAdd (array(
            'profile_id' => $iProfileId,
            'content_id' => $iContentId,
            'file_name' => $oHelper->getName(),
            'mime_type' => $sMimeType,
            'ext' => $sExt,
            'size' => $oHelper->getSize(),
            'private' => $isPrivate ? 1 : 0,
        ))) {
            return false;
        }

        // create tmp file

        $sTmpFile = tempnam(BX_DIRECTORY_PATH_TMP, $this->_aObject['object']);
        if (!$oHelper->save($sTmpFile)) {
            $this->setErrorCode(BX_DOL_STORAGE_INVALID_FILE);
            return false;
        }

        // perform SVG sanitization

        if($this->isMimeTypeSvg($sMimeType) && $this->isSanitizeSvg()) {
            $oSanitizer = new enshrined\svgSanitize\Sanitizer();

            $sSvgOrig = @file_get_contents($sTmpFile);
            if($sSvgOrig === false) {
                $this->setErrorCode(BX_DOL_STORAGE_INVALID_FILE);
                return false;
            }

            $sSvgClean = $oSanitizer->sanitize($sSvgOrig);
            if($sSvgClean === false) {
                $this->setErrorCode(BX_DOL_STORAGE_INVALID_FILE);
                return false;
            }

            file_put_contents($sTmpFile, $sSvgClean);
        }

        // process additional custom fields, like video duration and video dimension

        $aAdditionalFields = array();
        if (isset($this->_aParams['fields']) && is_array($this->_aParams['fields'])) {
            foreach ($this->_aParams['fields'] as $sField => $mixedMethod) {
                if (is_string($mixedMethod) && method_exists($this, $mixedMethod)) {
                    $aAdditionalFields[$sField] = $this->$mixedMethod($sTmpFile, $sMimeType, $sExt, $this);
                }
                elseif (is_array($mixedMethod) && isset($mixedMethod['module']) && isset($mixedMethod['method'])) {
                    $mixedMethod['params'] = array($sTmpFile, $sMimeType, $sExt, $this);
                    $aAdditionalFields[$sField] = call_user_func_array('bx_srv', array($mixedMethod['module'], $mixedMethod['method'], $mixedMethod['params'], isset($mixedMethod['class']) ? $mixedMethod['class'] : 'Module'));
                } 
            }
        }

        bx_alert('system', 'store_file', $iContentId, $iProfileId, array(
            'storage_object' => $this->_aObject['object'],
            'object' => $this,
            'file_name' => $oHelper->getName(),
            'mime_type' => $sMimeType,
            'ext' => $sExt,
            'size' => $oHelper->getSize(),
            'file_path' => $sTmpFile,
            'store_method' => $sMethod,
            'store_method_params' => $aMethodParams,
        ));

        // store file to storage engine

        $sLocalId = $this->genRandName();
        $sPath = $this->genPath($sLocalId, $this->_aObject['levels']);
        $sRemoteNamePath = $this->genRemoteNamePath ($sPath, $sLocalId, $sExt);

        if (!$this->addFileToEngine($sTmpFile, $sLocalId, $oHelper->getName(), $isPrivate, $iProfileId)) {
            unlink($sTmpFile);
            $this->setErrorCode(BX_DOL_STORAGE_ERR_ENGINE_ADD);
            return false;
        }
        unlink($sTmpFile);

        // add record in db

        $iTime = time();
        $iSize = $oHelper->getSize();
        $bFileAdded = $this->_oDb->addFile($iProfileId, $sLocalId, $sRemoteNamePath, $oHelper->getName(), $sMimeType, $sExt, $iSize, $iTime, $isPrivate, $aAdditionalFields);
        $iId = $this->_oDb->lastId();
        if (!$bFileAdded || !$iId) {
            $this->deleteFileFromEngine($sPath . $sLocalId, $isPrivate);
            $this->setErrorCode(BX_DOL_STORAGE_ERR_DB);
            return false;
        }

        // after upload callback + triggers update

        if (!$this->onFileAdded (array(
            'id' => $iId,
            'profile_id' => $iProfileId,
            'content_id' => $iContentId,
            'remote_id' => $sLocalId,
            'path' => $sPath . $sLocalId,
            'file_name' => $oHelper->getName(),
            'mime_type' => $sMimeType,
            'size' => $iSize,
            'private' => $isPrivate ? 1 : 0,
        ))) {
            $this->deleteFileFromEngine($sPath . $sLocalId, $isPrivate);
            $this->_oDb->deleteFile($iId);
            return false;
        }

        return $iId;
    }

    /**
     * convert default multiple files array into more logical one
     */
    public function convertMultipleFilesArray($aFiles)
    {
        if (!is_array($aFiles) || !is_array($aFiles['name']))
            return false;
        $aRet = array ();
        foreach ($aFiles['name'] as $i => $sName) {
            foreach ($aFiles as $sKey => $r) {
                if (!$aFiles['name'][$i])
                    break;
                $aRet[$i][$sKey] = $aFiles[$sKey][$i];
            }
        }
        return $aRet;
    }

    /**
     * the same as storeFile, but it tries to do it directly from uploaded file
     */
    public function storeFileFromForm($aFile, $isPrivate = true, $iProfileId = 0, $iContentId = 0)
    {
        return $this->storeFile('Form', array('file' => $aFile), false, $isPrivate, $iProfileId, $iContentId);
    }

    /**
     * the same as storeFile, but it tries to do it directly from HTML5 file upload method
     */
    public function storeFileFromXhr($sName, $isPrivate = true, $iProfileId = 0, $iContentId = 0)
    {
        return $this->storeFile('Xhr', array('name' => $sName), false, $isPrivate, $iProfileId, $iContentId);
    }

    /**
     * the same as storeFile, but it tries to do it directly from local file
     */
    public function storeFileFromPath($sPath, $isPrivate = true, $iProfileId = 0, $iContentId = 0)
    {
        return $this->storeFile('Path', array('path' => $sPath), false, $isPrivate, $iProfileId, $iContentId);
    }

    /**
     * the same as storeFileFromPath, but it tries to do it from URL
     */
    public function storeFileFromUrl($sUrl, $isPrivate = true, $iProfileId = 0, $iContentId = 0)
    {
        return $this->storeFile('Url', array('url' => $sUrl), false, $isPrivate, $iProfileId, $iContentId);
    }

    /**
     * the same as storeFile, but it tries to do it directly from the same or another storage by file id
     * @param $aParams['id'] - file ID in the storage
     * @param $aParams['storage'] - the storage name
     */
    public function storeFileFromStorage($aParams, $isPrivate = true, $iProfileId = 0, $iContentId = 0)
    {
        if (!isset($aParams['id']) || !(int)$aParams['id'])
            $aParams['id'] = 0;

        if (!isset($aParams['storage']))
            $aParams['storage'] = $this->_aObject['object'];

        return $this->storeFile('Storage', $aParams, false, $isPrivate, $iProfileId, $iContentId = 0);
    }

    /**
     * Delete file by file id.
     */
    public function deleteFile($iFileId, $iProfileId = 0)
    {
        $aFile = $this->_oDb->getFileById ($iFileId);
        if (!$aFile) {
            $this->setErrorCode(BX_DOL_STORAGE_ERR_FILE_NOT_FOUND);
            return false;
        }

        if (!$this->onBeforeFileDelete ($aFile, $iProfileId)) {
            return false;
        }

        if (!$this->deleteFileFromEngine($aFile['path'], $aFile['private'])) {
            return false;
        }

        $aGhost = $this->_oDb->getGhost($aFile['id']);

        if (!$this->_oDb->deleteFile($aFile['id'])) {
            $this->setErrorCode(BX_DOL_STORAGE_ERR_DB);
            return false;
        }

        if (!$this->onFileDeleted ($aFile, $iProfileId, $aGhost)) {
            return false;
        }

        return true;
    }

    /**
     * Queue file(s) for deletion. File(s) will be deleted later upon cron call (usually every minute).
     * @param $mixedFileId file id or array of file ids.
     * @return number of queued files
     */
    public function queueFilesForDeletion($mixedFileId)
    {
        if (!is_array($mixedFileId))
            $mixedFileId = array ($mixedFileId);
        bx_import('BxDolForm');
        $oChecker = new BxDolFormCheckerHelper();
        return $this->_oDb->queueFilesForDeletion (array_unique($oChecker->passInt($mixedFileId)));
    }

    /**
     * Queue file(s) for deletion by getting neccesary files from ghosts table by profile id and content id
     * @param $iProfileId profile id associated with files
     * @param $iContentId content id associated with files, or false if to check by profile id only
     * @return number of queued files
     */
    public function queueFilesForDeletionFromGhosts($iProfileId, $iContentId = false)
    {
        $aFiles = $this->getGhosts ($iProfileId, $iContentId);
        return $this->queueFiles($aFiles);
    }

    /**
     * Queue file(s) for deletion of the whole storage object
     * @return number of queued files
     */
    public function queueFilesForDeletionFromObject()
    {
        $aFiles = $this->getFiles (false);
        return $this->queueFiles($aFiles);
    }

    /**
     * Download file.
     * @param array $aFile downloading file info.
     * @param boolean $bForceDownloadDialog if downloading to a local file system first is required and/or send the outout as attachment rather than inline.
     */
    public function download ($aFile, $sToken = false, $bForceDownloadDialog = 'auto')
    {
    	$bRet = true;
        bx_alert($this->_aObject['object'], 'file_downloaded', $aFile['id'], bx_get_logged_profile_id(), array(
        	'profile_ip' => getVisitorIP(),
        	'file_info' => $aFile, 
        	'return_value' => &$bRet
        ));

        return $bRet;
    }

    /**
     * Set file private or public.
     */
    public function setFilePrivate($iFileId, $isPrivate = true)
    {
        if (!$this->_oDb->modifyFilePrivate ($iFileId, $isPrivate)) {
            $this->setErrorCode(BX_DOL_STORAGE_ERR_DB);
            return false;
        }
        return true;
    }

    /**
     * Get file url.
     * @param $sRemoteId file remote id
     * @return file url or false on error
     */
    public function getFileUrlByRemoteId($sRemoteId)
    {
        $aFile = $this->_oDb->getFileByRemoteId($sRemoteId);
        if (!$aFile) {
            $this->setErrorCode(BX_DOL_STORAGE_ERR_FILE_NOT_FOUND);
            return false;
        }

        return $this->getFileUrlById($aFile['id']);
    }

    /**
     * Get file url.
     * @param $iFileId file id
     * @return file url or false on error
     */
    public function getFileUrlById($iFileId) { }

    /**
     * Get the absolute local filesystem path of a stored file. Only local storage
     * engines can answer this; other engines return false and callers fall back to
     * the file URL.
     * @param $mixedHandler file id or remote id
     * @return string absolute path on success, false otherwise
     */
    public function getFileLocalPath($mixedHandler) { return false; }

    /**
     * Get file info array by file id.
     * @param $iFileId file id
     * @return array
     */
    public function getFile($iFileId)
    {
        $a = $this->_oDb->getFileById($iFileId);
        if (!$a) return false;

        // update custom fields for previously uploaded files
        if (!defined('BX_DOL_STORAGE_CUSTOM_FIELDS_UPDATE_SKIP') && isset($this->_aParams['fields']) && is_array($this->_aParams['fields'])) {
            foreach ($this->_aParams['fields'] as $sField => $mixedMethod) {
                if ($a[$sField])
                    continue;

                $sFileUrl = $this->getFileUrlById($iFileId);

                if (is_string($mixedMethod) && method_exists($this, $mixedMethod)) {
                    $a[$sField] = $this->$mixedMethod($sFileUrl, $a['mime_type'], $a['ext'], $this);
                }
                elseif (is_array($mixedMethod) && isset($mixedMethod['module']) && isset($mixedMethod['method'])) {
                    $mixedMethod['params'] = array($sFileUrl, $a['mime_type'], $a['ext'], $this);
                    $a[$sField] = call_user_func_array('bx_srv', array($mixedMethod['module'], $mixedMethod['method'], $mixedMethod['params'], isset($mixedMethod['class']) ? $mixedMethod['class'] : 'Module'));
                } 
                if ($a[$sField])
                    $this->_oDb->modifyCustomField($iFileId, $sField, $a[$sField], false);
            }
        }

        return $a;
    }

    /**
     * Get ghost file info array by file id.
     * @param $iFileId file id
     * @return array
     */
    public function getGhost($iFileId)
    {    
        return $this->_oDb->getGhost($iFileId);
    }

    /**
     * check if file is private or public
     * @param $iFileId file id
     * @return boolean
     */
    public function isFilePrivate($iFileId)
    {
        $aFile = $this->getFile ($iFileId);
        return $aFile['private'] ? true : false;
    }

    /**
     * Call this function after saving/associate just uploaded file id, so file is not orphaned/ghost.
     * Ghost files appear on download form automaticaly during next upload,
     * for example if file was uploaded but was not submitted for some reason.
     * This mechanism ensure that the file is not lost.
     * @param $mixedFileIds array of file ids or just one file id
     * @param $iProfileId profile id
     * @param return number of deleted ghost files
     */
    public function afterUploadCleanup($mixedFileIds, $iProfileId, $iContentId = false)
    {
        return $this->_oDb->deleteGhosts($mixedFileIds, $iProfileId, $iContentId);
    }

    /**
     * Get ghost/orphaned files for particular user.
     * @param $iProfileId profile id
     * @param $mixedContent - int Content ID | array Content ID + Uploader ID | false to not consider content id at all
     * @param $isCheckAllAccountProfiles get all files associated with all account profiles
     * @param $isAdmin if true, then don't check files ownership, it makes sense when $iContentId is provided, so it will return all files assiciated with content
     * @return array of arrays
     */
    public function getGhosts($iProfileId, $mixedContent = false, $isCheckAllAccountProfiles = false, $isAdmin = false)
    {
        if($isCheckAllAccountProfiles && ($oProfile = BxDolProfile::getInstance($iProfileId)) !== false && ($oAccount = $oProfile->getAccountObject()) !== false)
            $iProfileId = $oAccount->getProfilesIds(false, false);

        return $this->_oDb->getGhosts($iProfileId, $mixedContent, $isAdmin);
    }
    
    /**
     * Reorder ghost/orphaned files for particular content/user.
     * @param $iProfileId profile id
     * @param $iContentId content id, or false to not consider content id at all
     * @param $aGhosts an ordered list of ghost/orphaned files' IDs.
     * @return boolean result of operation
     */
    public function reorderGhosts($iProfileId, $iContentId, $aGhosts)
    {
        $bResult = true;

        $iGhosts = count($aGhosts);
        for($i = 0; $i < $iGhosts; $i++)
            $bResult &= $this->_oDb->updateGhostOrder($iProfileId, $iContentId, (int)$aGhosts[$i], $i);

        return $bResult;
    }

    /**
     * Update ghosts' content id.
     * @param $mixedFileIds array of file ids or just one file id
     * @param $iProfileId profile id
     * @param $iContentId content id
     * @param $isAdmin if true, then don't check files ownership
     * @return true on success or false otherwise
     */
    public function updateGhostsContentId($mixedFileIds, $iProfileId, $iContentId, $isAdmin = false)
    {
        $aProfiles = array();
        if ($oProfile = BxDolProfile::getInstance($iProfileId)) {
            $oAccount = $oProfile->getAccountObject();
            $aProfiles = $oAccount->getProfilesIds(false);
        }

        return $this->_oDb->updateGhostsContentId($mixedFileIds, $iProfileId, $iContentId, $aProfiles, $isAdmin);
    }
    
    /**
     * Update ghosts' uploader id.
     * @param $mixedFileIds array of file ids or just one file id
     * @param $iUploaderId uploader id
     * @return true on success or false otherwise
     */
    public function updateGhostsUploaderId($mixedFileIds, $iUploaderId)
    {
        return $this->_oDb->updateGhostsUploaderId($mixedFileIds, $iUploaderId);
    }

    /**
     * Get files list for particular user.
     * @param $iProfileId profile id
     * @return array of arrays
     */
    public function getFiles($iProfileId)
    {
        return $this->_oDb->getFiles($iProfileId);
    }

    /**
     * Get all files in the storage
     */
    public function getFilesAll($iStart = 0, $iPerPage = 1000)
    {
        return $this->_oDb->getFilesAll($iStart, $iPerPage);
    }

    /**
     * Get readable representation of restrictions by file extentions.
     * @param $iProfileId profile id
     * @return string
     */
    public function getRestrictionsTextExtensions ($iProfileId)
    {
        switch ($this->_aObject['ext_mode']) {
            case 'allow-deny':
                if (!$this->_aObject['ext_allow'])
                    return _t('_sys_storage_restriction_ext_all_denied');
                return _t('_sys_storage_restriction_ext_allowed', _t_format_extensions($this->_aObject['ext_allow']));
            case 'deny-allow':
                if (!$this->_aObject['ext_deny'])
                    return _t('_sys_storage_restriction_ext_all_allowed');
                return _t('_sys_storage_restriction_ext_denied', _t_format_extensions($this->_aObject['ext_deny']));
            default:
                return _t('_sys_storage_restriction_ext_all_denied');
        }
    }

    /**
     * @return list of allowed extensions, if ext_mode = 'allow-deny', returns false otherwise.
     */
    public function getAllowedExtensions ()
    {
        if ('allow-deny' == $this->_aObject['ext_mode'])
            return _t_format_extensions($this->_aObject['ext_allow']);
        return null;
    }
    
    /**
     * Get readable representation of restrictions by file size.
     * @param $iProfileId profile id
     * @return string
     */
    public function getRestrictionsTextFileSize ($iProfileId)
    {
        return _t('_sys_storage_restriction_size', _t_format_size($this->getMaxUploadFileSize($iProfileId)));
    }

    /**
     * Get readable representation of all restrictions.
     * @param $iProfileId profile id
     * @return array of strings
     */
    public function getRestrictionsTextArray ($iProfileId)
    {
        $aTypes = array('Extensions', 'FileSize');
        $aRet = array();
        foreach ($aTypes as $sType) {
            $sFunc = 'getRestrictionsText' . $sType;
            $s = $this->$sFunc ($iProfileId);
            if ($s)
                $aRet[] = $s;
        }
        return $aRet;
    }

    /**
     * Reread available mimetypes from particular file.
     * It clears 'sys_storage_mime_types' table and fill it with data form provided file.
     * The format of file is: mime/type _space_or_tab_ extentions_sperated_by_space.
     * Usually the file is mime.types file from apache or /etc/mime.types from unix systems.
     * @param $sFile file to read mime types from
     * @return false if file was not found or can not be read, string with result on other case - it can contains file markup errors or localized "Success" string if everything went fine.
     */
    public function reloadMimeTypesFromFile ($sFile)
    {
        $sResult = '';

        /* 
         * These mime types must be manually added/replaced if they aren't defined in the mime type file
         *

            text/x-php                  php
            text/x-coffeescript         coffee
            text/x-common-lisp          lsp lisp
            text/x-diff                 diff
            text/x-go                   go
            text/x-java                 java
            text/x-lua                  lua
            text/x-perl                 pl prl perl
            text/x-python               py
            text/nginx                  nginx
            text/x-ini                  ini
            text/x-ruby                 rb
            text/x-sass                 sass
            text/x-sh                   bash sh
            text/x-swift                swift
            text/x-vb                   vb
            text/vbscript               vbs
            text/x-vue                  vue
            text/x-yaml                 yaml
            text/x-sql                  sql
            text/x-markdown             md
            application/xquery          xq xquery
            application/x-powershell    ps1
            application/x-aspx          aps
            application/x-jsp           jsp

        */

        $aIconsFont = array (
            'far file-pdf' => array('pdf'),
            'far file-word' => array('doc', 'docx'),
            'far file-excel' => array('xls', 'xlt', 'xlsx', 'sxc', 'stc', 'ods', 'ots', 'sdc', 'csv', 'dif', 'slk', 'pxl'),
            'far file-powerpoint' => array('ppt', 'pptx', 'sxi', 'sti', 'odp', 'sdp', 'sdd'),
            'far file-code' => array('1st', 'aspx', 'asp', 'json', 'js', 'jsp', 'java', 'php', 'xml', 'html', 'xhtml', 'htm', 'rdf', 'xsd', 'xsl', 'xslt', 'sax', 'rss', 'dtd', 'cfm', 'js', 'asm', 'pl', 'prl', 'bas', 'b', 'fs', 'src', 'cs', 'ws', 'cgi', 'bat', 'py', 'c', 'cpp', 'cc', 'cp', 'h', 'hh', 'cxx', 'hxx', 'c++', 'm', 'lua', 'swift', 'sh', 'as', 'cob', 'tpl', 'lsp', 'x', 'cmd', 'rb', 'cbl', 'pas', 'pp', 'vb', 'vbs', 'f', 'perl', 'jl', 'lol', 'bal', 'pli', 'css', 'less', 'sass', 'saas', 'scss', 'bcc', 'coffee', 'jade', 'j', 'tea', 'c#', 'sas', 'diff', 'pro', 'for', 'sh', 'bsh', 'bash', 'twig', 'csh', 'lisp', 'lsp', 'cobol', 'pl', 'd', 'git', 'rb', 'hrl', 'cr', 'inp', 'a', 'go', 'as3', 'm', 'sql', 'md', 'mbox', 'nginx', 'pgp', 'asc', 'sig', 'ps1', 'rq', 'ttl', 'vue', 'xquery', 'xq'),
            'far file-image' => 'image/', 
            'far file-video' => 'video/',
            'far file-audio' => 'audio/',
            'far file-alt' => 'text/',
            'far file-archive' => array('7z', '7zip', 'aar', 'ace', 'alz', 'arj', 'bz2', 'bza', 'bzip2', 'bzp', 'bzp2', 'cab', 'czip', 'gnutar', 'gz', 'gza', 'gzi', 'gzip', 'ha', 'lhz', 'lzma', 'pzip', 'rar', 'roo', 's7z', 'tar', 'tar-gz', 'tar-lzma', 'tar-z', 'taz', 'tbz', 'tbz2', 'tgz', 'tz', 'z', 'zip', 'zipx', 'zix', 'zoo'),
        );
        
        $aIcons = array (
            'mime-type-psd.svg' => array('psd'),
            'mime-type-png.svg' => array('png'),
            'mime-type-image.svg' => 'image/',
            'mime-type-video.svg' => 'video/',
            'mime-type-audio.svg' => 'audio/',
            'mime-type-presentation.svg' => array('ppt', 'pptx', 'sxi', 'sti', 'odp', 'sdp', 'sdd'),
            'mime-type-spreadsheet.svg' => array('xls', 'xlt', 'xlsx', 'sxc', 'stc', 'ods', 'ots', 'sdc', 'csv', 'dif', 'slk', 'pxl'),
            'mime-type-document.svg' => array('doc', 'docx', 'odt', 'ott', 'sxw', 'stw', 'rtf', 'sdw', 'txt', 'pdb', 'psw', 'pdf'),
            'mime-type-vector.svg' => array('ac5', 'ac6', 'aff', 'agd1', 'ai', 'ait', 'art', 'awg', 'b2f', 'cag', 'cbd', 'cdl', 'cdr', 'cdr3', 'cdr4', 'cdr5', 'cdr6', 'cdrw', 'cdx', 'cgm', 'cht', 'cil', 'cit', 'cnv', 'csl', 'ctn', 'cv5', 'cvg', 'cvi', 'cvl', 'cvs', 'cvx', 'dcs', 'ddoc', 'ddrw', 'ded', 'design', 'dmw', 'do', 'dpp', 'dpr', 'draw', 'drw', 'dsf', 'dsf', 'dsx', 'dvg', 'dxb', 'emb', 'evf', 'fcd', 'fh', 'fhd', 'fmv', 'fs', 'ft10', 'ft11', 'ft9', 'ft8', 'gem', 'gl2', 'graffle', 'gsd', 'gsd', 'hpg', 'hpgl', 'hpgl2', 'hpl', 'hplj', 'hpp', 'hppcl', 'idw', 'ima', 'macdraw', 'mgcb', 'mgs', 'mvg', 'nap', 'naplps', 'odg', 'p10', 'pat', 'pct', 'pd', 'pdw', 'pgs', 'pic', 'pif', 'pix', 'plo', 'plot', 'plt', 'ps', 'psid', 'pws', 'rdl', 's57', 'sdw', 'sif', 'sk2', 'slddwg', 'sp', 'spa', 'svf', 'svg', 'svgb', 'svgz', 'sxd', 'tdr', 'tlc', 'tng', 'vbr', 'vec', 'vect', 'veh', 'vml', 'vss', 'web', 'web', 'web', 'yal'),
            'mime-type-archive.svg' => array('7z', '7zip', 'aar', 'ace', 'alz', 'arj', 'bz2', 'bza', 'bzip2', 'bzp', 'bzp2', 'cab', 'czip', 'gnutar', 'gz', 'gza', 'gzi', 'gzip', 'ha', 'lhz', 'lzma', 'pzip', 'rar', 'roo', 's7z', 'tar', 'tar-gz', 'tar-lzma', 'tar-z', 'taz', 'tbz', 'tbz2', 'tgz', 'tz', 'z', 'zip', 'zipx', 'zix', 'zoo'),
        );

        $f = fopen ($sFile, 'r');
        if (!$f)
            return false;

        $this->_oDb->clearAllMimeTypes();

        while (!feof($f) && ($s = fgets($f, 4096)) !== false) {
            $s = trim($s);
            if (!$s || '#' == $s[0])
                continue;

            $a = preg_split ("/[\s\\b]+/", $s, 2);
            if (!isset($a[0]) || !isset($a[1]))
                continue;

            $sMimeType = $a[0];
            $aExts = preg_split ("/[\s]+/", $a[1]);

            foreach ($aExts as $sExt) {
                $sIcon = $this->determineIcon($aIcons, $sExt, $sMimeType);
                $sIconFont = $this->determineIcon($aIconsFont, $sExt, $sMimeType);

                if (!$this->_oDb->addMimeType($sMimeType, $sExt, $sIcon, $sIconFont))
                    $sResult .= _t('_Error') . ': ' . $sMimeType . "\t" . $sExt . "\n";
            }
        }

        fclose($f);

        if (!$sResult)
            $sResult = _t('_Success');

        return $sResult;
    }

    protected function determineIcon($aIcons, $sExt, $sMimeType)
    {
        foreach ($aIcons as $sIc => $if) {
            if (!(is_array($if) && in_array($sExt, $if)) && !(is_string($if) && 0 === strncmp($if, $sMimeType, strlen($if))))
                continue;
            return $sIc;
        }
        return false;
    }

    /**
     * Get file extension by file name.
     * @param $sFileName file name
     * @return file extention string
     */
    public function getFileExt ($sFileName)
    {
        return strtolower(pathinfo($sFileName, PATHINFO_EXTENSION));
    }

    /**
     * Get file title by file name, actually file title is file name without extension.
     * @param $sFileName file name
     * @return file title string
     */
    public function getFileTitle ($sFileName)
    {
        return pathinfo($sFileName, PATHINFO_FILENAME);
    }

    /**
     * Get file mime/type by file name.
     * @param $sFileName file name
     * @return file mime type string
     */
    public function getMimeTypeByFileName ($sFileName)
    {
        $sExt = $this->getFileExt($sFileName);
        $sMimeType = $this->_oDb->getMimeTypeByExt($sExt);
        if (!$sMimeType)
            $sMimeType = BX_DOL_STORAGE_DEFAULT_MIME_TYPE;
        return $sMimeType;
    }

    /**
     * Get file icon by file name.
     * File icon is just icon filename without patch or URL.
     * File icons must be located in images/icons directory in your template subfolder.
     * @param $sFileName file name
     * @return file icon string
     */
    public function getIconNameByFileName ($sFileName)
    {
        $sExt = $this->getFileExt($sFileName);
        $sIcon = $this->_oDb->getIconByExt($sExt);
        if (!$sIcon)
            $sIcon = BX_DOL_STORAGE_DEFAULT_ICON;
        return $sIcon;
    }

    /**
     * Get file font icon by file name.
     * Actually just a class name of icon is returnted.
     * @param $sFileName file name
     * @return file icon string
     */
    public function getFontIconNameByFileName ($sFileName)
    {
        $sExt = $this->getFileExt($sFileName);
        $sIcon = $this->_oDb->getIconFontByExt($sExt);
        if (!$sIcon)
            $sIcon = BX_DOL_STORAGE_DEFAULT_ICON_FONT;
        return $sIcon;
    }

    public function setSanitizeSvg($bSanitize)
    {
        $this->_bSanitizeSvg = $bSanitize;
    }

    public function isSanitizeSvg()
    {
        return $this->_bSanitizeSvg && !isAdmin();
    }

    public function isMimeTypeSvg($sMimeType)
    {
        return strncmp('image/svg', $sMimeType, 9) === 0;
    }

    // ------------ internal functions - events

    protected function onBeforeFileAdd ($aFileInfo)
    {
        if ($aFileInfo['size'] > $this->getMaxUploadFileSize($aFileInfo['profile_id'])) {
            $this->setErrorCode(BX_DOL_STORAGE_ERR_FILE_TOO_BIG);
            return false;
        }

        // TODO: check site quota - BX_DOL_STORAGE_ERR_SITE_QUOTA_EXCEEDED

        $aObjectQuota = $this->_oDb->getStorageObjectQuota();
        if (
            ($aObjectQuota['quota_size'] && ($aObjectQuota['current_size'] + $aFileInfo['size'] > $aObjectQuota['quota_size']))
            ||
            ($aObjectQuota['quota_number'] && ($aObjectQuota['current_number'] + 1 > $aObjectQuota['quota_number']))
            ) {
            $this->setErrorCode(BX_DOL_STORAGE_ERR_OBJECT_QUOTA_EXCEEDED);
            return false;
        }

        $aUserQuota = $this->_oDb->getUserQuota($aFileInfo['profile_id']);
        if (
            ($aUserQuota['quota_size'] && ($aUserQuota['current_size'] + $aFileInfo['size'] > $aUserQuota['quota_size']))
            ||
            ($aUserQuota['quota_number'] && ($aUserQuota['current_number'] + 1 > $aUserQuota['quota_number']))
            ) {
            $this->setErrorCode(BX_DOL_STORAGE_ERR_USER_QUOTA_EXCEEDED);
            return false;
        }

        $this->setErrorCode(BX_DOL_STORAGE_ERR_OK);

        $bRet = true;
        bx_alert($this->_aObject['object'], 'before_file_add', 0, $aFileInfo['profile_id'], array('file_info' => $aFileInfo, 'return_value' => &$bRet));
        return $bRet;
    }

    protected function onFileAdded ($aFileInfo)
    {
        // TODO: update site quota - BX_DOL_STORAGE_ERR_SITE_QUOTA_EXCEEDED

        if (!$this->_oDb->updateStorageObjectQuota($aFileInfo['size'], 1)) {
            $this->setErrorCode(BX_DOL_STORAGE_ERR_DB);
            return false;
        }

        if (!$this->_oDb->updateUserQuota($aFileInfo['profile_id'], $aFileInfo['size'], 1)) {
            $this->setErrorCode(BX_DOL_STORAGE_ERR_DB);
            return false;
        }

        if (!$this->insertGhost ($aFileInfo['id'], $aFileInfo['profile_id'], $aFileInfo['content_id'])) {
            $this->setErrorCode(BX_DOL_STORAGE_ERR_DB);
            return false;
        }

        $this->setErrorCode(BX_DOL_STORAGE_ERR_OK);

        $bRet = true;
        bx_alert($this->_aObject['object'], 'file_added', $aFileInfo['id'], $aFileInfo['profile_id'], array('file_info' => $aFileInfo, 'return_value' => &$bRet));
        return $bRet;
    }

    function insertGhost($iFileId, $iProfileId, $iContentId = 0)
    {
        return $this->_oDb->insertGhosts ($iFileId, $iProfileId, $iContentId);
    }

    function onBeforeFileDelete ($aFileInfo, $iProfileId)
    {
        $this->setErrorCode(BX_DOL_STORAGE_ERR_OK);

        $bRet = true;
        bx_alert($this->_aObject['object'], 'before_file_delete', $aFileInfo['id'], $iProfileId, array('file_info' => $aFileInfo, 'return_value' => &$bRet));
        return $bRet;
    }

    function onFileDeleted ($aFileInfo, $iProfileId, $aGhost = false)
    {
        // TODO: update site quota

        if (!$this->_oDb->updateStorageObjectQuota(-$aFileInfo['size'], -1)) {
            $this->setErrorCode(BX_DOL_STORAGE_ERR_DB);
            return false;
        }

        if (!$this->_oDb->updateUserQuota($aFileInfo['profile_id'], -$aFileInfo['size'], -1)) {
            $this->setErrorCode(BX_DOL_STORAGE_ERR_DB);
            return false;
        }

        $this->setErrorCode(BX_DOL_STORAGE_ERR_OK);

        $bRet = true;
        bx_alert($this->_aObject['object'], 'file_deleted', $aFileInfo['id'], $iProfileId, array('file_info' => $aFileInfo, 'ghost' => $aGhost, 'return_value' => &$bRet));
        return $bRet;
    }

    // ------------ internal functions

    protected function setErrorCode($i)
    {
        return ($this->_iErrorCode = $i);
    }

    protected function genRandName($isCheckForUniq = true)
    {
        $sRandName = strtolower(genRndPwd(32, false));
        if ($isCheckForUniq) {
            $iTries = 10;
            do {
                $aFile = $this->_oDb->getFileByRemoteId($sRandName);
                $bExist = is_array($aFile) && $aFile;
            } while (--$iTries && $bExist);
        }
        return $sRandName;
    }

    protected function genPath($s, $iLevels)
    {
        $sRet = '';
        $i = 1;
        while ($iLevels-- > 0)
            $sRet .= substr($s, 0, $i++) . '/';
        return $sRet;
    }

    protected function genRemoteNamePath ($sPath, $sLocalId, $sExt)
    {
        return $sPath . $sLocalId;
    }

    protected function isValidExt ($sExt)
    {
        switch ($this->_aObject['ext_mode']) {
            case 'allow-deny':
                if ($this->isAllowedExt($sExt))
                    return true;
                return false;
            case 'deny-allow':
                if ($this->isDeniedExt($sExt))
                    return false;
                return true;
            default:
                return false;
        }
    }

    protected function isAllowedExt ($sExt)
    {
        return $this->isAllowedDeniedExt($sExt, 'ext_allow');
    }

    protected function isDeniedExt ($sExt)
    {
        return $this->isAllowedDeniedExt($sExt, 'ext_deny');
    }

    protected function isAllowedDeniedExt ($sExt, $sExtMode)
    {
        if ('' == $this->_aObject[$sExtMode])
            return false;
        if (!is_array($this->_aObject[$sExtMode]))
            $this->_aObject[$sExtMode] = explode(',', $this->_aObject[$sExtMode]);
        return in_array ($sExt, $this->_aObject[$sExtMode]);
    }

    public function queueFiles($aFiles)
    {
        if (!$aFiles)
            return 0;

        $a = array();
        foreach ($aFiles as $aFile)
            $a[] = $aFile['id'];

        return $this->queueFilesForDeletion($a);
    }

    protected function getFileDuration($sFilePath, $sMimeType, $sExt, $oStorage)
    {
        if (strncmp('video/', $sMimeType, 6) === 0)
            return (int)BxDolTranscoderVideo::getDuration($sFilePath);
        return 0;
    }

    protected function getFileDimensions($sFilePath, $sMimeType, $sExt, $oStorage)
    {
        if (strncmp('image/', $sMimeType, 6) === 0 && $o = BxDolTranscoderImage::getObjectAbstract()) {
            $a = $o->getSize($sFilePath);
            if ($a && isset($a['w']) && isset($a['h']))
                return $a['w'] . 'x' . $a['h'];
        }
        
        if (strncmp('video/', $sMimeType, 6) === 0 && $o = BxDolTranscoderVideo::getObjectAbstract()) {
            $a = $o->getSize($sFilePath);
            if ($a && isset($a['w']) && isset($a['h']))
                return $a['w'] . 'x' . $a['h'];
        }
        return '';
    }

    protected function isAuthUrl ($aFile)
    {
        $s = trim(getParam('sys_storage_s3_force_auth_urls'));
        if ('*' == $s) 
            return true;

        if ($s && ($aStorages = explode(',', $s)))
            return in_array($this->getObject(), $aStorages);

        return $aFile['private'];
    }
}


/**
 * Handle file uploads via XMLHttpRequest
 */
class BxDolStorageHelperXhr
{
    protected $sName;

    function __construct ($aParams)
    {
        $this->sName = $aParams['name'];
    }

    function getImmediateError()
    {
        return BX_DOL_STORAGE_ERR_OK;
    }

    function save($path)
    {
        $input = fopen("php://input", "r");
        $temp = tmpfile();
        $realSize = stream_copy_to_stream($input, $temp);
        fclose($input);

        if (false === $this->getSize() || $realSize != $this->getSize())
            return false;

        $target = fopen($path, "w");
        fseek($temp, 0, SEEK_SET);
        stream_copy_to_stream($temp, $target);
        fclose($target);
        fclose($temp);

        return true;
    }

    function getName()
    {
        return $this->sName;
    }

    function getSize()
    {
        if (isset($_SERVER["CONTENT_LENGTH"]))
            return (int)$_SERVER["CONTENT_LENGTH"];
        else
            return false;
    }
}

/**
 * Handle file uploads via regular form post (uses the $_FILES array)
 */
class BxDolStorageHelperForm
{
    protected $aFile;

    function __construct ($aParams)
    {
        $this->aFile = $aParams['file'];
    }

    function getImmediateError()
    {
        if (!$this->aFile['size'] || !$this->aFile['tmp_name'])
            return BX_DOL_STORAGE_ERR_NO_FILE;

        if (UPLOAD_ERR_OK != $this->aFile['error'])
            return (int)$this->aFile['error'];

        return BX_DOL_STORAGE_ERR_OK;
    }

    function save($path)
    {
        if (!move_uploaded_file($this->aFile['tmp_name'], $path)){
            return false;
        }
        return true;
    }

    function getName()
    {
        return $this->aFile['name'];
    }

    function getSize()
    {
        return $this->aFile['size'];
    }
}

/**
 * Store file from local file path
 */
class BxDolStorageHelperPath
{
    protected $sPath;

    function __construct ($aParams)
    {
        $this->sPath = $aParams['path'];
    }

    function getImmediateError()
    {
        if (!$this->sPath || !file_exists($this->sPath))
            return BX_DOL_STORAGE_ERR_NO_FILE;

        return BX_DOL_STORAGE_ERR_OK;
    }

    function save($path)
    {
        if (!copy($this->sPath, $path)) {
            return false;
        }
        return true;
    }

    function getName()
    {
        return pathinfo($this->sPath, PATHINFO_BASENAME);
    }

    function getSize()
    {
        return filesize($this->sPath);
    }
}

/**
 * Store file from URL
 */
class BxDolStorageHelperUrl extends BxDolStorageHelperPath
{
    protected $aMime2Ext = array (
        'image/bmp' => 'bmp',
        'image/gif' => 'gif',
        'image/jpeg' => 'jpg',
        'image/pjpeg' => 'jpg',
        'image/png' => 'png',
    );

    function __construct ($aParams)
    {   
        $aParams['path'] = '';
        $sExt = pathinfo(parse_url($aParams['url'], PHP_URL_PATH), PATHINFO_EXTENSION);
        if ($sTmpFilename = tempnam(BX_DIRECTORY_PATH_TMP, '')) {
            $s = '';
            if (!$sExt) {
                $s = @file_get_contents($aParams['url']);
                $oFinfo = new finfo(FILEINFO_MIME_TYPE);
                $sMime = $oFinfo->buffer($s);
                if (isset($this->aMime2Ext[$sMime]))
                    $sExt = $this->aMime2Ext[$sMime];
            }

            $aParams['path'] =  $sTmpFilename . '.' . $sExt;
            @rename($sTmpFilename, $aParams['path']);

            if ($s) {
                file_put_contents($aParams['path'], $s);
            } 
            else {
                $hRead = @fopen($aParams['url'], "rb");
                $hWrite = fopen($aParams['path'], "wb");
                if (false !== $hRead && false !== $hWrite) {
                    while (!feof($hRead)) {
                        $data = fread($hRead, 8192);
                        if (false === fwrite($hWrite, $data)) {
                            fclose($hWrite);
                            file_put_contents($aParams['path'], '');
                            break;
                        }
                    }
                    fclose($hRead);
                    fclose($hWrite);
                }
            }
        }
        parent::__construct($aParams);
    }

    function getImmediateError()
    {
        $iRet = parent::getImmediateError();
        if (BX_DOL_STORAGE_ERR_OK != $iRet)
            return $iRet;
        return $this->getSize() > 0 ? BX_DOL_STORAGE_ERR_OK : BX_DOL_STORAGE_INVALID_FILE;
    }

    function __destruct() 
    {
        @unlink($this->sPath);
    }
}

/**
 * Handle file uploads from the same or another storage object
 */
class BxDolStorageHelperStorage
{
    protected $iFileId;
    protected $oStorage;
    protected $aFile;

    function __construct ($aParams)
    {
        $this->iFileId = $aParams['id'];
        $this->oStorage = BxDolStorage::getObjectInstance($aParams['storage']);

        $this->aFile = false;
        if ($this->oStorage)
            $this->aFile = $this->oStorage->getFile($this->iFileId);
    }

    function getImmediateError()
    {
        if (!$this->iFileId)
            return BX_DOL_STORAGE_ERR_NO_FILE;

        if (!$this->oStorage)
            return BX_DOL_STORAGE_ERR_ENGINE_GET;

        if (!$this->aFile)
            return BX_DOL_STORAGE_ERR_NO_FILE;

        return BX_DOL_STORAGE_ERR_OK;
    }

    function save($path)
    {
        $s = bx_file_get_contents ($this->oStorage->getFileUrlById($this->iFileId));
        if (!$s)
            return false;

        return file_put_contents($path, $s) ? true : false;
    }

    function getName()
    {
        return $this->aFile['file_name'];
    }

    function getSize()
    {
        return $this->aFile['size'];
    }
}

/** @} */
