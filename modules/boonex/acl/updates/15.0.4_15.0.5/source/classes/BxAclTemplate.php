<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    PaidLevels Paid Levels
 * @ingroup     UnaModules
 *
 * @{
 */

class BxAclTemplate extends BxBaseModGeneralTemplate
{
    function __construct(&$oConfig, &$oDb)
    {
        parent::__construct($oConfig, $oDb);
    }
    
    public function displayActionsBlock($iLevelId, $iStart = 0, $iLimit = 0)
    {
        $aLevel = [];
        BxDolAclQuery::getInstance()->getLevels(['type' => 'by_id', 'value' => $iLevelId], $aLevel, false);
        if(empty($aLevel) || !is_array($aLevel))
            return $this->_bIsApi ? [] : '';

        $mixedResult = $this->displayActions($iLevelId, $iStart, $iLimit);
        if($this->_bIsApi)
            return $mixedResult;

        $this->addCss(['main.css']);
        $this->addJs(['main.js']);
        return $this->parseHtmlByName('actions_block.html', [
            'level' => _t('_bx_acl_txt_x_actions', _t($aLevel['name'])),
            'actions' => $mixedResult,
            'js_code' => $this->getJsCode('main')
        ]);
    }

    public function displayActionsPopup($iLevelId)
    {
        $CNF = &$this->_oConfig->CNF;

        return BxTemplFunctions::getInstance()->transBox($this->_oConfig->getHtmlIds('actions_popup') . $iLevelId, $this->parseHtmlByName('actions_popup.html', [
            'actions' => $this->displayActions($iLevelId, 0, $CNF['PARAM_ACTIONS_LIMIT_POPUP'])
        ]));
    }

    public function displayActions($iLevelId, $iStart = 0, $iLimit = 0)
    {
        $CNF = &$this->_oConfig->CNF;

        if(!$iLimit)
            $iLimit = !$this->_bIsApi ? $CNF['PARAM_ACTIONS_LIMIT_BLOCK'] : 9999;       

        $aActions = [];
        BxDolAclQuery::getInstance()->getActions(['type' => 'by_level_id', 'value' => $iLevelId, 'start' => $iStart, 'limit' => $iLimit + 1], $aActions, false);
        if(empty($aActions) || !is_array($aActions))
            return $this->_bIsApi ? [] : '';

        $sTxtNo = _t('_No');

        $aTmplVarsActions = [];
        foreach($aActions as $aAction) {
            $sTxtLimitCount = $sTxtNo;
            if((bool)$aAction['countable'] && ($iCount = (int)$aAction['allowed_count']) > 0) {
                if(($iPeriod = (int)$aAction['allowed_period_len']) > 0)
                    $sTxtLimitCount = _t('_bx_acl_txt_n_times_m_hours', $iCount, $iPeriod);
                else
                    $sTxtLimitCount = _t('_bx_acl_txt_n_times', $iCount);
            }

            $sTxtLimitTime = $sTxtNo;
            $bAfter = ($sK = 'allowed_period_start') && $aAction[$sK] && ($iAfter = strtotime($aAction[$sK])) != 0;
            $bUntil = ($sK = 'allowed_period_end') && $aAction[$sK] && ($iUntil = strtotime($aAction[$sK])) != 0;
            if($bAfter || $bUntil) {
                $sAfter = $bAfter ? bx_time_js($iAfter, BX_FORMAT_DATE_TIME, true) : '';
                $sUntil = $bUntil ? bx_time_js($iUntil, BX_FORMAT_DATE_TIME, true) : '';

                if($bAfter && $bUntil)
                    $sTxtLimitTime = _t('_bx_acl_txt_after_x_until_y', $sAfter, $sUntil);
                else if($bAfter)
                    $sTxtLimitTime = _t('_bx_acl_txt_after_x', $sAfter);
                else if($bUntil)
                    $sTxtLimitTime = _t('_bx_acl_txt_until_x', $sUntil);
            }

            $aTmplVarsActions[] = [
                'action' => _t($aAction['title']),
                'limit_count' => $sTxtLimitCount,
                'limit_time' => $sTxtLimitTime
            ];
        }

        if($this->_bIsApi)
            return $aTmplVarsActions;

        $oPaginate = new BxTemplPaginate([
            'start' => $iStart,
            'per_page' => $iLimit,
            'on_change_page' => $this->_oConfig->getJsObject('main') . ".getActions(this, " . $iLevelId . ", {start}, {per_page})"
        ]);
        $oPaginate->setNumFromDataArray($aTmplVarsActions);
        $sPaginate = $oPaginate->getSimplePaginate();

        return $this->parseHtmlByName('actions_list.html', [
            'html_id_actions' => $this->_oConfig->getHtmlIds('actions_list') . $iLevelId,
            'bx_repeat:actions' => $aTmplVarsActions,
            'bx_if:show_paginate' => [
                'condition' => !empty($sPaginate),
                'content' => [
                    'paginate' => $sPaginate
                ]
            ]
        ]);
    }

    public function displayEmptyOwner()
    {
    	return MsgBox(_t('_bx_acl_msg_empty_owner'));
    }

    public function displayMembershipActions($iProfileId)
    {
        $this->addCss(array('pm_actions.css'));
    	return $this->parseHtmlByName('pm_actions.html', array(
            'url_upgrade' => BX_DOL_URL_ROOT . BxDolPermalinks::getInstance()->permalink($this->_oConfig->CNF['URL_VIEW'])
    	));
    }

    public function displayLevelIcon($mixedValue)
    {
        list($sIcon, $sIconUrl, $sIconA, $sIconHtml) = BxTemplFunctions::getInstance()->getIcon($mixedValue);

        $bTmplVarsIcon = $bTmplVarsImage = $bTmplVarsIconHtml = false;
        $aTmplVarsIcon = $aTmplVarsImage = $aTmplVarsIconHtml = [];
        if(($bTmplVarsIcon = $sIcon !== false))
            $aTmplVarsIcon = [
                'name' => $sIcon
            ];
        else if(($bTmplVarsImage = $sIconUrl !== false))
            $aTmplVarsImage = [
                'src' => $sIconUrl,
            ];
        else if(($bTmplVarsIconHtml = $sIconHtml !== false))
            $aTmplVarsIconHtml = [
                'icon_html' => $sIconHtml
            ];

        return $this->parseHtmlByName('level_icon.html', [
            'bx_if:show_image' => [
                'condition' => $bTmplVarsImage,
                'content' => $aTmplVarsImage
            ],
            'bx_if:show_icon' => [
                'condition' => $bTmplVarsIcon,
                'content' => $aTmplVarsIcon
            ],
            'bx_if:show_icon_html' => [
                'condition' => $bTmplVarsIconHtml,
                'content' => $aTmplVarsIconHtml 
            ]
        ]);
    }

    public function getJsCode($sType, $aParams = [], $bWrap = true)
    {
        return parent::getJsCode($sType, array_merge([
            'aHtmlIds' => $this->_oConfig->getHtmlIds()
        ], $aParams), $bWrap);
    }
}

/** @} */
