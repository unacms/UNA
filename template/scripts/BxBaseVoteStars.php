<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * @see BxDolVote
 */
class BxBaseVoteStars extends BxDolVoteStars
{
    protected $_sTmplNameDoVoteStars;

    public function __construct($sSystem, $iId, $iInit = true, $oTemplate = false)
    {
        parent::__construct($sSystem, $iId, $iInit, $oTemplate);

        $this->_sJsClsName .= 'Stars';

        $sHtmlId = str_replace(array('_' , ' '), array('-', '-'), $sSystem) . '-' . $iId;
        $this->_aHtmlIds = array_merge($this->_aHtmlIds, array(
            'main' => 'bx-vote-stars-' . $sHtmlId,
            'legend_stars' => 'bx-vote-stars-legend-' . $sHtmlId,
        ));

        $this->_aElementDefaults = [
            'show_do_vote_legend' => false,
            'show_counter' => true,
            'show_counter_empty' => false,
            'show_legend' => false,
            'show_script' => true,
            'read_only' => false
        ];
        $this->_aElementDefaultsApi = array_merge($this->_aElementDefaults, [
            'show_counter' => true,
        ]);

        $this->_sTmplNameDoVoteStars = 'vote_do_vote_stars.html';
    }

    public function getLegend($aParams = array())
    {
        $sJsObject = $this->getJsObjectName();
        $iMinValue = $this->getMinValue();
        $iMaxValue = $this->getMaxValue();

        $aLegend = $this->_oQuery->getLegend($this->_iId);

        $aTmplVarsItems = array();
        for($i = $iMaxValue; $i >= $iMinValue; $i--) {
            $aTmplVarsStars = $aTmplVarsSlider = array();

            for($j = $iMinValue; $j <= $iMaxValue; $j++) {
                $aTmplVarsStars[] = array(
                    'style_prefix' => $this->_sStylePrefix,
                    'value' => $i
                );

                $aTmplVarsSlider[] = array(
                    'style_prefix' => $this->_sStylePrefix
                );
            }

            $aTmplVarsItems[] = array(
                'style_prefix' => $this->_sStylePrefix,
                'value' => $i,
                'bx_repeat:stars' => $aTmplVarsStars,
                'bx_repeat:slider' => $aTmplVarsSlider,
                'label' => isset($aLegend[$i]['count']) ? (int)$aLegend[$i]['count'] : 0
            );
        }

        return $this->_oTemplate->parseHtmlByName($this->_sTmplNameLegend, array(
            'style_prefix'  => $this->_sStylePrefix,
            'html_id' => $this->_aHtmlIds['legend_stars'],
            'type' => $this->_sType,
            'bx_repeat:items' => $aTmplVarsItems
        ));
    }

    public function getCounterAPI($aParams = [])
    {
        $aParams = array_merge($this->_aElementDefaultsApi, $aParams);

        return $this->_getVote();
    }

    /**
     * Internal methods.
     */
    protected function _getTmplVarsElement($aParams = array())
    {
        $aTmplVars = parent::_getTmplVarsElement($aParams);

        $aVote = $this->_getVote();
        $aTmplVars['bx_if:show_vote_data'] = array(
            'condition' => true,
            'content' => array(
                'rate' => $aVote['rate'],
                'count' => $aVote['count']
            )
        );

        return $aTmplVars;
    }

    protected function _getDoVote($aParams = array(), $isAllowedVote = true)
    {
        $sJsObject = $this->getJsObjectName();
        $iMinValue = $this->getMinValue();
        $iMaxValue = $this->getMaxValue();

        $bReadOnly = isset($aParams['read_only']) && (bool)$aParams['read_only'] === true;
        $bVoted = isset($aParams['is_voted']) && (bool)$aParams['is_voted'] === true;
        $bDisabled = !$isAllowedVote || ($bVoted && !$this->isUndo());

        if($this->_bIsApi)
            return [
                'is_undo' => $this->isUndo(),
                'is_voted' => $bVoted,
                'is_disabled' => $bDisabled,
                'value_min' => $iMinValue,
                'value_max' => $iMaxValue,
                'value' => $this->getValue($bVoted),
            ];

        $aTmplVarsStars = $aTmplVarsLegend = $aTmplVarsSlider = $aTmplVarsButtons = array();
        for($i = $iMinValue; $i <= $iMaxValue; $i++) {
            $aTmplVarsStars[] = array(
                'style_prefix' => $this->_sStylePrefix,
                'value' => $i
            );

            $aTmplVarsLegend[] = array(
                'style_prefix' => $this->_sStylePrefix,
                'value' => $i
            );

            $aTmplVarsSlider[] = array(
                'style_prefix' => $this->_sStylePrefix
            );

            if($isAllowedVote && !$bReadOnly)
                $aTmplVarsButtons[] = array(
                    'style_prefix' => $this->_sStylePrefix,
                    'js_object' => $sJsObject,
                    'value' => $i
                );
        }

        return $this->_oTemplate->parseHtmlByName($this->_sTmplNameDoVoteStars, array(
            'style_prefix' => $this->_sStylePrefix,
            'bx_repeat:stars' => $aTmplVarsStars,
            'bx_if:show_legend' => array(
                'condition' => isset($aParams['show_do_vote_legend']) && $aParams['show_do_vote_legend'] === true,
                'content' => array(
                    'style_prefix' => $this->_sStylePrefix,
                    'bx_repeat:legend' => $aTmplVarsLegend,
                )
            ),
            'bx_repeat:slider' => $aTmplVarsSlider,
            'bx_repeat:buttons' => $aTmplVarsButtons,
        ));
    }

    protected function _isShowLegend($aParams, $isAllowedVote, $isAllowedVoteView, $bCount)
    {
        return isset($aParams['show_legend']) && $aParams['show_legend'] === true && $isAllowedVoteView;
    }
}

/** @} */
