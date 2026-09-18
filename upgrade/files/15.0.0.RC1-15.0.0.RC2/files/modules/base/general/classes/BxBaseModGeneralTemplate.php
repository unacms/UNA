<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    BaseGeneral Base classes for modules
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * Module representation.
 */
class BxBaseModGeneralTemplate extends BxDolModuleTemplate
{
    protected $MODULE;

    protected $_bIsApi;

    public $aMethodsToCallAddJsCss = array('entry', 'unit');

    public function __construct(&$oConfig, &$oDb)
    {
        parent::__construct($oConfig, $oDb);

        $this->_bIsApi = bx_is_api();
    }

    public function addLocationBase()
    {
        parent::addLocationBase();

        $this->addLocation('mod_general', BX_DIRECTORY_PATH_MODULES . 'base' . DIRECTORY_SEPARATOR . 'general' . DIRECTORY_SEPARATOR, BX_DOL_URL_MODULES . 'base/general/');
    }

    public function getJsCode($sType, $aParams = array(), $mixedWrap = true)
    {
        $sMask = "{var} {object} = new {class}({params});";
        $aMaskMarkers = array();
        if(is_array($mixedWrap)) {
            if(!empty($mixedWrap['mask']))
                $sMask = $mixedWrap['mask'];

            if(!empty($mixedWrap['mask_markers']) && is_array($mixedWrap['mask_markers']))
                $aMaskMarkers = $mixedWrap['mask_markers'];
        }

        $sJsClass = $this->_oConfig->getJsClass($sType);
        if(!empty($aParams['js_class'])) {
            $sJsClass = $aParams['js_class'];
            unset($aParams['js_class']);
        }

        $sJsObject = $this->_oConfig->getJsObject($sType);
        if(!empty($aParams['js_object'])) {
            $sJsObject = $aParams['js_object'];
            unset($aParams['js_object']);
        }

        $sBaseUri = $this->_oConfig->getBaseUri();
        $aParams = array_merge([
            'sActionUri' => $sBaseUri,
            'sActionUrl' => BX_DOL_URL_ROOT . $sBaseUri,
            'sObjName' => $sJsObject,
            'aHtmlIds' => [],
            'oRequestParams' => []
        ], $aParams);

        $sContent = false;
        /**
         * @hooks
         * @hookdef hook-system-get_js_code 'system', 'get_js_code' - hook to override an instance of JavaScript class associate with the page
         * - $unit_name - equals `system`
         * - $action - equals `get_js_code`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `mask` - [string] by ref, a mask to generate JS code, can be overridden in hook processing
         *      - `mask_markers` - [array] by ref, an array of markers to be parsed in the mask, can be overridden in hook processing
         *      - `object` - [string] by ref, a string with JS object name, can be overridden in hook processing
         *      - `class` - [string] by ref, a string with JS class name, can be overridden in hook processing
         *      - `params` - [array] by ref, an array of parameters as key&value pairs which will be passed to constructor, can be overridden in hook processing
         *      - `override_result` - [string] or [boolean] by ref, if string is returned then it will be used as resulting JS code, can be overridden in hook processing
         * @hook @ref hook-system-get_js_code
         */
        bx_alert('system', 'get_js_code', 0, 0, [
            'mask' => &$sMask,
            'mask_markers' => &$aMaskMarkers,
            'object' => &$sJsObject,
            'class' => &$sJsClass,
            'params' => &$aParams,

            'mask_ref' => &$sMask,
            'mask_markers_ref' => &$aMaskMarkers,
            'object_ref' => &$sJsObject,
            'class_ref' => &$sJsClass,
            'params_ref' => &$aParams,

            'override_result' => &$sContent,
        ]);

        if($sContent === false)
            $sContent = bx_replace_markers($sMask, array_merge([
                'var' => 'var',
                'object' => $sJsObject, 
                'class' => $sJsClass,
                'params' => json_encode($aParams)
            ], $aMaskMarkers));

        return ($mixedWrap === true || (is_array($mixedWrap) && isset($mixedWrap['wrap']) && $mixedWrap['wrap'] === true)) ? $this->_wrapInTagJsCode($sContent) : $sContent;
    }

    public function getTitleAuto($aData, $iMaxLen = 20, $sEllipsisSign = '...')
    {
        $CNF = &$this->getModule()->_oConfig->CNF;

        if(isset($aData[$CNF['FIELD_TITLE']]))
            return $this->getTitle($aData);

        $sResult = $this->getText($aData);
        if(strlen($sResult) > 0 && $iMaxLen > 0)
            $sResult = strmaxtextlen($sResult, $iMaxLen, $sEllipsisSign);

        return $sResult;
    }

    public function getTitle($aData, $mixedProcessOutput = BX_DATA_TEXT)
    {
        $CNF = &$this->getModule()->_oConfig->CNF;
        
        if(!isset($aData[$CNF['FIELD_TITLE']]))
            return '';

        $sResult = $aData[$CNF['FIELD_TITLE']];
        if($mixedProcessOutput !== false && !empty($sResult))
            $sResult = bx_process_output($sResult, (int)$mixedProcessOutput);

        return $sResult;
    }

    public function getAbstract($aData, $mixedProcessOutput = BX_DATA_TEXT)
    {
        $CNF = &$this->getModule()->_oConfig->CNF;

        if(!isset($CNF['FIELD_ABSTRACT']) || !isset($aData[$CNF['FIELD_ABSTRACT']]))
            return '';

        $sResult = $aData[$CNF['FIELD_ABSTRACT']];
        if($mixedProcessOutput !== false && !empty($sResult))
            $sResult = bx_process_output($sResult, (int)$mixedProcessOutput);

        return $sResult;
    }

    public function getText($aData, $mixedProcessOutput = BX_DATA_HTML)
    {
        $CNF = &$this->getModule()->_oConfig->CNF;
        
        if(!isset($CNF['FIELD_TEXT']) || !isset($aData[$CNF['FIELD_TEXT']]))
            return '';

        $sResult = $aData[$CNF['FIELD_TEXT']];
        if($mixedProcessOutput !== false && !empty($sResult))
            $sResult = bx_process_output($sResult, (int)$mixedProcessOutput);

        return $sResult;
    }

    public function getSummary($aData, $sTitle = '', $sText = '', $sUrl = '')
    {
        $sAbstract = $this->getAbstract($aData);
        if(!empty($sAbstract))
            return $sAbstract;

        $CNF = &$this->getModule()->_oConfig->CNF;
        if(empty($CNF['PARAM_CHARS_SUMMARY']))
            return '';

        // get summary
        $sLinkMore = ' <a title="' . bx_html_attribute(_t('_sys_read_more', $sTitle)) . '" href="' . $sUrl . '"><i class="sys-icon ellipsis-h"></i></a>';
        return strmaxtextlen($sText, (int)getParam($CNF['PARAM_CHARS_SUMMARY']), $sLinkMore);
    }

    public function getUnitLink ($aData, $aParams = [])
    {
        return $this->_oConfig->getViewEntryUrl($aData);
    }

    public function getUnitTitle ($aData, $aParams = [])
    {
        $sMethodName = 'getTitle';
        $aMethodParams = [$aData];
        if(($sKey = 'process_output') && isset($aParams[$sKey]))
            $aMethodParams[] = $aParams[$sKey];

        return call_user_func_array([$this, $sMethodName], $aMethodParams);
    }

