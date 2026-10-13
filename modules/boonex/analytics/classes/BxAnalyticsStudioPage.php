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
 * Studio page of the module: every report section in a side menu grouped like the reports
 * themselves (traffic, behavior, conversion, revenue, health, community, explore), then setup
 * and settings. A section shows the same block services the site's page builder offers, with
 * the filter bar on top, so a report looks and counts the same in Studio and on any page.
 */
class BxAnalyticsStudioPage extends BxTemplStudioModule
{
    protected $_sModule;
    protected $_oModule;

    protected $sPageDefault = 'overview';

    /**
     * Section => [page => Lucide glyph]. The empty section has no heading.
     */
    protected $_aSections = [
        '' => ['overview' => 'chart-line'],
        'traffic' => ['realtime' => 'zap', 'pages' => 'file-text', 'sources' => 'share-2', 'audience' => 'users', 'map' => 'earth', 'bots' => 'bot'],
        'behavior' => ['sessions' => 'history', 'users' => 'user', 'events' => 'mouse-pointer-click'],
        'conversion' => ['goals' => 'target', 'funnels' => 'funnel', 'journeys' => 'route', 'retention' => 'repeat'],
        'revenue' => ['revenue' => 'circle-dollar-sign', 'subscriptions' => 'refresh-cw', 'sales' => 'shopping-cart', 'credits' => 'coins'],
        'health' => ['errors' => 'triangle-alert', 'performance' => 'gauge'],
        'community' => ['content' => 'layers'],
        'explore' => ['query' => 'database', 'api' => 'code', 'dashboards' => 'layout-dashboard'],
        'configure' => ['setup' => 'plug', 'settings' => 'settings'],
    ];

    public function __construct($sModule, $mixedPageName, $sPage = "")
    {
        $this->_sModule = 'bx_analytics';
        $this->_oModule = BxDolModule::getInstance($this->_sModule);

        parent::__construct($sModule, $mixedPageName, $sPage);

        $aSettings = $this->aMenuItems[BX_DOL_STUDIO_MOD_TYPE_SETTINGS];

        $this->aMenuItems = [];
        foreach($this->_aSections as $aPages)
            foreach($aPages as $sPage => $sIcon)
                $this->aMenuItems[$sPage] = $sPage == BX_DOL_STUDIO_MOD_TYPE_SETTINGS ? $aSettings : [
                    'name' => $sPage,
                    'icon' => '',
                    'lucide' => $sIcon,
                    'title' => '_bx_analytics_lmi_cpt_' . $sPage,
                ];
    }

    /**
     * The side menu in sections, each drawn by Studio's own menu object.
     */
    protected function getPageMenuObject($aMenu = [], $aMarkers = [])
    {
        $this->_oModule->_oTemplate->addStudioCss(['studio.css']);

        bx_import('StudioMenu', $this->_oModule->_aModule);
        bx_import('StudioMenuItems', $this->_oModule->_aModule);

        $aByName = [];
        foreach($aMenu as $aItem)
            $aByName[$aItem['name']] = $aItem;

        $aSections = [];
        foreach($this->_aSections as $sSection => $aPages) {
            $aItems = [];
            foreach(array_keys($aPages) as $sPage)
                if(isset($aByName[$sPage]))
                    $aItems[] = $aByName[$sPage];

            if(empty($aItems))
                continue;

            $oMenu = new BxAnalyticsStudioMenuItems(['template' => 'menu_side.html', 'menu_items' => $aItems]);
            if(!empty($aMarkers))
                $oMenu->addMarkers($aMarkers);
            $oMenu->setInlineIcons($this->bPageMenuIconsInline);

            $aSections[] = [
                'name' => $sSection !== '' ? $sSection : 'main',
                'title' => $sSection !== '' ? _t('_bx_analytics_section_' . $sSection) : '',
                'menu' => $oMenu,
            ];
        }

        return new BxAnalyticsStudioMenu($this->_oModule->_oTemplate, $aSections);
    }

    /**
     * Report sections: the page name is the section the module renders.
     */
    public function getPageCode($sPage = '', $bWrap = true)
    {
        if(empty($sPage))
            $sPage = $this->sPage;

        if($sPage != BX_DOL_STUDIO_MOD_TYPE_SETTINGS && isset($this->aMenuItems[$sPage]) && !method_exists($this, 'get' . bx_gen_method_name($sPage))) {
            $sResult = parent::getPageCode('', $bWrap);
            if($sResult === false)
                return false;

            $this->_oModule->_oTemplate->setStudio(true);

            return $this->getBlockCode(['content' => $this->_oModule->getStudioSection($sPage)]) . $sResult;
        }

        return parent::getPageCode($sPage, $bWrap);
    }

    protected function getContent()
    {
        $this->_oModule->_oTemplate->setStudio(true);

        return $this->_oModule->serviceGetCanvas();
    }
}

/** @} */
