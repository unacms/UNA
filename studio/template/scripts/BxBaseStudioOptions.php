<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

class BxBaseStudioOptions extends BxDolStudioOptions
{
    public function __construct($sType = '', $mixedCategory = '', $sMix = '')
    {
        parent::__construct($sType, $mixedCategory);
    }

    public function getCss()
    {
        return ['forms.css', 'options.css'];
    }

    public function getJs()
    {
        return ['jquery.form.min.js', 'jquery.webForms.js', 'options.js'];
    }

    public function getJsObject()
    {
        return 'oBxDolStudioOptions';
    }

    public function getCode($sCategorySelected = '')
    {
        $oTemplate = BxDolStudioTemplate::getInstance();
        $sJsObject = $this->getJsObject();

        $aCategories = [];
        $iCategories = $this->oDb->getCategories(['type' => 'by_type_name_key_name', 'type_name' => $this->sType, 'category_name' => $this->sCategory, 'hidden' => 0], $aCategories);
        if($iCategories > 0)
            $aCategories = array_keys($aCategories);

        $bMix = false;
        $aOptions2Mixes = [];
        if($this->bMixes) {
            if(!empty($this->sMix))
                $aMixesBrowse = ['type' => 'by_name', 'value' => $this->sMix];
            else if(is_string($this->sCategory))
                $aMixesBrowse = ['type' => 'by_type_category', 'mix_type' => $this->sType, 'mix_category' => $this->sCategory, 'active' => 1];
            else
                $aMixesBrowse = ['type' => 'by_type', 'value' => $this->sType, 'active' => 1];

            $aMix = array();
            $this->oDb->getMixes($aMixesBrowse, $aMix, false);
            if(!empty($aMix) && is_array($aMix)) {
                $this->aMix = $aMix;
                $this->sMix = $aMix['name'];

                $bMix = true;
                $this->oDb->getMixesOptions(['type' => 'by_mix_id_pair_option_value', 'value' => $this->aMix['id']], $aOptions2Mixes, false);
            }
            else
                $this->sMix = BX_DOL_STUDIO_STG_MIX_DEFAULT;
        }

        $bWrap = count($aCategories) > 1;
        $aForm = [
            'form_attrs' => [
                'id' => 'adm-settings-form' . ($bWrap ? '-categorized' : ''),
                'name' => 'adm-settings-form',
                'action' => bx_append_url_params($this->sBaseUrl, ['type' => $this->sType]),
                'method' => 'post',
                'enctype' => 'multipart/form-data',
                'target' => 'adm-settings-iframe',
                'onsubmit' => 'return ' . $sJsObject . '.onSubmit(this)'
            ],
            'params' => [
                'db' => [
                    'table' => 'sys_options',
                    'key' => 'id',
                    'uri' => '',
                    'uri_title' => '',
                    'submit_name' => 'save'
                ],
            ],
            'inputs' => []
        ];

        if($bMix)
            $aForm['inputs']['mix_id'] = [
                'type' => 'hidden',
                'name' => 'mix_id',
                'value' => $this->aMix['id'],
                'db' => [
                    'pass' => 'Int',
                ],
            ];

        foreach($aCategories as $sCategory) {
            $aFields = [];

            if(empty($sCategory))
                continue;

            $aCategory = array();
            $iCategory = $this->oDb->getCategories(['type' => 'by_name', 'value' => $sCategory], $aCategory);
            if($iCategory != 1)
                continue;

            $aOptions = array();
            $iOptions = $this->oDb->getOptions(['type' => 'by_category_id', 'value' => $aCategory['id']], $aOptions);

            foreach($aOptions as $aOption)
                $aFields[$aOption['name']] = $this->field($aOption, $aOptions2Mixes);

            if($bWrap) {
                $aCategory['selected'] = $aCategory['name'] == $sCategorySelected;
                $aFields = $this->header($aCategory, $aFields);
            }

            $aForm['inputs'] = array_merge($aForm['inputs'], $aFields);
        }

        $aForm['inputs'] = array_merge(
            $aForm['inputs'], (!$bWrap ? [] : [
                'header_save' => [
                    'type' => 'block_header',
                ],
            ]), [
                'categories' => [
                    'type' => 'hidden',
                    'name' => 'categories',
                    'value' => implode(',', $aCategories),
                    'db' => [
                        'pass' => 'Xss',
                    ],
                ]
            ], ($this->isReadOnly() ? [] : [
                'save' => [
                    'type' => 'submit',
                    'name' => 'save',
                    'value' => _t("_adm_btn_settings_save")
                ],
            ])
        );

        $oForm = new BxTemplStudioFormView($aForm, $oTemplate);
        $oForm->initChecker();

        if($oForm->isSubmittedAndValid()) {
            echo $this->saveChanges($oForm);
            exit;
        }

        $bTmplVarsMixes = false;
        $aTmplVarsMixes = [];
        if($this->bMixes) {
            if(is_string($this->sCategory))
                $aMixesBrowse = ['type' => 'by_type_category', 'mix_type' => $this->sType, 'mix_category' => $this->sCategory];
            else
                $aMixesBrowse = ['type' => 'by_type', 'value' => $this->sType];

            $aMixes = [];
            $this->oDb->getMixes($aMixesBrowse, $aMixes, false);
            $aMixes = array_merge([['name' => BX_DOL_STUDIO_STG_MIX_DEFAULT, 'title' => _t('_adm_stg_txt_mix_' . BX_DOL_STUDIO_STG_MIX_DEFAULT)]], $aMixes);

            foreach($aMixes as $aMix)
                $aTmplVarsMixes[] = [
                    'value' => $aMix['name'],
                    'title' => $aMix['title'],
                    'bx_if:show_checked_mix' => [
                        'condition' => !empty($this->sMix) && $aMix['name'] == $this->sMix,
                        'content' => []
                    ]
                ];

            $bTmplVarsMixes = !empty($aTmplVarsMixes);
        }

        $bMixSelected = !empty($this->sMix) && !empty($this->aMix);

        $aTmplVarsButton = [];
        if($bMixSelected)
            $aTmplVarsButton = [
                'js_object' => $sJsObject,
                'id' => $this->aMix['id']
            ];

        return $oTemplate->parseHtmlByName('options.html', [
            'base_url' => $this->sBaseUrl,
            'param_prefix' => $this->sParamPrefix,
            'js_object' => $sJsObject,
            'type' => $this->sType,
            'category' => is_array($this->sCategory) ? json_encode($this->sCategory) : $this->sCategory,
            'mix' => $this->sMix,
            'bx_if:show_manage' => [
                'condition' => $this->bManage,
                'content' => [
                    'js_object' => $sJsObject,
                ]
            ],
            'bx_if:show_mixes' => [
                'condition' => $this->bMixes,
                'content' => [
                    'js_object' => $sJsObject,
                    'bx_if:show_select_mix' => [
                        'condition' => $bTmplVarsMixes,
                        'content' => [
                            'js_object' => $sJsObject,
                            'bx_repeat:mixes' => $aTmplVarsMixes,
                        ]
                    ],
                    'bx_if:show_publish_mix' => [
                        'condition' => $bMixSelected && (int)$this->aMix['published'] == 0,
                        'content' => $aTmplVarsButton
                    ],
                    'bx_if:show_hide_mix' => [
                        'condition' => $bMixSelected && (int)$this->aMix['published'] != 0,
                        'content' => $aTmplVarsButton
                    ],
                    'bx_if:show_export_mix' => [
                        'condition' => $bMixSelected,
                        'content' => $aTmplVarsButton
                    ],
                    'bx_if:show_delete_mix' => [
                        'condition' => $bMixSelected,
                        'content' => $aTmplVarsButton
                    ],
                ]
            ], 
            'form' => $oForm->getCode()
        ]);
    }

