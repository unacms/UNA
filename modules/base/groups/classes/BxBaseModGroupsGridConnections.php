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

class BxBaseModGroupsGridConnections extends BxDolGridConnections
{
    protected $_oModule;
    protected $_sContentModule;

    protected $_bRoles;
    protected $_aRoles;

    protected $_iGroupProfileId;
    protected $_aContentInfo = array();

    protected $_bPaidJoin;
    protected $_bMember;
    protected $_bManageMembers;
    
    protected $_sParamsDivider;

    protected $_sFilter1Name;
    protected $_sFilter1Value;
    protected $_aFilter1Values;

    public function __construct ($aOptions, $oTemplate = false)
    {
        $this->_oModule = BxDolModule::getInstance($this->_sContentModule);

        $CNF = &$this->_oModule->_oConfig->CNF;

        $this->_sObjectConnections = $CNF['OBJECT_CONNECTIONS'];

        parent::__construct ($aOptions, $oTemplate);
        if(!$this->_bInit) 
            return;

        $this->_bRoles = $this->_oModule->_oConfig->isRoles();
        $this->_aRoles = $this->_oModule->_oConfig->getRoles();

        $this->_iGroupProfileId = $this->_oProfile->id();

        $this->_aContentInfo = $this->_oModule->_oDb->getContentInfoById($this->_oProfile->getContentId());
        if($this->_oModule->checkAllowedEdit($this->_aContentInfo) === CHECK_ACTION_RESULT_ALLOWED || $this->_iGroupProfileId == bx_get_logged_profile_id())
            $this->_bOwner = true;

        $this->_bPaidJoin = $this->_oModule->isPaidJoinByProfile($this->_iGroupProfileId);

        $this->_bMember = $this->_oModule->isFan($this->_aContentInfo[$CNF['FIELD_ID']]);
        $this->_bManageMembers = $this->_oModule->checkAllowedManageFans($this->_iGroupProfileId) === CHECK_ACTION_RESULT_ALLOWED || $this->_oModule->checkAllowedManageAdmins($this->_iGroupProfileId) === CHECK_ACTION_RESULT_ALLOWED;

        $this->_sParamsDivider = '#-#';

        if($this->_bRoles) {
            $this->_sFilter1Name = 'frole';
            $this->_aFilter1Values = [];
            foreach($this->_aRoles as $iRoleId => $sRoleTitle)
                $this->_aFilter1Values[] = [
                    'key' => $this->_roleItoS($iRoleId), 
                    'value' => $sRoleTitle
                ];

            if(($sFilter1 = bx_get($this->_sFilter1Name))) {
                $this->_sFilter1Value = bx_process_input($sFilter1);
                $this->_aQueryAppend[$this->_sFilter1Name] = $this->_sFilter1Value;
            }
        }

        $aSQLParts = $this->_oConnection->getConnectedInitiatorsAsSQLParts('p', 'id', $this->_iGroupProfileId, $this->_bOwner ? false : true);
        if($this->_bRoles)
            $aSQLParts['join'] .= $this->_oModule->_oDb->prepareAsString(" LEFT JOIN `" . $CNF['TABLE_ADMINS'] . "` AS `ca` ON (`p`.`id` = `ca`.`fan_id` AND `ca`.`group_profile_id`= ?)", $this->_iGroupProfileId);

        $this->addMarkers([
            'profile_id' => $this->_iGroupProfileId,
            'join_connections' => $aSQLParts['join'],
            'content_module' => $this->_sContentModule,
        ]);
    }

    public function getCode ($isDisplayHeader = true)
    {
        $sResult = parent::getCode($isDisplayHeader);
        if(!$sResult)
            return $sResult;

        if($this->_bRoles)
            $sResult .= $this->_oModule->_oTemplate->getJsCode('main', array(
                'sObjNameGrid' => $this->_sObject,
            ));

        return $sResult;
    }

    public function performActionQuestionnaire()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(($mixedResult = $this->_oModule->checkAllowedManageAdmins($this->_iGroupProfileId)) !== CHECK_ACTION_RESULT_ALLOWED)
            return $this->_getActionResult(['msg' => $mixedResult]);

