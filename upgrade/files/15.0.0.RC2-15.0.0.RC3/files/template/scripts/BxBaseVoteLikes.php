<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * @see BxDolVote, BxDolVoteLikes
 */
class BxBaseVoteLikes extends BxDolVoteLikes
{
    public function __construct($sSystem, $iId, $iInit = true, $oTemplate = false)
    {
        parent::__construct($sSystem, $iId, $iInit, $oTemplate);

        $this->_sJsClsName .= 'Likes';

        $sHtmlId = str_replace(array('_' , ' '), array('-', '-'), $sSystem) . '-' . $iId;
        $this->_aHtmlIds = array_merge($this->_aHtmlIds, array(
            'main' => 'bx-vote-likes-' . $sHtmlId
        ));

        $this->_aElementDefaults = [
            'use_icon_as' => 'icon',
            'show_do_vote_as_button' => false,
            'show_do_vote_as_button_small' => false,
            'show_do_vote_icon' => true,
            'show_do_vote_label' => false,
            'show_counter' => true,
            'show_counter_only' => true,
            'show_counter_empty' => false,
            'show_counter_label_icon' => false,
            'show_counter_label_text' => true,
            'show_legend' => false,
            'show_script' => true
        ];
        $this->_aElementDefaultsApi = array_merge($this->_aElementDefaults, [
            'show_counter' => true,
        ]);

        $this->_sTmplContentDoActionLabel = $this->_oTemplate->getHtml('vote_do_vote_label_likes.html');
        $this->_sTmplContentCounterLabel = $this->_oTemplate->getHtml('vote_counter_label_likes.html');
    }

    public function getJsClick($iValue = 0)
    {
        if(empty($iValue))
            $iValue = $this->getValue();

        return parent::getJsClick($iValue);
    }

    public function getCounter($aParams = [])
    {
        $aParams = array_merge($this->_aElementDefaults, $aParams);

        $sClass = '';
        if(isset($aParams['show_do_vote_as_button_small']) && (bool)$aParams['show_do_vote_as_button_small'] === true)
            $sClass = 'bx-btn-small-height';
        else if(isset($aParams['show_do_vote_as_button']) && (bool)$aParams['show_do_vote_as_button'] === true)
            $sClass = 'bx-btn-height';

        $aParams['class_counter'] = isset($aParams['class_counter']) ? $aParams['class_counter'] : '';
        $aParams['class_counter'] .= ' ' . $sClass;

        return parent::getCounter($aParams);
    }
    
    public function getCounterAPI($aParams = [])
    {
        $aParams = array_merge($this->_aElementDefaultsApi, $aParams);

        return $this->_getVote();
    }

    public function getElement($aParams = array())
    {
        $sClass = $this->_sStylePrefix . '-' . $this->_sType;
        if(isset($aParams['show_do_vote_as_button_small']) && (bool)$aParams['show_do_vote_as_button_small'] === true)
            $sClass .=  '-button-small';
        else if(isset($aParams['show_do_vote_as_button']) && (bool)$aParams['show_do_vote_as_button'] === true)
            $sClass .= '-button';

        $aParams['class_element'] = isset($aParams['class_element']) ? $aParams['class_element'] : '';
        $aParams['class_element'] .= ' ' . $sClass;

        return parent::getElement($aParams);
    }

    /**
     * Internal methods.
     */
    protected function _getDoVote($aParams = array(), $isAllowedVote = true)
    {
    	$bVoted = isset($aParams['is_voted']) && (bool)$aParams['is_voted'] === true;
        $bShowDoVoteAsButtonSmall = isset($aParams['show_do_vote_as_button_small']) && (bool)$aParams['show_do_vote_as_button_small'] === true;
        $bShowDoVoteAsButton = !$bShowDoVoteAsButtonSmall && isset($aParams['show_do_vote_as_button']) && (bool)$aParams['show_do_vote_as_button'] === true;
        $bDisabled = !$isAllowedVote || ($bVoted && !$this->isUndo());

        $sClass = '';
        if($bShowDoVoteAsButton)
            $sClass = 'bx-btn';
        else if ($bShowDoVoteAsButtonSmall)
            $sClass = 'bx-btn bx-btn-small';

        if($bDisabled)
            $sClass .= $bShowDoVoteAsButton || $bShowDoVoteAsButtonSmall ? ' bx-btn-disabled' : 'bx-vote-disabled';

        if($this->_bIsApi)
            return [
                'is_undo' => $this->isUndo(),
                'is_voted' => $bVoted,
                'is_disabled' => $bDisabled,
                'value' => $this->getValue(),
                'title' => _t($this->_getTitleDo($bVoted)),
            ];

        return $this->_oTemplate->parseLink('javascript:void(0)', $this->_getDoVoteLabel($aParams), array(
            'class' => $this->_sStylePrefix . '-do-vote ' . $sClass,
            'title' => _t($this->_getTitleDo($bVoted)),
            'onclick' => !$bDisabled ? $this->getJsClick() : ''
        ));
    }

    protected function _getDoVoteLabel($aParams = array())
    {
    	$bVoted = isset($aParams['is_voted']) && (bool)$aParams['is_voted'] === true;
        return $this->_oTemplate->parseHtmlByContent($this->_getTmplContentDoActionLabel(), array(
            'style_prefix' => $this->_sStylePrefix,
            'bx_if:show_icon' => array(
                'condition' => isset($aParams['show_do_vote_icon']) && (bool)$aParams['show_do_vote_icon'] === true,
                'content' => array(
                    'style_prefix' => $this->_sStylePrefix,
                    'icon' => $this->_oTemplate->getImageAuto($this->{'_get' . bx_gen_method_name($this->_useIconAs($aParams)) . 'Do'}($bVoted))
                )
            ),
            'bx_if:show_text' => array(
                'condition' => isset($aParams['show_do_vote_label']) && (bool)$aParams['show_do_vote_label'] === true,
                'content' => array(
                    'style_prefix' => $this->_sStylePrefix,
                    'text' => _t($this->_getTitleDo($bVoted))
                )
            )
        ));
    }

    protected function _getCounterLabel($iCount, $aParams = array())
    {
        $bVoted = isset($aParams['is_voted']) && (bool)$aParams['is_voted'] === true;
        return $this->_oTemplate->parseHtmlByContent($this->_getTmplContentCounterLabel(), array(
            'style_prefix' => $this->_sStylePrefix,
            'bx_if:show_icon' => array(
                'condition' => !isset($aParams['show_counter_label_icon']) || (bool)$aParams['show_counter_label_icon'] === true,
                'content' => array(
                    'style_prefix' => $this->_sStylePrefix,
                    'icon' => isset($aParams['custom_icon']) && $aParams['custom_icon'] != '' ? $aParams['custom_icon'] : $this->_oTemplate->getImageAuto($this->_getIconDo($bVoted))
                )
            ),
            'bx_if:show_text' => array(
                'condition' => !isset($aParams['show_counter_label_text']) || (bool)$aParams['show_counter_label_text'] === true,
                'content' => array(
                    'style_prefix' => $this->_sStylePrefix,
                    'text' => parent::_getCounterLabel($iCount, $aParams)
                )
            )
        ));
    }

    protected function _isShowDoVote($aParams, $isAllowedVote, $bCount)
    {
        $bResult = parent::_isShowDoVote($aParams, $isAllowedVote, $bCount);
        if(!$bResult)
            return $bResult;

        return $isAllowedVote || $bCount;
    }
}

/** @} */
