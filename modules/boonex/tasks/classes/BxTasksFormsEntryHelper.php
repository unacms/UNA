<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT 
 * @defgroup    Tasks Tasks
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * Entry forms helper functions
 */
class BxTasksFormsEntryHelper extends BxBaseModTextFormsEntryHelper
{
    public function __construct($oModule)
    {
        parent::__construct($oModule);
    }

    public function onDataEditBefore ($iContentId, $aContentInfo, &$aTrackTextFieldsChanges, &$oProfile, &$oForm)
    {
        parent::onDataEditBefore ($iContentId, $aContentInfo, $aTrackTextFieldsChanges, $oProfile, $oForm);

        $aTrackTextFieldsChanges = [];
    }

    public function onDataEditAfter ($iContentId, $aContentInfo, $aTrackTextFieldsChanges, $oProfile, $oForm)
    {
        if($s = parent::onDataEditAfter($iContentId, $aContentInfo, $aTrackTextFieldsChanges, $oProfile, $oForm))
            return $s;

        if(!($aContentInfo = $this->_oModule->_oDb->getContentInfoById($iContentId)))
            return MsgBox(_t('_sys_txt_error_occured'));

        $CNF = &$this->_oModule->_oConfig->CNF;

        $aFldLoc2Repo = [
            $CNF['FIELD_TITLE'] => 'title', 
            $CNF['FIELD_TEXT'] => 'body',
            $CNF['FIELD_STICKERS'] => 'labels',
            $CNF['FIELD_TYPE'] => 'type',
        ];

        $aFields = [];
        if(($aLocFields = $aTrackTextFieldsChanges['changed_fields'] ?? false) && is_array($aLocFields))
            foreach($aLocFields as $sLocField)
                if(($sRepoField = $aFldLoc2Repo[$sLocField] ?? false)) {
                    $iContextId = ($iContextId = (int)$aContentInfo[$CNF['FIELD_ALLOW_VIEW_TO']]) < 0 ? abs($iContextId) : 0;

                    switch($sLocField) {
                        case $CNF['FIELD_STICKERS']:
                                $aStickers = $this->_oModule->getStickers($aContentInfo[$sLocField], $iContextId);
                                if($aStickers && is_array($aStickers)) {
                                    $aFields[$sRepoField] = [];
                                    foreach($aStickers as $aSticker)
                                        $aFields[$sRepoField][] = $aSticker['title'];
                                }
                                break;

                        case $CNF['FIELD_TYPE']:
                            $aFields[$sRepoField] = $this->_oModule->getType($aContentInfo[$sLocField], $iContextId);
                            break;

                        default:
                            $aFields[$sRepoField] = $aContentInfo[$sLocField];
                    }
                }

        if($aFields)
            $this->_oModule->ghUpdateIssue($aContentInfo, $aFields);

        return '';
    }

    protected function redirectAfterDelete($aContentInfo, $sUrl = '')
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if((int)$aContentInfo[$CNF['FIELD_ALLOW_VIEW_TO']] < 0)
            $sUrl = 'page.php?i=' . $CNF['URI_ENTRIES_BY_CONTEXT'] . '&profile_id=' . abs($aContentInfo[$CNF['FIELD_ALLOW_VIEW_TO']]);

        return parent::redirectAfterDelete($aContentInfo, $sUrl);
    }

    public function onDataDeleteAfter ($iContentId, $aContentInfo, $oProfile)
    {
        $s = parent::onDataDeleteAfter ($iContentId, $aContentInfo, $oProfile);
        if(!empty($s))
            return $s;

        $CNF = &$this->_oModule->_oConfig->CNF;
        $oConnection = BxDolConnection::getObjectInstance($CNF['OBJECT_CONNECTION']);
        $oConnection->onDeleteContent($iContentId);
        return '';
    }
}

/** @} */
