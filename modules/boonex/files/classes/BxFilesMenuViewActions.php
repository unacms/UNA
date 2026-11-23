<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Files Files
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * View entry social actions menu
 */
class BxFilesMenuViewActions extends BxBaseModTextMenuViewActions
{
    public function __construct($aObject, $oTemplate = false)
    {
        $this->_sModule = 'bx_files';

        parent::__construct($aObject, $oTemplate);
    }

    protected function _getMenuItemDownloadFile($aItem)
    {
        return $this->_getMenuItemByNameActions($aItem);
    }

    protected function _getMenuItemEditFile($aItem)
    {
        return $this->_getMenuItemByNameActions($aItem);
    }

    protected function _getMenuItemDeleteFile($aItem)
    {
        return $this->_getMenuItemByNameActions($aItem);
    }
}

class BxFilesMenuViewActionsInline extends BxFilesMenuViewActions {
    protected $_oMenuAction;
    protected $_iMenuItemCounter;
    protected $_sJsObjectMenuTools;
    protected $_sBookmarkIcon;
    protected $_bAllowEditOptions;

    public function __construct($aObject, $oTemplate = false)
    {
        parent::__construct($aObject, $oTemplate);

        $this->_bShowTitle = false;
        $this->_iMenuItemCounter = 0;

        $this->_iMoreAutoItemsStatic = 2;
        $this->_bMoreAutoItemsStaticOnly = 1;

        $this->_sJsObjectMenuTools = 'oMenuTools' . bx_gen_method_name($this->_sObject);

        $this->addMarkers([
            'js_object' => $this->_sJsObjectMenuTools,
        ]);

        $this->_sBookmarkIcon = 'far star';
    }

    public function setContentId($iContentId)
    {
        $iRandNumber = mt_rand();

        $this->_iContentId = $iContentId;
        $this->_sJsObjectMoreAuto = 'oMenuMoreAuto' . bx_gen_method_name($this->_sObject) . $this->_iContentId . $iRandNumber;

        $sPrefix = str_replace('_', '-', $this->_sObject);
        $this->_aHtmlIds = [
            'main' => $sPrefix . $this->_iContentId . $iRandNumber,
            'more_auto_popup' => $sPrefix . '-ma-popup' . $this->_iContentId . $iRandNumber,
        ];

        //erase cached data to force it to generate it again since this is going to be a menu for a new entry
        $this->_oMenuAction = false;
        $this->_oMenuActions = false;
        $this->_oMenuActionsMore = false;
        $this->_oMenuSocialSharing = false;
        $this->_bMoreAuto = null;
        unset($this->_aObject['menu_items']);

        parent::setContentId($iContentId);
    }

    public function setBookmarked($bBookmarked) {
        $this->_sBookmarkIcon = $bBookmarked ? 'fas star' : 'far star';
    }

    public function setAllowEditOptions($bAllow) {
        $this->_bAllowEditOptions = $bAllow;
    }

    protected function _getMenuItem ($aItem) {
        //first two items suppose to appear in a row without a title, the rest must go to more-auto along with a title
        $this->_bShowTitle = $this->_iMenuItemCounter > $this->_iMoreAutoItemsStatic;

        if ($aItem['name'] == 'bookmark')
            $aItem['icon'] = $this->_sBookmarkIcon;

        $bRes = parent::_getMenuItem ($aItem);

        if ($bRes) $this->_iMenuItemCounter++;
        return $bRes;
    }

    public function _getMenuItemBookmark($aItem) {
        if (!isLogged()) return false;
        return true;
    }

    public function _getMenuItemDeleteFileQuick($aItem) {
        if (!$this->_bAllowEditOptions) return false;
        return true;
    }

    public function _getMenuItemMoveTo($aItem) {
        if (!$this->_bAllowEditOptions) return false;
        return true;
    }

    public function _getMenuItemEditTitle($aItem) {
        if (!$this->_bAllowEditOptions) return false;
        return true;
    }

    public function getMenuItems () {
        //reset the counter here because at the very first call the getMenuItems calls twice (the first is in BxBaseMenuMoreAuto::_isMoreAuto
        $this->_iMenuItemCounter = 1;
        return parent::getMenuItems();
    }

    protected function _getJsCodeMoreAuto()
    {
        $sJsObject = $this->_getJsObjectMoreAuto();
        $aJsParams = array(
            'sObject' => $this->_sObject,
            'iItemsStatic' => $this->_iMoreAutoItemsStatic,
            'bItemsStaticOnly' => $this->_bMoreAutoItemsStaticOnly ? 1 : 0,
            'aHtmlIds' => $this->_getHtmlIds()
        );

        return $this->_oTemplate->_wrapInTagJsCode("if(!" . $sJsObject . ") {var " . $sJsObject . " = new BxDolMenuMoreAuto(" . json_encode($aJsParams) . "); " . $sJsObject . ".init();} else {" . $sJsObject . ".init();}");
    }

    protected function _addJsCss()
    {
        parent::_addJsCss();
        $this->_oTemplate->addJs('menu_tools.js');
    }

    protected function _getTemplateVars() {
        $aResult = parent::_getTemplateVars();

        $sJsObject = $this->_getJsObjectMenuTools();
        $aJsParams = [
            'sActionUrl' => BX_DOL_URL_ROOT.$this->_oTemplate->getModule()->_oConfig->getBaseUri(),
            'csrf_token' => (string)BxDolForm::getCsrfToken(),
        ];
        $aResult['js_code'] .= $this->_oTemplate->_wrapInTagJsCode("if(!" . $sJsObject . ") {var " . $sJsObject . " = new BxFilesMenuTools(" . json_encode($aJsParams) . ");}");

        return $aResult;
    }

    protected function _getJsObjectMenuTools() {
        return $this->_sJsObjectMenuTools;
    }
}

/** @} */
