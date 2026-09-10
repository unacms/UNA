<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

class BxDolUpgrader extends BxDol
{
    protected $_sUrlVersionCheck = 'https://v.unacms.com/';
    protected $_sError = false;
    protected $oDb = null;

    /**
     * Prepare for system upgrade.
     * It prepares upgrade by downloading upgrade pack and performing different checks.
     * After all check are successfully completed, transient cron job is set to run upgrade upon next cron run.
     * @return true if upgrade was successfully scheduled to run, or false on error (you can call @see getError to determine particular error message)
     */
    public function prepare($bAuto = true, $bIgnoreVersionCheck = false)
    {
        $this->oDb = BxDolDb::getInstance(); // to use in check.php file 
        $this->setError(false);
        $iUmaskSave = umask(0);

        while(true) {

            // check for modules updates before system update
            if(!$bAuto) {
                $aUpdates = BxDolStudioInstallerUtils::getInstance()->checkUpdates();
                if(!empty($aUpdates) && is_array($aUpdates)) {
                    $this->setError(_t('_sys_upgrade_modules_upgrade_first'));
                    break;
                }
            }

            $aVersionUpdateInfo = $this->getVersionUpdateInfo();
            if (null === $aVersionUpdateInfo) {
                $this->setError(_t('_sys_upgrade_get_version_info_failed'));
                break;
            }

            if (!$this->isUpgradeAvailable($aVersionUpdateInfo))
                break;

            if (!$bIgnoreVersionCheck && BX_DOL_VERSION != bx_get_ver()) {
                $this->setError(_t('_sys_upgrade_db_and_files_versions_different'));
                break;
            }

            $fChangedFilesPercent = 1;
            $aFailedFiles = $this->checkFilesChecksums ($fChangedFilesPercent);
            $bAutoupdateForceModifiedFiles = ('on' == getParam('sys_autoupdate_force_modified_files'));
            if (!empty($aFailedFiles) && !$bAutoupdateForceModifiedFiles) {
                $this->setError(_t('_sys_upgrade_files_checksum_failed', implode(', ', $aFailedFiles)));
                break;
            }
            elseif ($fChangedFilesPercent > BX_FORCE_AUTOUPDATE_MAX_CHANGED_FILES_PERCENT && $bAutoupdateForceModifiedFiles) {
                $this->setError(_t('_sys_upgrade_files_checksum_failed_too_many', round($fChangedFilesPercent * 100)));
                break;
            }

            if (!($sPatchPath = $this->downloadPatch ($aVersionUpdateInfo))) {
                $this->setError(_t('_sys_upgrade_patch_download_failed'));
                break;
            }

            if (!$this->isPatchChecksumCorrect ($sPatchPath, $aVersionUpdateInfo)) {
                $this->deleteUpgradePatch($sPatchPath);
                $this->setError(_t('_sys_upgrade_patch_checksum_failed'));
                break;
            }

            if (!($sUnpackedPath = $this->unpackPatch ($sPatchPath, true))) {
                $this->deleteUpgradePatch($sPatchPath);
                $this->setError(_t('_sys_upgrade_patch_unpack_failed'));
                break;
            }            

            $this->deleteUpgradePatch($sPatchPath);

            if (!$this->isValidPatch ($sUnpackedPath, $aVersionUpdateInfo)) {
                $this->deleteUpgradeFolder($sPatchPath);
                $this->setError(_t('_sys_upgrade_patch_invalid'));
                break;
            }

            if (true !== ($sError = $this->performCheck ($sUnpackedPath, $aVersionUpdateInfo))) {
                $this->deleteUpgradeFolder($sPatchPath);
                $this->setError($sError);
                break;
            }

            if (!$this->setTransientUpgradeCronJob ($sUnpackedPath)) {
                $this->deleteUpgradeFolder($sPatchPath);
                $this->setError(_t('_sys_upgrade_set_cron_failed'));
                break;
            }

            break;
        }

        umask($iUmaskSave);

        return $this->getError() ? false : true;
    }

    public function getLatestVersionNumber ()
    {
        $a = $this->getVersionUpdateInfo ();
        if (!$a)
            return false;

        return $a['latest_version'];
    }

    /**
     * @param string $sChannel 'stable' or 'beta'; empty for the channel set in the sys_upgrade_channel option
     */
    public function getVersionUpdateInfo ($sChannel = '')
    {
        if(!$sChannel)
            $sChannel = getParam('sys_upgrade_channel');

        $sUrlVersionCheck = $this->_sUrlVersionCheck . ('beta' == $sChannel ? 'beta/' : '');
        $s = bx_file_get_contents($sUrlVersionCheck, array ('v' => bx_get_ver()));
        if (!$s)
            return null;

        $a = json_decode($s, true);
        if (!isset($a['latest_version']))
            return null;

        return $a;
    }