    public function getUnitText ($aData, $aParams = [])
    {
        $sMethodName = 'getText';
        $aMethodParams = [$aData];
        if(($sKey = 'process_output') && isset($aParams[$sKey]))
            $aMethodParams[] = $aParams[$sKey];

        return call_user_func_array([$this, $sMethodName], $aMethodParams);
    }

    public function getUnitSummary ($aData, $sTitle = '', $sText = '', $sUrl = '')
    {
        return $this->getSummary($aData, $sTitle, $sText, $sUrl);
    }

    public function getProfileLink($mixedProfile)
    {
    	if(!is_array($mixedProfile))
            $mixedProfile = $this->getModule()->getProfileInfo((int)$mixedProfile);

    	return $this->getLink('link', array(
            'href' => $mixedProfile['link'],
            'title' => bx_html_attribute(!empty($mixedProfile['title']) ? $mixedProfile['title'] : $mixedProfile['name']),
            'content' => $mixedProfile['name']
    	));
    }

    public function getLink($sTemplate, $aParams)
    {
    	return $this->parseHtmlByName($sTemplate . '.html', array(
            'href' => $aParams['href'],
            'title' => $aParams['title'],
            'content' => $aParams['content']
        ));
    }
    
    function getContextAddon ($aData, $oProfile)
    {
        $CNF = &$this->getModule()->_oConfig->CNF; 
        $sUrl = 'page.php?i=' . $CNF['URI_ENTRIES_BY_CONTEXT'] . '&profile_id=' . $oProfile->id();
        $bActAsProfile = BxDolService::call($oProfile->getModule(), 'act_as_profile');
        if ($bActAsProfile)
            $sUrl = 'page.php?i=' . $CNF['URI_AUTHOR_ENTRIES'] . '&profile_id=' . $oProfile->id();
        $sUrl = BxDolPermalinks::getInstance()->permalink($sUrl);
        return _t($CNF['T']['txt_all_entries_in'], $sUrl, $oProfile->getDisplayName(), $this->getModule()->_oDb->getEntriesNumByContext($oProfile->id()));
    }
    
    function getContextDesc ($aData)
    {
        return '';
    }

    public function getTmplVarsText($aData)
    {
        $CNF = &$this->getModule()->_oConfig->CNF;

        $aVars = $aData;
        $aVars['entry_title'] = $this->getTitle($aData);
        $aVars['entry_abstract'] = $this->getAbstract($aData);
        $aVars['bx_if:show_entry_abstract'] = [
            'condition' => !empty($aVars['entry_abstract']),
            'content' => [
                'entry_abstract' => $aVars['entry_abstract']
            ]
        ];
        $aVars['entry_text'] = $this->getText($aData);
        $aVars['badges'] = $this->getModule()->serviceGetBadges($aData[$CNF['FIELD_ID']]);
        if (!empty($CNF['OBJECT_METATAGS'])) {
            $oMetatags = BxDolMetatags::getObjectInstance($CNF['OBJECT_METATAGS']);

            // keywords
            if ($oMetatags->keywordsIsEnabled()) {
                $aFields = array_merge($oMetatags->metaFields($aData, $CNF, $CNF['OBJECT_FORM_ENTRY_DISPLAY_VIEW']), array('entry_title', 'entry_text'));
                foreach ($aFields as $sField)
                    $aVars[$sField] = $oMetatags->keywordsParse($aData[$CNF['FIELD_ID']], $aVars[$sField]);
            }

            // mentions
            if ($oMetatags->mentionsIsEnabled()) {
                $aFields = array_merge($oMetatags->metaFields($aData, $CNF, $CNF['OBJECT_FORM_ENTRY_DISPLAY_VIEW'], true), array('entry_text'));
                foreach ($aFields as $sField)
                    $aVars[$sField] = $oMetatags->mentionsParse($aData[$CNF['FIELD_ID']], $aVars[$sField]);
            }
            
            // location
            $aVars['location'] = $oMetatags->locationsIsEnabled() ? $oMetatags->locationsString($aData[$CNF['FIELD_ID']]) : '';
        }

        unset($aVars['recipients']);

        return $aVars;
    }

    public function getTmplVarsAttachedLinks($aLinks)
    {
        if(empty($aLinks) || !is_array($aLinks))
            return [];

        $sStylePrefix = $this->_oConfig->getPrefix('style');
        $bAddNofollow = $this->_oDb->getParam('sys_add_nofollow') == 'on';

        $aTmplVarsLinks = [];
        foreach($aLinks as $aLink) {
            $sLink = '';

            $oEmbed = BxDolEmbed::getObjectInstance();
            if ($oEmbed) {
                $sLink = $this->parseHtmlByName('link_embed_provider.html', [
                    'style_prefix' => $sStylePrefix,
                    'embed' => $oEmbed->getLinkHTML($aLink['url'], $aLink['title']),
                ]);
            }
            else {
                $aLinkAttrs = [
                    'title' => $aLink['title']
                ];
                if(!$this->_oConfig->isEqualUrls(BX_DOL_URL_ROOT, $aLink['url'])) {
                    $aLinkAttrs['target'] = '_blank';

                    if($bAddNofollow)
                        $aLinkAttrs['rel'] = 'nofollow';
                }

                $sLinkAttrs = '';
                foreach($aLinkAttrs as $sKey => $sValue)
                    $sLinkAttrs .= ' ' . $sKey . '="' . bx_html_attribute($sValue) . '"';

                $sLink = $this->parseHtmlByName('link_embed_common.html', [
                    'bx_if:show_thumbnail' => [
                        'condition' => !empty($aLink['thumbnail']),
                        'content' => [
                            'style_prefix' => $sStylePrefix,
                            'thumbnail' => $aLink['thumbnail'],
                            'link' => !empty($aLink['url']) ? $aLink['url'] : 'javascript:void(0)',
                            'attrs' => $sLinkAttrs
                        ]
                    ],
                    'link' => !empty($aLink['url']) ? $aLink['url'] : 'javascript:void(0)',
                    'attrs' => $sLinkAttrs,
                    'content' => $aLink['title'],
                    'bx_if:show_text' => [
                        'condition' => !empty($aLink['text']),
                        'content' => [
                            'style_prefix' => $sStylePrefix,
                            'text' => $aLink['text']
                        ]
                    ]
                ]);
            }

            $aTmplVarsLinks[] = [
                'style_prefix' => $sStylePrefix,
                'link' => $sLink
            ];
        }

        return $aTmplVarsLinks;
    }

    public function entryBreadcrumb($aContentInfo, $aTmplVarsItems = array())
    {
    	$CNF = &BxDolModule::getInstance($this->MODULE)->_oConfig->CNF;
    	$sTitleHome = BxDolModule::getInstance($this->MODULE)->_aModule['title'];
    	return bx_is_api() ? ['id' => 2, 'type' => 'breadcrumb', 'data' => ['name' => BxDolModule::getInstance($this->MODULE)->_aModule['title'], 'url' => BxDolPermalinks::getInstance()->permalink($CNF['URL_HOME'])]] : $this->parseHtmlByName('breadcrumb.html', [
    		'url_home' => bx_absolute_url(BxDolPermalinks::getInstance()->permalink($CNF['URL_HOME'])),
    		'icon_home' => $CNF['ICON'],
    		'title_home' => bx_html_attribute(strip_tags(_t($sTitleHome ? $sTitleHome : '_sys_menu_item_title_system_home')), BX_ESCAPE_STR_QUOTE),
    		'bx_repeat:items' => $aTmplVarsItems
    	]);
    }

