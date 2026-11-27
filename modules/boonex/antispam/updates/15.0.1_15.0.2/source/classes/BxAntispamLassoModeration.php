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

class BxAntispamLassoModeration extends BxDol
{
    protected $_sModule;
    protected $_oModule;

    protected $_sEndpoint;

    protected $_sApiKey;
    protected $_sWebhookSecret;
    protected $_sAction;
    protected $_bNotify;
    protected $_aThresholds;

    public function __construct()
    {
        parent::__construct();

        $this->_sModule = 'bx_antispam';
        $this->_oModule = BxDolModule::getInstance($this->_sModule);

        $this->_sEndpoint = 'https://api.lassomoderation.com/api/v1';

        $this->_sApiKey = $this->_oModule->_oConfig->getAntispamOption('lm_api_key');
        $this->_sWebhookSecret = $this->_oModule->_oConfig->getAntispamOption('lm_webhook_secret');
        $this->_sAction = $this->_oModule->_oConfig->getAntispamOption('lm_action');
        $this->_bNotify = $this->_oModule->_oConfig->getAntispamOption('lm_report') == 'on';
        $this->_aThresholds = [
            'toxicity' => (int)$this->_oModule->_oConfig->getAntispamOption('lm_thd_toxicity'),
            'threat' => (int)$this->_oModule->_oConfig->getAntispamOption('lm_thd_threat'),
            'identity_attack' => (int)$this->_oModule->_oConfig->getAntispamOption('lm_thd_identity_attack'),
            'profanity' => (int)$this->_oModule->_oConfig->getAntispamOption('lm_thd_profanity')
        ];
    }

    public function processEvent()
    {
        return $this->processPayload(@file_get_contents("php://input"), $this->_getSignatureHeader());
    }

    /**
     * Check a webhook event's signature and apply it.
     * @param string $sInput request body
     * @param string $sSignature X-Lasso-Signature header
     * @return int HTTP status code to answer with
     */
    public function processPayload($sInput, $sSignature)
    {
        if(!$sInput || !is_string($sInput))
            return 200;

        // without a secret anyone could sign an event: refuse every event until one is set
        if(!is_string($this->_sWebhookSecret) || trim($this->_sWebhookSecret) === '') {
            $this->log('', 'Webhook: No secret is set.');
            return 404;
        }

        if(!is_string($sSignature) || $sSignature === '') {
            $this->log('', 'Webhook: Cannot get Signature.');
            return 404;
        }

        $sInputHmac = 'sha256=' . base64_encode(hash_hmac('sha256', $sInput, $this->_sWebhookSecret, true));
        if(!hash_equals($sInputHmac, $sSignature)) {
            // neither the secret nor a signature made with it goes to the log
            $this->log('', 'Webhook: Wrong Signature.');
            return 404;
        }

        $aEvent = json_decode($sInput, true);
        if(empty($aEvent) || !is_array($aEvent) || !isset($aEvent['actions'])) {
            $this->log($sInput, 'Webhook: Wrong input data.');
            return 404;
        }

        foreach($aEvent['actions'] as $aAction) {
            $sMethod = '_processEvent' . bx_gen_method_name($aAction['type']);
            if(!method_exists($this, $sMethod))
                continue;

            $sModule = '';
            $iContentId = 0;
            switch($aAction['type']) {
                case 'user':
                    break;

                case 'topic':
                    break;

                case 'content':
                    $iContentId = $this->_getId($aAction['content']['id']);
                    $iModuleId = $this->_getId($aAction['content']['topic_id']);
                    if(!$iContentId || !$iModuleId)
                        break;

                    $aModule = $this->_oModule->_oDb->getModuleById($iModuleId);
                    if(empty($aModule) || !is_array($aModule))
                        break;
                    
                    $sModule = $aModule['name'];
                    
                    $this->$sMethod($sModule, $iContentId, $aAction['status'], $aAction['content']['analysis']);
                    break;
            }

            if($this->_bNotify && $sModule != '' && $iContentId != 0)
                $this->_onHarmfulContentFound($sModule, $iContentId);
        }

        return 200;
    }

    protected function _getSignatureHeader()
    {
        $aHeaders = function_exists('getallheaders') ? getallheaders() : [];
        if(is_array($aHeaders))
            foreach($aHeaders as $sName => $sValue)
                if(is_string($sName) && strcasecmp($sName, 'X-Lasso-Signature') === 0 && is_string($sValue))
                    return trim($sValue);

        return isset($_SERVER['HTTP_X_LASSO_SIGNATURE']) && is_string($_SERVER['HTTP_X_LASSO_SIGNATURE']) ? trim($_SERVER['HTTP_X_LASSO_SIGNATURE']) : '';
    }

