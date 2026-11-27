<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    BaseGroups Base classes for groups modules
 * @ingroup     UnaModules
 *
 * @{
 */

/*
 * Groups module representation.
 */
class BxBaseModGroupsTemplate extends BxBaseModProfileTemplate
{
    protected $_iUnitCharsSummary;

    protected $_sUnitClassWoCover;

    function __construct(&$oConfig, &$oDb)
    {
        parent::__construct($oConfig, $oDb);

        $this->_iUnitCharsSummary = 50;

        $this->_sUnitClassWoCover = $this->_sUnitClass; //--- Save default 'Unit' class (from BxBaseModProfileTemplate) as 'Unit W\O Cover' class here.
        $this->_sUnitClassWithCover .= ' bx-base-groups-unit-with-cover';
        $this->_sUnitClass = $this->_sUnitClassWithCover;
        $this->_sUnitClassWoInfo .= ' bx-base-groups-unit-wo-info'; 
        $this->_sUnitClassWoInfoShowCase .= ' bx-base-groups-unit-wo-info bx-base-groups-unit-wo-info-showcase';
        $this->_sUnitClassShowCase .= ' bx-base-groups-unit-with-cover bx-base-groups-unit-showcase';

        $this->_bLetterAvatar = !$this->_oConfig->isUseCoverAsThumb();
    }

    public function addLocationBase()
    {
        parent::addLocationBase();

        $this->addLocation('mod_groups', BX_DIRECTORY_PATH_MODULES . 'base' . DIRECTORY_SEPARATOR . 'groups' . DIRECTORY_SEPARATOR, BX_DOL_URL_MODULES . 'base/groups/');
    }

    function unitVars ($aData, $isCheckPrivateContent = true, $mixedTemplate = false, $aParams = array())
    {
        $aVars = parent::unitVars ($aData, $isCheckPrivateContent, $mixedTemplate, $aParams);

        $CNF = &$this->_oConfig->CNF;

        $oProfile = BxDolProfile::getInstance($aData[$CNF['FIELD_AUTHOR']]);
        if (!$oProfile) 
            $oProfile = BxDolProfileUndefined::getInstance();

        $aVars['title'] = (bool)$aVars['public'] ? bx_process_output($aData[$CNF['FIELD_NAME']]) : _t($CNF['T']['txt_private_group']);
        $aVars['description'] = '';
        if(!empty($CNF['FIELD_TEXT']) && !empty($aData[$CNF['FIELD_TEXT']]) && (bool)$aVars['public'])
            $aVars['description'] = strmaxtextlen(strip_tags($aData[$CNF['FIELD_TEXT']]), $this->_iUnitCharsSummary);

        $aVars['author'] = $oProfile->getDisplayName();
        $aVars['author_url'] = $oProfile->getUrl();
        $aVars['author_icon'] = $oProfile->getIcon();
        $aVars['author_thumb'] = $oProfile->getThumb();
        $aVars['author_avatar'] = $oProfile->getAvatar();

        return $aVars;
    }

    function prepareCover($aData, $aParams = [])
    {
        if($this->_oConfig->isUseCoverAsThumb())
            $aParams['show_avatar'] = false;

        return parent::prepareCover($aData, $aParams);
    }     

    public function getPopupSetRole($aRoles, $iProfileId, $iProfileRole)
    {
        if ($this->_bIsApi){
            $aTmplVarsRoles = array();
            foreach($aRoles as $iRole => $sRole){
                $aTmplVarsRoles[] = [
                    'value' => $iRole,
                    'label' => $sRole, 
                ];
            }
            return ['values' => $aTmplVarsRoles, 'value' => $iProfileRole];
        }
        
        $sJsObject = $this->_oConfig->getJsObject('main');
        $sHtmlIdPrefix = str_replace('_', '-', $this->_oConfig->getName()) . '-role';

        $aTmplVarsRoles = array();
        foreach($aRoles as $iRole => $sRole)
            $aTmplVarsRoles[] = array(
                'id' => $sHtmlIdPrefix . '-' . $iRole, 
                'value' => $iRole,
                'onclick' => $sJsObject . '.onClickSetRoleMulti(this, ' . $iProfileId . ', ' . $iRole . ')',
                'title' => $sRole, 
                'bx_if:show_checked' => array(
                    'condition' => $iRole != 0 && $iProfileRole & (1 << ($iRole - 1)),
                    'content' => array()
                )
            );

        return $this->parseHtmlByName('set_role_popup.html', array(
            'bx_repeat:roles' => $aTmplVarsRoles
        ));
    }
    
    public function getPopupQuestionnaire($iContentId, $iProfileId)
    {
        $aAnswers = $this->_oModule->_oDb->getQuestions(['sample' => 'answers', 'content_id' => $iContentId, 'profile_id' => $iProfileId]);
        if(empty($aAnswers) || !is_array($aAnswers))
            return $this->_bIsApi ? [] : '';

        $aTmplVarsAnswers = [];
        foreach($aAnswers as $aAnswer)
            $aTmplVarsAnswers[] = [
                'question' => $aAnswer['question'],
                'answer' => $aAnswer['answer'],
            ];

        if($this->_bIsApi)
            return $aTmplVarsAnswers;

        return $this->parseHtmlByName('popup_qnr_answers.html', ['bx_repeat:answers' => $aTmplVarsAnswers]);
    }

    public function getTimelineCardRecommendations($aParams)
    {
        $CNF = &$this->_oConfig->CNF;
        $sModule = $this->_oConfig->getName();
        
        $iProfileId = 0;
        if(!($iProfileId = bx_get_logged_profile_id()))
            return $this->_bIsApi ? [] : '';

        $oRecommendation = false;
        if(($sKey = 'OBJECT_RECOMMENDATIONS_FANS') && (empty($CNF[$sKey]) || !($oRecommendation = BxDolRecommendation::getObjectInstance($CNF[$sKey]))))
            return $this->_bIsApi ? [] : '';

        $sId = 'rc' . ((int)($aParams['start'] ?? 0) + (int)($aParams['event_index'] ?? 0));

        if($this->_bIsApi) {
            $aResult = [];
            if(($aCode = $oRecommendation->getCodeAPI($iProfileId, ['showcase' => true])) && is_array($aCode))
                $aResult = [
                    'id' => $sId,
                    'type' => 'timeline_recommendations',
                    'module' => $sModule,
                    'title' => _t($sModule . '_timeline_recommendations'),
                    'content' => array_merge($aCode, [
                        'page_url' => bx_api_get_relative_url(BX_DOL_URL_ROOT . BxDolPermalinks::getInstance()->permalink($CNF['URL_HOME'])),
                    ])
                ];

            return $aResult;
        }

        $sCode = $oRecommendation->getCode($iProfileId, ['showcase' => true]);
        if(!$sCode)
            return '';

        return $this->parseHtmlByName('timeline_post_recommendation.html', [
            'html_id' => $this->_oConfig->getHtmlIds('timeline_card_recommendations') . $sId,
            'class' => str_replace('_', '-', $sModule),
            'code' => $sCode
        ]) . $this->addCss(['timeline.css'], true);
    }

    protected function _getUnitClass($aData, $sTemplateName = 'unit.html')
    {
        $CNF = &$this->_oConfig->CNF;

        $sResult = '';
        
        switch($sTemplateName) {
            case 'unit_wo_cover.html':
                $sResult = $this->_sUnitClassWoCover;
                break;

            default:
                $sResult = parent::_getUnitClass($aData, $sTemplateName);
        }

        return $sResult . ' ' . str_replace('_', '-', $this->_oConfig->getName()) . '-unit-' . $aData[$CNF['FIELD_ID']];
    }

    protected function _getUnitSize($aData, $sTemplateName = 'unit.html')
    {
        $sResult = '';

        if($this->_isUnitCard($sTemplateName))
            return 'card';

        switch($sTemplateName) {
            case 'unit.html':
            case 'unit_with_cover.html':
                $sResult = 'ava';
                break;

            default:
                $sResult = $this->_sUnitSizeDefault;
                break;
        }

        return $sResult;
    }
    
    protected function _isUnitThumb($aData, $sTemplateName = 'unit.html')
    {
        $bResult = true;

        switch($sTemplateName) {
            case 'unit.html':
            case 'unit_with_cover.html':
            case 'unit_with_cover_showcase.html':
                $bResult = !$this->_oConfig->isUseCoverAsThumb();
                break;
        }

        return $bResult;
    }

    function _image ($sField, $sTranscodeObject, $sNoImage, $aData, $bSubstituteNoImage = true)
    {
        $CNF = &$this->_oConfig->CNF;
        if($sField == $CNF['FIELD_PICTURE'] && $this->_oConfig->isUseCoverAsThumb())
            $sField = $CNF['FIELD_COVER'];

        return parent::_image($sField, $sTranscodeObject, $sNoImage, $aData, $bSubstituteNoImage);
    }

    protected function _isTemplateWithMeta(string $sTemplateName = 'unit.html'): bool
    {
        $bResult = parent::_isTemplateWithMeta($sTemplateName);
        if (!$bResult && 'unit.html' == $sTemplateName)
            $bResult = true;
        return $bResult;
    }
}

/** @} */
