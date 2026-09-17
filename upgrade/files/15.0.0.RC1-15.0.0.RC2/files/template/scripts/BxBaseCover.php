<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * Cover representation.
 * @see BxDolCover
 */
class BxBaseCover extends BxDolCover
{
    protected $_bJsCssAdded = false;

    protected $_oTemplate;

    public function __construct ($oTemplate)
    {
        parent::__construct ();

        if ($oTemplate)
            $this->_oTemplate = $oTemplate;
        else
            $this->_oTemplate = BxDolTemplate::getInstance();
    }

    /**
     * Display Cover.
     */
    public function display ()
    {
        $this->_addJsCss();

        $sResult = null;
        $aParams = [];
        if(!empty($this->_aOptions) && is_array($this->_aOptions)){
            $aParams = array_merge($this->_aOptiondDefault, $this->_aOptions);
        }
        else{
            $oPage = BxDolPage::getObjectInstanceByURI();
            if(empty($oPage) || !is_a($oPage, 'BxDolPage'))
                return $this->displayEmpty();

            $mixedOptions = $oPage->getPageCoverParams();
            if(empty($mixedOptions) || !is_array($mixedOptions))
                return $this->displayEmpty();

            if(!$this->_sCoverImageUrl) {
                $iId = (int)getParam('sys_site_cover_common');
                if($iId != 0)
                    $this->setCoverImageUrl(array('id' => $iId, 'transcoder' => BX_DOL_TRANSCODER_OBJ_COVER));
            }

            if($this->_sCoverImageUrl)
                $mixedOptions['bx_if:bg'] = array (
                    'condition' => true,
                    'content' => array('image_url' => $this->_sCoverImageUrl),
                );

            $mixedOptions['bx_if:empty_cover_class'] = array (
                'condition' => empty($this->_sCoverImageUrl),
                'content' => array(),
            );
        
            $aParams = array_merge($this->_aOptiondDefault, $mixedOptions);
        }

        //--- The cover title is the page's <h1>. Content view pages deliberately leave it empty and
        //--- headline the content instead, so the heading element is only emitted when there is a title.
        $aParams['bx_if:title'] = array (
            'condition' => !empty($aParams['title']),
            'content' => array('title' => isset($aParams['title']) ? $aParams['title'] : ''),
        );

        /**
         * @hooks
         * @hookdef hook-system-display_cover 'system', 'display_cover' - hook to override page cover code to be output
         * - $unit_name - equals `system`
         * - $action - equals `display_cover`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `res` - [string] by ref, when null the default generation mechanism will be used, can be overridden in hook processing
         *      - `template_name` - [string] by ref, template name, can be overridden in hook processing
         *      - `params` - [array] by ref, additional params array as key&value pairs, can be overridden in hook processing
         * @hook @ref hook-system-display_cover
         */
        bx_alert('system', 'display_cover', 0, 0, [
            'res' => &$sResult, 

            'template_name' => &$this->_sTemplateName, 
            'params' => &$aParams, 

            'template_name_ref' => &$this->_sTemplateName, 
            'params_ref' => &$aParams, 
        ]);

        if ($sResult  != null)
            return $sResult;
        
        return $this->_oTemplate->parseHtmlByName($this->_sTemplateName, $aParams); 
    }
    
    /**
     * Display Empty Cover.
     */
    public function displayEmpty ()
    {
        $sTitle = $this->_oTemplate->getPageHeader();

        return $this->_oTemplate->parseHtmlByName($this->_sTemplateNameEmpty, array(
            'bx_if:title' => array(
                'condition' => !empty($sTitle),
                'content' => array('title' => bx_process_output(strip_tags($sTitle))),
            ),
        ));
    }

    /**
     * Add css/js files which are needed for display and functionality.
     */
    protected function _addJsCss()
    {
        if ($this->_bJsCssAdded)
            return;

        $this->_oTemplate->addCss(array('cover.css'));
        $this->_bJsCssAdded = true;
    }
}

/** @} */
