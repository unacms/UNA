<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Market Market
 * @ingroup     UnaModules
 *
 * @{
 */

/*
 * Module representation.
 */
class BxMarketTemplate extends BxBaseModTextTemplate
{
    public function __construct(&$oConfig, &$oDb)
    {
        $this->MODULE = 'bx_market';

        parent::__construct($oConfig, $oDb);
    }

    public function entryRating($aData)
    {
        $CNF = &$this->getModule()->_oConfig->CNF;

        $sVotes = '';
        $oVotes = BxDolVote::getObjectInstance($CNF['OBJECT_VOTES'], $aData['id']);
        if($oVotes) {
            $sVotes = $oVotes->getElementBlock(array('show_counter' => true, 'show_legend' => true));
            if(!empty($sVotes))
                $sVotes = $this->parseHtmlByName('entry-rating.html', array(
                'content' => $sVotes,
            ));
        }

        return $sVotes; 
    }

    public function getTmplVarsText($aData)
    {
        $oModule = $this->getModule();
        $CNF = &$oModule->_oConfig->CNF;

        $aVars = parent::getTmplVarsText($aData);
        
        $bIcon = getParam($CNF['PARAM_USE_ICON']) == 'on';
        if($this->_bIsApi) {
            if($bIcon)
                $aVars['icon'] = bx_api_get_image($CNF['OBJECT_STORAGE'], (int)$aData[$CNF['FIELD_THUMB']]);

            return $aVars;
        }

        //--- Process RAW Cover
        $bCoverRaw = !empty($CNF['FIELD_COVER_RAW']) && !empty($aData[$CNF['FIELD_COVER_RAW']]);

        $aVars['bx_if:show_image_raw'] = [
            'condition' => $bCoverRaw,
            'content' => [
                'image_raw' => $aData[$CNF['FIELD_COVER_RAW']]
            ]
        ];

        //--- Process Cover
        $bIsAllowEditCover = $oModule->checkAllowedEdit($aData) === CHECK_ACTION_RESULT_ALLOWED && $oModule->checkAllowedSetCover() === CHECK_ACTION_RESULT_ALLOWED;
        $bShowImage = $aVars['bx_if:show_image']['condition'];

        $aVars['bx_if:show_entry_cover'] = [
            'condition' => !$bCoverRaw && ($bShowImage || $bIsAllowEditCover),
            'content' => array_merge([
                'bx_if:show_image' => [
                    'condition' => $bShowImage,
                    'content' => [true]
                ],
                'bx_if:show_image_empty' => [
                    'condition' => !$bShowImage,
                    'content' => [true]
                ]
            ], $aVars['bx_if:show_image']['content'])
        ];

        //--- Process Icon (Thumb)
        $bIsAllowEditIcon = $bIsAllowEditCover;

        $sIcon = '';
        if($bIcon) {
            $mixedIcon = $oModule->getEntryImageData($aData, 'FIELD_THUMB', ['OBJECT_IMAGES_TRANSCODER_THUMB', 'OBJECT_IMAGES_TRANSCODER_GALLERY']);
            if($mixedIcon !== false) {
                if(!empty($mixedIcon['object']))
                    $o = BxDolStorage::getObjectInstance($mixedIcon['object']);
                else if(!empty($mixedIcon['transcoder']))
                    $o = BxDolTranscoder::getObjectInstance($mixedIcon['transcoder']);

                if($o)
                    $sIcon = $o->getFileUrlById($mixedIcon['id']);
            }
        }

        $sIconUniqId = genRndPwd(8, false);
        $sIconTweak = '';
        if($bIsAllowEditIcon)
            $sIconTweak = $this->_prepareImage($aData, $sIconUniqId, $CNF['OBJECT_UPLOADERS'], $CNF['OBJECT_STORAGE'], $CNF['FIELD_THUMB'], false);

        $aVars = array_merge($aVars, [
            'bx_if:show_entry_icon' => [
                'condition' => $bIcon,
                'content' => [
                    'bx_if:show_icon' => [
                        'condition' => !empty($sIcon),
                        'content' => [true]
                    ],
                    'bx_if:show_icon_empty' => [
                        'condition' => empty($sIcon),
                        'content' => [true]
                    ],
                    'unique_id' => $sIconUniqId,
                    'entry_icon' => $sIcon,
                    'icon' => $CNF['ICON'],
                    'icon_tweak' => $sIconTweak
                ]
            ]
        ]);

        //--- Process Screenshots
        $sScreenshots = $this->getScreenshots($aData);
        $bScreenshots = !empty($sScreenshots);
        if($bScreenshots) {
            $this->addCss(BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'flickity/|flickity.css');
            $this->addJs('flickity/flickity.pkgd.min.js');
        }

        $aVars['bx_if:show_screenshots'] = array(
            'condition' => $bScreenshots,
            'content' => array(
                'screenshots' => $sScreenshots
            )
        );
        
        return $aVars;
    }

    public function getScreenshots($aData)
    {
    	$oModule = $this->getModule();

    	$CNF = &$oModule->_oConfig->CNF;
    	$aPhotos = $oModule->serviceGetScreenshots($aData[$CNF['FIELD_ID']]);
        
        if (bx_is_api()){
            return $aPhotos;
        }
        
        if(empty($aPhotos) || !is_array($aPhotos))
            return '';

        return $this->parseHtmlByName('entry-screenshots.html', array(
            'bx_repeat:items' => $aPhotos
    	));
    }
    
    public function getAuthorAddon ($aData, $oProfile)
    {
        $aAccount = $oProfile->getAccountObject()->getInfo();

        $sContent = $this->parseHtmlByName('entry-author.html', array(
    		'joined' => bx_time_js($aAccount['added']),
	    	'last_active' => bx_time_js($aAccount['logged']),
	    	'installs' => '?',
    	));

    	return $sContent . parent::getAuthorAddon ($aData, $oProfile);
    }

    public function getGhostTemplateFileOptions($sField, $aFile, $aVersions)
    {
    	$bField = !empty($aFile) && is_array($aFile) && isset($aFile[$sField]);
    	
    	$aTmplVarsVersions = array();
    	foreach ($aVersions as $aVersion) {
    		if($aVersion['type'] != 'version' || empty($aVersion['version']))
    			continue;

			$aTmplVarsVersions[] = array(
				'value' => $aVersion['version'],
				'title' =>  $aVersion['version'],
				'bx_if:selected' => array(
					'condition' => $bField && $aFile[$sField] == $aVersion['version'],
					'content' => array()
				)
			);
    	}

    	return $this->parseHtmlByName('form_ghost_template_file_options.html', array(
    		'bx_repeat:versions' => $aTmplVarsVersions
    	));    	
    }

    protected function getUnit ($aData, $aParams = [])
    {
        $bTmplVarsSectionAuthor = true;
        $bTmplVarsSectionPricing = false;
        $bTmplVarsSectionVoting = true;

        $oModule = $this->getModule();
    	$CNF = &$oModule->_oConfig->CNF;

    	$aUnit = parent::getUnit($aData, $aParams);
        $oPayment = BxDolPayments::getInstance();
        $oPermalinks = BxDolPermalinks::getInstance();

        $bEmbed = isset($aParams['embed']) && $aParams['embed'] === true;

        $iAuthorId = (int)$aData[$CNF['FIELD_AUTHOR']];
        list($sAuthorName, $sAuthorUrl, $sAuthorIcon, $sAuthorUnit, $sAuthorUnitShort) = $oModule->getUserInfo($iAuthorId);
        $sAuthorCurrencySign = $oPayment->getCurrencySign($iAuthorId);

        $aTmplVarsSectionAuthor = array();
        if($bTmplVarsSectionAuthor) {
            //--- Author Info
            $bAuthorIcon = !empty($sAuthorIcon);
            $sAuthorName = $this->parseHtmlByName('author_link.html', array(
                'href' => $sAuthorUrl,
                'title' => bx_html_attribute($sAuthorName),
                'content' => $sAuthorName,
                'bx_if:show_account' => array(
                    'condition' => false,
                    'content' => array()
                )
            ));

            //--- Actions
            $sActions = '';
            if(!$bEmbed && ($oActions = BxDolMenu::getObjectInstance($CNF['OBJECT_MENU_ACTIONS_SNIPPET'])) !== false) {
                $oActions->setContentId($aData[$CNF['FIELD_ID']]);
                $sActions = $oActions->getCode();
            }

            $sDate = $this->parseHtmlByName('snippet-date.html', array(
                'date' => bx_time_js($aData[$CNF['FIELD_ADDED']])
            ));

            $aTmplVarsSectionAuthor = array(
                'actions' => $sActions,
                'author_unit' => $sAuthorUnitShort,
                'author_width_date' => _t('_bx_market_txt_author_added_product', $sAuthorName, $sDate),
            );
        }

        //--- Main Info
        $sUrl = bx_absolute_url($oPermalinks->permalink('page.php?i=' . $CNF['URI_VIEW_ENTRY'] . '&id=' . $aData[$CNF['FIELD_ID']]));
        $sLinkMore = ' <a title="' . bx_html_attribute(_t('_sys_read_more', $aData[$CNF['FIELD_TITLE']])) . '" href="' . $sUrl . '"><i class="sys-icon ellipsis-h"></i></a>';
        $sSummary = strmaxtextlen($aData[$CNF['FIELD_TEXT']], (int)getParam($CNF['PARAM_CHARS_SUMMARY']), $sLinkMore);
        $sSummaryPlain = BxTemplFunctions::getInstance()->getStringWithLimitedLength(strip_tags($sSummary), (int)getParam($CNF['PARAM_CHARS_SUMMARY_PLAIN']));
        

        //--- Icon Info
        $sIconUrl = '';
        $bIcon = getParam($CNF['PARAM_USE_ICON']) == 'on';
        if($bIcon && !empty($CNF['FIELD_THUMB']) && $aData[$CNF['FIELD_THUMB']]) {
            $iThumb = (int)$aData[$CNF['FIELD_THUMB']];

            $oStorage = BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE']);
            $aThumb = $oStorage->getFile($iThumb);

            if(!empty($aThumb) && is_array($aThumb)) {
                if(strpos($aThumb['mime_type'], 'svg') !== false)
                    $sIconUrl = $oStorage->getFileUrlById($iThumb);

                if(empty($sIconUrl) && ($oImagesTranscoder = BxDolTranscoderImage::getObjectInstance($CNF['OBJECT_IMAGES_TRANSCODER_ICON'])) !== false)
                    $sIconUrl = $oImagesTranscoder->getFileUrl($iThumb);

                if(empty($sIconUrl) && ($oImagesTranscoder = BxDolTranscoderImage::getObjectInstance($CNF['OBJECT_IMAGES_TRANSCODER_THUMB'])) !== false)
                    $sIconUrl = $oImagesTranscoder->getFileUrl($iThumb);
            }
        }

        //--- Cover Info
        $bCoverRaw = !empty($CNF['FIELD_COVER_RAW']) && !empty($aData[$CNF['FIELD_COVER_RAW']]);

        $sCoverUrl = '';
        if(!$bCoverRaw && !empty($CNF['FIELD_COVER']) && $aData[$CNF['FIELD_COVER']]) {
            $oImagesTranscoder = BxDolTranscoderImage::getObjectInstance($CNF['OBJECT_IMAGES_TRANSCODER_GALLERY']);
            if($oImagesTranscoder)
                $sCoverUrl = $oImagesTranscoder->getFileUrl($aData[$CNF['FIELD_COVER']]);

            if(empty($sCoverUrl)) {
                $oImagesTranscoder = BxDolTranscoderImage::getObjectInstance($CNF['OBJECT_IMAGES_TRANSCODER_COVER']);
                if($oImagesTranscoder)
                    $sCoverUrl = $oImagesTranscoder->getFileUrl($aData[$CNF['FIELD_COVER']]);
            }
        }

        $aTmplVarsSectionPricing = array();
        if($bTmplVarsSectionPricing) {
            //--- Price Single
            $bTmplVarsSingle = (float)$aData[$CNF['FIELD_PRICE_SINGLE']] != 0;
            $aTmplVarsSingle = array();
            if($bTmplVarsSingle) {
                $aJsSingle = $oPayment->getAddToCartJs($iAuthorId, $this->_oConfig->getName(), $aData[$CNF['FIELD_ID']], 1, true);
                if(!empty($aJsSingle) && is_array($aJsSingle)) {
                    list($sJsCode, $sSingleOnclick) = $aJsSingle;

                    $aTmplVarsSingle = array(
                        'price_single_onclick' => $sSingleOnclick,
                        'price_single' => _t('_bx_market_txt_price_single', $sAuthorCurrencySign, $aData[$CNF['FIELD_PRICE_SINGLE']])
                    );
                }
                else 
                    $bTmplVarsSingle = false;
            }

            //--- Price Recurring
            $bTmplVarsRecurring = !$oPayment->isCreditsOnly() && (float)$aData[$CNF['FIELD_PRICE_RECURRING']] != 0;
            $aTmplVarsRecurring = array();
            if($bTmplVarsRecurring) {
                $aJsRecurring = $oPayment->getSubscribeJs($iAuthorId, '', $this->_oConfig->getName(), $aData[$CNF['FIELD_ID']], 1);
                if(!empty($aJsRecurring) && is_array($aJsRecurring)) {
                    list($sJsCode, $sRecurringOnclick) = $aJsRecurring;

                    $aTmplVarsRecurring = array(
                        'price_recurring_onclick' => $sRecurringOnclick,
                        'price_recurring' => _t('_bx_market_txt_price_recurring', $sAuthorCurrencySign, $aData[$CNF['FIELD_PRICE_RECURRING']], _t($CNF['T']['txt_per_' . $aData[$CNF['FIELD_DURATION_RECURRING']] . '_short']))
                    );
                }
                else 
                    $bTmplVarsRecurring = false;
            }

            $aTmplVarsSectionPricing = array(
                'bx_if:show_single' => array(
                    'condition' => $bTmplVarsSingle,
                    'content' => $aTmplVarsSingle
                ),
                'bx_if:show_recurring' => array(
                    'condition' => $bTmplVarsRecurring,
                    'content' => $aTmplVarsRecurring
                ),
                'bx_if:show_free' => array(
                    'condition' => !$bTmplVarsSingle && !$bTmplVarsRecurring,
                    'content' => array(
                        'price_free_href' => $oPermalinks->permalink('page.php?i=' . $CNF['URI_DOWNLOAD_ENTRY'] . '&id=' . $aData[$CNF['FIELD_ID']])
                    )
                )
            );
        }

        $aTmplVarsSectionVoting = array();
        if($bTmplVarsSectionVoting) {
            $sVoting = '';
            if(($oVoting = BxDolVote::getObjectInstance($CNF['OBJECT_VOTES'], $aData[$CNF['FIELD_ID']])) !== false)
                $sVoting = $oVoting->getElementBlock([
                    'show_counter' => false,
                    'read_only' => $bEmbed
                ]);

            $sPricing = "";
            if((float)$aData[$CNF['FIELD_PRICE_RECURRING']] != 0) {
                $sDuration = 'txt_per_' . $aData[$CNF['FIELD_DURATION_RECURRING']] . '_short';
                $sDuration = _t(!empty($CNF['T'][$sDuration]) ? $CNF['T'][$sDuration] : '_bx_market_txt_per_' . $aData[$CNF['FIELD_DURATION_RECURRING']] . '_short');

                $sPricing = _t('_bx_market_txt_price_recurring_short', $sAuthorCurrencySign, $aData[$CNF['FIELD_PRICE_RECURRING']], $sDuration);
            }

            if(empty($sPricing) && (float)$aData[$CNF['FIELD_PRICE_SINGLE']] != 0)
                $sPricing = _t('_bx_market_txt_price_single_short', $sAuthorCurrencySign, $aData[$CNF['FIELD_PRICE_SINGLE']]);

            if(empty($sPricing))
                 $sPricing = _t('_bx_market_txt_price_free');

            $aTmplVarsSectionVoting = array(
                'voting' => $sVoting,
                'pricing' => $sPricing
            );
        }

    	$aUnit = array_merge($aUnit, array(
    	    'bx_if:show_section_author' => array(
    	        'condition' => $bTmplVarsSectionAuthor,
    	        'content' => $aTmplVarsSectionAuthor
    	    ),
            'bx_if:show_icon' => array (
                'condition' => $sIconUrl,
                'content' => array(
                    'content_url' => $sUrl,
                    'icon_url' => $sIconUrl,
                ),
            ),
            'bx_if:show_icon_empty' => array (
                'condition' => $bIcon && !$sIconUrl,
                'content' => array(
                    'content_url' => $sUrl,
                    'icon' => $CNF['ICON']
                ),
            ),
            'bx_if:show_cover_raw' => array (
                'condition' => $bCoverRaw,
                'content' => array (
                    'summary_attr' => bx_html_attribute($sSummaryPlain),
                    'content_url' => $sUrl,
                    'cover_raw' => $aData[$CNF['FIELD_COVER_RAW']],
                ),
            ),
            'bx_if:show_cover' => array (
                'condition' => $sCoverUrl,
                'content' => array (
                    'summary_attr' => bx_html_attribute($sSummaryPlain),
                    'content_url' => $sUrl,
                    'cover_url' => $sCoverUrl,
                    'strecher' => str_repeat('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ', 40),
                ),
            ),
            'bx_if:show_cover_empty' => array (
                'condition' => !$bCoverRaw && !$sCoverUrl,
                'content' => array (
                    'summary_plain' => $sSummaryPlain,
                    'strecher' => mb_strlen($sSummaryPlain) > 240 ? '' : str_repeat('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ', round((240 - mb_strlen($sSummaryPlain)) / 6)),
                ),
            ),
            'author_name' => $sAuthorName,
            'content_url' => $sUrl,
    		'bx_if:show_section_pricing' => array(
                'condition' => $bTmplVarsSectionPricing,
                'content' => $aTmplVarsSectionPricing
            ),
            'bx_if:show_section_voting' => array(
            	'condition' => $bTmplVarsSectionVoting,
                'content' => $aTmplVarsSectionVoting
            )
    	));

    	return $aUnit;
    }

    protected function getAttachments($sStorage, $aData, $aParams = array())
    {
        $mixedAttachments = parent::getAttachments($sStorage, $aData, $aParams);
        if(empty($mixedAttachments) || !is_array($mixedAttachments))
            return $mixedAttachments;

        $aAttachments = [];
        foreach($mixedAttachments as $aAttachment)
            $aAttachments[(int)$aAttachment['id']] = $aAttachment;       

        $aFiles = $this->_oDb->getFile(['type' => 'content_id_key_file_id', 'content_id' => $aData['id']]);

        $aResults = [];
        $sCaptionType = "";
        foreach($aFiles as $iAttachmentId => $aFile) {
            $aAttachments[$iAttachmentId]['class'] = (int)$aData['package'] == $iAttachmentId ? ' bx-market-attachment-main' : '';
            $aAttachments[$iAttachmentId]['bx_if:main'] = [
                'condition' => (int)$aData['package'] == $iAttachmentId,
                'content' => []
            ];

            $bSeparatorNeeded = false;
            if ($aFiles[$iAttachmentId]['type'] != $sCaptionType){
                $bSeparatorNeeded = true;
                $sCaptionType = $aFiles[$iAttachmentId]['type'];
            }

            if ((int)$aData['package'] == $iAttachmentId){
                $bSeparatorNeeded = true;
                $sCaptionType = 'latest';
            }

            $bAttachment = !empty($aFiles[$iAttachmentId]);
            $aAttachments[$iAttachmentId]['bx_if:not_image']['content'] = array_merge($aAttachments[$iAttachmentId]['bx_if:not_image']['content'], [
                'file_type' => $bAttachment ? _t('_bx_market_form_entry_input_files_type_' . $aFiles[$iAttachmentId]['type']) : '',
                'file_name_attr' => bx_html_attribute($aAttachments[$iAttachmentId]['file_name']),
                'bx_if:show_version' => [
                    'condition' => $bAttachment && $aFiles[$iAttachmentId]['type'] == BX_MARKET_FILE_TYPE_VERSION,
                    'content' => [
                        'file_version' => $bAttachment ? $aFiles[$iAttachmentId]['version'] : ''
                    ]
                ],
                'bx_if:show_update' => [
                    'condition' => $bAttachment && $aFiles[$iAttachmentId]['type'] == BX_MARKET_FILE_TYPE_UPDATE,
                    'content' => [
                        'file_version_from_to' => $bAttachment ? _t('_bx_market_form_entry_input_files_version_from_x_to_y', $aFiles[$iAttachmentId]['version'], $aFiles[$iAttachmentId]['version_to']) : ''
                    ]
                ]
            ]);
            $aAttachments[$iAttachmentId]['bx_if:show_separator'] = [
                'condition' => $bSeparatorNeeded, 
                'content' => [
                    'type' => _t('_bx_market_form_entry_input_files_version_caption_' . $sCaptionType)
                ]
            ];

            $aFiles[$iAttachmentId] = $aAttachments[$iAttachmentId];
            $aResults[$iAttachmentId] = $aAttachments[$iAttachmentId];
        }

        return array_intersect_key($aFiles, $aResults);
    }

    protected function getAttachmentsImagesTranscoders ($sStorage = '')
    {
        $CNF = &$this->getModule()->_oConfig->CNF;

        $oTranscoder = BxDolTranscoderImage::getObjectInstance($CNF['OBJECT_IMAGES_TRANSCODER_PREVIEW']);
        $oTranscoderPreview = isset($CNF['OBJECT_IMAGES_TRANSCODER_PICTURE']) && $CNF['OBJECT_IMAGES_TRANSCODER_PICTURE'] ? BxDolTranscoderImage::getObjectInstance($CNF['OBJECT_IMAGES_TRANSCODER_PICTURE']) : null;

        return array($oTranscoder, $oTranscoderPreview);
    }

    protected function _getHeaderImageParams()
    {
        $CNF = &$this->_oConfig->CNF;

        return array_merge(parent::_getHeaderImageParams(), [
            'field' => isset($CNF['FIELD_COVER']) ? $CNF['FIELD_COVER'] : false,
            'field_position' => isset($CNF['FIELD_COVER_POSITION']) ? $CNF['FIELD_COVER_POSITION'] : false,
        ]);
    }

    protected function _getHeaderImage($aData)
    {
        return $this->getModule()->getEntryImageData($aData, 'FIELD_COVER');
    }

    protected function _getImagesEditApi($aData)
    {
        $oModule = $this->getModule();
        $CNF = &$oModule->_oConfig->CNF;

        // The same rule as for Header Image and Icon uploaders on the site's view product page.
        if($oModule->checkAllowedEdit($aData) !== CHECK_ACTION_RESULT_ALLOWED || $oModule->checkAllowedSetCover() !== CHECK_ACTION_RESULT_ALLOWED)
            return [];

        $aResult = [
            'cover' => $this->_getImageEditApi($CNF['FIELD_COVER']),
        ];

        if(getParam($CNF['PARAM_USE_ICON']) == 'on')
            $aResult['picture'] = $this->_getImageEditApi($CNF['FIELD_THUMB']);

        return $aResult;
    }
    
    function _prepareImage($aData, $sUniqId, $sUploader, $sStorage, $sField, $bAllowTweak, $bAllowMultiple = false)
    {
        $CNF = &$this->_oConfig->CNF;

        if(in_array($sField, [$CNF['FIELD_THUMB'], $CNF['FIELD_COVER']]))
            $bAllowMultiple = true;

        return parent::_prepareImage($aData, $sUniqId, $sUploader, $sStorage, $sField, $bAllowTweak, $bAllowMultiple);
    }
    
    public function entryAttachments ($aData, $aParams = [])
    {
        $mixedResult = parent::entryAttachments($aData, $aParams);
        if(!$this->_bIsApi || !is_array($mixedResult) || !isset($mixedResult[0]['data']))
            return $mixedResult;

        $CNF = &$this->getModule()->_oConfig->CNF;

        $oStorage = BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE']);
        if(!$oStorage)
            return $mixedResult;
        $mixedResult[0]['data'] = [];
        
        $aPhotos = $this->_oDb->getPhoto(['type' => 'content_id', 'content_id' => $aData[$CNF['FIELD_ID']], 'except' => [$aData[$CNF['FIELD_THUMB']], $aData[$CNF['FIELD_COVER']]]]);
        if(empty($aPhotos) || !is_array($aPhotos))
            return $mixedResult;

        $aItems = [];
        foreach($aPhotos as $aPhoto) {
            $aFile = $oStorage->getFile($aPhoto['file_id']);
            if(empty($aFile))
                continue;

            $aItems[] = [
                'file_name' => $aFile['file_name'],
                'mime_type' => $aFile['mime_type'],
                'ext' => $aFile['ext'],
                'type' => 'image',
                'size' => $aFile['size'],
                'url' => $oStorage->getFileUrlById($aPhoto['file_id']),
                'data' => bx_api_get_image($CNF['OBJECT_STORAGE'], $aPhoto['file_id']),
            ];
        }

        $mixedResult[0]['data'] = $aItems;

        return $mixedResult;
    }
}

/** @} */
