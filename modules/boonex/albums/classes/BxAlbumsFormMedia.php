<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Albums Albums
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * Create/Edit entry form
 */
class BxAlbumsFormMedia extends BxTemplFormView
{
    protected $_sModule;
    protected $_oModule;

    protected $_iMediaId;
    protected $_aMediaInfo;

    public function __construct($aInfo, $oTemplate = false)
    {
        $this->_sModule = 'bx_albums';
        $this->_oModule = BxDolModule::getInstance($this->_sModule);

        parent::__construct($aInfo, $oTemplate);
    }

    public function initChecker($aValues = array (), $aSpecificValues = array())
    {
        if(!empty($this->_aMediaInfo) && is_array($this->_aMediaInfo))
            $aValues = $this->_aMediaInfo;

        parent::initChecker($aValues, $aSpecificValues);
    }

    public function initForm($aAction, $iMediaId)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $this->_iMediaId = $iMediaId;
        $this->_aMediaInfo = $this->_oModule->_oDb->getMediaInfoById($iMediaId);

        if(bx_is_dynamic_request())        
            $this->aFormAttrs['action'] = $this->_oModule->_oConfig->getBaseUri() . $aAction . '_media/' . $iMediaId;
        else
            $this->aFormAttrs['action'] = BxDolPermalinks::getInstance()->permalink('page.php?i=' . $CNF['URI_' . strtoupper($aAction) . '_MEDIA'] . '&id=' . $iMediaId);
        $this->aFormAttrs['action'] = bx_absolute_url($this->aFormAttrs['action']);

        if(isset($this->aInputs['content_id'])) {
            $aAlbums = $this->_oModule->_oDb->getEntriesBy(array('type' => 'author', 'author' => $this->_aMediaInfo['author']));
            foreach($aAlbums as $aAlbum)
                $this->aInputs['content_id']['values'][] = ['key' => $aAlbum[$CNF['FIELD_ID']], 'value' => $aAlbum[$CNF['FIELD_TITLE']]];
        }
    }
    
    public function update($val, $aValsToAdd = array(), &$aTrackTextFieldsChanges = null)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $sField = 'content_id';
        if(isset($this->aInputs[$sField])) {
            $iContentId = $this->getCleanValue($sField);

            $oStorage = BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE']);
            if(!$oStorage->updateGhostsContentId($this->_aMediaInfo['file_id'], $this->_aMediaInfo['author'], $iContentId))
                return false;
        }

        return parent::update($val, $aValsToAdd, $aTrackTextFieldsChanges);
    }
}

/** @} */
