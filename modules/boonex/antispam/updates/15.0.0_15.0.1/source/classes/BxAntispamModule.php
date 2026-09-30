<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Antispam Antispam
 * @ingroup     UnaModules
 *
 * @{
 */

class BxAntispamModule extends BxDolModule
{
    private $_bLastSubmittedFormWasToxic;

    public function __construct(&$aModule)
    {
        parent::__construct($aModule);
        $this->_bLastSubmittedFormWasToxic = false;
    }

    public function actionContentChecked()
    {
        $iResult = 404;

        if($this->_oConfig->getAntispamOption('lm_enable') == 'on') {
            $oLassoModeration = bx_instance('BxAntispamLassoModeration', [], $this->getName());
            $iResult = $oLassoModeration->processEvent();    
        }

        http_response_code($iResult);
    }

    public function serviceUpdateDisposableDomainsLists ()
    {
        $o = bx_instance('BxAntispamDisposableEmailDomains', array(), 'bx_antispam');

        $o->updateList('blacklist', 'https://raw.githubusercontent.com/martenson/disposable-email-domains/master/disposable_email_blocklist.conf');

        // TODO: uncomment after adding interface for whitelisting
        // $o->updateList('whitelist', 'https://raw.githubusercontent.com/martenson/disposable-email-domains/master/whitelist.conf');
    }
    
    public function serviceIpTable ()
    {
        $o = bx_instance('BxAntispamIP', array(), $this->_aModule);
        $s = _t('_bx_antispam_ip_table_status', mb_strtolower($o->getIpTableConfigTitle((int)getParam('bx_antispam_ip_list_type'))));
        $s .= $this->_grid('bx_antispam_grid_ip_table');
        return $s;
    }

    public function serviceDnsblList ()
    {
        $s = _t('_bx_antispam_dnsbl_status',
             BxTemplFunctions::getInstance()->statusOnOff((bool)$this->_oConfig->getAntispamOption('dnsbl_enable'), true),
             BxTemplFunctions::getInstance()->statusOnOff((bool)$this->_oConfig->getAntispamOption('uridnsbl_enable'), true),
             mb_strtolower(_t('_bx_antispam_dnsbl_behaviour_login_' . $this->_oConfig->getAntispamOption('dnsbl_behaviour_login'))),
             mb_strtolower(_t('_bx_antispam_dnsbl_behaviour_join_' . $this->_oConfig->getAntispamOption('dnsbl_behaviour_join')))
        );
        $s .= $this->_grid('bx_antispam_grid_dnsbl');
        return $s;
    }

    public function serviceBlockLog ()
    {
        return $this->_grid('bx_antispam_grid_block_log');
    }

    /**
     * Filter undesired words
     *
     * @param $sContent content to filter
     * @param $sIp IP address of content poster
     * @return modified or the same content.
     */
    public function serviceFilterSpam ($mContent, $sIp = '')
    {      
        if (defined('BX_DOL_CRON_EXECUTE') || isAdmin() || 'on' != $this->_oConfig->getAntispamOption('profanity_enable'))
            return $mContent;
        
        $oProfanityFilter = bx_instance('BxAntispamProfanityFilter', array(), $this->_aModule);
        return $oProfanityFilter->censor($mContent); 
    }
    
    /**
     * Check text for spam URL.
     * It checks URLs found in text for DNSURI black lists (@see BxAntispamDNSURIBlacklists),
     *
     * @param $sContent content to check for spam
     * @return true if spam detected, false if spam isn't detected, null if detection wasn't performed.
     */
    public function serviceIsSpamUrl ($sContent)
    {
        $bRet = null;
        if ('on' == $this->_oConfig->getAntispamOption('uridnsbl_enable')) {
            $oDNSURIBlacklists = bx_instance('BxAntispamDNSURIBlacklists', array(), $this->_aModule);
            if ($oDNSURIBlacklists->isSpam($sContent)) {
                $oDNSURIBlacklists->onPositiveDetection($sContent);
                $bRet = true;
            } 
            else {
                $bRet = false;
            }
        }
        return $bRet;
    }

    /**
     * Check text for spam.
     * First it check if IP is whitelisted(or under cron execution or user is admin) - for whitelisted IPs check for spam isn't performed,
     * then it checks URLs found in text for DNSURI black lists (@see BxAntispamDNSURIBlacklists),
     * then it checks text in Akismet service (@see BxAntispamAkismet).
     * It can send report if spam is found or tries to inform caller to block the content (depending on configuration).
     *
     * @param $sContent content to check for spam
     * @param $sIp IP address of content poster
     * @param $isStripSlashes slashes parameter:
     *          BX_SLASHES_AUTO - automatically detect magic_quotes_gpc setting
     *          BX_SLASHES_NO_ACTION - do not perform any action with slashes
     * @return true if spam detected and content shouln't be recorded, false if content should be processed as usual.
     */
    public function serviceIsSpam ($sContent, $sIp = '', $isStripSlashes = BX_SLASHES_AUTO)
    {      
        if (defined('BX_DOL_CRON_EXECUTE') || isAdmin())
            return false;

        if ($this->serviceIsIpWhitelisted($sIp))
            return false;

        if (version_compare(phpversion(), '7.4.0', '<') && function_exists('get_magic_quotes_gpc') && get_magic_quotes_gpc() && $isStripSlashes == BX_SLASHES_AUTO)
            $sContent = stripslashes($sContent);
        
        $bRet = false;
        if ('on' == $this->_oConfig->getAntispamOption('uridnsbl_enable')) {
            $oDNSURIBlacklists = bx_instance('BxAntispamDNSURIBlacklists', array(), $this->_aModule);
            if ($oDNSURIBlacklists->isSpam($sContent)) {
                $oDNSURIBlacklists->onPositiveDetection($sContent);
                $bRet = true;
            }
        }

        if (!$bRet && 'on' == $this->_oConfig->getAntispamOption('akismet_enable')) {
            $oAkismet = bx_instance('BxAntispamAkismet', array(), $this->_aModule);
            if ($oAkismet->isSpam($sContent)) {
                $oAkismet->onPositiveDetection($sContent);
                $bRet = true;
            }
        }

        if ($bRet && 'on' == $this->_oConfig->getAntispamOption('antispam_report')) {

            $oProfile = BxDolProfile::getInstance();
            $aPlus = array(
                'SpammerUrl' => $oProfile->getUrl(),
                'SpammerNickName' => $oProfile->getDisplayName(),
                'Page' => htmlspecialchars_adv($_SERVER['PHP_SELF']),
                'Get' => print_r($_GET, true),
                'Post' => print_r($_POST, true),
                'SpamContent' => htmlspecialchars_adv($sContent),
            );

            $aTemplate = BxDolEmailTemplates::getInstance()->parseTemplate('bx_antispam_spam_report', $aPlus);
            if (!$aTemplate)
                trigger_error('Email template or translation missing: bx_antispam_spam_report', E_USER_ERROR);

            sendMail(getParam('site_email'), $aTemplate['Subject'], $aTemplate['Body']);
        }

        if ($bRet && 'on' == $this->_oConfig->getAntispamOption('antispam_block'))
            return true;

        return false;
    }

    /**
     * Check text for toxicity.
     * It can send report if toxic content is found or tries to inform caller to block the content (depending on configuration).
     *
     * @param $sContent content to check for spam
     * @param $sIp IP address of content poster
     * @param $isStripSlashes slashes parameter:
     *          BX_SLASHES_AUTO - automatically detect magic_quotes_gpc setting
     *          BX_SLASHES_NO_ACTION - do not perform any action with slashes
     * @return true if toxic content detected and content shouln't be recorded, false if content should be processed as usual.
     */
    public function serviceIsToxic ($sContent, $sIp = '', $isStripSlashes = BX_SLASHES_AUTO, $bSupressNotification = false)
    {
        if (defined('BX_DOL_CRON_EXECUTE') || isAdmin())
            return false;

        static $aQuickCache;
        $key = md5($sContent);
        if (isset($aQuickCache[$key]))
            return $aQuickCache[$key];

        $aQuickCache[$key] = false;

        if (!$this->serviceIsIpWhitelisted($sIp)) {
            if (version_compare(phpversion(), '7.4.0', '<') && function_exists('get_magic_quotes_gpc') && get_magic_quotes_gpc() && $isStripSlashes == BX_SLASHES_AUTO)
                $sContent = stripslashes($sContent);

            if ('on' == $this->_oConfig->getAntispamOption('toxicity_enable')) {
                $oPerspectiveAPI = bx_instance('BxAntispamPerspectiveAPI', array(), $this->_aModule);
                if ($oPerspectiveAPI->isToxic($sContent)) {
                    $oPerspectiveAPI->onPositiveDetection($sContent);
                    $aQuickCache[$key] = true;

                    if (!$bSupressNotification) $this->serviceOnToxicContentFound($sContent);
                }
            }
        }

        return $aQuickCache[$key];
    }

    public function serviceCheckFormForToxicity(&$oForm) {
        $this->_bLastSubmittedFormWasToxic = false;

        if (!$oForm->isSubmitted() || !$oForm->isValid()) 
            return false;

        $sSubmitName = false;
        $sFormText = '';
        foreach ($oForm->aInputs as $k => $a) {
            if (isset($a['visible_for_levels']) && !BxDolForm::isVisible($a))
                continue;

            if (empty($a['name']) || 'submit' == $a['type'] || 'reset' == $a['type'] || 'button' == $a['type'] || 'value' == $a['type']) {
                if (isset($a['type']) && 'submit' == $a['type'])
                    $sSubmitName = $k;
                continue;
            }

            if ('input_set' == $a['type'])
                foreach ($a as $r)
                    if (isset($r['type']) && 'submit' == $r['type'])
                        $sSubmitName = $k;

            $a['name'] = str_replace('[]', '', $a['name']);

            if ($a['type'] != 'textarea' && $a['type'] != 'text')
                continue;

            $val = BxDolForm::getSubmittedValue($a['name'], $oForm->aFormAttrs['method']);
            if (!$val)
                continue;

            $sFormText .= " ".$val; // collect all text fields into a single text
        }

        if ($this->serviceIsToxic($sFormText, '', BX_SLASHES_AUTO, true)) {
            $this->_bLastSubmittedFormWasToxic = true;

            $sActionrequired = $this->_oConfig->getAntispamOption('toxicity_action');

            if ($sActionrequired == 'block' || $sActionrequired == 'disapprove' && !$oForm->isStatusFieldSupported()) {
                $oForm->setValid(false);
                $this->serviceOnToxicContentFound($sFormText);

                if ($sSubmitName)
                    $oForm->aInputs[$sSubmitName]['error'] = _t('_bx_antispam_form_submission_error');
            } elseif ($sActionrequired == 'disapprove' && $oForm->isStatusFieldSupported()) {
                $oForm->setForceSetToPending(true);
                return false;
            }
        }
    }

    public function serviceIsLastFormSubmittedToxic() {
        return $this->_bLastSubmittedFormWasToxic;
    }

    public function serviceSetCommentAsPending($iCmtId) {
        return $this->_oDb->setCommentStatus($iCmtId, BX_CMT_STATUS_PENDING);
    }

    public function serviceOnFormSubmitted($sModule, $iEntry, $sAction, &$oForm)
    {
        if ($this->_bLastSubmittedFormWasToxic) {
            $this->serviceOnToxicContentPosted($sModule, $iEntry);
        }

        if($this->_oConfig->getAntispamOption('lm_enable') == 'on' && (bx_srv('system', 'is_module_content', [$sModule]) || bx_srv('system', 'is_module_context', [$sModule]) || in_array($sModule, ['bx_timeline'])) && ($oModule = BxDolModule::getInstance($sModule)) !== null) {
            $CNF = &$oModule->_oConfig->CNF;

            if(($iAuthorId = bx_get_logged_profile_id()) !== false && ($oAuthor = BxDolProfile::getInstance()) !== false) {
                $iDataAdded = time();

                $sText = '';
                if(isset($CNF['FIELD_TEXT'], $oForm->aInputs[$CNF['FIELD_TEXT']]))
                    $sText = $oForm->getCleanValue($CNF['FIELD_TEXT']);
                if(empty($sText) && isset($oForm->aInputs['text']))
                    $sText = $oForm->getCleanValue('text');

                $aMedias = [
                    'images' => ['fields' => ['FIELD_PHOTO', 'FIELD_PICTURE', 'FIELD_COVER'], 'data' => []], 
                    'videos' => ['fields' => ['FIELD_VIDEO'], 'data' => []]
                ];
                foreach($aMedias as $sName => $aMedia) 
                    foreach($aMedia['fields'] as $sField) {
                        if(!isset($CNF[$sField], $oForm->aInputs[$CNF[$sField]]))
                            continue;

                        $oStorage = BxDolStorage::getObjectInstance($oForm->aInputs[$CNF[$sField]]['storage_object']);
                        if(!$oStorage)
                            continue;

                        $aGhosts = $oStorage->getGhosts($iAuthorId, $sAction == 'insert' ? 0 : $iEntry);
                        foreach($aGhosts as $aGhost)
                            $aMedias[$sName]['data'][] = $oStorage->getFileUrlById($aGhost['id']);
                    }

                $oLassoModeration = bx_instance('BxAntispamLassoModeration', [], $this->getName());
                $oLassoModeration->addContent($sModule, $iEntry, [
                    'author_id' => $iAuthorId,
                    'author_name' => $oAuthor->getDisplayName(),
                    'date_added' => $iDataAdded,
                    'text' => $sText,
                    'images' => $aMedias['images']['data'], 
                    'videos' => $aMedias['videos']['data']
                ]);
            }
        }
    }

    public function serviceOnToxicContentFound(&$sText) {
        if ('on' == $this->_oConfig->getAntispamOption('toxicity_report')) {
            $oProfile = BxDolProfile::getInstance();
            if (!$oProfile) return;
            $aPlus = array(
                'AuthorUrl' => $oProfile->getUrl(),
                'AuthorNickName' => $oProfile->getDisplayName(),
                'Page' => htmlspecialchars_adv($_SERVER['PHP_SELF']),
                'Content' => htmlspecialchars_adv(strip_tags($sText)),
            );

            $aTemplate = BxDolEmailTemplates::getInstance()->parseTemplate('bx_antispam_toxicity_blocked_report', $aPlus);
            if (!$aTemplate)
                trigger_error('Email template or translation missing: bx_antispam_toxicity_blocked_report', E_USER_ERROR);

            sendMail(getParam('site_email'), $aTemplate['Subject'], $aTemplate['Body']);

            bx_alert('bx_antispam', 'toxic_content_found', 0, bx_get_logged_profile_id(), array(
                'text' => $sText,
            ));
        }
    }

    public function serviceOnToxicContentPosted($sModule, $iContentId) {
        if ('on' == $this->_oConfig->getAntispamOption('toxicity_report') && $sModule) {
            $oModule = BxDolModule::getInstance($sModule);
            $CNF = &$oModule->_oConfig->CNF;
            $sContentUrl = isset($CNF['URI_VIEW_ENTRY']) ? bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=' . $CNF['URI_VIEW_ENTRY'] . '&id=' . $iContentId)) : false;
            $sManageContentUrl = isset($CNF['URL_MANAGE_ADMINISTRATION']) ? bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=' . $CNF['URL_MANAGE_ADMINISTRATION'])) : false;

            $oProfile = BxDolProfile::getInstance();
            if (!$oProfile) return;

            $aPlus = array(
                'AuthorUrl' => $oProfile->getUrl(),
                'AuthorNickName' => $oProfile->getDisplayName(),
                'Page' => htmlspecialchars_adv($_SERVER['PHP_SELF']),
                'bx_if:content_url' => [
                    'condition' => boolval($sContentUrl),
                    'content' => ['c_url' => $sContentUrl],
                ],
                'bx_if:manage_content_url' => [
                    'condition' => boolval($sManageContentUrl),
                    'content' => ['m_url' => $sManageContentUrl],
                ],
            );

            $aTemplate = BxDolEmailTemplates::getInstance()->parseTemplate('bx_antispam_toxicity_posted_report', $aPlus);
            if (!$aTemplate)
                trigger_error('Email template or translation missing: bx_antispam_toxicity_posted_report', E_USER_ERROR);

            sendMail(getParam('site_email'), $aTemplate['Subject'], $aTemplate['Body']);

            bx_alert('bx_antispam', 'toxic_content_posted', $iContentId, bx_get_logged_profile_id(), array(
                'module' => $sModule,
                'entry_id' => $iContentId,
                'entry_url' => $sContentUrl,
            ));
        }
    }

    /**
     * Perform complex check if user is allowed to login.
     * First it checks if IP is directly blocked (@see serviceIsIpBlocked),
     * then it checks in DNS black lists (@see serviceIsIpDnsBlacklisted).
     *
     * @param $sIp IP to check, or empty for current IP
     * @return empty string - if join should be allowed, error message - if join should be blocked
     */
    public function serviceCheckLogin ($sIp = '')
    {
        $bLoginBlock = ('block' == $this->_oConfig->getAntispamOption('dnsbl_behaviour_login'));
        $sErrorMsg = '';
        $sNote = $bLoginBlock ? 'login block' : 'login log';

        if (!$sIp)
            $sIp = getVisitorIP();

        if (!$sErrorMsg && $this->serviceIsIpBlocked($sIp))
            $sErrorMsg = $this->getErrorMessageIpBlocked();

        if (!$sErrorMsg && 'on' == $this->_oConfig->getAntispamOption('dnsbl_enable') && $this->serviceIsIpDnsBlacklisted($sIp, $sNote) && $bLoginBlock)
            $sErrorMsg = $this->getErrorMessageSpam();

        return $sErrorMsg;
    }

    /**
     * Perform complex check if user is allowed to join.
     * First it checks if IP is directly blocked (@see serviceIsIpBlocked),
     * then it checks in DNS black lists (@see serviceIsIpDnsBlacklisted),
     * then it checks in StopForumSpam service (@see BxAntispamStopForumSpam).
     *
     * @param $sCurIP IP to check, or empty for current IP
     * @return empty string - if join should be allowed, error message - if join should be blocked
     */
    public function serviceCheckJoin ($sEmail, &$bApproval, $sIp = '')
    {
        $bJoinBlock = ('block' == $this->_oConfig->getAntispamOption('dnsbl_behaviour_join'));
        $sErrorMsg = '';
        $sNote = $bJoinBlock ? 'join block' : 'join approval';

        if (!$sIp)
            $sIp = getVisitorIP();

        // check if IP is blocked
        if (!$sErrorMsg && $this->serviceIsIpBlocked($sIp))
            $sErrorMsg = $this->getErrorMessageIpBlocked();

        // check in DNSBL lists
        if (!$sErrorMsg && 'on' == $this->_oConfig->getAntispamOption('dnsbl_enable') && $this->serviceIsIpDnsBlacklisted($sIp, $sNote)) {
            if ('approval' == $this->_oConfig->getAntispamOption('dnsbl_behaviour_join'))
                $bApproval = true;
            else
                $sErrorMsg = $this->getErrorMessageSpam();
        }

        // check in StopForumSpam service
        if (!$sErrorMsg) {
            $oStopForumSpam = bx_instance('BxAntispamStopForumSpam', array(), $this->_aModule);
            if ($oStopForumSpam->isSpammer(array('email' => $sEmail, 'ip' => $sIp), $sNote))
                $sErrorMsg = $this->getErrorMessageSpam();
        }

        // check for disposable email domains
        if (!$sErrorMsg && 'disable' != ($sMode = $this->_oConfig->getAntispamOption('disposable_email_domains_mode'))) {

            $bDisposableEmailDomainsBehaviour = $this->_oConfig->getAntispamOption('disposable_email_domains_behaviour_join');
            $oDisposableEmailDomains = bx_instance('BxAntispamDisposableEmailDomains', array(), 'bx_antispam');
            
            if ('blacklist' == $sMode && $oDisposableEmailDomains->isBlacklisted($sEmail)) {
                if ('approval' == $bDisposableEmailDomainsBehaviour)
                    $bApproval = true;
                else
                    $sErrorMsg = $oDisposableEmailDomains->getErrorMessageBlacklisted();
            }
            elseif ('whitelist' == $sMode && !$oDisposableEmailDomains->isWhitelisted($sEmail)) {
                if ('approval' == $bDisposableEmailDomainsBehaviour)
                    $bApproval = true;
                else
                    $sErrorMsg = $oDisposableEmailDomains->getErrorMessageNotWhitelisted();
            }

        }

        return $sErrorMsg;
    }

    /**
     * Check if IP is blacklisted in some DNS chain (@see BxAntispamDNSBlacklists).
     *
     * @param $sCurIP IP to check, or empty for current IP
     * @param $sNote [optional] place where checking is performed, for example 'join', 'login'
     * @return true if IP blacklisted and not whiteloisted, or false if under cron execution or if IP isn't blacklisted
     */
    public function serviceIsIpDnsBlacklisted($sCurIP = '', $sNote = '')
    {
        if (defined('BX_DOL_CRON_EXECUTE'))
            return false;

        if (!$sCurIP)
            $sCurIP = getVisitorIP();

        if ($this->serviceIsIpWhitelisted($sCurIP))
            return false;

        $o = bx_instance('BxAntispamDNSBlacklists', array(), $this->_aModule);

        if (BX_DOL_DNSBL_POSITIVE == $o->dnsbl_lookup_ip(BX_DOL_DNSBL_CHAIN_SPAMMERS, $sCurIP) && BX_DOL_DNSBL_POSITIVE != $o->dnsbl_lookup_ip(BX_DOL_DNSBL_CHAIN_WHITELIST, $sCurIP)) {
            $o->onPositiveDetection ($sCurIP, $sNote);
            return true;
        }

        return false;
    }

    /**
     * @see BxAntispamIP::isIpWhitelisted
     */
    public function serviceIsIpWhitelisted($sIp = '')
    {
        $o = bx_instance('BxAntispamIP', array(), $this->_aModule);
        return $o->isIpWhitelisted($sIp);
    }

    /**
     * @see BxAntispamIP::isIpBlocked
     */
    public function serviceIsIpBlocked($sIp = '')
    {
        $o = bx_instance('BxAntispamIP', array(), $this->_aModule);
        return $o->isIpBlocked($sIp);
    }

    /**
     * @see BxAntispamIP::blockIp
     */
    public function serviceBlockIp($mixedIP, $iExpirationInSec = 86400, $sComment = '')
    {
        $o = bx_instance('BxAntispamIP', array(), $this->_aModule);
        return $o->blockIp($mixedIP, $iExpirationInSec, $sComment);
    }

    /**
     * @see BxAntispamIP::pruning
     */
    public function servicePruning()
    {
        $o = bx_instance('BxAntispamIP', array(), $this->_aModule);
        return $o->pruning();
    }

    /**
     * @see BxAntispamIP::pruning
     */
    public function serviceConfigValues($s)
    {
        switch ($s) {
            case 'ip_table':
                $o = bx_instance('BxAntispamIP', array(), $this->_aModule);
                return $o->getIpTableConfigValues();
            case 'dnsbl_login':
                $o = bx_instance('BxAntispamDNSBlacklists', array(), $this->_aModule);
                return $o->getDNSBLConfigValues();
            case 'dnsbl_join':
                $o = bx_instance('BxAntispamDNSURIBlacklists', array(), $this->_aModule);
                return $o->getURIDNSBLConfigValues();
            case 'disposable_email_domains_join':
                $o = bx_instance('BxAntispamDisposableEmailDomains', array(), $this->_aModule);
                return $o->getJoinBehaviourValues();                
            case 'disposable_email_domains_mode':
                $o = bx_instance('BxAntispamDisposableEmailDomains', array(), $this->_aModule);
                return $o->getJoinBehaviourModes();                
        }
    }
    
    /**
     * @return array with avaliable dictionaries languages
     */
    public function serviceGetProfanityFilterDicts ()
    {
        $oProfanityFilter = bx_instance('BxAntispamProfanityFilter', array(), $this->_aModule);
        return $oProfanityFilter->getDicts(); 
    }

    /**
     * @return array with avaliable toxicity filter actions
     */
    public function serviceGetToxicityFilterActions ()
    {
        return [
            'none' => _t('_bx_antispam_option_toxicity_filter_action_none'),
            'block' => _t('_bx_antispam_option_toxicity_filter_action_block'),
            'disapprove' => _t('_bx_antispam_option_toxicity_filter_action_disapprove'),
        ];
    }

    /**
     * @return array with avaliable Lasso Moderation actions
     */
    public function serviceGetLassoModerationActions ()
    {
        return [
            'none' => _t('_bx_antispam_option_lasso_moderation_action_none'),
            'disapprove' => _t('_bx_antispam_option_lasso_moderation_action_disapprove'),
        ];
    }

    public function log($mixedContents, $sSection = '', $sTitle = '')
    {
        if(is_array($mixedContents))
            $mixedContents = var_export($mixedContents, true);	
        else if(is_object($mixedContents))
            $mixedContents = json_encode($mixedContents);

        if(empty($sSection))
            $sSection = "Core";

        $sTitle .= "\n";

        bx_log('bx_antispam', ":\n[" . $sSection . "] " . $sTitle . $mixedContents);
    }

    protected function getErrorMessageIpBlocked ()
    {
        bx_import('BxDolLanguages');
        return _t('_bx_antispam_ip_blocked', $this->getErrorMessageSubmitFalsePositiveReport());
    }

    protected function getErrorMessageSpam ()
    {
        bx_import('BxDolLanguages');
        return _t('_bx_antispam_spam_detected', $this->getErrorMessageSubmitFalsePositiveReport());
    }

    protected function getErrorMessageSubmitFalsePositiveReport ()
    {
        if (BxDolRequest::serviceExists('bx_contact', 'get_contact_page_url') && ($sUrl = BxDolService::call('bx_contact', 'get_contact_page_url')))
            return _t('_bx_antispam_submit_false_positive_report', $sUrl);
        return '';
    }

    protected function _grid ($sObjectGrid)
    {
        $oGrid = BxDolGrid::getObjectInstance($sObjectGrid);
        return $oGrid ? $oGrid->getCode() : '';
    }
}

/** @} */
