<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * Menu representation.
 * @see BxDolMenu
 */
class BxBaseMenuTagsCloud extends BxTemplMenu
{
    protected $_iMenuItemsMin;
    protected $_aItems;

    public function __construct ($aObject, $oTemplate)
    {
        parent::__construct ($aObject, $oTemplate);
        
        $this->_bDisplayAddons = true;
        $this->_iMenuItemsMin = 10;
    }
    
    public function setKeywords($aKeywords, $oMetaObject, $mixedSection)
    {
        foreach ($aKeywords as $sKeyword => $iCount) {    
            $aItems[] =  [
                'class_add' => 'bx-psmi-show-' . $sKeyword . ' ',
                'name' => 'show-' . $sKeyword,
                'title' => htmlspecialchars_adv($sKeyword),
                'link' => $oMetaObject->keywordsGetHashTagUrl($sKeyword, 0, $mixedSection),
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
                    'condition' => true,
                    'content' => array('icon' => 'hash'),
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
            ];
        }
        
        $this->_aItems = $aItems;
    }

    public function getMenuItems ()
    {
        $aItems = $this->_aItems;
        if(empty($aItems) || !is_array($aItems))
            return $aItems;

        return $this->_addMenuItemsMoreLess($aItems, $this->_iMenuItemsMin);
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
}

/** @} */
