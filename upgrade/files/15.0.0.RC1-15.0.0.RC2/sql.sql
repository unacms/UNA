
SET @sStorageEngine = (SELECT `value` FROM `sys_options` WHERE `name` = 'sys_storage_default');

-- Schema changes: sys_options
ALTER TABLE `sys_options` MODIFY `type` enum('value','digit','secret','secret_text','text','code','checkbox','select','combobox','file','image','list','rlist','rgb','rgba','datetime') NOT NULL default 'digit';

-- Data changes: sys_objects_cmts
DELETE FROM `sys_objects_cmts` WHERE `Name` = 'sys_agents_automators' AND `Module` = 'system' AND `TABLE` = 'sys_agents_automators_messages';
DELETE FROM `sys_objects_cmts` WHERE `Name` = 'sys_agents_assistants_chats' AND `Module` = 'system' AND `TABLE` = 'sys_agents_assistants_chats_messages';

-- Data changes: sys_options and sys_options_categories
INSERT IGNORE INTO `sys_options` (`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_params`, `check_error`, `ORDER`) SELECT `id`, 'sys_audit_report', '_adm_stg_cpt_option_sys_audit_report', '', 'text', '', '', '', '', 8 FROM `sys_options_categories` WHERE `name` = 'hidden';

UPDATE `sys_options` SET `value` = 'width=device-width, initial-scale=1.0, minimum-scale=1.0' WHERE `name` = 'sys_viewport_meta_tag' AND `value` = 'width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0';
UPDATE `sys_options` SET `value` = 'on' WHERE `name` = 'sys_std_show_header_left_search';
UPDATE `sys_options` SET `value` = '' WHERE `name` = 'sys_std_show_header_right_search';

-- sys_options: secret option types
UPDATE `sys_options` SET `type` = 'secret' WHERE `name` = 'sys_ftp_password' AND `type` = 'digit';
UPDATE `sys_options` SET `type` = 'secret' WHERE `name` = 'sys_oauth_secret' AND `type` = 'digit';
UPDATE `sys_options` SET `type` = 'secret' WHERE `name` = 'sys_embedly_api_key' AND `type` = 'digit';
UPDATE `sys_options` SET `type` = 'secret' WHERE `name` = 'sys_iframely_api_key' AND `type` = 'digit';
UPDATE `sys_options` SET `type` = 'secret' WHERE `name` = 'sys_embed_microlink_key' AND `type` = 'digit';
UPDATE `sys_options` SET `type` = 'secret' WHERE `name` = 'sys_embed_peekalink_api_key' AND `type` = 'digit';
UPDATE `sys_options` SET `type` = 'secret' WHERE `name` = 'sys_recaptcha_key_private' AND `type` = 'digit';
UPDATE `sys_options` SET `type` = 'secret' WHERE `name` = 'sys_storage_s3_secret_key' AND `type` = 'digit';
UPDATE `sys_options` SET `type` = 'secret' WHERE `name` = 'sys_push_onesignal_rest_api' AND `type` = 'digit';
UPDATE `sys_options` SET `type` = 'secret' WHERE `name` = 'sys_push_wonderpush_access_token' AND `type` = 'digit';
UPDATE `sys_options` SET `type` = 'secret' WHERE `name` = 'sys_sms_twilio_token' AND `type` = 'digit';
UPDATE `sys_options` SET `type` = 'secret' WHERE `name` = 'sys_sms_smsru_api_id' AND `type` = 'digit';
UPDATE `sys_options` SET `type` = 'secret' WHERE `name` = 'sys_maps_api_key' AND `type` = 'digit';
UPDATE `sys_options` SET `type` = 'secret' WHERE `name` = 'sys_sockets_secret' AND `type` = 'digit';

-- sys_options: removed Agents usage options
DELETE FROM `sys_options` WHERE `name` = 'sys_agents_studio_assistant';
DELETE FROM `sys_options` WHERE `name` = 'sys_agents_live_search_assistant';
DELETE FROM `sys_options` WHERE `name` = 'sys_agents_ask_block_assistant';


