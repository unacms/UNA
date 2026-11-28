<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Reviews Reviews
 * @ingroup     UnaModules
 *
 * @{
 */

/*
 * Module representation.
 */
class BxReviewsTemplate extends BxBaseModTextTemplate
{
    function __construct(&$oConfig, &$oDb)
    {
        $this->MODULE = 'bx_reviews';

        parent::__construct($oConfig, $oDb);
    }

    protected function _addCommonJs() {
        $sRes = $this->addJs(['BxDolVoteStars.js', 'BxReviewsVoteStars.js'], bx_is_dynamic_request());
        $sRes .= $this->addCss(['main.css'], bx_is_dynamic_request());
        if (bx_is_dynamic_request()) return $sRes;
    }

    /**
     * Use Gallery image for both because currently there is no Unit types with small thumbnails.
     */
    protected function getUnitThumbAndGallery ($aData)
    {
        list($sPhotoThumb, $sPhotoGallery) = parent::getUnitThumbAndGallery($aData);

        return array($sPhotoGallery, $sPhotoGallery);
    }

    public function getMultiVoting($aValue, $isAllowedVote) {
        $aOptions = $this->_oModule->_oDb->getVotingOptions();
        if (empty($aOptions)) return '';

        $CNF = &$this->_oConfig->CNF;

        $sJsObject = $this->_oConfig->getJsObject('multi_voting');
        $sJsCode = $this->getJsCode('multi_voting', ['review_id' => 0]);

        $iMinValue = 1;
        $iMaxValue = $this->_oDb->getParam($CNF['PARAM_MAX_STARS']);

        $aTmplVarsStars = $aTmplVarsSlider = $aTmplVarsButtons = [];
        for($i = $iMinValue; $i <= $iMaxValue; $i++) {
            $aTmplVarsStars[] = ['style_prefix' => 'bx-vote', 'value' => $i];
            $aTmplVarsSlider[] = ['style_prefix' => 'bx-vote'];
            if($isAllowedVote) $aTmplVarsButtons[] = [
                'style_prefix' => 'bx-vote',
                'js_object' => $sJsObject,
                'value' => $i
            ];
        }

        $sStars = $this->parseHtmlByName('vote_do_vote_stars.html', [
            'style_prefix' => 'bx-vote',
            'bx_repeat:stars' => $aTmplVarsStars,
            'bx_repeat:slider' => $aTmplVarsSlider,
            'bx_repeat:buttons' => $aTmplVarsButtons,
            'bx_if:show_legend' => ['condition' => false, 'content' => []],
        ]);

        $aTmplOptions = [];
        foreach ($aOptions as $aOption) {
            // cast to int, the value goes into an HTML attribute (also covers already stored data)
            $iRate = isset($aValue[$aOption['id']]) && is_scalar($aValue[$aOption['id']]) ? (int)$aValue[$aOption['id']] : 0;
            if (!$isAllowedVote && !$iRate) continue;

            $aTmplOptions[] = [
                'voting_option_name' => htmlspecialchars_adv(_t($aOption['lkey'])),
                'style_prefix' => 'bx-vote',
                'rate' => $iRate,
                'stars' => $sStars,
                'bx_if:vote_allowed' => ['condition' => $isAllowedVote, 'content' => [
                    'option_id' => $aOption['id'],
                    'rate' => $iRate,
                ]],
            ];
        }
        if (empty($aTmplOptions)) return false;

        return $this->parseHtmlByName('voting_multi_stars.html', [
            'js_code' => $this->_addCommonJs().$sJsCode,
            'bx_repeat:voting_options' => $aTmplOptions,
        ]);
    }

    public function getOverallRating($sEntryId, $fRate, $bShowDetails = true) {
        if (!$fRate) return '';

        $sJsCode = $this->getJsCode(['type' => 'multi_voting', 'id' => $sEntryId], ['review_id' => $sEntryId]);

        $iMinValue = 1;
        $iMaxValue = 5;

        $aTmplVarsStars = $aTmplVarsSlider = $aTmplVarsButtons = [];
        for($i = $iMinValue; $i <= $iMaxValue; $i++) {
            $aTmplVarsStars[] = ['style_prefix' => 'bx-vote', 'value' => $i];
            $aTmplVarsSlider[] = ['style_prefix' => 'bx-vote'];
        }

        $sStars = $this->parseHtmlByName('vote_do_vote_stars.html', [
            'style_prefix' => 'bx-vote',
            'bx_repeat:stars' => $aTmplVarsStars,
            'bx_repeat:slider' => $aTmplVarsSlider,
            'bx_repeat:buttons' => $aTmplVarsButtons,
            'bx_if:show_legend' => ['condition' => false, 'content' => []],
        ]);

        return $this->parseHtmlByName('unit_rating.html', [
            'id' => $sEntryId,
            'rate' => $fRate,
            'stars' => $sStars,
            'bx_if:details' => [
                'condition' => $bShowDetails,
                'content' => [
                    'details_action_url' => BX_DOL_URL_ROOT.$this->_oConfig->getBaseUri().'get_review_rating_details/'.$sEntryId,
                ]
            ],
            'js_code' => $this->_addCommonJs().$sJsCode,
        ]);
    }

    protected function getUnit($aData, $aParams = array())
    {
        $CNF = &$this->_oConfig->CNF;

        $aResult = parent::getUnit($aData, $aParams);

        $aContext = [];
        if ($aData[$CNF['FIELD_ALLOW_VIEW_TO']] < 0) {
            $oContextProfile = BxDolProfile::getInstance(-$aData[$CNF['FIELD_ALLOW_VIEW_TO']]);
            if ($oContextProfile) {
                $oModule = BxDolModule::getInstance($oContextProfile->getModule());
                $aContext = [
                    'content_icon' => !empty($oModule->_oConfig->CNF) && isset($oModule->_oConfig->CNF['ICON']) ? $oModule->_oConfig->CNF['ICON'] : 'landmark',
                    'content_type' => !empty($oModule->_oConfig->CNF) && isset($oModule->_oConfig->CNF['T']['txt_sample_single']) ? _t($oModule->_oConfig->CNF['T']['txt_sample_single']) : _t('_bx_reviews_txt_related'),
                    'content_link' => $oContextProfile->getUrl(),
                    'content_name' => $oContextProfile->getDisplayName(),
                ];
            }
        }

        $aProduct = [];
        if (!empty($aData[$CNF['FIELD_PRODUCT']])) {
            $sProduct = $aData[$CNF['FIELD_PRODUCT']];
            $aProduct = [
                'product_name' => bx_process_output($sProduct),
                'product_link' => bx_append_url_params(BX_DOL_URL_ROOT . $this->_oModule->_oConfig->CNF['URI_SEARCH_PRODUCT'], ['keyword' => $sProduct]),
            ];
        }

        $aResultExtra = [
            'bx_if:context' => [
                'condition' => !bx_is_empty_array($aContext),
                'content' => $aContext,
            ],
            'bx_if:product' => [
                'condition' => !bx_is_empty_array($aProduct),
                'content' => $aProduct,
            ],
            'bx_if:rating' => [
                'condition' => !empty($aData[$CNF['FIELD_VOTING_AVG']]),
                'content' => [
                    'stars' => $this->getOverallRating($aData[$CNF['FIELD_ID']], $aData[$CNF['FIELD_VOTING_AVG']]),
                ],
            ],
        ];

        $sText = $this->getText($aData);
        $sSummaryQuickPlain = isset($CNF['PARAM_CHARS_SUMMARY_PLAIN_SHORT']) && $CNF['PARAM_CHARS_SUMMARY_PLAIN_SHORT'] ? BxTemplFunctions::getInstance()->getStringWithLimitedLength(strip_tags($sText), (int)getParam($CNF['PARAM_CHARS_SUMMARY_PLAIN_SHORT'])) : '';

        $aResult['bx_if:thumb_plus_quick_desc'] = [
            'condition' => $aResult['bx_if:thumb']['condition'],
            'content' => [
                'summary_quick_plain' => $sSummaryQuickPlain,
            ],
        ];

        return array_merge($aResult, $aResultExtra);
    }

    public function browseReviewedContent() {
        $CNF = &$this->_oConfig->CNF;

        $sPageUrl = bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i='.bx_get('i')));

        $sOrderBy = bx_get('order_by');
        if ($sOrderBy != 'avg_rating' && $sOrderBy != 'reviews_num') $sOrderBy = 'avg_rating';

        bx_import('BxTemplPaginate');
        $oPaginate = new BxTemplPaginate(array(
            'page_url' => $sPageUrl,
        	'on_change_page' => "return !loadDynamicBlockAutoPaginate(this, {start}, {per_page}, 'order_by={$sOrderBy}');",
            'start' => (int)bx_get('start'),
            'per_page' => getParam($CNF['PARAM_PER_PAGE_BROWSE']),
        ));

        $aProfiles = $this->_oDb->getReviewedContent($oPaginate->getStart(), $oPaginate->getPerPage() + 1, $sOrderBy);
        if (empty($aProfiles)) return;

        $oPaginate->setNumFromDataArray($aProfiles);

        $sReviewsLinkTmpl = BxDolPermalinks::getInstance()->permalink('page.php?i='.$CNF['URI_ENTRIES_BY_CONTEXT']);

        $aDataTmpl = [];
        foreach ($aProfiles as $aDataRow) {
            $oProfile = BxDolProfile::getInstance($aDataRow[$CNF['FIELD_REVIEWED_PROFILE']]);
            if (!$oProfile) continue;

            $aDataTmpl[] = [
                'profile_id' => $aDataRow[$CNF['FIELD_REVIEWED_PROFILE']],
                'profile_link' => $oProfile->getUrl(),
                'profile_name' => bx_process_output($oProfile->getDisplayName()),
                'profile_pic' => $oProfile->getPicture(),
                'reviews' => $aDataRow['reviews_num'],
                'bx_if:rating' => [
                    'condition' => $aDataRow['avg_rating'] > 0,
                    'content' => [
                        'stars' => $this->getOverallRating(0, $aDataRow['avg_rating'], false),
                    ],
                ],
                'reviews_link' => bx_append_url_params($sReviewsLinkTmpl, ['profile_id' => $aDataRow[$CNF['FIELD_REVIEWED_PROFILE']]]),
            ];
        }

        $sContent = $this->parseHtmlByName('reviewed_profiles.html',[
            'bx_repeat:profiles' => $aDataTmpl,
            'pagination' => $oPaginate->getSimplePaginate(),
        ]);

        $aMenu = [
            [
                'name' => 'sort-by-rating',
                'link' => bx_append_url_params($sPageUrl, ['order_by' => 'avg_rating']),
                'onclick' => 'return !loadDynamicBlockAutoPaginate(this, 0, '.getParam($CNF['PARAM_PER_PAGE_BROWSE']).', \'order_by=avg_rating\');',
                'title' => _t('_bx_reviews_txt_order_by_rating'),
            ],
            [
                'name' => 'sort-by-reviews',
                'link' => bx_append_url_params($sPageUrl, ['order_by' => 'reviews_num']),
                'onclick' => 'return !loadDynamicBlockAutoPaginate(this, 0, '.getParam($CNF['PARAM_PER_PAGE_BROWSE']).', \'order_by=reviews_num\');',
                'title' => _t('_bx_reviews_txt_order_by_reviews'),
            ]
        ];

        $oMenu = new BxTemplMenuInteractive(array('template' => 'menu_interactive_vertical.html', 'menu_id'=> 'bx-reviews-view-reviewed-profiles', 'menu_items' => $aMenu));
        $oMenu->setSelected('', $sOrderBy == 'reviews_num' ? 'sort-by-reviews' : 'sort-by-rating');

        return [
            'content' => $sContent,
            'menu' => $oMenu,
        ];
    }

    public function entryRating($aData)
    {
        $CNF = &$this->getModule()->_oConfig->CNF;

    	$sVotes = '';
        $oVotes = BxDolVote::getObjectInstance($CNF['OBJECT_VOTES_STARS'], $aData[$CNF['FIELD_ID']]);
        if($oVotes) {
			$sVotes = $oVotes->getElementBlock(array('show_counter' => true, 'show_legend' => true));
			if(!empty($sVotes))
				$sVotes = $this->parseHtmlByName('entry-rating.html', array(
		    		'content' => $sVotes,
		    	));
        }

    	return $sVotes;
    }
}

/** @} */
