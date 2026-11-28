<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Stories Stories
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * Create/Edit entry form
 */
class BxStoriesFormMedia extends BxTemplFormView
{
    protected $_sModule;
    protected $_oModule;

    protected $_iMediaId;
    protected $_aMediaInfo;

    public function __construct($aInfo, $oTemplate = false)
    {
        $this->_sModule = 'bx_stories';
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

        $this->aFormAttrs['action'] = BX_DOL_URL_ROOT . $this->_oModule->_oConfig->getBaseUri() . $aAction . '_media/' . $iMediaId;

        if(isset($this->aInputs['content_id'])) {
            $aStories = $this->_oModule->_oDb->getEntriesBy(array('type' => 'author', 'author' => $this->_aMediaInfo['author']));
            foreach($aStories as $aStory)
                $this->aInputs['content_id']['values'][] = ['key' => $aStory[$CNF['FIELD_ID']], 'value' => $aStory[$CNF['FIELD_TITLE']]];
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