    public function getPopupCodeImport($sType)
    {
    	$oTemplate = BxDolStudioTemplate::getInstance();
    	$sJsObject = $this->getJsObject();

    	$sForm = 'adm-settings-import-form';
    	$aForm = [
            'form_attrs' => [
                'id' => $sForm,
                'name' => $sForm,
                'action' => bx_append_url_params($this->sBaseUrl, [$this->sParamPrefix . '_action' => 'import']),
                'method' => 'post',
                'enctype' => 'multipart/form-data'
            ],
            'params' => [
                'db' => [
                    'submit_name' => 'save'
                ],
            ],
            'inputs' => [
            	'file' => [
                    'type' => 'file',
                    'name' => 'file',
                    'caption' => '',
                    'value' => '',
                ],
                'controls' => [
                    'type' => 'input_set', [
                        'type' => 'submit',
                        'name' => 'save',
                        'value' => _t('_adm_btn_settings_import'),
                    ], [
                        'type' => 'button',
                        'name' => 'cancel',
                        'value' => _t('_adm_txt_confirm_cancel'),
                        'attrs' => [
                            'class' => 'bx-def-margin-sec-left-auto',
                            'onclick' => '$(".bx-popup-applied:visible").dolPopupHide()'
                        ]
                    ]
                ]
            ]
        ];

        $oForm = new BxTemplStudioFormView($aForm);
        $oForm->initChecker();

        if($oForm->isSubmittedAndValid()) {
            $sError = _t('_adm_stg_err_cannot_perform');
            $sErrorWf = _t('_adm_stg_err_import_wrong_format');

            $aFile = $_FILES['file'];
            if(empty($aFile['tmp_name']))
                return ['code' => '1', 'message' => $sError];

            $sFile = $aFile['tmp_name'];
            $rHandle = @fopen($sFile, "r");
            if(!$rHandle)
                return ['code' => '2', 'message' => $sError];

            $sContents = fread($rHandle, filesize($sFile));
            fclose($rHandle);

            $aContent = json_decode($sContents, true);
            if(!is_array($aContent) || empty($aContent['meta']) || empty($aContent['data']))
                return ['code' => '3', 'message' => $sErrorWf];
            
            if(empty($aContent['meta']['type']) || strcmp($aContent['meta']['type'], $sType) != 0)
                return ['code' => '4', 'message' => $sErrorWf];

            $iData = 0;
            foreach($aContent['data']['types'] as $aType) {
                if(empty($aType['categories']) || !is_array($aType['categories']))
                    continue;

                foreach($aType['categories'] as $aCategory) {
                    if(empty($aCategory['options']) || !is_array($aCategory['options']))
                        continue;

                    foreach($aCategory['options'] as $sOptName => $sOptValue) {
                        setParam($sOptName, $sOptValue);
                        $iData += 1;
                    }
                }
            }

            $this->clearCache();
            return [
                'message' => _t('_adm_stg_msg_imported', $iData), 
                'eval' => $sJsObject . '.onImport(oData);'
            ];
        }

        return [
            'popup' => BxTemplStudioFunctions::getInstance()->popupBox('adm-stg-import-popup', _t('_adm_stg_txt_import_popup'), $oTemplate->parseHtmlByName('options_manage_popup.html', [
                'js_object' => $sJsObject,
                'form_id' => $sForm,
                'form' => $oForm->getCode(true),
            ]))
        ];
    }