    public function isNewVersionAvailable ($a)
    {
        if (1 == version_compare(strtolower($a['latest_version']), strtolower(bx_get_ver())))
            return true;
        return false;
    }

    public function isUpgradeAvailable ($a)
    {
        if ($this->isNewVersionAvailable($a) && isset($a['patch']))
            return true;
        return false;
    }

    protected function downloadPatch ($a)
    {
        if (!isset($a['patch']['url']))
            return false;

        if (!($f = fopen($a['patch']['url'], "rb")))
            return false;

        $sTmpFile = BX_DIRECTORY_PATH_TMP . 'patch_' . bx_get_ver() . '_' . $a['patch']['ver'] . '.zip';
        if (file_exists($sTmpFile) && !unlink($sTmpFile))
            return false;        

        $sRet = false;
        if (false !== $sTmpFile && false !== file_put_contents($sTmpFile, $f))
            $sRet = $sTmpFile;

        fclose($f);

        return $sRet;
    }

    protected function isPatchChecksumCorrect ($sPatchPath, $aVersionUpdateInfo)
    {
        return md5_file($sPatchPath) == $aVersionUpdateInfo['patch']['md5'];
    }

    protected function unpackPatch ($sPatchPath)
    {
        $sTmpFolder = $this->getTmpFolderFromZip($sPatchPath);
        if (file_exists($sTmpFolder) && !bx_rrmdir($sTmpFolder))
            return false;
        
        $oZip = new ZipArchive();
        if ($oZip->open($sPatchPath) !== true)
            return false;

        $sRootFolder = $oZip->numFiles > 0 ? $oZip->getNameIndex(0) : false;
        if (!$sRootFolder || !mkdir($sTmpFolder) || !$oZip->extractTo($sTmpFolder))
            $sRootFolder = false;

        $oZip->close();

        return $sRootFolder ? $sTmpFolder . '/' . trim($sRootFolder, '/') . '/' : false;
    }

    protected function checkFilesChecksums (&$fChangedFilesPercent)
    {
        $oHasher = bx_instance('BxDolInstallerHasher');
        return $oHasher->checkSystemFilesHash($fChangedFilesPercent);
    }

    protected function isValidPatch ($sUnpackedPath, $aVersionUpdateInfo)
    {
        $sPath = $sUnpackedPath . 'files/' . $this->normalizeVersion(bx_get_ver()) . '-' . $this->normalizeVersion($aVersionUpdateInfo['patch']['ver']) . '/';
        $sCheckFilePath =  $sPath . 'check.php';
        $sVersionFilePath =  $sPath . 'files/inc/version.inc.php';
        return file_exists($sCheckFilePath) && file_exists($sVersionFilePath) && file_exists($sUnpackedPath . 'BxDolUpgradeCron.php');
    }

    protected function performCheck ($sUnpackedPath, $aVersionUpdateInfo)
    {
        $sPath = $sUnpackedPath . 'files/' . $this->normalizeVersion(bx_get_ver()) . '-' . $this->normalizeVersion($aVersionUpdateInfo['patch']['ver']) . '/';
        $sCheckFilePath =  $sPath . 'check.php';
        return include ($sCheckFilePath);
    }

    public function setTransientUpgradeCronJob ($sUnpackedPath)
    {
        $sUnpackedPath = rtrim($sUnpackedPath, '/') . '/';
        return BxDolCronQuery::getInstance()->addTransientJobClass('sys_perform_upgrade', 'BxDolUpgradeCron', bx_ltrim_str($sUnpackedPath, BX_DIRECTORY_PATH_ROOT) . 'BxDolUpgradeCron.php');
    }

    public function getError()
    {
        return $this->_sError;
    }

    protected function setError($s)
    {
        $this->_sError = $s;
    }
    
    protected function normalizeVersion($s)
    {
        return str_replace(array('-', '_', ' '), '.', $s);
    }

    protected function getTmpFolderFromZip($sPatchPath)
    {
        return preg_replace('/\.zip$/', '', $sPatchPath);
    }

    protected function deleteUpgradeFolder($sPatchPath)
    {
        @bx_rrmdir($this->getTmpFolderFromZip($sPatchPath));
    }

    protected function deleteUpgradePatch($sPatchPath)
    {
        @unlink($sPatchPath);
    }
}

/** @} */
