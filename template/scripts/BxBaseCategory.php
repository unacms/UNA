<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * Category objects representation.
 * @see BxDolCategory
 */
class BxBaseCategory extends BxDolCategory
{
    protected $_oTemplate;

    protected $_oModule;
    protected $_bModule;

    protected $_sBrowseAllUrl;
    protected $_sBrowseAllTitle;
    protected $_sBrowseUrl;

    public function __construct ($aObject, $oTemplate = null)
    {
        parent::__construct ($aObject);

        if ($oTemplate)
            $this->_oTemplate = $oTemplate;
        else
            $this->_oTemplate = BxDolTemplate::getInstance();

        $this->_oModule = null;
        if(!empty($this->_aObject['module']))
            $this->_oModule = BxDolModule::getInstance($this->_aObject['module']);
        $this->_bModule = $this->_oModule !== null;

        $this->_sBrowseAllUrl = '';
        $this->_sBrowseAllTitle = '_all';

        $this->_sBrowseUrl = bx_append_url_params('searchKeyword.php', [
            'cat' => '{category}',
            'keyword' => '{keyword}'
        ], true, ['{category}', '{keyword}']) . '{sections}' . '{context}';

        if($this->_bModule) {
            $CNF = &$this->_oModule->_oConfig->CNF;

            if(!empty($CNF['URL_HOME']))
                $this->_sBrowseAllUrl = BxDolPermalinks::getInstance()->permalink($CNF['URL_HOME']);

            if(!isset($CNF['T']['txt_all_categories'])) {
                $sBrowseAllTitleKey = '_' . $this->_oModule->getName() . '_txt_all_categories';
                if(strcmp($sBrowseAllTitleKey, _t($sBrowseAllTitleKey)) != 0)
                    $this->_sBrowseAllTitle = $sBrowseAllTitleKey;
            }
            else
                $this->_sBrowseAllTitle = $CNF['T']['txt_all_categories'];

            if(!empty($CNF['URL_CATEGORY']))
                $this->_sBrowseUrl = bx_append_url_params(BxDolPermalinks::getInstance()->permalink($CNF['URL_CATEGORY']), [
                    'category' => '{keyword}'
                ], true, ['{keyword}']);
        }
    }

    public function getCategoryIcon($sValue)
    {
        $a = BxDolForm::getDataItems($this->_aObject['list_name'], false, BX_DATA_VALUES_ALL);
        if(!$a || !isset($a[$sValue]))
            return '';

        $aData = $this->_getCategoryData($a[$sValue]);
        if(empty($aData) || !is_array($aData))
            return '';

        return $this->_getCategoryIcon($aData);
    }

    public function getCategoryTitle($sValue)
    {
    	$a = BxDolForm::getDataItems($this->_aObject['list_name']);
        if (!$a || !isset($a[$sValue]))
            return '';

        return $a[$sValue];
    }

    public function getCategoryUrl($sValue, $aParams = [])
    {
        $s = BX_DOL_URL_ROOT . bx_replace_markers($this->_sBrowseUrl, [
            'category' => rawurlencode($this->getObjectName()),
            'keyword' => rawurlencode($sValue),
            'sections' => $this->_aObject['search_object'] ? '&section[]=' . rawurlencode($this->_aObject['search_object']) : '',
            'context' => isset($aParams['context_id']) ? '&context_id=' . $aParams['context_id'] : ''
        ]);

        if($this->_bIsApi)
            return bx_api_get_relative_url($s);

        return $s;
    }

    /**
     * Get link to list all items with the same category
     * @param $sName category title
     * @param $sValue category value
     * @return category name wrapped with A tag
     */
    public function getCategoryLink($sName, $sValue)
    {
        $sUrl = $this->getCategoryUrl($sValue);
        return '<a class="bx-category-link" href="' . $sUrl . '">' . $sName . '</a>';
    }

    /**
     * Get all categories list
     * @param $bDisplayEmptyCats display categories with no items, true by default
     * @return categories list html
     */
    public function getCategoriesList($bDisplayEmptyCats = true, $bAsArray = false)
    {
        $aContextInfo = bx_get_page_info();

        $mProfileContextId = false;
        if($aContextInfo !== false)
            $mProfileContextId = $aContextInfo['context_profile_id'];

        $a = BxDolForm::getDataItems($this->_aObject['list_name'], false, BX_DATA_VALUES_ALL);
        if(!$a)
            return $bAsArray ? [] : '';

        $aVars = [
            'bx_repeat:cats' => [],
            'bx_if:show_all' => [
                'condition' => $this->_sBrowseAllUrl != '',
                'content' => [
                    'url' => $this->_sBrowseAllUrl,
                    'name' => _t($this->_sBrowseAllTitle)
                ]
            ]
        ];

        foreach ($a as $sValue => $aCategory) {
            if(!is_numeric($sValue) && !$sValue)
                continue;

            $iNum = $this->getItemsNum($sValue, ['context_id' => $mProfileContextId]);
            if(!$bDisplayEmptyCats && !$iNum)
                continue;

            $aData = $this->_getCategoryData($aCategory);

            $sIconType = $this->_getCategoryIconType($aData);
            $sIcon = $this->_getCategoryIcon($aData);
            $bIcon = !empty($sIcon);

            $aVars['bx_repeat:cats'][] = array_merge([
                'url' => $this->getCategoryUrl($sValue, ($mProfileContextId ? ['context_id' => $mProfileContextId] : [])),
                'name' => _t($aCategory['LKey']),
                'value' => $sValue,
                'num' => $iNum
            ], !$this->_bIsApi ? [
                'bx_if:show_icon' => [
                    'condition' => $bIcon,
                    'content' => [
                        'bx_if:show_icon_font' => [
                            'condition' => $bIcon && $sIconType == 'icon',
                            'content' => [
                                'icon_name' => $sIcon,
                            ]
                        ],
                        'bx_if:show_icon_html' => [
                            'condition' => $bIcon && in_array($sIconType, ['emoji', 'image']),
                            'content' => [
                                'icon_code' => $sIcon,
                            ]
                        ],
                    ]
                ],
                'selected_class' => $sValue == bx_get('category') ? 'bx-menu-tab-active' : '',
            ] : [
                'icon_type' => $sIconType,
                'icon' => $sIcon
            ]);
        }

        // No categories to list: no block, in the apps as on the site.
        if($this->_bIsApi)
            return !empty($aVars['bx_repeat:cats']) ? [bx_api_get_block('categories_list',  $aVars['bx_repeat:cats'])] : [];

        if($bAsArray)
            return $aVars;

        return !empty($aVars['bx_repeat:cats']) ? $this->_oTemplate->parseHtmlByName('category_list.html', $aVars) : '';
    }

    protected function _getCategoryIconType($aData)
    {
        return !empty($aData['use']) ? $aData['use'] : '';
    }

    protected function _getCategoryIcon($aData)
    {
        return !empty($aData['use']) && !empty($aData[$aData['use']]) ? $aData[$aData['use']] : '';
    }
    
    protected function _getCategoryData($aCategory)
    {
        if(is_array($aCategory['Data']))
            return $aCategory['Data'];

        return !empty($aCategory['Data']) && bx_is_serialized($aCategory['Data']) ? unserialize($aCategory['Data']) : [];
    }
}

/** @} */
