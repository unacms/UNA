<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

/**
 * Studio > Agents > Connectors: which agent tools the MCP server (BxDolMcpServer) gives, to operators (`mcp`) and to
 * every member (`mcp_members`). Only a tool made for members (BxDolAITool::isMemberSafe()) has the members' switch.
 * The Tools tab and the agents keep using the tools as before.
 */
class BxBaseStudioAgentsMcpTools extends BxTemplStudioGridAgents
{
    public function __construct ($aOptions, $oTemplate = false)
    {
        parent::__construct ($aOptions, $oTemplate);

        $this->_sDefaultSortingOrder = 'ASC';
    }

    public function performActionMcp()
    {
        return $this->_switchMcp('mcp');
    }

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
        $oQuery = new BxDolAiQuery();
        foreach ($aIds as $mixedId) {
            $aRow = BxDolAiQuery::getToolObject((int)$mixedId);
            if (!$aRow || !BxDolMcpServer::isOperatorToolType((string)$aRow['type']))
                continue;
            // members get only the tools made for them
            if ($sFlag === 'mcp_members' && $bOn && !BxDolMcpServer::isMemberSafeTool($aRow))
                return $this->_getActionResult(['msg' => _t('_sys_agents_mcp_err_not_for_members'), 'grid' => $this->getCode(false)]);

            $oQuery->setToolMcpFlag((int)$aRow['id'], $sFlag, $bOn);
        }

        return $this->_getActionResult([]);
    }

    protected function _getCellTitle ($mixedValue, $sKey, $aField, $aRow)
    {
        $s = bx_process_output($mixedValue);
        if (empty($aRow['active']))
            $s .= ' <span class="bx-def-font-grayed">(' . _t('_sys_agents_mcp_txt_tool_off') . ')</span>';

        return parent::_getCellDefault($s, $sKey, $aField, $aRow);
    }

    protected function _getCellMcp ($mixedValue, $sKey, $aField, $aRow)
    {
        return $this->_getCellSwitcherFor('mcp', 'mcp', _t('_sys_agents_mcp_txt_operators'), $sKey, $aField, $aRow);
    }

    protected function _getCellMcpMembers ($mixedValue, $sKey, $aField, $aRow)
    {
        if (!BxDolMcpServer::isMemberSafeTool($aRow))
            return parent::_getCellDefault('<span class="bx-def-font-grayed">' . _t('_sys_agents_mcp_txt_operators_only') . '</span>', $sKey, $aField, $aRow);

        return $this->_getCellSwitcherFor('mcp_members', 'mcp_members', _t('_sys_agents_mcp_txt_members'), $sKey, $aField, $aRow);
    }
}

/** @} */
