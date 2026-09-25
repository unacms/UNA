<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    SMTPMailer SMTP Mailer
 * @ingroup     UnaModules
 *
 * @{
 */

class BxSMTPModule extends BxDolModule
{
    function __construct(&$aModule)
    {
        parent::__construct($aModule);
    }

    function serviceSend ($sRecipientEmail, $sMailSubject, $sMailBody, $sMailHeader, $sMailParameters, $isHtml, $aRecipientInfo = array(), $aCustomHeaders = array())
    {
        $iRet = true;
        $sErrorMessage = '';

        if ($sRecipientEmail) {

            try {

                $mail = new PHPMailer\PHPMailer\PHPMailer(true);

                if ('on' == getParam('bx_smtp_on'))
                    $mail->IsSMTP();
                // $mail->SMTPDebug = 2;

                $mail->CharSet = 'UTF-8';

                // smtp server auth or not
                $mail->SMTPAuth = 'on' == getParam('bx_smtp_auth') ? true : false;

                // from settings, smtp server secure ssl/tls
                $sParamSecure = getParam('bx_smtp_secure');
                if ('SSL' == $sParamSecure || 'TLS' == $sParamSecure) {

                    $mail->SMTPSecure = strtolower($sParamSecure);

                    if ('on' == getParam('bx_smtp_allow_selfsigned')) {
                        $mail->SMTPOptions = array(
                            'ssl' => array(
                                'verify_peer' => false,
                                'verify_peer_name' => false,
                                'allow_self_signed' => true
                            )
                        );
                    }
                }

                // from settings, smtp server
                $sParamHost = getParam('bx_smtp_host');
                if ($sParamHost)
                    $mail->Host = $sParamHost;

                // smtp port 25, 465
                $sParamPort = getParam('bx_smtp_port');
                if ((int)$sParamPort > 0)
                    $mail->Port = $sParamPort;

                // from settings, username and passord of smtp server
                if (getParam('bx_smtp_oauth_on')) {
                    $mail->AuthType = 'XOAUTH2';
                    bx_import('MailAuthorization', $this->_aModule);
                    bx_import('MailAuthorizationPHPMailer', $this->_aModule);
                    $mail->setOAuth(BxSMTPMailAuthorizationPHPMailer::getInstance([
                        'mailAddress' => getParam('bx_smtp_from_email'),
                        'clientId' => getParam('bx_smtp_oauth_client_id'),
                        'tenantId' => getParam('bx_smtp_oauth_tenant_id'),
                        'tenantName' => getParam('bx_smtp_oauth_tenant_name'),
                        'x509Cert' => getParam('bx_smtp_oauth_cert_public'),
                        'x509Key' => getParam('bx_smtp_oauth_cert_private'),
                    ]));
                }
                else {
                    $mail->Username = getParam ('bx_smtp_username');
                    $mail->Password = getParam ('bx_smtp_password');
                }

                if (!isset($aCustomHeaders['From'])) {
                    $sParamSender = trim(getParam('bx_smtp_from_email'));
                    if ($sParamSender)
                        $mail->From = $sParamSender;
                    else
                        $mail->From = getParam('site_email_notify');

                    // get site name or some other name as sender's name
                    $mail->FromName = getParam ('bx_smtp_from_name');
                } 

                if (!isset($aCustomHeaders['Subject']))
                    $mail->Subject = $sMailSubject;

                if ($isHtml) {
                    $mail->Body = $sMailBody;
                    $mail->AltBody = $isHtml ? strip_tags($sMailBody) : $sMailBody;
                } else {
                    $mail->Body = $sMailBody;
                }

                $mail->WordWrap = 50; // set word wrap

                if (getParam('bx_smtp_test_mode')) {
                    $aCustomHeaders['X-Original-To'] = $sRecipientEmail;
                    if (isset($aCustomHeaders['Subject']))
                        $aCustomHeaders['Subject'] = getParam('bx_smtp_test_subj') . $aCustomHeaders['Subject'];
                    else
                        $mail->Subject = getParam('bx_smtp_test_subj') . $mail->Subject;
                }

                $mail->AddAddress(getParam('bx_smtp_test_mode') ? getParam('bx_smtp_test_email') : $sRecipientEmail);

                $mail->IsHTML($isHtml ? true : false);

                foreach ($aCustomHeaders as $sHeaderName => $sHeaderValue) {
                    if ('From' == $sHeaderName) {
                        if (preg_match('/(.+)<(.+)>/', $sHeaderValue, $m)) {
                            $mail->setFrom($m[2], trim($m[1]), false);
                        }
                        else {
                            $mail->setFrom($sHeaderValue, '', false);
                        }
                    } 
                    else {
                        $mail->addCustomHeader($sHeaderName, $sHeaderValue);
                    }
                }

                $mail->Send();
                
            } catch (PHPMailer\PHPMailer\Exception $e) {
                $iRet = false;
                $sErrorMessage = $e->getMessage();
                $this->log("Mailer Error ($sRecipientEmail): " . $sErrorMessage);
            }
        }

        //--- create system event [begin]
        $aAlertData = array(
            'test_mode' => (bool)getParam('bx_smtp_test_mode'),
            'email'     => $sRecipientEmail,
            'subject'   => $sMailSubject,
            'body'      => $sMailBody,
            'header'    => $sMailHeader,
            'params'    => $sMailParameters,
            'recipient' => $aRecipientInfo,
            'html'      => $isHtml,
            'ret'       => $iRet,
            'error_message' => $sErrorMessage,            
        );
        /**
         * @hooks
         * @hookdef hook-profile-send_mail 'profile', 'send_mail' - hook in  $oAccount->isConfirmed check
         * - $unit_name - equals `profile`
         * - $action - equals `send_mail` 
         * - $object_id - not used 
         * - $sender_id - recipient profile_id 
         * - $extra_params - array of additional params with the following array keys:
         *      - `test_mode` - [bool] test mode or not
         *      - `email` - [string] email
         *      - `subject` - [string] letter subject
         *      - `body` - [string] letter body
         *      - `header` - [string] letter header
         *      - `params` - [string] letter params
         *      - `recipient` - [array] recipient info
         *      - `html` - [bool] is html letter or not
         *      - `ret` - [bool] sent successfuly  or not
         *      - `error_message` - [string] error message
         * @hook @ref hook-profile-send_mail
         */
        bx_alert('profile', 'send_mail', $aRecipientInfo && isset($aRecipientInfo['ID']) ? $aRecipientInfo['ID'] : 0, '', $aAlertData);
        //--- create system event [ end ]

        return $iRet;
    }

    function formTester()
    {
        $sMsg  = '';
        if (isset($_POST['tester_submit']) && $_POST['tester_submit']) {

            $isHTML = bx_get('html') == 'on' ? true : false;
            $sRecipient = bx_process_pass(bx_get('recipient'));
            $sSubj = bx_get('subject');
            $sBody = bx_process_pass(bx_get('body'), $isHTML ? BX_DATA_HTML : BX_DATA_TEXT);

            if (sendMail($sRecipient, $sSubj, $sBody, 0, array(), BX_EMAIL_SYSTEM, $isHTML ? 'html' : ''))
                $sMsg = MsgBox(_t('_bx_smtp_send_ok'));
            else
                $sMsg = MsgBox(_t('_bx_smtp_send_fail'));
        }

        $aForm = array(
            'form_attrs' => array(
                'method'   => 'post',
            ),
            'inputs' => array (
                'recipient' => array(
                    'type' => 'text',
                    'name' => 'recipient',
                    'caption' => _t('_bx_smtp_recipient'),
                    'value' => '',
                ),
                'subject' => array(
                    'type' => 'text',
                    'name' => 'subject',
                    'caption' => _t('_bx_smtp_subject'),
                    'value' => '',
                ),
                'body' => array(
                    'type' => 'textarea',
                    'name' => 'body',
                    'caption' => _t('_bx_smtp_body'),
                    'value' => '',
                ),
                'html' => array(
                    'type' => 'checkbox',
                    'name' => 'html',
                    'caption' => _t('_bx_smtp_is_html'),
                    'checked' => false,
                ),
                'Submit' => array(
                    'type' => 'submit',
                    'name' => 'tester_submit',
                    'value' => _t("_Submit"),
                ),
            )
        );

        $oForm = new BxTemplFormView($aForm);
        return $sMsg . $oForm->getCode();
    }

    function log ($s)
    {
        bx_log('bx_smtp_mailer', $s, BX_LOG_ERR);
    }
}

/** @} */
