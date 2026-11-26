<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Workspaces Workspaces
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * Workspace profiles module.
 */
class BxWorkspacesModule extends BxBaseModProfileModule
{
    function __construct(&$aModule)
    {
        parent::__construct($aModule);

        $this->_aSearchableNamesExcept[] = $this->_oConfig->CNF['FIELD_AUTHOR'];
    }
    
    /**
     * @page service Service Calls
     * @section bx_workspaces Workspaces 
     * @subsection bx_workspaces-other Other
     * @subsubsection bx_workspaces-get_search_options
     * 
     * @code bx_srv('bx_workspaces', 'get_search_options', [...]); @endcode
     * 
     * Get options for searchable fields
     * 
     * @return array - params or false.
     * 
     * @see BxWorkspacesModule::serviceGetSearchOptions
     */
    /** 
     * @ref bx_workspaces-get_search_options "get_search_options"
     */
    public function serviceGetSearchOptions ($sField, $sFieldType, $sSearchType)
    {
        $CNF = $this->_oConfig->CNF;
        if (isset($CNF['OBJECT_FORM_ENTRY']) && isset($CNF['OBJECT_FORM_ENTRY_DISPLAY_ADD'])){
            $oForm = BxDolForm::getObjectInstance($CNF['OBJECT_FORM_ENTRY'], $CNF['OBJECT_FORM_ENTRY_DISPLAY_ADD'], $this->_oTemplate);
            foreach ($oForm->aInputs as $aFld) {
                if ($aFld['name'] == $sField && $aFld['type'] == $sFieldType && isset($aFld['checker']) && isset($aFld['checker']['params'])){
                    return $aFld['checker']['params'];
                }
            }
        }
        
        if (isset($CNF['OBJECT_FORM_ENTRY']) && isset($CNF['OBJECT_FORM_ENTRY_DISPLAY_EDIT'])){
            $oForm = BxDolForm::getObjectInstance($CNF['OBJECT_FORM_ENTRY'], $CNF['OBJECT_FORM_ENTRY_DISPLAY_EDIT'], $this->_oTemplate);
            foreach ($oForm->aInputs as $aFld) {
                if ($aFld['name'] == $sField && $aFld['type'] == $sFieldType && isset($aFld['checker']) && isset($aFld['checker']['params'])){
                    return $aFld['checker']['params'];
                }
            }
        }
        
        return false;
    }

    public function serviceGetContextModules ()
    {
        $a = bx_srv('system', 'get_modules_by_subtype_simple', ['context']);
        return array_merge(['' => _t('_sys_please_select')], $a);
    }

    public function getSubtypes()
    {
        return pow(2, BX_DOL_MODULE_SUBTYPE_PROFILE);
    }

    /**
     * The context module members join to get a workspace (Studio option), when it is
     * installed, enabled and has a connection object for its members.
     */
    public function getContextModule()
    {
        $sModule = getParam('bx_workspaces_context_module');
        if(!$sModule || !BxDolModuleQuery::getInstance()->isEnabledByName($sModule))
            return '';

        $oModule = BxDolModule::getInstance($sModule);
        if(!$oModule || empty($oModule->_oConfig->CNF['OBJECT_CONNECTIONS']))
            return '';

        return $sModule;
    }

    /**
     * Connection object of the context module's members, '' when there is no context module.
     */
    public function getContextConnection()
    {
        $sModule = $this->getContextModule();
        return $sModule ? BxDolModule::getInstance($sModule)->_oConfig->CNF['OBJECT_CONNECTIONS'] : '';
    }

    /**
     * A workspace shows the name of the profile it was made from (its author). When that
     * profile is gone, another profile of the same account; then the name of a deleted profile.
     */
    public function getProfileName ($aContentInfo)
    {
        $CNF = &$this->_oConfig->CNF;

        $oBase = $this->getBaseProfile((int)$aContentInfo[$CNF['FIELD_AUTHOR']], (int)$aContentInfo[$CNF['FIELD_ID']]);
        return $oBase ? $oBase->getDisplayName() : BxDolProfileUndefined::getInstance()->getDisplayName();
    }

    /**
     * The profile a workspace stands for: its author, or another profile of its account
     * that isn't a workspace.
     * @return BxDolProfile|null
     */
    public function getBaseProfile($iAuthorProfileId, $iContentId = 0)
    {
        $oAuthor = $iAuthorProfileId ? BxDolProfile::getInstance($iAuthorProfileId) : null;
        if($oAuthor && $oAuthor->getModule() != $this->getName())
            return $oAuthor;

        $oProfile = $iContentId ? BxDolProfile::getInstanceByContentAndType($iContentId, $this->getName()) : null;
        if(!$oProfile || !($oAccount = $oProfile->getAccountObject()))
            return null;

        foreach($oAccount->getProfilesIds(false) as $iProfileId) {
            $o = BxDolProfile::getInstance($iProfileId);
            if($o && !in_array($o->getModule(), [$this->getName(), 'system']))
                return $o;
        }

        return null;
    }