    public function addContent($sModule, $iId, $aData = [])
    {
        $aModule = BxDolModuleQuery::getInstance()->getModuleByName($sModule);
        if(empty($aModule) || !is_array($aModule))
            return false;

        $iAuthorId = !empty($aData['author_id']) ? $aData['author_id'] : bx_srv($sModule, 'get_author', [$iId]);
        $sAuthorName = !empty($aData['author_name']) ? $aData['author_name'] : BxDolProfile::getInstanceMagic($iAuthorId)->getDisplayName();

        $iDataAdded = !empty($aData['date_added']) ? $aData['date_added'] : bx_srv($sModule, 'get_date_added', [$iId]);

        $sText = !empty($aData['text']) ? $aData['text'] : bx_srv($sModule, 'get_text', [$iId]);

        $aParams = [
            'project' => [
                'id' => md5(BX_DOL_URL_ROOT),
                'name' => getParam('site_title'),
            ],
            'topic' => [
                'id' => 'mod_' . $aModule['id'],
                'name' => $aModule['title'],
            ],
            'user' => [
                'id' => 'prof_' . $iAuthorId,
                'name' => $sAuthorName
            ],
            'content_id' => $sModule . '_' . $iId,
            'created_at' => bx_time_utc($iDataAdded ? $iDataAdded : time()),
            'text' => $sText,
            'image_urls' => isset($aData['images']) ? $aData['images'] : [],
            'video_urls' => isset($aData['videos']) ? $aData['videos'] : []
        ];

        return $this->_call('/content', $aParams);
    }

    public function log($mixedContents, $sTitle = '')
    {
        $this->_oModule->log($mixedContents, 'Lasso Moderation', $sTitle);
    }

    /**
     * Internal methods.
     */
    protected function _call($sRequest, $aParams, $sMethod = 'post-json', $aHeaders = [])
    {
        $aHeaders[] = 'Authorization: Bearer ' . $this->_sApiKey;           

        $sResult = bx_file_get_contents($this->_sEndpoint . $sRequest, $aParams, $sMethod, $aHeaders);
        if(empty($sResult)) {
            $this->log($sResult, 'Call (' . $sRequest . '): ');
            $this->log($aParams);
            return false;
        }

        $aResult = json_decode($sResult, true);
        if(empty($aResult) || !is_array($aResult) || !isset($aResult['success'])) {
            $this->log($sResult, 'Call (' . $sRequest . '): ');
            $this->log($aParams);
            return false;
        }

        return true;
    }

    protected function _processEventContent($sModule, $iContentId, $sStatus, $aAnalysis)
    {
        $sFldStatus = 'status_admin';

        $aContentInfo = bx_srv($sModule, 'get_info', [$iContentId, false]);
        if(!isset($aContentInfo[$sFldStatus]))
            return;

        $sContentStatus = '';
        switch($sStatus) {
            case 'allowed':
                if($aContentInfo[$sFldStatus] != 'active')
                    $sContentStatus = 'active';
                break;

            case 'hidden':
                if($aContentInfo[$sFldStatus] != 'hidden' && $this->_sAction == 'disapprove')
                    $sContentStatus = 'hidden';
                break;

            case 'flagged':
                foreach($this->_aThresholds as $sName => $iThreshold) {
                    if(100 * $aAnalysis[$sName] < $iThreshold) 
                        continue;

                    if($aContentInfo[$sFldStatus] != 'hidden' && $this->_sAction == 'disapprove') {
                        $sContentStatus = 'hidden';
                        break;
                    }
                }
                break;
        }

        if(!empty($sContentStatus))
            bx_srv($sModule, 'set_status', [$iContentId, $sContentStatus, $sFldStatus]);
    }

    protected function _onHarmfulContentFound($sModule, $iContentId)
    {
        $oPermalinks = BxDolPermalinks::getInstance();
        $oModule = BxDolModule::getInstance($sModule);

        $CNF = &$oModule->_oConfig->CNF;

        $sContentUrl = isset($CNF['URI_VIEW_ENTRY']) ? bx_absolute_url($oPermalinks->permalink('page.php?i=' . $CNF['URI_VIEW_ENTRY'] . '&id=' . $iContentId)) : false;
        $sManageContentUrl = isset($CNF['URL_MANAGE_ADMINISTRATION']) ? bx_absolute_url($oPermalinks->permalink('page.php?i=' . $CNF['URL_MANAGE_ADMINISTRATION'])) : false;

        $iAuthorId = 0;
        if(bx_is_srv($sModule, 'get_author'))
            $iAuthorId = bx_srv($sModule, 'get_author', [$iContentId]);

        $oAuthor = BxDolProfile::getInstanceMagic($iAuthorId);

        $aPlus = [
            'AuthorUrl' => $oAuthor->getUrl(),
            'AuthorNickName' => $oAuthor->getDisplayName(),
            'bx_if:content_url' => [
                'condition' => boolval($sContentUrl),
                'content' => ['c_url' => $sContentUrl],
            ],
            'bx_if:manage_content_url' => [
                'condition' => boolval($sManageContentUrl),
                'content' => ['m_url' => $sManageContentUrl],
            ],
        ];

        $aTemplate = BxDolEmailTemplates::getInstance()->parseTemplate('bx_antispam_lasso_moderation_report', $aPlus);
        if(!$aTemplate)
            trigger_error('Email template or translation missing: bx_antispam_lasso_moderation_report', E_USER_ERROR);

        sendMail(getParam('site_email'), $aTemplate['Subject'], $aTemplate['Body']);

        bx_alert('bx_antispam', 'harmful_content_posted', $iContentId, bx_get_logged_profile_id(), [
            'module' => $sModule,
            'entry_id' => $iContentId,
            'entry_url' => $sContentUrl,
        ]);
    }

    protected function _getId($s)
    {
        return (int)substr($s, strrpos($s, '_') + 1);
    }
}

/** @} */
