-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- The MCP switches (operators, members) are columns of Studio > Agents > Tools, not a grid of their own on Connectors.
-- sys_grid_fields has a unique key on the object and name, so INSERT IGNORE leaves rows that are already there alone.
INSERT IGNORE INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `hidden_on`, `order`) VALUES
('sys_studio_agents_tools', 'mcp', '_sys_agents_mcp_txt_operators', '10%', 0, 0, '', '', 35),
('sys_studio_agents_tools', 'mcp_members', '_sys_agents_mcp_txt_members', '10%', 0, 0, '', '', 36);

DELETE FROM `sys_grid_fields` WHERE `object` = 'sys_studio_agents_mcp_tools';
DELETE FROM `sys_grid_actions` WHERE `object` = 'sys_studio_agents_mcp_tools';
DELETE FROM `sys_objects_grid` WHERE `object` = 'sys_studio_agents_mcp_tools';
