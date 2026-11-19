<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT 
 * @defgroup    Tasks Tasks
 * @ingroup     UnaModules
 *
 * @{
 */

class BxTasksFormImport extends BxTemplFormView
{
    protected $_sModule;
    protected $_oModule;

    public function __construct($aInfo, $oTemplate = false)
    {
        $this->_sModule = 'bx_tasks';
    	$this->_oModule = BxDolModule::getInstance($this->_sModule);

        $sImportFormId = $this->_oModule->_oConfig->getHtmlIds('import_form');

        $aInfo = [
            'form_attrs' => [
                'id' => $sImportFormId,
                'name' => $sImportFormId,
                'action' => '',
                'method' => 'post',
            ],
            'params' => [
                'db' => [
                    'table' => '',
                    'key' => '',
                    'uri' => '',
                    'uri_title' => '',
                    'submit_name' => 'submit'
                ],
            ],
            'inputs' => [
                'page' => [
                    'type' => 'hidden',
                    'name' => 'page',
                    'value' => ''
                ],
                'source' => [
                    'type' => 'select',
                    'name' => 'source',
                    'caption' => _t('_bx_tasks_form_import_input_source'),
                    'values' => [
                        ['key' => '', 'value' => _t('_sys_please_select')],
                        ['key' => 'linear', 'value' => _t('_bx_tasks_form_import_input_source_linear')]
                    ],
                    'value' => '',
                    'attrs' => [
                        'onchange' => $this->_oModule->_oConfig->getJsObject('import') . '.changeSource(this)'
                    ],
                    'required' => 1,
                    'checker' => [
                        'func' => 'Avail',
                        'params' => [],
                        'error' => '_bx_tasks_form_import_input_err'
                    ],
                    'db' => [
                        'pass' => 'Xss',
                    ],
                ],
                'destination' => [
                    'type' => 'custom',
                    'name' => 'destination',
                    'caption' => _t('_bx_tasks_form_import_input_destination'),
                    'value' => '',
                    'required' => 1,
                    'checker' => [
                        'func' => 'Avail',
                        'params' => [],
                        'error' => '_bx_tasks_form_import_input_err'
                    ],
                    'db' => [
                        'pass' => 'Xss',
                    ],
                ],
                'params' => [
                    'type' => 'textarea',
                    'name' => 'params',
                    'caption' => _t('_bx_tasks_form_import_input_params'),
                    'value' => '',
                    'attrs' => [
                        'id' => $this->_oModule->_oConfig->getHtmlIds('import_field_params')
                    ],
                    'code' => 1,
                    'db' => [
                        'pass' => 'Xss',
                    ],
                ],
                'submit' => [
                    'type' => 'submit',
                    'name' => 'submit',
                    'value' => _t('_bx_tasks_form_import_input_submit'),
                ],
            ]
        ];

        parent::__construct($aInfo, $oTemplate);
    }

    protected function genCustomInputDestination ($aInput)
    {
        return $this->genCustomInputUsernamesSuggestions(array_merge($aInput, [
            'ajax_get_suggestions' => BX_DOL_URL_ROOT . "modules/?r=" . $this->_oModule->_oConfig->getUri() . "/ajax_get_destinations",
            'custom' => [
                'only_once' => 1
            ]
        ]));
    }
}

/** @} */
