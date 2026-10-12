<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Analytics Analytics
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * Studio page of the module: reports first, then the content reports and the settings.
 * Tabs render the same block services as the site's analytics page.
 */
class BxAnalyticsStudioPage extends BxTemplStudioModule
{
    protected $_sModule;
    protected $_oModule;

    protected $sPageDefault = 'overview';

    function __construct($sModule, $mixedPageName, $sPage = "")
    {
        $this->_sModule = 'bx_analytics';
        $this->_oModule = BxDolModule::getInstance($this->_sModule);

        parent::__construct($sModule, $mixedPageName, $sPage);

        $this->aMenuItems = array_merge([
            'overview' => ['name' => 'overview', 'icon' => 'chart-line', 'title' => '_bx_analytics_lmi_cpt_overview'],
            'content' => ['name' => 'content', 'icon' => 'chart-bar', 'title' => '_bx_analytics_lmi_cpt_content'],
        ], $this->aMenuItems);
    }

    protected function getOverview()
    {
        $this->_oModule->_oTemplate->setStudio(true);

        $sOverview = $this->_oModule->serviceGetBlockOverview();
        if($sOverview === '')
            return '';

        $aCards = [];
        foreach(array_keys($this->_oModule->getReports()->getGroups()) as $sGroup)
            $aCards[] = [
                'title' => _t('_bx_analytics_group_' . $sGroup),
                'content' => $this->_oModule->serviceGetBlockTop($sGroup),
            ];

        return $this->_oModule->_oTemplate->getStudioOverview($sOverview, $aCards);
    }

    protected function getContent()
    {
        $this->_oModule->_oTemplate->setStudio(true);

        return $this->_oModule->serviceGetCanvas();
    }
}

/** @} */
