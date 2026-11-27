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

bx_import('BxDolAcl');

/**
 * Stories module
 */
class BxStoriesModule extends BxBaseModTextModule
{
    protected $_aContexts = array('popular', 'public', 'author');

    function __construct(&$aModule)
    {
        parent::__construct($aModule);
    }

    public function actionEmbed($iContentId, $sUnitTemplate = '', $sAddCode = '')
    {
        return $this->_oTemplate->getJsCode('main') . parent::actionEmbed($iContentId);
    }

    public function actionPlay($iContentId)
    {
        $sJsObject = $this->_oConfig->getJsObject('main');

        $aContentInfo = $this->_oDb->getContentInfoById($iContentId);
        if(($sMsg = $this->checkAllowedView($aContentInfo)) !== CHECK_ACTION_RESULT_ALLOWED)
            return echoJson(['msg' => $sMsg]);

        return echoJson(['popup' => [
            'html' => $this->_oTemplate->entryPlay($aContentInfo), 
            'options' => [
                'closeOnOuterClick' => true,
                'removeOnClose' => true,
                'onShow' => $sJsObject . '.playInit()',
                'onHide' => $sJsObject . '.playDestroy()'
            ]
        ]]);
    }

    public function actionEmbedMedia($iContentId)
    {
        $oTemplate = BxDolTemplate::getInstance();
        
        $aContentInfo = $this->_oDb->getMediaInfoById($iContentId);
        if(empty($aContentInfo))
            $oTemplate->getEmbed(false);

        if(empty($sUnitTemplate))
            $sUnitTemplate = 'unit_media_gallery.html';

        $oTemplate->getEmbed($this->_oTemplate->unit($aContentInfo, true, $sUnitTemplate));
    }

    public function actionEditMedia($iMediaId)
    {
        $CNF = &$this->_oConfig->CNF;

        $iMediaId = (int)$iMediaId;
        $aMediaInfo = $this->_oDb->getMediaInfoById($iMediaId);
        $aContentInfo = $this->_oDb->getContentInfoById($aMediaInfo['content_id']);
        if(($sMsg = $this->checkAllowedEdit($aContentInfo)) !== CHECK_ACTION_RESULT_ALLOWED)
            return echoJson(['msg' => $sMsg]);

        $oForm = BxDolForm::getObjectInstance($CNF['OBJECT_FORM_MEDIA'], $CNF['OBJECT_FORM_MEDIA_DISPLAY_EDIT']);
        $oForm->initForm('edit', $iMediaId);
        $oForm->initChecker();

        if($oForm->isSubmittedAndValid()) {
            if($oForm->update($iMediaId) !== false) {
                $aMediaInfo = $this->_oDb->getMediaInfoById($iMediaId);
                $aRes = array('reload' => 1);
            }
            else
                $aRes = array('msg' => _t('_bx_stories_txt_err_cannot_perform_action'));

            return echoJson($aRes);
        }

        $sContent = BxTemplStudioFunctions::getInstance()->transBox('bx-stories-edit-media-popup', $this->_oTemplate->parseHtmlByName('media_edit.html', array(
            'form_id' => $oForm->aFormAttrs['id'],
            'form' => $oForm->getCode(true)
        )));

        echoJson(array('popup' => array('html' => $sContent, 'options' => array('closeOnOuterClick' => false))));
    }
	
