<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

bx_import('BxDolPermalinks');

/**
 * Email templates are used to send preformated messages.
 *
 * Email templates are multilingual.
 *
 * User is sent email in language which is defined in their account, if account language is not set - then default site language is used.
 *
 * Email templates use template system, so it is possible to customize header/footer via Studio -> Polyglot -> Emails header/footer
 *
 * 1-click unsubscribe link is added automatically to every email (except a few system emails, which is not supposed to unsubscribe from, like forgot password email).
 * Please note: make sure that {unsubscribe} marker is not removed, or unsubscribe link will not be added.
 *
 *
 * @section example Example of usage
 *
 * Send an email using email templates:
 *
 * @code
 *
 *     // define custom template variables
 *     $aPlus = array();
 *     $aPlus['email'] = 'ktoto@example.com';
 *     $aPlus['conf_code'] = '123456';
 *     $aPlus['conf_link'] = BX_DOL_URL_ROOT . 'page.php?i=confirm-email&code=123456';
 *     $aPlus['conf_form_link'] = BX_DOL_URL_ROOT . 'page.php?i=confirm-email';
 *
 *     $aTemplate = BxDolEmailTemplates::getInstance()->parseTemplate('t_Confirmation', $aPlus); // get class instance and parse template
 *
 *     if ($aTemplate && sendMail('ktoto@example.com', $aTemplate['Subject'], $aTemplate['Body'])) // send email if template exists
 *         echo 'email was successfully sent';
 *     else
 *         echo 'email send failed';
 *
 * @endcode
 *
 */
class BxDolEmailTemplates extends BxDolFactory implements iBxDolSingleton
{
    protected $_oEmailTemplatesQuery;

    protected $iDefaultLangId;
    protected $iFallbackLangId;
    protected $aDefaultKeys;

    protected function __construct()
    {
        if (isset($GLOBALS['bxDolClasses'][get_class($this)]))
            trigger_error ('Multiple instances are not allowed for the class: ' . get_class($this), E_USER_ERROR);

        parent::__construct();

        $oLang = BxDolLanguages::getInstance();
        $this->iDefaultLangId = $oLang->getCurrentLangId();
        $this->iFallbackLangId = $oLang->getLangId('en');

        $sAboutUs = _t('_sys_et_txt_about_us');
        $this->aDefaultKeys = array(
        	'site_url' => BX_DOL_URL_ROOT,
        	'site_name' => getParam('site_title'),
            'about_us' => '<a href="' . BX_DOL_URL_ROOT . BxDolPermalinks::getInstance()->permalink('page.php?i=about') . '" title="' . bx_html_attribute($sAboutUs) . '">' . $sAboutUs . '</a>',
        );

        $this->_oEmailTemplatesQuery = BxDolEmailTemplatesQuery::getInstance();
    }

    /**
     * Prevent cloning the instance
     */
    public function __clone()
    {
        if (isset($GLOBALS['bxDolClasses'][get_class($this)]))
            trigger_error('Clone is not allowed for the class: ' . get_class($this), E_USER_ERROR);
    }

    /**
     * Get singleton instance of the class
     */
    static function getInstance()
    {
        if(!isset($GLOBALS['bxDolClasses'][__CLASS__]))
            $GLOBALS['bxDolClasses'][__CLASS__] = new BxDolEmailTemplates();

        return $GLOBALS['bxDolClasses'][__CLASS__];
    }

    /**
     * Function will return array of needed template ;
     *
     * @param  string  $sTemplateName - name of necessary template.
     * @param  integer $iAccountId    - account ID of registered member.
     * @return array   with template 'Subject' and 'Body'.
     */
    function getTemplate($sTemplateName, $iAccountId = 0 )
    {
        $iUseLang = $this->iDefaultLangId;
        if ($iAccountId) {
            $oAccount = BxDolAccount::getInstance($iAccountId);
            if ($oAccount) {
                $iUseLang = $oAccount->getLanguageId();
                if(empty($iUseLang))
                    $iUseLang = $this->iDefaultLangId;
            }
        }

        return $this->_oEmailTemplatesQuery->getTemplate ($sTemplateName, $iUseLang, $this->iDefaultLangId, $this->iFallbackLangId);
    }

