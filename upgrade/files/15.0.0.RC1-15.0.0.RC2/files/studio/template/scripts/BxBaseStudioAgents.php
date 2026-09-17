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

    protected $sSessionKeyAgentsView;

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

        $this->sSessionKeyAgentsView = 'bx_std_agents_view';
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

    protected function _setView($sView)
    {
        return BxDolSession::getInstance()->setValue($this->{'sSessionKey' . ucfirst($this->sPage) . 'View'}, $sView);
    }

    protected function _getView()
    {
        return BxDolSession::getInstance()->getValue($this->{'sSessionKey' . ucfirst($this->sPage) . 'View'});
    }

    protected function getAgents()
    {
        $aTs = ['list' => 'grid', 'grid' => 'list'];
        $aT2i = ['list' => 'ui-list.svg', 'grid' => 'ui-layout-grid.svg'];

        $sType = 'list';
        if(($sTypeGt = bx_get('view')) !== false && in_array($sTypeGt, $aTs)) {
            $sType = $sTypeGt;
            $this->_setView($sTypeGt);
        }
        else if(($sTypeSn = $this->_getView()) && in_array($sTypeSn, $aTs))
            $sType = $sTypeSn;

        $sTypeNew = $aTs[$sType];

        return [
            'type' => BX_DB_DEF,
            'actions' => [[
                'name' => $sTypeNew,
                'caption' => _t('_sys_agents_builder_view_' . $sTypeNew),
                'title_only' => true,
                'url' => $this->sSubpageUrl . $this->sPage . '&view=' . $sTypeNew,
                'icon' => BxDolStudioTemplate::getInstance()->getIconContent($aT2i[$sTypeNew])
            ]],
            'content' => ($sMethod = 'getAgents' . bx_gen_method_name($sType)) && method_exists($this, $sMethod) ? $this->$sMethod() : ''
        ];
    }

    protected function getAgentsList()
    {
        $sJsObject = $this->getPageJsObject();
        $oTemplate = BxDolStudioTemplate::getInstance();

        $oAi = BxDolAi::getInstance();
        $aAgents = $oAi->getAgentsBy(['sample' => 'all']);

        $oGrid = $this->getGrid($this->aGridObjects[BX_DOL_STUDIO_AGENTS_TYPE_AGENTS], true);
        if($oGrid)
            $this->aPageJsOptions['sObjNameGrid'] = $oGrid->getObject();

        $oForm = new BxTemplFormView([]);
        $aInput = [
            'type' => 'switcher',
            'name' => 'tabs',
            'caption' => '',
            'info' => '',
            'value' => '1',
            'checked' => '',
            'attrs' => [
                'onchange' => $sJsObject . '.agentActivate(this)'
            ],
            'db' => []
        ];
        
        $aTmplVarsAgents = [];
        foreach($aAgents as $aAgent) {

            $sIcon = '';
            if(($sIcon = $aAgent['icon'])) {
                list($sIcon, $sIconUrl, $sIconA, $sIconHtml) = $oTemplate->getTemplateFunctions()->getIcon($sIcon, ['class' => 'sys-colored']);

                if($sIcon)
                    $sIcon = $oTemplate->parseIcon(BxDolIconset::getObjectInstance()->getIcon($sIcon));
                else if($sIconHtml)
                    $sIcon = $sIconHtml;
            }
            
            $aTmplVarsTrigger = [];
            if(($sTrigger = $aAgent['trigger']))
                $aTmplVarsTrigger = [
                    'trigger_title' => bx_html_attribute(_t('_sys_agents_field_trigger_' . str_replace(['-', ' '], '_', $sTrigger))),
                    'trigger_icon' => $oTemplate->getIconContent('agt-trg-' . $sTrigger . '.svg')
                ];

            $aTmplVarsModel = [];
            if(($iModelId = (int)$aAgent['model_id'])) {
                $aModel = $this->oDbAi->getModelsBy(['sample' => 'id', 'id' => $iModelId]);
                if(($sModelTitle = $aModel['title'] ?? false))
                    $aTmplVarsModel['model_title'] = bx_html_attribute($sModelTitle);
                if(($sModelIcon = $aModel['icon'] ?? false))
                    $aTmplVarsModel['model_icon'] = $oTemplate->getIconContent($sModelIcon);
            }

            $sProfile = '';
            if(($iProfileId = (int)$aAgent['profile_id']) && ($oProfile = BxDolProfile::getInstance($iProfileId)) !== false)
                $sProfile = $oProfile->getUnit(0, ['template' => 'unit_wo_info']);

            $aInput['checked'] = (int)$aAgent['active'] != 0;

            $aTmplVarsActions = $oGrid ? $this->_getAgentCardActions($oGrid, $aAgent, $oTemplate) : [];

            $aTmplVarsAgents[] = [
                'id' => $aAgent['id'],
                'js_object' => $sJsObject,
                'icon' => $sIcon,
                'bx_if:show_trigger' => [
                    'condition' => !empty($aTmplVarsTrigger),
                    'content' => $aTmplVarsTrigger
                ],
                'bx_if:show_model' => [
                    'condition' => !empty($aTmplVarsModel),
                    'content' => $aTmplVarsModel
                ],
                'bx_if:show_profile' => [
                    'condition' => (bool)$sProfile,
                    'content' => [
                        'unit' => $sProfile
                    ]
                ],
                'title' => $aAgent['title'] ?: $aAgent['name'],
                'switcher' => $oForm->genInput($aInput),
                'bx_if:show_actions' => [
                    'condition' => !empty($aTmplVarsActions),
                    'content' => [
                        'id' => $aAgent['id'],
                        'js_object' => $sJsObject,
                        'actions_icon' => $oTemplate->getIconContent('agt-actions.svg'),
                        'bx_repeat:actions' => $aTmplVarsActions
                    ]
                ],
                'description' => bx_process_output($aAgent['description'])
            ];
        }

        return $oTemplate->parseHtmlByName('agents.html', [
            'content' => $oTemplate->parseHtmlByName('agents_agents.html', [
                'bx_repeat:agents' => $aTmplVarsAgents,
                'bx_if:show_empty' => [
                    'condition' => empty($aTmplVarsAgents),
                    'content' => [
                        'js_object' => $sJsObject,
                    ]
                ],
            ]) . ($oGrid ? $oGrid->getCodeJs() : ''),
            'js_content' => $this->getPageJsCode()
        ]);
    }

    protected function _getAgentCardActions($oGrid, $aAgent, $oTemplate)
    {
        $aActions = $oGrid->getActionsRaw('single', $aAgent['id'], $aAgent);
        if(empty($aActions) || !is_array($aActions))
            return [];

        $oIconset = BxDolIconset::getObjectInstance();
        $oFunctions = $oTemplate->getTemplateFunctions();

        $aTmplVars = [];
        foreach($aActions as $aAction) {
            $sIcon = '';
            if(!empty($aAction['icon'])) {
                list($sIconFont, $sIconUrl, $sIconA, $sIconHtml) = $oFunctions->getIcon($aAction['icon']);
                if($sIconFont)
                    $sIcon = $oTemplate->parseIcon($oIconset->getIcon($sIconFont), ['class' => 'sys-colored']);
                else if($sIconHtml)
                    $sIcon = $sIconHtml;
                else if($sIconUrl)
                    $sIcon = '<img src="' . $sIconUrl . '" />';
            }

            $aTmplVars[] = [
                'name' => $aAction['name'],
                'title' => $aAction['title'],
                'icon' => $sIcon,
                'confirm' => (int)$aAction['confirm'],
                'reset_paginate' => (int)$aAction['reset_paginate'],
                'id' => $aAgent['id'],
                'js_object' => $this->getPageJsObject(),
            ];
        }

        return $aTmplVars;
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