-- sys_acl_levels
UPDATE `sys_acl_levels` SET `Icon` = 'user-round-arrow-left' WHERE `Name` = '_adm_prm_txt_level_unauthenticated';
UPDATE `sys_acl_levels` SET `Icon` = 'at-sign' WHERE `Name` = '_adm_prm_txt_level_account';
UPDATE `sys_acl_levels` SET `Icon` = 'user-round' WHERE `Name` = '_adm_prm_txt_level_standard';
UPDATE `sys_acl_levels` SET `Icon` = 'user' WHERE `Name` = '_adm_prm_txt_level_unconfirmed';
UPDATE `sys_acl_levels` SET `Icon` = 'user-round-pen' WHERE `Name` = '_adm_prm_txt_level_pending';
UPDATE `sys_acl_levels` SET `Icon` = 'user-round-x' WHERE `Name` = '_adm_prm_txt_level_suspended';
UPDATE `sys_acl_levels` SET `Icon` = 'user-shield' WHERE `Name` = '_adm_prm_txt_level_moderator';
UPDATE `sys_acl_levels` SET `Icon` = 'shield-user' WHERE `Name` = '_adm_prm_txt_level_administrator';

-- sys_modules
UPDATE `sys_modules` SET `vendor` = 'UNA INC', `version` = '', `path` = 'system/' WHERE `name` = 'system';

-- sys_alerts_handlers
UPDATE `sys_alerts_handlers` SET `class` = 'BxDolAiTriggerMessage', `file` = 'inc/classes/BxDolAiTriggerMessage.php' WHERE `name` = 'sys_agents';

-- sys_objects_storage
-- Files and the storage object are removed in script.php after SQL, so the files table must still exist here.
-- DELETE FROM `sys_objects_storage` WHERE `object` = 'sys_agents_assistants_chats_files';

/* Removed sys_agents_comment form inputs */
DELETE FROM `sys_form_inputs` WHERE `object` = 'sys_agents_comment';

/* Removed sys_agents_comment form display */
DELETE FROM `sys_form_displays` WHERE `object` = 'sys_agents_comment' AND `display_name` = 'sys_agents_comment_post';
DELETE FROM `sys_form_display_inputs` WHERE `display_name` = 'sys_agents_comment_post';

/* Removed sys_agents_comment form object */
DELETE FROM `sys_objects_form` WHERE `object` = 'sys_agents_comment';

-- 

-- sys_menu_items
UPDATE `sys_menu_items` SET `onclick`='', `ORDER`=7 WHERE `set_name`='sys_studio_account_popup' AND `module`='system' AND `name`='scheme';
UPDATE `sys_menu_items` SET `icon`='ami-theme.svg' WHERE `set_name`='sys_studio_account_popup' AND `module`='system' AND `name`='scheme' AND `icon`='tmi-scheme-auto.svg';
DELETE FROM `sys_menu_items` WHERE `set_name`='sys_studio_account_popup' AND `module`='system' AND `name`='tour';
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `editable`, `ORDER`) VALUES ('sys_studio_account_popup', 'system', 'tour', '_sys_menu_item_title_system_sa_tour', '_sys_menu_item_title_sa_tour', '{url_studio}launcher.php?tour=1', 'if(typeof glTour !== ''undefined'') { glTour.start(); return false; }', '', 'ami-tour.svg', '', 2147483647, 1, 0, 0, 4);

-- sys_grid_fields
UPDATE `sys_grid_fields` SET `ORDER`=8 WHERE `object`='sys_studio_acl' AND `name`='switcher' AND `ORDER`=2;
UPDATE `sys_grid_fields` SET `ORDER`=2 WHERE `object`='sys_studio_acl' AND `name`='Icon' AND `ORDER`=3;
UPDATE `sys_grid_fields` SET `ORDER`=3 WHERE `object`='sys_studio_acl' AND `name`='Name' AND `ORDER`=4;
UPDATE `sys_grid_fields` SET `ORDER`=4 WHERE `object`='sys_studio_acl' AND `name`='ActionsList' AND `ORDER`=5;
UPDATE `sys_grid_fields` SET `ORDER`=5 WHERE `object`='sys_studio_acl' AND `name`='QuotaSize' AND `ORDER`=6;
UPDATE `sys_grid_fields` SET `ORDER`=6 WHERE `object`='sys_studio_acl' AND `name`='QuotaMaxFileSize' AND `ORDER`=7;
UPDATE `sys_grid_fields` SET `ORDER`=7 WHERE `object`='sys_studio_acl' AND `name`='QuotaNumber' AND `ORDER`=8;


