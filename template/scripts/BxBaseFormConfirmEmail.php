<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

bx_import('BxTemplFormView');

class BxFormConfirmEmailCheckerHelper extends BxDolFormCheckerHelper
{
    /**
     * Check if key exists
     */
    function checkCodeExist ($s)
    {
        $oKey = BxDolKey::getInstanceWithScope(BX_KEY_SCOPE_ACCOUNT_EMAIL_CONFIRM);
        return $oKey && $oKey->isKeyExists(trim($s));
    }

}

/**
 * Email Confirmation Form.
 */
class BxBaseFormConfirmEmail extends BxTemplFormView
{
    public function __construct($aInfo, $oTemplate)
    {
        parent::__construct($aInfo, $oTemplate);

        $this->aParams['checker_errors']['summary']['disabled'] = true;
    }

}

/** @} */
