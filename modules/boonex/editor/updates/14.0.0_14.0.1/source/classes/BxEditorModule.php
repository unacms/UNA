<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Editor integration
 * @ingroup     UnaModules
 *
 * @{
 */

class BxEditorModule extends BxDolModule
{
    public $_aButtons = [];
    
	function __construct(&$aModule)
    {
        parent::__construct($aModule);
        
        $this->_aButtons = [
			'bold' => ['icon' => 'bold', 'text' => _t('_bx_editor_toolbar_action_bold')],
			'italic' => ['icon' => 'italic', 'text' => _t('_bx_editor_toolbar_action_italic')],
			'link' => ['icon' => 'link', 'text' => _t('_bx_editor_toolbar_action_link')],
			'marker' => ['icon' => 'marker', 'text' => _t('_bx_editor_toolbar_action_marker')],
			'inlineCode' => ['icon' => 'inlineCode', 'text' => _t('_bx_editor_toolbar_action_inlineCode')],
			'header' => ['icon' => 'header', 'text' => _t('_bx_editor_toolbar_action_header')],
			'list' => ['icon' => 'list-ul', 'text' => _t('_bx_editor_toolbar_action_list')],
			'code' => ['icon' => 'code', 'text' => _t('_bx_editor_toolbar_action_code')],
            'delimiter' => ['icon' => 'delimiter', 'text' => _t('_bx_editor_toolbar_action_delimiter')],
			'link' => ['icon' => 'link', 'text' => _t('_bx_editor_toolbar_action_link')],
			'image' => ['icon' => 'image', 'text' => _t('_bx_editor_toolbar_action_image')],
			'embed' => ['icon' => 'share-alt', 'text' => _t('_bx_editor_toolbar_action_embed')],
		];
    }

    public function actionUpload()
    {
        header('Content-Type: application/json; charset=utf-8');

        if (!($oStorage = BxDolStorage::getObjectInstance('bx_editor_files'))) {
            echo json_encode(array('error' => '1'));
            exit;
        }

        $iProfileId = bx_get_logged_profile_id();

        if (!($iId = $oStorage->storeFileFromForm($_FILES['file'], false, $iProfileId))) {
            echo json_encode(array('error' => '1'));
            exit;
        }

        $oStorage->afterUploadCleanup($iId, $iProfileId);

        $aFileInfo = $oStorage->getFile($iId);
        if ($aFileInfo && in_array($aFileInfo['ext'], array('jpg', 'jpeg', 'jpe', 'png'))) {
            $oTranscoder = BxDolTranscoderImage::getObjectInstance('bx_editor_image');
            $sUrl = $oTranscoder->getFileUrl($iId);
        }
        else {
            $sUrl = $oStorage->getFileUrlById($iId);
        }

        echo json_encode(array('link' => $sUrl));
    }
}

/** @} */
