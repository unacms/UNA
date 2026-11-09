<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * Site main menu representation.
 */
class BxBaseMenuSwitchTemplate extends BxTemplMenu
{
    public function __construct ($aObject, $oTemplate)
    {
        parent::__construct ($aObject, $oTemplate);
    }

    /**
     * The items link back to the page in the Referer header.
     */
    public function isCacheable()
    {
        return false;
    }

    public function getMenuItems ()
    {
        $this->loadData();

        return parent::getMenuItems();
    }

    protected function loadData()
    {
        $sSelTemplate = $this->_oTemplate->getCode();
        $iSelMix = $this->_oTemplate->getMix();

        if(empty($iSelMix)) {
            $aSelTemplate = BxDolModuleQuery::getInstance()->getModuleByUri($sSelTemplate);
            $aSelMix = $this->_oQuery->getParamsMixActive($aSelTemplate['name']);
        }
        else
            $aSelMix = $this->_oQuery->getParamsMix($iSelMix);

        $sSelected = $sSelTemplate;
        if(!empty($aSelMix) && is_array($aSelMix) && (int)$aSelMix['published'] == 1)
            $sSelected = $aSelMix['name'];

        $this->setSelected('', $sSelected);

        $aPage = explode('?', $_SERVER['HTTP_REFERER']);
        $aPageParams = array();
        if(!empty($aPage[1]))
            parse_str($aPage[1], $aPageParams);

        $aItems = array();
        $aTemplates = get_templates_array(true, false);
        foreach($aTemplates as $sUri => $aTemplate) {
            $aPageParams['skin'] = $sUri;

            $aMixes = $this->_oQuery->getParamsMixes($aTemplate['name'], 1);
            if(empty($aMixes) || !is_array($aMixes)) {
                $aItems[] = array(
                    'id' => $sUri,
                    'name' => $sUri,
                    'class' => '',
                    'title' => $this->getItemTitle($sUri, $aTemplate),
                    'target' => '_self',
                    'icon' => '',
                    'link' => bx_html_attribute(bx_append_url_params($aPage[0], $aPageParams)),
                    'onclick' => ''
                );

                continue;
            }

            $aPageParamsClone = $aPageParams;
            foreach($aMixes as $aMix) {
                $aPageParamsClone['mix'] = $aMix['id'];

                $aItems[] = array(
                    'id' => $aMix['name'],
                    'name' => $aMix['name'],
                    'class' => '',
                    'title' => $this->getItemTitleMix($sUri, $aTemplate, $aMix),
                    'target' => '_self',
                    'icon' => '',
                    'link' => bx_html_attribute(bx_append_url_params($aPage[0], $aPageParamsClone)),
                    'onclick' => ''
                );
            }
        }

        $this->_aObject['menu_items'] = $aItems;
    }

    protected function getItemTitle($sUri, $aTemplate)
    {
        $sMask = '_sys_template_%s';

        if(($sTitle = $this->getTitle($sMask, $sUri)) !== false)
            return $sTitle;

        if(($sTitle = $this->getTitle($sMask, $aTemplate['name'])) !== false)
            return $sTitle;

        $sTitle = getParam($aTemplate['name'] . '_switcher_title');
        if(!empty($sTitle))
            return $sTitle;

        return $aTemplate['title'];
    }

    protected function getItemTitleMix($sUri, $aTemplate, $aMix)
    {
        $sMask = '_sys_template_mixed_%s_%s';
        if(($sTitle = $this->getTitle($sMask, $sUri, $aMix['title'])) !== false)
            return $sTitle;

        if(($sTitle = $this->getTitle($sMask, $aTemplate['name'], $aMix['title'])) !== false)
            return $sTitle;

        $sTemplateTitle = $this->getItemTitle($sUri, $aTemplate);
        return _t('_sys_template_mixed_mask', $sTemplateTitle, $aMix['title']);
    }
    
    protected function getTitle()
    {
        $aArgs = func_get_args();
        foreach($aArgs as $iIndex => $sArg) {
            if($iIndex == 0)
                continue;

            $aArgs[$iIndex] = str_replace(' ', '_', strtolower($sArg));
        }

        $sKey = call_user_func_array('sprintf', $aArgs);
        $sValue = _t($sKey);

        return strcmp($sKey, $sValue) !== 0 ? $sValue : false;
    }
}

/** @} */
