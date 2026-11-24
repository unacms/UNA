<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Help Tours Help Tours
 * @ingroup     UnaModules
 *
 * @{
 */

bx_import('BxDolStudioUtils');

class BxHelpToursGridTours extends BxTemplGrid
{
    protected $_sModule;
    protected $_oModule;

    public function __construct ($aOptions, $oTemplate = false)
    {
        $this->_sModule = 'bx_help_tours';
    	$this->_oModule = BxDolModule::getInstance($this->_sModule);
    	if(!$oTemplate)
            $oTemplate = $this->_oModule->_oTemplate;

        parent::__construct ($aOptions, $oTemplate);
    }
    protected function _getCellPage($mixedValue, $sKey, $aField, $aRow)
    {
        $aPageTitle = $this->_oModule->_oDb->getPageTitleDetails($mixedValue);
        if ($aPageTitle)
            $mixedValue = $aPageTitle['module_title'].': '._t($aPageTitle['title_system']);

        return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getCellItems($mixedValue, $sKey, $aField, $aRow)
    {
        $sLink = 'javascript: glGrids.'.$this->_sObject.'.action(\'edit_items\', {id: '.$aRow['id'].'});';
        $mixedValue = $this->_oTemplate->parseLink($sLink, _t('_bx_help_tours_cpt_items_cnt', $this->_oModule->_oDb->getHelpTourItemsCount($aRow['id'])));
        return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }

    public function _getActionPreview($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array()) {
        $sUrl = $this->_oModule->_oDb->getTourPageUrl($aRow['id']);
        if (!$sUrl) return '';
        $sUrl = trim($sUrl, '/');

        $a['attr']['href'] = bx_absolute_url(bx_append_url_params(BxDolPermalinks::getInstance()->permalink($sUrl), ['help_tour_preview' => $aRow['id']]));
        $a['attr']['target'] = '_blank';

        // A link: the classic grid's button tag becomes an <a>. The grid's data (the API, AG Grid) keeps the action as it
        // is, with its href.
        $mixedButton = $this->_getActionDefault($sType, $sKey, $a, $isSmall, $isDisabled, $aRow);
        return is_array($mixedButton) ? $mixedButton : str_replace('button', 'a', $mixedButton);
    }

    private function getAddEditForm($iEntry) {
        $aEntry = false;

        if ($iEntry) {
            $aEntry = $this->_oModule->_oDb->getTourDetails($iEntry);
            if (!$aEntry) {
                echoJson([]);
                exit;
            }
        }

        $iTourVisibility = !$iEntry ? BX_DOL_INT_MAX : $this->_oModule->_oDb->getTourVisibility($iEntry);
        if (bx_get('visible_for'))
            $iTourVisibility = BxDolStudioUtils::getVisibilityValue(bx_get('visible_for'), bx_get('visible_for_levels'));
        $oForm = $this->getAddEditFormObject($iEntry, $iTourVisibility);

        $oForm->aFormAttrs['action'] = BX_DOL_URL_ROOT.'grid.php?o=' . $this->_sObject . '&a='.($aEntry ? 'edit' : 'add');

        $oForm->initChecker($aEntry);

        if ($oForm->isSubmittedAndValid()) {
            if ($aEntry) {
                $oForm->update($aEntry['id']);
                $iResult = $aEntry['id'];
            } else {
                $iResult = $oForm->insert();
            }

            if ($iResult) {
                $this->_oModule->_oDb->putHelpTourOnPage($iResult, $aEntry ? $aEntry['page'] : '', $iTourVisibility);
                $aRes = ['grid' => $this->getCode(false), 'blink' => $iResult];
            } else {
                $aRes = ['msg' => "Error occured"]; // if record adding failed, display error message
            }
            echoJson($aRes);
        } else {
            $s = '
                <div>' . $oForm->getCode(true) . '</div>                
                <script>                    
                    $(document).ready(function () {
                        $("#'.$oForm->aFormAttrs['id'].'").ajaxForm({
                            dataType: "json",
                            beforeSubmit: function (formData, jqForm, options) {
                                bx_loading($("#' . $oForm->aFormAttrs['id'] . '"), true);
                            },
                            success: function (data) {
                                $(".bx-popup-active:visible").dolPopupHide();
                                glGrids.' . $this->_sObject . '.processJson(data, "'.($aEntry ? 'edit' : 'add').'");
                            }
                        });
                    });
                </script>';

            echoJson(['popup' => [
                'html' => BxTemplStudioFunctions::getInstance()->popupBox('bx-tour-details-popup', _t('_bx_help_tours_cpt_tour_details'), $s),
                'options' => [
                    'onBeforeShow' => empty($aEntry) ? "$('#grid-popup-bx_help_tours_tours-edit').remove();" : "$('#grid-popup-bx_help_tours_tours-add').remove();",
                    'closeOnOuterClick' => false,
                ]]]
            );
        }
    }

    public function performActionAdd()
    {
        return $this->getAddEditForm(0);
    }

    public function performActionEdit()
    {
        $iEntry = !is_null($_REQUEST) && isset($_REQUEST['id']) ? intval($_REQUEST['id']) : intval($_REQUEST['ids'][0]);
        if(!$iEntry) {
            echoJson([]);
            exit;
        }

        return $this->getAddEditForm($iEntry);
    }

    public function performActionEditItems()
    {
        $iTourId = !is_null($_REQUEST) && isset($_REQUEST['id']) ? intval($_REQUEST['id']) : intval($_REQUEST['ids'][0]);

        if (!$iTourId) {
            echoJson(array());
            exit;
        }

        echoJson(array(
            'redirect' => BX_DOL_URL_STUDIO.'module.php?name=' . $this->_sModule . '&tour=' . $iTourId . '&page=items',
        ));
    }

    public function performActionDelete() {
        $aIds = bx_get('ids');
        if (!$aIds || !is_array($aIds)) {
            echoJson(array());
            exit;
        }

        $oLanguage = BxDolStudioLanguagesUtils::getInstance();

        foreach ($aIds as $iEntry) {
            $this->_oModule->_oDb->deleteHelpTourBlock($iEntry);
            $this->_oModule->_oDb->deleteHelpTourTrackingData($iEntry);

            $aItems = $this->_oModule->_oDb->getHelpTourItems($iEntry);
            if ($aItems) foreach ($aItems as $aItem) {
                $oLanguage->deleteLanguageString($aItem['title']);
                $oLanguage->deleteLanguageString($aItem['text']);
            }

            $this->_oModule->_oDb->deleteHelpTourItems($iEntry);
            $this->_delete($iEntry);
        }

        echoJson(array(
            'grid' => $this->getCode(false),
        ));
    }

    private function getAddEditFormObject($iEntry, $iVisibility = BX_DOL_INT_MAX) {
        $aForm = [
            'form_attrs' => [
                'method' => 'post',
                'action' => '',
                'id' => 'bx-help-tour-details-form',
            ],
            'params' => [
                'db' => [
                    'submit_name' => 'submit',
                    'table' => 'bx_help_tours',
                    'key' => 'id',
                    'uri' => '',
                    'uri_title' => '',
                ],
            ],
            'inputs' => [
                'id' => [
                    'type' => 'hidden',
                    'name' => 'id',
                    'value' => $iEntry,
                ],
                'page' => [
                    'type' => 'select',
                    'name' => 'page',
                    'required' => true,
                    'caption' => _t('_bx_help_tours_form_field_page'),
                    'values' => ['' => _t('_sys_please_select')] + $this->_oModule->_oDb->getSitePages(),
                    'checker' => [
                        'func' => 'Avail',
                        'error' => _t('_bx_help_tours_form_field_page_error'),
                    ],
                    'db' => [
                        'pass' => 'Xss',
                    ],
                ],
                'overlay' => [
                    'type' => 'switcher',
                    'name' => 'overlay',
                    'caption' => _t('_bx_help_tours_form_field_overlay'),
                    'info' => _t('_bx_help_tours_form_field_overlay_info'),
                    'value' => 1,
                    'db' => [
                        'pass' => 'Int',
                    ],
                ],
                'visible_for' => [
                    'type' => 'select',
                    'name' => 'visible_for',
                    'caption' => _t('_bx_help_tours_form_field_visible_for'),
                    'value' => $iVisibility == BX_DOL_INT_MAX ? BX_DOL_STUDIO_VISIBLE_ALL : BX_DOL_STUDIO_VISIBLE_SELECTED,
                    'values' => [
                        ['key' => BX_DOL_STUDIO_VISIBLE_ALL, 'value' => _t('_bx_help_tours_form_field_visible_for_all')],
                        ['key' => BX_DOL_STUDIO_VISIBLE_SELECTED, 'value' => _t('_bx_help_tours_form_field_visible_for_selected')],
                    ],
                    'attrs' => [
                        'onchange' => "$('#bx-form-element-visible_for_levels').bx_anim(this.value == 'all' ? 'hide' : 'show')",
                    ],
                ],
                'visible_for_levels' => [
                    'type' => 'checkbox_set',
                    'name' => 'visible_for_levels',
                    'caption' => _t('_bx_help_tours_form_field_visible_for_levels'),
                    'value' => '',
                    'values' => [],
                    'tr_attrs' => [
                        'style' => $iVisibility == BX_DOL_INT_MAX ? 'display:none' : ''
                    ],
                ],
                'actions' => [
                    'type' => 'input_set',
                    0 => [
                        'type' => 'submit',
                        'name' => 'submit',
                        'value' => _t('_Submit'),
                    ],
                    1 => [
                        'type' => 'button',
                        'name' => 'cancel',
                        'value' => _t('_Cancel'),
                        'attrs' => [
                            'style' => 'margin-left: 20px;',
                            'onclick' => '$(".bx-popup-active:visible").dolPopupHide();',
                        ],
                    ],
                ],
            ],
        ];
        BxDolStudioUtils::getVisibilityValues($iVisibility, $aForm['inputs']['visible_for_levels']['values'], $aForm['inputs']['visible_for_levels']['value']);

        return new BxTemplFormView($aForm);
    }
}

/** @} */
