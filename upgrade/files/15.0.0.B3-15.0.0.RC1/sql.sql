
SET @sStorageEngine = (SELECT `value` FROM `sys_options` WHERE `name` = 'sys_storage_default');

-- Options

UPDATE `sys_options` SET `value` = 'on' WHERE `name` = 'sys_std_show_header_left';

UPDATE `sys_options` SET `value` = 'splash' WHERE `name` = 'sys_api_root_page_guest' AND `value` = 'home';
UPDATE `sys_options` SET `value` = 'home' WHERE `name` = 'sys_api_root_page_member' AND `value` = 'splash';

-- Menu

DELETE FROM `sys_menu_items` WHERE `set_name` = 'sys_studio_account_popup' AND `module` = 'system' AND `name` = 'scheme';
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `editable`, `order`) VALUES
('sys_studio_account_popup', 'system', 'scheme', '_sys_menu_item_title_system_sa_scheme', '_sys_menu_item_title_sa_scheme', 'javascript:void(0)', 'bx_menu_popup_inline(''#bx-std-pcap-menu-popup-scheme'');', '', 'tmi-scheme-auto.svg', '', 2147483647, 1, 0, 0, 4);

UPDATE `sys_menu_items` SET `order` = 5 WHERE `set_name` = 'sys_studio_account_popup' AND `module` = 'system' AND `name` = 'language' AND `order` = 4;
UPDATE `sys_menu_items` SET `order` = 6 WHERE `set_name` = 'sys_studio_account_popup' AND `module` = 'system' AND `name` = 'logout' AND `ORDER` = 5;

-- Grid

INSERT IGNORE INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `hidden_on`, `ORDER`) VALUES 
('sys_studio_agents_models', 'icon', '_adm_form_txt_field_icon', '5%', 0, 0, '', '', 25);

UPDATE `sys_grid_fields` SET `width` = '45%' WHERE `object` = 'sys_studio_agents_models' AND `name` = 'actions';



INSERT IGNORE INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `hidden_on`, `ORDER`) VALUES ('sys_studio_agents_agents', 'model_id', '_sys_agents_agents_txt_model', '5%', 0, 0, '', '', 30);

UPDATE `sys_grid_fields` SET `ORDER` = 10 WHERE `object` = 'sys_studio_agents_agents' AND `name` = 'checkbox';
UPDATE `sys_grid_fields` SET `width` = '5%', `ORDER` = 20 WHERE `object` = 'sys_studio_agents_agents' AND `name` = 'switcher';
UPDATE `sys_grid_fields` SET `width` = '30%', `ORDER` = 40 WHERE `object` = 'sys_studio_agents_agents' AND `name` = 'name';
UPDATE `sys_grid_fields` SET `width` = '5%', `ORDER` = 50 WHERE `object` = 'sys_studio_agents_agents' AND `name` = 'trigger';
UPDATE `sys_grid_fields` SET `width` = '8%', `ORDER` = 60 WHERE `object` = 'sys_studio_agents_agents' AND `name` = 'profile_id';
UPDATE `sys_grid_fields` SET `width` = '45%', `ORDER` = 70 WHERE `object` = 'sys_studio_agents_agents' AND `name` = 'actions';


-- Pages

-- sys_login & sys_forgot_password
UPDATE `sys_pages_blocks` SET `config_api` = '{"rounded": ["mobile", "tablet", "desktop"]}' WHERE `object` = 'sys_login' AND `content` = 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:10:"login_form";s:5:"class";s:17:"TemplServiceLogin";}';
UPDATE `sys_pages_blocks` SET `config_api` = '{"rounded": ["mobile", "tablet", "desktop"]}' WHERE `object` = 'sys_forgot_password' AND `content` = 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:15:"forgot_password";s:6:"params";a:0:{}s:5:"class";s:19:"TemplServiceAccount";}';

-- sys_home
DELETE FROM `sys_pages_blocks` WHERE `object` = 'sys_home' AND `content` = 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:12:"profile_menu";s:6:"params";a:0:{}s:5:"class";s:20:"TemplServiceProfiles";}';
INSERT IGNORE INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `description`, `icon`, `designbox_id`, `class`, `submenu`, `tabs`, `async`, `visible_for_levels`, `hidden_on`, `type`, `content`, `content_empty`, `text`, `text_updated`, `help`, `cache_lifetime`, `config_api`, `deletable`, `copyable`, `active`, `active_api`, `ORDER`) VALUES 
('sys_home', 2, 'system', '', '_sys_page_block_title_profile_menu', '', '', 0, '', '', 0, 0, 2147483644, '0', 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:12:"profile_menu";s:6:"params";a:0:{}s:5:"class";s:20:"TemplServiceProfiles";}', '', '', 0, '', 0, '', 1, 0, 0, 0, 0);