    public function getPopupCodeCreateMix()
    {
    	$oTemplate = BxDolStudioTemplate::getInstance();
    	$sJsObject = $this->getJsObject();

    	$sForm = 'adm-settings-create-mix-form';
    	$aForm = [
            'form_attrs' => [
                'id' => $sForm,
                'name' => $sForm,
                'action' => bx_append_url_params($this->sBaseUrl, [$this->sParamPrefix . '_action' => 'create-mix']),
                'method' => 'post',
                'enctype' => 'multipart/form-data'
            ],
            'params' => [
                'db' => [
                    'table' => 'sys_options_mixes',
                    'key' => 'id',
                    'uri' => 'name',
                    'uri_title' => 'title',
                    'submit_name' => 'save'
                ],
            ],
            'inputs' => [
            	'type' => [
                    'type' => 'hidden',
                    'name' => 'type',
                    'value' => $this->sType
                ],
                'category' => [
                    'type' => 'hidden',
                    'name' => 'category',
                    'value' => is_array($this->sCategory) ? json_encode($this->sCategory) : $this->sCategory,
                ],
            	'title' => [
                    'type' => 'text',
                    'name' => 'title',
                    'caption' => _t('_adm_stg_txt_mix_title'),
                    'info' => _t('_adm_stg_txt_mix_title_inf'),
                    'value' => '',
                    'required' => true,
                    'checker' => [
                        'func' => 'avail',
                        'params' => [],
                        'error' => _t('_adm_stg_txt_mix_title_err')
                    ],
                    'db' => ['pass' => 'Xss']
                ],
                'dark' => [
                    'type' => 'switcher',
                    'name' => 'dark',
                    'caption' => _t('_adm_stg_txt_mix_dark'),
                    'info' => '',
                    'value' => '1',
                    'db' => ['pass' => 'Int']
                ],
                'duplicate' => [
                    'type' => 'select',
                    'name' => 'duplicate',
                    'caption' => _t('_adm_stg_txt_mix_duplicate'),
                    'info' => _t('_adm_stg_txt_mix_duplicate_inf'),
                    'values' => [
                        ['key' => '', 'value' => _t('_None')]
                    ],
                    'value' => '',
                ],
                'controls' => [
                    'type' => 'input_set', [
                        'type' => 'submit',
                        'name' => 'save',
                        'value' => _t('_adm_btn_settings_save'),
                    ], [
                        'type' => 'button',
                        'name' => 'cancel',
                        'value' => _t('_adm_txt_confirm_cancel'),
                        'attrs' => [
                            'class' => 'bx-def-margin-sec-left-auto',
                            'onclick' => '$(".bx-popup-applied:visible").dolPopupHide()'
                        ]
                    ]
                ]
            ]
        ];

        if(is_string($this->sCategory))
            $aMixesBrowse = ['type' => 'by_type_category', 'mix_type' => $this->sType, 'mix_category' => $this->sCategory];
    	else
            $aMixesBrowse = ['type' => 'by_type', 'value' => $this->sType];

        $aMixes = [];
        $this->oDb->getMixes($aMixesBrowse, $aMixes, false);
        foreach($aMixes as $aMix)
            $aForm['inputs']['duplicate']['values'][] = ['key' => $aMix['name'], 'value' => $aMix['title']];

        $oForm = new BxTemplStudioFormView($aForm);
        $oForm->initChecker();

        if($oForm->isSubmittedAndValid()) {
            $iId = $oForm->insert([
                'type' => $this->sType,
                'category' => is_string($this->sCategory) ? $this->sCategory : '',
                'name' => $oForm->generateUri()
            ]);

            if($iId === false)
                return ['code' => '1', 'message' => _t('_adm_stg_err_cannot_perform')];

            $this->oDb->updateMixes(['active' => 0], [
                'type' => $this->sType,
                'category' => is_string($this->sCategory) ? $this->sCategory : '',
                'active' => 1
            ]);
            $this->oDb->updateMixes(['active' => 1], ['id' => $iId]);

            $aDuplicate = [];
            $this->oDb->getMixes(['type' => 'by_name', 'value' => $oForm->getCleanValue('duplicate')], $aDuplicate, false);
            if(!empty($aDuplicate) && is_array($aDuplicate)) 
                $this->oDb->duplicateMixesOptions($aDuplicate['id'], $iId);

            $this->clearCache();
            return ['eval' => $sJsObject . '.onMixCreate(oData);'];
        }

        return [
            'popup' => BxTemplStudioFunctions::getInstance()->popupBox('adm-stg-create-mix-popup', _t('_adm_stg_txt_create_mix_popup'), $oTemplate->parseHtmlByName('options_create_mix.html', [
                'js_object' => $sJsObject,
                'form_id' => $sForm,
                'form' => $oForm->getCode(true),
            ]))
        ];
    }

