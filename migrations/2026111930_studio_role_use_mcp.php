<?php defined('BX_DOL') or die('hack attempt');
/*
 * UNA-Migration-Min-System-Version: 15.0.0-RC4
 * A Studio role action (Studio > Roles): whether an operator uses the operator tools of the MCP server
 * (BxDolMcpServer). Every role gets it when it is added; a second run adds nothing, so a role an admin took it from
 * stays without it.
 */

$oDb = BxDolDb::getInstance();

if ($oDb->getOne("SELECT `id` FROM `sys_std_roles_actions` WHERE `name` = 'use mcp' LIMIT 1"))
    return true;

$oDb->query("INSERT INTO `sys_std_roles_actions` (`name`, `title`, `description`) VALUES ('use mcp', '_adm_rl_txt_action_use_mcp', '_adm_rl_txt_action_use_mcp_dsc')");
$iActionId = (int)$oDb->lastId();
if (!$iActionId)
    return false;

$oDb->query("INSERT IGNORE INTO `sys_std_roles_actions2roles` (`role_id`, `action_id`) SELECT `id`, :action FROM `sys_std_roles`", ['action' => $iActionId]);

return true;
