<?php defined('BX_DOL') or die('hack attempt');
/*
 * UNA-Migration-Min-System-Version: 15.0.0-RC4
 * The MCP server's tools: `mcp` (operators) and `mcp_members` (every member) on each agent tool, switched in
 * Studio > Agents > Connectors. When `mcp` is added, operators start with the tools the operator agent has, so a site
 * that ran the earlier MCP migrations keeps what its operators had; a second run adds nothing and changes nothing.
 */

$bAdded = BxDolMigrationsHelper::addColumn('sys_agents_tools', 'mcp', "tinyint(4) NOT NULL DEFAULT 0 AFTER `active`");
BxDolMigrationsHelper::addColumn('sys_agents_tools', 'mcp_members', "tinyint(4) NOT NULL DEFAULT 0 AFTER `mcp`");

if ($bAdded) {
    BxDolDb::getInstance()->query("UPDATE `sys_agents_tools` SET `mcp` = 1 WHERE `type` IN ('content_structure', 'content_search', 'content_get', 'comments_get', 'mysql_schema', 'mysql_select', 'mysql_write_safe', 'mysql_undo', 'agent_create', 'mockup_upsert', 'splash_update')");
}

return true;