    public function getPopupCodeImportMix()
    {
    	$oTemplate = BxDolStudioTemplate::getInstance();
    	$sJsObject = $this->getJsObject();

    	$sForm = 'adm-settings-import-mix-form';
    	$aForm = [
            'form_attrs' => [
                'id' => $sForm,
                'name' => $sForm,
                'action' => bx_append_url_params($this->sBaseUrl, [$this->sParamPrefix . '_action' => 'import-mix']),
                'method' => 'post',
                'enctype' => 'multipart/form-data'
            ],
            'params' => [
                'db' => [
                    'table' => 'sys_options_mixes',
                    'key' => 'id',
                    'uri' => 'name',
                    'uri_title' => 'title',
                    'submit_name' => 'save'
                ],
            ],
            'inputs' => [
            	'type' => [
                    'type' => 'hidden',
                    'name' => 'type',
                    'value' => $this->sType
                ],
                'category' => [
                    'type' => 'hidden',
                    'name' => 'category',
                    'value' => is_array($this->sCategory) ? json_encode($this->sCategory) : $this->sCategory,
                ],
            	'file' => [
                    'type' => 'file',
                    'name' => 'file',
                    'caption' => '',
                    'value' => '',
                ],
                'controls' => [
                    'type' => 'input_set', [
                        'type' => 'submit',
                        'name' => 'save',
                        'value' => _t('_adm_btn_settings_import'),
                    ], [
                        'type' => 'button',
                        'name' => 'cancel',
                        'value' => _t('_adm_txt_confirm_cancel'),
                        'attrs' => [
                            'class' => 'bx-def-margin-sec-left-auto',
                            'onclick' => '$(".bx-popup-applied:visible").dolPopupHide()'
                        ]
                    ]
                ]
            ]
        ];

        $oForm = new BxTemplStudioFormView($aForm);
        $oForm->initChecker();

        if($oForm->isSubmittedAndValid()) {
            $sError = _t('_adm_stg_err_cannot_perform');

            $aFile = $_FILES['file'];
            if(empty($aFile['tmp_name']))
                return ['code' => '1', 'message' => $sError];

            $sFile = $aFile['tmp_name'];
            $rHandle = @fopen($sFile, "r");
            if(!$rHandle)
                return ['code' => '2', 'message' => $sError];

            $sContents = fread($rHandle, filesize($sFile));
            fclose($rHandle);

            $aContent = json_decode($sContents, true);
            if(!is_array($aContent) || empty($aContent['mix']) || empty($aContent['options']))
                return ['code' => '3', 'message' => $sError];

            $aMix = [];
            $this->oDb->getMixes(['type' => 'by_name', 'value' => $aContent['mix']['name']], $aMix, false);
            if(!empty($aMix) && is_array($aMix))
                return ['code' => '4', 'message' => _t('_adm_stg_err_mix_already_exists')];

            $iId = $oForm->insert([
                'type' => $aContent['mix']['type'],
                'category' => $aContent['mix']['category'],
                'name' => $aContent['mix']['name'],
                'title' => $aContent['mix']['title']
            ]);
            if($iId === false)
                return ['code' => '5', 'message' => $sError];

            foreach($aContent['options'] as $sKey => $sValue)
                $this->oDb->insertMixesOptions([
                    'option' => $sKey,
                    'mix_id' => $iId,
                    'value' => $sValue
                ]);

            $this->oDb->updateMixes(['active' => 0], [
                'type' => $this->sType,
                'category' => is_string($this->sCategory) ? $this->sCategory : '',
                'active' => 1
            ]);
            $this->oDb->updateMixes(['active' => 1], ['id' => $iId]);

            $this->clearCache();
            return ['eval' => $sJsObject . '.onMixImport(oData);'];
        }

        return [
            'popup' => BxTemplStudioFunctions::getInstance()->popupBox('adm-stg-import-mix-popup', _t('_adm_stg_txt_import_mix_popup'), $oTemplate->parseHtmlByName('options_import_mix.html', [
                'js_object' => $sJsObject,
                'form_id' => $sForm,
                'form' => $oForm->getCode(true),
            ]))
        ];
    }

