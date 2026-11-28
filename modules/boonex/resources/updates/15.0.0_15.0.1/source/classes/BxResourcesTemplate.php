<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT 
 * @defgroup    Resources Resources
 * @ingroup     UnaModules
 *
 * @{
 */

/*
 * Module representation.
 */
class BxResourcesTemplate extends BxBaseModTextTemplate
{
    function __construct(&$oConfig, &$oDb)
    {
        $this->MODULE = 'bx_resources';

        parent::__construct($oConfig, $oDb);
    }

    public function getTitle($aData, $mixedProcessOutput = BX_DATA_TEXT)
    {
        $CNF = &$this->_oConfig->CNF;

        $aData[$CNF['FIELD_TITLE']] = $aData[$CNF['FIELD_TITLE']] ?: _t('_bx_resources_txt_title_empty');

        return parent::getTitle($aData, $mixedProcessOutput);
    }

    public function getUnitLink ($aData, $aParams = [])
    {
        $CNF = &$this->_oConfig->CNF;

        $sLink = $aData[$CNF['FIELD_LINK']] ?? '';
        if(!$sLink) {
            $sLink = parent::getUnitLink($aData, $aParams);
            if($this->_bIsApi)
                $sLink = bx_api_get_relative_url($sLink);
        }

        return $sLink;
    }

    public function getUnitTitle ($aData, $aParams = [])
    {
        $CNF = &$this->_oConfig->CNF;

        $aData[$CNF['FIELD_TITLE']] = $aData[$CNF['FIELD_TITLE']] ?: $aData[$CNF['FIELD_LINK']];

        return parent::getUnitTitle($aData, $aParams);
    }

    protected function getUnit ($aData, $aParams = [])
    {
        $aTmplVars = parent::getUnit ($aData, $aParams);
        if(empty($aTmplVars) || !is_array($aTmplVars))
            return $aTmplVars;

        if($aTmplVars['bx_if:no_thumb']['condition'])
            $aTmplVars['bx_if:no_thumb']['condition'] = false;

        $aTmplVars['content_url_attrs'] = bx_convert_array2attrs(['target' => '_blank']);

        return $aTmplVars;
    }

    /**
     * Use Gallery image for both because currently there is no Unit types with small thumbnails.
     */
    protected function getUnitThumbAndGallery ($aData)
    {
        list($sPhotoThumb, $sPhotoGallery) = parent::getUnitThumbAndGallery($aData);

        return array($sPhotoGallery, $sPhotoGallery);
    }

    public function entryText ($aData, $sTemplateName = 'entry-text.html')
    {
        $aVars = $this->getTmplVarsText($aData);

        return $this->_bIsApi ? $aVars : $this->parseHtmlByName($sTemplateName, $aVars);
    }

    public function getEntriesList($iContextId)
    {
        $CNF = &$this->_oConfig->CNF;

        $sJsObject = $this->_oConfig->getJsObject('main');
        $oPermalinks = BxDolPermalinks::getInstance();

        $aCategories = BxDolFormQuery::getDataItems($CNF['OBJECT_CATEGORY']);

        $oModule = $this->getModule();
        $bAllowAdd = $oModule->isAllowAdd($iContextId);
        $bAllowManage = $oModule->isAllowManageByContext($iContextId);

        $aLists = $this->_oDb->getLists($iContextId);

        $aTmplVarsLists = [];
        foreach($aLists as $aList) {
            $sListTitle = $aList[$CNF['FIELD_LIST_TITLE']] ?: _t('_bx_resources_txt_list_default');

            $aResources = $this->_oDb->getResources($iContextId, $aList[$CNF['FIELD_LIST_ID']], true);

            $aTmplVarsEntries = [];
            foreach($aResources as $aResource) {
                $aTmplVarsEntries[] = [
                    'js_object' => $sJsObject,
                    'id' => $aResource[$CNF['FIELD_ID']],
                    'title' => $this->getUnitLink($aResource),
                    'category' => $aCategories[$aResource[$CNF['FIELD_CATEGORY']]] ?? '',
                    'created' => bx_time_js($aResource[$CNF['FIELD_ADDED']]),
                    'badges' => $oModule->serviceGetBadges($aResource[$CNF['FIELD_ID']], true),
                    'url' => bx_absolute_url($oPermalinks->permalink('page.php?i=' . $CNF['URI_VIEW_ENTRY'] . '&id=' . $aResource[$CNF['FIELD_ID']])),
                ];
            }

            $aTmplVarsLists[] = [
                'js_object' => $sJsObject,
                'html_id_list' => $this->_oConfig->getHtmlIds('list') . $aList['id'],
                'bx_if:allow_edit_list' => [
                    'condition' => $bAllowAdd,
                    'content' => [
                        'js_object' => $sJsObject,
                        'context_id' => $iContextId,
                        'list_id' => $aList[$CNF['FIELD_LIST_ID']],
                        'title' => $sListTitle
                    ]
                ],
                'bx_if:deny_edit_list' => [
                    'condition' => !$bAllowAdd,
                    'content' => [
                        'title' => $sListTitle,
                    ]
                ],
                'bx_if:allow_delete_list' => [
                    'condition' => $bAllowManage,
                    'content' => [
                        'context_id' => $iContextId,
                        'list_id' => $aList[$CNF['FIELD_LIST_ID']],
                        'js_object' => $sJsObject,
                    ]
                ],
                'bx_if:allow_add' => [
                    'condition' => $bAllowAdd,
                    'content' => [
                        'context_id' => $iContextId,
                        'list_id' => $aList[$CNF['FIELD_LIST_ID']],
                        'js_object' => $sJsObject,
                    ]
                ],
                'bx_repeat:entries' =>  $aTmplVarsEntries,
            ];
        }

        $this->addCssJs();
        $this->addJs([
            'jquery-ui/jquery-ui.min.js',
            'main.js',
            'modules/base/general/js/|forms.js'
        ]);

        return $this->getJsCode('main', ['t_confirm_block_deletion' => _t('_bx_resources_txt_msg_confirm_list_deletion')]) . $this->parseHtmlByName('browse_entries.html', [
            'html_id_lists' => $this->_oConfig->getHtmlIds('lists'),
            'bx_repeat:lists' => $aTmplVarsLists,
            'bx_if:allow_add_list' => [
                'condition' => $bAllowAdd,
                'content' => [
                    'js_object' => $sJsObject,
                    'context_id' => $iContextId,
                    
                ]
            ],
            'bx_if:allow_add_entry' => [
                'condition' => $bAllowAdd,
                'content' => [
                    'js_object' => $sJsObject,
                    'context_id' => $iContextId,
                ]
            ],
        ]);
    }

    public function getAttachLinks($iContentId)
    {
        $CNF = &$this->getModule()->_oConfig->CNF;

        $aContentInfo = $this->_oDb->getContentInfoById($iContentId);

        $aResults = [];
        if(($sLink = $aContentInfo[$CNF['FIELD_LINK']] ?: false))
            $aResults[] = [
                'url' => $sLink,
                'title' => $aContentInfo[$CNF['FIELD_TITLE']],
                'text' => $aContentInfo[$CNF['FIELD_TEXT']],
                'thumbnail' => ''
            ];

        return $aResults;
    }
}

/** @} */