--

-- sys_menu_items
UPDATE `sys_menu_items` SET `onclick`='', `ORDER`=7 WHERE `set_name`='sys_studio_account_popup' AND `module`='system' AND `name`='scheme';
UPDATE `sys_menu_items` SET `icon`='ami-theme.svg' WHERE `set_name`='sys_studio_account_popup' AND `module`='system' AND `name`='scheme' AND `icon`='tmi-scheme-auto.svg';
DELETE FROM `sys_menu_items` WHERE `set_name`='sys_studio_account_popup' AND `module`='system' AND `name`='tour';
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `editable`, `ORDER`) VALUES ('sys_studio_account_popup', 'system', 'tour', '_sys_menu_item_title_system_sa_tour', '_sys_menu_item_title_sa_tour', '{url_studio}launcher.php?tour=1', 'if(typeof glTour !== ''undefined'') { glTour.start(); return false; }', '', 'ami-tour.svg', '', 2147483647, 1, 0, 0, 4);

-- sys_grid_fields
UPDATE `sys_grid_fields` SET `ORDER`=8 WHERE `object`='sys_studio_acl' AND `name`='switcher' AND `ORDER`=2;
UPDATE `sys_grid_fields` SET `ORDER`=2 WHERE `object`='sys_studio_acl' AND `name`='Icon' AND `ORDER`=3;
UPDATE `sys_grid_fields` SET `ORDER`=3 WHERE `object`='sys_studio_acl' AND `name`='Name' AND `ORDER`=4;
UPDATE `sys_grid_fields` SET `ORDER`=4 WHERE `object`='sys_studio_acl' AND `name`='ActionsList' AND `ORDER`=5;
UPDATE `sys_grid_fields` SET `ORDER`=5 WHERE `object`='sys_studio_acl' AND `name`='QuotaSize' AND `ORDER`=6;
UPDATE `sys_grid_fields` SET `ORDER`=6 WHERE `object`='sys_studio_acl' AND `name`='QuotaMaxFileSize' AND `ORDER`=7;
UPDATE `sys_grid_fields` SET `ORDER`=7 WHERE `object`='sys_studio_acl' AND `name`='QuotaNumber' AND `ORDER`=8;

--

-- sys_grid_actions
DELETE FROM `sys_grid_actions` WHERE `object` IN ('sys_queues','sys_studio_agents_assistants','sys_studio_agents_assistants_chats','sys_studio_agents_assistants_files','sys_studio_agents_automators','sys_studio_agents_helpers', 'sys_studio_agents_providers');

-- sys_grid_fields
DELETE FROM `sys_grid_fields` WHERE `object` IN ('sys_queues','sys_studio_agents_assistants','sys_studio_agents_assistants_chats','sys_studio_agents_assistants_files','sys_studio_agents_automators','sys_studio_agents_helpers', 'sys_studio_agents_providers');

-- sys_objects_grid
DELETE FROM `sys_objects_grid` WHERE `object` IN ('sys_queues','sys_studio_agents_assistants','sys_studio_agents_assistants_chats','sys_studio_agents_assistants_files','sys_studio_agents_automators','sys_studio_agents_helpers', 'sys_studio_agents_providers');

-- sys_objects_transcoder
DELETE FROM `sys_objects_transcoder` WHERE `object` = 'sys_agents_assistants_chats_files_preview';
DELETE FROM `sys_transcoder_filters` WHERE `transcoder_object` = 'sys_agents_assistants_chats_files_preview';

