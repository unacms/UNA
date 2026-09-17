<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

class BxDolStudioApiKeys extends BxTemplStudioGrid
{
    public function __construct ($aOptions, $oTemplate = false)
    {
        parent::__construct ($aOptions, $oTemplate);
    }

    protected function _getCellKey($mixedValue, $sKey, $aField, $aRow)
    {
        return $this->_getCellSecret($mixedValue, $sKey, $aField, $aRow);
    }

    public function _performActionAdd($aForm, $aCustomValues = []) 
    {
        $oForm = new BxTemplFormView($aForm);
        $oForm->initChecker();

        if ($oForm->isSubmittedAndValid()) { // if form is submitted and all fields are valid

            $iRecentId = $oForm->insert ($aCustomValues, true); // insert new record

            if ($iRecentId)
                $aRes = array('grid' => $this->getCode(false), 'blink' => $iRecentId); // if record is successfully added, reload grid and highlight added row
            else
                $aRes = array('msg' => _t('_sys_txt_error_occured')); // if record adding failed, display error message

            echoJson($aRes);

        } else { // if form is not submitted or some fields are invalid, display popup with form

            $s = BxTemplStudioFunctions::getInstance()->popupBox($oForm->getId() . '_form', '', $oForm->getCode() . '
                <script>
                    $(document).ready(function () {
                        $("#' . $oForm->getId() . '").ajaxForm({
                            dataType: "json",
                            beforeSubmit: function (formData, jqForm, options) {
                                bx_loading($("#' . $oForm->getId() . '"), true);
                            },
                            success: function (data) {
                                $(".bx-popup-applied:visible").dolPopupHide();
                                glGrids.' . $this->_sObject . '.processJson(data, "add");
                            }
                        });
                    });
                </script>');

            echoJson(array('popup' => array('html' => $s, 'options' => array('closeOnOuterClick' => false))));

        }
    }

    public function performActionAdd()
    {
        $aForm = array(
            'form_attrs' => array(
                'id' => 'bx_studio_api_keys',
                'action' => BX_DOL_URL_ROOT . 'grid.php?o=sys_studio_api_keys&a=add',
                'method' => 'post',
            ),
            'params' => array (
                'db' => array(
                    'table' => 'sys_api_keys',
                    'key' => 'id',
                    'submit_name' => 'do_submit',
                ),
            ),
            'inputs' => array(

                'title' => array(
                    'type' => 'text',
                    'name' => 'title',
                    'caption' => _t('_Name'),
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                ),

                'submit' => array(
                    'type' => 'input_set',
                    0 => array (
                        'type' => 'submit',
                        'name' => 'do_submit',
                        'value' => _t('_sys_submit'),
                    ),
                    1 => array (
                        'type' => 'reset',
                        'name' => 'close',
                        'value' => _t('_sys_close'),
                        'attrs' => array('class' => 'bx-def-margin-sec-left', 'onclick' => '$(\'.bx-popup-applied:visible\').dolPopupHide();'),
                    ),
                ),

            ),
        );

        $aCustomValues = array(
            'key' => genRndPwd(48),
        );
        return $this->_performActionAdd($aForm, $aCustomValues);
/*
        $oForm = new BxTemplFormView($aForm);
        $oForm->initChecker();

        if ($oForm->isSubmittedAndValid()) { // if form is submitted and all fields are valid

            $aCustomValues = array(
                'key' => genRndPwd(48),
            );

            $iRecentId = $oForm->insert ($aCustomValues, true); // insert new record

            if ($iRecentId)
                $aRes = array('grid' => $this->getCode(false), 'blink' => $iRecentId); // if record is successfully added, reload grid and highlight added row
            else
                $aRes = array('msg' => _t('_sys_txt_error_occured')); // if record adding failed, display error message

            echoJson($aRes);

        } else { // if form is not submitted or some fields are invalid, display popup with form

            $s = BxTemplFunctions::getInstance()->popupBox($oForm->getId() . '_form', '', $oForm->getCode() . '
                <script>
                    $(document).ready(function () {
                        $("#' . $oForm->getId() . '").ajaxForm({
                            dataType: "json",
                            beforeSubmit: function (formData, jqForm, options) {
                                bx_loading($("#' . $oForm->getId() . '"), true);
                            },
                            success: function (data) {
                                $(".bx-popup-applied:visible").dolPopupHide();
                                glGrids.' . $this->_sObject . '.processJson(data, "add");
                            }
                        });
                    });
                </script>');

            echoJson(array('popup' => array('html' => $s, 'options' => array('closeOnOuterClick' => false))));

        }
*/
    }
}

/** @} */
