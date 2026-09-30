<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    OAuth2 OAuth2 server
 * @ingroup     UnaModules
 *
 * @{
 */

class BxOAuthGrid extends BxTemplGrid
{
    public function __construct ($aOptions, $oTemplate = false)
    {
        parent::__construct ($aOptions, $oTemplate);
    }

    /**
     * add js file for AJAX form submission
     */
    protected function _addJsCss()
    {
        parent::_addJsCss();
        $this->_oTemplate->addJs('jquery.form.min.js');

        $oForm = new BxTemplFormView(array());
        $oForm->addCssJs();
    }

	protected function _isVisibleGrid ($a)
    {
        return isAdmin();
    }

    protected function _getCellClientSecret($mixedValue, $sKey, $aField, $aRow)
    {
        return $this->_getCellSecret($mixedValue, $sKey, $aField, $aRow);
    }

    /**
     * 'add' action handler
     */
    public function performActionAdd()
    {
        $sAction = 'add';
        $oModule = BxDolModule::getInstance('bx_oauth');

        bx_import('FormAdd', $oModule->_aModule);
        $oForm = new BxOAuthFormAdd();
        $oForm->initChecker();

        if ($oForm->isSubmittedAndValid()) {
            $iNewId = $oForm->insert (array(), true);
            if ($iNewId)
                $aRes = array('grid' => $this->getCode(false), 'blink' => $iNewId);
            else
                $aRes = array('msg' => _t('_error occured'));

           return echoJson($aRes);

        }

        $s = BxTemplFunctions::getInstance()->transBox('', '
            <div class="bx-def-padding bx-def-color-bg-block">' . $oForm->getCode() . '</div>
            <script>
                $(document).ready(function () {
                    $("#bx-oauth-' . $sAction . '").ajaxForm({
                        dataType: "json",
                        beforeSubmit: function (formData, jqForm, options) {
                            bx_loading($("#' . $oForm->aFormAttrs['id'] . '"), true);
                        },
                        success: function (data) {
                            $(".bx-popup-active").dolPopupHide();
                            glGrids.' . $this->_sObject . '.processJson(data, "' . $sAction . '");
                        }
                    });
                });
            </script>');

        echoJson(array('popup' => array('html' => $s, 'options' => array('closeOnOuterClick' => false))));
    }

	/**
     * 'edit' action handler
     */
    public function performActionEdit()
    {
        $sAction = 'edit';
        $oModule = BxDolModule::getInstance('bx_oauth');

        $aIds = bx_get('ids');
        if(!$aIds || !is_array($aIds)) {
            $iId = (int)bx_get('id');
            if(!$iId) {
                echoJson(array());
                exit;
            }

            $aIds = array($iId);
        }

        $iId = $aIds[0];
        $aClient = $oModule->_oDb->getClientsBy(array('type' => 'id', 'id' => $iId));

        bx_import('FormEdit', $oModule->_aModule);
        $oForm = new BxOAuthFormEdit();

        $oForm->initChecker($aClient);
        if ($oForm->isSubmittedAndValid()) {
            if ($oForm->update($iId))
                $aRes = array('grid' => $this->getCode(false), 'blink' => $iId);
            else
                $aRes = array('msg' => _t('_error occured'));

            return echoJson($aRes);
        } 

        $s = BxTemplFunctions::getInstance()->transBox('', '
            <div class="bx-def-padding bx-def-color-bg-block">' . $oForm->getCode() . '</div>
            <script>
                $(document).ready(function () {
                    $("#bx-oauth-' . $sAction . '").ajaxForm({
                        dataType: "json",
                        beforeSubmit: function (formData, jqForm, options) {
                            bx_loading($("#' . $oForm->aFormAttrs['id'] . '"), true);
                        },
                        success: function (data) {
                            $(".bx-popup-active").dolPopupHide();
                            glGrids.' . $this->_sObject . '.processJson(data, "' . $sAction . '");
                        }
                    });
                });
            </script>');

        echoJson(array('popup' => array('html' => $s, 'options' => array('closeOnOuterClick' => false))));
    }
}

/** @} */
