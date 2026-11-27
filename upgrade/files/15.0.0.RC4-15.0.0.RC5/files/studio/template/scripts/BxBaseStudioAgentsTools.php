<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

class BxBaseStudioAgentsTools extends BxDolStudioAgentsInstruments
{
    protected $_sUrlPage;

    public function __construct ($aOptions, $oTemplate = false)
    {
        parent::__construct ($aOptions, $oTemplate);

        $this->_sUrlPage = BX_DOL_URL_STUDIO . 'agents.php?page=tools';
        // the operator's own tools are listed for their MCP switch, locked for agents (isLocked()); the tools every
        // agent has in code are not, there is nothing to switch
        if (!empty($this->_aOptions['source']) && is_string($this->_aOptions['source']))
            $this->_aOptions['source'] = BxDolAiAgentTools::excludeFromToolsGrid($this->_aOptions['source']);
    }

    public function performActionDuplicate()
    {
        if ($this->_isLockedId((int)$this->_getId()))
            return $this->_getActionResult(['msg' => _t('_sys_agents_tools_err_locked')]);

        return parent::_performActionDuplicate('getToolById', 'insertTool');
    }

    public function performActionEdit()
    {
        if ($this->_isLockedId((int)$this->_getId()))
            return $this->_getActionResult(['msg' => _t('_sys_agents_tools_err_locked')]);

        return $this->_performActionEdit('getToolById', '_sys_agents_tools_popup_edit');
    }

    /**
     * A tool the operator agent has in code (BxDolAiAgentTools::OPERATOR): agents can't be given it and it can't be
     * edited, copied, deleted or switched off for agents; only its MCP switch is the operator's to turn.
     */
    public static function isLocked(array $aRow): bool
    {
        return BxDolAiAgentTools::isOperatorOnly((string)($aRow['type'] ?? ''));
    }

    protected function _isLockedId(int $iId): bool
    {
        $aRow = $iId ? BxDolAiQuery::getToolObject($iId) : false;
        return $aRow && self::isLocked($aRow);
    }

    protected function _enable ($mixedId, $isChecked)
    {
        if ($this->_isLockedId((int)$mixedId))
            return false;

        return parent::_enable($mixedId, $isChecked);
    }

