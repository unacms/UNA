<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaTemplate UNA Template Classes
 * @{
 */

class BxTemplFormView extends BxBaseFormView
{
    public function __construct($aInfo, $oTemplate = false)
    {
        parent::__construct($aInfo, $oTemplate);
    }

    public function genInputSwitcher(&$aInput)
    {
        $aCheckbox = array_merge($aInput, ['type' => 'checkbox']);
        $bChecked = isset($aInput['checked']) && $aInput['checked'];
        return $this->oTemplate->parseHtmlByName('form_field_switcher.html', [
            'class' => $bChecked ? 'on' : 'off',
            'checked' => $bChecked ? 'true' : 'false', // the button's initial aria-checked; jquery.webForms.js keeps it in step
            'checkbox' => $this->genInputStandard($aCheckbox),
            'bx_if:show_label' => $this->genInputSwitcherLabel($aInput)
        ]);
    }
}

/** @} */