DELETE FROM `sys_pages_blocks` WHERE `object` = 'sys_home' AND `content` = 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:30:"browse_recommendations_friends";s:6:"params";a:2:{i:0;i:0;i:1;a:1:{s:8:"per_page";i:3;}}s:5:"class";s:20:"TemplServiceProfiles";}';
INSERT IGNORE INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `description`, `icon`, `designbox_id`, `class`, `submenu`, `tabs`, `async`, `visible_for_levels`, `hidden_on`, `type`, `content`, `content_empty`, `text`, `text_updated`, `help`, `cache_lifetime`, `config_api`, `deletable`, `copyable`, `active`, `active_api`, `ORDER`) VALUES 
('sys_home', 4, 'system', '_sys_page_block_title_sys_recom_friends', '_sys_page_block_title_recom_friends', '', '', 11, '', '', 1, 0, 2147483644, '0', 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:30:"browse_recommendations_friends";s:6:"params";a:2:{i:0;i:0;i:1;a:1:{s:8:"per_page";i:3;}}s:5:"class";s:20:"TemplServiceProfiles";}', '', '', 0, '', 0, '', 1, 0, 1, 0, 0);
DELETE FROM `sys_pages_blocks` WHERE `object` = 'sys_home' AND `content` = 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:36:"browse_recommendations_subscriptions";s:6:"params";a:0:{}s:5:"class";s:20:"TemplServiceProfiles";}';
INSERT IGNORE INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `description`, `icon`, `designbox_id`, `class`, `submenu`, `tabs`, `async`, `visible_for_levels`, `hidden_on`, `type`, `content`, `content_empty`, `text`, `text_updated`, `help`, `cache_lifetime`, `config_api`, `deletable`, `copyable`, `active`, `active_api`, `ORDER`) VALUES 
('sys_home', 4, 'system', '_sys_page_block_title_sys_recom_subscriptions', '_sys_page_block_title_recom_subscriptions', '', '', 11, '', '', 1, 0, 2147483644, '0', 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:36:"browse_recommendations_subscriptions";s:6:"params";a:0:{}s:5:"class";s:20:"TemplServiceProfiles";}', '', '', 0, '', 0, '', 1, 0, 0, 0, 0);
DELETE FROM `sys_pages_blocks` WHERE `object` = 'sys_home' AND `content` = 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:18:"browse_invitations";s:6:"params";a:0:{}s:5:"class";s:20:"TemplServiceProfiles";}';
INSERT IGNORE INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `description`, `icon`, `designbox_id`, `class`, `submenu`, `tabs`, `async`, `visible_for_levels`, `hidden_on`, `type`, `content`, `content_empty`, `text`, `text_updated`, `help`, `cache_lifetime`, `config_api`, `deletable`, `copyable`, `active`, `active_api`, `ORDER`) VALUES 
('sys_home', 4, 'system', '_sys_page_block_title_sys_invitations', '_sys_page_block_title_invitations', '', '', 11, '', '', 1, 0, 2147483644, '0', 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:18:"browse_invitations";s:6:"params";a:0:{}s:5:"class";s:20:"TemplServiceProfiles";}', '', '', 0, '', 0, '', 1, 0, 0, 0, 0);

-- sys_dashboard
DELETE FROM `sys_pages_blocks` WHERE `object` = 'sys_dashboard' AND `content` = 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:14:"get_stat_block";s:6:"params";a:0:{}s:5:"class";s:22:"TemplDashboardServices";}';
INSERT IGNORE INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `class`, `submenu`, `tabs`, `async`, `visible_for_levels`, `hidden_on`, `type`, `content`, `content_empty`, `text`, `text_updated`, `help`, `cache_lifetime`, `config_api`, `deletable`, `copyable`, `active`, `active_api`, `ORDER`) VALUES 
('sys_dashboard', 1, 'system', '_sys_page_block_title_dash_stats', '', 13, '', '', 0, 0, 2147483647, '0', 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:14:"get_stat_block";s:6:"params";a:0:{}s:5:"class";s:22:"TemplDashboardServices";}', '', '', 0, '', 0, '', 1, 0, 0, 0, 0);

-- Rewrite

DELETE FROM `sys_rewrite_rules` WHERE `preg` = '^sys-agent-form-input/(.*)$';
INSERT INTO `sys_rewrite_rules` (`preg`, `service`, `active`) VALUES 
('^sys-agent-form-input/(.*)$', 'a:4:{s:6:\"module\";s:6:\"system\";s:6:\"method\";s:25:\"call_agent_for_form_input\";s:6:\"params\";a:1:{i:0;s:3:\"{1}\";}s:5:\"class\";s:13:\"TemplServices\";}', 1);

-- Agents

DELETE FROM `sys_agents_tools` WHERE `type` = 'comment_get';
INSERT INTO `sys_agents_tools` (`type`, `title`, `docs`, `params`, `params_user`, `duplicate`, `changed`, `active`, `class_name`, `class_file`) VALUES
('comment_get', 'Comment get', 'This tool allows agents to get single comment by global comment id.', '{}', NULL, 0, 0, 1, 'BxDolAIToolCmtsGetSingle', '');

-- Studio widgets

UPDATE `sys_std_widgets` SET `featured` = 1 WHERE `module` = 'system' AND `url` = '{url_studio}agents.php' AND `icon` = 'wi-agents.svg' AND `caption` = '_adm_wgt_cpt_agents';


-- Last step is to update current version

UPDATE `sys_modules` SET `version` = '15.0.0-RC1' WHERE (`version` = '15.0.0.B3' OR `version` = '15.0.0-B3') AND `name` = 'system';

