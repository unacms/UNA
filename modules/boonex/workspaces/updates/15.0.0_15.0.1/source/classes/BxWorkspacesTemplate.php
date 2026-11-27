<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Workspaces Workspaces
 * @ingroup     UnaModules
 *
 * @{
 */

/*
 * Workspaces module representation.
 */
class BxWorkspacesTemplate extends BxBaseModProfileTemplate
{
    function __construct(&$oConfig, &$oDb)
    {
        $this->MODULE = 'bx_workspaces';
        parent::__construct($oConfig, $oDb);
    }

    function unitVars ($aData, $isCheckPrivateContent = true, $mixedTemplate = false, $aParams = [])
    {
        $a = ['bx_if:show_thumb_image', 'bx_if:show_thumb_letter', 'bx_if:show_thumbnail', 'bx_if:show_cover', 'thumb_url', 'cover_url', 'cover_settings', 'text', 'summary'];

        $aVars = parent::unitVars ($aData, $isCheckPrivateContent, $mixedTemplate, $aParams);

        $oProfileParent = BxDolProfile::getInstance($aData['author']);
        if ($oProfileParent && $oModuleParent = BxDolModule::getInstance($oProfileParent->getModule())) {
            $aDataParent = $oModuleParent->_oDb->getContentInfoById($oProfileParent->getContentId());
            $aVarsParent = $oModuleParent->_oTemplate->unitVars ($aDataParent, $isCheckPrivateContent, $mixedTemplate, $aParams);
            foreach ($a as $k)
                $aVars[$k] = $aVarsParent[$k];
        }

        return $aVars;
    }
}

/** @} */
