
-- settings

SET @iTypeOrder = (SELECT MAX(`order`) FROM `sys_options_types` WHERE `group` = 'modules');
INSERT INTO `sys_options_types` (`group`, `name`, `caption`, `icon`, `order`) VALUES 
('modules', 'bx_antispam', '_bx_antispam_adm_stg_cpt_type', 'bx_antispam@modules/boonex/antispam/|std-icon.svg', IF(NOT ISNULL(@iTypeOrder), @iTypeOrder + 1, 1));
SET @iTypeId = LAST_INSERT_ID();



INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order` )  
VALUES (@iTypeId, 'bx_antispam_general', '_bx_antispam_adm_stg_cpt_category_general', 1);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, 'bx_antispam_block', '_bx_antispam_option_block', '', 'checkbox', '', '', '', 10),
(@iCategoryId, 'bx_antispam_report', '_bx_antispam_option_report', 'on', 'checkbox', '', '', '', 20);



INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order` )  
VALUES (@iTypeId, 'bx_antispam_ip_table', '_bx_antispam_adm_stg_cpt_category_ip_table', 2);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, 'bx_antispam_ip_list_type', '_bx_antispam_option_ip_list_type', '0', 'select', 'a:3:{s:6:"module";s:11:"bx_antispam";s:6:"method";s:13:"config_values";s:6:"params";a:1:{i:0;s:8:"ip_table";}}', '', '', 10);



INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order` )  
VALUES (@iTypeId, 'bx_antispam_dnsbl', '_bx_antispam_adm_stg_cpt_category_dnsbl', 3);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, 'bx_antispam_dnsbl_enable', '_bx_antispam_option_dnsbl_enable', '', 'checkbox', '', '', '', 10),
(@iCategoryId, 'bx_antispam_dnsbl_behaviour_login', '_bx_antispam_option_dnsbl_behaviour_login', 'block', 'select', 'a:3:{s:6:"module";s:11:"bx_antispam";s:6:"method";s:13:"config_values";s:6:"params";a:1:{i:0;s:11:"dnsbl_login";}}', '', '', 20),
(@iCategoryId, 'bx_antispam_dnsbl_behaviour_join', '_bx_antispam_option_dnsbl_behaviour_join', 'approval', 'select', 'a:3:{s:6:"module";s:11:"bx_antispam";s:6:"method";s:13:"config_values";s:6:"params";a:1:{i:0;s:10:"dnsbl_join";}}', '', '', 30),
(@iCategoryId, 'bx_antispam_uridnsbl_enable', '_bx_antispam_option_uridnsbl_enable', '', 'checkbox', '', '', '', 40);



INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order` )  
VALUES (@iTypeId, 'bx_antispam_akismet', '_bx_antispam_adm_stg_cpt_category_akismet', 4);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, 'bx_antispam_akismet_enable', '_bx_antispam_option_akismet_enable', '', 'checkbox', '', '', '', 10),
(@iCategoryId, 'bx_antispam_akismet_api_key', '_bx_antispam_option_akismet_api_key', '', 'secret', '', '', '', 20);



INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order` )  
VALUES (@iTypeId, 'bx_antispam_stopforumspam', '_bx_antispam_adm_stg_cpt_category_stopforumspam', 5);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, 'bx_antispam_stopforumspam_enable', '_bx_antispam_option_stopforumspam_enable', 'on', 'checkbox', '', '', '', 10),
(@iCategoryId, 'bx_antispam_stopforumspam_api_key', '_bx_antispam_option_stopforumspam_api_key', '', 'secret', '', '', '', 20);

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order` )  
VALUES (@iTypeId, 'bx_antispam_disposable_email_domains', '_bx_antispam_adm_stg_cpt_category_disposable_email_domains', 6);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, 'bx_antispam_disposable_email_domains_mode', '_bx_antispam_option_disposable_email_domains_mode', 'blacklist', 'select', 'a:3:{s:6:"module";s:11:"bx_antispam";s:6:"method";s:13:"config_values";s:6:"params";a:1:{i:0;s:29:"disposable_email_domains_mode";}}', '', '', 10),
(@iCategoryId, 'bx_antispam_disposable_email_domains_behaviour_join', '_bx_antispam_option_disposable_email_domains_behaviour_join', 'block', 'select', 'a:3:{s:6:"module";s:11:"bx_antispam";s:6:"method";s:13:"config_values";s:6:"params";a:1:{i:0;s:29:"disposable_email_domains_join";}}', '', '', 20);


INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order` )  
VALUES (@iTypeId, 'bx_antispam_profanity_filter', '_bx_antispam_adm_stg_cpt_category_profanity_filter', 7);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, 'bx_antispam_profanity_filter_enable', '_bx_antispam_option_profanity_filter_enable', '', 'checkbox', '', '', '', 10),
(@iCategoryId, 'bx_antispam_profanity_filter_dicts', '_bx_antispam_option_profanity_filter_dicts', '', 'list', 'a:2:{s:6:"module";s:11:"bx_antispam";s:6:"method";s:26:"get_profanity_filter_dicts";}', '', '', 15),
(@iCategoryId, 'bx_antispam_profanity_filter_bad_words_list', '_bx_antispam_option_profanity_filter_bad_words_list', '', 'text', '', '', '', 20),
(@iCategoryId, 'bx_antispam_profanity_filter_char_replace', '_bx_antispam_option_profanity_filter_char_replace', '*', 'digit', '', '', '', 30),
(@iCategoryId, 'bx_antispam_profanity_filter_white_words_list', '_bx_antispam_option_profanity_filter_white_words_list', '', 'text', '', '', '', 40),
(@iCategoryId, 'bx_antispam_profanity_filter_full_words_only', '_bx_antispam_option_profanity_filter_full_words_only', 'on', 'checkbox', '', '', '', 50);


INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order` )
VALUES (@iTypeId, 'bx_antispam_toxicity_filter', '_bx_antispam_adm_stg_cpt_category_toxicity_filter', 8);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, 'bx_antispam_toxicity_filter_enable', '_bx_antispam_option_toxicity_filter_enable', '', 'checkbox', '', '', '', 10),
(@iCategoryId, 'bx_antispam_toxicity_filter_api_key', '_bx_antispam_option_toxicity_filter_api_key', '', 'secret', '', '', '', 20),
(@iCategoryId, 'bx_antispam_toxicity_filter_action', '_bx_antispam_option_toxicity_filter_action', 'none', 'select', 'a:2:{s:6:"module";s:11:"bx_antispam";s:6:"method";s:27:"get_toxicity_filter_actions";}', '', '', 30),
(@iCategoryId, 'bx_antispam_toxicity_filter_report', '_bx_antispam_option_toxicity_report', '', 'checkbox', 'on', '', '', 40),
(@iCategoryId, 'bx_antispam_toxicity_filter_threshold', '_bx_antispam_option_toxicity_filter_threshold', '60', 'digit', '', '', '', 50);

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order` )
VALUES (@iTypeId, 'bx_antispam_lasso_moderation', '_bx_antispam_adm_stg_cpt_category_lasso_moderation', 9);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, 'bx_antispam_lasso_moderation_enable', '_bx_antispam_option_lasso_moderation_enable', '', 'checkbox', '', '', '', 10),
(@iCategoryId, 'bx_antispam_lasso_moderation_api_key', '_bx_antispam_option_lasso_moderation_api_key', '', 'secret', '', '', '', 20),
(@iCategoryId, 'bx_antispam_lasso_moderation_webhook_secret', '_bx_antispam_option_lasso_moderation_webhook_secret', '', 'secret', '', '', '', 30),
(@iCategoryId, 'bx_antispam_lasso_moderation_webhook_url', '_bx_antispam_option_lasso_moderation_webhook_url', '{site_url}m/antispam/content_checked', 'value', '', '', '', 40),
(@iCategoryId, 'bx_antispam_lasso_moderation_action', '_bx_antispam_option_lasso_moderation_action', 'none', 'select', 'a:2:{s:6:"module";s:11:"bx_antispam";s:6:"method";s:28:"get_lasso_moderation_actions";}', '', '', 50),
(@iCategoryId, 'bx_antispam_lasso_moderation_report', '_bx_antispam_option_lasso_moderation_report', '', 'checkbox', 'on', '', '', 60),
(@iCategoryId, 'bx_antispam_lasso_moderation_threshold_toxicity', '_bx_antispam_option_lasso_moderation_threshold_toxicity', '50', 'digit', '', '', '', 70),
(@iCategoryId, 'bx_antispam_lasso_moderation_threshold_threat', '_bx_antispam_option_lasso_moderation_threshold_threat', '50', 'digit', '', '', '', 72),
(@iCategoryId, 'bx_antispam_lasso_moderation_threshold_identity_attack', '_bx_antispam_option_lasso_moderation_threshold_identity_attack', '50', 'digit', '', '', '', 74),
(@iCategoryId, 'bx_antispam_lasso_moderation_threshold_profanity', '_bx_antispam_option_lasso_moderation_threshold_profanity', '50', 'digit', '', '', '', 76);

-- page: DNSBL list

INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_antispam_dnsbl', 'antispam-dnsbl-list', '_bx_antispam_page_title_sys_dnsbl_list', '_bx_antispam_page_title_dnsbl_list', 'bx_antispam', 5, 128, 1, 'page.php?i=antispam-dnsbl-list', '', '', '', 0, 1, 0, 'BxAntispamPage', 'modules/boonex/antispam/classes/BxAntispamPage.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_antispam_dnsbl', 1, 'bx_antispam', '_bx_antispam_page_block_title_dnsbl_list', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:11:\"bx_antispam\";s:6:\"method\";s:10:\"dnsbl_list\";}', 0, 1, 1, 1);

-- page: ip table

INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_antispam_ip_table', 'antispam-ip-table', '_bx_antispam_page_title_sys_ip_table', '_bx_antispam_page_title_ip_table', 'bx_antispam', 5, 128, 1, 'page.php?i=antispam-ip-table', '', '', '', 0, 1, 0, 'BxAntispamPage', 'modules/boonex/antispam/classes/BxAntispamPage.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_antispam_ip_table', 1, 'bx_antispam', '_bx_antispam_page_block_title_ip_table', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:11:\"bx_antispam\";s:6:\"method\";s:8:\"ip_table\";}', 0, 1, 1, 1);

-- page: block log

INSERT INTO `sys_objects_page`(`object`, `uri`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`) VALUES 
('bx_antispam_block_log', 'antispam-block-log', '_bx_antispam_page_title_sys_block_log', '_bx_antispam_page_title_block_log', 'bx_antispam', 5, 192, 1, 'page.php?i=antispam-block-log', '', '', '', 0, 1, 0, 'BxAntispamPage', 'modules/boonex/antispam/classes/BxAntispamPage.php');

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_antispam_block_log', 1, 'bx_antispam', '_bx_antispam_page_block_title_block_log', 11, 2147483647, 'service', 'a:2:{s:6:\"module\";s:11:\"bx_antispam\";s:6:\"method\";s:9:\"block_log\";}', 0, 1, 1, 1);

-- grid: DNSBL

INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_antispam_grid_dnsbl', 'Sql', 'SELECT `id`, `chain`, `zonedomain`, `postvresp`, `url`, `recheck`, `comment`, `added`, `active` FROM `bx_antispam_dnsbl_rules`', 'bx_antispam_dnsbl_rules', 'id', 'added', 'active', '', 16, NULL, 'start', '', 'chain,zonedomain,url,recheck', 'comment', 'auto', 'chain,zonedomain', 'comment', 128, 'BxAntispamGridDNSBL', 'modules/boonex/antispam/classes/BxAntispamGridDNSBL.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_antispam_grid_dnsbl', 'switcher', '_sys_active', '10%', 0, 0, '', 1),
('bx_antispam_grid_dnsbl', 'chain', '_bx_antispam_field_chain', '15%', 0, 0, '', 2),
('bx_antispam_grid_dnsbl', 'zonedomain', '_bx_antispam_field_zonedomain', '15%', 0, 0, '', 3),
('bx_antispam_grid_dnsbl', 'comment', '_bx_antispam_field_note', '55%', 0, 0, '', 4),
('bx_antispam_grid_dnsbl', 'actions', '_sys_actions', '5%', 0, 0, '', 5);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `confirm`, `order`) VALUES
('bx_antispam_grid_dnsbl', 'independent', 'log', '_bx_antispam_grid_action_log', '', 0, 1),
('bx_antispam_grid_dnsbl', 'independent', 'recheck', '_bx_antispam_grid_action_recheck', '', 0, 2),
('bx_antispam_grid_dnsbl', 'independent', 'add', '_bx_antispam_grid_action_add', '', 0, 3),
('bx_antispam_grid_dnsbl', 'independent', 'help', '_bx_antispam_grid_action_help', '', 0, 4),
('bx_antispam_grid_dnsbl', 'single', 'delete', '', 'remove',  1, 1);

