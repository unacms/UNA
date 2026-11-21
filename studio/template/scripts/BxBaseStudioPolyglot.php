<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

class BxBaseStudioPolyglot extends BxDolStudioPolyglot
{
    protected $sSubpageUrl;
    protected $aMenuItems;
    protected $aGridObjects;
    protected $aHtmlIds;

    public function __construct($sPage = '')
    {
        parent::__construct($sPage);

        $this->aPageCss = array_merge($this->aPageCss, ['forms.css', 'paginate.css', 'polyglot.css']);
        $this->aPageJs = array_merge($this->aPageJs, ['polyglot.js']);
        $this->sPageJsClass = 'BxDolStudioPolyglot';
        $this->sPageJsObject = 'oBxDolStudioPolyglot';
        
        $this->sSubpageUrl = BX_DOL_URL_STUDIO . 'polyglot.php?page=';

        $this->aMenuItems = [
            BX_DOL_STUDIO_PGT_TYPE_LANGUAGES => ['icon' => 'mi-pgt-languages.svg'],
            BX_DOL_STUDIO_PGT_TYPE_SETTINGS => ['icon' => 'mi-pgt-settings.svg'],
            BX_DOL_STUDIO_PGT_TYPE_KEYS => ['icon' => 'mi-pgt-keys.svg'],
            BX_DOL_STUDIO_PGT_TYPE_ETEMPLATES_TEXT => ['icon' => 'mi-pgt-etemplates-text.svg'],
            BX_DOL_STUDIO_PGT_TYPE_ETEMPLATES_HTML => ['icon' => 'mi-pgt-etemplates-html.svg']
        ];

        $this->aGridObjects = [
            'languages' => 'sys_studio_lang_languages',
            'keys' => 'sys_studio_lang_keys',
            'etemplates' => 'sys_studio_lang_etemplates',
        ];

        $this->aHtmlIds = [
            'etc_builder_id' => 'adm-pgt-etc-builder',
        ];
    }

    public function getPageJsCode($aOptions = array(), $bWrap = true)
    {
        $aOptions = array_merge($aOptions, array(
            'sActionUrl' => BX_DOL_URL_STUDIO . 'polyglot.php'
        ));

        return parent::getPageJsCode($aOptions, $bWrap);
    }

    public function getPageCaption()
    {
        return parent::getPageCaption() . $this->getPageJsCode();
    }

