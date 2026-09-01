<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

class BxBaseCmtsForm extends BxTemplFormView
{
    protected static $_sAttributeMaskId;
    protected static $_sAttributeMaskName;

    protected $_oObject;

    protected $_sGhostTemplateImage;

    public function __construct($aInfo, $oTemplate)
    {
        parent::__construct($aInfo, $oTemplate);

        if(empty(self::$_sAttributeMaskId))
            self::$_sAttributeMaskId = $this->aFormAttrs['id'];

        if(empty(self::$_sAttributeMaskName))
            self::$_sAttributeMaskName = $this->aFormAttrs['name'];

        $this->_oObject = null;

        $this->_sGhostTemplateImage = 'comments_uploader_nfw.html';

    	if(isset($this->aInputs['cmt_image'])) {
            $this->aInputs['cmt_image']['storage_object'] = 'sys_cmts_images';
            $this->aInputs['cmt_image']['images_transcoder'] = 'sys_cmts_images_preview';
            $this->aInputs['cmt_image']['uploaders'] = !empty($this->aInputs['cmt_image']['value']) ? unserialize($this->aInputs['cmt_image']['value']) : array('sys_cmts_html5');
            $this->aInputs['cmt_image']['upload_buttons_titles'] = array('Simple' => 'camera', 'HTML5' => 'camera');
            $this->aInputs['cmt_image']['storage_private'] = 0;
            $this->aInputs['cmt_image']['multiple'] = true;
            $this->aInputs['cmt_image']['content_id'] = 0;
            $this->aInputs['cmt_image']['ghost_template'] = '';
        }
    }
    
    function getHtmlEditorQueryParams($aInput)
    {
        $aQueryParams = parent::getHtmlEditorQueryParams($aInput);
        if (isset($this->aInputs['id'])) {
            $aQueryParams['cid'] = $this->aInputs['id']['value'];
        }

        $oObject = $this->_getObject(bx_process_input($this->aInputs['sys']['value']), (int)$this->aInputs['id']['value']);
        if($oObject && ($aCmtInfo = $this->_oObject->getSystemInfo())) {
            $aQueryParams['cmod'] = $aCmtInfo['module'] ?? '';
        }

        $aQueryParams['m'] = 'sys_cmts';
        $aQueryParams['fi'] = '';

        /**
         * @hooks
         * @hookdef hook-system-editor_query_params 'system', 'editor_query_params' - hook to override http(s) request's query params, which is used in HTML editor
         * - $unit_name - equals `system`
         * - $action - equals `editor_query_params`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `form` - [object] an instance of form, @see BxDolForm
         *      - `override_result` - [array] by ref, query string params, can be overridden in hook processing
         * @hook @ref hook-system-editor_query_params
         */
        bx_alert('system', 'editor_query_params', 0, 0, [
            'form' => $this,
            'override_result' => &$aQueryParams
        ]);
        
        return $aQueryParams;
    }
    
    public function getAttributeMask($sAttribute)
    {
        $sName = '_sAttributeMask' . bx_gen_method_name($sAttribute);
        return isset(self::$$sName) ? self::$$sName : '';
    }

    public function getStorageObjectName()
    {
        return isset($this->aInputs['cmt_image']['storage_object']) ? $this->aInputs['cmt_image']['storage_object'] : '';
    }

    public function getTranscoderPreviewName()
    {
    	return isset($this->aInputs['cmt_image']['images_transcoder']) ? $this->aInputs['cmt_image']['images_transcoder'] : '';
    }
    
    function initChecker ($aValues = array (), $aSpecificValues = array())
    {
        if(isset($this->aInputs['cmt_image'])) {
            if(!empty($this->aInputs['sys']['value']) && !empty($this->aInputs['id']['value']) && !empty($aValues['cmt_id'])) {
                $oObject = $this->_getObject(bx_process_input($this->aInputs['sys']['value']), (int)$this->aInputs['id']['value']);
                if($oObject)
                    $this->aInputs['cmt_image']['content_id'] = $oObject->getCommentUniqId($aValues['cmt_id']);
            }

            $this->aInputs['cmt_image']['ghost_template'] = $this->oTemplate->parseHtmlByName($this->_sGhostTemplateImage, $this->_getGhostTmplVarsImage());
        }

        if (isset($this->aInputs['cmt_anonymous']) && isset($aValues['cmt_author_id']))
            $this->aInputs['cmt_anonymous']['checked'] = $aValues['cmt_author_id'] < 0;
        
        parent::initChecker ($aValues, $aSpecificValues);
    }
    
