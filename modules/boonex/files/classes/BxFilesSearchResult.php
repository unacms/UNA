<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Files Files
 * @ingroup     UnaModules
 *
 * @{
 */

class BxFilesSearchResult extends BxBaseModTextSearchResult
{
    protected $sOrderParamName = 'order';
    protected $sBookmarksParamName = 'bookmarks';
    protected $sSortingParamName = 'sorting';
    protected $sCurrentFolderParamName = 'folder';
    protected $sCurrentView;
    protected $aSortingOptions;
    protected $bFileManagerMode = false;
    protected $iFileManagerUploadTo = 0;
    protected $sMode = '';

    function __construct($sMode = '', $aParams = array())
    {
        $aParams['unit_views'] = [
            'extended' => 'unit.html',
            'gallery' => 'unit_gallery.html',
            'full' => 'unit_full.html',
            'showcase' => 'unit_showcase.html',
            'table' => 'unit_simple_row.html',
        ];

        //Enble filemanager (toolbar, table files layout, dynamic menus, folders support) only for author/context blocks.
        if (($sMode == 'author' || $sMode == 'context') && !isset($aParams['no_toolbar'])) {
            $this->bFileManagerMode = true;
            $this->setUnitParams(['show_inline_menu' => true]);

            if (!bx_get('unit_view'))
                $aParams['unit_view'] = getParam('bx_files_default_layout_mode');
        }

        $this->sMode = $sMode;

        parent::__construct($sMode, $aParams);

        $this->sCurrentView = array_flip($aParams['unit_views'])[$this->sUnitTemplate];

        $this->aGetParams = array_merge($this->aGetParams, [
            $this->sOrderParamName,
            $this->sBookmarksParamName,
            $this->sSortingParamName,
            $this->sUnitViewParamName,
            $this->sCurrentFolderParamName,
        ]);


        $this->aSortingOptions = [
            'name',
            'date',
            'type',
            'author',
        ];


        $this->aCurrent = array(
            'name' => 'bx_files',
            'module_name' => 'bx_files',
            'object_metatags' => 'bx_files',
            'title' => _t('_bx_files_page_title_browse'),
            'table' => 'bx_files_main',
            'ownFields' => array('id', 'file_id', 'title', 'desc', 'author', 'added', 'type', 'parent_folder_id', 'allow_view_to'),
            'searchFields' => array(),
            'restriction' => array(
                'author' => array('value' => '', 'field' => 'author', 'operator' => '='),
                'featured' => array('value' => '', 'field' => 'featured', 'operator' => '<>'),
                'status' => array('value' => 'active', 'field' => 'status', 'operator' => '='),
                'statusAdmin' => array('value' => 'active', 'field' => 'status_admin', 'operator' => '='),
                'files_only' => array('value' => 'file', 'field' => 'type', 'operator' => '='),
                'context_filter' => array('value' => '', 'field' => 'allow_view_to', 'operator' => '>'),
                'folder' => array('value' => '', 'field' => 'parent_folder_id', 'operator' => '='),
            ),
            'paginate' => array('perPage' => getParam('bx_files_per_page_browse'), 'start' => 0),
            'sorting' => 'last',
            'rss' => array(
                'title' => '',
                'link' => '',
                'image' => '',
                'profile' => 0,
                'fields' => array (
                    'Guid' => 'link',
                    'Link' => 'link',
                    'Title' => 'title',
                    'DateTimeUTS' => 'added',
                    'Desc' => 'desc',
            		'Image' => 'thumb'
                ),
            ),
            'ident' => 'id',
        );

        $this->sFilterName = 'bx_files_filter';
        $this->oModule = $this->getMain();

        $CNF = &$this->oModule->_oConfig->CNF;

        $sSearchFields = getParam($CNF['PARAM_SEARCHABLE_FIELDS']);
        $this->aCurrent['searchFields'] = !empty($sSearchFields) ? explode(',', $sSearchFields) : '';

        $oProfileAuthor = null;

        switch ($sMode) {
            case 'author':
                if(!$this->_updateCurrentForAuthor($sMode, $aParams, $oProfileAuthor))
                    $this->isError = true;
                else {
                    //show only those files/folders which are not posted to some context
                    $this->aCurrent['restriction']['context_filter']['value'] = 0;
                }
                break;

            case 'context':
                if(!$this->_updateCurrentForContext($sMode, $aParams, $oProfileAuthor))
                    $this->isError = true;
                break;

            case 'favorite':
                if(!$this->_updateCurrentForFavorite($sMode, $aParams, $oProfileAuthor)) 
                    $this->isError = true;
                break;

            case 'public':
                $this->sBrowseUrl = BxDolPermalinks::getInstance()->permalink($CNF['URL_HOME']);
                $this->aCurrent['title'] = _t('_bx_files_page_title_browse_recent');
                $this->aCurrent['rss']['link'] = 'modules/?r=files/rss/' . $sMode;
                break;

            case 'featured':
                $this->sBrowseUrl = BxDolPermalinks::getInstance()->permalink($CNF['URL_HOME']);
                $this->aCurrent['title'] = _t('_bx_files_page_title_browse_featured');
                $this->aCurrent['restriction']['featured']['value'] = '0';
                $this->aCurrent['rss']['link'] = 'modules/?r=files/rss/' . $sMode;
                $this->aCurrent['sorting'] = 'featured';
                break;

            case 'popular':
                $this->sBrowseUrl = BxDolPermalinks::getInstance()->permalink($CNF['URL_POPULAR']);
                $this->aCurrent['title'] = _t('_bx_files_page_title_browse_popular');
                $this->aCurrent['rss']['link'] = 'modules/?r=files/rss/' . $sMode;
                $this->aCurrent['sorting'] = 'popular';
                break;

            case 'top':
                $this->sBrowseUrl = BxDolPermalinks::getInstance()->permalink($CNF['URL_TOP']);
                $this->aCurrent['title'] = _t('_bx_files_page_title_browse_top');
                $this->aCurrent['rss']['link'] = 'modules/?r=files/rss/' . $sMode;
                $this->aCurrent['sorting'] = 'top';
                break;

            case 'updated':
                $this->sBrowseUrl = BxDolPermalinks::getInstance()->permalink($CNF['URL_UPDATED']);
                $this->aCurrent['title'] = _t('_bx_files_page_title_browse_updated');
                $this->aCurrent['rss']['link'] = 'modules/?r=files/rss/' . $sMode;
                $this->aCurrent['sorting'] = 'updated';
                break;

            case '': // search results
                $this->sBrowseUrl = BX_DOL_SEARCH_KEYWORD_PAGE;
                $this->aCurrent['title'] = _t('_bx_files');
                unset($this->aCurrent['paginate']['perPage'], $this->aCurrent['rss']);
                break;

            default:
                $sMode = '';
                $this->isError = true;
        }

        $this->processReplaceableMarkers($oProfileAuthor);
        $this->addConditionsForPrivateContent($CNF, $oProfileAuthor);
        $this->addCustomConditions($CNF, $oProfileAuthor, $sMode, $aParams);


        //show to a profile author all of his files regardless of CF
        if ($sMode == 'author' && $oProfileAuthor && bx_get_logged_profile_id() == $oProfileAuthor->id())
            unset($this->aCurrent['restriction']['cf_viewer']);

        if ($this->bFileManagerMode) {
            $this->addContainerClass('bx-files-with-toolbar');

            unset($this->aCurrent['restriction']['files_only']);
            if (bx_get($this->sBookmarksParamName))
                $this->addConditionsForBookmarks($CNF);

            $this->aCurrent['sorting'] = 'name';
            if (bx_get($this->sSortingParamName)) $this->aCurrent['sorting'] = bx_get($this->sSortingParamName);

            if ($this->aCurrent['sorting'] == 'type')
                $this->addConditionsForMimeType($CNF);

            $this->removeContainerClass('bx-def-margin-sec-lefttopright-neg');

            if (!$this->isError) {
                if ($sMode == 'author' && $oProfileAuthor->id() == bx_get_logged_profile_id() || $sMode == 'context')
                    $this->iFileManagerUploadTo = $oProfileAuthor->id();
            }

            if ($this->sCurrentView == 'table')
                $this->removeContainerClass('bx-def-margin-bottom-neg');


            $this->aCurrent['restriction']['folder']['value'] = intval(bx_get($this->sCurrentFolderParamName));
            if ($this->aCurrent['restriction']['folder']['value'] < 0) {
                //navigate folder top
                bx_set($this->sCurrentFolderParamName, $this->oModule->_oDb->getParentFolderId(-$this->aCurrent['restriction']['folder']['value']));
                $this->aCurrent['restriction']['folder']['value'] = bx_get($this->sCurrentFolderParamName);
            }

            //free up one place for folder up item
            if ($this->aCurrent['restriction']['folder']['value']) {
                $this->aCurrent['paginate']['perPage']--;
            }
        }
    }

    protected function addConditionsForBookmarks(&$CNF) {
        if(empty($this->aCurrent['join']) || !is_array($this->aCurrent['join'])) $this->aCurrent['join'] = [];

        $this->aCurrent['join'] = array_merge($this->aCurrent['join'], [
            'bookmarks' => [
                'type' => 'INNER',
                'table' => $CNF['TABLE_BOOKMARKS'],
                'mainTable' => $CNF['TABLE_ENTRIES'],
                'mainField' => $CNF['FIELD_ID'],
                'onField' => $CNF['FIELD_BOOKMARKS_ID'],
                'joinFields' => array($CNF['FIELD_BOOKMARKS_PROFILE']),
            ],
        ]);

        $this->aCurrent['restriction']['bookmarks'] = [
            'value' => bx_get_logged_profile_id(),
            'field' => $CNF['FIELD_BOOKMARKS_PROFILE'],
            'operator' => '=',
            'table' => $CNF['TABLE_BOOKMARKS'],
        ];
    }

    protected function addConditionsForMimeType(&$CNF) {
        if(empty($this->aCurrent['join']) || !is_array($this->aCurrent['join'])) $this->aCurrent['join'] = [];

        $this->aCurrent['join'] = array_merge($this->aCurrent['join'], [
            'files' => [
                'type' => 'LEFT',
                'table' => $CNF['TABLE_FILES'],
                'mainTable' => $CNF['TABLE_ENTRIES'],
                'mainField' => $CNF['FIELD_ID'],
                'onField' => $CNF['FIELD_ID'],
                'joinFields' => array($CNF['FIELD_MIME_TYPE']),
            ],
        ]);
    }

    public function addCustomParts() {
        if ($this->_bLiveSearch) return;

        if (!$this->bFileManagerMode) return;

        $this->oModule->_oTemplate->addCss('main.css');

        $aParams = [
            'aRequestParams' => [
                'unit_view_param' => $this->sUnitViewParamName,
                'bookmarks_param' => $this->sBookmarksParamName,
                'sorting_param' => $this->sSortingParamName,
                'keyword_param' => 'keyword',
                'current_folder' => $this->sCurrentFolderParamName,
            ],

            'layout' => $this->sCurrentView,
            'bookmarks' => intval(bx_get($this->sBookmarksParamName)),
            'sorting' => $this->aCurrent['sorting'],
            'sorting_options' => $this->aSortingOptions,
            'keyword' => bx_get('keyword') ? bx_get('keyword') : '',
            'current_folder' => $this->aCurrent['restriction']['folder']['value'],
            'current_page' => $this->aCurrent['paginate']['start'],
        ];

        return $this->getBrowseToolbar($aParams);
    }

    function getSearchData ()
    {
        $CNF = &$this->oModule->_oConfig->CNF;

        $aData = parent::getSearchData();

        if ($this->bFileManagerMode && $this->aCurrent['restriction']['folder']['value']) {
            $aData = array_merge([0 => [
                $CNF['FIELD_ID'] => '-1',
                $CNF['FIELD_FILE_ID'] => '0',
                $CNF['FIELD_TITLE'] => '..',
                $CNF['FIELD_AUTHOR'] => bx_get_logged_profile_id(),
                $CNF['FIELD_ADDED'] => 0,
                $CNF['FIELD_ALLOW_VIEW_TO'] => BX_DOL_PG_ALL,
                'type' => 'folder',
            ]], $aData);
            $this->aCurrent['paginate']['num']++;
        }

        return $aData;
    }

    function processing ()
    {
        $iViewedProfile = 0;
        if ($this->_sMode == 'context' && $this->iFileManagerUploadTo) $iViewedProfile = $this->iFileManagerUploadTo;
        if ($this->_sMode == 'author' && $this->aCurrent['restriction']['author']['value']) $iViewedProfile = $this->aCurrent['restriction']['author']['value'];

        if ($iViewedProfile) {
            if (is_array($iViewedProfile)) $iViewedProfile = abs($iViewedProfile[0]);
            $oProfile = BxDolProfile::getInstance($iViewedProfile);
            if ($oProfile->checkAllowedProfileView() !== CHECK_ACTION_RESULT_ALLOWED) {
                $this->aCurrent['paginate']['num'] = 1;
                return MsgBox(_t('_sys_access_denied_to_private_content'));
            }
        }

        $sCode = parent::processing();
        if (!$this->aCurrent['paginate']['num']  && $this->bFileManagerMode) {
            //to show toolbar in case of empty results
            $sCode = $this->displaySearchBox($this->addCustomParts().MsgBox(_t('_Empty')));
        }
        return $sCode;
    }

    function showPagination($bAdmin = false, $bChangePage = true, $bPageReload = true)
    {
        $aAdditionalParams = [
            $this->sUnitViewParamName => $this->sCurrentView,
            $this->sBookmarksParamName => intval(bx_get($this->sBookmarksParamName)),
            $this->sSortingParamName => $this->aCurrent['sorting'],
            $this->sCurrentFolderParamName => $this->aCurrent['restriction']['folder']['value'],
        ];
        $sPageUrl = $this->getCurrentUrl($aAdditionalParams, false);
        $sOnClick = $this->getCurrentOnclick($aAdditionalParams, false);

        $oPaginate = new BxTemplPaginate([
            'page_url' => $sPageUrl,
            'on_change_page' => $sOnClick,
            'num' => $this->aCurrent['paginate']['num'],
            'per_page' => $this->aCurrent['paginate']['perPage'],
            'start' => $this->aCurrent['paginate']['start'],
        ]);

        return $sOnClick ? $oPaginate->getSimplePaginate() : $oPaginate->getPaginate();
    }

    function getAlterOrder() {
        if (in_array($this->aCurrent['sorting'], $this->aSortingOptions)) {
            $CNF = &$this->oModule->_oConfig->CNF;

            $aSql = array();
            switch ($this->aCurrent['sorting']) {
                case 'name':
                    $aSql['order'] = ' ORDER BY `'.$CNF['TABLE_ENTRIES'].'`.`type` DESC, `'.$CNF['TABLE_ENTRIES'].'`.`'.$CNF['FIELD_TITLE'].'` ASC';
                    break;
                case 'date':
                    $aSql['order'] = ' ORDER BY `'.$CNF['TABLE_ENTRIES'].'`.`type` DESC, `'.$CNF['TABLE_ENTRIES'].'`.`'.$CNF['FIELD_ID'].'` DESC';
                    break;
                case 'author':
                    $aSql['order'] = ' ORDER BY `'.$CNF['TABLE_ENTRIES'].'`.`type` DESC, `'.$CNF['TABLE_ENTRIES'].'`.`'.$CNF['FIELD_AUTHOR'].'` ASC, `'.$CNF['TABLE_ENTRIES'].'`.`'.$CNF['FIELD_TITLE'].'` ASC';
                    break;
                case 'type':
                    $aSql['order'] = ' ORDER BY `'.$CNF['TABLE_ENTRIES'].'`.`type` DESC, `'.$CNF['TABLE_FILES'].'`.`'.$CNF['FIELD_MIME_TYPE'].'` ASC, `'.$CNF['TABLE_ENTRIES'].'`.`'.$CNF['FIELD_TITLE'].'` ASC';
                    break;
            }
            return $aSql;
        } else {
            return parent::getAlterOrder();
        }

    }

    protected function getBrowseToolbarControls(&$aParams, $sJsObject) {
        $aSortingOptions = [];
        if (isset($aParams['sorting_options'])) {
            foreach ($aParams['sorting_options'] as $sSorting) {
                $aSortingOptions[$sSorting] = _t('_bx_files_toolbar_sorting_' . $sSorting);
            }
        }

        $oForm = new BxTemplFormView([], $this->oModule->_oTemplate);
        $aInputSorting = [
            'type' => 'select',
            'name' => 'sorting',
            'value' => $aParams['sorting'],
            'values' => $aSortingOptions,
            'attrs' => [
                'onchange' => $sJsObject.'.setSorting(this.value);',
            ],
        ];

        $aInputFilter = [
            'type' => 'text',
            'name' => 'keyword',
            'value' => $aParams['keyword'],
            'attrs' => [
                'placeholder' => _t('_sys_search_placeholder'),
                'onkeyup' => $sJsObject.'.onChangeFilter(this);',
                'onpaste' => $sJsObject.'.onChangeFilter(this);',
            ],
        ];

        $aUploadButtonParams = [];
        $bUploadAllowed = $this->oModule->checkAllowedAdd() == CHECK_ACTION_RESULT_ALLOWED && $this->oModule->serviceIsAllowedAddContentToContext($this->iFileManagerUploadTo);
        if ($bUploadAllowed) {
            $sUniqId = genRndPwd (8, false);
            $oUploader = BxDolUploader::getObjectInstance('bx_files_html5', $this->oModule->_oConfig->CNF['OBJECT_STORAGE'], $sUniqId, $this->oModule->_oTemplate);
            $iMaxNestingLevel = intval(getParam($this->oModule->_oConfig->CNF['PARAM_MAX_NESTING_LEVEL']));
            
            $aParamsJs = array_merge($oUploader->getUploaderJsParams(), 
                [
                    'content_id' => 0,
                    'storage_private' => '0',
                    'acceptedFiles' => '',
                    'multiple' => 1,
                    'images_transcoder' => 'bx_files_preview',
                ]
            );
            
            $aParamsBtn = [
                    'content_id' => 0,
                    'storage_private' => '0',
                    'button_template' => 'uploader_button_html5_attach.html'
            ];
            
            $aUploadButtonParams = [
                'js_object' => $sJsObject,
                'uploader_code' => $oUploader->getUploaderButton($aParamsBtn) . $oUploader->getUploaderJs('', true, $aParamsJs, true),
                'uploader_js_object' => $oUploader->getNameJsInstanceUploader(),
                'uploader_click_handler' => $oUploader->getNameJsInstanceUploader() . '.showUploaderForm();',
                'bx_if:create_folder_allowed' => [
                    'condition' => $iMaxNestingLevel == 0 || $this->oModule->_oDb->getFolderNestingLevel($this->aCurrent['restriction']['folder']['value']) < $iMaxNestingLevel,
                    'content' => [
                        'js_object' => $sJsObject,
                        'folder_name_message' => _t('_bx_files_txt_folder_name'),
                    ]
                ],
            ];
        }

        $aBulkActions = [];
        $aBulkActions[] = ['js_object' => $sJsObject, 'handler' => 'downloadFiles', 'title' => _t('_bx_files_bulk_action_title_download'), 'icon' => 'download'];
        if (isLogged()) {
            $aBulkActions[] = ['js_object' => $sJsObject, 'handler' => 'bookmarkFiles', 'title' => _t('_bx_files_bulk_action_title_bookmark'), 'icon' => 'star'];
            if ($bUploadAllowed) {
                $aBulkActions[] = ['js_object' => $sJsObject, 'handler' => 'deleteFiles', 'title' => _t('_bx_files_bulk_action_title_delete'), 'icon' => 'remove'];
                $aBulkActions[] = ['js_object' => $sJsObject, 'handler' => 'moveFiles', 'title' => _t('_bx_files_bulk_action_title_move_to'), 'icon' => 'file-export'];
            }
        }

        return [
            'sorting_dropdown' => $oForm->genRowStandard($aInputSorting),
            'filter_box' => $oForm->genRowStandard($aInputFilter),
            'bx_if:upload_visible' => [
                'condition' => $bUploadAllowed,
                'content' => $aUploadButtonParams,
            ],
            'bx_if:bookmarks_visible' => [
                'condition' => isLogged(),
                'content' => [
                    'js_object' => $sJsObject,
                    'bookmark_enabled' => $aParams['bookmarks'] ? 'fas' : 'far',
                ],
            ],
            'bx_if:table_layout_btn' => [
                'condition' => $aParams['layout'] == 'table',
                'content' => [
                    'js_object' => $sJsObject,
                    'unit_view_param' => $aParams['aRequestParams']['unit_view_param'],
                ],
            ],
            'bx_if:gallery_layout_btn' => [
                'condition' => $aParams['layout'] == 'gallery',
                'content' => [
                    'js_object' => $sJsObject,
                    'unit_view_param' => $aParams['aRequestParams']['unit_view_param'],
                ],
            ],
            'bx_repeat:sorting_options' => $aSortingOptions,
            'bx_repeat:bulk_actions' => $aBulkActions,
        ];
    }

    protected function getBrowseToolbarBreadcrumbs($sJsObject) {
        $aFolderPathTmpl = [];
        $aFolderPath = $this->oModule->_oDb->getFolderPath($this->aCurrent['restriction']['folder']['value']);
        if ($aFolderPath) {
            $aFolderPathTmpl[] = [
                'name' => _t('_bx_files_txt_folder_root'),
                'folder' => '0',
                'js_object' => $sJsObject,
            ];

            foreach ($aFolderPath as $aEntry) {
                $aFolderPathTmpl[] = [
                    'name' => strmaxtextlen($aEntry['name'], 20),
                    'folder' => $aEntry['folder'],
                    'js_object' => $sJsObject,
                ];
            }
        }

        return $aFolderPathTmpl;
    }

    protected function getBrowseToolbar(&$aParams) {
        $this->oModule->_oTemplate->addJs('toolbar_tools.js');

        $sUniqueIdent = mt_rand();
        $aParams['unique_ident'] = $sUniqueIdent;
        $aParams['context'] = $this->sMode == 'context' ? $this->iFileManagerUploadTo : '';
        $aParams['csrf_token'] = (string)BxDolForm::getCsrfToken();

        $sJsCode = $this->oModule->_oTemplate->getJsCode(['type' => 'toolbar_tools', 'uniq' => $sUniqueIdent], $aParams);
        $sJsObject = $this->oModule->_oConfig->getJsObject(['type' => 'toolbar_tools', 'uniq' => $sUniqueIdent]);

        $this->setUnitParams(['toolbar_js_object' => $sJsObject]);

        $aToolbarControls = $this->getBrowseToolbarControls($aParams, $sJsObject);

        return $this->oModule->_oTemplate->parseHtmlByName('files_browser_toolbar.html', array_merge($aToolbarControls, [
            'js_object' => $sJsObject,
            'js_code' => $sJsCode,
            'unique_ident' => $sUniqueIdent,
            'bx_repeat:folder_path' => $this->getBrowseToolbarBreadcrumbs($sJsObject),
            'bx_if:select_all_checkbox' => [
                'condition' => $aParams['layout'] == 'table',
                'content' => [
                    'js_object' => $sJsObject,
                    'unique_ident' => $sUniqueIdent,
                ],
            ],
        ]));
    }
}

/** @} */