    /**
     * Function will return array of needed template with neccessary markers replaced ;
     *
     * @param  string  $sTemplateName - name of necessary template.
     * @param  string  $aTemplatekeys - key ane value pairs to replace in subject and body.
     * @param  integer $iAccountId    - account ID of registered member.
     * @param  integer $iProfileId    - profile ID of registered member.
     * @return array   with template 'Subject' and 'Body'.
     */
    function parseTemplate($sTemplateName, $aTemplateKeys, $iAccountId = 0, $iProfileId = 0)
    {
        $aTemplate = $this->getTemplate($sTemplateName, $iAccountId);
        
        /**
         * @hooks
         * @hookdef hook-system-parse_email_template 'system', 'parse_email_template' - hook on template with neccessary markers replaced
         * - $unit_name - equals `system`
         * - $action - equals `parse_email_template` 
         * - $object_id - not used
         * - $sender_id - not used 
         * - $extra_params - array of additional params with the following array keys:
         *      - `template_name` - [string] by ref, name of necessary template, can be overridden in hook processing
         *      - `template_keys` - [array] by ref, key ane value pairs to replace in subject and body, can be overridden in hook processing
         *      - `account_id` - [int] by ref, account ID of registered member, can be overridden in hook processing
         *      - `profile_id` - [int] by ref, profile ID of registered member, can be overridden in hook processing
         *      - `template` - [array] by ref, template, can be overridden in hook processing
         * @hook @ref hook-system-parse_email_template
         */
        bx_alert('system', 'parse_email_template', 0, 0, array(
            'template_name' => &$sTemplateName, 
            'template_keys' => &$aTemplateKeys, 
            'account_id' => &$iAccountId, 
            'profile_id' => &$iProfileId, 
            'template' => &$aTemplate,

            'template_name_ref' => &$sTemplateName, 
            'template_keys_ref' => &$aTemplateKeys, 
            'account_id_ref' => &$iAccountId, 
            'profile_id_ref' => &$iProfileId, 
            'template_ref' => &$aTemplate
        ));
        
        if (!$aTemplate)
            return false;
        return array(
           'Subject' => $this->parseContent($aTemplate['Subject'], $aTemplateKeys, $iAccountId, $iProfileId),
           'Body' => $this->parseContent($aTemplate['Body'], $aTemplateKeys, $iAccountId, $iProfileId)
        );
    }

    function parseContent($sContent, $aKeys, $iAccountId = 0, $iProfileId = 0)
    {
        $aResultKeys = $this->aDefaultKeys;

        $oProfile = null;
        if ($iProfileId) {
            $oProfile = BxDolProfile::getInstance($iProfileId);
            if ($oProfile && ($aProfileInfo = $oProfile->getInfo())) {
                $aResultKeys = array_merge($aResultKeys, array(
                    'profile_name' => $oProfile->getDisplayName(),
                    'profile_url' => $oProfile->getUrl(),
                    'profile_thumb' => $oProfile->getThumb(),
                    'profile_icon' => $oProfile->getIcon(),

                    'profile_id' => $aProfileInfo['id'],
                    'profile_status' => $aProfileInfo['status'],
                    'profile_type' => $aProfileInfo['type'],
                    'profile_content_id' => $aProfileInfo['content_id'],
                ));
            }
        }
        
        if ($iAccountId || $oProfile) {
            $oAccount = BxDolAccount::getInstance($iAccountId ? $iAccountId : $oProfile->getAccountId());
            if ($oAccount && ($aAccountInfo = $oAccount->getInfo())) {
                $aResultKeys = array_merge($aResultKeys, array(
                    'account_id' => $aAccountInfo['id'],
                    'account_name' => $oAccount->getDisplayName(),
                    'account_email' => $aAccountInfo['email'],
                ));
            }
        }

        if (is_array($aKeys))
            $aResultKeys = array_merge($aResultKeys, $aKeys);

        $aKeyWrapper = array('{', '}');
        $sContent = BxDolTemplate::getInstance()->parseHtmlByContent($sContent, array(
            'email_header' => getParam('site_email_html_template_header'),
            'email_footer' => getParam('site_email_html_template_footer'),
        ), $aKeyWrapper);

        if(!isset($aResultKeys['site_logo']) && bx_mb_strpos($sContent, '{site_logo}') !== false)
            $aResultKeys['site_logo'] = BxTemplFunctions::getInstance()->getEmailLogo();

        return BxDolTemplate::getInstance()->parseHtmlByContent($sContent, $aResultKeys, $aKeyWrapper);
    }
}

/** @} */
