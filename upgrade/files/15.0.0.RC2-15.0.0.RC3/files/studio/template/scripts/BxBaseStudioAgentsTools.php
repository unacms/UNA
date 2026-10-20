<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

class BxBaseStudioAgentsTools extends BxDolStudioAgentsInstruments
{
    protected $_sUrlPage;

    public function __construct ($aOptions, $oTemplate = false)
    {
        parent::__construct ($aOptions, $oTemplate);

        $this->_sUrlPage = BX_DOL_URL_STUDIO . 'agents.php?page=tools';
        if (!empty($this->_aOptions['source']) && is_string($this->_aOptions['source']))
            $this->_aOptions['source'] = BxDolAiAgentTools::excludeHiddenFromSource($this->_aOptions['source']);
    }
    
    public function performActionDuplicate()
    {
        return parent::_performActionDuplicate('getToolById', 'insertTool');
    }

    public function performActionEdit()
    {
        return $this->_performActionEdit('getToolById', '_sys_agents_tools_popup_edit');
    }

    protected function _getForm($sAction = '', $aTool = [])
    {
        $sJsObject = $this->getPageJsObject();
    
        if (empty($aTool['params_user'])) {
            $aTool['params_user'] = $aTool['params'];
        }

        $data = json_decode($aTool['params_user'], true);
        $aTool['params_user'] = json_encode($data, JSON_PRETTY_PRINT);

        $oParsedown = new Parsedown();
        $oParsedown->setSafeMode(false);
        $sDocs = $oParsedown->text($aTool['docs']);

        return [
            'form_attrs' => [
                'id' => 'bx_std_agents_tools_' . $sAction,
                'action' => BX_DOL_URL_ROOT . 'grid.php?o=sys_studio_agents_tools&a=' . $sAction,
                'method' => 'post',
            ],
            'params' => array (
                'db' => array(
                    'table' => 'sys_agents_tools',
                    'key' => 'id',
                    'submit_name' => 'do_submit',
                ),
            ),
            'inputs' => [
                'docs' => [
                    'type' => 'custom',
                    'name' => 'docs',
                    'caption' => '',
                    'content' => $sDocs,
                ],
                'title' => [
                    'type' => 'text',
                    'name' => 'title',
                    'caption' => _t('_sys_agents_field_title'),
                    'required' => true,
                    'value' => !empty($aTool['title']) ? $aTool['title'] : '',
                    'db' => [
                        'pass' => 'Xss'
                    ]
                ],
                'params_user' => [
                    'type' => 'textarea',
                    'name' => 'params_user',
                    'caption' => _t('_sys_agents_tools_field_params'),
                    'info' => _t('_sys_agents_tools_field_params_info'),
                    'required' => false,
                    'value' => !empty($aTool['params_user']) ? $aTool['params_user'] : '',
                    'checker' => [
                        'func' => 'Json',
                        'params' => ['allow_empty' => true],
                        'error' => _t('_sys_agents_json_field_err'),
                    ],
                    'db' => [
                        'pass' => 'All'
                    ]
                ],
                'submit' => $this->_getFormControls(),
            ]
        ];
    }

    protected function _delete ($mixedId)
    {
        $aTool = $this->_oDb->getToolById($mixedId);
        if (empty($aTool) || $aTool['duplicate'] == 0)
            return false;

        return parent::_delete($mixedId);
    }
}

/** @} */
