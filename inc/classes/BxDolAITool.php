<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

use NeuronAI\Tools\Tool;

class BxDolAITool extends Tool
{
    /**
     * Neuron AI 4.x Tool has no constructor: the identity is declared as properties.
     * Keeps the `parent::__construct($name, $description)` call of every UNA tool.
     */
    public function __construct(string $sName = '', ?string $sDescription = null)
    {
        if ($sName !== '')
            $this->name = $sName;
        $this->description = $sDescription;
    }

    /**
     * The profile a member's call through the MCP server acts as (BxDolMcpServer), 0 otherwise. Agents and operators
     * never set it, so their tools run as they always did; a tool that is isMemberSafe() checks the member's
     * permissions while it is set.
     */
    protected static $_iMemberScope = 0;

    /**
     * The authenticated profile that invoked the tool (an MCP operator or member). 0 in an agent's own chat,
     * where the bot profile from the SQL log context is the only identity available.
     */
    protected static $_iCallerProfile = 0;

    public static function setMemberScope(int $iProfileId): void
    {
        self::$_iMemberScope = max(0, $iProfileId);
    }

    public static function getMemberScope(): int
    {
        return self::$_iMemberScope;
    }

    public static function setCallerProfile(int $iProfileId): void
    {
        self::$_iCallerProfile = max(0, $iProfileId);
    }

    public static function getCallerProfile(): int
    {
        return self::$_iCallerProfile;
    }

    /**
     * Whether the tool may be given through the MCP server at all (BxDolMcpServer), to operators or members; a tool
     * that can do what no assistant should, or that works only inside an agent's chat, says no.
     */
    public static function isMcpAllowed(): bool
    {
        return true;
    }

    /**
     * Whether the tool may be given to members (Studio > Agents > Tools): while a member's call runs
     * (getMemberScope()) it acts as that member, with the permission checks the site makes for them.
     */
    public static function isMemberSafe(): bool
    {
        return false;
    }

    /**
     * Arguments a member's call never chooses: the MCP server leaves them out of the tool's schema and sets them to
     * the member's profile.
     * @return string[]
     */
    public static function memberScopedArgs(): array
    {
        return [];
    }

    /**
     * Act as a profile for the rest of the call. In a member's call the member's own profile, whatever was asked.
     * @return int what endActingAs() puts back
     */
    protected function actAs(int $iProfileId): int
    {
        $iPrevious = (int)($GLOBALS['glForceCurrentProfileId'] ?? 0);
        if (self::$_iMemberScope)
            $iProfileId = self::$_iMemberScope;
        if ($iProfileId)
            $GLOBALS['glForceCurrentProfileId'] = $iProfileId;
        return $iPrevious;
    }

    /**
     * After actAs(): back to the member in a member's call (the request goes on as them), 0 otherwise, as the
     * tools always left it.
     */
    protected function endActingAs(int $iPrevious): void
    {
        $GLOBALS['glForceCurrentProfileId'] = self::$_iMemberScope ? $iPrevious : 0;
    }

    /**
     * In a member's call: whether the member may do $sAction ('view', 'add', 'edit', 'delete') with an item of a
     * content module, as the module decides on the site. Accounts, profiles and what is not a content module are
     * refused.
     * @return array|null an error for the tool to return, null when it is allowed
     */
    protected function memberContentError(string $sModule, int $iContentId, string $sAction): ?array
    {
        if (!self::$_iMemberScope)
            return null;

        if (!BxDolModuleQuery::getInstance()->isEnabledByName($sModule) || !($oModule = BxDolModule::getInstance($sModule)) || !isset($oModule->_oDb) || !method_exists($oModule->_oDb, 'getContentInfoById'))
            return ['code' => 404, 'error' => 'Content module "' . $sModule . '" was not found'];

        if (BxDolRequest::serviceExists($sModule, 'act_as_profile') && bx_srv($sModule, 'act_as_profile'))
            return ['code' => 403, 'error' => 'Profiles are changed on the site, not with this tool'];

        if ($sAction === 'add') {
            $mixedResult = method_exists($oModule, 'checkAllowedAdd') ? $oModule->checkAllowedAdd() : false;
        }
        else {
            $aContentInfo = $oModule->_oDb->getContentInfoById($iContentId);
            if (empty($aContentInfo))
                return ['code' => 404, 'error' => 'Content item was not found'];

            $sMethod = ['view' => 'checkAllowedView', 'edit' => 'checkAllowedEdit', 'delete' => 'checkAllowedDelete'][$sAction] ?? '';
            $mixedResult = $sMethod && method_exists($oModule, $sMethod) ? $oModule->$sMethod($aContentInfo) : false;
        }

        if ($mixedResult === CHECK_ACTION_RESULT_ALLOWED)
            return null;

        return ['code' => 403, 'error' => is_string($mixedResult) && $mixedResult !== '' ? strip_tags($mixedResult) : _t('_sys_txt_access_denied')];
    }

