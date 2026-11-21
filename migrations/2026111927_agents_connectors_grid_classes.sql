-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Studio > Agents > Connectors: its two grids are one class each in studio/classes, as Studio's API keys grid is.
-- Only where they still have the classes they were added with.
UPDATE `sys_objects_grid` SET `override_class_name` = 'BxDolStudioAgentsConnectors' WHERE `object` = 'sys_studio_agents_connectors' AND `override_class_name` = 'BxTemplStudioAgentsConnectors';
UPDATE `sys_objects_grid` SET `override_class_name` = 'BxDolStudioAgentsMcpTools' WHERE `object` = 'sys_studio_agents_mcp_tools' AND `override_class_name` = 'BxTemplStudioAgentsMcpTools';
