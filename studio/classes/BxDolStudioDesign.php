<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

define('BX_DOL_STUDIO_TEMPL_DEFAULT', 'bx_protean');
define('BX_DOL_STUDIO_TEMPL_TYPE_SETTINGS', 'settings');
define('BX_DOL_STUDIO_TEMPL_TYPE_LOGO', 'logo');
define('BX_DOL_STUDIO_TEMPL_TYPE_DEFAULT', BX_DOL_STUDIO_TEMPL_TYPE_SETTINGS);


class BxDolStudioDesign extends BxTemplStudioModule
{
    public function __construct($sModule, $mixedPageName, $sPage = "")
    {
        parent::__construct($sModule, $mixedPageName, $sPage);

        $this->sLangPrefix = 'dsn';
        $this->sParamPrefix = 'dsn';

        $this->sManageUrl = '';
        if($this->bPage)
            $this->sManageUrl = BX_DOL_URL_STUDIO . 'design.php?name=' . $this->aPage['name'];
    }

    public function checkAction()
    {
    	$sAction = bx_get($this->sParamPrefix . '_action');
    	if($sAction === false)
            return false;

        $sAction = bx_process_input($sAction);

        $aResult = ['code' => 1, 'message' => _t('_adm_dsg_err_cannot_process_action')];
        switch($sAction) {
            case 'delete_logo':
                $aResult = $this->getObjectDesigner()->checkAction();
                break;

            default:
                $aResult = parent::checkAction();
        }

        return $aResult;
    }

    public function activate($sModule, $iWidgetId = 0)
    {
        $aModule = BxDolModuleQuery::getInstance()->getModuleByName($sModule);
        if(empty($aModule) || !is_array($aModule))
            return array('code' => 1, 'message' => _t('_adm_err_operation_failed'));

        $aTemplates = array();
        $iTemplates = $this->oHelper->getTemplatesBy(array('type' => 'active'), $aTemplates);
        if($iTemplates == 1 && $aTemplates[0]['name'] == $sModule)
            return array('code' => 1, 'message' => _t('_adm_dsg_err_last_active'));

        $sTemplateDefault = getParam('template');
        if($aModule['uri'] == $sTemplateDefault)
            return array('code' => 2, 'message' => _t('_adm_dsg_err_deactivate_default'));

        return parent::activate($sModule, $iWidgetId);
    }

    protected function getObjectDesigner()
    {
    	$oPage = new BxTemplStudioDesigner($this->sPage);
    	$oPage->setManageUrl($this->sManageUrl);
        $oPage->setParamPrefix($this->sParamPrefix);

    	$oModule = BxDolModule::getInstance($this->sModule);
    	$oPage->setLogoParams($oModule->_oConfig->getLogoParams());
        $oPage->setLogoTemplate($this->sModule);

    	return $oPage;
    }
}

/** @} */