    protected function _getCellSwitcher ($mixedValue, $sKey, $aField, $aRow)
    {
        if (self::isLocked($aRow))
            return parent::_getCellDefault('<span class="bx-def-font-grayed">' . _t('_sys_agents_tools_txt_operator_agent') . '</span>', $sKey, $aField, $aRow);

        return parent::_getCellSwitcher($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getActionEdit ($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = [])
    {
        if ($sType == 'single' && self::isLocked($aRow))
            return '';

        return parent::_getActionDefault($sType, $sKey, $a, $isSmall, $isDisabled, $aRow);
    }

    protected function _getActionDuplicate ($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = [])
    {
        if ($sType == 'single' && self::isLocked($aRow))
            return '';

        return parent::_getActionDefault($sType, $sKey, $a, $isSmall, $isDisabled, $aRow);
    }

    protected function _getForm($sAction = '', $aTool = [])
    {
        $sJsObject = $this->getPageJsObject();
    
        if (empty($aTool['params_user'])) {
            $aTool['params_user'] = $aTool['params'];
        }

        $data = json_decode($aTool['params_user'], true);
        $aTool['params_user'] = json_encode($data, JSON_PRETTY_PRINT);

        $oParsedown = new Parsedown();
        $oParsedown->setSafeMode(false);
        $sDocs = $oParsedown->text($aTool['docs']);

        return [
            'form_attrs' => [
                'id' => 'bx_std_agents_tools_' . $sAction,
                'action' => BX_DOL_URL_ROOT . 'grid.php?o=sys_studio_agents_tools&a=' . $sAction,
                'method' => 'post',
            ],
            'params' => array (
                'db' => array(
                    'table' => 'sys_agents_tools',
                    'key' => 'id',
                    'submit_name' => 'do_submit',
                ),
            ),
            'inputs' => [
                'docs' => [
                    'type' => 'custom',
                    'name' => 'docs',
                    'caption' => '',
                    'content' => $sDocs,
                ],
                'title' => [
                    'type' => 'text',
                    'name' => 'title',
                    'caption' => _t('_sys_agents_field_title'),
                    'required' => true,
                    'value' => !empty($aTool['title']) ? $aTool['title'] : '',
                    'db' => [
                        'pass' => 'Xss'
                    ]
                ],
                'params_user' => [
                    'type' => 'textarea',
                    'name' => 'params_user',
                    'caption' => _t('_sys_agents_tools_field_params'),
                    'info' => _t('_sys_agents_tools_field_params_info'),
                    'required' => false,
                    'value' => !empty($aTool['params_user']) ? $aTool['params_user'] : '',
                    'checker' => [
                        'func' => 'Json',
                        'params' => ['allow_empty' => true],
                        'error' => _t('_sys_agents_json_field_err'),
                    ],
                    'db' => [
                        'pass' => 'All'
                    ]
                ],
                'submit' => $this->_getFormControls(),
            ]
        ];
    }

    /**
     * The MCP server's switches (BxDolMcpServer): give the tool to operators.
     */
    public function performActionMcp()
    {
        return $this->_switchMcp('mcp');
    }

    /**
     * The MCP server's switches: give the tool to every member, only a tool made for it (BxDolAITool::isMemberSafe()).
     */
    public function performActionMcpMembers()
    {
        return $this->_switchMcp('mcp_members');
    }

    protected function _switchMcp($sFlag)
    {
        $aIds = bx_get('ids');
        if (!$aIds || !is_array($aIds))
            return $this->_getActionResult([]);

        $bOn = (int)bx_get('checked') === 1;
        foreach ($aIds as $mixedId) {
            $aRow = BxDolAiQuery::getToolObject((int)$mixedId);
            if (!$aRow || !BxDolAIToolFactory::isMcpAllowed($aRow))
                continue;
            // members get only the tools made for them
            if ($sFlag === 'mcp_members' && $bOn && !BxDolMcpServer::isMemberSafeTool($aRow))
                return $this->_getActionResult(['msg' => _t('_sys_agents_mcp_err_not_for_members'), 'grid' => $this->getCode(false)]);

            $this->_oDb->setToolMcpFlag((int)$aRow['id'], $sFlag, $bOn);
        }

        return $this->_getActionResult([]);
    }

    protected function _getCellMcp ($mixedValue, $sKey, $aField, $aRow)
    {
        if (!BxDolAIToolFactory::isMcpAllowed($aRow))
            return parent::_getCellDefault('<span class="bx-def-font-grayed">&mdash;</span>', $sKey, $aField, $aRow);

        return $this->_getCellSwitcherFor('mcp', 'mcp', _t('_sys_agents_mcp_txt_operators'), $sKey, $aField, $aRow);
    }

    protected function _getCellMcpMembers ($mixedValue, $sKey, $aField, $aRow)
    {
        if (!BxDolAIToolFactory::isMcpAllowed($aRow))
            return parent::_getCellDefault('<span class="bx-def-font-grayed">&mdash;</span>', $sKey, $aField, $aRow);

        if (!BxDolMcpServer::isMemberSafeTool($aRow))
            return parent::_getCellDefault('<span class="bx-def-font-grayed">' . _t('_sys_agents_mcp_txt_operators_only') . '</span>', $sKey, $aField, $aRow);

        return $this->_getCellSwitcherFor('mcp_members', 'mcp_members', _t('_sys_agents_mcp_txt_members'), $sKey, $aField, $aRow);
    }

    protected function _delete ($mixedId)
    {
        $aTool = $this->_oDb->getToolById($mixedId);
        if (empty($aTool) || $aTool['duplicate'] == 0)
            return false;

        return parent::_delete($mixedId);
    }
}

/** @} */
