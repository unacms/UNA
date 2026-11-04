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

/**
 * Editor representation.
 * @see BxDolEditor
 */
class BxEditorEditor extends BxDolEditor
{
    protected $_sModule;
    protected $_oModule;
    protected $_aButtons;

    /**
     * Common initialization params
     */
    protected static $CONF_COMMON = "
        var oParams = {   
			root_url: '{bx_url_root}',
            upload_token: '{bx_var_upload_token}',
            name: '{bx_var_editor_name}',
            selector: '{bx_var_selector}',
			toolbar: {toolbar},
			toolbar_inline: {toolbar_inline},
        }
        {bx_var_editor_name} = bx_ex_editor_init({bx_var_editor_name}, oParams);";

    protected $_oTemplate;
    protected $_bJsCssAdded = false;

    public function __construct ($aObject, $oTemplate)
    {
        parent::__construct ($aObject);

        if ($oTemplate)
            $this->_oTemplate = $oTemplate;
        else
            $this->_oTemplate = BxDolTemplate::getInstance();
        
        $this->_sModule = 'bx_editor';
        $this->_oModule = BxDolModule::getInstance($this->_sModule);
        
        $this->_aButtons = $this->_oModule->_aButtons;
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
        switch ($iViewMode) {
                
            case BX_EDITOR_MINI:
                $sToolbarItems = $this->_oModule->_oDb->getSettings('mini', 1);
                $sToolbarItemsInline = $this->_oModule->_oDb->getSettings('mini', 0);
                break;
                
            case BX_EDITOR_FULL:
                $sToolbarItems = $this->_oModule->_oDb->getSettings('full', 1);
                $sToolbarItemsInline = $this->_oModule->_oDb->getSettings('full', 0);
            break;
                
            case BX_EDITOR_STANDARD:
            default:
                $sToolbarItems = $this->_oModule->_oDb->getSettings('standard', 1);
                $sToolbarItemsInline = $this->_oModule->_oDb->getSettings('standard', 0);
        }
        
        if ($this->_sButtonsCustom !== false) {
            $sToolbarItems = $this->_sButtonsCustom;
        }
        if ($sToolbarItems != '')
            $sToolbarItems = "'" . str_replace(',', "','", $sToolbarItems) . "'";
        
        if ($sToolbarItemsInline != '')
            $sToolbarItemsInline = "'" . str_replace(',', "','", $sToolbarItemsInline) . "'";
        
        $sEditorName = 'editor_' . str_replace(['-', ' '], '_', $aAttrs['form_id'] . '_' . $aAttrs['element_name']);
        
        $this->_oTemplate->addJsTranslation([
            '_bx_editor_embed_popup_header',
        ]);
        
        // initialize editor
        $sInitEditor = $this->_replaceMarkers(self::$CONF_COMMON, array(
            'bx_var_selector' => bx_js_string($sSelector, BX_ESCAPE_STR_APOS),
            'bx_var_query_params' => isset($aAttrs['query_params']) ? json_encode($aAttrs['query_params']) : "''",
            'bx_var_form_id' => $aAttrs['form_id'],
            'toolbar' => $sToolbarItems ? '[' . $sToolbarItems . ']' : 'false',
            'toolbar_inline' => $sToolbarItemsInline ? '[' . $sToolbarItemsInline . ']' : 'false',
            'bx_var_css_additional_class' => $sToolbarItems ? '' : 'bx-form-input-html-editor-empty',
            'bx_var_element_name' => str_replace(['-', ' '], '_', $aAttrs['element_name']),
            'bx_var_editor_name' => $sEditorName,
            'bx_url_root' => bx_js_string(BX_DOL_URL_ROOT, BX_ESCAPE_STR_APOS),
            'bx_var_upload_token' => BxDolUploader::isUploadTokenEnabled() ? bx_js_string(BxDolUploader::getUploadToken('upload', 'sys_images_editor'), BX_ESCAPE_STR_APOS) : '',
        ));

        $sInitCallBack = "
            bEditorInited = true;
        " . $sInitEditor;

        if ($bDynamicMode) {
            list($aJs, $aCss) = $this->_getJsCss(true);

            $sScript = "var " . $sEditorName . "; " . $this->_oTemplate->addJsPreloaded($aJs, $sInitCallBack, "typeof bEditorInited === 'undefined'", $sInitEditor);
            $sScript = $this->_oTemplate->_wrapInTagJsCode($sScript);
            $sScript = $this->_oTemplate->addCss($aCss, true) . $sScript;

        } else {
            $sScript = "var " . $sEditorName . "; " . $this->_oTemplate->addJsCodeOnLoad($sInitCallBack);
            $sScript = $this->_oTemplate->_wrapInTagJsCode($sScript);
        }

        return $this->_addJsCss($bDynamicMode) . $sScript;
    }
    

