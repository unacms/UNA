<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

class BxDolStudioApiOrigins extends BxDolStudioApiKeys
{
    public function __construct ($aOptions, $oTemplate = false)
    {
        parent::__construct ($aOptions, $oTemplate);
    }

    protected function _getAddPopupTitle()
    {
        return _t('_adm_api_popup_title_add_origin');
    }

    public function performActionAdd()
    {
        $aForm = array(
            'form_attrs' => array(
                'id' => 'bx_studio_api_origins',
                'action' => BX_DOL_URL_ROOT . 'grid.php?o=sys_studio_api_origins&a=add',
                'method' => 'post',
            ),
            'params' => array (
                'db' => array(
                    'table' => 'sys_api_origins',
                    'key' => 'id',
                    'submit_name' => 'do_submit',
                ),
            ),
            'inputs' => array(

                'url' => array(
                    'type' => 'text',
                    'name' => 'url',
                    'caption' => _t('_sys_txt_url'),
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                ),

                // the popup's own close button closes it: one button here
                'submit' => array(
                    'type' => 'submit',
                    'name' => 'do_submit',
                    'value' => _t('_adm_form_btn_field_add'),
                ),

            ),
        );

        return $this->_performActionAdd($aForm);
    }
}

/** @} */
