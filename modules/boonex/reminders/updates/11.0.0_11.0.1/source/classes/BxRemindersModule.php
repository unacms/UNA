<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Reminders Reminders
 * @ingroup     UnaModules
 *
 * @{
 */

class BxRemindersModule extends BxBaseModGeneralModule
{
    function __construct(&$aModule)
    {
        parent::__construct($aModule);

        $this->_oConfig->init($this->_oDb);
    }

    public function actionMain()
    {
        return echoJson(array());
    }


    /**
     * Service methods
     */
    public function serviceGetOptionsSystemProfileId()
    {
        $aResult = array(
            array('key' => '', 'value' => _t('_Select_one'))
        );

        $oProfile = BxDolProfile::getInstance();

        $aAccIds = BxDolAccountQuery::getInstance()->getOperators();
        foreach($aAccIds as $iAccId) {
            $aPrfIds = BxDolAccount::getInstance($iAccId)->getProfilesIds();
            foreach($aPrfIds as $iPrfId) {
                $aResult[] = array(
                    'key' => $iPrfId,
                    'value' => $oProfile->getDisplayName($iPrfId)
                );
            }
        }

        return $aResult;
    }

    public function serviceGetBlockView($iProfileId = 0)
    {
        if(!isLogged())
            return '';

        if(!$iProfileId)
            $iProfileId = bx_get_logged_profile_id();

        return $this->_oTemplate->getBlockView($iProfileId);
    }

    public function serviceGetNotificationsData()
    {
    	$sModule = $this->_aModule['name'];

        return array(
            'handlers' => array(
                array('group' => $sModule . '_object', 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'added', 'module_name' => $sModule, 'module_method' => 'get_notifications_post', 'module_class' => 'Module', 'module_event_privacy' => ''),
            ),
            'settings' => array(
                array('group' => 'content', 'unit' => $sModule, 'action' => 'added', 'types' => array('personal')),
            ),
            'alerts' => array(
                array('unit' => $sModule, 'action' => 'added'),
            )
        );
    }

    public function serviceGetNotificationsPost($aEvent)
    {
        $CNF = &$this->_oConfig->CNF;

        $aEntry = $this->_oDb->getEntry(array('type' => 'id', 'id' => $aEvent['object_id'], 'full' => true));
        if(empty($aEntry) || !is_array($aEntry))
            return array();

        $aReturn = array(
            'entry_sample' => $CNF['T']['txt_sample_single'],
            'entry_url' => bx_absolute_url(str_replace(BX_DOL_URL_ROOT, '', $this->getEntryUrl($aEntry)), '{bx_url_root}'),
            'lang_key' => $aEntry[$CNF['FIELD_TEXT']]
        );

        $aParams = unserialize($aEntry['params']);
        if(!empty($aParams) && is_array($aParams))
            $aReturn = array_merge($aReturn, $aParams);

        return $aReturn;
    }

    public function serviceCheckAllowedWithContent($sAction, $iContentId, $isPerformAction = false)
    {
        return CHECK_ACTION_RESULT_ALLOWED;
    }


    /**
     * Permissions methods
     */
    protected function _serviceCheckAllowedViewForProfile ($aDataEntry, $isPerformAction, $iProfileId)
    {
        if(!$iProfileId)
            $iProfileId = $this->_iProfileId;

        if(empty($aDataEntry) || !is_array($aDataEntry))
            return _t('_sys_txt_not_found');

        $oProfile = BxDolProfile::getInstance($iProfileId);
        if(!$oProfile)
            return _t('_sys_txt_not_found');

        if(isAdmin($oProfile->getAccountId()))
            return CHECK_ACTION_RESULT_ALLOWED;

        $aCheckResult = checkActionModule($iProfileId, 'view', $this->getName(), $isPerformAction);
        if($aCheckResult[CHECK_ACTION_RESULT] !== CHECK_ACTION_RESULT_ALLOWED)
            return $aCheckResult[CHECK_ACTION_MESSAGE];
     
        return CHECK_ACTION_RESULT_ALLOWED;
    }

    public function checkAllowedEditAnyEntry ($isPerformAction = false)
    {
        return _t('_sys_txt_access_denied');
    }

    public function checkAllowedEditAnyEntryForProfile ($isPerformAction = false, $iProfileId = false)
    {
        return _t('_sys_txt_access_denied');
    }

    /**
     * Auxiliary methods
     */
    public function getEntryUrl(&$aEntry)
    {
        $aParams = unserialize($aEntry['params']);

        $sResult = '';
        if(!empty($aEntry['link']))
            $sResult = bx_replace_markers($aEntry['link'], $aParams);
        else if(!empty($aParams['profile_link']))
            $sResult = $aParams['profile_link'];
        else if(!empty($aParams['profile_id']))
            $sResult = $oProfile->getUrl((int)$aParams['profile_id']);
        else
            $sResult = 'javascript:void(0)';

        return $sResult;
    }
}

/** @} */
