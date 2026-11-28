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

class BxReviewsInstaller extends BxBaseModTextInstaller
{
    function __construct($aConfig)
    {
        parent::__construct($aConfig);
    }

    protected function actionPresetContextChooserOptions($sOperation)
    {
        $aOptions = bx_srv('bx_reviews', 'get_context_modules_options', []);
        setParam('bx_reviews_custom_context_chooser_options', implode(',', array_keys($aOptions)));
        return BX_DOL_STUDIO_INSTALLER_SUCCESS;
    }
}

/** @} */