    /**
     * In a member's call: whether the member may do $sAction ('view', 'post', 'edit') with the comments of an item.
     * @return array|null an error for the tool to return, null when it is allowed
     */
    protected function memberCmtsError($oCmts, string $sAction, int $iCmtId = 0): ?array
    {
        if (!self::$_iMemberScope)
            return null;

        // isViewAllowed() answers CHECK_ACTION_RESULT_ALLOWED (0) or a message; the others true or false
        $bView = $oCmts->isViewAllowed() === CHECK_ACTION_RESULT_ALLOWED;
        if ($sAction === 'post')
            $bAllowed = $bView && $oCmts->isPostAllowed() === true;
        elseif ($sAction === 'edit')
            $bAllowed = $bView && ($aCmt = $oCmts->getCommentRow($iCmtId)) && $oCmts->isEditAllowed($aCmt) === true;
        else
            $bAllowed = $bView;

        return $bAllowed ? null : ['code' => 403, 'msg' => _t('_sys_txt_access_denied')];
    }

    function getContentModules()
    {
        $a = bx_srv('system', 'modules_list', [true, true], 'TemplServiceContent');
        return implode(', ', $a);
    }

    function convertArrayToKeyValue($data) {
        $result = [];
        
        foreach ($data as $item) {
            if (isset($item['name']) && isset($item['value'])) {
                $result[$item['name']] = $item['value'];
            }
        }
        
        return $result;
    }

    protected function adminLog(string $sObjectType, string $sObjectId, string $sAction, $mixedBefore, $mixedAfter): void
    {
        try {
            $aCtx = BxDolAIToolMysqlWrite::currentLogContext();
            BxDolAdminLog::record([
                'source' => 'agent',
                'agent_id' => (int)($aCtx['agent_id'] ?? 0),
                'profile_id' => BxDolAdminLog::callerProfile((int)($aCtx['profile_id'] ?? 0)),
                'thread_id' => (string)($aCtx['thread_id'] ?? ''),
                'object_type' => $sObjectType,
                'object_id' => $sObjectId,
                'action' => $sAction,
                'before' => $mixedBefore,
                'after' => $mixedAfter,
            ]);
        }
        catch (Throwable $e) {
            bx_log('sys_audit', $e->getMessage(), BX_LOG_ERR);
        }
    }

    protected function adminLogOk($mixed): bool
    {
        if ($mixed === true)
            return true;
        if (!is_array($mixed))
            return false;
        if (isset($mixed['code']) && (int)$mixed['code'] !== 0)
            return false;
        if (!empty($mixed['error']))
            return false;
        if (!empty($mixed['msg']) && !isset($mixed['code']))
            return false;

        return true;
    }

    protected function adminLogId($mixed): string
    {
        if (!is_array($mixed))
            return '';

        foreach (['id', 'content_id', 'cmt_id', 'comment_id', 'account_id'] as $sKey)
            if (isset($mixed[$sKey]) && !is_array($mixed[$sKey]) && (string)$mixed[$sKey] !== '' && (string)$mixed[$sKey] !== '0')
                return (string)$mixed[$sKey];

        if (isset($mixed['content']) && is_array($mixed['content']))
            return $this->adminLogId($mixed['content']);

        return '';
    }
}
