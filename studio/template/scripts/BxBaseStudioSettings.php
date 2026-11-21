<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

class BxBaseStudioSettings extends BxDolStudioSettings
{
    public function __construct($sType = '', $mixedCategory = '')
    {
        parent::__construct($sType, $mixedCategory);

        $this->sPageJsClass = 'BxDolStudioSettings';
        $this->sPageJsObject = 'oBxDolStudioSettings';
    }

    public function getPageCss()
    {
        return array_merge(parent::getPageCss(), $this->oOptions->getCss(), ['settings.css']);
    }

    public function getPageJs()
    {
        return array_merge(parent::getPageJs(), $this->oOptions->getJs(), ['settings.js']);
    }

    public function getPageCaption()
    {
        return parent::getPageCaption() . $this->getPageJsCode([
            'sActionUrl' => BX_DOL_URL_STUDIO . 'settings.php',
            'sObjName' => $this->getPageJsObject(),
            'sType' => $this->oOptions->getType(),
            'sTextUnsaved' => _t('_adm_stg_txt_unsaved_changes'),
        ]);
    }

    public function getPageMenu($aMenu = array(), $aMarkers = array())
    {
        $sType = $this->oOptions->getType();

        $aTypes = $aMenu = [];
        if($this->oDb->getTypes(['type' => 'all', 'not_in_group' =>[BX_DOL_STUDIO_STG_GROUP_TEMPLATES]], $aTypes) > 0 ) {
            $aTypesGrouped = [];
            foreach($aTypes as $aType)
                $aTypesGrouped[$aType['group']][] = $aType;

            foreach($aTypesGrouped as $sGroup => $aTypes)
                foreach($aTypes as $aType)
                    $aMenu[] = [
                        'name' => $aType['name'],
                        'icon' => $this->getMenuIcon($sGroup, $aType),
                        'icon_bg' => $aType['name'] == 'system',
                        'link' => BX_DOL_URL_STUDIO . 'settings.php?page=' . $aType['name'],
                        'title' => $aType['caption'],
                        'selected' => $aType['name'] == $sType
                    ];
        }

        // a click switches the group in place (studio/js/settings.js); the link stays for a new tab, a refresh and no script
        $sJsObject = $this->getPageJsObject();
        foreach($aMenu as &$aItem)
            $aItem['onclick'] = 'return ' . $sJsObject . ".changePage('" . bx_js_string($aItem['name'], BX_ESCAPE_STR_APOS) . "', event)";
        unset($aItem);

        return parent::getPageMenu($aMenu);
    }

    public function getPageCode($sPage = '', $bWrap = true)
    {
        $sResult = parent::getPageCode($sPage, $bWrap);
        if($sResult === false)
            return false;

        return $sResult . $this->getOptionsBlock();
    }

    /**
     * The selected group's options, captioned with the selected side menu item, as on every other settings page.
     */
    protected function getOptionsBlock()
    {
        $aType = [];
        $this->oDb->getTypes(['type' => 'by_name', 'value' => $this->oOptions->getType()], $aType, false);

        $aBlock = ['content' => $this->oOptions->getCode()];
        if(!empty($aType['caption']))
            $aBlock['caption'] = _t($aType['caption']);
        else
            $aBlock['type'] = BX_DB_NO_CAPTION;

        return $this->getBlockCode($aBlock);
    }

    protected function getMenuIcon($sGroup, &$aType)
    {
        if(empty($aType['icon']) || ($sUrl = BxDolStudioTemplate::getInstance()->getIconUrl($aType['icon'])) == "")
            switch($sGroup) {
                case BX_DOL_STUDIO_STG_GROUP_MODULES:
                    $aType['icon'] = BxDolStudioUtils::getIconDefault(BX_DOL_MODULE_TYPE_MODULE);
                    break;

                case BX_DOL_STUDIO_STG_GROUP_LANGUAGES:
                    $aType['icon'] = BxDolStudioUtils::getIconDefault(BX_DOL_MODULE_TYPE_LANGUAGE);
                    break;

                case BX_DOL_STUDIO_STG_GROUP_TEMPLATES:
                    $aType['icon'] = BxDolStudioUtils::getIconDefault(BX_DOL_MODULE_TYPE_TEMPLATE);
                    break;
            }

        return $aType['icon'];
    }
}

/** @} */
