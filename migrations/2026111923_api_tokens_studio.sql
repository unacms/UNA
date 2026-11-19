-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Studio > Agents > Connectors as a Studio grid: the operator's own personal access tokens, drawn as Studio's other
-- grids are. sys_objects_grid, sys_grid_fields and sys_grid_actions have unique keys on the object (and name), so
-- INSERT IGNORE leaves rows that are already there alone.
INSERT IGNORE INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `responsive`, `show_total_count`, `override_class_name`, `override_class_file`) VALUES
('sys_studio_agents_connectors', 'Sql', 'SELECT `id`, `title`, `hint`, `added`, `expires`, `last_used` FROM `sys_api_tokens` WHERE `account_id` = {account_id} ', 'sys_api_tokens', 'id', '', '', '', 20, NULL, 'start', '', '', '', 'auto', '', '', 128, 1, 0, 'BxTemplStudioAgentsConnectors', '');

INSERT IGNORE INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `hidden_on`, `order`) VALUES
('sys_studio_agents_connectors', 'title', '_sys_api_tokens_txt_title', '25%', 0, 0, '', '', 10),
('sys_studio_agents_connectors', 'hint', '_sys_api_tokens_txt_hint', '15%', 0, 0, '', '', 20),
('sys_studio_agents_connectors', 'added', '_sys_api_tokens_txt_added', '15%', 0, 0, '', '', 30),
('sys_studio_agents_connectors', 'last_used', '_sys_api_tokens_txt_last_used', '15%', 0, 0, '', '', 40),
('sys_studio_agents_connectors', 'expires', '_sys_api_tokens_txt_expires', '15%', 0, 0, '', '', 50),
('sys_studio_agents_connectors', 'actions', '', '15%', 0, 0, '', '', 60);

INSERT IGNORE INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `active`, `order`) VALUES
('sys_studio_agents_connectors', 'independent', 'add', '_sys_api_tokens_btn_add', '', 0, 0, 1, 10),
('sys_studio_agents_connectors', 'single', 'delete', '_sys_api_tokens_btn_revoke', 'remove', 1, 1, 1, 20);