    /**
     * Add css/js files which are needed for editor display and functionality.
     */
    protected function _addJsCss($bDynamicMode = false, $sInitEditor = '')
    {
        if ($bDynamicMode)
            return '';
        
        if ($this->_bJsCssAdded)
            return '';
        
        list($aJs, $aCss) = $this->_getJsCss();
		
        $this->_oTemplate->addJs($aJs);
        
        $this->_oTemplate->addCss($aCss);
        
        $this->_bJsCssAdded = true;
        
        return '';
    }
    
    protected function _getJsCss($bUseUrlsForJs = false)
    {
		$sJsPrefix = $bUseUrlsForJs ? BX_DOL_URL_MODULES : BX_DIRECTORY_PATH_MODULES;
        
        $sJsPrefixPlugins = $bUseUrlsForJs ? BX_DOL_URL_PLUGINS : BX_DIRECTORY_PATH_PLUGINS_PUBLIC;
        
		$sJsSuffix = $bUseUrlsForJs ? '' : '|';
		
		$aCss = [
			 BX_DIRECTORY_PATH_MODULES . 'boonex/editor/template/css/|main.css',  
             BX_DIRECTORY_PATH_MODULES . 'boonex/editor/plugins/tribute/|tribute.css',  
		];
        
		$aJs = [
            $sJsPrefix . 'boonex/editor/plugins/editorjs/' . $sJsSuffix . 'editor.js',
            $sJsPrefix . 'boonex/editor/plugins/editorjs/' . $sJsSuffix . 'header.js',
            $sJsPrefix . 'boonex/editor/plugins/editorjs/' . $sJsSuffix . 'paragraph.js',
            $sJsPrefix . 'boonex/editor/plugins/editorjs/' . $sJsSuffix . 'edjsHTML.js',
            $sJsPrefix . 'boonex/editor/plugins/editorjs/' . $sJsSuffix . 'list.js',
            $sJsPrefix . 'boonex/editor/plugins/editorjs/' . $sJsSuffix . 'delimiter.js',
            $sJsPrefix . 'boonex/editor/plugins/editorjs/' . $sJsSuffix . 'code.js',
            $sJsPrefix . 'boonex/editor/plugins/editorjs/' . $sJsSuffix . 'inline-code.js',
            $sJsPrefix . 'boonex/editor/plugins/editorjs/' . $sJsSuffix . 'image.js',
            $sJsPrefix . 'boonex/editor/plugins/editorjs/' . $sJsSuffix . 'marker.js',
            
            $sJsPrefix . 'boonex/editor/plugins/tribute/' . $sJsSuffix . 'tribute.min.js',
          
            /*$sJsPrefix . 'boonex/editor/js/' . $sJsSuffix . 'embed-inline.js',
            $sJsPrefix . 'boonex/editor/js/' . $sJsSuffix . 'embed-block.js',
            $sJsPrefix . 'boonex/editor/js/' . $sJsSuffix . 'mention.js',*/
            $sJsPrefix . 'boonex/editor/js/' . $sJsSuffix . 'editor.js',
        ];

        return array($aJs, $aCss);
    }
}

/** @} */