    public function insert ($aValsToAdd = array(), $isIgnore = false)
    {
        $aValsToAdd['cmt_author_id'] *= isset($this->aInputs['cmt_anonymous']) && $this->getCleanValue('cmt_anonymous') ? -1 : 1;

        return parent::insert ($aValsToAdd, $isIgnore);
    }

    public function update ($iCmtId, $aValsToAdd = array(), &$aTrackTextFieldsChanges = null)
    {
        if (isset($this->aInputs['cmt_anonymous'])) {
            $aCmt = $this->_getObject($this->getCleanValue('sys'), $this->getCleanValue('id'))->getCommentRow($iCmtId);

            $aValsToAdd['cmt_author_id'] = ($this->getCleanValue('cmt_anonymous') ? -1 : 1) * abs($aCmt['cmt_author_id']);
        }

        return parent::update ($iCmtId, $aValsToAdd, $aTrackTextFieldsChanges);
    }
    
    public function processImages ($oCmts, $sFieldName, $iCmtUniqId, $iCmtId, $iCmtAuthorId, $isAssociateWithContent = false)
    {
        if(!isset($this->aInputs[$sFieldName]))
            return true;

        $mixedFileIds = $this->getCleanValue($sFieldName);
        if(!$mixedFileIds)
            return true;

        $oStorage = BxDolStorage::getObjectInstance($this->aInputs[$sFieldName]['storage_object']);
        if(!$oStorage)
            return false;

        $aGhostImages = $oStorage->getGhosts($iCmtAuthorId, $isAssociateWithContent ? 0 : $iCmtUniqId, true, $oCmts->isAdmin($iCmtAuthorId));
        if(!$aGhostImages)
            return true;

        foreach($aGhostImages as $aImage) {
            if(is_array($mixedFileIds) && !in_array($aImage['id'], $mixedFileIds))
                continue;

            if($aImage['private'])
                $oStorage->setFilePrivate($aImage['id'], 1);

            if($iCmtId)
                $this->_associalImageWithContent($oCmts, $sFieldName, $iCmtUniqId, $iCmtId, $iCmtAuthorId, $aImage['id']);
        }

        return true;
    }

    protected function genCustomRowCmtCf(&$aInput)
    {
        $aInput = BxDolContentFilter::getInstance()->getInputForComments($aInput);
        if($aInput['type'] == 'hidden') {
            $this->_sCodeAdd .= $this->genInput($aInput);
            return '';
        }

        return $this->genRowStandard($aInput);
    }

    protected function _getObject($sSystem, $iId)
    {
        if(empty($this->_oObject))
            $this->_oObject = BxDolCmts::getObjectInstance($sSystem, $iId);

        return $this->_oObject;
    }

    protected function _getGhostTmplVarsImage($aCmt = array())
    {
    	return array (
            'name' => $this->aInputs['cmt_image']['name'],
            'content_id' => (int)$this->aInputs['cmt_image']['content_id'],
            'editor_id' => '',
        );
    }

    protected function _associalImageWithContent($oCmts, $sFieldName, $iCmtUniqId, $iCmtId, $iCmtAuthorId, $iImageId)
    {
        $oStorage = BxDolStorage::getObjectInstance($this->aInputs[$sFieldName]['storage_object']);
        if(!$oStorage)
            return false;

        $oStorage->updateGhostsContentId($iImageId, $iCmtAuthorId, $iCmtUniqId, $oCmts->isAdmin($iCmtAuthorId));

        $aSystem = $oCmts->getSystemInfo();
        $oCmts->getQueryObject()->saveImages($aSystem['system_id'], $iCmtId, $iImageId);

        return true;
    }
}

/** @} */
