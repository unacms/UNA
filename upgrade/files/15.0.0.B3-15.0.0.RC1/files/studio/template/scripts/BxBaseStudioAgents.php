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
            BX_DOL_STUDIO_AGENTS_TYPE_SETTINGS => ['icon' => 'mi-agt-settings.svg'],

            /*
             * Hidden for now. Most probably they will be removed.
             * 
            BX_DOL_STUDIO_AGENTS_TYPE_PROVIDERS => ['icon' => 'mi-agt-providers.svg'],
            BX_DOL_STUDIO_AGENTS_TYPE_HELPERS => ['icon' => 'mi-agt-helpers.svg'],
            BX_DOL_STUDIO_AGENTS_TYPE_AUTOMATORS => ['icon' => 'mi-agt-automators.svg'],
             */
        ];

        $this->aGridObjects = [
            BX_DOL_STUDIO_AGENTS_TYPE_AI_PROVIDERS => 'sys_studio_agents_models',
            BX_DOL_STUDIO_AGENTS_TYPE_VECTOR_STORE => 'sys_studio_agents_vector_store',
            BX_DOL_STUDIO_AGENTS_TYPE_TOOLS => 'sys_studio_agents_tools',

            BX_DOL_STUDIO_AGENTS_TYPE_ASSISTANTS => 'sys_studio_agents_assistants',
            BX_DOL_STUDIO_AGENTS_TYPE_ASSISTANTS . '_chats' => 'sys_studio_agents_assistants_chats',
            BX_DOL_STUDIO_AGENTS_TYPE_ASSISTANTS . '_files' => 'sys_studio_agents_assistants_files',
            BX_DOL_STUDIO_AGENTS_TYPE_AGENTS => 'sys_studio_agents_agents',

            /*
             * Hidden for now. Most probably they will be removed.
             * 
            BX_DOL_STUDIO_AGENTS_TYPE_AUTOMATORS => 'sys_studio_agents_automators',
            BX_DOL_STUDIO_AGENTS_TYPE_PROVIDERS => 'sys_studio_agents_providers',
            BX_DOL_STUDIO_AGENTS_TYPE_HELPERS => 'sys_studio_agents_helpers',
             * 
             */
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

    protected function getAssistants()
    {
        $oAi = BxDolAI::getInstance();
        $oTemplate = BxDolStudioTemplate::getInstance();
        
        $this->aPageJsOptions['sPageUrl'] .= 'assistants';

        $sSubPage = '';
        if(($sSubPage = bx_get('spage')) !== false)
            $sSubPage = bx_process_input($sSubPage, BX_DATA_TEXT);

        $iAssistantId = 0;
        if(($iAssistantId = bx_get('aid')) !== false)
            $iAssistantId = bx_process_input($iAssistantId, BX_DATA_INT);

        $iChatId = 0;
        if(($iChatId = bx_get('cid')) !== false)
            $iChatId = bx_process_input($iChatId, BX_DATA_INT);

        if($iAssistantId && $iChatId) {
            $aResult = [];

            $sAssistantUrl = $this->sSubpageUrl . 'assistants&spage=chats&aid=' . $iAssistantId;
            $aAssistant = $oAi->getAssistantById($iAssistantId);
            if(!empty($aAssistant) && is_array($aAssistant)) {
                $aChat = $oAi->getAssistantChatById($iChatId);
                if(!empty($aChat) && is_array($aChat))
                    $aResult[] = $oTemplate->parseHtmlByName('agents_assistant_info.html', [
                        'assistant_name' => $aAssistant['name'],
                        'assistant_info' => $aAssistant['description'],
                        'bx_if:show_chat' => [
                            'condition' => true,
                            'content' => [
                                'chat_name' => $aChat['name'],
                                'chat_info' => $aChat['description'],
                            ]
                        ],
                        'url_back' => $sAssistantUrl
                    ]);
            }

            if(($oCmts = $oAi->getAssistantChatCmtsObject($iChatId, $oTemplate)) !== false) {
                $this->aPageJsOptions = array_merge($this->aPageJsOptions, [
                    'sPageUrl' => $sAssistantUrl . '&cid=' . $iChatId,
                    'sActionUrlCmts' => bx_append_url_params(BX_DOL_URL_ROOT . 'cmts.php', [
                        'sys' => $oCmts->getSystemName(),
                        'id' => $iChatId
                    ])
                ]);

                $aResult[] = $oCmts->getCommentsBlock();
            }
            else
                $aResult[] = MsgBox(_t('_error occured'));

            return $aResult;
        }
        else if($iAssistantId) {
            $aResult = [];

            $aAssistant = $oAi->getAssistantById($iAssistantId);
            if(!empty($aAssistant) && is_array($aAssistant))
                $aResult[] = $oTemplate->parseHtmlByName('agents_assistant_info.html', [
                    'assistant_name' => $aAssistant['name'],
                    'assistant_info' => $aAssistant['description'],
                    'bx_if:show_chat' => [
                        'condition' => false,
                        'content' => [
                            'chat_name' => '',
                            'chat_info' => '',
                        ]
                    ],
                    'url_back' => $this->aPageJsOptions['sPageUrl']
                ]);
            
            switch($sSubPage) {
                case 'chats':
                    $aResult[] = $this->getGrid($this->aGridObjects[BX_DOL_STUDIO_AGENTS_TYPE_ASSISTANTS . '_chats']);
                    break;

                case 'files':
                    $aResult[] = $this->getGrid($this->aGridObjects[BX_DOL_STUDIO_AGENTS_TYPE_ASSISTANTS . '_files']);
                    break;
            }

            return $aResult;
        }

        return $this->getGrid($this->aGridObjects[BX_DOL_STUDIO_AGENTS_TYPE_ASSISTANTS]);
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
                'icon' => $aT2i[$sTypeNew]
            ]],
            'content' => ($sMethod = 'getAgents' . bx_gen_method_name($sType)) && method_exists($this, $sMethod) ? $this->$sMethod() : ''
        ];
    }

    protected function getAgentsList()
    {
        $sJsObject = $this->getPageJsObject();
        $oTemplate = BxDolStudioTemplate::getInstance();

        $oAi = BxDolAI::getInstance();
        $aAgents = $oAi->getAgentsBy(['sample' => 'all']);

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
                list($sIcon, $sIconUrl, $sIconA, $sIconHtml) = $oTemplate->getTemplateFunctions()->getIcon($sIcon);

                if($sIcon)
                    $sIcon = $oTemplate->parseIcon(BxDolIconset::getObjectInstance()->getIcon($sIcon));
                else if($sIconHtml)
                    $sIcon = $sIconHtml;
            }
            
            $aTmplVarsTrigger = [];
            if(($sTrigger = $aAgent['trigger']))
                $aTmplVarsTrigger = [
                    'trigger_title' => bx_html_attribute(_t('_sys_agents_field_trigger_' . str_replace(['-', ' '], '_', $sTrigger))),
                    'trigger_icon_src' => $oTemplate->getIconUrl('agt-trg-' . $sTrigger . '.svg')
                ];

            $aTmplVarsModel = [];
            if(($iModelId = (int)$aAgent['model_id'])) {
                $aModel = $this->oDbAi->getModelsBy(['sample' => 'id', 'id' => $iModelId]);
                if(($sModelTitle = $aModel['title'] ?? false))
                    $aTmplVarsModel['model_title'] = bx_html_attribute($sModelTitle);
                if(($sModelIcon = $aModel['icon'] ?? false))
                    $aTmplVarsModel['model_icon_src'] = $oTemplate->getIconUrl($sModelIcon);
            }

            $sProfile = '';
            if(($iProfileId = (int)$aAgent['profile_id']) && ($oProfile = BxDolProfile::getInstance($iProfileId)) !== false)
                $sProfile = $oProfile->getUnit(0, ['template' => 'unit_wo_info']);

            $aInput['checked'] = (int)$aAgent['active'] != 0;

            $aTmplVarsAgents[] = [
                'id' => $aAgent['id'],
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
                'title' => $aAgent['title'],
                'switcher' => $oForm->genInput($aInput),
                'description' => bx_process_output($aAgent['description'])
            ];
        }

        return $oTemplate->parseHtmlByName('agents.html', [
            'content' => $oTemplate->parseHtmlByName('agents_agents.html', [
                'bx_repeat:agents' => $aTmplVarsAgents,
            ]),
            'js_content' => $this->getPageJsCode()
        ]);
    }

    protected function getAgentsGrid()
    {
        return $this->getGrid($this->aGridObjects[BX_DOL_STUDIO_AGENTS_TYPE_AGENTS]);
    }

    /*
     * Isn't used for now. Most probably they will be removed.
     * 
    protected function getAutomators()
    {
        $oTemplate = BxDolStudioTemplate::getInstance();

        $this->aPageJsOptions['sPageUrl'] .= 'automators';

        if(($iId = bx_get('id')) !== false) {
            if(($oCmts = BxDolAI::getInstance()->getAutomatorCmtsObject($iId, $oTemplate)) !== false) {
                $this->aPageJsOptions = array_merge($this->aPageJsOptions, [
                    'sPageUrl' => $this->sSubpageUrl . 'automators&id=' . $iId,
                    'sActionUrlCmts' => bx_append_url_params(BX_DOL_URL_ROOT . 'cmts.php', [
                        'sys' => $oCmts->getSystemName(),
                        'id' => $iId
                    ])
                ]);

                return $oCmts->getCommentsBlock();
            }
            else
                return MsgBox(_t('_error occured'));
        }

        return $this->getGrid($this->aGridObjects[BX_DOL_STUDIO_AGENTS_TYPE_AUTOMATORS]);
    }
    
    protected function getHelpers()
    {
        $oTemplate = BxDolStudioTemplate::getInstance();
        
        $this->aPageJsOptions['sPageUrl'] .= 'helpers';

        if(($iId = bx_get('id')) !== false) {
            $this->aPageJsOptions = array_merge($this->aPageJsOptions, [
                'sPageUrl' => $this->sSubpageUrl . 'helpers&id=' . $iId,
            ]);
            
            $aHelper = BxDolAI::getInstance()->getHelperById($iId);

            $aForm = $this->_getHelpersForm('tune', $aHelper);
            $oForm = new BxTemplFormView($aForm);
            $oForm->initChecker();

            if($oForm->isSubmittedAndValid()) {
                if($oForm->update($iId) !== false) {
                    $sMessage = $oForm->getCleanValue('message');
                    $oForm->aInputs['result']['value'] = BxDolAI::callHelper($iId, $sMessage);
                }
            }

            return $oForm->getCode();
        }

        return $this->getGrid($this->aGridObjects[BX_DOL_STUDIO_AGENTS_TYPE_HELPERS]);
    }

    protected function getProviders()
    {
        $this->aPageJsOptions = array_merge($this->aPageJsOptions, [
            'sPageUrl' => $this->sSubpageUrl . 'providers',
            'sActionUrlGrid' => bx_append_url_params(BX_DOL_URL_ROOT . 'grid.php', [
                'o' => 'sys_studio_agents_providers'
            ])
        ]);

        return $this->getGrid($this->aGridObjects[BX_DOL_STUDIO_AGENTS_TYPE_PROVIDERS]);
    }
     * 
     */

    protected function getGrid($sObjectName, $bObject = false)
    {
        $oGrid = BxDolGrid::getObjectInstance($sObjectName);
        if(!$oGrid)
            return '';

        return $bObject ? $oGrid : $oGrid->getCode();
    }
    
    protected function _getHelpersForm($sAction, $aHelper = [])
    {
        $aForm = array(
            'form_attrs' => array(
                'id' => 'bx_std_agents_helpers_' . $sAction,
                'action' => $this->aPageJsOptions['sPageUrl'],
                'method' => 'post',
            ),
            'params' => array (
                'db' => array(
                    'table' => 'sys_agents_helpers',
                    'key' => 'id',
                    'submit_name' => 'do_submit',
                ),
            ),
            'inputs' => [
                'prompt' => [
                    'type' => 'textarea',
                    'name' => 'prompt',
                    'caption' => _t('_sys_agents_helpers_field_prompt'),
                    'value' => isset($aHelper['prompt']) ? $aHelper['prompt'] : '',
                    'required' => '1',
                    'checker' => [
                        'func' => 'Avail',
                        'params' => [],
                        'error' => _t('_sys_agents_helpers_field_prompt_err'),
                    ],
                    'db' => [
                        'pass' => 'Xss',
                    ]
                ],
                'message' => [
                    'type' => 'textarea',
                    'name' => 'message',
                    'caption' => _t('_sys_agents_helpers_field_message'),
                    'value' => '',
                    'required' => '1',
                    'checker' => [
                        'func' => 'Avail',
                        'params' => [],
                        'error' => _t('_sys_agents_helpers_field_message_err'),
                    ],
                ],
                'result' => [
                    'type' => 'textarea',
                    'name' => 'result',
                    'caption' => _t('_sys_agents_helpers_field_result'),
                    'value' => '',
                    'attrs' => [
                        'disabled' => 'disabled'
                    ]
                ],
                'submit' => [
                    'type' => 'submit',
                    'name' => 'do_submit',
                    'value' => _t('_sys_submit'),
                ],
            ],
        );

        return $aForm;
    }
}

/** @} */
