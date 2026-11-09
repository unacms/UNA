<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Files Files
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * Files bulk downloader
 */

define('BX_FILES_DOWNLOADER_TIMEOUT', 10); //seconds
define('BX_FILES_DOWNLOADER_TIMEOUT_REQUESTS', 15); //seconds

define('BX_FILES_DOWNLOADER_STATUS_EMPTY', 0);
define('BX_FILES_DOWNLOADER_STATUS_TOO_LARGE', 1);
define('BX_FILES_DOWNLOADER_STATUS_DOWNLOADING', 2);
define('BX_FILES_DOWNLOADER_STATUS_READY', 3);

class BxFilesBulkDownloader
{
    var $oModule;
    public function __construct(&$oModule)
    {
        $this->oModule = &$oModule;
    }

    public function createDownloadingJob($aFiles, $sZipFileName) {
        $CNF = &$this->oModule->_oConfig->CNF;

        $aFilesList = $this->getFolderFiles($aFiles, '/', 'mixed');
        if(!$aFilesList) return [
            'status' => BX_FILES_DOWNLOADER_STATUS_EMPTY,
        ];

        $iMaxSize = intval(getParam($CNF['PARAM_MAX_BULK_DOWNLOAD_SIZE'])) * 1024 * 1024;
        if ($iMaxSize) {
            $iTotalSize = 0;
            foreach ($aFilesList as $aFile) {
                $iTotalSize += $aFile['size'];
            }
            if ($iTotalSize >= $iMaxSize) return [
                'status' => BX_FILES_DOWNLOADER_STATUS_TOO_LARGE,
            ];
        }

        $mRes = $this->processDownloading($aFilesList);
        if ($mRes === BX_FILES_DOWNLOADER_STATUS_DOWNLOADING) {
            $iDownloadingJobId = $this->oModule->_oDb->createDownloadingJob($aFilesList, $sZipFileName, bx_get_logged_profile_id());
            return [
                'status' => BX_FILES_DOWNLOADER_STATUS_DOWNLOADING,
                'job' => $iDownloadingJobId,
            ];
        } else {
            return [
                'status' => BX_FILES_DOWNLOADER_STATUS_READY,
                'file' => $mRes,
                'filename' => $this->sanitizeFileName($sZipFileName).'.zip',
            ];
        }
    }

    public function processDownloading(&$aFiles) {
        $CNF = &$this->oModule->_oConfig->CNF;

        $oStorage = BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE']);

        $iJobStarted = time();

        foreach ($aFiles as $iIndex => $aFile) {
            if (isset($aFile['downloaded']) && file_exists($aFile['downloaded'])) continue;

            $sFileUrl = $oStorage->getFileUrlById($aFile['id']);
            $sFilePath = BX_DIRECTORY_PATH_TMP . 'download-job-file-'.$aFile['id'];
            if (!file_exists($sFilePath)) {
                $sHttpCode = null;
                @file_put_contents($sFilePath, bx_file_get_contents($sFileUrl, [], 'get', [], $sHttpCode, [], 0, [], true));
            }

            $aFiles[$iIndex]['downloaded'] = $sFilePath;

            if (time() - $iJobStarted >= BX_FILES_DOWNLOADER_TIMEOUT) {
                return BX_FILES_DOWNLOADER_STATUS_DOWNLOADING;
            }
        }

        return $this->createZipArchive($aFiles);
    }

    private function createZipArchive(&$aFiles) {
        $sZipFile = BX_DIRECTORY_PATH_TMP.'files-folder-'.time().mt_rand().'.zip';
        if (file_exists($sZipFile)) @unlink($sZipFile);

        $oZipFile = new ZipArchive();
        if ($oZipFile->open($sZipFile, ZIPARCHIVE::CREATE | ZIPARCHIVE::OVERWRITE)) {

            $iIndex = 0;
            foreach ($aFiles as $aFile) {
                $sFilePath = $aFile['downloaded'];
                if (file_exists($sFilePath) && is_readable($sFilePath)) {
                    $oZipFile->addFile($sFilePath, $aFile['filename']);
                    $oZipFile->setCompressionIndex($iIndex++, ZipArchive::CM_STORE);
                }
            }
            $oZipFile->close();

            foreach ($aFiles as $aFile)
                @unlink($aFile['downloaded']);

            return $sZipFile;
        } else {
            return BX_FILES_DOWNLOADER_STATUS_EMPTY;
        }
    }

    private function getFolderFiles($mFile, $sRelPath, $sType) {
        $aFiles = $this->oModule->_oDb->getFolderFilesEx($mFile, $sType);
        if (!$aFiles) return [];

        $aResult = [];
        $aUniqueNames = [];
        foreach ($aFiles as $aFile) {
            if (CHECK_ACTION_RESULT_ALLOWED !== $this->oModule->checkAllowedView($aFile)) continue;

            //in case title has been changed we might have to add extensions manually
            $aFileInfo = pathinfo($aFile['title']);
            $sFileBaseName = isset($aFileInfo['filename']) ? $aFileInfo['filename'] : '_';
            $sFileExt = isset($aFileInfo['extension']) ? $aFileInfo['extension'] : '';

            if (!$sFileExt || $sFileExt != $aFile['ext']) $sFileExt = $aFile['ext'];

            //handle multiple files with the same name
            $sFilename = $this->sanitizeFileName($sFileBaseName);
            $iIndex = 1;
            while (isset($aUniqueNames[$sFilename])) {
                $sFilename = $this->sanitizeFileName($sFileBaseName.'_'.$iIndex++);
            }
            $aUniqueNames[$sFilename] = 1;

            if ($aFile['type'] == 'folder') {
                $aResult = array_merge($aResult, $this->getFolderFiles($aFile['id'], $sRelPath . $sFilename . '/', 'folder'));
            } else {
                $aResult[] = [
                    'filename' => trim($sRelPath.$sFilename.'.'.$sFileExt, '/'),
                    'size' => $aFile['size'],
                    'id' => $aFile['file_id'],
                ];
            }
        }

        return $aResult;
    }

    private function sanitizeFileName($sDesiredFilename) {
        $sDesiredFilename = mb_ereg_replace("([^\w\s\d\-_~,;\[\]\(\).])", '_', $sDesiredFilename);
        $sDesiredFilename = mb_ereg_replace("([\.]{2,})", '_', $sDesiredFilename);
        return $sDesiredFilename;
    }
}

/** @} */