    public function entryText ($aData, $sTemplateName = 'entry-text.html')
    {
        $aVars = $this->getTmplVarsText($aData);

        if (empty($aVars['entry_text']))
            return false;
        
        return bx_is_api() ? $aVars : $this->parseHtmlByName($sTemplateName, $aVars);
    }

    public function entryLocation ($iContentId)
    {
        $CNF = &$this->getModule()->_oConfig->CNF;

        if (empty($CNF['OBJECT_METATAGS']))
            return '';

        $oMetatags = BxDolMetatags::getObjectInstance($CNF['OBJECT_METATAGS']);        

        if (!($sLocationString = $oMetatags->locationsString($iContentId)))
            return '';

        $aVars = array (
            'location' => $sLocationString
        );
        return $this->parseHtmlByName('entry-location.html', $aVars);
    }

	public function entryInfo($aData, $aValues = array())
    {
    	$CNF = $this->_oConfig->CNF;
        $aValuesDefault = array();

        if (isset($aData[$CNF['FIELD_ADDED']]))
            $aValuesDefault[] = array(
                'title' => _t('_sys_txt_field_created'),
                'value' => bx_time_js($aData[$CNF['FIELD_ADDED']]),
            );

        if (isset($aData[$CNF['FIELD_CHANGED']]))
            $aValuesDefault[] = array(
                'title' => _t('_sys_txt_field_updated'),
                'value' => bx_time_js($aData[$CNF['FIELD_CHANGED']]),
            );

        $aValues = array_merge($aValuesDefault, $aValues);

    	return $this->parseHtmlByName('entry-info.html', array(
    		'bx_repeat:info' => $aValues,
    	));
    }
    
    public function getFavoriteList($oProfile, $iStart, $iPerPage, $aParams)
    {
        $CNF = $this->_oConfig->CNF;
        
        $bEmptyMessage = false;
        if(isset($aParams['empty_message'])) {
            $bEmptyMessage = (bool)$aParams['empty_message'];
            unset($aParams['empty_message']);
        }
        
        $oFavorite = BxDolFavorite::getObjectInstance($CNF['OBJECT_FAVORITES'], 0, true);
        $aListsData = $oFavorite->getQueryObject()->getList(array('type' => 'active', 'author_id' => $oProfile->id(), 'need_default' => true, 'start' => $iStart, 'limit' => $iPerPage + 1));
        $iNum = count($aListsData);
        if ($iNum > $iPerPage)
            $aListsData = array_slice($aListsData, 0, $iPerPage);
        
        $oPrivacy = BxDolPrivacy::getObjectInstance($CNF['OBJECT_PRIVACY_LIST_VIEW']);
        $aListsTmpl = array();
        foreach($aListsData as $iListId => $sName) {
            $aParams['list_id'] = $iListId;
            if ($oPrivacy->check($iListId) || $iListId == 0){
                $aTmp = $this->getModule()->_serviceBrowse ('favorite', array_merge(array('user' => $oProfile->id()), $aParams), BX_DB_PADDING_DEF, $bEmptyMessage, false);
                if ($aTmp && $aTmp['content']){
                    $aListsTmpl[] = array(
                        'title' => $sName, 
                        'content_url' => $this->getModule()->_getFavoriteListUrl($iListId, $oProfile->id()),
                        'content' => $aTmp['content']
                    );
                }
            }
            else{
                $aListsTmpl[] = array(
                    'title' => 'private list', 
                    'content_url' => 'javascript:',
                    'content' => ''
                );
            }
        } 
        
        $oPaginate = new BxTemplPaginate(array(
            'on_change_page' => "return !loadDynamicBlockAutoPaginate(this, '{start}', '{per_page}', " . bx_js_string(json_encode($aParams)) . ", 'list_start', 'list_per_page');",
            'num' => $iNum,
            'per_page' => $iPerPage,
            'start' => $iStart,
        ));
        if (count($aListsTmpl) > 0)
            return $this->parseHtmlByName('favorite-lists.html', array('bx_repeat:items' => $aListsTmpl)) . $oPaginate->getSimplePaginate() . $oFavorite->getJsScript();
        
        return false;
    }
    
    public function getFavoritesListInfo($aList, $oProfile)
    {
        $CNF = $this->_oConfig->CNF;

        $iListId = !empty($aList['id']) ? (int)$aList['id'] : 0;

        $oFavorite = BxDolFavorite::getObjectInstance($CNF['OBJECT_FAVORITES'], 0, true);
        $aListInfo = $oFavorite->getQueryObject()->getList(array('type' => 'info', 'list_id' => $iListId, 'author_id' => $oProfile->id()));

        $oPrivacy = BxDolPrivacy::getObjectInstance($CNF['OBJECT_PRIVACY_LIST_VIEW']);
        $sTitle = "";
        if ($aListInfo['allow_view_favorite_list_to'] < 0){
            $oProfileContext = BxDolProfile::getInstance(abs($aListInfo['allow_view_favorite_list_to']));
            $sTitle = $oProfileContext->getDisplayName();
        }
        else{
            if (empty($aListInfo['allow_view_favorite_list_to']))
                $aListInfo['allow_view_favorite_list_to'] = 3;
            $aPrivaciInfo = $oPrivacy->getGroupsBy(array('type'=>'id' , 'id'=> $aListInfo['allow_view_favorite_list_to']));
            $sTitle = _t($aPrivaciInfo['title']);
        }
        
        $aListsTmpl = array();
        
        if (!empty($aListInfo['created'])){
            $aListsTmpl[] = array('title' => _t('_sys_form_favorite_list_title_created'), 'value' => bx_time_js($aListInfo['created']));
        }
        
        $aListsTmpl = array_merge($aListsTmpl, 
            array(
                array('title' => _t('_sys_form_favorite_list_title_updated'), 'value' => bx_time_js($aListInfo['updated'])),
                array('title' => _t('_sys_form_favorite_list_title_count'), 'value' => $aListInfo['count']),
                array('title' => _t('_sys_form_favorite_list_title_visibility'), 'value' => $sTitle)
            )
        );
        
        return $this->parseHtmlByName('favorite-list-info.html', array('bx_repeat:items' => $aListsTmpl, 'author' => $oProfile->getUnit()));
    }

    public function getBrowsingFilters($aParams)
    {
        if(empty($aParams['mode']))
            return '';

        $mixedContent = $this->_getBrowsingFiltersContent($aParams);
        if($this->_bIsApi)
            return $mixedContent;

        if(empty($mixedContent))
            return '';

        $sPopupId = $this->_oConfig->getHtmlIds('popup_bfilters_' . $aParams['mode']);
        $sPopupContent = $this->parseHtmlByName('browsing_filters.html', [
            'content' => $mixedContent
    	]);

    	return BxTemplFunctions::getInstance()->transBox($sPopupId, $sPopupContent, true);
    }

    function entryAllActions($sActions)
    {
        if(empty($sActions))
            return '';

        return $this->parseHtmlByName('entry-all-actions.html', array (
            'actions' => $sActions
        ));
    }

    function entryAttachments ($aData, $aParams = array())
    {
        return $this->entryAttachmentsByStorage($this->getModule()->_oConfig->CNF['OBJECT_STORAGE'], $aData, $aParams);
    }

