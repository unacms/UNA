<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Antispam Antispam
 * @ingroup     UnaModules
 *
 * @{
 */

require_once(BX_DIRECTORY_PATH_INC . "design.inc.php");

class BxStrmGridRecordings extends BxTemplGrid
{
    protected $_iContentId;

    public function __construct ($aOptions, $oTemplate = false)
    {
        parent::__construct ($aOptions, $oTemplate);
        $this->_iContentId = (int)bx_get('id');
        $this->_sDefaultSortingOrder = 'DESC';
        $this->_aQueryAppend['id'] = $this->_iContentId;
    }
    protected function _getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage)
    {
        if (!$this->_iContentId || !isLogged())
            $this->_aOptions['source'] .= " AND 0 ";
        elseif (isAdmin())
            $this->_aOptions['source'] .= BxDolDb::getInstance()->prepareAsString(" AND `sys_storage_ghosts`.`content_id` = ?", $this->_iContentId);
        else
            $this->_aOptions['source'] .= BxDolDb::getInstance()->prepareAsString(" AND `sys_storage_ghosts`.`content_id` = (SELECT `bx_stream_streams`.`id` FROM `bx_stream_streams` WHERE `bx_stream_streams`.`id` = ? AND `bx_stream_streams`.`author` = ? LIMIT 1)", $this->_iContentId, bx_get_logged_profile_id());

        return parent::_getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage);
    }

    protected function _getCellSize ($mixedValue, $sKey, $aField, $aRow)
    {
        return parent::_getCellDefault (_t_format_size($mixedValue), $sKey, $aField, $aRow);
    }

    protected function _getCellAdded ($mixedValue, $sKey, $aField, $aRow)
    {
        return parent::_getCellDefault (bx_time_js($mixedValue, BX_FORMAT_DATE), $sKey, $aField, $aRow);
    }

    protected function _getActionPublish ($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
        $aModule = BxDolModuleQuery::getInstance()->getModuleByName('bx_videos');
        return $aModule && $aModule['enabled'] ? parent::_getActionDefault ($sType, $sKey, $a, $isSmall, $isDisabled, $aRow) : '';
    }

    public function performActionDelete() 
    {
        $aIds = $this->_prepareAction();

        $aIdsAffected = array ();
        foreach ($aIds as $mixedId) {
            if (!$this->_delete((int)$mixedId))
                continue;
            $aIdsAffected[] = (int)$mixedId;
        }

        echoJson([
            'grid' => $this->getCode(false),
            'blink' => $aIdsAffected,
        ]);
    }

    public function performActionDownload() 
    {
        $sUrl = false;
        if (!empty($aIds = $this->_prepareAction()))
            $sUrl = $this->_download(array_shift($aIds));
        
        echoJson(!$sUrl ? [] : [
            'open_url' => $sUrl,
        ]);
    }

    public function performActionPublish() 
    {
        $sUrl = false;
        $sErrorMsg = '';
        if (!empty($aIds = $this->_prepareAction()))
            $sUrl = $this->_publish(array_shift($aIds), $sErrorMsg);
        
        if ($sUrl) {
            $a = ['redirect' => $sUrl];
        }
        elseif ($sErrorMsg) {
            $s = BxTemplFunctions::getInstance()->popupBox(
                'bx_stream_popup',
                _t('_Error'),
                MsgBox($sErrorMsg)
            );
            $a = ['popup' => $s];
        } 
        else {
            $a = [];
        }

        echoJson($a);
    }

    protected function _prepareAction() 
    {
        $iAffected = 0;
        $aIds = bx_get('ids');
        if (!$aIds || !is_array($aIds)) {
            $this->_echoResultJson(array());
            exit;
        }

        return $aIds;
    }

    protected function _delete($iFileId)
    {
        if (!($oStorage = $this->_actionWithStorage($iFileId)))
            return false;
        
        return $oStorage->deleteFile($iFileId);
    }

    protected function _download($iFileId)
    {
        if (!($oStorage = $this->_actionWithStorage($iFileId)))
            return false;
        
        return $oStorage->getFileUrlById($iFileId);
    }

    protected function _publish($iFileId, &$sErrorMsg)
    {
        $oModule = BxDolModule::getInstance('bx_videos');
        if (!$oModule || !$oModule->isEnabled())
            return false;
        
        if (!($oStorage = $this->_actionWithStorage($iFileId)))
            return false;
        
        if (!($sFileUrl = $oStorage->getFileUrlById($iFileId))) {
            $sErrorMsg = $oStorage->getErrorString();
            return false;
        }

        if (empty($oModule->_oConfig->CNF['OBJECT_STORAGE_VIDEOS']) || empty($oModule->_oConfig->CNF['URI_ADD_ENTRY']))
            return false;

        $oStorageVideos = BxDolStorage::getObjectInstance($oModule->_oConfig->CNF['OBJECT_STORAGE_VIDEOS']);
        if (!$oStorageVideos)
            return false;

        $iFileIdNew = $oStorageVideos->storeFileFromUrl($sFileUrl, false, bx_get_logged_profile_id(), 0, true);
        if (!$iFileIdNew) {
            $sErrorMsg = $oStorageVideos->getErrorString();
            return false;
        }

        return bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=' . $oModule->_oConfig->CNF['URI_ADD_ENTRY']));
    }

    protected function _actionWithStorage($iFileId)
    {
        $oStorage = BxDolStorage::getObjectInstance('bx_stream_recordings');
        $aFile = $oStorage->getGhost($iFileId);
        if (!$aFile || empty($aFile['content_id']))
            return false;

        $oContentInfo = BxDolContentInfo::getObjectInstance('bx_stream');
        if (!$oContentInfo)
            return false;

        $iProfileId = $oContentInfo->getContentAuthor($aFile['content_id']);
        if (!$iProfileId || $iProfileId != bx_get_logged_profile_id())
            return false;
    
        return $oStorage;
    }
}

/** @} */
