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

class BxMediaConfig extends BxBaseModGeneralConfig
{
    /**
     * Recent files the uploader offers.
     */
    const RECENT_FILES_LIMIT = 30;

    function __construct($aModule)
    {
        parent::__construct($aModule);

        $this->CNF = [];

        $this->_aJsClasses = [
            'media_changer' => 'BxMediaChanger'
        ];
        $this->_aJsObjects = [
            'media_changer' => 'oBxMediaChanger'
        ];
    }

    /**
     * Language keys js/BxMediaEditor.js reads with _t().
     */
    public function getEditorTranslations()
    {
        return [
            '_bx_media_editor_close',
            '_bx_media_editor_reset',
            '_bx_media_editor_undo',
            '_bx_media_editor_redo',
            '_bx_media_editor_done',
            '_bx_media_editor_crop',
            '_bx_media_editor_filter',
            '_bx_media_editor_finetune',
            '_bx_media_editor_resize',
            '_bx_media_editor_rotate_left',
            '_bx_media_editor_flip_horizontal',
            '_bx_media_editor_flip_vertical',
            '_bx_media_editor_straighten',
            '_bx_media_editor_aspect_free',
            '_bx_media_editor_aspect_original',
            '_bx_media_editor_filter_none',
            '_bx_media_editor_filter_mono',
            '_bx_media_editor_filter_noir',
            '_bx_media_editor_filter_sepia',
            '_bx_media_editor_filter_vintage',
            '_bx_media_editor_filter_fade',
            '_bx_media_editor_filter_vivid',
            '_bx_media_editor_filter_warm',
            '_bx_media_editor_filter_cool',
            '_bx_media_editor_brightness',
            '_bx_media_editor_contrast',
            '_bx_media_editor_saturation',
            '_bx_media_editor_warmth',
            '_bx_media_editor_width',
            '_bx_media_editor_height',
            '_bx_media_editor_keep_ratio',
            '_bx_media_editor_resize_note',
            '_bx_media_editor_err_load',
            '_bx_media_editor_err_save',
        ];
    }
}

/** @} */