    function entryAttachmentsByStorage ($mixedStorage, $aData, $aParams = array())
    {
        if(!is_array($mixedStorage))
            $mixedStorage = array($mixedStorage);

        $aResult = array();
        
        if (bx_is_api()){
            foreach($mixedStorage as $sStorage) {
                $aAttachments = $this->getAttachments($sStorage, $aData, $aParams);
                if ($aAttachments){
                    foreach($aAttachments as $aAttachment) {
                        $aItem = [
                            'file_name' => $aAttachment['file_name'],
                            'mime_type' => $aAttachment['mime_type'],
                            'ext' => $aAttachment['ext'],
                            'type' => 'other',
                            'size' => $aAttachment['size'],
                            'url' => $aAttachment['bx_if:not_image']['content']['url_original']
                        ];
                        if ($aAttachment['bx_if:image']['condition'] == 1){
                            $aItem['type'] = 'image';
                            $aItem['data'] = bx_api_get_image($sStorage, $aAttachment['id']);
                        }
                        if ($aAttachment['bx_if:video']['condition'] == 1){
                            $aItem['type'] = 'video';
                            $aItem['data'] = bx_api_get_image($sStorage, $aAttachment['id']);
                        }
                        if ($aAttachment['bx_if:sound']['condition'] == 1){
                            $aItem['type'] = 'sound';
                            $aItem['data'] = bx_api_get_image($sStorage, $aAttachment['id']);
                        }
                        
                        $aResult[] = $aItem;
                    }
                }
            }
            return [bx_api_get_block('entity_attachments', $aResult)];
        }
        
        foreach($mixedStorage as $sStorage) {
            $aAttachments = $this->getAttachments($sStorage, $aData, $aParams);
            if(empty($aAttachments) || !is_array($aAttachments))
                continue;

            $aResult = array_merge($aResult, $aAttachments);
        }

        
        
        if(empty($aResult) || !is_array($aResult))
            return '';

        $this->addCss(BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'flickity/|flickity.css');
    	$this->addJs(array(
            'flickity/flickity.pkgd.min.js',
        ));

    	$s = $this->addJs('pdfjs/pdf.min.mjs.js', true);
    	return $s . $this->parseHtmlByName('attachments.html', array(
            'bx_repeat:attachments' => $aResult,
            'pdfjs_worker_url' => $this->getJsUrl('pdfjs/pdf.worker.min.mjs.js'),
        ));
    }
    
    function entryContext ($aData, $iProfileId = false, $sFuncContextDesc = 'getContextDesc', $sTemplateName = 'context.html', $sFuncContextAddon = 'getContextAddon')
    {
        $CNF = &$this->getModule()->_oConfig->CNF;

        $iContextId = $aData[$CNF['FIELD_ALLOW_VIEW_TO']];
        if ($iContextId >= 0)
            return '';
        
        $iProfileId = - $iContextId;

        $oProfile = BxDolProfile::getInstance($iProfileId);
        if (!$oProfile) 
            $oProfile = BxDolProfileUndefined::getInstance();

        if (!$oProfile)
            return '';

        $sName = $oProfile->getDisplayName();
        $sAddon = $sFuncContextAddon ? $this->$sFuncContextAddon($aData, $oProfile) : '';
        $aVars = array (
            'author_url' => $oProfile->getUrl(),
            'author_thumb_url' => $oProfile->getThumb(),
            'author_unit' => $oProfile->getUnit(0, array('template' => 'unit_wo_info')),
            'author_title' => $sName,
            'author_title_attr' => bx_html_attribute($sName),
            'author_desc' => $sFuncContextDesc ? $this->$sFuncContextDesc($aData) : '',
            'bx_if:addon' => array (
                'condition' => (bool)$sAddon,
                'content' => array (
                    'content' => $sAddon,
                ),
            ),
        );
        return $this->parseHtmlByName($sTemplateName, $aVars);
    }

    protected function getAttachmentsImagesTranscoders ($sStorage = '')
    {
        $CNF = &$this->getModule()->_oConfig->CNF;

        $oTranscoder = BxDolTranscoderImage::getObjectInstance($CNF['OBJECT_IMAGES_TRANSCODER_PREVIEW']);
        $oTranscoderView = !empty($CNF['OBJECT_IMAGES_TRANSCODER_PICTURE']) ? BxDolTranscoderImage::getObjectInstance($CNF['OBJECT_IMAGES_TRANSCODER_PICTURE']) : null;

        return array($oTranscoder, $oTranscoderView);
    }

    protected function getAttachmentsVideoTranscoders ($sStorage = '')
    {
        $CNF = &$this->getModule()->_oConfig->CNF;

        if (isset($CNF['OBJECT_VIDEOS_TRANSCODERS']) && $CNF['OBJECT_VIDEOS_TRANSCODERS'])
            return array (
                'poster' => BxDolTranscoderImage::getObjectInstance($CNF['OBJECT_VIDEOS_TRANSCODERS']['poster']),
                'mp4' => BxDolTranscoderImage::getObjectInstance($CNF['OBJECT_VIDEOS_TRANSCODERS']['mp4']),
                'mp4_hd' => BxDolTranscoderImage::getObjectInstance($CNF['OBJECT_VIDEOS_TRANSCODERS']['mp4_hd']),
            );

        return false;
    }
    
    public function getAttachmentsData ($sStorage, $aData, $aParams = array())
    {
        return $this->getAttachments($sStorage, $aData, $aParams );
    }
    