-- sys_transcoder_filters: site and profile covers re-encode as JPEG (quality 82) instead of a renamed PNG.
-- force_type only renamed the file after the resize, so a JPEG source was served as an oversized image/png.
UPDATE `sys_transcoder_filters` SET `filter_params` = 'a:3:{s:1:"w";s:4:"1920";s:1:"h";s:3:"720";s:7:"quality";s:2:"82";}' WHERE `transcoder_object` = 'sys_cover' AND `filter` = 'Resize';
UPDATE `sys_transcoder_filters` SET `filter_params` = 'a:3:{s:1:"w";s:3:"640";s:1:"h";s:3:"240";s:7:"quality";s:2:"82";}' WHERE `transcoder_object` = 'sys_cover_unit_profile' AND `filter` = 'Resize';
-- bump ts so every cached cover is regenerated once with the new settings
UPDATE `sys_objects_transcoder` SET `ts` = UNIX_TIMESTAMP() WHERE `object` IN ('sys_cover', 'sys_cover_unit_profile');

-- sys_objects_grid: API Configs
INSERT IGNORE INTO `sys_objects_grid` (`object`,`source_type`,`source`,`TABLE`,`field_id`,`field_order`,`field_active`,`paginate_url`,`paginate_per_page`,`paginate_simple`,`paginate_get_start`,`paginate_get_per_page`,`filter_fields`,`filter_fields_translatable`,`filter_mode`,`sorting_fields`,`sorting_fields_translatable`,`override_class_name`,`override_class_file`) VALUES ('sys_studio_api_configs','Sql','SELECT * FROM `sys_modules` WHERE 1 ','sys_modules','id','name','','',100,NULL,'start','','name,title,vendor','','like','','','BxTemplStudioApiConfigs','');

-- sys_grid_fields: API Configs
INSERT IGNORE INTO `sys_grid_fields` (`object`,`name`,`title`,`width`,`translatable`,`chars_limit`,`params`,`hidden_on`,`ORDER`) VALUES ('sys_studio_api_configs','title','_adm_api_ttl_module','20%',0,0,'','',1);
INSERT IGNORE INTO `sys_grid_fields` (`object`,`name`,`title`,`width`,`translatable`,`chars_limit`,`params`,`hidden_on`,`ORDER`) VALUES ('sys_studio_api_configs','actions','','80%',0,0,'','',2);

UPDATE `sys_grid_fields` SET `title` = '_sys_agents_models_txt_type' WHERE `object` = 'sys_studio_agents_models' AND `name` = 'type' AND `title` = '_sys_agents_automators_txt_type';

-- sys_grid_actions: API Configs
INSERT IGNORE INTO `sys_grid_actions` (`object`,`type`,`name`,`title`,`icon`,`icon_only`,`confirm`,`ORDER`) VALUES ('sys_studio_api_configs','single','apply','_adm_api_btn_apply','recycle',1,1,1);
INSERT IGNORE INTO `sys_grid_actions` (`object`,`type`,`name`,`title`,`icon`,`icon_only`,`confirm`,`ORDER`) VALUES ('sys_studio_api_configs','single','remove','_adm_api_btn_remove','eraser',1,1,2);
INSERT IGNORE INTO `sys_grid_actions` (`object`,`type`,`name`,`title`,`icon`,`icon_only`,`confirm`,`ORDER`) VALUES ('sys_studio_api_configs','single','export','_adm_api_btn_export','file-export',1,0,3);
INSERT IGNORE INTO `sys_grid_actions` (`object`,`type`,`name`,`title`,`icon`,`icon_only`,`confirm`,`ORDER`) VALUES ('sys_studio_api_configs','independent','apply_all','_adm_api_btn_apply_all','',0,1,1);
INSERT IGNORE INTO `sys_grid_actions` (`object`,`type`,`name`,`title`,`icon`,`icon_only`,`confirm`,`ORDER`) VALUES ('sys_studio_api_configs','independent','remove_all','_adm_api_btn_remove_all','eraser',1,1,2);
INSERT IGNORE INTO `sys_grid_actions` (`object`,`type`,`name`,`title`,`icon`,`icon_only`,`confirm`,`ORDER`) VALUES ('sys_studio_api_configs','independent','export_all','_adm_api_btn_export_all','',0,0,3);
INSERT IGNORE INTO `sys_grid_actions` (`object`,`type`,`name`,`title`,`icon`,`icon_only`,`confirm`,`ORDER`) VALUES ('sys_studio_api_configs','independent','import_all','_adm_api_btn_import_all','',0,0,4);