        if($this->_bIsApi)
            $iId = bx_get($CNF['FIELD_ID']);
        else
            list($iId, $iViewedId) = $this->_prepareIds();

        if(!$iId)
            return $this->_getActionResult(['msg' => _t('_sys_txt_error_occured')]);

        $sPopupContent = $this->_oModule->_oTemplate->getPopupQuestionnaire($this->_aContentInfo[$CNF['FIELD_ID']], $iId);
        if(!$sPopupContent)
            return $this->_getActionResult([]);

        if($this->_bIsApi)
            return [bx_api_get_block('simple_list',  $sPopupContent)];

        $oFunctions = BxTemplFunctions::getInstance();
        return $this->_getActionResult(['popup' => $oFunctions->transBox(str_replace('_', '-', $this->_sContentModule) . '-questionnaire-popup', $oFunctions->simpleBoxContent($sPopupContent))]);
    }

    public function performActionSetRole()
    {
        if(!$this->_bRoles)
            return $this->_getActionResult([]);

        if(($mixedResult = $this->_oModule->checkAllowedManageAdmins($this->_iGroupProfileId)) !== CHECK_ACTION_RESULT_ALLOWED)
            return $this->_getActionResult(['msg' => $mixedResult]);

        list($iId, $iViewedId) = $this->_prepareIds();
        if(!$iId)
            return $this->_getActionResult(['msg' => _t('_sys_txt_error_occured')]);

        if(empty($this->_aRoles) || !is_array($this->_aRoles))
            return $this->_getActionResult(['msg' => _t('_sys_txt_error_occured')]);

        $bMultiRoles = $this->_oModule->_oConfig->isMultiRoles();
        $iRole = $this->_oModule->_oDb->getRole($this->_iGroupProfileId, $iId);

        if(!$bMultiRoles) {
            $sJsObject = $this->_oModule->_oConfig->getJsObject('main');
            $sHtmlIdPrefix = str_replace('_', '-', $this->_sContentModule) . '-set-role-';

            $aMenuItems = [];
            foreach($this->_aRoles as $iRoleId => $sRoleTitle)
                $aMenuItems[] = $this->_bIsApi ? [
                    'value' => $iRoleId,
                    'label' => $sRoleTitle
                ] : [
                    'id' => $sHtmlIdPrefix . $iRoleId, 
                    'name' => $sHtmlIdPrefix . $iRoleId, 
                    'class' => '', 
                    'link' => 'javascript:void(0)', 
                    'onclick' => $sJsObject . '.onClickSetRole(' . $iId . ', ' . $iRoleId . ')',
                    'target' => '_self', 
                    'title' => $sRoleTitle, 
                    'active' => 1
                ];

            $oMenu = new BxTemplMenu(array('template' => 'menu_vertical.html', 'menu_id'=> $sHtmlIdPrefix . 'menu', 'menu_items' => $aMenuItems));
            if(!empty($iRole))
                $oMenu->setSelected('', $sHtmlIdPrefix . $iRole);
            if($this->_bIsApi)
                $sPopupContent = [
                    'values' => $aMenuItems,
                    'value' => $iRole
                ];
            else
                $sPopupContent = $oMenu->getCode();
        }
        else
            $sPopupContent = $this->_oModule->_oTemplate->getPopupSetRole($this->_aRoles, $iId, $iRole);

        if($this->_bIsApi) {
            $sPopupContent = array_merge($sPopupContent, [
                'multi' => (int)$bMultiRoles,
                'title' => _t('_' . $this->_sContentModule . '_txt_set_role'),
                'callback' => '/api.php?r=system/perfom_action_api/TemplServiceGrid/&params[]=&o=' . $this->_sObject . '&a=set_role_submit&profile_id=' . $this->_iGroupProfileId . '&content_module=' .  $this->_sContentModule .'&ids[]=' . $iId . '&'
            ]);

            return [bx_api_get_block('membership', $sPopupContent)];
        }

        $oFunctions = BxTemplFunctions::getInstance();
        return $this->_getActionResult(['popup' => $oFunctions->transBox(str_replace('_', '-', $this->_sContentModule) . '-set-role-popup', $oFunctions->simpleBoxContent($sPopupContent))]);
    }

    public function performActionSetRoleSubmit()
    {
        if(!$this->_bRoles)
            return $this->_getActionResult([]);

        if(($mixedResult = $this->_oModule->checkAllowedManageAdmins($this->_iGroupProfileId)) !== CHECK_ACTION_RESULT_ALLOWED)
            return $this->_getActionResult(['msg' => $mixedResult]);

        list($iId, $iViewedId) = $this->_prepareIds();

        if(!$iId)
            return $this->_getActionResult(['msg' => _t('_sys_txt_error_occured')]);

        if(!$this->_oModule->setRole($this->_iGroupProfileId, $iId, bx_process_input(bx_get('role'), BX_DATA_INT)))
            return $this->_getActionResult(['msg' => _t('_error occured')]);

        return $this->_getActionResult(!$this->_bIsApi ? ['grid' => $this->getCode(false), 'blink' => $iId] : []);
    }
    
    public function performActionDelete()
    {
        if ($this->_oModule->checkAllowedManageFans($this->_iGroupProfileId) !== CHECK_ACTION_RESULT_ALLOWED)
            return $this->_getActionResult(['msg' => _t('_sys_txt_access_denied')]);

        return parent::performActionDelete();
    }

    public function performActionAccept()
    {
        if ($this->_oModule->checkAllowedManageFans($this->_iGroupProfileId) !== CHECK_ACTION_RESULT_ALLOWED)
            return $this->_getActionResult(['msg' => _t('_sys_txt_access_denied')]);

        return parent::performActionAccept();
    }

    public function performActionDeleteAndBan()
    {
        if ($this->_oModule->checkAllowedManageFans($this->_iGroupProfileId) !== CHECK_ACTION_RESULT_ALLOWED)
            return $this->_getActionResult(['msg' => _t('_sys_txt_access_denied')]);

        $this->_replaceMarkers ();

        $aResult = [];
        $iAffected = 0;

        $aIds = bx_get('ids');
        if(!$aIds || !is_array($aIds))
            return $this->_getActionResult($aResult);

        $oConnection = BxDolConnection::getObjectInstance('sys_profiles_bans');

        foreach($aIds as $mixedId) {
            if(!$this->_delete($mixedId))
                continue;

            if($oConnection !== false) {
                list($iProfileId, $iContextId) = $this->__prepareIds($mixedId);

                $oConnection->addConnection($iContextId, $iProfileId, [
                    'module' => $this->_sContentModule
                ]);
            }

            $iAffected += 1;
        }

        if($iAffected)
            $aResult = !$this->_bIsApi ? ['grid' => $this->getCode(false)] : [];
        else
            $aResult = ['msg' => _t("_sys_grid_delete_failed")];

        return $this->_getActionResult($aResult);
    }

    protected function _getCellRole($mixedValue, $sKey, $aField, $aRow)
    {
        $iProfileRole = $this->_oModule->_oDb->getRole($this->_iGroupProfileId, $aRow[$this->_aOptions['field_id']]);

        if(!empty($iProfileRole) && $this->_oModule->_oConfig->isMultiRoles()) {
            $aRoles = array();
            foreach($this->_aRoles as $iRole => $sRole) {
                if(!$iRole)
                    continue;

                if($iProfileRole & (1 << ($iRole - 1)))
                    $aRoles[] = $sRole;
            }

            $mixedValue = implode(', ', $aRoles);
        }
        else 
            $mixedValue = !empty($this->_aRoles[$iProfileRole]) ? $this->_aRoles[$iProfileRole] : _t('_uknown');

        return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getCellHeaderRoleAdded($sKey, $aField)
    {
        if(!$this->_bPaidJoin || !($this->_bMember || $this->_bManageMembers))
            return $this->_bIsApi ? [] : '';

        return parent::_getCellHeaderDefault ($sKey, $aField);
    }

    protected function _getCellRoleAdded($mixedValue, $sKey, $aField, $aRow)
    {
        $mixedValue = '';
        if(!$this->_bPaidJoin || !($this->_bMember || $this->_bManageMembers))
            return $this->_bIsApi ? [] : $mixedValue;

        $iProfileId = (int)$aRow[$this->_aOptions['field_id']];
        if($this->_bManageMembers || $iProfileId == bx_get_logged_profile_id()) {
            $aRole = $this->_oModule->_oDb->getRoles(array('type' => 'by_gf_id', 'group_profile_id' => $this->_iGroupProfileId, 'fan_id' => $iProfileId));
            if(!empty($aRole) && is_array($aRole)) {
                if(!empty($aRole['added'])) {
                    if($this->_bIsApi)
                        return ['type' => 'time', 'data' => $aRole['added']];

                    $mixedValue = bx_time_js($aRole['added'], BX_FORMAT_DATE, true);
                }
                else {
                    if($this->_bIsApi)
                        return ['type' => 'text', 'data' => ''];

                    $mixedValue = '';
                }
            }
        }

        return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getCellHeaderRoleExpired($sKey, $aField)
    {
        if(!$this->_bPaidJoin || !($this->_bMember || $this->_bManageMembers))
            return $this->_bIsApi ? [] : '';
        
        return parent::_getCellHeaderDefault ($sKey, $aField);
    }

    protected function _getCellRoleExpired($mixedValue, $sKey, $aField, $aRow)
    {
        $mixedValue = '';
        if(!$this->_bPaidJoin || !($this->_bMember || $this->_bManageMembers))
            return $this->_bIsApi ? [] : '';

        $iProfileId = (int)$aRow[$this->_aOptions['field_id']];
        if($this->_bManageMembers || $iProfileId == bx_get_logged_profile_id()) {
            $aRole = $this->_oModule->_oDb->getRoles(array('type' => 'by_gf_id', 'group_profile_id' => $this->_iGroupProfileId, 'fan_id' => $iProfileId));
            if(!empty($aRole) && is_array($aRole)) {
                if(!empty($aRole['expired'])) {
                    if($this->_bIsApi)
                        return ['type' => 'time', 'data' => $aRole['expired']];

                    $mixedValue = bx_time_js($aRole['expired'], BX_FORMAT_DATE, true);
                }
                else {
                    if($this->_bIsApi)
                        return ['type' => 'text', 'data' => ''];

                    $mixedValue = '';
                }
            }
        }

        return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getActionQuestionnaire ($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = [])
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(!$this->_oModule->_oDb->areQuestionsAnswered($this->_aContentInfo[$CNF['FIELD_ID']], $aRow[$this->_aOptions['field_id']]))
            return $this->_bIsApi ? [] : '';

        return parent::_getActionDefault ($sType, $sKey, $a, $isSmall, $isDisabled, $aRow);
    }

    protected function _getActionSetRole ($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = [])
    {
        if ($this->_oModule->checkAllowedManageAdmins($this->_iGroupProfileId) !== CHECK_ACTION_RESULT_ALLOWED)
            return $this->_bIsApi ? [] : '';
        
        if($this->_bIsApi){
            $CNF = &$this->_oModule->_oConfig->CNF;
            return array_merge($a, [
                'name' => $sKey, 
                'type' => 'modal', 
                'callback' => 'system/perfom_action_api/TemplServiceGrid/&params[]=&o=' . $this->_sObject . '&a=set_role&profile_id=' . $this->_iGroupProfileId . '&content_module=' .  $this->_sContentModule .'&ids[]=' . $aRow['id'],
                'content_type' => $aRow['content_type']
            ]);
         }

        return parent::_getActionDefault ($sType, $sKey, $a, $isSmall, $isDisabled, $aRow);
    }

    protected function _getActionSetRoleSubmit ($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = [])
    {
        return $this->_bIsApi ? [] : '';
    }

    protected function _getActionAccept ($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = [])
    {
        if ($aRow['mutual'])
            return $this->_bIsApi ? [] : '';

        if ($this->_oModule->checkAllowedManageFans($this->_iGroupProfileId) !== CHECK_ACTION_RESULT_ALLOWED)
            return $this->_bIsApi ? [] : '';

        if (isset($aRow[$this->_aOptions['field_id']]))
            $a['attr']['bx_grid_action_data'] = $aRow[$this->_aOptions['field_id']] . ':' . $this->_iGroupProfileId;

        return parent::_getActionAccept($sType, $sKey, $a, $isSmall, $isDisabled, $aRow);
    }

    protected function _getActionDelete ($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = [])
    {
        if ($this->_oModule->checkAllowedManageFans($this->_iGroupProfileId) !== CHECK_ACTION_RESULT_ALLOWED)
            return $this->_bIsApi ? [] : '';

        if (isset($aRow[$this->_aOptions['field_id']]))
            $a['attr']['bx_grid_action_data'] = $aRow[$this->_aOptions['field_id']] . ':' . $this->_iGroupProfileId;

        return parent::_getActionDelete($sType, $sKey, $a, $isSmall, $isDisabled, $aRow);
    }

    protected function _getActionDeleteAndBan ($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = [])
    {
        return $this->_getActionDelete($sType, $sKey, $a, $isSmall, $isDisabled, $aRow);
    }

    /**
     * Note. Methods related to 'To Admin'/'From Admin' functionality can be removed after UNA 12 will be released.
     */
    protected function _getActionToAdmins ($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = [])
    {
        if ($this->_oModule->_oDb->isAdmin($this->_iGroupProfileId, $aRow[$this->_aOptions['field_id']]))
            return '';

        return $this->_getActionManageAdmins ($sType, $sKey, $a, $isSmall, $isDisabled, $aRow);
    }

    protected function _getActionFromAdmins ($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = [])
    {
        if (!$this->_oModule->_oDb->isAdmin($this->_iGroupProfileId, $aRow[$this->_aOptions['field_id']]))
            return '';

        return $this->_getActionManageAdmins ($sType, $sKey, $a, $isSmall, $isDisabled, $aRow);
    }

    protected function _getActionManageAdmins ($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = [])
    {
        if (!$this->_oConnection->isConnected($aRow[$this->_aOptions['field_id']], $this->_iGroupProfileId, true))
            return '';

        if ($this->_oModule->checkAllowedManageAdmins($this->_iGroupProfileId) !== CHECK_ACTION_RESULT_ALLOWED)
            return '';

        if (isset($aRow[$this->_aOptions['field_id']]))
            $a['attr']['bx_grid_action_data'] = $aRow[$this->_aOptions['field_id']] . ':' . $this->_iGroupProfileId;

        return parent::_getActionDefault ($sType, $sKey, $a, $isSmall, $isDisabled, $aRow);
    }

    /**
     * 'To Admins' action handler
     */
    public function performActionToAdmins()
    {
        $this->_performActionAdmins('toAdmins');
    }

    /**
     * 'From Admins' action handler
     */
    public function performActionFromAdmins()
    {
        $this->_performActionAdmins('fromAdmins');        
    }

    public function _performActionAdmins($sFunc)
    {
        list ($iId, $iGroupProfileId) = $this->_prepareIds();

        if (!$iId) {
            echoJson(array('msg' => _t('_sys_txt_error_occured')));
            exit;
        }

        if (CHECK_ACTION_RESULT_ALLOWED !== $this->_oModule->checkAllowedManageAdmins($iGroupProfileId)) {
            echoJson(array('msg' => _t('_sys_txt_access_denied')));
            exit;
        }
    
        if (!$this->_oModule->_oDb->$sFunc($iGroupProfileId, $iId)) {
            echoJson(array('msg' => _t('_sys_txt_error_occured')));
        } 
        else {

            $sEmailTemplate = 'toAdmins' == $sFunc ? $this->_oModule->_oConfig->CNF['EMAIL_FAN_BECOME_ADMIN'] : $this->_oModule->_oConfig->CNF['EMAIL_ADMIN_BECOME_FAN'];
            list($iGroupProfileId, $iProfileId) = $this->_prepareGroupProfileAndMemberProfile($iGroupProfileId, $iId);
            if (bx_get_logged_profile_id() != $iProfileId) {
                // notify about admin status
                sendMailTemplate($sEmailTemplate, 0, $iProfileId, array(
                    'EntryUrl' => BxDolProfile::getInstance($iGroupProfileId)->getUrl(),
                    'EntryTitle' => BxDolProfile::getInstance($iGroupProfileId)->getDisplayName(),
                ), BX_EMAIL_NOTIFY);
            }

            // subscribe admins automatically
            if ('toAdmins' == $sFunc && ($oConn = BxDolConnection::getObjectInstance('sys_profiles_subscriptions')))
                $oConn->addConnection($iProfileId, $iGroupProfileId);

            echoJson(array('grid' => $this->getCode(false), 'blink' => $iId));
        }
    }

    protected function _delete ($mixedId)
    {
        list ($iId, $iViewedId) = $this->_prepareIds();

        // send email notification
        $sEmailTemplate = $this->_oConnection->isConnected($iViewedId, $iId, true) ? $this->_oModule->_oConfig->CNF['EMAIL_FAN_REMOVE'] : $this->_oModule->_oConfig->CNF['EMAIL_JOIN_REJECT'];
        list($iGroupProfileId, $iProfileId) = $this->_prepareGroupProfileAndMemberProfile($iId, $iViewedId);
        if (bx_get_logged_profile_id() != $iProfileId) {
            sendMailTemplate($sEmailTemplate, 0, $iProfileId, array(
                'EntryUrl' => BxDolProfile::getInstance($iGroupProfileId)->getUrl(),
                'EntryTitle' => BxDolProfile::getInstance($iGroupProfileId)->getDisplayName(),
            ), BX_EMAIL_NOTIFY);
        }

        // delete admin associated with profile
        $this->_oModule->_oDb->deleteAdminsByGroupId($iGroupProfileId, $iProfileId);

        return parent::_delete ($mixedId);
    }

    /**
     * @return array where first element is group profile id and second element is some other persons profile id
     */
    protected function _prepareGroupProfileAndMemberProfile($iId1, $iId2)
    {
        if (BxDolProfile::getInstance($iId1)->getModule() == $this->_sContentModule)
            return array($iId1, $iId2);
        else
            return array($iId2, $iId1);
    }

    protected function _getFilterControls()
    {
        parent::_getFilterControls();

        $sResult = '';
        if($this->_bRoles && !empty($this->_sFilter1Name))
            $sResult .= $this->_getFilterSelectOne($this->_sFilter1Name, $this->_sFilter1Value, $this->_aFilter1Values);
        $sResult .= $this->_getSearchInput();

        return $sResult;
    }

    protected function _getFilterOnChange()
    {
        return $this->_oModule->_oConfig->getJsObject('main') . '.onChangeMembersFilter(this)';
    }

    protected function _addJsCss()
    {
        parent::_addJsCss();

        if($this->_bRoles) {
            $this->_oModule->_oTemplate->addCss(['main.css']);
            $this->_oModule->_oTemplate->addJs(['modules/base/groups/js/|main.js', 'main.js']);
            $this->_oModule->_oTemplate->addJsTranslation(['_sys_grid_search']);
        }
    }

    protected function _getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage)
    {
        $aFilterParts = explode($this->_sParamsDivider, $sFilter);
        switch (substr_count($sFilter, $this->_sParamsDivider)) {
            case 1:
                list($this->_sFilter1Value, $sFilter) = $aFilterParts;
                break;
        }

        if(strpos($this->_aOptions['source'], 'WHERE') === false)
            $this->_aOptions['source'] .= ' WHERE 1';

        if($this->_bRoles && !empty($this->_sFilter1Value)) {
            $this->_sFilter1Value = $this->_roleStoI($this->_sFilter1Value);

            $this->_aOptions['source'] .= $this->_oModule->_oDb->prepareAsString($this->_sFilter1Value == 0 ? " AND (ISNULL(`ca`.`role`) OR `ca`.`role` = ?)" : " AND `ca`.`role` = ?", $this->_sFilter1Value);
        }

        return parent::_getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage);
    }

    protected function _roleItoS($iRole)
    {
        return 'r' . $iRole;
    }

    protected function _roleStoI($sRole)
    {
        return (int)substr($sRole, 1);
    }
}

/** @} */
