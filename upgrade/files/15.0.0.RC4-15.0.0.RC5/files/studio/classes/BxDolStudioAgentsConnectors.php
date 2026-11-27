<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

/**
 * Studio > Agents > Connectors: the operator's own personal access tokens (BxDolApiTokens), drawn as Studio's other
 * grids are. The same tokens as in account settings > Connectors.
 * @see BxDolApiTokensGrid
 */
class BxDolStudioAgentsConnectors extends BxTemplStudioGrid
{
    use BxDolApiTokensGrid;

    public function __construct ($aOptions, $oTemplate = false)
    {
        parent::__construct ($aOptions, $oTemplate);

        $this->_sApiTokensFormTemplate = 'agents_agents_form.html';
        $this->_initApiTokens();
    }

    protected function _getApiTokensFormView($aForm)
    {
        return new BxTemplStudioFormView($aForm);
    }

    protected function _getApiTokensPopup($sId, $sTitle, $sContent)
    {
        return BxTemplStudioFunctions::getInstance()->popupBox($sId, $sTitle, $sContent);
    }

    protected function _addJsCss()
    {
        parent::_addJsCss();

        // the add form's popup is sent with ajaxForm
        $this->_oTemplate->addJs(['jquery.form.min.js']);

        $oForm = new BxTemplStudioFormView([]);
        $oForm->addCssJs();
    }
}

/** @} */
