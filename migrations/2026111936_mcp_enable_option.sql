-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- The MCP server's own switch (Studio > Agents > Settings), off as added: /api/mcp, its discovery documents and the
-- registration of MCP clients work only while it is on, apart from API v2's switch. sys_options has a unique key on the
-- name, so INSERT IGNORE leaves an admin's own value alone.
INSERT IGNORE INTO `sys_options` (`category_id`, `name`, `caption`, `info`, `value`, `type`, `extra`, `check`, `check_error`, `order`)
SELECT `id`, 'sys_mcp_enable', '_adm_stg_cpt_option_sys_mcp_enable', '_adm_stg_cpt_option_sys_mcp_enable_info', '', 'checkbox', '', '', '', 10
FROM `sys_options_categories` WHERE `name` = 'agents_general';