    protected function getAttachments ($sStorage, $aData, $aParams = array())
    {
        $CNF = &$this->getModule()->_oConfig->CNF;

        $oStorage = BxDolStorage::getObjectInstance($sStorage);

        list($oTranscoder, $oTranscoderPreview) = $this->getAttachmentsImagesTranscoders($sStorage);
        $oTranscoderSound = isset($CNF['OBJECT_SOUNDS_TRANSCODER']) && $CNF['OBJECT_SOUNDS_TRANSCODER'] ? BxDolTranscoderImage::getObjectInstance($CNF['OBJECT_SOUNDS_TRANSCODER']) : null;
        $aTranscodersVideo = $this->getAttachmentsVideoTranscoders($sStorage);

        $aGhostFiles = $oStorage->getGhosts ($this->getModule()->serviceGetContentOwnerProfileId($aData[$CNF['FIELD_ID']]), $aData[$CNF['FIELD_ID']]);
        if (!$aGhostFiles)
            return false;

        $sFilterField = isset($aParams['filter_field']) ? $aParams['filter_field'] : $CNF['FIELD_THUMB'];
		if(!empty($sFilterField) && isset($aData[$sFilterField]))
	        foreach ($aGhostFiles as $k => $a) {
	            // don't show thumbnail in attachments
	            if ($a['id'] == $aData[$sFilterField])
	                unset($aGhostFiles[$k]);
	        }

        if(!$aGhostFiles)
            return false;

        $aAttachmnts = array();
        foreach ($aGhostFiles as $k => $a) {
            $isImage = !empty($CNF['OBJECT_STORAGE_PHOTOS']) && $sStorage == $CNF['OBJECT_STORAGE_PHOTOS'] && $oTranscoder && (0 === strncmp('image/', $a['mime_type'], 6)) && $oTranscoder->isMimeTypeSupported($a['mime_type']); // preview for images, transcoder object for preview must be defined
            $isVideo = !empty($CNF['OBJECT_STORAGE_VIDEOS']) && $sStorage == $CNF['OBJECT_STORAGE_VIDEOS'] && $aTranscodersVideo && (0 === strncmp('video/', $a['mime_type'], 6)) && $aTranscodersVideo['poster']->isMimeTypeSupported($a['mime_type']); // preview for videos, transcoder object for video must be defined
            $isSound = !empty($CNF['OBJECT_STORAGE_SOUNDS']) && $sStorage == $CNF['OBJECT_STORAGE_SOUNDS'] && $oTranscoderSound && (0 === strncmp('audio/', $a['mime_type'], 6)) && $oTranscoderSound->isMimeTypeSupported($a['mime_type']); // preview for sounds, transcoder object for sounds must be defined
            $sUrlOriginal = $oStorage->getFileUrlById($a['id']);
            $sImgPopupId = 'bx-messages-atachment-popup-' . $a['id'];

            // images are displayed with preview and popup upon clicking
            $a['bx_if:image'] = array (
                'condition' => $isImage,
                'content' => array (
                    'url_original' => $isImage && $oTranscoderPreview ? $oTranscoderPreview->getFileUrl($a['id']) : $sUrlOriginal,
                    'attr_file_name' => bx_html_attribute($a['file_name']),
                    'popup_id' => $sImgPopupId,
                    'url_preview' => $isImage ? $oTranscoder->getFileUrl($a['id']) : '',
                    'popup' =>  BxTemplFunctions::getInstance()->transBox($sImgPopupId, '<img src="' . $sUrlOriginal . '" />', true, true),
                ),
            );

            $sVideoUrlHd = '';
            if($isVideo) {
                $sVideoUrl = $oStorage->getFileUrlById($a['id']);
                $aVideoFile = $oStorage->getFile($a['id']);

                if (!empty($aVideoFile['dimensions']) && $aTranscodersVideo['mp4_hd']->isProcessHD($aVideoFile['dimensions']))
                    $sVideoUrlHd = $aTranscodersVideo['mp4_hd']->getFileUrl($a['id']);
            }

            // videos are displayed inline
            $a['bx_if:video'] = array (
                'condition' => $isVideo,
                'content' => array (
                    'video' => $isVideo && $aTranscodersVideo ? BxTemplFunctions::getInstance()->videoPlayer(
                        $aTranscodersVideo['poster']->getFileUrl($a['id']), 
                        $aTranscodersVideo['mp4']->getFileUrl($a['id']), 
                        $sVideoUrlHd,
                        false, ''
                    ) : '',
                ),
            );

            // sounds are displayed inline
            $a['bx_if:sound'] = array (
                'condition' => $isSound,
                'content' => array (
                    'sound' => $isSound && $oTranscoderSound && ($oPlayer = BxDolPlayer::getObjectInstance()) ? $this->parseHtmlByName('attachment_sound.html', array(
                        'file_name' => $a['file_name'],
                        'file_url' => $oTranscoderSound ? $oTranscoderSound->getFileUrl($a['id']) : '',
                        'player' => $oTranscoderSound && $oTranscoderSound->isFileReady($a['id']) ? 
                            $oPlayer->getCodeAudio (BX_PLAYER_STANDARD, array(
                                'mp3' => $oTranscoderSound->getFileUrl($a['id']),
                            )) : _t('_sys_txt_err_sound_not_transcoded_yet'),
                    )) : '',
                ),
            );

            // non-images are displayed as text links to original file
            $a['bx_if:not_image'] = array (
                'condition' => !$isImage && !$isVideo && !$isSound,
                'content' => array (
                    'url_original' => $sUrlOriginal,
                    'attr_file_name' => bx_html_attribute($a['file_name']),
                    'file_name' => bx_process_output($a['file_name']),
                ),
            );

            $aAttachmnts[] = $a;
        }

        return $aAttachmnts;
    }

    public function getAttachLinkItem($iUserId, $mixedLink, $aParams = [])
    {
        $aLink = is_array($mixedLink) ? $mixedLink : $this->_oDb->getLinksBy(['type' => 'id', 'id' => (int)$mixedLink, 'profile_id' => $iUserId]);
        if(empty($aLink) || !is_array($aLink))
            return '';

        $sStylePrefix = $aParams['style_prefix'] ?? '';
        $sClass = $sStylePrefix . '-al-item';

        $oEmbed = BxDolEmbed::getObjectInstance();
        $bEmbed = $oEmbed !== false;

        $sThumbnail = '';
        $aLinkAttrs = [];
        if(!$bEmbed) {
            $aLinkAttrs = [
            	'title' => bx_html_attribute($aLink['title'])
            ];
            if(!$this->_oConfig->isEqualUrls(BX_DOL_URL_ROOT, $aLink['url'])) {
                $aLinkAttrs['target'] = '_blank';
    
                if($this->_oDb->getParam('sys_add_nofollow') == 'on')
            	    $aLinkAttrs['rel'] = 'nofollow';
            }

            if((int)$aLink['media_id'] != 0 && ($aParams['transcoder'] ??= ''))
                $sThumbnail = BxDolTranscoderImage::getObjectInstance($aParams['transcoder'])->getFileUrl($aLink['media_id']);
        }
        else
            $sClass .= ' embed';

        return $this->parseHtmlByName('attach_link_item.html', [
            'html_id' => ($aParams['html_id_link_item'] ?? '') . $aLink['id'],
            'style_prefix' => $sStylePrefix,
            'class' => $sClass,
            'js_object' => $aParams['js_object'] ?? '',
            'id' => $aLink['id'],
            'bx_if:show_embed_outer' => [
                'condition' => $bEmbed,
                'content' => [
                    'style_prefix' => $sStylePrefix,
                    'embed' => $bEmbed ? $oEmbed->getLinkHTML($aLink['url'], $aLink['title'], 300) : '',
                ]
            ],
            'bx_if:show_embed_inner' => [
                'condition' => !$bEmbed,
                'content' => [
                    'style_prefix' => $sStylePrefix,
                    'bx_if:show_thumbnail' => [
                        'condition' => !empty($sThumbnail),
                        'content' => [
                            'style_prefix' => $sStylePrefix,
                            'thumbnail' => $sThumbnail
                        ]
                    ],
                    'url' => $aLink['url'],
                    'link' => $this->parseLink($aLink['url'], $aLink['title'], $aLinkAttrs)
                ]
            ],
        ]);
    }

    public function embedVideo($iFileId)
    {
        $CNF = $this->getModule()->_oConfig->CNF;
        list($oPlayer, $oStorage, $aContentInfo, $a) = $this->_embedChecks('OBJECT_STORAGE_VIDEOS', $iFileId);

        // check if file is really video
        $aTranscodersVideo = $this->getAttachmentsVideoTranscoders();        
        if (!$aTranscodersVideo || (0 !== strncmp('video/', $a['mime_type'], 6)) || !$aTranscodersVideo['poster']->isMimeTypeSupported($a['mime_type'])) {
            $this->displayErrorOccured('', BX_PAGE_EMBED);
            exit;
        }

        // check HD video version
        $sVideoUrlHd = '';
        $sVideoUrl = $oStorage->getFileUrlById($a['id']);
        $aVideoFile = $oStorage->getFile($a['id']);

        if (!empty($aVideoFile['dimensions']) && $aTranscodersVideo['mp4_hd']->isProcessHD($aVideoFile['dimensions']))
            $sVideoUrlHd = $aTranscodersVideo['mp4_hd']->getFileUrl($a['id']);

        // generate player code
        $sCode = $oPlayer->getCodeVideo (BX_PLAYER_EMBED, array(
            'poster' => $aTranscodersVideo['poster']->getFileUrl($a['id']),
            'mp4' => array(
                'sd' => $aTranscodersVideo['mp4']->getFileUrl($a['id']), 
                'hd' => $sVideoUrlHd
            ),
        ));

        // display page
        $oTemplate = BxDolTemplate::getInstance();
        $oTemplate->setPageNameIndex (BX_PAGE_EMBED);
        $oTemplate->setPageHeader ($a['file_name']);
        $oTemplate->setPageContent ('page_main_code', $sCode);
        $oTemplate->getPageCode();
        exit;
    }

