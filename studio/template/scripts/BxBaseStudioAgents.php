<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

class BxBaseStudioAgents extends BxDolStudioAgents
{
    protected $sSubpageUrl;
    protected $aPageJsOptions;
    protected $aMenuItems;
    protected $aGridObjects;


    public function __construct($sPage = '')
    {
        parent::__construct($sPage);

        $this->sSubpageUrl = BX_DOL_URL_STUDIO . 'agents.php?page=';

        $this->aPageJs = array_merge($this->aPageJs, ['agents.js']);
        $this->aPageCss = array_merge($this->aPageCss, ['cmts.css', 'agents.css']);

        $this->sPageJsClass = 'BxDolStudioPageAgents';
        $this->sPageJsObject = 'oBxDolStudioPageAgents';
        $this->aPageJsOptions = [
            'sActionUrl' => BX_DOL_URL_STUDIO . 'agents.php',
            'sPageUrl' => $this->sSubpageUrl
        ];

        $this->aMenuItems = [
            BX_DOL_STUDIO_AGENTS_TYPE_AGENTS => ['icon' => 'mi-agt-assistants.svg'],
            BX_DOL_STUDIO_AGENTS_TYPE_AI_PROVIDERS => ['icon' => 'mi-agt-providers.svg'],
            BX_DOL_STUDIO_AGENTS_TYPE_TOOLS => ['icon' => 'mi-agt-tools.svg'],
            BX_DOL_STUDIO_AGENTS_TYPE_VECTOR_STORE => ['icon' => 'mi-agt-vector-store.svg'],
            BX_DOL_STUDIO_AGENTS_TYPE_SETTINGS => ['icon' => 'mi-agt-settings.svg']
        ];

        $this->aGridObjects = [
            BX_DOL_STUDIO_AGENTS_TYPE_AGENTS => 'sys_studio_agents_agents',
            BX_DOL_STUDIO_AGENTS_TYPE_AI_PROVIDERS => 'sys_studio_agents_models',
            BX_DOL_STUDIO_AGENTS_TYPE_TOOLS => 'sys_studio_agents_tools',
            BX_DOL_STUDIO_AGENTS_TYPE_VECTOR_STORE => 'sys_studio_agents_vector_store',
        ];
    }

    public function getPageJsCode($aOptions = [], $bWrap = true)
    {
        return parent::getPageJsCode(array_merge($aOptions, $this->aPageJsOptions), $bWrap);
    }

    public function getPageCaption()
    {
        return parent::getPageCaption() . $this->getPageJsCode();
    }

    public function getPageMenu($aMenu = [], $aMarkers = [])
    {
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

    protected function getSettings()
    {
        $oOptions = new BxTemplStudioOptions(BX_DOL_STUDIO_STG_TYPE_DEFAULT, [
            'agents_general',
            'agents_usage',
        ]);

        $this->aPageCss = array_merge($this->aPageCss, $oOptions->getCss());
        $this->aPageJs = array_merge($this->aPageJs, $oOptions->getJs());

        return $oOptions->getCode();
    }

    protected function getAiProviders()
    {
        $this->aPageJsOptions = array_merge($this->aPageJsOptions, [
            'sPageUrl' => $this->sSubpageUrl . 'providers',
            'sActionUrlGrid' => bx_append_url_params(BX_DOL_URL_ROOT . 'grid.php', [
                'o' => 'sys_studio_agents_providers'
            ])
        ]);

        return $this->getGrid($this->aGridObjects[BX_DOL_STUDIO_AGENTS_TYPE_AI_PROVIDERS]);
    }

    protected function getTools()
    {
        $this->aPageJsOptions['sPageUrl'] .= 'tools';

        return $this->getGrid($this->aGridObjects[BX_DOL_STUDIO_AGENTS_TYPE_TOOLS]);
    }

    protected function getVectorstore()
    {
        $this->aPageJsOptions['sPageUrl'] .= 'vector_store';

        return $this->getGrid($this->aGridObjects[BX_DOL_STUDIO_AGENTS_TYPE_VECTOR_STORE]);
    }

    protected function getAgents()
    {
        return [
            'type' => BX_DB_DEF,
            'content' => $this->getAgentsGrid()
        ];
    }

    protected function getAgentsGrid()
    {
        return $this->getGrid($this->aGridObjects[BX_DOL_STUDIO_AGENTS_TYPE_AGENTS]);
    }

    protected function getGrid($sObjectName, $bObject = false)
    {
        $oGrid = BxDolGrid::getObjectInstance($sObjectName);
        if(!$oGrid)
            return '';

        return $bObject ? $oGrid : $oGrid->getCode();
    }

}

/** @} */
