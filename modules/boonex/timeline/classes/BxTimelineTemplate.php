<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Timeline Timeline
 * @ingroup     UnaModules
 *
 * @{
 */

class BxTimelineTemplate extends BxBaseModNotificationsTemplate
{
    protected static $_aMemoryCacheItems;
    protected static $_aMemoryCacheItemsData;
    protected static $_sMemoryCacheItemsKeyMask;

    protected static $_sTmplContentItemItem;
    protected static $_sTmplContentItemOutline;
    protected static $_sTmplContentItemOutlineSample;
    protected static $_sTmplContentItemTimeline;
    protected static $_sTmplContentItemTimelineSample;
    protected static $_sTmplContentItemSearch;
    protected static $_sTmplContentTypePost;
    protected static $_sTmplContentTypeRepost;

    protected $_aAclId2Name;

    function __construct(&$oConfig, &$oDb)
    {
        parent::__construct($oConfig, $oDb);

        $this->_aAclId2Name = array();

        bx_import('BxTemplAcl');
        $aAclLevels = BxDolAcl::getInstance()->getMemberships(false, false, false);
        foreach($aAclLevels as $iAclId => $sAclName)
            $this->_aAclId2Name[$iAclId] = str_replace('_', '-', str_replace('_adm_prm_txt_level_', '', $sAclName));
    }

    public function init()
    {
        parent::init();

        self::$_aMemoryCacheItems = array();
        self::$_aMemoryCacheItemsData = array();
        self::$_sMemoryCacheItemsKeyMask = "%s_%d";
    }

    public function getAddedCss($sType = '', $bDynamic = false)
    {
        $aCss = array();
        switch($sType) {
            case 'view':
                $aCss = [
                    BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'flickity/|flickity.css',
                    'cmts.css',
                    'view.css',
                    'view-media-tablet.css',
                    'view-media-desktop.css',
                    'repost.css',
                    'polls.css'
                ];

                if($this->_oConfig->isJumpTo()) {
                    list($aCssCalendar, $aJsCalendar) = BxBaseFormView::getCssJsCalendar();
                    $aCss = array_merge($aCss, $aCssCalendar);
                }
                break;

            case 'post':
                $aCss = [
                    'post.css',
                    'polls.css'
                ];
                break;
        }

        $mixedResult = $this->addCss($aCss, $bDynamic);
        if($bDynamic)
            return $mixedResult; 
    }

    public function getAddedJs($sType = '', $bDynamic = false)
    {
        $aJs = array(
            'autosize.min.js',
            'jquery.anim.js',
            'main.js',
        );
        switch($sType) {
            case 'view':
                $aJs = array_merge($aJs, array(
                    'masonry.pkgd.min.js',
                    'flickity/flickity.pkgd.min.js',
                    'embedly-player.min.js',
                    'BxDolCmts.js',
                    'view.js',
                    'repost.js',
                    'modules/base/general/js/|polls.js',
                    'polls.js'
                ));

                if ($this->_oConfig->isJumpTo()) {
                    list($aCssCalendar, $aJsCalendar) = BxBaseFormView::getCssJsCalendar();
                    $aJs = array_merge($aJs, $aJsCalendar);
                }
                break;

            case 'view_filters':
                $aJs = array_merge($aJs, array(
                    'view_filters.js',
                ));
                break;

            case 'post':
                $aJs = array_merge($aJs, array(
                    'jquery.form.min.js',
                    'post.js',
                    'modules/base/general/js/|polls.js',
                    'polls.js'
                ));
                break;
        }

        $mixedResult = $this->addJs($aJs, $bDynamic);
        if($bDynamic)
            return $mixedResult; 
    }

    public function getJsCodeView($aParams = [], $bWrap = true, $bDynamic = false)
    {
        $bInfiniteScroll = $this->_oConfig->isInfiniteScroll();
        if($bInfiniteScroll && isset($aParams['oRequestParams']['per_page']))
            $aParams['oRequestParams']['per_page'] = $this->_oConfig->getPerPreload();

        $aParams = array_merge([
            'sObjNameMenuFeeds' => $this->_oConfig->getObject('menu_feeds'),
            'bInfScroll' => $bInfiniteScroll,
            'iInfScrollAutoPreloads' => $this->_oConfig->getAutoPreloads(),
            'iLimitAttachLinks' => $this->_oConfig->getLimitAttachLinks(),
            'sLimitAttachLinksErr' => bx_js_string(_t('_bx_timeline_txt_err_attach_links')),
            'oAttachedLinks' => []
        ], $aParams);

        return parent::getJsCode('view', $aParams, $bWrap, $bDynamic);
    }
    
    public function getJsCodeViewFilters($aParams = [], $bWrap = true, $bDynamic = false)
    {
        $aParams = array_merge([
            'sObjNameMenuFeeds' => $this->_oConfig->getObject('menu_feeds')
        ], $aParams);

        return parent::getJsCode('view_filters', $aParams, $bWrap, $bDynamic);
    }
    
    public function getJsCodePost($iOwnerId, $aParams = [], $bWrap = true, $bDynamic = false)
    {
        $aGeneralParams = [];
        $aRequestParams = $aParams;
        if(isset($aParams['gparams'], $aParams['rparams'])) {
            $aGeneralParams = $aParams['gparams'];
            $aRequestParams = $aParams['rparams'];
        }

        return $this->getJsCode('post', array_merge([
            'bAutoAttach' => $this->_oConfig->isEditorAutoAttach(),
            'bMediaPriority' => $this->_oConfig->isMediaPriority(),
            'iLimitAttachLinks' => $this->_oConfig->getLimitAttachLinks(),
            'sLimitAttachLinksErr' => bx_js_string(_t('_bx_timeline_txt_err_attach_links')),
            'oAttachedLinks' => $this->_oDb->getLinksBy([
                'type' => 'unused', 
                'profile_id' => $this->getModule()->getUserId(), 
                'short' => true
            ]),
            'sVideosAutoplay' => $this->_oConfig->getVideosAutoplay(),
            'oRequestParams' => array_merge([
                'type' => isset($aRequestParams['type']) ? $aRequestParams['type'] : BX_TIMELINE_TYPE_DEFAULT, 
                'owner_id' => $iOwnerId
            ], $aRequestParams)
        ], $aGeneralParams), $bWrap, $bDynamic);
    }

    public function getJsCode($sType, $aParams = [], $bWrap = true, $bDynamic = false)
    {
        $aParams = array_merge([
            'sEditorId' => $this->_oConfig->getEditorId(),
        ], $aParams);
        
        return parent::getJsCode($sType, $aParams, $bWrap, $bDynamic);
    }
    
    
    public function getPostBlock($iOwnerId, $aParams = array())
    {
        $CNF = &$this->_oConfig->CNF;
        $oModule = $this->getModule();

        $aResult = $oModule->getFormPost($aParams);

        if($this->_oConfig->isEditorAutoattach() && !empty($aResult['form_object'])) {
            $aUploadersInfo = $aResult['form_object']->getUploadersInfo($CNF['FIELD_PHOTO']);
            if(!empty($aUploadersInfo) && is_array($aUploadersInfo))
                $aParams = [
                    'gparams' => ['sAutoUploader' => $aUploadersInfo['name'], 'sAutoUploaderId' => $aUploadersInfo['id']],
                    'rparams' => $aParams
                ];
        }

        if($this->_bIsApi) {
            $aType2Uri = [
                '' => 'get_block_post_account',
                'account' => 'get_block_post_account',
                'feed' => 'get_block_post_account',
                'owner' => 'get_block_post_profile',
                'profile' => 'get_block_post_profile',
                'public' => 'get_block_post_home'
            ];
 
            $sType = '';
            if(isset($aParams['rparams']['type']))
                $sType = $aParams['rparams']['type'];
            else
                $sType = trim(str_replace('bx_timeline_post_add', '', $aResult['form_object']->aParams['display']), '_');
            

            $oProfileOwner = BxDolProfile::getInstance($iOwnerId);
            $aExt = ['request' => ['url' => $sUrl = '/api.php?r=' . $this->_oModule->getName() . '/' . $aType2Uri[$sType] . '&params[]=' . $oProfileOwner->getModule() . '&params[]=' . $oProfileOwner->getContentId(), 'immutable' => true]];
            if(!empty($aResult['id'])) {
                $aItemData = $oModule->getItemData($aResult['id']);
                if(is_array($aItemData) && !empty($aItemData['event']))
                    $aExt['response'] = $this->_getPostApi($aItemData['event'], $aParams);
            }
            $aExt['name'] = 'feed';
            return [
                bx_api_get_block('form', $aResult['form_object']->getCodeAPI(), ['ext' => $aExt])
            ];
        }

        return $this->parseHtmlByName('block_post.html', array (
            'style_prefix' => $this->_oConfig->getPrefix('style'),
            'js_object' => $this->_oConfig->getJsObject('post'),
            'js_content' => $this->getJsCodePost($iOwnerId, $aParams),
            'form' => $aResult['form']
        ));
    }

    public function getViewsBlock($aParams)
    {
        $sStylePrefix = $this->_oConfig->getPrefix('style');
        $sJsObject = $this->_oConfig->getJsObjectView($aParams);
        
        $sType = isset($aParams['type']) ? $aParams['type'] : '';

        $sMenu = $this->_oConfig->getObject('menu_view');
        $oMenu = BxDolMenu::getObjectInstance($sMenu);

    	$aMenuItems = $oMenu->getMenuItems();
    	if(empty($aMenuItems) || !is_array($aMenuItems))
            return '';

    	if(empty($sType)) {
            $aMenuItem = array_shift($aMenuItems);
            $sType = $aMenuItem['name'];
    	}
    	$oMenu->setSelected($this->_oConfig->getName(), $sType);
        $oMenu->addMarkers(array(
            'js_object_view' => $sJsObject
        ));

        $sTitle = _t('_bx_timeline_page_block_title_views_' . $aParams['view']);

        if ($this->_bIsApi)
            return [
                'content' => [bx_api_get_block('browse', ['unit' => 'feed', 'data' => $this->getViewBlock($aParams)])],
                'menu' => $oMenu->getCodeAPI()
            ];

        $aResult = $this->getViewBlock($aParams);

        return [
            'content' => $this->parseHtmlByName('block_views.html', [
                'style_prefix' => $sStylePrefix,
                'html_id' => $this->_oConfig->getHtmlIdView('views', $aParams, ['with_type' => false]),
                'html_id_content' => $this->_oConfig->getHtmlIdView('views_content', $aParams, ['with_type' => false]),
                'html_id_view_placeholder' => $this->_oConfig->getHtmlIdView('main', array_merge($aParams, ['type' => 'placeholder'])),
                'title' => $sTitle,
                'content' => $aResult['content']
            ]),
            'menu' => $oMenu
        ];
    }

    public function getViewsDbBlock($aParams)
    {
        $sStylePrefix = $this->_oConfig->getPrefix('style');

        $sJsObject = $this->_oConfig->getJsObject('view_filters');
        $sJsContent = $this->getJsCodeViewFilters([
            'sObjName' => $sJsObject,
            'sName' => $aParams['name'],
            'sView' => $aParams['view'],
            'sType' => $aParams['type'],
            'oRequestParams' => $aParams
        ], [
            'wrap' => true,
            'mask_markers' => ['object' => $sJsObject]
        ]);

        $aViewBlock = $this->getViewBlock(array_merge($aParams, ['name' => '']));

        return array(
            'content' => $this->parseHtmlByName('block_views_db.html', array(
                'style_prefix' => $sStylePrefix,
                'html_id' => $this->_oConfig->getHtmlIdView('views', $aParams, array('with_type' => false)),
                'html_id_content' => $this->_oConfig->getHtmlIdView('views_content', $aParams, array('with_type' => false)),
                'content' => $aViewBlock['content'],
                'js_content' => $sJsContent
            )),
            'buttons' => [
                ['title' => _t('_bx_timeline_txt_filters'), 'href' => 'javascript:void(0)', 'onclick' => 'javascript:' . $sJsObject . '.changeFeedFilters(this)']
            ]
        );
    }

    public function getViewFilters($aParams)
    {
        $sStyle = $this->_oConfig->getFiltersStyle();
        if(($sMethod = '_getViewFilters' . bx_gen_method_name($sStyle)) && method_exists($this, $sMethod))
            return $this->$sMethod($aParams);

        $sStylePrefix = $this->_oConfig->getPrefix('style');
        $sJsObject = $this->_oConfig->getJsObject('view_filters');       

        $iProfile = bx_get_logged_profile_id();
        $oModuleQuery = BxDolModuleQuery::getInstance();

        $aInputs = [];

        //--- by Context
        if($aParams['name'] != BX_TIMELINE_NAME_VIEWS_DB) {
            //--- by contexts including Hashtags (Channels)
            $aContexts = bx_srv('system', 'get_modules_by_type', ['context', ['name_as_key' => true]]);
            if(!empty($aContexts) || is_array($aContexts)) {
                $aContextsHide = $this->_oConfig->getFiltersContextsHide();
                $bShowGrouped = count(array_diff(array_keys($aContexts), $aContextsHide)) > 1;

                $aInputs['by_context'] = [
                    'name' => 'by_context',
                    'type' => $this->_bIsApi ? 'selector' : 'select',
                    'is_single' => true,
                    'caption' => _t('_bx_timeline_form_filters_input_by_contexts'),
                    'values' => $this->_bIsApi ? [] : [
                        ['key' => 0, 'value' => _t('_bx_timeline_form_filters_input_by_contexts_any')],
                    ]
                ];

                foreach($aContexts as $sContext => $aContext) {
                    if(in_array($sContext, $aContextsHide))
                        continue;

                    $aContextsIds = BxDolConnection::getObjectInstance('sys_profiles_subscriptions')->getConnectedContentByType($iProfile, [$sContext]);
                    if(empty($aContextsIds) || !is_array($aContextsIds))
                        continue;

                    if($bShowGrouped && !$this->_bIsApi)
                        $aInputs['by_context']['values'][] = ['type' => 'group_header', 'value' => ($sLk = '_' . $sContext) && ($_sLk = _t($sLk)) && strcmp($sLk, $_sLk) != 0 ? $_sLk : $aContext['title']];

                    foreach($aContextsIds as $iContextId) {
                        $oContext = BxDolProfile::getInstance($iContextId);
                        if(!$oContext || !$oContext->isActive() || !bx_srv($sContext, 'is_active', [$oContext->getContentId()]))
                            continue;

                        $aInputs['by_context']['values'][] = ['key' => $sContext . '|' . $iContextId, 'value' => $oContext->getDisplayName()];
                    }

                    if($bShowGrouped && !$this->_bIsApi)
                        $aInputs['by_context']['values'][] = ['type' => 'group_end'];
                }
            }
        }

        //--- by Module
        $aHandlers = $this->_oDb->getHandlers(['type' => 'by_type', 'value' => 'insert']);
        $aHandlersHidden = $this->_oModule->_oConfig->getHandlersHidden();

        $aModules = [];
        foreach($aHandlers as $aHandler) {
            $sModule = $aHandler['alert_unit'];
            if(isset($aModules[$sModule]) || in_array($aHandler['id'], $aHandlersHidden))
                continue;

            $aModule = $this->_oDb->getModuleByName($sModule);
            if(empty($aModule) || !is_array($aModule))
                continue;

            $sTitleKey = '_' . $sModule;
            $sTitleValue = _t($sTitleKey);
            if(strcmp($sTitleKey, $sTitleValue) == 0)
                $sTitleValue = $aModule['title'];

            $aModules[$sModule] = [
                'key' => $aHandler['alert_unit'],
                'value' => $sTitleValue
            ];
        }

        uasort($aModules, function($aV1, $aV2) {
            return strcmp($aV1['value'], $aV2['value']);
        });
        if ($this->_bIsApi)
            $aInputs = array_merge($aInputs, [
                'modules' => [
                    'name' => 'modules',
                    'type' => 'checkbox_set',
                    'caption' => _t('_bx_timeline_form_filters_input_by_modules'),
                    'values' => array_values($aModules),
                    'tr_attrs' => ['class' => 'modules', 'style' => 'display:none']
                ]
            ]);
        else
            $aInputs = array_merge($aInputs, [
                'by_module' => [
                    'name' => 'by_module',
                    'type' => 'radio_set',
                    'caption' => _t('_bx_timeline_form_filters_input_by_modules'),
                    'values' => [
                        ['key' => 'all', 'value' => _t('_bx_timeline_form_filters_input_by_modules_all')],
                        ['key' => 'selected', 'value' => _t('_bx_timeline_form_filters_input_by_modules_selected')]
                    ],
                    'value' => 'all',
                    'attrs' => ['onchange' => $sJsObject . '.onFilterByModuleChange(this)'],
                    'dv_thd' => 1
                ],
                'modules' => [
                    'name' => 'modules',
                    'type' => 'checkbox_set',
                    'values' => array_values($aModules),
                    'tr_attrs' => ['class' => 'modules', 'style' => 'display:none']
                ]
            ]);
        
        //--- by Media
        if ($this->_bIsApi)
            $aInputs = array_merge($aInputs, [
                'media' => [
                    'name' => 'media',
                    'type' => 'checkbox_set',
                    'caption' => _t('_bx_timeline_form_filters_input_by_media'),
                    'values' => [],
                    'tr_attrs' => ['class' => 'media', 'style' => 'display:none']
                ]
            ]);
        else
            $aInputs = array_merge($aInputs, [
                'by_media' => [
                    'name' => 'by_media',
                    'type' => 'radio_set',
                    'caption' => _t('_bx_timeline_form_filters_input_by_media'),
                    'values' => [
                        ['key' => 'all', 'value' => _t('_bx_timeline_form_filters_input_by_media_all')],
                        ['key' => 'selected', 'value' => _t('_bx_timeline_form_filters_input_by_media_selected')]
                    ],
                    'value' => 'all',
                    'attrs' => ['onchange' => $sJsObject . '.onFilterByMediaChange(this)'],
                    'dv_thd' => 1
                ],
                'media' => [
                    'name' => 'media',
                    'type' => 'checkbox_set',
                    'values' => [],
                    'tr_attrs' => ['class' => 'media', 'style' => 'display:none']
                ]
            ]);

        $aFlagTypes = $this->_oConfig->getFiltersMedia();
        foreach($aFlagTypes as $sFt)
            $aInputs['media']['values'][] = ['key' => $sFt, 'value' => _t('_bx_timeline_form_filters_input_by_media_' . $sFt)];

        $sForm = $this->_oConfig->getName() . '_filters';
        $aForm = [
            'form_attrs' => [
                'name' => $sForm
            ],
            'params' => [
                'display' => $sForm
            ],
            'inputs' => array_merge($aInputs, [                
                'apply' => [
                    'name' => 'apply',
                    'type' => 'button',
                    'value' => _t('_bx_timeline_form_filters_input_do_apply'),
                    'attrs' => ['onclick' => $sJsObject . '.onFilterApply(this)']
                ]
            ])
        ];
        $oForm = new BxTemplFormView($aForm);

        if($this->_bIsApi)
            return $oForm->getCodeApi();

        $sViewFiltersPopupId = $this->_oConfig->getHtmlIdView('filters_popup', array_merge($aParams, ['name' => '']));
        $sViewFiltersPopupContent = $this->parseHtmlByName('block_view_filters.html', array(
            'style_prefix' => $sStylePrefix,
            'js_object' => $sJsObject,
            'content' => $oForm->genRows()
        ));

        return BxTemplFunctions::getInstance()->transBox($sViewFiltersPopupId, $sViewFiltersPopupContent, true);
    }

    public function _getViewFiltersDisplay($aParams)
    {
        $sStylePrefix = $this->_oConfig->getPrefix('style');
        $sJsObject = $this->_oConfig->getJsObject('view_filters');       

        $iProfile = bx_get_logged_profile_id();
        $oModuleQuery = BxDolModuleQuery::getInstance();

        $aInputs = [];

        //--- by Module
        $aHandlers = $this->_oDb->getHandlers(['type' => 'by_type', 'value' => 'insert']);
        $aHandlersHidden = $this->_oModule->_oConfig->getHandlersHidden();

        $aModules = [];
        foreach($aHandlers as $aHandler) {
            $sModule = $aHandler['alert_unit'];
            if(isset($aModules[$sModule]) || in_array($aHandler['id'], $aHandlersHidden))
                continue;

            if(in_array($sModule, ['timeline_common_post', 'timeline_common_repost'])) {
                $sTitleValue = _t('_bx_timeline_form_filters_input_modules_' . $sModule);
            }
            else if(($aModule = $this->_oDb->getModuleByName($sModule)) && is_array($aModule)) {
                $sTitleKey = '_' . $sModule;
                $sTitleValue = _t($sTitleKey);
                if(strcmp($sTitleKey, $sTitleValue) == 0)
                    $sTitleValue = $aModule['title'];
            }
            else
                continue;

            $aModules[$sModule] = [
                'key' => $sModule,
                'value' => $sTitleValue
            ];
        }

        uasort($aModules, function($aV1, $aV2) {
            return strcmp($aV1['value'], $aV2['value']);
        });

        if ($this->_bIsApi)
            $aInputs = array_merge($aInputs, [
                'modules' => [
                    'name' => 'modules',
                    'type' => 'checkbox_set',
                    'caption' => _t('_bx_timeline_form_filters_input_by_modules'),
                    'value' => array_keys($aModules),
                    'values' => array_values($aModules),
                ]
            ]);
        else
            $aInputs = array_merge($aInputs, [
                'modules' => [
                    'name' => 'modules',
                    'type' => 'checkbox_set',
                    'value' => array_keys($aModules),
                    'values' => array_values($aModules),
                    'attrs' => [
                        'onchange' => $sJsObject . '.onChangeModulesDisplay(this)'
                    ]
                ]
            ]);

        //--- by Media
        $aFlagTypes = $this->_oConfig->getFiltersMedia();

        $aMedia = [];
        foreach($aFlagTypes as $sFt)
            $aMedia[$sFt] = [
                'key' => $sFt, 
                'value' => _t('_bx_timeline_form_filters_input_by_media_' . $sFt)
            ];

        if ($this->_bIsApi)
            $aInputs = array_merge($aInputs, [
                'media' => [
                    'name' => 'media',
                    'type' => 'checkbox_set',
                    'caption' => _t('_bx_timeline_form_filters_input_by_media'),
                    'value' => array_keys($aMedia),
                    'values' => array_values($aMedia),
                ]
            ]);
        else
            $aInputs = array_merge($aInputs, [
                'media' => [
                    'name' => 'media',
                    'type' => 'checkbox_set',
                    'value' => array_keys($aMedia),
                    'values' => array_values($aMedia),
                    'attrs' => [
                        'onchange' => $sJsObject . '.onChangeMediaDisplay(this)'
                    ]
                ]
            ]);

        $sForm = $this->_oConfig->getName() . '_filters';
        $aForm = [
            'form_attrs' => [
                'name' => $sForm
            ],
            'params' => [
                'display' => $sForm
            ],
            'inputs' => array_merge($aInputs, [                
                'apply' => [
                    'name' => 'apply',
                    'type' => 'button',
                    'value' => _t('_bx_timeline_form_filters_input_do_apply'),
                    'attrs' => ['onclick' => $sJsObject . '.onFilterApplyDisplay(this)']
                ]
            ])
        ];
        $oForm = new BxTemplFormView($aForm);

        if($this->_bIsApi)
            return $oForm->getCodeApi();

        $sViewFiltersPopupId = $this->_oConfig->getHtmlIdView('filters_popup', array_merge($aParams, ['name' => '']));
        $sViewFiltersPopupContent = $this->parseHtmlByName('block_view_filters.html', [
            'style_prefix' => $sStylePrefix,
            'js_object' => $sJsObject,
            'content' => $oForm->genRows()
        ]);

        return BxTemplFunctions::getInstance()->transBox($sViewFiltersPopupId, $sViewFiltersPopupContent, true);
    }

    public function getViewBlock($aParams)
    {
        $oModule = $this->getModule();

        if($this->_bIsApi) {
            if(defined('BX_API_PAGE'))
                return [];

            $oMenuActions = BxDolMenu::getObjectInstance($this->_oConfig->getObject('menu_item_actions_all'));
            if(!$oMenuActions)
                $oMenuActions = BxDolMenu::getObjectInstance($this->_oConfig->getObject('menu_item_actions'));

            $oMenuManage = BxDolMenu::getObjectInstance($this->_oConfig->getObject('menu_item_manage'));

            $aPosts = $this->getPosts(array_merge($aParams, ['return_data_type' => 'array']));
            foreach($aPosts as &$aPost) {
                $aPost = array_merge($aPost, [
                    'menu_actions' => $oMenuActions,
                    'menu_manage' => $oMenuManage
                ]);

                $aPost = $this->_getPostApi($aPost, $aParams);
            }

            return $aPosts;
        }

        list($sContent, $sLoadMore, $sBack, $sEmpty, $iEvent, $bEventsToLoad) = $this->getPosts($aParams);

        //--- Add live update
        $oModule->actionResumeLiveUpdate($aParams['type'], $aParams['owner_id']);

        $sModuleName = $oModule->getName();
        $sModuleMethod = !empty($aParams['get_live_updates']) ? $aParams['get_live_updates'] : 'get_live_update';
        $sService = BxDolService::getSerializedService($sModuleName, $sModuleMethod, [$aParams, $oModule->getUserId(), '{count}', '{init}']);

        $aLiveUpdateParams = [$this->_oConfig->getLiveUpdateKey($aParams), 1, $sService, [true, false]];
        if($sModuleMethod == 'get_live_update')
            $aLiveUpdateParams[] = $iEvent;

        $sLiveUpdateCode = null;

        /**
         * @hooks
         * @hookdef hook-bx_timeline-add_live_update 'bx_timeline', 'add_live_update' - hook to override params and/or code for live updates
         * - $unit_name - equals `bx_timeline`
         * - $action - equals `add_live_update`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `browse_params` - [array] browse params array as key&value pairs
         *      - `live_update_params` - [array] by ref, live update params array as key&value pairs, can be overridden in hook processing
         *      - `override_result` - [string] by ref, live update code, can be overridden in hook processing
         * @hook @ref hook-bx_timeline-add_live_update
         */
        bx_alert($sModuleName, 'add_live_update', 0, 0, [
            'browse_params' => $aParams,
            'live_update_params' => &$aLiveUpdateParams,
            'live_update_params_ref' => &$aLiveUpdateParams,
            'override_result' => &$sLiveUpdateCode,
        ]);

        if($sLiveUpdateCode === null && ($oLiveUpdates = BxDolLiveUpdates::getInstance()) !== false)
            $sLiveUpdateCode = call_user_func_array([$oLiveUpdates, 'add'], $aLiveUpdateParams);
        //--- Add live update

        $sContentBefore = '';
        $sContentAfter = '';

        $bUseFilters = false;
        if($aParams['filter'] == BX_TIMELINE_FILTER_PANEL) {
            $bUseFilters = true;
            $aParams['filter'] = BX_TIMELINE_FILTER_DEFAULT;
        }

        $sJsObject = $this->_oConfig->getJsObjectView($aParams);
        $sJsContent = $this->getJsCodeView(array(
            'sObjName' => $sJsObject,
            'sName' => $aParams['name'],
            'sView' => $aParams['view'],
            'sType' => $aParams['type'],
            'sVideosAutoplay' => $this->_oConfig->getVideosAutoplay(),
            'bEventsToLoad' => $bEventsToLoad,
            'bAutoMarkAsViewed' => $this->_oConfig->isSortByUnread(),
            'oRequestParams' => $aParams
        ), array(
            'wrap' => true,
            'mask_markers' => array('object' => $sJsObject)
        )) . $this->getJsCode('repost') . $this->getJsCode('poll');

        /**
         * @hooks
         * @hookdef hook-bx_timeline-get_view 'bx_timeline', 'get_view' - hook to override elements of view timeline block
         * - $unit_name - equals `bx_timeline`
         * - $action - equals `get_view`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `params` - [array] browse params array as key&value pairs
         *      - `event_first` - [int] the first event id
         *      - `back` - [string] by ref, back link code, can be overridden in hook processing
         *      - `empty` - [string] by ref, empty message code, can be overridden in hook processing
         *      - `content_before` - [string] by ref, code for before content section, can be overridden in hook processing
         *      - `content` - [string] by ref, content itself, can be overridden in hook processing
         *      - `content_after` - [string] by ref, code for after content section, can be overridden in hook processing
         *      - `load_more` - [string] by ref, load more link code, can be overridden in hook processing
         *      - `js_content` - [string] by ref, JavaScript code, can be overridden in hook processing
         * @hook @ref hook-bx_timeline-get_view
         */
        bx_alert($sModuleName, 'get_view', 0, 0, [
            'params' => $aParams,
            'event_first' => $iEvent,

            'back' => &$sBack,
            'empty' => &$sEmpty,
            'content_before' => &$sContentBefore,
            'content' => &$sContent,
            'content_after' => &$sContentAfter,
            'load_more' => &$sLoadMore,
            'js_content' => &$sJsContent,

            'back_ref' => &$sBack,
            'empty_ref' => &$sEmpty,
            'content_before_ref' => &$sContentBefore,
            'content_ref' => &$sContent,
            'content_after_ref' => &$sContentAfter,
            'load_more_ref' => &$sLoadMore,
            'js_content_ref' => &$sJsContent,
        ]);

        $sJsObjectFilters = '';
        if($bUseFilters) {
            $sJsObjectFilters = $this->_oConfig->getJsObject('view_filters');
            $sJsContent .= $this->getJsCodeViewFilters([
                'sObjName' => $sJsObject,
                'sName' => $aParams['name'],
                'sView' => $aParams['view'],
                'sType' => $aParams['type'],
                'oRequestParams' => $aParams
            ], [
                'wrap' => true,
                'mask_markers' => ['object' => $sJsObjectFilters]
            ]);
        }

        $aResult = [
            'content' => $this->parseHtmlByName('block_view.html', [
                'style_prefix' => $this->_oConfig->getPrefix('style'),
                'html_id' => $this->_oConfig->getHtmlIdView('main', $aParams),
                'view' => $aParams['view'],
                'back' => $sBack,
                'empty' => $sEmpty,
                'content_before' => $sContentBefore,
                'content' => $sContent,
                'content_after' => $sContentAfter,
                'load_more' =>  $sLoadMore,
                'show_more' => $this->_getShowMore($aParams),
                'view_image_popup' => $this->_getImagePopup($aParams),
                'live_update_code' => $sLiveUpdateCode,
                'js_content' => $sJsContent
            ])
        ];

        if($bUseFilters)
            $aResult['buttons'] = [
                ['title' => _t('_bx_timeline_txt_filters'), 'href' => 'javascript:void(0)', 'onclick' => 'javascript:' . $sJsObjectFilters . '.changeFeedFilters(this)']
            ];

        return $aResult;
    }

    public function getSearchBlock($sContent)
    {
        $oModule = $this->getModule();
        $aParams = $oModule->getParams(BX_TIMELINE_VIEW_SEARCH);

        return $this->parseHtmlByName('block_search.html', array(
            'style_prefix' => $this->_oConfig->getPrefix('style'),
            'html_id' => $this->_oConfig->getHtmlIdView('main', $aParams),
            'view' => $aParams['view'],
            'content' => $sContent,
            'view_image_popup' => $this->_getImagePopup($aParams),
            'js_content' => $this->getJsCodeView(array(
            	'oRequestParams' => $aParams
            ))
        ));
    }

    public function getItemBlock($mixedId, $aBrowseParams = array())
    {
        $CNF = $this->_oConfig->CNF;
        $oModule = $this->getModule();

        if(is_numeric($mixedId))
            $mixedId = $oModule->getItemData($mixedId);

        if(empty($mixedId) || !is_array($mixedId))
            return array('content' => MsgBox(_t('_Empty')), 'designbox_id' => 13);

        if($mixedId['code'] != 0)
            return array('content' => MsgBox($mixedId['content']), 'designbox_id' => 13);

        $aEvent = $mixedId['event'];
        $sContent = $mixedId['content'];

        if(!$this->_oConfig->isSystem($aEvent['type'], $aEvent['action'])) {
            $mixedViews = $oModule->getViewsData($aEvent['views']);
            if($mixedViews !== false) {
                list($sSystem, $iObjectId) = $mixedViews;
                $oModule->getViewObject($sSystem, $iObjectId)->doView();
            }
        }

        $sAuthorName = $oModule->getObjectUser($aEvent['object_owner_id'])->getDisplayName();

        $sTitle = $sAuthorName . ' ' . _t($aEvent['sample_action'], _t($aEvent['sample']));
        $sDescription = $aEvent['title'];
        if(get_mb_substr($sDescription, 0, 1) == '_')
            $sDescription = _t($sDescription);

        $oTemplate = BxDolTemplate::getInstance();
        $oTemplate->setPageHeader(strip_tags($sTitle));
        $oTemplate->setPageDescription(strip_tags($sDescription));

        $oMetatags = BxDolMetatags::getObjectInstance($this->_oConfig->getObject('metatags'));
        if($oMetatags)
            $oMetatags->addPageMetaInfo($aEvent[$CNF['FIELD_ID']]);

        $sReferrer = '';
        if(isset($_SERVER['HTTP_REFERER']) && mb_stripos($_SERVER['HTTP_REFERER'], BX_DOL_URL_ROOT) === 0)
            $sReferrer = $_SERVER['HTTP_REFERER'];
        else 
            $sReferrer = bx_absolute_url(BxDolPermalinks::getInstance()->permalink($this->_oConfig->CNF['URL_HOME']));

        $sJsObject = $this->_oConfig->getJsObjectView($aBrowseParams);
        return array('content' => $this->parseHtmlByName('block_item.html', array(
            'style_prefix' => $this->_oConfig->getPrefix('style'),
            'html_id' => $this->_oConfig->getHtmlIdView('main', $aBrowseParams),
            'content' => $sContent,
            'show_more' => $this->_getShowMore($aBrowseParams),
            'view_image_popup' => $this->_getImagePopup($aBrowseParams),
            'js_content' => $this->getJsCodeView(array(
                'sObjName' => $sJsObject,
                'sVideosAutoplay' => $this->_oConfig->getVideosAutoplay(),
                'sReferrer' => $sReferrer,
                'oRequestParams' => $aBrowseParams
            ), array(
                'wrap' => true,
                'mask_markers' => array('object' => $sJsObject)
            )) . $this->getJsCode('repost')
        )));
    }

    /**
     * Get event's content.
     * @param integer $iId - event ID.
     * @param string $sMode - 'file'/'photo'/'video' are available for now. But only images will be shown.
     */
    public function getItemBlockContent($iId, $sMode) {
        $oModule = $this->getModule();
        $sStylePrefix = $this->_oConfig->getPrefix('style');

        $aItemData = $oModule->getItemData($iId);
        if(empty($aItemData) || $aItemData['code'] != 0)
            return '';

        $aEvent = $aItemData['event'];       

        $sKeyMain = $sKeyAttach = '';
        switch($sMode) {
            case 'file':
                $sKeyMain = 'files';
                $sKeyAttach = 'files_attach';
                break;

            case 'photo':
                $sKeyMain = 'images';
                $sKeyAttach = 'images_attach';
                break;

            case 'video':
                $sKeyMain = 'videos';
                $sKeyAttach = 'videos_attach';
                break;
        }

        $aImages = [];
        if(!empty($aEvent['content'][$sKeyMain]) && is_array($aEvent['content'][$sKeyMain]))
            $aImages = $aEvent['content'][$sKeyMain];
        else if(!empty($aEvent['content'][$sKeyAttach]) && is_array($aEvent['content'][$sKeyAttach]))
            $aImages = $aEvent['content'][$sKeyAttach];

        if(isset($aImages['total']) && isset($aImages['items']))
            $aImages = $aImages['items'];

        $bImageSingle = count($aImages) == 1;
        $sImageSelected = base64_decode(bx_process_input(bx_get('src')));

        $aTmplVarsImages = [];
        if(!$bImageSingle) {
            $iIndex = 1;
            foreach($aImages as $aImage)  {
                if(!isset($aImage['src'], $aImage['src_orig']))
                    continue;

                $iCurrent = $iIndex;
                if(strcmp($aImage['src'], $sImageSelected) == 0 || strcmp($aImage['src_orig'], $sImageSelected) == 0)
                    $iCurrent = 0;

                $aTmplVarsImages[$iCurrent] = [
                    'style_prefix' => $sStylePrefix,
                    'url' => $aImage['url'],
                    'src' => $aImage[!empty($aImage['src_orig']) ? 'src_orig' : 'src']
                ];

                $iIndex++;
            }

            ksort($aTmplVarsImages);
            $aTmplVarsImages = array_values($aTmplVarsImages);
        }

        $aTmplVars = [
            'style_prefix' => $sStylePrefix,
            'bx_if:show_image' => [
                'condition' => $bImageSingle,
                'content' => [
                    'style_prefix' => $sStylePrefix,
                    'src' => $sImageSelected,
                ]
            ],
            'bx_if:show_images' => [
                'condition' => !$bImageSingle,
                'content' => [
                    'style_prefix' => $sStylePrefix,
                    'bx_repeat:images' => $aTmplVarsImages
                ]
            ]
        ];

        return $this->parseHtmlByName('block_item_content.html', $aTmplVars);
    }

    public function getItemBlockInfo($iId)
    {
        $CNF = $this->_oConfig->CNF;

        $aEvent = $this->_oDb->getEvents(['browse' => 'id', 'value' => $iId]);
        if(empty($aEvent))
            return '';

        $aResult = $this->getDataCached($aEvent);
        if($aResult === false)
            return '';

        if($this->_bIsApi) {
            $sFldOpv = 'FIELD_OBJECT_PRIVACY_VIEW';

            $sMenuManage = '';
            if(($oMenuManage = BxDolMenu::getObjectInstance($this->_oConfig->getObject('menu_item_manage'))) !== false) {
                $oMenuManage->setEvent($aEvent);
                $sMenuManage = $oMenuManage->getCodeApi();
            }

            return [
                bx_api_get_block('entity_author', [
                    'author_data' => BxDolProfile::getData($aResult[$CNF['FIELD_OBJECT_OWNER_ID']]),
                    'entry_date' => !empty($aEvent[$CNF['FIELD_ADDED']]) ? $aEvent[$CNF['FIELD_ADDED']] : '',
                    'entry_id' => $iId,
                    'entry_url' => bx_api_get_relative_url($this->_oConfig->getItemViewUrl($aEvent)),
                    'entry_context' => !empty($CNF[$sFldOpv]) && (int)$aEvent[$CNF[$sFldOpv]] < 0 ? BxDolProfile::getData(abs((int)$aEvent[$CNF[$sFldOpv]])) : '',
                    'menu_manage' => $sMenuManage
                ])
            ];
        }

        $oForm = BxDolForm::getObjectInstance($this->_oConfig->getObject('form_post'), $this->_oConfig->getObject('form_display_post_view'), $this);
        $oForm->initChecker($aEvent);

        return $this->parseHtmlByName('block_item_info.html', [
            'style_prefix' => $this->_oConfig->getPrefix('style'),
            'author' => $this->getModule()->getObjectUser($aResult['object_owner_id'])->getUnit(),
            'fields' => $oForm->getCode()
        ]);
    }

    public function getItemBlockComments($iId)
    {
        $aEvent = $this->_oDb->getEvents(['browse' => 'id', 'value' => $iId]);
        if(empty($aEvent))
            return '';

        $aEventData = $this->getDataCached($aEvent);
        if($aEventData === false)
            return '';

        if(!$this->getModule()->isAllowedComment(array_merge($aEvent, $aEventData)))
            return '';

        if(bx_is_api()) {
            $mixedComments = $this->getModule()->getCommentsData($aEventData['comments']);
            if($mixedComments === false)
                return '';

            list($sSystem, $iObjectId) = $mixedComments;
            return [bx_srv('system', 'get_data_api', [['module' => $sSystem, 'object_id' => $iObjectId]], 'TemplCmtsServices')];
        }

        return $this->parseHtmlByName('block_item_comments.html', [
            'style_prefix' => $this->_oConfig->getPrefix('style'),
            'content' => $this->_getComments($aEventData['comments'])
        ]);
    }

    public function getUnit(&$aEvent, $aBrowseParams = array())
    {
        $oModule = $this->getModule();

        if(empty($aBrowseParams) || !is_array($aBrowseParams))
            $aBrowseParams = $oModule->getParams(BX_TIMELINE_VIEW_SEARCH);

        return $this->getPost($aEvent, $aBrowseParams);
    }

    public function getPost(&$aEvent, $aBrowseParams = array())
    {
        $CNF = &$this->_oConfig->CNF;

        if(empty($aEvent) || !is_array($aEvent))
            return '';

        $iEventId = (int)$aEvent[$CNF['FIELD_ID']];
        $iViewerId = isset($aBrowseParams['viewer_id']) ? (int)$aBrowseParams['viewer_id'] : bx_get_logged_profile_id();

        $sMemoryCacheItemsKey = sprintf(self::$_sMemoryCacheItemsKeyMask, $aBrowseParams['view'], $iEventId);
        if(array_key_exists($sMemoryCacheItemsKey, self::$_aMemoryCacheItems)) {
            if(array_key_exists($sMemoryCacheItemsKey, self::$_aMemoryCacheItemsData))
                $aEvent = self::$_aMemoryCacheItemsData[$sMemoryCacheItemsKey];

            return self::$_aMemoryCacheItems[$sMemoryCacheItemsKey];
        }

        /**
         * Add all items in memory cache even if they are empty.
         */
        self::$_aMemoryCacheItems[$sMemoryCacheItemsKey] = '';
        self::$_aMemoryCacheItemsData[$sMemoryCacheItemsKey] = array();

        $oPrivacy = BxDolPrivacy::getObjectInstance($this->_oConfig->getObject('privacy_view'));
        if($oPrivacy) {
            $oPrivacy->setTableFieldAuthor($this->_oConfig->isSystem($aEvent['type'], $aEvent['action']) ? 'owner_id' : 'object_id');
            if(!$oPrivacy->check($iEventId, $iViewerId))
                return '';
        }

        $aResult = $this->getDataCached($aEvent, $aBrowseParams);
        if($aResult === false)
            return '';

        if(isset($aResult['owner_id']))
            $aEvent['owner_id'] = $aResult['owner_id'];

        $aEvent['object_owner_id'] = $aResult['object_owner_id'];
        $aEvent['icon'] = !empty($aResult['icon']) ? $aResult['icon'] : '';
        $aEvent['sample'] = !empty($aResult['sample']) ? $aResult['sample'] : '_bx_timeline_txt_sample';
        $aEvent['sample_action'] = !empty($aResult['sample_action']) ? $aResult['sample_action'] : '_bx_timeline_txt_added_sample';
        if(isset($aResult['sample_action_custom']))
            $aEvent['sample_action_custom'] = $aResult['sample_action_custom'];
        $aEvent['content'] = $aResult['content'];
        $aEvent['content_type'] = !empty($aResult['content_type']) ? $aResult['content_type'] : BX_TIMELINE_PARSE_TYPE_DEFAULT;
        $aEvent['views'] = $aResult['views'];
        $aEvent['votes'] = $aResult['votes'];
        $aEvent['reactions'] = $aResult['reactions'];
        $aEvent['scores'] = $aResult['scores'];
        $aEvent['reports'] = $aResult['reports'];
        $aEvent['comments'] = $aResult['comments'];

        $sKey = 'allowed_view';
        $aEvent[$sKey] = $this->_preparePrivacy($sKey, $aEvent, $aResult);
        if(isset($aEvent[$sKey]) && $aEvent[$sKey] !== CHECK_ACTION_RESULT_ALLOWED) 
            return '';

        self::$_aMemoryCacheItemsData[$sMemoryCacheItemsKey] = $aEvent;
        
        if($this->_bIsApi){
            self::$_aMemoryCacheItems[$sMemoryCacheItemsKey] = 'OK';
            return 'OK';
        }

        self::$_aMemoryCacheItems[$sMemoryCacheItemsKey] = $this->_getPost($aEvent['content_type'], $aEvent, $aBrowseParams);
        return self::$_aMemoryCacheItems[$sMemoryCacheItemsKey];
    }

    public function getPostApi($aEvent, $aParams = [])
    {
        return $this->_getPostApi($aEvent, $aParams);
    }

    public function getPosts($aParams)
    {
        $CNF = &$this->_oConfig->CNF;

        $bReturnArray = isset($aParams['return_data_type']) && $aParams['return_data_type'] == 'array';
        $bViewTimeline = $aParams['view'] == BX_TIMELINE_VIEW_TIMELINE;

        $iStart = $aParams['start'];
        $iPerPage = $aParams['per_page'];

        $aParamsDb = $aParams;

        //--- Before: Check for Next
        $aParamsDb['per_page'] += 1;
        if($this->_oConfig->isCacheTable()) {
            $aEvents = $this->_oDb->getEvents(array_merge($aParamsDb, ['from_cache' => true]));
            if(count($aEvents) < $aParamsDb['per_page'])
                $aEvents = $this->_oDb->getEvents(array_merge($aParamsDb, ['from_cache' => false]));
        }
        else
            $aEvents = $this->_oDb->getEvents($aParamsDb);

        if($this->_oConfig->isBrowseItem($aParams)) {
            $sEvent = $this->getPost($aEvents, $aParams);
            if(empty($sEvent))
                return $bReturnArray ? [] : '';

            if($this->_bIsApi)
                return $this->_getPostApi($aEvents);

            return $bReturnArray ? $aEvents : $sEvent;
        }

        //--- After: Check for Next
        $bNext = false;
        if(count($aEvents) > $iPerPage) {
            $aEvent = array_pop($aEvents);
            $bNext = true;
        }

        $sContent = '';
        $sContent .= $this->getSizer($aParams);

        $iFirst = 0;
        $iEventIndex = 0;
        $iEvents = count($aEvents);
        $iExtenalsEvery = $this->_oConfig->getExtenalsEvery($aParams['type']);

        $mixedEvents = $bReturnArray ? [] : '';
        do {
            if($iExtenalsEvery > 0 && $iEventIndex % $iExtenalsEvery == 0) {
                $mixedExternalPost = false;
                /**
                 * @hooks
                 * @hookdef hook-bx_timeline-get_external_post 'bx_timeline', 'get_external_post' - hook to override (add) external post(s) in timeline
                 * - $unit_name - equals `bx_timeline`
                 * - $action - equals `get_external_post`
                 * - $object_id - not used
                 * - $sender_id - not used
                 * - $extra_params - array of additional params with the following array keys:
                 *      - `params` - [array] browse params array as key&value pairs
                 *      - `override_result` - [string] or [array] by ref, code to be added to events list, can be overridden in hook processing
                 * @hook @ref hook-bx_timeline-get_external_post
                 */
                bx_alert($this->_oConfig->getName(), 'get_external_post', 0, 0, [
                    'params' => array_merge($aParams, [
                        'event_index' => $iEventIndex,
                        'events_count' => $iEvents,
                        'extenals_every' => $iExtenalsEvery,
                    ]),
                    'override_result' => &$mixedExternalPost,
                ]);

                if($mixedExternalPost !== false) {
                    if($bReturnArray)
                        $mixedEvents[] = $mixedExternalPost;
                    else
                        $mixedEvents .= $mixedExternalPost;
                }
            }

            $aEvent = [];
            if(!($aEvent = $aEvents[$iEventIndex] ?? false))
                continue;

            $aEvent['index'] = $iEventIndex + 1;

            $sEvent = $this->getPost($aEvent, $aParams);
            if(empty($sEvent))
                continue;

            if(!$iFirst && (int)$aEvent[$CNF['FIELD_STICKED']] == 0)
                $iFirst = (int)$aEvent['id'];

            if($bReturnArray)
                $mixedEvents[] = $aEvent;
            else
                $mixedEvents .= $sEvent;
        } while(++$iEventIndex < $iEvents);

        if($bReturnArray)
            return $mixedEvents;

        $sContent .= $mixedEvents;

        $bEvents = !empty($mixedEvents);

        $sBack = $this->getBack($aParams);

        if($this->_oConfig->isInfiniteScroll()) {
            $aParams['per_page'] = $this->_oConfig->getPerPreload();
            $iAutoPreloads = $this->_oConfig->getAutoPreloads();

            $bAuto = ($aParams['start'] - $aParams['per_page_default'] - $aParams['per_page'] * ($iAutoPreloads - 2)) % ($aParams['per_page'] * $iAutoPreloads) != 0;
            $sLoadMore = $this->{'getLoadMore' . ($bAuto ? 'Auto' : '')}($aParams, $bNext, $iEvents > 0 && $bEvents);
        }
        else
            $sLoadMore = $this->getLoadMore($aParams, $bNext, $iEvents > 0 && $bEvents);

        $sEmpty = $this->getEmpty(!$bEvents);

        return [$sContent, $sLoadMore, $sBack, $sEmpty, $iFirst, $bNext];
    }

    public function getEmpty($bVisible)
    {
        return $this->parseHtmlByName('empty.html', array(
            'style_prefix' => $this->_oConfig->getPrefix('style'),
            'visible' => $bVisible ? 'block' : 'none',
            'content' => MsgBox(_t('_bx_timeline_txt_msg_no_results'))
        ));
    }

    public function getSizer($aParams)
    {
        if($aParams['view'] != BX_TIMELINE_VIEW_OUTLINE)
            return '';

        return $this->parseHtmlByName('sizer_' . $aParams['view'] . '.html', array(
        	'style_prefix' => $this->_oConfig->getPrefix('style')
        ));
    }

    public function getBack($aParams)
    {
        $iYearSel = (int)$aParams['timeline'];
        if($iYearSel == 0)
            return '';

        $sStylePrefix = $this->_oConfig->getPrefix('style');
        $sJsObject = $this->_oConfig->getJsObjectView($aParams);

        $iYearNow = date('Y', time());
        return $this->parseHtmlByName('back.html', array(
        	'style_prefix' => $sStylePrefix,
            'content' => $this->parseLink('javascript:void(0)', _t('_bx_timeline_txt_jump_to_recent'), array(
                'title' => _t('_bx_timeline_txt_jump_to_n_year', $iYearNow),
        		'onclick' => 'javascript:' . $sJsObject . '.changeTimeline(this, 0)'
            ))
        ));
    }

    public function getLoadMore($aParams, $bEnabled, $bVisible = true)
    {
        $sStylePrefix = $this->_oConfig->getPrefix('style');
        $sJsObject = $this->_oConfig->getJsObjectView($aParams);

        $iStart = $aParams['start'];
        $iPerPage = $aParams['per_page'];

        $aTmplVars = array(
            'style_prefix' => $sStylePrefix,
            'visible' => ($aParams['view'] == BX_TIMELINE_VIEW_TIMELINE && $bVisible) || ($aParams['view'] == BX_TIMELINE_VIEW_OUTLINE && $bEnabled && $bVisible) ? 'block' : 'none',
            'bx_if:is_disabled' => array(
                'condition' => !$bEnabled,
                'content' => array()
            ),
            'bx_if:show_on_click' => array(
                'condition' => $bEnabled,
                'content' => array(
                    'on_click' => 'javascript:' . $sJsObject . '.changePage(this, ' . ($iStart + $iPerPage) . ', ' . $iPerPage . ')'
                )
            ),
            'bx_if:show_jump_to' => array(
                'condition' => $this->_oConfig->isJumpTo(),
                'content' => array(
                    'style_prefix' => $sStylePrefix,
                    'content' => $this->getJumpTo($aParams)
                )
            )
        );
        return $this->parseHtmlByName('load_more.html', $aTmplVars);
    }

    public function getLoadMoreAuto($aParams, $bEnabled, $bVisible = true)
    {
        $sStylePrefix = $this->_oConfig->getPrefix('style');

        return $this->parseHtmlByName('load_more_auto.html', array(
            'style_prefix' => $sStylePrefix,
            'visible' => ($aParams['view'] == BX_TIMELINE_VIEW_TIMELINE && $bVisible) || ($aParams['view'] == BX_TIMELINE_VIEW_OUTLINE && $bEnabled && $bVisible) ? 'block' : 'none',
            'loading' => _t('_bx_timeline_txt_loading' . ($bEnabled ? '' : '_complete'))
        ));
    }

    /**
     * Note. For now both List and Caledar based Jump To elements are available.
     * Calendar based element is used by default. List based one can be removed 
     * later if it won't be used completely.
     */
    public function getJumpTo($aParams)
    {
        if(!$this->_oConfig->isJumpTo())
            return '';

        $bList = false;
        $bDynamicMode = isset($aParams['dynamic_mode']) && (bool)$aParams['dynamic_mode'] === true;

        if($bList && !$bDynamicMode)
            return '';

        return $this->{'_getJumpTo' . ($bList ? 'List' : 'Caledar')}($aParams);
    }

    public function getComments($sSystem, $iId, $aBrowseParams = array())
    {
        $oModule = $this->getModule();
        $sStylePrefix = $this->_oConfig->getPrefix('style');
        $oCmts = $oModule->getCmtsObject($sSystem, $iId);
        if($oCmts === false)
            return '';

        if (bx_is_api()){
            $aParams = ['mode' => 'feed', 'order_way' => 'desc', 'start_from' => 0];
            return [bx_srv('system', 'get_comments_api', [$oCmts, $aParams], 'TemplCmtsServices')];
        }
        
        $aCmtsBp = array();
        if(!empty($aBrowseParams['cmts_preload_number']))
            $aCmtsBp['init_view'] = $aBrowseParams['cmts_preload_number'];

        $aCmtsDp = array(
            'in_designbox' => false, 
            'dynamic_mode' => isset($aBrowseParams['dynamic_mode']) && $aBrowseParams['dynamic_mode'] === true
        );
        if(!empty($aBrowseParams['cmts_min_post_form']))
            $aCmtsDp['min_post_form'] = $aBrowseParams['cmts_min_post_form'];

        $aComments = $oCmts->getCommentsBlock($aCmtsBp, $aCmtsDp);
        if(empty($aComments) || !is_array($aComments))
            return '';

        return $this->parseHtmlByName('comments.html', array(
            'style_prefix' => $sStylePrefix,
            'id' => $iId,
            'content' => $aComments['content']
        ));
    }

    public function getRepostElement($iOwnerId, $sType, $sAction, $iObjectId, $aParams = [])
    {
        $aReposted = $this->_oDb->getReposted($sType, $sAction, $iObjectId);
        if(empty($aReposted) || !is_array($aReposted))
            return '';

        $oModule = $this->getModule();
        $bDisabled = $oModule->isAllowedRepost($aReposted) !== true || $this->_oDb->isReposted($aReposted['id'], $iOwnerId, $oModule->getUserId());
        if($bDisabled && (int)$aReposted['reposts'] == 0)
            return '';

        $sStylePrefix = $this->_oConfig->getPrefix('style');
        $sStylePrefixRepost = $sStylePrefix . '-repost-';

        $sDo = isset($aParams['do']) ? $aParams['do'] : 'repost';
        $bDynamicMode = isset($aParams['dynamic_mode']) && $aParams['dynamic_mode'] === true;       

        $bShowDoRepostAsButtonSmall = isset($aParams['show_do_repost_as_button_small']) && $aParams['show_do_repost_as_button_small'] == true;
        $bShowDoRepostAsButton = !$bShowDoRepostAsButtonSmall && isset($aParams['show_do_repost_as_button']) && $aParams['show_do_repost_as_button'] == true;

        $bShowDoRepostIcon = isset($aParams['show_do_repost_icon']) && $aParams['show_do_repost_icon'] == true && !empty($aParams['icon_do_repost']);
        $bShowDoRepostText = isset($aParams['show_do_repost_text']) && $aParams['show_do_repost_text'] == true && !empty($aParams['text_do_repost']);
        $bShowCounter = isset($aParams['show_counter']) && $aParams['show_counter'] === true;

        //--- Do repost link ---//
        $sClass = $sStylePrefixRepost . 'do-repost';
        if($bShowDoRepostAsButton)
            $sClass .= ' bx-btn';
        else if($bShowDoRepostAsButtonSmall)
            $sClass .= ' bx-btn bx-btn-small';

        $sOnClick = '';
        if(!$bDisabled) {
            $sMethod = '_get' . bx_gen_method_name($sDo) . 'JsClick';
            if(!method_exists($this, $sMethod))
                $sMethod = '_getRepostJsClick';

            $sCommonPrefix = $this->_oConfig->getPrefix('common_post');
            if(str_replace($sCommonPrefix, '', $sType) == BX_TIMELINE_PARSE_TYPE_REPOST) {
                $aRepostedData = unserialize($aReposted['content']);

                $sOnClick = $this->$sMethod($iOwnerId, $aRepostedData['type'], $aRepostedData['action'], $aRepostedData['object_id']);
            }
            else
                $sOnClick = $this->$sMethod($iOwnerId, $sType, $sAction, $iObjectId);
        }
        else
            $sClass .= $bShowDoRepostAsButton || $bShowDoRepostAsButtonSmall ? ' bx-btn-disabled' : ' ' . $sStylePrefixRepost . 'disabled';

        $aOnClickAttrs = array(
            'title' => _t('_bx_timeline_txt_do_' . $sDo)
        );
        if(!empty($sClass))
            $aOnClickAttrs['class'] = $sClass;
        if(!empty($sOnClick))
            $aOnClickAttrs['onclick'] = $sOnClick;

        //--- Do repost label ---//
        $sMethodDoRepostLabel = ''; 
        $sTemplateDoRepostLabel = '';
        if(!empty($aParams['template_do_repost_label'])) {
            $sMethodDoRepostLabel = 'parseHtmlByContent';
            $sTemplateDoRepostLabel = $aParams['template_do_repost_label'];
        }
        else {
            $sMethodDoRepostLabel = 'parseHtmlByName';
            $sTemplateDoRepostLabel = $aParams['template_do_repost_label_name'];
        }

        $sDoRepost = $this->$sMethodDoRepostLabel($sTemplateDoRepostLabel, array(
            'style_prefix' => $sStylePrefix,
            'bx_if:show_icon' => array(
                'condition' => $bShowDoRepostIcon,
                'content' => array(
                    'style_prefix' => $sStylePrefix,
                    'icon' => $this->getImageAuto($aParams['icon_do_' . $sDo])
                )
            ),
            'bx_if:show_text' => array(
                'condition' => $bShowDoRepostText,
                'content' => array(
                    'style_prefix' => $sStylePrefix,
                    'text' => _t($aParams['text_do_' . $sDo])
                )
            )
        ));

        return $this->parseHtmlByName('repost_element_block.html', array(
            'style_prefix' => $sStylePrefix,
            'html_id' => $this->_oConfig->getHtmlIds('repost', 'main') . $aReposted['id'],
            'class' => ($bShowDoRepostAsButton ? $sStylePrefixRepost . 'button' : '') . ($bShowDoRepostAsButtonSmall ? $sStylePrefixRepost . 'button-small' : ''),
            'count' => $aReposted['reposts'],
            'do_repost' => $this->parseLink('javascript:void(0)', $sDoRepost, $aOnClickAttrs),
            'bx_if:show_counter' => array(
                'condition' => $bShowCounter,
                'content' => array(
                    'style_prefix' => $sStylePrefix,
                    'bx_if:show_hidden' => array(
                        'condition' => (int)$aReposted['reposts'] == 0,
                        'content' => array()
                    ),
                    'counter' => $this->getRepostCounter($aReposted, array_merge($aParams, ['show_script' => false]))
                )
            ),
            'script' => $this->getRepostJsScript($bDynamicMode)
        ));
    }

    public function getRepostCounter($aEvent, $aParams = [])
    {
        $sStylePrefix = $this->_oConfig->getPrefix('style');
        $sJsObject = $this->_oConfig->getJsObject('repost');

        $bDynamicMode = isset($aParams['dynamic_mode']) && $aParams['dynamic_mode'] === true;

        $bShowDoRepostAsButtonSmall = isset($aParams['show_do_repost_as_button_small']) && $aParams['show_do_repost_as_button_small'] == true;
        $bShowDoRepostAsButton = !$bShowDoRepostAsButtonSmall && isset($aParams['show_do_repost_as_button']) && $aParams['show_do_repost_as_button'] == true;
        $bShowScript = !isset($aParams['show_script']) || (bool)$aParams['show_script'] === true;

        $sClass = $sStylePrefix . '-repost-counter';
        if($bShowDoRepostAsButtonSmall)
            $sClass .= ' bx-btn-small-height';
        if($bShowDoRepostAsButton)
            $sClass .= ' bx-btn-height';

        return $this->parseHtmlByName('repost_counter.html', [
            'class' => $sClass,
            'bx_repeat:attrs' => [
                ['key' => 'id', 'value' => $this->_oConfig->getHtmlIds('repost', 'counter') . $aEvent['id']],
                ['key' => 'title', 'value' => _t('_bx_timeline_txt_reposted_by')],
                ['key' => 'href', 'value' => 'javascript:void(0)'],
                ['key' => 'onclick', 'value' => 'javascript:' . $sJsObject . '.toggleByPopup(this, ' . $aEvent['id'] . ')']
            ],
            'content' => !empty($aEvent['reposts']) && (int)$aEvent['reposts'] > 0 ? $this->getRepostCounterLabel($aEvent['reposts'], $aParams) : '',
            'script' => $bShowScript ? $this->getRepostJsScript($bDynamicMode) : ''
        ]);
    }

    public function getRepostCounterLabel($iCount, $aParams = [])
    {
        $sStylePrefix = $this->_oConfig->getPrefix('style');

        return $this->parseHtmlByName('repost_counter_label.html', [
            'style_prefix' => $sStylePrefix,
            'bx_if:show_icon' => array(
                'condition' => !isset($aParams['show_counter_label_icon']) || (bool)$aParams['show_counter_label_icon'] === true,
                'content' => array(
                    'style_prefix' => $sStylePrefix,
                    'icon' => $this->_getCounterIcon($aParams),
                )
            ),
            'bx_if:show_text' => array(
                'condition' => !isset($aParams['show_counter_label_text']) || (bool)$aParams['show_counter_label_text'] === true,
                'content' => array(
                    'style_prefix' => $sStylePrefix,
                    'text' => $this->_getCounterLabel($iCount, $aParams)
                )
            )
        ]);
    }

    public function getRepostedBy($iId)
    {
        $aTmplUsers = array();
        $oModule = $this->getModule();
        $sStylePrefix = $this->_oConfig->getPrefix('style');

        $aUserIds = $this->_oDb->getRepostedBy($iId);
        foreach($aUserIds as $iUserId)
            $aTmplUsers[] = array(
                'style_prefix' => $sStylePrefix,
                'user_unit' => $oModule->getObjectUser($iUserId)->getUnit()
            );

        /**
         * @hooks
         * @hookdef hook-bx_timeline-get_reposted_by 'bx_timeline', 'get_reposted_by' - hook to override a list of users reposted a content
         * - $unit_name - equals `bx_timeline`
         * - $action - equals `get_reposted_by`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `content_id` - [int] reposted content id
         *      - `user_ids` - [array] an array with reposters' profile ids
         *      - `users` - [array] by ref, an array with variables (keys) which will be used to parse HTML template, can be overridden in hook processing
         * @hook @ref hook-bx_timeline-get_reposted_by
         */
        bx_alert($this->_oConfig->getName(), 'get_reposted_by', 0, 0, [
            'content_id' => $iId,
            'user_ids' => $aUserIds,
            'users' => &$aTmplUsers,
            'users_ref' => &$aTmplUsers,
        ]);
        
        if(empty($aTmplUsers))
            $aTmplUsers = MsgBox(_t('_Empty'));

        return $this->parseHtmlByName('repost_by_list.html', array(
            'style_prefix' => $sStylePrefix,
            'bx_repeat:list' => $aTmplUsers
        ));
    }

    public function getRepostWith($oForm)
    {
        $sStylePrefix = $this->_oConfig->getPrefix('style');
        $sJsObject = $this->_oConfig->getJsObject('repost');

        return $this->parseHtmlByName('repost_with_popup.html', array(
            'style_prefix' => $sStylePrefix,
            'js_object' => $sJsObject,
            'form' => $oForm->getCode(),
            'form_id' => $oForm->getId()
        ));
    }

    public function getRepostWithFieldReposted($oForm, $aInput)
    {
        $sStylePrefix = $this->_oConfig->getPrefix('style');
        $aBrowseParams = $this->getModule()->getParams();

        $aReposted = $oForm->getReposted();
        $sReposted = $this->getPost($aReposted, $aBrowseParams);

        $sContent = '';
        if(!empty($sReposted))
            $sContent = $this->_getContent($aReposted['content_type'], $aReposted, $aBrowseParams);
        else
            $sContent = MsgBox(_t('_Empty'));

        return $this->parseHtmlByName('repost_with_reposted.html', array(
            'style_prefix' => $sStylePrefix,
            'content' => $sContent
        ));
    }

    public function getRepostTo($oForm)
    {
        $sStylePrefix = $this->_oConfig->getPrefix('style');
        $sJsObject = $this->_oConfig->getJsObject('repost');

        return $this->parseHtmlByName('repost_to_popup.html', array(
            'style_prefix' => $sStylePrefix,
            'js_object' => $sJsObject,
            'form' => $oForm->getCode(),
            'form_id' => $oForm->getId()
        ));
    }

    public function getRepostToFieldList($oForm, $aInput)
    {
        $sStylePrefix = $this->_oConfig->getPrefix('style');

        $oConnection = BxDolConnection::getObjectInstance('sys_profiles_subscriptions');
        if(!$oConnection)
            return '';

        $iProfileId = bx_get_logged_profile_id();
        $aConnectedIds = $oConnection->getConnectedContent($iProfileId);

        $aSelected = array();
        $aTmplVarsModules = array();
        if(!empty($aConnectedIds) && is_array($aConnectedIds)) {
            $aCheckbox = $aInput;
            $aCheckbox['type'] = 'checkbox';
            $aCheckbox['name'] .= '[]';

            foreach($aConnectedIds as $iConnectedId) {
                $oProfile = BxDolProfile::getInstanceMagic($iConnectedId);
                if(!$oProfile)
                    continue;

                $sProfileModule = $oProfile->getModule();
                if(!isset($aTmplVarsModules[$sProfileModule]))
                    $aTmplVarsModules[$sProfileModule] = array(
                        'style_prefix' => $sStylePrefix,
                        'title' => _t('_' . $sProfileModule),
                        'bx_repeat:contexts' => array()
                    );
                        
                $aCheckbox['value'] = $iConnectedId;
                $aCheckbox['checked'] = in_array($iConnectedId, $aSelected) ? 1 : 0;

                $aTmplVarsModules[$sProfileModule]['bx_repeat:contexts'][] = array(
                    'style_prefix' => $sStylePrefix,
                    'checkbox' => $oForm->genInputCheckbox($aCheckbox, true),
                    'unit' => $oProfile->getUnit(0, array('template' => 'unit_wo_cover'))
                );
            }
        }      

        return $this->parseHtmlByName('repost_to_list.html', array(
            'style_prefix' => $sStylePrefix,
            'bx_repeat:modules' => !empty($aTmplVarsModules)? array_values($aTmplVarsModules) : MsgBox(_t('_Empty'))
        ));
    }

    public function getRepostJsScript($bDynamicMode = false)
    {
        $sCode = $this->getJsCode('repost', array(), array('mask' => '{object} = new {class}({params});', 'wrap' => false));

        if($bDynamicMode) {
            $sJsObject = $this->_oConfig->getJsObject('repost');

            $sCode = "var " . $sJsObject . " = null; 
            if(typeof(window.BxTimelineRepost) === 'undefined')
                $.getScript('" . bx_js_string($this->getJsUrl('main.js'), BX_ESCAPE_STR_APOS) . "', function(data, textStatus, jqxhr) {
                    $.getScript('" . bx_js_string($this->getJsUrl('repost.js'), BX_ESCAPE_STR_APOS) . "', function(data, textStatus, jqxhr) {
                        bx_get_style('" . bx_js_string($this->getCssUrl('repost.css'), BX_ESCAPE_STR_APOS) . "');
                        " . $sCode . "
                    });
                }); ";
        }
        else {
            $sCode = "var " . $sCode;

            $this->addCss(array('repost.css'));
            $this->addJs(array('main.js', 'repost.js'));
        }

        return $this->_wrapInTagJsCode($sCode);
    }

    public function getRepostJsClick($iOwnerId, $sType, $sAction, $iObjectId)
    {
        $aReposted = $this->_oDb->getReposted($sType, $sAction, $iObjectId);
        if(empty($aReposted) || !is_array($aReposted))
            return '';

        $sResult = '';
        $sCommonPrefix = $this->_oConfig->getPrefix('common_post');
        if(str_replace($sCommonPrefix, '', $sType) == BX_TIMELINE_PARSE_TYPE_REPOST) {
            $aRepostedData = unserialize($aReposted['content']);

            $sResult = $this->_getRepostJsClick($iOwnerId, $aRepostedData['type'], $aRepostedData['action'], $aRepostedData['object_id']);
        }
        else
            $sResult = $this->_getRepostJsClick($iOwnerId, $sType, $sAction, $iObjectId);

        return $sResult;
    }

    public function getRepostWithJsClick($iReposterId, $sType, $sAction, $iObjectId)
    {
        $aReposted = $this->_oDb->getReposted($sType, $sAction, $iObjectId);
        if(empty($aReposted) || !is_array($aReposted))
            return '';

        $sResult = '';
        $sCommonPrefix = $this->_oConfig->getPrefix('common_post');
        if(str_replace($sCommonPrefix, '', $sType) == BX_TIMELINE_PARSE_TYPE_REPOST) {
            $aRepostedData = unserialize($aReposted['content']);

            $sResult = $this->_getRepostWithJsClick($iReposterId, $aRepostedData['type'], $aRepostedData['action'], $aRepostedData['object_id']);
        }
        else
            $sResult = $this->_getRepostWithJsClick($iReposterId, $sType, $sAction, $iObjectId);

        return $sResult;
    }

    public function getRepostToJsClick($iReposterId, $sType, $sAction, $iObjectId)
    {
        $aReposted = $this->_oDb->getReposted($sType, $sAction, $iObjectId);
        if(empty($aReposted) || !is_array($aReposted))
            return '';

        $sResult = '';
        $sCommonPrefix = $this->_oConfig->getPrefix('common_post');
        if(str_replace($sCommonPrefix, '', $sType) == BX_TIMELINE_PARSE_TYPE_REPOST) {
            $aRepostedData = unserialize($aReposted['content']);

            $sResult = $this->_getRepostToJsClick($iReposterId, $aRepostedData['type'], $aRepostedData['action'], $aRepostedData['object_id']);
        }
        else
            $sResult = $this->_getRepostToJsClick($iReposterId, $sType, $sAction, $iObjectId);

        return $sResult;
    }

    public function getAttachLinkForm($iEventId = 0)
    {
        $sStylePrefix = $this->_oConfig->getPrefix('style');
        $sJsObject = $this->_oConfig->getJsObject('post');

        $aForm = $this->getModule()->getFormAttachLink($iEventId);

        return $this->parseHtmlByName('attach_link_form.html', array(
            'style_prefix' => $sStylePrefix,
            'js_object' => $sJsObject,
            'form_id' => $aForm['form_id'],
            'form' => $aForm['form'],
        ));
    }

    public function getAttachLinkField($iUserId, $iEventId = 0)
    {
        $sStylePrefix = $this->_oConfig->getPrefix('style');

        if(!$iEventId)
            $aLinks = $this->_oDb->getUnusedLinks($iUserId);
        else
            $aLinks = $this->_oDb->getLinks($iEventId);

        $sLinks = '';
        foreach($aLinks as $aLink)
            $sLinks .= $this->getAttachLinkItem($iUserId, $aLink);

        return $this->parseHtmlByName('attach_link_form_field.html', array(
            'html_id' => $this->_oConfig->getHtmlIds('post', 'attach_link_form_field') . $iEventId,
            'style_prefix' => $sStylePrefix,
            'links' => $sLinks
        ));
    }

    public function getAttachLinkItem($iUserId, $mixedLink, $aParams = [])
    {
        return parent::getAttachLinkItem($iUserId, $mixedLink, array_merge($aParams ?? [], [
            'html_id_link_item' => $this->_oConfig->getHtmlIds('post', 'attach_link_item'),
            'style_prefix' => $this->_oConfig->getPrefix('style'),
            'js_object' => $this->_oConfig->getJsObject('post'),
            'transcoder' => $this->_oConfig->getObject('transcoder_photos_preview')
        ]));
    }

    public function getData(&$aEvent, $aBrowseParams = array())
    {
        $aResult = $this->_oConfig->isSystem($aEvent['type'], $aEvent['action']) ? $this->_getSystemData($aEvent, $aBrowseParams) : $this->_getCommonData($aEvent, $aBrowseParams);
        if(empty($aResult) || empty($aResult['object_owner_id']) || empty($aResult['content']))
            return false;

        $sSample = !empty($aResult['sample']) ? $aResult['sample'] : '_bx_timeline_txt_sample';

        $aUpdate = [
            'object_owner_id' => $aResult['object_owner_id']
        ];

        //--- Update Object Provacy View if provided.
        if(!empty($aResult['object_privacy_view']))
            $aUpdate['object_privacy_view'] = $aResult['object_privacy_view'];

        //--- Update Title if empty.
        if(empty($aEvent['title'])) {
            $sTitle = !empty($aResult['title']) ? $this->_oConfig->getTitle($aResult['title']) : _t($sSample);

            $aUpdate['title'] = bx_process_input(strip_tags($sTitle));
        }

        //--- Update Description if empty.
        if(empty($aEvent['description'])) {
            $sUserName = $this->getModule()->getObjectUser($aResult['object_owner_id'])->getDisplayName();

            $sDescription = !empty($aResult['description']) ? $aResult['description'] : _t('_bx_timeline_txt_user_added_sample', $sUserName, _t($sSample));
            if($sDescription == '' && !empty($aResult['content']['text']))
                $sDescription = $aResult['content']['text'];

            $aUpdate['description'] = bx_process_input(strip_tags($sDescription));
        }

        if(!empty($aUpdate) && is_array($aUpdate)) 
            $this->_oDb->updateEvent($aUpdate, array('id' => $aEvent['id']));

        //--- Update Flags ---//
        $aContent = &$aResult['content'];
        $aFlagTypes = $this->_oConfig->getFiltersMedia();
        foreach($aFlagTypes as $sFt)
            if((!empty($aContent[$sFt]) && is_array($aContent[$sFt])) || (!empty($aContent[$sFt . '_attach']) && is_array($aContent[$sFt .'_attach'])))
                $this->_oDb->updateEventFlagsByType($sFt, $aEvent['id']);

        return $aResult;
    }

    public function getDataCached($aEvent, $aBrowseParams = array())
    {
        /**
         * Item Cache is disabled for API calls to avoid issues with personalized 
         * content in items (like attched polls, etc).
         */
        if($this->_bIsApi || !$this->_oConfig->isCacheItem())
            return $this->getData($aEvent, $aBrowseParams);

        /**
         * For now parameters from $aBrowseParams array aren't used during data retrieving.
         * If they will then the cache should be created depending on their values.
         */
        $sCacheKey = $this->_oConfig->getCacheItemKey($aEvent['id']);
        $iCacheLifetime = $this->_oConfig->getCacheItemLifetime();

        $oCache = $this->getModule()->getCacheItemObject();
        $aCached = $oCache->getData($sCacheKey, $iCacheLifetime);
        if(!empty($aCached)) 
            return unserialize($aCached);

        $aBrowseParams['dynamic_mode'] = true;
        $aResult = $this->getData($aEvent, $aBrowseParams);
        if(empty($aResult) || (isset($aResult['_cache']) && (bool)$aResult['_cache'] === false))
            return $aResult;

        $oCache->setData($sCacheKey, serialize($aResult), $iCacheLifetime);           
        return $aResult;
    }

    public function getVideo($aEvent, $aVideo)
    {
        $sVideoId = $this->_oConfig->getHtmlIds('view', 'video') . $aEvent['id'] . '-' . $aVideo['id'];
        $oPlayer = BxDolPlayer::getObjectInstance();
        if (!$oPlayer)
            return '';

        $sPlayer = $oPlayer->getCodeVideo (BX_PLAYER_EMBED, array(
            'poster' => $aVideo['src_poster'],
            'mp4' => array('sd' => $aVideo['src_mp4'], 'hd' => $aVideo['src_mp4_hd']),
            'attrs' => array('id' => $sVideoId),
        ));
        return $this->parseHtmlByName('video_player.html', array(
            'player' => $sPlayer,
            'html_id' => $sVideoId
        ));
    }

    /*
     * Show only one Live Update notification for all new Events.
     */
    function getLiveUpdate($aBrowseParams, $iProfileId, $iCountOld = 0, $iCountNew = 0)
    {
        $oModule = $this->getModule();

    	$iCount = (int)$iCountNew - (int)$iCountOld;
    	if($iCount < 0)
            return '';

        $aParams = $oModule->getParamsExt($aBrowseParams);
        $aParams['start'] = 0;
        $aParams['per_page'] = 1;
        $aParams['newest'] = true;
        $aParams['filter'] = BX_TIMELINE_FILTER_OTHER_VIEWER;
        $aEvents = $this->_oDb->getEvents($aParams);
        if(empty($aEvents) || !is_array($aEvents))
            return '';

        $aEvent = array_shift($aEvents);
        if(empty($aEvent) || !is_array($aEvent))
            return '';

        $sJsObject = $this->_oConfig->getJsObjectView($aParams);
        $sStylePrefix = $this->_oConfig->getPrefix('style');

        return $this->parseHtmlByName('live_update_button.html', array(
            'style_prefix' => $sStylePrefix,
            'html_id' => $this->_oConfig->getHtmlIds('view', 'live_update_popup') . $aBrowseParams['type'],
            'onclick_show' => "javascript:" . $sJsObject . ".goToBtn(this, 'timeline-event-" . $aEvent['id'] . "', '" . $aEvent['id'] . "');",
        ));
    }

    /*
     * Show Live Update notification separately for each new Event. Popup Chain is used here.
     * 
     * Note. This way to display live update notifications isn't used for now. 
     * See BxTimelineTemplate::getLiveUpdate method instead.
     */
    function getLiveUpdates($aBrowseParams, $iProfileId, $iCountOld = 0, $iCountNew = 0)
    {
        $bShowAll = true;
        $bShowActions = false;
        $oModule = $this->getModule();

    	$iCount = (int)$iCountNew - (int)$iCountOld;
    	if($iCount < 0)
            return '';

        $iCountMax = $this->_oConfig->getLiveUpdateLength();
        if($iCount > $iCountMax)
            $iCount = $iCountMax;

        $aParams = $oModule->getParamsExt($aBrowseParams);
        $aParams['start'] = 0;
        $aParams['per_page'] = $iCount;
        $aParams['filter'] = BX_TIMELINE_FILTER_OTHER_VIEWER;
        $aEvents = $this->_oDb->getEvents($aParams);
        if(empty($aEvents) || !is_array($aEvents))
            return '';

        $sJsObject = $this->_oConfig->getJsObjectView($aParams);
        $sStylePrefix = $this->_oConfig->getPrefix('style');

        $iUserId = $oModule->getUserId();
        $bModerator = $oModule->isModerator();

        $aEvents = array_reverse($aEvents);
        $iEvents = count($aEvents);

        $aTmplVarsItems = array();
        foreach($aEvents as $iIndex => $aEvent) {
            $aData = $this->getDataCached($aEvent);
            if($aData === false)
                continue;

            $iEventId = $aEvent['id'];
            $iEventAuthorId = $this->_oConfig->isSystem($aEvent['type'], $aEvent['action']) ? (int)$aEvent['owner_id'] : (int)$aEvent['object_id'];
            if($iEventAuthorId < 0) {
                if(abs($iEventAuthorId) == $iUserId)
                    continue;
                else if($bModerator)
                    $iEventAuthorId *= -1;
            }

            $oAuthor = $oModule->getObjectUser($iEventAuthorId);
            $sAuthorName = $oAuthor->getDisplayName();

            $aTmplVarsItems[] = array(
                'bx_if:show_as_hidden' => array(
                    'condition' => !$bShowAll && $iIndex < ($iEvents - 1),
                    'content' => array(),
                ),
                'item' => $this->parseHtmlByName('live_update_notification.html', array(
                    'style_prefix' => $sStylePrefix,
                    'onclick_show' => "javascript:" . $sJsObject . ".goTo(this, 'timeline-event-" . $iEventId . "', '" . $iEventId . "');",
                    'author_link' => $oAuthor->getUrl(), 
                    'author_title' => bx_html_attribute($sAuthorName),
                    'author_name' => $sAuthorName,
                    'author_unit' => $oAuthor->getUnit(0, array('template' => 'unit_wo_info_links')), 
                    'text' => _t($aData['sample_action'], _t($aData['sample'])),
                )),
                'bx_if:show_previous' => array(
                    'condition' => $bShowActions && $iIndex > 0,
                    'content' => array(
                        'onclick_previous' => $sJsObject . '.previousLiveUpdate(this)'
                    )
                ),
                'bx_if:show_close' => array(
                    'condition' => $bShowActions,
                    'content' => array(
                        'onclick_close' => $sJsObject . '.hideLiveUpdate(this)'
                    )
                )
            );
        }

        return $this->parseHtmlByName('popup_chain.html', array(
            'html_id' => $this->_oConfig->getHtmlIds('view', 'live_update_popup') . $aBrowseParams['type'],
            'bx_repeat:items' => $aTmplVarsItems
        ));
    }

    protected function _getPost($sType, $aEvent, $aBrowseParams = array())
    {
        $CNF = &$this->_oConfig->CNF;

        $oModule = $this->getModule();
        $sStylePrefix = $this->_oConfig->getPrefix('style');
        $sJsObject = $this->_oConfig->getJsObjectView($aBrowseParams);

        $bViewItem = isset($aBrowseParams['view']) && $aBrowseParams['view'] == BX_TIMELINE_VIEW_ITEM;
        $bViewOutline = isset($aBrowseParams['view']) && $aBrowseParams['view'] == BX_TIMELINE_VIEW_OUTLINE;

        $oAuthor = $oModule->getObjectUser($aEvent['object_owner_id']);
        $sAuthorName = $oAuthor->getDisplayName(); 
        $sAuthorUrl = $oAuthor->getUrl();
        $sAuthorUnit = $oAuthor->getUnit(0, array('template' => 'unit_wo_info'));
        $sAuthorBadges = $oAuthor->getBadges();
        $sAuthorAction = '';

        if(!empty($aEvent['sample_action_custom']) && is_array($aEvent['sample_action_custom'])) {
            $aAuthorAction = $aEvent['sample_action_custom'];

            foreach($aAuthorAction['markers'] as $iIndex => $sMarker)
                if(get_mb_substr($sMarker, 0, 1) == '_')
                    $aAuthorAction['markers'][$iIndex] = _t($sMarker);

            $sAuthorAction = bx_replace_markers(_t($aAuthorAction['content']), $aAuthorAction['markers']);
        }
        else
            $sAuthorAction = _t($aEvent['sample_action'], _t($aEvent['sample']));

        if(($bViewItem || $this->_oConfig->isCountAllViews()) && !empty($aEvent['views']) && is_array($aEvent['views']) && isset($aEvent['views']['system']))
            $oModule->getViewObject($aEvent['views']['system'], $aEvent['views']['object_id'])->doView();

        $aTmplVarsNote = $this->_getTmplVarsNote($aEvent);
        $aTmplVarsMenuItemCounters = $this->_getTmplVarsMenuItemCounters($aEvent, $aBrowseParams);
        $aTmplVarsMenuItemActions = $this->_getTmplVarsMenuItemActions($aEvent, $aBrowseParams);
        $aTmplVarsMenuItemMeta = $this->_getTmplVarsMenuItemMeta($aEvent, $aBrowseParams);

        $aTmplVarsManage = $this->_getTmplVarsManage($aEvent, $aBrowseParams);

        $aTmplVarsTimelineOwner = $this->_getTmplVarsTimelineOwner($aEvent);
        $bTmplVarsTimelineOwner = !empty($aTmplVarsTimelineOwner);

        $aTmplVarsOwnerActions = $this->_getTmplVarsOwnerActions($aEvent, $aBrowseParams);
        $bTmplVarsOwnerActions = !empty($aTmplVarsOwnerActions); 

        $bPinned = $aBrowseParams['type'] == BX_BASE_MOD_NTFS_TYPE_OWNER && (int)$aEvent['pinned'] > 0;
        $bSticked = (int)$aEvent['sticked'] > 0;
        $bPromoted = (int)$aEvent['promoted'] > 0;

        $sClass = $sStylePrefix . '-view-sizer';
        if($bViewOutline) {
            $sClass = $sStylePrefix . '-grid-item-sizer';
            if($bPinned || $bSticked || $bPromoted) {
                $sClass .= ' ' . $sStylePrefix . '-gis';

            if($bPinned)
                $sClass .= '-pnd';
            if($bSticked)
                $sClass .= '-psd';
            if($bPromoted)
                $sClass .= '-pmd';
            }
        }

        $sClass .= ' ' . $aEvent['type'] . (!empty($aEvent['action']) ? ' ' . $aEvent['action'] : '');
        $aAuthorAcl = BxDolAcl::getInstance()->getMemberMembershipInfo($aEvent['object_owner_id']);
        if(!empty($aAuthorAcl) && isset($this->_aAclId2Name[$aAuthorAcl['id']]))
            $sClass .= ' ' . $sStylePrefix . '-aml-' . $this->_aAclId2Name[$aAuthorAcl['id']];

        if(!empty($aBrowseParams['blink']) && in_array($aEvent['id'], $aBrowseParams['blink']))
            $sClass .= ' ' . $sStylePrefix . '-blink';
        if($bPinned)
            $sClass .= ' ' . $sStylePrefix . '-pinned';
        if($bSticked)
            $sClass .= ' ' . $sStylePrefix . '-sticked';
        if($bPromoted)
            $sClass .= ' ' . $sStylePrefix . '-promoted';

        $sClassOwner = $bTmplVarsOwnerActions ? $sStylePrefix . '-io-with-actions' : '';

        $oMetatags = BxDolMetatags::getObjectInstance($this->_oConfig->getObject('metatags'));
        $sLocation = $oMetatags->locationsString($aEvent['id']);
 
        $sFields = '';
        if(!$bViewItem) {
            $oForm = BxDolForm::getObjectInstance($this->_oConfig->getObject('form_post'), $this->_oConfig->getObject('form_display_post_view'), $this, $aEvent['id']);
            $oForm->initChecker($aEvent);

            if(!empty($oForm->aInputs) && is_array($oForm->aInputs))
                foreach($oForm->aInputs as $aInput)
                    if($aInput['type'] != 'hidden' && !empty($aInput['value'])) {
                        $sFields = $oForm->getCode();
                        break;
                    }
        }

        $sIcon = !empty($aEvent['icon']) ? $aEvent['icon'] : $CNF['ICON'];

        $aTmplVars = array (
            'style_prefix' => $sStylePrefix,
            'js_object' => $sJsObject,
            'html_id' => $this->_oConfig->getHtmlIdView('item', $aBrowseParams, array('whole' => false)) . $aEvent['id'],
            'class' => $sClass,
            'class_owner' => $sClassOwner,
            'class_content' => $bViewItem ? 'bx-def-color-bg-block' : 'bx-def-color-bg-box',
            'id' => $aEvent['id'],
            'bx_if:show_note' => array(
                'condition' => !empty($aTmplVarsNote),
                'content' => $aTmplVarsNote
            ),
            'bx_if:show_owner_actions' => array(
                'condition' => $bTmplVarsOwnerActions,
                'content' => $aTmplVarsOwnerActions
            ),
            'item_icon' => $sIcon,
            'item_owner_url' => $sAuthorUrl,
            'item_owner_title' => bx_html_attribute($sAuthorName),
            'item_owner_name' => $sAuthorName,
            'item_owner_badges' => $sAuthorBadges,
            'item_owner_unit' => $sAuthorUnit,
            'item_view_url' => $this->_oConfig->getItemViewUrl($aEvent),
            'item_date' => bx_time_js($aEvent['date']),
            'bx_if:show_pinned' => array(
            	'condition' => $bPinned,
            	'content' => array(
                    'style_prefix' => $sStylePrefix,
            	)
            ),
            'bx_if:show_sticked' => array(
            	'condition' => $bSticked,
            	'content' => array(
                    'style_prefix' => $sStylePrefix,
            	)
            ),
            'bx_if:show_hot' => array(
            	'condition' => $this->_oConfig->isHotEvent($aEvent['id']),
            	'content' => array(
                    'style_prefix' => $sStylePrefix,
            	)
            ),
            'bx_if:show_manage' => array(
                'condition' => !empty($aTmplVarsManage),
                'content' => $aTmplVarsManage
            ),
            'bx_if:show_item_action' => array(
                'condition' => $this->_oConfig->isSystem($aEvent['type'], $aEvent['action']) || $bTmplVarsTimelineOwner,
                'content' => array(
                    'style_prefix' => $sStylePrefix,
                    'item_icon' => $sIcon,
                    'item_owner_action' => $sAuthorAction,
                    'bx_if:show_timeline_owner' => array(
                        'condition' => $bTmplVarsTimelineOwner,
                        'content' => $aTmplVarsTimelineOwner
                    ),
                )
            ),
            'content_type' => $sType,
            'content' => is_string($aEvent['content']) ? $aEvent['content'] : $this->_getContent($sType, $aEvent, $aBrowseParams),
            'bx_if:show_location' => array(
            	'condition' => !empty($sLocation),
            	'content' => array(
                    'style_prefix' => $sStylePrefix,
                    'location' => $sLocation
            	)
            ),
            'bx_if:show_fields' => array(
                'condition' => !empty($sFields),
                'content' => array(
                    'style_prefix' => $sStylePrefix,
                    'fields' => $sFields
            	)
            ),
            'bx_if:show_menu_item_counters' => array(
                'condition' => !empty($aTmplVarsMenuItemCounters),
                'content' => $aTmplVarsMenuItemCounters
            ),
            'bx_if:show_menu_item_actions' => array(
                'condition' => !empty($aTmplVarsMenuItemActions),
                'content' => $aTmplVarsMenuItemActions
            ),
            'bx_if:show_menu_item_meta' => array(
                'condition' => !empty($aTmplVarsMenuItemMeta),
                'content' => $aTmplVarsMenuItemMeta
            ),
            'comments' => '',
            'line_number' => isset($aEvent['index']) ? $aEvent['index'] : 0
        );

        $iPreloadComments = $this->_oConfig->getPreloadComments();
        if($iPreloadComments > 0 && $oModule->isAllowedComment($aEvent) && in_array($aBrowseParams['view'], array(BX_TIMELINE_VIEW_TIMELINE, BX_TIMELINE_VIEW_OUTLINE)))
            $aTmplVars['comments'] = $this->_getComments($aEvent['comments'], array_merge($aBrowseParams, array(
                'cmts_preload_number' => $iPreloadComments,
                'cmts_min_post_form' => false
            )));       

        $sVariable = '_sTmplContentItem' . bx_gen_method_name($aBrowseParams['view']);
        if(empty(self::$$sVariable))
            self::$$sVariable = $this->getHtml('item_' . $aBrowseParams['view'] . '.html');

        $sTmplCode = self::$$sVariable;
        
        /**
         * @hooks
         * @hookdef hook-bx_timeline-get_post 'bx_timeline', 'get_post' - hook to override a post (event) before output
         * - $unit_name - equals `bx_timeline`
         * - $action - equals `get_post`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `type` - [string] post type: post or repost
         *      - `event` - [array] event data array as key&value pairs
         *      - `browse_params` - [array] browse params array as key&value pairs
         *      - `tmpl_code` - [string] by ref, template HTML code, can be overridden in hook processing
         *      - `tmpl_vars` - [array] by ref, template parsable variables as key&value pairs, can be overridden in hook processing
         * @hook @ref hook-bx_timeline-get_post
         */
        bx_alert($this->_oConfig->getName(), 'get_post', 0, 0, [
            'type' => $sType,
            'event' => $aEvent,
            'browse_params' => $aBrowseParams,

            'tmpl_code' => &$sTmplCode,
            'tmpl_vars' => &$aTmplVars,

            'tmpl_code_ref' => &$sTmplCode,
            'tmpl_vars_ref' => &$aTmplVars,
        ]);

        return $this->parseHtmlByContent($sTmplCode, $aTmplVars);
    }

    protected function _getPostApi(&$aEvent, $aParams = [])
    {
        $oModule = $this->getModule();
        $bViewItem = isset($aParams['view']) && $aParams['view'] == BX_TIMELINE_VIEW_ITEM;

        $iAuthorId = (int)$aEvent['object_owner_id'];
        $oAuthor = BxDolProfile::getInstance($iAuthorId);

        $aEvent = array_merge($aEvent, [
            'author_data' => BxDolProfile::getData($iAuthorId),
            'author_badges' => $oAuthor !== false ? $oAuthor->getBadges() : [],
            'author_actions' => [],
            'context_data' => (int)$aEvent['object_privacy_view'] < 0 ? BxDolProfile::getData(abs($aEvent['object_privacy_view'])) : []
        ]);

        if(($iLoggedId = (int)bx_get_logged_profile_id()) != 0 && $iLoggedId != $iAuthorId && $oAuthor !== false) {
            $mixedCheckResults = bx_srv($oAuthor->getModule(), 'check_allowed_with_content', ['subscribe_add', $oAuthor->getContentId()]);
            if($mixedCheckResults === CHECK_ACTION_RESULT_ALLOWED)
                $aEvent['author_actions'][] = [
                    'type' => 'connections',
                    'o' => $this->_oConfig->getObject('conn_subscriptions'),
                    'a' => 'add',
                    'iid' => $iLoggedId,
                    'cid' => $iAuthorId,
                    'title' => _t('_sys_menu_item_title_sm_subscribe'),
                ];
        }

        $aEvent['url'] = '';
        if(!empty($aEvent['content']['url']))
            $aEvent['url'] = $aEvent['content']['url'] = bx_api_get_relative_url($aEvent['content']['url']);

        if(($sKc = 'content') && !empty($aEvent[$sKc]) && is_array($aEvent[$sKc])) {
            $aCnt = &$aEvent[$sKc];

            if(($sKt = 'text') && !empty($aCnt[$sKt])) {
                $sMethodPrepare = '_prepareTextForOutput';
                if($this->_oConfig->isBriefCards() && !$bViewItem)
                    $sMethodPrepare .= 'BriefCard';

                $aCnt[$sKt] = $this->$sMethodPrepare($aCnt[$sKt], $aEvent['id']);
            }

            if(($sKe = 'embed') && empty($aCnt[$sKe]) || !is_array($aCnt[$sKe])) {
                if(($sKl = 'links') && !empty($aCnt[$sKl]) && is_array($aCnt[$sKl])) {
                    bx_import('BxDolEmbed');
                    if(($oEmbed = BxDolEmbed::getObjectInstance('sys_system')) !== false)
                        $aCnt[$sKe] = $oEmbed->getLinkHTML(current($aCnt[$sKl])['url']);
                }
                else if(($sKt = 'text') && !empty($aCnt[$sKt]))
                    $aCnt[$sKe] = bx_linkify_embeded($aCnt[$sKt]);
            }
        }

        //--- Menu: Actions
        if(empty($aEvent['menu_actions'])) {
            $oMenuActions = BxDolMenu::getObjectInstance($this->_oConfig->getObject('menu_item_actions_all'));
            if(!$oMenuActions)
                $oMenuActions = BxDolMenu::getObjectInstance($this->_oConfig->getObject('menu_item_actions'));
        }
        else
            $oMenuActions = $aEvent['menu_actions'];

        $aEvent['menu_actions'] = $oMenuActions !== false && $oMenuActions->setEvent($aEvent, $aParams) ? $oMenuActions->getCodeAPI() : [];

        //--- Menu: Manage
        if(empty($aEvent['menu_manage']))
            $oMenuManage = BxDolMenu::getObjectInstance($this->_oConfig->getObject('menu_item_manage'));
        else
            $oMenuManage = $aEvent['menu_manage'];

        $aEvent['menu_manage'] = $oMenuManage !== false && $oMenuManage->setEvent($aEvent, $aParams) && $oMenuManage->isVisible() ? $oMenuManage->getShortCodeAPI() : [];

        //--- Menu: Counters
        if(empty($aEvent['menu_counters']))
            $oMenuCounters = BxDolMenu::getObjectInstance($this->_oConfig->getObject('menu_item_counters'));
        else
            $oMenuCounters = $aEvent['menu_counters'];

        $aEvent['menu_counters'] = $oMenuCounters !== false && $oMenuCounters->setEvent($aEvent, $aParams) ? $oMenuCounters->getCodeAPI() : [];

        if(!isset($aParams['type']) || $aParams['type'] != 'owner')
            $aEvent['owners'] = $this->_getTmplVarsTimelineOwner($aEvent);

        if(($oCmts = $oModule->getCmtsObject($aEvent['comments']['system'], $aEvent['comments']['object_id'])) !== false) {
            $aEvent['cmts'] = [];
            if(($iCmtsPreload = (int)getParam('bx_timeline_preload_comments')) > 0) {
                $aCmts = bx_srv('system', 'get_comments_api', [$oCmts, [
                    'mode' => 'feed', 
                    'order_way' => 'desc', 
                    'start_from' => 0,
                    'per_view' => $iCmtsPreload,
                    'is_form' => false, 
                ]], 'TemplCmtsServices');

                if(!empty($aCmts['data']) && is_array($aCmts['data'])) {
                    $aCmts['data'] = array_reverse($aCmts['data']);
                }
                $aEvent['cmts'] = $aCmts;
                
            }

            $aEvent['cmts']['count'] = $aEvent['comments']['count'];
        }

        /**
         * Disabled because it filter out non-standard fields, 
         * like price from Ads or dates from Events.
         * 
        $aEvent['content'] = array_intersect_key($aEvent['content'], array_flip([
            'object_id', 'title', 'text', 'links', 'images', 'images_attach', 'videos', 'videos_attach', 'files', 'files_attach', 'parse_type', 'owner_name', 'embed'
        ]));
         */

        return array_intersect_key($aEvent, array_flip([
            'id', 'type', 'object_privacy_view', 'content', 'labels', 'date', 'menu_actions', 'menu_counters', 'menu_manage', 'author_data', 'author_badges', 'author_actions', 'context_data', 'url', 'owners', 'cmts', 'module', 'title', 'pinned', 'sticked', 'promoted'
        ]));
    }

    protected function _getContent($sType, $aEvent, $aBrowseParams = array())
    {
        $sMethod = '_getTmplVarsContent' . ucfirst($sType);
        if(!method_exists($this, $sMethod))
            return '';

        $aTmplVars = $this->$sMethod($aEvent, $aBrowseParams);

        $sVariable = '_sTmplContentType' . bx_gen_method_name($sType);
        if(empty(self::$$sVariable))
            self::$$sVariable = $this->getHtml('type_' . $sType . '.html');

        $sTmplCode = self::$$sVariable;
        
        /**
         * @hooks
         * @hookdef hook-bx_timeline-get_post_content 'bx_timeline', 'get_post_content' - hook to override a post's content before output
         * It's equivalent to @ref hook-bx_timeline-get_post
         * @hook @ref hook-bx_timeline-get_post_content
         */
        bx_alert($this->_oConfig->getName(), 'get_post_content', 0, 0, [
            'type' => $sType,
            'event' => $aEvent,
            'browse_params' => $aBrowseParams,

            'tmpl_code' => &$sTmplCode,
            'tmpl_vars' => &$aTmplVars,

            'tmpl_code_ref' => &$sTmplCode,
            'tmpl_vars_ref' => &$aTmplVars,
        ]);

        return $this->parseHtmlByContent($sTmplCode, $aTmplVars);
    }

    protected function _getComments($aComments, $aBrowseParams = array())
    {
        
        $mixedComments = $this->getModule()->getCommentsData($aComments);
        if($mixedComments === false)
            return '';

        list($sSystem, $iObjectId, $iCount) = $mixedComments;
        return $this->getComments($sSystem, $iObjectId, $aBrowseParams);
    }

    protected function _getShowMore($aParams)
    {
        return $this->parseHtmlByName('show_more.html', array(
            'style_prefix' => $this->_oConfig->getPrefix('style'),
            'js_object' => $this->_oConfig->getJsObjectView($aParams),
        ));
    }

    protected function _getImagePopup($aParams)
    {
        $sViewImagePopupId = $this->_oConfig->getHtmlIdView('photo_popup', $aParams);
        $sViewImagePopupContent = $this->parseHtmlByName('popup_image.html', array(
            'image_url' => ''
    	));

    	return BxTemplFunctions::getInstance()->transBox($sViewImagePopupId, $sViewImagePopupContent, true);
    }

    protected function _getRepostJsClick($iOwnerId, $sType, $sAction, $iObjectId)
    {
        $sJsObject = $this->_oConfig->getJsObject('repost');
        $sFormat = "%s.repostItem(this, %d, '%s', '%s', %d);";

        $iOwnerId = !empty($iOwnerId) ? (int)$iOwnerId : $this->getModule()->getUserId(); //--- in whose timeline the content will be reposted
        return sprintf($sFormat, $sJsObject, $iOwnerId, $sType, $sAction, (int)$iObjectId);
    }

    protected function _getRepostWithJsClick($iReposterId, $sType, $sAction, $iObjectId)
    {
        $sJsObject = $this->_oConfig->getJsObject('repost');
        $sFormat = "%s.repostItemWith(this, %d, '%s', '%s', %d);";

        $iReposterId = !empty($iReposterId) ? (int)$iReposterId : $this->getModule()->getUserId();
        return sprintf($sFormat, $sJsObject, $iReposterId, $sType, $sAction, (int)$iObjectId);
    }

    protected function _getRepostToJsClick($iReposterId, $sType, $sAction, $iObjectId)
    {
        $sJsObject = $this->_oConfig->getJsObject('repost');
        $sFormat = "%s.repostItemTo(this, %d, '%s', '%s', %d);";

        $iReposterId = !empty($iReposterId) ? (int)$iReposterId : $this->getModule()->getUserId();
        return sprintf($sFormat, $sJsObject, $iReposterId, $sType, $sAction, (int)$iObjectId);
    }

    protected function _getJumpToList($aParams)
    {
        $iYearSel = (int)$aParams['timeline'];
        $iYearMin = $this->_oDb->getMaxDuration($aParams);      
        if(empty($iYearMin))
            return '';

        $sStylePrefix = $this->_oConfig->getPrefix('style');
        $sJsObject = $this->_oConfig->getJsObjectView($aParams);

        $aYears = array();
        $iYearMax = date('Y', time()) - 1;
        for($i = $iYearMax; $i >= $iYearMin; $i--) {
            $bCurrent = $i == $iYearSel;
            $aYears[] = array(
                'style_prefix' => $sStylePrefix,
                'bx_if:show_link' => array(
                    'condition' => !$bCurrent,
                    'content' => array(
                        'title' => _t('_bx_timeline_txt_jump_to_n_year', $i),
                        'onclick' => 'javascript:' . $sJsObject . '.changeTimeline(this, \'' . $i . '-12-31\')',
                        'content' => $i
                    )
                ),
                'bx_if:show_text' => array(
                    'condition' => $bCurrent,
                    'content' => array(
                        'content' => $i
                    )
                ),
            );
        }

        return $this->parseHtmlByName('jump_to.html', array(
            'bx_if:show_list' => array(
                'condition' => true,
                'content' => array(
                    'style_prefix' => $sStylePrefix,
                    'bx_repeat:links' => $aYears,
                )
            ),
            'bx_if:show_calendar' => array(
                'condition' => false,
                'content' => array()
            )
        ));
    }

    protected function _getJumpToCaledar($aParams)
    {
        $sStylePrefix = $this->_oConfig->getPrefix('style');
        $sJsObject = $this->_oConfig->getJsObjectView($aParams);
                
        return $this->parseHtmlByName('jump_to.html', array(
            'bx_if:show_list' => array(
                'condition' => false,
                'content' => array()
            ),
            'bx_if:show_calendar' => array(
                'condition' => true,
                'content' => array(
                    'style_prefix' => $sStylePrefix,
                    'onclick' => 'javascript:' . $sJsObject . '.showCalendar(this)',
                )
            )
        ));
    }

    protected function _getTmplVarsMenuItemActions(&$aEvent, $aBrowseParams = array())
    {
        $oMenu = BxDolMenu::getObjectInstance($this->_oConfig->getObject('menu_item_actions_all'));
        if(!$oMenu) {
            $oMenu = BxDolMenu::getObjectInstance($this->_oConfig->getObject('menu_item_actions'));
            if(!$oMenu)
                return array();
        }

        $oMenu->setEvent($aEvent, $aBrowseParams);
        $oMenu->setDynamicMode(isset($aBrowseParams['dynamic_mode']) && $aBrowseParams['dynamic_mode'] === true);

        $sMenu = $oMenu->getCode();
        if(empty($sMenu))
            return array();

        return array(
            'style_prefix' => $this->_oConfig->getPrefix('style'),
            'js_object' => $this->_oConfig->getJsObjectView($aBrowseParams),
            'menu_item_actions' => $sMenu
        );
    }

    protected function _getTmplVarsManage(&$aEvent, $aBrowseParams = array())
    {
        $oMenu = BxDolMenu::getObjectInstance($this->_oConfig->getObject('menu_item_actions_all'));
        if($oMenu)
            return array();

        $oMenu = BxDolMenu::getObjectInstance($this->_oConfig->getObject('menu_item_manage'));
        if(!$oMenu)
            return array();

        $oMenu->setEvent($aEvent, $aBrowseParams);
        $oMenu->setDynamicMode(isset($aBrowseParams['dynamic_mode']) && $aBrowseParams['dynamic_mode'] === true);
        if(!$oMenu->isVisible())
            return array();

        $sOnclick = "bx_menu_popup('bx_timeline_menu_item_manage', this, {'id':'bx_timeline_menu_item_manage_{content_id}'}, {content_id:{content_id}, name:'{name}', view:'{view}', type:'{type}'});";
        $sOnclick = bx_replace_markers($sOnclick, array(
            'content_id' => (int)$aEvent['id'],            
            'view' => bx_process_output($aBrowseParams['view']),
            'type' => bx_process_output($aBrowseParams['type']),
            'name' => bx_process_output($aBrowseParams['name']),
        ));

        return array(
            'style_prefix' => $this->_oConfig->getPrefix('style'),
            'onclick' => $sOnclick
        );
    }

    protected function _getTmplVarsMenuItemCounters(&$aEvent, $aBrowseParams = array())
    {
        $oMenu = BxDolMenu::getObjectInstance($this->_oConfig->getObject('menu_item_counters'));
        if(!$oMenu)
            return array();

        $oMenu->setEvent($aEvent, $aBrowseParams);
        $oMenu->setDynamicMode(isset($aBrowseParams['dynamic_mode']) && $aBrowseParams['dynamic_mode'] === true);
        $sMenu = $oMenu->getCode();
        if(empty($sMenu))
            return array();

        return array(
            'style_prefix' => $this->_oConfig->getPrefix('style'),
            'js_object' => $this->_oConfig->getJsObjectView($aBrowseParams),
            'menu_item_counters' => $sMenu
        );
    }

    protected function _getTmplVarsMenuItemMeta(&$aEvent, $aBrowseParams = array())
    {
        $oMenu = BxDolMenu::getObjectInstance($this->_oConfig->getObject('menu_item_meta'));
        if(!$oMenu)
            return array();

        $oMenu->setEvent($aEvent);

        $sMenu = $oMenu->getCode();
        if(empty($sMenu))
            return array();

        return array(
            'style_prefix' => $this->_oConfig->getPrefix('style'),
            'meta' => $sMenu
        );
    }

    protected function _getTmplVarsTimelineOwner(&$aEvent)
    {
        $sStylePrefix = $this->_oConfig->getPrefix('style');
        $iUser = bx_get_logged_profile_id();
        $oModule = $this->getModule();

        $sConnection = $this->_oConfig->getObject('conn_subscriptions');
        $oConnection = BxDolConnection::getObjectInstance($sConnection);
        $sConnectionTitle = _t('_sys_menu_item_title_sm_subscribe');

        $aOwnerIds = [];
        $sKeyOwnerId = isset($aEvent['owner_id_grouped']) ? 'owner_id_grouped' : 'owner_id';
        if(is_string($aEvent[$sKeyOwnerId]) && strpos($aEvent[$sKeyOwnerId], ',') !== false)
            $aOwnerIds = explode(',', $aEvent[$sKeyOwnerId]);
        else if(is_array($aEvent[$sKeyOwnerId]))
            $aOwnerIds = $aEvent[$sKeyOwnerId];
        else
            $aOwnerIds = [$aEvent[$sKeyOwnerId]];

        $aTmplVarsOwners = [];
        foreach($aOwnerIds as $iOwnerId) {
            $iOwnerId = (int)$iOwnerId;
            $iObjectOwner = (int)$aEvent['object_owner_id'];
            if($iObjectOwner < 0 && abs($iObjectOwner) == $iUser)
                $iObjectOwner *= -1;

            if($iOwnerId == 0 || $iOwnerId == $iObjectOwner)
                continue;

            $oOwner = $oModule->getObjectUser($iOwnerId);
            $sToType = $oOwner->getModule();
            $sToName = $oOwner->getDisplayName();
            $sToUrl = $oOwner->getUrl();

            $aTmplVarsActions = array();
            if(!empty($iUser) && $iUser != $iOwnerId && $oConnection->checkAllowedConnect($iUser, $iOwnerId) === CHECK_ACTION_RESULT_ALLOWED) {
                $aTmplVarsActions[] = array(
                    'href' => "javascript:void(0)",
                    'onclick' => "bx_conn_action(this, '" . $sConnection . "', 'add', '" . $iOwnerId . "')",
                    'title' => bx_html_attribute($sConnectionTitle),
                    'content' => $sConnectionTitle,
                    'icon' => 'check'
                );
            }

            if($this->_bIsApi)
                $aTmplVarsOwners[] = $oOwner->getUnitAPI(0, ['template' => 'unit_wo_info']);
            else
                $aTmplVarsOwners[] =  array(
                    'style_prefix' => $sStylePrefix,
                    'owner_type' => _t('_' . $sToType),
                    'owner_url' => $sToUrl,
                    'owner_username' => $sToName,
                    'bx_if:show_timeline_owner_actions' => array(
                        'condition' => !empty($aTmplVarsActions),
                        'content' => array(
                            'style_prefix' => $sStylePrefix,
                            'bx_repeat:timeline_owner_actions' => $aTmplVarsActions
                        )
                    )
                );
        }

        if(empty($aTmplVarsOwners))
            return array();
        
        if(bx_is_api()) {
            return ($aTmplVarsOwners);
        }

        return array(
            'style_prefix' => $sStylePrefix,
            'bx_repeat:owners' => $aTmplVarsOwners
        );
    }

    protected function _getTmplVarsContentPost(&$aEvent, $aBrowseParams = array())
    {
    	$aContent = &$aEvent['content'];
        $sStylePrefix = $this->_oConfig->getPrefix('style');

        $bViewItem = isset($aBrowseParams['view']) && $aBrowseParams['view'] == BX_TIMELINE_VIEW_ITEM;
        $bViewSearch = isset($aBrowseParams['view']) && $aBrowseParams['view'] == BX_TIMELINE_VIEW_SEARCH;

        //--- Process Top Raw ---//
        $sTopRaw = isset($aContent['top_raw']) ? $aContent['top_raw'] : '';

        //--- Process Raw ---//
        $sRaw = isset($aContent['raw']) ? $aContent['raw'] : '';

        //--- Process Text ---//
        $sUrl = isset($aContent['url']) ? bx_html_attribute($aContent['url']) : '';
        $OnClick = isset($aContent['onclick']) ? bx_html_attribute($aContent['onclick']) : '';

        $sTitle = '';
        if(isset($aContent['title']))
            $sTitle = bx_process_output($aContent['title']);
        
        $sBadges = '';
        if($sTitle && ($sMethod = 'get_badges') && bx_is_srv($aEvent['type'], $sMethod)) {
            $bBadgesSingle = isset($aBrowseParams['badges_single']) ? $aBrowseParams['badges_single'] : false;
            $bBadgesCompact = isset($aBrowseParams['badges_compact']) ? $aBrowseParams['badges_compact'] : false;

            $sBadges = bx_srv($aEvent['type'], $sMethod, [$aEvent['object_id'], $bBadgesSingle, $bBadgesCompact]);
        }

        if(!empty($sUrl) && !empty($sTitle)) {
            $aTitleParams = [
            	'class' => $sStylePrefix . '-title bx-lnk-src',
                'title' => $sTitle
            ];
            if(!empty($OnClick))
                $aTitleParams['onclick'] = $OnClick;

            $sTitle = $this->parseLink($sUrl, $sTitle, $aTitleParams);
        }

        $sMethodPrepare = '_prepareTextForOutput';
        if($this->_oConfig->isBriefCards() && !$bViewItem)
            $sMethodPrepare .= 'BriefCard';

        $sText = isset($aContent['text']) ? $aContent['text'] : '';
        $sText = $this->$sMethodPrepare($sText, $aEvent['id']);

        //--- Process Links ---//
        $aTmplVarsLinks = isset($aContent['links']) ? $this->getTmplVarsAttachedLinks($aContent['links']) : [];

        //--- Process Polls ---//
        $aTmplVarsAttachmentsPolls = [];
        if(!$bViewItem && !empty($aContent['polls_attach']) && is_array($aContent['polls_attach'])) {
            $iProfile = bx_get_logged_profile_id();

            $aPollsAttach = [];
            foreach($aContent['polls_attach'] as $aPoll)
                $aPollsAttach[] = [
                    'style_prefix' => $sStylePrefix,
                    'poll' => $this->getPollItem($aPoll, $iProfile)
                ];

            if(!empty($aPollsAttach)) {
                $aTmplVarsAttachmentsPolls = [
                    'style_prefix' => $sStylePrefix,
                    'bx_repeat:polls' => $aPollsAttach
                ];
            }
        }

        /*
         * View Item page and Snippet in Search Results should use Gallery layout.
         */
        $sAttachmentsLayout = $this->_oConfig->getAttachmentsLayout();
        if($bViewItem || $bViewSearch)
            $sAttachmentsLayout = BX_TIMELINE_ML_GALLERY;

        $iAttachmentsTotal = 0;
        $aTmplVarsImages = $aTmplVarsVideos = $aTmplVarsFiles = $aTmplVarsAttachments = $aTmplVarsAttachmentsFiles = [];

        //--- Process Photos ---//
        $bImages = !empty($aContent['images']) && is_array($aContent['images']);
        if($bImages) {
            $aImages = $this->_getTmplVarsImages($aContent['images'], true, $aEvent, $aBrowseParams);
            if(!empty($aImages))
                $aTmplVarsImages = array(
                    'style_prefix' => $sStylePrefix,
                    'display' => $aImages['display'],
                    'bx_repeat:items' => $aImages['items']
                );
        }
        $bImagesAttach = !empty($aContent['images_attach']) && is_array($aContent['images_attach']);
        if($bImagesAttach) {
            $aImagesAttach = $this->_getTmplVarsImages($aContent['images_attach'], ['layout' => $sAttachmentsLayout, 'first' => empty($aTmplVarsAttachments)], $aEvent, $aBrowseParams);
            if(!empty($aImagesAttach)) {
                $iAttachmentsTotal += $aImagesAttach['total'];
                $aTmplVarsAttachments = array_merge($aTmplVarsAttachments, $aImagesAttach['items']);
            }
        }

        //--- Add Meta Image when Item is viewed on a separate page ---//
        if($bViewItem) {
            $sMetaImageSrc = '';
            if($bImages && !empty($aContent['images'][0]['src']))
                $sMetaImageSrc = $aContent['images'][0]['src'];
            else if($bImagesAttach && !empty($aContent['images_attach'][0]['src']))
                $sMetaImageSrc = $aContent['images_attach'][0]['src'];

            if(!empty($sMetaImageSrc))
                BxDolTemplate::getInstance()->addPageMetaImage($sMetaImageSrc);
        }

    	//--- Process Videos ---//
        $bVideos = !empty($aContent['videos']) && is_array($aContent['videos']);
        if($bVideos) {
            $aVideos = $this->_getTmplVarsVideos($aContent['videos'], true, $aEvent, $aBrowseParams);
            if(!empty($aVideos))
                $aTmplVarsVideos = [
                    'style_prefix' => $sStylePrefix,
                    'display' => $aVideos['display'],
                    'bx_repeat:items' => $aVideos['items']
                ];
        }

        $bVideosAttach = !empty($aContent['videos_attach']) && is_array($aContent['videos_attach']);
        if($bVideosAttach) {
            $aVideosAttach = $this->_getTmplVarsVideos($aContent['videos_attach'], ['layout' => $sAttachmentsLayout, 'first' => empty($aTmplVarsAttachments)], $aEvent, $aBrowseParams);
            if(!empty($aVideosAttach)) {
                $iAttachmentsTotal += $aVideosAttach['total'];
                $aTmplVarsAttachments = array_merge($aTmplVarsAttachments, $aVideosAttach['items']);
            }
        }
 
        //--- Process Files ---//
        $bFiles = !empty($aContent['files']) && is_array($aContent['files']);
        if($bFiles) {
            $aFiles = $this->_getTmplVarsFiles($aContent['files'], $aEvent, $aBrowseParams);
            if(!empty($aFiles))
                $aTmplVarsFiles = [
                    'style_prefix' => $sStylePrefix,
                    'display' => $aFiles['display'],
                    'bx_repeat:items' => $aFiles['items']
                ];
        }

        $bFilesAttach = !empty($aContent['files_attach']) && is_array($aContent['files_attach']);
        if($bFilesAttach) {
            $aFilesAttach = $this->_getTmplVarsFiles($aContent['files_attach'], $aEvent, $aBrowseParams);
            if(!empty($aFilesAttach)) {
                $aTmplVarsAttachmentsFiles = [
                    'style_prefix' => $sStylePrefix,
                    'display' => BX_TIMELINE_ML_GALLERY,
                    'count' => count($aFilesAttach['items']),
                    'bx_repeat:items' => $aFilesAttach['items']
                ];
            }
        }

        /*
         *  Process collected attachments in case of Showcase layout.
         */
        $iAttachmentsShow = 4;
        $iAttachmentsCount = count($aTmplVarsAttachments);
        if($sAttachmentsLayout == BX_TIMELINE_ML_SHOWCASE && $iAttachmentsCount > 0) {
            $aTmplVarsAttachments[0]['class'] .= ' ' . $sStylePrefix . '-ia-first';

            if($iAttachmentsCount > $iAttachmentsShow)
                $aTmplVarsAttachments = array_slice($aTmplVarsAttachments, 0, $iAttachmentsShow);

            if($iAttachmentsTotal > $iAttachmentsShow)
                $aTmplVarsAttachments[$iAttachmentsShow - 1]['item'] .= $this->parseHtmlByName('attach_more.html', [
                    'style_prefix' => $sStylePrefix,
                    'link' => $this->_oConfig->getItemViewUrl($aEvent),
                    'more' => $iAttachmentsTotal - $iAttachmentsShow
                ]);
        }

        return [
            'style_prefix' => $sStylePrefix,
            'bx_if:show_title' => [
                'condition' => !empty($sTitle),
                'content' => [
                    'style_prefix' => $sStylePrefix,
                    'title' => $sTitle,
                    'badges' => $sBadges,
                ]
            ],
            'bx_if:show_content' => [
                'condition' => !empty($sText),
                'content' => [
                    'style_prefix' => $sStylePrefix,
                    'item_content' => $sText
                ]
            ],
            'bx_if:show_top_raw' => [
                'condition' => !empty($sTopRaw),
                'content' => [
                    'style_prefix' => $sStylePrefix,
                    'item_content_top_raw' => $sTopRaw
                ]
            ],
            'bx_if:show_raw' => [
                'condition' => !empty($sRaw),
                'content' => [
                    'style_prefix' => $sStylePrefix,
                    'item_content_raw' => $sRaw
                ]
            ],
            'bx_if:show_links' => [
                'condition' => !empty($aTmplVarsLinks),
                'content' => [
                    'style_prefix' => $sStylePrefix,
                    'bx_repeat:links' => $aTmplVarsLinks
                ]
            ],
            'bx_if:show_images' => [
                'condition' => !empty($aTmplVarsImages),
                'content' => $aTmplVarsImages
            ],
            'bx_if:show_videos' => [
                'condition' => !empty($aTmplVarsVideos),
                'content' => $aTmplVarsVideos
            ],
            'bx_if:show_files' => [
                'condition' => !empty($aTmplVarsFiles),
                'content' => $aTmplVarsFiles
            ],
            'bx_if:show_attachments' => [
                'condition' => !empty($aTmplVarsAttachments),
                'content' => [
                    'style_prefix' => $sStylePrefix,
                    'display' => $sAttachmentsLayout,
                    'count' => count($aTmplVarsAttachments),
                    'bx_repeat:items' => $aTmplVarsAttachments
                ]
            ],
            'bx_if:show_attachments_files' => [
                'condition' => !empty($aTmplVarsAttachmentsFiles),
                'content' => $aTmplVarsAttachmentsFiles
            ],
            'bx_if:show_attachments_polls' => [
                'condition' => !empty($aTmplVarsAttachmentsPolls),
                'content' => $aTmplVarsAttachmentsPolls
            ],
        ];
    }

    protected function _getTmplVarsContentRepost(&$aEvent, $aBrowseParams = array())
    {
    	$aContent = &$aEvent['content'];
        $sStylePrefix = $this->_oConfig->getPrefix('style');

        $sOwnerLink = $this->parseLink($aContent['owner_url'], $aContent['owner_name']);

        $sSample = _t($aContent['sample']);
        $sSampleLink = empty($aContent['url']) ? $sSample : $this->parseLink($aContent['url'], $sSample);

        $aTmplVarsData = [];
        if(!empty($aContent['rdata']) && is_array($aContent['rdata'])) {
            $aData = $aContent['rdata'];

            $aTmplVarsData['style_prefix'] = $sStylePrefix;

            if(isset($aData['text']))
                $aTmplVarsData['text'] = $this->_prepareTextForOutput($aData['text'], $aEvent['id']);
        }

        $sContent = $this->_getContent($aContent['parse_type'], $aEvent, $aBrowseParams);

        return [
            'style_prefix' => $sStylePrefix,
            'item_owner_action' => _t('_bx_timeline_txt_reposted', $sOwnerLink, $sSampleLink),
            'bx_if:show_data' => [
                'condition' => !empty($aTmplVarsData),
                'content' => $aTmplVarsData
            ],
            'bx_if:show_content' => [
                'condition' => !empty($sContent),
                'content' => [
                    'style_prefix' => $sStylePrefix,
                    'content' => $sContent,
                ]
            ]
        ];
    }

    protected function _getTmplVarsNote(&$aEvent)
    {
        $sStylePrefix = $this->_oConfig->getPrefix('style');

        $iUser = bx_get_logged_profile_id();
        $iOwner = $this->_oConfig->isSystem($aEvent['type'], $aEvent['action']) ? $aEvent['owner_id'] : $aEvent['object_id'];

        $aTmplVars = array();
        if(!empty($iOwner) && !is_array($iOwner) && !empty($aEvent['promoted'])) {
            $sConnection = $this->_oConfig->getObject('conn_subscriptions');
            $oConnection = BxDolConnection::getObjectInstance($sConnection);
            if(!$oConnection->isConnected($iUser, $iOwner))
                $aTmplVars[] = [
                    'style_prefix' => $sStylePrefix,
                    'class' => '',
                    'bx_if:show_note_color' => [
                        'condition' => false,
                        'content' => []
                    ],
                    'item_note' => _t('_bx_timeline_txt_promoted')
                ];
        }

        //--- Awaiting status related notes.
        if($aEvent['status'] == BX_TIMELINE_STATUS_AWAITING) {
            $sNote = '';
            if((int)$aEvent['published'] > (int)$aEvent['date'])
                $sNote = _t('_bx_timeline_txt_note_scheduled_awaiting', bx_time_js($aEvent['published'], BX_FORMAT_DATE, true));
            else
                $sNote = _t('_bx_timeline_txt_note_processing_awaiting');

            $aTmplVars[] = [
                'style_prefix' => $sStylePrefix,
                'bx_if:show_note_color' => [
                    'condition' => true,
                    'content' => [
                        'item_note_color' => 'red3'
                    ]
                ],
                'item_note' => $sNote
            ];
        }

        //--- Failed status related notes.
        if($aEvent['status'] == BX_TIMELINE_STATUS_FAILED)
            $aTmplVars[] = [
                'style_prefix' => $sStylePrefix,
                'bx_if:show_note_color' => [
                    'condition' => true,
                    'content' => [
                        'item_note_color' => 'red2'
                    ]
                ],
                'item_note' => _t('_bx_timeline_txt_note_processing_failed')
            ];

        //--- Pending status related notes.
        if($aEvent['status_admin'] == BX_TIMELINE_STATUS_PENDING)
            $aTmplVars[] = [
                'style_prefix' => $sStylePrefix,
                'bx_if:show_note_color' => [
                    'condition' => true,
                    'content' => [
                        'item_note_color' => 'red3'
                    ]
                ],
                'item_note' => _t('_bx_timeline_txt_note_approve_pending')
            ];

        return empty($aTmplVars) ? [] : [
            'style_prefix' => $sStylePrefix,
            'bx_repeat:notes' => $aTmplVars
        ];
    }

    protected function _getTmplVarsOwnerActions(&$aEvent, $aBrowseParams = array())
    {
        $sStylePrefix = $this->_oConfig->getPrefix('style');

        $iUser = bx_get_logged_profile_id();
        $iOwner = $this->_oConfig->isSystem($aEvent['type'], $aEvent['action']) ? $aEvent['object_owner_id'] : $aEvent['object_id'];

        $aTmplVarsActions = array();
        if(!empty($iUser) && !empty($iOwner) && $iUser != $iOwner) {
            $oOwner = BxDolProfile::getInstance($iOwner);
            if($oOwner !== false && bx_srv($oOwner->getModule(), 'check_allowed_with_content', array('subscribe_add', $oOwner->getContentId())) === CHECK_ACTION_RESULT_ALLOWED) {
                $sJsObject = $this->_oConfig->getJsObjectView($aBrowseParams);
                $sConnection = $this->_oConfig->getObject('conn_subscriptions');

                $sContent = _t('_sys_menu_item_title_sm_subscribe');
                $aTmplVarsActions[] = array(
                    'style_prefix' => $sStylePrefix,
                    'href' => "javascript:void(0)",
                    'onclick' => "bx_conn_action(this, '" . $sConnection . "', 'add', '" . $iOwner . "', false, function(oData, eElement) {" . $sJsObject . ".onConnect(eElement, oData);})",
                    'title' => bx_html_attribute($sContent),
                    'content' => $sContent,
                    'icon' => 'check'
                );
            }
        }

        return array(
            'style_prefix' => $sStylePrefix,
            'bx_repeat:owner_actions' => $aTmplVarsActions
        );
    }

    protected function _getTmplVarsImages($aImages, $mixedLayout, &$aEvent, &$aBrowseParams)
    {
        if(empty($aImages) || !is_array($aImages))
            return [];

        $iTotal = 0; //--- Total count of images related to the event.
        if(isset($aImages['total']) && isset($aImages['items'])) {
            $iTotal = (int)$aImages['total'];
            $aImages = $aImages['items'];
        }
        else
            $iTotal = count($aImages);

        $sStylePrefix = $this->_oConfig->getPrefix('style');
        $sJsObject = $this->_oConfig->getJsObjectView($aBrowseParams);

        $bViewItem = isset($aBrowseParams['view']) && $aBrowseParams['view'] == BX_TIMELINE_VIEW_ITEM;

        $sDisplay = '';
        $aTmplVarsImages = [];

        $sImageSrcKey = $sImageSrcKeyBig = '';
        $sImageSrcKeyDefault = 'src';
        if(count($aImages) == 1) {
            $sDisplay = BX_TIMELINE_ML_SINGLE;
            $sImageSrcKey = $bViewItem ? 'src_orig' : 'src_medium';
        }
        else if(is_array($mixedLayout) && !empty($mixedLayout['layout'])) {
            $sDisplay = $mixedLayout['layout'];
            $sImageSrcKey = 'src';
            $sImageSrcKeyBig = 'src_medium';
        }
        else {
            $sDisplay = BX_TIMELINE_ML_GALLERY;
            $sImageSrcKey = 'src';
            $sImageSrcKeyBig = 'src_medium';
        }

        $bAttachFirst = false;
        if($sDisplay == BX_TIMELINE_ML_SHOWCASE)
            $bAttachFirst = isset($mixedLayout['first']) && $mixedLayout['first'] === true;

        $aImageFirst = reset($aImages);
        $iImageFirst = isset($aImageFirst['id']) ? (int)$aImageFirst['id'] : 0;

        $aImageSizes = [
            'small' => '300w', 
            'medium' => '500w', 
            'orig' => '1200w'
        ];
        foreach($aImages as $aImage) {
            $sImageSrcKeyCur = $sImageSrcKey;
            if(($bAttachFirst && isset($aImage['id']) && (int)$aImage['id'] == $iImageFirst) || $iTotal == 2)
                $sImageSrcKeyCur = $sImageSrcKeyBig;

            if (is_array($aImage))
                $sImageSrc = !empty($aImage[$sImageSrcKeyCur]) ? $aImage[$sImageSrcKeyCur] : $aImage[$sImageSrcKeyDefault];
            if(empty($sImageSrc))
                continue;

            $sImageAttrSrcset = '';
            foreach($aImageSizes as $sSize => $sWidth)
                if(isset($aImage['src_' . $sSize]))
                    $sImageAttrSrcset .= $aImage['src_' . $sSize] . ' ' . $sWidth . ', ';

            $sImage = $this->parseImage($sImageSrc, array(
                'class' => $sStylePrefix . '-item-image',
                'srcset' => trim($sImageAttrSrcset, ", "),
                'sizes' => '100%'
            ));

            $aAttrs = array();
            if(isset($aImage['onclick']))
                $aAttrs['onclick'] = $aImage['onclick'];
            else if(!empty($aImage['src_orig']))
                $aAttrs['onclick'] = 'return ' . $sJsObject . '.showItem(this, \'' . $aEvent['id'] . '\', \'photo\', ' . json_encode(array('src' => base64_encode($aImage['src_orig']))) . ')'; 

            $sImage = $this->parseLinkByName('image_link.html', isset($aImage['url']) ? $aImage['url'] : 'javascript:void(0)', $sImage, $aAttrs);

            $aTmplVarsImages[] = array(
                'style_prefix' => $sStylePrefix,
                'class' => '',
                'item' => $sImage
            );
        }
        
        return array(
            'display' => $sDisplay,
            'total' => $iTotal,
            'items' => $aTmplVarsImages
        );
    }

    protected function _getTmplVarsVideos($aVideos, $mixedLayout, &$aEvent, &$aBrowseParams)
    {
        if(empty($aVideos) || !is_array($aVideos))
            return array();

        $iTotal = 0; //--- Total count of videos related to the event.
        if(isset($aVideos['total']) && isset($aVideos['items'])) {
            $iTotal = (int)$aVideos['total'];
            $aVideos = $aVideos['items'];
        }
        else
            $iTotal = count($aVideos);

        $sStylePrefix = $this->_oConfig->getPrefix('style');
        $sJsObject = $this->_oConfig->getJsObjectView($aBrowseParams);
        $aTmplVarsVideos = array();

        /*
         * For now Main Section may have only one video which can use 'autoplay' feature.
         */
        $bMain = $mixedLayout === true;
        if($bMain) {
            $sDisplay = BX_TIMELINE_ML_SINGLE;
            if(count($aVideos) > 1)
                $aVideos = array_slice($aVideos, 0, 1);
        }
        else
            $sDisplay = is_array($mixedLayout) && !empty($mixedLayout['layout']) ? $mixedLayout['layout'] : BX_TIMELINE_AML_DEFAULT;

        /*
         * Main Section: Autoplay feature is only available here.
         */
        $sVap = $sVapId = $sVapSrc = $sVapTmpl = '';
        if($bMain) {
            $sVap = $this->_oConfig->getVideosAutoplay();
            if($sVap != BX_TIMELINE_VAP_OFF) {
                $sVapId = $this->_oConfig->getHtmlIds('view', 'video_iframe') . $aEvent['id'] . '-';
                $sVapSrc = BX_DOL_URL_ROOT . $this->_oConfig->getBaseUri() . 'video/' . $aEvent['id'] . '/';
                $sVapTmpl = $this->getHtml('video_iframe.html'); 
            }
        }

        /*
         * Attachments Section.
         */
        $sAttachTmpl = '';
        $bAttachFirst = false;
        if($sDisplay == BX_TIMELINE_ML_SHOWCASE) {
            $sAttachTmpl = $this->getHtml('attach_video_preview.html');
            $bAttachFirst = isset($mixedLayout['first']) && $mixedLayout['first'] === true;
        }

        $iVideoFirst = reset($aVideos)['id'];
        foreach($aVideos as $aVideo) {
            $iVideo = (int)$aVideo['id'];

            if($bMain && $sVap != BX_TIMELINE_VAP_OFF)
                $aTmplVarsVideos[] = array(
                    'style_prefix' => $sStylePrefix,
                    'class' => '',
                    'item' => $this->parseHtmlByContent($sVapTmpl, array(
                        'style_prefix' => $sStylePrefix,
                        'html_id' => $sVapId . $iVideo,
                        'src' => $sVapSrc . $iVideo . '/'
                    )) 
                );
            else {
                if($bMain || $sDisplay == BX_TIMELINE_ML_GALLERY || ($bAttachFirst && $iVideo == $iVideoFirst)) {
                    $sItem = '';
                    if(isset($aVideo['src'], $aVideo['src_orig'])) {
                        $sItem = $this->parseImage($aVideo['src'], array(
                            'class' => $sStylePrefix . '-item-image'
                        ));

                        $aAttrs = array();
                        if(!empty($aVideo['src_orig']))
                            $aAttrs['onclick'] = 'return ' . $sJsObject . '.showItem(this, \'' . $aEvent['id'] . '\', \'video\', ' . json_encode(array('src' => base64_encode($aVideo['src_orig']))) . ')'; 

                        $sItem = $this->parseLinkByName('image_link.html', isset($aVideo['url']) ? $aVideo['url'] : 'javascript:void(0)', $sItem, $aAttrs);
                    }
                    else 
                        $sItem = BxTemplFunctions::getInstance()->videoPlayer($aVideo['src_poster'], $aVideo['src_mp4'], $aVideo['src_mp4_hd'], array(
                            'preload' => $this->_oConfig->getVideosPreload(),
                        ), '', $aBrowseParams['dynamic_mode']);

                    $aTmplVarsVideos[] = array(
                        'style_prefix' => $sStylePrefix,
                        'class' => '',
                        'item' => $sItem
                    );
                }
                else {
                    $bUrl = !empty($aVideo['url']);
                    $sUrl = $bUrl ? $aVideo['url'] : '';

                    $sSrc = $aVideo[isset($aVideo['src'], $aVideo['src_orig']) ? 'src' : 'src_poster'];

                    $bDuration = !empty($aVideo['duration']);
                    $sDuration = _t_format_duration($bDuration ? $aVideo['duration'] : 0);

                    $aTmplVarsVideos[] = array(
                        'style_prefix' => $sStylePrefix,
                        'class' => '',
                        'item' => $this->parseHtmlByContent($sAttachTmpl, array(
                            'style_prefix' => $sStylePrefix,
                            'bx_if:show_link' => array(
                                'condition' => $bUrl,
                                'content' => array(
                                    'style_prefix' => $sStylePrefix,
                                    'url' => $sUrl,
                                    'src' => $sSrc,
                                )
                            ),
                            'bx_if:show_non_link' => array(
                                'condition' => !$bUrl,
                                'content' => array(
                                    'style_prefix' => $sStylePrefix,
                                    'src' => $sSrc,
                                )
                            ),
                            'bx_if:show_duration' => array(
                                'condition' => $bDuration,
                                'content' => array(
                                    'style_prefix' => $sStylePrefix,
                                    'duration' => $sDuration,
                                )
                            )
                        ))
                    );
                }
            }
        }
 
        return array( 
            'display' => $sDisplay,
            'total' => $iTotal,
            'items' => $aTmplVarsVideos
        );
    }

    protected function _getTmplVarsFiles($aFiles, &$aEvent, &$aBrowseParams)
    {
        if(empty($aFiles) || !is_array($aFiles))
            return array();

        $iTotal = 0; //--- Total count of files related to the event.
        if(isset($aFiles['total']) && isset($aFiles['items'])) {
            $iTotal = (int)$aFiles['total'];
            $aFiles = $aFiles['items'];
        }
        else
            $iTotal = count($aFiles);

        $sStylePrefix = $this->_oConfig->getPrefix('style');
        $sJsObject = $this->_oConfig->getJsObjectView($aBrowseParams);

        $bViewItem = isset($aBrowseParams['view']) && $aBrowseParams['view'] == BX_TIMELINE_VIEW_ITEM;

        $sDisplay = '';
        $aTmplVarsFiles = array();

        $sFileSrcKey = '';
        $sFileSrcKeyDefault = 'src';
        if(count($aFiles) == 1) {
            $sDisplay = 'single';
            $sFileSrcKey = $bViewItem ? 'src_orig' : 'src_medium';
        }
        else {
            $sDisplay = 'gallery';
            $sFileSrcKey = 'src';
        }

        foreach($aFiles as $aFile) {
            $sFileSrc = !empty($aFile[$sFileSrcKey]) ? $aFile[$sFileSrcKey] : $aFile[$sFileSrcKeyDefault];
            if(empty($sFileSrc))
                continue;

            $aAttrs = ['target' => '_blank'];
            if(isset($aFile['onclick']))
                $aAttrs['onclick'] = $aFile['onclick'];
            else if(!$bViewItem && !empty($aFile['src_orig']))
                $aAttrs['onclick'] = 'return ' . $sJsObject . '.showItem(this, \'' . $aEvent['id'] . '\', \'file\', ' . json_encode(array('src' => base64_encode($aFile['src_orig']))) . ')'; 
            if(isset($aFile['title']))
                $aAttrs['title'] = $aFile['title'];

            $sAttrs = '';
            foreach($aAttrs as $sKey => $sValue)
                $sAttrs .= ' ' . $sKey . '="' . bx_html_attribute($sValue) . '"';

            $aTmplVarsFiles[] = [
                'style_prefix' => $sStylePrefix,
                'class' => '',
                'item' => $this->parseHtmlByName('file_link.html', [
                    'href' => isset($aFile['url']) ? $aFile['url'] : 'javascript:void(0)',
                    'attrs' => $sAttrs,
                    'icon_src' => $sFileSrc,
                    'icon_class' => $sStylePrefix . '-item-file'
                ])
            ];
        }

        return array(
            'display' => $sDisplay,
            'total' => $iTotal,
            'items' => $aTmplVarsFiles
        );
    }

    protected function _getSystemData(&$aEvent, $aBrowseParams = array())
    {
        $mixedResult = $this->_oConfig->getSystemData($aEvent, $aBrowseParams);
        if($mixedResult === false) {
            $sMethod = 'display' . bx_gen_method_name($aEvent['type'] . '_' . $aEvent['action']);
            if(method_exists($this, $sMethod))
                $mixedResult = $this->$sMethod($aEvent);
        }

        if(empty($mixedResult) || !is_array($mixedResult))
            return '';

        $this->_preparetDataActions(false, $aEvent, $mixedResult);
        return $mixedResult;
    }

    protected function _getCommonData(&$aEvent, $aBrowseParams = array())
    {
        $CNF = $this->_oConfig->CNF;

        $oModule = $this->getModule();
        $sJsObject = $this->_oConfig->getJsObjectView($aBrowseParams);
        $sPrefix = $this->_oConfig->getPrefix('common_post');
        $sType = str_replace($sPrefix, '', $aEvent['type']);

        $oObjectOwner = BxDolProfile::getInstanceMagic($aEvent['object_id']);

        $iOwnerId = $aEvent['owner_id'];
        if(is_array($aEvent['owner_id']))
            $iOwnerId = is_numeric($aEvent['object_privacy_view']) && (int)$aEvent['object_privacy_view'] < 0 ? abs((int)$aEvent['object_privacy_view']) : (int)array_shift($aEvent['owner_id']);

        $aResult = array(
            'owner_id' => $iOwnerId,
            'object_owner_id' => $aEvent['object_id'],
            'icon' => $CNF['ICON'],
            'sample' => '_bx_timeline_txt_sample_with_article',
            'sample_wo_article' => '_bx_timeline_txt_sample',
            'sample_action' => '_bx_timeline_txt_added_sample',
            'content_type' => $sType,
            'content' => array(
                'sample' => '_bx_timeline_txt_sample_with_article',
                'sample_wo_article' => '_bx_timeline_txt_sample',
                'sample_action' => '_bx_timeline_txt_added_sample',
                'url' => $this->_oConfig->getItemViewUrl($aEvent)
            ), //a string to display or array to parse default template before displaying.
            'views' => '',
            'votes' => '',
            'reactions' => '',
            'scores' => '',
            'reports' => '',
            'comments' => '',
            'title' => $aEvent['title'], //may be empty.
            'description' => bx_replace_markers($aEvent['description'], array(
                'profile_name' => $oObjectOwner->getDisplayName()
            )) //may be empty.
        );

        switch($sType) {
            case BX_TIMELINE_PARSE_TYPE_POST:
                if(!empty($aEvent['content'])) {
                    $aContent = @unserialize($aEvent['content']);
                    if(!empty($aContent) && is_array($aContent))
                        $aResult['content'] = array_merge($aResult['content'], $aContent);
                }

                $aResult['content']['links'] = $oModule->getEventLinks($aEvent['id']);
                $aResult['content']['images_attach'] = $oModule->getEventImages($aEvent['id']);
                $aResult['content']['videos_attach'] = $oModule->getEventVideos($aEvent['id']);
                $aResult['content']['files_attach'] = $oModule->getEventFiles($aEvent['id']);
                $aResult['content']['polls_attach'] = $oModule->getEventPolls($aEvent['id']);

                if($this->_bIsApi) {
                    $aResult['content']['videos_attach'] = array_values($aResult['content']['videos_attach']);
                    $aResult['content']['files_attach'] = array_values($aResult['content']['files_attach']);
                    $aResult['content']['polls_attach'] = array_values($aResult['content']['polls_attach']);
                }
                break;

            case BX_TIMELINE_PARSE_TYPE_REPOST:
                if(empty($aEvent['content']))
                    return [];

                $aContent = unserialize($aEvent['content']);
                if(empty($aContent) || !is_array($aContent))
                    return [];

                if(!$this->_oConfig->isSystem($aContent['type'] , $aContent['action'])) {
                    $aEventReposted = $this->_oDb->getEvents(array('browse' => 'id', 'value' => $aContent['object_id']));
                    $aReposted = $this->_getCommonData($aEventReposted, $aBrowseParams);
                } 
                else {
                    $aEventReposted = $this->_oDb->getEvents(array_merge(array('browse' => 'descriptor'), $aContent));
                    $aReposted = $this->_getSystemData($aEventReposted, $aBrowseParams);
                }

                if(empty($aReposted) || !is_array($aReposted))
                    return [];

                $aEventReposted['content'] = $aReposted['content'];

                $aResult['content'] = array_merge($aContent, $aReposted['content']);
                $aResult['content']['parse_type'] = !empty($aReposted['content_type']) ? $aReposted['content_type'] : BX_TIMELINE_PARSE_TYPE_DEFAULT;

                $sKey = 'allowed_view';
                $aResult['content'][$sKey] = $this->_preparePrivacy($sKey, $aEventReposted, $aReposted);

                $oObjectOwner = $oModule->getObjectUser($aReposted['object_owner_id']);
                $aResult['content']['owner_id'] = $aReposted['object_owner_id'];
                $aResult['content']['owner_name'] = $oObjectOwner->getDisplayName();
                $aResult['content']['owner_url'] = $oObjectOwner->getUrl();

                if(!empty($aReposted['sample']))
                    $aResult['content']['sample'] = $aReposted['sample'];
                if(!empty($aReposted['sample_wo_article']))
                    $aResult['content']['sample'] = $aReposted['sample_wo_article'];

                $sUserName = $oModule->getObjectUser($aEvent['object_id'])->getDisplayName();
                $aResult['title'] = _t('_bx_timeline_txt_user_repost', $sUserName, _t($aResult['content']['sample']));
                $aResult['description'] = _t('_bx_timeline_txt_user_reposted_user_sample', $sUserName, $aResult['content']['owner_name'], _t($aResult['content']['sample']));
                $aResult['allowed_view'] = array(
                    'module' => $this->_oConfig->getName(),
                    'method' => 'get_timeline_repost_allowed_view',
                );

                if(!$this->_oConfig->isRepostOwnActions()) {
                    $aResult['views'] = $aReposted['views'];
                    $aResult['votes'] = $aReposted['votes'];
                    $aResult['reactions'] = $aReposted['reactions'];
                    $aResult['scores'] = $aReposted['scores'];
                    $aResult['reports'] = $aReposted['reports'];
                    $aResult['comments'] = $aReposted['comments'];
                }
                break;
        }

        $this->_preparetDataActions(true, $aEvent, $aResult);

        if($this->_bIsApi)
            $aResult['content'] = array_intersect_key($aResult['content'], array_flip([
                'object_id', 'url', 'title', 'text', 'links', 'images', 'images_attach', 'videos', 'videos_attach', 'files', 'files_attach', 'polls_attach', 'parse_type', 'owner_name', 'embed'
            ]));

        return $aResult;
    }

    protected function _getFirst($aEvents, $aParams = array())
    {
        $CNF = $this->_oConfig->CNF;

        foreach($aEvents as $aEvent)
            if((int)$aEvent[$CNF['FIELD_STICKED']] == 0)
                return (int)$aEvent[$CNF['FIELD_ID']];

        $aParams['start'] += $aParams['per_page'];
        $aEvents = $this->_oDb->getEvents($aParams);
        if(!empty($aEvents) && is_array($aEvents))
            return $this->_getFirst($aEvents, $aParams);

        return 0;
    }

    protected function _preparetDataActions($bCommon, &$aEvent, &$aResult)
    {
        if(empty($aEvent) || !is_array($aEvent) || empty($aEvent['id']))
            return;

        $oModule = $this->getModule();
        $bUpdateActions = $bCommon || !$this->_oConfig->isContentOwnActions();

        $sSystem = $this->_oConfig->getObject('view');
        if(empty($aResult['views'])) {
            $aResult['views'] = array();
            if($bUpdateActions && $oModule->getViewObject($sSystem, $aEvent['id']) !== false)
                $aResult['views'] = array(
                    'system' => $sSystem,
                    'object_id' => $aEvent['id'],
                    'count' => $aEvent['views']
                );
        }

        $sSystem = $this->_oConfig->getObject('vote');
        if(empty($aResult['votes'])) {
            $aResult['votes'] = array();
            if($bUpdateActions && $oModule->getVoteObject($sSystem, $aEvent['id']) !== false)
                $aResult['votes'] = array(
                    'system' => $sSystem,
                    'object_id' => $aEvent['id'],
                    'count' => $aEvent['votes']
                );
        }
        
        $sSystem = $this->_oConfig->getObject('reaction');
        if(empty($aResult['reactions'])) {
            $aResult['reactions'] = array();
            if($bUpdateActions && $oModule->getReactionObject($sSystem, $aEvent['id']) !== false)
                $aResult['reactions'] = array(
                    'system' => $sSystem,
                    'object_id' => $aEvent['id'],
                    'count' => $aEvent['rvotes']
                );
        }

        $sSystem = $this->_oConfig->getObject('score');
        if(empty($aResult['scores'])) {
            $aResult['scores'] = array();
            if($bUpdateActions && $oModule->getScoreObject($sSystem, $aEvent['id']) !== false)
                $aResult['scores'] = array(
                    'system' => $sSystem,
                    'object_id' => $aEvent['id'],
                    'score' => $aEvent['score']
                );
        }

        $sSystem = $this->_oConfig->getObject('report');
        if(empty($aResult['reports'])) {
            $aResult['reports'] = array();
            if($bUpdateActions && $oModule->getReportObject($sSystem, $aEvent['id']) !== false)
                $aResult['reports'] = array(
                    'system' => $sSystem,
                    'object_id' => $aEvent['id'],
                    'count' => $aEvent['reports']
                );
        }

        $sSystem = $this->_oConfig->getObject('comment');
        if(empty($aResult['comments'])) {
            $aResult['comments'] = array();
            if($bUpdateActions && $oModule->getCmtsObject($sSystem, $aEvent['id']) !== false)
                $aResult['comments'] = array(
                    'system' => $sSystem,
                    'object_id' => $aEvent['id'],
                    'count' => $aEvent['comments']
                );
        }
    }

    protected function _prepareTextForOutputBriefCard($s, $iEventId = 0)
    {
        $s = str_replace(['</p>', '<br>', '<br />'], [' </p>', ' <br>', ' <br />'], $s);
        $s = strip_tags($s, $this->_oConfig->getBriefCardsTags(true));
        
        return $this->_prepareTextForOutput($s, $iEventId);
    }

    protected function _prepareTextForOutput($s, $iEventId = 0)
    {
    	$s = bx_process_output($s, BX_DATA_HTML);

        $oMetatags = BxDolMetatags::getObjectInstance($this->_oConfig->getObject('metatags'));
        $s = $oMetatags->metaParse($iEventId, $s);

        return $s;
    }
    
    protected function _preparePrivacy($sKey, $aEvent, $aEventData)
    {
        $iResult = CHECK_ACTION_RESULT_ALLOWED;
        if(isset($aEventData[$sKey], $aEventData[$sKey]['module'], $aEventData[$sKey]['method']))
            $iResult = BxDolService::call($aEventData[$sKey]['module'], $aEventData[$sKey]['method'], array($aEvent));
        else if(($aHandler = $this->_oConfig->getHandler($aEvent)) !== false && BxDolRequest::serviceExists($aHandler['module_name'], 'get_timeline_post_allowed_view'))
            $iResult = BxDolService::call($aHandler['module_name'], 'get_timeline_post_allowed_view', array($aEvent));

        return $iResult;
    }

    protected function _getCounterIcon($aParams = array())
    {
        return $this->parseHtmlByName('repost_counter_icon.html', []);
    }

    protected function _getCounterLabel($iCount, $aParams = array())
    {
        return _t(isset($aParams['caption']) ? $aParams['caption'] : '_bx_timeline_txt_repost_counter', $iCount);
    }
}

/** @} */