    public function embedSound($iFileId)
    {
        $CNF = $this->getModule()->_oConfig->CNF;
        list($oPlayer, $oStorage, $aContentInfo, $a) = $this->_embedChecks('OBJECT_STORAGE_SOUNDS', $iFileId);

        // check if file is really audio
        $oTranscoderSound = isset($CNF['OBJECT_SOUNDS_TRANSCODER']) ? BxDolTranscoderImage::getObjectInstance($CNF['OBJECT_SOUNDS_TRANSCODER']) : null;
        if (!$oTranscoderSound || (0 !== strncmp('audio/', $a['mime_type'], 6)) || !$oTranscoderSound->isMimeTypeSupported($a['mime_type'])) {
            $this->displayErrorOccured('', BX_PAGE_EMBED);
            exit;
        }

        if (!$oTranscoderSound->isFileReady($a['id'])) {
            $oTranscoderSound->getFileUrl($a['id']); // queue for encoding
            $this->displayMsg('_sys_txt_err_sound_not_transcoded_yet', true, BX_PAGE_EMBED);
            exit;
        }

        // generate player code
        $sCode = $oPlayer->getCodeAudio (BX_PLAYER_EMBED, array(
            'mp3' => $oTranscoderSound->getFileUrl($a['id']),
        ));

        // display page
        $oTemplate = BxDolTemplate::getInstance();
        $oTemplate->setPageNameIndex (BX_PAGE_EMBED);
        $oTemplate->setPageHeader ($a['file_name']);
        $oTemplate->setPageContent ('page_main_code', $sCode);
        $oTemplate->getPageCode();
        exit;
    }

    /**
     * Polls
     */
    public function entryPolls($aData)
    {
        $CNF = &$this->getModule()->_oConfig->CNF;
        
        $aPolls = $this->_oDb->getPolls(array(
            'type' => 'content_id', 
            'content_id' => $aData[$CNF['FIELD_ID']], 
        ));
        if(empty($aPolls) || !is_array($aPolls))
            return;

        $iProfileId = bx_get_logged_profile_id();

        $sPolls = '';
        foreach($aPolls as $aPoll)
            $sPolls .= $this->getPollItem($aPoll, $iProfileId);

        if(empty($sPolls))
            return '';

        $this->_addCssJsPolls();
        return $this->getJsCode('poll') . $this->parseHtmlByName('poll_items.html', array(
            'polls' => $sPolls
        ));
    }

    public function entryPollAnswers($aPoll, $bDynamic = false)
    {
        $sContent = $this->_getPollAnswers($aPoll, ['dynamic' => $bDynamic]);
        if(empty($sContent))
            return '';

        return [
            'content' => $sContent,
            'menu' => $this->_getPollBlockMenu($aPoll, 'answers')
        ]; 
    }

    public function entryPollResults($aPoll, $bDynamic = false)
    {
        $mixedContent = $this->_getPollResults($aPoll, ['dynamic' => $bDynamic]);
        if($this->_bIsApi)
            return $mixedContent;

        if(empty($mixedContent))
            return '';

        return [
            'content' => $mixedContent,
            'menu' => $this->_getPollBlockMenu($aPoll, 'results')
        ];
    }

    public function getPollForm($iParentCid = 0)
    {
        $aForm = $this->getModule()->getPollForm($iParentCid);

        return $this->parseHtmlByName('poll_form.html', [
            'js_object' => $this->_oConfig->getJsObjectPoll($iParentCid),
            'form_id' => $aForm['form_id'],
            'form' => $aForm['form'],
        ]);
    }
    
    public function getPollField($iContentId = 0, $iProfileId = 0)
    {
        if(empty($iProfileId))
            $iProfileId = bx_get_logged_profile_id();

        $aPolls = [];
        if(!empty($iContentId))
            $aPolls = array_merge($aPolls, $this->_oDb->getPolls([
                'type' => 'content_id', 
                'content_id' => $iContentId, 
            ]));

        $aPolls = array_merge($aPolls, $this->_oDb->getPolls([
            'type' => 'author_id', 
            'author_id' => $iProfileId, 
            'unused' => true
        ]));

        $mixedPolls = $this->_bIsApi ? [] : '';
        foreach($aPolls as $aPoll) {
            $mixedPoll = $this->getPollItem($aPoll, $iProfileId, [
                'parent_cid' => $iContentId,
                'manage' => true
            ]);

            if($this->_bIsApi)
                $mixedPolls[] = $mixedPoll;
            else
                $mixedPolls .= $mixedPoll;
        }

        return $this->_bIsApi ? $mixedPolls : $this->parseHtmlByName('poll_form_field.html', [
            'html_id' => $this->_oConfig->getHtmlIds('add_poll_form_field'),
            'polls' => $mixedPolls
        ]);
    }

    public function getPollItem($mixedPoll, $iProfileId = 0, $aParams = [])
    {
        $oModule = $this->getModule();
        $CNF = &$oModule->_oConfig->CNF;

        $aPoll = is_array($mixedPoll) ? $mixedPoll : $this->_oDb->getPolls(array('type' => 'id', 'id' => (int)$mixedPoll));
        if(empty($aPoll) || !is_array($aPoll))
            return $this->_bIsApi ? [] : '';

        $iPollId = (int)$aPoll[$CNF['FIELD_POLL_ID']];
        $sPollText = bx_process_output($aPoll[$CNF['FIELD_POLL_TEXT']], BX_DATA_TEXT);

        if($this->_bIsApi) {
            $bPerformed = $oModule->isPollPerformed($iPollId, $iProfileId);

            return [
                'id' => $iPollId,
                'title' => $sPollText,
                'object' => $CNF['OBJECT_VOTES_POLL_ANSWERS'],
                'subentries' => $this->_getPollAnswers($aPoll),
                'results' => $this->_getPollResults($aPoll),
                'is_performed' => $bPerformed,
                'value' => $bPerformed ? $oModule->getPollPerformedValue($iPollId) : 0
            ];
        }

        $bDynamic = isset($aParams['dynamic']) && $aParams['dynamic'] === true;
        $bManage = isset($aParams['manage']) && $aParams['manage'] === true;
        $bSwitchMenu = isset($aParams['switch_menu']) ? (bool)$aParams['switch_menu'] : true;
        $bForceDisplayAnswers = isset($aParams['force_display_answers']) && (bool)$aParams['force_display_answers'] === true;
        $iParentСid = isset($aParams['parent_cid']) ? (int)$aParams['parent_cid'] : false;

        $sPollView = !$bForceDisplayAnswers && $oModule->isPollPerformed($iPollId, $iProfileId) ? 'results' : 'answers';

        $sMethod = '_getPoll' . ucfirst($sPollView);
        if(!method_exists($this, $sMethod))
            return '';

        $mixedMenu = '';
        if($bSwitchMenu)
            $mixedMenu = $this->_getPollBlockMenu($aPoll, $sPollView, [
                'parent_cid' => $iParentСid,
                'template' => 'menu_interactive.html'
            ]);

        $sJsObject = $iParentСid !== false ? $this->_oConfig->getJsObjectPoll($iParentСid) : $this->_oConfig->getJsObject('poll');
        return $this->parseHtmlByName('poll_item.html', array(
            'html_id' => $this->_oConfig->getHtmlIds('poll') . $iPollId,
            'bx_if:show_input_hidden' => array(
                'condition' => $bManage,
                'content' => array(
                    'name' => $CNF['FIELD_POLL'],
                    'id' => $iPollId
                )
            ),
            'action_menu' => !empty($mixedMenu) ? $mixedMenu->getCode() : '',
            'bx_if:show_action_embed' => array(
                'condition' => $bManage,
                'content' => array(
                    'js_object' => $sJsObject,
                    'id' => $iPollId
                )
            ),
            'bx_if:show_action_delete' => array(
                'condition' => $bManage,
                'content' => array(
                    'js_object' => $sJsObject,
                    'id' => $iPollId,
                    'editor_id' => isset($CNF['FIELD_TEXT_ID']) ? $CNF['FIELD_TEXT_ID'] : ''
                )
            ),
            'text' => $sPollText,
            'content' => $this->$sMethod($aPoll, [
                'dynamic' => $bDynamic,
                'parent_cid' => $iParentСid
            ])
        ));
    }

