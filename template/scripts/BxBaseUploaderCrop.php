<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * Upload files using crop interface
 * @see BxDolUploader
 */
class BxBaseUploaderCrop extends BxDolUploader
{
    const PREVIEW_CIRCLE = 'circle';
    const PREVIEW_COVER = 'cover';

    /**
     * How a single picture field shows its picture in place of the button: a round avatar (picture, badge)
     * or a wide cover. A multiple uploader (albums, stories) keeps the button.
     */
    protected $_sPreviewShape = self::PREVIEW_CIRCLE;
    protected $_sPreviewTemplate = 'uploader_crop_preview.html';

    public function __construct ($aObject, $sStorageObject, $sUniqId, $oTemplate)
    {
        parent::__construct($aObject, $sStorageObject, $sUniqId, $oTemplate);

        $this->_sButtonTemplate = 'uploader_button_crop.html';
        $this->_sJsTemplate = 'uploader_button_crop_js.html';
        $this->_sUploaderFormTemplate = 'uploader_form_crop.html';

        $this->addJs([
            'croppie/croppie.min.js'
        ]);

        $this->addCss([
            BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'croppie/|croppie.css'
        ]);
    }

    /**
     * Get uploader button title
     */
    public function getUploaderButtonTitle($mixed = false)
    {
        if (is_string($mixed))
            return $mixed;
        elseif (is_array($mixed) && isset($mixed['Crop']))
            return $mixed['Crop'];
        else
            return _t('_sys_uploader_crop_button_name');
    }

    /**
     * A single picture field shows the picture itself: a round area (or a wide one for a cover) which opens the
     * file picker, and once a picture is set, the picture with an edit button offering "Change picture" and "Remove".
     * The cropper opens only after a file is chosen. The ghost list below stays in the form (it holds the file id
     * the form submits) but is not shown: the preview takes its place.
     */
    public function getUploaderButton($aParams = array())
    {
        if(!$this->isPreview())
            return parent::getUploaderButton($aParams);

        $sJsObject = $this->getNameJsInstanceUploader();
        $sPreviewId = $this->getIdPreview();
        $sMenuId = $sPreviewId . '-menu';
        $bDisabled = !empty($aParams['btn_class']) && strpos($aParams['btn_class'], 'bx-btn-disabled') !== false;
        $bCover = $this->_sPreviewShape == self::PREVIEW_COVER;
        $sPlaceholder = $aParams['placeholder_image'] ?? '';

        $oMenu = new BxTemplMenu([
            'template' => 'menu_vertical.html',
            'menu_id' => $sMenuId . '-items',
            'menu_items' => [[
                'id' => $sMenuId . '-change',
                'name' => 'change',
                'class' => '',
                'link' => 'javascript:void(0)',
                'onclick' => $sJsObject . '.choosePicture();',
                'target' => '',
                'icon' => 'pencil-line',
                'title' => _t('_sys_uploader_crop_change_picture'),
            ], [
                'id' => $sMenuId . '-remove',
                'name' => 'remove',
                'class' => '',
                'link' => 'javascript:void(0)',
                'onclick' => $sJsObject . '.removePicture();',
                'target' => '',
                'icon' => 'trash',
                'title' => _t('_sys_uploader_crop_remove_picture'),
            ]]
        ], $this->_oTemplate);

        return $this->_oTemplate->parseHtmlByName($this->_sPreviewTemplate, [
            'preview_id' => $sPreviewId,
            'menu_id' => $sMenuId,
            'uploader_instance_name' => $sJsObject,
            'shape' => $this->_sPreviewShape,
            'frame_class' => $bCover ? 'w-full max-w-xl aspect-[3/1] rounded-xl' : 'w-32 h-32 rounded-full',
            'edit_class' => $bCover ? 'bottom-2 right-2' : 'bottom-0 right-0',
            'disabled' => $bDisabled ? 'disabled="disabled"' : '',
            'title_choose' => bx_html_attribute(_t($bCover ? '_sys_uploader_crop_choose_cover' : '_sys_uploader_crop_choose_picture')),
            'title_edit' => bx_html_attribute(_t($bCover ? '_sys_uploader_crop_edit_cover' : '_sys_uploader_crop_edit_picture')),
            'bx_if:placeholder_image' => [
                'condition' => (bool)$sPlaceholder,
                'content' => ['src' => bx_html_attribute($sPlaceholder)],
            ],
            // a picture to show in place of none (a letter avatar) gets a camera badge where the edit button of a set picture is
            'bx_if:placeholder_icon' => [
                'condition' => !$sPlaceholder,
                'content' => [],
            ],
            'bx_if:placeholder_badge' => [
                'condition' => (bool)$sPlaceholder,
                'content' => ['edit_class' => $bCover ? 'bottom-2 right-2' : 'bottom-0 right-0'],
            ],
            'menu' => BxTemplFunctions::getInstance()->transBox($sMenuId, $oMenu->getCode(), true),
        ]);
    }

