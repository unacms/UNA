<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Ads Ads
 * @ingroup     UnaModules
 *
 * @{
 */

/*
 * Module representation.
 */
class BxAdsTemplate extends BxBaseModTextTemplate
{
    function __construct(&$oConfig, &$oDb)
    {
        $this->MODULE = 'bx_ads';

        parent::__construct($oConfig, $oDb);

        $this->aMethodsToCallAddJsCss[] = 'categories';
    }

    public function entryPromotionGrowth($aContentInfo)
    {
        $CNF = &$this->_oConfig->CNF;

        if(($mixedResult = $this->_oModule->checkAllowedEdit($aContentInfo)) !== CHECK_ACTION_RESULT_ALLOWED)
            return MsgBox($mixedResult);

        $sDateFrom = date('Y-m-d', $aContentInfo[$CNF['FIELD_ADDED']]);
        $sDateTo = date('Y-m-d', time());

        $aForm = [
            'form_attrs' => [
                'id' => 'bx_chart_controls',
                'action' => ''
            ],
            'inputs' => [
                'object' => [
                    'type' => 'select',
                    'name' => 'object',
                    'caption' => _t('_sys_chart_growth_object'),
                    'info' => '',
                    'value' => '',
                    'values' => [],
                    'required' => '0',
                    'attrs' => [
                        'id' => 'bx_chart_growth_objects',
                        'onchange' => 'oBxDolChartGrowth.loadData()'
                    ],
                ],
                'date_from' => [
                    'type' => 'datepicker',
                    'name' => 'date_from',
                    'caption' => _t('_sys_chart_growth_date_from'),
                    'info' => '',
                    'value' => $sDateFrom,
                    'values' => [],
                    'required' => '0',
                    'attrs' => [
                        'id' => 'bx_chart_growth_date_from',
                        'onchange' => 'oBxDolChartGrowth.loadData()'
                    ],
                ],
                'date_to' => [
                    'type' => 'datepicker',
                    'name' => 'date_to',
                    'caption' => _t('_sys_chart_growth_date_to'),
                    'info' => '',
                    'value' => $sDateTo,
                    'values' => [],
                    'required' => '0',
                    'attrs' => [
                        'id' => 'bx_chart_growth_date_to',
                        'onchange' => 'oBxDolChartGrowth.loadData()'
                    ],
                ]
            ]
        ];

        foreach($CNF['OBJECT_PROMOTION_CHARTS'] as $sChart) {
            $aChart = BxDolChartQuery::getChartObject($sChart);
            if(!$aChart)
                continue;

            $aForm['inputs']['object']['values'][] = ['key' => $sChart, 'value' => _t($aChart['title'])];
        }

        $oForm = new BxTemplFormView($aForm);

        $oTemplate = BxDolTemplate::getInstance();
        $oTemplate->addJs(['chart.umd.min.js', 'chartjs-adapter-moment.min.js', 'BxDolChartGrowth.js']);
        $oTemplate->addCss(['chart.css']);

        if($this->_bIsApi){
            return [bx_api_get_block('chart', ['type' => 'line', 'title' => 'Promotion for ' . $aContentInfo[$CNF['FIELD_TITLE']], 'form' =>  $oForm->getCodeApi(), 'endpoint' => 'system/get_data_by_interval/TemplChartServices', 'params' =>['object' => $aForm['inputs']['object']['values'][0]['key'], 'date_from' => $sDateFrom, 'date_to' => $sDateTo, 'content_id' => $aContentInfo[$CNF['FIELD_ID']]]])];
        }
        
        return $oTemplate->parseHtmlByName('chart_growth.html', [
            'controls' => $oForm->getCode(),
            'date_from' => $sDateFrom,
            'date_to' => $sDateTo,
            'request_params' => json_encode([
                'content_id' => $aContentInfo[$CNF['FIELD_ID']]
            ]),
        ]);
    }
    
    public function entryPromotionSummary($aContentInfo)
    {
        $CNF = &$this->_oConfig->CNF;

        if(($mixedResult = $this->_oModule->checkAllowedEdit($aContentInfo)) !== CHECK_ACTION_RESULT_ALLOWED)
            return MsgBox($mixedResult);

        $aTmplVarsDataLabels = $aTmplVarsDataSet = [];
        foreach(['impressions', 'clicks'] as $sItem) {
            $sTitle = bx_html_attribute(_t($CNF['T']['chart_label_' . $sItem]));
            $iValue = (int)$aContentInfo[$sItem];

            $aTmplVarsDataLabels[] = $sTitle . ' - ' . $iValue;
            $aTmplVarsDataSet['data'][] = $iValue;
            $aTmplVarsDataSet['backgroundColor'][] = $this->_getChartColor();
        }

        if($this->_bIsApi){
            return [bx_api_get_block('chart', ['type' => 'pie', 'title' => 'Summary', 'labels' => $aTmplVarsDataLabels, 'data' => $aTmplVarsDataSet])];
        }

        $this->addJs(['chart.umd.min.js']);
        $this->addCss(['chart.css']);
        return $this->parseHtmlByName('chart_stats.html', [
            'chart_id' => $this->MODULE . '_chart_summary',
            'chart_data' => json_encode([
                'labels' => $aTmplVarsDataLabels,
                'datasets' => [$aTmplVarsDataSet]
            ])
        ]);
    }

    public function entryPromotionRoi($aContentInfo)
    {
        $CNF = &$this->_oConfig->CNF;

        if(($mixedResult = $this->_oModule->checkAllowedEdit($aContentInfo)) !== CHECK_ACTION_RESULT_ALLOWED)
            return MsgBox($mixedResult);

        $aTmplVarsDataLabels = $aTmplVarsDataSet = [];
        
        //--- Get income local.
        $sTitleLocal = bx_html_attribute(_t($CNF['T']['chart_label_roi_local']));
        $iValueLocal = (int)$this->_oDb->getLicense(['type' => 'entry_id_income', 'entry_id' => $aContentInfo[$CNF['FIELD_ID']]]);

        $aTmplVarsDataLabels[] = $sTitleLocal . ' - ' . $iValueLocal;
        $aTmplVarsDataSet['data'][] = $iValueLocal;
        $aTmplVarsDataSet['backgroundColor'][] = $this->_getChartColor();

        //--- Get income external (from source)
        $iValueSource = 0;
        if($this->_oConfig->isSources()) {
            $oSource = $this->_oModule->getObjectSource($aContentInfo[$CNF['FIELD_SOURCE_TYPE']], $aContentInfo[$CNF['FIELD_AUTHOR']]);
            if($oSource !== false && !empty($aContentInfo[$CNF['FIELD_SOURCE']])) {
                $aOrders = $oSource->getOrders([
                    'sample' => 'sales_by_product_id', 
                    'product_id' => $aContentInfo[$CNF['FIELD_SOURCE']], 
                    'date_from' => $aContentInfo[$CNF['FIELD_ADDED']]
                ]);

                $sTitleSource = bx_html_attribute(_t($CNF['T']['chart_label_roi_source']));
                foreach($aOrders as $aOrder)
                    $iValueSource += $aOrder['amount'];

                $aTmplVarsDataLabels[] = $sTitleSource . ' - ' . $iValueSource;
                $aTmplVarsDataSet['data'][] = $iValueSource;
                $aTmplVarsDataSet['backgroundColor'][] = $this->_getChartColor();
            }
        }

        //--- Get investments
        $sTitleInvestment = bx_html_attribute(_t($CNF['T']['chart_label_roi_investment']));
        $iValueInvestment = (int)$this->_oDb->getPromotionLicense(['type' => 'entry_id_outcome', 'entry_id' => $aContentInfo[$CNF['FIELD_ID']]]);

        $aTmplVarsDataLabels[] = $sTitleInvestment . ' - ' . $iValueInvestment;
        $aTmplVarsDataSet['data'][] = $iValueInvestment;
        $aTmplVarsDataSet['backgroundColor'][] = $this->_getChartColor();

        $fRoi = 0;
        if($iValueInvestment > 0)
            $fRoi = 100 * ($iValueLocal + $iValueSource - $iValueInvestment)/$iValueInvestment;

        if($this->_bIsApi) {
            return [bx_api_get_block('chart', ['type' => 'pie', 'title' => 'ROI', 'labels' => $aTmplVarsDataLabels, 'data' => $aTmplVarsDataSet, 'text' => 'ROI: ' . $fRoi . '%'])];
        }

        $this->addJs(['chart.umd.min.js']);
        $this->addCss(['chart.css']);
        return $this->parseHtmlByName('entry-roi.html', [
            'chart' => $this->parseHtmlByName('chart_stats.html', [
                'chart_id' => $this->MODULE . '_chart_roi',
                'chart_data' => json_encode([
                    'labels' => $aTmplVarsDataLabels,
                    'datasets' => [$aTmplVarsDataSet]
                ])
            ]),
            'roi' => round($fRoi, 1)
        ]);
    }

    public function entryOfferAccepted($iUserId, $aContent, $aOffer)
    {
        $CNF = &$this->_oConfig->CNF;

        $oPayments = BxDolPayments::getInstance();
        $iContentAuthorId = (int)$aContent[$CNF['FIELD_AUTHOR']];

        $sJsCodePay = $sJsMethodPay = '';
        $aJsPay = $oPayments->getAddToCartJs($iContentAuthorId, $this->MODULE, $aContent[$CNF['FIELD_ID']], $aOffer[$CNF['FIELD_OFR_QUANTITY']], true);
        if(!empty($aJsPay) && is_array($aJsPay))
            list($sJsCodePay, $sJsMethodPay) = $aJsPay;

        return $this->parseHtmlByName('entry-offer-accepted.html', array(
            'js_object' => $this->_oConfig->getJsObject('entry'),
            'id' => $aOffer['id'],
            'amount' => _t_format_currency_ext($aOffer['amount'], [
                'sign' => $oPayments->getCurrencySign($iContentAuthorId)
            ]),
            'quantity' => _t('_bx_ads_txt_n_items', $aOffer['quantity']),
            'bx_if:show_pay' => array(
                'condition' => !empty($sJsMethodPay),
                'content' => array(
                    'js_method_pay' => $sJsMethodPay,
                )
            ),
            'js_code' => $sJsCodePay
        ));
    }

    public function entryBreadcrumb($aContentInfo, $aTmplVarsItems = array())
    {
    	$CNF = &$this->_oConfig->CNF;

        $oPermalink = BxDolPermalinks::getInstance();

        $aTmplVarsItems = array();
        $this->_entryBreadcrumb($aContentInfo[$CNF['FIELD_CATEGORY']], $oPermalink, $aTmplVarsItems);
        $aTmplVarsItems = array_reverse($aTmplVarsItems);
        
        $aTmplVarsItems[] = array(
            'url' => bx_absolute_url($oPermalink->permalink('page.php?i=' . $CNF['URI_VIEW_ENTRY'] . '&id=' . $aContentInfo[$CNF['FIELD_ID']])),
            'title' => bx_process_output($aContentInfo[$CNF['FIELD_TITLE']])
        );

    	return parent::entryBreadcrumb($aContentInfo, $aTmplVarsItems);
    }

    public function categoriesList($aParams = array())
    {
        $CNF = &$this->_oConfig->CNF;

        $sResult = $this->_categoriesList(0, array(
            'url' => bx_absolute_url(BxDolPermalinks::getInstance()->permalink($CNF['URL_CATEGORIES'], array('category' => '')))
        ));

        if(empty($sResult) && isset($aParams['show_empty']) && $aParams['show_empty'] === true)
            $sResult = MsgBox(_t('_Empty'));

        return $sResult;
    }

    public function getEntryLink($aEntry)
    {
        $CNF = &$this->_oConfig->CNF;

        return $this->getLink('entry-link', array(
            'href' => bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=' . $CNF['URI_VIEW_ENTRY'], array(
                'id' => $aEntry[$CNF['FIELD_ID']]
            ))),
            'title' => bx_html_attribute($aEntry[$CNF['FIELD_TITLE']]),
            'content' => $aEntry[$CNF['FIELD_TITLE']]
        ));
    }

    protected function getUnit($aData, $aParams = [])
    {
        $CNF = &$this->_oConfig->CNF;

        $aResult = parent::getUnit($aData, $aParams);
        
        if($this->_oConfig->isSources() && !empty($aData[$CNF['FIELD_URL']])) {
            $aResult = array_merge($aResult, [
                'content_url' => $aData[$CNF['FIELD_URL']],
            ]);

            if($aResult['bx_if:thumb']['condition'])
                $aResult['bx_if:thumb']['content'] = array_merge($aResult['bx_if:thumb']['content'], [
                    'content_url' => $aData[$CNF['FIELD_URL']],
                ]);
        }

        if($this->_oConfig->isPromotion()) {
            $sJsObject = $this->_oConfig->getJsObject('main');

            $sContentOnclick = 'return ' . $sJsObject . '.registerClick(this, ' . $aData[$CNF['FIELD_ID']] . ')';

            $aResult = array_merge($aResult, [
                'bx_if:show_onclick' => [
                    'condition' => true,
                    'content' => [
                        'content_onclick' => $sContentOnclick
                    ]
                ],
                'unit_content_after' => $this->_wrapInTagJsCode($sJsObject . '.registerTracker(' . $aData[$CNF['FIELD_ID']] . ');'),
            ]);

            if($aResult['bx_if:thumb']['condition'])
                $aResult['bx_if:thumb']['content'] = array_merge($aResult['bx_if:thumb']['content'], [
                    'bx_if:show_thumb_onclick' => [
                        'condition' => true,
                        'content' => [
                            'content_onclick' => $sContentOnclick
                        ]
                    ],
                ]);
        }

        return $aResult;
    }

    /**
     * Use Gallery image for both because currently there is no Unit types with small thumbnails.
     */
    protected function getUnitThumbAndGallery ($aData)
    {
        list($sPhotoThumb, $sPhotoGallery) = parent::getUnitThumbAndGallery($aData);

        return array($sPhotoGallery, $sPhotoGallery);
    }

    protected function _categoriesList($iParentId, $aParams = array())
    {
        $aCategories = $this->_oDb->getCategories(array('type' => 'parent_id', 'parent_id' => $iParentId));

        $aTmplVars = array();
        foreach($aCategories as $aCategory) {
            $iItems = (int)$aCategory['items'];

            $sSibcategories = $this->_categoriesList($aCategory['id'], $aParams);
            if($iItems == 0 && empty($sSibcategories))
                continue;

            $aTmplVars[] = array(
                'url' => $aParams['url'] . $aCategory['id'],
                'title' => _t($aCategory['title']),
                'bx_if:show_icon' => array(
                    'condition' => !empty($aCategory['icon']),
                    'content' => array(
                        'icon' => $aCategory['icon'],
                    )
                ),
                'bx_if:show_counter' => array(
                    'condition' => $iItems != 0,
                    'content' => array(
                        'items' => $iItems,
                    )
                ),
                'bx_if:show_subcategories' => array(
                    'condition' => !empty($sSibcategories),
                    'content' => array(
                        'subcategories' => $sSibcategories
                    )
                )
            );
        }

        if(empty($aTmplVars))
            return '';

        return $this->parseHtmlByName('categories.html', array(
            'bx_repeat:categories' => $aTmplVars
        ));
    }

    /**
     * Random chart slice colour as #rrggbb.
     */
    protected function _getChartColor()
    {
        return sprintf('#%06x', rand(0x000000, 0xFFFFFF));
    }

    protected function _entryBreadcrumb($iCategory, &$oPermalink, &$aTmplVarsItems)
    {
        $CNF = &$this->_oConfig->CNF;

        $aCategory = $this->_oDb->getCategories(array('type' => 'id', 'id' => $iCategory));
        if(empty($aCategory) || !is_array($aCategory))
            return;

        $aTmplVarsItems[] = array(
            'url' => bx_absolute_url($oPermalink->permalink($CNF['URL_CATEGORIES'], array($CNF['GET_PARAM_CATEGORY'] => $aCategory['id']))),
            'title' => bx_process_output(_t($aCategory['title']))
        );

        if(empty($aCategory['parent_id']))
            return;

        $this->_entryBreadcrumb((int)$aCategory['parent_id'], $oPermalink, $aTmplVarsItems);
    }
}

/** @} */