-- grid: ip table

INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_mode`, `sorting_fields`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_antispam_grid_ip_table', 'Sql', 'SELECT `ID`, `From`, `To`, `Type`, `LastDT`, `Desc` FROM `bx_antispam_ip_table`', 'bx_antispam_ip_table', 'ID', '', '', 10, NULL, 'start', '', 'From,To,Desc', 'auto', 'From,To,Type,LastDT,Desc', 128, 'BxAntispamGridIpTable', 'modules/boonex/antispam/classes/BxAntispamGridIpTable.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `params`, `order`) VALUES
('bx_antispam_grid_ip_table', 'checkbox', '_sys_select', '2%', '', 1),
('bx_antispam_grid_ip_table', 'From', '_bx_antispam_field_ip_from', '15%', '', 2),
('bx_antispam_grid_ip_table', 'To', '_bx_antispam_field_ip_to', '15%', '', 3),
('bx_antispam_grid_ip_table', 'Type', '_bx_antispam_field_action', '15%', '', 4),
('bx_antispam_grid_ip_table', 'LastDT', '_bx_antispam_field_expiration', '15%', '', 5),
('bx_antispam_grid_ip_table', 'Desc', '_bx_antispam_field_note', '26%', '', 6),
('bx_antispam_grid_ip_table', 'actions', '_sys_actions', '12%', '', 7);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `confirm`, `order`) VALUES
('bx_antispam_grid_ip_table', 'bulk', 'delete', '_bx_antispam_grid_action_delete', '', 1, 1),
('bx_antispam_grid_ip_table', 'single', 'edit', '', 'pencil-alt', 0, 1),
('bx_antispam_grid_ip_table', 'single', 'delete', '', 'remove',  1, 2),
('bx_antispam_grid_ip_table', 'independent', 'add', '_bx_antispam_grid_action_add', '', 0, 1);

-- grid: block log

INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_antispam_grid_block_log', 'Sql', 'SELECT `id`, `ip`, `profile_id`, `type`, `extra`, `added` FROM `bx_antispam_block_log`', 'bx_antispam_block_log', 'id', 'id', '', '', 8, NULL, 'start', '', 'type,extra', '', 'auto', 'ip,profile_id,type,extra,added', '', 192, 'BxAntispamGridBlockLog', 'modules/boonex/antispam/classes/BxAntispamGridBlockLog.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_antispam_grid_block_log', 'ip', '_bx_antispam_field_ip', '20%', 0, 0, '', 1),
('bx_antispam_grid_block_log', 'profile_id', '_bx_antispam_field_profile_id', '20%', 0, 0, '', 2),
('bx_antispam_grid_block_log', 'type', '_bx_antispam_field_type', '15%', 0, 0, '', 3),
('bx_antispam_grid_block_log', 'extra', '_bx_antispam_field_note', '15%', 0, 8, '', 4),
('bx_antispam_grid_block_log', 'added', '_bx_antispam_field_when', '30%', 0, 0, '', 5);

-- data list: ip table actions

INSERT INTO `sys_form_pre_lists`(`module`, `key`, `title`, `use_for_sets`) VALUES 
('bx_antispam', 'bx_antispam_ip_table_actions', '_bx_antispam_data_list_ip_table_actions', 0);

INSERT INTO `sys_form_pre_values`(`Key`, `Value`, `LKey`, `LKey2`, `Order`) VALUES 
('bx_antispam_ip_table_actions', 'allow', '_bx_antispam_ip_allow', '', 0),
('bx_antispam_ip_table_actions', 'deny', '_bx_antispam_ip_deny', '', 0);

-- form: IP table add/edit

INSERT INTO `sys_objects_form`(`object`, `module`, `title`, `action`, `form_attrs`, `table`, `key`, `uri`, `uri_title`, `submit_name`, `params`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_antispam_ip_table_form', 'bx_antispam', '_bx_antispam_form_ip_table', 'grid.php?o={grid_object}&a={grid_action}', '', 'bx_antispam_ip_table', 'ID', '', '', 'bx_antispam_ip_table_submit', '', 0, 1, '', '');

INSERT INTO `sys_form_displays`(`object`, `display_name`, `module`, `view_mode`, `title`) VALUES 
('bx_antispam_ip_table_form', 'bx_antispam_ip_table_form_add', 'bx_antispam', 0, '_bx_antispam_form_ip_table_add'),
('bx_antispam_ip_table_form', 'bx_antispam_ip_table_form_edit', 'bx_antispam', 0, '_bx_antispam_form_ip_table_edit');

INSERT INTO `sys_form_inputs`(`object`, `module`, `name`, `value`, `values`, `checked`, `type`, `caption_system`, `caption`, `info`, `required`, `collapsed`, `html`, `attrs`, `attrs_tr`, `attrs_wrapper`, `checker_func`, `checker_params`, `checker_error`, `db_pass`, `db_params`, `editable`, `deletable`) VALUES 
('bx_antispam_ip_table_form', 'bx_antispam', 'ID', '', '', 0, 'hidden', '_bx_antispam_field_id', '', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 1, 0),
('bx_antispam_ip_table_form', 'bx_antispam', 'From', '', '', 0, 'text', '_bx_antispam_field_ip_from', '_bx_antispam_field_ip_from', '', 1, 0, 0, '', '', '', 'preg', 'a:1:{s:4:\"preg\";s:20:\"#\\d+\\.\\d+\\.\\d+\\.\\d+#\";}', '_bx_antispam_field_ip_err_msg', 'Xss', '', 1, 0),
('bx_antispam_ip_table_form', 'bx_antispam', 'To', '', '', 0, 'text', '_bx_antispam_field_ip_to', '_bx_antispam_field_ip_to', '', 1, 0, 0, '', '', '', 'preg', 'a:1:{s:4:\"preg\";s:20:\"#\\d+\\.\\d+\\.\\d+\\.\\d+#\";}', '_bx_antispam_field_ip_err_msg', 'Xss', '', 1, 0),
('bx_antispam_ip_table_form', 'bx_antispam', 'Type', 'allow', '#!bx_antispam_ip_table_actions', 0, 'select', '_bx_antispam_field_action', '_bx_antispam_field_action', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 1, 0),
('bx_antispam_ip_table_form', 'bx_antispam', 'LastDT', '', '', 0, 'datetime', '_bx_antispam_field_expiration', '_bx_antispam_field_expiration', '', 1, 0, 0, '', '', '', 'date_time', '', '_bx_antispam_field_expiration_err_msg', 'DateTimeTs', '', 1, 0),
('bx_antispam_ip_table_form', 'bx_antispam', 'Desc', '', '', 0, 'text', '_bx_antispam_field_note', '_bx_antispam_field_note', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 1, 0),
('bx_antispam_ip_table_form', 'bx_antispam', 'bx_antispam_ip_table_submit', '_sys_submit', '', 0, 'submit', '_sys_submit', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_antispam_ip_table_form', 'bx_antispam', 'close', '_sys_close', '', 0, 'reset', '_sys_close', '', '', 0, 0, 0, 'a:2:{s:7:\"onclick\";s:46:\"$(\'.bx-popup-applied:visible\').dolPopupHide();\";s:5:\"class\";s:22:\"bx-def-margin-sec-left\";}', '', '', '', '', '', '', '', 1, 0),
('bx_antispam_ip_table_form', 'bx_antispam', 'buttons', '', 'bx_antispam_ip_table_submit,close', 0, 'input_set', '_bx_antispam_form_buttons', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0);

INSERT INTO `sys_form_display_inputs`(`display_name`, `input_name`, `visible_for_levels`, `active`, `order`) VALUES 
('bx_antispam_ip_table_form_add', 'ID', 2147483647, 0, 0),
('bx_antispam_ip_table_form_add', 'From', 2147483647, 1, 1),
('bx_antispam_ip_table_form_add', 'To', 2147483647, 1, 2),
('bx_antispam_ip_table_form_add', 'Type', 2147483647, 1, 3),
('bx_antispam_ip_table_form_add', 'LastDT', 2147483647, 1, 4),
('bx_antispam_ip_table_form_add', 'Desc', 2147483647, 1, 5),
('bx_antispam_ip_table_form_add', 'bx_antispam_ip_table_submit', 2147483647, 1, 6),
('bx_antispam_ip_table_form_add', 'close', 2147483647, 1, 7),
('bx_antispam_ip_table_form_add', 'buttons', 2147483647, 1, 8),
('bx_antispam_ip_table_form_edit', 'ID', 2147483647, 1, 0),
('bx_antispam_ip_table_form_edit', 'From', 2147483647, 1, 1),
('bx_antispam_ip_table_form_edit', 'To', 2147483647, 1, 2),
('bx_antispam_ip_table_form_edit', 'Type', 2147483647, 1, 3),
('bx_antispam_ip_table_form_edit', 'LastDT', 2147483647, 1, 4),
('bx_antispam_ip_table_form_edit', 'Desc', 2147483647, 1, 5),
('bx_antispam_ip_table_form_edit', 'bx_antispam_ip_table_submit', 2147483647, 1, 6),
('bx_antispam_ip_table_form_edit', 'close', 2147483647, 1, 7),
('bx_antispam_ip_table_form_edit', 'buttons', 2147483647, 1, 8);

-- alerts

INSERT INTO `sys_alerts_handlers` (`name`, `class`, `file`, `service_call`) VALUES 
('bx_antispam', 'BxAntispamAlertsResponse', 'modules/boonex/antispam/classes/BxAntispamAlertsResponse.php', '');
SET @iHandler := LAST_INSERT_ID();

INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('account', 'check_login', @iHandler),
('account', 'check_join', @iHandler),
('system', 'check_spam', @iHandler),
('system', 'check_spam_url', @iHandler),
('system', 'form_check', @iHandler),
('system', 'form_submitted', @iHandler),
('comment', 'added', @iHandler),
('comment', 'edited', @iHandler);

-- email templates

INSERT INTO `sys_email_templates` (`Module`, `NameSystem`, `Name`, `Subject`, `Body`) VALUES
('bx_antispam', '_bx_antispam_spam_report_name', 'bx_antispam_spam_report', '_bx_antispam_spam_report_subject', '_bx_antispam_spam_report_body'),
('bx_antispam', '_bx_antispam_toxicity_blocked_report_name', 'bx_antispam_toxicity_blocked_report', '_bx_antispam_toxicity_blocked_report_subject', '_bx_antispam_toxicity_blocked_report_body'),
('bx_antispam', '_bx_antispam_toxicity_posted_report_name', 'bx_antispam_toxicity_posted_report', '_bx_antispam_toxicity_posted_report_subject', '_bx_antispam_toxicity_posted_report_body'),
('bx_antispam', '_bx_antispam_et_lasso_moderation_report_name', 'bx_antispam_lasso_moderation_report', '_bx_antispam_et_lasso_moderation_report_subject', '_bx_antispam_et_lasso_moderation_report_body');

-- cron

INSERT INTO `sys_cron_jobs` (`name`, `time`, `class`, `file`, `service_call`) VALUES
('bx_antispam_pruning', '0 0 * * *', 'BxAntispamCronPruning', 'modules/boonex/antispam/classes/BxAntispamCronPruning.php', ''),
('bx_antispam_update_disposable_email_domains', '0 0 */14 * *', 'BxAntispamCronUpdateDisposableEmailDomains', 'modules/boonex/antispam/classes/BxAntispamCronUpdateDisposableEmailDomains.php', '');