    /**
     * Classes for the ghosts' container under the button: hidden when the preview shows the picture.
     */
    public function getResultContainerClass()
    {
        return $this->isPreview() ? '!hidden' : '';
    }

    /**
     * Whether the field shows the picture (a single picture field) or the button (a multiple one, or no preview template).
     */
    public function isPreview()
    {
        return !$this->isMultiple() && !empty($this->_sPreviewTemplate);
    }

    public function getIdPreview()
    {
        return 'bx-form-input-files-' . $this->_sUniqId . '-preview-' . $this->_aObject['object'];
    }

    /**
     * add necessary js, css files and js translations
     */ 
    public function addCssJs($bDynamic = false)
    {
        $s = parent::addCssJs($bDynamic);
        $s .= $this->_oTemplate->addJsTranslation([
            '_sys_uploader_crop_err_upload', 
            '_sys_uploader_crop_wrong_ext'
        ], $bDynamic);
        return $bDynamic ? $s : '';
    }
    
    /**
     * Show uploader form.
     * @return HTML string
     */
    public function getUploaderForm($isMultiple = true, $iContentId = false, $isPrivate = true)
    {
    	$oForm = new BxTemplFormView(array());
    	$aFormInput = array('type' => 'file', 'name' => 'f');

        // a titled popup with the standard close button; the picture is chosen before it opens (BxDolUploaderCrop.showUploaderForm)
        return BxTemplFunctions::getInstanceWithTemplate($this->_oTemplate)->popupBox($this->_sPopupContainerId, _t('_sys_uploader_crop_popup_title'), $this->_oTemplate->parseHtmlByName($this->_sUploaderFormTemplate, array(
            'form_container_id' => $this->_sFormContainerId,
        	'file_field' => $oForm->genRow($aFormInput),
            'errors_container_id' => $this->_sErrorsContainerId,
            'uploader_instance_name' => $this->getNameJsInstanceUploader(),
            'restrictions_text' => $this->getRestrictionsText(),
            'engine' => $this->_aObject['object'],
            'storage_object' => $this->_sStorageObject,
            'uniq_id' => $this->_sUniqId,
            'multiple' => $isMultiple,
            'content_id' => $iContentId,
            'storage_private' => $isPrivate,
            // a round picture is cropped in a round frame, so the member sees what the avatar will show
            'viewport_type' => !$isMultiple && !empty($this->_sPreviewTemplate) && $this->_sPreviewShape == self::PREVIEW_CIRCLE ? 'circle' : 'square',
        )));
    }

    public function handleUploads ($iProfileId, $mixedFiles, $isMultiple = true, $iContentId = false, $bPrivate = true)
    {       
        if($this->_bIsApi)
            return parent::handleUploads ($iProfileId, $mixedFiles, $isMultiple, $iContentId, $bPrivate);

        ob_start();
        parent::handleUploads ($iProfileId, $mixedFiles, $isMultiple, $iContentId, $bPrivate);
        $s = ob_get_clean();
        echo strip_tags(str_replace('window.parent.', 'window.', $s));
    }

}

/** @} */
