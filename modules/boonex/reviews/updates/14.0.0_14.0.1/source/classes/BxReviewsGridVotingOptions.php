<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Reviews Reviews
 * @ingroup     UnaModules
 * 
 * @{
 */

class BxReviewsGridVotingOptions extends BxTemplGrid
{
    protected $MODULE;

    public function __construct ($aOptions, $oTemplate = false)
    {
    	$this->MODULE = 'bx_reviews';
        parent::__construct ($aOptions, $oTemplate);
    }

    private function getVotingOptionForm($iVotingOptionId, $sLKey, $sActionurl) {
        $aForm = [
            'form_attrs' => [
                'id' => 'bx-reviews-voting-option-form',
                'action' => bx_append_url_params($sActionurl, 'ids[]='.$iVotingOptionId),
                'method' => 'post'
            ],
            'params' => [
                'db' => [
                    'table' => 'bx_reviews_voting_options',
                    'key' => 'id',
                    'uri' => '',
                    'uri_title' => '',
                    'submit_name' => 'do_submit'
                ],
            ],
            'inputs' => [
                'id' => [
                    'type' => 'hidden',
                    'name' => 'id',
                    'value' => $iVotingOptionId,
                    'db' => [
                        'pass' => 'Int',
                    ],
                ],
                'lkey' => [
                    'type' => 'text_translatable',
                    'name' => 'lkey',
                    'caption' => _t('_bx_reviews_form_entry_input_option_name'),
                    'value' => $sLKey,
                    'required' => '1',
                    'db' => [
                        'pass' => 'Xss',
                    ],
                    'checker' => [
                        'func' => 'LengthTranslatable',
                        'params' => [3, 100, 'lkey'],
                        'error' => _t('_bx_reviews_form_entry_input_option_name_err'),
                    ],
                ],
                'controls' => [
                    'name' => 'controls',
                    'type' => 'input_set',
                    [
                        'type' => 'submit',
                        'name' => 'do_submit',
                        'value' => _t('_bx_reviews_form_entry_input_do_submit')
                    ],
                    [
                        'type' => 'reset',
                        'name' => 'close',
                        'value' => _t('_bx_reviews_txt_cancel'),
                        'attrs' => [
                            'onclick' => '$(this).closest(\'.bx-popup-responsive\').dolPopupHide();',
                            'class' => 'bx-def-margin-sec-left',
                        ],
                    ]
                ]
            ]
        ];

        $oForm = new BxTemplStudioFormView($aForm);
        $oForm->initChecker();
        return $oForm;
    }

    public function performActionAdd() {
        $this->performActionAddEdit('add', 0, '');
    }

    public function performActionEdit() {
        $aIds = bx_get('ids');
        if (!$aIds || !is_array($aIds)) {
            echoJson(array());
            exit;
        }

        $iOptionId = $aIds[0];
        $oModule = BxDolModule::getInstance($this->MODULE);
        $sLkey = $oModule->_oDb->getVotingOptionLKey($iOptionId);

        $this->performActionAddEdit('edit', $iOptionId, $sLkey);
    }

    public function performActionDelete() {
        $aIds = bx_get('ids');
        if (!$aIds || !is_array($aIds)) {
            echoJson(array());
            exit;
        }

        $iOptionId = $aIds[0];
        $oModule = BxDolModule::getInstance($this->MODULE);
        $sLkey = $oModule->_oDb->getVotingOptionLKey($iOptionId);

        $oLanguage = BxDolStudioLanguagesUtils::getInstance();
        $oLanguage->deleteLanguageString($sLkey);

        return parent::performActionDelete();
    }

    private function performActionAddEdit($sAction, $iVotingOptionId, $sLKey) {
        $oForm = $this->getVotingOptionForm($iVotingOptionId, $sLKey, BX_DOL_URL_ROOT.'grid.php?o=' . $this->_sObject . '&a=' . $sAction);
        if ($oForm->isSubmittedAndValid()) {
            if ($sAction == 'add') {
                $iSuccessId = $oForm->insert();
            }
            if ($sAction == 'edit') {
                $oForm->update($iVotingOptionId);
                $iSuccessId = $iVotingOptionId;
            }

            if ($iSuccessId) {
                $aRes = array('grid' => $this->getCode(false), 'blink' => $iSuccessId);
            } else
                $aRes = array('msg' => "Error occured"); // if record adding failed, display error message

            echoJson($aRes);
        } else {
            $s = PopupBox('bx-reviews-popup', _t('_bx_reviews_popup_voting_option_title'), $oForm->getCode().'                
                <script>
                    function bx_grid_ajax_form() {
                        $("#'.$oForm->aFormAttrs['id'].'").ajaxForm({
                            dataType: "json",
                            beforeSubmit: function (formData, jqForm, options) {
                                bx_loading($("#' . $oForm->aFormAttrs['id'] . '"), true);
                            },
                            success: function (data) {
                                $(".bx-popup-active:visible").dolPopupHide();
                                glGrids.' . $this->_sObject . '.processJson(data, "add");
                            }
                        });
                    }
                </script>');

            echoJson([
                'popup' => [
                    'html' => $s,
                    'options' => [
                        'onShow' => 'bx_grid_ajax_form();'
                    ]
                ]
            ]);
        }
    }
}

/** @} */
