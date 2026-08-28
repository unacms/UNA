<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT 
 * @defgroup    Tasks Tasks
 * @ingroup     UnaModules
 *
 * @{
 */

class BxTasksCmts extends BxTemplCmts
{
    protected $_sModule;
    protected $_oModule;

    protected $_iAuthorAuto;

    public function __construct($sSystem, $iId, $iInit = 1)
    {
        parent::__construct($sSystem, $iId, $iInit);

        $this->_sModule = 'bx_tasks';
        $this->_oModule = BxDolModule::getInstance($this->_sModule);

        $this->_iAuthorAuto = (int)getParam('sys_profile_bot');

        $this->_aT = array_merge($this->_aT, [
            'block_comments_title' => '_bx_tasks_page_block_title_entry_comments'
        ]);
    }

    public function addAuto($aText)
    {
        $aValues = [
            'cmt_author_id' => $this->_iAuthorAuto,
            'cmt_parent_id' => 0,
            'cmt_text' => json_encode($aText)
        ];

        return $this->add($aValues);
    }
    
    public function getViewText($mixedItem)
    {
        if(!is_array($mixedItem))
            $mixedItem = $this->getCommentSimple((int)$mixedItem);

        if(empty($mixedItem) || !is_array($mixedItem))
            return '';

        if($this->_isAutoComment($mixedItem) && isset($mixedItem['cmt_text']))
            $mixedItem['cmt_text'] = $this->_getAutoCommentText($mixedItem['cmt_text']);

        return $this->_prepareTextForOutput($mixedItem['cmt_text'], (int)$mixedItem['cmt_id']);
    }

    public function getComment($mixedCmt, $aBp = [], $aDp = [])
    {
        $aCmt = !is_array($mixedCmt) ? $this->getCommentRow((int)$mixedCmt) : $mixedCmt;
        if(!$aCmt)
            return '';

        if($this->_isAutoComment($aCmt))
            $aDp = array_merge($aDp ?? [], [
                'class_comment' => $this->_sStylePrefix . '-auto'
            ]);

        return parent::getComment($aCmt, $aBp, $aDp);
    }

    public function getDataAPI($aData, $aParams = [])
    {
        $aResult = parent::getDataAPI($aData, $aParams);

        if($this->_isAutoComment($aData)) {
            if(isset($aResult['cmt_text']))
                $aResult['cmt_text'] = $this->_getAutoCommentText($aResult['cmt_text']);

            unset($aResult['menu_actions'], $aResult['menu_manage']);
        }

        return $aResult;
    }

    protected function _getHeaderBox(&$aCmt, $aBp = [], $aDp = [])
    {
        return !$this->_isAutoComment($aCmt) ? parent::_getHeaderBox($aCmt, $aBp, $aDp) : '';
    }

    protected function _getCountersBox(&$aCmt, $aBp = [], $aDp = [])
    {
        return !$this->_isAutoComment($aCmt) ? parent::_getCountersBox($aCmt, $aBp, $aDp) : '';
    }

    protected function _getActionsBox(&$aCmt, $aBp = [], $aDp = [])
    {
        return !$this->_isAutoComment($aCmt) ? parent::_getActionsBox($aCmt, $aBp, $aDp) : '';
    }

    protected function _getAttachments($aCmt)
    {
        return !$this->_isAutoComment($aCmt) ? parent::_getAttachments($aCmt) : ($this->_bIsApi ? [] : '');
    }

    protected function _getTmplVarsAuthor($aCmt)
    {
        return !$this->_isAutoComment($aCmt) ? parent::_getTmplVarsAuthor($aCmt) : [
            'author_unit' => ''
        ];
    }

    protected function _getTmplVarsText($aCmt)
    {
        $aTmplVarsText = parent::_getTmplVarsText($aCmt);

        if($this->_isAutoComment($aCmt) && isset($aTmplVarsText['text']))
            $aTmplVarsText['text'] = $this->_getAutoCommentText($aTmplVarsText['text'], $aCmt['cmt_time']);

        return $aTmplVarsText;
    }

    protected function _prepareAlertParams($aCmt)
    {
        $aResult = parent::_prepareAlertParams($aCmt);
        if($this->_isAutoComment($aCmt) && isset($aResult['comment_text']))
            $aResult['comment_text'] = $this->_getAutoCommentText($aResult['comment_text']);

        return $aResult;
    }

    protected function _isAutoComment($aCmt)
    {
        return (int)$aCmt['cmt_author_id'] == $this->_iAuthorAuto;
    }

    protected function _getAutoCommentText($sTextCode, $iDate = false)
    {
        $aText = json_decode($sTextCode, true);

        $sText = isset($aText['key']) ? _t($aText['key']) : '';
        if(($aMarkers = $aText['markers'] ?? false) && is_array($aMarkers)) {
            if(($sValue = $aMarkers['value'] ?? false) && substr($sValue, 0, 1) == '_')
                $aMarkers['value'] = _t($sValue);

            $sText = bx_replace_markers($sText, $aMarkers);
        }

        if($iDate !== false)
            $sText = _t('_bx_tasks_txt_msg_format', $sText, bx_time_js((int)$iDate, BX_FORMAT_DATE, true));

        return $sText;
    }
}

/** @} */