    protected function header($aCategory, $aFields)
    {
        return array_merge([
                'category_' . $aCategory['id'] . '_beg' => [
                    'type' => 'block_header',
                    'name' => 'category_' . $aCategory['id'] . '_beg',
                    'caption' => _t($aCategory['caption']),
                    'collapsable' => true,
                    'collapsed' => !$aCategory['selected']
                ]
            ],
            $aFields
        );
    }

    protected function field($aItem, $aItems2Mixes)
    {
    	$mixedValue = isset($aItems2Mixes[$aItem['name']]) ? $aItems2Mixes[$aItem['name']] : $aItem['value'];

    	$sMethod = 'getCustomValue' . bx_gen_method_name(trim(str_replace($this->sType, '', $aItem['name']), '_'));
    	if(method_exists($this, $sMethod))
    	    $mixedValue = $this->$sMethod($aItem, $mixedValue);

    	$aAttributes = array();
    	if($this->isReadOnly())
            $aAttributes = array_merge($aAttributes, [
                'disabled' => 'disabled'
            ]);

        $aField = [];
        switch($aItem['type']) {
            case 'value':
                $aField = [
                    'type' => 'text',
                    'name' => $aItem['name'],
                    'caption' => _t($aItem['caption']),
                    'info' => _t($aItem['info']),
                    'value' => $mixedValue,
                    'attrs' => array_merge($aAttributes, ['readonly' => 'readonly']),
                    'db' => ['pass' => 'Xss'],
                ];
                break;
            case 'digit':
            case 'secret':
                $aField = [
                    'type' => 'text',
                    'name' => $aItem['name'],
                    'caption' => _t($aItem['caption']),
                    'info' => _t($aItem['info']),
                    'value' => $mixedValue,
                    'attrs' => $aAttributes,
                    'db' => ['pass' => 'Xss'],
                ];
                if($aItem['type'] == 'secret')
                    $aField['secret'] = 1;
                break;
            case 'text':
            case 'secret_text':
                $aField = [
                    'type' => 'textarea',
                    'name' => $aItem['name'],
                    'caption' => _t($aItem['caption']),
                    'info' => _t($aItem['info']),
                    'value' => $mixedValue,
                    'attrs' => $aAttributes,
                    'db' => ['pass' => 'XssHtml'],
                ];
                if($aItem['type'] == 'secret_text')
                    $aField['secret'] = 1;
                break;
            case 'code':
                $aField = [
                    'type' => 'textarea',
                    'code' => true,
                    'name' => $aItem['name'],
                    'caption' => _t($aItem['caption']),
                    'info' => _t($aItem['info']),
                    'value' => $mixedValue,
                    'attrs' => $aAttributes,
                    'db' => ['pass' => 'XssHtml'],
                ];
                break;
            case 'checkbox':
                $aField = [
                    'type' => 'checkbox',
                    'name' => $aItem['name'],
                    'caption' => _t($aItem['caption']),
                    'info' => _t($aItem['info']),
                    'value' => 'on',
                    'checked' => $mixedValue == 'on',
                    'attrs' => $aAttributes,
                    'db' => ['pass' => 'Xss'],
                ];
                break;
            case 'list':
            case 'rlist':
                $aField = [
                    'type' => 'checkbox_set',
                    'name' => $aItem['name'],
                    'caption' => _t($aItem['caption']),
                    'info' => _t($aItem['info']),
                    'value' => !empty($mixedValue) ? explode(',', $mixedValue) : [],
                    'reverse' => $aItem['type'] == 'rlist',
                    'attrs' => $aAttributes,
                    'db' => ['pass' => 'Xss'],
                ];

                if (BxDolService::isSerializedService($aItem['extra']))
                    $aField['values'] = BxDolService::callSerialized($aItem['extra']);
                else
                    foreach(explode(',', $aItem['extra']) as $sValue)
                        $aField['values'][$sValue] = $sValue;
                break;
            case 'select':
                $aField = [
                    'type' => 'select',
                    'name' => $aItem['name'],
                    'caption' => _t($aItem['caption']),
                    'info' => _t($aItem['info']),
                    'value' => $mixedValue,
                    'values' => [],
                    'attrs' => $aAttributes,
                    'db' => ['pass' => 'Xss'],
                ];

                if (BxDolService::isSerializedService($aItem['extra']))
                    $aField['values'] = BxDolService::callSerialized($aItem['extra']);
                else
                    foreach(explode(',', $aItem['extra']) as $sValue)
                        $aField['values'][] = ['key' => $sValue, 'value' => $sValue];
                break;
            case 'file':
                $aField = [
                    'type' => 'file',
                    'name' => $aItem['name'],
                    'caption' => _t($aItem['caption']),
                    'info' => _t($aItem['info']),
                    'value' => $mixedValue,
                    'attrs' => $aAttributes,
                    'db' => ['pass' => 'Xss']
                ];
                break;
            case 'image':
                //--- Concatenation integer values as strings is required to get unique content id
                $iContentId = (int)($aItem['id'] . ($this->bMixes && isset($this->aMix['id']) ? $this->aMix['id'] : 0));

                $aField = [
                    'type' => 'files',
                    'name' => $aItem['name'],
                    'storage_object' => $this->sStorage,
                    'storage_private' => 0, 
                    'images_transcoder' => $this->sTranscoder,
                    'uploaders' => ['sys_settings_html5'],
                    'upload_buttons_titles' => ['HTML5' => _t('_sys_uploader_button_name_single')],
                    'multiple' => false,
                    'content_id' => $iContentId,
                    'ghost_template' => BxTemplStudioFunctions::getInstance()->getDefaultGhostTemplate($aItem['name']),
                    'caption' => _t($aItem['caption']),
                    'info' => _t($aItem['info']),
                    'value' => $mixedValue,
                    'attrs' => $aAttributes,
                    'db' => ['pass' => 'Xss']
                ];
                break;
            case 'rgb':
            case 'rgba':
                $aField = [
                    'type' => $aItem['type'],
                    'name' => $aItem['name'],
                    'caption' => _t($aItem['caption']),
                    'info' => _t($aItem['info']),
                    'value' => $mixedValue,
                    'attrs' => $aAttributes,
                    'db' => ['pass' => 'Xss'],
                ];
                break;
            case 'datetime':
                $aField = [
                    'type' => 'datetime',
                    'name' => $aItem['name'],
                    'caption' => _t($aItem['caption']),
                    'info' => _t($aItem['info']),
                    'value' => $mixedValue,
                    'attrs' => $aAttributes,
                    'db' => ['pass' => 'DateTimeUtc'],
                ];
                break;
        }

        return $aField;
    }
}

/** @} */
