<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * Quill editor representation.
 * @see BxDolEditor
 */
class BxBaseEditorQuill extends BxDolEditor
{
    /**
     * Common initialization params
     */
    protected static $CONF_COMMON = "
        window.{bx_var_editor_call_init} = function() {
            var oTextarea = $('{bx_var_selector}');
            if(!oTextarea.length || typeof({bx_var_editor_name}) != 'undefined')
                return;

            {bx_var_editor_name} = bx_editor_init({              
                skin: '{bx_var_skin}',
                name: '{bx_var_editor_name}',
                selector: '{bx_var_selector}',
                css_class: '{bx_var_css_additional_class}',
                toolbar: {toolbar},
                root_url: '{bx_url_root}',
                upload_token: '{bx_var_upload_token}',
                query_params: {bx_var_query_params},
                insert_as_plain_text: {insert_as_plain_text},
                empty_tags: {empty_tags},
                allowed_tags: {allowed_tags}
            });

            oTextarea.addClass('bx-form-input-html').hide();
        };
        window.{bx_var_editor_call_destroy} = function() {
            var oTextarea = $('{bx_var_selector}');
            if(!oTextarea.length || typeof({bx_var_editor_name}) == 'undefined')
                return;

            {bx_var_editor_name} = undefined;

            oTextarea.siblings('.ql-toolbar,.ql-container').remove();
            oTextarea.removeClass('bx-form-input-html').show();
        };";
   
    /**
     * Standard view initialization params
     */
    protected static $CONF_STANDARD = "";

    /**
     * Minimal view initialization params
     */
    protected static $CONF_MINI = "";

    /**
     * Full view initialization params
     */
    protected static $CONF_FULL = "";

    protected $_oTemplate;
    protected $_bJsCssAdded = false;

    public function __construct ($aObject, $oTemplate)
    {
        parent::__construct ($aObject);

        if ($oTemplate)
            $this->_oTemplate = $oTemplate;
        else
            $this->_oTemplate = BxDolTemplate::getInstance();
    }

    /**
     * Attach editor to HTML element, in most cases - textarea.
     * @param $sSelector - jQuery selector to attach editor to.
     * @param $iViewMode - editor view mode: BX_EDITOR_STANDARD, BX_EDITOR_MINI, BX_EDITOR_FULL
     * @param $bDynamicMode - is AJAX mode or not, the HTML with editor area is loaded dynamically.
     */
    public function attachEditor ($sSelector, $iViewMode = BX_EDITOR_STANDARD, $bDynamicMode = false, $aAttrs = [])
    {
        // set visual mode
        $sAllowedTags = '';
        $sToolbarItems = '';
        switch ($iViewMode) {
            case BX_EDITOR_MINI:
                $sToolbarItems = getParam('sys_quill_toolbar_mini');
                $sAllowedTags = getParam('sys_quill_allowed_tags_mini');
                $sCustomInit = self::$CONF_MINI;
                break;

            case BX_EDITOR_FULL:
                $sToolbarItems = getParam('sys_quill_toolbar_full');
                $sAllowedTags = getParam('sys_quill_allowed_tags_full');
                $sCustomInit = self::$CONF_FULL;
                break;

            case BX_EDITOR_STANDARD:
            default:
                $sToolbarItems = getParam('sys_quill_toolbar_standard');
                $sAllowedTags = getParam('sys_quill_allowed_tags_standard');
                $sCustomInit = self::$CONF_STANDARD;
        }

        if($this->_sButtonsCustom !== false)
            $sToolbarItems = $this->_sButtonsCustom;

        $sEditorName = 'quill_' . str_replace(['-', ' '], '_', $aAttrs['form_id'] . '_' . $aAttrs['element_name'] . '_' . $aAttrs['uniq']);
        $sEditorCallInit = $sEditorName . '_init';
        $sEditorCallDestroy = $sEditorName . '_destroy';

        // initialize editor
        $sInitEditor = $this->_replaceMarkers(self::$CONF_COMMON, [
            'bx_var_custom_init' => $sCustomInit,
            'bx_var_selector' => bx_js_string($sSelector. '.' . $aAttrs['uniq'], BX_ESCAPE_STR_APOS),
            'bx_var_query_params' => isset($aAttrs['query_params']) ? json_encode($aAttrs['query_params']) : "''",
            'bx_var_form_id' => $aAttrs['form_id'],
            'toolbar' => $sToolbarItems ? '[' . $sToolbarItems . ']' : 'false',
            'insert_as_plain_text' => getParam('sys_quill_insert_as_plain_text') == 'on' ? 'true' : 'false',
            'empty_tags' => getParam('sys_quill_allow_empty_tags') == 'on' ? 'true' : 'false',
            'allowed_tags' => $sAllowedTags == '' ? 'false' : $sAllowedTags,
            'bx_var_css_additional_class' => $sToolbarItems ? '' : 'bx-form-input-html-quill-empty',
            'bx_var_element_name' => str_replace(['-', ' '], '_', $aAttrs['element_name']),
            'bx_var_editor_name' => $sEditorName,
            'bx_var_editor_call_init' => $sEditorCallInit,
            'bx_var_editor_call_destroy' => $sEditorCallDestroy,
            'bx_var_skin' => bx_js_string($this->_aObject['skin'], BX_ESCAPE_STR_APOS),
            'bx_url_root' => bx_js_string(BX_DOL_URL_ROOT, BX_ESCAPE_STR_APOS)
            , 'bx_var_upload_token' => BxDolUploader::isUploadTokenEnabled() ? bx_js_string(BxDolUploader::getUploadToken('upload', 'sys_images_editor'), BX_ESCAPE_STR_APOS) : ''
        ]);

        $sScript = "var " . $sEditorName . " = undefined; ";
        if($bDynamicMode) {
            list($aJs, $aJsTranslations, $aCss) = $this->_getJsCss(true);

            $sInitAndCall = $sInitEditor . $sEditorCallInit . '();';
            $sScript .= $this->_oTemplate->addJsPreloaded($aJs, $sInitAndCall, "typeof(Quill) === 'undefined'", $sInitAndCall);
            $sScript = $this->_oTemplate->_wrapInTagJsCode($sScript);

            $sScript = $this->_oTemplate->addJsTranslation($aJsTranslations, true) . $sScript;
            $sScript = $this->_oTemplate->addCss($aCss, true) . $sScript;
        }
        else {
            $sScript .= $sInitEditor . $this->_oTemplate->addJsCodeOnLoad($sEditorCallInit . '()');
            $sScript = $this->_oTemplate->_wrapInTagJsCode($sScript);
        }

        return $this->_addJsCss($bDynamicMode) . $sScript;
    }

