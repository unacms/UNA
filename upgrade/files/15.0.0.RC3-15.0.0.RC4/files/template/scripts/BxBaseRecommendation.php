<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * Recommendation representation.
 * @see BxDolRecommendation
 */
class BxBaseRecommendation extends BxDolRecommendation
{
    protected $_oTemplate;

    protected $_sClassWrapper;

    public function __construct ($aOptions, $oTemplate)
    {
        parent::__construct ($aOptions);

        if ($oTemplate)
            $this->_oTemplate = $oTemplate;
        else
            $this->_oTemplate = BxDolTemplate::getInstance();

        $this->_sClassWrapper = '';
    }

    public function getCode($iProfileId = 0, $aParams = [])
    {
        $sResult = '';

        if(!$iProfileId)
            $iProfileId = $this->_iProfileId;
        
        $bShowcaseView = (bool)($aParams['showcase'] ?? false);

        $iStart = !empty($aParams['start']) ? (int)$aParams['start'] : 0;
        $iPerPage = !empty($aParams['per_page']) ? (int)$aParams['per_page'] : $this->{'_iPerPageDefault' . ($bShowcaseView ? 'Showcase' : '')};

        $aItems = $this->_oDb->get($iProfileId, $this->_aObject['id'], array_merge($aParams, ['start' => $iStart, 'per_page' => $iPerPage + ($bShowcaseView ? 0 : 1)]));
        if(empty($aItems) || !is_array($aItems))
            return $sResult;

        $sClassWrapper = $this->_sClassWrapper;
        $sPaginate = '';

        if(!$bShowcaseView) {
            $iItems = count($aItems);
            $oPaginate = new BxTemplPaginate([
                'on_change_page' => "return !loadDynamicBlockAutoPaginate(this, '{start}', '{per_page}')",
                'num' => $iItems,
                'start' => $iStart,
                'per_page' => $iPerPage,
            ]);
            $sPaginate = $oPaginate->getSimplePaginate();

            if($iItems > $iPerPage)
                array_pop($aItems);
        }
        else {
            $sClassWrapper = 'bx-recommendation-showcase';

            $this->_oTemplate->addCss([BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'flickity/|flickity.css']);
            $this->_oTemplate->addJs(['flickity/flickity.pkgd.min.js', 'modules/base/general/js/|showcase.js']);
        }

        foreach($aItems as $iId => $iCount)
            $sResult .= $this->getCodeItem($iId, $iCount);

        return $this->_oTemplate->parseHtmlByName('recommendation_block.html', [
            'class' => $sClassWrapper,
            'content' => $sResult,
            'bx_if:show_paginate' => [
                'condition' => !$bShowcaseView && !empty($sPaginate),
                'content' => [
                    'paginate' => $sPaginate
                ]
            ],
            'bx_if:show_showcase' => [
                'condition' => $bShowcaseView,
                'content' => [
                    'class' => $sClassWrapper
                ]
            ]
        ]);
    }

    public function getCodeAPI($iProfileId = 0, $aParams = [])
    {
        if(!$iProfileId)
            $iProfileId = $this->_iProfileId;

        $bShowcaseView = (bool)($aParams['showcase'] ?? false);

        // a page has 1 to 50 profiles, otherwise the default number
        $aParams['start'] = bx_api_get_start($aParams['start'] ?? 0);
        $aParams['per_page'] = bx_api_get_per_page($aParams['per_page'] ?? 0, $this->{'_iPerPageDefault' . ($bShowcaseView ? 'Showcase' : '')});

        $bForceGetData = false;
        if(($sK = 'force_get_data') && isset($aParams[$sK])) {
            $bForceGetData = (bool)$aParams[$sK];
            unset($aParams[$sK]);
        }

        $aItems = [];
        if(!defined('BX_API_PAGE') || $bForceGetData)
            $aItems = $this->_oDb->get($iProfileId, $this->_aObject['id'], $aParams);

        $aData = [];
        foreach($aItems as $iId => $iCount) {
            $aItem = $this->getCodeItem($iId, $iCount);
            $aItem['id'] = $iId;

            $aData[] = $aItem;
        }

        return [
            'request_url' => '',
            'data' => $aData,
            'params' => [
                'showcase' => (int)$bShowcaseView,
                'start' => $aParams['start'],
                'per_page' => $aParams['per_page'],
            ],
        ];
    }
}

/** @} */
