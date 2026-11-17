<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

class BxBaseStudioAudit extends BxDolStudioAudit
{
    protected $sSubpageUrl;
    protected $aMenuItems;
    protected $aGridObjects;

    function __construct($sPage = '')
    {
        parent::__construct($sPage);

        $this->aPageCss = array_merge($this->aPageCss, ['forms.css', 'paginate.css']);

        $this->sSubpageUrl = BX_DOL_URL_STUDIO . 'audit.php?page=';

        $this->aMenuItems = [
            BX_DOL_STUDIO_AUD_TYPE_REPORTS => ['icon' => 'mi-aud-reports.svg'],
            BX_DOL_STUDIO_AUD_TYPE_SETTINGS => ['icon' => 'mi-aud-settings.svg'],
        ];
    }

    function getPageMenu($aMenu = [], $aMarkers = [])
    {
        $sJsObject = $this->getPageJsObject();

        $aMenu = [];
        foreach($this->aMenuItems as $sMenuItem => $aItem)
            $aMenu[] = [
                'name' => $sMenuItem,
                'icon' => $aItem['icon'],
                'icon_bg' => true,
                'link' => $this->sSubpageUrl . $sMenuItem,
                'title' => _t('_adm_lmi_cpt_' . $sMenuItem),
                'selected' => $sMenuItem == $this->sPage
            ];

        return parent::getPageMenu($aMenu);
    }

    protected function getReports()
    {
        return $this->getGrid();
    }

    protected function getSettings()
    {
        $oOptions = new BxTemplStudioOptions(BX_DOL_STUDIO_STG_TYPE_SYSTEM, BX_DOL_STUDIO_STG_CATEGORY_AUDIT);

        $this->aPageCss = array_merge($this->aPageCss, $oOptions->getCss());
        $this->aPageJs = array_merge($this->aPageJs, $oOptions->getJs());
        return BxDolStudioTemplate::getInstance()->parseHtmlByName('audit.html', array(
            'content' => $oOptions->getCode(),
            'js_content' => ''
        ));
    }

    protected function getGrid()
    {
        $oGrid = BxDolGrid::getObjectInstance('sys_audit_administration');
        if(!$oGrid)
            return '';

        $oTemplate = BxDolStudioTemplate::getInstance();
        // The grid adds its files to the site template, which Studio does not print: the date filter's calendar is added here with the rest.
        list($aCssCalendar, $aJsCalendar) = BxBaseFormView::getCssJsCalendar();
        $oTemplate->addJs(array_merge($aJsCalendar, ['BxDolAuditManageTools.js', 'BxDolGrid.js', 'jquery.form.min.js', 'jquery-ui/jquery-ui.min.js']));
        $oTemplate->addCss(array_merge($aCssCalendar, ['grid.css', 'manage_tools.css']));
        $oTemplate->addJsTranslation(array('_sys_grid_search'));

        return BxDolStudioTemplate::getInstance()->parseHtmlByName('audit.html', array(
            'content' => $oGrid->getCode(),
            'js_content' => ''
        ));
    }
}

/** @} */