-- sys_grid_fields: Agents
INSERT IGNORE INTO `sys_grid_fields` (`object`,`name`,`title`,`width`,`translatable`,`chars_limit`,`params`,`hidden_on`,`ORDER`) VALUES ('sys_studio_agents_agents','icon','_adm_form_txt_field_icon','5%',0,0,'','',30);
UPDATE `sys_grid_fields` SET `ORDER` = 50 WHERE `object` = 'sys_studio_agents_agents' AND `name` = 'model_id' AND `ORDER` = 30;
UPDATE `sys_grid_fields` SET `ORDER` = 60 WHERE `object` = 'sys_studio_agents_agents' AND `name` = 'trigger' AND `ORDER` = 50;
UPDATE `sys_grid_fields` SET `ORDER` = 70 WHERE `object` = 'sys_studio_agents_agents' AND `name` = 'profile_id' AND `ORDER` = 60;
UPDATE `sys_grid_fields` SET `width` = '40%', `ORDER` = 80 WHERE `object` = 'sys_studio_agents_agents' AND `name` = 'actions' AND `width` = '45%' AND `ORDER` = 70;

-- sys_grid_actions: Agents
INSERT IGNORE INTO `sys_grid_actions` (`object`,`type`,`name`,`title`,`icon`,`icon_only`,`confirm`,`ORDER`) VALUES ('sys_studio_agents_agents','single','message','_sys_agents_agents_act_message','comment',1,0,2);
UPDATE `sys_grid_actions` SET `ORDER` = 3 WHERE `object` = 'sys_studio_agents_agents' AND `type` = 'single' AND `name` = 'logs' AND `ORDER` = 2;
UPDATE `sys_grid_actions` SET `ORDER` = 4 WHERE `object` = 'sys_studio_agents_agents' AND `type` = 'single' AND `name` = 'edit' AND `ORDER` = 3;
UPDATE `sys_grid_actions` SET `ORDER` = 5 WHERE `object` = 'sys_studio_agents_agents' AND `type` = 'single' AND `name` = 'wipe_chat_history' AND `ORDER` = 4;
UPDATE `sys_grid_actions` SET `ORDER` = 6 WHERE `object` = 'sys_studio_agents_agents' AND `type` = 'single' AND `name` = 'delete' AND `ORDER` = 5;

-- sys_grid_fields: Agents Logs
UPDATE `sys_grid_fields` SET `title` = '_sys_agents_agents_act_message' WHERE `object` = 'sys_studio_agents_logs' AND `name` = 'message' AND `title` = '_sys_agents_helpers_field_message';


--

