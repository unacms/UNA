<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

class BxBaseStudioMenuAccountPopup extends BxDolStudioMenuAccountPopup
{
    public function __construct ($aObject, $oTemplate)
    {
        parent::__construct ($aObject, $oTemplate);

        $this->_aObject['template'] = 'menu_account_popup.html';

        $this->addMarkers(array(
            'js_object' => BxTemplStudioMenuTop::getInstance()->getJsObject(),
            'url_root' => BX_DOL_URL_ROOT,
            'url_studio' => BX_DOL_URL_STUDIO
        ));
    }

    /**
     * The signed-in name is rendered as a label, the theme item as a segmented control and Manage Apps as a toggle button
     * (it switches edit mode on the launcher); everything else stays a link.
     * The tour item follows the 'site_tour_studio' setting, like the launcher tour itself.
     */
    protected function _getMenuItem ($aItem)
    {
        if($aItem['name'] == 'tour' && getParam('site_tour_studio') != 'on')
            return false;

        $aItem = parent::_getMenuItem($aItem);
        if($aItem === false)
            return $aItem;

        $sName = $aItem['name'];

        // Pre-render everything the blocks need as plain strings: the parser can't nest same-named bx_if blocks.
        $aContent = [
            'class_add' => $aItem['class_add'],
            'title' => $aItem['title'],
            'link' => $aItem['link'],
            'attrs' => $aItem['attrs'],
            'onclick_attr' => !empty($aItem['onclick']) ? 'onclick="' . bx_html_attribute($aItem['onclick']) . '"' : '',
            'icon_html' => $aItem['bx_if:image_inline']['condition'] ? $aItem['bx_if:image_inline']['content']['image'] : $this->getMenuIconHtml($aItem['icon']),
        ];
        if($sName == 'scheme')
            $aContent = array_merge($aContent, [
                'js_object' => BxTemplStudioMenuTop::getInstance()->getJsObject(),
                'title_auto' => bx_html_attribute(_t('_sys_menu_item_title_sa_scheme_auto')),
                'title_light' => bx_html_attribute(_t('_sys_menu_item_title_sa_scheme_light')),
                'title_dark' => bx_html_attribute(_t('_sys_menu_item_title_sa_scheme_dark')),
            ]);

        $aBlocks = [
            'show_label' => $sName == 'account',
            'show_theme' => $sName == 'scheme',
            'show_button' => $sName == 'edit',
            'show_link' => !in_array($sName, ['account', 'scheme', 'edit']),
        ];
        foreach($aBlocks as $sBlock => $bCondition)
            $aItem['bx_if:' . $sBlock] = [
                'condition' => $bCondition,
                'content' => $bCondition ? $aContent : []
            ];

        return $aItem;
    }
}

/** @} */