    public function actionDeleteMedia($iMediaId)
    {
        $CNF = &$this->_oConfig->CNF;

        $sUploader = reset($CNF['OBJECT_UPLOADERS']);
        $aMediaInfo = $this->_oDb->getMediaInfoById($iMediaId);
        if(!$sUploader || empty($aMediaInfo) || !is_array($aMediaInfo))
            return echoJson([]);

        $oUploader = BxDolUploader::getObjectInstance($sUploader, $CNF['OBJECT_STORAGE'], '');
        if($oUploader === false) 
            return echoJson(['msg' => _t('_sys_txt_error_occured')]);

        $oUploader->deleteGhost($aMediaInfo['file_id'], bx_get_logged_profile_id());

        return echoJson(['redirect' => bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=' . $CNF['URI_VIEW_ENTRY'] . '&id=' . $aMediaInfo['content_id']))]);            
    }

    public function actionGetSiblingMedia($iMediaId, $mixedContext)
    {
        $aSiblings = false;
        $sErrorMsg = false;
        if (!($aMediaInfo = $this->_oDb->getMediaInfoById((int)$iMediaId))) 
            $sErrorMsg = _t('_sys_txt_error_occured');

        if (empty($sErrorMsg) && !($aContentInfo = $this->_oDb->getContentInfoById($aMediaInfo['content_id'])))
            $sErrorMsg = _t('_sys_txt_error_occured');

        if (empty($sErrorMsg) && (CHECK_ACTION_RESULT_ALLOWED !== ($sMsg = $this->checkAllowedView($aContentInfo))))
            $sErrorMsg = $sMsg;

        if (empty($sErrorMsg)) {
            $aSiblings = array (
                'next' => $this->_oTemplate->getNextPrevMedia($aMediaInfo, true, $mixedContext),
                'prev' => $this->_oTemplate->getNextPrevMedia($aMediaInfo, false, $mixedContext),
            );
        }
    
        $a = $sErrorMsg ? array('error' => $sErrorMsg) : array('next' => $aSiblings['next'], 'prev' => $aSiblings['prev']);

        $s = json_encode($a);

        header('Content-type: text/html; charset=utf-8');
        echo $s;
    }

    public function serviceGetSafeServices()
    {
        return array_merge(parent::serviceGetSafeServices(), [
            'EntityAddFiles' => '',
        ]);
    }

    /**
     * Entry actions and social sharing block
     */
    public function serviceEntityAllActions ($mixedContent = false, $aParams = array())
    {
        if(!empty($mixedContent)) {
            if(!is_array($mixedContent))
               $mixedContent = array((int)$mixedContent, array());
        }
        else {
            $mixedContent = $this->_getContent();
            if($mixedContent === false)
                return false;
        }
        
        list($iContentId, $aContentInfo) = $mixedContent;

        $aMedias = $this->_oDb->getMediaListByContentId($iContentId);
        if(!empty($aMedias) && is_array($aMedias)) {
            $aMedia = array_shift($aMedias);
            if(!empty($aMedia['file_id']))
                $aParams = array_merge(array(
                    'entry_thumb' => $aMedia['file_id']
                ), $aParams);
        }

        return parent::serviceEntityAllActions(array($iContentId, $aContentInfo), $aParams);
    }

    public function serviceMediaAllActions ($mixedContent = false, $aParams = [])
    {
        $iMediaId = 0;
        $aMediaInfo = [];

        $bContent = !empty($mixedContent);
        if($bContent && is_array($mixedContent))
            list($iMediaId, $aMediaInfo) = $mixedContent;
        else {
            if($bContent)
                $iMediaId = (int)$mixedContent;
            else
                $iMediaId = bx_process_input(bx_get('id'), BX_DATA_INT);

            if(!$iMediaId)
                return false;

            $aMediaInfo = $this->_oDb->getMediaInfoById($iMediaId);
        }

        if(!$iMediaId || !$aMediaInfo)
            return false;

        $CNF = &$this->_oConfig->CNF;

        return parent::serviceEntityAllActions ([$iMediaId, $aMediaInfo], array_merge([
            'object_menu' => $CNF['OBJECT_MENU_ACTIONS_VIEW_MEDIA'],
            'object_transcoder' => $CNF['OBJECT_IMAGES_TRANSCODER_BIG'],
            'entry_url' => bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=' . $CNF['URI_VIEW_ENTRY'] . '&id=' . $aMediaInfo[$CNF['FIELD_MEDIA_CONTENT_ID']])),
            'entry_title' => $aMediaInfo['title'],
            'entry_thumb' => $aMediaInfo['file_id']
        ], $aParams));
    }
    
    /**
     * @page service Service Calls
     * @section bx_stories Stories
     * @subsection bx_stories-forms Forms
     * @subsubsection bx_stories-entity_add_files entity_add_files
     * 
     * @code bx_srv('bx_stories', 'entity_add_files', [...]); @endcode
     * 
     * Display form for adding media to the story.
     * @param $iContentId story content id where media will be added, if it's not provided then it's determined from 'id' GET variable
     * @return HTML string with form, all necessary CSS and JS files are automatically added to the HEAD section of the site HTML. On error false or empty string is returned.
     * 
     * @see BxStoriesModule::serviceEntityAddFiles
     */
    /** 
     * @ref bx_stories-entity_add_files "entity_add_files"
     */
    public function serviceEntityAddFiles ($iContentId = 0)
    {
        return $this->_serviceEntityForm ('editDataForm', $iContentId, 'bx_stories_entry_add_media');
    }

    /**
     * Delete file and story association, also file views, votes, comments, meta data are also deleted
     * @param $iFileId file ID
     * @return true on success of false on error
     */ 
    public function serviceDeleteFileAssociations($iFileId)
    {        
        if (!($aMediaInfo = $this->_oDb->getMediaInfoSimpleByFileId($iFileId))) // file is already deleted
            return true;

        if ($this->_serviceDeleteFileAssociations($iFileId, $aMediaInfo) === false)
            return false;

        BxDolPage::deleteSeoLink ($this->getName(), 'bx_stories_media', $aMediaInfo['id']);

        return true;
    }

    public function checkAllowedSetThumb ($iContentId = 0)
    {
        return CHECK_ACTION_RESULT_NOT_ALLOWED;
    }

    public function serviceGetTimelineData()
    {
    	return [];
    }

    public function getMediaDuration($aMediaInfo) 
    {
        $CNF = &$this->_oConfig->CNF;

        if(empty($aMediaInfo) || !is_array($aMediaInfo))
            return 0;

        $sField = 'duration';
        if(!empty($aMediaInfo[$sField]))
            return (int)$aMediaInfo[$sField];

        $iMedia = $aMediaInfo['id'];
        $sMedia = BxDolTranscoderImage::getObjectInstance($CNF['OBJECT_VIDEOS_TRANSCODERS']['mp4'])->getFileUrl($iMedia);
        if(empty($sMedia))
            return 0;

        $iDuration = (int)BxDolTranscoderVideo::getDuration($sMedia);
        if(!empty($iDuration))
            $this->_oDb->updateMedia(array($sField => $iDuration), array('id' => $iMedia));

        return $iDuration;
    }
}

/** @} */