-- sys_objects_page
UPDATE `sys_objects_page` SET `layout_id` = 5 WHERE `object` = 'sys_std_dashboard' AND `layout_id` = 4;
UPDATE `sys_objects_page` SET `title_system` = '_sys_page_title_sys_wiki_pages_list' WHERE `object` = 'sys_sub_wiki_pages_list' AND `title_system` = '';
UPDATE `sys_objects_page` SET `title_system` = '_sys_page_title_sys_wiki_page_contents' WHERE `object` = 'sys_sub_wiki_page_contents' AND `title_system` = '';
INSERT IGNORE INTO `sys_objects_page` (`object`, `uri`, `title_system`, `title`, `module`, `cover`, `layout_id`, `submenu`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`, `sticky_columns`) VALUES ('sys_wiki_add_page', 'wiki-add-page', '_sys_page_title_sys_wiki_add_page', '_sys_page_title_wiki_add_page', 'system', 1, 5, '', 2147483647, 1, 'page.php?i=wiki-add-page', '', '', '', 0, 1, 0, '', '', 0);

-- sys_pages_blocks: service blocks
UPDATE `sys_pages_blocks` SET `title_system` = '_sys_page_block_title_sys_ai_agent', `title` = '_sys_page_block_title_ai_agent', `content` = 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:18:"get_block_ai_agent";s:6:"params";a:1:{i:0;i:1;}s:5:"class";s:13:"TemplServices";}' WHERE `object` = '' AND `cell_id` = 0 AND `module` = 'system' AND `title_system` = '_sys_page_block_title_sys_ask_aqssistant' AND `title` = '_sys_page_block_title_ask_aqssistant' AND `content` = 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:23:"get_block_ask_assistant";s:6:"params";a:1:{i:0;a:0:{}}s:5:"class";s:13:"TemplServices";}';

-- sys_pages_blocks: dashboard blocks
UPDATE `sys_pages_blocks` SET `cell_id` = 2 WHERE `object` = 'sys_dashboard' AND `cell_id` = 1 AND `module` = 'system' AND `title_system` = '_sys_page_block_title_dash_stats' AND `content` = 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:14:"get_stat_block";s:6:"params";a:0:{}s:5:"class";s:22:"TemplDashboardServices";}';

-- sys_pages_blocks: wiki blocks
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `tabs`, `async`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `ORDER`) SELECT 'sys_wiki_add_page', 1, 'system', '', '_sys_page_block_title_wiki_add_page', 0, 0, 0, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:13:"wiki_add_page";s:6:"params";a:2:{i:0;s:8:"{object}";i:1;s:5:"{uri}";}s:5:"class";s:16:"TemplServiceWiki";}', 0, 1, 1, 1 WHERE NOT EXISTS (SELECT 1 FROM `sys_pages_blocks` WHERE `object` = 'sys_wiki_add_page' AND `cell_id` = 1 AND `module` = 'system' AND `title` = '_sys_page_block_title_wiki_add_page' AND `content` = 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:13:"wiki_add_page";s:6:"params";a:2:{i:0;s:8:"{object}";i:1;s:5:"{uri}";}s:5:"class";s:16:"TemplServiceWiki";}');

-- sys_pages_blocks: studio dashboard blocks
UPDATE `sys_pages_blocks` SET `icon` = 'package', `class` = 'bx-dbd-block-medium' WHERE `object` = 'sys_std_dashboard' AND `cell_id` = 1 AND `module` = 'system' AND `title` = '_sys_page_block_title_std_dash_version' AND `content` = 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:17:"get_block_version";s:6:"params";a:0:{}s:5:"class";s:20:"TemplStudioDashboard";}';
UPDATE `sys_pages_blocks` SET `icon` = 'layers', `class` = 'bx-dbd-block-medium', `ORDER` = 3 WHERE `object` = 'sys_std_dashboard' AND `cell_id` = 1 AND `module` = 'system' AND `title` = '_sys_page_block_title_std_dash_space' AND `content` = 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:15:"get_block_space";s:6:"params";a:0:{}s:5:"class";s:20:"TemplStudioDashboard";}';
UPDATE `sys_pages_blocks` SET `cell_id` = 1, `icon` = 'server', `class` = 'bx-dbd-block-medium', `ORDER` = 4 WHERE `object` = 'sys_std_dashboard' AND `cell_id` = 2 AND `module` = 'system' AND `title` = '_sys_page_block_title_std_dash_host_tools' AND `content` = 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:20:"get_block_host_tools";s:6:"params";a:0:{}s:5:"class";s:20:"TemplStudioDashboard";}';
UPDATE `sys_pages_blocks` SET `cell_id` = 1, `icon` = 'archive', `class` = 'bx-dbd-block-medium', `ORDER` = 5 WHERE `object` = 'sys_std_dashboard' AND `cell_id` = 2 AND `module` = 'system' AND `title` = '_sys_page_block_title_std_dash_cache' AND `content` = 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:15:"get_block_cache";s:6:"params";a:0:{}s:5:"class";s:20:"TemplStudioDashboard";}';
UPDATE `sys_pages_blocks` SET `cell_id` = 1, `icon` = 'list-todo', `class` = 'bx-dbd-block-medium', `ORDER` = 6 WHERE `object` = 'sys_std_dashboard' AND `cell_id` = 2 AND `module` = 'system' AND `title` = '_sys_page_block_title_std_dash_queues' AND `content` = 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:16:"get_block_queues";s:6:"params";a:0:{}s:5:"class";s:20:"TemplStudioDashboard";}';
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `icon`, `designbox_id`, `class`, `tabs`, `async`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `ORDER`) SELECT 'sys_std_dashboard', 1, 'system', '', '_sys_page_block_title_std_dash_users', 'users', 11, 'bx-dbd-block-medium', 0, 0, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:15:"get_block_users";s:6:"params";a:0:{}s:5:"class";s:20:"TemplStudioDashboard";}', 0, 0, 1, 2 WHERE NOT EXISTS (SELECT 1 FROM `sys_pages_blocks` WHERE `object` = 'sys_std_dashboard' AND `cell_id` = 1 AND `module` = 'system' AND `title` = '_sys_page_block_title_std_dash_users' AND `content` = 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:15:"get_block_users";s:6:"params";a:0:{}s:5:"class";s:20:"TemplStudioDashboard";}');

--

DELETE FROM `sys_rewrite_rules` WHERE `preg` = '^sys-ai-chat/(.*)$';
INSERT INTO `sys_rewrite_rules` (`preg`, `service`, `active`) VALUES
('^sys-ai-chat/(.*)$', 'a:4:{s:6:\"module\";s:6:\"system\";s:6:\"method\";s:7:\"ai_chat\";s:6:\"params\";a:1:{i:0;s:3:\"{1}\";}s:5:\"class\";s:13:\"TemplServices\";}', 1);

--

CREATE TABLE IF NOT EXISTS `sys_agents_chat_artifacts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `history_id` int(11) NOT NULL,
  `field_name` varchar(64) NOT NULL,
  `field_value` text NOT NULL,
  `updated_at` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `history_field` (`history_id`, `field_name`),
  KEY `history_id` (`history_id`)
);

