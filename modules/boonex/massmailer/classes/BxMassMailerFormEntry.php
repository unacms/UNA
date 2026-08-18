<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    MassMailer Mass Mailer
 * @ingroup     UnaModules
 *
 * @{
 */

class BxMassMailerFormCheckerHelper extends BxDolFormCheckerHelper
{
    static public function checkEmailOrEmpty($s)
    {
        if (trim($s) == '')
            return true;
        
        if (!self::checkEmail($s))
            return false;

        return true;
    }
    
    static public function checkUnsubscribeUrl($s)
    {
        if (trim($s) == '')
            return false;
        
        if (strpos($s, '{unsubscribe_url}') === false)
            return false;
        
        return true;
    }
}

/**
 * Create/Edit entry form
 */
class BxMassMailerFormEntry extends BxBaseModTextFormEntry
{
    protected $_bCreative;

    public function __construct($aInfo, $oTemplate = false)
    {
        $this->MODULE = 'bx_massmailer';
        $this->_oModule = BxDolModule::getInstance($this->MODULE);

        parent::__construct($aInfo, $oTemplate);
        
        $CNF = &$this->_oModule->_oConfig->CNF;

        $this->_bCreative = $CNF['PARAM_USE_CREATIVE'];

        if (isset( $this->aInputs[$CNF['FIELD_SEGMENTS']]))
            $this->aInputs[$CNF['FIELD_SEGMENTS']]['values'] = $this->_oModule->getSegments();
    }
    
    public function getCode($bDynamicMode = false)
    {
        $sResult = parent::getCode($bDynamicMode);

        $this->_oModule->_oTemplate->addJs([
            'grapesjs/grapes.min.js',
            'grapesjs/grapesjs-preset-newsletter.min.js'
        ]);
        $this->_oModule->_oTemplate->addCss([
            BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'grapesjs/|grapes.min.css'
        ]);

        return $sResult;
    }

    public function initChecker ($aValues = [], $aSpecificValues = [])
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $bValues = $aValues && !empty($aValues['id']);
        $iCampaignId = $bValues ? (int)$aValues['id'] : 0;
        $aCampaignInfo = $bValues ? $this->_oModule->_oDb->getCampaignInfoById($aValues['id']) : false;

        if($this->_bCreative && isset($this->aInputs[$CNF['FIELD_BODY']])) {
            $sContent = !empty($aCampaignInfo['body']) ? $aCampaignInfo['body'] : '';

            if(!$this->_bIsApi)
                $this->aInputs[$CNF['FIELD_BODY']] = array_merge($this->aInputs[$CNF['FIELD_BODY']], [
                    'type' => 'custom',
                    'content' => $this->_oModule->_oTemplate->parseHtmlByName('campaign_body.html', [
                        'name' => $this->aInputs[$CNF['FIELD_BODY']]['name'],
                        'html_id' => $this->_oModule->_oConfig->getHtmlIds('campaign_body'),
                        'content_html' => $sContent,
                        'content_data' => json_encode([
                            'pages' => [
                                ['component' => $sContent]
                            ]
                        ])
                    ]),
                ]);
            else
                $this->aInputs[$CNF['FIELD_BODY_INFO']] = array_merge($this->aInputs[$CNF['FIELD_BODY_INFO']], [
                    'type' => 'value',
                    'value' => $this->_oModule->serviceAttributes()
                ]);
        }

        parent::initChecker ($aValues, $aSpecificValues);
    }

    public function insert ($aValsToAdd = array(), $isIgnore = false)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $aValsToAdd[$CNF['FIELD_AUTHOR']] = bx_get_logged_profile_id();
        return parent::insert ($aValsToAdd, $isIgnore);
    }

    protected function genCustomInputBodyInfo ($aInput)
    {
        return $this->_oModule->serviceAttributes();
    }
}

/** @} */
