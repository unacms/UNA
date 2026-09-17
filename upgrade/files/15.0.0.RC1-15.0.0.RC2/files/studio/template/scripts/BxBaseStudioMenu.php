<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

class BxBaseStudioMenu extends BxDolStudioMenu
{
    protected $_bMenuSide;
    protected $_bMenuToolbar;
    protected $_bInlineIcons;

    public function __construct ($aObject, $oTemplate)
    {
        parent::__construct ($aObject, $oTemplate);

        $this->_bMenuSide = $this->_aObject['template'] == 'menu_side.html';
        $this->_bMenuToolbar = $this->_aObject['template'] == 'menu_top_toolbar.html';

        $this->_bInlineIcons = in_array($this->_aObject['template'], array(
            'menu_side.html', 
            'menu_top_toolbar.html', 
            'menu_launcher_browser.html',
            'page_breadcrumb.html'
        ));
    }

    public function setInlineIcons($bInlineIcons)
    {
        $this->_bInlineIcons = $bInlineIcons;
    }

    protected function _getMenuItem ($aItem)
    {
        $aItem = parent::_getMenuItem($aItem);
        if($aItem === false)
            return $aItem;

        $aItem['class'] = isset($aItem['class']) ? $aItem['class'] : '';

        if(!isset($aItem['class_add']))
            $aItem['class_add'] = '';
        $aItem['class_add'] .= ' ' . str_replace('_', '-', $aItem['name']);

        // an item may keep its icon as an <img> (icon_inline => false): app tile artwork stays out of the document and its gradient ids never collide
        if($this->_bInlineIcons && ($aItem['icon_inline'] ?? true) && $aItem['bx_if:image']['condition'] && ($sImage = $this->_oTemplate->getIconContent($aItem['icon'])) !== false)
            $aItem = array_merge($aItem, [
                'bx_if:image' => [
                    'condition' => false,
                    'content' => [],
                ],
                'bx_if:image_inline' => [
                    'condition' => true,
                    'content' => [
                        'image' => $sImage
                    ],
                ],
            ]);

        if($this->_bMenuSide) {
            $aItem['bx_if:show_icon'] = [
                'condition' => $aItem['bx_if:icon']['condition'] || $aItem['bx_if:image']['condition'] || $aItem['bx_if:image_inline']['condition'],
                'content' => []
            ];

            $aItem['bx_if:show_icon_bg'] = [
                'condition' => (isset($aItem['icon_bg']) && $aItem['icon_bg'] === true) || strpos($aItem['icon'], '.') === false,
                'content' => []
            ];
        }

        if(!$this->_bMenuToolbar)
            return $aItem;

        /*
         * Header toolbar: an item that only runs a script is a button, not a link. The template renders the two differently,
         * so it gets everything pre-rendered, because a bx_if block only sees its own content.
         */
        $bButton = empty($aItem['link']) || strncmp($aItem['link'], 'javascript:', 11) === 0;

        $sIconHtml = '';
        if($aItem['bx_if:icon']['condition'])
            $sIconHtml = '<i class="sys-icon ' . $aItem['bx_if:icon']['content']['icon'] . ' bx-def-round-corners bx-def-font-contrasted"></i>';
        else if($aItem['bx_if:image']['condition'])
            $sIconHtml = '<img src="' . $aItem['bx_if:image']['content']['icon_url'] . '" alt="" />';
        else if($aItem['bx_if:image_inline']['condition'])
            $sIconHtml = $aItem['bx_if:image_inline']['content']['image'];

        $aContent = [
            'name' => $aItem['name'],
            'link' => $aItem['link'],
            'onclick' => !empty($aItem['onclick']) ? $aItem['onclick'] : '',
            'title' => isset($aItem['title_attr']) ? $aItem['title_attr'] : bx_html_attribute($aItem['title']),
            'attrs' => $aItem['attrs'],
            'icon_html' => $sIconHtml,
        ];
        $aItem['bx_if:is_link'] = ['condition' => !$bButton, 'content' => $aContent];
        $aItem['bx_if:is_button'] = ['condition' => $bButton, 'content' => $aContent];

        return $aItem;
    }

    /**
     * Check if menu items is selected.
     * @param $a menu item array
     * @return boolean
     */
    protected function _isSelected ($a)
    {
        return isset($a['selected']) && $a['selected'] === true;
    }
}

/** @} */