    public function embedPollItem($mixedPoll, $aParams = array())
    {
        $CNF = &$this->getModule()->_oConfig->CNF;

        $sHeader = '';
        $sContent = $this->getPollItem($mixedPoll, 0, $aParams);
        if(!empty($sContent)) {
            $aPoll = is_array($mixedPoll) ? $mixedPoll : $this->_oDb->getPolls(array('type' => 'id', 'id' => (int)$mixedPoll));

            $sHeader = strmaxtextlen($aPoll[$CNF['FIELD_POLL_TEXT']], 32, '...');
            $sContent = $this->getJsCode('poll') . $sContent;
        }

        $this->_addCssJsPolls();

        $oTemplate = BxDolTemplate::getInstance();
        $oTemplate->addCssStyle($CNF['STYLES_POLLS_EMBED_CLASS'], $CNF['STYLES_POLLS_EMBED_CONTENT']);
        $oTemplate->setPageNameIndex(BX_PAGE_EMBED);
        $oTemplate->setPageHeader($sHeader);
        $oTemplate->setPageContent('page_main_code', $sContent);
        $oTemplate->getPageCode();
        exit;
    }

    public function embedPollItems($mixedContentInfo, $aParams = array())
    {
        $CNF = &$this->getModule()->_oConfig->CNF;

        $aContentInfo = is_array($mixedContentInfo) ? $mixedContentInfo : $this->_oDb->getContentInfoById((int)$mixedContentInfo);
        if(empty($aContentInfo) || !is_array($aContentInfo))
            return;

        $iContentId = (int)$aContentInfo[$CNF['FIELD_ID']];

        $aPolls = $this->_oDb->getPolls(array('type' => 'content_id', 'content_id' => $iContentId));
        if(empty($aPolls) || !is_array($aPolls))
            return;

        $iPolls = 0;
        $sContent = '';
        foreach($aPolls as $aPoll) {
            $sPoll = $this->getPollItem($aPoll, 0, $aParams);
            if(empty($sPoll))
                continue;

            $sContent .= $sPoll;
            $iPolls += 1;
        }

        $sJsObjectType = 'poll';
        if(!empty($sContent) && isset($aParams['showcase']) && (bool)$aParams['showcase'] === true) {
            $this->addJs(array('flickity/flickity.pkgd.min.js'));
            $this->addCss(BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'flickity/|flickity.css');

            $sContent = $this->parseHtmlByName('poll_items_showcase.html', [
                'js_object' => $this->_oConfig->getJsObject($sJsObjectType),
                'html_id' => $this->_oConfig->getHtmlIds('polls_showcase') . $iContentId,
                'type' => $iPolls == 1 ? 'single' : 'multiple',
                'polls' => $sContent
            ]);
        }

        $sHeader = '';
        if(!empty($sContent)) {
            $sHeader = $iPolls == 1 ? array_shift($aPolls)[$CNF['FIELD_POLL_TEXT']] : _t('_polls_from', $aContentInfo[$CNF['FIELD_TITLE']]);
            $sHeader = strmaxtextlen($sHeader, 32, '...');

            $sContent = $this->getJsCode($sJsObjectType) . $sContent;
        }

        $this->_addCssJsPolls();

        $oTemplate = BxDolTemplate::getInstance();
        $oTemplate->addCssStyle($CNF['STYLES_POLLS_EMBED_CLASS'], $CNF['STYLES_POLLS_EMBED_CONTENT']);
        $oTemplate->setPageNameIndex(BX_PAGE_EMBED);
        $oTemplate->setPageHeader($sHeader);
        $oTemplate->setPageContent('page_main_code', $sContent);
        $oTemplate->getPageCode();
        exit;
    }
    
    protected function _addCssJsPolls($bDynamic = false)
    {
        $sInclude = '';
        $sInclude .= $this->addJs(['modules/base/general/js/|polls.js'], $bDynamic);
        $sInclude .= $this->addCss(['polls.css'], $bDynamic);
        return $bDynamic ? $sInclude : '';
    }
    
    protected function _getPollAnswers($aPoll, $aParams = [])
    {
        $CNF = &$this->getModule()->_oConfig->CNF;

        $bDynamic = isset($aParams['dynamic']) && $aParams['dynamic'] === true;
        $iParentСid = isset($aParams['parent_cid']) && $aParams['parent_cid'] !== false ? (int)$aParams['parent_cid'] : false;

        $aAnswers = $this->_oDb->getPollAnswers(['type' => 'poll_id', 'poll_id' => $aPoll[$CNF['FIELD_POLL_ID']]]);
        if($this->_bIsApi)
            return $aAnswers;

        if(empty($aAnswers) || !is_array($aAnswers))
            return '';

        $aTmplVarsAnswers = [];
        foreach($aAnswers as $aAnswer) {
            $oVotes = BxDolVote::getObjectInstance($CNF['OBJECT_VOTES_POLL_ANSWERS'], $aAnswer['id']);
            if(!$oVotes)
                continue;

            $aTmplVarsAnswers[] = [
                'answer' => $oVotes->getElementBlock([
                    'dynamic_mode' => $bDynamic,
                    'form_mode' => $iParentСid !== false
                ])
            ];
        }

    	return $this->parseHtmlByName('poll_item_answers.html', [
            'html_id' => $this->_oConfig->getHtmlIds('poll_content') . $aPoll[$CNF['FIELD_POLL_ID']],
            'bx_repeat:answers' => $aTmplVarsAnswers
        ]);
    }

