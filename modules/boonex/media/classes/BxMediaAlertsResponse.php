<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    MediaManager MediaManager
 * @ingroup     UnaModules
 *
 * @{
 */

class BxMediaAlertsResponse extends BxDolAlertsResponse
{
    protected $_sModule;
    protected $_oModule;

    public function __construct()
    {
        parent::__construct();
		$this->_sModule = 'bx_media';
        $this->_oModule = BxDolModule::getInstance($this->_sModule);
    }
	
	public function response($oAlert)
    {
		$sMethod = '_process' . bx_gen_method_name($oAlert->sUnit . '_' . $oAlert->sAction); 
        if(!method_exists($this, $sMethod)){
			return;
		}
		
        $this->$sMethod($oAlert);
    }
	
	protected function _processSystemImageEditor($oAlert)
	{
		if ($oAlert->aExtras['is_allow_edit']){
			
			if (getParam('bx_media_profile_cover_enabled') != 'on' && $oAlert->aExtras['image_type'] == 'cover')
				return ;
			
			if (getParam('bx_media_profile_picture_enabled') != 'on' && $oAlert->aExtras['image_type'] == 'avatar')
				return ;
			
			if (getParam('bx_media_text_header_image_enabled') != 'on' && $oAlert->aExtras['image_type'] == 'header_image')
				return ;
			
			$sUniq = genRndPwd (8, false);
			$sSelector = 'bx-media-editable-' .$oAlert->aExtras['module'] . '-' . $oAlert->aExtras['field'] . '-' . $oAlert->aExtras['content_id']; 
			$oAlert->aExtras['add_class'] = 'bx-media-editable ' . $sSelector;
			$oAlert->aExtras['add_code'] .= $this->_oModule->_oTemplate->getJsCode('media_changer', $sUniq, [
				'sModule' => $oAlert->aExtras['module'],
				'iContentId' => $oAlert->aExtras['content_id'],
				'sUploader' => $oAlert->aExtras['uploader'],
				'sStorage' => $oAlert->aExtras['storage'],
				'sTranscoder' => $oAlert->aExtras['transcoder'],
				'sFieldName' => $oAlert->aExtras['field'],
				'sSelector' => $sSelector,
				'bIsBackground' => $oAlert->aExtras['is_background'],
				'sImageUrl' => $oAlert->aExtras['image_url'],
				'sImageType' => $oAlert->aExtras['image_type'],
				'sUniqId' => $sUniq,
				'sButtons' => $this->_oModule->_oTemplate->parseHtmlByName('media_changer_buttons.html', []),
				'sUploadToken' => BxDolUploader::isUploadTokenEnabled() ? BxDolUploader::getUploadToken('upload', $oAlert->aExtras['storage'], $oAlert->aExtras['uploader']) : '',
				'aCaptions' => [
                    'upload' => _t('_bx_media_btn_upload'), 
                    'edit' => _t('_bx_media_btn_edit'), 
                    'tweak' =>  _t('_bx_media_btn_tweak'), 
                    'please_wait' =>  _t('_bx_media_txt_please_wait'),
                    'allowed_files' =>  _t('_bx_media_txt_allowed_files')
                ]
			]);
		}
	}	
}

/** @} */
