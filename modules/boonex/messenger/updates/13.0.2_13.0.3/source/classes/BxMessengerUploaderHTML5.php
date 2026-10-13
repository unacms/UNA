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

class BxMessengerUploaderHTML5 extends BxBaseModFilesUploaderHTML5
{
    public function __construct ($aObject, $sStorageObject, $sUniqId, $oTemplate)
    {
		$this->MODULE = 'bx_messenger';
        parent::__construct($aObject, $sStorageObject, $sUniqId, $oTemplate);
    }

    public function getGhostsWithOrder($iProfileId, $sFormat, $sImagesTranscoder = false, $iContentId = false)
    {
        if ((int)$iContentId){
            $oStorage = BxDolStorage::getObjectInstance($this->_sStorageObject);
            $aFiles = $this->_oModule->_oDb->getJotFiles($iContentId);
            foreach($aFiles as &$aFile)
                $oStorage->insertGhost($aFile['id'], $aFile['profile_id'], $iContentId);            
        }
    
        return parent::getGhostsWithOrder($iProfileId, $sFormat, $sImagesTranscoder, $iContentId);
    }

    protected function getGhostTemplateVars($aFile, $iProfileId, $iContentId, $oStorage, $oImagesTranscoder)
    {
        return  [
                    'file_title' => $aFile['file_name'],
                    'file_title_attr' => bx_html_attribute($aFile['file_name'])
                ];
    }

    public function deleteGhost($iFileId, $iProfileId)
    {
        $oStorage = BxDolStorage::getObjectInstance($this->_sStorageObject);
        $aFile = $oStorage->getFile($iFileId);
        $CNF = &$this->_oModule->_oConfig->CNF;
        if (empty($aFile))
            return _t('_error occured');

        $sResult = parent::deleteGhost($iFileId, $iProfileId);
        if ($sResult !== 'ok')
            return $sResult;

        if((int)$aFile[$CNF['FIELD_ST_JOT']]) {
            $iMessageId = (int)$aFile[$CNF['FIELD_ST_JOT']];
            $aJotInfo = $this->_oModule->_oDb->getJotById($iMessageId);
            if (empty($aJotInfo))
                return _t('_error occured');

            $aFilesData = !$aJotInfo[$CNF['FIELD_MESSAGE_AT']] ? @unserialize($aJotInfo[$CNF['FIELD_MESSAGE_AT']]) : [];
            $aFilesList = $this->_oModule->_oDb->getJotFiles($iMessageId);
            if (!empty($aFilesList)){
                 foreach($aFilesList as &$aFileItem)
                     $aFilesData[BX_ATT_TYPE_FILES][] = $aFileItem[$CNF['FIELD_ST_NAME']];
            }

            $this->_oModule->_oDb->updateJot($iMessageId, $CNF['FIELD_MESSAGE_AT'], !empty($aFilesData) ? @serialize($aFilesData) : '');
        }

        return 'ok';
    }
}

/** @} */