    protected function _getPollResults($aPoll, $aParams = [])
    {
        $CNF = &$this->getModule()->_oConfig->CNF;

        $bDynamic = isset($aParams['dynamic']) && $aParams['dynamic'] === true;
        $iParentСid = isset($aParams['parent_cid']) && $aParams['parent_cid'] !== false ? (int)$aParams['parent_cid'] : false;

        $aAnswers = $this->_oDb->getPollAnswers(['type' => 'poll_id', 'poll_id' => $aPoll[$CNF['FIELD_POLL_ID']]]);
        if(empty($aAnswers) || !is_array($aAnswers))
            return $this->_bIsApi ? [] : '';

        $iTotal = 0;
        foreach($aAnswers as $aAnswer)
            $iTotal += $aAnswer['votes'];

        $aTmplVarsAnswers = [];
        foreach($aAnswers as $aAnswer) {
            $oVotes = BxDolVote::getObjectInstance($CNF['OBJECT_VOTES_POLL_ANSWERS'], $aAnswer['id']);
            if(!$oVotes)
                continue;

            $fPercent = $iTotal > 0 ? 100 * (float)$aAnswer['votes']/$iTotal : 0;
            $aTmplVarsAnswers[] = array_merge([
                'title' => bx_process_output($aAnswer['title']),
                'width' => (int)round($fPercent) . '%',
                'percent' => _t($CNF['T']['txt_poll_answer_vote_percent'], $iTotal > 0 ? round($fPercent, 2) : 0),
            ], ($this->_bIsApi ? [
                'votes' => $oVotes->getCounterAPI([
                    'show_counter_empty' => true, 
                    'show_counter_in_brackets' => false
                ]),
            ] : [
                'votes' => $oVotes->getCounter([
                    'show_counter_empty' => true, 
                    'show_counter_in_brackets' => false, 
                    'dynamic_mode' => $bDynamic, 
                    'form_mode' => $iParentСid !== false
                ]),
            ]));
        }

        return $this->_bIsApi ? $aTmplVarsAnswers : $this->parseHtmlByName('poll_item_results.html', array(
            'html_id' => $this->_oConfig->getHtmlIds('poll_content') . $aPoll[$CNF['FIELD_POLL_ID']],
            'bx_repeat:answers' => $aTmplVarsAnswers,
        ));
    }

    protected function _getPollBlockMenu($aPoll, $sSelected = '', $aParams = [])
    {
        $CNF = &$this->_oConfig->CNF;

        $sJsObject = isset($aParams['parent_cid']) && $aParams['parent_cid'] !== false ? $this->_oConfig->getJsObjectPoll((int)$aParams['parent_cid']) : $this->_oConfig->getJsObject('poll');
        $iPollId = $aPoll[$CNF['FIELD_POLL_ID']];

        $aViews = [
            'answers' => true, 
            'results' => $CNF['PARAM_POLL_HIDDEN_RESULTS'] === false || $this->getModule()->isPollPerformed($iPollId)
        ];

        $aMenu = array();
        foreach($aViews as $sView => $bActive) {
            if(!$bActive) 
                continue;

            $sId = $this->_oConfig->getHtmlIds('poll_view_link_' . $sView) . $iPollId;
            if(!empty($sSelected) && $sSelected == $sView)
                $sSelected = $sId;

            $aMenu[] = array(
                'id' => $sId, 
                'name' => $sId, 
                'class' => '', 
                'link' => 'javascript:void(0)', 
                'onclick' => 'javascript:' . $sJsObject . '.changePollView(this, \'' . $sView . '\', ' . $iPollId . ')', 
                'target' => '_self', 
                'title_attr' => _t($CNF['T']['txt_poll_menu_view_' . $sView]), 
                'title' => $this->parseIcon($CNF['ICON_POLLS_' . strtoupper($sView)])
            );
        }

        if(count($aMenu) <= 1)
            return '';

        $oMenu = new BxTemplMenuInteractive([
            'template' => !empty($aParams['template']) ? $aParams['template'] : 'menu_interactive_vertical.html', 
            'menu_id' => $this->_oConfig->getHtmlIds('poll_view_menu') . '-' . time() . rand(0, PHP_INT_MAX), 
            'menu_items' => $aMenu
        ]);

        if(!empty($sSelected))
            $oMenu->setSelected('', $sSelected);

        return $oMenu;
    }
    
    protected function _embedChecks($sStorageKey, $iFileId)
    {
        // general checks
        $oPlayer = BxDolPlayer::getObjectInstance();
        $CNF = $this->getModule()->_oConfig->CNF;
        $sStorage = isset($CNF[$sStorageKey]) ? $CNF[$sStorageKey] : false;
        if (!$oPlayer || !$sStorage || !($oStorage = BxDolStorage::getObjectInstance($sStorage))) {
            $this->displayErrorOccured('', BX_PAGE_EMBED);
            exit;
        }

        // privacy check
        $aGhost = $oStorage->getGhost($iFileId);
        $aContentInfo = $aGhost && $aGhost['content_id'] ? $this->getModule()->_oDb->getContentInfoById($aGhost['content_id']) : false;
        if (!$aGhost || ($aGhost['content_id'] && !$aContentInfo)) {
            $this->displayPageNotFound('', BX_PAGE_EMBED);
            exit;
        }
            
        if (!$aGhost['content_id']) {
            // if file is not associated with content yet, then only admin and owner can view it
            if (!isAdmin() && CHECK_ACTION_RESULT_ALLOWED !== $this->getModule()->checkAllowedEditAnyEntry() && $aGhost['profile_id'] != bx_get_logged_profile_id()) {
                $this->displayAccessDenied('', BX_PAGE_EMBED);
                exit;
            }
        }
        else {
            // if file is associated with content, then check entry privacy
            if (CHECK_ACTION_RESULT_ALLOWED !== $this->getModule()->checkAllowedView($aContentInfo)) {
                $this->displayAccessDenied('', BX_PAGE_EMBED);
                exit;
            }
        }

        // get file info
        if (!($a = $oStorage->getFile($iFileId))) {
            $this->displayPageNotFound('', BX_PAGE_EMBED);
            exit;
        }

        return array($oPlayer, $oStorage, $aContentInfo, $a);
    }

    function _getImageSettings($sField, $sSettings, $sUsage = '')
    {
        $sCoverSettings = '';
        if(($aCoverData = json_decode($sSettings, true)) && is_array($aCoverData))
            $sCoverSettings = 'background-position: ' . $aCoverData['x'] . '% ' . $aCoverData['y'] . '%';

        return $sCoverSettings;
    }

    function _prepareImage($aData, $sUniqId, $aUploaders, $sStorage, $sField, $bAllowTweak, $bAllowMultiple = false)
    {
        $oUploader = null;
        $sJsName = $sJsCode = '';
        foreach ($aUploaders as $sUploaderObject) {
            $oUploader = BxDolUploader::getObjectInstance($sUploaderObject, $sStorage, $sUniqId, $this);
            if (!$oUploader)
                continue;
            $sGhostTemplate = '{file_id}';

            $sJsCode .= $oUploader->getUploaderJs($sGhostTemplate, $bAllowMultiple, array_merge($oUploader->getUploaderJsParams(), [
                'latest' => 1,
                'content_id' => $aData['id'],
                'storage_private' => '0',
                'is_init_ghosts' => 0,
                'is_init_reordering' => 0
            ]));
            $sJsName = $oUploader->getNameJsInstanceUploader();
        }

        $this->addJs(['BxDolUploader.js']);
        $this->addJsTranslation(['_sys_uploader_image_reposition_info']);        
        return $this->parseHtmlByName('image_tweak.html', [
            'id' => $aData['id'],
            'js_object' => $sJsName,
            'unique_id' => $sUniqId,
            'id' => $aData['id'],
            'allow_tweak' => $bAllowTweak,
            'image_exists' => !$sField || $aData[$sField] == 0 ? 'bx-image-edit-buttons-no-image' : '',
            'field' => $sField,
            'action_url' => BX_DOL_URL_ROOT . $this->_oConfig->getBaseUri(),
            'uploader' => !$oUploader ? '' : $oUploader->getUploaderButton([
                'content_id' => $aData['id'],
                'storage_private' => '0',
                'btn_class' => '',
                'button_title' => '',
                'attrs' => "class='hidden'"
            ]),
            'uploader_js' => $sJsCode,
        ]);
    }

    public function addCssJs()
    {
        $this->addCss('main.css');
    }
}

/** @} */