-- Data: sys_agents_tools
DELETE FROM `sys_agents_tools` WHERE `type` = 'chat_artifact_save';
DELETE FROM `sys_agents_tools` WHERE `type` = 'chat_goal_reached';
INSERT INTO `sys_agents_tools` (`type`, `title`, `docs`, `params`, `params_user`, `duplicate`, `changed`, `active`, `class_name`, `class_file`) VALUES 
('chat_artifact_save', 'Chat artifact save', 'Save one field from the conversation into sys_agents_chat_artifacts.', '{}', NULL, 0, 0, 0, 'BxDolAIToolChatArtifactSave', ''), 
('chat_goal_reached', 'Chat goal reached', 'Call once when the conversation goal is done. Fires agent_conversation_closed with reason=goal.', '{}', NULL, 0, 0, 0, 'BxDolAIToolChatGoalReached', '');

-- Data: sys_preloader
DELETE FROM `sys_preloader` WHERE `module` = 'system' AND `type` = 'js_system' AND `content` = 'bundle.js';
INSERT INTO `sys_preloader` (`module`, `type`, `content`, `active`, `ORDER`) VALUES ('system', 'js_system', 'bundle.js', 1, 46);

-- Data: sys_std_pages
UPDATE `sys_std_pages` SET `icon` = 'tmi-launcher.svg' WHERE `name` = 'home' AND `icon` = 'bc-home.svg';

-- DROP TABLE IF EXISTS `sys_agents_automators`;

DROP TABLE IF EXISTS `sys_agents_automators_providers`;
DROP TABLE IF EXISTS `sys_agents_automators_helpers`;
DROP TABLE IF EXISTS `sys_agents_automators_assistants`;
DROP TABLE IF EXISTS `sys_agents_automators_messages`;
DROP TABLE IF EXISTS `sys_agents_provider_types`;
DROP TABLE IF EXISTS `sys_agents_provider_options`;
DROP TABLE IF EXISTS `sys_agents_providers`;
DROP TABLE IF EXISTS `sys_agents_providers_values`;
DROP TABLE IF EXISTS `sys_agents_helpers`;
DROP TABLE IF EXISTS `sys_agents_assistants`;
DROP TABLE IF EXISTS `sys_agents_assistants_files`;
DROP TABLE IF EXISTS `sys_agents_assistants_chats`;
DROP TABLE IF EXISTS `sys_agents_assistants_chats_messages`;
-- DROP TABLE IF EXISTS `sys_agents_assistants_chats_files`;

-- APP: pages

UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_wiki_add_page' AND `module`='system' AND `title_system`='' AND `title`='_sys_page_block_title_wiki_add_page';

-- Last step is to update current version

UPDATE `sys_modules` SET `version` = '15.0.0-RC2' WHERE (`version` = '15.0.0.RC1' OR `version` = '15.0.0-RC1') AND `name` = 'system';

