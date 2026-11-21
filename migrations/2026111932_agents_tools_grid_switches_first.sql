-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Studio > Agents > Tools: its three switches first, side by side (Agents, MCP for Operators, MCP for Users); the first
-- one says what it switches. Only where the columns are still as they were added.
UPDATE `sys_grid_fields` SET `title` = '_sys_agents_tools_txt_agents' WHERE `object` = 'sys_studio_agents_tools' AND `name` = 'switcher' AND `title` = '_sys_active';
UPDATE `sys_grid_fields` SET `order` = 11 WHERE `object` = 'sys_studio_agents_tools' AND `name` = 'mcp' AND `order` = 35;
UPDATE `sys_grid_fields` SET `order` = 12 WHERE `object` = 'sys_studio_agents_tools' AND `name` = 'mcp_members' AND `order` = 36;
