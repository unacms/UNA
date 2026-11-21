-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Studio > Agents > Connectors: the grid of which agent tools the MCP server gives to operators and to every member.
-- sys_objects_grid and sys_grid_fields have unique keys on the object (and name), so INSERT IGNORE leaves rows that are
-- already there alone.
INSERT IGNORE INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `responsive`, `show_total_count`, `override_class_name`, `override_class_file`) VALUES
('sys_studio_agents_mcp_tools', 'Sql', 'SELECT * FROM `sys_agents_tools` WHERE `type` NOT IN (''chat_buttons'', ''chat_title'', ''chat_artifact_save'', ''chat_goal_reached'', ''prompt_feedback'') ', 'sys_agents_tools', 'id', 'id', '', '', 50, NULL, 'start', '', 'title,type', '', 'like', '', '', 128, 1, 0, 'BxTemplStudioAgentsMcpTools', '');

INSERT IGNORE INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `hidden_on`, `order`) VALUES
('sys_studio_agents_mcp_tools', 'title', '_Title', '40%', 0, 0, '', '', 10),
('sys_studio_agents_mcp_tools', 'type', '_adm_form_txt_fields_type', '20%', 0, 0, '', '', 20),
('sys_studio_agents_mcp_tools', 'mcp', '_sys_agents_mcp_txt_operators', '20%', 0, 0, '', '', 30),
('sys_studio_agents_mcp_tools', 'mcp_members', '_sys_agents_mcp_txt_members', '20%', 0, 0, '', '', 40);
