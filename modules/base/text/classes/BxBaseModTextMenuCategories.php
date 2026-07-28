<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    BaseText Base classes for text modules
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * Menu representation.
 * @see BxDolMenu
 */
class BxBaseModTextMenuCategories extends BxTemplMenu
{
    protected $_sModule;
    protected $_oModule;

    protected $_bExtendedMode;

    public function __construct ($aObject, $oTemplate)
    {
        parent::__construct ($aObject, $oTemplate);

        $this->_oModule = BxDolModule::getInstance($this->_sModule);

        $this->_bDisplayAddons = true;

        $this->_bExtendedMode = false;
    }

    public function getMenuItems ()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $oCategory = BxDolCategory::getObjectInstance($CNF['OBJECT_CATEGORY']);
        if(!$oCategory)
            return [];

        $aCategories = $oCategory->getCategoriesList(false, true);
        if($this->_bIsApi && $aCategories && is_array($aCategories))
            return reset($aCategories)['data'];

        if(!isset($aCategories['bx_repeat:cats']))
            return [];

        $iCount = 0;
        foreach ($aCategories['bx_repeat:cats'] as $sKey => $aCategory) {
            $iCount +=  $aCategories['bx_repeat:cats'][$sKey]['num'];
        }

        $aItems = [[
            'class_add' => 'bx-psmi-show-0' .  (bx_get('category') == '' ? ' bx-menu-item-active' : ''),
            'name' => 'show-0',
            'title' => _t($CNF['T']['txt_all_categories']),
            'link' => BxDolPermalinks::getInstance()->permalink($CNF['URL_HOME']),
            'icon' => '',
            'bx_if:onclick' => [
                'condition' => false,
                'content' => [
                    'onclick' => 'javascript:',
                ]
            ],
            'attrs' => '',
            'bx_if:image' => array (
                'condition' => false,
                'content' => [],
            ),
            'bx_if:image_inline' => array (
                'condition' => false,
                'content' => [],
            ),
            'bx_if:icon' => array (
                'condition' => $this->_bExtendedMode,
                'content' => ['icon' => 'swatchbook'],
            ),
            'bx_if:icon-a' => array (
                'condition' => false,
                'content' => [],
            ),
            'bx_if:icon-html' => array (
                'condition' => false,
                'content' => [],
            ),
            'bx_if:addon' => [
                'condition' => true,
                'content' => ['addon' => $iCount]
            ]
        ]];

        foreach ($aCategories['bx_repeat:cats'] as $sKey => $aCategory) {
            $aCategoryData = $this->_getExtendedInfo($aCategory['value']);
            if(!empty($aCategoryData) && (empty($aCategoryData['visible_for_levels']) || !BxDolAcl::getInstance()->isMemberLevelInSet($aCategoryData['visible_for_levels'])))
                continue;
            

            $sIconSrc = $sIcon = $sIconUrl = $sIconA = $sIconHtml = '';
            if($this->_bExtendedMode && !empty($aCategoryData)) {
                $sIconSrc = $aCategoryData['icon'] ?: 'folder'; 
                list($sIcon, $sIconUrl, $sIconA, $sIconHtml) = BxTemplFunctions::getInstance()->getIcon($sIconSrc);
            }

            $aItems[] =  [
                'class_add' => 'bx-psmi-show-' . $aCategories['bx_repeat:cats'][$sKey]['value'] . (bx_get('category') == $aCategories['bx_repeat:cats'][$sKey]['value'] ? ' bx-menu-item-active' : ''),
                'name' => 'show-' . $aCategories['bx_repeat:cats'][$sKey]['value'],
                'title' => $aCategories['bx_repeat:cats'][$sKey]['name'],
                'link' => $aCategories['bx_repeat:cats'][$sKey]['url'],
                'icon' => $sIconSrc,
                'bx_if:onclick' => [
                    'condition' => false,
                    'content' => [
                        'onclick' => 'javascript:',
                    ]
                ],
                'attrs' => '',
                'bx_if:image' => array (
                    'condition' => (bool)$sIconUrl,
                    'content' => array('icon_url' => $sIconUrl),
                ),
                'bx_if:image_inline' => array (
                    'condition' => false,
                    'content' => array('image' => ''),
                ),
                'bx_if:icon' => array (
                    'condition' => (bool)$sIcon,
                    'content' => array('icon' => $sIcon),
                ),
                'bx_if:icon-a' => array (
                    'condition' => (bool)$sIconA,
                    'content' => array('icon-a' => $sIconA),
                ),
                'bx_if:icon-html' => array (
                    'condition' => (bool)$sIconHtml,
                    'content' => array('icon' => $sIconHtml),
                ),
                'bx_if:addon' => [
                    'condition' => true,
                    'content' => ['addon' => $aCategories['bx_repeat:cats'][$sKey]['num']]
                ]
            ];
        }

        if(empty($aItems) || !is_array($aItems))
            return $aItems;

        return $this->_addMenuItemsMoreLess($aItems, (int)getParam($CNF['PARAM_VISIBLE_CATEGORIES']));
    }
    
    protected function _getMenuItem($a)
    {
        $mixedResult = parent::_getMenuItem($a);

        if($mixedResult !== false && !empty($mixedResult['link']) && strpos($mixedResult['link'], 'javascript:') === false)
            $mixedResult['link'] = bx_append_url_params($mixedResult['link'], [
                'owner' => 1
            ]);

        return $mixedResult;
    }

    protected function _getExtendedInfo($iId)
    {
        return $this->_oModule->_oDb->getCategories(['type' => 'by_category', 'category' => $iId]);
    }
}

/** @} */