    public function getEditorInfo ($sSelector, $iViewMode = BX_EDITOR_STANDARD, $bDynamicMode = false, $aAttrs = [])
    {
        $sEditorName = 'quill_' . str_replace(['-', ' '], '_', $aAttrs['form_id'] . '_' . $aAttrs['element_name'] . '_' . $aAttrs['uniq']);

        return [
            'name' => $sEditorName,
            'selector' => $sSelector. '.' . $aAttrs['uniq'],
            'js_call_init' => $sEditorName . '_init()',
            'js_call_destroy' => $sEditorName . '_destroy()'
        ];
    }

    /**
     * Add css/js files which are needed for editor display and functionality.
     */
    protected function _addJsCss($bDynamicMode = false, $sInitEditor = '')
    {
        if($bDynamicMode || $this->_bJsCssAdded)
            return '';

        list($aJs, $aJsTranslations, $aCss) = $this->_getJsCss();

        $this->_oTemplate->addJs($aJs);
        $this->_oTemplate->addJsTranslation($aJsTranslations);
        $this->_oTemplate->addCss($aCss);

        $this->_bJsCssAdded = true;

        return '';
    }
    
    protected function _getJsCss($bUseUrlsForJs = false)
    {
        $sJsPrefix = $bUseUrlsForJs ? BX_DOL_URL_PLUGINS_PUBLIC : BX_DIRECTORY_PATH_PLUGINS_PUBLIC;
        $sJsPrefixRoot = $bUseUrlsForJs ? BX_DOL_URL_ROOT .'inc/js/' : BX_DIRECTORY_PATH_INC . 'js/';
        $sJsSuffix = $bUseUrlsForJs ? '' : '|';
        
        $aJs = [
            $sJsPrefix . 'highlight/' . $sJsSuffix . 'highlight.min.js',
            $sJsPrefix . 'quill/' . $sJsSuffix . 'quill.min.js', 
            $sJsPrefix . 'quill/' . $sJsSuffix . 'quill.mention.min.js',
            $sJsPrefix . 'quill/' . $sJsSuffix . 'quill.imageUploader.min.js', 
            $sJsPrefix . 'quill/' . $sJsSuffix . 'image-resize.min.js', 
            $sJsPrefix . 'quill/' . $sJsSuffix . 'quill-emoji.js', 
            $sJsPrefixRoot  . $sJsSuffix . 'editor.quill.js'
        ];
        
        $aJsTranslations = [
            '_sys_txt_quill_tooltip_bold',
            '_sys_txt_quill_tooltip_italic',
            '_sys_txt_quill_tooltip_underline',
            '_sys_txt_quill_tooltip_clean',
            '_sys_txt_quill_tooltip_list_ordered',
            '_sys_txt_quill_tooltip_list_bullet',
            '_sys_txt_quill_tooltip_indent_1',
            '_sys_txt_quill_tooltip_indent_2',
            '_sys_txt_quill_tooltip_blockquote',
            '_sys_txt_quill_tooltip_direction',
            '_sys_txt_quill_tooltip_script_sub',
            '_sys_txt_quill_tooltip_script_super',
            '_sys_txt_quill_tooltip_link',
            '_sys_txt_quill_tooltip_image',
            '_sys_txt_quill_tooltip_code_block',
            '_sys_txt_quill_tooltip_color',
            '_sys_txt_quill_tooltip_background',
            '_sys_txt_quill_tooltip_align',
            '_sys_txt_quill_tooltip_header',
            '_sys_txt_quill_tooltip_embed',
            '_sys_txt_quill_tooltip_embed_popup_header',
            '_sys_txt_quill_tooltip_link_popup_header',
        ];

        $sCss = 'editor.less';
        $aCss = BxDolTemplate::getInstance()->_lessCss([
            'path' => $this->_oTemplate->getCssPath($sCss),
            'url' => $this->_oTemplate->getCssUrl($sCss)
        ]);

        $aCss = array_merge($aCss, [
            BX_DIRECTORY_PATH_BASE . 'css/|editor_snow.quill.css',  
            BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'quill/|quill.mention.css', 
            BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'quill/|quill-emoji.css', 
            BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'highlight/|default.min.css',
            BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'quill/quill.imageUploader.min.css',
            BX_DIRECTORY_PATH_BASE . 'css/|editor.quill.css',
        ]);

        return [$aJs, $aJsTranslations, $aCss];
    }
}

/** @} */