    /**
     * Workspace profile of an account in a context; made when it has none.
     * @return int profile id, 0 when it can't be made
     */
    public function getOrCreateWorkspace($iAccountId, $iBaseProfileId, $iContextProfileId)
    {
        if(($iProfileId = $this->_oDb->getWorkspaceProfileId($iAccountId, $iContextProfileId)))
            return $iProfileId;

        $iContentId = $this->_oDb->insertWorkspace($iBaseProfileId, $iContextProfileId);
        if(!$iContentId)
            return 0;

        $iProfileId = (int)BxDolProfile::add(BX_PROFILE_ACTION_AUTO, $iAccountId, $iContentId, BX_PROFILE_STATUS_ACTIVE, $this->getName());
        if(!$iProfileId) {
            $this->_oDb->deleteWorkspace($iContentId);
            return 0;
        }

        $iAclLevel = (int)getParam($this->_oConfig->CNF['PARAM_DEFAULT_ACL_LEVEL']) ?: MEMBERSHIP_ID_STANDARD;
        BxDolAcl::getInstance()->setMembership($iProfileId, $iAclLevel, 0, true, '', false);

        // The account's profile switcher lists the new workspace, without switching to it.
        bx_content_cache_del('profile_switcher_' . (int)$iAccountId . '_0');
        bx_content_cache_del('profile_switcher_' . (int)$iAccountId . '_1');

        return $iProfileId;
    }

    /**
     * `connection_before_add` of the context's members connection: the member joins as their
     * workspace profile for that context, made on the first join.
     */
    public function onContextConnectionBeforeAdd($oAlert)
    {
        [$oContext, $oMember, $sMemberKey] = $this->_identifyContextAndMember($oAlert);
        if(!$oContext || !$oMember)
            return;

        $iAccountId = (int)$oMember->getAccountId();
        if(!$iAccountId)
            return;

        // A member acting as their workspace of another context joins as the profile it was made from.
        $oBase = $oMember;
        if($oMember->getModule() == $this->getName()) {
            $aData = $this->_oDb->getContentInfoById($oMember->getContentId());
            if(($aData[$this->_oConfig->CNF['FIELD_ALLOW_VIEW_TO']] ?? '') === (string)(-$oContext->id()))
                return; // already this context's workspace

            $oBase = $this->getBaseProfile((int)($aData[$this->_oConfig->CNF['FIELD_AUTHOR']] ?? 0), $oMember->getContentId());
            if(!$oBase || (int)$oBase->getAccountId() != $iAccountId)
                return;
        }

        $iWorkspace = $this->getOrCreateWorkspace($iAccountId, $oBase->id(), $oContext->id());
        if(!$iWorkspace)
            return; // the member joins as themselves rather than not at all

        $oAlert->aExtras[$sMemberKey] = $iWorkspace;

        // The workspace is already connected that way: nothing to add.
        $oConnection = $oAlert->aExtras['object'] ?? null;
        if($oConnection instanceof BxDolConnection && $oConnection->isConnected($oAlert->aExtras['initiator'], $oAlert->aExtras['content']))
            $oAlert->aExtras['override_result'] = true;

        // Whoever joined from their own account now acts as their workspace there.
        if($iAccountId == getLoggedId() && (int)bx_get_logged_profile_id() == $oMember->id())
            BxDolAccount::getInstance($iAccountId)->updateProfileContext($iWorkspace);
    }

    /**
     * `connection_removed` of the context's members connection: whoever left from their own
     * account acts as their own profile again.
     */
    public function onContextConnectionRemoved($oAlert)
    {
        [$oContext, $oMember] = $this->_identifyContextAndMember($oAlert);
        if(!$oContext || !$oMember || $oMember->getModule() != $this->getName())
            return;

        $iAccountId = (int)$oMember->getAccountId();
        if($iAccountId != getLoggedId() || (int)bx_get_logged_profile_id() != $oMember->id())
            return;

        $aData = $this->_oDb->getContentInfoById($oMember->getContentId());
        $oBase = $this->getBaseProfile((int)($aData[$this->_oConfig->CNF['FIELD_AUTHOR']] ?? 0), $oMember->getContentId());
        if($oBase && $oBase->getAccountId() == $iAccountId)
            BxDolAccount::getInstance($iAccountId)->updateProfileContext($oBase->id());
    }

    /**
     * The context and the member side of a connection alert.
     * @return array [context profile or null, member profile or null, 'initiator'|'content' of the member]
     */
    protected function _identifyContextAndMember($oAlert)
    {
        $sContextModule = $this->getContextModule();
        if(!$sContextModule)
            return [null, null, ''];

        $oInitiator = BxDolProfile::getInstance((int)($oAlert->aExtras['initiator'] ?? 0));
        $oContent = BxDolProfile::getInstance((int)($oAlert->aExtras['content'] ?? 0));
        if(!$oInitiator || !$oContent)
            return [null, null, ''];

        if($oContent->getModule() == $sContextModule && $oInitiator->getModule() != $sContextModule)
            return [$oContent, $oInitiator, 'initiator'];
        if($oInitiator->getModule() == $sContextModule && $oContent->getModule() != $sContextModule)
            return [$oInitiator, $oContent, 'content'];

        return [null, null, ''];
    }
}

/** @} */