    public function getPageMenu($aMenu = [], $aMarkers = [])
    {
        if($this->aMenuItems === false)
            return '';

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

    /**
     * The installed languages, with a link to the App Store to get more.
     */
    protected function getPgtLanguages()
    {
        return [
            'caption' => '_adm_lmi_cpt_pgt_languages',
            'actions' => [
                ['name' => 'get-more', 'caption' => '_adm_pgt_btn_get_more', 'url' => BX_DOL_URL_STUDIO . 'store.php']
            ],
            'content' => $this->getGrid($this->aGridObjects['languages'])
        ];
    }

    protected function getPgtSettings()
    {
        $oOptions = new BxTemplStudioOptions(BX_DOL_STUDIO_STG_TYPE_DEFAULT, BX_DOL_STUDIO_STG_CATEGORY_LANGUAGES);

        $this->aPageCss = array_merge($this->aPageCss, $oOptions->getCss());
        $this->aPageJs = array_merge($this->aPageJs, $oOptions->getJs());
        return BxDolStudioTemplate::getInstance()->parseHtmlByName('polyglot.html', array(
            'content' => $oOptions->getCode(),
            'js_content' => ''
        ));
    }

    protected function getPgtKeys()
    {
        return $this->getGrid($this->aGridObjects['keys']);
    }

    protected function getEtemplatesText()
    {
        return $this->getGrid($this->aGridObjects['etemplates']);
    }

    protected function getEtemplatesHtml()
    {
        return $this->{'_getEtemplatesHtml' . ($this->isEtEditor() ? 'Editor' : 'Form')}();
    }

    protected function _getEtemplatesHtmlForm()
    {
        $oTemplate = BxDolStudioTemplate::getInstance();

        $sFormId = 'adm-dsg-et-hf-form';
        $sIFrameId = 'adm-dsg-et-hf-iframe';

        $aForm = [
            'form_attrs' => [
                'id' => $sFormId,
                'name' => $sFormId,
                'action' => BX_DOL_URL_STUDIO . 'polyglot.php',
                'method' => 'post',
                'enctype' => 'multipart/form-data',
                'target' => $sIFrameId
            ],
            'params' => [
                'db' => [
                    'table' => '',
                    'key' => '',
                    'uri' => '',
                    'uri_title' => '',
                    'submit_name' => 'save'
                ],
            ],
            'inputs' => [
                'page' => [
                    'type' => 'hidden',
                    'name' => 'page',
                    'value' => $this->sPage
                ],
                'editor' => [
                    'type' => 'switcher',
                    'name' => 'editor',
                    'caption' => _t('_adm_pgt_btn_et_hf_editor'),
                    'info' => '',
                    'value' => 'on',
                    'checked' => $this->isEtEditor(),
                    'attrs' => [
                        'onchange' => $this->getPageJsObject() . '.enableEditor(this)'
                    ]
                ],
                'et_hf_header' => [
                    'type' => 'textarea',
                    'code' => true,
                    'name' => 'et_hf_header',
                    'caption' => _t('_adm_stg_cpt_option_site_email_html_template_header'),
                    'info' => _t('_adm_pgt_txt_et_hf_inf'),
                    'value' => getParam('site_email_html_template_header'),
                    'db' => [
                        'pass' => 'Xss',
                    ],
                ],
                'et_hf_footer' => [
                    'type' => 'textarea',
                    'code' => true,
                    'name' => 'et_hf_footer',
                    'caption' => _t('_adm_stg_cpt_option_site_email_html_template_footer'),
                    'info' => _t('_adm_pgt_txt_et_hf_inf'),
                    'value' => getParam('site_email_html_template_footer'),
                    'db' => [
                        'pass' => 'Xss',
                    ],
                ],
                'save' => [
                    'type' => 'submit',
                    'name' => 'save',
                    'value' => _t('_adm_pgt_btn_et_hf_submit'),
                ]
            ]
        ];

        $oForm = new BxTemplStudioFormView($aForm, $oTemplate);
        $oForm->initChecker();

        if($oForm->isSubmittedAndValid()) {
            echo $this->submitEtemplatesHtmlOld($oForm);
            exit;
        }
/*
        $oTemplate->addJs(array('codemirror/codemirror.min.js'));
        $oTemplate->addCss(BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'codemirror/|codemirror.css');
*/
        return $oTemplate->parseHtmlByName('polyglot.html', array(
            'content' => $oTemplate->parseHtmlByName('pgt_etemplates_hf.html', array(
                'warning' => '',
                'iframe_id' => $sIFrameId, 
                'form' => $oForm->getCode()
            )),
            'js_content' => $this->getPageJsCode(array(
                'sCodeMirror' => 'textarea[name=et_hf_header],textarea[name=et_hf_footer]'
            ))
        ));
    }

    protected function _getEtemplatesHtmlEditor()
    {
        $oTemplate = BxDolStudioTemplate::getInstance();

        $sFormId = 'adm-dsg-et-creative-form';
        $sIFrameId = 'adm-dsg-et-creative-iframe';

        $sContent = '';
        $sContent .= getParam('site_email_html_template_header');
        $sContent .= $this->sEtcContent;
        $sContent .= getParam('site_email_html_template_footer');

        $aForm = [
            'form_attrs' => [
                'id' => $sFormId,
                'name' => $sFormId,
                'action' => BX_DOL_URL_STUDIO . 'polyglot.php',
                'method' => 'post',
                'enctype' => 'multipart/form-data',
                'target' => $sIFrameId
            ],
            'params' => [
                'db' => [
                    'table' => '',
                    'key' => '',
                    'uri' => '',
                    'uri_title' => '',
                    'submit_name' => 'save'
                ],
            ],
            'inputs' => [
                'page' => [
                    'type' => 'hidden',
                    'name' => 'page',
                    'value' => $this->sPage
                ],
                'editor' => [
                    'type' => 'switcher',
                    'name' => 'editor',
                    'caption' => _t('_adm_pgt_btn_et_hf_editor'),
                    'info' => '',
                    'value' => 'on',
                    'checked' => $this->isEtEditor(),
                    'attrs' => [
                        'onchange' => $this->getPageJsObject() . '.enableEditor(this)'
                    ]
                ],
                'content' => [
                    'type' => 'custom',
                    'name' => 'content',
                    'caption' => '',
                    'content' => $oTemplate->parseHtmlByName('pgt_etemplates_creative_fld.html', [
                        'html_id' => $this->aHtmlIds['etc_builder_id'],
                        'content_html' => $sContent,
                        'content_data' => json_encode([
                            'pages' => [
                                ['component' => $sContent]
                            ]
                        ])
                    ]),
                    'required' => '0',
                    'db' => [
                        'pass' => 'XssHtml',
                    ],
                ],
                'save' => [
                    'type' => 'submit',
                    'name' => 'save',
                    'value' => _t('_adm_pgt_btn_et_hf_submit'),
                ]
            ]
        ];

        $oForm = new BxTemplStudioFormView($aForm, $oTemplate);
        $oForm->initChecker();

        if($oForm->isSubmittedAndValid()) {
            echo $this->submitEtemplatesHtml($oForm);
            exit;
        }

        $oTemplate->addJs([
            'grapesjs/grapes.min.js',
            'grapesjs/grapesjs-preset-newsletter.min.js'
        ]);
        $oTemplate->addCss([
            BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'grapesjs/|grapes.min.css'
        ]);

        return $oTemplate->parseHtmlByName('polyglot.html', [
            'content' => $oTemplate->parseHtmlByName('pgt_etemplates_creative_frm.html', [
                'warning' => '',
                'iframe_id' => $sIFrameId, 
                'form' => $oForm->getCode()
            ]),
            'js_content' => $this->getPageJsCode()
        ]);
    }

    protected function getGrid($sObjectName)
    {
        $oGrid = BxDolGrid::getObjectInstance($sObjectName);
        if(!$oGrid)
            return '';

        return BxDolStudioTemplate::getInstance()->parseHtmlByName('polyglot.html', array(
            'content' => $oGrid->getCode(),
            'js_content' => ''
        ));
    }

    protected function isEtEditor()
    {
        return getParam($this->sEtSettingEditor) == 'on';
    }
}

/** @} */
