--
-- Database
--

-- --------------------------------------------------------

DROP TABLE IF EXISTS `sys_keys`, `sys_objects_editor`, `sys_objects_iconset`, `sys_objects_player`, `sys_objects_push`, `sys_objects_sms`, `sys_objects_embeds`, `sys_objects_file_handlers`, `sys_objects_captcha`, `sys_objects_cmts`, `sys_cmts_images`, `sys_cmts_images_preview`, `sys_cmts_images2entries`, `sys_cmts_ids`, `sys_cmts_meta_keywords`, `sys_cmts_meta_mentions`, `sys_cmts_votes`, `sys_cmts_votes_track`, `sys_cmts_reactions`, `sys_cmts_reactions_track`, `sys_cmts_reports`, `sys_cmts_reports_track`, `sys_cmts_scores`, `sys_cmts_scores_track`, `sys_email_templates`, `sys_queue_push`, `sys_queue_email`, `sys_options`, sys_options_types, `sys_options_categories`, `sys_options_mixes`, `sys_options_mixes2options`,  `sys_localization_categories`, `sys_localization_keys`, `sys_localization_languages`, `sys_localization_strings`, `sys_acl_actions`, `sys_acl_actions_track`, `sys_acl_matrix`, `sys_acl_levels`, `sys_sessions`, `sys_acl_levels_members`, `sys_objects_rss`, `sys_objects_search`, `sys_objects_search_extended`, `sys_search_extended_fields`, `sys_search_extended_sorting_fields`, `sys_statistics`, `sys_audit`, `sys_alerts`, `sys_alerts_cache_triggers`, `sys_alerts_log`, `sys_alerts_desc`, `sys_alerts_handlers`, `sys_injections`, `sys_injections_admin`, `sys_modules`, `sys_modules_file_tracks`, `sys_modules_relations`, `sys_permalinks`, `sys_objects_privacy`, `sys_privacy_defaults`, `sys_privacy_groups`, `sys_privacy_groups_custom`, `sys_privacy_groups_custom_members`, `sys_privacy_groups_custom_memberships`, `sys_objects_recommendation`, `sys_recommendation_criteria`, `sys_recommendation_data`, `sys_objects_auths`, `sys_objects_score`, `sys_objects_vote`, `sys_objects_report`, `sys_objects_view`, `sys_objects_favorite`, `sys_objects_feature`, `sys_objects_chart`, `sys_objects_content_info`, `sys_content_info_grids`, `sys_background_jobs`, `sys_cron_jobs`, `sys_objects_storage`, `sys_objects_uploader`, `sys_storage_user_quotas`, `sys_storage_tokens`, `sys_storage_ghosts`, `sys_storage_deletions`, `sys_storage_mime_types`, `sys_objects_transcoder`, `sys_transcoder_images_files`, `sys_transcoder_videos_files`, `sys_transcoder_audio_files`, `sys_transcoder_filters`, `sys_transcoder_queue`, `sys_transcoder_queue_files`, `sys_accounts`, `sys_accounts_password`, `sys_accounts_pictures`, `sys_accounts_pictures_resized`, `sys_profiles`, `sys_profiles_track`, `sys_objects_form`, `sys_form_displays`, `sys_form_inputs`, `sys_form_inputs_privacy`, `sys_form_display_inputs`, `sys_form_pre_lists`, `sys_form_pre_values`, `sys_menu_templates`, `sys_objects_menu`, `sys_menu_sets`, `sys_menu_items`, `sys_objects_grid`, `sys_grid_fields`, `sys_grid_actions`, `sys_objects_connection`, `sys_profiles_conn_bans`, `sys_profiles_conn_relations`, `sys_profiles_conn_subscriptions`, `sys_profiles_conn_friends`, `sys_objects_page`, `sys_pages_types`, `sys_pages_layouts`, `sys_pages_layout_columns`, `sys_pages_design_boxes`, `sys_pages_content_placeholders`, `sys_pages_blocks`, `sys_pages_blocks_data`, `sys_labels`, `sys_objects_metatags`, `sys_objects_category`, `sys_objects_live_updates`, `sys_objects_payments`, `sys_files`, `sys_images`, `sys_images_custom`, `sys_images_resized`, `sys_images_editor`, `sys_images_editor_resized`, `sys_wiki_files`, `sys_wiki_images_resized`, `sys_rewrite_rules`, `sys_seo_links`, `sys_seo_uri_rewrites`, `sys_api_keys`, `sys_api_origins`, `sys_agents_models`, `sys_agents_automators`, `sys_agents_automators_providers`, `sys_agents_automators_helpers`, `sys_agents_automators_assistants`, `sys_agents_automators_messages`, `sys_agents_provider_types`, `sys_agents_provider_options`, `sys_agents_providers`, `sys_agents_providers_values`, `sys_agents_helpers`, `sys_agents_assistants`, `sys_agents_assistants_files`, `sys_agents_assistants_chats`, `sys_agents_assistants_chats_messages`, `sys_agents_assistants_chats_files`, `sys_agents_vector_store`, `sys_agents_vector_store_data`, `sys_agents_agents`, `sys_agents_tools`, `sys_agents_chat_history`, `sys_preloader`, `sys_std_roles`, `sys_std_roles_actions`, `sys_std_roles_actions2roles`, `sys_std_roles_members`, `sys_std_pages`, `sys_std_widgets`, `sys_std_widgets_bookmarks`, `sys_std_pages_widgets`, `sys_categories`, `sys_categories2objects`, `sys_objects_logs`, `sys_objects_location_field`, `sys_objects_location_map`, `sys_objects_wiki`, `sys_pages_wiki_blocks`, `sys_badges`, `sys_badges2objects`, `sys_form_fields_reaction`, `sys_form_fields_reaction_track`, `sys_form_fields_votes`, `sys_form_fields_votes_track`, `sys_form_fields_ids`, `sys_iframely_data`, `sys_embeded_data`, `sys_logger`;

ALTER DATABASE DEFAULT CHARACTER SET 'utf8mb4' COLLATE 'utf8mb4_unicode_ci';
SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci';


-- --------------------------------------------------------


CREATE TABLE `sys_keys` (
  `key` varchar(32) NOT NULL,
  `data` text NOT NULL,
  `expire` int(11) NOT NULL,
  `salt` varchar(255) NOT NULL,
  PRIMARY KEY (`key`)
);


-- --------------------------------------------------------


CREATE TABLE `sys_objects_editor` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object` varchar(64) NOT NULL,
  `title` varchar(255) NOT NULL,
  `skin` varchar(255) NOT NULL,
  `override_class_name` varchar(255) NOT NULL,
  `override_class_file` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `object` (`object`)
);


INSERT INTO `sys_objects_editor` (`object`, `title`, `skin`, `override_class_name`, `override_class_file`) VALUES
('sys_quill', 'Quill', 'snow', 'BxTemplEditorQuill', '');


-- --------------------------------------------------------


CREATE TABLE `sys_objects_iconset` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object` varchar(64) NOT NULL,
  `title` varchar(255) NOT NULL,
  `override_class_name` varchar(255) NOT NULL,
  `override_class_file` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `object` (`object`)
);

INSERT INTO `sys_objects_iconset` (`object`, `title`, `override_class_name`, `override_class_file`) VALUES
('sys_fontawesome', 'Font Awesome', 'BxTemplIconsetFontAwesome', ''),
('sys_lucide', 'Lucide', 'BxTemplIconsetLucide', '');


-- --------------------------------------------------------


CREATE TABLE `sys_objects_player` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object` varchar(64) NOT NULL,
  `title` varchar(255) NOT NULL,
  `skin` varchar(255) NOT NULL,
  `override_class_name` varchar(255) NOT NULL,
  `override_class_file` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `object` (`object`)
);


INSERT INTO `sys_objects_player` (`object`, `title`, `skin`, `override_class_name`, `override_class_file`) VALUES
('sys_html5', 'HTML5', '', 'BxTemplPlayerHtml5', '');


-- --------------------------------------------------------


CREATE TABLE `sys_objects_push` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object` varchar(64) NOT NULL,
  `title` varchar(255) NOT NULL,
  `override_class_name` varchar(255) NOT NULL,
  `override_class_file` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `object` (`object`)
);

INSERT INTO `sys_objects_push` (`object`, `title`, `override_class_name`, `override_class_file`) VALUES
('sys_onesignal', 'OneSignal', 'BxTemplPushOneSignal', ''),
('sys_wonderpush', 'WonderPush', 'BxTemplPushWonderPush', '');

-- --------------------------------------------------------


CREATE TABLE `sys_objects_sms` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object` varchar(64) NOT NULL,
  `title` varchar(255) NOT NULL,
  `override_class_name` varchar(255) NOT NULL,
  `override_class_file` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `object` (`object`)
);

INSERT INTO `sys_objects_sms` (`object`, `title`, `override_class_name`, `override_class_file`) VALUES
('sys_twilio', 'Twilio', 'BxDolSmsTwilio', ''),
('sys_smsru', 'SMS.RU', 'BxDolSmsSmsRu', '');


-- --------------------------------------------------------


CREATE TABLE `sys_objects_embeds` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object` varchar(64) NOT NULL,
  `title` varchar(255) NOT NULL,
  `override_class_name` varchar(255) NOT NULL,
  `override_class_file` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `object` (`object`)
);


INSERT INTO `sys_objects_embeds` (`object`, `title`, `override_class_name`, `override_class_file`) VALUES
('sys_system', '_adm_stg_cpt_option_sys_embed_system', 'BxTemplEmbedSystem', ''),
('sys_microlink', '_adm_stg_cpt_option_sys_embed_microlink', 'BxTemplEmbedMicrolink', ''),
('sys_peekalink', '_adm_stg_cpt_option_sys_embed_peekalink', 'BxTemplEmbedPeekalink', ''),
('sys_embedly', 'Embedly', 'BxTemplEmbedEmbedly', ''),
('sys_iframely', 'Iframely', 'BxTemplEmbedIframely', ''),
('sys_oembed', 'Oembed', 'BxTemplEmbedOembed', '');

-- --------------------------------------------------------

CREATE TABLE `sys_iframely_data` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `url` varchar(255) DEFAULT NULL,
  `data` text DEFAULT NULL,
  `added` int(11) DEFAULT NULL,
  `theme` varchar(10) DEFAULT NULL,
  PRIMARY KEY (id)
);

-- --------------------------------------------------------

CREATE TABLE `sys_embeded_data` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `url` varchar(255) DEFAULT NULL,
  `data` text DEFAULT NULL,
  `added` int(11) DEFAULT NULL,
  `theme` varchar(10) DEFAULT NULL,
  PRIMARY KEY (id)
);

-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `sys_objects_file_handlers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object` varchar(64) NOT NULL,
  `title` varchar(255) NOT NULL,
  `preg_ext` text NOT NULL,
  `active` tinyint(4) NOT NULL,
  `order` int(11) NOT NULL,
  `override_class_name` varchar(255) NOT NULL,
  `override_class_file` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `object` (`object`)
);

INSERT INTO `sys_objects_file_handlers` (`object`, `title`, `preg_ext`, `active`, `order`, `override_class_name`, `override_class_file`) VALUES
('sys_ms_viewer', '_sys_file_handlers_ms_viewer', '/\\.(doc|docx|xls|xlsx|ppt|pptx)$/i', 1, 1, 'BxTemplFileHandlerMsViewer', ''),
('sys_google_viewer', '_sys_file_handlers_google_viewer', '/\\.(pdf|doc|docx|xls|xlsx|ppt|pptx|ai|svg|ps|tif|tiff)$/i', 1, 2, 'BxTemplFileHandlerGoogleViewer', ''),
('sys_images_viewer', '_sys_file_handlers_images_viewer', '/\\.(jpg|jpeg|png|gif|webp)$/i', 1, 3, 'BxTemplFileHandlerImagesViewer', ''),
('sys_code_viewer', '_sys_file_handlers_code_viewer', '/\\.(1st|aspx|asp|json|js|jsp|java|php|xml|html|htm|rdf|xsd|xsl|xslt|sax|rss|cfm|js|asm|pl|prl|bas|b|vbs|fs|src|cs|ws|cgi|bat|py|c|cpp|cc|cp|h|hh|cxx|hxx|c++|m|lua|swift|sh|as|cob|tpl|lsp|x|cmd|rb|cbl|pas|pp|vb|f|perl|jl|lol|bal|pli|css|less|sass|saas|bcc|coffee|jade|j|tea|c#|sas|diff|pro|for|sh|bsh|bash|twig|csh|lisp|lsp|cobol|pl|d|git|rb|hrl|cr|inp|a|go|as3|m|sql|md|txt|csv)$/i', 1, 4, 'BxTemplFileHandlerCodeViewer', ''),
('sys_sounds_viewer', '_sys_file_handlers_sounds_viewer', '/\\.(mp3|m4a|m4b|wma|wav|3gp)$/i', 1, 5, 'BxTemplFileHandlerSoundsViewer', ''),
('sys_videos_viewer', '_sys_file_handlers_videos_viewer', '/\\.(avi|flv|mpg|mpeg|wmv|mp4|m4v|mov|qt|divx|xvid|3gp|3g2|webm|mkv|ogv|ogg|rm|rmvb|asf|drc|ts)$/i', 1, 5, 'BxTemplFileHandlerVideosViewer', '');


-- --------------------------------------------------------


CREATE TABLE `sys_objects_captcha` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object` varchar(64) NOT NULL,
  `title` varchar(255) NOT NULL,
  `override_class_name` varchar(255) NOT NULL,
  `override_class_file` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
);

INSERT INTO `sys_objects_captcha` (`object`, `title`, `override_class_name`, `override_class_file`) VALUES
('sys_recaptcha_new', 'reCAPTCHA', 'BxTemplCaptchaReCAPTCHANew', ''),
('sys_recaptcha_invisible', 'reCAPTCHA Invisible', 'BxTemplCaptchaReCAPTCHAInvisible', ''),
('sys_hcaptcha', 'hCaptcha', 'BxTemplCaptchaHCaptcha', '');


-- --------------------------------------------------------


CREATE TABLE `sys_objects_auths` (
  `ID` int(10) unsigned NOT NULL auto_increment,
  `Name` varchar(64) NOT NULL,
  `Title` varchar(128) NOT NULL,
  `Link` varchar(255) NOT NULL,
  `OnClick` varchar(255) NOT NULL,
  `Icon` varchar(64) NOT NULL,
  `Style` varchar(255) NOT NULL,
  PRIMARY KEY  (`ID`)
);


-- --------------------------------------------------------

--
-- Table structure for table `sys_objects_cmts`
--

CREATE TABLE `sys_objects_cmts` (
  `ID` int(10) unsigned NOT NULL auto_increment,
  `Name` varchar(64) NOT NULL,
  `Module` varchar(32) NOT NULL,
  `Table` varchar(50) NOT NULL,
  `CharsPostMin` int(10) NOT NULL,
  `CharsPostMax` int(10) NOT NULL,
  `CharsDisplayMax` int(10) NOT NULL,
  `Html` smallint(1) NOT NULL,
  `PerView` smallint(6) NOT NULL,
  `PerViewReplies` smallint(6) NOT NULL,
  `BrowseType` varchar(50) NOT NULL,
  `IsBrowseSwitch` smallint(1) NOT NULL,
  `PostFormPosition` varchar(50) NOT NULL,
  `NumberOfLevels` smallint(6) NOT NULL,
  `IsDisplaySwitch` smallint(1) NOT NULL,
  `IsRatable` smallint(1) NOT NULL,
  `ViewingThreshold` smallint(6) NOT NULL,
  `IsOn` smallint(1) NOT NULL,
  `RootStylePrefix` varchar(16) NOT NULL default 'cmt',
  `BaseUrl` varchar(256) NOT NULL,
  `ObjectVote` varchar(64) NOT NULL default '',
  `ObjectReaction` varchar(64) NOT NULL default '',
  `ObjectScore` varchar(64) NOT NULL default '',
  `ObjectReport` varchar(64) NOT NULL default '',
  `TriggerTable` varchar(32) NOT NULL,
  `TriggerFieldId` varchar(32) NOT NULL,
  `TriggerFieldAuthor` varchar(32) NOT NULL,
  `TriggerFieldTitle` varchar(32) NOT NULL,
  `TriggerFieldComments` varchar(32) NOT NULL,
  `ClassName` varchar(32) NOT NULL,
  `ClassFile` varchar(256) NOT NULL,
  PRIMARY KEY  (`ID`)
);

INSERT INTO `sys_objects_cmts` (`Name`, `Module`, `Table`, `CharsPostMin`, `CharsPostMax`, `CharsDisplayMax`, `Html`, `PerView`, `PerViewReplies`, `BrowseType`, `IsBrowseSwitch`, `PostFormPosition`, `NumberOfLevels`, `IsDisplaySwitch`, `IsRatable`, `ViewingThreshold`, `IsOn`, `RootStylePrefix`, `BaseUrl`, `ObjectVote`, `TriggerTable`, `TriggerFieldId`, `TriggerFieldAuthor`, `TriggerFieldTitle`, `TriggerFieldComments`, `ClassName`, `ClassFile`) VALUES
('sys_agents_automators', 'system', 'sys_agents_automators_messages', 1, 5000, 1000, 0, 9999, 3, 'tail', 1, 'bottom', 1, 1, 1, -3, 1, 'cmt', 'agents.php?page=automators&id={object_id}', '', 'sys_agents_automators', 'id', '', '', 'messages', 'BxDolStudioAgentsAutomatorsCmts', ''),
('sys_agents_assistants_chats', 'system', 'sys_agents_assistants_chats_messages', 1, 5000, 1000, 0, 9999, 3, 'tail', 1, 'bottom', 1, 1, 1, -3, 1, 'cmt', 'agents.php?page=assistants&aid={assistant_id}', '', 'sys_agents_assistants_chats', 'id', '', '', 'messages', 'BxDolStudioAgentsAsstChatsCmts', '');

-- --------------------------------------------------------

CREATE TABLE `sys_queue_push` (
  `id` int(11) NOT NULL auto_increment,
  `profile_id` int(11) NOT NULL default '0',
  `message` text NOT NULL default '',
  PRIMARY KEY (`id`)
);

-- --------------------------------------------------------

CREATE TABLE `sys_queue_email` (
  `id` int(11) NOT NULL auto_increment,
  `email` varchar(64) NOT NULL default '',
  `subject` varchar(255) NOT NULL default '',
  `body` text NOT NULL default '',
  `params` text NOT NULL default '',
  PRIMARY KEY (`id`)
);

-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `sys_email_templates` (
  `ID` int(11) unsigned NOT NULL auto_increment,
  `Module` varchar(32) NOT NULL,
  `NameSystem` varchar(255) NOT NULL,
  `Name` varchar(255) NOT NULL,
  `Subject` varchar(255) NOT NULL,
  `Body` varchar(255) NOT NULL,
  PRIMARY KEY  (`ID`)
);

INSERT INTO `sys_email_templates` (`Module`, `NameSystem`, `Name`, `Subject`, `Body`) VALUES
('system', '_sys_et_txt_name_system_admin_email', 't_AdminEmail', '_sys_et_txt_subject_admin_email', '_sys_et_txt_body_admin_email'),
('system', '_sys_et_txt_name_system_confirmation', 't_Confirmation', '_sys_et_txt_subject_confirmation', '_sys_et_txt_body_confirmation'),
('system', '_sys_et_txt_name_system_welcome', 't_Welcome', '_sys_et_txt_subject_welcome', '_sys_et_txt_body_welcome'),
('system', '_sys_et_txt_name_system_forgot', 't_Forgot', '_sys_et_txt_subject_forgot', '_sys_et_txt_body_forgot'),
('system', '_sys_et_txt_name_system_mem_expiration', 't_MemExpiration', '_sys_et_txt_subject_mem_expiration', '_sys_et_txt_body_mem_expiration'),
('system', '_sys_et_txt_name_system_mem_changed', 't_MemChanged', '_sys_et_txt_subject_mem_changed', '_sys_et_txt_body_mem_changed'),
('system', '_sys_et_txt_name_system_mem_prolonged', 't_MemProlonged', '_sys_et_txt_subject_mem_prolonged', '_sys_et_txt_body_mem_prolonged'),
('system', '_sys_et_txt_name_system_comment_replied', 't_CommentReplied', '_sys_et_txt_subject_comment_replied', '_sys_et_txt_body_comment_replied'),
('system', '_sys_et_txt_name_system_reported', 't_Reported', '_sys_et_txt_subject_system_reported', '_sys_et_txt_body_system_reported'),
('system', '_sys_et_txt_name_system_delayed_module_uninstall', 't_DelayedModuleUninstall', '_sys_et_txt_subject_delayed_module_uninstall', '_sys_et_txt_body_delayed_module_uninstall'),
('system', '_sys_et_txt_name_system_account', 't_Account', '_sys_et_txt_subject_account', '_sys_et_txt_body_account'),
('system', '_sys_et_txt_name_system_account_password_expired', 't_AccountPasswordExpired', '_sys_et_txt_subject_account_password_expired', '_sys_et_txt_body_account_password_expired'),
('system', '_sys_et_txt_name_system_pruning', 't_Pruning', '_sys_et_txt_subject_pruning', '_sys_et_txt_body_pruning'),
('system', '_sys_et_txt_name_profile_change_status_active', 't_ChangeStatusActive', '_sys_et_txt_subject_profile_change_status_active', '_sys_et_txt_body_profile_change_status_active'),
('system', '_sys_et_txt_name_profile_change_status_suspended', 't_ChangeStatusSuspended', '_sys_et_txt_subject_profile_change_status_suspended', '_sys_et_txt_body_profile_change_status_suspended'),
('system', '_sys_et_txt_name_profile_change_status_pending', 't_ChangeStatusPending', '_sys_et_txt_subject_profile_change_status_pending', '_sys_et_txt_body_profile_change_status_pending'),
('system', '_sys_et_txt_name_upgrade_failed', 't_UpgradeFailed', '_sys_et_txt_subject_upgrade_failed', '_sys_et_txt_body_upgrade_failed'),
('system', '_sys_et_txt_name_upgrade_modules_failed', 't_UpgradeModulesFailed', '_sys_et_txt_subject_upgrade_modules_failed', '_sys_et_txt_body_upgrade_modules_failed'),
('system', '_sys_et_txt_name_upgrade_success', 't_UpgradeSuccess', '_sys_et_txt_subject_upgrade_success', '_sys_et_txt_body_upgrade_success'),
('system', '_sys_et_txt_name_upgrade_modules_success', 't_UpgradeModulesSuccess', '_sys_et_txt_subject_upgrade_modules_success', '_sys_et_txt_body_upgrade_modules_success'),
('system', '_sys_et_txt_name_bg_operation_failed', 't_BgOperationFailed', '_sys_et_txt_subject_bg_operation_failed', '_sys_et_txt_body_bg_operation_failed'),
('system', '_sys_et_txt_name_account_change_status_activate', 't_ChangeStatusAccountActivate', '_sys_et_txt_subject_account_change_status_activate', '_sys_et_txt_body_account_change_status_activate'),
('system', '_sys_et_txt_name_account_change_status_suspended', 't_ChangeStatusAccountSuspend', '_sys_et_txt_subject_account_change_status_suspended', '_sys_et_txt_body_account_change_status_suspended'),
('system', '_sys_et_txt_name_manage_approve', 't_ManageApprove', '_sys_et_txt_subject_manage_approve', '_sys_et_txt_body_manage_approve');

-- --------------------------------------------------------

--
-- Table structure for table `sys_options`
--
CREATE TABLE `sys_options` (
  `id` int(11) unsigned NOT NULL auto_increment,
  `category_id` int(11) unsigned NOT NULL default '0',
  `name` varchar(64) NOT NULL default '',
  `caption` varchar(255) NOT NULL default '',
  `info` varchar(255) NOT NULL default '',
  `value` mediumtext NOT NULL,
  `type` enum('value','digit','secret','secret_text','text','code','checkbox','select','combobox','file','image','list','rlist','rgb','rgba','datetime') NOT NULL default 'digit',
  `extra` text NOT NULL default '',
  `check` varchar(32) NOT NULL,
  `check_params` text NOT NULL,
  `check_error` varchar(255) NOT NULL default '',
  `order` int(11) default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name`(`name`),
  KEY `category_id` (`category_id`)
);

--
-- Table structure for table `sys_options_categories`
--
CREATE TABLE `sys_options_categories` (
  `id` int(11) unsigned NOT NULL auto_increment,
  `type_id` int(11) unsigned NOT NULL default '0',
  `name` varchar(64) NOT NULL default '',
  `caption` varchar(64) NOT NULL default '',
  `hidden` tinyint(1) NOT NULL default '0',
  `order` int(11) default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name`(`name`)
);

--
-- Table structure for table `sys_options_types`
--
CREATE TABLE `sys_options_types` (
  `id` int(11) unsigned NOT NULL auto_increment,
  `group` varchar(64) NOT NULL default '',
  `name` varchar(64) NOT NULL default '',
  `caption` varchar(64) NOT NULL default '',
  `icon` varchar(255) NOT NULL default '',
  `order` int(11) default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name`(`name`)
);

--
-- Dumping data for tables `sys_options_types`
--
INSERT INTO `sys_options_types`(`group`, `name`, `caption`, `icon`, `order`) VALUES ('system', 'system', '_adm_stg_cpt_type_system', 'mi-cog.svg', 1);
SET @iTypeId = LAST_INSERT_ID();

--
-- CATEGORY (HIDDEN): Hidden
--
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `hidden`, `order`) VALUES (@iTypeId, 'hidden', '_adm_stg_cpt_category_hidden', 1, 0);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_params`, `check_error`, `order`) VALUES
(@iCategoryId, 'sys_cron_time', '_adm_stg_cpt_option_sys_cron_time', '0', 'digit', '', '', '', '', 2),
(@iCategoryId, 'sys_upgrade_channel', '_adm_stg_cpt_option_sys_upgrade_channel', 'beta', 'select', 'stable,beta', '', '', '', 4),
(@iCategoryId, 'sys_revision', '_adm_stg_cpt_option_sys_revision', '0', 'digit', '', '', '', '', 5),
(@iCategoryId, 'sys_eq_time', '_adm_stg_cpt_option_sys_eq_time', '0', 'digit', '', '', '', '', 6),
(@iCategoryId, 'sys_push_queue_time', '_adm_stg_cpt_option_sys_push_queue_time', '0', 'digit', '', '', '', '', 7),

(@iCategoryId, 'sys_ftp_login', '_adm_stg_cpt_option_sys_ftp_login', '', 'digit', '', '', '', '', 10),
(@iCategoryId, 'sys_ftp_password', '_adm_stg_cpt_option_sys_ftp_password', '', 'secret', '', '', '', '', 11),
(@iCategoryId, 'sys_ftp_dir', '_adm_stg_cpt_option_sys_ftp_dir', '', 'digit', '', '', '', '', 12),

(@iCategoryId, 'sys_template_cache_image_enable', '_adm_stg_cpt_option_sys_template_cache_image_enable', '', 'checkbox', '', '', '', '', 20),
(@iCategoryId, 'sys_template_cache_image_max_size', '_adm_stg_cpt_option_sys_template_cache_image_max_size', '5', 'digit', '', 'Segment', 'a:2:{s:3:"min";i:1;s:3:"max";i:10;}', '_adm_stg_cpt_option_sys_template_cache_image_max_size_err', 21),

(@iCategoryId, 'sys_email_attachable_email_templates', '_adm_stg_cpt_option_sys_email_attachable_email_templates', '', 'digit', '', '', '', '', 31),

(@iCategoryId, 'sys_redirect_after_account_added', '_adm_stg_cpt_option_sys_redirect_after_account_added', 'page.php?i=account-profile-switcher&register=1', 'digit', '', '', '', '', 40),
(@iCategoryId, 'sys_redirect_after_email_confirmation', '_adm_stg_cpt_option_sys_redirect_after_email_confirmation', '', 'digit', '', '', '', '', 41),

(@iCategoryId, 'sys_editor_default', '_adm_stg_cpt_option_sys_editor_default', 'sys_quill', 'digit', '', '', '', '', 50),
(@iCategoryId, 'sys_player_default', '_adm_stg_cpt_option_sys_player_default', 'sys_html5', 'digit', '', '', '', '', 55),
(@iCategoryId, 'sys_player_default_format', '_adm_stg_cpt_option_sys_player_default_quality', 'sd', 'select', 'sd,hd', '', '', '', 56),

(@iCategoryId, 'sys_live_updates_interval', '_adm_stg_cpt_option_sys_live_updates_interval', '10000', 'digit', '', '', '', '', 60),

(@iCategoryId, 'sys_quill_insert_as_plain_text', '_adm_stg_cpt_option_sys_quill_insert_as_plain_text', '', 'checkbox', '', '', '', '', 65),
(@iCategoryId, 'sys_quill_allow_empty_tags', '_adm_stg_cpt_option_sys_quill_allow_empty_tags', 'on', 'checkbox', '', '', '', '', 66),
(@iCategoryId, 'sys_quill_allowed_tags_mini', '_adm_stg_cpt_option_sys_quill_allowed_tags_mini', '', 'digit', '', '', '', '', 67),
(@iCategoryId, 'sys_quill_allowed_tags_standard', '_adm_stg_cpt_option_sys_quill_allowed_tags_standard', '', 'digit', '', '', '', '', 68),
(@iCategoryId, 'sys_quill_allowed_tags_full', '_adm_stg_cpt_option_sys_quill_allowed_tags_full', '', 'digit', '', '', '', '', 69),
(@iCategoryId, 'sys_quill_toolbar_mini', '_adm_stg_cpt_option_sys_quill_toolbar_mini', '[\'bold\',\'italic\',\'underline\',\'clean\',{\'list\':\'ordered\'}, {\'list\':\'bullet\'},{ \'align\':\'\'},{\'align\':\'center\'},{\'align\':\'right\'},\'blockquote\',\'link\',\'image\',\'embed\']', 'digit', '', '', '', '', 70),
(@iCategoryId, 'sys_quill_toolbar_standard', '_adm_stg_cpt_option_sys_quill_toolbar_standard', '[\'bold\',\'italic\',\'underline\',\'clean\',{ \'header\': [1, 2, 3, 4, 5, 6, false] },{\'list\':\'ordered\'}, {\'list\':\'bullet\'},{\'indent\': \'-1\'},{\'indent\': \'+1\'},{ \'align\':\'\'},{\'align\':\'center\'},{\'align\':\'right\'},{\'align\':\'justify\'},\'blockquote\',\'link\',\'image\',\'embed\',\'emoji\']', 'digit', '', '', '', '', 73),
(@iCategoryId, 'sys_quill_toolbar_full', '_adm_stg_cpt_option_sys_quill_toolbar_full', '[{ \'header\': [1, 2, 3, 4, 5, 6, false] },\'bold\',\'italic\',\'underline\',\'clean\'],
  [{ \'align\': [] },{\'list\':\'ordered\'}, {\'list\':\'bullet\'},{\'indent\': \'-1\'},{\'indent\': \'+1\'},\'blockquote\',{ \'color\': [] }, { \'background\': [] },{ \'direction\': \'rtl\' },\'link\',\'image\',\'embed\',\'code-block\',\'emoji\',\'show-html\']', 'digit', '', '', '', '', 76),

(@iCategoryId, 'sys_search_keyword_min_len', '_adm_stg_cpt_option_sys_search_keyword_min_len', '1', 'digit', '', '', '', '', 80),

(@iCategoryId, 'sys_relations_enable', '_adm_stg_cpt_option_sys_relations_enable', '', 'checkbox', '', '', '', '', 90),
(@iCategoryId, 'sys_relations', '_adm_stg_cpt_option_sys_relations', '', 'list', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:21:"get_options_relations";s:6:"params";a:0:{}s:5:"class";s:13:"TemplServices";}', '', '', '', 91),

(@iCategoryId, 'enable_gd', '_adm_stg_cpt_option_enable_gd', 'on', 'checkbox', '', '', '', '', 100),
(@iCategoryId, 'sys_transcoder_queue_storage', '_adm_stg_cpt_option_sys_transcoder_queue_storage', '', 'checkbox', '', '', '', '', 105),
(@iCategoryId, 'sys_session_lifetime_in_min', '_adm_stg_cpt_option_sys_session_lifetime_in_min', '129600', 'digit', '', '', '', '', 110),
(@iCategoryId, 'sys_session_auth', '_adm_stg_cpt_option_sys_session_auth', 'on', 'checkbox', '', '', '', '', 112),

(@iCategoryId, 'sys_logs_storage_default', '_adm_stg_cpt_option_sys_logs_storage_default', 'Folder', 'select', 'Folder,PHPLog,STDErr', '', '', '', 130),
(@iCategoryId, 'sys_logs_level', '_adm_stg_cpt_option_sys_logs_level', 'DEBUG', 'select', 'ERROR,WARNING,INFO,DEBUG', '', '', '', 132),

(@iCategoryId, 'sys_default_socket_timeout', '_adm_stg_cpt_option_sys_default_socket_timeout', '30', 'digit', '', '', '', '', 140),
(@iCategoryId, 'sys_default_curl_timeout', '_adm_stg_cpt_option_sys_default_curl_timeout', '300', 'digit', '', '', '', '', 141),
(@iCategoryId, 'sys_curl_ssl_allow_untrusted', '_adm_stg_cpt_option_sys_ssl_allow_untrusted', '', 'checkbox', '', '', '', '', 145),

(@iCategoryId, 'sys_csp_frame_ancestors', '_adm_stg_cpt_option_sys_csp_frame_ancestors', '*', 'digit', '', '', '', '', 150),
(@iCategoryId, 'sys_x_frame_options', '_adm_stg_cpt_option_sys_x_frame_options', 'SAMEORIGIN', 'select', 'Off,SAMEORIGIN,DENY', '', '', '', 151),
(@iCategoryId, 'sys_samesite_cookies', '_adm_stg_cpt_option_sys_samesite_cookies', 'Lax', 'select', 'None,Lax,Strict', '', '', '', 152),

(@iCategoryId, 'sys_notify_to_approve_by_role', '_adm_stg_cpt_option_sys_notify_to_approve_by_role', '', 'checkbox', '', '', '', '', 160),

(@iCategoryId, 'sys_fixed_header', '_adm_stg_cpt_option_sys_fixed_header', '', 'checkbox', '', '', '', '', 170),

(@iCategoryId, 'sys_css_media_classes', '_adm_stg_cpt_option_sys_css_media_classes', '{"phone":"(max-width:720px)","phone2":"(min-width:533px) and (max-width:720px)","tablet":"(min-width:720px) and (max-width:1280px)","tablet2":"(min-width:1024px) and (max-width:1280px)","desktop":"(min-width:1280px)"}', 'digit', '', '', '', '', 180),
(@iCategoryId, 'sys_css_tailwind_default', '_adm_stg_cpt_option_sys_css_tailwind_default', 'tailwind.min.css', 'select', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:27:"get_options_taiwind_default";s:5:"class";s:13:"TemplServices";}', '', '', '', 181),
(@iCategoryId, 'sys_iconset_default', '_adm_stg_cpt_option_sys_iconset_default', 'sys_fontawesome', 'select', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:27:"get_options_iconset_default";s:5:"class";s:13:"TemplServices";}', '', '', '', 185),

(@iCategoryId, 'sys_files_ext_images', '_adm_stg_cpt_option_sys_files_ext_images', 'jpg,jpeg,jpe,gif,png,webp,svg', 'digit', '', '', '', '', 200),
(@iCategoryId, 'sys_files_ext_video', '_adm_stg_cpt_option_sys_files_ext_video', 'avi,flv,mpg,mpeg,wmv,mp4,m4v,mov,qt,divx,xvid,3gp,3g2,webm,mkv,ogv,ogg,rm,rmvb,asf,drc,ts', 'digit', '', '', '', '', 210),
(@iCategoryId, 'sys_files_ext_audio', '_adm_stg_cpt_option_sys_files_ext_audio', 'mp3,m4a,m4b,wma,wav,3gp', 'digit', '', '', '', '', 220),
(@iCategoryId, 'sys_files_ext_imagevideo', '_adm_stg_cpt_option_sys_files_ext_imagevideo', 'jpg,jpeg,jpe,gif,png,svg,webp,avi,flv,mpg,mpeg,wmv,mp4,m4v,mov,qt,divx,xvid,3gp,3g2,webm,mkv,ogv,ogg,rm,rmvb,asf,drc,ts', 'digit', '', '', '', '', 230),
(@iCategoryId, 'sys_files_ext_dangerous', '_adm_stg_cpt_option_sys_files_ext_dangerous', 'action,apk,app,bat,bin,cmd,com,command,cpl,csh,exe,gadget,inf,ins,inx,ipa,isu,job,jse,ksh,lnk,msc,msi,msp,mst,osx,out,paf,pif,prg,ps1,reg,rgs,run,sct,shb,shs,u3p,vb,vbe,vbs,vbscript,workflow,ws,wsf', 'digit', '', '', '', '', 240),

(@iCategoryId, 'sys_viewport_meta_tag', '_adm_stg_cpt_option_sys_viewport_meta_tag', 'width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0', 'digit', '', '', '', '', 250),

(@iCategoryId, 'sys_form_lpc_enable', '_adm_stg_cpt_option_sys_form_lpc_enable', 'on', 'checkbox', '', '', '', '', 260),

(@iCategoryId, 'sys_std_show_header_left', '_adm_stg_cpt_option_sys_std_show_header_left', 'on', 'checkbox', '', '', '', '', 270),
(@iCategoryId, 'sys_std_show_header_left_search', '_adm_stg_cpt_option_sys_std_show_header_left_search', '', 'checkbox', '', '', '', '', 271),
(@iCategoryId, 'sys_std_show_header_center', '_adm_stg_cpt_option_sys_std_show_header_center', 'on', 'checkbox', '', '', '', '', 275),
(@iCategoryId, 'sys_std_show_header_right', '_adm_stg_cpt_option_sys_std_show_header_right', 'on', 'checkbox', '', '', '', '', 280),
(@iCategoryId, 'sys_std_show_header_right_search', '_adm_stg_cpt_option_sys_std_show_header_right_search', 'on', 'checkbox', '', '', '', '', 281),
(@iCategoryId, 'sys_std_show_header_right_site', '_adm_stg_cpt_option_sys_std_show_header_right_site', '', 'checkbox', '', '', '', '', 282),
(@iCategoryId, 'sys_std_show_launcher_left', '_adm_stg_cpt_option_sys_std_show_launcher_left', '', 'checkbox', '', '', '', '', 285),

(@iCategoryId, 'sys_std_pgt_etemplates_editor', '_adm_stg_cpt_option_sys_std_pgt_etemplates_editor', 'on', 'checkbox', '', '', '', '', 290),

(@iCategoryId, 'sys_bg_jobs_process_per_run', '_adm_stg_cpt_option_sys_bg_jobs_process_per_run', '5', 'digit', '', '', '', '', 300),
(@iCategoryId, 'sys_bg_jobs_workers_limit', '_adm_stg_cpt_option_sys_bg_jobs_workers_limit', '3', 'digit', '', '', '', '', 304),
(@iCategoryId, 'sys_bg_jobs_cleanup_timeout', '_adm_stg_cpt_option_sys_bg_jobs_cleanup_timeout', '30', 'digit', '', '', '', '', 306),

(@iCategoryId, 'sys_alerts_logger', '_adm_stg_cpt_option_sys_alerts_logger', 'on', 'checkbox', '', '', '', '', 310),
(@iCategoryId, 'sys_alerts_stats', '_adm_stg_cpt_option_sys_alerts_stats', '', 'checkbox', '', '', '', '', 312),

(@iCategoryId, 'sys_maintenance_mode', '_adm_stg_cpt_option_sys_maintenance_mode', '', 'checkbox', '', '', '', '', 400),
(@iCategoryId, 'sys_maintenance_mode_html', '_adm_stg_cpt_option_sys_maintenance_mode_html', '', 'code', '', '', '', '', 402);

--
-- CATEGORY (HIDDEN): System
--
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `hidden`, `order`) VALUES (@iTypeId, 'system', '_adm_stg_cpt_category_system', 1, 1);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, 'site_email_html_template_header', '_adm_stg_cpt_option_site_email_html_template_header', '<html>\r\n    <head></head>\r\n    <body bgcolor="#fff" style="margin:0; padding:0;">\r\n        <div style="background-color:#fff;">\r\n            <table width="100%" border="0" cellspacing="0" cellpadding="0" align="center">\r\n                <tr><td valign="top">\r\n                    <div style="color:#333; padding:20px; font:14px Helvetica, Arial, sans-serif;">\r\n                        <div style="border-bottom:2px solid #eee; padding-bottom:10px; margin-bottom:20px; font-weight:bold; font-size:22px; color:#999;">{site_name}</div>', 'text', '', '', '', 1),
(@iCategoryId, 'site_email_html_template_footer', '_adm_stg_cpt_option_site_email_html_template_footer', '\r\n                    </div>\r\n                </td></tr>\r\n                <tr><td valign="top">\r\n                    <div style="color:#999; padding:0 20px 20px 20px; font:11px Helvetica, Arial, sans-serif;">\r\n                        <div style="border-top:2px solid #eee; padding-top:10px;">{about_us}&nbsp;&nbsp;&nbsp;{unsubscribe}</div>\r\n                    </div>\r\n                </td></tr>\r\n            </table>\r\n        </div>\r\n    </body>\r\n</html>', 'text', '', '', '', 2),

(@iCategoryId, 'sys_site_icon', '', '0', 'digit', '', '', '', 15),
(@iCategoryId, 'sys_site_icon_svg', '', '0', 'digit', '', '', '', 16),
(@iCategoryId, 'sys_site_icon_apple', '', '0', 'digit', '', '', '', 17),
(@iCategoryId, 'sys_site_icon_android', '', '0', 'digit', '', '', '', 18),
(@iCategoryId, 'sys_site_icon_android_splash', '', '0', 'digit', '', '', '', 19),

(@iCategoryId, 'sys_site_logo', '', '0', 'digit', '', '', '', 20),
(@iCategoryId, 'sys_site_logo_alt', '_adm_dsg_txt_alt_text', '0', 'text', '', '', '', 21),
(@iCategoryId, 'sys_site_logo_aspect_ratio', '_adm_stg_cpt_option_sys_site_logo_aspect_ratio', '', 'digit', '', '', '', 22),
-- (@iCategoryId, 'sys_site_logo_width', '_adm_stg_cpt_option_sys_site_logo_width', '240', 'digit', '', '', '', 23),
-- (@iCategoryId, 'sys_site_logo_height', '_adm_stg_cpt_option_sys_site_logo_height', '48', 'digit', '', '', '', 24),

(@iCategoryId, 'sys_site_splash_code', '', '<style>\r\n    /*--- Splash ---*/\r\n  	.bx-page {\r\n        position: relative;\r\n  	}\r\n	.bx-header {\r\n        position: relative;\r\n      	display: -webkit-flex;\r\n        display: flex;\r\n        -webkit-align-items: center;\r\n        align-items: center;\r\n      	justify-content: center;\r\n      	-webkit-justify-content: center;\r\n        height: 4rem;\r\n        border-bottom: 1px solid rgba(0, 0, 0, 0.1);\r\n      	font-weight: 700;\r\n      	font-size: 2rem;\r\n    }\r\n    .bx-splash {\r\n        position: relative;\r\n        display: -webkit-flex;\r\n        display: flex;\r\n      	-webkit-align-items: center;\r\n        align-items: center;\r\n      	min-height: 100vh;\r\n    }\r\n    .bx-spl-preload {\r\n        position: absolute;\r\n\r\n        top: 0px;\r\n        left: 0px;\r\n        width: 1px;\r\n        height: 1px;\r\n\r\n        overflow: hidden;\r\n    }\r\n    .bx-spl-line {\r\n      	position: relative;\r\n        display: -webkit-flex;\r\n        display: flex;\r\n        -webkit-align-items: stretch;\r\n        align-items: stretch;\r\n    }\r\n  	.bx-media-phone .bx-spl-line {\r\n      	-webkit-flex-direction: column;\r\n      	flex-direction: column;\r\n    }\r\n  	.bx-spl-cell {\r\n      	position: relative;\r\n  	}\r\n  	.bx-media-phone .bx-spl-cell {\r\n      	-webkit-basis: 100% !important; \r\n      	flex-basis: 100% !important;\r\n      	width: 100% !important;\r\n  	}\r\n    .bx-spl-line.bx-spl-l1 .bx-spl-cell {\r\n      	display: -webkit-flex;\r\n        display: flex;\r\n        -webkit-align-items: center;\r\n        align-items: center;\r\n    }\r\n  	.bx-spl-line.bx-spl-l1 .bx-spl-cell.bx-spl-c1 {\r\n        -webkit-flex: 1 1 70%; \r\n        flex:  1 1 70%;\r\n      	width: 70%;\r\n    }\r\n  	.bx-media-phone .bx-spl-line.bx-spl-l1 .bx-spl-cell.bx-spl-c1 {\r\n      	text-align: center;\r\n  	}\r\n  	.bx-spl-line.bx-spl-l1 .bx-spl-cell.bx-spl-c2 {\r\n        -webkit-flex: 0 0 30%; \r\n        flex:  0 1 30%;\r\n      	-webkit-justify-content: center;\r\n        justify-content: center;\r\n      	width: 30%;\r\n    }\r\n    .bx-spl-line.bx-spl-l1 .bx-spl-image {\r\n      	max-width: 100%;\r\n    }\r\n    .bx-spl-line.bx-spl-l2 .bx-spl-cell {\r\n        -webkit-flex: 1 1 33%; \r\n        flex:  1 1 33%;\r\n      	width: 33%;\r\n    }\r\n  	.bx-media-phone .bx-spl-line.bx-spl-l2 .bx-spl-cell {\r\n      	text-align: center;\r\n  	}\r\n    .bx-spl-line.bx-spl-l2 .bx-spl-cicon {\r\n		position: relative;\r\n      	display: -webkit-flex;\r\n        display: flex;\r\n        -webkit-align-items: flex-start;\r\n        align-items: flex-start;\r\n      	justify-content: flex-start;\r\n      	-webkit-justify-content: flex-start;\r\n    }\r\n    .bx-media-phone .bx-spl-line.bx-spl-l2 .bx-spl-cicon {\r\n      	justify-content: center;\r\n      	-webkit-justify-content: center;\r\n    }\r\n    .bx-spl-line.bx-spl-l2 .bx-spl-cicon .animation {\r\n        width: 4.25rem;\r\n        height: 4.25rem;\r\n    }\r\n</style>\r\n<div class=\"bx-page bx-def-color-bg-page\">\r\n  <div class=\"bx-header\">__logo__</div>\r\n  <div class=\"bx-splash\">\r\n      <div class=\"bx-splash-cnt bx-def-page-width bx-def-centered bx-def-padding-leftright\">\r\n          <div class=\"bx-spl-preload\">\r\n            <img src=\"<bx_image_url:spl-image-main.svg />\">\r\n          </div>\r\n          <div class=\"bx-spl-line bx-spl-l1\">\r\n            <div class=\"bx-spl-cell bx-spl-c1\">\r\n              <div class=\"bx-spl-ccnt bx-def-padding\">\r\n                <div class=\"bx-spl-title bx-def-font-h1 bx-def-font-semibold\"><bx_text:_sys_txt_splash_title /></div>\r\n                <div class=\"bx-spl-slogan bx-def-padding-sec-top bx-def-padding-bottom bx-def-font-grayed\"><bx_text:_sys_txt_splash_slogan /></div>\r\n                <div class=\"bx-spl-image bx-def-padding-top\">\r\n                  <img class=\"bx-spl-image\" src=\"<bx_image_url:spl-image-main.svg />\" />\r\n                </div>\r\n              </div>\r\n            </div>\r\n            <div class=\"bx-spl-cell bx-spl-c2 bx-hide-when-logged-in\">\r\n              <div class=\"bx-spl-ccnt bx-def-padding\">__join_form_in_box__</div>\r\n            </div>\r\n          </div>\r\n          <div class=\"bx-spl-line bx-spl-l2 bx-def-padding\">\r\n            <div class=\"bx-spl-cell bx-spl-c1\">\r\n              <div class=\"bx-spl-ccnt bx-def-padding\">\r\n                <div class=\"bx-spl-cicon connect\"><div class=\"animation\"></div></div>\r\n                <div class=\"bx-spl-ctitle bx-def-padding-sec-topbottom bx-def-font-h2\"><bx_text:_sys_txt_splash_connect /></div>\r\n                <div class=\"bx-spl-ctext bx-def-font-grayed\"><bx_text:_sys_txt_splash_connect_text /></div>\r\n              </div>\r\n            </div>\r\n            <div class=\"bx-spl-cell bx-spl-c2\">\r\n              <div class=\"bx-spl-ccnt bx-def-padding\">\r\n                <div class=\"bx-spl-cicon share\"><div class=\"animation\"></div></div>\r\n                <div class=\"bx-spl-ctitle bx-def-padding-sec-topbottom bx-def-font-h2\"><bx_text:_sys_txt_splash_share /></div>\r\n                <div class=\"bx-spl-ctext bx-def-font-grayed\"><bx_text:_sys_txt_splash_share_text /></div>\r\n              </div>\r\n            </div>\r\n            <div class=\"bx-spl-cell bx-spl-c3\">\r\n              <div class=\"bx-spl-ccnt bx-def-padding\">\r\n                <div class=\"bx-spl-cicon create\"><div class=\"animation\"></div></div>\r\n                <div class=\"bx-spl-ctitle bx-def-padding-sec-topbottom bx-def-font-h2\"><bx_text:_sys_txt_splash_create /></div>\r\n                <div class=\"bx-spl-ctext bx-def-font-grayed\"><bx_text:_sys_txt_splash_create_text /></div>\r\n              </div>\r\n            </div>\r\n          </div>\r\n      </div>\r\n  </div>\r\n</div>\r\n<script>\r\n  var animConnect = bodymovin.loadAnimation({\r\n    container: $(\'.bx-spl-cicon.connect .animation\').get(0),\r\n    path: \'<bx_image_url:spl-icon-connect.json />\',\r\n    renderer: \'svg\',\r\n    loop: true,\r\n    autoplay: true,\r\n  });\r\n  var animShare = bodymovin.loadAnimation({\r\n    container: $(\'.bx-spl-cicon.share .animation\').get(0),\r\n    path: \'<bx_image_url:spl-icon-share.json />\',\r\n    renderer: \'svg\',\r\n    loop: true,\r\n    autoplay: true,\r\n  });\r\n  var animCreate = bodymovin.loadAnimation({\r\n    container: $(\'.bx-spl-cicon.create .animation\').get(0),\r\n    path: \'<bx_image_url:spl-icon-create.json />\',\r\n    renderer: \'svg\',\r\n    loop: true,\r\n    autoplay: true,\r\n  });\r\n</script>', 'text', '', '', '', 25),
(@iCategoryId, 'sys_site_splash_enabled', '', '', 'checkbox', '', '', '', 26),

(@iCategoryId, 'sys_site_cover_common', '', '0', 'digit', '', '', '', 27),
(@iCategoryId, 'sys_unit_cover_profile', '', '0', 'digit', '', '', '', 28),
(@iCategoryId, 'sys_site_cover_disabled', '', '', 'checkbox', '', '', '', 29);


--
-- CATEGORY (HIDDEN): Languages
--
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `hidden`, `order`) VALUES (@iTypeId, 'languages', '_adm_stg_cpt_category_languages', 1, 2);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, 'lang_default', '_adm_stg_cpt_option_lang_default', '', 'select', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:13:"get_languages";s:6:"params";a:2:{i:0;b:0;i:1;b:1;}s:5:"class";s:22:"TemplLanguagesServices";}', '', '', 1),
(@iCategoryId, 'lang_subst_from_en', '_adm_stg_cpt_option_lang_subst_from_en', 'on', 'checkbox', '', '', '', 2),

(@iCategoryId, 'sys_format_date', '_adm_stg_cpt_option_sys_format_date', 'D MMM YYYY', 'digit', '', '', '', 3),
(@iCategoryId, 'sys_format_time', '_adm_stg_cpt_option_sys_format_time', 'HH:mm', 'digit', '', '', '', 4),
(@iCategoryId, 'sys_format_datetime', '_adm_stg_cpt_option_sys_format_datetime', 'D MMM YYYY h:mm:ss a', 'digit', '', '', '', 5),
(@iCategoryId, 'sys_format_timeago', '_adm_stg_cpt_option_sys_format_timeago', 432000, 'digit', '', '', '', 6),
(@iCategoryId, 'sys_format_input_24h', '_adm_stg_cpt_option_sys_format_input_24h', 'on', 'checkbox', '', '', '', 24);


--
-- CATEGORY (HIDDEN): Templates
--
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `hidden`, `order`) VALUES (@iTypeId, 'templates', '_adm_stg_cpt_category_templates', 1, 3);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, 'template', '_adm_stg_cpt_option_template', '', 'select', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:13:"get_templates";s:5:"class";s:21:"TemplTemplateServices";}', 'Template', '_adm_stg_err_option_template', 1),

(@iCategoryId, 'sys_pt_default_visitor', '_adm_stg_cpt_option_sys_pt_default_visitor', '3', 'select', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:14:"get_page_types";s:5:"class";s:21:"TemplTemplateServices";}', '', '', 10),
(@iCategoryId, 'sys_pt_default_member', '_adm_stg_cpt_option_sys_pt_default_member', '3', 'select', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:14:"get_page_types";s:5:"class";s:21:"TemplTemplateServices";}', '', '', 11);

--
-- CATEGORY: General (Site Settings)
--
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `hidden`, `order`) VALUES (@iTypeId, 'site_settings','_adm_stg_cpt_category_site_settings', 0, 4);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `info`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, 'site_title', '_adm_stg_cpt_option_site_title', '_adm_stg_inf_option_site_title', 'Community', 'digit', '', '', '', 1),
(@iCategoryId, 'site_email', '_adm_stg_cpt_option_site_email', '_adm_stg_inf_option_site_email', 'admin@example.com', 'digit', '', '', '', 3),
(@iCategoryId, 'site_email_notify', '_adm_stg_cpt_option_site_email_notify', '_adm_stg_inf_option_site_email_notify', 'admin@example.com', 'digit', '', '', '', 4),
(@iCategoryId, 'site_tour_home', '_adm_stg_cpt_option_site_tour_home', '_adm_stg_inf_option_site_tour_home', 'on', 'checkbox', '', '', '', 6),
(@iCategoryId, 'site_tour_studio', '_adm_stg_cpt_option_site_tour_studio', '_adm_stg_inf_option_site_tour_studio', 'on', 'checkbox', '', '', '', 7),

(@iCategoryId, 'sys_autoupdate', '_adm_stg_cpt_option_sys_autoupdate', '_adm_stg_inf_option_sys_autoupdate', 'on', 'checkbox', '', '', '', 10),
(@iCategoryId, 'sys_autoupdate_force_modified_files', '_adm_stg_cpt_option_sys_autoupdate_force_modified_files', '_adm_stg_inf_option_sys_autoupdate_force_modified_files', '', 'checkbox', '', '', '', 12),

(@iCategoryId, 'smart_app_banner', '_adm_stg_cpt_option_smart_app_banner', '_adm_stg_inf_option_smart_app_banner', '', 'checkbox', '', '', '', 14),
(@iCategoryId, 'smart_app_banner_ios_app_id', '_adm_stg_cpt_option_smart_app_banner_ios_app_id', '_adm_stg_inf_option_smart_app_banner_ios_app_id', '', 'digit', '', '', '', 15),

(@iCategoryId, 'sys_per_page_search_keyword_single', '_adm_stg_cpt_option_sys_per_page_search_keyword_single', '_adm_stg_inf_option_sys_per_page_search_keyword_single', '24', 'digit', '', '', '', 20),
(@iCategoryId, 'sys_per_page_search_keyword_plural', '_adm_stg_cpt_option_sys_per_page_search_keyword_plural', '_adm_stg_inf_option_sys_per_page_search_keyword_plural', '3', 'digit', '', '', '', 21),
(@iCategoryId, 'sys_live_search_limit', '_adm_stg_cpt_option_sys_live_search_limit', '_adm_stg_inf_option_sys_live_search_limit', '5', 'digit', '', '', '', 22),
(@iCategoryId, 'sys_profiles_search_limit', '_adm_stg_cpt_option_sys_profiles_search_limit', '_adm_stg_inf_option_sys_profiles_search_limit', '20', 'digit', '', '', '', 23),
(@iCategoryId, 'sys_per_page_browse_showcase', '_adm_stg_cpt_option_sys_per_page_browse_showcase', '_adm_stg_inf_option_sys_per_page_browse_showcase', '32', 'digit', '', '', '', 24),
(@iCategoryId, 'sys_per_page_search_extended', '_adm_stg_cpt_option_sys_per_page_search_extended', '_adm_stg_inf_option_sys_per_page_search_extended', '12', 'digit', '', '', '', 25),
(@iCategoryId, 'sys_per_page_recommendations', '_adm_stg_cpt_option_sys_per_page_recommendations', '_adm_stg_inf_option_sys_per_page_recommendations', '12', 'digit', '', '', '', 26),
(@iCategoryId, 'sys_per_page_recommendations_showcase', '_adm_stg_cpt_option_sys_per_page_recommendations_showcase', '_adm_stg_inf_option_sys_per_page_recommendations_showcase', '8', 'digit', '', '', '', 27),

(@iCategoryId, 'sys_metatags_hashtags_only', '_adm_stg_cpt_option_sys_metatags_hashtags_only', '', '', 'checkbox', '', '', '', 30),
(@iCategoryId, 'sys_metatags_hashtags_max', '_adm_stg_cpt_option_sys_metatags_hashtags_max', '', '9', 'digit', '', '', '', 31),
(@iCategoryId, 'sys_metatags_mentions_max', '_adm_stg_cpt_option_sys_metatags_mentions_max', '', '9', 'digit', '', '', '', 32),
(@iCategoryId, 'sys_attach_links_max', '_adm_stg_cpt_option_sys_attach_links_max', '', '0', 'digit', '', '', '', 35),

(@iCategoryId, 'sys_profile_bot', '_adm_stg_cpt_option_sys_profile_bot', '_adm_stg_inf_option_sys_profile_bot', '', 'select', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:23:"get_options_profile_bot";s:5:"class";s:13:"TemplServices";}', '', '', 40),

(@iCategoryId, 'sys_enable_post_to_context_for_privacy', '_adm_stg_cpt_option_sys_enable_post_to_context_for_privacy', '', '', 'checkbox', '', '', '', 50),
(@iCategoryId, 'sys_hide_post_to_context_for_privacy', '_adm_stg_cpt_option_sys_hide_post_to_context_for_privacy', '', '', 'list', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:44:"get_options_module_list_for_privacy_selector";s:5:"class";s:13:"TemplServices";}', '', '', 51),
(@iCategoryId, 'sys_treat_cxt_in_cxt_as_cnt', '_adm_stg_cpt_option_sys_treat_cxt_in_cxt_as_cnt', '', 'on', 'checkbox', '', '', '', 52),
(@iCategoryId, 'sys_check_fan_in_parent_context', '_adm_stg_cpt_option_sys_check_fan_in_parent_context', '', 'on', 'checkbox', '', '', '', 55),

(@iCategoryId, 'sys_vote_reactions_quick_mode', '_adm_stg_cpt_option_sys_vote_reactions_quick_mode', '', 'on', 'checkbox', '', '', '', 60),

(@iCategoryId, 'sys_cmts_enable_auto_approve', '_adm_stg_cpt_option_sys_cmts_enable_auto_approve', '', 'on', 'checkbox', '', '', '', 70),

(@iCategoryId, 'sys_create_post_form_preloading_list', '_adm_stg_cpt_option_sys_create_post_form_preloading_list', '_adm_stg_inf_option_sys_create_post_form_preloading_list', '', 'list', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:44:"get_options_create_post_form_preloading_list";s:5:"class";s:13:"TemplServices";}', '', '', 80);


--
-- CATEGORY: System (General)
--
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `hidden`, `order`) VALUES (@iTypeId, 'general', '_adm_stg_cpt_category_general', 0, 5);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `info`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, 'sys_oauth_key', '_adm_stg_cpt_option_sys_oauth_key', '', '', 'digit', '', '', '', 20),
(@iCategoryId, 'sys_oauth_secret', '_adm_stg_cpt_option_sys_oauth_secret', '', '', 'secret', '', '', '', 21),

(@iCategoryId, 'currency_code', '_adm_stg_cpt_option_currency_code', '', 'USD', 'select', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:33:"get_options_currency_code_default";s:5:"class";s:21:"TemplPaymentsServices";}', 'Avail', '_adm_stg_err_option_currency_code', 30),
(@iCategoryId, 'currency_sign', '_adm_stg_cpt_option_currency_sign', '', '&#36;', 'select', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:33:"get_options_currency_sign_default";s:5:"class";s:21:"TemplPaymentsServices";}', 'Avail', '_adm_stg_err_option_currency_sign', 31),
(@iCategoryId, 'sys_default_payment', '_adm_stg_cpt_option_sys_default_payment', '', '', 'select', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:12:"get_payments";s:5:"class";s:21:"TemplPaymentsServices";}', '', '', 35),

(@iCategoryId, 'client_image_resize_width', '_adm_stg_cpt_option_client_image_resize_width', '', '0', 'digit', '', '', '', 42),
(@iCategoryId, 'client_image_resize_height', '_adm_stg_cpt_option_client_image_resize_height', '', '0', 'digit', '', '', '', 43),

(@iCategoryId, 'useLikeOperator', '_adm_stg_cpt_option_use_like_operator', '', 'on', 'checkbox', '', '', '', 45),

(@iCategoryId, 'sys_embed_default', '_adm_stg_cpt_option_sys_embed_default', '', 'sys_system', 'select', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:25:"get_options_embed_default";s:5:"class";s:13:"TemplServices";}', '', '', 70),
(@iCategoryId, 'sys_embed_lifetime', '_adm_stg_cpt_option_sys_embed_lifetime', '', '30', 'digit', '', '', '', 73),

(@iCategoryId, 'sys_embedly_api_key', '_adm_stg_cpt_option_sys_embedly_api_key', '', '', 'secret', '', '', '', 80),

(@iCategoryId, 'sys_iframely_api_key', '_adm_stg_cpt_option_sys_iframely_api_key', '', '', 'secret', '', '', '', 90),

(@iCategoryId, 'sys_embed_microlink_key', '_adm_stg_cpt_option_sys_embed_microlink_key', '', '', 'secret', '', '', '', 100),

(@iCategoryId, 'sys_embed_peekalink_api_key', '_adm_stg_cpt_option_sys_embed_peekalink_api_key', '', '', 'secret', '', '', '', 110);


--
-- CATEGORY: Cache
--
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `hidden`, `order`) VALUES (@iTypeId, 'cache', '_adm_stg_cpt_category_cache', 0, 6);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `info`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, 'sys_content_cache_enable', '_adm_stg_cpt_option_sys_content_cache_enable', '', 'on', 'checkbox', '', '', '', 5),
(@iCategoryId, 'sys_content_cache_engine', '_adm_stg_cpt_option_sys_content_cache_engine', '', 'File', 'select', 'File,Memcache,Memcached,APC,XCache,Redis', '', '', 6),

(@iCategoryId, 'sys_db_cache_enable', '_adm_stg_cpt_option_sys_db_cache_enable', '', 'on', 'checkbox', '', '', '', 10),
(@iCategoryId, 'sys_db_cache_engine', '_adm_stg_cpt_option_sys_db_cache_engine', '', 'File', 'select', 'File,Memcache,Memcached,APC,XCache,Redis', '', '', 11),

(@iCategoryId, 'sys_cache_memcache_host', '_adm_stg_cpt_option_sys_cache_memcache_host', '', '', 'digit', '', '', '', 20),
(@iCategoryId, 'sys_cache_memcache_port', '_adm_stg_cpt_option_sys_cache_memcache_port', '', '11211', 'digit', '', '', '', 21),
(@iCategoryId, 'sys_cache_redis_connection_string', '_adm_stg_cpt_option_sys_cache_redis_connection_string', '_adm_stg_cpt_option_sys_cache_redis_connection_string_info', '', 'digit', '', '', '', 25),

(@iCategoryId, 'sys_page_cache_enable', '_adm_stg_cpt_option_sys_page_cache_enable', '', 'on', 'checkbox', '', '', '', 30),
(@iCategoryId, 'sys_page_cache_engine', '_adm_stg_cpt_option_sys_page_cache_engine', '', 'File', 'select', 'File,Memcache,Memcached,APC,XCache,Redis', '', '', 31),

(@iCategoryId, 'sys_pb_cache_enable', '_adm_stg_cpt_option_sys_pb_cache_enable', '', 'on', 'checkbox', '', '', '', 40),
(@iCategoryId, 'sys_pb_cache_engine', '_adm_stg_cpt_option_sys_pb_cache_engine', '', 'File', 'select', 'File,Memcache,Memcached,APC,XCache,Redis', '', '', 41),

(@iCategoryId, 'sys_template_cache_enable', '_adm_stg_cpt_option_sys_template_cache_enable', '', 'on', 'checkbox', '', '', '', 50),
(@iCategoryId, 'sys_template_cache_engine', '_adm_stg_cpt_option_sys_template_cache_engine', '', 'FileHtml', 'select', 'FileHtml,Memcache,Memcached,APC,XCache,Redis', '', '', 51),
(@iCategoryId, 'sys_template_cache_css_enable', '_adm_stg_cpt_option_sys_template_cache_css_enable', '', 'on', 'checkbox', '', '', '', 55),
(@iCategoryId, 'sys_template_cache_js_enable', '_adm_stg_cpt_option_sys_template_cache_js_enable', '', 'on', 'checkbox', '', '', '', 56),
(@iCategoryId, 'sys_template_cache_minify_css_enable', '_adm_stg_cpt_option_sys_template_cache_minify_css_enable', '', 'on', 'checkbox', '', '', '', 57),
(@iCategoryId, 'sys_template_cache_minify_js_enable', '_adm_stg_cpt_option_sys_template_cache_minify_js_enable', '', 'on', 'checkbox', '', '', '', 58),
(@iCategoryId, 'sys_template_cache_compress_enable', '_adm_stg_cpt_option_sys_template_cache_compress_enable', '', 'on', 'checkbox', '', '', '', 59);


--
-- CATEGORY: Permalinks
--
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `hidden`, `order`) VALUES (@iTypeId, 'permalinks', '_adm_stg_cpt_category_permalinks', 0, 9);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, 'permalinks_pages', '_adm_stg_cpt_option_permalinks_pages', 'on', 'checkbox', '', '', '', 1),
(@iCategoryId, 'permalinks_modules', '_adm_stg_cpt_option_permalinks_modules', 'on', 'checkbox', '', '', '', 2),
(@iCategoryId, 'permalinks_storage', '_adm_stg_cpt_option_permalinks_storage', 'on', 'checkbox', '', '', '', 3),
(@iCategoryId, 'permalinks_seo_links', '_adm_stg_cpt_option_permalinks_seo_links', 'on', 'checkbox', '', '', '', 10),
(@iCategoryId, 'permalinks_seo_links_redirects', '_adm_stg_cpt_option_permalinks_seo_links_redirects', 'on', 'checkbox', '', '', '', 12);


--
-- CATEGORY: Security
--
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `hidden`, `order`) VALUES (@iTypeId, 'security', '_adm_stg_cpt_category_security', 0, 11);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, 'sys_security_form_token_enable', '_adm_stg_cpt_option_sys_security_form_token_enable', 'on', 'checkbox', '', '', '', 10),
(@iCategoryId, 'sys_security_form_token_lifetime', '_adm_stg_cpt_option_sys_security_form_token_lifetime', '86400', 'digit', '', '', '', 11),
(@iCategoryId, 'sys_captcha_default', '_adm_stg_cpt_option_sys_captcha_default', 'sys_recaptcha_new', 'select', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:27:"get_options_captcha_default";s:5:"class";s:13:"TemplServices";}', '', '', 19),
(@iCategoryId, 'sys_recaptcha_key_public', '_adm_stg_cpt_option_sys_recaptcha_key_public', '', 'digit', '', '', '', 20),
(@iCategoryId, 'sys_recaptcha_key_private', '_adm_stg_cpt_option_sys_recaptcha_key_private', '', 'secret', '', '', '', 21),
(@iCategoryId, 'sys_add_nofollow', '_adm_stg_cpt_option_sys_add_nofollow', 'on', 'checkbox', '', '', '', 30),
(@iCategoryId, 'sys_confirmation_before_redirect', '_adm_stg_cpt_option_sys_confirmation_before_redirect', 'on', 'checkbox', '', '', '', 31),
(@iCategoryId, 'sys_security_block_content_after_n_reports', '_adm_stg_cpt_option_sys_security_block_content_after_n_reports', '0', 'digit', '', '', '', 35),

(@iCategoryId, 'sys_cf_enable', '_adm_stg_cpt_option_sys_cf_enable', '', 'checkbox', '', '', '', 40),
(@iCategoryId, 'sys_cf_enable_comments', '_adm_stg_cpt_option_sys_cf_enable_comments', '', 'checkbox', '', '', '', 41),
(@iCategoryId, 'sys_cf_prohibited', '_adm_stg_cpt_option_sys_cf_prohibited', '', 'list', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:25:"get_options_cf_prohibited";s:6:"params";a:0:{}s:5:"class";s:13:"TemplServices";}', '', '', 42),
(@iCategoryId, 'sys_cf_unauthenticated', '_adm_stg_cpt_option_sys_cf_unauthenticated', '1', 'list', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:30:"get_options_cf_unauthenticated";s:6:"params";a:0:{}s:5:"class";s:13:"TemplServices";}', '', '', 43),

(@iCategoryId, 'sys_lock_from_unauthenticated', '_adm_stg_cpt_option_sys_lock_from_unauthenticated', '', 'checkbox', '', '', '', 50),
(@iCategoryId, 'sys_lock_from_unauthenticated_exceptions', '_adm_stg_cpt_option_sys_lock_from_unauthenticated_exceptions', 'login,forgot-password,create-account,confirm-email,terms,privacy,contact,about,home', 'text', '', '', '', 52);

--
-- CATEGORY: Storage
--
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `hidden`, `order`) VALUES (@iTypeId, 'storage', '_adm_stg_cpt_category_storage', 0, 13);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, 'sys_storage_default', '_adm_stg_cpt_option_sys_storage_default', 'Local', 'select', 'Local,S3,S3v4,S3v4alt', '', '', 1),
(@iCategoryId, 'sys_storage_s3_access_key', '_adm_stg_cpt_option_sys_storage_s3_access_key', '', 'digit', '', '', '', 2),
(@iCategoryId, 'sys_storage_s3_secret_key', '_adm_stg_cpt_option_sys_storage_s3_secret_key', '', 'secret', '', '', '', 3),
(@iCategoryId, 'sys_storage_s3_bucket', '_adm_stg_cpt_option_sys_storage_s3_bucket', '', 'digit', '', '', '', 4),
(@iCategoryId, 'sys_storage_s3_domain', '_adm_stg_cpt_option_sys_storage_s3_domain', '', 'digit', '', '', '', 5),
(@iCategoryId, 'sys_storage_s3_endpoint', '_adm_stg_cpt_option_sys_storage_s3_endpoint', '', 'digit', '', '', '', 6),
(@iCategoryId, 'sys_storage_s3_sig_ver', '_adm_stg_cpt_option_sys_storage_s3_sig_ver', 'v2', 'select', 'v2,v4', '', '', 7),
(@iCategoryId, 'sys_storage_s3_region', '_adm_stg_cpt_option_sys_storage_s3_region', '', 'digit', '', '', '', 8),
(@iCategoryId, 'sys_storage_s3_amz_iam_role', '_adm_stg_cpt_option_sys_storage_s3_amz_iam_role', '', 'checkbox', '', '', '', 10),
(@iCategoryId, 'sys_storage_s3_acl_enable', '_adm_stg_cpt_option_sys_storage_s3_acl_enable', 'on', 'checkbox', '', '', '', 12),
(@iCategoryId, 'sys_storage_s3_force_auth_urls', '_adm_stg_cpt_option_sys_storage_s3_force_auth_urls', '', 'digit', '', '', '', 14), 
(@iCategoryId, 'sys_storage_ghost_lifetime', '_adm_stg_cpt_option_sys_storage_ghost_lifetime', '60', 'digit', '', '', '', 20);

--
-- CATEGORY: Account
--
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `hidden`, `order`) VALUES (@iTypeId, 'account', '_adm_stg_cpt_category_account', 0, 14);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, 'sys_account_online_time', '_adm_stg_cpt_option_sys_account_online_time', '5', 'digit', '', 'Avail', '_adm_stg_err_option_sys_account_online_time', 1),
(@iCategoryId, 'sys_account_autoapproval', '_adm_stg_cpt_option_sys_account_autoapproval', 'on', 'checkbox', '', '', '', 10),
(@iCategoryId, 'sys_account_confirmation_type', '_adm_stg_cpt_option_sys_account_confirmation_type', 'email', 'select', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:22:"get_confirmation_types";s:5:"class";s:18:"BaseServiceAccount";}', '', '', 11),
(@iCategoryId, 'sys_account_welcome_letter', '_adm_stg_cpt_option_sys_account_welcome_letter', '', 'checkbox', '', '', '', 12),
(@iCategoryId, 'sys_account_activation_2fa_enable', '_adm_stg_cpt_option_sys_account_2fa_enable', '', 'checkbox', '', '', '', 13),
(@iCategoryId, 'sys_account_activation_2fa_lifetime', '_adm_stg_cpt_option_sys_account_2fa_lifetime', '0', 'digit', '', '', '', 14),
(@iCategoryId, 'sys_account_auto_profile_creation', '_adm_stg_cpt_option_sys_account_auto_profile_creation', 'on', 'checkbox', '', '', '', 15),
(@iCategoryId, 'sys_account_hide_unconfirmed_accounts', '_adm_stg_cpt_option_sys_account_hide_unconfirmed_accounts', 'on', 'checkbox', '', '', '', 17),
(@iCategoryId, 'sys_account_default_profile_type', '_adm_stg_cpt_option_sys_account_default_profile_type', '', 'select', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:17:"get_profile_types";s:5:"class";s:20:"TemplServiceProfiles";}', '', '', 20),
(@iCategoryId, 'sys_account_limit_profiles_number', '_adm_stg_cpt_option_sys_account_limit_profiles_number', '0', 'digit', '', '', '', 21),
(@iCategoryId, 'sys_account_limit_incorrect_login_attempts', '_adm_stg_cpt_option_sys_account_limit_incorrect_login_attempts', '6', 'digit', '', '', '', 22),

(@iCategoryId, 'sys_account_reset_password_key_lifetime', '_adm_stg_cpt_option_sys_account_reset_password_key_lifetime', '259200', 'digit', '', '', '', 30),
(@iCategoryId, 'sys_account_reset_password_redirect', '_adm_stg_cpt_option_sys_account_reset_password_redirect', 'home', 'select', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:35:"get_options_reset_password_redirect";s:5:"class";s:18:"BaseServiceAccount";}', '', '', 31),
(@iCategoryId, 'sys_account_reset_password_redirect_custom', '_adm_stg_cpt_option_sys_account_reset_password_redirect_custom', '', 'digit', '', '', '', 32),

(@iCategoryId, 'sys_account_disable_login_form', '_adm_stg_cpt_option_sys_account_disable_login_form', '', 'checkbox', '', '', '', 40),
(@iCategoryId, 'sys_account_disable_join_form', '_adm_stg_cpt_option_sys_account_disable_join_form', '', 'checkbox', '', '', '', 42),

(@iCategoryId, 'sys_account_allow_plus_in_email', '_adm_stg_cpt_option_sys_allow_plus_in_email', 'on', 'checkbox', '', '', '', 50),

(@iCategoryId, 'sys_account_accounts_pruning', '_adm_stg_cpt_option_sys_accounts_pruning', '', 'list', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:28:"get_options_pruning_interval";s:5:"class";s:18:"BaseServiceAccount";}', '', '', 55),
(@iCategoryId, 'sys_account_accounts_pruning_interval', '_adm_stg_cpt_option_sys_accounts_pruning_interval', '365', 'digit', '', '', '', 56),
(@iCategoryId, 'sys_account_accounts_password_log_count', '_adm_stg_cpt_option_sys_accounts_password_log_count', '0', 'digit', '', '', '', 57),
(@iCategoryId, 'sys_account_accounts_force_password_change_after_expiration', '_adm_stg_cpt_option_sys_accounts_force_password_change_after_expiration', '', 'checkbox', '', '', '', 58),

(@iCategoryId, 'sys_account_switch_to_profile_redirect', '_adm_stg_cpt_option_sys_account_switch_to_profile_redirect', 'back', 'select', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:38:"get_options_switch_to_profile_redirect";s:5:"class";s:18:"BaseServiceAccount";}', '', '', 60),
(@iCategoryId, 'sys_account_switch_to_profile_redirect_custom', '_adm_stg_cpt_option_sys_account_switch_to_profile_redirect_custom', '', 'digit', '', '', '', 61),

(@iCategoryId, 'sys_account_remember_me', '_adm_stg_cpt_option_sys_account_remember_me', 'on', 'checkbox', '', '', '', 70);
--
-- CATEGORY: ACL
--
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `hidden`, `order`) VALUES (@iTypeId, 'acl', '_adm_stg_cpt_category_acl', 0, 15);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, 'sys_acl_expire_notification_days', '_adm_stg_cpt_option_sys_acl_expire_notification_days', '1', 'digit', '', '', '', 1),
(@iCategoryId, 'sys_acl_expire_notify_once', '_adm_stg_cpt_option_sys_acl_expire_notify_once', 'on', 'checkbox', '', '', '', 2);

--
-- CATEGORY: Notifications
--
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `hidden`, `order`) VALUES (@iTypeId, 'notifications', '_adm_stg_cpt_category_notifications', 0, 16);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, 'enable_notification_pruning', '_adm_stg_cpt_option_enable_notification_pruning', '', 'checkbox', '', '', '', 1),
(@iCategoryId, 'enable_notification_account', '_adm_stg_cpt_option_enable_notification_account', 'on', 'checkbox', '', '', '', 2),

(@iCategoryId, 'sys_eq_send_per_start', '_adm_stg_cpt_option_sys_eq_send_per_start', '500',  'digit', '', '', '', 10),
(@iCategoryId, 'sys_eq_send_per_start_to_recipient', '_adm_stg_cpt_option_sys_eq_send_per_start_to_recipient', '2',  'digit', '', '', '', 11);

--
-- CATEGORY: Push Notifications
--
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `hidden`, `order`) VALUES (@iTypeId, 'notifications_push', '_adm_stg_cpt_category_notifications_push', 0, 17);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, 'sys_push_default', '_adm_stg_cpt_option_sys_push_default', '', 'select', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:24:"get_options_push_default";s:5:"class";s:13:"TemplServices";}', '', '', 1),

(@iCategoryId, 'sys_push_queue_send_per_start', '_adm_stg_cpt_option_sys_push_queue_send_per_start', '500',  'digit', '', '', '', 10),
(@iCategoryId, 'sys_push_queue_send_per_start_to_recipient', '_adm_stg_cpt_option_sys_push_queue_send_per_start_to_recipient', '2',  'digit', '', '', '', 11),

(@iCategoryId, 'sys_push_onesignal_app_id', '_adm_stg_cpt_option_sys_push_onesignal_app_id', '', 'digit', '', '', '', 21),
(@iCategoryId, 'sys_push_onesignal_rest_api', '_adm_stg_cpt_option_sys_push_onesignal_rest_api', '', 'secret', '', '', '', 22),
(@iCategoryId, 'sys_push_onesignal_short_name', '_adm_stg_cpt_option_sys_push_onesignal_short_name', '', 'digit', '', '', '', 23),
(@iCategoryId, 'sys_push_onesignal_safari_id', '_adm_stg_cpt_option_sys_push_onesignal_safari_id', '', 'digit', '', '', '', 24),

(@iCategoryId, 'sys_push_wonderpush_app_id', '_adm_stg_cpt_option_sys_push_wonderpush_app_id', '', 'digit', '', '', '', 30),
(@iCategoryId, 'sys_push_wonderpush_access_token', '_adm_stg_cpt_option_sys_push_wonderpush_access_token', '', 'secret', '', '', '', 32),
(@iCategoryId, 'sys_push_wonderpush_web_key', '_adm_stg_cpt_option_sys_push_wonderpush_web_key', '', 'digit', '', '', '', 34);


--
-- CATEGORY: Twilio gate settings
--
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `hidden`, `order`) VALUES (@iTypeId, 'sms', '_adm_stg_cpt_category_sms', 0, 18);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, 'sys_sms_default', '_adm_stg_cpt_option_sys_sms_default', '', 'select', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:23:"get_options_sms_default";s:5:"class";s:13:"TemplServices";}', '', '', 1),

(@iCategoryId, 'sys_sms_twilio_sid', '_adm_stg_cpt_option_sys_sms_twilio_sid', '', 'digit', '', '', '', 11),
(@iCategoryId, 'sys_sms_twilio_token', '_adm_stg_cpt_option_sys_sms_twilio_token', '', 'secret', '', '', '', 12),
(@iCategoryId, 'sys_sms_twilio_from_number', '_adm_stg_cpt_option_sys_sms_twilio_from_number', '', 'digit', '', '', '', 13),

(@iCategoryId, 'sys_sms_smsru_api_id', '_adm_stg_cpt_option_sys_sms_smsru_api_id', '', 'secret', '', '', '', 21),
(@iCategoryId, 'sys_sms_smsru_from_number', '_adm_stg_cpt_option_sys_sms_smsru_from_number', '', 'digit', '', '', '', 22);


--
-- CATEGORY: Location
--
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `hidden`, `order`) VALUES (@iTypeId, 'location', '_adm_stg_cpt_category_location', 0, 20);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, 'sys_location_field_default', '_adm_stg_cpt_option_sys_location_field_default', 'sys_plain', 'select', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:34:"get_options_location_field_default";s:5:"class";s:13:"TemplServices";}', '', '', 10),
(@iCategoryId, 'sys_location_map_default', '_adm_stg_cpt_option_sys_location_map_default', 'sys_leaflet', 'select', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:32:"get_options_location_map_default";s:5:"class";s:13:"TemplServices";}', '', '', 12),

(@iCategoryId, 'sys_location_map_zoom_default', '_adm_stg_cpt_option_sys_location_map_zoom_default', '7', 'digit', '', '', '', 20),

(@iCategoryId, 'sys_maps_api_key', '_adm_stg_cpt_option_sys_maps_api_key', '', 'secret', '', '', '', 30),

(@iCategoryId, 'sys_nominatim_server', '_adm_stg_cpt_option_sys_nominatim_server', 'https://nominatim.openstreetmap.org', 'digit', '', '', '', 40),
(@iCategoryId, 'sys_nominatim_email', '_adm_stg_cpt_option_sys_nominatim_email', '', 'digit', '', '', '', 42),

(@iCategoryId, 'sys_location_leaflet_provider', '_adm_stg_cpt_option_sys_location_leaflet_provider', 'OpenStreetMap.Mapnik', 'select', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:42:"get_options_location_leaflet_get_providers";s:5:"class";s:13:"TemplServices";}', '', '', 50),

(@iCategoryId, 'sys_location_normalize_names', '_adm_stg_cpt_option_sys_location_normalize_names', '', 'checkbox', '', '', '', 60);

--
-- CATEGORY: Social Settings
--
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `hidden`, `order`) VALUES (@iTypeId, 'social_settings','_adm_stg_cpt_category_social_settings', 0, 21);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, 'site_login_social_compact', '_adm_stg_cpt_option_site_login_social_compact', 'on', 'checkbox', '', '', '', 1),
(@iCategoryId, 'sys_a2a_enable', '_adm_stg_cpt_option_sys_a2a_enable', '', 'checkbox', '', '', '', 10),
(@iCategoryId, 'sys_a2a_code', '_adm_stg_cpt_option_sys_a2a_code', '', 'code', '', '', '', 11);


--
-- CATEGORY: Sockets
--
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `hidden`, `order`) VALUES (@iTypeId, 'sockets', '_adm_stg_cpt_category_sockets', 0, 22);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, 'sys_sockets_type', '_adm_stg_cpt_option_sys_sockets_type', 'sys_soketi', 'select', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:33:"get_options_sockets_field_default";s:5:"class";s:13:"TemplServices";}', '', '', 1),
(@iCategoryId, 'sys_sockets_url', '_adm_stg_cpt_option_sys_sockets_url', '', 'digit', '', '', '', 2),
(@iCategoryId, 'sys_sockets_app_id', '_adm_stg_cpt_option_sys_sockets_app_id', '', 'digit', '', '', '', 3),
(@iCategoryId, 'sys_sockets_key', '_adm_stg_cpt_option_sys_sockets_key', '', 'digit', '', '', '', 4),
(@iCategoryId, 'sys_sockets_secret', '_adm_stg_cpt_option_sys_sockets_secret', '', 'secret', '', '', '', 5);

--
-- CATEGORY (HIDDEN): Audit
--
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `hidden`, `order`) VALUES (@iTypeId, 'audit', '_adm_stg_cpt_category_audit', 1, 2);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, 'sys_audit_enable', '_adm_stg_cpt_option_sys_audit_enable', '', 'checkbox', '', '', '', 1),
(@iCategoryId, 'sys_audit_max_records', '_adm_stg_cpt_option_sys_audit_max_records', '10000', 'digit', '', '', '', 2),
(@iCategoryId, 'sys_audit_days_before_expire', '_adm_stg_cpt_option_sys_audit_days_before_expire', '365', 'digit', '', '', '', 3),
(@iCategoryId, 'sys_audit_acl_levels', '_adm_stg_cpt_option_sys_audit_acl_levels', '7,8', 'list', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:15:"get_memberships";s:6:"params";a:0:{}s:5:"class";s:18:"TemplAuditServices";}', '', '', 4);


--
-- CATEGORY (HIDDEN): API (general)
--
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `hidden`, `order`) VALUES (@iTypeId, 'api_general', '_adm_stg_cpt_category_api_general', 1, 2);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, 'sys_api_enable', '_adm_stg_cpt_option_sys_api_enable', '', 'checkbox', '', '', '', 1),
(@iCategoryId, 'sys_api_access_by_origin', '_adm_stg_cpt_option_sys_api_access_by_origin', '', 'checkbox', '', '', '', 10),
(@iCategoryId, 'sys_api_access_by_key', '_adm_stg_cpt_option_sys_api_access_by_key', '', 'checkbox', '', '', '', 20),
(@iCategoryId, 'sys_api_access_unsafe_services', '_adm_stg_cpt_option_sys_api_access_unsafe_services', '', 'checkbox', '', '', '', 30),
(@iCategoryId, 'sys_api_cookie_path', '_adm_stg_cpt_option_sys_api_cookie_path', '/', 'digit', '', '', '', 40),
(@iCategoryId, 'sys_api_cookie_secure', '_adm_stg_cpt_option_sys_api_cookie_secure', '', 'checkbox', '', '', '', 42),
(@iCategoryId, 'sys_api_cookie_samesite', '_adm_stg_cpt_option_sys_api_cookie_samesite', 'Lax', 'select', 'None,Lax,Strict', '', '', 44),
(@iCategoryId, 'sys_api_url_root_email', '_adm_stg_cpt_option_sys_api_url_root_email', '', 'digit', '', '', '', 50),
(@iCategoryId, 'sys_api_url_root_push', '_adm_stg_cpt_option_sys_api_url_root_push', '', 'digit', '', '', '', 51);


--
-- CATEGORY (HIDDEN): API (layout)
--
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `hidden`, `order`) VALUES (@iTypeId, 'api_layout', '_adm_stg_cpt_category_api_layout', 1, 2);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, 'sys_api_root_page_guest', '_adm_stg_cpt_option_sys_api_root_page_guest', 'splash', 'select', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:31:"get_options_api_root_page_guest";s:5:"class";s:13:"TemplServices";}', '', '', 1),
(@iCategoryId, 'sys_api_root_page_member', '_adm_stg_cpt_option_sys_api_root_page_member', 'home', 'select', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:32:"get_options_api_root_page_member";s:5:"class";s:13:"TemplServices";}', '', '', 3),
(@iCategoryId, 'sys_api_menu_top', '_adm_stg_cpt_option_sys_api_menu_top', '', 'select', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:24:"get_options_api_menu_top";s:5:"class";s:13:"TemplServices";}', '', '', 5),
(@iCategoryId, 'sys_api_context_switcher', '_adm_stg_cpt_option_sys_api_context_switcher', '', 'select', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:32:"get_options_api_context_switcher";s:5:"class";s:13:"TemplServices";}', '', '', 6),
(@iCategoryId, 'sys_api_context_connection', '_adm_stg_cpt_option_sys_api_context_connection', '', 'select', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:34:"get_options_api_context_connection";s:5:"class";s:13:"TemplServices";}', '', '', 7),
(@iCategoryId, 'sys_api_comments_flat', '_adm_stg_cpt_option_sys_api_comments_flat', '', 'checkbox', '', '', '', 10),
(@iCategoryId, 'sys_api_search_sections', '_adm_stg_cpt_option_sys_api_search_sections', 'bx_posts,bx_persons,bx_groups', 'digit', '', '', '', 20),
(@iCategoryId, 'sys_api_extended_units', '_adm_stg_cpt_option_sys_api_extended_units', '', 'checkbox', '', '', '', 30),
(@iCategoryId, 'sys_api_conn_in_prof_units', '_adm_stg_cpt_option_sys_api_conn_in_prof_units', '', 'checkbox', '', '', '', 31);

--
-- CATEGORY (HIDDEN): API (config)
--
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `hidden`, `order`) VALUES (@iTypeId, 'api_config', '_adm_stg_cpt_category_api_config', 1, 3);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, 'sys_api_config', '_adm_stg_cpt_option_sys_api_config', '', 'text', '', '', '', 1);

--
-- CATEGORY (HIDDEN): PWA Manifest
--
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `hidden`, `order`) VALUES (@iTypeId, 'pwa_manifest', '_adm_stg_cpt_category_pwa_manifest', 1, 2);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, 'sys_pwa_manifest_name', '_adm_stg_cpt_option_sys_pwa_manifest_name', '', 'digit', '', '', '', 1),
(@iCategoryId, 'sys_pwa_manifest_short_name', '_adm_stg_cpt_option_sys_pwa_manifest_short_name', '', 'digit', '', '', '', 2),
(@iCategoryId, 'sys_pwa_manifest_description', '_adm_stg_cpt_option_sys_pwa_manifest_description', '', 'text', '', '', '', 3), 
(@iCategoryId, 'sys_pwa_manifest_background_color', '_adm_stg_cpt_option_sys_pwa_manifest_background_color', '', 'digit', '', '', '', 4),
(@iCategoryId, 'sys_pwa_manifest_theme_color', '_adm_stg_cpt_option_sys_pwa_manifest_theme_color', '', 'digit', '', '', '', 5);

--
-- CATEGORY (HIDDEN): PWA Service Worker
--
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `hidden`, `order`) VALUES (@iTypeId, 'pwa_sw', '_adm_stg_cpt_category_pwa_sw', 1, 2);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, 'sys_pwa_sw_enable', '_adm_stg_cpt_option_sys_pwa_sw_enable', '', 'checkbox', '', '', '', 1),
(@iCategoryId, 'sys_pwa_sw_cache', '_adm_stg_cpt_option_sys_pwa_sw_cache', '', 'text', '', '', '', 2), 
(@iCategoryId, 'sys_pwa_sw_offline', '_adm_stg_cpt_option_sys_pwa_sw_offline', '', 'digit', '', '', '', 3);

--
-- CATEGORY (HIDDEN): Agents (general)
--
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `hidden`, `order`) VALUES (@iTypeId, 'agents_general', '_adm_stg_cpt_category_agents_general', 1, 1);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `info`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, 'sys_agents_inspector_key', '_adm_stg_cpt_option_sys_agents_inspector_key', '_adm_stg_cpt_option_sys_agents_inspector_key_info', '', 'digit', '', '', '', 0);

--
-- CATEGORY (HIDDEN): Agents (usage)
--
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `hidden`, `order`) VALUES (@iTypeId, 'agents_usage', '_adm_stg_cpt_category_agents_usage', 1, 2);
SET @iCategoryId = LAST_INSERT_ID();

INSERT INTO `sys_options`(`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`) VALUES
(@iCategoryId, 'sys_agents_asst_chats_trans_del', '_adm_stg_cpt_option_sys_agents_asst_chats_trans_del', 'on', 'checkbox', '', '', '', 1),
(@iCategoryId, 'sys_agents_studio_assistant', '_adm_stg_cpt_option_sys_agents_sa', '', 'select', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:28:"get_options_studio_assistant";s:5:"class";s:13:"TemplServices";}', '', '', 10),
(@iCategoryId, 'sys_agents_live_search_assistant', '_adm_stg_cpt_option_sys_agents_lsa', '', 'select', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:33:"get_options_live_search_assistant";s:5:"class";s:13:"TemplServices";}', '', '', 15),
(@iCategoryId, 'sys_agents_ask_block_assistant', '_adm_stg_cpt_option_sys_agents_aba', '', 'select', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:31:"get_options_ask_block_assistant";s:5:"class";s:13:"TemplServices";}', '', '', 20);


--
-- Table structure for table `sys_options_mixes`
--
CREATE TABLE `sys_options_mixes` (
  `id` int(11) unsigned NOT NULL auto_increment,
  `type` varchar(64) NOT NULL default '',
  `category` varchar(64) NOT NULL default '',
  `name` varchar(64) NOT NULL default '',
  `title` varchar(64) NOT NULL default '',
  `dark` tinyint(1) NOT NULL default '0',
  `active` tinyint(1) NOT NULL default '0',
  `published` tinyint(1) NOT NULL default '0',
  `editable` tinyint(1) NOT NULL default '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name`(`name`)
);

--
-- Table structure for table `sys_options_mixes2options`
--
CREATE TABLE `sys_options_mixes2options` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `option` varchar(64) NOT NULL default '',
  `mix_id` int(11) unsigned NOT NULL default '0',
  `value` mediumtext NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `value`(`option`, `mix_id`)
);


-- --------------------------------------------------------


CREATE TABLE `sys_localization_categories` (
  `ID` int(6) unsigned NOT NULL auto_increment,
  `Name` varchar(255) NOT NULL default '',
  PRIMARY KEY  (`ID`),
  UNIQUE KEY `Name` (`Name`(191))
);

INSERT INTO `sys_localization_categories` VALUES
(1, 'System'),
(2, 'Custom');

CREATE TABLE `sys_localization_keys` (
  `ID` int(10) unsigned NOT NULL auto_increment,
  `IDCategory` int(6) unsigned NOT NULL default '0',
  `Key` varchar(255) character set utf8 collate utf8_bin NOT NULL default '',
  PRIMARY KEY  (`ID`),
  UNIQUE KEY `Key` (`Key`(191)),
  FULLTEXT KEY `KeyFilter` (`Key`(191))
);

CREATE TABLE `sys_localization_languages` (
  `ID` int(10) unsigned NOT NULL auto_increment,
  `Name` varchar(5) NOT NULL default '',
  `Flag` varchar(2) NOT NULL default '',
  `Title` varchar(255) NOT NULL default '',
  `Direction` enum('LTR','RTL') NOT NULL DEFAULT 'LTR',
  `LanguageCountry` varchar(8) NOT NULL,
  `Enabled` tinyint(1) unsigned NOT NULL default '0',
  PRIMARY KEY  (`ID`),
  UNIQUE KEY `Name` (`Name`)
);

CREATE TABLE `sys_localization_strings` (
  `IDKey` int(10) unsigned NOT NULL default '0',
  `IDLanguage` int(10) unsigned NOT NULL default '0',
  `String` mediumtext NOT NULL,
  PRIMARY KEY  (`IDKey`,`IDLanguage`),
  FULLTEXT KEY `String` (`String`)
);


-- --------------------------------------------------------


CREATE TABLE `sys_acl_actions` (  
  `ID` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `Module` varchar(32) NOT NULL,
  `Name` varchar(255) NOT NULL default '',
  `AdditionalParamName` varchar(80) default NULL,
  `Title` varchar(255) NOT NULL,
  `Desc` varchar(255) NOT NULL,
  `Countable` tinyint(4) NOT NULL DEFAULT '0',
  `DisabledForLevels` int(10) unsigned NOT NULL DEFAULT '3',
  PRIMARY KEY  (`ID`),
  FULLTEXT KEY `ModuleAndName` (`Module`, `Name`)
);

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('system', 'connect', NULL, '_sys_acl_action_connect', '', 1, 3);
SET @iIdActionConnect = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('system', 'vote', NULL, '_sys_acl_action_vote', '', 1, 0);
SET @iIdActionVote = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('system', 'vote_view', NULL, '_sys_acl_action_vote_view', '', 1, 0);
SET @iIdActionVoteView = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('system', 'vote_view_voters', NULL, '_sys_acl_action_vote_view_voters', '', 1, 0);
SET @iIdActionVoteViewVoters = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('system', 'report', NULL, '_sys_acl_action_report', '', 1, 0);
SET @iIdActionReport = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('system', 'report_view', NULL, '_sys_acl_action_report_view', '', 0, 0);
SET @iIdActionReportView = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('system', 'favorite', NULL, '_sys_acl_action_favorite', '', 1, 0);
SET @iIdActionFavorite = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('system', 'favorite_view', NULL, '_sys_acl_action_favorite_view', '', 0, 0);
SET @iIdActionFavoriteView = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('system', 'feature', NULL, '_sys_acl_action_feature', '', 0, 0);
SET @iIdActionFeature = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('system', 'view_view', NULL, '_sys_acl_action_view_view', '', 0, 0);
SET @iIdActionViewView = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('system', 'view_view_viewers_own', NULL, '_sys_acl_action_view_view_viewers_own', '', 0, 0);
SET @iIdActionViewViewViewers = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('system', 'comments post', NULL, '_sys_acl_action_comments_post', '', 1, 0);
SET @iIdActionCmtPost = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('system', 'comments edit own', NULL, '_sys_acl_action_comments_edit_own', '', 0, 3);
SET @iIdActionCmtEditOwn = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('system', 'comments remove own', NULL, '_sys_acl_action_comments_remove_own', '', 1, 3);
SET @iIdActionCmtRemoveOwn = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('system', 'comments edit all', NULL, '_sys_acl_action_comments_edit_all', '', 1, 3);
SET @iIdActionCmtEditAll = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('system', 'comments remove all', NULL, '_sys_acl_action_comments_remove_all', '', 1, 3);
SET @iIdActionCmtRemoveAll = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('system', 'comments remove in own content', NULL, '_sys_acl_action_comments_remove_in_own_content', '', 1, 3);
SET @iIdActionCmtRemoveInOwnContent = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('system', 'comments remove in group context', NULL, '_sys_acl_action_comments_remove_in_group_context', '', 1, 3);
SET @iIdActionCmtRemoveInGroupContext = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('system', 'comments pin', NULL, '_sys_acl_action_comments_pin', '', 1, 3);
SET @iIdActionCmtPin = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('system', 'create account', NULL, '_sys_acl_action_create_account', '_sys_acl_action_create_account_desc', 0, 2147483646);
SET @iIdActionAccountCreate = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('system', 'delete account', NULL, '_sys_acl_action_delete_account', '_sys_acl_action_delete_account_desc', 0, 1);
SET @iIdActionAccountDelete = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('system', 'set acl level', NULL, '_sys_acl_action_set_acl_level', '_sys_acl_action_set_acl_level_desc', 0, 3);
SET @iIdActionSetAclLevel = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('system', 'set badge', NULL, '_sys_acl_action_set_badge', '_sys_acl_action_set_badge_desc', 0, 3);
SET @iIdActionSetBadge = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('system', 'set acl as privacy', NULL, '_sys_acl_action_set_acl_as_privacy', '_sys_acl_action_set_acl_as_privacy_desc', 0, 3);
SET @iIdActionSetAclAsPrivacy = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('system', 'set form fields privacy', NULL, '_sys_acl_action_set_form_fields_privacy', '_sys_acl_action_set_form_fields_privacy_desc', 0, 3);
SET @iIdActionSetFormFieldsPrivacy = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('system', 'chart view', NULL, '_sys_acl_action_chart_view', '_sys_acl_action_chart_view_desc', 0, 3);
SET @iIdActionChartView = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('system', 'post links', NULL, '_sys_acl_action_post_links', '_sys_acl_action_post_links_desc', 0, 0);
SET @iIdActionPostLinks = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('system', 'use macros', NULL, '_sys_acl_action_use_macros', '_sys_acl_action_use_macros_desc', 0, 0);
SET @iIdActionUseMacros = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('system', 'switch to any profile', NULL, '_sys_acl_action_switch_to_any_profile', '_sys_acl_action_switch_to_any_profile_desc', 0, 0);
SET @iIdActionSwitchToAnyProfile = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('system', 'show membership levels in privacy groups', NULL, '_sys_acl_action_show_membership_levels_in_privacy_groups', '_sys_acl_action_show_membership_levels_in_privacy_groups_desc', 0, 0);
SET @iIdActionShowMembershipLevelsInPrivacyGroups = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('system', 'show membership private info', NULL, '_sys_acl_action_show_membership_private_info', '_sys_acl_action_show_membership_private_info_desc', 0, 0);
SET @iIdActionShowMembershipPrivateInfo = LAST_INSERT_ID();


INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('system', 'wiki add block', NULL, '_sys_acl_action_add_block', '', 0, 1);
SET @iIdActionWikiAddBlock = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('system', 'wiki edit block', NULL, '_sys_acl_action_edit_block', '', 0, 0);
SET @iIdActionWikiEditBlock = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('system', 'wiki translate block', NULL, '_sys_acl_action_translate_block', '', 0, 0);
SET @iIdActionWikiTranslateBlock = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('system', 'wiki delete version', NULL, '_sys_acl_action_delete_version', '', 0, 1);
SET @iIdActionWikiDeleteVersion = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('system', 'wiki delete block', NULL, '_sys_acl_action_delete_block', '', 0, 1);
SET @iIdActionWikiDeleteBlock = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('system', 'wiki history', NULL, '_sys_acl_action_history', '', 0, 0);
SET @iIdActionWikiHistory = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
('system', 'wiki unsafe', NULL, '_sys_acl_action_unsafe', '', 0, 0);
SET @iIdActionWikiUnsafe = LAST_INSERT_ID();



CREATE TABLE `sys_acl_actions_track` (
  `IDAction` int(10) unsigned NOT NULL DEFAULT '0',
  `IDMember` int(10) unsigned NOT NULL default '0',
  `ActionsLeft` int(10) unsigned NOT NULL DEFAULT '0',
  `ValidSince` datetime default NULL,
  PRIMARY KEY  (`IDAction`,`IDMember`)
);



CREATE TABLE `sys_acl_matrix` (
  `IDLevel` int(10) unsigned NOT NULL DEFAULT '0',
  `IDAction` int(10) unsigned NOT NULL DEFAULT '0',
  `AllowedCount` int(10) unsigned DEFAULT NULL,
  `AllowedPeriodLen` int(10) unsigned DEFAULT NULL,
  `AllowedPeriodStart` datetime default NULL,
  `AllowedPeriodEnd` datetime default NULL,
  `AdditionalParamValue` varchar(255) default NULL,
  PRIMARY KEY  (`IDLevel`,`IDAction`)
);

SET @iUnauthenticated = 1;
SET @iAccount = 2;
SET @iStandard = 3;
SET @iUnconfirmed = 4;
SET @iPending = 5;
SET @iSuspended = 6;
SET @iModerator = 7;
SET @iAdministrator = 8;
SET @iPremium = 9;

INSERT INTO `sys_acl_matrix` (`IDLevel`, `IDAction`) VALUES

-- connect
(@iStandard, @iIdActionConnect),
(@iModerator, @iIdActionConnect),
(@iAdministrator, @iIdActionConnect),
(@iPremium, @iIdActionConnect),

-- vote 
(@iStandard, @iIdActionVote),
(@iModerator, @iIdActionVote),
(@iAdministrator, @iIdActionVote),
(@iPremium, @iIdActionVote),

-- vote view
(@iUnauthenticated, @iIdActionVoteView),
(@iAccount, @iIdActionVoteView),
(@iStandard, @iIdActionVoteView),
(@iUnconfirmed, @iIdActionVoteView),
(@iPending, @iIdActionVoteView),
(@iModerator, @iIdActionVoteView),
(@iAdministrator, @iIdActionVoteView),
(@iPremium, @iIdActionVoteView),

-- vote view voters
(@iStandard, @iIdActionVoteViewVoters),
(@iModerator, @iIdActionVoteViewVoters),
(@iAdministrator, @iIdActionVoteViewVoters),
(@iPremium, @iIdActionVoteViewVoters),

-- report 
(@iStandard, @iIdActionReport),
(@iModerator, @iIdActionReport),
(@iAdministrator, @iIdActionReport),
(@iPremium, @iIdActionReport),

-- report view 
(@iModerator, @iIdActionReportView),
(@iAdministrator, @iIdActionReportView),

-- favorite 
(@iStandard, @iIdActionFavorite),
(@iModerator, @iIdActionFavorite),
(@iAdministrator, @iIdActionFavorite),
(@iPremium, @iIdActionFavorite),

-- favorite view
(@iUnauthenticated, @iIdActionFavoriteView),
(@iAccount, @iIdActionFavoriteView),
(@iStandard, @iIdActionFavoriteView),
(@iUnconfirmed, @iIdActionFavoriteView),
(@iPending, @iIdActionFavoriteView),
(@iModerator, @iIdActionFavoriteView),
(@iAdministrator, @iIdActionFavoriteView),
(@iPremium, @iIdActionFavoriteView),

-- feature 
(@iModerator, @iIdActionFeature),
(@iAdministrator, @iIdActionFeature),

-- view view
(@iUnauthenticated, @iIdActionViewView),
(@iAccount, @iIdActionViewView),
(@iStandard, @iIdActionViewView),
(@iUnconfirmed, @iIdActionViewView),
(@iPending, @iIdActionViewView),
(@iModerator, @iIdActionViewView),
(@iAdministrator, @iIdActionViewView),
(@iPremium, @iIdActionViewView),

-- view view viewers
(@iModerator, @iIdActionViewViewViewers),
(@iAdministrator, @iIdActionViewViewViewers),

-- comments post
(@iStandard, @iIdActionCmtPost),
(@iModerator, @iIdActionCmtPost),
(@iAdministrator, @iIdActionCmtPost),
(@iPremium, @iIdActionCmtPost),

-- comments edit own
(@iStandard, @iIdActionCmtEditOwn),
(@iModerator, @iIdActionCmtEditOwn),
(@iAdministrator, @iIdActionCmtEditOwn),
(@iPremium, @iIdActionCmtEditOwn),

-- comments remove own
(@iStandard, @iIdActionCmtRemoveOwn),
(@iModerator, @iIdActionCmtRemoveOwn),
(@iAdministrator, @iIdActionCmtRemoveOwn),
(@iPremium, @iIdActionCmtRemoveOwn),

-- comments edit all
(@iModerator, @iIdActionCmtEditAll),
(@iAdministrator, @iIdActionCmtEditAll),

-- comments remove all
(@iModerator, @iIdActionCmtRemoveAll),
(@iAdministrator, @iIdActionCmtRemoveAll),

-- comments remove in own content
(@iModerator, @iIdActionCmtRemoveInOwnContent),
(@iAdministrator, @iIdActionCmtRemoveInOwnContent),

-- comments remove in group context
(@iModerator, @iIdActionCmtRemoveInGroupContext),
(@iAdministrator, @iIdActionCmtRemoveInGroupContext),

-- comments pin
(@iModerator, @iIdActionCmtPin),
(@iAdministrator, @iIdActionCmtPin),

-- account create
(@iUnauthenticated, @iIdActionAccountCreate),

-- account delete
(@iAccount, @iIdActionAccountDelete),
(@iStandard, @iIdActionAccountDelete),
(@iUnconfirmed, @iIdActionAccountDelete),
(@iPending, @iIdActionAccountDelete),
(@iModerator, @iIdActionAccountDelete),
(@iAdministrator, @iIdActionAccountDelete),
(@iPremium, @iIdActionAccountDelete),

-- set acl level
(@iAdministrator, @iIdActionSetAclLevel),

-- set badge
(@iAdministrator, @iIdActionSetBadge),

-- set acl as privacy
(@iAdministrator, @iIdActionSetAclAsPrivacy),

-- set form fields privacy
(@iAccount, @iIdActionSetFormFieldsPrivacy),
(@iStandard, @iIdActionSetFormFieldsPrivacy),
(@iUnconfirmed, @iIdActionSetFormFieldsPrivacy),
(@iPending, @iIdActionSetFormFieldsPrivacy),
(@iModerator, @iIdActionSetFormFieldsPrivacy),
(@iAdministrator, @iIdActionSetFormFieldsPrivacy),
(@iPremium, @iIdActionSetFormFieldsPrivacy),

-- view charts
(@iAdministrator, @iIdActionChartView),

-- post links
(@iStandard, @iIdActionPostLinks),
(@iModerator, @iIdActionPostLinks),
(@iAdministrator, @iIdActionPostLinks),
(@iPremium, @iIdActionPostLinks),

-- use macros
(@iModerator, @iIdActionUseMacros),
(@iAdministrator, @iIdActionUseMacros),

-- switch to any profile
(@iAdministrator, @iIdActionSwitchToAnyProfile),

-- show membership levels in privacy groups
(@iAdministrator, @iIdActionShowMembershipLevelsInPrivacyGroups),

-- show membership private info
(@iModerator, @iIdActionShowMembershipPrivateInfo),
(@iAdministrator, @iIdActionShowMembershipPrivateInfo);

CREATE TABLE `sys_acl_levels` (
  `ID` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `Name` varchar(100) NOT NULL default '',
  `Icon` text NOT NULL default '',
  `Description` varchar(255) NOT NULL default '',
  `Active` enum('yes','no') NOT NULL default 'no',
  `Purchasable` enum('yes','no') NOT NULL default 'yes',
  `Removable` enum('yes','no') NOT NULL default 'yes',
  `UnavailableTo` varchar(255) NOT NULL default '',
  `QuotaSize` bigint(20) NOT NULL,
  `QuotaNumber` int(11) NOT NULL,
  `QuotaMaxFileSize` bigint(20) NOT NULL,
  `Order` int(11) NOT NULL default '0',
  `PasswordExpired` int(11) NOT NULL default '0',
  `PasswordExpiredNotify` int(11) NOT NULL default '0',
  PRIMARY KEY  (`ID`),
  UNIQUE KEY `Name` (`Name`),
  FULLTEXT KEY `Description` (`Description`)
);

INSERT INTO `sys_acl_levels` (`ID`, `Name`, `Icon`, `Description`, `Active`, `Purchasable`, `Removable`, `QuotaSize`, `QuotaNumber`, `QuotaMaxFileSize`, `Order`) VALUES
(1, '_adm_prm_txt_level_unauthenticated', 'user', '', 'yes', 'no', 'no', 0, 0, 0, 1),
(2, '_adm_prm_txt_level_account', 'user', '', 'yes', 'no', 'no', 0, 0, 0, 2),
(3, '_adm_prm_txt_level_standard', 'user', '', 'yes', 'no', 'no', 0, 0, 0, 3),
(4, '_adm_prm_txt_level_unconfirmed', 'user', '', 'yes', 'no', 'no', 0, 0, 0, 4),
(5, '_adm_prm_txt_level_pending', 'user', '', 'yes', 'no', 'no', 0, 0, 0, 5),
(6, '_adm_prm_txt_level_suspended', 'user', '', 'yes', 'no', 'no', 0, 0, 0, 6),
(7, '_adm_prm_txt_level_moderator', 'user-secret', '', 'yes', 'no', 'no', 0, 0, 0, 7),
(8, '_adm_prm_txt_level_administrator', 'user-secret', '', 'yes', 'no', 'no', 0, 0, 0, 8),
(9, '_adm_prm_txt_level_premium', 'user', '', 'yes', 'yes', 'no', 0, 0, 0, 9);


-- --------------------------------------------------------

--
-- Table structure for table `boon_sys_sessions`
--

CREATE TABLE IF NOT EXISTS `sys_sessions` (
  `id` varchar(32) NOT NULL default '',
  `user_id` int(10) unsigned NOT NULL default '0',
  `data` text,
  `date` int(10) unsigned NOT NULL default '0',
  `ttl` int(10) unsigned NOT NULL default '0',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `date` (`date`),
  KEY `ttl` (`ttl`)
);


-- --------------------------------------------------------

--
-- Table structure for table `sys_acl_levels_members`
--

CREATE TABLE `sys_acl_levels_members` (
  `IDMember` int(10) unsigned NOT NULL default '0',
  `IDLevel` int(10) unsigned NOT NULL DEFAULT '0',
  `DateStarts` datetime NOT NULL default '0000-00-00 00:00:00',
  `DateExpires` datetime default NULL,
  `State` varchar(16) NOT NULL default '',
  `TransactionID` varchar(16) NOT NULL default '',
  PRIMARY KEY  (`IDMember`,`IDLevel`,`DateStarts`)
);


-- --------------------------------------------------------


CREATE TABLE `sys_accounts` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `profile_id` int(10) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `picture` int(11) NOT NULL DEFAULT '0',
  `email` varchar(255) NOT NULL,
  `email_confirmed` tinyint(4) NOT NULL DEFAULT '0',
  `phone` varchar(255) NOT NULL,
  `phone_confirmed` tinyint(4) NOT NULL DEFAULT '0',
  `welcome_sent` tinyint(4) NOT NULL DEFAULT '0',
  `receive_updates` tinyint(4) NOT NULL DEFAULT '1',
  `receive_news` tinyint(4) NOT NULL DEFAULT '1',
  `password` varchar(40) NOT NULL,
  `password_changed` int(11) NOT NULL DEFAULT '0',
  `salt` varchar(10) NOT NULL,
  `role` tinyint(4) NOT NULL DEFAULT '1',
  `lang_id` int(10) unsigned NOT NULL DEFAULT '0',
  `added` int(11) NOT NULL DEFAULT '0',
  `changed` int(11) NOT NULL DEFAULT '0',
  `logged` int(11) NOT NULL DEFAULT '0',
  `ip` varchar(40) NOT NULL DEFAULT '',
  `referred` varchar(255) NOT NULL DEFAULT '',
  `login_attempts` tinyint(4) NOT NULL DEFAULT '0',
  `locked` tinyint(4) NOT NULL DEFAULT '0',
  `active` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`(191)),
  KEY `added` (`added`),
  KEY `logged` (`logged`),
  KEY `profile_id` (`profile_id`)
);

CREATE TABLE IF NOT EXISTS `sys_accounts_password` (
    `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
    `account_id` int(10) NOT NULL,
    `password` varchar(40) NOT NULL,
    `password_changed` int(11) NOT NULL DEFAULT '0',
    `salt` varchar(10) NOT NULL,
    PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `sys_accounts_pictures` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `profile_id` int(10) unsigned NOT NULL,
  `remote_id` varchar(128) NOT NULL,
  `path` varchar(255) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `mime_type` varchar(128) NOT NULL,
  `ext` varchar(32) NOT NULL,
  `size` bigint(20) NOT NULL,
  `dimensions` varchar(12) NOT NULL,
  `added` int(11) NOT NULL,
  `modified` int(11) NOT NULL,
  `private` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `remote_id` (`remote_id`)
);

CREATE TABLE IF NOT EXISTS `sys_accounts_pictures_resized` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `profile_id` int(10) unsigned NOT NULL,
  `remote_id` varchar(128) NOT NULL,
  `path` varchar(255) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `mime_type` varchar(128) NOT NULL,
  `ext` varchar(32) NOT NULL,
  `size` bigint(20) NOT NULL,
  `added` int(11) NOT NULL,
  `modified` int(11) NOT NULL,
  `private` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `remote_id` (`remote_id`)
);

CREATE TABLE IF NOT EXISTS `sys_profiles` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `account_id` int(10) unsigned NOT NULL,
  `type` varchar(32) NOT NULL,
  `content_id` int(10) unsigned NOT NULL,
  `cfw_value` int(10) unsigned NOT NULL DEFAULT '2147483647',
  `cfw_items` int(10) unsigned NOT NULL DEFAULT '2147483647',
  `cfu_items` int(10) unsigned NOT NULL DEFAULT '2147483647',
  `cfu_locked` tinyint(4) NOT NULL DEFAULT '0',
  `status` enum('active','pending','suspended') NOT NULL DEFAULT 'active',
  PRIMARY KEY (`id`),
  UNIQUE KEY `account_type_content` (`account_id`,`type`,`content_id`),
  KEY `content_type` (`content_id`,`type`)
);

CREATE TABLE IF NOT EXISTS `sys_profiles_track` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `profile_id` int(11) unsigned NOT NULL DEFAULT '0',
  `action` varchar(32) NOT NULL DEFAULT '',
  `date` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `profile_track` (`profile_id`,`action`)
);


-- --------------------------------------------------------


--
-- Table structure for table 'sys_statistics'
--

CREATE TABLE `sys_statistics` (
  `id` int(11) unsigned NOT NULL auto_increment,
  `module` varchar(32) NOT NULL default '',
  `name` varchar(64) NOT NULL default '',
  `title` varchar(255) NOT NULL default '',
  `link` varchar(255) NOT NULL default '',
  `icon` varchar(32) NOT NULL default '',
  `query` text NOT NULL default '',
  `order` int(11) NOT NULL default '0',
  PRIMARY KEY  (`ID`),
  UNIQUE KEY `name` (`name`)
);

INSERT INTO `sys_statistics` (`module`, `name`, `title`, `link`, `icon`, `query`, `order`) VALUES
('system', 'sys_accounts', '_sys_accounts', '', 'user', 'SELECT COUNT(*) FROM `sys_accounts` WHERE 1', 1);


-- --------------------------------------------------------

--
-- Table structure for table 'sys_objects_rss'
--

CREATE TABLE `sys_objects_rss` (
  `id` int(11) NOT NULL auto_increment,
  `object` varchar(64) NOT NULL,
  `class_name` varchar(32) NOT NULL default '',
  `class_file` varchar(256) NOT NULL default '',
  PRIMARY KEY  (`id`)
);

INSERT INTO `sys_objects_rss` (`object`, `class_name`, `class_file`) VALUES
('sys_boonex', 'BxDolRssBoonEx', ''),
('sys_page_block', 'BxDolRssPageBlock', ''),
('sys_studio_page_help', 'BxDolStudioRssPageHelp', ''),
('sys_studio_module_help', 'BxDolStudioRssModuleHelp', '');


-- --------------------------------------------------------

--
-- Table structure for table 'sys_objects_search'
--

CREATE TABLE `sys_objects_search` (
  `ID` int(10) unsigned NOT NULL auto_increment,
  `ObjectName` varchar(64) NOT NULL  default '',
  `Title` varchar(50) NOT NULL default '',
  `Order` int(11) NOT NULL,
  `GlobalSearch` tinyint(4) NOT NULL DEFAULT '1',
  `ClassName` varchar(50) NOT NULL  default '',
  `ClassPath` varchar(100) NOT NULL  default '',
  PRIMARY KEY  (`ID`)
);

INSERT INTO `sys_objects_search` (`ObjectName`, `Title`, `Order`, `ClassName`, `ClassPath`) VALUES
('sys_pages', '_sys_pages', 1, 'BxTemplPagesSearchResult', '');

-- --------------------------------------------------------

--
-- Table structure for table 'sys_objects_search_extended'
--

CREATE TABLE `sys_objects_search_extended` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `object` varchar(64) NOT NULL  default '',
  `object_content_info` varchar(64) NOT NULL  default '',
  `module` varchar(32) NOT NULL  default '',
  `title` varchar(255) NOT NULL default '',
  `filter` tinyint(4) NOT NULL DEFAULT '0',
  `active` tinyint(4) NOT NULL DEFAULT '0',
  `class_name` varchar(32) NOT NULL  default '',
  `class_file` varchar(255) NOT NULL  default '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `object` (`object`)
);

-- --------------------------------------------------------

--
-- Table structure for table 'sys_search_extended_fields'
--

CREATE TABLE `sys_search_extended_fields` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `object` varchar(64) NOT NULL  default '',
  `name` varchar(255) NOT NULL  default '',
  `type` varchar(32) NOT NULL default '',
  `caption` varchar(255) NOT NULL default '',
  `info` varchar(255) NOT NULL default '',
  `values` text NOT NULL default '',
  `pass` varchar(32) NOT NULL,
  `search_type` varchar(32) NOT NULL  default '',
  `search_value` varchar(255) NOT NULL default '',
  `search_operator` varchar(32) NOT NULL  default '',
  `active` tinyint(4) NOT NULL DEFAULT '0',
  `order` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `field` (`object`(64), `name`(127))
);

-- --------------------------------------------------------

--
-- Table structure for table 'sys_search_extended_fields'
--

CREATE TABLE `sys_search_extended_sorting_fields` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `object` varchar(64) NOT NULL  default '',
  `name` varchar(255) NOT NULL  default '',
  `direction` varchar(32) NOT NULL default '',
  `caption` varchar(255) NOT NULL default '',
  `active` tinyint(4) NOT NULL DEFAULT '0',
  `order` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `field` (`object`(64), `name`(127) , `direction`(32))
);

-- --------------------------------------------------------

--
-- Table structure for table `sys_objects_vote`
--

CREATE TABLE `sys_objects_vote` (
  `ID` int(11) unsigned NOT NULL auto_increment,
  `Name` varchar(50) NOT NULL default '',
  `Module` varchar(32) NOT NULL default '',
  `TableMain` varchar(50) NOT NULL default '',
  `TableTrack` varchar(50) NOT NULL default '',
  `PostTimeout` int(11) NOT NULL default '0',
  `MinValue` tinyint(4) NOT NULL default '1',
  `MaxValue` tinyint(4) NOT NULL default '5',
  `Pruning` int(11) NOT NULL default '31536000',
  `IsUndo` tinyint(1) NOT NULL default '0',
  `IsOn` tinyint(1) NOT NULL default '1',
  `TriggerTable` varchar(32) NOT NULL default '',
  `TriggerFieldId` varchar(32) NOT NULL default '',
  `TriggerFieldAuthor` varchar(32) NOT NULL default '',
  `TriggerFieldRate` varchar(32) NOT NULL default '',
  `TriggerFieldRateCount` varchar(32) NOT NULL default '',
  `ClassName` varchar(32) NOT NULL default '',
  `ClassFile` varchar(256) NOT NULL default '',
  PRIMARY KEY  (`ID`)
);

INSERT INTO `sys_objects_vote` (`Name`, `Module`, `TableMain`, `TableTrack`, `PostTimeout`, `MinValue`, `MaxValue`, `IsUndo`, `IsOn`, `TriggerTable`, `TriggerFieldId`, `TriggerFieldAuthor`, `TriggerFieldRate`, `TriggerFieldRateCount`, `ClassName`, `ClassFile`) VALUES 
('sys_cmts', 'system', 'sys_cmts_votes', 'sys_cmts_votes_track', '604800', '1', '1', '0', '1', 'sys_cmts_ids', 'id', 'author_id', 'rate', 'votes', 'BxTemplCmtsVoteLikes', ''),
('sys_cmts_reactions', 'system', 'sys_cmts_reactions', 'sys_cmts_reactions_track', '604800', '1', '1', '1', '1', 'sys_cmts_ids', 'id', 'author_id', 'rrate', 'rvotes', 'BxTemplCmtsVoteReactions', ''),
('sys_form_fields_votes', 'system', 'sys_form_fields_votes', 'sys_form_fields_votes_track', '604800', '1', '1', '0', '1', 'sys_form_fields_ids', 'id', 'author_id', 'rate', 'votes', '', ''),
('sys_form_fields_reaction', 'system', 'sys_form_fields_reaction', 'sys_form_fields_reaction_track', '604800', '1', '1', '1', '1', 'sys_form_fields_ids', 'id', 'author_id', 'rrate', 'rvotes', 'BxTemplVoteReactions', '');

-- --------------------------------------------------------

--
-- Table structure for table `sys_objects_score`
--

CREATE TABLE `sys_objects_score` (
  `id` int(11) unsigned NOT NULL auto_increment,
  `name` varchar(50) NOT NULL default '',
  `module` varchar(32) NOT NULL,
  `table_main` varchar(50) NOT NULL default '',
  `table_track` varchar(50) NOT NULL default '',
  `post_timeout` int(11) NOT NULL default '0',
  `pruning` int(11) NOT NULL default '31536000',
  `is_undo` tinyint(1) NOT NULL default '0',
  `is_on` tinyint(1) NOT NULL default '1',
  `trigger_table` varchar(32) NOT NULL default '',
  `trigger_field_id` varchar(32) NOT NULL default '',
  `trigger_field_author` varchar(32) NOT NULL default '',
  `trigger_field_score` varchar(32) NOT NULL default '',
  `trigger_field_cup` varchar(32) NOT NULL default '',
  `trigger_field_cdown` varchar(32) NOT NULL default '',
  `class_name` varchar(32) NOT NULL default '',
  `class_file` varchar(256) NOT NULL default '',
  PRIMARY KEY (`ID`)
);

INSERT INTO `sys_objects_score` (`name`, `module`, `table_main`, `table_track`, `post_timeout`, `is_on`, `trigger_table`, `trigger_field_id`, `trigger_field_author`, `trigger_field_score`, `trigger_field_cup`, `trigger_field_cdown`, `class_name`, `class_file`) VALUES 
('sys_cmts', 'system', 'sys_cmts_scores', 'sys_cmts_scores_track', '604800', '0', 'sys_cmts_ids', 'id', 'author_id', 'score', 'sc_up', 'sc_down', 'BxTemplCmtsScore', '');

-- -------------------------------------------------------


CREATE TABLE `sys_modules` (
  `id` int(11) unsigned NOT NULL auto_increment,
  `type` varchar(16) NOT NULL default 'module',
  `subtypes` int(11) unsigned NOT NULL default '0',
  `name` varchar(32) NOT NULL default '',
  `title` varchar(255) NOT NULL default '',
  `vendor` varchar(64) NOT NULL default '',
  `version` varchar(32) NOT NULL default '',
  `help_url` varchar(128) NOT NULL default '',
  `path` varchar(255) NOT NULL default '',  
  `uri` varchar(32) NOT NULL default '',
  `class_prefix` varchar(32) NOT NULL default '',
  `db_prefix` varchar(32) NOT NULL default '',
  `lang_category` varchar(64) NOT NULL default '',
  `dependencies` varchar(255) NOT NULL default '',
  `date` int(11) unsigned NOT NULL default '0',
  `enabled` tinyint(1) NOT NULL default '0',
  `pending_uninstall` tinyint(4) NOT NULL,
  `hash` varchar(32) NOT NULL default '',
  `updated` int(11) unsigned NOT NULL default '0',
  PRIMARY KEY  (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `path` (`path`(191)),
  UNIQUE KEY `uri` (`uri`),
  UNIQUE KEY `class_prefix` (`class_prefix`),
  UNIQUE KEY `db_prefix` (`db_prefix`)
);

INSERT INTO `sys_modules` (`type`, `name`, `title`, `vendor`, `version`, `path`, `uri`, `class_prefix`, `db_prefix`, `lang_category`, `dependencies`, `date`, `enabled`) VALUES
('module', 'system', 'System', 'UNA INC', '', 'system/', 'system', 'Bx', 'sys_', 'System', '', UNIX_TIMESTAMP(), 1);


CREATE TABLE `sys_modules_file_tracks` (
  `id` int(11) unsigned NOT NULL auto_increment,
  `module_id` int(11) unsigned NOT NULL default '0',
  `file` varchar(255) NOT NULL default '',
  `hash` varchar(64) NOT NULL default '',  
  PRIMARY KEY  (`id`)
);


CREATE TABLE `sys_modules_relations` (
  `id` int(11) unsigned NOT NULL auto_increment,
  `module` varchar(32) NOT NULL default '',
  `on_install` varchar(255) NOT NULL default '',
  `on_uninstall` varchar(255) NOT NULL default '',
  `on_enable` varchar(255) NOT NULL default '',
  `on_disable` varchar(255) NOT NULL default '',
  PRIMARY KEY  (`id`)
);

-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `sys_files` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `profile_id` int(10) unsigned NOT NULL,
  `remote_id` varchar(128) NOT NULL,
  `path` varchar(255) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `mime_type` varchar(128) NOT NULL,
  `ext` varchar(32) NOT NULL,
  `size` bigint(20) NOT NULL,
  `added` int(11) NOT NULL,
  `modified` int(11) NOT NULL,
  `private` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `remote_id` (`remote_id`)
);

CREATE TABLE `sys_images` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `profile_id` int(10) unsigned NOT NULL,
  `remote_id` varchar(128) NOT NULL,
  `path` varchar(255) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `mime_type` varchar(128) NOT NULL,
  `ext` varchar(32) NOT NULL,
  `size` bigint(20) NOT NULL,
  `added` int(11) NOT NULL,
  `modified` int(11) NOT NULL,
  `private` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `remote_id` (`remote_id`)
);

CREATE TABLE `sys_images_custom` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `profile_id` int(10) unsigned NOT NULL,
  `remote_id` varchar(128) NOT NULL,
  `path` varchar(255) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `mime_type` varchar(128) NOT NULL,
  `ext` varchar(32) NOT NULL,
  `size` bigint(20) NOT NULL,
  `added` int(11) NOT NULL,
  `modified` int(11) NOT NULL,
  `private` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `remote_id` (`remote_id`)
);

CREATE TABLE `sys_images_resized` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `profile_id` int(10) unsigned NOT NULL,
  `remote_id` varchar(128) NOT NULL,
  `path` varchar(255) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `mime_type` varchar(128) NOT NULL,
  `ext` varchar(32) NOT NULL,
  `size` bigint(20) NOT NULL,
  `added` int(11) NOT NULL,
  `modified` int(11) NOT NULL,
  `private` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `remote_id` (`remote_id`)
);

CREATE TABLE `sys_images_editor` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `profile_id` int(10) unsigned NOT NULL,
  `remote_id` varchar(128) NOT NULL,
  `path` varchar(255) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `mime_type` varchar(128) NOT NULL,
  `ext` varchar(32) NOT NULL,
  `size` bigint(20) NOT NULL,
  `added` int(11) NOT NULL,
  `modified` int(11) NOT NULL,
  `private` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `remote_id` (`remote_id`)
);

CREATE TABLE `sys_images_editor_resized` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `profile_id` int(10) unsigned NOT NULL,
  `remote_id` varchar(128) NOT NULL,
  `path` varchar(255) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `mime_type` varchar(128) NOT NULL,
  `ext` varchar(32) NOT NULL,
  `size` bigint(20) NOT NULL,
  `added` int(11) NOT NULL,
  `modified` int(11) NOT NULL,
  `private` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `remote_id` (`remote_id`)
);

CREATE TABLE IF NOT EXISTS `sys_wiki_files` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `profile_id` int(10) unsigned NOT NULL,
  `remote_id` varchar(128) NOT NULL,
  `path` varchar(255) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `mime_type` varchar(128) NOT NULL,
  `ext` varchar(32) NOT NULL,
  `size` bigint(20) NOT NULL,
  `added` int(11) NOT NULL,
  `modified` int(11) NOT NULL,
  `private` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `remote_id` (`remote_id`)
);

CREATE TABLE IF NOT EXISTS `sys_wiki_images_resized` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `profile_id` int(10) unsigned NOT NULL,
  `remote_id` varchar(128) NOT NULL,
  `path` varchar(255) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `mime_type` varchar(128) NOT NULL,
  `ext` varchar(32) NOT NULL,
  `size` bigint(20) NOT NULL,
  `added` int(11) NOT NULL,
  `modified` int(11) NOT NULL,
  `private` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `remote_id` (`remote_id`)
);

-- --------------------------------------------------------


CREATE TABLE IF NOT EXISTS `sys_cmts_images` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `profile_id` int(10) unsigned NOT NULL,
  `remote_id` varchar(128) NOT NULL,
  `path` varchar(255) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `mime_type` varchar(128) NOT NULL,
  `ext` varchar(32) NOT NULL,
  `size` bigint(20) NOT NULL,
  `dimensions` varchar(24) NOT NULL,
  `added` int(11) NOT NULL,
  `modified` int(11) NOT NULL,
  `private` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `remote_id` (`remote_id`)
);

CREATE TABLE IF NOT EXISTS `sys_cmts_images_preview` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `profile_id` int(10) unsigned NOT NULL,
  `remote_id` varchar(128) NOT NULL,
  `path` varchar(255) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `mime_type` varchar(128) NOT NULL,
  `ext` varchar(32) NOT NULL,
  `size` bigint(20) NOT NULL,
  `added` int(11) NOT NULL,
  `modified` int(11) NOT NULL,
  `private` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `remote_id` (`remote_id`)
);

CREATE TABLE IF NOT EXISTS `sys_cmts_images2entries` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `system_id` int(11) NOT NULL DEFAULT '0',
  `cmt_id` int(11) NOT NULL DEFAULT '0',
  `image_id` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `image` (`system_id`,`cmt_id`,`image_id`)
);

CREATE TABLE IF NOT EXISTS `sys_cmts_ids` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `system_id` int(11) NOT NULL DEFAULT '0',
  `cmt_id` int(11) NOT NULL DEFAULT '0',
  `author_id` int(11) NOT NULL DEFAULT '0',
  `rate` float NOT NULL default '0',
  `votes` int(11) NOT NULL default '0',
  `rrate` float NOT NULL default '0',
  `rvotes` int(11) NOT NULL default '0',
  `score` int(11) NOT NULL default '0',
  `sc_up` int(11) NOT NULL default '0',
  `sc_down` int(11) NOT NULL default '0',
  `reports` int(11) NOT NULL default '0',
  `status_admin` enum('active','hidden','pending') NOT NULL DEFAULT 'active',
  PRIMARY KEY (`id`),
  UNIQUE KEY `system_cmt_id` (`system_id`,`cmt_id`)
);

CREATE TABLE IF NOT EXISTS `sys_cmts_meta_keywords` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(10) unsigned NOT NULL,
  `keyword` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `object_id` (`object_id`),
  KEY `keyword` (`keyword`)
);

CREATE TABLE IF NOT EXISTS `sys_cmts_meta_mentions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(10) unsigned NOT NULL,
  `profile_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `object_id` (`object_id`),
  KEY `profile_id` (`profile_id`)
);

CREATE TABLE IF NOT EXISTS `sys_cmts_votes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `count` int(11) NOT NULL default '0',
  `sum` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `object_id` (`object_id`)
);

CREATE TABLE IF NOT EXISTS `sys_cmts_votes_track` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `author_id` int(11) NOT NULL default '0',
  `author_nip` int(11) unsigned NOT NULL default '0',
  `value` tinyint(4) NOT NULL default '0',
  `date` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  KEY `vote` (`object_id`, `author_nip`)
);

CREATE TABLE IF NOT EXISTS `sys_cmts_reactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `reaction` varchar(32) NOT NULL default '',
  `count` int(11) NOT NULL default '0',
  `sum` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `reaction` (`object_id`, `reaction`)
);

CREATE TABLE IF NOT EXISTS `sys_cmts_reactions_track` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `author_id` int(11) NOT NULL default '0',
  `author_nip` int(11) unsigned NOT NULL default '0',
  `reaction` varchar(32) NOT NULL default '',
  `value` tinyint(4) NOT NULL default '0',
  `date` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  KEY `vote` (`object_id`, `author_nip`)
);

CREATE TABLE IF NOT EXISTS `sys_form_fields_votes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `count` int(11) NOT NULL default '0',
  `sum` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `object_id` (`object_id`)
);

CREATE TABLE IF NOT EXISTS `sys_form_fields_votes_track` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `author_id` int(11) NOT NULL default '0',
  `author_nip` int(11) unsigned NOT NULL default '0',
  `value` tinyint(4) NOT NULL default '0',
  `date` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  KEY `vote` (`object_id`, `author_nip`)
);

CREATE TABLE IF NOT EXISTS `sys_form_fields_reaction` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `reaction` varchar(32) NOT NULL default '',
  `count` int(11) NOT NULL default '0',
  `sum` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `reaction` (`object_id`, `reaction`)
);

CREATE TABLE IF NOT EXISTS `sys_form_fields_reaction_track` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `author_id` int(11) NOT NULL default '0',
  `author_nip` int(11) unsigned NOT NULL default '0',
  `reaction` varchar(32) NOT NULL default '',
  `value` tinyint(4) NOT NULL default '0',
  `date` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  KEY `vote` (`object_id`, `author_nip`)
);

CREATE TABLE IF NOT EXISTS `sys_cmts_reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `count` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `object_id` (`object_id`)
);

CREATE TABLE IF NOT EXISTS `sys_cmts_reports_track` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `author_id` int(11) NOT NULL default '0',
  `author_nip` int(11) unsigned NOT NULL default '0',
  `type` varchar(32) NOT NULL default '',
  `text` text NOT NULL default '',
  `date` int(11) NOT NULL default '0',
  `checked_by` int(11) NOT NULL default '0',    
  `status` tinyint(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  KEY `report` (`object_id`, `author_nip`)
);

CREATE TABLE IF NOT EXISTS `sys_cmts_scores` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `count_up` int(11) NOT NULL default '0',
  `count_down` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `object_id` (`object_id`)
);

CREATE TABLE IF NOT EXISTS `sys_cmts_scores_track` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `author_id` int(11) NOT NULL default '0',
  `author_nip` int(11) unsigned NOT NULL default '0',
  `type` varchar(8) NOT NULL default '',
  `date` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  KEY `vote` (`object_id`, `author_nip`)
);

-- --------------------------------------------------------


CREATE TABLE `sys_injections` (
  `id` int(11) unsigned NOT NULL auto_increment,
  `name` varchar(128) NOT NULL default '',
  `page_index` int(11) NOT NULL default '0',
  `key` varchar(128) NOT NULL default '',
  `type` enum('text', 'service') NOT NULL default 'text',
  `data` text NOT NULL default '',
  `replace` TINYINT NOT NULL DEFAULT '0',
  `active` TINYINT NOT NULL DEFAULT '1',
  PRIMARY KEY  (`id`)
);

INSERT INTO `sys_injections`(`name`, `page_index`, `key`, `type`, `data`, `replace`, `active`) VALUES
('update_cache', 150, 'injection_head', 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:17:"get_cache_updater";s:6:"params";a:0:{}s:5:"class";s:19:"TemplStudioLauncher";}', 0, 1),
('sys_head', 0, 'injection_head', 'text', '', 0, 1),
('sys_body_class', 0, 'injection_body_class', 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:13:"get_injection";s:6:"params";a:1:{i:0;s:10:"body_class";}s:5:"class";s:21:"TemplTemplateServices";}', 0, 1),
('sys_body', 0, 'injection_footer', 'text', '', 0, 1),
('sys_footer', 0, 'injection_footer', 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:13:"get_injection";s:6:"params";a:1:{i:0;s:6:"footer";}s:5:"class";s:21:"TemplTemplateServices";}', 0, 1);


-- --------------------------------------------------------


CREATE TABLE `sys_injections_admin` (
  `id` int(11) unsigned NOT NULL auto_increment,
  `name` varchar(128) NOT NULL default '',
  `page_index` int(11) NOT NULL default '0',
  `key` varchar(128) NOT NULL default '',
  `type` enum('text','service') NOT NULL default 'text',
  `data` text NOT NULL,
  `replace` tinyint(4) NOT NULL default '0',
  `active` tinyint(4) NOT NULL default '1',
  PRIMARY KEY (`id`)
);

INSERT INTO `sys_injections_admin`(`name`, `page_index`, `key`, `type`, `data`, `replace`, `active`) VALUES
('sys_footer', 0, 'injection_footer', 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:20:"get_injection_studio";s:6:"params";a:1:{i:0;s:6:"footer";}s:5:"class";s:21:"TemplTemplateServices";}', 0, 1);

-- --------------------------------------------------------


CREATE TABLE `sys_permalinks` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `standard` varchar(128) NOT NULL DEFAULT '',
  `permalink` varchar(128) NOT NULL DEFAULT '',
  `check` varchar(64) NOT NULL DEFAULT '',
  `compare_by_prefix` tinyint(4) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `check` (`standard`(80),`permalink`(80),`check`(30))
);

INSERT INTO `sys_permalinks` (`standard`, `permalink`, `check`, `compare_by_prefix`) VALUES
('page.php?i=', 'page/', 'permalinks_pages', 1),
('modules/?r=', 'm/', 'permalinks_modules', 1),
('storage.php?o=', 's/', 'permalinks_storage', 1);


-- --------------------------------------------------------


CREATE TABLE `sys_audit` (
  `id` int(11) unsigned NOT NULL auto_increment, 
  `added` int(11) NOT NULL, 
  `profile_id` int(10) NOT NULL, 
  `profile_title` varchar(255) NOT NULL, 
  `content_id` int(10) NOT NULL, 
  `content_title` varchar(255) NOT NULL, 
  `content_module` varchar(32) NOT NULL default '',
  `content_info_object` varchar(32) NOT NULL default '',
  `context_profile_id` int(10) NOT NULL, 
  `context_profile_title` varchar(255) NOT NULL, 
  `action_lang_key` varchar(255) NOT NULL, 
  `action_lang_key_params` text NOT NULL,
  `extras` text NOT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE `sys_alerts_handlers` (
  `id` int(11) unsigned NOT NULL auto_increment,
  `name` varchar(128) NOT NULL default '',
  `class` varchar(128) NOT NULL default '',
  `file` varchar(255) NOT NULL default '',
  `service_call` text NOT NULL default '', 
  `active` tinyint(4) NOT NULL default '1',
  `ts` int(10) UNSIGNED NOT NULL,
  `timing` float NOT NULL,
  `call_count` int(10) UNSIGNED NOT NULL,
  `calls_per_request` int(10) UNSIGNED NOT NULL,
  PRIMARY KEY  (`id`),
  UNIQUE KEY `name` (`name`)
);

CREATE TABLE `sys_alerts` (
  `id` int(11) unsigned NOT NULL auto_increment,  
  `unit` varchar(128) NOT NULL default '',
  `action` varchar(32) NOT NULL default 'none',
  `handler_id` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `alert_handler` (`unit`, `action`, `handler_id`)
);

CREATE TABLE `sys_alerts_cache_triggers` (
  `id` int(11) UNSIGNED NOT NULL auto_increment,
  `unit` varchar(128) NOT NULL DEFAULT '',
  `action` varchar(32) NOT NULL DEFAULT '',
  `cache_key` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
);

INSERT INTO `sys_alerts_cache_triggers` (`unit`, `action`, `cache_key`) VALUES
('sys_profiles_subscriptions', 'connection_added', 'menu_sys_profile_stats_profile-stats-subscribed-me_{content}_{_hash}.php');


INSERT INTO `sys_alerts_handlers` (`name`, `service_call`) VALUES
('sys_studio_settings_save_design', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:28:"alert_response_settings_save";s:6:"params";a:0:{}s:5:"class";s:25:"TemplStudioDesignServices";}');
SET @iIdHandler = LAST_INSERT_ID();

INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('system', 'save_setting', @iIdHandler);

INSERT INTO `sys_alerts_handlers` (`name`, `service_call`) VALUES
('sys_settings_sys_images_custom_file_deleted', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:45:"alert_response_sys_images_custom_file_deleted";s:6:"params";a:0:{}s:5:"class";s:27:"TemplStudioSettingsServices";}');
SET @iIdHandler = LAST_INSERT_ID();

INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('sys_images_custom', 'file_deleted', @iIdHandler);

INSERT INTO `sys_alerts_handlers` (`name`, `service_call`) VALUES
('sys_settings_change_kands', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:27:"alert_response_change_kands";s:6:"params";a:0:{}s:5:"class";s:27:"TemplStudioSettingsServices";}');
SET @iIdHandler = LAST_INSERT_ID();

INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('system', 'save_setting', @iIdHandler);

INSERT INTO `sys_alerts_handlers` (`name`, `service_call`) VALUES 
('sys_settings_storage_change', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:37:"alert_response_process_storage_change";s:5:"class";s:13:"TemplServices";}');
SET @iHandler = LAST_INSERT_ID();

INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('system', 'save_setting', @iHandler);

INSERT INTO `sys_alerts_handlers` (`name`, `service_call`) VALUES 
('sys_installed', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:32:"alert_response_process_installed";s:5:"class";s:13:"TemplServices";}');
SET @iHandler = LAST_INSERT_ID();

INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('system', 'installed', @iHandler);

INSERT INTO `sys_alerts_handlers` (`name`, `service_call`) VALUES 
('sys_connections', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:26:"alert_response_connections";s:5:"class";s:23:"TemplServiceConnections";}');
SET @iHandler = LAST_INSERT_ID();

INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('sys_profiles_friends', 'connection_added', @iHandler),
('sys_profiles_friends', 'connection_removed', @iHandler);

INSERT INTO `sys_alerts_handlers` (`name`, `service_call`) VALUES
('sys_cmts_sys_cmts_images_file_deleted', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:43:"alert_response_sys_cmts_images_file_deleted";s:6:"params";a:0:{}s:5:"class";s:17:"TemplCmtsServices";}');
SET @iIdHandler = LAST_INSERT_ID();

INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('sys_cmts_images', 'file_deleted', @iIdHandler);


INSERT INTO `sys_alerts_handlers` (`name`, `class`, `file`) VALUES
('sys_agents', 'BxDolAiAlertResponse', 'inc/classes/BxDolAiAlertResponse.php');
SET @iIdHandler = LAST_INSERT_ID();

INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('bx_messenger', 'got_jot', @iIdHandler);


CREATE TABLE `sys_alerts_log` (
  `id` int(11) unsigned NOT NULL auto_increment,
  `unit` varchar(128) NOT NULL DEFAULT '',
  `action` varchar(32) NOT NULL DEFAULT 'none',
  `object` varchar(128) NOT NULL,
  `sender` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `extra` text NOT NULL,
  `extra_refs` text NOT NULL,
  `ts` int(10) UNSIGNED NOT NULL,
  `counter_total` int(10) UNSIGNED NOT NULL,
  `counter_24h` int(10) UNSIGNED NOT NULL,
  `counter_per_request` int(10) UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unit_action` (`unit`,`action`)
);

CREATE TABLE `sys_alerts_desc` (
  `id` int(11) unsigned NOT NULL auto_increment,
  `unit` varchar(128) NOT NULL DEFAULT '',
  `action` varchar(32) NOT NULL DEFAULT 'none',
  `description` text NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unit_action` (`unit`,`action`)
);

-- --------------------------------------------------------


CREATE TABLE `sys_badges` (
  `id` int(11) unsigned NOT NULL auto_increment, 
  `added` int(11) NOT NULL, 
  `module` varchar(32) NOT NULL default '',
  `text` varchar(255) NOT NULL default '',
  `icon` text NOT NULL default '',
  `color` varchar(32) NOT NULL default '',
  `fontcolor` varchar(32) NOT NULL default '',
  `is_icon_only` tinyint(4) NOT NULL default '1',
  PRIMARY KEY (`id`)
);

CREATE TABLE `sys_badges2objects` (
  `id` int(11) unsigned NOT NULL auto_increment, 
  `badge_id` int(11) NOT NULL, 
  `object_id` int(11) NOT NULL, 
  `module` varchar(32) NOT NULL, 
  `added` int(11) NOT NULL, 
  PRIMARY KEY (`id`),
  UNIQUE KEY `badge_object` (`object_id`, `badge_id`)
);


-- --------------------------------------------------------


CREATE TABLE `sys_objects_report` (
  `id` int(11) NOT NULL auto_increment,
  `name` varchar(64) NOT NULL,
  `module` varchar(32) NOT NULL default '',
  `table_main` varchar(32) NOT NULL,
  `table_track` varchar(32) NOT NULL,
  `pruning` int(11) NOT NULL default '31536000',
  `is_on` tinyint(4) NOT NULL default '1',
  `base_url` varchar(256) NOT NULL default '',
  `object_comment` varchar(64) NOT NULL,
  `trigger_table` varchar(32) NOT NULL,
  `trigger_field_id` varchar(32) NOT NULL,
  `trigger_field_author` varchar(32) NOT NULL,
  `trigger_field_count` varchar(32) NOT NULL,
  `class_name` varchar(32) NOT NULL default '',
  `class_file` varchar(256) NOT NULL default '',
  PRIMARY KEY  (`id`)
);

INSERT INTO `sys_objects_report` (`name`, `module`, `table_main`, `table_track`, `is_on`, `base_url`, `trigger_table`, `trigger_field_id`, `trigger_field_author`, `trigger_field_count`, `class_name`, `class_file`) VALUES 
('sys_cmts', 'system', 'sys_cmts_reports', 'sys_cmts_reports_track', '1', '', 'sys_cmts_ids', 'id', 'author_id', 'reports',  '', '');


-- --------------------------------------------------------


CREATE TABLE `sys_objects_view` (
  `id` int(11) NOT NULL auto_increment,
  `name` varchar(64) NOT NULL,
  `module` varchar(32) NOT NULL default '',
  `table_track` varchar(32) NOT NULL,
  `period` int(11) NOT NULL default '86400',
  `pruning` int(11) NOT NULL default '31536000',
  `is_on` tinyint(4) NOT NULL default '1',
  `trigger_table` varchar(32) NOT NULL,
  `trigger_field_id` varchar(32) NOT NULL,
  `trigger_field_author` varchar(32) NOT NULL,
  `trigger_field_count` varchar(32) NOT NULL,
  `class_name` varchar(32) NOT NULL default '',
  `class_file` varchar(256) NOT NULL default '',
  PRIMARY KEY  (`id`)
);


-- --------------------------------------------------------


CREATE TABLE `sys_objects_favorite` (
  `id` int(11) NOT NULL auto_increment,
  `name` varchar(64) NOT NULL,
  `table_track` varchar(32) NOT NULL,
  `table_lists` varchar(32) NOT NULL,
  `pruning` int(11) NOT NULL default '31536000',
  `is_on` tinyint(4) NOT NULL default '1',
  `is_undo` tinyint(4) NOT NULL default '1',
  `is_public` tinyint(4) NOT NULL default '1',
  `base_url` varchar(256) NOT NULL default '',
  `trigger_table` varchar(32) NOT NULL,
  `trigger_field_id` varchar(32) NOT NULL,
  `trigger_field_author` varchar(32) NOT NULL,
  `trigger_field_count` varchar(32) NOT NULL,
  `class_name` varchar(32) NOT NULL default '',
  `class_file` varchar(256) NOT NULL default '',
  PRIMARY KEY  (`id`)
);


-- --------------------------------------------------------


CREATE TABLE `sys_objects_feature` (
  `id` int(11) NOT NULL auto_increment,
  `name` varchar(64) NOT NULL,
  `module` varchar(32) NOT NULL default '',
  `is_on` tinyint(4) NOT NULL default '1',
  `is_undo` tinyint(4) NOT NULL default '1',
  `base_url` varchar(256) NOT NULL default '',
  `trigger_table` varchar(32) NOT NULL,
  `trigger_field_id` varchar(32) NOT NULL,
  `trigger_field_author` varchar(32) NOT NULL,
  `trigger_field_flag` varchar(32) NOT NULL,
  `class_name` varchar(32) NOT NULL default '',
  `class_file` varchar(256) NOT NULL default '',
  PRIMARY KEY  (`id`)
);

-- --------------------------------------------------------

CREATE TABLE `sys_objects_chart` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object` varchar(32) NOT NULL,
  `title` varchar(255) NOT NULL,
  `table` varchar(255) NOT NULL,
  `field_date_ts` varchar(255) NOT NULL,
  `field_date_dt` varchar(255) NOT NULL,
  `field_status` varchar(255) NOT NULL,
  `column_date` int(11) NOT NULL DEFAULT '0',
  `column_count` int(11) NOT NULL DEFAULT '1',
  `type` varchar(255) NOT NULL,
  `options` text NOT NULL,
  `query` text NOT NULL,
  `active` tinyint(4) NOT NULL DEFAULT '1',
  `order` int(11) NOT NULL,
  `class_name` varchar(32) NOT NULL default '',
  `class_file` varchar(256) NOT NULL default '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `object` (`object`)
);

INSERT INTO `sys_objects_chart` (`object`, `title`, `table`, `field_date_ts`, `field_date_dt`, `field_status`, `query`, `active`, `order`, `class_name`, `class_file`) VALUES
('sys_accounts_growth', '_sys_chart_accounts_growth', 'sys_accounts', 'added', '', '', '', 1, 1, 'BxDolChartGrowth', ''),
('sys_accounts_growth_speed', '_sys_chart_accounts_growth_speed', 'sys_accounts', 'added', '', '', '', 1, 1, 'BxDolChartGrowthSpeed', '');

-- --------------------------------------------------------

CREATE TABLE `sys_objects_content_info` (
  `id` int(11) NOT NULL auto_increment,
  `name` varchar(64) NOT NULL,
  `title` varchar(128) NOT NULL,
  `alert_unit` varchar(32) NOT NULL,
  `alert_action_add` varchar(32) NOT NULL,
  `alert_action_update` varchar(32) NOT NULL,
  `alert_action_delete` varchar(32) NOT NULL,
  `class_name` varchar(32) NOT NULL default '',
  `class_file` varchar(256) NOT NULL default '',
  PRIMARY KEY  (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `alert_add` (`alert_unit` ,`alert_action_add`),
  UNIQUE KEY `alert_update` (`alert_unit` ,`alert_action_update`),
  UNIQUE KEY `alert_delete` (`alert_unit` ,`alert_action_delete`)
);


-- --------------------------------------------------------

CREATE TABLE `sys_content_info_grids` (
  `id` int(11) NOT NULL auto_increment,
  `object` varchar(64) NOT NULL,
  `grid_object` varchar(64) NOT NULL,
  `grid_field_id` varchar(64) NOT NULL,
  `condition` text NOT NULL default '',
  `selection` varchar(256) NOT NULL default '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `grid_object` (`grid_object`)
);


-- --------------------------------------------------------

CREATE TABLE `sys_objects_privacy` (
  `id` int(11) NOT NULL auto_increment,
  `object` varchar(64) NOT NULL default '',
  `module` varchar(64) NOT NULL default '',
  `action` varchar(255) NOT NULL default '',
  `title` varchar(255) NOT NULL default '',
  `default_group` varchar(255) NOT NULL default '1',
  `spaces` varchar(255) NOT NULL DEFAULT 'all',
  `table` varchar(255) NOT NULL default '',
  `table_field_id` varchar(255) NOT NULL default '',
  `table_field_author` varchar(255) NOT NULL default '',
  `override_class_name` varchar(255) NOT NULL default '',
  `override_class_file` varchar(255) NOT NULL default '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `object` (`object`),
  UNIQUE KEY `action` (`module`(64), `action`(127))
);

INSERT INTO `sys_objects_privacy` (`object`, `module`, `action`, `title`, `default_group`, `table`, `table_field_id`, `table_field_author`, `override_class_name`, `override_class_file`) VALUES
('sys_form_inputs_allow_view_to', 'system', 'view', '_sys_privacy_forms_input_allow_view_to', '3', 'sys_form_inputs_privacy', 'id', 'author_id', '', '');

CREATE TABLE `sys_privacy_defaults` (  
  `owner_id` int(11) NOT NULL default '0',
  `action_id` int(11) NOT NULL default '0',
  `group_id` int(11) NOT NULL default '0',
  PRIMARY KEY  (`owner_id`, `action_id`)
);

CREATE TABLE `sys_privacy_groups` (
  `id` int(11) unsigned NOT NULL auto_increment,
  `title` varchar(255) NOT NULL default '',
  `check` text NOT NULL default '',
  `active` tinyint(4) NOT NULL default '1',
  `visible` tinyint(4) NOT NULL default '1',
  `order` int(11) NOT NULL default '0',
  PRIMARY KEY  (`id`)
);

INSERT INTO `sys_privacy_groups`(`id`, `title`, `check`, `active`, `visible`, `order`) VALUES
('1', '', '', 1, 0, 0),
('2', '_sys_ps_group_title_me_only', '@me_only', 1, 1, 7),
('3', '_sys_ps_group_title_public', '@public', 1, 1, 1),
('4', '_sys_ps_group_title_members', '@members', 0, 0, 0),
('5', '_sys_ps_group_title_friends', '@friends', 1, 1, 2),
('6', '_sys_ps_group_title_friends_selected', '@friends_selected_by_object', 1, 1, 3),
('7', '_sys_ps_group_title_relations', '@relations', 1, 1, 4),
('8', '_sys_ps_group_title_relations_selected', '@relations_selected_by_object', 1, 1, 5),
('9', '_sys_ps_group_title_memberships_selected', '@memberships_selected_by_object', 1, 1, 6),
('99', '_sys_ps_group_title_custom', '@custom_by_object', 0, 0, 0);

CREATE TABLE `sys_privacy_groups_custom` (
  `id` int(11) unsigned NOT NULL auto_increment,
  `profile_id` int(11) NOT NULL default '0',
  `content_id` int(11) NOT NULL default '0',
  `object` varchar(64) NOT NULL default '',
  `group_id` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `content_privacy` (`profile_id`, `content_id`, `object`)
);

CREATE TABLE `sys_privacy_groups_custom_members` (
  `group_id` int(11) NOT NULL default '0',
  `member_id` int(11) NOT NULL default '0',
  PRIMARY KEY (`group_id`, `member_id`)
);

CREATE TABLE `sys_privacy_groups_custom_memberships` (
  `group_id` int(11) NOT NULL default '0',
  `membership_id` int(11) NOT NULL default '0',
  PRIMARY KEY (`group_id`, `membership_id`)
);

-- --------------------------------------------------------

CREATE TABLE `sys_objects_recommendation` (
  `id` int(11) NOT NULL auto_increment,
  `name` varchar(64) NOT NULL default '',
  `module` varchar(64) NOT NULL default '',
  `connection` varchar(64) NOT NULL default '',
  `content_info` varchar(64) NOT NULL default '',
  `countable` tinyint(4) NOT NULL DEFAULT '1',
  `active` tinyint(4) NOT NULL DEFAULT '1',
  `class_name` varchar(32) NOT NULL default '',
  `class_file` varchar(256) NOT NULL default '',
  PRIMARY KEY  (`id`),
  UNIQUE KEY `name` (`name`)
);

CREATE TABLE `sys_recommendation_criteria` (
  `id` int(11) NOT NULL auto_increment,
  `object_id` int(11) NOT NULL default '0',
  `name` varchar(64) NOT NULL default '',
  `source_type` enum ('sql', 'service') NOT NULL,
  `source` text NOT NULL,
  `params` text NOT NULL,
  `weight` float NOT NULL default '0',
  `active` tinyint(4) NOT NULL DEFAULT '1',
  PRIMARY KEY  (`id`),
  UNIQUE KEY `criterion` (`object_id`, `name`)
);

INSERT INTO `sys_objects_recommendation` (`name`, `module`, `connection`, `content_info`, `countable`, `active`, `class_name`, `class_file`) VALUES
('sys_friends', 'system', 'sys_profiles_friends', '', 1, 1, 'BxTemplRecommendationProfile', '');
SET @iRecFriends = LAST_INSERT_ID();

INSERT INTO `sys_recommendation_criteria` (`object_id`, `name`, `source_type`, `source`, `params`, `weight`, `active`) VALUES
(@iRecFriends, 'mutual_friends', 'sql', 'SELECT `tff`.`initiator` AS `id`, SUM({points}) AS `value` FROM `sys_profiles_conn_friends` AS `tf` INNER JOIN `sys_profiles_conn_friends` AS `tff` ON `tf`.`content`=`tff`.`content` AND `tff`.`initiator`<>{profile_id} AND `tff`.`initiator` NOT IN (SELECT `content` FROM `sys_profiles_conn_friends` WHERE `initiator`={profile_id} AND `mutual`=''1'') AND `tff`.`mutual`=''1'' WHERE `tf`.`initiator`={profile_id} AND `tf`.`mutual`=''1'' GROUP BY `id`', 'a:1:{s:6:"points";i:2;}', 0.5, 1),
(@iRecFriends, 'shared_context', 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:44:"get_friend_recommendations_by_shared_context";s:6:"params";a:3:{i:0;s:12:"{profile_id}";i:1;s:12:"{connection}";i:2;s:8:"{points}";}s:5:"class";s:27:"TemplServiceRecommendations";}', 'a:2:{s:6:"points";i:1;s:10:"connection";s:14:"bx_groups_fans";}', 0.20, 1),
(@iRecFriends, 'shared_location', 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:45:"get_friend_recommendations_by_shared_location";s:6:"params";a:3:{i:0;s:12:"{profile_id}";i:1;s:8:"{radius}";i:2;s:8:"{points}";}s:5:"class";s:27:"TemplServiceRecommendations";}', 'a:2:{s:6:"radius";i:10;s:6:"points";i:1;}', 0.20, 1),
(@iRecFriends, 'last_active', 'sql', 'SELECT `tp`.`id` AS `id`, {points} AS `value` FROM `sys_profiles` AS `tp` INNER JOIN `sys_accounts` AS `ta` ON `tp`.`account_id`=`ta`.`id` LEFT JOIN `sys_sessions` AS `ts` ON `tp`.`account_id`=`ts`.`user_id` WHERE `tp`.`id`<>{profile_id} AND `tp`.`id` NOT IN (SELECT `content` FROM `sys_profiles_conn_friends` WHERE `initiator`={profile_id} AND `mutual`=''1'') AND `tp`.`type` IN (''bx_persons'', ''bx_organizations'') ORDER BY `ts`.`date` DESC, `ta`.`logged` DESC, {order_by}', 'a:1:{s:6:"points";i:0;}', 0.1, 1);

INSERT INTO `sys_objects_recommendation` (`name`, `module`, `connection`, `content_info`, `countable`, `active`, `class_name`, `class_file`) VALUES
('sys_subscriptions', 'system', 'sys_profiles_subscriptions', '', 1, 1, 'BxTemplRecommendationProfile', '');
SET @iRecSubscriptions = LAST_INSERT_ID();

INSERT INTO `sys_recommendation_criteria` (`object_id`, `name`, `source_type`, `source`, `params`, `weight`, `active`) VALUES
(@iRecSubscriptions, 'mutual_subscriptions', 'sql', 'SELECT `tff`.`content` AS `id`, SUM({points}) AS `value` FROM `sys_profiles_conn_subscriptions` AS `tf` INNER JOIN `sys_profiles_conn_subscriptions` AS `tff` ON `tf`.`content`=`tff`.`initiator` AND `tff`.`content`<>{profile_id} AND `tff`.`content` NOT IN (SELECT `content` FROM `sys_profiles_conn_subscriptions` WHERE `initiator`={profile_id}) WHERE `tf`.`initiator`={profile_id} GROUP BY `id`', 'a:1:{s:6:"points";i:2;}', 0.5, 1),
(@iRecSubscriptions, 'shared_context', 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:50:"get_subscription_recommendations_by_shared_context";s:6:"params";a:3:{i:0;s:12:"{profile_id}";i:1;s:12:"{connection}";i:2;s:8:"{points}";}s:5:"class";s:27:"TemplServiceRecommendations";}', 'a:2:{s:6:"points";i:1;s:10:"connection";s:14:"bx_groups_fans";}', 0.5, 1);

CREATE TABLE `sys_recommendation_data` (
  `id` int(11) NOT NULL auto_increment,
  `profile_id` int(11) NOT NULL default '0',
  `object_id` int(11) NOT NULL default '0',
  `item_id` int(11) NOT NULL default '0',
  `item_type` varchar(64) NOT NULL default '',
  `item_value` int(11) NOT NULL default '0',
  `item_reducer` int(11) NOT NULL default '0',
  PRIMARY KEY  (`id`),
  UNIQUE KEY `recommendation` (`profile_id`, `object_id`, `item_id`)
);

-- --------------------------------------------------------

CREATE TABLE `sys_background_jobs` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(128) NOT NULL default '',
  `claim_token` varchar(64) NOT NULL default '',
  `added` int(11) unsigned NOT NULL default '0',
  `reserved_at` int(11) unsigned NOT NULL default '0',
  `available_at` int(11) unsigned NOT NULL default '0',
  `priority` tinyint(4) unsigned NOT NULL default '0',
  `service_call` text NOT NULL default '',
  `attempts` tinyint(4) NOT NULL DEFAULT '3',
  `error` varchar(255) NOT NULL default '',
  `status` varchar(16) NOT NULL default 'pending',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `claim_token` (`claim_token`)
);

-- --------------------------------------------------------

CREATE TABLE `sys_cron_jobs` (
  `id` int(11) unsigned NOT NULL auto_increment,
  `name` varchar(128) NOT NULL default '',
  `time` varchar(128) NOT NULL default '*',
  `class` varchar(128) NOT NULL default '',
  `file` varchar(255) NOT NULL default '',
  `service_call` text NOT NULL default '', 
  `ts` int(11) NOT NULL,
  `timing` float NOT NULL,
  PRIMARY KEY  (`id`)
);

INSERT INTO `sys_cron_jobs` (`name`, `time`, `class`, `file`, `service_call`) VALUES
('pruning', '0 0 * * *', 'BxDolCronPruning', 'inc/classes/BxDolCronPruning.php', ''),
('sys_acl', '0 0 * * *', 'BxDolCronAcl', 'inc/classes/BxDolCronAcl.php', ''),
('sys_account', '0 0 * * *', 'BxDolCronAccount', 'inc/classes/BxDolCronAccount.php', ''),
('sys_profile', '0 0 * * *', 'BxDolCronProfile', 'inc/classes/BxDolCronProfile.php', ''),
('sys_upgrade', '0 3 * * *', 'BxDolCronUpgradeCheck', 'inc/classes/BxDolCronUpgradeCheck.php', ''),
('sys_upgrade_modules', '30 2 * * *', 'BxDolCronUpgradeModulesCheck', 'inc/classes/BxDolCronUpgradeModulesCheck.php', ''),
('sys_storage', '* * * * *', 'BxDolCronStorage', 'inc/classes/BxDolCronStorage.php', ''),
('sys_transcoder', '* * * * *', 'BxDolCronTranscoder', 'inc/classes/BxDolCronTranscoder.php', ''),
('sys_queue_email', '* * * * *', 'BxDolCronQueueEmail', 'inc/classes/BxDolCronQueueEmail.php', ''),
('sys_queue_push', '* * * * *', 'BxDolCronQueuePush', 'inc/classes/BxDolCronQueuePush.php', ''),
('sys_audit_clean', '* * * * *', 'BxDolCronAudit', 'inc/classes/BxDolCronAudit.php', ''),
('sys_background_jobs', '* * * * *', 'BxDolCronBackgroundJobs', 'inc/classes/BxDolCronBackgroundJobs.php', ''),
('sys_agents_vector_store', '* * * * *', 'BxDolCronAgentsVectorStore', 'inc/classes/BxDolCronAgentsVectorStore.php', '');

-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `sys_objects_storage` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object` varchar(64) NOT NULL,
  `engine` varchar(32) NOT NULL,
  `params` text NOT NULL,
  `token_life` int(11) NOT NULL,
  `cache_control` int(11) NOT NULL,
  `levels` tinyint(4) NOT NULL,
  `table_files` varchar(64) NOT NULL,
  `ext_mode` enum('allow-deny','deny-allow') NOT NULL,
  `ext_allow` text NOT NULL,
  `ext_deny` text NOT NULL,
  `quota_size` int(11) NOT NULL,
  `current_size` int(11) NOT NULL,
  `quota_number` int(11) NOT NULL,
  `current_number` int(11) NOT NULL,
  `max_file_size` int(11) NOT NULL,
  `ts` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `object` (`object`)
);

INSERT INTO `sys_objects_storage` (`object`, `engine`, `params`, `token_life`, `cache_control`, `levels`, `table_files`, `ext_mode`, `ext_allow`, `ext_deny`, `quota_size`, `current_size`, `quota_number`, `current_number`, `max_file_size`, `ts`) VALUES
('sys_images', 'Local', '', 360, 2592000, 0, 'sys_images', 'allow-deny', '{image}', '', 0, 0, 0, 0, 0, 0),
('sys_images_custom', 'Local', '', 360, 2592000, 0, 'sys_images_custom', 'allow-deny', '{image}', '', 0, 0, 0, 0, 0, 0),
('sys_images_resized', 'Local', '', 360, 2592000, 0, 'sys_images_resized', 'allow-deny', '{image}', '', 0, 0, 0, 0, 0, 0),
('sys_cmts_images', 'Local', '', 360, 2592000, 3, 'sys_cmts_images', 'allow-deny', '{image}', '', 0, 0, 0, 0, 0, 0),
('sys_cmts_images_preview', 'Local', '', 360, 2592000, 3, 'sys_cmts_images_preview', 'allow-deny', '{image}', '', 0, 0, 0, 0, 0, 0),
('sys_transcoder_queue_files', 'Local', '', 3600, 2592000, 0, 'sys_transcoder_queue_files', 'allow-deny', 'avi,flv,mpg,mpeg,wmv,mp4,m4v,mov,divx,xvid,3gp,webm,jpg', '', 0, 0, 0, 0, 0, 0),
('sys_files', 'Local', '', 360, 2592000, 3, 'sys_files', 'deny-allow', '', '{dangerous}', 0, 0, 0, 0, 0, 0),
('sys_images_editor', 'Local', '', 360, 2592000, 3, 'sys_images_editor', 'allow-deny', '{image}', '', 0, 0, 0, 0, 0, 0),
('sys_images_editor_resized', 'Local', '', 360, 2592000, 3, 'sys_images_editor_resized', 'allow-deny', '{image}', '', 0, 0, 0, 0, 0, 0),
('sys_wiki_files', 'Local', '', 360, 2592000, 3, 'sys_wiki_files', 'allow-deny', '{image}', '', 0, 0, 0, 0, 0, 0),
('sys_wiki_images_resized', 'Local', '', 360, 2592000, 3, 'sys_wiki_images_resized', 'allow-deny', '{image}', '', 0, 0, 0, 0, 0, 0),
('sys_agents_assistants_chats_files', 'Local', '', 360, 2592000, 3, 'sys_agents_assistants_chats_files', 'deny-allow', '', '{dangerous}', 0, 0, 0, 0, 0, 0),
('sys_accounts_pictures', 'Local', '', 360, 2592000, 3, 'sys_accounts_pictures', 'allow-deny', '{image}', '', 0, 0, 0, 0, 0, 0),
('sys_accounts_pictures_resized', 'Local', '', 360, 2592000, 3, 'sys_accounts_pictures_resized', 'allow-deny', '{image}', '', 0, 0, 0, 0, 0, 0);

CREATE TABLE IF NOT EXISTS `sys_storage_user_quotas` (
  `profile_id` int(11) NOT NULL,
  `current_size` bigint(20) NOT NULL,
  `current_number` int(11) NOT NULL,
  `ts` int(11) NOT NULL,
  PRIMARY KEY (`profile_id`)
);

CREATE TABLE IF NOT EXISTS `sys_storage_tokens` (
  `iid` int(11) NOT NULL AUTO_INCREMENT,
  `id` int(11) NOT NULL,
  `object` varchar(64) NOT NULL,
  `hash` varchar(32) NOT NULL,
  `created` int(10) unsigned NOT NULL,
  PRIMARY KEY (`iid`),
  UNIQUE KEY `id` (`id`,`object`,`hash`),
  KEY `created` (`created`)
);

CREATE TABLE IF NOT EXISTS `sys_storage_ghosts` (
  `iid` int(11) NOT NULL AUTO_INCREMENT,
  `id` int(11) NOT NULL,
  `profile_id` int(10) unsigned NOT NULL,
  `object` varchar(64) NOT NULL,
  `uploader_id` int(11) NOT NULL default '0',
  `content_id` int(11) NOT NULL,
  `created` int(10) unsigned NOT NULL,
  `order` int(11) NOT NULL default '0',
  PRIMARY KEY (`iid`),
  UNIQUE KEY `id` (`id`,`object`),
  KEY `created` (`created`),
  KEY `profile_object_content` (`profile_id`,`object`,`content_id`)
);

CREATE TABLE IF NOT EXISTS `sys_storage_deletions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object` varchar(64) NOT NULL,
  `file_id` int(11) NOT NULL,
  `requested` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `object_file_id` (`object`,`file_id`),
  KEY `requested` (`requested`)
);

CREATE TABLE IF NOT EXISTS `sys_storage_mime_types` (
  `ext` varchar(32) NOT NULL,
  `mime_type` varchar(128) NOT NULL,
  `icon` varchar(255) NOT NULL,
  `icon_font` varchar(255) NOT NULL,
  PRIMARY KEY (`ext`)
);


INSERT INTO `sys_storage_mime_types` (`ext`, `mime_type`, `icon`, `icon_font`) VALUES
('ez', 'application/andrew-inset', '', ''),
('aw', 'application/applixware', '', ''),
('atom', 'application/atom+xml', '', ''),
('atomcat', 'application/atomcat+xml', '', ''),
('atomsvc', 'application/atomsvc+xml', '', ''),
('ccxml', 'application/ccxml+xml', '', ''),
('cdmia', 'application/cdmi-capability', '', ''),
('cdmic', 'application/cdmi-container', '', ''),
('cdmid', 'application/cdmi-domain', '', ''),
('cdmio', 'application/cdmi-object', '', ''),
('cdmiq', 'application/cdmi-queue', '', ''),
('cu', 'application/cu-seeme', '', ''),
('davmount', 'application/davmount+xml', '', ''),
('dbk', 'application/docbook+xml', '', ''),
('dssc', 'application/dssc+der', '', ''),
('xdssc', 'application/dssc+xml', '', ''),
('ecma', 'application/ecmascript', '', ''),
('emma', 'application/emma+xml', '', ''),
('epub', 'application/epub+zip', '', ''),
('exi', 'application/exi', '', ''),
('pfr', 'application/font-tdpfr', '', ''),
('gml', 'application/gml+xml', '', ''),
('gpx', 'application/gpx+xml', '', ''),
('gxf', 'application/gxf', '', ''),
('stk', 'application/hyperstudio', '', ''),
('ink', 'application/inkml+xml', '', ''),
('inkml', 'application/inkml+xml', '', ''),
('ipfix', 'application/ipfix', '', ''),
('jar', 'application/java-archive', '', ''),
('ser', 'application/java-serialized-object', '', ''),
('class', 'application/java-vm', '', ''),
('js', 'application/javascript', '', 'far file-code'),
('json', 'application/json', '', 'far file-code'),
('jsonml', 'application/jsonml+json', '', ''),
('lostxml', 'application/lost+xml', '', ''),
('hqx', 'application/mac-binhex40', '', ''),
('cpt', 'application/mac-compactpro', '', ''),
('mads', 'application/mads+xml', '', ''),
('mrc', 'application/marc', '', ''),
('mrcx', 'application/marcxml+xml', '', ''),
('ma', 'application/mathematica', '', ''),
('nb', 'application/mathematica', '', ''),
('mb', 'application/mathematica', '', ''),
('mathml', 'application/mathml+xml', '', ''),
('mbox', 'application/mbox', '', 'far file-code'),
('mscml', 'application/mediaservercontrol+xml', '', ''),
('metalink', 'application/metalink+xml', '', ''),
('meta4', 'application/metalink4+xml', '', ''),
('mets', 'application/mets+xml', '', ''),
('mods', 'application/mods+xml', '', ''),
('m21', 'application/mp21', '', ''),
('mp21', 'application/mp21', '', ''),
('mp4s', 'application/mp4', '', ''),
('doc', 'application/msword', 'mime-type-document.svg', 'far file-word'),
('dot', 'application/msword', '', ''),
('mxf', 'application/mxf', '', ''),
('bin', 'application/octet-stream', '', ''),
('dms', 'application/octet-stream', '', ''),
('lrf', 'application/octet-stream', '', ''),
('mar', 'application/octet-stream', '', ''),
('so', 'application/octet-stream', '', ''),
('dist', 'application/octet-stream', '', ''),
('distz', 'application/octet-stream', '', ''),
('pkg', 'application/octet-stream', '', ''),
('bpk', 'application/octet-stream', '', ''),
('dump', 'application/octet-stream', '', ''),
('elc', 'application/octet-stream', '', ''),
('deploy', 'application/octet-stream', '', ''),
('mobipocket-ebook', 'application/octet-stream', '', ''),
('oda', 'application/oda', '', ''),
('opf', 'application/oebps-package+xml', '', ''),
('ogx', 'application/ogg', '', ''),
('omdoc', 'application/omdoc+xml', '', ''),
('onetoc', 'application/onenote', '', ''),
('onetoc2', 'application/onenote', '', ''),
('onetmp', 'application/onenote', '', ''),
('onepkg', 'application/onenote', '', ''),
('oxps', 'application/oxps', '', ''),
('xer', 'application/patch-ops-error+xml', '', ''),
('pdf', 'application/pdf', 'mime-type-document.svg', 'far file-pdf'),
('pgp', 'application/pgp-encrypted', '', 'far file-code'),
('asc', 'application/pgp-signature', '', 'far file-code'),
('sig', 'application/pgp-signature', '', 'far file-code'),
('prf', 'application/pics-rules', '', ''),
('p10', 'application/pkcs10', 'mime-type-vector.svg', ''),
('p7m', 'application/pkcs7-mime', '', ''),
('p7c', 'application/pkcs7-mime', '', ''),
('p7s', 'application/pkcs7-signature', '', ''),
('p8', 'application/pkcs8', '', ''),
('ac', 'application/pkix-attr-cert', '', ''),
('cer', 'application/pkix-cert', '', ''),
('crl', 'application/pkix-crl', '', ''),
('pkipath', 'application/pkix-pkipath', '', ''),
('pki', 'application/pkixcmp', '', ''),
('pls', 'application/pls+xml', '', ''),
('ai', 'application/postscript', 'mime-type-vector.svg', ''),
('eps', 'application/postscript', '', ''),
('ps', 'application/postscript', 'mime-type-vector.svg', ''),
('cww', 'application/prs.cww', '', ''),
('pskcxml', 'application/pskc+xml', '', ''),
('rdf', 'application/rdf+xml', '', 'far file-code'),
('rif', 'application/reginfo+xml', '', ''),
('rnc', 'application/relax-ng-compact-syntax', '', ''),
('rl', 'application/resource-lists+xml', '', ''),
('rld', 'application/resource-lists-diff+xml', '', ''),
('rs', 'application/rls-services+xml', '', ''),
('gbr', 'application/rpki-ghostbusters', '', ''),
('mft', 'application/rpki-manifest', '', ''),
('roa', 'application/rpki-roa', '', ''),
('rsd', 'application/rsd+xml', '', ''),
('rss', 'application/rss+xml', '', 'far file-code'),
('rtf', 'application/rtf', 'mime-type-document.svg', ''),
('sbml', 'application/sbml+xml', '', ''),
('scq', 'application/scvp-cv-request', '', ''),
('scs', 'application/scvp-cv-response', '', ''),
('spq', 'application/scvp-vp-request', '', ''),
('spp', 'application/scvp-vp-response', '', ''),
('sdp', 'application/sdp', 'mime-type-presentation.svg', 'far file-powerpoint'),
('setpay', 'application/set-payment-initiation', '', ''),
('setreg', 'application/set-registration-initiation', '', ''),
('shf', 'application/shf+xml', '', ''),
('smi', 'application/smil+xml', '', ''),
('smil', 'application/smil+xml', '', ''),
('rq', 'application/sparql-query', '', 'far file-code'),
('srx', 'application/sparql-results+xml', '', ''),
('gram', 'application/srgs', '', ''),
('grxml', 'application/srgs+xml', '', ''),
('sru', 'application/sru+xml', '', ''),
('ssdl', 'application/ssdl+xml', '', ''),
('ssml', 'application/ssml+xml', '', ''),
('tei', 'application/tei+xml', '', ''),
('teicorpus', 'application/tei+xml', '', ''),
('tfi', 'application/thraud+xml', '', ''),
('tsd', 'application/timestamped-data', '', ''),
('plb', 'application/vnd.3gpp.pic-bw-large', '', ''),
('psb', 'application/vnd.3gpp.pic-bw-small', '', ''),
('pvb', 'application/vnd.3gpp.pic-bw-var', '', ''),
('tcap', 'application/vnd.3gpp2.tcap', '', ''),
('pwn', 'application/vnd.3m.post-it-notes', '', ''),
('aso', 'application/vnd.accpac.simply.aso', '', ''),
('imp', 'application/vnd.accpac.simply.imp', '', ''),
('acu', 'application/vnd.acucobol', '', ''),
('atc', 'application/vnd.acucorp', '', ''),
('acutc', 'application/vnd.acucorp', '', ''),
('air', 'application/vnd.adobe.air-application-installer-package+zip', '', ''),
('fcdt', 'application/vnd.adobe.formscentral.fcdt', '', ''),
('fxp', 'application/vnd.adobe.fxp', '', ''),
('fxpl', 'application/vnd.adobe.fxp', '', ''),
('xdp', 'application/vnd.adobe.xdp+xml', '', ''),
('xfdf', 'application/vnd.adobe.xfdf', '', ''),
('ahead', 'application/vnd.ahead.space', '', ''),
('azf', 'application/vnd.airzip.filesecure.azf', '', ''),
('azs', 'application/vnd.airzip.filesecure.azs', '', ''),
('azw', 'application/vnd.amazon.ebook', '', ''),
('acc', 'application/vnd.americandynamics.acc', '', ''),
('ami', 'application/vnd.amiga.ami', '', ''),
('apk', 'application/vnd.android.package-archive', '', ''),
('cii', 'application/vnd.anser-web-certificate-issue-initiation', '', ''),
('fti', 'application/vnd.anser-web-funds-transfer-initiation', '', ''),
('atx', 'application/vnd.antix.game-component', '', ''),
('mpkg', 'application/vnd.apple.installer+xml', '', ''),
('m3u8', 'application/vnd.apple.mpegurl', '', ''),
('swi', 'application/vnd.aristanetworks.swi', '', ''),
('iota', 'application/vnd.astraea-software.iota', '', ''),
('aep', 'application/vnd.audiograph', '', ''),
('mpm', 'application/vnd.blueice.multipass', '', ''),
('bmi', 'application/vnd.bmi', '', ''),
('rep', 'application/vnd.businessobjects', '', ''),
('cdxml', 'application/vnd.chemdraw+xml', '', ''),
('mmd', 'application/vnd.chipnuts.karaoke-mmd', '', ''),
('cdy', 'application/vnd.cinderella', '', ''),
('cla', 'application/vnd.claymore', '', ''),
('rp9', 'application/vnd.cloanto.rp9', '', ''),
('c4g', 'application/vnd.clonk.c4group', '', ''),
('c4d', 'application/vnd.clonk.c4group', '', ''),
('c4f', 'application/vnd.clonk.c4group', '', ''),
('c4p', 'application/vnd.clonk.c4group', '', ''),
('c4u', 'application/vnd.clonk.c4group', '', ''),
('c11amc', 'application/vnd.cluetrust.cartomobile-config', '', ''),
('c11amz', 'application/vnd.cluetrust.cartomobile-config-pkg', '', ''),
('csp', 'application/vnd.commonspace', '', ''),
('cdbcmsg', 'application/vnd.contact.cmsg', '', ''),
('cmc', 'application/vnd.cosmocaller', '', ''),
('clkx', 'application/vnd.crick.clicker', '', ''),
('clkk', 'application/vnd.crick.clicker.keyboard', '', ''),
('clkp', 'application/vnd.crick.clicker.palette', '', ''),
('clkt', 'application/vnd.crick.clicker.template', '', ''),
('clkw', 'application/vnd.crick.clicker.wordbank', '', ''),
('wbs', 'application/vnd.criticaltools.wbs+xml', '', ''),
('pml', 'application/vnd.ctc-posml', '', ''),
('ppd', 'application/vnd.cups-ppd', '', ''),
('car', 'application/vnd.curl.car', '', ''),
('pcurl', 'application/vnd.curl.pcurl', '', ''),
('dart', 'application/vnd.dart', '', ''),
('rdz', 'application/vnd.data-vision.rdz', '', ''),
('uvf', 'application/vnd.dece.data', '', ''),
('uvvf', 'application/vnd.dece.data', '', ''),
('uvd', 'application/vnd.dece.data', '', ''),
('uvvd', 'application/vnd.dece.data', '', ''),
('uvt', 'application/vnd.dece.ttml+xml', '', ''),
('uvvt', 'application/vnd.dece.ttml+xml', '', ''),
('uvx', 'application/vnd.dece.unspecified', '', ''),
('uvvx', 'application/vnd.dece.unspecified', '', ''),
('uvz', 'application/vnd.dece.zip', '', ''),
('uvvz', 'application/vnd.dece.zip', '', ''),
('fe_launch', 'application/vnd.denovo.fcselayout-link', '', ''),
('dna', 'application/vnd.dna', '', ''),
('mlp', 'application/vnd.dolby.mlp', '', ''),
('dpg', 'application/vnd.dpgraph', '', ''),
('dfac', 'application/vnd.dreamfactory', '', ''),
('kpxx', 'application/vnd.ds-keypoint', '', ''),
('ait', 'application/vnd.dvb.ait', 'mime-type-vector.svg', ''),
('svc', 'application/vnd.dvb.service', '', '');
INSERT INTO `sys_storage_mime_types` (`ext`, `mime_type`, `icon`, `icon_font`) VALUES
('geo', 'application/vnd.dynageo', '', ''),
('mag', 'application/vnd.ecowin.chart', '', ''),
('nml', 'application/vnd.enliven', '', ''),
('esf', 'application/vnd.epson.esf', '', ''),
('msf', 'application/vnd.epson.msf', '', ''),
('qam', 'application/vnd.epson.quickanime', '', ''),
('slt', 'application/vnd.epson.salt', '', ''),
('ssf', 'application/vnd.epson.ssf', '', ''),
('es3', 'application/vnd.eszigno3+xml', '', ''),
('et3', 'application/vnd.eszigno3+xml', '', ''),
('ez2', 'application/vnd.ezpix-album', '', ''),
('ez3', 'application/vnd.ezpix-package', '', ''),
('fdf', 'application/vnd.fdf', '', ''),
('mseed', 'application/vnd.fdsn.mseed', '', ''),
('seed', 'application/vnd.fdsn.seed', '', ''),
('dataless', 'application/vnd.fdsn.seed', '', ''),
('gph', 'application/vnd.flographit', '', ''),
('ftc', 'application/vnd.fluxtime.clip', '', ''),
('fm', 'application/vnd.framemaker', '', ''),
('frame', 'application/vnd.framemaker', '', ''),
('maker', 'application/vnd.framemaker', '', ''),
('book', 'application/vnd.framemaker', '', ''),
('fnc', 'application/vnd.frogans.fnc', '', ''),
('ltf', 'application/vnd.frogans.ltf', '', ''),
('fsc', 'application/vnd.fsc.weblaunch', '', ''),
('oas', 'application/vnd.fujitsu.oasys', '', ''),
('oa2', 'application/vnd.fujitsu.oasys2', '', ''),
('oa3', 'application/vnd.fujitsu.oasys3', '', ''),
('fg5', 'application/vnd.fujitsu.oasysgp', '', ''),
('bh2', 'application/vnd.fujitsu.oasysprs', '', ''),
('ddd', 'application/vnd.fujixerox.ddd', '', ''),
('xdw', 'application/vnd.fujixerox.docuworks', '', ''),
('xbd', 'application/vnd.fujixerox.docuworks.binder', '', ''),
('fzs', 'application/vnd.fuzzysheet', '', ''),
('txd', 'application/vnd.genomatix.tuxedo', '', ''),
('ggb', 'application/vnd.geogebra.file', '', ''),
('ggt', 'application/vnd.geogebra.tool', '', ''),
('gex', 'application/vnd.geometry-explorer', '', ''),
('gre', 'application/vnd.geometry-explorer', '', ''),
('gxt', 'application/vnd.geonext', '', ''),
('g2w', 'application/vnd.geoplan', '', ''),
('g3w', 'application/vnd.geospace', '', ''),
('gmx', 'application/vnd.gmx', '', ''),
('kml', 'application/vnd.google-earth.kml+xml', '', ''),
('kmz', 'application/vnd.google-earth.kmz', '', ''),
('gqf', 'application/vnd.grafeq', '', ''),
('gqs', 'application/vnd.grafeq', '', ''),
('gac', 'application/vnd.groove-account', '', ''),
('ghf', 'application/vnd.groove-help', '', ''),
('gim', 'application/vnd.groove-identity-message', '', ''),
('grv', 'application/vnd.groove-injector', '', ''),
('gtm', 'application/vnd.groove-tool-message', '', ''),
('tpl', 'application/vnd.groove-tool-template', '', 'far file-code'),
('vcg', 'application/vnd.groove-vcard', '', ''),
('hal', 'application/vnd.hal+xml', '', ''),
('zmm', 'application/vnd.handheld-entertainment+xml', '', ''),
('hbci', 'application/vnd.hbci', '', ''),
('les', 'application/vnd.hhe.lesson-player', '', ''),
('hpgl', 'application/vnd.hp-hpgl', 'mime-type-vector.svg', ''),
('hpid', 'application/vnd.hp-hpid', '', ''),
('hps', 'application/vnd.hp-hps', '', ''),
('jlt', 'application/vnd.hp-jlyt', '', ''),
('pcl', 'application/vnd.hp-pcl', '', ''),
('pclxl', 'application/vnd.hp-pclxl', '', ''),
('sfd-hdstx', 'application/vnd.hydrostatix.sof-data', '', ''),
('mpy', 'application/vnd.ibm.minipay', '', ''),
('afp', 'application/vnd.ibm.modcap', '', ''),
('listafp', 'application/vnd.ibm.modcap', '', ''),
('list3820', 'application/vnd.ibm.modcap', '', ''),
('irm', 'application/vnd.ibm.rights-management', '', ''),
('sc', 'application/vnd.ibm.secure-container', '', ''),
('icc', 'application/vnd.iccprofile', '', ''),
('icm', 'application/vnd.iccprofile', '', ''),
('igl', 'application/vnd.igloader', '', ''),
('ivp', 'application/vnd.immervision-ivp', '', ''),
('ivu', 'application/vnd.immervision-ivu', '', ''),
('igm', 'application/vnd.insors.igm', '', ''),
('xpw', 'application/vnd.intercon.formnet', '', ''),
('xpx', 'application/vnd.intercon.formnet', '', ''),
('i2g', 'application/vnd.intergeo', '', ''),
('qbo', 'application/vnd.intu.qbo', '', ''),
('qfx', 'application/vnd.intu.qfx', '', ''),
('rcprofile', 'application/vnd.ipunplugged.rcprofile', '', ''),
('irp', 'application/vnd.irepository.package+xml', '', ''),
('xpr', 'application/vnd.is-xpr', '', ''),
('fcs', 'application/vnd.isac.fcs', '', ''),
('jam', 'application/vnd.jam', '', ''),
('rms', 'application/vnd.jcp.javame.midlet-rms', '', ''),
('jisp', 'application/vnd.jisp', '', ''),
('joda', 'application/vnd.joost.joda-archive', '', ''),
('ktz', 'application/vnd.kahootz', '', ''),
('ktr', 'application/vnd.kahootz', '', ''),
('karbon', 'application/vnd.kde.karbon', '', ''),
('chrt', 'application/vnd.kde.kchart', '', ''),
('kfo', 'application/vnd.kde.kformula', '', ''),
('flw', 'application/vnd.kde.kivio', '', ''),
('kon', 'application/vnd.kde.kontour', '', ''),
('kpr', 'application/vnd.kde.kpresenter', '', ''),
('kpt', 'application/vnd.kde.kpresenter', '', ''),
('ksp', 'application/vnd.kde.kspread', '', ''),
('kwd', 'application/vnd.kde.kword', '', ''),
('kwt', 'application/vnd.kde.kword', '', ''),
('htke', 'application/vnd.kenameaapp', '', ''),
('kia', 'application/vnd.kidspiration', '', ''),
('kne', 'application/vnd.kinar', '', ''),
('knp', 'application/vnd.kinar', '', ''),
('skp', 'application/vnd.koan', '', ''),
('skd', 'application/vnd.koan', '', ''),
('skt', 'application/vnd.koan', '', ''),
('skm', 'application/vnd.koan', '', ''),
('sse', 'application/vnd.kodak-descriptor', '', ''),
('lasxml', 'application/vnd.las.las+xml', '', ''),
('lbd', 'application/vnd.llamagraphics.life-balance.desktop', '', ''),
('lbe', 'application/vnd.llamagraphics.life-balance.exchange+xml', '', ''),
('123', 'application/vnd.lotus-1-2-3', '', ''),
('apr', 'application/vnd.lotus-approach', '', ''),
('pre', 'application/vnd.lotus-freelance', '', ''),
('nsf', 'application/vnd.lotus-notes', '', ''),
('org', 'application/vnd.lotus-organizer', '', ''),
('scm', 'application/vnd.lotus-screencam', '', ''),
('lwp', 'application/vnd.lotus-wordpro', '', ''),
('portpkg', 'application/vnd.macports.portpkg', '', ''),
('mcd', 'application/vnd.mcd', '', ''),
('mc1', 'application/vnd.medcalcdata', '', ''),
('cdkey', 'application/vnd.mediastation.cdkey', '', ''),
('mwf', 'application/vnd.mfer', '', ''),
('mfm', 'application/vnd.mfmp', '', ''),
('flo', 'application/vnd.micrografx.flo', '', ''),
('igx', 'application/vnd.micrografx.igx', '', ''),
('mif', 'application/vnd.mif', '', ''),
('daf', 'application/vnd.mobius.daf', '', ''),
('dis', 'application/vnd.mobius.dis', '', ''),
('mbk', 'application/vnd.mobius.mbk', '', ''),
('mqy', 'application/vnd.mobius.mqy', '', ''),
('msl', 'application/vnd.mobius.msl', '', ''),
('plc', 'application/vnd.mobius.plc', '', ''),
('txf', 'application/vnd.mobius.txf', '', ''),
('mpn', 'application/vnd.mophun.application', '', ''),
('mpc', 'application/vnd.mophun.certificate', '', ''),
('xul', 'application/vnd.mozilla.xul+xml', '', ''),
('cil', 'application/vnd.ms-artgalry', 'mime-type-vector.svg', ''),
('taxi', 'application/vnd.ms-cab-compressed', 'mime-type-archive.svg', 'far file-archive'),
('xls', 'application/vnd.ms-excel', 'mime-type-spreadsheet.svg', 'far file-excel'),
('xlm', 'application/vnd.ms-excel', '', ''),
('xla', 'application/vnd.ms-excel', '', ''),
('xlc', 'application/vnd.ms-excel', '', ''),
('xlt', 'application/vnd.ms-excel', 'mime-type-spreadsheet.svg', 'far file-excel'),
('xlw', 'application/vnd.ms-excel', '', ''),
('xlam', 'application/vnd.ms-excel.addin.macroenabled.12', '', ''),
('xlsb', 'application/vnd.ms-excel.sheet.binary.macroenabled.12', '', ''),
('xlsm', 'application/vnd.ms-excel.sheet.macroenabled.12', '', ''),
('xltm', 'application/vnd.ms-excel.template.macroenabled.12', '', ''),
('eot', 'application/vnd.ms-fontobject', '', ''),
('chm', 'application/vnd.ms-htmlhelp', '', ''),
('ims', 'application/vnd.ms-ims', '', ''),
('lrm', 'application/vnd.ms-lrm', '', ''),
('thmx', 'application/vnd.ms-officetheme', '', ''),
('cat', 'application/vnd.ms-pki.seccat', '', ''),
('stl', 'application/vnd.ms-pki.stl', '', ''),
('ppt', 'application/vnd.ms-powerpoint', 'mime-type-presentation.svg', 'far file-powerpoint'),
('pps', 'application/vnd.ms-powerpoint', '', ''),
('pot', 'application/vnd.ms-powerpoint', '', ''),
('ppam', 'application/vnd.ms-powerpoint.addin.macroenabled.12', '', ''),
('pptm', 'application/vnd.ms-powerpoint.presentation.macroenabled.12', '', ''),
('sldm', 'application/vnd.ms-powerpoint.slide.macroenabled.12', '', ''),
('ppsm', 'application/vnd.ms-powerpoint.slideshow.macroenabled.12', '', ''),
('potm', 'application/vnd.ms-powerpoint.template.macroenabled.12', '', ''),
('mpp', 'application/vnd.ms-project', '', ''),
('mpt', 'application/vnd.ms-project', '', ''),
('docm', 'application/vnd.ms-word.document.macroenabled.12', '', ''),
('dotm', 'application/vnd.ms-word.template.macroenabled.12', '', ''),
('wps', 'application/vnd.ms-works', '', ''),
('wks', 'application/vnd.ms-works', '', ''),
('wcm', 'application/vnd.ms-works', '', ''),
('wdb', 'application/vnd.ms-works', '', ''),
('wpl', 'application/vnd.ms-wpl', '', ''),
('xps', 'application/vnd.ms-xpsdocument', '', ''),
('mseq', 'application/vnd.mseq', '', ''),
('mus', 'application/vnd.musician', '', ''),
('msty', 'application/vnd.muvee.style', '', ''),
('taglet', 'application/vnd.mynfc', '', ''),
('nlu', 'application/vnd.neurolanguage.nlu', '', ''),
('ntf', 'application/vnd.nitf', '', ''),
('nitf', 'application/vnd.nitf', '', ''),
('nnd', 'application/vnd.noblenet-directory', '', ''),
('nns', 'application/vnd.noblenet-sealer', '', ''),
('nnw', 'application/vnd.noblenet-web', '', ''),
('ngdat', 'application/vnd.nokia.n-gage.data', '', ''),
('n-gage', 'application/vnd.nokia.n-gage.symbian.install', '', ''),
('rpst', 'application/vnd.nokia.radio-preset', '', ''),
('rpss', 'application/vnd.nokia.radio-presets', '', ''),
('edm', 'application/vnd.novadigm.edm', '', ''),
('edx', 'application/vnd.novadigm.edx', '', ''),
('ext', 'application/vnd.novadigm.ext', '', ''),
('odc', 'application/vnd.oasis.opendocument.chart', '', ''),
('otc', 'application/vnd.oasis.opendocument.chart-template', '', ''),
('odb', 'application/vnd.oasis.opendocument.database', '', ''),
('odf', 'application/vnd.oasis.opendocument.formula', '', ''),
('odft', 'application/vnd.oasis.opendocument.formula-template', '', '');
INSERT INTO `sys_storage_mime_types` (`ext`, `mime_type`, `icon`, `icon_font`) VALUES
('odg', 'application/vnd.oasis.opendocument.graphics', 'mime-type-vector.svg', ''),
('otg', 'application/vnd.oasis.opendocument.graphics-template', '', ''),
('odi', 'application/vnd.oasis.opendocument.image', '', ''),
('oti', 'application/vnd.oasis.opendocument.image-template', '', ''),
('odp', 'application/vnd.oasis.opendocument.presentation', 'mime-type-presentation.svg', 'far file-powerpoint'),
('otp', 'application/vnd.oasis.opendocument.presentation-template', '', ''),
('ods', 'application/vnd.oasis.opendocument.spreadsheet', 'mime-type-spreadsheet.svg', 'far file-excel'),
('ots', 'application/vnd.oasis.opendocument.spreadsheet-template', 'mime-type-spreadsheet.svg', 'far file-excel'),
('odt', 'application/vnd.oasis.opendocument.text', 'mime-type-document.svg', ''),
('odm', 'application/vnd.oasis.opendocument.text-master', '', ''),
('ott', 'application/vnd.oasis.opendocument.text-template', 'mime-type-document.svg', ''),
('oth', 'application/vnd.oasis.opendocument.text-web', '', ''),
('xo', 'application/vnd.olpc-sugar', '', ''),
('dd2', 'application/vnd.oma.dd2+xml', '', ''),
('oxt', 'application/vnd.openofficeorg.extension', '', ''),
('pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'mime-type-presentation.svg', 'far file-powerpoint'),
('sldx', 'application/vnd.openxmlformats-officedocument.presentationml.slide', '', ''),
('ppsx', 'application/vnd.openxmlformats-officedocument.presentationml.slideshow', '', ''),
('potx', 'application/vnd.openxmlformats-officedocument.presentationml.template', '', ''),
('xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'mime-type-spreadsheet.svg', 'far file-excel'),
('xltx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.template', '', ''),
('docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'mime-type-document.svg', 'far file-word'),
('dotx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.template', '', ''),
('mgp', 'application/vnd.osgeo.mapguide.package', '', ''),
('dp', 'application/vnd.osgi.dp', '', ''),
('esa', 'application/vnd.osgi.subsystem', '', ''),
('pdb', 'application/vnd.palm', 'mime-type-document.svg', ''),
('pqa', 'application/vnd.palm', '', ''),
('oprc', 'application/vnd.palm', '', ''),
('paw', 'application/vnd.pawaafile', '', ''),
('str', 'application/vnd.pg.format', '', ''),
('ei6', 'application/vnd.pg.osasli', '', ''),
('efif', 'application/vnd.picsel', '', ''),
('wg', 'application/vnd.pmi.widget', '', ''),
('plf', 'application/vnd.pocketlearn', '', ''),
('pbd', 'application/vnd.powerbuilder6', '', ''),
('box', 'application/vnd.previewsystems.box', '', ''),
('mgz', 'application/vnd.proteus.magazine', '', ''),
('qps', 'application/vnd.publishare-delta-tree', '', ''),
('ptid', 'application/vnd.pvi.ptid1', '', ''),
('qxd', 'application/vnd.quark.quarkxpress', '', ''),
('qxt', 'application/vnd.quark.quarkxpress', '', ''),
('qwd', 'application/vnd.quark.quarkxpress', '', ''),
('qwt', 'application/vnd.quark.quarkxpress', '', ''),
('qxl', 'application/vnd.quark.quarkxpress', '', ''),
('qxb', 'application/vnd.quark.quarkxpress', '', ''),
('bed', 'application/vnd.realvnc.bed', '', ''),
('mxl', 'application/vnd.recordare.musicxml', '', ''),
('musicxml', 'application/vnd.recordare.musicxml+xml', '', ''),
('cryptonote', 'application/vnd.rig.cryptonote', '', ''),
('cod', 'application/vnd.rim.cod', '', ''),
('rm', 'application/vnd.rn-realmedia', '', ''),
('rmvb', 'application/vnd.rn-realmedia-vbr', '', ''),
('link66', 'application/vnd.route66.link66+xml', '', ''),
('st', 'application/vnd.sailingtracker.track', '', ''),
('see', 'application/vnd.seemail', '', ''),
('sema', 'application/vnd.sema', '', ''),
('semd', 'application/vnd.semd', '', ''),
('semf', 'application/vnd.semf', '', ''),
('ifm', 'application/vnd.shana.informed.formdata', '', ''),
('itp', 'application/vnd.shana.informed.formtemplate', '', ''),
('iif', 'application/vnd.shana.informed.interchange', '', ''),
('ipk', 'application/vnd.shana.informed.package', '', ''),
('twd', 'application/vnd.simtech-mindmapper', '', ''),
('twds', 'application/vnd.simtech-mindmapper', '', ''),
('mmf', 'application/vnd.smaf', '', ''),
('teacher', 'application/vnd.smart.teacher', '', ''),
('sdkm', 'application/vnd.solent.sdkm+xml', '', ''),
('sdkd', 'application/vnd.solent.sdkm+xml', '', ''),
('dxp', 'application/vnd.spotfire.dxp', '', ''),
('sfs', 'application/vnd.spotfire.sfs', '', ''),
('sdc', 'application/vnd.stardivision.calc', 'mime-type-spreadsheet.svg', 'far file-excel'),
('sda', 'application/vnd.stardivision.draw', '', ''),
('sdd', 'application/vnd.stardivision.impress', 'mime-type-presentation.svg', 'far file-powerpoint'),
('smf', 'application/vnd.stardivision.math', '', ''),
('sdw', 'application/vnd.stardivision.writer', 'mime-type-document.svg', ''),
('vor', 'application/vnd.stardivision.writer', '', ''),
('sgl', 'application/vnd.stardivision.writer-global', '', ''),
('smzip', 'application/vnd.stepmania.package', '', ''),
('sm', 'application/vnd.stepmania.stepchart', '', ''),
('sxc', 'application/vnd.sun.xml.calc', 'mime-type-spreadsheet.svg', 'far file-excel'),
('stc', 'application/vnd.sun.xml.calc.template', 'mime-type-spreadsheet.svg', 'far file-excel'),
('sxd', 'application/vnd.sun.xml.draw', 'mime-type-vector.svg', ''),
('std', 'application/vnd.sun.xml.draw.template', '', ''),
('sxi', 'application/vnd.sun.xml.impress', 'mime-type-presentation.svg', 'far file-powerpoint'),
('sti', 'application/vnd.sun.xml.impress.template', 'mime-type-presentation.svg', 'far file-powerpoint'),
('sxm', 'application/vnd.sun.xml.math', '', ''),
('sxw', 'application/vnd.sun.xml.writer', 'mime-type-document.svg', ''),
('sxg', 'application/vnd.sun.xml.writer.global', '', ''),
('stw', 'application/vnd.sun.xml.writer.template', 'mime-type-document.svg', ''),
('sus', 'application/vnd.sus-calendar', '', ''),
('susp', 'application/vnd.sus-calendar', '', ''),
('svd', 'application/vnd.svd', '', ''),
('sis', 'application/vnd.symbian.install', '', ''),
('sisx', 'application/vnd.symbian.install', '', ''),
('xsm', 'application/vnd.syncml+xml', '', ''),
('bdm', 'application/vnd.syncml.dm+wbxml', '', ''),
('xdm', 'application/vnd.syncml.dm+xml', '', ''),
('tao', 'application/vnd.tao.intent-module-archive', '', ''),
('pcap', 'application/vnd.tcpdump.pcap', '', ''),
('cap', 'application/vnd.tcpdump.pcap', '', ''),
('dmp', 'application/vnd.tcpdump.pcap', '', ''),
('tmo', 'application/vnd.tmobile-livetv', '', ''),
('tpt', 'application/vnd.trid.tpt', '', ''),
('mxs', 'application/vnd.triscape.mxs', '', ''),
('tra', 'application/vnd.trueapp', '', ''),
('ufd', 'application/vnd.ufdl', '', ''),
('ufdl', 'application/vnd.ufdl', '', ''),
('utz', 'application/vnd.uiq.theme', '', ''),
('umj', 'application/vnd.umajin', '', ''),
('unityweb', 'application/vnd.unity', '', ''),
('uoml', 'application/vnd.uoml+xml', '', ''),
('vcx', 'application/vnd.vcx', '', ''),
('vsd', 'application/vnd.visio', '', ''),
('vst', 'application/vnd.visio', '', ''),
('vss', 'application/vnd.visio', 'mime-type-vector.svg', ''),
('vsw', 'application/vnd.visio', '', ''),
('vis', 'application/vnd.visionary', '', ''),
('vsf', 'application/vnd.vsf', '', ''),
('wbxml', 'application/vnd.wap.wbxml', '', ''),
('wmlc', 'application/vnd.wap.wmlc', '', ''),
('wmlsc', 'application/vnd.wap.wmlscriptc', '', ''),
('wtb', 'application/vnd.webturbo', '', ''),
('nbp', 'application/vnd.wolfram.player', '', ''),
('wpd', 'application/vnd.wordperfect', '', ''),
('wqd', 'application/vnd.wqd', '', ''),
('stf', 'application/vnd.wt.stf', '', ''),
('xar', 'application/vnd.xara', '', ''),
('xfdl', 'application/vnd.xfdl', '', ''),
('hvd', 'application/vnd.yamaha.hv-dic', '', ''),
('hvs', 'application/vnd.yamaha.hv-script', '', ''),
('hvp', 'application/vnd.yamaha.hv-voice', '', ''),
('osf', 'application/vnd.yamaha.openscoreformat', '', ''),
('osfpvg', 'application/vnd.yamaha.openscoreformat.osfpvg+xml', '', ''),
('saf', 'application/vnd.yamaha.smaf-audio', '', ''),
('spf', 'application/vnd.yamaha.smaf-phrase', '', ''),
('cmp', 'application/vnd.yellowriver-custom-menu', '', ''),
('zir', 'application/vnd.zul', '', ''),
('zirz', 'application/vnd.zul', '', ''),
('zaz', 'application/vnd.zzazz.deck+xml', '', ''),
('vxml', 'application/voicexml+xml', '', ''),
('wgt', 'application/widget', '', ''),
('hlp', 'application/winhlp', '', ''),
('wsdl', 'application/wsdl+xml', '', ''),
('wspolicy', 'application/wspolicy+xml', '', ''),
('7z', 'application/x-7z-compressed', 'mime-type-archive.svg', 'far file-archive'),
('abw', 'application/x-abiword', '', ''),
('ace', 'application/x-ace-compressed', 'mime-type-archive.svg', 'far file-archive'),
('dmg', 'application/x-apple-diskimage', '', ''),
('aab', 'application/x-authorware-bin', '', ''),
('x32', 'application/x-authorware-bin', '', ''),
('u32', 'application/x-authorware-bin', '', ''),
('vox', 'application/x-authorware-bin', '', ''),
('aam', 'application/x-authorware-map', '', ''),
('aas', 'application/x-authorware-seg', '', ''),
('bcpio', 'application/x-bcpio', '', ''),
('torrent', 'application/x-bittorrent', '', ''),
('blb', 'application/x-blorb', '', ''),
('blorb', 'application/x-blorb', '', ''),
('bz', 'application/x-bzip', '', ''),
('bz2', 'application/x-bzip2', 'mime-type-archive.svg', 'far file-archive'),
('boz', 'application/x-bzip2', '', ''),
('cbr', 'application/x-cbr', '', ''),
('cba', 'application/x-cbr', '', ''),
('cbt', 'application/x-cbr', '', ''),
('cbz', 'application/x-cbr', '', ''),
('cb7', 'application/x-cbr', '', ''),
('vcd', 'application/x-cdlink', '', ''),
('cfs', 'application/x-cfs-compressed', '', ''),
('chat', 'application/x-chat', '', ''),
('pgn', 'application/x-chess-pgn', '', ''),
('nsc', 'application/x-conference', '', ''),
('cpio', 'application/x-cpio', '', ''),
('csh', 'application/x-csh', '', 'far file-code'),
('deb', 'application/x-debian-package', '', ''),
('udeb', 'application/x-debian-package', '', ''),
('dgc', 'application/x-dgc-compressed', '', ''),
('dir', 'application/x-director', '', ''),
('dcr', 'application/x-director', '', ''),
('dxr', 'application/x-director', '', ''),
('cst', 'application/x-director', '', ''),
('cct', 'application/x-director', '', ''),
('cxt', 'application/x-director', '', '');
INSERT INTO `sys_storage_mime_types` (`ext`, `mime_type`, `icon`, `icon_font`) VALUES
('w3d', 'application/x-director', '', ''),
('fgd', 'application/x-director', '', ''),
('swa', 'application/x-director', '', ''),
('wad', 'application/x-doom', '', ''),
('ncx', 'application/x-dtbncx+xml', '', ''),
('dtb', 'application/x-dtbook+xml', '', ''),
('res', 'application/x-dtbresource+xml', '', ''),
('dvi', 'application/x-dvi', '', ''),
('evy', 'application/x-envoy', '', ''),
('eva', 'application/x-eva', '', ''),
('bdf', 'application/x-font-bdf', '', ''),
('gsf', 'application/x-font-ghostscript', '', ''),
('psf', 'application/x-font-linux-psf', '', ''),
('otf', 'application/x-font-otf', '', ''),
('pcf', 'application/x-font-pcf', '', ''),
('snf', 'application/x-font-snf', '', ''),
('ttf', 'application/x-font-ttf', '', ''),
('ttc', 'application/x-font-ttf', '', ''),
('pfa', 'application/x-font-type1', '', ''),
('pfb', 'application/x-font-type1', '', ''),
('pfm', 'application/x-font-type1', '', ''),
('afm', 'application/x-font-type1', '', ''),
('woff', 'application/x-font-woff', '', ''),
('arc', 'application/x-freearc', '', ''),
('spl', 'application/x-futuresplash', '', ''),
('gca', 'application/x-gca-compressed', '', ''),
('ulx', 'application/x-glulx', '', ''),
('gnumeric', 'application/x-gnumeric', '', ''),
('gramps', 'application/x-gramps-xml', '', ''),
('gtar', 'application/x-gtar', '', ''),
('hdf', 'application/x-hdf', '', ''),
('install', 'application/x-install-instructions', '', ''),
('iso', 'application/x-iso9660-image', '', ''),
('jnlp', 'application/x-java-jnlp-file', '', ''),
('latex', 'application/x-latex', '', ''),
('lzh', 'application/x-lzh-compressed', '', ''),
('lha', 'application/x-lzh-compressed', '', ''),
('mie', 'application/x-mie', '', ''),
('prc', 'application/x-mobipocket-ebook', '', ''),
('mobi', 'application/x-mobipocket-ebook', '', ''),
('application', 'application/x-ms-application', '', ''),
('lnk', 'application/x-ms-shortcut', '', ''),
('wmd', 'application/x-ms-wmd', '', ''),
('wmz', 'application/x-ms-wmz', '', ''),
('xbap', 'application/x-ms-xbap', '', ''),
('mdb', 'application/x-msaccess', '', ''),
('obd', 'application/x-msbinder', '', ''),
('crd', 'application/x-mscardfile', '', ''),
('clp', 'application/x-msclip', '', ''),
('exe', 'application/x-msdownload', '', ''),
('dll', 'application/x-msdownload', '', ''),
('com', 'application/x-msdownload', '', ''),
('bat', 'application/x-msdownload', '', 'far file-code'),
('msi', 'application/x-msdownload', '', ''),
('mvb', 'application/x-msmediaview', '', ''),
('m13', 'application/x-msmediaview', '', ''),
('m14', 'application/x-msmediaview', '', ''),
('wmf', 'application/x-msmetafile', '', ''),
('emf', 'application/x-msmetafile', '', ''),
('emz', 'application/x-msmetafile', '', ''),
('mny', 'application/x-msmoney', '', ''),
('pub', 'application/x-mspublisher', '', ''),
('scd', 'application/x-msschedule', '', ''),
('trm', 'application/x-msterminal', '', ''),
('wri', 'application/x-mswrite', '', ''),
('nc', 'application/x-netcdf', '', ''),
('cdf', 'application/x-netcdf', '', ''),
('nzb', 'application/x-nzb', '', ''),
('p12', 'application/x-pkcs12', '', ''),
('pfx', 'application/x-pkcs12', '', ''),
('p7b', 'application/x-pkcs7-certificates', '', ''),
('spc', 'application/x-pkcs7-certificates', '', ''),
('p7r', 'application/x-pkcs7-certreqresp', '', ''),
('rar', 'application/x-rar-compressed', 'mime-type-archive.svg', 'far file-archive'),
('ris', 'application/x-research-info-systems', '', ''),
('sh', 'application/x-sh', '', 'far file-code'),
('shar', 'application/x-shar', '', ''),
('swf', 'application/x-shockwave-flash', '', ''),
('xap', 'application/x-silverlight-app', '', ''),
('sql', 'text/x-sql', '', 'far file-code'),
('sit', 'application/x-stuffit', '', ''),
('sitx', 'application/x-stuffitx', '', ''),
('srt', 'application/x-subrip', '', ''),
('sv4cpio', 'application/x-sv4cpio', '', ''),
('sv4crc', 'application/x-sv4crc', '', ''),
('t3', 'application/x-t3vm-image', '', ''),
('gam', 'application/x-tads', '', ''),
('tar', 'application/x-tar', 'mime-type-archive.svg', 'far file-archive'),
('tcl', 'application/x-tcl', '', ''),
('tex', 'application/x-tex', '', ''),
('tfm', 'application/x-tex-tfm', '', ''),
('texinfo', 'application/x-texinfo', '', ''),
('texi', 'application/x-texinfo', '', ''),
('obj', 'application/x-tgif', '', ''),
('ustar', 'application/x-ustar', '', ''),
('src', 'application/x-wais-source', '', 'far file-code'),
('der', 'application/x-x509-ca-cert', '', ''),
('crt', 'application/x-x509-ca-cert', '', ''),
('fig', 'application/x-xfig', '', ''),
('xlf', 'application/x-xliff+xml', '', ''),
('xpi', 'application/x-xpinstall', '', ''),
('xz', 'application/x-xz', '', ''),
('z1', 'application/x-zmachine', '', ''),
('z2', 'application/x-zmachine', '', ''),
('z3', 'application/x-zmachine', '', ''),
('z4', 'application/x-zmachine', '', ''),
('z5', 'application/x-zmachine', '', ''),
('z6', 'application/x-zmachine', '', ''),
('z7', 'application/x-zmachine', '', ''),
('z8', 'application/x-zmachine', '', ''),
('xaml', 'application/xaml+xml', '', ''),
('xdf', 'application/xcap-diff+xml', '', ''),
('xenc', 'application/xenc+xml', '', ''),
('xhtml', 'application/xhtml+xml', '', 'far file-code'),
('xht', 'application/xhtml+xml', '', ''),
('xml', 'application/xml', '', 'far file-code'),
('xsl', 'application/xml', '', 'far file-code'),
('dtd', 'application/xml-dtd', '', 'far file-code'),
('xop', 'application/xop+xml', '', ''),
('xpl', 'application/xproc+xml', '', ''),
('xslt', 'application/xslt+xml', '', 'far file-code'),
('xspf', 'application/xspf+xml', '', ''),
('mxml', 'application/xv+xml', '', ''),
('xhvml', 'application/xv+xml', '', ''),
('xvml', 'application/xv+xml', '', ''),
('xvm', 'application/xv+xml', '', ''),
('yang', 'application/yang', '', ''),
('yin', 'application/yin+xml', '', ''),
('zip', 'application/zip', 'mime-type-archive.svg', 'far file-archive'),
('adp', 'audio/adpcm', 'mime-type-audio.svg', 'far file-audio'),
('au', 'audio/basic', 'mime-type-audio.svg', 'far file-audio'),
('snd', 'audio/basic', 'mime-type-audio.svg', 'far file-audio'),
('mid', 'audio/midi', 'mime-type-audio.svg', 'far file-audio'),
('midi', 'audio/midi', 'mime-type-audio.svg', 'far file-audio'),
('kar', 'audio/midi', 'mime-type-audio.svg', 'far file-audio'),
('rmi', 'audio/midi', 'mime-type-audio.svg', 'far file-audio'),
('m4a', 'audio/mp4', 'mime-type-audio.svg', 'far file-audio'),
('mp4a', 'audio/mp4', 'mime-type-audio.svg', 'far file-audio'),
('m4p', 'audio/mp4a-latm', 'mime-type-audio.svg', 'far file-audio'),
('mpga', 'audio/mpeg', 'mime-type-audio.svg', 'far file-audio'),
('mp2', 'audio/mpeg', 'mime-type-audio.svg', 'far file-audio'),
('mp2a', 'audio/mpeg', 'mime-type-audio.svg', 'far file-audio'),
('mp3', 'audio/mpeg', 'mime-type-audio.svg', 'far file-audio'),
('m2a', 'audio/mpeg', 'mime-type-audio.svg', 'far file-audio'),
('m3a', 'audio/mpeg', 'mime-type-audio.svg', 'far file-audio'),
('oga', 'audio/ogg', 'mime-type-audio.svg', 'far file-audio'),
('ogg', 'audio/ogg', 'mime-type-audio.svg', 'far file-audio'),
('spx', 'audio/ogg', 'mime-type-audio.svg', 'far file-audio'),
('s3m', 'audio/s3m', 'mime-type-audio.svg', 'far file-audio'),
('sil', 'audio/silk', 'mime-type-audio.svg', 'far file-audio'),
('uva', 'audio/vnd.dece.audio', 'mime-type-audio.svg', 'far file-audio'),
('uvva', 'audio/vnd.dece.audio', 'mime-type-audio.svg', 'far file-audio'),
('eol', 'audio/vnd.digital-winds', 'mime-type-audio.svg', 'far file-audio'),
('dra', 'audio/vnd.dra', 'mime-type-audio.svg', 'far file-audio'),
('dts', 'audio/vnd.dts', 'mime-type-audio.svg', 'far file-audio'),
('dtshd', 'audio/vnd.dts.hd', 'mime-type-audio.svg', 'far file-audio'),
('lvp', 'audio/vnd.lucent.voice', 'mime-type-audio.svg', 'far file-audio'),
('pya', 'audio/vnd.ms-playready.media.pya', 'mime-type-audio.svg', 'far file-audio'),
('ecelp4800', 'audio/vnd.nuera.ecelp4800', 'mime-type-audio.svg', 'far file-audio'),
('ecelp7470', 'audio/vnd.nuera.ecelp7470', 'mime-type-audio.svg', 'far file-audio'),
('ecelp9600', 'audio/vnd.nuera.ecelp9600', 'mime-type-audio.svg', 'far file-audio'),
('rip', 'audio/vnd.rip', 'mime-type-audio.svg', 'far file-audio'),
('weba', 'audio/webm', 'mime-type-audio.svg', 'far file-audio'),
('aac', 'audio/x-aac', 'mime-type-audio.svg', 'far file-audio'),
('aif', 'audio/x-aiff', 'mime-type-audio.svg', 'far file-audio'),
('aiff', 'audio/x-aiff', 'mime-type-audio.svg', 'far file-audio'),
('aifc', 'audio/x-aiff', 'mime-type-audio.svg', 'far file-audio'),
('caf', 'audio/x-caf', 'mime-type-audio.svg', 'far file-audio'),
('flac', 'audio/x-flac', 'mime-type-audio.svg', 'far file-audio'),
('mka', 'audio/x-matroska', 'mime-type-audio.svg', 'far file-audio'),
('m3u', 'audio/x-mpegurl', 'mime-type-audio.svg', 'far file-audio'),
('wax', 'audio/x-ms-wax', 'mime-type-audio.svg', 'far file-audio'),
('wma', 'audio/x-ms-wma', 'mime-type-audio.svg', 'far file-audio'),
('ram', 'audio/x-pn-realaudio', 'mime-type-audio.svg', 'far file-audio'),
('ra', 'audio/x-pn-realaudio', 'mime-type-audio.svg', 'far file-audio'),
('rmp', 'audio/x-pn-realaudio-plugin', 'mime-type-audio.svg', 'far file-audio'),
('wav', 'audio/x-wav', 'mime-type-audio.svg', 'far file-audio'),
('xm', 'audio/xm', 'mime-type-audio.svg', 'far file-audio'),
('cdx', 'chemical/x-cdx', 'mime-type-vector.svg', ''),
('cif', 'chemical/x-cif', '', ''),
('cmdf', 'chemical/x-cmdf', '', ''),
('cml', 'chemical/x-cml', '', ''),
('csml', 'chemical/x-csml', '', ''),
('xyz', 'chemical/x-xyz', '', ''),
('bmp', 'image/bmp', 'mime-type-image.svg', 'far file-image'),
('cgm', 'image/cgm', 'mime-type-image.svg', 'far file-image'),
('g3', 'image/g3fax', 'mime-type-image.svg', 'far file-image'),
('gif', 'image/gif', 'mime-type-image.svg', 'far file-image'),
('ief', 'image/ief', 'mime-type-image.svg', 'far file-image'),
('jp2', 'image/jp2', 'mime-type-image.svg', 'far file-image'),
('jpeg', 'image/jpeg', 'mime-type-image.svg', 'far file-image'),
('jpg', 'image/jpeg', 'mime-type-image.svg', 'far file-image'),
('jpe', 'image/jpeg', 'mime-type-image.svg', 'far file-image'),
('ktx', 'image/ktx', 'mime-type-image.svg', 'far file-image'),
('pict', 'image/pict', 'mime-type-image.svg', 'far file-image'),
('pic', 'image/pict', 'mime-type-image.svg', 'far file-image'),
('pct', 'image/pict', 'mime-type-image.svg', 'far file-image'),
('png', 'image/png', 'mime-type-png.svg', 'far file-image'),
('btif', 'image/prs.btif', 'mime-type-image.svg', 'far file-image'),
('sgi', 'image/sgi', 'mime-type-image.svg', 'far file-image');
INSERT INTO `sys_storage_mime_types` (`ext`, `mime_type`, `icon`, `icon_font`) VALUES
('svg', 'image/svg+xml', 'mime-type-image.svg', 'far file-image'),
('svgz', 'image/svg+xml', 'mime-type-image.svg', 'far file-image'),
('tiff', 'image/tiff', 'mime-type-image.svg', 'far file-image'),
('tif', 'image/tiff', 'mime-type-image.svg', 'far file-image'),
('psd', 'image/vnd.adobe.photoshop', 'mime-type-psd.svg', 'far file-image'),
('uvi', 'image/vnd.dece.graphic', 'mime-type-image.svg', 'far file-image'),
('uvvi', 'image/vnd.dece.graphic', 'mime-type-image.svg', 'far file-image'),
('uvg', 'image/vnd.dece.graphic', 'mime-type-image.svg', 'far file-image'),
('uvvg', 'image/vnd.dece.graphic', 'mime-type-image.svg', 'far file-image'),
('sub', 'image/vnd.dvb.subtitle', 'mime-type-image.svg', 'far file-image'),
('djvu', 'image/vnd.djvu', 'mime-type-image.svg', 'far file-image'),
('djv', 'image/vnd.djvu', 'mime-type-image.svg', 'far file-image'),
('dwg', 'image/vnd.dwg', 'mime-type-image.svg', 'far file-image'),
('dxf', 'image/vnd.dxf', 'mime-type-image.svg', 'far file-image'),
('fbs', 'image/vnd.fastbidsheet', 'mime-type-image.svg', 'far file-image'),
('fpx', 'image/vnd.fpx', 'mime-type-image.svg', 'far file-image'),
('fst', 'image/vnd.fst', 'mime-type-image.svg', 'far file-image'),
('mmr', 'image/vnd.fujixerox.edmics-mmr', 'mime-type-image.svg', 'far file-image'),
('rlc', 'image/vnd.fujixerox.edmics-rlc', 'mime-type-image.svg', 'far file-image'),
('mdi', 'image/vnd.ms-modi', 'mime-type-image.svg', 'far file-image'),
('wdp', 'image/vnd.ms-photo', 'mime-type-image.svg', 'far file-image'),
('npx', 'image/vnd.net-fpx', 'mime-type-image.svg', 'far file-image'),
('wbmp', 'image/vnd.wap.wbmp', 'mime-type-image.svg', 'far file-image'),
('xif', 'image/vnd.xiff', 'mime-type-image.svg', 'far file-image'),
('webp', 'image/webp', 'mime-type-image.svg', 'far file-image'),
('3ds', 'image/x-3ds', 'mime-type-image.svg', 'far file-image'),
('ras', 'image/x-cmu-raster', 'mime-type-image.svg', 'far file-image'),
('cmx', 'image/x-cmx', 'mime-type-image.svg', 'far file-image'),
('fh', 'image/x-freehand', 'mime-type-image.svg', 'far file-image'),
('fhc', 'image/x-freehand', 'mime-type-image.svg', 'far file-image'),
('fh4', 'image/x-freehand', 'mime-type-image.svg', 'far file-image'),
('fh5', 'image/x-freehand', 'mime-type-image.svg', 'far file-image'),
('fh7', 'image/x-freehand', 'mime-type-image.svg', 'far file-image'),
('ico', 'image/x-icon', 'mime-type-image.svg', 'far file-image'),
('pntg', 'image/x-macpaint', 'mime-type-image.svg', 'far file-image'),
('pnt', 'image/x-macpaint', 'mime-type-image.svg', 'far file-image'),
('mac', 'image/x-macpaint', 'mime-type-image.svg', 'far file-image'),
('sid', 'image/x-mrsid-image', 'mime-type-image.svg', 'far file-image'),
('pcx', 'image/x-pcx', 'mime-type-image.svg', 'far file-image'),
('pnm', 'image/x-portable-anymap', 'mime-type-image.svg', 'far file-image'),
('pbm', 'image/x-portable-bitmap', 'mime-type-image.svg', 'far file-image'),
('pgm', 'image/x-portable-graymap', 'mime-type-image.svg', 'far file-image'),
('ppm', 'image/x-portable-pixmap', 'mime-type-image.svg', 'far file-image'),
('qtif', 'image/x-quicktime', 'mime-type-image.svg', 'far file-image'),
('qti', 'image/x-quicktime', 'mime-type-image.svg', 'far file-image'),
('rgb', 'image/x-rgb', 'mime-type-image.svg', 'far file-image'),
('tga', 'image/x-tga', 'mime-type-image.svg', 'far file-image'),
('xbm', 'image/x-xbitmap', 'mime-type-image.svg', 'far file-image'),
('xpm', 'image/x-xpixmap', 'mime-type-image.svg', 'far file-image'),
('xwd', 'image/x-xwindowdump', 'mime-type-image.svg', 'far file-image'),
('eml', 'message/rfc822', '', ''),
('mime', 'message/rfc822', '', ''),
('igs', 'model/iges', '', ''),
('iges', 'model/iges', '', ''),
('msh', 'model/mesh', '', ''),
('mesh', 'model/mesh', '', ''),
('silo', 'model/mesh', '', ''),
('dae', 'model/vnd.collada+xml', '', ''),
('dwf', 'model/vnd.dwf', '', ''),
('gdl', 'model/vnd.gdl', '', ''),
('gtw', 'model/vnd.gtw', '', ''),
('mts', 'model/vnd.mts', '', ''),
('vtu', 'model/vnd.vtu', '', ''),
('wrl', 'model/vrml', '', ''),
('vrml', 'model/vrml', '', ''),
('x3db', 'model/x3d+binary', '', ''),
('x3dbz', 'model/x3d+binary', '', ''),
('x3dv', 'model/x3d+vrml', '', ''),
('x3dvz', 'model/x3d+vrml', '', ''),
('x3d', 'model/x3d+xml', '', ''),
('x3dz', 'model/x3d+xml', '', ''),
('manifest', 'text/cache-manifest', '', 'far file-alt'),
('appcache', 'text/cache-manifest', '', 'far file-alt'),
('ics', 'text/calendar', '', 'far file-alt'),
('ifb', 'text/calendar', '', 'far file-alt'),
('css', 'text/css', '', 'far file-code'),
('csv', 'text/csv', 'mime-type-spreadsheet.svg', 'far file-excel'),
('html', 'text/html', '', 'far file-code'),
('htm', 'text/html', '', 'far file-code'),
('n3', 'text/n3', '', 'far file-alt'),
('txt', 'text/plain', 'mime-type-document.svg', 'far file-alt'),
('text', 'text/plain', '', 'far file-alt'),
('conf', 'text/plain', '', 'far file-alt'),
('def', 'text/plain', '', 'far file-alt'),
('list', 'text/plain', '', 'far file-alt'),
('log', 'text/plain', '', 'far file-alt'),
('in', 'text/plain', '', 'far file-alt'),
('dsc', 'text/prs.lines.tag', '', 'far file-alt'),
('rtx', 'text/richtext', '', 'far file-alt'),
('sgml', 'text/sgml', '', 'far file-alt'),
('sgm', 'text/sgml', '', 'far file-alt'),
('tsv', 'text/tab-separated-values', '', 'far file-alt'),
('t', 'text/troff', '', 'far file-alt'),
('tr', 'text/troff', '', 'far file-alt'),
('roff', 'text/troff', '', 'far file-alt'),
('man', 'text/troff', '', 'far file-alt'),
('me', 'text/troff', '', 'far file-alt'),
('ms', 'text/troff', '', 'far file-alt'),
('ttl', 'text/turtle', '', 'far file-code'),
('uri', 'text/uri-list', '', 'far file-alt'),
('uris', 'text/uri-list', '', 'far file-alt'),
('urls', 'text/uri-list', '', 'far file-alt'),
('address-card', 'text/vcard', '', 'far file-alt'),
('curl', 'text/vnd.curl', '', 'far file-alt'),
('dcurl', 'text/vnd.curl.dcurl', '', 'far file-alt'),
('scurl', 'text/vnd.curl.scurl', '', 'far file-alt'),
('mcurl', 'text/vnd.curl.mcurl', '', 'far file-alt'),
('fly', 'text/vnd.fly', '', 'far file-alt'),
('flx', 'text/vnd.fmi.flexstor', '', 'far file-alt'),
('gv', 'text/vnd.graphviz', '', 'far file-alt'),
('3dml', 'text/vnd.in3d.3dml', '', 'far file-alt'),
('spot', 'text/vnd.in3d.spot', '', 'far file-alt'),
('jad', 'text/vnd.sun.j2me.app-descriptor', '', 'far file-alt'),
('wml', 'text/vnd.wap.wml', '', 'far file-alt'),
('wmls', 'text/vnd.wap.wmlscript', '', 'far file-alt'),
('s', 'text/x-asm', '', 'far file-alt'),
('asm', 'text/x-asm', '', 'far file-code'),
('c', 'text/x-c', '', 'far file-code'),
('far closed-captioning', 'text/x-c', '', 'far file-code'),
('cxx', 'text/x-c', '', 'far file-code'),
('cpp', 'text/x-c', '', 'far file-code'),
('h', 'text/x-c', '', 'far file-code'),
('hh', 'text/x-c', '', 'far file-code'),
('dic', 'text/x-c', '', 'far file-alt'),
('f', 'text/x-fortran', '', 'far file-code'),
('for', 'text/x-fortran', '', 'far file-code'),
('f77', 'text/x-fortran', '', 'far file-alt'),
('f90', 'text/x-fortran', '', 'far file-alt'),
('java', 'text/x-java-source', '', 'far file-code'),
('opml', 'text/x-opml', '', 'far file-alt'),
('p', 'text/x-pascal', '', 'far file-alt'),
('pas', 'text/x-pascal', '', 'far file-code'),
('php', 'application/x-httpd-php', '', 'far file-code'),
('coffee', 'text/x-coffeescript', '', 'far file-code'),
('lsp', 'text/x-common-lisp', '', 'far file-code'),
('lisp', 'text/x-common-lisp', '', 'far file-code'),
('diff', 'text/x-diff', '', 'far file-code'),
('go', 'text/x-go', '', 'far file-code'),
('lua', 'text/x-lua', '', 'far file-code'),
('pl', 'text/x-perl', '', 'far file-code'),
('prl', 'text/x-perl', '', 'far file-code'),
('perl', 'text/x-perl', '', 'far file-code'),
('py', 'text/x-python', '', 'far file-code'),
('nginx', 'text/nginx', '', 'far file-code'),
('ini', 'text/x-ini', '', 'far file-alt'),
('rb', 'text/x-ruby', '', 'far file-code'),
('sass', 'text/x-sass', '', 'far file-code'),
('bash', 'text/x-sh', '', 'far file-code'),
('swift', 'text/x-swift', '', 'far file-code'),
('vb', 'text/x-vb', '', 'far file-code'),
('vbs', 'text/vbscript', '', 'far file-code'),
('vue', 'text/x-vue', '', 'far file-code'),
('yaml', 'text/x-yaml', '', 'far file-alt'),
('md', 'text/x-markdown', '', 'far file-alt'),
('xq', 'application/xquery', '', 'far file-code'),
('xquery', 'application/xquery', '', 'far file-code'),
('ps1', 'application/x-powershell', '', 'far file-code'),
('aps', 'application/x-aspx', '', ''),
('jsp', 'application/x-jsp', '', 'far file-code'),
('nfo', 'text/x-nfo', '', 'far file-alt'),
('etx', 'text/x-setext', '', 'far file-alt'),
('sfv', 'text/x-sfv', '', 'far file-alt'),
('uu', 'text/x-uuencode', '', 'far file-alt'),
('vcs', 'text/x-vcalendar', '', 'far file-alt'),
('vcf', 'text/x-vcard', '', 'far file-alt'),
('3gp', 'video/3gpp', 'mime-type-video.svg', 'far file-video'),
('3g2', 'video/3gpp2', 'mime-type-video.svg', 'far file-video'),
('h261', 'video/h261', 'mime-type-video.svg', 'far file-video'),
('h263', 'video/h263', 'mime-type-video.svg', 'far file-video'),
('h264', 'video/h264', 'mime-type-video.svg', 'far file-video'),
('jpgv', 'video/jpeg', 'mime-type-video.svg', 'far file-video'),
('jpm', 'video/jpm', 'mime-type-video.svg', 'far file-video'),
('jpgm', 'video/jpm', 'mime-type-video.svg', 'far file-video'),
('mj2', 'video/mj2', 'mime-type-video.svg', 'far file-video'),
('mjp2', 'video/mj2', 'mime-type-video.svg', 'far file-video'),
('ts', 'video/mp2t', 'mime-type-video.svg', 'far file-video'),
('mp4', 'video/mp4', 'mime-type-video.svg', 'far file-video'),
('mp4v', 'video/mp4', 'mime-type-video.svg', 'far file-video'),
('mpg4', 'video/mp4', 'mime-type-video.svg', 'far file-video'),
('m4v', 'video/mp4', 'mime-type-video.svg', 'far file-video'),
('mpeg', 'video/mpeg', 'mime-type-video.svg', 'far file-video'),
('mpg', 'video/mpeg', 'mime-type-video.svg', 'far file-video'),
('mpe', 'video/mpeg', 'mime-type-video.svg', 'far file-video'),
('m1v', 'video/mpeg', 'mime-type-video.svg', 'far file-video'),
('m2v', 'video/mpeg', 'mime-type-video.svg', 'far file-video'),
('ogv', 'video/ogg', 'mime-type-video.svg', 'far file-video'),
('qt', 'video/quicktime', 'mime-type-video.svg', 'far file-video'),
('mov', 'video/quicktime', 'mime-type-video.svg', 'far file-video'),
('uvh', 'video/vnd.dece.hd', 'mime-type-video.svg', 'far file-video'),
('uvvh', 'video/vnd.dece.hd', 'mime-type-video.svg', 'far file-video'),
('uvm', 'video/vnd.dece.mobile', 'mime-type-video.svg', 'far file-video'),
('uvvm', 'video/vnd.dece.mobile', 'mime-type-video.svg', 'far file-video'),
('uvp', 'video/vnd.dece.pd', 'mime-type-video.svg', 'far file-video'),
('uvvp', 'video/vnd.dece.pd', 'mime-type-video.svg', 'far file-video');
INSERT INTO `sys_storage_mime_types` (`ext`, `mime_type`, `icon`, `icon_font`) VALUES
('uvs', 'video/vnd.dece.sd', 'mime-type-video.svg', 'far file-video'),
('uvvs', 'video/vnd.dece.sd', 'mime-type-video.svg', 'far file-video'),
('uvv', 'video/vnd.dece.video', 'mime-type-video.svg', 'far file-video'),
('uvvv', 'video/vnd.dece.video', 'mime-type-video.svg', 'far file-video'),
('dvb', 'video/vnd.dvb.file', 'mime-type-video.svg', 'far file-video'),
('fvt', 'video/vnd.fvt', 'mime-type-video.svg', 'far file-video'),
('mxu', 'video/vnd.mpegurl', 'mime-type-video.svg', 'far file-video'),
('m4u', 'video/vnd.mpegurl', 'mime-type-video.svg', 'far file-video'),
('pyv', 'video/vnd.ms-playready.media.pyv', 'mime-type-video.svg', 'far file-video'),
('uvu', 'video/vnd.uvvu.mp4', 'mime-type-video.svg', 'far file-video'),
('uvvu', 'video/vnd.uvvu.mp4', 'mime-type-video.svg', 'far file-video'),
('viv', 'video/vnd.vivo', 'mime-type-video.svg', 'far file-video'),
('dv', 'video/x-dv', 'mime-type-video.svg', 'far file-video'),
('dif', 'video/x-dv', 'mime-type-video.svg', 'far file-excel'),
('webm', 'video/webm', 'mime-type-video.svg', 'far file-video'),
('f4v', 'video/x-f4v', 'mime-type-video.svg', 'far file-video'),
('fli', 'video/x-fli', 'mime-type-video.svg', 'far file-video'),
('flv', 'video/x-flv', 'mime-type-video.svg', 'far file-video'),
('mkv', 'video/x-matroska', 'mime-type-video.svg', 'far file-video'),
('mk3d', 'video/x-matroska', 'mime-type-video.svg', 'far file-video'),
('mks', 'video/x-matroska', 'mime-type-video.svg', 'far file-video'),
('mng', 'video/x-mng', 'mime-type-video.svg', 'far file-video'),
('asf', 'video/x-ms-asf', 'mime-type-video.svg', 'far file-video'),
('asx', 'video/x-ms-asf', 'mime-type-video.svg', 'far file-video'),
('vob', 'video/x-ms-vob', 'mime-type-video.svg', 'far file-video'),
('wm', 'video/x-ms-wm', 'mime-type-video.svg', 'far file-video'),
('wmv', 'video/x-ms-wmv', 'mime-type-video.svg', 'far file-video'),
('wmx', 'video/x-ms-wmx', 'mime-type-video.svg', 'far file-video'),
('wvx', 'video/x-ms-wvx', 'mime-type-video.svg', 'far file-video'),
('avi', 'video/x-msvideo', 'mime-type-video.svg', 'far file-video'),
('movie', 'video/x-sgi-movie', 'mime-type-video.svg', 'far file-video'),
('smv', 'video/x-smv', 'mime-type-video.svg', 'far file-video'),
('ice', 'x-conference/x-cooltalk', '', '');


-- --------------------------------------------------------


CREATE TABLE IF NOT EXISTS `sys_objects_uploader` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object` varchar(64) NOT NULL,
  `active` tinyint(4) NOT NULL,
  `override_class_name` varchar(255) NOT NULL,
  `override_class_file` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `object` (`object`)
);

INSERT INTO `sys_objects_uploader` (`object`, `active`, `override_class_name`, `override_class_file`) VALUES
('sys_html5', 1, 'BxTemplUploaderHTML5', ''),
('sys_video_recording', 1, 'BxTemplUploaderVideoRecording', ''),
('sys_crop', 1, 'BxTemplUploaderCrop', ''),
('sys_cmts_html5', 1, 'BxTemplCmtsUploaderHTML5', ''),
('sys_settings_html5', 1, 'BxTemplStudioSettingsUploaderHTML5', ''),
('sys_builder_page_html5', 1, 'BxTemplStudioBuilderPageUploaderHTML5', ''),
('sys_std_crop_cover', 1, 'BxTemplStudioUploaderCropCover', '');


-- --------------------------------------------------------


CREATE TABLE IF NOT EXISTS `sys_objects_form` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object` varchar(64) NOT NULL,
  `module` varchar(32) NOT NULL,
  `title` varchar(255) NOT NULL,
  `action` varchar(255) NOT NULL,
  `form_attrs` text NOT NULL,
  `submit_name` varchar(255) NOT NULL,
  `table` varchar(255) NOT NULL,
  `key` varchar(255) NOT NULL,
  `uri` varchar(255) NOT NULL,
  `uri_title` varchar(255) NOT NULL,
  `params` text NOT NULL,
  `deletable` tinyint(4) NOT NULL DEFAULT '1',
  `active` tinyint(4) NOT NULL DEFAULT '0',
  `parent_form`  varchar(64) NOT NULL DEFAULT '',
  `override_class_name` varchar(255) NOT NULL,
  `override_class_file` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `object` (`object`)
);

INSERT INTO `sys_objects_form` (`object`, `module`, `title`, `action`, `form_attrs`, `submit_name`, `table`, `key`, `uri`, `uri_title`, `params`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES
('sys_login', 'system', '_sys_form_login', 'member.php', 'a:3:{s:2:"id";s:14:"sys-form-login";s:6:"action";s:10:"member.php";s:8:"onsubmit";s:31:"return validateLoginForm(this);";}', 'a:3:{i:0;s:4:"role";i:1;s:10:"do_sendsms";i:2;s:12:"do_checkcode";}', '', '', '', '', 'a:1:{s:14:"checker_helper";s:24:"BxFormLoginCheckerHelper";}', 0, 1, 'BxTemplFormLogin', ''),
('sys_account', 'system', '_sys_form_account', '', '', 'a:2:{i:0;s:10:"do_publish";i:1;s:9:"do_submit";}', 'sys_accounts', 'id', '', '', 'a:1:{s:14:"checker_helper";s:26:"BxFormAccountCheckerHelper";}', 0, 1, 'BxTemplFormAccount', ''),
('sys_profile', 'system', '_sys_form_profile', '', '', 'do_submit', 'sys_profiles', 'id', '', '', '', 0, 1, 'BxTemplFormProfile', ''),
('sys_forgot_password', 'system', '_sys_form_forgot_password', '', '', 'do_submit', '', '', '', '', 'a:1:{s:14:"checker_helper";s:33:"BxFormForgotPasswordCheckerHelper";}', 0, 1, 'BxTemplFormForgotPassword', ''),
('sys_confirm_email', 'system', '_sys_form_confirm_email', '', '', 'do_submit', '', '', '', '', 'a:1:{s:14:"checker_helper";s:31:"BxFormConfirmEmailCheckerHelper";}', 0, 1, 'BxTemplFormConfirmEmail', ''),
('sys_confirm_phone', 'system', '_sys_form_confirm_phone', '', '', 'a:2:{i:0;s:9:"do_submit";i:1;s:10:"do_sendsms";}', '', '', '', '', 'a:1:{s:14:"checker_helper";s:31:"BxFormConfirmPhoneCheckerHelper";}', 0, 1, 'BxTemplFormConfirmPhone', ''),
('sys_unsubscribe', 'system', '_sys_form_unsubscribe', '', '', 'do_submit', 'sys_accounts', 'id', '', '', '', 0, 1, 'BxTemplFormAccount', ''),
('sys_comment', 'system', '_sys_form_comment', 'cmts.php', 'a:3:{s:2:"id";s:20:"cmt-%s-form-%s-%d-%d";s:4:"name";s:20:"cmt-%s-form-%s-%d-%d";s:5:"class";s:14:"cmt-post-reply";}', 'cmt_submit', '', 'cmt_id', '', '', '', 0, 1, 'BxTemplCmtsForm', ''),
('sys_agents_comment', 'system', '_sys_form_agents_comment', 'cmts.php', 'a:3:{s:2:"id";s:20:"cmt-%s-form-%s-%d-%d";s:4:"name";s:20:"cmt-%s-form-%s-%d-%d";s:5:"class";s:14:"cmt-post-reply";}', 'cmt_submit', '', 'cmt_id', '', '', '', 0, 1, 'BxTemplCmtsForm', ''),
('sys_review', 'system', '_sys_form_review', 'cmts.php', 'a:3:{s:2:"id";s:20:"cmt-%s-form-%s-%d-%d";s:4:"name";s:20:"cmt-%s-form-%s-%d-%d";s:5:"class";s:14:"cmt-post-reply";}', 'cmt_submit', '', 'cmt_id', '', '', '', 0, 1, 'BxTemplCmtsReviewsForm', ''),
('sys_report', 'system', '_sys_form_report', 'report.php', 'a:3:{s:2:"id";s:0:"";s:4:"name";s:0:"";s:5:"class";s:17:"bx-report-do-form";}', 'submit', '', 'id', '', '', '', 0, 1, '', ''),
('sys_favorite', 'system', '_sys_form_favorite', 'favorite.php', 'a:3:{s:2:"id";s:0:"";s:4:"name";s:0:"";s:5:"class";s:19:"bx-favorite-do-form";}', 'submit', '', 'id', '', '', '', 0, 1, '', ''),
('sys_privacy_group_custom', 'system', '_sys_form_ps_group_custom', 'privacy.php', '', 'do_submit', 'sys_privacy_groups_custom', 'id', '', '', '', 0, 1, 'BxTemplPrivacyFormGroupCustom', ''),
('sys_labels', 'system', '_sys_form_labels', 'label.php', '', 'do_submit', '', '', '', '', '', 0, 1, 'BxTemplLabelForm', ''),
('sys_wiki', 'system', '_sys_form_wiki', '', '', 'do_submit', 'sys_pages_wiki_blocks', 'id', '', '', '', 0, 1, 'BxTemplFormWiki', ''),
('sys_manage', 'system', '_sys_form_manage', '', '', 'a:2:{i:0;s:7:"do_send";i:1;s:9:"do_submit";}', '', '', '', '', '', 0, 1, '', ''),
('sys_acl', 'system', '_sys_form_acl', '', '', 'do_submit', '', '', '', '', '', 0, 1, '', '');

CREATE TABLE IF NOT EXISTS `sys_form_displays` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `display_name` varchar(64) NOT NULL,
  `module` varchar(32) NOT NULL,
  `object` varchar(64) NOT NULL,
  `title` varchar(255) NOT NULL,
  `view_mode` tinyint(4) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `object_display_name` (`object`,`display_name`)
);

INSERT INTO `sys_form_displays` (`display_name`, `module`, `object`, `title`, `view_mode`) VALUES
('sys_login', 'system', 'sys_login', '_sys_form_display_login', 0),
('sys_login_step2', 'system', 'sys_login', '_sys_form_display_login_step2', 0),
('sys_login_step3', 'system', 'sys_login', '_sys_form_display_login_step3', 0),
('sys_account_create', 'system', 'sys_account', '_sys_form_display_account_create', 0),
('sys_account_settings_email', 'system', 'sys_account', '_sys_form_display_account_settings_email', 0),
('sys_account_settings_pwd', 'system', 'sys_account', '_sys_form_display_account_settings_password', 0),
('sys_account_settings_info', 'system', 'sys_account', '_sys_form_display_account_settings_info', 0),
('sys_account_settings_del_account', 'system', 'sys_account', '_sys_form_display_account_settings_delete', 0),
('sys_profile_cf_set', 'system', 'sys_profile', '_sys_form_display_profile_cf_set', 0),
('sys_profile_cf_manage', 'system', 'sys_profile', '_sys_form_display_profile_cf_manage', 0),
('sys_forgot_password', 'system', 'sys_forgot_password', '_sys_form_display_forgot_password', 0),
('sys_forgot_password_reset', 'system', 'sys_forgot_password', '_sys_form_display_forgot_password_reset', 0),
('sys_confirm_phone_set_phone', 'system', 'sys_confirm_phone', '_sys_form_display_confirm_phone_set_phone', 0),
('sys_confirm_phone_confirmation', 'system', 'sys_confirm_phone', '_sys_form_display_confirm_phone_confirmation', 0),
('sys_confirm_email', 'system', 'sys_confirm_email', '_sys_form_display_confirm_email', 0),
('sys_unsubscribe_updates', 'system', 'sys_unsubscribe', '_sys_form_display_unsubscribe_updates', 0),
('sys_unsubscribe_news', 'system', 'sys_unsubscribe', '_sys_form_display_unsubscribe_news', 0),
('sys_comment_post', 'system', 'sys_comment', '_sys_form_display_comment_post', 0),
('sys_comment_edit', 'system', 'sys_comment', '_sys_form_display_comment_edit', 0),
('sys_agents_comment_post', 'system', 'sys_agents_comment', '_sys_form_display_agents_comment_post', 0),
('sys_review_post', 'system', 'sys_review', '_sys_form_review_display_post', 0),
('sys_review_edit', 'system', 'sys_review', '_sys_form_review_display_edit', 0),
('sys_report_post', 'system', 'sys_report', '_sys_form_display_report_post', 0),
('sys_favorite_add', 'system', 'sys_favorite', '_sys_form_display_favorite_add', 0),
('sys_favorite_list_edit', 'system', 'sys_favorite', '_sys_form_display_favorite_list_edit', 0),
('sys_privacy_group_custom_members', 'system', 'sys_privacy_group_custom', '_sys_form_display_ps_gc_members', 0),
('sys_privacy_group_custom_memberships', 'system', 'sys_privacy_group_custom', '_sys_form_display_ps_gc_memberships', 0),
('sys_labels_select', 'system', 'sys_labels', '_sys_form_labels_display_select', 0),
('sys_wiki_edit', 'system', 'sys_wiki', '_sys_form_display_wiki_edit', 0),
('sys_wiki_translate', 'system', 'sys_wiki', '_sys_form_display_wiki_translate', 0),
('sys_manage_approve', 'system', 'sys_manage', '_sys_form_display_manage_approve', 0),
('sys_acl_set', 'system', 'sys_acl', '_sys_form_display_acl_set', 0);


CREATE TABLE IF NOT EXISTS `sys_form_inputs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object` varchar(64) NOT NULL,
  `module` varchar(32) NOT NULL,
  `name` varchar(255) NOT NULL,
  `value` varchar(255) NOT NULL,
  `values` text NOT NULL,
  `checked` tinyint(4) NOT NULL DEFAULT '0',
  `type` varchar(32) NOT NULL,
  `caption_system` varchar(255) NOT NULL,
  `caption` varchar(255) NOT NULL,
  `info` varchar(255) NOT NULL,
  `help` varchar(255) NOT NULL,
  `area_label` varchar(255) NOT NULL DEFAULT '',
  `icon` text NOT NULL,
  `required` tinyint(4) NOT NULL DEFAULT '0',
  `unique` tinyint(4) NOT NULL DEFAULT '0',
  `collapsed` tinyint(4) NOT NULL DEFAULT '0',
  `html` tinyint(4) NOT NULL DEFAULT '0',
  `privacy` tinyint(4) NOT NULL DEFAULT '0',
  `rateable` varchar(32) NOT NULL DEFAULT '',
  `attrs` text NOT NULL,
  `attrs_tr` text NOT NULL,
  `attrs_wrapper` text NOT NULL,
  `checker_func` varchar(32) NOT NULL,
  `checker_params` text NOT NULL,
  `checker_error` varchar(255) NOT NULL,
  `db_pass` varchar(32) NOT NULL,
  `db_params` text NOT NULL,
  `editable` tinyint(4) NOT NULL DEFAULT '1',
  `deletable` tinyint(4) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `display_name` (`object`(64),`name`(127))
);

INSERT INTO `sys_form_inputs` (`object`, `module`, `name`, `value`, `values`, `checked`, `type`, `caption_system`, `caption`, `info`, `required`, `collapsed`, `html`, `attrs`, `attrs_tr`, `attrs_wrapper`, `checker_func`, `checker_params`, `checker_error`, `db_pass`, `db_params`, `editable`, `deletable`) VALUES
('sys_login', 'system', 'role', '1', '', 0, 'hidden', '_sys_form_login_input_caption_system_role', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_login', 'system', 'relocate', '', '', 0, 'hidden', '_sys_form_login_input_caption_system_relocate', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_login', 'system', 'ID', '', '', 0, 'text', '_sys_form_login_input_caption_system_id', '_sys_form_login_input_email', '', 1, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_login', 'system', 'Password', '', '', 0, 'password', '_sys_form_login_input_caption_system_password', '_sys_form_login_input_password', '', 1, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_login', 'system', 'rememberMe', '1', '', 0, 'switcher', '_sys_form_login_input_caption_system_remember_me', '_sys_form_login_input_remember_me', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('sys_login', 'system', 'login', '_sys_form_login_input_submit', '', 0, 'submit', '_sys_form_login_input_caption_system_submit', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_login', 'system', 'submit_text', '', '', 0, 'custom', '_sys_form_login_input_caption_system_submit_text', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_login', 'system', 'phone', '', '', 0, 'text', '_sys_form_login_input_caption_system_phone', '_sys_form_login_input_phone', '_sys_form_login_input_phone_info', 1, 0, 0, '', '', '', 'PhoneExist', '', '_sys_form_login_input_phone_error_format', 'Xss', '', 1, 0),
('sys_login', 'system', 'code', '', '', 0, 'text', '_sys_form_login_input_caption_system_code', '_sys_form_login_input_code', '', 1, 0, 0, '', '', '', 'CodeExist', '', '_sys_form_login_input_code_error_empty', 'Xss', '', 0, 0),
('sys_login', 'system', 'back', '', '', '', 'value', '_sys_form_login_input_caption_system_back', '_sys_form_login_input_back', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('sys_login', 'system', 'do_checkcode', '_sys_form_login_input_checkcode', '', 0, 'submit', '_sys_form_login_input_caption_system_checkcode', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_login', 'system', 'do_sendsms', '_sys_form_login_input_sendsms', '', 0, 'submit', '_sys_form_login_input_caption_system_sendsms', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),

('sys_account', 'system', 'email', '', '', 0, 'text', '_sys_form_login_input_caption_system_email', '_sys_form_account_input_email', '', 1, 0, 0, '', '', '', 'EmailUniq', '', '_sys_form_account_input_email_error', 'Xss', '', 0, 0),
('sys_account', 'system', 'phone', '', '', 0, 'text', '_sys_form_login_input_caption_system_phone', '_sys_form_login_input_phone', '_sys_form_login_input_phone_info', 1, 0, 0, '', '', '', 'PhoneExist', '', '_sys_form_login_input_phone_error_format', 'Xss', '', 1, 0),
('sys_account', 'system', 'password', '', '', 0, 'password', '_sys_form_login_input_caption_system_password', '_sys_form_account_input_password', '', 1, 0, 0, '', '', '', 'Password', 'a:1:{s:4:"preg";s:38:"~^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}~";}', '_sys_form_account_input_password_error', '', '', 0, 0),
('sys_account', 'system', 'password_confirm', '', '', 0, 'password', '_sys_form_login_input_caption_system_password_confirm', '_sys_form_account_input_password_confirm', '', 1, 0, 0, '', '', '', 'PasswordConfirm', '', '_sys_form_account_input_password_confirm_error', '', '', 0, 0),
('sys_account', 'system', 'do_submit', '_sys_form_account_input_submit', '', 0, 'submit', '_sys_form_login_input_caption_system_do_submit', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_account', 'system', 'do_publish', '_sys_form_account_input_publish', '', 0, 'submit', '_sys_form_login_input_caption_system_do_publish', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_account', 'system', 'name', '', '', 0, 'text', '_sys_form_login_input_caption_system_name', '_sys_form_account_input_name', '', 1, 0, 0, '', '', '', 'ProfileName', '', '_sys_form_account_input_name_error', 'Xss', '', 1, 0),
('sys_account', 'system', 'picture', 'a:1:{i:0;s:8:"sys_crop";}', 'a:1:{s:8:"sys_crop";s:24:"_sys_uploader_crop_title";}', 0, 'files', '_sys_form_account_input_caption_system_picture', '_sys_form_account_input_picture', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('sys_account', 'system', 'captcha', '', '', 0, 'captcha', '_sys_form_login_input_caption_system_captcha', '_sys_form_account_input_captcha', '', 1, 0, 0, '', '', '', 'Captcha', '', '_sys_form_account_input_captcha_error', '', '', 1, 0),
('sys_account', 'system', 'password_current', '', '', 0, 'password', '_sys_form_login_input_caption_system_password_current', '_sys_form_account_input_password_current', '', 1, 0, 0, '', '', '', 'PasswordCurrent', '', '_sys_form_account_input_password_current_error', '', '', 0, 0),
('sys_account', 'system', 'delete_content', '1', '', 0, 'hidden', '_sys_form_login_input_caption_system_delete_content', '', '', 1, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_account', 'system', 'delete_confirm', '1', '', 0, 'checkbox', '_sys_form_login_input_caption_system_delete_confirm', '_sys_form_account_input_delete_confirm', '_sys_form_account_input_delete_confirm_info', 1, 0, 0, '', '', '', 'Avail', '', '_sys_form_account_input_delete_confirm_error', '', '', 0, 0),
('sys_account', 'system', 'receive_updates', '1', '', 1, 'switcher', '_sys_form_login_input_caption_system_receive_updates', '_sys_form_account_input_receive_updates', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('sys_account', 'system', 'receive_news', '1', '', 1, 'switcher', '_sys_form_login_input_caption_system_receive_news', '_sys_form_account_input_receive_news', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 1, 0),
('sys_account', 'system', 'agreement', '', '', 0, 'custom', '_sys_form_login_input_caption_system_agreement', '_sys_form_account_input_agreement', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),

('sys_profile', 'system', 'cfw_value', '', '#!sys_content_filter', 0, 'checkbox_set', '_sys_form_profile_input_sys_cfw_value', '_sys_form_profile_input_cfw_value', '', 0, 0, 0, '', '', '', '', '', '', 'Set', '', 1, 0),
('sys_profile', 'system', 'cfu_items', '', '#!sys_content_filter', 0, 'checkbox_set', '_sys_form_profile_input_sys_cfu_items', '_sys_form_profile_input_cfu_items', '', 0, 0, 0, '', '', '', '', '', '', 'Set', '', 1, 0),
('sys_profile', 'system', 'cfu_locked', '1', '', 0, 'switcher', '_sys_form_profile_input_sys_cfu_locked', '_sys_form_profile_input_cfu_locked', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 1, 0),
('sys_profile', 'system', 'controls', '', 'do_submit,do_cancel', 0, 'input_set', '', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_profile', 'system', 'do_submit', '_sys_form_profile_input_do_submit', '', 0, 'submit', '_sys_form_profile_input_sys_do_submit', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_profile', 'system', 'do_cancel', '_sys_form_profile_input_do_cancel', '', 0, 'button', '_sys_form_profile_input_sys_do_cancel', '', '', 0, 0, 0, 'a:2:{s:5:"class";s:22:"bx-def-margin-sec-left";s:7:"onclick";s:45:"$(''.bx-popup-applied:visible'').dolPopupHide()";}', '', '', '', '', '', '', '', 0, 0),

('sys_forgot_password', 'system', 'key', '', '', 0, 'hidden', '_sys_form_forgot_password_input_caption_system_key', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_forgot_password', 'system', 'password', '', '', 0, 'password', '_sys_form_forgot_password_input_caption_system_password_reset', '_sys_form_forgot_password_input_caption_password_reset', '', 1, 0, 0, '', '', '', 'Preg', 'a:1:{s:4:"preg";s:38:"~^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}~";}', '_sys_form_account_input_password_error', 'Xss', '', 1, 0),
('sys_forgot_password', 'system', 'email', '', '', 0, 'text', '_sys_form_forgot_password_input_caption_system_email', '_sys_form_forgot_password_input_email', '', 1, 0, 0, '', '', '', 'EmailExistOrEmpty', '', '_sys_form_account_input_email_error', 'Xss', '', 0, 0),
('sys_forgot_password', 'system', 'phone', '', '', 0, 'text', '_sys_form_forgot_password_input_caption_system_phone', '_sys_form_forgot_password_input_phone', '', 1, 0, 0, '', '', '', 'PhoneExistOrEmpty', '', '_sys_form_account_input_phone_error', 'Xss', '', 0, 0),
('sys_forgot_password', 'system', 'captcha', '', '', 0, 'captcha', '_sys_form_login_input_caption_system_captcha', '_sys_form_account_input_captcha', '', 1, 0, 0, '', '', '', 'Captcha', '', '_sys_form_account_input_captcha_error', '', '', 1, 0),
('sys_forgot_password', 'system', 'do_submit', '_sys_form_forgot_password_input_submit', '', 0, 'submit', '_sys_form_forgot_password_input_caption_system_do_submit', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),

('sys_confirm_email', 'system', 'code', '', '', 0, 'text', '_sys_form_confirm_email_input_caption_system_code', '_sys_form_confirm_email_input_code', '', 1, 0, 0, '', '', '', 'CodeExist', '', '_sys_form_confirm_email_input_code_error', 'Xss', '', 0, 0),
('sys_confirm_email', 'system', 'do_submit', '_sys_form_confirm_email_input_submit', '', 0, 'submit', '_sys_form_confirm_email_input_caption_system_do_submit', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),

('sys_confirm_phone', 'system', 'phone', '', '', 0, 'text', '_sys_form_confirm_phone_input_caption_system_phone', '_sys_form_confirm_phone_input_phone', '_sys_form_confirm_phone_input_phone_info', 1, 0, 0, '', '', '', 'PhoneUniq', '', '_sys_form_confirm_phone_input_phone_error_format', 'Xss', '', 1, 0),
('sys_confirm_phone', 'system', 'code', '', '', 0, 'text', '_sys_form_confirm_phone_input_caption_system_code', '_sys_form_confirm_phone_confirmation_input_code', '', 1, 0, 0, '', '', '', 'CodeExist', '', '_sys_form_confirm_phone_input_code_error_empty', 'Xss', '', 0, 0),
('sys_confirm_phone', 'system', 'do_submit', '_sys_form_confirm_phone_input_submit', '', 0, 'submit', '_sys_form_confirm_phone_input_caption_system_do_submit', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_confirm_phone', 'system', 'do_sendsms', '_sys_form_confirm_phone_input_sendsms', '', 0, 'submit', '_sys_form_confirm_phone_input_caption_system_do_sendsms', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),

('sys_unsubscribe', 'system', 'id', '', '', 0, 'hidden', '_sys_form_unsubscribe_input_caption_system_id', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_unsubscribe', 'system', 'code', '', '', 0, 'hidden', '_sys_form_unsubscribe_input_caption_system_code', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_unsubscribe', 'system', 'receive_updates', '1', '', 0, 'switcher', '_sys_form_unsubscribe_input_caption_system_receive_updates', '_sys_form_unsubscribe_input_receive_updates', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('sys_unsubscribe', 'system', 'receive_news', '1', '', 0, 'switcher', '_sys_form_unsubscribe_input_caption_system_receive_news', '_sys_form_unsubscribe_input_receive_news', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('sys_unsubscribe', 'system', 'do_submit', '_sys_form_unsubscribe_input_submit', '', 0, 'submit', '_sys_form_unsubscribe_input_caption_system_do_submit', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),

('sys_comment', 'system', 'sys', '', '', 0, 'hidden', '_sys_form_comment_input_caption_system_sys', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_comment', 'system', 'id', '', '', 0, 'hidden', '_sys_form_comment_input_caption_system_id', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_comment', 'system', 'action', '', '', 0, 'hidden', '_sys_form_comment_input_caption_system_action', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_comment', 'system', 'cmt_id', '', '', 0, 'hidden', '_sys_form_comment_input_caption_system_cmt_id', '', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('sys_comment', 'system', 'cmt_parent_id', '', '', 0, 'hidden', '_sys_form_comment_input_caption_system_cmt_parent_id', '', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('sys_comment', 'system', 'cmt_text', '', '', 0, 'textarea', '_sys_form_comment_input_caption_system_cmt_text', '', '', 0, 0, 3, 'a:1:{s:12:"autocomplete";s:3:"off";}', '', '', '', '', '', 'XssHtml', '', 1, 0),
('sys_comment', 'system', 'cmt_anonymous', '', '', 0, 'switcher', '_sys_form_input_sys_anonymous', '_sys_form_input_anonymous', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('sys_comment', 'system', 'cmt_image', 'a:1:{i:0;s:14:"sys_cmts_html5";}', 'a:1:{s:14:"sys_cmts_html5";s:25:"_sys_uploader_html5_title";}', 0, 'files', '_sys_form_comment_input_caption_system_cmt_image', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('sys_comment', 'system', 'cmt_cf', '', '#!sys_content_filter', 0, 'select', '_sys_form_entry_input_sys_cf', '_sys_form_entry_input_cf', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('sys_comment', 'system', 'cmt_controls', '', 'cmt_submit,cmt_cancel', 0, 'input_set', '', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_comment', 'system', 'cmt_cancel', '_sys_form_comment_input_cancel', '', 0, 'button', '_sys_form_comment_input_caption_system_cmt_cancel', '', '', 0, 0, 0, 'a:1:{s:5:"class";s:22:"bx-def-margin-sec-left";}', '', '', '', '', '', '', '', 0, 0),
('sys_comment', 'system', 'cmt_submit', '_sys_form_comment_input_submit', '', 0, 'submit', '_sys_form_comment_input_caption_system_cmt_submit', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),

('sys_agents_comment', 'system', 'sys', '', '', 0, 'hidden', '_sys_form_agents_comment_input_caption_system_sys', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_agents_comment', 'system', 'id', '', '', 0, 'hidden', '_sys_form_agents_comment_input_caption_system_id', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_agents_comment', 'system', 'action', '', '', 0, 'hidden', '_sys_form_agents_comment_input_caption_system_action', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_agents_comment', 'system', 'cmt_parent_id', '', '', 0, 'hidden', '_sys_form_agents_comment_input_caption_system_cmt_parent_id', '', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('sys_agents_comment', 'system', 'cmt_text', '', '', 0, 'textarea', '_sys_form_agents_comment_input_caption_system_cmt_text', '', '', 1, 0, 3, 'a:1:{s:12:"autocomplete";s:3:"off";}', '', '', 'Avail', '', '_sys_form_agents_comment_input_caption_cmt_text_error', 'XssHtml', '', 1, 0),
('sys_agents_comment', 'system', 'cmt_image', 'a:1:{i:0;s:14:"sys_cmts_html5";}', 'a:1:{s:14:"sys_cmts_html5";s:25:"_sys_uploader_html5_title";}', 0, 'files', '_sys_form_agents_comment_input_caption_system_cmt_image', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('sys_agents_comment', 'system', 'cmt_submit', '_sys_form_agents_comment_input_caption_cmt_submit', '', 0, 'submit', '_sys_form_agents_comment_input_caption_system_cmt_submit', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),

('sys_review', 'system', 'sys', '', '', 0, 'hidden', '_sys_form_review_input_caption_system_sys', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_review', 'system', 'id', '', '', 0, 'hidden', '_sys_form_review_input_caption_system_id', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_review', 'system', 'action', '', '', 0, 'hidden', '_sys_form_review_input_caption_system_action', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_review', 'system', 'cmt_id', '', '', 0, 'hidden', '_sys_form_review_input_caption_system_cmt_id', '', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('sys_review', 'system', 'cmt_parent_id', '', '', 0, 'hidden', '_sys_form_review_input_caption_system_cmt_parent_id', '', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('sys_review', 'system', 'cmt_text', '', '', 0, 'textarea', '_sys_form_review_input_caption_system_cmt_text', '', '', 0, 0, 3, 'a:1:{s:12:"autocomplete";s:3:"off";}', '', '', 'Length', 'a:2:{s:3:"min";i:1;s:3:"max";i:5000;}', '_Please enter n1-n2 characters', 'XssHtml', '', 1, 0),
('sys_review', 'system', 'cmt_mood', '', '', 0, 'custom', '_sys_form_review_input_caption_system_cmt_mood', '', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 1, 0),
('sys_review', 'system', 'cmt_anonymous', '', '', 0, 'switcher', '_sys_form_input_sys_anonymous', '_sys_form_input_anonymous', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('sys_review', 'system', 'cmt_image', 'a:1:{i:0;s:14:"sys_cmts_html5";}', 'a:1:{s:14:"sys_cmts_html5";s:25:"_sys_uploader_html5_title";}', 0, 'files', '_sys_form_review_input_caption_system_cmt_image', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('sys_review', 'system', 'cmt_cf', '', '#!sys_content_filter', 0, 'select', '_sys_form_entry_input_sys_cf', '_sys_form_entry_input_cf', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('sys_review', 'system', 'cmt_submit', '_sys_form_review_input_submit', '', 0, 'submit', '_sys_form_review_input_caption_system_cmt_submit', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),

('sys_report', 'system', 'sys', '', '', 0, 'hidden', '_sys_form_report_input_caption_system_sys', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_report', 'system', 'object_id', '', '', 0, 'hidden', '_sys_form_report_input_caption_system_object_id', '', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('sys_report', 'system', 'action', '', '', 0, 'hidden', '_sys_form_report_input_caption_system_action', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_report', 'system', 'id', '', '', 0, 'hidden', '_sys_form_report_input_caption_system_id', '', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('sys_report', 'system', 'type', '', '#!sys_report_types', 0, 'select', '_sys_form_report_input_caption_system_type', '_sys_form_report_input_caption_type', '', 1, 0, 0, '', '', '', 'Avail', '', '_Please select value', 'Xss', '', 1, 0),
('sys_report', 'system', 'text', '', '', 0, 'textarea', '_sys_form_report_input_caption_system_text', '_sys_form_report_input_caption_text', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 1, 0),
('sys_report', 'system', 'submit', '_sys_form_report_input_caption_submit', '', 0, 'submit', '_sys_form_report_input_caption_system_submit', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),

('sys_favorite', 'system', 'sys', '', '', 0, 'hidden', '_sys_form_favorite_input_caption_system_sys', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_favorite', 'system', 'list_id', '', '', 0, 'hidden', '_sys_form_favorite_input_caption_system_list_id', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_favorite', 'system', 'object_id', '', '', 0, 'hidden', '_sys_form_favorite_input_caption_system_object_id', '', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('sys_favorite', 'system', 'action', '', '', 0, 'hidden', '_sys_form_favorite_input_caption_system_action', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_favorite', 'system', 'id', '', '', 0, 'hidden', '_sys_form_favorite_input_caption_system_id', '', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('sys_favorite', 'system', 'list', '', '#!sys_report_types', 0, 'checkbox_set', '_sys_form_favorite_input_caption_system_list', '_sys_form_favorite_input_caption_list', '', 1, 0, 0, '', '', '', 'Avail', '', '_Please select value', 'Xss', '', 1, 0),
('sys_favorite', 'system', 'new_list', '_sys_form_favorite_input_caption_button_new_list', '', 0, 'button', '', '', '', 0, 0, 0, 'a:1:{s:7:"onclick";s:29:"{js_object}.showNewList(this)";}', '', '', '', '', '', 'Xss', '', 1, 0),
('sys_favorite', 'system', 'title', '', '', 0, 'text', '_sys_form_favorite_input_caption_system_title', '_sys_form_favorite_input_caption_title', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('sys_favorite', 'system', 'allow_view_favorite_list_to', '', '', 0, 'custom', '_sys_form_favorite_input_caption_system_allow_view_to', '_sys_form_favorite_input_caption_allow_view_to', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 1, 0),
('sys_favorite', 'system', 'submit', '_sys_form_favorite_input_caption_submit', '', 0, 'submit', '_sys_form_favorite_input_caption_system_submit', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),

('sys_privacy_group_custom', 'system', 'profile_id', '', '', 0, 'hidden', '_sys_form_ps_gc_input_caption_system_profile_id', '', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('sys_privacy_group_custom', 'system', 'content_id', '', '', 0, 'hidden', '_sys_form_ps_gc_input_caption_system_content_id', '', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('sys_privacy_group_custom', 'system', 'object', '', '', 0, 'hidden', '_sys_form_ps_gc_input_caption_system_object', '', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('sys_privacy_group_custom', 'system', 'action', '', '', 0, 'hidden', '_sys_form_ps_gc_input_caption_system_action', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_privacy_group_custom', 'system', 'group_id', '', '', 0, 'hidden', '_sys_form_ps_gc_input_caption_system_group_id', '', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('sys_privacy_group_custom', 'system', 'search', '', '', 0, 'custom', '_sys_form_ps_gc_input_caption_system_search', '_sys_form_ps_gc_input_caption_search', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_privacy_group_custom', 'system', 'list', '', '', 0, 'custom', '_sys_form_ps_gc_input_caption_system_list', '_sys_form_ps_gc_input_caption_list', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_privacy_group_custom', 'system', 'memberships', '', '', 0, 'checkbox_set', '_sys_form_ps_gc_input_caption_system_memberships', '_sys_form_ps_gc_input_caption_memberships', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_privacy_group_custom', 'system', 'controls', '', 'do_submit,do_cancel', 0, 'input_set', '', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_privacy_group_custom', 'system', 'do_submit', '_sys_form_ps_gc_input_caption_do_submit', '', 0, 'submit', '_sys_form_ps_gc_input_caption_system_do_submit', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_privacy_group_custom', 'system', 'do_cancel', '_sys_form_ps_gc_input_caption_do_cancel', '', 0, 'button', '_sys_form_ps_gc_input_caption_system_do_cancel', '', '', 0, 0, 0, 'a:2:{s:7:"onclick";s:45:"$(''.bx-popup-applied:visible'').dolPopupHide()";s:5:"class";s:22:"bx-def-margin-sec-left";}', '', '', '', '', '', '', '', 0, 0),

('sys_labels', 'system', 'name', '', '', 0, 'hidden', '_sys_form_labels_input_caption_system_name', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_labels', 'system', 'action', '', '', 0, 'hidden', '_sys_form_labels_input_caption_system_action', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_labels', 'system', 'search', '', '', 0, 'custom', '_sys_form_labels_input_caption_system_search', '_sys_form_labels_input_caption_search', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_labels', 'system', 'list', '', '', 0, 'custom', '_sys_form_labels_input_caption_system_list', '_sys_form_labels_input_caption_list', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_labels', 'system', 'list_context', '', '', 0, 'custom', '_sys_form_labels_input_caption_system_list_context', '_sys_form_labels_input_caption_list_context', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_labels', 'system', 'controls', '', 'do_submit,do_cancel', 0, 'input_set', '', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_labels', 'system', 'do_submit', '_sys_form_labels_input_caption_do_submit', '', 0, 'submit', '_sys_form_labels_input_caption_system_do_submit', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_labels', 'system', 'do_cancel', '_sys_form_labels_input_caption_do_cancel', '', 0, 'button', '_sys_form_labels_input_caption_system_do_cancel', '', '', 0, 0, 0, 'a:2:{s:7:"onclick";s:45:"$(''.bx-popup-applied:visible'').dolPopupHide()";s:5:"class";s:22:"bx-def-margin-sec-left";}', '', '', '', '', '', '', '', 0, 0),

('sys_wiki', 'system', 'block_id', '', '', 0, 'hidden', '', '_sys_form_wiki_input_caption_block_id', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('sys_wiki', 'system', 'language', '', '', 0, 'radio_set', '', '_sys_form_wiki_input_caption_lang', '_sys_form_wiki_input_caption_lang_info', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 1, 0),
('sys_wiki', 'system', 'content_main', '', '', 0, 'custom', '', '_sys_form_wiki_input_caption_content_main', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('sys_wiki', 'system', 'content', '', '', 0, 'textarea', '', '_sys_form_wiki_input_caption_content', '_sys_form_wiki_input_caption_content_info', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 1, 0),
('sys_wiki', 'system', 'notes', '', '', 0, 'text', '', '_sys_form_wiki_input_caption_notes', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 1, 0),
('sys_wiki', 'system', 'files', 'a:1:{i:0;s:9:"sys_html5";}', 'a:1:{s:9:"sys_html5";s:25:"_sys_uploader_html5_title";}', 0, 'files', '', '_sys_form_wiki_input_caption_files', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('sys_wiki', 'system', 'do_submit', '_sys_submit', '', 0, 'submit', '_sys_form_wiki_input_caption_submit', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_wiki', 'system', 'close', '_sys_close', '', 0, 'reset', '_sys_form_wiki_input_caption_close', '', '', 0, 0, 0, 'a:2:{s:7:\"onclick\";s:46:\"$(\'.bx-popup-applied:visible\').dolPopupHide();\";s:5:\"class\";s:22:\"bx-def-margin-sec-left\";}', '', '', '', '', '', '', '', 1, 0),
('sys_wiki', 'system', 'buttons', '', 'do_submit,close', 0, 'input_set', '_sys_form_wiki_buttons', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),

('sys_manage', 'system', 'content_id', '', '', 0, 'hidden', '', '_sys_form_manage_input_sys_content_id', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('sys_manage', 'system', 'notes', '', '', 0, 'textarea', '_sys_form_manage_input_sys_notes', '_sys_form_manage_input_notes', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 1, 0),
('sys_manage', 'system', 'controls', '', 'do_send,do_submit,do_cancel', 0, 'input_set', '', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_manage', 'system', 'do_send', '_sys_form_manage_input_do_send', '', 0, 'submit', '_sys_form_manage_input_sys_do_send', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_manage', 'system', 'do_submit', '_sys_form_manage_input_do_submit', '', 0, 'submit', '_sys_form_manage_input_sys_do_submit', '', '', 0, 0, 0, 'a:1:{s:5:"class";s:22:"bx-def-margin-sec-left";}', '', '', '', '', '', '', '', 0, 0),
('sys_manage', 'system', 'do_cancel', '_sys_form_manage_input_do_cancel', '', 0, 'button', '_sys_form_manage_input_sys_do_cancel', '', '', 0, 0, 0, 'a:2:{s:5:"class";s:22:"bx-def-margin-sec-left";s:7:"onclick";s:45:"$(''.bx-popup-applied:visible'').dolPopupHide()";}', '', '', '', '', '', '', '', 0, 0),

('sys_acl', 'system', 'profile_id', '', '', 0, 'hidden', '_sys_form_acl_input_sys_profile_id', '', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('sys_acl', 'system', 'card', '', '', 0, 'hidden', '_sys_form_acl_input_sys_card', '', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('sys_acl', 'system', 'level_id', '', '', 0, 'radio_set', '_sys_form_acl_input_sys_level_id', '_sys_form_acl_input_level_id', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 1, 0),
('sys_acl', 'system', 'duration', '', '', 0, 'text', '_sys_form_acl_input_sys_duration', '_sys_form_acl_input_duration', '_sys_form_acl_input_duration_inf', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 1, 0),
('sys_acl', 'system', 'controls', '', 'do_submit,do_cancel', 0, 'input_set', '', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_acl', 'system', 'do_submit', '_sys_form_acl_input_do_submit', '', 0, 'submit', '_sys_form_acl_input_sys_do_submit', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('sys_acl', 'system', 'do_cancel', '_sys_form_acl_input_do_cancel', '', 0, 'button', '_sys_form_acl_input_sys_do_cancel', '', '', 0, 0, 0, 'a:2:{s:5:"class";s:22:"bx-def-margin-sec-left";s:7:"onclick";s:65:"$(this).parents(''.bx-popup-applied:visible:first'').dolPopupHide()";}', '', '', '', '', '', '', '', 0, 0);




CREATE TABLE IF NOT EXISTS `sys_form_inputs_privacy` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `input_id` int(11) unsigned NOT NULL default '0',
  `author_id` int(11) unsigned NOT NULL default '0',
  `allow_view_to` varchar(16) NOT NULL DEFAULT '3',
  PRIMARY KEY (`id`),
  UNIQUE KEY `input` (`input_id`,`author_id`)
);

CREATE TABLE IF NOT EXISTS `sys_form_display_inputs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `display_name` varchar(64) NOT NULL,
  `input_name` varchar(32) NOT NULL,
  `visible_for_levels` int(11) NOT NULL DEFAULT '2147483647',
  `active` tinyint(4) NOT NULL DEFAULT '0',
  `order` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `display_input` (`display_name`,`input_name`)
);

INSERT INTO `sys_form_display_inputs` (`display_name`, `input_name`, `visible_for_levels`, `active`, `order`) VALUES
('sys_login', 'role', 2147483647, 1, 1),
('sys_login', 'relocate', 2147483647, 1, 2),
('sys_login', 'ID', 2147483647, 1, 3),
('sys_login', 'Password', 2147483647, 1, 4),
('sys_login', 'rememberMe', 2147483647, 1, 5),
('sys_login', 'submit_text', 2147483647, 1, 6),
('sys_login', 'login', 2147483647, 1, 7),

('sys_login_step2', 'phone', 2147483647, 1, 1),
('sys_login_step2', 'do_sendsms', 2147483647, 1, 2),
('sys_login_step2', 'relocate', 2147483647, 1, 3),

('sys_login_step3', 'code', 2147483647, 1, 1),
('sys_login_step3', 'do_checkcode', 2147483647, 1, 2),
('sys_login_step3', 'back', 2147483647, 1, 3),
('sys_login_step3', 'relocate', 2147483647, 1, 4),

('sys_account_create', 'name', 2147483647, 1, 1),
('sys_account_create', 'email', 2147483647, 1, 2),
('sys_account_create', 'phone', 2147483647, 0, 3),
('sys_account_create', 'password', 2147483647, 1, 4),
('sys_account_create', 'receive_news', 2147483647, 1, 5),
('sys_account_create', 'do_publish', 2147483647, 1, 6),
('sys_account_create', 'agreement', 2147483647, 0, 7),

('sys_account_settings_email', 'email', 2147483647, 1, 1),
('sys_account_settings_email', 'password_current', 2147483647, 1, 2),
('sys_account_settings_email', 'receive_updates', 2147483647, 1, 3),
('sys_account_settings_email', 'receive_news', 2147483647, 1, 4),
('sys_account_settings_email', 'do_submit', 2147483647, 1, 5),

('sys_account_settings_pwd', 'password_current', 2147483647, 1, 1),
('sys_account_settings_pwd', 'password', 2147483647, 1, 2),
('sys_account_settings_pwd', 'password_confirm', 2147483647, 1, 3),
('sys_account_settings_pwd', 'do_submit', 2147483647, 1, 4),

('sys_account_settings_del_account', 'delete_content', 2147483647, 1, 0),
('sys_account_settings_del_account', 'delete_confirm', 2147483647, 1, 1),
('sys_account_settings_del_account', 'password_current', 2147483647, 1, 2),
('sys_account_settings_del_account', 'do_submit', 2147483647, 1, 3),

('sys_account_settings_info', 'name', 2147483647, 1, 1),
('sys_account_settings_info', 'do_submit', 2147483647, 1, 2),

('sys_profile_cf_set', 'cfw_value', 2147483647, 1, 1),
('sys_profile_cf_set', 'do_submit', 2147483647, 1, 2),

('sys_profile_cf_manage', 'cfu_items', 2147483647, 1, 1),
('sys_profile_cf_manage', 'cfu_locked', 2147483647, 1, 2),
('sys_profile_cf_manage', 'controls', 2147483647, 1, 3),
('sys_profile_cf_manage', 'do_submit', 2147483647, 1, 4),
('sys_profile_cf_manage', 'do_cancel', 2147483647, 1, 5),

('sys_forgot_password', 'email', 2147483647, 1, 1),
('sys_forgot_password', 'phone', 2147483647, 1, 2),
('sys_forgot_password', 'captcha', 2147483647, 1, 3),
('sys_forgot_password', 'do_submit', 2147483647, 1, 4),

('sys_forgot_password_reset', 'key', 2147483647, 1, 1),
('sys_forgot_password_reset', 'password', 2147483647, 1, 2),
('sys_forgot_password_reset', 'captcha', 2147483647, 1, 3),
('sys_forgot_password_reset', 'do_submit', 2147483647, 1, 4),

('sys_confirm_email', 'code', 2147483647, 1, 1),
('sys_confirm_email', 'do_submit', 2147483647, 1, 2),

('sys_confirm_phone_set_phone', 'phone', 2147483647, 1, 1),
('sys_confirm_phone_set_phone', 'do_sendsms', 2147483647, 1, 2),

('sys_confirm_phone_confirmation', 'code', 2147483647, 1, 1),
('sys_confirm_phone_confirmation', 'do_submit', 2147483647, 1, 2),

('sys_unsubscribe_updates', 'id', 2147483647, 1, 1),
('sys_unsubscribe_updates', 'code', 2147483647, 1, 2),
('sys_unsubscribe_updates', 'receive_updates', 2147483647, 1, 3),
('sys_unsubscribe_updates', 'do_submit', 2147483647, 1, 4),

('sys_unsubscribe_news', 'id', 2147483647, 1, 1),
('sys_unsubscribe_news', 'code', 2147483647, 1, 2),
('sys_unsubscribe_news', 'receive_news', 2147483647, 1, 3),
('sys_unsubscribe_news', 'do_submit', 2147483647, 1, 4),

('sys_comment_post', 'sys', 2147483647, 1, 1),
('sys_comment_post', 'id', 2147483647, 1, 2),
('sys_comment_post', 'action', 2147483647, 1, 3),
('sys_comment_post', 'cmt_id', 2147483647, 0, 4),
('sys_comment_post', 'cmt_parent_id', 2147483647, 1, 5),
('sys_comment_post', 'cmt_text', 2147483647, 1, 6),
('sys_comment_post', 'cmt_cf', 2147483647, 1, 7),
('sys_comment_post', 'cmt_submit', 2147483647, 1, 8),
('sys_comment_post', 'cmt_image', 2147483647, 1, 9),

('sys_comment_edit', 'sys', 2147483647, 1, 1),
('sys_comment_edit', 'id', 2147483647, 1, 2),
('sys_comment_edit', 'action', 2147483647, 1, 3),
('sys_comment_edit', 'cmt_id', 2147483647, 1, 4),
('sys_comment_edit', 'cmt_parent_id', 2147483647, 1, 5),
('sys_comment_edit', 'cmt_text', 2147483647, 1, 6),
('sys_comment_edit', 'cmt_cf', 2147483647, 1, 7),
('sys_comment_edit', 'cmt_controls', 2147483647, 1, 8),
('sys_comment_edit', 'cmt_submit', 2147483647, 1, 9),
('sys_comment_edit', 'cmt_cancel', 2147483647, 1, 10),
('sys_comment_edit', 'cmt_image', 2147483647, 1, 11),

('sys_agents_comment_post', 'sys', 2147483647, 1, 1),
('sys_agents_comment_post', 'id', 2147483647, 1, 2),
('sys_agents_comment_post', 'action', 2147483647, 1, 3),
('sys_agents_comment_post', 'cmt_parent_id', 2147483647, 1, 4),
('sys_agents_comment_post', 'cmt_text', 2147483647, 1, 5),
('sys_agents_comment_post', 'cmt_submit', 2147483647, 1, 6),
('sys_agents_comment_post', 'cmt_image', 2147483647, 1, 7),

('sys_review_post', 'sys', 2147483647, 1, 1),
('sys_review_post', 'id', 2147483647, 1, 2),
('sys_review_post', 'action', 2147483647, 1, 3),
('sys_review_post', 'cmt_id', 2147483647, 0, 4),
('sys_review_post', 'cmt_parent_id', 2147483647, 1, 5),
('sys_review_post', 'cmt_text', 2147483647, 1, 6),
('sys_review_post', 'cmt_mood', 2147483647, 1, 7),
('sys_review_post', 'cmt_cf', 2147483647, 1, 9),
('sys_review_post', 'cmt_submit', 2147483647, 1, 10),
('sys_review_post', 'cmt_image', 2147483647, 1, 11),

('sys_review_edit', 'sys', 2147483647, 1, 1),
('sys_review_edit', 'id', 2147483647, 1, 2),
('sys_review_edit', 'action', 2147483647, 1, 3),
('sys_review_edit', 'cmt_id', 2147483647, 1, 4),
('sys_review_edit', 'cmt_parent_id', 2147483647, 1, 5),
('sys_review_edit', 'cmt_text', 2147483647, 1, 6),
('sys_review_edit', 'cmt_mood', 2147483647, 1, 7),
('sys_review_edit', 'cmt_cf', 2147483647, 1, 9),
('sys_review_edit', 'cmt_submit', 2147483647, 1, 10),
('sys_review_edit', 'cmt_image', 2147483647, 1, 11),

('sys_report_post', 'sys', 2147483647, 1, 1),
('sys_report_post', 'object_id', 2147483647, 1, 2),
('sys_report_post', 'action', 2147483647, 1, 3),
('sys_report_post', 'id', 2147483647, 0, 4),
('sys_report_post', 'type', 2147483647, 1, 5),
('sys_report_post', 'text', 2147483647, 1, 6),
('sys_report_post', 'submit', 2147483647, 1, 7),

('sys_favorite_add', 'sys', 2147483647, 1, 1),
('sys_favorite_add', 'object_id', 2147483647, 1, 2),
('sys_favorite_add', 'action', 2147483647, 1, 3),
('sys_favorite_add', 'id', 2147483647, 0, 4),
('sys_favorite_add', 'list', 2147483647, 1, 5),
('sys_favorite_add', 'new_list', 2147483647, 1, 6),
('sys_favorite_add', 'title', 2147483647, 1, 7),
('sys_favorite_add', 'allow_view_favorite_list_to', 2147483647, 1, 8),
('sys_favorite_add', 'submit', 2147483647, 1, 9),

('sys_favorite_list_edit', 'sys', 2147483647, 1, 1),
('sys_favorite_list_edit', 'list_id', 2147483647, 1, 2),
('sys_favorite_list_edit', 'object_id', 2147483647, 1, 3),
('sys_favorite_list_edit', 'action', 2147483647, 1, 4),
('sys_favorite_list_edit', 'title', 2147483647, 1, 5),
('sys_favorite_list_edit', 'allow_view_favorite_list_to', 2147483647, 1, 6),
('sys_favorite_list_edit', 'submit', 2147483647, 1, 7),

('sys_privacy_group_custom_members', 'profile_id', 2147483647, 1, 1),
('sys_privacy_group_custom_members', 'content_id', 2147483647, 1, 2),
('sys_privacy_group_custom_members', 'object', 2147483647, 1, 3),
('sys_privacy_group_custom_members', 'action', 2147483647, 1, 4),
('sys_privacy_group_custom_members', 'group_id', 2147483647, 1, 5),
('sys_privacy_group_custom_members', 'search', 2147483647, 1, 6),
('sys_privacy_group_custom_members', 'list', 2147483647, 1, 7),
('sys_privacy_group_custom_members', 'controls', 2147483647, 1, 8),
('sys_privacy_group_custom_members', 'do_submit', 2147483647, 1, 9),
('sys_privacy_group_custom_members', 'do_cancel', 2147483647, 1, 10),

('sys_privacy_group_custom_memberships', 'profile_id', 2147483647, 1, 1),
('sys_privacy_group_custom_memberships', 'content_id', 2147483647, 1, 2),
('sys_privacy_group_custom_memberships', 'object', 2147483647, 1, 3),
('sys_privacy_group_custom_memberships', 'action', 2147483647, 1, 4),
('sys_privacy_group_custom_memberships', 'group_id', 2147483647, 1, 5),
('sys_privacy_group_custom_memberships', 'memberships', 2147483647, 1, 6),
('sys_privacy_group_custom_memberships', 'controls', 2147483647, 1, 7),
('sys_privacy_group_custom_memberships', 'do_submit', 2147483647, 1, 8),
('sys_privacy_group_custom_memberships', 'do_cancel', 2147483647, 1, 9),

('sys_labels_select', 'name', 2147483647, 1, 1),
('sys_labels_select', 'action', 2147483647, 1, 2),
('sys_labels_select', 'search', 2147483647, 1, 3),
('sys_labels_select', 'list', 2147483647, 1, 4),
('sys_labels_select', 'list_context', 2147483647, 1, 5),
('sys_labels_select', 'controls', 2147483647, 1, 6),
('sys_labels_select', 'do_submit', 2147483647, 1, 7),
('sys_labels_select', 'do_cancel', 2147483647, 1, 8),

('sys_wiki_edit', 'block_id', 2147483647, 1, 1),
('sys_wiki_edit', 'language', 2147483647, 1, 2),
('sys_wiki_edit', 'content', 2147483647, 1, 3),
('sys_wiki_edit', 'files', 2147483647, 1, 4),
('sys_wiki_edit', 'notes', 2147483647, 1, 5),
('sys_wiki_edit', 'do_submit', 2147483647, 1, 6),
('sys_wiki_edit', 'close', 2147483647, 1, 7),
('sys_wiki_edit', 'buttons', 2147483647, 1, 8),

('sys_wiki_translate', 'block_id', 2147483647, 1, 1),
('sys_wiki_translate', 'content_main', 2147483647, 1, 2),
('sys_wiki_translate', 'language', 2147483647, 1, 3),
('sys_wiki_translate', 'content', 2147483647, 1, 4),
('sys_wiki_translate', 'files', 2147483647, 1, 5),
('sys_wiki_translate', 'notes', 2147483647, 1, 6),
('sys_wiki_translate', 'do_submit', 2147483647, 1, 7),
('sys_wiki_translate', 'close', 2147483647, 1, 8),
('sys_wiki_translate', 'buttons', 2147483647, 1, 9),

('sys_manage_approve', 'content_id', 2147483647, 1, 1),
('sys_manage_approve', 'notes', 2147483647, 1, 2),
('sys_manage_approve', 'controls', 2147483647, 1, 3),
('sys_manage_approve', 'do_send', 2147483647, 1, 4),
('sys_manage_approve', 'do_submit', 2147483647, 1, 5),
('sys_manage_approve', 'do_cancel', 2147483647, 1, 6),

('sys_acl_set', 'profile_id', 2147483647, 1, 1),
('sys_acl_set', 'card', 2147483647, 1, 2),
('sys_acl_set', 'level_id', 2147483647, 1, 3),
('sys_acl_set', 'duration', 2147483647, 1, 4),
('sys_acl_set', 'controls', 2147483647, 1, 5),
('sys_acl_set', 'do_submit', 2147483647, 1, 6),
('sys_acl_set', 'do_cancel', 2147483647, 1, 7);


CREATE TABLE `sys_form_fields_ids` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_form` varchar(64) NOT NULL default '',
  `module` varchar(32) NOT NULL,
  `field_name` varchar(255) NOT NULL default '',
  `content_id` int(11) NOT NULL DEFAULT '0',
  `author_id` int(10) NOT NULL DEFAULT '0',
  `nested_content_id` int(10) NOT NULL default '0',
  `rate` float NOT NULL default '0',
  `votes` int(11) NOT NULL default '0',
  `rrate` float NOT NULL DEFAULT '0',
  `rvotes` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `system_form_fields_id` (`object_form`, `content_id`, `nested_content_id`)
);

CREATE TABLE `sys_form_pre_lists` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `module` varchar(32) NOT NULL default '',
  `key` varchar(255) NOT NULL default '',
  `title` varchar(255) NOT NULL default '',
  `use_for_sets` tinyint(4) unsigned NOT NULL default '1',
  `extendable` tinyint(4) unsigned NOT NULL default '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`(191)),
  FULLTEXT KEY `ModuleAndKey` (`module`(32), `key`(159))
);

INSERT INTO `sys_form_pre_lists`(`key`, `title`, `module`, `use_for_sets`, `extendable`) VALUES
('Country', '_adm_form_txt_pre_lists_country', 'system', '0', '1'),
('Sex', '_adm_form_txt_pre_lists_sex', 'system', '1', '1'),
('Language', '_adm_form_txt_pre_lists_language', 'system', '0', '1'),
('Currency', '_adm_form_txt_pre_lists_currency', 'system', '0', '1'),
('sys_report_types', '_sys_pre_lists_report_types', 'system', '0', '0'),
('sys_vote_reactions', '_sys_pre_lists_vote_reactions', 'system', '0', '0'),
('sys_relations', '_sys_pre_lists_relations', 'system', '0', '1'),
('sys_content_filter', '_sys_pre_lists_content_filter', 'system', '1', '0'),

('sys_studio_widget_types', '_sys_pre_lists_studio_widget_types', 'system', '0', '0'),
('sys_colors', '_sys_pre_lists_colors', 'system', '0', '0');


CREATE TABLE `sys_form_pre_values` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `Key` varchar(255) NOT NULL default '',
  `Value` varchar(255) NOT NULL default '',
  `Order` int(10) unsigned NOT NULL default '0',
  `LKey` varchar(255) NOT NULL default '',
  `LKey2` varchar(255) NOT NULL default '',
  `Data` text NOT NULL default '',
  PRIMARY KEY (`id`),
  FULLTEXT KEY `KeyAndValue` (`Key`, `Value`)
);

INSERT INTO `sys_form_pre_values`(`Key`, `Value`, `Order`, `LKey`, `LKey2`) VALUES
('Country', 'AF', 1, '__Afghanistan', ''),
('Country', 'AX', 2, '__Aland_Islands', ''),
('Country', 'AL', 3, '__Albania', ''),
('Country', 'DZ', 4, '__Algeria', ''),
('Country', 'AS', 5, '__American Samoa', ''),
('Country', 'AD', 6, '__Andorra', ''),
('Country', 'AO', 7, '__Angola', ''),
('Country', 'AI', 8, '__Anguilla', ''),
('Country', 'AQ', 9, '__Antarctica', ''),
('Country', 'AG', 10, '__Antigua and Barbuda', ''),
('Country', 'AR', 11, '__Argentina', ''),
('Country', 'AM', 12, '__Armenia', ''),
('Country', 'AW', 13, '__Aruba', ''),
('Country', 'AU', 14, '__Australia', ''),
('Country', 'AT', 15, '__Austria', ''),
('Country', 'AZ', 16, '__Azerbaijan', ''),
('Country', 'BH', 17, '__Bahrain', ''),
('Country', 'BD', 18, '__Bangladesh', ''),
('Country', 'BB', 19, '__Barbados', ''),
('Country', 'BY', 20, '__Belarus', ''),
('Country', 'BE', 21, '__Belgium', ''),
('Country', 'BZ', 22, '__Belize', ''),
('Country', 'BJ', 23, '__Benin', ''),
('Country', 'BM', 24, '__Bermuda', ''),
('Country', 'BT', 25, '__Bhutan', ''),
('Country', 'BO', 26, '__Bolivia', ''),
('Country', 'BA', 27, '__Bosnia and Herzegovina', ''),
('Country', 'BW', 28, '__Botswana', ''),
('Country', 'BV', 29, '__Bouvet Island', ''),
('Country', 'BR', 30, '__Brazil', ''),
('Country', 'IO', 31, '__British Indian Ocean Territory', ''),
('Country', 'VG', 32, '__British Virgin Islands', ''),
('Country', 'BN', 33, '__Brunei Darussalam', ''),
('Country', 'BG', 34, '__Bulgaria', ''),
('Country', 'BF', 35, '__Burkina Faso', ''),
('Country', 'MM', 36, '__Burma', ''),
('Country', 'BI', 37, '__Burundi', ''),
('Country', 'KH', 38, '__Cambodia', ''),
('Country', 'CM', 39, '__Cameroon', ''),
('Country', 'CA', 40, '__Canada', ''),
('Country', 'CV', 41, '__Cape Verde', ''),
('Country', 'KY', 42, '__Cayman Islands', ''),
('Country', 'CF', 43, '__Central African Republic', ''),
('Country', 'TD', 44, '__Chad', ''),
('Country', 'CL', 45, '__Chile', ''),
('Country', 'CN', 46, '__China', ''),
('Country', 'CX', 47, '__Christmas Island', ''),
('Country', 'CC', 48, '__Cocos (Keeling) Islands', ''),
('Country', 'CO', 49, '__Colombia', ''),
('Country', 'KM', 50, '__Comoros', ''),
('Country', 'CD', 51, '__Congo, Democratic Republic of the', ''),
('Country', 'CG', 52, '__Congo, Republic of the', ''),
('Country', 'CK', 53, '__Cook Islands', ''),
('Country', 'CR', 54, '__Costa Rica', ''),
('Country', 'CI', 55, '__Cote d''Ivoire', ''),
('Country', 'HR', 56, '__Croatia', ''),
('Country', 'CU', 57, '__Cuba', ''),
('Country', 'CY', 58, '__Cyprus', ''),
('Country', 'CZ', 59, '__Czech Republic', ''),
('Country', 'DK', 60, '__Denmark', ''),
('Country', 'DJ', 61, '__Djibouti', ''),
('Country', 'DM', 62, '__Dominica', ''),
('Country', 'DO', 63, '__Dominican Republic', ''),
('Country', 'TL', 64, '__East Timor', ''),
('Country', 'EC', 65, '__Ecuador', ''),
('Country', 'EG', 66, '__Egypt', ''),
('Country', 'SV', 67, '__El Salvador', ''),
('Country', 'GQ', 68, '__Equatorial Guinea', ''),
('Country', 'ER', 69, '__Eritrea', ''),
('Country', 'EE', 70, '__Estonia', ''),
('Country', 'ET', 71, '__Ethiopia', ''),
('Country', 'FK', 72, '__Falkland Islands (Islas Malvinas)', ''),
('Country', 'FO', 73, '__Faroe Islands', ''),
('Country', 'FJ', 74, '__Fiji', ''),
('Country', 'FI', 75, '__Finland', ''),
('Country', 'FR', 76, '__France', ''),
('Country', 'GF', 77, '__French Guiana', ''),
('Country', 'PF', 78, '__French Polynesia', ''),
('Country', 'TF', 79, '__French Southern and Antarctic Lands', ''),
('Country', 'GA', 80, '__Gabon', ''),
('Country', 'GE', 81, '__Georgia', ''),
('Country', 'DE', 82, '__Germany', ''),
('Country', 'GH', 83, '__Ghana', ''),
('Country', 'GI', 84, '__Gibraltar', ''),
('Country', 'GR', 85, '__Greece', ''),
('Country', 'GL', 86, '__Greenland', ''),
('Country', 'GD', 87, '__Grenada', ''),
('Country', 'GP', 88, '__Guadeloupe', ''),
('Country', 'GU', 89, '__Guam', ''),
('Country', 'GT', 90, '__Guatemala', ''),
('Country', 'GG', 91, '__Guernsey', ''),
('Country', 'GN', 92, '__Guinea', ''),
('Country', 'GW', 93, '__Guinea-Bissau', ''),
('Country', 'GY', 94, '__Guyana', ''),
('Country', 'HT', 95, '__Haiti', ''),
('Country', 'HM', 96, '__Heard Island and McDonald Islands', ''),
('Country', 'VA', 97, '__Holy See (Vatican City)', ''),
('Country', 'HN', 98, '__Honduras', ''),
('Country', 'HK', 99, '__Hong Kong (SAR)', ''),
('Country', 'HU', 100, '__Hungary', ''),
('Country', 'IS', 101, '__Iceland', ''),
('Country', 'IN', 102, '__India', ''),
('Country', 'ID', 103, '__Indonesia', ''),
('Country', 'IR', 104, '__Iran', ''),
('Country', 'IQ', 105, '__Iraq', ''),
('Country', 'IE', 106, '__Ireland', ''),
('Country', 'IM', 107, '__Isle_of_Man', ''),
('Country', 'IL', 108, '__Israel', ''),
('Country', 'IT', 109, '__Italy', ''),
('Country', 'JM', 110, '__Jamaica', ''),
('Country', 'JP', 111, '__Japan', ''),
('Country', 'JE', 112, '__Jersey', ''),
('Country', 'JO', 113, '__Jordan', ''),
('Country', 'KZ', 114, '__Kazakhstan', ''),
('Country', 'KE', 115, '__Kenya', ''),
('Country', 'KI', 116, '__Kiribati', ''),
('Country', 'KP', 117, '__Korea, North', ''),
('Country', 'KR', 118, '__Korea, South', ''),
('Country', 'KW', 119, '__Kuwait', ''),
('Country', 'KG', 120, '__Kyrgyzstan', ''),
('Country', 'LA', 121, '__Laos', ''),
('Country', 'LV', 122, '__Latvia', ''),
('Country', 'LB', 123, '__Lebanon', ''),
('Country', 'LS', 124, '__Lesotho', ''),
('Country', 'LR', 125, '__Liberia', ''),
('Country', 'LY', 126, '__Libya', ''),
('Country', 'LI', 127, '__Liechtenstein', ''),
('Country', 'LT', 128, '__Lithuania', ''),
('Country', 'LU', 129, '__Luxembourg', ''),
('Country', 'MO', 130, '__Macao', ''),
('Country', 'MK', 131, '__Macedonia, The Former Yugoslav Republic of', ''),
('Country', 'MG', 132, '__Madagascar', ''),
('Country', 'MW', 133, '__Malawi', ''),
('Country', 'MY', 134, '__Malaysia', ''),
('Country', 'MV', 135, '__Maldives', ''),
('Country', 'ML', 136, '__Mali', ''),
('Country', 'MT', 137, '__Malta', ''),
('Country', 'MH', 138, '__Marshall Islands', ''),
('Country', 'MQ', 139, '__Martinique', ''),
('Country', 'MR', 140, '__Mauritania', ''),
('Country', 'MU', 141, '__Mauritius', ''),
('Country', 'YT', 142, '__Mayotte', ''),
('Country', 'MX', 143, '__Mexico', ''),
('Country', 'FM', 144, '__Micronesia, Federated States of', ''),
('Country', 'MD', 145, '__Moldova', ''),
('Country', 'MC', 146, '__Monaco', ''),
('Country', 'MN', 147, '__Mongolia', ''),
('Country', 'ME', 148, '__Montenegro', ''),
('Country', 'MS', 149, '__Montserrat', ''),
('Country', 'MA', 150, '__Morocco', ''),
('Country', 'MZ', 151, '__Mozambique', ''),
('Country', 'NA', 152, '__Namibia', ''),
('Country', 'NR', 153, '__Nauru', ''),
('Country', 'NP', 154, '__Nepal', ''),
('Country', 'NL', 155, '__Netherlands', ''),
('Country', 'AN', 156, '__Netherlands Antilles', ''),
('Country', 'NC', 157, '__New Caledonia', ''),
('Country', 'NZ', 158, '__New Zealand', ''),
('Country', 'NI', 159, '__Nicaragua', ''),
('Country', 'NE', 160, '__Niger', ''),
('Country', 'NG', 161, '__Nigeria', ''),
('Country', 'NU', 162, '__Niue', ''),
('Country', 'NF', 163, '__Norfolk Island', ''),
('Country', 'MP', 164, '__Northern Mariana Islands', ''),
('Country', 'NO', 165, '__Norway', ''),
('Country', 'OM', 166, '__Oman', ''),
('Country', 'PK', 167, '__Pakistan', ''),
('Country', 'PW', 168, '__Palau', ''),
('Country', 'PS', 169, '__Palestinian Territory, Occupied', ''),
('Country', 'PA', 170, '__Panama', ''),
('Country', 'PG', 171, '__Papua New Guinea', ''),
('Country', 'PY', 172, '__Paraguay', ''),
('Country', 'PE', 173, '__Peru', ''),
('Country', 'PH', 174, '__Philippines', ''),
('Country', 'PN', 175, '__Pitcairn Islands', ''),
('Country', 'PL', 176, '__Poland', ''),
('Country', 'PT', 177, '__Portugal', ''),
('Country', 'PR', 178, '__Puerto Rico', ''),
('Country', 'QA', 179, '__Qatar', ''),
('Country', 'RE', 180, '__Reunion', ''),
('Country', 'RO', 181, '__Romania', ''),
('Country', 'RU', 182, '__Russia', ''),
('Country', 'RW', 183, '__Rwanda', ''),
('Country', 'SH', 184, '__Saint Helena', ''),
('Country', 'KN', 185, '__Saint Kitts and Nevis', ''),
('Country', 'LC', 186, '__Saint Lucia', ''),
('Country', 'PM', 187, '__Saint Pierre and Miquelon', ''),
('Country', 'VC', 188, '__Saint Vincent and the Grenadines', ''),
('Country', 'BL', 189, '__Saint_Barthelemy', ''),
('Country', 'MF', 190, '__Saint_Martin_French_part', ''),
('Country', 'WS', 191, '__Samoa', ''),
('Country', 'SM', 192, '__San Marino', ''),
('Country', 'ST', 193, '__Sao Tome and Principe', ''),
('Country', 'SA', 194, '__Saudi Arabia', ''),
('Country', 'SN', 195, '__Senegal', ''),
('Country', 'RS', 196, '__Serbia', ''),
('Country', 'SC', 197, '__Seychelles', ''),
('Country', 'SL', 198, '__Sierra Leone', ''),
('Country', 'SG', 199, '__Singapore', ''),
('Country', 'SK', 200, '__Slovakia', ''),
('Country', 'SI', 201, '__Slovenia', ''),
('Country', 'SB', 202, '__Solomon Islands', ''),
('Country', 'SO', 203, '__Somalia', ''),
('Country', 'ZA', 204, '__South Africa', ''),
('Country', 'GS', 205, '__South Georgia and the South Sandwich Islands', ''),
('Country', 'ES', 206, '__Spain', ''),
('Country', 'LK', 207, '__Sri Lanka', ''),
('Country', 'SD', 208, '__Sudan', ''),
('Country', 'SR', 209, '__Suriname', ''),
('Country', 'SJ', 210, '__Svalbard', ''),
('Country', 'SZ', 211, '__Swaziland', ''),
('Country', 'SE', 212, '__Sweden', ''),
('Country', 'CH', 213, '__Switzerland', ''),
('Country', 'SY', 214, '__Syria', ''),
('Country', 'TW', 215, '__Taiwan', ''),
('Country', 'TJ', 216, '__Tajikistan', ''),
('Country', 'TZ', 217, '__Tanzania', ''),
('Country', 'TH', 218, '__Thailand', ''),
('Country', 'BS', 219, '__The Bahamas', ''),
('Country', 'GM', 220, '__The Gambia', ''),
('Country', 'TG', 221, '__Togo', ''),
('Country', 'TK', 222, '__Tokelau', ''),
('Country', 'TO', 223, '__Tonga', ''),
('Country', 'TT', 224, '__Trinidad and Tobago', ''),
('Country', 'TN', 225, '__Tunisia', ''),
('Country', 'TR', 226, '__Turkey', ''),
('Country', 'TM', 227, '__Turkmenistan', ''),
('Country', 'TC', 228, '__Turks and Caicos Islands', ''),
('Country', 'TV', 229, '__Tuvalu', ''),
('Country', 'UG', 230, '__Uganda', ''),
('Country', 'UA', 231, '__Ukraine', ''),
('Country', 'AE', 232, '__United Arab Emirates', ''),
('Country', 'GB', 233, '__United Kingdom', ''),
('Country', 'US', 234, '__United States', ''),
('Country', 'UM', 235, '__United States Minor Outlying Islands', ''),
('Country', 'UY', 236, '__Uruguay', ''),
('Country', 'UZ', 237, '__Uzbekistan', ''),
('Country', 'VU', 238, '__Vanuatu', ''),
('Country', 'VE', 239, '__Venezuela', ''),
('Country', 'VN', 240, '__Vietnam', ''),
('Country', 'VI', 241, '__Virgin Islands', ''),
('Country', 'WF', 242, '__Wallis and Futuna', ''),
('Country', 'EH', 243, '__Western Sahara', ''),
('Country', 'YE', 244, '__Yemen', ''),
('Country', 'ZM', 245, '__Zambia', ''),
('Country', 'ZW', 246, '__Zimbabwe', '');

INSERT INTO `sys_form_pre_values`(`Key`, `Value`, `Order`, `LKey`, `LKey2`) VALUES
('Sex', '', 1, '_sys_not_specified', ''),
('Sex', '1', 2, '_Male', '_LookinMale'),
('Sex', '2', 3, '_Female', '_LookinFemale');

INSERT INTO `sys_form_pre_values`(`Key`, `Value`, `Order`, `LKey`, `LKey2`) VALUES 
('Language', '1', 1, '__English', ''),
('Language', '2', 2, '__Afrikaans', ''),
('Language', '3', 3, '__Arabic', ''),
('Language', '4', 4, '__Bulgarian', ''),
('Language', '5', 5, '__Burmese', ''),
('Language', '6', 6, '__Cantonese', ''),
('Language', '7', 7, '__Croatian', ''),
('Language', '8', 8, '__Danish', ''),
('Language', '9', 9, '__Dutch', ''),
('Language', '10', 10, '__Esperanto', ''),
('Language', '11', 11, '__Estonian', ''),
('Language', '12', 12, '__Finnish', ''),
('Language', '13', 13, '__French', ''),
('Language', '14', 14, '__German', ''),
('Language', '15', 15, '__Greek', ''),
('Language', '16', 16, '__Gujrati', ''),
('Language', '17', 17, '__Hebrew', ''),
('Language', '18', 18, '__Hindi', ''),
('Language', '19', 19, '__Hungarian', ''),
('Language', '20', 20, '__Icelandic', ''),
('Language', '21', 21, '__Indian', ''),
('Language', '22', 22, '__Indonesian', ''),
('Language', '23', 23, '__Italian', ''),
('Language', '24', 24, '__Japanese', ''),
('Language', '25', 25, '__Korean', ''),
('Language', '26', 26, '__Latvian', ''),
('Language', '27', 27, '__Lithuanian', ''),
('Language', '28', 28, '__Malay', ''),
('Language', '29', 29, '__Mandarin', ''),
('Language', '30', 30, '__Marathi', ''),
('Language', '31', 31, '__Moldovian', ''),
('Language', '32', 32, '__Nepalese', ''),
('Language', '33', 33, '__Norwegian', ''),
('Language', '34', 34, '__Persian', ''),
('Language', '35', 35, '__Polish', ''),
('Language', '36', 36, '__Portuguese', ''),
('Language', '37', 37, '__Punjabi', ''),
('Language', '38', 38, '__Romanian', ''),
('Language', '39', 39, '__Russian', ''),
('Language', '40', 40, '__Serbian', ''),
('Language', '41', 41, '__Spanish', ''),
('Language', '42', 42, '__Swedish', ''),
('Language', '43', 43, '__Tagalog', ''),
('Language', '44', 44, '__Taiwanese', ''),
('Language', '45', 45, '__Tamil', ''),
('Language', '46', 46, '__Telugu', ''),
('Language', '47', 47, '__Thai', ''),
('Language', '48', 48, '__Tongan', ''),
('Language', '49', 49, '__Turkish', ''),
('Language', '50', 50, '__Ukrainian', ''),
('Language', '51', 51, '__Urdu', ''),
('Language', '52', 52, '__Vietnamese', ''),
('Language', '53', 53, '__Visayan', '');

INSERT INTO `sys_form_pre_values`(`Key`, `Value`, `Order`, `LKey`, `LKey2`, `Data`) VALUES
('Currency', 'AUD', 1, '__AUD', '', 'a:1:{s:4:"sign";s:6:"A&#36;";}'),
('Currency', 'CAD', 2, '__CAD', '', 'a:1:{s:4:"sign";s:6:"C&#36;";}'),
('Currency', 'EUR', 3, '__EUR', '', 'a:1:{s:4:"sign";s:7:"&#8364;";}'),
('Currency', 'GBP', 4, '__GBP', '', 'a:1:{s:4:"sign";s:6:"&#163;";}'),
('Currency', 'USD', 5, '__USD', '', 'a:1:{s:4:"sign";s:5:"&#36;";}'),
('Currency', 'YEN', 6, '__YEN', '', 'a:1:{s:4:"sign";s:6:"&#165;";}');

INSERT INTO `sys_form_pre_values`(`Key`, `Value`, `Order`, `LKey`, `LKey2`) VALUES
('sys_report_types', 'spam', 1, '_sys_pre_lists_report_types_spam', ''),
('sys_report_types', 'scam', 2, '_sys_pre_lists_report_types_scam', ''),
('sys_report_types', 'fraud', 3, '_sys_pre_lists_report_types_fraud', ''),
('sys_report_types', 'nude', 4, '_sys_pre_lists_report_types_nude', ''),
('sys_report_types', 'other', 5, '_sys_pre_lists_report_types_other', '');

INSERT INTO `sys_form_pre_values`(`Key`, `Value`, `Order`, `LKey`, `LKey2`, `Data`) VALUES
('sys_vote_reactions', 'like', 1, '_sys_pre_lists_vote_reactions_like', '', 'a:7:{s:3:"use";s:5:"emoji";s:5:"emoji";s:4:"👍";s:4:"icon";s:12:"fa-thumbs-up";s:5:"image";s:904:"<svg aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z" stroke-linecap="round" stroke-linejoin="round"></path></svg>";s:5:"color";s:20:"sys-colored col-gray";s:6:"weight";s:1:"1";s:7:"default";a:2:{s:5:"title";s:37:"_sys_pre_lists_vote_reactions_default";s:4:"icon";s:8:"fa-smile";}}'),
('sys_vote_reactions', 'love', 2, '_sys_pre_lists_vote_reactions_love', '', 'a:6:{s:3:"use";s:5:"emoji";s:5:"emoji";s:4:"💓";s:4:"icon";s:8:"fa-heart";s:5:"image";s:499:"<svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"></path></svg>";s:5:"color";s:20:"sys-colored col-red1";s:6:"weight";s:1:"1";}'),
('sys_vote_reactions', 'joy', 3, '_sys_pre_lists_vote_reactions_joy', '', 'a:6:{s:3:"use";s:5:"emoji";s:5:"emoji";s:4:"😆";s:4:"icon";s:15:"fa-laugh-squint";s:5:"image";s:789:"<svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path clip-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-2.625 6c-.54 0-.828.419-.936.634a1.96 1.96 0 00-.189.866c0 .298.059.605.189.866.108.215.395.634.936.634.54 0 .828-.419.936-.634.13-.26.189-.568.189-.866 0-.298-.059-.605-.189-.866-.108-.215-.395-.634-.936-.634zm4.314.634c.108-.215.395-.634.936-.634.54 0 .828.419.936.634.13.26.189.568.189.866 0 .298-.059.605-.189.866-.108.215-.395.634-.936.634-.54 0-.828-.419-.936-.634a1.96 1.96 0 01-.189-.866c0-.298.059-.605.189-.866zm2.023 6.828a.75.75 0 10-1.06-1.06 3.75 3.75 0 01-5.304 0 .75.75 0 00-1.06 1.06 5.25 5.25 0 007.424 0z" fill-rule="evenodd"></path></svg>";s:5:"color";s:20:"sys-colored col-red3";s:6:"weight";s:1:"1";}'),
('sys_vote_reactions', 'surprise', 4, '_sys_pre_lists_vote_reactions_surprise', '', 'a:6:{s:3:"use";s:5:"emoji";s:5:"emoji";s:4:"😲";s:4:"icon";s:11:"fa-surprise";s:5:"image";s:551:"<svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M9.375 3a1.875 1.875 0 000 3.75h1.875v4.5H3.375A1.875 1.875 0 011.5 9.375v-.75c0-1.036.84-1.875 1.875-1.875h3.193A3.375 3.375 0 0112 2.753a3.375 3.375 0 015.432 3.997h3.943c1.035 0 1.875.84 1.875 1.875v.75c0 1.036-.84 1.875-1.875 1.875H12.75v-4.5h1.875a1.875 1.875 0 10-1.875-1.875V6.75h-1.5V4.875C11.25 3.839 10.41 3 9.375 3zM11.25 12.75H3v6.75a2.25 2.25 0 002.25 2.25h6v-9zM12.75 12.75v9h6.75a2.25 2.25 0 002.25-2.25v-6.75h-9z"></path></svg>";s:5:"color";s:20:"sys-colored col-red3";s:6:"weight";s:1:"1";}'),
('sys_vote_reactions', 'sadness', 5, '_sys_pre_lists_vote_reactions_sadness', '', 'a:6:{s:3:"use";s:5:"emoji";s:5:"emoji";s:4:"😥";s:4:"icon";s:11:"fa-sad-tear";s:5:"image";s:736:"<svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path clip-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" fill-rule="evenodd"></path></svg>";s:5:"color";s:20:"sys-colored col-red3";s:6:"weight";s:1:"1";}'),
('sys_vote_reactions', 'anger', 6, '_sys_pre_lists_vote_reactions_anger', '', 'a:6:{s:3:"use";s:5:"emoji";s:5:"emoji";s:4:"😠";s:4:"icon";s:8:"fa-angry";s:5:"image";s:858:"<svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path clip-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-2.625 6c-.54 0-.828.419-.936.634a1.96 1.96 0 00-.189.866c0 .298.059.605.189.866.108.215.395.634.936.634.54 0 .828-.419.936-.634.13-.26.189-.568.189-.866 0-.298-.059-.605-.189-.866-.108-.215-.395-.634-.936-.634zm4.314.634c.108-.215.395-.634.936-.634.54 0 .828.419.936.634.13.26.189.568.189.866 0 .298-.059.605-.189.866-.108.215-.395.634-.936.634-.54 0-.828-.419-.936-.634a1.96 1.96 0 01-.189-.866c0-.298.059-.605.189-.866zm-4.34 7.964a.75.75 0 01-1.061-1.06 5.236 5.236 0 013.73-1.538 5.236 5.236 0 013.695 1.538.75.75 0 11-1.061 1.06 3.736 3.736 0 00-2.639-1.098 3.736 3.736 0 00-2.664 1.098z" fill-rule="evenodd"></path></svg>";s:5:"color";s:20:"sys-colored col-red3";s:6:"weight";s:1:"1";}');

INSERT INTO `sys_form_pre_values`(`Key`, `Value`, `Order`, `LKey`, `LKey2`, `Data`) VALUES
('sys_relations', '1', 1, '_sys_pre_lists_relations_husband', '', 'a:1:{i:0;s:1:"2";}'),
('sys_relations', '2', 2, '_sys_pre_lists_relations_wife', '', 'a:1:{i:0;s:1:"1";}'),
('sys_relations', '3', 3, '_sys_pre_lists_relations_father', '', 'a:2:{i:0;s:1:"5";i:1;s:1:"6";}'),
('sys_relations', '4', 4, '_sys_pre_lists_relations_mother', '', 'a:2:{i:0;s:1:"5";i:1;s:1:"6";}'),
('sys_relations', '5', 5, '_sys_pre_lists_relations_son', '', 'a:2:{i:0;s:1:"3";i:1;s:1:"4";}'),
('sys_relations', '6', 6, '_sys_pre_lists_relations_daughter', '', 'a:2:{i:0;s:1:"3";i:1;s:1:"4";}'),
('sys_relations', '7', 7, '_sys_pre_lists_relations_brother', '', 'a:2:{i:0;s:1:"7";i:1;s:1:"8";}'),
('sys_relations', '8', 8, '_sys_pre_lists_relations_sister', '', 'a:2:{i:0;s:1:"7";i:1;s:1:"8";}');

INSERT INTO `sys_form_pre_values`(`Key`, `Value`, `Order`, `LKey`, `LKey2`, `Data`) VALUES
('sys_content_filter', 1, 1, '_sys_pre_lists_content_filter_g', '', ''),
('sys_content_filter', 2, 2, '_sys_pre_lists_content_filter_pg', '', ''),
('sys_content_filter', 3, 3, '_sys_pre_lists_content_filter_pg13', '', ''),
('sys_content_filter', 4, 4, '_sys_pre_lists_content_filter_r', '', ''),
('sys_content_filter', 5, 5, '_sys_pre_lists_content_filter_x', '', '');

INSERT INTO `sys_form_pre_values`(`Key`, `Value`, `Order`, `LKey`, `LKey2`, `Data`) VALUES
('sys_studio_widget_types', '', 1, '_sys_pre_lists_studio_widget_types_library', '', 'a:1:{s:4:"icon";s:15:"lmi-library.svg";}'),
('sys_studio_widget_types', 'appearance', 2, '_sys_pre_lists_studio_widget_types_appearance', '', 'a:1:{s:4:"icon";s:18:"lmi-appearance.svg";}'),
('sys_studio_widget_types', 'structure', 3, '_sys_pre_lists_studio_widget_types_structure', '', 'a:1:{s:4:"icon";s:17:"lmi-structure.svg";}'),
('sys_studio_widget_types', 'content', 4, '_sys_pre_lists_studio_widget_types_content', '', 'a:1:{s:4:"icon";s:15:"lmi-content.svg";}'),
('sys_studio_widget_types', 'users', 5, '_sys_pre_lists_studio_widget_types_users', '', 'a:1:{s:4:"icon";s:13:"lmi-users.svg";}'),
('sys_studio_widget_types', 'configuration', 6, '_sys_pre_lists_studio_widget_types_configuration', '', 'a:1:{s:4:"icon";s:21:"lmi-configuration.svg";}'),
('sys_studio_widget_types', 'extensions', 7, '_sys_pre_lists_studio_widget_types_extensions', '', 'a:1:{s:4:"icon";s:18:"lmi-extensions.svg";}'),
('sys_studio_widget_types', 'integrations', 8, '_sys_pre_lists_studio_widget_types_integrations', '', 'a:1:{s:4:"icon";s:20:"lmi-integrations.svg";}'),
('sys_studio_widget_types', 'favorites', 9, '_sys_pre_lists_studio_widget_types_favorites', '', 'a:1:{s:4:"icon";s:17:"lmi-favorites.svg";}');


INSERT INTO `sys_form_pre_values`(`Key`, `Value`, `Order`, `LKey`, `LKey2`, `Data`) VALUES
('sys_colors', 'slate-600', 2, '_sys_pre_lists_color_slate', '', ''),
('sys_colors', 'gray-600', 3, '_sys_pre_lists_color_gray', '', ''),
('sys_colors', 'zinc-600', 4, '_sys_pre_lists_color_zinc', '', ''),
('sys_colors', 'neutral-600', 5, '_sys_pre_lists_color_neutral', '', ''),
('sys_colors', 'stone-600', 6, '_sys_pre_lists_color_stone', '', ''),
('sys_colors', 'red-600', 7, '_sys_pre_lists_color_red', '', ''),
('sys_colors', 'orange-600', 8, '_sys_pre_lists_color_orange', '', ''),
('sys_colors', 'amber-600', 9, '_sys_pre_lists_color_amber', '', ''),
('sys_colors', 'yellow-600', 10, '_sys_pre_lists_color_yellow', '', ''),
('sys_colors', 'lime-600', 11, '_sys_pre_lists_color_lime', '', ''),
('sys_colors', 'green-600', 12, '_sys_pre_lists_color_green', '', ''),
('sys_colors', 'emerald-600', 13, '_sys_pre_lists_color_emerald', '', ''),
('sys_colors', 'teal-600', 14, '_sys_pre_lists_color_teal', '', ''),
('sys_colors', 'cyan-600', 15, '_sys_pre_lists_color_cyan', '', ''),
('sys_colors', 'sky-600', 16, '_sys_pre_lists_color_sky', '', ''),
('sys_colors', 'blue-600', 17, '_sys_pre_lists_color_blue', '', ''),
('sys_colors', 'indigo-600', 18, '_sys_pre_lists_color_indigo', '', ''),
('sys_colors', 'violet-600', 19, '_sys_pre_lists_color_violet', '', ''),
('sys_colors', 'purple-600', 20, '_sys_pre_lists_color_purple', '', ''),
('sys_colors', 'fuchsia-600', 21, '_sys_pre_lists_color_fuchsia', '', ''),
('sys_colors', 'pink-600', 22, '_sys_pre_lists_color_pink', '', ''),
('sys_colors', 'rose-600', 23, '_sys_pre_lists_color_rose', '', '');


-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `sys_menu_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `template` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `visible` tinyint(4) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
);

INSERT INTO `sys_menu_templates` (`id`, `template`, `title`, `visible`) VALUES
(1, 'menu_empty.html', '_sys_menu_template_title_empty', 1),
(2, 'menu_footer.html', '_sys_menu_template_title_footer', 0),
(3, 'menu_horizontal.html', '_sys_menu_template_title_hor', 1),
(4, 'menu_vertical_lite.html', '_sys_menu_template_title_ver_lite', 1),
(5, 'menu_toolbar.html', '_sys_menu_template_title_toolbar', 0),
(6, 'menu_vertical.html', '_sys_menu_template_title_ver', 1),
(7, 'menu_floating_blocks.html', '_sys_menu_template_title_floating_blocks', 1),
(8, 'menu_main_submenu.html', '_sys_menu_template_title_main_submenu', 0),
(9, 'menu_buttons_hor.html', '_sys_menu_template_title_buttons_hor', 1),
(10, 'menu_inline.html', '_sys_menu_template_title_inline', 1),
(11, 'menu_interactive_vertical.html', '_sys_menu_template_title_interactive_vertical', 0),
(12, 'menu_account_popup.html', '_sys_menu_template_title_account_popup', 0),
(13, 'menu_account_notifications.html', '_sys_menu_template_title_account_notifications', 0),
(14, 'menu_floating_blocks_big.html', '_sys_menu_template_title_floating_blocks_big', 1),
(15, 'menu_custom_hor.html', '_sys_menu_template_title_custom_hor', 0),
(16, 'menu_buttons_ver.html', '_sys_menu_template_title_buttons_ver', 1),
(17, 'menu_inline_sbtn.html', '_sys_menu_template_title_inline_sbtn', 1),
(18, 'menu_main_submenu_more_auto.html', '_sys_menu_template_title_main_submenu_more_auto', 0),
(19, 'menu_floating_blocks_wide.html', '_sys_menu_template_title_floating_blocks_wide', 0),
(20, 'menu_custom_ver.html', '_sys_menu_template_title_custom_ver', 0),
(21, 'menu_vertical_more_less.html', '_sys_menu_template_title_vertical_more_less', 0),
(22, 'menu_interactive.html', '_sys_menu_template_title_interactive', 0),
(23, 'menu_buttons_icon_hor.html', '_sys_menu_template_title_buttons_icon_hor', 1),
(24, 'menu_floating_blocks_dash.html', '_sys_menu_template_title_floating_blocks_dash', 0),
(25, 'menu_block_submenu_hor.html', '_sys_menu_template_title_block_submenu_hor', 1),
(26, 'menu_block_submenu_ver.html', '_sys_menu_template_title_block_submenu_ver', 1),
(27, 'menu_profile_followings.html', '_sys_menu_template_title_profile_followings', 0),
(28, 'menu_main.html', '_sys_menu_template_title_main', 0),
(29, 'menu_add_content.html', '_sys_menu_template_title_add_content', 0),
(30, 'menu_panel.html', '_sys_menu_template_title_panel', 0),
(31, 'menu_main_in_panel.html', '_sys_menu_template_title_main_in_panel', 0),
(32, 'menu_multilevel.html', '_sys_menu_template_title_multilevel', 1),
(33, 'menu_toolbar_left.html', '_sys_menu_template_title_toolbar_left', 0),
(34, 'menu_toolbar_right.html', '_sys_menu_template_title_toolbar_right', 0);

CREATE TABLE IF NOT EXISTS `sys_objects_menu` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object` varchar(64) NOT NULL,
  `title` varchar(255) NOT NULL,
  `title_public` varchar(255) NOT NULL,
  `set_name` varchar(64) NOT NULL,
  `module` varchar(32) NOT NULL,
  `template_id` int(11) NOT NULL,
  `config_api` text NOT NULL,
  `persistent` tinyint(4) NOT NULL DEFAULT '0',
  `cache` enum('off','guest','global','per_user','per_acl') NOT NULL DEFAULT 'off',
  `deletable` tinyint(4) NOT NULL DEFAULT '1',
  `active` tinyint(4) NOT NULL DEFAULT '0',
  `override_class_name` varchar(255) NOT NULL,
  `override_class_file` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `object` (`object`)
);

INSERT INTO `sys_objects_menu` (`object`, `title`, `title_public`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES
('sys_site', '_sys_menu_title_main', '', 'sys_site', 'system', 28, 0, 1, 'BxTemplMenuSite', ''),
('sys_site_in_panel', '_sys_menu_title_main_in_panel', '', 'sys_site', 'system', 31, 0, 1, 'BxTemplMenuSite', ''),
('sys_application', '_sys_menu_title_application', '', 'sys_application', 'system', 28, 0, 1, 'BxTemplMenuSite', ''),
('sys_homepage', '_sys_menu_title_homepage', '', 'sys_homepage', 'system', 7, 0, 1, 'BxTemplMenuHomepage', ''),
('sys_homepage_submenu', '_sys_menu_title_homepage_submenu', '_sys_menu_title_public_homepage_submenu', 'sys_homepage_submenu', 'system', 8, 0, 1, '', ''),
('sys_site_submenu', '_sys_menu_title_submenu', '', 'sys_site', 'system', 1, 0, 1, 'BxTemplMenuSubmenu', ''),
('sys_site_manage', '_sys_menu_title_manage', '', '', 'system', 1, 0, 1, 'BxTemplMenuManage', ''),
('sys_site_panel', '_sys_menu_title_panel', '', 'sys_site_panel', 'system', 30, 0, 1, 'BxTemplMenuPanel', ''),
('sys_footer', '_sys_menu_title_footer', '', 'sys_footer', 'system', 2, 0, 1, 'BxTemplMenuFooter', ''),
('sys_toolbar_site', '_sys_menu_title_toolbar_site', '', 'sys_toolbar_site', 'system', 33, 0, 1, 'BxTemplMenuToolbar', ''),
('sys_toolbar_member', '_sys_menu_title_toolbar_member', '', 'sys_toolbar_member', 'system', 34, 0, 1, 'BxTemplMenuToolbar', ''),
('sys_add_content', '_sys_menu_title_add_content', '', 'sys_add_content_links', 'system', 29, 0, 1, 'BxTemplMenuSite', ''),
('sys_add_profile', '_sys_menu_title_add_profile', '', 'sys_add_profile_links', 'system', 14, 0, 1, 'BxTemplMenuProfileAdd', ''),
('sys_add_profile_vertical', '_sys_menu_title_add_profile_vertical', '', 'sys_add_profile_links', 'system', 6, 0, 1, 'BxTemplMenuProfileAdd', ''),
('sys_account_dashboard', '_sys_menu_title_account_dashboard', '_sys_menu_title_public_account_dashboard', 'sys_account_dashboard', 'system', 8, 0, 1, 'BxTemplMenuAccountDashboard', ''),
('sys_account_dashboard_manage_tools', '_sys_menu_title_account_dashboard_manage_tools', '', 'sys_account_dashboard_manage_tools', 'system', 24, 0, 1, 'BxTemplMenuDashboardManageTools', ''),
('sys_account_settings_submenu', '_sys_menu_title_account_settings', '_sys_menu_title_public_account_settings', 'sys_account_settings', 'system', 8, 0, 1, '', ''),
('sys_profiles_create', '_sys_menu_title_profiles_create', '', 'sys_profiles_create', 'system', 4, 0, 1, '', ''),
('sys_cmts_item_manage', '_sys_menu_title_cmts_item_manage', '', 'sys_cmts_item_manage', 'system', 20, 0, 1, 'BxTemplCmtsMenuManage', ''),
('sys_cmts_item_actions', '_sys_menu_title_cmts_item_actions', '', 'sys_cmts_item_actions', 'system', 15, 0, 1, 'BxTemplCmtsMenuActions', ''),
('sys_cmts_item_counters', '_sys_menu_title_cmts_item_counters', '', 'sys_cmts_item_counters', 'system', 15, 0, 1, 'BxTemplCmtsMenuActions', ''),
('sys_cmts_item_meta', '_sys_menu_title_cmts_item_meta', '', 'sys_cmts_item_meta', 'system', 15, 0, 1, 'BxTemplCmtsMenuUnitMeta', ''),
('sys_account_popup', '_sys_menu_title_account_popup', '', 'sys_account_popup', 'system', 12, 0, 1, 'BxTemplMenuAccountPopup', ''),
('sys_account_notifications', '_sys_menu_title_account_notifications', '', 'sys_account_notifications', 'system', 19, 0, 1, 'BxTemplMenuAccountNotifications', ''),
('sys_profile_stats', '_sys_menu_title_profile_stats', '', 'sys_profile_stats', 'system', 21, 0, 1, 'BxTemplMenuProfileStats', ''),
('sys_tags_cloud', '_sys_menu_title_tags_cloud', '', '', 'system', 21, 0, 1, 'BxTemplMenuTagsCloud', ''),
('sys_profile_followings', '_sys_menu_title_profile_followings', '', 'sys_profile_followings', 'system', 27, 0, 1, 'BxTemplMenuProfileFollowings', ''),
('sys_switch_language_popup', '_sys_menu_title_switch_language_popup', '', 'sys_switch_language', 'system', 6, 0, 1, 'BxTemplMenuSwitchLanguage', ''),
('sys_switch_language_inline', '_sys_menu_title_switch_language_inline', '', 'sys_switch_language', 'system', 3, 0, 1, 'BxTemplMenuSwitchLanguage', ''),
('sys_switch_template', '_sys_menu_title_switch_template', '', 'sys_switch_template', 'system', 6, 0, 1, 'BxTemplMenuSwitchTemplate', ''),
('sys_set_acl_level', '_sys_menu_title_set_acl_level', '', '', 'system', 6, 0, 1, 'BxTemplMenuSetAclLevel', ''),
('sys_set_badges', '_sys_menu_title_set_badges', '', '', 'system', 6, 0, 1, 'BxTemplMenuSetBadges', ''),
('sys_social_sharing', '_sys_menu_title_social_sharing', '', 'sys_social_sharing', 'system', 23, 0, 1, 'BxTemplMenuSocialSharing', ''),
('sys_create_post', '_sys_menu_title_create_post', '', 'sys_create_post', 'system', 15, 0, 1, 'BxTemplMenuCreatePost', ''),
('sys_dashboard_content', '_sys_menu_title_dashboard_content_manage', '', 'sys_dashboard_content_manage', 'system', 15, 0, 1, 'BxTemplMenuDashboardContentManage', ''),
('sys_dashboard_reports', '_sys_menu_title_dashboard_reports_manage', '', 'sys_dashboard_reports_manage', 'system', 15, 0, 1, 'BxTemplMenuDashboardReportsManage', ''),
('sys_add_relation', '_sys_menu_title_add_relation', '', '', 'system', 6, 0, 1, 'BxTemplMenuAddRelation', ''),
('sys_vote_reactions_do', '_sys_menu_title_vote_reactions_do', '', '', 'system', 3, 0, 1, 'BxTemplVoteReactionsMenuDo', ''),
('sys_wiki', '_sys_menu_title_wiki', '', 'sys_wiki', 'system', 6, 0, 1, 'BxTemplMenuWiki', ''),
('sys_favorite_list', '_sys_menu_title_favorite_list', '', 'sys_favorite_list', 'system', 9, 0, 1, '', ''),
('sys_con_submenu', '_sys_menu_title_con_submenu', '_sys_menu_title_public_con_submenu', 'sys_con_submenu', 'system', 8, 0, 1, 'BxTemplMenuSubmenuWithAddons', ''),
('sys_ntfs_submenu', '_sys_menu_title_ntfs_submenu', '_sys_menu_title_public_ntfs_submenu', 'sys_ntfs_submenu', 'system', 8, 0, 1, 'BxTemplMenuSubmenuWithAddons', ''),

('sys_studio_account_popup', '_sys_menu_title_studio_account_popup', '', 'sys_studio_account_popup', 'system', 4, 0, 1, 'BxTemplStudioMenuAccountPopup', '');

UPDATE `sys_objects_menu` SET `cache` = 'per_acl' WHERE `object` IN('sys_site', 'sys_account_notifications', 'sys_add_content', 'sys_toolbar_site', 'sys_footer', 'sys_site_submenu', 'sys_homepage_submenu', 'sys_homepage', 'sys_application', 'sys_site_in_panel');
UPDATE `sys_objects_menu` SET `cache` = 'per_user' WHERE `object` IN('sys_toolbar_member', 'sys_profile_stats');

CREATE TABLE IF NOT EXISTS `sys_menu_sets` (
  `set_name` varchar(64) NOT NULL,
  `module` varchar(32) NOT NULL,
  `title` varchar(255) NOT NULL,
  `deletable` tinyint(4) NOT NULL DEFAULT '1',
  PRIMARY KEY (`set_name`)
);

INSERT INTO `sys_menu_sets` (`set_name`, `module`, `title`, `deletable`) VALUES
('sys_site', 'system', '_sys_menu_set_title_site', 0),
('sys_application', 'system', '_sys_menu_set_title_application', 0),
('sys_homepage', 'system', '_sys_menu_set_title_homepage', 0),
('sys_homepage_submenu', 'system', '_sys_menu_set_title_homepage_submenu', 0),
('sys_site_panel', 'system', '_sys_menu_set_title_panel', 0),
('sys_footer', 'system', '_sys_menu_set_title_footer', 0),
('sys_toolbar_site', 'system', '_sys_menu_set_title_toolbar_site', 0),
('sys_toolbar_member', 'system', '_sys_menu_set_title_toolbar_member', 0),
('sys_account_popup', 'system', '_sys_menu_set_title_account_popup', 0),
('sys_account_notifications', 'system', '_sys_menu_set_title_account_notifications', 0),
('sys_add_content_links', 'system', '_sys_menu_set_title_add_content', 0),
('sys_create_post', 'system', '_sys_menu_set_title_create_post', 0),
('sys_dashboard_content_manage', 'system', '_sys_menu_set_title_dashboard_content_manage', 0),
('sys_dashboard_reports_manage', 'system', '_sys_menu_set_title_dashboard_reports_manage', 0),
('sys_add_profile_links', 'system', '_sys_menu_set_title_add_profile', 0),
('sys_account_dashboard', 'system', '_sys_menu_set_title_account_dashboard', 0),
('sys_account_dashboard_manage_tools', 'system', '_sys_menu_set_title_account_dashboard_manage_tools', 0),
('sys_account_settings', 'system', '_sys_menu_set_title_account_settings', 0),
('sys_profiles_create', 'system', '_sys_menu_set_title_profile_create_links', 0),
('sys_profile_stats', 'system', '_sys_menu_set_title_profile_stats', 0),
('sys_profile_followings', 'system', '_sys_menu_set_title_profile_followings', 0),
('sys_cmts_item_manage', 'system', '_sys_menu_set_title_cmts_item_manage', 0),
('sys_cmts_item_actions', 'system', '_sys_menu_set_title_cmts_item_actions', 0),
('sys_cmts_item_counters', 'system', '_sys_menu_set_title_cmts_item_counters', 0),
('sys_cmts_item_meta', 'system', '_sys_menu_set_title_cmts_item_meta', 0),
('sys_switch_language', 'system', '_sys_menu_set_title_switch_language', 0),
('sys_switch_template', 'system', '_sys_menu_set_title_switch_template', 0),
('sys_social_sharing', 'system', '_sys_menu_set_title_sys_social_sharing', 0),
('sys_wiki', 'system', '_sys_menu_set_title_sys_wiki', 0),
('sys_favorite_list', 'system', '_sys_menu_set_title_sys_favorite_list', 0),
('sys_con_submenu', 'system', '_sys_menu_set_title_con_submenu', 0),
('sys_ntfs_submenu', 'system', '_sys_menu_set_title_ntfs_submenu', 0),

('sys_studio_account_popup', 'system', '_sys_menu_set_title_studio_account_popup', 0);

CREATE TABLE IF NOT EXISTS `sys_menu_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `parent_id` int(11) NOT NULL DEFAULT '0',
  `set_name` varchar(64) NOT NULL,
  `module` varchar(32) NOT NULL,
  `name` varchar(255) NOT NULL,
  `title_system` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `title_attr` varchar(255) NOT NULL DEFAULT '',
  `info` varchar(255) NOT NULL DEFAULT '',
  `link` varchar(512) NOT NULL,
  `onclick` varchar(255) NOT NULL,
  `target` varchar(255) NOT NULL,
  `area_label` varchar(255) NOT NULL DEFAULT '',
  `icon` text NOT NULL,
  `icon_only` tinyint(4) NOT NULL DEFAULT '0',
  `addon` text NOT NULL,
  `addon_cache` tinyint(4) NOT NULL DEFAULT '0',
  `markers` text NOT NULL,
  `submenu_object` varchar(64) NOT NULL,
  `submenu_popup` tinyint(4) NOT NULL DEFAULT '0',
  `visible_for_levels` int(11) NOT NULL DEFAULT '2147483647',
  `visibility_custom` text NOT NULL,
  `hidden_on` varchar(255) NOT NULL DEFAULT '',
  `hidden_on_cxt` varchar(255) NOT NULL DEFAULT '',
  `hidden_on_pt` int(11) NOT NULL DEFAULT '0',
  `hidden_on_col` int(11) NOT NULL DEFAULT '0',
  `config_api` text NOT NULL,
  `primary` tinyint(4) NOT NULL DEFAULT '0',
  `collapsed` tinyint(4) NOT NULL DEFAULT '0',
  `persistent` tinyint(4) NOT NULL DEFAULT '0',
  `active` tinyint(4) NOT NULL DEFAULT '1',
  `active_api` tinyint(4) NOT NULL DEFAULT '0',
  `copyable` tinyint(4) NOT NULL DEFAULT '1',
  `editable` tinyint(4) NOT NULL DEFAULT '1',
  `order` int(11) NOT NULL,
  PRIMARY KEY (`id`)
);

-- site menu
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES
('sys_site', 'system', 'home', '_sys_menu_item_title_system_home', '_sys_menu_item_title_home', '', '', '', 'home', '', 2147483647, 1, 1, 1),
('sys_site', 'system', 'about', '_sys_menu_item_title_system_about', '_sys_menu_item_title_about', 'page.php?i=about', '', '', 'info-circle', '', 2147483647, 1, 1, 2),
('sys_site', 'system', 'search', '_sys_menu_item_title_system_search', '_sys_menu_item_title_search', 'javascript:void(0);', 'bx_menu_slide_inline(\'#bx-sliding-menu-search\', this, \'site\');', '', 'search', '', 2147483647, 1, 1, 3),
('sys_site', 'system', 'more-auto', '_sys_menu_item_title_system_more_auto', '_sys_menu_item_title_more_auto', 'javascript:void(0)', '', '', 'ellipsis-v', '', 2147483647, 1, 0, 9999);

-- panel menu
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES
('sys_site_panel', 'system', 'member-avatar', '_sys_menu_item_title_system_member_avatar', '', '', '', '', '', '', 2147483646, 1, 0, 1),
('sys_site_panel', 'system', 'public-menu', '_sys_menu_item_title_system_public_menu', '', '', '', '', '', 'sys_site_in_panel', 2147483647, 0, 0, 2),
('sys_site_panel', 'system', 'member-menu', '_sys_menu_item_title_system_member_menu', '', '', '', '', '', 'sys_profile_stats', 2147483646, 1, 0, 3),
('sys_site_panel', 'system', 'member-followings', '_sys_menu_item_title_system_member_followings', '', '', '', '', '', 'sys_profile_followings', 2147483646, 1, 0, 4);

-- application menu
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES
('sys_application', 'system', 'home', '_sys_menu_item_title_system_home', '_sys_menu_item_title_home', '', '', '', 'home col-gray-dark', '', 2147483647, 1, 1, 1),
('sys_application', 'system', 'about', '_sys_menu_item_title_system_about', '_sys_menu_item_title_about', 'page.php?i=about', '', '', 'info-circle col-blue3-dark', '', 2147483647, 1, 1, 2),
('sys_application', 'system', 'more-auto', '_sys_menu_item_title_system_more_auto', '_sys_menu_item_title_more_auto', 'javascript:void(0)', '', '', 'ellipsis-v', '', 2147483647, 1, 0, 9999);

-- homepage submenu
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `order`) VALUES
('sys_homepage_submenu', 'system', 'home', '_sys_menu_item_title_system_home', '_sys_menu_item_title_home', '', '', '', 'bolt', '', '', 2147483647, '', 0, 1, 1),
('sys_homepage_submenu', 'system', 'explore', '_sys_menu_item_title_system_explore', '_sys_menu_item_title_explore', 'page.php?i=explore', '', '', 'compass ', '', '', 2147483647, '', 0, 1, 2),
('sys_homepage_submenu', 'system', 'updates', '_sys_menu_item_title_system_updates', '_sys_menu_item_title_updates', 'page.php?i=updates', '', '', 'fire', '', '', 2147483647, '', 0, 1, 3),
('sys_homepage_submenu', 'system', 'trends', '_sys_menu_item_title_system_trends', '_sys_menu_item_title_trends', 'page.php?i=trends', '', '', 'hashtag', '', '', 2147483647, '', 0, 1, 4);

-- footer menu
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES
('sys_footer', 'system', 'about', '_sys_menu_item_title_system_about', '_sys_menu_item_title_about', 'page.php?i=about', '', '', '', '', 2147483647, 1, 1, 1),
('sys_footer', 'system', 'terms', '_sys_menu_item_title_system_terms', '_sys_menu_item_title_terms', 'page.php?i=terms', '', '', '', '', 2147483647, 1, 1, 2),
('sys_footer', 'system', 'privacy', '_sys_menu_item_title_system_privacy', '_sys_menu_item_title_privacy', 'page.php?i=privacy', '', '', '', '', 2147483647, 1, 1, 3),
('sys_footer', 'system', 'switch_language', '_sys_menu_item_title_system_switch_language', '_sys_menu_item_title_switch_language', 'javascript:void(0);', 'bx_menu_popup(''sys_switch_language_popup'', window);', '', '', '', 2147483647, 1, 1, 4),
('sys_footer', 'system', 'switch_template', '_sys_menu_item_title_system_switch_template', '_sys_menu_item_title_switch_template', 'javascript:void(0);', 'bx_menu_popup(''sys_switch_template'', window);', '', '', '', 2147483647, 1, 1, 5),
('sys_footer', 'system', 'copyright', '_sys_menu_item_title_system_copyright', '_sys_menu_item_title_copyright', 'javascript:void(0)', 'on_copyright_click()', '', '', '', 2147483647, 1, 1, 6),
('sys_footer', 'system', 'powered_by', '_sys_menu_item_title_system_powered_by', '', 'https://una.io', '', '_blank', '<svg width="167" height="28" viewBox="0 0 167 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.54 18.5C9.43733 18.5 9.358 18.472 9.302 18.416C9.246 18.3507 9.218 18.2713 9.218 18.178V9.036C9.218 8.93333 9.246 8.854 9.302 8.798C9.358 8.73267 9.43733 8.7 9.54 8.7H13.096C13.7867 8.7 14.384 8.812 14.888 9.036C15.4013 9.26 15.798 9.596 16.078 10.044C16.358 10.4827 16.498 11.0333 16.498 11.696C16.498 12.3587 16.358 12.9093 16.078 13.348C15.798 13.7867 15.4013 14.118 14.888 14.342C14.384 14.566 13.7867 14.678 13.096 14.678H10.618V18.178C10.618 18.2713 10.5853 18.3507 10.52 18.416C10.464 18.472 10.3847 18.5 10.282 18.5H9.54ZM10.604 13.502H13.026C13.7167 13.502 14.2347 13.348 14.58 13.04C14.9253 12.732 15.098 12.284 15.098 11.696C15.098 11.1173 14.93 10.6693 14.594 10.352C14.258 10.0347 13.7353 9.876 13.026 9.876H10.604V13.502ZM20.9047 18.64C20.1954 18.64 19.6027 18.5047 19.1267 18.234C18.6507 17.9633 18.2867 17.59 18.0347 17.114C17.7827 16.6287 17.6427 16.078 17.6147 15.462C17.6054 15.3033 17.6007 15.1027 17.6007 14.86C17.6007 14.608 17.6054 14.4073 17.6147 14.258C17.6427 13.6327 17.7827 13.082 18.0347 12.606C18.2961 12.13 18.6647 11.7567 19.1407 11.486C19.6167 11.2153 20.2047 11.08 20.9047 11.08C21.6047 11.08 22.1927 11.2153 22.6687 11.486C23.1447 11.7567 23.5087 12.13 23.7607 12.606C24.0221 13.082 24.1667 13.6327 24.1947 14.258C24.2041 14.4073 24.2087 14.608 24.2087 14.86C24.2087 15.1027 24.2041 15.3033 24.1947 15.462C24.1667 16.078 24.0267 16.6287 23.7747 17.114C23.5227 17.59 23.1587 17.9633 22.6827 18.234C22.2067 18.5047 21.6141 18.64 20.9047 18.64ZM20.9047 17.562C21.4834 17.562 21.9454 17.38 22.2907 17.016C22.6361 16.6427 22.8227 16.1013 22.8507 15.392C22.8601 15.252 22.8647 15.0747 22.8647 14.86C22.8647 14.6453 22.8601 14.468 22.8507 14.328C22.8227 13.6187 22.6361 13.082 22.2907 12.718C21.9454 12.3447 21.4834 12.158 20.9047 12.158C20.3261 12.158 19.8594 12.3447 19.5047 12.718C19.1594 13.082 18.9774 13.6187 18.9587 14.328C18.9494 14.468 18.9447 14.6453 18.9447 14.86C18.9447 15.0747 18.9494 15.252 18.9587 15.392C18.9774 16.1013 19.1594 16.6427 19.5047 17.016C19.8594 17.38 20.3261 17.562 20.9047 17.562ZM27.7024 18.5C27.581 18.5 27.4877 18.472 27.4224 18.416C27.357 18.3507 27.301 18.262 27.2544 18.15L25.2664 11.654C25.2477 11.6073 25.2384 11.5607 25.2384 11.514C25.2384 11.43 25.2664 11.36 25.3224 11.304C25.3877 11.248 25.4577 11.22 25.5324 11.22H26.1484C26.251 11.22 26.3304 11.248 26.3864 11.304C26.4424 11.36 26.4797 11.4113 26.4984 11.458L28.0524 16.736L29.7184 11.514C29.737 11.4487 29.7744 11.3833 29.8304 11.318C29.8957 11.2527 29.989 11.22 30.1104 11.22H30.5864C30.7077 11.22 30.801 11.2527 30.8664 11.318C30.9317 11.3833 30.969 11.4487 30.9784 11.514L32.6444 16.736L34.1984 11.458C34.2077 11.4113 34.2404 11.36 34.2964 11.304C34.3524 11.248 34.4317 11.22 34.5344 11.22H35.1504C35.2344 11.22 35.3044 11.248 35.3604 11.304C35.4164 11.36 35.4444 11.43 35.4444 11.514C35.4444 11.5607 35.435 11.6073 35.4164 11.654L33.4284 18.15C33.4004 18.262 33.349 18.3507 33.2744 18.416C33.209 18.472 33.111 18.5 32.9804 18.5H32.4344C32.313 18.5 32.2104 18.472 32.1264 18.416C32.0517 18.3507 32.0004 18.262 31.9724 18.15L30.3484 13.138L28.7244 18.15C28.687 18.262 28.631 18.3507 28.5564 18.416C28.4817 18.472 28.379 18.5 28.2484 18.5H27.7024ZM39.7016 18.64C38.7402 18.64 37.9749 18.346 37.4056 17.758C36.8362 17.1607 36.5236 16.3487 36.4676 15.322C36.4582 15.2007 36.4536 15.0467 36.4536 14.86C36.4536 14.664 36.4582 14.5053 36.4676 14.384C36.5049 13.7213 36.6589 13.1427 36.9296 12.648C37.2002 12.144 37.5689 11.7567 38.0356 11.486C38.5116 11.2153 39.0669 11.08 39.7016 11.08C40.4109 11.08 41.0036 11.2293 41.4796 11.528C41.9649 11.8267 42.3336 12.2513 42.5856 12.802C42.8376 13.3527 42.9636 13.9967 42.9636 14.734V14.972C42.9636 15.0747 42.9309 15.154 42.8656 15.21C42.8096 15.266 42.7349 15.294 42.6416 15.294H37.7976C37.7976 15.3033 37.7976 15.322 37.7976 15.35C37.7976 15.378 37.7976 15.4013 37.7976 15.42C37.8162 15.8027 37.9002 16.162 38.0496 16.498C38.1989 16.8247 38.4136 17.0907 38.6936 17.296C38.9736 17.5013 39.3096 17.604 39.7016 17.604C40.0376 17.604 40.3176 17.5527 40.5416 17.45C40.7656 17.3473 40.9476 17.2353 41.0876 17.114C41.2276 16.9833 41.3209 16.8853 41.3676 16.82C41.4516 16.6987 41.5169 16.6287 41.5636 16.61C41.6102 16.582 41.6849 16.568 41.7876 16.568H42.4596C42.5529 16.568 42.6276 16.596 42.6836 16.652C42.7489 16.6987 42.7769 16.7687 42.7676 16.862C42.7582 17.002 42.6836 17.1747 42.5436 17.38C42.4036 17.576 42.2029 17.772 41.9416 17.968C41.6802 18.164 41.3629 18.3273 40.9896 18.458C40.6162 18.5793 40.1869 18.64 39.7016 18.64ZM37.7976 14.328H41.6336V14.286C41.6336 13.866 41.5542 13.4927 41.3956 13.166C41.2462 12.8393 41.0269 12.5827 40.7376 12.396C40.4482 12.2 40.1029 12.102 39.7016 12.102C39.3002 12.102 38.9549 12.2 38.6656 12.396C38.3856 12.5827 38.1709 12.8393 38.0216 13.166C37.8722 13.4927 37.7976 13.866 37.7976 14.286V14.328ZM44.9596 18.5C44.8662 18.5 44.7869 18.472 44.7216 18.416C44.6656 18.3507 44.6376 18.2713 44.6376 18.178V11.556C44.6376 11.4627 44.6656 11.3833 44.7216 11.318C44.7869 11.2527 44.8662 11.22 44.9596 11.22H45.6036C45.6969 11.22 45.7762 11.2527 45.8416 11.318C45.9069 11.3833 45.9396 11.4627 45.9396 11.556V12.172C46.1262 11.8547 46.3829 11.6167 46.7096 11.458C47.0362 11.2993 47.4282 11.22 47.8856 11.22H48.4456C48.5389 11.22 48.6136 11.2527 48.6696 11.318C48.7256 11.374 48.7536 11.4487 48.7536 11.542V12.116C48.7536 12.2093 48.7256 12.284 48.6696 12.34C48.6136 12.396 48.5389 12.424 48.4456 12.424H47.6056C47.1016 12.424 46.7049 12.5733 46.4156 12.872C46.1262 13.1613 45.9816 13.558 45.9816 14.062V18.178C45.9816 18.2713 45.9489 18.3507 45.8836 18.416C45.8182 18.472 45.7389 18.5 45.6456 18.5H44.9596ZM52.7172 18.64C51.7559 18.64 50.9905 18.346 50.4212 17.758C49.8519 17.1607 49.5392 16.3487 49.4832 15.322C49.4739 15.2007 49.4692 15.0467 49.4692 14.86C49.4692 14.664 49.4739 14.5053 49.4832 14.384C49.5205 13.7213 49.6745 13.1427 49.9452 12.648C50.2159 12.144 50.5845 11.7567 51.0512 11.486C51.5272 11.2153 52.0825 11.08 52.7172 11.08C53.4265 11.08 54.0192 11.2293 54.4952 11.528C54.9805 11.8267 55.3492 12.2513 55.6012 12.802C55.8532 13.3527 55.9792 13.9967 55.9792 14.734V14.972C55.9792 15.0747 55.9465 15.154 55.8812 15.21C55.8252 15.266 55.7505 15.294 55.6572 15.294H50.8132C50.8132 15.3033 50.8132 15.322 50.8132 15.35C50.8132 15.378 50.8132 15.4013 50.8132 15.42C50.8319 15.8027 50.9159 16.162 51.0652 16.498C51.2145 16.8247 51.4292 17.0907 51.7092 17.296C51.9892 17.5013 52.3252 17.604 52.7172 17.604C53.0532 17.604 53.3332 17.5527 53.5572 17.45C53.7812 17.3473 53.9632 17.2353 54.1032 17.114C54.2432 16.9833 54.3365 16.8853 54.3832 16.82C54.4672 16.6987 54.5325 16.6287 54.5792 16.61C54.6259 16.582 54.7005 16.568 54.8032 16.568H55.4752C55.5685 16.568 55.6432 16.596 55.6992 16.652C55.7645 16.6987 55.7925 16.7687 55.7832 16.862C55.7739 17.002 55.6992 17.1747 55.5592 17.38C55.4192 17.576 55.2185 17.772 54.9572 17.968C54.6959 18.164 54.3785 18.3273 54.0052 18.458C53.6319 18.5793 53.2025 18.64 52.7172 18.64ZM50.8132 14.328H54.6492V14.286C54.6492 13.866 54.5699 13.4927 54.4112 13.166C54.2619 12.8393 54.0425 12.5827 53.7532 12.396C53.4639 12.2 53.1185 12.102 52.7172 12.102C52.3159 12.102 51.9705 12.2 51.6812 12.396C51.4012 12.5827 51.1865 12.8393 51.0372 13.166C50.8879 13.4927 50.8132 13.866 50.8132 14.286V14.328ZM60.3132 18.64C59.7999 18.64 59.3565 18.5513 58.9832 18.374C58.6099 18.1873 58.3019 17.94 58.0592 17.632C57.8259 17.3147 57.6485 16.9553 57.5272 16.554C57.4152 16.1527 57.3499 15.728 57.3312 15.28C57.3219 15.1307 57.3172 14.9907 57.3172 14.86C57.3172 14.7293 57.3219 14.5893 57.3312 14.44C57.3499 14.0013 57.4152 13.5813 57.5272 13.18C57.6485 12.7787 57.8259 12.4193 58.0592 12.102C58.3019 11.7847 58.6099 11.5373 58.9832 11.36C59.3565 11.1733 59.7999 11.08 60.3132 11.08C60.8639 11.08 61.3212 11.178 61.6852 11.374C62.0492 11.57 62.3479 11.8127 62.5812 12.102V8.882C62.5812 8.78867 62.6092 8.714 62.6652 8.658C62.7305 8.59267 62.8099 8.56 62.9032 8.56H63.5752C63.6685 8.56 63.7432 8.59267 63.7992 8.658C63.8645 8.714 63.8972 8.78867 63.8972 8.882V18.178C63.8972 18.2713 63.8645 18.3507 63.7992 18.416C63.7432 18.472 63.6685 18.5 63.5752 18.5H62.9452C62.8425 18.5 62.7632 18.472 62.7072 18.416C62.6512 18.3507 62.6232 18.2713 62.6232 18.178V17.59C62.3899 17.8887 62.0865 18.1407 61.7132 18.346C61.3399 18.542 60.8732 18.64 60.3132 18.64ZM60.6072 17.506C61.0739 17.506 61.4472 17.3987 61.7272 17.184C62.0072 16.9693 62.2172 16.6987 62.3572 16.372C62.4972 16.036 62.5719 15.6953 62.5812 15.35C62.5905 15.2007 62.5952 15.0233 62.5952 14.818C62.5952 14.6033 62.5905 14.4213 62.5812 14.272C62.5719 13.9453 62.4925 13.6233 62.3432 13.306C62.2032 12.9887 61.9885 12.7273 61.6992 12.522C61.4192 12.3167 61.0552 12.214 60.6072 12.214C60.1312 12.214 59.7532 12.3213 59.4732 12.536C59.1932 12.7413 58.9925 13.0167 58.8712 13.362C58.7499 13.698 58.6799 14.062 58.6612 14.454C58.6519 14.7247 58.6519 14.9953 58.6612 15.266C58.6799 15.658 58.7499 16.0267 58.8712 16.372C58.9925 16.708 59.1932 16.9833 59.4732 17.198C59.7532 17.4033 60.1312 17.506 60.6072 17.506ZM73.009 18.64C72.449 18.64 71.9823 18.542 71.609 18.346C71.2357 18.1407 70.937 17.8887 70.713 17.59V18.178C70.713 18.2713 70.6803 18.3507 70.615 18.416C70.559 18.472 70.4843 18.5 70.391 18.5H69.747C69.6537 18.5 69.5743 18.472 69.509 18.416C69.453 18.3507 69.425 18.2713 69.425 18.178V8.882C69.425 8.78867 69.453 8.714 69.509 8.658C69.5743 8.59267 69.6537 8.56 69.747 8.56H70.419C70.5217 8.56 70.601 8.59267 70.657 8.658C70.713 8.714 70.741 8.78867 70.741 8.882V12.102C70.9743 11.8127 71.273 11.57 71.637 11.374C72.0103 11.178 72.4677 11.08 73.009 11.08C73.5317 11.08 73.975 11.1733 74.339 11.36C74.7123 11.5373 75.0157 11.7847 75.249 12.102C75.4917 12.4193 75.6737 12.7787 75.795 13.18C75.9163 13.5813 75.9817 14.0013 75.991 14.44C76.0003 14.5893 76.005 14.7293 76.005 14.86C76.005 14.9907 76.0003 15.1307 75.991 15.28C75.9817 15.728 75.9163 16.1527 75.795 16.554C75.6737 16.9553 75.4917 17.3147 75.249 17.632C75.0157 17.94 74.7123 18.1873 74.339 18.374C73.975 18.5513 73.5317 18.64 73.009 18.64ZM72.715 17.506C73.2003 17.506 73.5783 17.4033 73.849 17.198C74.129 16.9833 74.3297 16.708 74.451 16.372C74.5723 16.0267 74.6423 15.658 74.661 15.266C74.6703 14.9953 74.6703 14.7247 74.661 14.454C74.6423 14.062 74.5723 13.698 74.451 13.362C74.3297 13.0167 74.129 12.7413 73.849 12.536C73.5783 12.3213 73.2003 12.214 72.715 12.214C72.2763 12.214 71.9123 12.3167 71.623 12.522C71.3337 12.7273 71.1143 12.9887 70.965 13.306C70.825 13.6233 70.7503 13.9453 70.741 14.272C70.7317 14.4213 70.727 14.6033 70.727 14.818C70.727 15.0233 70.7317 15.2007 70.741 15.35C70.7597 15.6953 70.8343 16.036 70.965 16.372C71.105 16.6987 71.315 16.9693 71.595 17.184C71.8843 17.3987 72.2577 17.506 72.715 17.506ZM78.7377 21.16C78.6631 21.16 78.5977 21.132 78.5417 21.076C78.4857 21.02 78.4577 20.9547 78.4577 20.88C78.4577 20.8427 78.4624 20.8053 78.4717 20.768C78.4811 20.7307 78.4997 20.684 78.5277 20.628L79.6057 18.066L76.9317 11.752C76.8851 11.64 76.8617 11.5607 76.8617 11.514C76.8617 11.43 76.8897 11.36 76.9457 11.304C77.0017 11.248 77.0717 11.22 77.1557 11.22H77.8417C77.9351 11.22 78.0097 11.2433 78.0657 11.29C78.1217 11.3367 78.1591 11.3927 78.1777 11.458L80.3057 16.554L82.4897 11.458C82.5177 11.3927 82.5551 11.3367 82.6017 11.29C82.6577 11.2433 82.7371 11.22 82.8397 11.22H83.4977C83.5817 11.22 83.6517 11.248 83.7077 11.304C83.7637 11.36 83.7917 11.4253 83.7917 11.5C83.7917 11.5467 83.7684 11.6307 83.7217 11.752L79.7457 20.922C79.7177 20.9873 79.6757 21.0433 79.6197 21.09C79.5731 21.1367 79.4984 21.16 79.3957 21.16H78.7377Z" fill="#478293"/><path d="M96.9739 9.94545C98.0069 8.91955 99.4297 8.28571 101.001 8.28571C101.165 8.28571 101.327 8.29263 101.488 8.3062C101.643 8.31927 101.784 8.2133 101.818 8.0616C102.142 6.60877 103.205 5.43424 104.591 4.95157C104.72 4.9065 104.733 4.71896 104.606 4.66953C103.487 4.23711 102.272 4 101.001 4C99.531 4 98.1355 4.317 96.8786 4.88633C96.7782 4.93184 96.7148 5.03261 96.7148 5.14291V9.84251C96.7148 9.97411 96.8806 10.0382 96.9739 9.94545Z" fill="#3E6B7C"/><path d="M106.937 22.0478C106.844 22.1164 106.715 22.0493 106.715 21.9337V14C106.715 13.8359 106.708 13.6733 106.694 13.5127C106.681 13.3578 106.787 13.2165 106.939 13.1827C108.392 12.8581 109.566 11.796 110.049 10.4098C110.094 10.2804 110.282 10.2671 110.331 10.395C110.763 11.5134 111.001 12.729 111.001 14C111.001 17.3 109.402 20.2266 106.937 22.0478Z" fill="#3E6B7C"/><path d="M108.857 8.99996C108.857 10.5779 107.578 11.8571 106 11.8571C104.422 11.8571 103.143 10.5779 103.143 8.99996C103.143 7.42201 104.422 6.14282 106 6.14282C107.578 6.14282 108.857 7.42201 108.857 8.99996Z" fill="#F97016"/><path d="M91.9516 17.5902C91.9065 17.7196 91.719 17.7329 91.6695 17.605C91.2371 16.4866 91 15.271 91 14C91 10.7001 92.5984 7.77346 95.0633 5.95217C95.1562 5.88354 95.2857 5.95082 95.2857 6.06629V14C95.2857 14.1642 95.2927 14.3267 95.3062 14.4873C95.3193 14.6422 95.2133 14.7835 95.0616 14.8174C93.6088 15.1419 92.4343 16.204 91.9516 17.5902Z" fill="#3E6B7C"/><path d="M105.122 23.1137C105.222 23.0682 105.286 22.9674 105.286 22.8572V18.1575C105.286 18.0259 105.12 17.9619 105.027 18.0546C103.994 19.0805 102.571 19.7143 101 19.7143C100.836 19.7143 100.673 19.7075 100.513 19.6939C100.358 19.6807 100.217 19.7867 100.183 19.9385C99.8581 21.3913 98.796 22.5657 97.4098 23.0484C97.2803 23.0936 97.2671 23.281 97.3949 23.3304C98.5133 23.7629 99.729 24 101 24C102.47 24 103.865 23.683 105.122 23.1137Z" fill="#3E6B7C"/><path d="M98.8569 19C98.8569 20.578 97.5777 21.8571 95.9997 21.8571C94.4218 21.8571 93.1426 20.578 93.1426 19C93.1426 17.422 94.4218 16.1428 95.9997 16.1428C97.5777 16.1428 98.8569 17.422 98.8569 19Z" fill="#F97016"/><path d="M128.5 14C128.5 16.4853 126.485 18.5 124 18.5C121.515 18.5 119.5 16.4853 119.5 14V8.75C119.5 8.33579 119.164 8 118.75 8C118.336 8 118 8.33579 118 8.75V14C118 17.3137 120.686 20 124 20C127.314 20 130 17.3137 130 14V8.75C130 8.33579 129.664 8 129.25 8C128.836 8 128.5 8.33579 128.5 8.75V14Z" fill="#3E6B7C"/><path d="M142.5 14V19.25C142.5 19.6642 142.836 20 143.25 20C143.664 20 144 19.6642 144 19.25V14C144 10.6863 141.314 8 138 8C134.686 8 132 10.6863 132 14V19.25C132 19.6642 132.336 20 132.75 20C133.164 20 133.5 19.6642 133.5 19.25V14C133.5 11.5147 135.515 9.5 138 9.5C140.485 9.5 142.5 11.5147 142.5 14Z" fill="#3E6B7C"/><path fill-rule="evenodd" clip-rule="evenodd" d="M156.5 17.9687V19.25C156.5 19.6642 156.836 20 157.25 20V20C157.664 20 158 19.6642 158 19.25V14C158 10.6863 155.314 8 152 8C148.686 8 146 10.6863 146 14C146 17.3137 148.686 20 152 20C153.792 20 155.401 19.2144 156.5 17.9687ZM156.5 14C156.5 16.4853 154.485 18.5 152 18.5C149.515 18.5 147.5 16.4853 147.5 14C147.5 11.5147 149.515 9.5 152 9.5C154.485 9.5 156.5 11.5147 156.5 14Z" fill="#3E6B7C"/><rect x="0.5" y="0.5" width="166" height="27" rx="7.5" stroke="#478293"/></svg>', '', 2147483647, 1, 1, 9999);

-- site toolbar menu
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_toolbar_site', 'system', 'main-menu', '_sys_menu_item_title_system_main_menu', '', 'javascript:void(0);', 'bx_menu_slide_inline(\'#bx-sliding-menu-sys_site\', this, \'site\');', '', 'bars', '', 2147483647, 1, 1, 1),
('sys_toolbar_site', 'system', 'search', '_sys_menu_item_title_system_search', '', 'javascript:void(0);', 'bx_menu_slide_inline(''#bx-sliding-menu-search'', this, ''site'');', '', 'search', '', 2147483647, 1, 1, 2);

-- member toolbar menu
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `hidden_on_pt`, `active`, `copyable`, `order`) VALUES 
('sys_toolbar_member', 'system', 'add-content', '_sys_menu_item_title_system_add_content', '', 'javascript:void(0);', 'bx_menu_slide_inline(\'#bx-sliding-menu-sys_add_content\', this, \'site\');', '', 'plus', '', '', 0, 2147483646, 0, 1, 1, 0),
('sys_toolbar_member', 'system', 'apps', '_sys_menu_item_title_system_apps', '', 'javascript:void(0);', '', '', 'qrcode', '', '', 0, 2147483646, 3, 1, 1, 0),
('sys_toolbar_member', 'system', 'account', '_sys_menu_item_title_system_account_menu', '_sys_menu_item_title_account_menu', 'javascript:void(0);', 'bx_menu_slide_inline(''#bx-sliding-menu-account'', this, ''site'');', '', 'user',  'a:3:{s:6:"module";s:6:"system";s:6:"method";s:21:"profile_notifications";s:5:"class";s:20:"TemplServiceProfiles";}', 'sys_account_popup', 1, 2147483646, 0, 1, 0, 1),
('sys_toolbar_member', 'system', 'login', '_sys_menu_item_title_system_login', '', 'page.php?i=login', '', '', 'user',  '', '', 0, 1, 0, 1, 0, 2);

-- account popup menu
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES
('sys_account_popup', 'system', 'profile-active', '_sys_menu_item_title_system_ap_profile_active', '', '', '', '', '', '', '', 2147483646, 1, 1, 1),
('sys_account_popup', 'system', 'profile-notifications', '_sys_menu_item_title_system_ap_profile_notifications', '', '', '', '', '', '', '', 2147483646, 1, 1, 2),
('sys_account_popup', 'system', 'profile-switcher', '_sys_menu_item_title_system_ap_profile_switcher', '', '', '', '', '', '', '', 2147483646, 1, 1, 3),
('sys_account_popup', 'system', 'profile-create', '_sys_menu_item_title_system_ap_profile_create', '', '', '', '', '', '', '', 2147483646, 1, 1, 4);

-- notifications menu in account popup
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES
('sys_account_notifications', 'system', 'dashboard', '_sys_menu_item_title_system_dashboard', '_sys_menu_item_title_dashboard', 'page.php?i=dashboard', '', '', 'tachometer-alt', '', '', 2147483646, 1, 1, 1),
('sys_account_notifications', 'system', 'profile', '_sys_menu_item_title_system_profile', '_sys_menu_item_title_profile', '{own_profile_url}', '', '', 'user', '', '', 2147483644, 1, 1, 2),
('sys_account_notifications', 'system', 'account-settings', '_sys_menu_item_title_system_account_settings', '_sys_menu_item_title_account_settings', 'page.php?i=account-settings-email', '', '', 'cog', '', '', 2147483646, 1, 1, 3),
('sys_account_notifications', 'system', 'add-content', '_sys_menu_item_title_system_add_content', '_sys_menu_item_title_add_content', 'javascript:void(0);', 'bx_menu_slide_inline(\'#bx-sliding-menu-sys_add_content\', $(\'#bx-menu-toolbar-item-add-content a\').get(0), \'site\');', '', 'plus', '', '', 2147483646, 1, 1, 4),
('sys_account_notifications', 'system', 'studio', '_sys_menu_item_title_system_studio', '_sys_menu_item_title_studio', '{studio_url}', '', '', 'wrench', '', '', 2147483646, 1, 0, 5),
('sys_account_notifications', 'system', 'cart', '_sys_menu_item_title_system_cart', '_sys_menu_item_title_cart', 'cart.php', '', '', 'cart-plus', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:20:"get_cart_items_count";s:6:"params";a:0:{}s:5:"class";s:21:"TemplPaymentsServices";}', '', 2147483646, 1, 1, 6),
('sys_account_notifications', 'system', 'orders', '_sys_menu_item_title_system_orders', '_sys_menu_item_title_orders', 'orders.php', '', '', 'cart-arrow-down', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:16:"get_orders_count";s:6:"params";a:1:{i:0;s:3:"new";}s:5:"class";s:21:"TemplPaymentsServices";}', '', 2147483646, 0, 1, 7),
('sys_account_notifications', 'system', 'invoices', '_sys_menu_item_title_system_invoices', '_sys_menu_item_title_invoices', 'invoices.php', '', '', 'file-invoice', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:18:"get_invoices_count";s:6:"params";a:1:{i:0;s:6:"unpaid";}s:5:"class";s:21:"TemplPaymentsServices";}', '', 2147483646, 0, 1, 8),
('sys_account_notifications', 'system', 'logout', '_sys_menu_item_title_system_logout', '_sys_menu_item_title_logout', 'page.php?i=logout', '', '', 'sign-out-alt', '', '', 2147483646, 1, 1, 9999);

-- account settings menu
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `order`) VALUES
('sys_account_settings', 'system', 'account-profile-switcher', '_sys_menu_item_title_system_account_profile_context', '_sys_menu_item_title_account_profile_context', 'page.php?i=account-profile-switcher', '', '', 'user', '', 2147483646, '', 1, 1, 1),
('sys_account_settings', 'system', 'account-settings-info', '_sys_menu_item_title_system_account_settings_info', '_sys_menu_item_title_account_settings_info', 'page.php?i=account-settings-info', '', '', 'info-circle', '', 2147483646, '', 1, 1, 2),
('sys_account_settings', 'system', 'account-settings-email', '_sys_menu_item_title_system_account_settings_email', '_sys_menu_item_title_account_settings_email', 'page.php?i=account-settings-email', '', '', 'envelope', '', 2147483646, '', 1, 1, 3),
('sys_account_settings', 'system', 'account-settings-password', '_sys_menu_item_title_system_account_settings_pwd', '_sys_menu_item_title_account_settings_pwd', 'page.php?i=account-settings-password', '', '', 'key', '', 2147483646, '', 1, 1, 4),
('sys_account_settings', 'system', 'profile-settings-cfilter', '_sys_menu_item_title_system_profile_settings_cfilter', '_sys_menu_item_title_profile_settings_cfilter', 'page.php?i=profile-settings-cfilter', '', '', 'filter', '', 2147483646, 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:18:"is_enabled_cfilter";s:6:"params";a:0:{}s:5:"class";s:20:"TemplServiceProfiles";}', 1, 1, 5),
('sys_account_settings', 'system', 'account-settings-delete', '_sys_menu_item_title_system_account_settings_delete', '_sys_menu_item_title_account_settings_delete', 'page.php?i=account-settings-delete', '', '', 'remove', '', 2147483646, '', 1, 1, 9999);

-- account dashboard
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES
('sys_account_dashboard', 'system', 'dashboard', '_sys_menu_item_title_system_account_dashboard', '_sys_menu_item_title_account_dashboard', 'page.php?i=dashboard', '', '', 'tachometer-alt', '', '', 2147483646, 1, 1, 1),
('sys_account_dashboard', 'system', 'dashboard-subscriptions', '_sys_menu_item_title_system_subscriptions', '_sys_menu_item_title_subscriptions', 'subscriptions.php', '', '', 'credit-card col-blue3', '', '', 2147483646, 1, 1, 2),
('sys_account_dashboard', 'system', 'dashboard-orders', '_sys_menu_item_title_system_orders', '_sys_menu_item_title_orders', 'orders.php', '', '', 'cart-arrow-down col-green3', '', '', 2147483646, 1, 1, 3),
('sys_account_dashboard', 'system', 'dashboard-invoices', '_sys_menu_item_title_system_invoices', '_sys_menu_item_title_invoices', 'invoices.php', '', '', 'file-invoice col-green3', '', '', 2147483646, 1, 1, 4),
('sys_account_dashboard', 'system', 'dashboard-content', '_sys_menu_item_title_system_account_dashboard_content', '_sys_menu_item_title_account_dashboard_content', 'page.php?i=dashboard-content', '', '', 'copy', '', '', 192, 1, 1, 5),
('sys_account_dashboard', 'system', 'dashboard-reports', '_sys_menu_item_title_system_account_dashboard_reports', '_sys_menu_item_title_account_dashboard_reports', 'page.php?i=dashboard-reports', '', '', 'exclamation-circle', '', '', 192, 1, 1, 6),
('sys_account_dashboard', 'system', 'dashboard-audit', '_sys_menu_item_title_system_account_dashboard_audit', '_sys_menu_item_title_account_dashboard_audit', 'page.php?i=dashboard-audit', '', '', 'history', '', '', 192, 1, 1, 7);

-- comment manage menu
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES
('sys_cmts_item_manage', 'system', 'item-pin', '_sys_menu_item_title_system_cmts_item_pin', '_sys_menu_item_title_cmts_item_pin', 'javascript:void(0)', 'javascript:{js_object}.cmtPin(this, {content_id}, 1)', '_self', 'thumbtack', '', 2147483647, 1, 0, 0),
('sys_cmts_item_manage', 'system', 'item-unpin', '_sys_menu_item_title_system_cmts_item_unpin', '_sys_menu_item_title_cmts_item_unpin', 'javascript:void(0)', 'javascript:{js_object}.cmtPin(this, {content_id}, 0)', '_self', 'thumbtack', '', 2147483647, 1, 0, 0),
('sys_cmts_item_manage', 'system', 'item-report', '_sys_menu_item_title_system_cmts_item_report', '', 'javascript:void(0)', '', '', '', '', 2147483647, 1, 0, 0),
('sys_cmts_item_manage', 'system', 'item-edit', '_sys_menu_item_title_system_cmts_item_edit', '_sys_menu_item_title_cmts_item_edit', 'javascript:void(0)', 'javascript:{js_object}.cmtEdit(this, {content_id})', '_self', 'pencil-alt', '', 2147483647, 1, 0, 0),
('sys_cmts_item_manage', 'system', 'item-delete', '_sys_menu_item_title_system_cmts_item_delete', '_sys_menu_item_title_cmts_item_delete', 'javascript:void(0)', 'javascript:{js_object}.cmtRemove(this, {content_id})', '_self', 'remove', '', 2147483647, 1, 0, 0);

-- comment actions menu
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `active`, `copyable`, `editable`, `order`) VALUES 
('sys_cmts_item_actions', 'system', 'item-vote', '_sys_menu_item_title_system_cmts_item_vote', '_sys_menu_item_title_cmts_item_vote', 'javascript:void(0)', '', '', '', '', '', 0, 2147483647, 1, 0, 1, 0),
('sys_cmts_item_actions', 'system', 'item-reaction', '_sys_menu_item_title_system_cmts_item_reaction', '_sys_menu_item_title_cmts_item_reaction', 'javascript:void(0)', '', '', '', '', '', 0, 2147483647, 0, 0, 1, 1),
('sys_cmts_item_actions', 'system', 'item-score', '_sys_menu_item_title_system_cmts_item_score', '_sys_menu_item_title_cmts_item_score', 'javascript:void(0)', '', '', '', '', '', 0, 2147483647, 0, 0, 1, 2),
('sys_cmts_item_actions', 'system', 'item-reply', '_sys_menu_item_title_system_cmts_item_reply', '_sys_menu_item_title_cmts_item_reply', 'javascript:void(0)', 'javascript:{reply_onclick}', '_self', 'reply', '', '', 0, 2147483647, 1, 0, 1, 3),
('sys_cmts_item_actions', 'system', 'item-quote', '_sys_menu_item_title_system_cmts_item_quote', '_sys_menu_item_title_cmts_item_quote', 'javascript:void(0)', 'javascript:{quote_onclick}', '_self', 'quote-right', '', '', 0, 2147483647, 1, 0, 1, 4),
('sys_cmts_item_actions', 'system', 'item-more', '_sys_menu_item_title_system_cmts_item_more', '_sys_menu_item_title_cmts_item_more', 'javascript:void(0)', 'bx_menu_popup(''sys_cmts_item_manage'', this, {''id'':''sys_cmts_item_manage_{cmt_system}_{cmt_id}'', ''removeOnClose'':1}, {cmt_system:''{cmt_system}'', cmt_object_id:{cmt_object_id}, cmt_id:{cmt_id}});', '', 'ellipsis-h', '', 'sys_cmts_item_manage', 1, 2147483647, 1, 0, 1, 5);

-- comment counters menu
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `active`, `copyable`, `editable`, `order`) VALUES 
('sys_cmts_item_counters', 'system', 'item-vote', '_sys_menu_item_title_system_cmts_item_vote', '', 'javascript:void(0)', '', '', '', '', '', 0, 2147483647, 1, 0, 1, 0),
('sys_cmts_item_counters', 'system', 'item-reaction', '_sys_menu_item_title_system_cmts_item_reaction', '', 'javascript:void(0)', '', '', '', '', '', 0, 2147483647, 0, 0, 1, 1),
('sys_cmts_item_counters', 'system', 'item-score', '_sys_menu_item_title_system_cmts_item_score', '', 'javascript:void(0)', '', '', '', '', '', 0, 2147483647, 0, 0, 1, 2);

-- comment meta info menu
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `active`, `copyable`, `editable`, `order`) VALUES 
('sys_cmts_item_meta', 'system', 'author', '_sys_menu_item_title_system_sm_author', '_sys_menu_item_title_sm_author', '', '', '', '', '', '', 0, 2147483647, 1, 0, 1, 0),
('sys_cmts_item_meta', 'system', 'in-reply-to', '_sys_menu_item_title_system_sm_in_reply_to', '_sys_menu_item_title_sm_in_reply_to', '', '', '', '', '', '', 0, 2147483647, 1, 0, 1, 1),
('sys_cmts_item_meta', 'system', 'date', '_sys_menu_item_title_system_sm_date', '_sys_menu_item_title_sm_date', '', '', '', '', '', '', 0, 2147483647, 1, 0, 1, 2),
('sys_cmts_item_meta', 'system', 'membership', '_sys_menu_item_title_system_sm_membership', '_sys_menu_item_title_sm_membership', '', '', '', '', '', '', 0, 2147483647, 0, 0, 1, 3);

-- social sharing menu
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES
('sys_social_sharing', 'system', 'social-sharing-facebook', '_sys_menu_item_title_system_social_sharing_facebook', '_sys_menu_item_title_social_sharing_facebook', 'https://www.facebook.com/sharer/sharer.php?u={url_encoded}', '', '_blank', 'fab facebook-f', '', 2147483647, 1, 1, 1),
('sys_social_sharing', 'system', 'social-sharing-twitter', '_sys_menu_item_title_system_social_sharing_twitter', '_sys_menu_item_title_social_sharing_twitter', 'https://twitter.com/share?url={url_encoded}', '', '_blank', 'fab twitter', '', 2147483647, 1, 1, 2),
('sys_social_sharing', 'system', 'social-sharing-pinterest', '_sys_menu_item_title_system_social_sharing_pinterest', '_sys_menu_item_title_social_sharing_pinterest', 'http://pinterest.com/pin/create/button/?url={url_encoded}&media={img_url_encoded}&description={title_encoded}', '', '_blank', 'fab pinterest', '', 2147483647, 1, 1, 3),
('sys_social_sharing', 'system', 'social-sharing-linked_in', '_sys_menu_item_title_system_social_sharing_linked_in', '_sys_menu_item_title_social_sharing_linked_in',  'https://www.linkedin.com/shareArticle?mini=true&url={url_encoded}', '', '_blank', 'fab linkedin', '', 2147483647, 1, 1, 4),
('sys_social_sharing', 'system', 'social-sharing-whatsapp', '_sys_menu_item_title_system_social_sharing_whatsapp', '_sys_menu_item_title_social_sharing_whatsapp', 'https://wa.me/?text={url_encoded}', '', '_blank', 'fab whatsapp', '', 2147483647, 1, 1, 5);

-- dashboard manage tools
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `info`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_account_dashboard_manage_tools', 'system', 'cmts-administration', '_sys_menu_item_title_system_cmts_administration', '_sys_menu_item_title_cmts_administration', '', 'page.php?i=cmts-administration', '', '', 'comments', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:27:"get_menu_addon_manage_tools";s:5:"class";s:17:"TemplCmtsServices";}', '', 192, 1, 0, 1),
('sys_account_dashboard_manage_tools', 'system', 'audit-administration', '_sys_menu_item_title_system_audit_administration', '_sys_menu_item_title_audit_administration', '_sys_menu_item_info_audit_administration', 'page.php?i=audit-administration', '', '', 'history', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:27:"get_menu_addon_manage_tools";s:5:"class";s:18:"TemplAuditServices";}', '', 192, 1, 0, 2);

-- dashboard content
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES 
('sys_dashboard_content_manage', 'system', 'cmts', '_sys_menu_item_title_system_cmts_administration', '_sys_menu_item_title_cmts_administration', 'page.php?i=dashboard-content&module=cmts', '', '', '', '', '', 192, 1, 0, 1);

-- profile stats
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES
('sys_profile_stats', 'system', 'profile-stats-profile', '_sys_menu_item_title_system_profile', '_sys_menu_item_title_profile', '{member_url}', '', '', 'user', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:27:"get_menu_addon_profile_edit";s:6:"params";a:0:{}s:5:"class";s:20:"TemplServiceProfiles";}', '', 2147483646, 1, 0, 0),
('sys_profile_stats', 'system', 'friend-suggestions', '_sys_menu_item_title_system_connections', '_sys_menu_item_title_connections', 'page.php?i=friend-suggestions', '', '', 'users', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:31:"get_unconfirmed_connections_num";s:6:"params";a:1:{i:0;s:20:"sys_profiles_friends";}s:5:"class";s:23:"TemplServiceConnections";}', '', 2147483646, 1, 1, 1);

-- wiki menu
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `editable`, `order`) VALUES 
('sys_wiki', 'system', 'edit', '', '_sys_menu_item_title_wiki_edit', '', '', '', 'edit', '', '', 0, 2147483646, '', 1, 0, 1, 1),
('sys_wiki', 'system', 'delete-version', '', '_sys_menu_item_title_wiki_delete_version', '', '', '', 'times', '', '', 0, 2147483646, '', 1, 0, 1, 2),
('sys_wiki', 'system', 'delete-block', '', '_sys_menu_item_title_wiki_delete_block', '', '', '', 'times-circle', '', '', 0, 2147483646, '', 1, 0, 1, 3),
('sys_wiki', 'system', 'translate', '', '_sys_menu_item_title_wiki_translate', '', '', '', 'language', '', '', 0, 2147483646, '', 1, 0, 1, 4),
('sys_wiki', 'system', 'history', '', '_sys_menu_item_title_wiki_history', '', '', '', 'history', '', '', 0, 2147483646, '', 1, 0, 1, 5);

-- favorite list menu
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `submenu_popup`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `editable`, `order`) VALUES 
('sys_favorite_list', 'system', 'edit', '', '_sys_menu_item_title_favorite_list_edit', 'javascript:void(0)', 'javascript:{js_object}.cmtEdit(this, {list_id})', '', 'edit', '', '', 0, 2147483646, '', 1, 0, 1, 1),
('sys_favorite_list', 'system', 'delete', '', '_sys_menu_item_title_wiki_favorite_list_delete', 'javascript:void(0)', 'javascript:{js_object}.cmtDelete(this, {list_id})', '', 'times', '', '', 0, 2147483646, '', 1, 0, 1, 2);

-- connections submenu
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `order`) VALUES
('sys_con_submenu', 'system', 'friends', '', '_sys_menu_item_title_con_friends', 'page.php?i=friends', '', '', 'users', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:21:"profile_friends_count";s:5:"class";s:20:"TemplServiceProfiles";}', '', 2147483647, '', 1, 1, 1),
('sys_con_submenu', 'system', 'friend-suggestions', '', '_sys_menu_item_title_recom_friends', 'page.php?i=friend-suggestions', '', '', 'user-shield', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:36:"profile_recommendation_friends_count";s:5:"class";s:20:"TemplServiceProfiles";}', '', 2147483647, '', 1, 1, 2),
('sys_con_submenu', 'system', 'friend-requests', '', '_sys_menu_item_title_con_friend_requests', 'page.php?i=friend-requests', '', '', 'user-plus', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:30:"profile_friends_requests_count";s:5:"class";s:20:"TemplServiceProfiles";}', '', 2147483647, '', 1, 1, 3),
('sys_con_submenu', 'system', 'sent-friend-requests', '', '_sys_menu_item_title_con_friend_requested', 'page.php?i=sent-friend-requests', '', '', 'user-check', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:35:"profile_sent_friends_requests_count";s:5:"class";s:20:"TemplServiceProfiles";}', '', 2147483647, '', 1, 1, 4),
('sys_con_submenu', 'system', 'follow-suggestions', '', '_sys_menu_item_title_recom_subscriptions', 'page.php?i=follow-suggestions', '', '', 'address-book', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:38:"profile_recommendation_following_count";s:5:"class";s:20:"TemplServiceProfiles";}', '', 2147483647, '', 1, 1, 5),
('sys_con_submenu', 'system', 'followers', '', '_sys_menu_item_title_con_followers', 'page.php?i=followers', '', '', 'users', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:23:"profile_followers_count";s:5:"class";s:20:"TemplServiceProfiles";}', '', 2147483647, '', 1, 1, 6),
('sys_con_submenu', 'system', 'following', '', '_sys_menu_item_title_con_following', 'page.php?i=following', '', '', 'users', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:23:"profile_following_count";s:6:"params";a:2:{i:0;i:0;i:1;b:1;}s:5:"class";s:20:"TemplServiceProfiles";}', '', 2147483647, '', 1, 1, 7);

-- notifiactions submenu
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `order`) VALUES
('sys_ntfs_submenu', 'system', 'context-invitations', '_sys_menu_item_title_system_ntfs_context_invitations', '_sys_menu_item_title_ntfs_context_invitations', 'page.php?i=context-invitations', '', '', 'ticket', '', '', 2147483647, '', 1, 1, 1);

-- studio: account menu
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `editable`, `order`) VALUES
('sys_studio_account_popup', 'system', 'account', '_sys_menu_item_title_system_sa_account', '_sys_menu_item_title_sa_account', '{member_url}', '', '', 'ami-account.svg', '', 2147483647, 1, 0, 0, 1),
('sys_studio_account_popup', 'system', 'site', '_sys_menu_item_title_system_sa_site', '_sys_menu_item_title_sa_site', '{url_root}', '', '', 'ami-site.svg', '', 2147483647, 1, 0, 0, 2),
('sys_studio_account_popup', 'system', 'edit', '_sys_menu_item_title_system_sa_edit', '_sys_menu_item_title_sa_edit', 'javascript:void(0)', '{js_object}.clickEdit(this);', '', 'ami-edit.svg', '', 2147483647, 1, 0, 0, 3),
('sys_studio_account_popup', 'system', 'scheme', '_sys_menu_item_title_system_sa_scheme', '_sys_menu_item_title_sa_scheme', 'javascript:void(0)', 'bx_menu_popup_inline(''#bx-std-pcap-menu-popup-scheme'');', '', 'tmi-scheme-auto.svg', '', 2147483647, 1, 0, 0, 4),
('sys_studio_account_popup', 'system', 'language', '_sys_menu_item_title_system_sa_language', '_sys_menu_item_title_sa_language', 'javascript:void(0)', 'bx_menu_popup(''sys_switch_language_popup'', window);', '', 'ami-language.svg', '', 2147483647, 1, 0, 0, 5),
('sys_studio_account_popup', 'system', 'logout', '_sys_menu_item_title_system_sa_logout', '_sys_menu_item_title_sa_logout', '{url_root}logout.php', '{js_object}.clickLogout(this);', '', 'ami-logout.svg', '', 2147483647, 1, 0, 0, 6);
-- --------------------------------------------------------


CREATE TABLE IF NOT EXISTS `sys_objects_grid` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object` varchar(64) NOT NULL,
  `source_type` enum('Array','Sql') NOT NULL,
  `source` text NOT NULL,
  `table` varchar(255) NOT NULL,
  `field_id` varchar(255) NOT NULL,
  `field_order` varchar(255) NOT NULL,
  `field_active` varchar(255) NOT NULL,
  `order_get_field` varchar(255) NOT NULL DEFAULT 'order_field',
  `order_get_dir` varchar(255) NOT NULL DEFAULT 'order_dir',
  `paginate_url` varchar(255) NOT NULL,
  `paginate_per_page` int(11) NOT NULL DEFAULT '10',
  `paginate_simple` varchar(255) DEFAULT NULL,
  `paginate_get_start` varchar(255) NOT NULL,
  `paginate_get_per_page` varchar(255) NOT NULL,
  `filter_fields` text NOT NULL,
  `filter_fields_translatable` text NOT NULL,
  `filter_mode` enum('like','fulltext','auto') NOT NULL DEFAULT 'auto',
  `filter_get` varchar(255) NOT NULL DEFAULT 'filter',
  `sorting_fields` text NOT NULL,
  `sorting_fields_translatable` text NOT NULL,
  `visible_for_levels` int(11) NOT NULL DEFAULT '2147483647',
  `responsive` tinyint(4) NOT NULL DEFAULT '1',
  `show_total_count` tinyint(4) NOT NULL DEFAULT '0',
  `override_class_name` varchar(255) NOT NULL,
  `override_class_file` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `object` (`object`)
);

-- GRIDS: studio

INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `override_class_name`, `override_class_file`) VALUES
('sys_studio_lang_keys', 'Sql', 'SELECT `tlk`.`ID` AS `id`, `tlk`.`Key` AS `key`, `tlc`.`Name` AS `module`, `tls`.`String` AS `string` FROM `sys_localization_keys` AS `tlk` LEFT JOIN `sys_localization_categories` AS `tlc` ON `tlk`.`IDCategory`=`tlc`.`ID` LEFT JOIN `sys_localization_strings` AS `tls` ON `tlk`.`ID`=`tls`.`IDKey` WHERE `tls`.`IDLanguage`=\'%d\'', 'sys_localization_keys', 'id', '', '', '', 20, NULL, 'start', '', 'key,string', '', 'like', 'key,module,string', '', 'BxTemplStudioPolyglotKeys', ''),
('sys_studio_lang_etemplates', 'Sql', 'SELECT * FROM `sys_email_templates` WHERE 1 ', 'sys_email_templates', 'ID', '', '', '', 20, NULL, 'start', '', 'Module', 'NameSystem,Subject,Body', 'auto', 'Module', 'NameSystem', 'BxTemplStudioPolyglotEtemplates', ''),

('sys_studio_roles', 'Sql', 'SELECT * FROM `sys_std_roles` WHERE 1 ', 'sys_std_roles', 'id', 'order', 'active', '', 100, NULL, 'start', '', 'name', 'title,description', 'auto', '', '', 'BxTemplStudioRolesLevels', ''),
('sys_studio_roles_actions', 'Sql', 'SELECT *, ''0'' AS `active` FROM `sys_std_roles_actions` WHERE 1 ', 'sys_std_roles_actions', 'id', '', 'active', '', 20, NULL, 'start', '', 'name', 'title,description', 'auto', '', '', 'BxTemplStudioRolesActions', ''),

('sys_studio_acl', 'Sql', 'SELECT * FROM `sys_acl_levels` WHERE 1 ', 'sys_acl_levels', 'ID', 'Order', 'Active', '', 100, NULL, 'start', '', 'Description', 'Name', 'auto', '', '', 'BxTemplStudioPermissionsLevels', ''),
('sys_studio_acl_actions', 'Sql', 'SELECT `sys_acl_actions`.*, ''0'' AS `Active` FROM `sys_acl_actions` WHERE 1 ', 'sys_acl_actions', 'ID', '', 'Active', '', 20, NULL, 'start', '', 'Module,Name', 'Title,Desc', 'auto', 'Module,Name', 'Title,Desc', 'BxTemplStudioPermissionsActions', ''),

('sys_studio_nav_menus', 'Sql', 'SELECT `tm`.*, `tms`.`title` AS `set_title`, `tmt`.`title` AS `template_title` FROM `sys_objects_menu` AS `tm` LEFT JOIN `sys_menu_sets` AS `tms` ON `tm`.`set_name`=`tms`.`set_name` LEFT JOIN `sys_menu_templates` AS `tmt` ON `tm`.`template_id`=`tmt`.`id` WHERE 1 ', 'sys_objects_menu', 'id', '', 'active', '', 100, NULL, 'start', '', '', 'tm`.`title,tms`.`title,tmt`.`title', 'auto', '', '', 'BxTemplStudioNavigationMenus', ''),
('sys_studio_nav_sets', 'Sql', 'SELECT * FROM `sys_menu_sets` WHERE 1 ', 'sys_menu_sets', 'set_name', '', '', '', 100, NULL, 'start', '', '', 'title', 'auto', '', '', 'BxTemplStudioNavigationSets', ''),
('sys_studio_nav_items', 'Sql', 'SELECT * FROM `sys_menu_items` WHERE 1 ', 'sys_menu_items', 'id', 'order', 'active', '', 100, NULL, 'start_it', '', 'link', 'title_system', 'like', '', '', 'BxTemplStudioNavigationItems', ''),
('sys_studio_nav_import', 'Sql', 'SELECT * FROM `sys_menu_items` WHERE 1 AND `copyable`=\'1\' ', 'sys_menu_items', 'id', '', '', '', 5, NULL, 'start_im', '', 'link', 'title_system', 'like', '', '', 'BxTemplStudioNavigationImport', ''),

('sys_studio_forms', 'Sql', 'SELECT * FROM `sys_objects_form` WHERE 1 ', 'sys_objects_form', 'id', 'module,title', 'active', '', 100, NULL, 'start', '', 'module', 'title', 'like', 'module', 'title', 'BxTemplStudioFormsForms', ''),
('sys_studio_forms_displays', 'Sql', 'SELECT `td`.`id` AS `id`, `td`.`object` AS `object`, `td`.`display_name` AS `display_name`, `td`.`title` AS `display_title`, `td`.`module` AS `module`, `tf`.`title` AS `form_title` FROM `sys_form_displays` AS `td` LEFT JOIN `sys_objects_form` AS `tf` ON `td`.`object`=`tf`.`object` WHERE 1 ', 'sys_form_displays', 'id', 'module,object,display_title', '', '', 100, NULL, 'start', '', 'td`.`module', 'td`.`title', 'like', 'module', 'display_title,form_title', 'BxTemplStudioFormsDisplays', ''),
('sys_studio_forms_fields', 'Sql', 'SELECT `tdi`.`id` AS `id`, `ti`.`caption_system` AS `caption_system`, `ti`.`caption` AS `caption`, `ti`.`type` AS `type`, `ti`.`module` AS `module`, `tdi`.`visible_for_levels` AS `visible_for_levels`, `tdi`.`active` AS `active`, `ti`.`editable` AS `editable`, `ti`.`deletable` AS `deletable`, `tdi`.`order` AS `order` FROM `sys_form_display_inputs` AS `tdi` LEFT JOIN `sys_form_inputs` AS `ti` ON `tdi`.`input_name`=`ti`.`name` AND `ti`.`object`=? WHERE 1 AND `tdi`.`display_name`=?', 'sys_form_display_inputs', 'id', 'order', 'active', '', 100, NULL, 'start', '', 'ti`.`type', 'ti`.`caption_system', 'like', '', '', 'BxTemplStudioFormsFields', ''),
('sys_studio_forms_pre_lists', 'Sql', 'SELECT * FROM `sys_form_pre_lists` WHERE 1 ', 'sys_form_pre_lists', 'id', '', '', '', 100, NULL, 'start', '', 'module,key', 'title', 'auto', 'module', 'title', 'BxTemplStudioFormsPreLists', ''),
('sys_studio_forms_pre_values', 'Sql', 'SELECT * FROM `sys_form_pre_values` WHERE 1 ', 'sys_form_pre_values', 'id', 'Order', '', '', 1000, NULL, 'start', '', 'Key,Value', 'LKey,LKey2', 'auto', '', '', 'BxTemplStudioFormsPreValues', ''),

('sys_studio_search_forms', 'Sql', 'SELECT * FROM `sys_objects_search_extended` WHERE 1 ', 'sys_objects_search_extended', 'id', 'module,title', 'active', '', 100, NULL, 'start', '', 'module', 'title', 'like', 'module', 'title', 'BxTemplStudioFormsSearchForms', ''),
('sys_studio_search_forms_fields', 'Sql', 'SELECT * FROM `sys_search_extended_fields` WHERE 1 AND `object`=?', 'sys_search_extended_fields', 'id', 'order', 'active', '', 100, NULL, 'start', '', 'type', 'caption', 'like', '', '', 'BxTemplStudioFormsSearchFields', ''),

('sys_studio_search_forms_sortable_fields', 'Sql', 'SELECT * FROM `sys_search_extended_sorting_fields` WHERE 1 AND `object`=?', 'sys_search_extended_sorting_fields', 'id', 'order', 'active', '', 100, NULL, 'start', '', 'type', 'caption', 'like', '', '', 'BxTemplStudioFormsSearchSortableFields', ''),

('sys_studio_labels', 'Sql', 'SELECT * FROM `sys_labels` WHERE 1 ', 'sys_labels', 'id', 'order', '', '', 1000, NULL, 'start', '', 'value', '', 'like', 'value', '', 'BxTemplStudioFormsLabels', ''),
('sys_studio_categories', 'Sql', 'SELECT * FROM `sys_categories` WHERE 1 ', 'sys_categories', 'id', 'added', 'status', '', 20, NULL, 'start', '', 'value', '', 'like', '', '', 'BxTemplStudioFormsCategories', ''),
('sys_studio_groups_roles', 'Sql', 'SELECT * FROM `sys_form_pre_values` WHERE 1 ', 'sys_form_pre_values', 'id', 'Order', '', '', 20, NULL, 'start', '', '', 'LKey', 'like', '', '', 'BxTemplStudioFormsGroupsRoles', ''),

('sys_audit_administration', 'Sql', 'SELECT * FROM `sys_audit` WHERE 1 ', 'sys_audit', 'id', 'added', '', '', 20, NULL, 'start', '', 'value', '', 'like', 'content_module,profile_id,content_id,author_id,context_profile_id,added', 'action_lang_key', 'BxTemplAuditGrid', ''),

('sys_badges_administration', 'Sql', 'SELECT * FROM `sys_badges` WHERE 1 ', 'sys_badges', 'id', 'added', '', '', 20, NULL, 'start', '', 'text', '', 'like', '', '', 'BxTemplStudioBadgesGrid', ''),

('sys_reports_administration', 'Sql', 'WHERE 1 ', '', 'id', 'date', '', '', 20, NULL, 'start', '', 'text,type', '', 'like', '', '', 'BxTemplReportsGrid', '');

CREATE TABLE IF NOT EXISTS `sys_grid_fields` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object` varchar(64) NOT NULL,
  `name` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `width` varchar(16) NOT NULL,
  `translatable` tinyint(4) NOT NULL DEFAULT '0',
  `chars_limit` int(11) NOT NULL DEFAULT '0',
  `params` text NOT NULL,
  `hidden_on` varchar(255) NOT NULL DEFAULT '',
  `order` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `object_name` (`object`(64),`name`(127))
);

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('sys_studio_lang_keys', 'checkbox', 'Select', '1%', 0, '', '', 1),
('sys_studio_lang_keys', 'key', '_adm_pgt_txt_key', '24%', 0, '20', '', 2),
('sys_studio_lang_keys', 'module', '_adm_pgt_txt_module', '15%', 0, '12', '', 3),
('sys_studio_lang_keys', 'string', '_adm_pgt_txt_text', '30%', 0, '30', '', 4),
('sys_studio_lang_keys', 'languages', '_adm_pgt_txt_languages', '10%', 0, '', '', 5),
('sys_studio_lang_keys', 'actions', '', '20%', 0, '', '', 6),

('sys_studio_lang_etemplates', 'NameSystem', '_adm_pgt_txt_etemplates_gl_name_system', '60%', 1, '58', '', 1),
('sys_studio_lang_etemplates', 'Module', '_adm_pgt_txt_etemplates_gl_module', '20%', 0, '18', '', 2),
('sys_studio_lang_etemplates', 'actions', '', '20%', 0, '', '', 3),

('sys_studio_roles', 'order', '', '1%', 0, 0, '', 1),
('sys_studio_roles', 'switcher', '', '5%', 0, 0, '', 2),
('sys_studio_roles', 'title', '_adm_rl_txt_title', '24%', 1, 0, '', 3),
('sys_studio_roles', 'description', '_adm_rl_txt_description', '35%', 1, 32, '', 4),
('sys_studio_roles', 'actions_list', '_adm_rl_txt_actions', '15%', 0, 0, '', 5),
('sys_studio_roles', 'actions', '', '20%', 0, 0, '', 6),

('sys_studio_roles_actions', 'switcher', '', '10%', 0, 0, '', 1),
('sys_studio_roles_actions', 'title', '_adm_rl_txt_title', '40%', 1, 32, '', 2),
('sys_studio_roles_actions', 'description', '_adm_rl_txt_description', '50%', 1, 48, '', 3),

('sys_studio_acl', 'Order', '', '1%', 0, '', '', 1),
('sys_studio_acl', 'switcher', '_adm_prm_txt_enable', '5%', 0, '', '', 2),
('sys_studio_acl', 'Icon', '_adm_prm_txt_icon', '5%', 0, '', '', 3),
('sys_studio_acl', 'Name', '_adm_prm_txt_title', '29%', 1, '15', '', 4),
('sys_studio_acl', 'ActionsList', '_adm_prm_txt_actions', '10%', 0, '', '', 5),
('sys_studio_acl', 'QuotaSize', '_adm_prm_txt_storage', '10%', 0, '', '', 6),
('sys_studio_acl', 'QuotaMaxFileSize', '_adm_prm_txt_max_file_size', '10%', 0, '', '', 7),
('sys_studio_acl', 'QuotaNumber', '_adm_prm_txt_max_files', '10%', 0, '', '', 8),
('sys_studio_acl', 'actions', '', '20%', 0, '', '', 9),

('sys_studio_acl_actions', 'switcher', '_adm_prm_txt_enable', '10%', 0, '', '', 1),
('sys_studio_acl_actions', 'Title', '_adm_prm_txt_title', '25%', 1, '25', '', 2),
('sys_studio_acl_actions', 'Module', '_adm_prm_txt_module', '20%', 0, '18', '', 3),
('sys_studio_acl_actions', 'Desc', '_adm_prm_txt_description', '25%', 0, '25', '', 4),
('sys_studio_acl_actions', 'actions', '', '20%', 0, '', '', 5),

('sys_studio_nav_menus', 'switcher', '', '10%', 0, '', '', 1),
('sys_studio_nav_menus', 'title', '_adm_nav_txt_menus_gl_title', '17%', 0, '15', '', 2),
('sys_studio_nav_menus', 'set_title', '_adm_nav_txt_menus_gl_set_title', '17%', 1, '15', '', 3),
('sys_studio_nav_menus', 'items', '_adm_nav_txt_menus_gl_items', '10%', 0, '8', '', 4),
('sys_studio_nav_menus', 'template_title', '_adm_nav_txt_menus_gl_template_title', '17%', 1, '15', '', 5),
('sys_studio_nav_menus', 'module', '_adm_nav_txt_menus_gl_module', '12%', 0, '10', '', 6),
('sys_studio_nav_menus', 'actions', '', '17%', 0, '', '', 7),

('sys_studio_nav_sets', 'title', '_adm_nav_txt_sets_gl_title', '50%', 1, '48', '', 1),
('sys_studio_nav_sets', 'module', '_adm_nav_txt_sets_gl_module', '15%', 0, '13', '', 2),
('sys_studio_nav_sets', 'items', '_adm_nav_txt_sets_gl_items', '15%', 0, '13', '', 3),
('sys_studio_nav_sets', 'actions', '', '20%', 0, '', '', 4),

('sys_studio_nav_items', 'order', '', '1%', 0, '', '', 1),
('sys_studio_nav_items', 'switcher', '', '9%', 0, '', '', 2),
('sys_studio_nav_items', 'icon', '_adm_nav_txt_items_gl_icon', '5%', 0, '', '', 3),
('sys_studio_nav_items', 'title_system', '_adm_nav_txt_items_gl_title_system', '23%', 1, '23', '', 4),
('sys_studio_nav_items', 'link', '_adm_nav_txt_items_gl_link', '23%', 0, '23', '', 5),
('sys_studio_nav_items', 'module', '_adm_nav_txt_items_gl_module', '12%', 0, '12', '', 6),
('sys_studio_nav_items', 'visible_for_levels', '_adm_nav_txt_items_gl_visible', '10%', 0, '10', '', 7),
('sys_studio_nav_items', 'actions', '', '17%', 0, '', '', 8),

('sys_studio_nav_import', 'icon', '_adm_nav_txt_items_gl_icon', '10%', 0, '', '', 1),
('sys_studio_nav_import', 'title_system', '_adm_nav_txt_items_gl_title_system', '30%', 1, '28', '', 2),
('sys_studio_nav_import', 'link', '_adm_nav_txt_items_gl_link', '25%', 0, '23', '', 3),
('sys_studio_nav_import', 'module', '_adm_nav_txt_items_gl_module', '15%', 0, '13', '', 4),
('sys_studio_nav_import', 'actions', '', '20%', 0, '', '', 5),

('sys_studio_forms', 'switcher', '', '10%', 0, '', '', 1),
('sys_studio_forms', 'title', '_adm_form_txt_forms_gl_title', '40%', 1, '38', '', 2),
('sys_studio_forms', 'module', '_adm_form_txt_forms_gl_module', '15%', 0, '13', '', 3),
('sys_studio_forms', 'displays', '_adm_form_txt_forms_gl_displays', '15%', 0, '13', '', 4),
('sys_studio_forms', 'actions', '', '20%', 0, '', '', 5),

('sys_studio_forms_displays', 'display_title', '_adm_form_txt_displays_gl_title', '30%', 1, '48', '', 1),
('sys_studio_forms_displays', 'module', '_adm_form_txt_displays_gl_module', '13%', 0, '11', '', 2),
('sys_studio_forms_displays', 'form_title', '_adm_form_txt_displays_gl_form', '24%', 1, '22', '', 3),
('sys_studio_forms_displays', 'fields', '_adm_form_txt_displays_gl_fields', '13%', 0, '11', '', 4),
('sys_studio_forms_displays', 'actions', '', '20%', 0, '', '', 5),

('sys_studio_forms_fields', 'order', '', '1%', 0, '', '', 1),
('sys_studio_forms_fields', 'switcher', '', '9%', 0, '', '', 2),
('sys_studio_forms_fields', 'type', '_adm_form_txt_fields_type', '5%', 0, '', '', 3),
('sys_studio_forms_fields', 'caption_system', '_adm_form_txt_fields_caption_system', '40%', 1, '38', '', 4),
('sys_studio_forms_fields', 'module', '_adm_form_txt_fields_module', '15%', 0, '13', '', 5),
('sys_studio_forms_fields', 'visible_for_levels', '_adm_form_txt_fields_visible', '10%', 0, '10', '', 6),
('sys_studio_forms_fields', 'actions', '', '20%', 0, '', '', 7),

('sys_studio_forms_pre_lists', 'title', '_adm_form_txt_pre_lists_gl_title', '45%', 1, '50', '', 1),
('sys_studio_forms_pre_lists', 'values', '_adm_form_txt_pre_lists_gl_values', '12%', 0, '10', '', 2),
('sys_studio_forms_pre_lists', 'module', '_adm_form_txt_pre_lists_gl_module', '13%', 0, '11', '', 3),
('sys_studio_forms_pre_lists', 'use_for_sets', '_adm_form_txt_pre_lists_gl_use_for_sets', '10%', 0, '8', '', 4),
('sys_studio_forms_pre_lists', 'actions', '', '20%', 0, '', '', 5),
('sys_studio_forms_pre_values', 'checkbox', '', '1%', 0, '', '', 1),
('sys_studio_forms_pre_values', 'order', '', '1%', 0, '', '', 2),
('sys_studio_forms_pre_values', 'LKey', '_adm_form_txt_pre_values_gl_lkey', '78%', 1, '75', '', 3),
('sys_studio_forms_pre_values', 'actions', '', '20%', 0, '', '', 4),

('sys_studio_search_forms', 'switcher', '', '10%', 0, '', '', 1),
('sys_studio_search_forms', 'title', '_adm_form_txt_search_forms_title', '35%', 1, '38', '', 2),
('sys_studio_search_forms', 'module', '_adm_form_txt_search_forms_module', '15%', 0, '13', '', 3),
('sys_studio_search_forms', 'fields', '_adm_form_txt_search_forms_fields', '10%', 0, '13', '', 4),
('sys_studio_search_forms', 'sortable_fields', '_adm_form_txt_search_forms_sortable_fields', '10%', 0, '13', '', 5),
('sys_studio_search_forms', 'actions', '', '20%', 0, '', '', 6),

('sys_studio_search_forms_fields', 'order', '', '1%', 0, '', '', 1),
('sys_studio_search_forms_fields', 'switcher', '', '9%', 0, '', '', 2),
('sys_studio_search_forms_fields', 'type', '_adm_form_txt_search_forms_fields_type', '15%', 0, '', '', 3),
('sys_studio_search_forms_fields', 'caption', '_adm_form_txt_search_forms_fields_caption', '40%', 1, '38', '', 4),
('sys_studio_search_forms_fields', 'search_type', '_adm_form_txt_search_forms_fields_search_type', '15%', 0, '', '', 5),
('sys_studio_search_forms_fields', 'actions', '', '20%', 0, '', '', 6),

('sys_studio_search_forms_sortable_fields', 'order', '', '1%', 0, '', '', 1),
('sys_studio_search_forms_sortable_fields', 'switcher', '', '9%', 0, '', '', 2),
('sys_studio_search_forms_sortable_fields', 'caption', '_adm_form_txt_search_forms_sortable_fields_caption', '50%', 1, '38', '', 3),
('sys_studio_search_forms_sortable_fields', 'direction', '_adm_form_txt_search_forms_sortable_fields_direction', '40%', 0, '', '', 4),

('sys_studio_labels', 'order', '', '1%', 0, 0, '', 1),
('sys_studio_labels', 'value', '_adm_form_txt_labels_value', '70%', 0, 38, '', 2),
('sys_studio_labels', 'items', '_adm_form_txt_labels_items', '10%', 0, 0, '', 3),
('sys_studio_labels', 'actions', '', '19%', 0, 0, '', 4),

('sys_studio_categories', 'checkbox', '_sys_select', '2%', 0, 0, '', 1),
('sys_studio_categories', 'switcher', '_adm_prm_txt_enable', '8%', 0, 0, '', 2),
('sys_studio_categories', 'value', '_adm_form_txt_categories_value', '25%', 0, 35, '', 3),
('sys_studio_categories', 'module', '_adm_form_txt_categories_module', '15%', 0, 35, '', 4),
('sys_studio_categories', 'author', '_adm_form_txt_categories_author', '15%', 0, 35, '', 5),
('sys_studio_categories', 'added', '_adm_form_txt_categories_added', '15%', 1, 25, '', 6),
('sys_studio_categories', 'actions', '', '20%', 0, 0, '', 7),

('sys_studio_groups_roles', 'order', '', '2%', 0, 0, '', 1),
('sys_studio_groups_roles', 'LKey', '_adm_rl_txt_title', '40%', 1, 0, '', 2),
('sys_studio_groups_roles', 'actions_list', '_adm_rl_txt_actions', '10%', 0, 35, '', 3),
('sys_studio_groups_roles', 'actions', '', '48%', 0, 0, '', 4),

('sys_audit_administration', 'added', '_adm_form_txt_audit_added', '15%', 1, 25, '', 1),
('sys_audit_administration', 'profile_id', '_adm_form_txt_audit_profile', '15%', 1, 25, '', 2),
('sys_audit_administration', 'content_id', '_adm_form_txt_audit_content', '20%', 1, 25, '', 3),
('sys_audit_administration', 'author_id', '_adm_form_txt_audit_author_content', '10%', 1, 25, '', 4),
('sys_audit_administration', 'content_module', '_adm_form_txt_audit_module', '10%', 1, 25, '', 5),
('sys_audit_administration', 'context_profile_id', '_adm_pgt_txt_audit_context', '15%', 1, 25, '', 6),
('sys_audit_administration', 'action_lang_key', '_adm_pgt_txt_audit_action', '15%', 1, 25, '', 7),

('sys_badges_administration', 'checkbox', '_sys_select', '2%', 0, 0, '', 1),
('sys_badges_administration', 'view', '_adm_form_txt_badges_view', '15%', 1, 0, '', 2),
('sys_badges_administration', 'module', '_adm_form_txt_badges_module', '15%', 1, 25, '', 3),
('sys_badges_administration', 'text', '_adm_pgt_txt_badges_text', '28%', 1, 35, '', 4),
('sys_badges_administration', 'icon', '_adm_pgt_txt_badges_icon', '20%', 1, 0, '', 5),
('sys_badges_administration', 'actions', '', '20%', 0, 0, '', 6),

('sys_reports_administration', 'object', '_adm_form_txt_reports_object', '10%', 1, 25, '', 1),
('sys_reports_administration', 'author', '_adm_form_txt_reports_author', '10%', 1, 25, '', 2),
('sys_reports_administration', 'type', '_adm_form_txt_reports_type', '10%', 1, 25, '', 3),
('sys_reports_administration', 'text', '_adm_form_txt_reports_text', '10%', 1, 25, '', 4),
('sys_reports_administration', 'date', '_adm_form_txt_reports_date', '10%', 1, 25, '', 5),
('sys_reports_administration', 'status', '_adm_form_txt_reports_status', '10%', 1, 25, '', 6),
('sys_reports_administration', 'checked_by', '_adm_form_txt_reports_checked_by', '10%', 1, 25, '', 7),
('sys_reports_administration', 'notes', '_adm_form_txt_reports_notes', '10%', 1, 25, '', 8),
('sys_reports_administration', 'comments', '_adm_form_txt_reports_comments', '10%', 1, 25, '', 8),
('sys_reports_administration', 'actions', '', '10%', 0, '', '', 9);



CREATE TABLE IF NOT EXISTS `sys_grid_actions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object` varchar(64) NOT NULL,
  `type` enum('bulk','single','independent') NOT NULL,
  `name` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `icon` text NOT NULL,
  `icon_only` tinyint(4) NOT NULL DEFAULT '0',
  `confirm` tinyint(4) NOT NULL DEFAULT '1',
  `active` tinyint(4) NOT NULL DEFAULT '1',
  `order` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `object_name_type` (`object`(64),`type`,`name`(123))
);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `confirm`, `order`) VALUES
('sys_studio_lang_keys', 'bulk', 'delete', '_adm_pgt_btn_delete', '', 1, 1),
('sys_studio_lang_keys', 'single', 'edit', '', 'pencil-alt', 0, 1),
('sys_studio_lang_keys', 'single', 'delete', '', 'remove', 1, 2),
('sys_studio_lang_keys', 'independent', 'add', '_adm_pgt_btn_add_new_key', '', 0, 1),

('sys_studio_lang_etemplates', 'single', 'edit', '', 'pencil-alt', 0, 1),

('sys_studio_acl', 'independent', 'add', '_adm_prm_btn_add_level', '', 0, 1),
('sys_studio_acl', 'single', 'edit', '', 'pencil-alt', 0, 1),
('sys_studio_acl', 'single', 'delete', '', 'remove', 1, 2),

('sys_studio_acl_actions', 'single', 'options', '', 'cog', 0, 1),

('sys_studio_nav_menus', 'independent', 'add', '_adm_nav_btn_menus_create', '', 0, 1),
('sys_studio_nav_menus', 'single', 'edit', '', 'pencil-alt', 0, 1),
('sys_studio_nav_menus', 'single', 'delete', '', 'remove', 1, 2),

('sys_studio_nav_sets', 'independent', 'add', '_adm_nav_btn_sets_create', '', 0, 1),
('sys_studio_nav_sets', 'single', 'edit', '', 'pencil-alt', 0, 1),
('sys_studio_nav_sets', 'single', 'delete', '', 'remove', 1, 2),

('sys_studio_nav_items', 'independent', 'import', '_adm_nav_btn_items_gl_import', '', 0, 1),
('sys_studio_nav_items', 'independent', 'add', '_adm_nav_btn_items_gl_create', '', 0, 2),
('sys_studio_nav_items', 'single', 'edit', '', 'pencil-alt', 0, 1),
('sys_studio_nav_items', 'single', 'delete', '', 'remove', 1, 2),
('sys_studio_nav_items', 'single', 'show_to', '_adm_nav_btn_items_gl_visible', '', 0, 3),

('sys_studio_nav_import', 'single', 'import', '', 'plus', 0, 1),
('sys_studio_nav_import', 'bulk', 'done', '_adm_nav_btn_items_done', '', 0, 1),

('sys_studio_forms', 'single', 'edit', '', 'pencil-alt', 0, 1),

('sys_studio_forms_displays', 'single', 'edit', '', 'pencil-alt', 0, 1),

('sys_studio_forms_fields', 'single', 'edit', '', 'pencil-alt', 0, 1),
('sys_studio_forms_fields', 'single', 'delete', '', 'remove', 1, 2),
('sys_studio_forms_fields', 'single', 'show_to', '_adm_form_btn_fields_visible', '', 0, 3),
('sys_studio_forms_fields', 'independent', 'add', '_adm_form_btn_fields_create', '', 0, 1),

('sys_studio_forms_pre_lists', 'independent', 'add', '_adm_form_btn_pre_lists_create', '', 0, 1),
('sys_studio_forms_pre_lists', 'single', 'edit', '', 'pencil-alt', 0, 1),
('sys_studio_forms_pre_lists', 'single', 'delete', '', 'remove', 1, 2),

('sys_studio_forms_pre_values', 'independent', 'add', '_adm_form_btn_pre_values_create', '', 0, 1),
('sys_studio_forms_pre_values', 'single', 'edit', '', 'pencil-alt', 0, 1),
('sys_studio_forms_pre_values', 'single', 'delete', '', 'remove', 1, 2),
('sys_studio_forms_pre_values', 'bulk', 'delete', '_adm_form_btn_pre_values_delete', '', 1, 1),

('sys_studio_search_forms', 'single', 'edit', '', 'pencil-alt', 0, 1),

('sys_studio_search_forms_fields', 'single', 'edit', '', 'pencil-alt', 0, 1),
('sys_studio_search_forms_fields', 'independent', 'reset', '_adm_form_btn_search_forms_fields_reset', '', 0, 1),

('sys_studio_search_forms_sortable_fields', 'independent', 'reset', '_adm_form_btn_search_forms_sortable_fields_reset', '', 0, 1),

('sys_studio_labels', 'independent', 'back', '_adm_form_btn_labels_back', '', 0, 1),
('sys_studio_labels', 'independent', 'add', '_adm_form_btn_labels_add', '', 0, 2),
('sys_studio_labels', 'single', 'edit', '', 'pencil-alt', 0, 1),
('sys_studio_labels', 'single', 'delete', '', 'remove', 1, 2),

('sys_studio_categories', 'bulk', 'delete', '_adm_form_btn_categories_delete', '', 1, 1),
('sys_studio_categories', 'single', 'edit', '', 'pencil-alt', 0, 1),
('sys_studio_categories', 'single', 'delete', '', 'remove', 1, 2),
('sys_studio_categories', 'independent', 'add', '_adm_form_btn_categories_add', '', 0, 1),

('sys_studio_groups_roles', 'independent', 'add', '_adm_rl_btn_role_add', '', 0, 1),
('sys_studio_groups_roles', 'single', 'edit', '_adm_rl_btn_role_edit', 'pencil-alt', 0, 1),
('sys_studio_groups_roles', 'single', 'delete', '_adm_rl_btn_role_delete', 'remove', 1, 3),

('sys_badges_administration', 'bulk', 'delete', '_adm_form_btn_badges_delete', '', 1, 1),
('sys_badges_administration', 'single', 'edit', '', 'pencil-alt', 0, 1),
('sys_badges_administration', 'single', 'delete', '', 'remove', 1, 2),
('sys_badges_administration', 'single', 'delete_icon', '', '', 1, 3),
('sys_badges_administration', 'independent', 'add', '_adm_form_btn_badges_add', '', 0, 1);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `confirm`, `order`, `icon_only`) VALUES
('sys_reports_administration', 'single', 'check_in', '_adm_form_btn_reports_check_in', 'lock-open', 0, 1, 1),
('sys_reports_administration', 'single', 'check_out', '_adm_form_btn_reports_check_out', 'lock', 0, 2, 1),
('sys_reports_administration', 'single', 'audit', '_adm_form_btn_reports_audit', 'history', 0, 3, 1);


INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('sys_studio_roles', 'independent', 'add', '_adm_rl_btn_role_add', '', 0, 0, 1),
('sys_studio_roles', 'single', 'edit', '_adm_rl_btn_role_edit', 'pencil-alt', 1, 0, 1),
('sys_studio_roles', 'single', 'delete', '_adm_rl_btn_role_delete', 'remove', 1, 1, 2);

-- GRIDS: moderation tools
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('sys_cmts_administration', 'Sql', '', 'sys_cmts_ids', 'cmt_id', 'cmt_time', 'status_admin', '', 20, NULL, 'start', '', 'cmt_text,email', '', 'like', 'reports', '', 192, 'BxTemplCmtsGridAdministration', '');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('sys_cmts_administration', 'checkbox', '_sys_select', '2%', 0, '0', '', 1),
('sys_cmts_administration', 'switcher', '_sys_cmts_administration_grid_column_title_adm_active', '8%', 0, '', '', 2),
('sys_cmts_administration', 'reports', '_sys_txt_reports_title', '5%', 0, '0', '', 3),
('sys_cmts_administration', 'cmt_module', '_sys_cmts_administration_grid_column_title_adm_cmt_module', '10%', 0, '25', '', 4),
('sys_cmts_administration', 'cmt_text', '_sys_cmts_administration_grid_column_title_adm_cmt_text', '30%', 0, '25', '', 5),
('sys_cmts_administration', 'cmt_time', '_sys_cmts_administration_grid_column_title_adm_cmt_time', '10%', 1, '25', '', 6),
('sys_cmts_administration', 'cmt_author_id', '_sys_cmts_administration_grid_column_title_adm_cmt_author_id', '15%', 0, '25', '', 7),
('sys_cmts_administration', 'actions', '', '20%', 0, '', '', 8);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('sys_cmts_administration', 'bulk', 'delete', '_sys_cmts_administration_grid_action_title_adm_delete', '', 0, 1, 1),
('sys_cmts_administration', 'single', 'delete', '_sys_cmts_administration_grid_action_title_adm_delete', 'remove', 1, 1, 1);


-- GRID: Storage managers
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `override_class_name`, `override_class_file`) VALUES
('sys_studio_strg_files', 'Sql', 'SELECT * FROM `sys_files` WHERE 1 ', 'sys_files', 'id', '', '', '', 20, NULL, 'start', '', 'file_name,mime_type', '', 'auto', 'file_name,added', '', 'BxTemplStudioStoragesFiles', ''),
('sys_studio_strg_images', 'Sql', 'SELECT * FROM `sys_images` WHERE 1 ', 'sys_images', 'id', '', '', '', 20, NULL, 'start', '', 'file_name', '', 'auto', 'file_name,added', '', 'BxTemplStudioStoragesImages', '');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
-- Storages: Files
('sys_studio_strg_files', 'checkbox', '', '1%', 0, '', '', 1),
('sys_studio_strg_files', 'file_name', '_adm_strg_txt_file_name', '24%', 0, '25', '', 2),
('sys_studio_strg_files', 'path', '_adm_strg_txt_path', '25%', 0, '', '', 3),
('sys_studio_strg_files', 'mime_type', '_adm_strg_txt_mime_type', '15%', 0, '15', '', 4),
('sys_studio_strg_files', 'added', '_adm_strg_txt_added', '10%', 0, '10', '', 5),
('sys_studio_strg_files', 'actions', '', '25%', 0, '', '', 6),

-- Storages: Images
('sys_studio_strg_images', 'checkbox', '', '1%', 0, '', '', 1),
('sys_studio_strg_images', 'file_name', '_adm_strg_txt_file_name', '24%', 0, '25', '', 2),
('sys_studio_strg_images', 'path', '_adm_strg_txt_path', '25%', 0, '', '', 3),
('sys_studio_strg_images', 'mime_type', '_adm_strg_txt_mime_type', '15%', 0, '15', '', 4),
('sys_studio_strg_images', 'added', '_adm_strg_txt_added', '10%', 0, '10', '', 5),
('sys_studio_strg_images', 'actions', '', '25%', 0, '', '', 6);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
-- Storages: Files
('sys_studio_strg_files', 'bulk', 'delete', '_adm_strg_btn_delete', '', 0, 1, 1),
('sys_studio_strg_files', 'single', 'download', '_adm_strg_btn_download', 'download', 1, 0, 1),
('sys_studio_strg_files', 'single', 'delete', '_adm_strg_btn_delete', 'remove', 1, 1, 2),
('sys_studio_strg_files', 'independent', 'add', '_adm_strg_btn_add', '', 0, 0, 1),

-- Storages: Images
('sys_studio_strg_images', 'bulk', 'delete', '_adm_strg_btn_delete', '', 0, 1, 1),
('sys_studio_strg_images', 'single', 'download', '_adm_strg_btn_download', 'download', 1, 0, 1),
('sys_studio_strg_images', 'single', 'resize', '_adm_strg_btn_resize', 'compress', 1, 0, 2),
('sys_studio_strg_images', 'single', 'delete', '_adm_strg_btn_delete', 'remove', 1, 1, 3),
('sys_studio_strg_images', 'independent', 'add', '_adm_strg_btn_add', '', 0, 0, 1);


-- GRID: connections
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `responsive`, `override_class_name`, `override_class_file`) VALUES
('sys_grid_connections', 'Sql', 'SELECT `p`.`id`, `c`.`added`, `c`.`mutual` FROM `sys_profiles` AS `p` INNER JOIN `sys_accounts` AS `a` ON (`a`.`id` = `p`.`account_id`) {join_connections}', 'sys_profiles', 'id', 'c`.`added', '', '', 10, NULL, 'start', '', 'name,email', '', 'auto', '', '', 2147483647, 0, 'BxDolGridConnections', ''),
('sys_grid_connections_requests', 'Sql', 'SELECT `p`.`id`, `c`.`added`, `c`.`mutual` FROM `sys_profiles` AS `p` INNER JOIN `sys_accounts` AS `a` ON (`a`.`id` = `p`.`account_id`) {join_connections}', 'sys_profiles', 'id', 'c`.`added', '', '', 10, NULL, 'start', '', 'name,email', '', 'auto', '', '', 2147483647, 0, 'BxDolGridConnectionsRequests', ''),

('sys_grid_subscriptions', 'Sql', 'SELECT `p`.`id`, `c`.`added` FROM `sys_profiles` AS `p` INNER JOIN `sys_accounts` AS `a` ON (`a`.`id` = `p`.`account_id`) {join_connections}', 'sys_profiles', 'id', 'c`.`added', '', '', 10, NULL, 'start', '', 'name,email', '', 'auto', '', '', 2147483647, 0, 'BxDolGridSubscriptions', ''),
('sys_grid_subscribed_me', 'Sql', 'SELECT `p`.`id`, `c`.`added` FROM `sys_profiles` AS `p` INNER JOIN `sys_accounts` AS `a` ON (`a`.`id` = `p`.`account_id`) {join_connections}', 'sys_profiles', 'id', 'c`.`added', '', '', 10, NULL, 'start', '', 'name,email', '', 'auto', '', '', 2147483647, 0, 'BxDolGridSubscribedMe', ''),

('sys_grid_relations', 'Sql', 'SELECT `p`.`id`, `c`.`relation`, `c`.`mutual`, `c`.`added` FROM `sys_profiles` AS `p` INNER JOIN `sys_accounts` AS `a` ON (`a`.`id` = `p`.`account_id`) {join_connections}', 'sys_profiles', 'id', 'c`.`added', '', '', 10, NULL, 'start', '', 'name,email', '', 'auto', '', '', 2147483647, 1, 'BxDolGridRelations', ''),
('sys_grid_related_me', 'Sql', 'SELECT `p`.`id`, `c`.`relation`, `c`.`mutual`, `c`.`added` FROM `sys_profiles` AS `p` INNER JOIN `sys_accounts` AS `a` ON (`a`.`id` = `p`.`account_id`) {join_connections}', 'sys_profiles', 'id', 'c`.`added', '', '', 10, NULL, 'start', '', 'name,email', '', 'auto', '', '', 2147483647, 1, 'BxDolGridRelatedMe', '');


INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `params`, `hidden_on`, `order`) VALUES
('sys_grid_connections', 'name', '_sys_name', '40%', '', '', 1),
('sys_grid_connections', 'info', '', '30%', '', '1', 2),
('sys_grid_connections', 'actions', '', '30%', '', '', 3),

('sys_grid_connections_requests', 'name', '_sys_name', '40%', '', '', 1),
('sys_grid_connections_requests', 'info', '', '30%', '', '1', 2),
('sys_grid_connections_requests', 'actions', '', '30%', '', '', 3),

('sys_grid_subscriptions', 'name', '_sys_name', '70%', '', '', 1),
('sys_grid_subscriptions', 'actions', '', '30%', '', '', 2),

('sys_grid_subscribed_me', 'name', '_sys_name', '70%', '', '', 1),
('sys_grid_subscribed_me', 'actions', '', '30%', '', '', 2),

('sys_grid_relations', 'name', '_sys_name', '40%', '', '', 1),
('sys_grid_relations', 'relation', '_sys_relation', '15%', '', '', 2),
('sys_grid_relations', 'mutual', '_sys_status', '15%', '', '', 3),
('sys_grid_relations', 'actions', '', '30%', '', '', 4),

('sys_grid_related_me', 'name', '_sys_name', '40%', '', '', 1),
('sys_grid_related_me', 'relation', '_sys_relation', '15%', '', '', 2),
('sys_grid_related_me', 'mutual', '_sys_status', '15%', '', '', 3),
('sys_grid_related_me', 'actions', '', '30%', '', '', 4);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('sys_grid_connections', 'single', 'accept', '_sys_accept', '', 0, 0, 1),
('sys_grid_connections', 'single', 'delete', '', 'remove', 0, 1, 2),
('sys_grid_connections', 'single', 'add_friend', '_sys_add_friend', 'plus', 0, 0, 3),

('sys_grid_connections_requests', 'single', 'accept', '_sys_accept', '', 0, 0, 1),
('sys_grid_connections_requests', 'single', 'delete', '', 'remove', 0, 1, 2),

('sys_grid_subscriptions', 'single', 'subscribe', '_sys_subscribe', 'check', 0, 0, 1),
('sys_grid_subscriptions', 'single', 'delete', '', 'remove', 0, 1, 2),

('sys_grid_subscribed_me', 'single', 'subscribe', '_sys_subscribe', 'check', 0, 0, 1),

('sys_grid_relations', 'single', 'delete', '_Delete', 'remove', 1, 1, 1),

('sys_grid_related_me', 'single', 'confirm', '_sys_confirm', 'check-circle', 1, 0, 1),
('sys_grid_related_me', 'single', 'decline', '_sys_decline', 'times-circle', 1, 1, 2),
('sys_grid_related_me', 'single', 'add', '_sys_add_relation', 'plus-circle', 1, 0, 3),
('sys_grid_related_me', 'single', 'delete', '_Delete', 'remove', 1, 1, 4);

-- GRID: queues
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `order_get_field`, `order_get_dir`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `filter_get`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `responsive`, `show_total_count`, `override_class_name`, `override_class_file`) VALUES
('sys_queues', 'Array', '', '', 'id', '', '', 'order_field', 'order_dir', '', 10, NULL, 'start', '', '', '', 'auto', 'filter', '', '', 128, 0, 0, 'BxDolGridQueues', '');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `hidden_on`, `order`) VALUES
('sys_queues', 'name', '_Name', '40%', 1, 0, '', '', 1),
('sys_queues', 'all', '_all', '20%', 0, 0, '', '', 2),
('sys_queues', 'failed', '_Failed', '20%', 0, 0, '', '', 3),
('sys_queues', 'actions', '', '20%', 0, 0, '', '', 4);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('sys_queues', 'single', 'clear', '', 'eraser', 0, 1, 1);

-- GRID: API Origins

INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `override_class_name`, `override_class_file`) VALUES
('sys_studio_api_origins', 'Sql', 'SELECT * FROM `sys_api_origins` WHERE 1 ', 'sys_api_origins', 'id', 'order', '', '', 20, NULL, 'start', '', 'url', '', 'like', '', '', 'BxDolStudioApiOrigins', '');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `hidden_on`, `order`) VALUES
('sys_studio_api_origins', 'order', '', '1%', 0, 0, '', '', 1),
('sys_studio_api_origins', 'url', '_sys_txt_url', '80%', 0, 0, '', '', 2),
('sys_studio_api_origins', 'actions', '', '19%', 0, 0, '', '', 3);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('sys_studio_api_origins', 'single', 'delete', '_Delete', 'remove', 1, 1, 1),
('sys_studio_api_origins', 'independent', 'add', '_adm_form_btn_field_add', '', 0, 0, 1);

-- GRID: API Keys

INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `override_class_name`, `override_class_file`) VALUES
('sys_studio_api_keys', 'Sql', 'SELECT * FROM `sys_api_keys` WHERE 1 ', 'sys_api_keys', 'id', 'order', '', '', 20, NULL, 'start', '', 'key,title', '', 'like', '', '', 'BxDolStudioApiKeys', '');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `hidden_on`, `order`) VALUES
('sys_studio_api_keys', 'order', '', '1%', 0, 0, '', '', 1),
('sys_studio_api_keys', 'title', '_Name', '40%', 0, 0, '', '', 2),
('sys_studio_api_keys', 'key', '_sys_txt_api_key', '40%', 0, 0, '', '', 3),
('sys_studio_api_keys', 'actions', '', '19%', 0, 0, '', '', 4);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('sys_studio_api_keys', 'single', 'delete', '_Delete', 'remove', 1, 1, 1),
('sys_studio_api_keys', 'independent', 'add', '_adm_form_btn_field_add', '', 0, 0, 1);

-- GRID: API Configs

INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `override_class_name`, `override_class_file`) VALUES
('sys_studio_api_configs', 'Sql', 'SELECT * FROM `sys_modules` WHERE 1 ', 'sys_modules', 'id', 'name', '', '', 100, NULL, 'start', '', 'name,title,vendor', '', 'like', '', '', 'BxTemplStudioApiConfigs', '');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `hidden_on`, `order`) VALUES
('sys_studio_api_configs', 'title', '_adm_api_ttl_module', '20%', 0, 0, '', '', 1),
('sys_studio_api_configs', 'actions', '', '80%', 0, 0, '', '', 2);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('sys_studio_api_configs', 'single', 'apply', '_adm_api_btn_apply', 'recycle', 1, 1, 1),
('sys_studio_api_configs', 'single', 'remove', '_adm_api_btn_remove', 'eraser', 1, 1, 2),
('sys_studio_api_configs', 'single', 'export', '_adm_api_btn_export', 'file-export', 1, 0, 3),
-- ('sys_studio_api_configs', 'single', 'import', '_adm_api_btn_import', 'file-import', 1, 1, 4),
('sys_studio_api_configs', 'independent', 'apply_all', '_adm_api_btn_apply_all', '', 0, 1, 1),
('sys_studio_api_configs', 'independent', 'remove_all', '_adm_api_btn_remove_all', '', 0, 1, 2),
('sys_studio_api_configs', 'independent', 'export_all', '_adm_api_btn_export_all', '', 0, 0, 3),
('sys_studio_api_configs', 'independent', 'import_all', '_adm_api_btn_import_all', '', 0, 0, 4);

-- GRID: Agents Models
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `responsive`, `show_total_count`, `override_class_name`, `override_class_file`) VALUES
('sys_studio_agents_models', 'Sql', 'SELECT * FROM `sys_agents_models` WHERE 1 ', 'sys_agents_models', 'id', 'changed', 'active', '', 20, NULL, 'start', '', 'type,model,title,capabilities', '', 'like', 'type,model,title,capabilities', '', 128, 1, 1, 'BxTemplStudioAgentsModels', '');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `hidden_on`, `order`) VALUES
('sys_studio_agents_models', 'checkbox', '', '2%', 0, 0, '', '', 10),
('sys_studio_agents_models', 'switcher', '_sys_agents_models_txt_active', '8%', 0, 0, '', '', 20),
('sys_studio_agents_models', 'icon', '_adm_form_txt_field_icon', '5%', 0, 0, '', '', 25),
('sys_studio_agents_models', 'type', '_sys_agents_automators_txt_type', '10%', 0, 0, '', '', 30),
('sys_studio_agents_models', 'title', '_sys_agents_models_txt_title', '10%', 0, 0, '', '', 40),
('sys_studio_agents_models', 'model', '_sys_agents_models_txt_model', '10%', 0, 0, '', '', 50),
('sys_studio_agents_models', 'capabilities', '_sys_agents_models_txt_capabilities', '10%', 0, 0, '', '', 60),
('sys_studio_agents_models', 'actions', '', '45%', 0, 0, '', '', 70);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `active`, `order`) VALUES
('sys_studio_agents_models', 'single', 'duplicate', '_Duplicate', 'copy', 1, 0, 1, 1),
('sys_studio_agents_models', 'single', 'edit', '_Edit', 'pencil-alt', 1, 0, 1, 2),
('sys_studio_agents_models', 'single', 'delete', '_Delete', 'remove', 1, 1, 1, 3),
('sys_studio_agents_models', 'bulk', 'delete', '_Delete', '', 0, 1, 1, 1);

-- GRID: Agents Assistants
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `responsive`, `show_total_count`, `override_class_name`, `override_class_file`) VALUES
('sys_studio_agents_assistants', 'Sql', 'SELECT * FROM `sys_agents_assistants` WHERE 1 ', 'sys_agents_assistants', 'id', 'added', 'active', '', 20, NULL, 'start', '', '', '', 'like', '', '', 2147483647, 1, 1, 'BxTemplStudioAgentsAssistants', '');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `hidden_on`, `order`) VALUES
('sys_studio_agents_assistants', 'checkbox', '', '2%', 0, 0, '', '', 1),
('sys_studio_agents_assistants', 'switcher', '_sys_agents_assistants_txt_active', '8%', 0, 0, '', '', 2),
('sys_studio_agents_assistants', 'name', '_sys_agents_assistants_txt_name', '15%', 0, 0, '', '', 3),
('sys_studio_agents_assistants', 'model_id', '_sys_agents_assistants_txt_model_id', '10%', 0, 0, '', '', 5),
('sys_studio_agents_assistants', 'profile_id', '_sys_agents_assistants_txt_profile_id', '10%', 0, 0, '', '', 6),
('sys_studio_agents_assistants', 'prompt', '_sys_agents_assistants_txt_prompt', '25%', 0, 32, '', '', 7),
('sys_studio_agents_assistants', 'added', '_sys_agents_assistants_txt_added', '10%', 0, 0, '', '', 8),
('sys_studio_agents_assistants', 'actions', '', '20%', 0, 0, '', '', 9);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `active`, `order`) VALUES
('sys_studio_agents_assistants', 'independent', 'add', '_sys_agents_assistants_btn_add', '', 0, 0, 1, 1),
('sys_studio_agents_assistants', 'single', 'chats', '_sys_agents_assistants_btn_chats', 'comments', 1, 0, 1, 1),
('sys_studio_agents_assistants', 'single', 'files', '_sys_agents_assistants_btn_files', 'folder', 1, 0, 1, 2),
('sys_studio_agents_assistants', 'single', 'codes', '_sys_agents_assistants_btn_codes', 'code', 1, 0, 1, 3),
('sys_studio_agents_assistants', 'single', 'edit', '_Edit', 'pencil-alt', 1, 0, 1, 4),
('sys_studio_agents_assistants', 'single', 'delete', '_Delete', 'remove', 1, 1, 1, 5),
('sys_studio_agents_assistants', 'bulk', 'delete', '_Delete', '', 0, 1, 1, 1);

-- GRID: Agents Assistants Chats
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `responsive`, `show_total_count`, `override_class_name`, `override_class_file`) VALUES
('sys_studio_agents_assistants_chats', 'Sql', 'SELECT * FROM `sys_agents_assistants_chats` WHERE 1 ', 'sys_agents_assistants_chats', 'id', 'added', '', '', 20, NULL, 'start', '', '', '', 'like', '', '', 2147483647, 1, 1, 'BxTemplStudioAgentsAsstChats', '');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `hidden_on`, `order`) VALUES
('sys_studio_agents_assistants_chats', 'checkbox', '', '2%', 0, 0, '', '', 1),
('sys_studio_agents_assistants_chats', 'name', '_sys_agents_assistants_chats_txt_name', '18%', 0, 0, '', '', 2),
('sys_studio_agents_assistants_chats', 'type', '_sys_agents_assistants_chats_txt_type', '5%', 0, 0, '', '', 3),
('sys_studio_agents_assistants_chats', 'description', '_sys_agents_assistants_chats_txt_description', '25%', 1, 16, '', '', 4),
('sys_studio_agents_assistants_chats', 'messages', '_sys_agents_assistants_chats_txt_messages', '10%', 0, 0, '', '', 5),
('sys_studio_agents_assistants_chats', 'added', '_sys_agents_assistants_chats_txt_added', '15%', 0, 0, '', '', 6),
('sys_studio_agents_assistants_chats', 'stored', '_sys_agents_assistants_chats_txt_stored', '15%', 0, 0, '', '', 7),
('sys_studio_agents_assistants_chats', 'actions', '', '20%', 0, 0, '', '', 8);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `active`, `order`) VALUES
('sys_studio_agents_assistants_chats', 'independent', 'add', '_sys_agents_assistants_chats_btn_add', '', 0, 0, 1, 1),
('sys_studio_agents_assistants_chats', 'single', 'chat', '_sys_agents_assistants_chats_btn_chat', '', 0, 0, 1, 1),
('sys_studio_agents_assistants_chats', 'single', 'store', '_sys_agents_assistants_chats_btn_store', 'download', 1, 1, 1, 2),
('sys_studio_agents_assistants_chats', 'single', 'unstore', '_sys_agents_assistants_chats_btn_unstore', 'upload', 1, 1, 1, 3),
('sys_studio_agents_assistants_chats', 'single', 'edit', '_Edit', 'pencil-alt', 1, 0, 1, 4),
('sys_studio_agents_assistants_chats', 'single', 'delete', '_Delete', 'remove', 1, 1, 1, 5),
('sys_studio_agents_assistants_chats', 'bulk', 'delete', '_Delete', '', 0, 1, 1, 1);

-- GRID: Agents Assistants Files
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `responsive`, `show_total_count`, `override_class_name`, `override_class_file`) VALUES
('sys_studio_agents_assistants_files', 'Sql', 'SELECT * FROM `sys_agents_assistants_files` WHERE 1 ', 'sys_agents_assistants_files', 'id', 'added', '', '', 20, NULL, 'start', '', '', '', 'like', '', '', 2147483647, 1, 1, 'BxTemplStudioAgentsAsstFiles', '');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('sys_studio_agents_assistants_files', 'name', '_sys_agents_assistants_files_txt_name', '35%', 0, 32, '', 1),
('sys_studio_agents_assistants_files', 'size', '_sys_agents_assistants_files_txt_size', '15%', 0, 0, '', 2),
('sys_studio_agents_assistants_files', 'status', '_sys_agents_assistants_files_txt_status', '15%', 0, 0, '', 3),
('sys_studio_agents_assistants_files', 'added', '_sys_agents_assistants_files_txt_added', '15%', 0, 0, '', 4),
('sys_studio_agents_assistants_files', 'actions', '', '20%', 0, 0, '', 5);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('sys_studio_agents_assistants_files', 'independent', 'add', '_sys_agents_assistants_files_btn_add', '', 0, 0, 1),
('sys_studio_agents_assistants_files', 'independent', 'sync', '_sys_agents_assistants_files_btn_sync', '', 0, 0, 2),
('sys_studio_agents_assistants_files', 'single', 'delete', '_sys_agents_assistants_files_btn_delete', 'remove', 1, 1, 1);

-- GRID: Agents Automators
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `override_class_name`, `override_class_file`) VALUES
('sys_studio_agents_automators', 'Sql', 'SELECT * FROM `sys_agents_automators` WHERE 1 ', 'sys_agents_automators', 'id', 'added', 'active', '', 20, NULL, 'start', '', '', '', 'like', '', '', 'BxTemplStudioAgentsAutomators', '');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `hidden_on`, `order`) VALUES
('sys_studio_agents_automators', 'checkbox', '', '2%', 0, 0, '', '', 1),
('sys_studio_agents_automators', 'switcher', '_sys_agents_automators_txt_active', '8%', 0, 0, '', '', 2),
('sys_studio_agents_automators', 'name', '_sys_agents_automators_txt_name', '10%', 0, 0, '', '', 3),
('sys_studio_agents_automators', 'type', '_sys_agents_automators_txt_type', '8%', 0, 0, '', '', 4),
('sys_studio_agents_automators', 'model_id', '_sys_agents_automators_txt_model_id', '8%', 0, 0, '', '', 5),
('sys_studio_agents_automators', 'profile_id', '_sys_agents_automators_txt_profile_id', '10%', 0, 0, '', '', 6),
('sys_studio_agents_automators', 'message_id', '_sys_agents_automators_txt_message_id', '14%', 0, 32, '', '', 7),
('sys_studio_agents_automators', 'messages', '_sys_agents_automators_txt_messages', '10%', 0, 0, '', '', 8),
('sys_studio_agents_automators', 'added', '_sys_agents_automators_txt_added', '5%', 0, 0, '', '', 9),
('sys_studio_agents_automators', 'status', '_sys_agents_automators_txt_status', '5%', 0, 0, '', '', 10),
('sys_studio_agents_automators', 'actions', '', '20%', 0, 0, '', '', 11);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('sys_studio_agents_automators', 'bulk', 'delete', '_Delete', '', 0, 1, 1),
('sys_studio_agents_automators', 'single', 'tune', '_sys_agents_automators_btn_tune', '', 0, 0, 1),
('sys_studio_agents_automators', 'single', 'edit', '_Edit', 'pencil-alt', 1, 0, 2),
('sys_studio_agents_automators', 'single', 'delete', '_Delete', 'remove', 1, 1, 3),
('sys_studio_agents_automators', 'independent', 'add', '_sys_agents_automators_btn_add', '', 0, 0, 1);


-- GRID: Agents Helpers
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `responsive`, `show_total_count`, `override_class_name`, `override_class_file`) VALUES
('sys_studio_agents_helpers', 'Sql', 'SELECT * FROM `sys_agents_helpers` WHERE 1 ', 'sys_agents_helpers', 'id', 'added', 'active', '', 20, NULL, 'start', '', '', '', 'like', '', '', 2147483647, 1, 1, 'BxTemplStudioAgentsHelpers', '');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `hidden_on`, `order`) VALUES
('sys_studio_agents_helpers', 'checkbox', '', '2%', 0, 0, '', '', 1),
('sys_studio_agents_helpers', 'switcher', '_sys_agents_helpers_txt_active', '8%', 0, 0, '', '', 2),
('sys_studio_agents_helpers', 'name', '_sys_agents_helpers_txt_name', '15%', 0, 0, '', '', 3),
('sys_studio_agents_helpers', 'model_id', '_sys_agents_helpers_txt_model_id', '10%', 0, 0, '', '', 5),
('sys_studio_agents_helpers', 'profile_id', '_sys_agents_helpers_txt_profile_id', '10%', 0, 0, '', '', 6),
('sys_studio_agents_helpers', 'prompt', '_sys_agents_helpers_txt_prompt', '25%', 0, 32, '', '', 7),
('sys_studio_agents_helpers', 'added', '_sys_agents_helpers_txt_added', '10%', 0, 0, '', '', 8),
('sys_studio_agents_helpers', 'actions', '', '20%', 0, 0, '', '', 9);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `active`, `order`) VALUES
('sys_studio_agents_helpers', 'independent', 'add', '_sys_agents_helpers_btn_add', '', 0, 0, 1, 1),
('sys_studio_agents_helpers', 'single', 'tune', '_sys_agents_helpers_btn_tune', '', 0, 0, 1, 1),
('sys_studio_agents_helpers', 'single', 'edit', '_Edit', 'pencil-alt', 1, 0, 1, 2),
('sys_studio_agents_helpers', 'single', 'delete', '_Delete', 'remove', 1, 1, 1, 3),
('sys_studio_agents_helpers', 'bulk', 'delete', '_Delete', '', 0, 1, 1, 1);

-- GRIDS: Agents Providers
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('sys_studio_agents_providers', 'Sql', 'SELECT `tp`.*, `tpt`.`title` AS `provider_type` FROM `sys_agents_providers` AS `tp` LEFT JOIN `sys_agents_provider_types` AS `tpt` ON `tp`.`type_id`=`tpt`.`id` WHERE 1 ', 'sys_agents_providers', 'id', 'order', 'active', '', 100, NULL, 'start', '', 'tp`.`title,tpt`.`name,tpt`.`title', '', 'like', '', '', 2147483647, 'BxTemplStudioAgentsProviders', '');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('sys_studio_agents_providers', 'checkbox', '_sys_select', '2%', 0, '', '', 1),
('sys_studio_agents_providers', 'switcher', '_sys_agents_providers_txt_active', '8%', 0, '', '', 2),
('sys_studio_agents_providers', 'name', '_sys_agents_providers_txt_provider_name', '30%', 0, 32, '', 3),
('sys_studio_agents_providers', 'provider_type', '_sys_agents_providers_txt_provider_type', '20%', 1, 16, '', 4),
('sys_studio_agents_providers', 'added', '_sys_agents_providers_txt_added', '20%', 0, '', '', 5),
('sys_studio_agents_providers', 'actions', '', '20%', 0, '', '', 6);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('sys_studio_agents_providers', 'independent', 'add', '_sys_agents_providers_btn_add', '', 0, 0, 1),
('sys_studio_agents_providers', 'single', 'info', '_sys_agents_providers_btn_info', 'info', 1, 0, 1),
('sys_studio_agents_providers', 'single', 'edit', '_sys_agents_providers_btn_edit', 'pencil-alt', 1, 0, 2),
('sys_studio_agents_providers', 'single', 'delete', '_sys_agents_providers_btn_delete', 'remove', 1, 1, 3),
('sys_studio_agents_providers', 'bulk', 'delete', '_sys_agents_providers_btn_delete', '', 0, 1, 1);

-- GRID: Agents Vector Store
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `responsive`, `show_total_count`, `override_class_name`, `override_class_file`) VALUES
('sys_studio_agents_vector_store', 'Sql', 'SELECT * FROM `sys_agents_vector_store` WHERE 1 ', 'sys_agents_vector_store', 'id', 'id', 'active', '', 20, NULL, 'start', '', 'title,type', '', 'like', '', '', 128, 1, 1, 'BxTemplStudioAgentsVectorStore', '');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `hidden_on`, `order`) VALUES
('sys_studio_agents_vector_store', 'switcher', '_sys_active', '10%', 0, 0, '', '', 10),
('sys_studio_agents_vector_store', 'title', '_Title', '20%', 0, 0, '', '', 20),
('sys_studio_agents_vector_store', 'type', '_adm_form_txt_fields_type', '10%', 0, 0, '', '', 30),
('sys_studio_agents_vector_store', 'embedding_provider_id', '_sys_agents_vector_store_txt_embedding_provider', '5%', 0, 0, '', '', 40),
('sys_studio_agents_vector_store', 'files_num', '_sys_agents_vector_store_txt_files_num', '5%', 0, 0, '', '', 50),
('sys_studio_agents_vector_store', 'actions', '', '25%', 0, 0, '', '', 60);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `active`, `order`) VALUES
('sys_studio_agents_vector_store', 'single', 'add_data', '_sys_uploader_simple_attach_one_more_file', 'plus', 1, 0, 1, 10),
('sys_studio_agents_vector_store', 'single', 'edit', '_Edit', 'pencil-alt', 1, 0, 1, 20),
('sys_studio_agents_vector_store', 'single', 'delete', '_Delete', 'remove', 1, 1, 1, 30),
('sys_studio_agents_vector_store', 'single', 'duplicate', '_Duplicate', 'copy', 1, 0, 1, 40);

-- GRID: Agents Vector Store Data
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `responsive`, `show_total_count`, `override_class_name`, `override_class_file`) VALUES
('sys_studio_agents_vector_store_data', 'Sql', 'SELECT * FROM `sys_agents_vector_store_data` WHERE `vector_store_id` = ''{vector_store_id}'' ', 'sys_agents_vector_store_data', 'id', 'id', '', '', 10, NULL, 'start', '', 'name', '', 'like', '', '', 128, 1, 1, 'BxTemplStudioAgentsVectorStoreData', '');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `hidden_on`, `order`) VALUES
('sys_studio_agents_vector_store_data', 'checkbox', '', '2%', 0, 0, '', '', 10),
('sys_studio_agents_vector_store_data', 'name', '_Name', '70%', 0, 0, '', '', 20),
('sys_studio_agents_vector_store_data', 'size', '_sys_agents_assistants_files_txt_size', '18%', 0, 0, '', '', 30),
('sys_studio_agents_vector_store_data', 'status', '_sys_status', '10%', 0, 0, '', '', 40);


INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `active`, `order`) VALUES
('sys_studio_agents_vector_store_data', 'bulk', 'delete', '_Delete', '', 0, 1, 1, 10);

-- GRID: Agents
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `override_class_name`, `override_class_file`) VALUES
('sys_studio_agents_agents', 'Sql', 'SELECT * FROM `sys_agents_agents` WHERE 1 ', 'sys_agents_agents', 'id', 'added', 'active', '', 20, NULL, 'start', '', 'name', '', 'like', '', '', 'BxTemplStudioAgentsAgents', '');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `hidden_on`, `order`) VALUES
('sys_studio_agents_agents', 'checkbox', '', '2%', 0, 0, '', '', 10),
('sys_studio_agents_agents', 'switcher', '_sys_active', '5%', 0, 0, '', '', 20),
('sys_studio_agents_agents', 'model_id', '_sys_agents_agents_txt_model', '5%', 0, 0, '', '', 30),
('sys_studio_agents_agents', 'name', '_sys_agents_agents_txt_name', '30%', 0, 0, '', '', 40),
('sys_studio_agents_agents', 'trigger', '_sys_agents_agents_txt_trigger', '5%', 0, 0, '', '', 50),
('sys_studio_agents_agents', 'profile_id', '_sys_agents_agents_txt_profile_id', '8%', 0, 0, '', '', 60),
('sys_studio_agents_agents', 'actions', '', '45%', 0, 0, '', '', 70);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('sys_studio_agents_agents', 'bulk', 'delete', '_Delete', '', 0, 1, 1),
('sys_studio_agents_agents', 'single', 'manual', '_Run', 'play', 1, 0, 1),
('sys_studio_agents_agents', 'single', 'logs', '_Logs', 'file-alt', 1, 0, 2),
('sys_studio_agents_agents', 'single', 'edit', '_Edit', 'pencil-alt', 1, 0, 3),
('sys_studio_agents_agents', 'single', 'wipe_chat_history', '_sys_agents_agents_act_wipe_chat_history', 'eraser', 1, 1, 4),
('sys_studio_agents_agents', 'single', 'delete', '_Delete', 'remove', 1, 1, 5),
('sys_studio_agents_agents', 'independent', 'add', '_adm_form_btn_field_add', '', 0, 0, 1);

-- GRID: Agents Logs
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `responsive`, `show_total_count`, `override_class_name`, `override_class_file`) VALUES
('sys_studio_agents_logs', 'Sql', 'SELECT * FROM `sys_logger` WHERE `channel` = ''sys_agents_{agent_id}'' ', 'sys_logger', 'id', 'id', '', '', 10, NULL, 'start', '', 'message,context', '', 'like', '', '', 128, 1, 1, 'BxTemplStudioAgentsLogs', '');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `hidden_on`, `order`) VALUES
('sys_studio_agents_logs', 'level', '_Level', '5%', 0, 0, '', '', 10),
('sys_studio_agents_logs', 'message', '_sys_agents_helpers_field_message', '15%', 0, 0, '', '', 20),
('sys_studio_agents_logs', 'context', '_Context', '70%', 0, 0, '', '', 30),
('sys_studio_agents_logs', 'created_at', '_Date', '10%', 0, 0, '', '', 40);

-- GRID: Agents Tools
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `responsive`, `show_total_count`, `override_class_name`, `override_class_file`) VALUES
('sys_studio_agents_tools', 'Sql', 'SELECT * FROM `sys_agents_tools` WHERE 1 ', 'sys_agents_tools', 'id', 'id', 'active', '', 20, NULL, 'start', '', 'title,type', '', 'like', '', '', 128, 1, 1, 'BxTemplStudioAgentsTools', '');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `hidden_on`, `order`) VALUES
('sys_studio_agents_tools', 'switcher', '_sys_active', '10%', 0, 0, '', '', 10),
('sys_studio_agents_tools', 'type', '_adm_form_txt_fields_type', '10%', 0, 0, '', '', 20),
('sys_studio_agents_tools', 'title', '_Title', '40%', 0, 0, '', '', 30),
('sys_studio_agents_tools', 'actions', '', '40%', 0, 0, '', '', 40);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `active`, `order`) VALUES
('sys_studio_agents_tools', 'single', 'edit', '_Edit', 'pencil-alt', 1, 0, 1, 20),
('sys_studio_agents_tools', 'single', 'delete', '_Delete', 'remove', 1, 1, 1, 30),
('sys_studio_agents_tools', 'single', 'duplicate', '_Duplicate', 'copy', 1, 0, 1, 40);

-- --------------------------------------------------------


CREATE TABLE IF NOT EXISTS `sys_objects_connection` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object` varchar(64) NOT NULL,
  `table` varchar(255) NOT NULL,
  `profile_initiator` tinyint(4) NOT NULL DEFAULT '1',
  `profile_content` tinyint(4) NOT NULL DEFAULT '0',
  `type` enum('one-way','mutual') NOT NULL,
  `tt_initiator` varchar(32) NOT NULL DEFAULT '',
  `tf_id_initiator` varchar(32) NOT NULL DEFAULT '',
  `tf_count_initiator` varchar(32) NOT NULL DEFAULT '',
  `tt_content` varchar(32) NOT NULL DEFAULT '',
  `tf_id_content` varchar(32) NOT NULL DEFAULT '',
  `tf_count_content` varchar(32) NOT NULL DEFAULT '',
  `override_class_name` varchar(255) NOT NULL,
  `override_class_file` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `object` (`object`)
);

INSERT INTO `sys_objects_connection` (`object`, `table`, `profile_initiator`, `profile_content`, `type`, `override_class_name`, `override_class_file`) VALUES
('sys_profiles_friends', 'sys_profiles_conn_friends', 1, 1, 'mutual', 'BxTemplConnectionFriend', ''),
('sys_profiles_subscriptions', 'sys_profiles_conn_subscriptions', 1, 1, 'one-way', 'BxTemplConnectionSubscription', ''),
('sys_profiles_relations', 'sys_profiles_conn_relations', 1, 1, 'mutual', 'BxTemplConnectionRelation', ''),
('sys_profiles_bans', 'sys_profiles_conn_bans', 1, 1, 'one-way', 'BxDolConnectionBan', '');

CREATE TABLE IF NOT EXISTS `sys_profiles_conn_bans` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `module` varchar(32) NOT NULL DEFAULT '',
  `initiator` int(11) NOT NULL,
  `content` int(11) NOT NULL,
  `added` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `initiator` (`initiator`,`content`),
  KEY `content` (`content`)
);

CREATE TABLE IF NOT EXISTS `sys_profiles_conn_relations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `initiator` int(11) NOT NULL DEFAULT '0',
  `content` int(11) NOT NULL DEFAULT '0',
  `relation` int(11) NOT NULL DEFAULT '0',
  `mutual` tinyint(4) NOT NULL DEFAULT '0',
  `added` int(11) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `initiator` (`initiator`,`content`),
  KEY `content` (`content`)
);

CREATE TABLE IF NOT EXISTS `sys_profiles_conn_subscriptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `initiator` int(11) NOT NULL,
  `content` int(11) NOT NULL,
  `added` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `initiator` (`initiator`,`content`),
  KEY `content` (`content`)
);

CREATE TABLE IF NOT EXISTS `sys_profiles_conn_friends` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `initiator` int(11) NOT NULL,
  `content` int(11) NOT NULL,
  `mutual` tinyint(4) NOT NULL,
  `added` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `initiator` (`initiator`,`content`),
  KEY `content` (`content`)
);


-- --------------------------------------------------------


CREATE TABLE IF NOT EXISTS `sys_objects_transcoder` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object` varchar(64) NOT NULL,
  `storage_object` varchar(64) NOT NULL,
  `source_type` enum('Folder','Storage','Proxy') NOT NULL,
  `source_params` text NOT NULL,
  `private` enum('auto','yes','no') NOT NULL,
  `atime_tracking` int(11) NOT NULL,
  `atime_pruning` int(11) NOT NULL,
  `ts` int(11) NOT NULL DEFAULT '0',
  `override_class_name` varchar(255) NOT NULL,
  `override_class_file` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `object` (`object`)
);

INSERT INTO `sys_objects_transcoder` (`object`, `storage_object`, `source_type`, `source_params`, `private`, `atime_tracking`, `atime_pruning`, `ts`, `override_class_name`, `override_class_file`) VALUES
('sys_image_resize', 'sys_images_resized', 'Storage', 'a:2:{s:6:"object";s:10:"sys_images";s:14:"disable_retina";b:1;}', 'no', '0', '0', '0', '', ''),
('sys_icon_apple', 'sys_images_resized', 'Storage', 'a:2:{s:6:"object";s:10:"sys_images";s:14:"disable_retina";b:1;}', 'no', '0', '0', '0', '', ''),
('sys_icon_android', 'sys_images_resized', 'Storage', 'a:2:{s:6:"object";s:10:"sys_images";s:14:"disable_retina";b:1;}', 'no', '0', '0', '0', '', ''),
('sys_icon_android_splash', 'sys_images_resized', 'Storage', 'a:2:{s:6:"object";s:10:"sys_images";s:14:"disable_retina";b:1;}', 'no', '0', '0', '0', '', ''),
('sys_icon_facebook', 'sys_images_resized', 'Storage', 'a:2:{s:6:"object";s:10:"sys_images";s:14:"disable_retina";b:1;}', 'no', '0', '0', '0', '', ''),
('sys_icon_favicon', 'sys_images_resized', 'Storage', 'a:1:{s:6:"object";s:10:"sys_images";}', 'no', '0', '0', '0', '', ''),
('sys_cover', 'sys_images_resized', 'Storage', 'a:1:{s:6:"object";s:10:"sys_images";}', 'no', '0', '0', '0', '', ''),
('sys_cover_unit_profile', 'sys_images_resized', 'Storage', 'a:1:{s:6:"object";s:10:"sys_images";}', 'no', '0', '0', '0', '', ''),
('sys_cover_preview', 'sys_images_resized', 'Storage', 'a:1:{s:6:"object";s:10:"sys_images";}', 'no', '1', '2592000', '0', '', ''),
('sys_builder_page_preview', 'sys_images_resized', 'Storage', 'a:1:{s:6:"object";s:10:"sys_images";}', 'no', '1', '2592000', '0', '', ''),
('sys_builder_page_embed', 'sys_images_resized', 'Storage', 'a:1:{s:6:"object";s:10:"sys_images";}', 'no', '1', '2592000', '0', '', ''),
('sys_cmts_images_preview', 'sys_cmts_images_preview', 'Storage', 'a:1:{s:6:"object";s:15:"sys_cmts_images";}', 'no', '1', '2592000', '0', '', ''),
('sys_custom_images', 'sys_images_resized', 'Storage', 'a:1:{s:6:"object";s:17:"sys_images_custom";}', 'no', '1', '2592000', '0', '', ''),
('sys_images_editor', 'sys_images_editor_resized', 'Storage', 'a:1:{s:6:"object";s:17:"sys_images_editor";}', 'no', '1', '2592000', '0', '', ''),
('sys_wiki_images_preview', 'sys_wiki_images_resized', 'Storage', 'a:1:{s:6:"object";s:14:"sys_wiki_files";}', 'no', '1', '2592000', '0', '', ''),
('sys_agents_assistants_chats_files_preview', 'sys_cmts_images_preview', 'Storage', 'a:1:{s:6:"object";s:33:"sys_agents_assistants_chats_files";}', 'no', '1', '2592000', '0', '', ''),
('sys_accounts_icon', 'sys_accounts_pictures_resized', 'Storage', 'a:1:{s:6:"object";s:21:"sys_accounts_pictures";}', 'no', '1', '2592000', '0', '', ''),
('sys_accounts_thumb', 'sys_accounts_pictures_resized', 'Storage', 'a:1:{s:6:"object";s:21:"sys_accounts_pictures";}', 'no', '1', '2592000', '0', '', ''),
('sys_accounts_avatar', 'sys_accounts_pictures_resized', 'Storage', 'a:1:{s:6:"object";s:21:"sys_accounts_pictures";}', 'no', '1', '2592000', '0', '', ''),
('sys_accounts_avatar_big', 'sys_accounts_pictures_resized', 'Storage', 'a:1:{s:6:"object";s:21:"sys_accounts_pictures";}', 'no', '1', '2592000', '0', '', ''),
('sys_accounts_picture', 'sys_accounts_pictures_resized', 'Storage', 'a:1:{s:6:"object";s:21:"sys_accounts_pictures";}', 'no', '1', '2592000', '0', '', '');


CREATE TABLE IF NOT EXISTS `sys_transcoder_images_files` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `transcoder_object` varchar(64) NOT NULL,
  `file_id` int(11) NOT NULL,
  `handler` varchar(255) NOT NULL,
  `atime` int(11) NOT NULL,
  `data` text NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `transcoder_object` (`transcoder_object`(64),`handler`(127)),
  KEY `atime` (`atime`),
  KEY `file_id` (`file_id`)
);


CREATE TABLE IF NOT EXISTS `sys_transcoder_videos_files` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `transcoder_object` varchar(64) NOT NULL,
  `file_id` int(11) NOT NULL,
  `handler` varchar(255) NOT NULL,
  `atime` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `transcoder_object` (`transcoder_object`(64),`handler`(127)),
  KEY `atime` (`atime`),
  KEY `file_id` (`file_id`)
);


CREATE TABLE IF NOT EXISTS `sys_transcoder_audio_files` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `transcoder_object` varchar(64) NOT NULL,
  `file_id` int(11) NOT NULL,
  `handler` varchar(255) NOT NULL,
  `atime` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `transcoder_object` (`transcoder_object`(64),`handler`(127)),
  KEY `atime` (`atime`),
  KEY `file_id` (`file_id`)
);


CREATE TABLE IF NOT EXISTS `sys_transcoder_filters` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `transcoder_object` varchar(64) NOT NULL,
  `filter` varchar(32) NOT NULL,
  `filter_params` text NOT NULL,
  `order` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `transcoder_object` (`transcoder_object`)
);

INSERT INTO `sys_transcoder_filters` (`transcoder_object`, `filter`, `filter_params`, `order`) VALUES
('sys_image_resize', 'ResizeVar', '', '0'),
('sys_icon_apple', 'Resize', 'a:3:{s:1:"w";s:3:"180";s:1:"h";s:3:"180";s:13:"square_resize";s:1:"1";}', '0'),
('sys_icon_android', 'Resize', 'a:3:{s:1:"w";s:3:"192";s:1:"h";s:3:"192";s:13:"square_resize";s:1:"1";}', '0'),
('sys_icon_android_splash', 'Resize', 'a:3:{s:1:"w";s:3:"512";s:1:"h";s:3:"512";s:13:"square_resize";s:1:"1";}', '0'),
('sys_icon_facebook', 'Resize', 'a:4:{s:1:"w";s:3:"100";s:1:"h";s:3:"100";s:13:"square_resize";s:1:"1";s:10:"force_type";s:3:"png";}', '0'),
('sys_icon_favicon', 'Resize', 'a:4:{s:1:"w";s:2:"16";s:1:"h";s:2:"16";s:13:"square_resize";s:1:"1";s:10:"force_type";s:3:"png";}', '0'),
('sys_cover', 'Resize', 'a:3:{s:1:"w";s:4:"1920";s:1:"h";s:3:"720";s:10:"force_type";s:3:"png";}', '0'),
('sys_cover_unit_profile', 'Resize', 'a:3:{s:1:"w";s:3:"640";s:1:"h";s:3:"240";s:10:"force_type";s:3:"png";}', '0'),
('sys_cover_preview', 'Resize', 'a:3:{s:1:"w";s:3:"120";s:1:"h";s:2:"45";s:10:"force_type";s:3:"jpg";}', '0'),
('sys_builder_page_preview', 'Resize', 'a:4:{s:1:"w";s:3:"128";s:1:"h";s:3:"128";s:13:"square_resize";s:1:"1";s:10:"force_type";s:3:"jpg";}', '0'),
('sys_builder_page_embed', 'ResizeVar', '', '0'),
('sys_cmts_images_preview', 'Resize', 'a:4:{s:1:"w";s:3:"100";s:1:"h";s:3:"100";s:13:"square_resize";s:1:"1";s:10:"force_type";s:3:"jpg";}', '0'),
('sys_custom_images', 'ResizeVar', '', '0'),
('sys_images_editor', 'Resize', 'a:2:{s:1:"w";s:4:"1600";s:1:"h";s:4:"1600";}', '0'),
('sys_wiki_images_preview', 'Resize', 'a:4:{s:1:"w";s:2:"52";s:1:"h";s:2:"52";s:13:"square_resize";s:1:"1";s:10:"force_type";s:3:"jpg";}', '0'),
('sys_agents_assistants_chats_files_preview', 'Resize', 'a:4:{s:1:"w";s:3:"100";s:1:"h";s:3:"100";s:13:"square_resize";s:1:"1";s:10:"force_type";s:3:"jpg";}', '0'),
('sys_accounts_icon', 'Resize', 'a:3:{s:1:"w";s:2:"30";s:1:"h";s:2:"30";s:13:"square_resize";s:1:"1";}', '0'),
('sys_accounts_thumb', 'Resize', 'a:3:{s:1:"w";s:2:"50";s:1:"h";s:2:"50";s:13:"square_resize";s:1:"1";}', '0'),
('sys_accounts_avatar', 'Resize', 'a:3:{s:1:"w";s:3:"100";s:1:"h";s:3:"100";s:13:"square_resize";s:1:"1";}', '0'),
('sys_accounts_avatar_big', 'Resize', 'a:3:{s:1:"w";s:3:"200";s:1:"h";s:3:"200";s:13:"square_resize";s:1:"1";}', '0'),
('sys_accounts_picture', 'Resize', 'a:3:{s:1:"w";s:4:"1024";s:1:"h";s:4:"1024";s:13:"square_resize";s:1:"0";}', '0');


CREATE TABLE IF NOT EXISTS `sys_transcoder_queue` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `transcoder_object` varchar(64) NOT NULL,
  `profile_id` int(10) unsigned NOT NULL,
  `file_url_source` varchar(255) NOT NULL,
  `file_id_source` varchar(255) NOT NULL,
  `file_url_result` varchar(255) NOT NULL,
  `file_ext_result` varchar(255) NOT NULL,
  `file_id_result` int(11) NOT NULL,
  `server` varchar(255) NOT NULL,
  `status` enum('pending','processing','complete','failed','delete') NOT NULL,
  `pid` int(10) UNSIGNED NOT NULL DEFAULT '0',
  `added` int(11) NOT NULL,
  `changed` int(11) NOT NULL,
  `log` text NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `transcoder_object` (`transcoder_object`(64),`file_id_source`(127))
);


CREATE TABLE `sys_transcoder_queue_files` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `profile_id` int(10) unsigned NOT NULL,
  `remote_id` varchar(128) NOT NULL,
  `path` varchar(255) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `mime_type` varchar(128) NOT NULL,
  `ext` varchar(32) NOT NULL,
  `size` bigint(20) NOT NULL,
  `added` int(11) NOT NULL,
  `modified` int(11) NOT NULL,
  `private` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `remote_id` (`remote_id`)
);


-- --------------------------------------------------------


CREATE TABLE IF NOT EXISTS `sys_objects_page` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `author` int(11) NOT NULL DEFAULT '0',
  `added` int(11) NOT NULL DEFAULT '0',
  `object` varchar(64) NOT NULL,
  `uri` varchar(255) NOT NULL,
  `title_system` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `module` varchar(32) NOT NULL,
  `cover` tinyint(4) NOT NULL DEFAULT '1',
  `cover_image` int(11) NOT NULL DEFAULT '0',
  `cover_title` varchar(255) NOT NULL DEFAULT '',
  `type_id` int(11) NOT NULL DEFAULT '1',
  `layout_id` int(11) NOT NULL,
  `sticky_columns` tinyint(4) NOT NULL DEFAULT '0',
  `submenu` varchar(64) NOT NULL DEFAULT '',
  `visible_for_levels` int(11) NOT NULL DEFAULT '2147483647',
  `visible_for_levels_editable` tinyint(4) NOT NULL DEFAULT '1',
  `url` varchar(255) NOT NULL,
  `content_info` varchar(64) NOT NULL,
  `meta_title` varchar(255) NOT NULL,
  `meta_description` text NOT NULL,
  `meta_keywords` text NOT NULL,
  `meta_robots` varchar(255) NOT NULL,
  `cache_lifetime` int(11) NOT NULL DEFAULT '0',
  `cache_editable` tinyint(4) NOT NULL DEFAULT '1',
  `inj_head` text NOT NULL,
  `inj_footer` text NOT NULL,
  `config_api` text NOT NULL,
  `deletable` tinyint(1) NOT NULL,
  `override_class_name` varchar(255) NOT NULL,
  `override_class_file` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `object` (`object`),
  UNIQUE KEY `uri` (`uri`(191))
);

INSERT INTO `sys_objects_page` (`object`, `uri`, `title_system`, `title`, `module`, `cover`, `layout_id`, `submenu`, `visible_for_levels`, `visible_for_levels_editable`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`, `sticky_columns`) VALUES
('sys_home', 'home', '_sys_page_title_system_home', '_sys_page_title_home', 'system', 2, 21, 'sys_homepage_submenu', 2147483647, 1, 'page.php?i=home', '', '', '', 0, 1, 0, 'BxTemplPageHome', '', 1),
('sys_about', 'about', '_sys_page_title_system_about', '_sys_page_title_about', 'system', 1, 5, '', 2147483647, 1, 'page.php?i=about', '', '', '', 0, 1, 0, '', '', 0),
('sys_terms', 'terms', '_sys_page_title_system_terms', '_sys_page_title_terms', 'system', 1, 5, '', 2147483647, 1, 'page.php?i=terms', '', '', '', 0, 1, 0, '', '', 0),
('sys_privacy', 'privacy', '_sys_page_title_system_privacy', '_sys_page_title_privacy', 'system', 1, 5, '', 2147483647, 1, 'page.php?i=privacy', '', '', '', 0, 1, 0, '', '', 0),
('sys_explore', 'explore', '_sys_page_title_sys_explore', '_sys_page_title_explore', 'system', 1, 5, 'sys_homepage_submenu', 2147483647, 1, 'page.php?i=explore', '', '', '', 0, 1, 0, 'BxTemplPageHome', '', 0),
('sys_updates', 'updates', '_sys_page_title_sys_updates', '_sys_page_title_updates', 'system', 1, 5, 'sys_homepage_submenu', 2147483647, 1, 'page.php?i=updates', '', '', '', 0, 1, 0, 'BxTemplPageHome', '', 0),
('sys_trends', 'trends', '_sys_page_title_sys_trends', '_sys_page_title_trends', 'system', 1, 5, 'sys_homepage_submenu', 2147483647, 1, 'page.php?i=trends', '', '', '', 0, 1, 0, 'BxTemplPageHome', '', 0),
('sys_dashboard', 'dashboard', '_sys_page_title_system_dashboard', '_sys_page_title_dashboard', 'system', 1, 12, '', 2147483646, 1, 'page.php?i=dashboard', '', '', '', 0, 1, 0, 'BxTemplPageDashboard', '', 0),
('sys_dashboard_content', 'dashboard-content', '_sys_page_title_system_dashboard_content', '_sys_page_title_dashboard_content', 'system', 1, 12, '', 2147483646, 1, 'page.php?i=dashboard-content', '', '', '', 0, 1, 0, 'BxTemplPageDashboard', '', 0),
('sys_dashboard_reports', 'dashboard-reports', '_sys_page_title_system_dashboard_reports', '_sys_page_title_dashboard_reports', 'system', 1, 12, '', 2147483646, 1, 'page.php?i=dashboard-reports', '', '', '', 0, 1, 0, 'BxTemplPageDashboard', '', 0),
('sys_dashboard_audit', 'dashboard-audit', '_sys_page_title_system_dashboard_audit', '_sys_page_title_dashboard_audit', 'system', 1, 12, '', 2147483646, 1, 'page.php?i=dashboard-audit', '', '', '', 0, 1, 0, 'BxTemplPageDashboard', '', 0),
('sys_create_account', 'create-account', '_sys_page_title_system_create_account', '_sys_page_title_create_account', 'system', 1, 5, '', 2147483647, 1, 'page.php?i=create-account', '', '', '', 0, 1, 0, '', '', 0),
('sys_login', 'login', '_sys_page_title_system_login', '_sys_page_title_login', 'system', 0, 18, '', 2147483647, 1, 'page.php?i=login', '', '', '', 0, 1, 0, '', '', 0),
('sys_login_step2', 'login-step2', '_sys_page_title_system_login_step2', '_sys_page_title_login_step2', 'system', 1, 18, '', 2147483647, 1, 'page.php?i=login-step2', '', '', '', 0, 1, 0, '', '', 0),
('sys_login_step3', 'login-step3', '_sys_page_title_system_login_step3', '_sys_page_title_login_step3', 'system', 1, 18, '', 2147483647, 1, 'page.php?i=login-step3', '', '', '', 0, 1, 0, '', '', 0),
('sys_logout', 'logout', '', '_sys_page_title_logout', 'system', 0, 18, '', 2147483647, 0, 'page.php?i=logout', '', '', '', 0, 0, 0, '', '', 0),
('sys_forgot_password', 'forgot-password', '_sys_page_title_system_forgot_password', '_sys_page_title_forgot_password', 'system', 1, 5, '', 2147483647, 1, 'page.php?i=forgot-password', '', '', '', 0, 1, 0, '', '', 0),
('sys_confirm_email', 'confirm-email', '_sys_page_title_system_confirm_email', '_sys_page_title_confirm_email', 'system', 1, 5, '', 2147483647, 1, 'page.php?i=confirm-email', '', '', '', 0, 1, 0, '', '', 0),
('sys_confirm_phone', 'confirm-phone', '_sys_page_title_system_confirm_phone', '_sys_page_title_confirm_phone', 'system', 1, 5, '', 2147483647, 1, 'page.php?i=confirm-phone', '', '', '', 0, 1, 0, '', '', 0),
('sys_account_settings_email', 'account-settings-email', '_sys_page_title_system_account_settings_email', '_sys_page_title_account_settings_email', 'system', 1, 5, '', 2147483647, 1, 'member.php', '', '', '', 0, 1, 0, 'BxTemplPageAccount', '', 0),
('sys_account_settings_pwd', 'account-settings-password', '_sys_page_title_system_account_settings_pwd', '_sys_page_title_account_settings_pwd', 'system', 1, 5, '', 2147483647, 1, 'page.php?i=account-settings-pwd', '', '', '', 0, 1, 0, 'BxTemplPageAccount', '', 0),
('sys_account_settings_info', 'account-settings-info', '_sys_page_title_system_account_settings_info', '_sys_page_title_account_settings_info', 'system', 1, 5, '', 2147483647, 1, 'page.php?i=account-settings-info', '', '', '', 0, 1, 0, 'BxTemplPageAccount', '', 0),
('sys_account_settings_delete', 'account-settings-delete', '_sys_page_title_system_account_settings_delete', '_sys_page_title_account_settings_delete', 'system', 1, 5, '', 2147483647, 1, 'page.php?i=account-settings-delete', '', '', '', 0, 1, 0, 'BxTemplPageAccount', '', 0),
('sys_account_profile_switcher', 'account-profile-switcher', '_sys_page_title_system_account_profile_switcher', '_sys_page_title_account_profile_switcher', 'system', 1, 5, '', 2147483647, 1, 'page.php?i=account-profile-switcher', '', '', '', 0, 1, 0, 'BxTemplPageAccount', '', 0),
('sys_profile_settings_cfilter', 'profile-settings-cfilter', '_sys_page_title_system_profile_settings_cfilter', '_sys_page_title_profile_settings_cfilter', 'system', 1, 5, '', 2147483647, 1, 'page.php?i=profile-settings-cfilter', '', '', '', 0, 1, 0, '', '', 0),
('sys_unsubscribe_notifications', 'unsubscribe-notifications', '_sys_page_title_system_unsubscribe_notifications', '_sys_page_title_unsubscribe_notifications', 'system', 1, 5, '', 2147483647, 1, 'page.php?i=unsubscribe-notifications', '', '', '', 0, 1, 0, '', '', 0),
('sys_unsubscribe_news', 'unsubscribe-news', '_sys_page_title_system_unsubscribe_news', '_sys_page_title_unsubscribe_news', 'system', 1, 5, '', 2147483647, 1, 'page.php?i=unsubscribe-news', '', '', '', 0, 1, 0, '', '', 0),
('sys_std_dashboard', '', '_sys_page_title_system_studio_dashboard', '_sys_page_title_studio_dashboard', 'system', 1, 4, '', 2147483647, 1, '', '', '', '', 0, 1, 0, '', '', 0),
('sys_cmts_view' ,'cmts-view', '_sys_page_title_system_cmts_view', '_cmt_page_view_header', 'system', 1, 5, '', 2147483647, 1, 'page.php?i=cmts-view', '', '', '', 0, 1, 0, 'BxTemplCmtsPageView', '', 0),
('sys_cmts_administration' ,'cmts-administration', '_sys_page_title_system_cmts_administration', '_sys_page_title_cmts_administration', 'system', 1, 5, '', 192, 1, 'page.php?i=cmts-administration', '', '', '', 0, 1, 0, '', '', 0),
('sys_audit' ,'audit-administration', '_sys_page_title_system_audit_administration', '_sys_page_title_audit_administration', 'system', 1, 5, '', 192, 1, 'page.php?i=audit-administration', '', '', '', 0, 1, 0, '', '', 0),
('sys_search_keyword', 'search-keyword', '_sys_page_title_system_search_keyword', '_sys_page_title_search_keyword', 'system', 1, 5, '', 2147483647, 1, 'searchKeyword.php', '', '', '', 0, 1, 0, '', '', 0),
('sys_redirect', 'redirect', '', '_sys_page_title_redirect', 'system', 0, 18, '', 2147483647, 1, 'page.php?i=redirect', '', '', '', 0, 1, 0, '', '', 0),
('sys_wiki_add_page', 'wiki-add-page', '_sys_page_title_sys_wiki_add_page', '_sys_page_title_wiki_add_page', 'system', 1, 5, '', 2147483647, 1, 'page.php?i=wiki-add-page', '', '', '', 0, 1, 0, '', '', 0),
('sys_sub_wiki_pages_list', 'wiki-pages-list', '_sys_page_title_sys_wiki_pages_list', '_sys_page_title_wiki_pages_list', 'system', 1, 5, '', 2147483647, 1, '', '', '', '', 0, 1, 0, '', '', 0),
('sys_sub_wiki_page_contents', 'wiki-page-contents', '_sys_page_title_sys_wiki_page_contents', '_sys_page_title_wiki_page_contents', 'system', 1, 5, '', 2147483647, 1, '', '', '', '', 0, 1, 0, '', '', 0),
('sys_con_friends', 'friends', '_sys_page_title_system_con_friends', '_sys_page_title_con_friends', 'system', 1, 5, '', 2147483646, 1, 'page.php?i=friends', '', '', '', 0, 1, 0, 'BxTemplPageConnections', '', 0),
('sys_con_friend_requests', 'friend-requests', '_sys_page_title_system_con_friend_requests', '_sys_page_title_con_friend_requests', 'system', 1, 5, '', 2147483646, 1, 'page.php?i=friend-requests', '', '', '', 0, 1, 0, 'BxTemplPageConnections', '', 0),
('sys_con_friend_requested', 'sent-friend-requests', '_sys_page_title_system_con_friend_requested', '_sys_page_title_con_friend_requested', 'system', 1, 5, '', 2147483646, 1, 'page.php?i=sent-friend-requests', '', '', '', 0, 1, 0, 'BxTemplPageConnections', '', 0),
('sys_con_following', 'following', '_sys_page_title_system_con_following', '_sys_page_title_con_following', 'system', 1, 5, '', 2147483646, 1, 'page.php?i=following', '', '', '', 0, 1, 0, 'BxTemplPageConnections', '', 0),
('sys_con_followers', 'followers', '_sys_page_title_system_con_followers', '_sys_page_title_con_followers', 'system', 1, 5, '', 2147483646, 1, 'page.php?i=followers', '', '', '', 0, 1, 0, 'BxTemplPageConnections', '', 0),
('sys_recom_friends', 'friend-suggestions', '_sys_page_title_system_recom_friends', '_sys_page_title_recom_friends', 'system', 1, 5, '', 2147483646, 1, 'page.php?i=friend-suggestions', '', '', '', 0, 1, 0, 'BxTemplPageConnections', '', 0),
('sys_recom_subscriptions', 'follow-suggestions', '_sys_page_title_system_recom_subscriptions', '_sys_page_title_recom_subscriptions', 'system', 1, 5, '', 2147483646, 1, 'page.php?i=follow-suggestions', '', '', '', 0, 1, 0, 'BxTemplPageConnections', '', 0),
('sys_ntfs_context_invitations', 'context-invitations', '_sys_page_title_system_ntfs_context_invitations', '_sys_page_title_ntfs_context_invitations', 'system', 1, 5, '', 2147483646, 1, 'page.php?i=context-invitations', '', '', '', 0, 1, 0, 'BxTemplPageNotifications', '', 0);


CREATE TABLE IF NOT EXISTS `sys_pages_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `template` varchar(255) NOT NULL,
  `order` int(11) NOT NULL,
  PRIMARY KEY (`id`)
);

INSERT INTO `sys_pages_types` (`id`, `title`, `template`, `order`) VALUES
(1, '_sys_page_type_default', '', 1),
(2, '_sys_page_type_wo_hf', 'pt_wo_hf.html', 2),
(3, '_sys_page_type_standard', 'pt_standard.html', 3),
(4, '_sys_page_type_application', 'pt_application.html', 4);


CREATE TABLE IF NOT EXISTS `sys_pages_layouts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(64) NOT NULL,
  `icon` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `template` varchar(255) NOT NULL,
  `cells_number` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
);

INSERT INTO `sys_pages_layouts` (`id`, `name`, `icon`, `title`, `template`, `cells_number`) VALUES
(1, 'bar_left', 'layout_bar_left.png', '_sys_layout_bar_left', 'layout_bar_left.html', 2),
(2, 'bar_right', 'layout_bar_right.png', '_sys_layout_bar_right', 'layout_bar_right.html', 2),
(3, '3_columns', 'layout_3_columns.png', '_sys_layout_3_columns', 'layout_3_columns.html', 3),
(4, '2_columns', 'layout_2_columns.png', '_sys_layout_2_columns', 'layout_2_columns.html', 2),
(5, '1_column', 'layout_1_column.png', '_sys_layout_1_column', 'layout_1_column.html', 1),
(6, 'top_area_bar_left', 'layout_top_area_bar_left.png', '_sys_layout_top_area_bar_left', 'layout_top_area_bar_left.html', 3),
(7, 'top_area_bar_right', 'layout_top_area_bar_right.png', '_sys_layout_top_area_bar_right', 'layout_top_area_bar_right.html', 3),
(8, 'top_area_3_columns', 'layout_top_area_3_columns.png', '_sys_layout_top_area_3_columns', 'layout_top_area_3_columns.html', 4),
(9, 'top_area_2_columns', 'layout_top_area_2_columns.png', '_sys_layout_top_area_2_columns', 'layout_top_area_2_columns.html', 3),
(10, 'topbottom_area_2_columns', 'layout_topbottom_area_2_columns.png', '_sys_layout_topbottom_area_2_columns', 'layout_topbottom_area_2_columns.html', 4),
(11, 'bottom_area_2_columns', 'layout_bottom_area_2_columns.png', '_sys_layout_bottom_area_2_columns', 'layout_bottom_area_2_columns.html', 3),
(12, 'topbottom_area_bar_right', 'layout_topbottom_area_bar_right.png', '_sys_layout_topbottom_area_bar_right', 'layout_topbottom_area_bar_right.html', 4),
(13, 'topbottom_area_bar_left', 'layout_topbottom_area_bar_left.png', '_sys_layout_topbottom_area_bar_left', 'layout_topbottom_area_bar_left.html', 4),
(14, 'bar_content_bar', 'layout_bar_content_bar.png', '_sys_layout_bar_content_bar', 'layout_bar_content_bar.html', 3),
(15, 'top_area_bar_content_bar', 'layout_top_area_bar_content_bar.png', '_sys_layout_top_area_bar_content_bar', 'layout_top_area_bar_content_bar.html', 4),
(16, 'topbottom_area_col1_col3_col2', 'layout_topbottom_area_col1_col3_col2.png', '_sys_layout_topbottom_area_col1_col3_col2', 'layout_topbottom_area_col1_col3_col2.html', 5),
(17, 'topbottom_area_col1_col5', 'layout_topbottom_area_col1_col5.png', '_sys_layout_topbottom_area_col1_col5', 'layout_topbottom_area_col1_col5.html', 4),
(18, '1_column_thin', 'layout_1_column_thin.png', '_sys_layout_1_column_thin', 'layout_1_column_thin.html', 1),
(19, '1_column_half', 'layout_1_column_half.png', '_sys_layout_1_column_half', 'layout_1_column_half.html', 1),
(20, '1_column_wiki', 'layout_1_column_wiki.png', '_sys_layout_1_column_wiki', 'layout_1_column_wiki.html', 1),
(21, 'topbottom_area_col2_col5_col3', 'layout_topbottom_area_col2_col5_col3.png', '_sys_layout_topbottom_area_col2_col5_col3', 'layout_topbottom_area_col2_col5_col3.html', 5);

CREATE TABLE IF NOT EXISTS `sys_pages_layout_columns` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `layout_id` int(11) NOT NULL DEFAULT '0',
  `index` int(11) NOT NULL DEFAULT '0',
  `name` varchar(255) NOT NULL,
  `width` varchar(32) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `column` (`layout_id`, `index`)
);

INSERT INTO `sys_pages_layout_columns` (`layout_id`, `index`, `name`, `width`) VALUES
(1, 1, 'left', '1/3'), (1, 2, 'center', '2/3'),
(2, 1, 'center', '2/3'), (2, 2, 'right', '1/3'),
(3, 1, 'left', '1/3'), (3, 2, 'center', '1/3'), (3, 3, 'right', '1/3'),
(4, 1, 'left', '1/2'), (4, 2, 'right', '1/3'),
(5, 1, 'center', '1'),
(6, 1, 'top', '1'), (6, 2, 'left', '1/3'), (6, 3, 'center', '2/3'),
(7, 1, 'top', '1'), (7, 2, 'center', '2/3'), (7, 3, 'right', '1/3'),
(8, 1, 'top', '1'), (8, 2, 'left', '1/3'), (8, 3, 'center', '1/3'), (8, 4, 'right', '1/3'),
(9, 1, 'top', '1'), (9, 2, 'left', '1/2'), (9, 3, 'right', '1/2'),
(10, 1, 'top', '1'), (10, 2, 'left', '1/2'), (10, 3, 'right', '1/2'), (10, 4, 'bottom', '1'),
(11, 1, 'left', '1/2'), (11, 2, 'right', '1/2'), (11, 3, 'bottom', '1'),
(12, 1, 'top', '1'), (12, 2, 'center', '2/3'), (12, 3, 'right', '1/3'), (12, 4, 'bottom', '1'),
(13, 1, 'top', '1'), (13, 2, 'left', '1/3'), (13, 3, 'center', '2/3'), (13, 4, 'bottom', '1'),
(14, 1, 'left', '1/4'), (14, 2, 'center', '1/2'), (14, 3, 'right', '1/4'),
(15, 1, 'top', '1'), (15, 2, 'left', '1/4'), (15, 3, 'center', '1/2'), (15, 4, 'right', '1/4'),
(16, 1, 'top', '1'), (16, 2, 'left', '1/6'), (16, 3, 'center', '1/2'), (16, 4, 'right', '1/3'), (16, 5, 'bottom', '1'),
(17, 1, 'top', '1'), (17, 2, 'left', '1/6'), (17, 3, 'center', '5/6'), (17, 4, 'bottom', '1'),
(18, 1, 'center', '1/3'),
(19, 1, 'center', '1/2'),
(20, 1, 'center', '1/2'),
(21, 1, 'top', '1'), (21, 2, 'left', '1/5'), (21, 3, 'center', '1/2'), (21, 4, 'right', '3/10'), (21, 5, 'bottom', '1');


CREATE TABLE IF NOT EXISTS `sys_pages_design_boxes` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `template` varchar(255) NOT NULL,
  `order` int(11) NOT NULL,
  PRIMARY KEY (`id`)
);

INSERT INTO `sys_pages_design_boxes` (`id`, `title`, `template`, `order`) VALUES
(0, '_sys_designbox_0', 'designbox_0.html', '2'),
(1, '_sys_designbox_1', 'designbox_1.html', '8'),
(2, '_sys_designbox_2', 'designbox_2.html', '1'),
(3, '_sys_designbox_3', 'designbox_3.html', '4'),
(4, '_sys_designbox_4', 'designbox_4.html', '6'),
(10, '_sys_designbox_10', 'designbox_10.html', '3'),
(11, '_sys_designbox_11', 'designbox_11.html', '9'),
(13, '_sys_designbox_13', 'designbox_13.html', '5'),
(14, '_sys_designbox_14', 'designbox_14.html', '7');



CREATE TABLE IF NOT EXISTS `sys_pages_content_placeholders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `module` varchar(32) NOT NULL,
  `title` varchar(255) NOT NULL,
  `template` varchar(255) NOT NULL,
  `order` int(11) NOT NULL,
  PRIMARY KEY (`id`)
);

INSERT INTO `sys_pages_content_placeholders` (`id`, `module`, `title`, `template`, `order`) VALUES
(1, 'system', '_sys_page_content_ph_loading_indicator', 'block_async_loading_indicator.html', 1),
(2, 'system', '_sys_page_content_ph_text', 'block_async_text.html', 2),
(3, 'system', '_sys_page_content_ph_image', 'block_async_image.html', 3),
(4, 'system', '_sys_page_content_ph_create_post', 'block_async_create_post.html', 4),
(100, 'system', '_sys_page_content_ph_profile_units', 'block_async_profile_units.html', 100),
(110, 'system', '_sys_page_content_ph_text_units_list', 'block_async_text_units_list.html', 110),
(120, 'system', '_sys_page_content_ph_text_units_gallery', 'block_async_text_units_gallery.html', 120);



CREATE TABLE IF NOT EXISTS `sys_pages_blocks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object` varchar(64) NOT NULL,
  `cell_id` int(11) NOT NULL DEFAULT '1',
  `module` varchar(32) NOT NULL,
  `title_system` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL DEFAULT '',
  `icon` text NOT NULL,
  `designbox_id` int(11) NOT NULL DEFAULT '11',
  `class` varchar(128) NOT NULL DEFAULT '',
  `submenu` varchar(64) NOT NULL DEFAULT '',
  `tabs` tinyint(4) NOT NULL DEFAULT '0',
  `async` int(11) NOT NULL DEFAULT '0',
  `visible_for_levels` int(11) NOT NULL DEFAULT '2147483647',
  `hidden_on` varchar(255) NOT NULL DEFAULT '',
  `type` enum('raw','html','creative','bento_grid','lang','image','rss','menu','custom','service','wiki') NOT NULL DEFAULT 'raw',
  `content` mediumtext NOT NULL,
  `content_empty` varchar(255) NOT NULL DEFAULT '',
  `text` mediumtext NOT NULL,
  `text_updated` int(11) NOT NULL,
  `help` varchar(255) NOT NULL,
  `cache_lifetime` int(11) NOT NULL DEFAULT '0',
  `config_api` text NOT NULL,
  `deletable` tinyint(4) NOT NULL DEFAULT '1',
  `copyable` tinyint(4) NOT NULL DEFAULT '1',
  `active` tinyint(4) NOT NULL DEFAULT '1',
  `active_api` tinyint(4) NOT NULL DEFAULT '0',
  `order` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `object` (`object`),
  FULLTEXT KEY `text` (`text`)
);

-- skeleton blocks
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES
('', 0, 'skeletons', '_sys_block_type_raw', 11, 2147483647, 'raw', '', 0, 1, 1, 0),
('', 0, 'skeletons', '_sys_block_type_html', 11, 2147483647, 'html', '', 0, 1, 1, 0),
('', 0, 'skeletons', '_sys_block_type_creative', 11, 2147483647, 'creative', '', 0, 1, 1, 0),
('', 0, 'skeletons', '_sys_block_type_bento_grid', 11, 2147483647, 'bento_grid', '', 0, 1, 1, 0),
('', 0, 'skeletons', '_sys_block_type_rss', 11, 2147483647, 'rss', '', 0, 1, 1, 0),
('', 0, 'skeletons', '_sys_block_type_image', 11, 2147483647, 'image', '', 0, 1, 1, 0),
('', 0, 'skeletons', '_sys_block_type_lang', 11, 2147483647, 'lang', '', 0, 1, 1, 0),
('', 0, 'skeletons', '_sys_block_type_menu', 11, 2147483647, 'menu', '', 0, 1, 1, 0),
('', 0, 'skeletons', '_sys_block_type_wiki', 11, 2147483647, 'wiki', '', 0, 1, 1, 0),
('', 0, 'skeletons', '_sys_block_type_custom', 11, 2147483647, 'custom', '', 0, 1, 1, 0),
('', 0, 'skeletons', '_sys_block_type_service', 11, 2147483647, 'service', '', 0, 0, 1, 0);

-- service blocks
SET @iBlockOrder = IFNULL((SELECT `order` FROM `sys_pages_blocks` WHERE `object` = '' AND `cell_id` = 0 ORDER BY `order` DESC LIMIT 1), 0);
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `tabs`, `async`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES
('', 0, 'system', '_sys_page_block_title_sys_create_post', '_sys_page_block_title_create_post', 11, 1, 4, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:20:"get_create_post_form";s:6:"params";a:1:{i:0;i:0;}s:5:"class";s:13:"TemplServices";}', 0, 1, 1, @iBlockOrder + 1),
('', 0, 'system', '_sys_page_block_title_sys_create_post_context', '_sys_page_block_title_create_post_context', 11, 1, 4, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:20:"get_create_post_form";s:6:"params";a:1:{i:0;s:12:"{profile_id}";}s:5:"class";s:13:"TemplServices";}', 0, 1, 1, @iBlockOrder + 2),
('', 0, 'system', '_sys_page_block_title_sys_create_post_public', '_sys_page_block_title_create_post_public', 11, 1, 4, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:20:"get_create_post_form";s:6:"params";a:0:{}s:5:"class";s:13:"TemplServices";}', 0, 1, 1, @iBlockOrder + 3),

('', 0, 'system', '_sys_page_block_title_sys_std_site_submenu', '_sys_page_block_title_std_site_submenu', 3, 0, 0, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:16:"get_site_submenu";s:6:"params";a:0:{}s:5:"class";s:13:"TemplServices";}', 0, 1, 1, @iBlockOrder + 4),

('', 0, 'system', '_sys_page_block_title_sys_author', '_sys_page_block_title_author', 3, 0, 0, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:16:"get_block_author";s:6:"params";a:2:{i:0;s:8:"{module}";i:1;s:4:"{id}";}s:5:"class";s:13:"TemplServices";}', 0, 1, 1, @iBlockOrder + 5),

('', 0, 'system', '_sys_page_block_title_sys_recom_friends', '_sys_page_block_title_recom_friends', 11, 1, 0, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:30:"browse_recommendations_friends";s:6:"params";a:0:{}s:5:"class";s:20:"TemplServiceProfiles";}', 0, 1, 1, @iBlockOrder + 6),
('', 0, 'system', '_sys_page_block_title_sys_recom_subscriptions', '_sys_page_block_title_recom_subscriptions', 11, 1, 0, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:36:"browse_recommendations_subscriptions";s:6:"params";a:0:{}s:5:"class";s:20:"TemplServiceProfiles";}', 0, 1, 1, @iBlockOrder + 7),
('', 0, 'system', '_sys_page_block_title_sys_invitations', '_sys_page_block_title_invitations', 11, 1, 0, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:18:"browse_invitations";s:6:"params";a:0:{}s:5:"class";s:20:"TemplServiceProfiles";}', 0, 1, 1, @iBlockOrder + 8),

('', 0, 'system', '_sys_page_block_title_sys_ask_aqssistant', '_sys_page_block_title_ask_aqssistant', 11, 0, 0, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:23:"get_block_ask_assistant";s:6:"params";a:1:{i:0;a:0:{}}s:5:"class";s:13:"TemplServices";}', 0, 1, 1, @iBlockOrder + 9);

-- content blocks
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `tabs`, `async`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `active_api`, `order`) VALUES
('sys_home', 0, 'system', '', '_sys_page_block_title_profile_avatar', 13, 0, 0, 2147483646, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:14:"profile_avatar";s:6:"params";a:0:{}s:5:"class";s:20:"TemplServiceProfiles";}', 0, 1, 1, 0, 1),
('sys_home', 0, 'system', '', '_sys_page_block_title_profile_menu', 13, 0, 0, 2147483644, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:12:"profile_menu";s:6:"params";a:0:{}s:5:"class";s:20:"TemplServiceProfiles";}', 0, 1, 1, 0, 2),
('sys_home', 0, 'system', '', '_sys_page_block_title_profile_followings', 13, 0, 0, 2147483644, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:18:"profile_followings";s:6:"params";a:0:{}s:5:"class";s:20:"TemplServiceProfiles";}', 0, 1, 1, 0, 3),

('sys_home', 1, 'system', '', '_sys_page_block_title_homepage_splash', 0, 0, 0, 2147483647, 'raw', '<style>\r\n    /*--- Splash ---*/\r\n  	.bx-page {\r\n        position: relative;\r\n  	}\r\n    .bx-splash-block {\r\n        position: relative;\r\n        display: -webkit-flex;\r\n        display: flex;\r\n      	-webkit-align-items: center;\r\n        align-items: center;\r\n    }\r\n    .bx-spl-preload {\r\n        position: absolute;\r\n\r\n        top: 0px;\r\n        left: 0px;\r\n        width: 1px;\r\n        height: 1px;\r\n\r\n        overflow: hidden;\r\n    }\r\n    .bx-spl-line {\r\n      	position: relative;\r\n        display: -webkit-flex;\r\n        display: flex;\r\n        -webkit-align-items: stretch;\r\n        align-items: stretch;\r\n    }\r\n  	.bx-media-phone .bx-spl-line {\r\n      	-webkit-flex-direction: column;\r\n      	flex-direction: column;\r\n    }\r\n  	.bx-spl-cell {\r\n      	position: relative;\r\n  	}\r\n  	.bx-media-phone .bx-spl-cell {\r\n      	-webkit-basis: 100% !important; \r\n      	flex-basis: 100% !important;\r\n      	width: 100% !important;\r\n  	}\r\n    .bx-spl-line.bx-spl-l1 .bx-spl-cell {\r\n      	display: -webkit-flex;\r\n        display: flex;\r\n        -webkit-align-items: center;\r\n        align-items: center;\r\n    }\r\n  	.bx-spl-line.bx-spl-l1 .bx-spl-cell.bx-spl-c1 {\r\n        -webkit-flex: 1 1 70%; \r\n        flex:  1 1 70%;\r\n      	width: 70%;\r\n    }\r\n  	.bx-media-phone .bx-spl-line.bx-spl-l1 .bx-spl-cell.bx-spl-c1 {\r\n      	text-align: center;\r\n  	}\r\n  	.bx-spl-line.bx-spl-l1 .bx-spl-cell.bx-spl-c2 {\r\n        -webkit-flex: 0 0 30%; \r\n        flex:  0 1 30%;\r\n      	-webkit-justify-content: center;\r\n        justify-content: center;\r\n      	width: 30%;\r\n    }\r\n    .bx-spl-line.bx-spl-l1 .bx-spl-image {\r\n      	max-width: 100%;\r\n    }\r\n    .bx-spl-line.bx-spl-l2 .bx-spl-cell {\r\n        -webkit-flex: 1 1 33%; \r\n        flex:  1 1 33%;\r\n      	width: 33%;\r\n    }\r\n  	.bx-media-phone .bx-spl-line.bx-spl-l2 .bx-spl-cell {\r\n      	text-align: center;\r\n  	}\r\n    .bx-spl-line.bx-spl-l2 .bx-spl-cicon {\r\n		position: relative;\r\n      	display: -webkit-flex;\r\n        display: flex;\r\n        -webkit-align-items: flex-start;\r\n        align-items: flex-start;\r\n      	justify-content: flex-start;\r\n      	-webkit-justify-content: flex-start;\r\n    }\r\n    .bx-media-phone .bx-spl-line.bx-spl-l2 .bx-spl-cicon {\r\n      	justify-content: center;\r\n      	-webkit-justify-content: center;\r\n    }\r\n    .bx-spl-line.bx-spl-l2 .bx-spl-cicon .animation {\r\n        width: 4.25rem;\r\n        height: 4.25rem;\r\n    }\r\n</style>\r\n<div class=\"bx-page bx-def-color-bg-page\">\r\n  <div class=\"bx-splash-block\">\r\n      <div class=\"bx-splash-cnt bx-def-page-width bx-def-centered bx-def-padding-leftright\">\r\n          <div class=\"bx-spl-preload\">\r\n            <img src=\"<bx_image_url:spl-image-main.svg />\">\r\n          </div>\r\n          <div class=\"bx-spl-line bx-spl-l1\">\r\n            <div class=\"bx-spl-cell bx-spl-c1\">\r\n              <div class=\"bx-spl-ccnt bx-def-padding\">\r\n                <div class=\"bx-spl-title bx-def-font-h1 bx-def-font-semibold\"><bx_text:_sys_txt_splash_title /></div>\r\n                <div class=\"bx-spl-slogan bx-def-padding-sec-top bx-def-padding-bottom bx-def-font-grayed\"><bx_text:_sys_txt_splash_slogan /></div>\r\n                <div class=\"bx-spl-image bx-def-padding-top\">\r\n                  <img class=\"bx-spl-image\" src=\"<bx_image_url:spl-image-main.svg />\" />\r\n                </div>\r\n              </div>\r\n            </div>\r\n            <div class=\"bx-spl-cell bx-spl-c2 bx-hide-when-logged-in\">\r\n              <div class=\"bx-spl-ccnt bx-def-padding\">__join_form_in_box__</div>\r\n            </div>\r\n          </div>\r\n          <div class=\"bx-spl-line bx-spl-l2 bx-def-padding\">\r\n            <div class=\"bx-spl-cell bx-spl-c1\">\r\n              <div class=\"bx-spl-ccnt bx-def-padding\">\r\n                <div class=\"bx-spl-cicon connect\"><div class=\"animation\"></div></div>\r\n                <div class=\"bx-spl-ctitle bx-def-padding-sec-topbottom bx-def-font-h2\"><bx_text:_sys_txt_splash_connect /></div>\r\n                <div class=\"bx-spl-ctext bx-def-font-grayed\"><bx_text:_sys_txt_splash_connect_text /></div>\r\n              </div>\r\n            </div>\r\n            <div class=\"bx-spl-cell bx-spl-c2\">\r\n              <div class=\"bx-spl-ccnt bx-def-padding\">\r\n                <div class=\"bx-spl-cicon share\"><div class=\"animation\"></div></div>\r\n                <div class=\"bx-spl-ctitle bx-def-padding-sec-topbottom bx-def-font-h2\"><bx_text:_sys_txt_splash_share /></div>\r\n                <div class=\"bx-spl-ctext bx-def-font-grayed\"><bx_text:_sys_txt_splash_share_text /></div>\r\n              </div>\r\n            </div>\r\n            <div class=\"bx-spl-cell bx-spl-c3\">\r\n              <div class=\"bx-spl-ccnt bx-def-padding\">\r\n                <div class=\"bx-spl-cicon create\"><div class=\"animation\"></div></div>\r\n                <div class=\"bx-spl-ctitle bx-def-padding-sec-topbottom bx-def-font-h2\"><bx_text:_sys_txt_splash_create /></div>\r\n                <div class=\"bx-spl-ctext bx-def-font-grayed\"><bx_text:_sys_txt_splash_create_text /></div>\r\n              </div>\r\n            </div>\r\n          </div>\r\n      </div>\r\n  </div>\r\n</div>\r\n<script>\r\n  var animConnect = bodymovin.loadAnimation({\r\n    container: $(\'.bx-spl-cicon.connect .animation\').get(0),\r\n    path: \'<bx_image_url:spl-icon-connect.json />\',\r\n    renderer: \'svg\',\r\n    loop: true,\r\n    autoplay: true,\r\n  });\r\n  var animShare = bodymovin.loadAnimation({\r\n    container: $(\'.bx-spl-cicon.share .animation\').get(0),\r\n    path: \'<bx_image_url:spl-icon-share.json />\',\r\n    renderer: \'svg\',\r\n    loop: true,\r\n    autoplay: true,\r\n  });\r\n  var animCreate = bodymovin.loadAnimation({\r\n    container: $(\'.bx-spl-cicon.create .animation\').get(0),\r\n    path: \'<bx_image_url:spl-icon-create.json />\',\r\n    renderer: \'svg\',\r\n    loop: true,\r\n    autoplay: true,\r\n  });\r\n</script>', 0, 1, 0, 0, 0),
('sys_home', 1, 'system', '', '_sys_page_block_title_homepage_menu', 13, 0, 0, 2147483647, 'menu', 'sys_homepage', 0, 1, 1, 0, 0),

('sys_home', 2, 'system', '', '_sys_page_block_title_profile_stats', 3, 0, 0, 2147483644, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:13:"profile_stats";s:6:"params";a:0:{}s:5:"class";s:20:"TemplServiceProfiles";}', 0, 0, 1, 0, 1),
('sys_home', 3, 'system', '_sys_page_block_title_sys_create_post', '_sys_page_block_title_create_post', 11, 1, 4, 2147483644, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:20:"get_create_post_form";s:6:"params";a:1:{i:0;i:0;}s:5:"class";s:13:"TemplServices";}', 0, 0, 1, 0, 1);

-- content blocks for APP (activated via separate app-pages.sql)
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `description`, `icon`, `designbox_id`, `class`, `submenu`, `tabs`, `async`, `visible_for_levels`, `hidden_on`, `type`, `content`, `content_empty`, `text`, `text_updated`, `help`, `cache_lifetime`, `config_api`, `deletable`, `copyable`, `active`, `active_api`, `order`) VALUES
('sys_home', 1, 'system', '', '_sys_page_block_title_create_account', '', '', 11, '', '', 0, 0, 1, '', 'service', 'a:4:{s:6:\"module\";s:6:\"system\";s:6:\"method\";s:19:\"create_account_form\";s:6:\"params\";a:0:{}s:5:\"class\";s:19:\"TemplServiceAccount\";}', '', '', 0, '', 0, '', 0, 0, 0, 0, 0),
('sys_home', 1, 'system', '_sys_page_block_system_title_login', '_sys_page_block_title_login', '', '', 11, '', '', 0, 0, 1, '', 'service', 'a:3:{s:6:\"module\";s:6:\"system\";s:6:\"method\";s:10:\"login_form\";s:5:\"class\";s:17:\"TemplServiceLogin\";}', '', '', 0, '', 0, '', 0, 0, 0, 0, 0),
('sys_home', 1, 'system', '', '_sys_page_block_title_forgot_password', '', '', 13, '', '', 0, 0, 1, '', 'service', 'a:4:{s:6:\"module\";s:6:\"system\";s:6:\"method\";s:15:\"forgot_password\";s:6:\"params\";a:0:{}s:5:\"class\";s:19:\"TemplServiceAccount\";}', '', '', 0, '', 0, '', 0, 0, 0, 0, 0),
('sys_home', 2, 'system', '', '_sys_page_block_title_profile_menu', '', '', 0, '', '', 0, 0, 2147483644, '0', 'service', 'a:4:{s:6:\"module\";s:6:\"system\";s:6:\"method\";s:12:\"profile_menu\";s:6:\"params\";a:0:{}s:5:\"class\";s:20:\"TemplServiceProfiles\";}', '', '', 0, '', 0, '', 1, 0, 0, 0, 0),
('sys_home', 4, 'system', '_sys_page_block_title_sys_recom_friends', '_sys_page_block_title_recom_friends', '', '', 11, '', '', 1, 0, 2147483644, '0', 'service', 'a:4:{s:6:\"module\";s:6:\"system\";s:6:\"method\";s:30:\"browse_recommendations_friends\";s:6:\"params\";a:2:{i:0;i:0;i:1;a:1:{s:8:\"per_page\";i:3;}}s:5:\"class\";s:20:\"TemplServiceProfiles\";}', '', '', 0, '', 0, '', 1, 0, 1, 0, 0),
('sys_home', 4, 'system', '_sys_page_block_title_sys_recom_subscriptions', '_sys_page_block_title_recom_subscriptions', '', '', 11, '', '', 1, 0, 2147483644, '0', 'service', 'a:4:{s:6:\"module\";s:6:\"system\";s:6:\"method\";s:36:\"browse_recommendations_subscriptions\";s:6:\"params\";a:0:{}s:5:\"class\";s:20:\"TemplServiceProfiles\";}', '', '', 0, '', 0, '', 1, 0, 0, 0, 0),
('sys_home', 4, 'system', '_sys_page_block_title_sys_invitations', '_sys_page_block_title_invitations', '', '', 11, '', '', 1, 0, 2147483644, '0', 'service', 'a:4:{s:6:\"module\";s:6:\"system\";s:6:\"method\";s:18:\"browse_invitations\";s:6:\"params\";a:0:{}s:5:\"class\";s:20:\"TemplServiceProfiles\";}', '', '', 0, '', 0, '', 1, 0, 0, 0, 0);

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `class`, `submenu`, `tabs`, `async`, `visible_for_levels`, `hidden_on`, `type`, `content`, `content_empty`, `text`, `text_updated`, `help`, `cache_lifetime`, `config_api`, `deletable`, `copyable`, `active`, `active_api`, `order`) VALUES
('sys_dashboard', 1, 'system', '_sys_page_block_title_dash_stats', '', 13, '', '', 0, 0, 2147483647, '0', 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:14:"get_stat_block";s:6:"params";a:0:{}s:5:"class";s:22:"TemplDashboardServices";}', '', '', 0, '', 0, '', 1, 0, 0, 0, 0);

-- content blocks
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `tabs`, `async`, `visible_for_levels`, `type`, `content`, `config_api`, `deletable`, `copyable`, `active`, `order`) VALUES
('sys_login', 0, 'system', '_sys_page_block_system_title_login_only', '_sys_page_block_title_login', 11, 0, 0, 2147483647, 'service', 'a:3:{s:6:\"module\";s:6:\"system\";s:6:\"method\";s:15:\"login_form_only\";s:5:\"class\";s:17:\"TemplServiceLogin\";}', '', 0, 1, 1, 0),
('sys_login', 1, 'system', '_sys_page_block_system_title_login', '_sys_page_block_title_login', 11, 0, 0, 2147483647, 'service', 'a:3:{s:6:\"module\";s:6:\"system\";s:6:\"method\";s:10:\"login_form\";s:5:\"class\";s:17:\"TemplServiceLogin\";}', '{"rounded": ["mobile", "tablet", "desktop"]}', 0, 1, 1, 1),

('sys_forgot_password', 1, 'system', '', '_sys_page_block_title_forgot_password', 13, 0, 0, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:15:"forgot_password";s:6:"params";a:0:{}s:5:"class";s:19:"TemplServiceAccount";}', '{"rounded": ["mobile", "tablet", "desktop"]}', 0, 1, 1, 1);

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `tabs`, `async`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES

('sys_about', 1, 'system', '', '_sys_page_block_title_about', 11, 0, 0, 2147483647, 'lang', '_sys_page_lang_block_about', 0, 1, 1, 1),

('sys_terms', 1, 'system', '', '_sys_page_block_title_terms', 11, 0, 0, 2147483647, 'lang', '_sys_page_lang_block_terms', 0, 1, 1, 1),

('sys_privacy', 1, 'system', '', '_sys_page_block_title_privacy', 11, 0, 0, 2147483647, 'lang', '_sys_page_lang_block_privacy', 0, 1, 1, 1),

('sys_dashboard', 3, 'system', '', '_sys_page_block_title_profile_stats', 3, 0, 0, 2147483644, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:13:"profile_stats";s:6:"params";a:0:{}s:5:"class";s:20:"TemplServiceProfiles";}', 0, 1, 0, 1),

('sys_dashboard', 3, 'system', '', '_sys_page_block_title_profile_membership', 11, 0, 0, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:18:"profile_membership";s:6:"params";a:0:{}s:5:"class";s:20:"TemplServiceProfiles";}', 0, 1, 0, 0),

('sys_dashboard', 1, 'system', '', '_sys_page_block_title_manage_tools', 11, 0, 0, 192, 'menu', 'sys_account_dashboard_manage_tools', 0, 1, 1, 3),

('sys_dashboard_content', 1, 'system', '', '_sys_page_block_title_dashboard_content', 11, 1, 0, 192, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:14:"manage_content";s:6:"params";a:0:{}s:5:"class";s:22:"TemplDashboardServices";}', 0, 1, 1, 1),

('sys_dashboard_audit', 1, 'system', '', '_sys_page_block_title_dashboard_audit', 11, 0, 0, 192, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:12:"manage_audit";s:6:"params";a:0:{}s:5:"class";s:22:"TemplDashboardServices";}', 0, 1, 1, 1),

('sys_dashboard_reports', 1, 'system', '', '_sys_page_block_title_dashboard_reports', 11, 1, 0, 192, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:14:"manage_reports";s:6:"params";a:0:{}s:5:"class";s:22:"TemplDashboardServices";}', 0, 1, 1, 1),

('sys_dashboard', 3, 'system', '', '_sys_page_block_title_chart_growth', 11, 0, 0, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:16:"get_chart_growth";s:6:"params";a:0:{}s:5:"class";s:18:"TemplChartServices";}', 0, 1, 1, 0),

('sys_dashboard', 2, 'system', '', '_sys_page_block_title_membership_stats', 11, 0, 0, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:24:"profile_membership_stats";s:6:"params";a:0:{}s:5:"class";s:20:"TemplServiceProfiles";}', 0, 1, 1, 2),

('sys_dashboard', 2, 'system', '', '_sys_page_block_title_chart_stats', 11, 0, 0, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:15:"get_chart_stats";s:6:"params";a:0:{}s:5:"class";s:18:"TemplChartServices";}', 0, 1, 1, 3),

('sys_create_account', 1, 'system', '', '_sys_page_block_title_create_account', 11, 0, 0, 2147483647, 'service', 'a:4:{s:6:\"module\";s:6:\"system\";s:6:\"method\";s:19:\"create_account_form\";s:6:\"params\";a:0:{}s:5:\"class\";s:19:\"TemplServiceAccount\";}', 0, 1, 1, 1),

('sys_login_step2', 1, 'system', '_sys_page_block_system_title_login_step2', '_sys_page_block_title_login_step2', 11, 0, 0, 2147483647, 'service', 'a:3:{s:6:\"module\";s:6:\"system\";s:6:\"method\";s:16:\"login_form_step2\";s:5:\"class\";s:17:\"TemplServiceLogin\";}', 0, 1, 1, 1),

('sys_login_step3', 1, 'system', '_sys_page_block_system_title_login_step3', '_sys_page_block_title_login_step3', 11, 0, 0, 2147483647, 'service', 'a:3:{s:6:\"module\";s:6:\"system\";s:6:\"method\";s:16:\"login_form_step3\";s:5:\"class\";s:17:\"TemplServiceLogin\";}', 0, 1, 1, 1),

('sys_logout', 1, 'system', '', '_sys_page_block_title_logout', 11, 0, 0, 2147483647, 'service', 'a:3:{s:6:\"module\";s:6:\"system\";s:6:\"method\";s:6:\"logout\";s:5:\"class\";s:17:\"TemplServiceLogin\";}', 0, 1, 1, 1),

('sys_confirm_email', 1, 'system', '', '_sys_page_block_title_confirm_email', 11, 0, 0, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:18:"email_confirmation";s:6:"params";a:0:{}s:5:"class";s:19:"TemplServiceAccount";}', 0, 1, 1, 1),

('sys_confirm_phone', 1, 'system', '', '_sys_page_block_title_confirm_phone', 11, 0, 0, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:18:"phone_confirmation";s:6:"params";a:0:{}s:5:"class";s:19:"TemplServiceAccount";}', 0, 1, 1, 1),

('sys_account_settings_email', 1, 'system', '', '_sys_page_block_title_account_settings_email', 11, 0, 0, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:22:"account_settings_email";s:6:"params";a:0:{}s:5:"class";s:19:"TemplServiceAccount";}', 0, 1, 1, 1),

('sys_account_settings_pwd', 1, 'system', '', '_sys_page_block_title_account_settings_pwd', 11, 0, 0, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:25:"account_settings_password";s:6:"params";a:0:{}s:5:"class";s:19:"TemplServiceAccount";}', 0, 1, 1, 1),

('sys_account_settings_info', 1, 'system', '', '_sys_page_block_title_account_settings_info', 11, 0, 0, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:21:"account_settings_info";s:6:"params";a:0:{}s:5:"class";s:19:"TemplServiceAccount";}', 0, 1, 1, 1),

('sys_account_settings_delete', 1, 'system', '', '_sys_page_block_title_account_settings_delete', 11, 0, 0, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:28:"account_settings_del_account";s:6:"params";a:0:{}s:5:"class";s:19:"TemplServiceAccount";}', 0, 1, 1, 1),

('sys_account_profile_switcher', 1, 'system', '', '_sys_page_block_title_account_profile_create', 11, 0, 0, 2147483647, 'menu', 'sys_add_profile', 0, 1, 1, 1),

('sys_account_profile_switcher', 1, 'system', '', '_sys_page_block_title_account_profile_switcher', 11, 0, 0, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:28:"account_profile_switcher_all";s:6:"params";a:0:{}s:5:"class";s:20:"TemplServiceProfiles";}', 0, 1, 1, 2),

('sys_profile_settings_cfilter', 1, 'system', '', '_sys_page_block_title_profile_settings_cfilter', 11, 0, 0, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:24:"profile_settings_cfilter";s:6:"params";a:0:{}s:5:"class";s:20:"TemplServiceProfiles";}', 0, 1, 1, 2),

('sys_unsubscribe_notifications', 1, 'system', '', '_sys_page_block_title_unsubscribe_notifications', 11, 0, 0, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:25:"unsubscribe_notifications";s:6:"params";a:0:{}s:5:"class";s:19:"TemplServiceAccount";}', 0, 1, 1, 1),

('sys_unsubscribe_news', 1, 'system', '', '_sys_page_block_title_unsubscribe_news', 11, 0, 0, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:16:"unsubscribe_news";s:6:"params";a:0:{}s:5:"class";s:19:"TemplServiceAccount";}', 0, 1, 1, 1),

('sys_cmts_administration', 1, 'system', '_sys_page_block_title_system_cmts_administration', '_sys_page_block_title_cmts_administration', 11, 0, 0, 192, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:12:"manage_tools";s:6:"params";a:1:{i:0;s:14:"administration";}s:5:"class";s:17:"TemplCmtsServices";}', 0, 1, 1, 1),

('sys_audit', 1, 'system', '_sys_page_block_title_system_audit_administration', '_sys_page_block_title_audit_administration', 11, 0, 0, 192, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:12:"manage_tools";s:6:"params";a:1:{i:0;s:14:"administration";}s:5:"class";s:18:"TemplAuditServices";}', 0, 1, 1, 1),
('sys_redirect', 1, 'system', '', '_sys_page_block_title_redirect', 11, 0, 0, 2147483647, 'service', 'a:3:{s:6:\"module\";s:6:\"system\";s:6:\"method\";s:8:\"redirect\";s:5:\"class\";s:13:\"TemplServices\";}', 0, 1, 1, 1),
('sys_search_keyword', 1, 'system', '', '_sys_page_block_title_search_keyword_form', 13, 0, 0, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:19:"search_keyword_form";s:6:"params";a:0:{}s:5:"class";s:13:"TemplServices";}', 0, 1, 1, 1),
('sys_search_keyword', 1, 'system', '', '_sys_page_block_title_search_keyword_result', 0, 0, 0, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:21:"search_keyword_result";s:6:"params";a:0:{}s:5:"class";s:13:"TemplServices";}', 0, 1, 1, 1),

('sys_wiki_add_page', 1, 'system', '', '_sys_page_block_title_wiki_add_page', 0, 0, 0, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:13:"wiki_add_page";s:6:"params";a:2:{i:0;s:8:"{object}";i:1;s:5:"{uri}";}s:5:"class";s:16:"TemplServiceWiki";}', 0, 1, 1, 1),
('sys_sub_wiki_pages_list', 1, 'system', '', '_sys_page_block_title_wiki_pages_list', 0, 0, 0, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:10:"pages_list";s:6:"params";a:0:{}s:5:"class";s:16:"TemplServiceWiki";}', 0, 1, 1, 1),
('sys_sub_wiki_page_contents', 1, 'system', '', '_sys_page_block_title_wiki_page_contents', 0, 0, 0, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:13:"page_contents";s:6:"params";a:0:{}s:5:"class";s:16:"TemplServiceWiki";}', 0, 1, 1, 1),

('sys_con_friends', 1, 'system', '', '_sys_page_block_title_con_friends', 11, 0, 0, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:14:"browse_friends";s:6:"params";a:2:{i:0;s:12:"{profile_id}";i:1;a:1:{s:13:"empty_message";b:1;}}s:5:"class";s:20:"TemplServiceProfiles";}', 0, 0, 1, 1),
('sys_con_friend_requests', 1, 'system', '', '_sys_page_block_title_con_friend_requests', 11, 0, 0, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:22:"browse_friend_requests";s:6:"params";a:2:{i:0;s:12:"{profile_id}";i:1;a:1:{s:13:"empty_message";b:1;}}s:5:"class";s:20:"TemplServiceProfiles";}', 0, 0, 1, 1),
('sys_con_friend_requested', 1, 'system', '', '_sys_page_block_title_con_friend_requested', 11, 0, 0, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:23:"browse_friend_requested";s:6:"params";a:2:{i:0;s:12:"{profile_id}";i:1;a:1:{s:13:"empty_message";b:1;}}s:5:"class";s:20:"TemplServiceProfiles";}', 0, 0, 1, 1),

('sys_con_following', 1, 'system', '', '_sys_page_block_title_con_following', 11, 0, 0, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:20:"browse_subscriptions";s:6:"params";a:2:{i:0;s:12:"{profile_id}";i:1;a:1:{s:13:"empty_message";b:1;}}s:5:"class";s:20:"TemplServiceProfiles";}', 0, 0, 1, 1),
('sys_con_followers', 1, 'system', '', '_sys_page_block_title_con_followers', 11, 0, 0, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:20:"browse_subscribed_me";s:6:"params";a:2:{i:0;s:12:"{profile_id}";i:1;a:1:{s:13:"empty_message";b:1;}}s:5:"class";s:20:"TemplServiceProfiles";}', 0, 0, 1, 1),

('sys_recom_friends', 1, 'system', '', '_sys_page_block_title_recom_friends', 11, 0, 0, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:30:"browse_recommendations_friends";s:6:"params";a:2:{i:0;s:12:"{profile_id}";i:1;a:1:{s:13:"empty_message";b:1;}}s:5:"class";s:20:"TemplServiceProfiles";}', 0, 0, 1, 1),
('sys_recom_subscriptions', 1, 'system', '', '_sys_page_block_title_recom_subscriptions', 11, 0, 0, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:36:"browse_recommendations_subscriptions";s:6:"params";a:2:{i:0;s:12:"{profile_id}";i:1;a:1:{s:13:"empty_message";b:1;}}s:5:"class";s:20:"TemplServiceProfiles";}', 0, 0, 1, 1),

('sys_ntfs_context_invitations', 1, 'system', '', '_sys_page_block_title_ntfs_context_invitations', 11, 0, 0, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:18:"browse_invitations";s:6:"params";a:2:{i:0;s:19:"{logged_profile_id}";i:1;a:1:{s:13:"empty_message";b:1;}}s:5:"class";s:20:"TemplServiceProfiles";}', 0, 1, 1, 1),

-- studio dashboard blocks
('sys_std_dashboard', 1, 'system', '', '_sys_page_block_title_std_dash_version', 11, 0, 0, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:17:"get_block_version";s:6:"params";a:0:{}s:5:"class";s:20:"TemplStudioDashboard";}', 0, 0, 1, 1),

('sys_std_dashboard', 1, 'system', '', '_sys_page_block_title_std_dash_space', 11, 0, 0, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:15:"get_block_space";s:6:"params";a:0:{}s:5:"class";s:20:"TemplStudioDashboard";}', 0, 0, 1, 2),

('sys_std_dashboard', 2, 'system', '', '_sys_page_block_title_std_dash_host_tools', 11, 0, 0, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:20:"get_block_host_tools";s:6:"params";a:0:{}s:5:"class";s:20:"TemplStudioDashboard";}', 0, 0, 1, 1),

('sys_std_dashboard', 2, 'system', '', '_sys_page_block_title_std_dash_cache', 11, 0, 0, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:15:"get_block_cache";s:6:"params";a:0:{}s:5:"class";s:20:"TemplStudioDashboard";}', 0, 0, 1, 2),

('sys_std_dashboard', 2, 'system', '', '_sys_page_block_title_std_dash_queues', 11, 0, 0, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:16:"get_block_queues";s:6:"params";a:0:{}s:5:"class";s:20:"TemplStudioDashboard";}', 0, 0, 1, 3);

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `tabs`, `async`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `active_api`, `order`) VALUES
('sys_cmts_view', 1, 'system', '_sys_page_block_title_system_cmts_view_content', '_cmt_page_view_title_content', 11, 0, 0, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:17:"get_block_content";s:6:"params";a:3:{i:0;s:8:"{system}";i:1;s:11:"{object_id}";i:2;s:12:"{comment_id}";}s:5:"class";s:17:"TemplCmtsServices";}', 0, 0, 1, 0, 0),
('sys_cmts_view', 1, 'system', '_sys_page_block_title_system_cmts_view_author', '_cmt_page_view_title_author', 11, 0, 0, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:16:"get_block_author";s:6:"params";a:3:{i:0;s:8:"{system}";i:1;s:11:"{object_id}";i:2;s:12:"{comment_id}";}s:5:"class";s:17:"TemplCmtsServices";}', 0, 0, 0, 0, 1),
('sys_cmts_view', 1, 'system', '_sys_page_block_title_system_cmts_view', '_cmt_page_view_title', 11, 0, 0, 2147483647, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:14:"get_block_view";s:6:"params";a:3:{i:0;s:8:"{system}";i:1;s:11:"{object_id}";i:2;s:12:"{comment_id}";}s:5:"class";s:17:"TemplCmtsServices";}', 0, 0, 1, 0, 2);


CREATE TABLE IF NOT EXISTS `sys_pages_blocks_data` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `block_id` int(11) NOT NULL DEFAULT 0,
  `content_id` int(11) NOT NULL DEFAULT 0,
  `content_module` varchar(32) NOT NULL,
  `data` text NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `block` (`block_id`, `content_id`, `content_module`)
);

-- --------------------------------------------------------

CREATE TABLE `sys_labels` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `module` varchar(32) NOT NULL,
  `parent` int(11) NOT NULL DEFAULT 0,
  `level` int(11) NOT NULL DEFAULT 0,
  `order` int(11) NOT NULL DEFAULT 0,
  `value` varchar(128) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY `value` (`value`)
);

-- --------------------------------------------------------

CREATE TABLE `sys_objects_metatags` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object` varchar(64) NOT NULL,
  `module` varchar(32) NOT NULL,
  `table_keywords` varchar(255) NOT NULL,
  `table_locations` varchar(255) NOT NULL,
  `table_mentions` varchar(255) NOT NULL,
  `override_class_name` varchar(255) NOT NULL,
  `override_class_file` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `object` (`object`)
);

INSERT INTO `sys_objects_metatags` (`object`, `table_keywords`, `table_locations`, `table_mentions`, `override_class_name`, `override_class_file`) VALUES
('sys_cmts', 'sys_cmts_meta_keywords', '', 'sys_cmts_meta_mentions', '', '');

-- --------------------------------------------------------

CREATE TABLE `sys_objects_category` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object` varchar(64) NOT NULL,
  `module` varchar(32) NOT NULL,
  `search_object` varchar(64) NOT NULL,
  `form_object` varchar(64) NOT NULL,
  `list_name` varchar(255) NOT NULL,
  `table` varchar(255) NOT NULL,
  `field` varchar(255) NOT NULL,
  `join` varchar(255) NOT NULL,
  `where` varchar(255) NOT NULL,
  `override_class_name` varchar(255) NOT NULL,
  `override_class_file` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `object` (`object`),
  UNIQUE KEY `form_object` (`form_object`(64),`list_name`(127))
);

-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `sys_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `author` int(11) NOT NULL,
  `added` int(11) NOT NULL,
  `module` varchar(32) NOT NULL,
  `value` varchar(100) NOT NULL,
  `icon_type` varchar(8) NOT NULL DEFAULT '',
  `icon` text NOT NULL,
  `status` enum ('active', 'hidden') NOT NULL DEFAULT 'active',
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `sys_categories2objects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `module` varchar(32) NOT NULL,
  `object_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
);

-- --------------------------------------------------------

--
-- Table structure for table `sys_objects_live_updates`
--

CREATE TABLE `sys_objects_live_updates` (
  `id` int(11) unsigned NOT NULL auto_increment,
  `name` varchar(50) NOT NULL default '',
  `init` tinyint(4) NOT NULL DEFAULT '0',
  `frequency` tinyint(4) NOT NULL DEFAULT '1',
  `service_call` text NOT NULL default '', 
  `active` tinyint(4) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
);

INSERT INTO `sys_objects_live_updates`(`name`, `init`, `frequency`, `service_call`, `active`) VALUES
('sys_payments_cart', 0, 1, 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:21:"get_live_updates_cart";s:6:"params";a:3:{i:0;a:2:{s:11:"menu_object";s:18:"sys_toolbar_member";s:9:"menu_item";s:7:"account";}i:1;a:2:{s:11:"menu_object";s:25:"sys_account_notifications";s:9:"menu_item";s:4:"cart";}i:2;s:7:"{count}";}s:5:"class";s:21:"TemplPaymentsServices";}', 1),
('sys_payments_orders', 0, 1, 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:23:"get_live_updates_orders";s:6:"params";a:3:{i:0;a:2:{s:11:"menu_object";s:18:"sys_toolbar_member";s:9:"menu_item";s:7:"account";}i:1;a:2:{s:11:"menu_object";s:25:"sys_account_notifications";s:9:"menu_item";s:6:"orders";}i:2;s:7:"{count}";}s:5:"class";s:21:"TemplPaymentsServices";}', 1),
('sys_payments_invoices', 0, 1, 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:25:"get_live_updates_invoices";s:6:"params";a:3:{i:0;a:2:{s:11:"menu_object";s:18:"sys_toolbar_member";s:9:"menu_item";s:7:"account";}i:1;a:2:{s:11:"menu_object";s:25:"sys_account_notifications";s:9:"menu_item";s:8:"invoices";}i:2;s:7:"{count}";}s:5:"class";s:21:"TemplPaymentsServices";}', 1);

-- --------------------------------------------------------

--
-- Table structure for table `sys_objects_payments`
--

CREATE TABLE IF NOT EXISTS `sys_objects_payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object` varchar(32) NOT NULL,
  `title` varchar(255) NOT NULL,
  `uri` varchar(32) NOT NULL default '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `object` (`object`),
  UNIQUE KEY `uri` (`uri`)
);

-- --------------------------------------------------------

--
-- Logs Objects
--

CREATE TABLE `sys_objects_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object` varchar(64) NOT NULL,
  `module` varchar(32) NOT NULL,
  `logs_storage` varchar(32) NOT NULL,
  `title` varchar(255) NOT NULL,
  `active` tinyint(4) NOT NULL DEFAULT '1',
  `class_name` varchar(255) NOT NULL,
  `class_file` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
);

INSERT INTO `sys_objects_logs` (`object`, `module`, `logs_storage`, `title`, `active`, `class_name`, `class_file`) VALUES
('sys_debug', 'system', 'Auto', '_sys_log_debug', 1, '', ''),
('sys_sms', 'system', 'Auto', '_sys_log_sms', 1, '', ''),
('sys_push', 'system', 'Auto', '_sys_log_push', 1, '', ''),
('sys_payments', 'system', 'Auto', '_sys_log_payments', 1, '', ''),
('sys_cron_jobs', 'system', 'Auto', '_sys_log_cron_jobs', 0, '', ''),
('sys_transcoder', 'system', 'Auto', '_sys_log_transcoder', 1, '', ''),
('sys_background_jobs', 'system', 'Auto', '_sys_log_background_jobs', 1, '', '');


-- --------------------------------------------------------

--
-- Location Field Objects
--

CREATE TABLE `sys_objects_location_field` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object` varchar(64) NOT NULL,
  `module` varchar(32) NOT NULL,
  `title` varchar(255) NOT NULL,
  `class_name` varchar(255) NOT NULL,
  `class_file` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
);

INSERT INTO `sys_objects_location_field` (`object`, `module`, `title`, `class_name`, `class_file`) VALUES
('sys_google', 'system', '_sys_location_field_google', 'BxDolLocationFieldGoogle', ''),
('sys_plain', 'system', '_sys_location_field_plain', 'BxDolLocationFieldNominatim', '');

-- --------------------------------------------------------

--
-- Location Map Objects
--

CREATE TABLE `sys_objects_location_map` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object` varchar(64) NOT NULL,
  `module` varchar(32) NOT NULL,
  `title` varchar(255) NOT NULL,
  `class_name` varchar(255) NOT NULL,
  `class_file` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
);

INSERT INTO `sys_objects_location_map` (`object`, `module`, `title`, `class_name`, `class_file`) VALUES
('sys_google_static', 'system', '_sys_location_map_google_static', 'BxDolLocationMapGoogleStatic', ''),
('sys_leaflet', 'system', '_sys_location_map_leaflet', 'BxDolLocationMapLeaflet', '');

-- --------------------------------------------------------

--
-- WIKI Objects
--

CREATE TABLE IF NOT EXISTS `sys_objects_wiki` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object` varchar(64) NOT NULL,
  `uri` varchar(32) NOT NULL,
  `title` varchar(255) NOT NULL,
  `module` varchar(32) NOT NULL,
  `override_class_name` varchar(255) NOT NULL,
  `override_class_file` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `object` (`object`),
  UNIQUE KEY `uri` (`uri`)
);

INSERT INTO `sys_objects_wiki` (`object`, `uri`, `title`, `module`, `override_class_name`, `override_class_file`) VALUES
('system', 'sys', '_sys_wiki_system_title', 'system', '', '');


CREATE TABLE IF NOT EXISTS `sys_pages_wiki_blocks` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `block_id` int(11) NOT NULL,
  `revision` int(11) NOT NULL,
  `language` varchar(5) NOT NULL,
  `main_lang` tinyint(4) NOT NULL DEFAULT '0',
  `profile_id` int(10) UNSIGNED NOT NULL,
  `content` mediumtext NOT NULL,
  `unsafe` tinyint(4) NOT NULL DEFAULT '0',
  `notes` varchar(255) NOT NULL,
  `added` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `block_lang_rev` (`block_id`,`language`,`revision`)
);

-- --------------------------------------------------------

--
-- Rewrite Rules
--
CREATE TABLE IF NOT EXISTS `sys_rewrite_rules` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `preg` varchar(255) NOT NULL,
  `service` varchar(255) NOT NULL,
  `active` tinyint(4) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
);

INSERT INTO `sys_rewrite_rules` (`preg`, `service`, `active`) VALUES
('^sys-action/(.*)$', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"wiki_action";s:6:"params";a:2:{i:0;s:3:"sys";i:1;s:3:"{1}";}s:5:"class";s:16:"TemplServiceWiki";}', '1'),
('^home/?$', 'a:3:{s:6:\"module\";s:6:\"system\";s:6:\"method\";s:13:\"home_redirect\";s:6:\"params\";a:0:{}}', 1),
('^sys-agent-form-input/(.*)$', 'a:4:{s:6:\"module\";s:6:\"system\";s:6:\"method\";s:25:\"call_agent_for_form_input\";s:6:\"params\";a:1:{i:0;s:3:\"{1}\";}s:5:\"class\";s:13:\"TemplServices\";}', 1),
('^sys-ai-chat/(.*)$', 'a:4:{s:6:\"module\";s:6:\"system\";s:6:\"method\";s:7:\"ai_chat\";s:6:\"params\";a:1:{i:0;s:3:\"{1}\";}s:5:\"class\";s:13:\"TemplServices\";}', 1);

-- --------------------------------------------------------

--
-- SEO Links
--
CREATE TABLE `sys_seo_links` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `module` varchar(32) NOT NULL,
  `page_uri` varchar(255) NOT NULL,
  `param_name` varchar(32) NOT NULL,
  `param_value` varchar(32) NOT NULL,
  `uri` varchar(50) NOT NULL,
  `added` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `module_page_param` (`module`,`page_uri`(109),`param_value`),
  UNIQUE KEY `module_page_uri` (`module`,`page_uri`(109),`uri`),
  KEY `param_name_value` (`param_name`,`param_value`)
);

CREATE TABLE `sys_seo_uri_rewrites` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uri_orig` varchar(255) NOT NULL,
  `uri_rewrite` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uri_orig` (`uri_orig`(191)),
  UNIQUE KEY `uri_rewrite` (`uri_rewrite`(191))
);

-- --------------------------------------------------------

CREATE TABLE `sys_api_keys` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `key` varchar(48) NOT NULL,
  `order` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`)
);

CREATE TABLE `sys_api_origins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `url` varchar(255) NOT NULL,
  `order` int(11) NOT NULL,
  PRIMARY KEY (`id`)
);

-- --------------------------------------------------------

CREATE TABLE `sys_agents_models` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(64) NOT NULL,
  `model` varchar(64) NOT NULL,
  `title` varchar(64) NOT NULL DEFAULT '',
  `icon` text NOT NULL,
  `docs` text NOT NULL,
  `key` varchar(255) NOT NULL DEFAULT '',
  `params` text NOT NULL,
  `params_user` text DEFAULT NULL,
  `capabilities` enum('chatllm','chatvlm','embeddings') NOT NULL DEFAULT 'chatllm',
  `duplicate` tinyint(4) NOT NULL DEFAULT 1,
  `active` tinyint(4) NOT NULL DEFAULT 1,
  `changed` int(11) UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
);

SET @j = JSON_OBJECT(
    'parameters', JSON_OBJECT()
);
INSERT INTO `sys_agents_models` (`type`, `model`, `title`, `icon`, `docs`, `key`, `params`, `params_user`, `capabilities`, `duplicate`, `active`, `changed`) VALUES
('anthropic', 'claude-sonnet-4-6', 'Anthropic', 'ai-claude.svg', 'https://platform.claude.com/docs/en/about-claude/models/overview', '', CAST(@j AS CHAR), NULL, 'chatvlm', 0, 0, 0);

SET @j = JSON_OBJECT(
    'parameters', JSON_OBJECT(),
    'strict_response', FALSE
);
INSERT INTO `sys_agents_models` (`type`, `model`, `title`, `icon`, `docs`, `key`, `params`, `params_user`, `capabilities`, `duplicate`, `active`, `changed`) VALUES
('openai-responses', 'gpt-5-mini', 'OpenAI (Responses)', 'ai-openai.svg', 'https://developers.openai.com/api/docs/models', '', CAST(@j AS CHAR), NULL, 'chatvlm', 0, 0, 0);

SET @j = JSON_OBJECT(
    'endpoint', 'AZURE_ENDPOINT',
    'version', 'AZURE_API_VERSION'
);
INSERT INTO `sys_agents_models` (`type`, `model`, `title`, `icon`, `docs`, `key`, `params`, `params_user`, `capabilities`, `duplicate`, `active`, `changed`) VALUES
('azure-openai', 'gpt-5-mini', 'Azure OpenAI', 'ai-azure.svg', 'https://ai.azure.com/catalog/publishers/openai', '', CAST(@j AS CHAR), NULL, 'chatvlm', 0, 0, 0);

SET @j = JSON_OBJECT(
    'baseUri', 'https://api.together.xyz/v1',
    'parameters', JSON_OBJECT()
);
INSERT INTO `sys_agents_models` (`type`, `model`, `title`, `icon`, `docs`, `key`, `params`, `params_user`, `capabilities`, `duplicate`, `active`, `changed`) VALUES
('openai-like', 'MODEL_NAME_HERE', 'OpenAI Like', 'ai-openai.svg', 'Use any provider with the same data format like official OpenAI API', '', CAST(@j AS CHAR), NULL, 'chatllm', 0, 0, 0);

SET @j = JSON_OBJECT(
    'url', 'http://localhost:11434/api',
    'parameters', JSON_OBJECT()
);
INSERT INTO `sys_agents_models` (`type`, `model`, `title`, `icon`, `docs`, `key`, `params`, `params_user`, `capabilities`, `duplicate`, `active`, `changed`) VALUES
('ollama', 'llama3.2:1b', 'Ollama', 'ai-ollama.svg', 'Run AI models locally - https://ollama.com/library', '', CAST(@j AS CHAR), NULL, 'chatllm', 0, 0, 0);

SET @j = JSON_OBJECT(
    'parameters', JSON_OBJECT()
);
INSERT INTO `sys_agents_models` (`type`, `model`, `title`, `icon`, `docs`, `key`, `params`, `params_user`, `capabilities`, `duplicate`, `active`, `changed`) VALUES
('gemini', 'gemini-3-flash-preview', 'Gemini', 'ai-gemini.svg', 'https://ai.google.dev/gemini-api/docs/models', '', CAST(@j AS CHAR), NULL, 'chatvlm', 0, 0, 0);

SET @j = JSON_OBJECT(
    'parameters', JSON_OBJECT(),
    'strict_response', FALSE
);
INSERT INTO `sys_agents_models` (`type`, `model`, `title`, `icon`, `docs`, `key`, `params`, `params_user`, `capabilities`, `duplicate`, `active`, `changed`) VALUES
('mistral', 'mistral-medium-2508', 'Mistral', 'ai-mistral.svg', 'https://docs.mistral.ai/getting-started/models', '', CAST(@j AS CHAR), NULL, 'chatvlm', 0, 0, 0);

SET @j = JSON_OBJECT(
    'inferenceProvider', 'hf-inference/models',
    'parameters', JSON_OBJECT(
        'max_tokens', 500,
        'temperature', 0.5
    )
);
INSERT INTO `sys_agents_models` (`type`, `model`, `title`, `icon`, `docs`, `key`, `params`, `params_user`, `capabilities`, `duplicate`, `active`, `changed`) VALUES
('huggingface', 'mistralai/Mistral-7B-Instruct-v0.3', 'HuggingFace', 'ai-huggingface.svg', 'https://huggingface.co/models?pipeline_tag=text-generation', '', CAST(@j AS CHAR), NULL, 'chatllm', 0, 0, 0);

SET @j = JSON_OBJECT(
    'parameters', JSON_OBJECT(),
    'strict_response', FALSE
);
INSERT INTO `sys_agents_models` (`type`, `model`, `title`, `icon`, `docs`, `key`, `params`, `params_user`, `capabilities`, `duplicate`, `active`, `changed`) VALUES
('deepseek', 'deepseek-chat', 'Deepseek', 'ai-deepseek.svg', 'https://api-docs.deepseek.com/quick_start/pricing', '', CAST(@j AS CHAR), NULL, 'chatllm', 0, 0, 0);

SET @j = JSON_OBJECT(
    'parameters', JSON_OBJECT(),
    'strict_response', FALSE
);
INSERT INTO `sys_agents_models` (`type`, `model`, `title`, `icon`, `docs`, `key`, `params`, `params_user`, `capabilities`, `duplicate`, `active`, `changed`) VALUES
('grok', 'grok-4-1-fast-reasoning', 'Grok (X-AI)', 'ai-grok.svg', 'https://docs.x.ai/developers/models', '', CAST(@j AS CHAR), NULL, 'chatvlm', 0, 0, 0);

SET @j = JSON_OBJECT(
    'client_params', JSON_OBJECT(
        'version', 'latest',
        'region', 'us-east-1',
        'credentials', JSON_OBJECT(
            'key', '{key}',
            'secret', 'AWS_BEDROCK_SECRET'
        )
    ),
    'inferenceConfig', JSON_OBJECT()
);
INSERT INTO `sys_agents_models` (`type`, `model`, `title`, `icon`, `docs`, `key`, `params`, `params_user`, `capabilities`, `duplicate`, `active`, `changed`) VALUES
('aws-bedrock', 'google.gemma-3-12b-it', 'AWS Bedrock', 'ai-bedrock.svg', 'https://docs.aws.amazon.com/bedrock/latest/userguide/models.html', '', CAST(@j AS CHAR), NULL, 'chatvlm', 0, 0, 0);

INSERT INTO `sys_agents_models` (`type`, `model`, `title`, `icon`, `docs`, `key`, `params`, `params_user`, `capabilities`, `duplicate`, `active`, `changed`) VALUES
('cohere', 'command-a-03-2025', 'Cohere', 'ai-cohere.svg', 'https://docs.cohere.com/docs/models', '', '', NULL, 'chatllm', 0, 0, 0);

SET @j = JSON_OBJECT(
    'baseUri', 'https://api.moonshot.ai/v1',
    'parameters', JSON_OBJECT(
      'thinking', JSON_OBJECT(
        'type', 'disabled'
      )
    )
);
INSERT INTO `sys_agents_models` (`type`, `model`, `title`, `icon`, `docs`, `key`, `params`, `params_user`, `capabilities`, `duplicate`, `active`, `changed`) VALUES
('openai-like', 'kimi-k2.6', 'Kimi', 'ai-kimi.svg', 'Kimi - https://www.kimi.com/ai-models/kimi-k2-6', '', CAST(@j AS CHAR), NULL, 'chatvlm', 0, 0, 0);


SET @j = JSON_OBJECT(
    'url', 'http://localhost:11434/api',
    'parameters', JSON_OBJECT()
);
INSERT INTO `sys_agents_models` (`type`, `model`, `title`, `icon`, `docs`, `key`, `params`, `params_user`, `capabilities`, `duplicate`, `active`, `changed`) VALUES
('ollama-embeddings', 'all-minilm', 'Ollama', 'ai-ollama.svg', 'With Ollama you can run embedding models locally. Documentation - https://ollama.com/blog/embedding-models', '', CAST(@j AS CHAR), NULL, 'embeddings', 0, 0, 0);

SET @j = JSON_OBJECT(
    'dimensions', 1024
);
INSERT INTO `sys_agents_models` (`type`, `model`, `title`, `icon`, `docs`, `key`, `params`, `params_user`, `capabilities`, `duplicate`, `active`, `changed`) VALUES
('voyageai-embeddings', 'voyage-4-large', 'Voyage AI', 'ai-voyage.svg', 'Models - https://docs.voyageai.com/docs/embeddings, pricing - https://docs.voyageai.com/docs/embeddings', '', CAST(@j AS CHAR), NULL, 'embeddings', 0, 0, 0);

SET @j = JSON_OBJECT(
    'dimensions', 1024
);
INSERT INTO `sys_agents_models` (`type`, `model`, `title`, `icon`, `docs`, `key`, `params`, `params_user`, `capabilities`, `duplicate`, `active`, `changed`) VALUES
('openai-embeddings', 'text-embedding-3-small', 'OpenAI', 'ai-openai.svg', 'Models - https://developers.openai.com/api/docs/guides/embeddings#embedding-models', '', CAST(@j AS CHAR), NULL, 'embeddings', 0, 0, 0);

SET @j = JSON_OBJECT(
    'baseUri', 'PRODIDER_URL'
);
INSERT INTO `sys_agents_models` (`type`, `model`, `title`, `icon`, `docs`, `key`, `params`, `params_user`, `capabilities`, `duplicate`, `active`, `changed`) VALUES
('openai-like-embeddings', 'MODEL_NAME_HER', 'OpenAI Like Embeddings', 'ai-openai.svg', 'Use any providers comaptible with OpenAI API format.', '', CAST(@j AS CHAR), NULL, 'embeddings', 0, 0, 0);

SET @j = JSON_OBJECT(
    'client_params', JSON_OBJECT(
        'version', 'latest',
        'region', 'us-east-1',
        'credentials', JSON_OBJECT(
            'key', '{key}',
            'secret', 'AWS_BEDROCK_SECRET'
        )
    )
);
INSERT INTO `sys_agents_models` (`type`, `model`, `title`, `icon`, `docs`, `key`, `params`, `params_user`, `capabilities`, `duplicate`, `active`, `changed`) VALUES
('aws-bedrock-embeddings', 'amazon.titan-embed-text-v2:0', 'Aws Bedrock', 'ai-bedrock.svg', 'https://docs.aws.amazon.com/bedrock/latest/userguide/titan-embedding-models.html', '', CAST(@j AS CHAR), NULL, 'embeddings', 0, 0, 0);


CREATE TABLE IF NOT EXISTS `sys_agents_automators` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(128) NOT NULL default '',
  `model_id` int(11) NOT NULL default '0',
  `profile_id` int(11) NOT NULL default '0',
  `type` enum('event','scheduler','webhook') NOT NULL DEFAULT 'event',
  `params` text NOT NULL,
  `alert_unit` varchar(128) NOT NULL default '',
  `alert_action` varchar(128) NOT NULL default '',
  `message_id` int(11) NOT NULL default '0',
  `code` text NOT NULL,
  `added` int(11) unsigned NOT NULL DEFAULT '0',
  `messages` int(11) NOT NULL default '0',
  `status` enum('auto','manual','ready') NOT NULL DEFAULT 'auto',
  `active` tinyint(4) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `sys_agents_automators_providers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `automator_id` int(11) NOT NULL DEFAULT '0',
  `provider_id` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `sys_agents_automators_helpers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `automator_id` int(11) NOT NULL DEFAULT '0',
  `helper_id` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `sys_agents_automators_assistants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `automator_id` int(11) NOT NULL DEFAULT '0',
  `assistant_id` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `sys_agents_automators_messages` (
  `cmt_id` int(11) NOT NULL AUTO_INCREMENT,
  `cmt_parent_id` int(11) NOT NULL DEFAULT '0',
  `cmt_vparent_id` int(11) NOT NULL DEFAULT '0',
  `cmt_object_id` int(11) NOT NULL DEFAULT '0',
  `cmt_author_id` int(11) NOT NULL DEFAULT '0',
  `cmt_level` int(11) NOT NULL DEFAULT '0',
  `cmt_text` text NOT NULL,
  `cmt_mood` tinyint(4) NOT NULL DEFAULT '0',
  `cmt_rate` int(11) NOT NULL DEFAULT '0',
  `cmt_rate_count` int(11) NOT NULL DEFAULT '0',
  `cmt_time` int(11) unsigned NOT NULL DEFAULT '0',
  `cmt_replies` int(11) NOT NULL DEFAULT '0',
  `cmt_pinned` int(11) NOT NULL default '0',
  `cmt_cf` int(11) NOT NULL default '1',
  PRIMARY KEY (`cmt_id`),
  KEY `cmt_object_id` (`cmt_object_id`,`cmt_parent_id`),
  FULLTEXT KEY `search_fields` (`cmt_text`)
);

CREATE TABLE IF NOT EXISTS `sys_agents_provider_types` (
  `id` int(11) NOT NULL auto_increment,
  `name` varchar(64) NOT NULL default '',
  `title` varchar(128) NOT NULL default '',
  `option_prefix` varchar(32) NOT NULL default '',
  `active` tinyint(4) NOT NULL default '0',
  `order` tinyint(4) NOT NULL default '0',
  `class_name` varchar(128) NOT NULL default '',
  `class_file` varchar(255) NOT NULL  default '',
  PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `sys_agents_provider_options` (
  `id` int(11) NOT NULL auto_increment,
  `provider_type_id` int(11) NOT NULL default '0',
  `name` varchar(64) NOT NULL default '',
  `type` varchar(64) NOT NULL default 'text',
  `title` varchar(255) NOT NULL default '',
  `description` text NOT NULL default '',
  `extra` varchar(255) NOT NULL default '',
  `check_type` varchar(64) NOT NULL default '',
  `check_params` varchar(128) NOT NULL default '',
  `check_error` varchar(128) NOT NULL default '',
  `order` tinyint(4) NOT NULL default '0',
  PRIMARY KEY(`id`),
  UNIQUE KEY `name`(`name`)
);

-- Shopify (Admin API) source
INSERT INTO `sys_agents_provider_types`(`name`, `title`, `option_prefix`, `active`, `order`, `class_name`, `class_file`) VALUES
('shopify_admin', '_sys_agents_pvd_cpt_shopify_admin', 'shf_adm_', 1, 1, 'BxDolAIProviderShopifyAdmin', '');
SET @iProviderId = LAST_INSERT_ID();

INSERT INTO `sys_agents_provider_options`(`provider_type_id`, `name`, `type`, `title`, `description`, `extra`, `check_type`, `check_params`, `check_error`, `order`) VALUES
(@iProviderId, 'shf_adm_shop_domain', 'text', '_sys_agents_pvd_opt_cpt_shop_domain', '_sys_agents_pvd_opt_dsc_shop_domain', '', '', '', '', 1),
(@iProviderId, 'shf_adm_access_token', 'text', '_sys_agents_pvd_opt_cpt_access_token', '_sys_agents_pvd_opt_dsc_access_token', '', '', '', '', 2),
(@iProviderId, 'shf_adm_secret_key', 'text', '_sys_agents_pvd_opt_cpt_secret_key', '_sys_agents_pvd_opt_dsc_secret_key', '', '', '', '', 3),
(@iProviderId, 'shf_adm_webhook_url', 'value', '_sys_agents_pvd_opt_cpt_webhook_url', '_sys_agents_pvd_opt_dsc_webhook_url', '', '', '', '', 4);

CREATE TABLE IF NOT EXISTS `sys_agents_providers` (
  `id` int(11) NOT NULL auto_increment,
  `name` varchar(128) NOT NULL default '',
  `type_id` int(11) NOT NULL default '0',
  `profile_id` int(11) NOT NULL default '0',
  `added` int(11) NOT NULL default '0',
  `active` tinyint(4) NOT NULL default '1',
  PRIMARY KEY(`id`),
  UNIQUE KEY `name`(`name`)
);

CREATE TABLE IF NOT EXISTS `sys_agents_providers_values` (
  `id` int(11) NOT NULL auto_increment,
  `provider_id` int(11) NOT NULL default '0',
  `option_id` int(11) NOT NULL default '0',  
  `value` varchar(255) NOT NULL default '',
  PRIMARY KEY(`id`),
  UNIQUE KEY `value`(`provider_id`, `option_id`)
);

CREATE TABLE IF NOT EXISTS `sys_agents_helpers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(128) DEFAULT NULL,
  `model_id` int(11) NOT NULL DEFAULT 0,
  `profile_id` int(11) NOT NULL DEFAULT 0,
  `description` text NOT NULL,
  `prompt` text DEFAULT NULL,
  `added` int(11) NOT NULL DEFAULT 0,
  `active` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name`(`name`)
);

CREATE TABLE IF NOT EXISTS `sys_agents_assistants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(128) NOT NULL DEFAULT '',
  `model_id` int(11) NOT NULL DEFAULT 0,
  `profile_id` int(11) NOT NULL DEFAULT 0,
  `description` text NOT NULL,
  `prompt` text NOT NULL,
  `ai_vs_id` varchar(64) NOT NULL DEFAULT '',
  `ai_asst_id` varchar(64) NOT NULL DEFAULT '',
  `added` int(11) NOT NULL DEFAULT 0,
  `active` tinyint(4) NOT NULL DEFAULT 0,
  `hidden` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name`(`name`)
);

CREATE TABLE IF NOT EXISTS `sys_agents_assistants_files` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(128) NOT NULL DEFAULT '',
  `assistant_id` int(11) NOT NULL DEFAULT 0,
  `added` int(11) NOT NULL DEFAULT 0,
  `ai_file_id` varchar(64) NOT NULL DEFAULT '',
  `ai_file_size` int(11) NOT NULL DEFAULT 0,
  `ai_file_status` varchar(64) NOT NULL DEFAULT 'in_progress',
  `locked` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `sys_agents_assistants_chats` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(128) NOT NULL DEFAULT '',
  `type` tinyint(4) NOT NULL DEFAULT 1,
  `assistant_id` int(11) NOT NULL DEFAULT 0,
  `description` text NOT NULL,
  `message_id` int(11) NOT NULL DEFAULT 0,
  `messages` int(11) NOT NULL DEFAULT 0,
  `added` int(11) NOT NULL DEFAULT 0,
  `ai_thread_id` varchar(64) NOT NULL DEFAULT '',
  `ai_file_id` varchar(64) NOT NULL DEFAULT '',
  `stored` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `sys_agents_assistants_chats_messages` (
  `cmt_id` int(11) NOT NULL AUTO_INCREMENT,
  `cmt_parent_id` int(11) NOT NULL DEFAULT '0',
  `cmt_vparent_id` int(11) NOT NULL DEFAULT '0',
  `cmt_object_id` int(11) NOT NULL DEFAULT '0',
  `cmt_author_id` int(11) NOT NULL DEFAULT '0',
  `cmt_level` int(11) NOT NULL DEFAULT '0',
  `cmt_text` text NOT NULL,
  `cmt_mood` tinyint(4) NOT NULL DEFAULT '0',
  `cmt_rate` int(11) NOT NULL DEFAULT '0',
  `cmt_rate_count` int(11) NOT NULL DEFAULT '0',
  `cmt_time` int(11) unsigned NOT NULL DEFAULT '0',
  `cmt_replies` int(11) NOT NULL DEFAULT '0',
  `cmt_pinned` int(11) NOT NULL default '0',
  `cmt_cf` int(11) NOT NULL default '1',
  PRIMARY KEY (`cmt_id`),
  KEY `cmt_object_id` (`cmt_object_id`,`cmt_parent_id`),
  FULLTEXT KEY `search_fields` (`cmt_text`)
);

CREATE TABLE IF NOT EXISTS `sys_agents_assistants_chats_files` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `profile_id` int(10) unsigned NOT NULL,
  `remote_id` varchar(128) NOT NULL,
  `path` varchar(255) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `mime_type` varchar(128) NOT NULL,
  `ext` varchar(32) NOT NULL,
  `size` bigint(20) NOT NULL,
  `dimensions` varchar(24) NOT NULL,
  `added` int(11) NOT NULL,
  `modified` int(11) NOT NULL,
  `private` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `remote_id` (`remote_id`)
);

CREATE TABLE `sys_agents_agents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(128) NOT NULL DEFAULT '',
  `title` varchar(128) NOT NULL DEFAULT '',
  `description` text NOT NULL,
  `icon` text NOT NULL,
  `model_id` int(11) NOT NULL DEFAULT 0,
  `profile_id` int(11) NOT NULL DEFAULT 0,
  `prompt_system` text NOT NULL,
  `prompt_steps` text NOT NULL,
  `prompt_output` text NOT NULL,
  `prompt_tools` text NOT NULL,
  `tools` varchar(255) NOT NULL DEFAULT '',
  `tools_max_run` int(11) NOT NULL DEFAULT 10,
  `chat_history_context` int(11) NOT NULL DEFAULT 50000,
  `vector_store_id` int(11) NOT NULL,
  `trigger` enum('alert','scheduler','webhook','manual','agent','message','form-input') NOT NULL DEFAULT 'message',
  `async` tinyint(4) NOT NULL DEFAULT 0,
  `alert` varchar(192) NOT NULL DEFAULT '',
  `scheduler_cron` varchar(64) NOT NULL,
  `webhook_key` varchar(255) NOT NULL,
  `webhook_sample` text NOT NULL,
  `form_object` varchar(128) NOT NULL,
  `form_input` varchar(128) NOT NULL,
  `agent_sample` text NOT NULL,
  `message_profile_id` int(11) NOT NULL,
  `added` int(11) UNSIGNED NOT NULL DEFAULT 0,
  `active` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `alert` (`alert`),
  KEY `profile_id` (`profile_id`,`message_profile_id`),
  KEY `webhook_key` (`webhook_key`(192))
);

CREATE TABLE IF NOT EXISTS `sys_agents_vector_store_data` (
  `id` int(11) NOT NULL AUTO_INCREMENT,  
  `vector_store_id` int(11) NOT NULL,
  `type` varchar(128) NOT NULL,
  `name` varchar(255) NOT NULL DEFAULT '',
  `size` int(11) NOT NULL DEFAULT 0,
  `metadata` text NOT NULL DEFAULT '',
  `settings` varchar(255) NOT NULL DEFAULT '',
  `content` longtext NOT NULL DEFAULT '',
  `status` enum('pending', 'processing','ready','error') NOT NULL DEFAULT 'pending',  
  `added` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `sys_agents_vector_store` (
  `id` int(11) NOT NULL AUTO_INCREMENT,  
  `embedding_provider_id` int(11) NOT NULL,
  `type` varchar(128) NOT NULL,
  `title` varchar(255) NOT NULL DEFAULT '',
  `docs` text DEFAULT NULL,
  `topk` tinyint(4) DEFAULT 4,
  `params` text DEFAULT NULL,
  `params_user` text DEFAULT NULL,
  `duplicate` tinyint(4) NOT NULL DEFAULT 1,
  `changed` int(11) NOT NULL DEFAULT 0,
  `active` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
);

-- 1. File
SET @j = JSON_OBJECT(
    'folder', 'vectorstore'
);
INSERT INTO sys_agents_vector_store (type, title, docs, topk, params, duplicate, changed, active)
VALUES ('file', 'File', 'Local low volume embeddings storage', 4, CAST(@j AS CHAR), 0, 0, 0);

-- 2. Pinecone
SET @j = JSON_OBJECT(
    'key', 'PINECONE_API_KEY',
    'indexUrl', 'PINECONE_INDEX_URL'
);
INSERT INTO sys_agents_vector_store (type, title, docs, topk, params, duplicate, changed, active)
VALUES ('pinecone', 'Pinecone', 'https://www.pinecone.io/', 4, CAST(@j AS CHAR), 0, 0, 0);

-- 3. Elasticsearch
SET @j = JSON_OBJECT(
    'client_params', JSON_OBJECT(
        'endpoint', 'ELASTICSEARCH-ENDPOINT',
        'key', 'API-KEY'
    ),
    'index', 'vectorstore'
);
INSERT INTO sys_agents_vector_store (type, title, docs, topk, params, duplicate, changed, active)
VALUES ('elasticsearch', 'Elasticsearch', 'https://www.elastic.co/elasticsearch/vector-database', 4, CAST(@j AS CHAR), 0, 0, 0);

-- 4. Opensearch
SET @j = JSON_OBJECT(
    'client_params', JSON_OBJECT(
        'base_uri', 'http://localhost:9200'
    ),
    'index', 'vectorstore'
);
INSERT INTO sys_agents_vector_store (type, title, docs, topk, params, duplicate, changed, active)
VALUES ('opensearch', 'Opensearch', 'Free open source fork of Elasticsearch - https://opensearch.org/', 4, CAST(@j AS CHAR), 0, 0, 0);

-- 5. Typesense
SET @j = JSON_OBJECT(
    'client_params', JSON_OBJECT(
        'api_key', 'TYPESENSE_API_KEY',
        'nodes', JSON_ARRAY(
            JSON_OBJECT(
                'host', 'TYPESENSE_NODE_HOST',
                'port', 'TYPESENSE_NODE_PORT',
                'protocol', 'TYPESENSE_NODE_PROTOCOL'
            )
        )
    ),
    'collection', 'vectorstore',
    'vectorDimension', 1024
);
INSERT INTO sys_agents_vector_store (type, title, docs, topk, params, duplicate, changed, active)
VALUES ('typesense', 'Typesense', 'https://typesense.org/', 4, CAST(@j AS CHAR), 0, 0, 0);

-- 6. Qdrant
SET @j = JSON_OBJECT(
    'collectionUrl', 'http://localhost:6333/collections/neuron-ai/',
    'key', 'QDRANT_API_KEY'
);
INSERT INTO sys_agents_vector_store (type, title, docs, topk, params, duplicate, changed, active)
VALUES ('qdrant', 'Qdrant', 'https://qdrant.tech/', 4, CAST(@j AS CHAR), 0, 0, 0);

-- 7. ChromaDB
SET @j = JSON_OBJECT(
    'collection', 'vectorstore',
    'host', 'http://localhost:8000'
);
INSERT INTO sys_agents_vector_store (type, title, docs, topk, params, duplicate, changed, active)
VALUES ('chromadb', 'ChromaDB', 'https://www.trychroma.com/products/chromadb', 5, CAST(@j AS CHAR), 0, 0, 0);

-- 8. Meilisearch
SET @j = JSON_OBJECT(
    'indexUid', 'MEILISEARCH_INDEXUID',
    'host', 'http://localhost:8000',
    'key', 'MEILISEARCH_API_KEY',
    'embedder', 'default'
);
INSERT INTO sys_agents_vector_store (type, title, docs, topk, params, duplicate, changed, active)
VALUES ('meilisearch', 'Meilisearch', 'https://www.meilisearch.com/', 5, CAST(@j AS CHAR), 0, 0, 0);


CREATE TABLE IF NOT EXISTS `sys_agents_tools` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(128) NOT NULL,
  `title` varchar(255) NOT NULL DEFAULT '',
  `docs` text DEFAULT NULL,
  `params` text DEFAULT NULL,
  `params_user` text DEFAULT NULL,
  `duplicate` tinyint(4) NOT NULL DEFAULT 1,
  `changed` int(11) NOT NULL DEFAULT 0,
  `active` tinyint(4) NOT NULL DEFAULT 0,
  `class_name` varchar(255) NOT NULL DEFAULT '',
  `class_file` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
);

INSERT INTO `sys_agents_tools` (`type`, `title`, `docs`, `params`, `params_user`, `duplicate`, `changed`, `active`, `class_name`, `class_file`) VALUES
('mysql_schema', 'MySQL Schema', 'This tool allows agents to understand the structure of the database, enabling them to construct intelligent queries without requiring you to hardcode table structures or relationships into the prompts. This tool essentially gives your agent the equivalent of a database administrator''s understanding of your schema, allowing it to craft queries that respect your data model and take advantage of existing indexes.  \r\nIt reads all tables by default, but it''s possible to limit it to a certain number of tables by providing the list in the `tables` parameter. By limiting the schema scope, you can create specialized agents that focus on specific areas of the site.', '{\"tables\":[]}', NULL, 0, 0, 1, '', ''),
('mysql_select', 'MySQL Select', 'Use this tool to make your agent able to run SELECT query against the database. It''s like read-only access without ability to change anything in the DB. It works the best in par of MySQL Schema tool.  \r\nNo parameters are needed for this tool.', '{}', NULL, 0, 0, 1, '', ''),
('mysql_write', 'MySQL Write', 'Use this tool to make your agent able to performs write operations against the database (INSERT, UPDATE, DELETE). It works the best in par of MySQL Schema tool.   \r\nNo parameters are needed for this tool.  \r\n**USE WITH CAUTION**', '{}', NULL, 0, 0, 0, '', ''),

('content_structure', 'Content modules structure', 'This tool allows agents to understand the structure of content modules fields,  allowing them to call content adding and editing with correct data. It provide knowledge of what content modules are available and what the fields in them, event if fields are changed in fields builder.', '{}', NULL, 0, 0, 1, 'BxDolAIToolContentStructure', ''),
('content_get', 'Content modules get', 'This tool allows agents to get info about specific content by module name and content id.', '{}', NULL, 0, 0, 1, 'BxDolAIToolContentGet', ''),
('content_search', 'Content modules search', 'This tool allows agents to search for content items based on a keyword and optional sections.', '{}', NULL, 0, 0, 1, 'BxDolAIToolContentSearch', ''),
('content_delete', 'Content modules delete', 'This tool allows agents to delete content. ', '{}', NULL, 0, 0, 1, 'BxDolAIToolContentDelete', ''),
('content_add', 'Content modules add', 'This tool allows agents to add new content. It works with the "content_structure" tool to get knowledge about content modules fields for add actions.', '{}', NULL, 0, 0, 1, 'BxDolAIToolContentAdd', ''),
('content_update', 'Content modules update', 'This tool allows agents to update existing content. It works with the "content_structure" tool to get knowledge about content modules fields for update actions.', '{}', NULL, 0, 0, 1, 'BxDolAIToolContentUpdate', ''),

('comments_get', 'Comments get', 'This tool allows agents to get comments for specific content by module name and content id.', '{}', NULL, 0, 0, 1, 'BxDolAIToolCmtsGet', ''),
('comments_add', 'Comments add', 'This tool allows agents to post comments for specific content.', '{}', NULL, 0, 0, 1, 'BxDolAIToolCmtsAdd', ''),
('comments_update', 'Comments update', 'This tool allows agents to edit comments.', '{}', NULL, 0, 0, 1, 'BxDolAIToolCmtsUpdate', ''),
('comments_delete', 'Comments delete', 'This tool allows agents to delete comments.', '{}', NULL, 0, 0, 1, 'BxDolAIToolCmtsDelete', ''),

('comment_get', 'Comment get', 'This tool allows agents to get single comment by global comment id.', '{}', NULL, 0, 0, 1, 'BxDolAIToolCmtsGetSingle', '');

CREATE TABLE IF NOT EXISTS `sys_agents_chat_history` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `thread_id` VARCHAR(255) NOT NULL,
  `messages` LONGTEXT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_thread_id` (`thread_id`(192))
);

-- --------------------------------------------------------

--
-- Table structure for table `sys_preloader`
--
CREATE TABLE IF NOT EXISTS `sys_preloader` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `module` varchar(32) NOT NULL,
  `type` varchar(16) NOT NULL,
  `content` varchar(255) NOT NULL,
  `active` tinyint(4) NOT NULL DEFAULT '1',
  `order` int(11) unsigned NOT NULL default '0',
  PRIMARY KEY (`id`)
);

INSERT INTO `sys_preloader`(`module`, `type`, `content`, `active`, `order`) VALUES
('system', 'css_system', '{dir_plugins_public}marka/|marka.min.css', 1, 1),
('system', 'css_system', '{dir_plugins_public}at.js/css/|jquery.atwho.min.css', 1, 2),
('system', 'css_system', '{dir_plugins_public}prism/|prism.css', 1, 3),
('system', 'css_system', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:21:"get_preloader_content";s:6:"params";a:1:{i:0;s:8:"tailwind";}s:5:"class";s:12:"BaseServices";}', 1, 4),
('system', 'css_system', 'common.css', 1, 10),
('system', 'css_system', 'default.less', 1, 11),
('system', 'css_system', 'general.css', 1, 12),
('system', 'css_system', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:21:"get_preloader_content";s:6:"params";a:1:{i:0;s:9:"icons_css";}s:5:"class";s:12:"BaseServices";}', 1, 13),
('system', 'css_system', 'colors.css', 1, 14),
('system', 'css_system', 'forms.css', 1, 15),
('system', 'css_system', 'media-desktop.css', 1, 20),
('system', 'css_system', 'media-tablet.css', 1, 21),
('system', 'css_system', 'media-phone.css', 1, 22),
('system', 'css_system', 'media-print.css', 1, 23),
('system', 'css_system', 'cmts.css', 1, 30),
('system', 'css_system', 'favorite.css', 1, 31),
('system', 'css_system', 'feature.css', 1, 32),
('system', 'css_system', 'report.css', 1, 33),
('system', 'css_system', 'score.css', 1, 34),
('system', 'css_system', 'view.css', 1, 35),
('system', 'css_system', 'vote.css', 1, 36),
('system', 'css_system', '{dir_plugins_public}spin.js/|spin.css', 1, 37),

('system', 'js_system', 'pusher/pusher.min.js', 1, 0),
('system', 'js_system', 'jquery/jquery.min.js', 1, 1),
('system', 'js_system', 'jquery/jquery-migrate.min.js', 1, 2),
('system', 'js_system', 'jquery-ui/jquery-ui.min.js', 1, 3),
('system', 'js_system', 'jquery.easing.js', 1, 4),
('system', 'js_system', 'jquery.cookie.min.js', 1, 5),
('system', 'js_system', 'jquery.form.min.js', 1, 6),
('system', 'js_system', 'spin.js/spin.js', 1, 7),
('system', 'js_system', 'moment-with-locales.min.js', 1, 8),
('system', 'js_system', 'marka/marka.min.js', 1, 9),
('system', 'js_system', 'headroom.min.js', 1, 10),
('system', 'js_system', 'at.js/js/jquery.atwho.min.js', 1, 11),
('system', 'js_system', 'prism/prism.js', 1, 12),
('system', 'js_system', 'htmx/htmx.min.js', 1, 13),
('system', 'js_system', 'htmx/head-support.min.js', 1, 14),
('system', 'js_system', 'htmx/preload.min.js', 1, 15),
('system', 'js_system', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:21:"get_preloader_content";s:6:"params";a:1:{i:0;s:8:"icons_js";}s:5:"class";s:12:"BaseServices";}', 1, 20),
('system', 'js_system', 'functions.js', 1, 20),
('system', 'js_system', 'jquery.webForms.js', 1, 21),
('system', 'js_system', 'jquery.dolPopup.js', 1, 22),
('system', 'js_system', 'jquery.dolConverLinks.js', 1, 23),
('system', 'js_system', 'jquery.anim.js', 1, 24),
('system', 'js_system', 'jquery.ba-resize.min.js', 1, 25),
('system', 'js_system', 'BxDolCmts.js', 1, 30),
('system', 'js_system', 'BxDolFavorite.js', 1, 31),
('system', 'js_system', 'BxDolFeature.js', 1, 32),
('system', 'js_system', 'BxDolReport.js', 1, 33),
('system', 'js_system', 'BxDolScore.js', 1, 34),
('system', 'js_system', 'BxDolView.js', 1, 35),
('system', 'js_system', 'BxDolVote.js', 1, 36),
('system', 'js_system', 'BxDolVoteLikes.js', 1, 37),
('system', 'js_system', 'BxDolVoteReactions.js', 1, 38),
('system', 'js_system', 'BxDolVoteStars.js', 1, 39),
('system', 'js_system', 'BxDolCmtsReviews.js', 1, 40),
('system', 'js_system', 'BxDolMenuMoreAuto.js', 1, 41),
('system', 'js_system', 'BxDolForm.js', 1, 42),
('system', 'js_system', 'BxDolNestedForm.js', 1, 43),
('system', 'js_system', 'BxDolConnection.js', 1, 44),
('system', 'js_system', 'BxDolSockets.js', 1, 45),
('system', 'js_system', 'bundle.js', 1, 46),

('system', 'js_translation', '_Are_you_sure', 1, 1),
('system', 'js_translation', '_error occured', 1, 2),
('system', 'js_translation', '_sys_loading', 1, 3),
('system', 'js_translation', '_copyright', 1, 4),
('system', 'js_translation', '_sys_redirect_confirmation', 1, 5),
('system', 'js_translation', '_sys_form_input_password_show', 1, 6),
('system', 'js_translation', '_sys_form_input_password_hide', 1, 7);
            
-- --------------------------------------------------------

--
-- Table structure for table `sys_std_roles`
--
CREATE TABLE `sys_std_roles` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(64) NOT NULL default '',
  `title` varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL default '',
  `active` tinyint(4) NOT NULL DEFAULT '1',
  `order` int(11) NOT NULL default '0',
  PRIMARY KEY  (`id`),
  UNIQUE KEY `name` (`name`),
  FULLTEXT KEY `searchable` (`title`, `description`)
);

INSERT INTO `sys_std_roles` (`id`, `name`, `title`, `description`, `active`, `order`) VALUES
(1, 'master', '_adm_rl_txt_role_master', '_adm_rl_txt_role_master_dsc', 1, 1),
(2, 'operator', '_adm_rl_txt_role_operator', '_adm_rl_txt_role_operator_dsc', 1, 2);

-- --------------------------------------------------------

--
-- Table structure for table `sys_std_roles_actions`
--
CREATE TABLE `sys_std_roles_actions` (  
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(64) NOT NULL default '',
  `title` varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL,
  PRIMARY KEY  (`id`),
  FULLTEXT KEY `searchable` (`title`, `description`)
);

-- --------------------------------------------------------

--
-- Table structure for table `sys_std_roles_actions2roles`
--
CREATE TABLE `sys_std_roles_actions2roles` (  
  `role_id` int(11) unsigned NOT NULL default '0',
  `action_id` int(11) unsigned NOT NULL default '0',
  PRIMARY KEY  (`role_id`, `action_id`)
);

INSERT INTO `sys_std_roles_actions` (`name`, `title`, `description`) VALUES
('manage roles', '_adm_rl_txt_action_manage_roles', '_adm_rl_txt_action_manage_roles_dsc');
SET @iIdActionManageRoles = LAST_INSERT_ID();

INSERT INTO `sys_std_roles_actions` (`name`, `title`, `description`) VALUES
('manage apps', '_adm_rl_txt_action_manage_apps', '_adm_rl_txt_action_manage_apps_dsc');
SET @iIdActionManageApps = LAST_INSERT_ID();

INSERT INTO `sys_std_roles_actions` (`name`, `title`, `description`) VALUES
('use appearance', '_adm_rl_txt_action_use_appearance', '_adm_rl_txt_action_use_appearance_dsc');
SET @iIdActionUseAppearance = LAST_INSERT_ID();

INSERT INTO `sys_std_roles_actions` (`name`, `title`, `description`) VALUES
('use structure', '_adm_rl_txt_action_use_structure', '_adm_rl_txt_action_use_structure_dsc');
SET @iIdActionUseStructure = LAST_INSERT_ID();

INSERT INTO `sys_std_roles_actions` (`name`, `title`, `description`) VALUES
('use content', '_adm_rl_txt_action_use_content', '_adm_rl_txt_action_use_content_dsc');
SET @iIdActionUseContent = LAST_INSERT_ID();

INSERT INTO `sys_std_roles_actions` (`name`, `title`, `description`) VALUES
('use users', '_adm_rl_txt_action_use_users', '_adm_rl_txt_action_use_users_dsc');
SET @iIdActionUseUsers = LAST_INSERT_ID();

INSERT INTO `sys_std_roles_actions` (`name`, `title`, `description`) VALUES
('use configuration', '_adm_rl_txt_action_use_configuration', '_adm_rl_txt_action_use_configuration_dsc');
SET @iIdActionUseConfiguration = LAST_INSERT_ID();

INSERT INTO `sys_std_roles_actions` (`name`, `title`, `description`) VALUES
('use extensions', '_adm_rl_txt_action_use_extensions', '_adm_rl_txt_action_use_extensions_dsc');
SET @iIdActionUseExtensions = LAST_INSERT_ID();

INSERT INTO `sys_std_roles_actions` (`name`, `title`, `description`) VALUES
('use integrations', '_adm_rl_txt_action_use_integrations', '_adm_rl_txt_action_use_integrations_dsc');
SET @iIdActionUseIntegrations = LAST_INSERT_ID();

SET @iMaster = 1;
SET @iOperator = 2;

INSERT INTO `sys_std_roles_actions2roles` (`role_id`, `action_id`) VALUES

-- manage roles
(@iMaster, @iIdActionManageRoles),
(@iMaster, @iIdActionManageApps),

-- use appearance
(@iMaster, @iIdActionUseAppearance),
(@iOperator, @iIdActionUseAppearance),

-- use structure
(@iMaster, @iIdActionUseStructure),
(@iOperator, @iIdActionUseStructure),

-- use content
(@iMaster, @iIdActionUseContent),
(@iOperator, @iIdActionUseContent),

-- use users
(@iMaster, @iIdActionUseUsers),
(@iOperator, @iIdActionUseUsers),

-- use configuration
(@iMaster, @iIdActionUseConfiguration),
(@iOperator, @iIdActionUseConfiguration),

-- use extensions
(@iMaster, @iIdActionUseExtensions),
(@iOperator, @iIdActionUseExtensions),

-- use integrations
(@iMaster, @iIdActionUseIntegrations),
(@iOperator, @iIdActionUseIntegrations);

-- --------------------------------------------------------

--
-- Table structure for table `sys_std_roles_members`
--

CREATE TABLE `sys_std_roles_members` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `account_id` int(11) unsigned NOT NULL default '0',
  `role` int(11) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY  (`id`),
  UNIQUE KEY `account` (`account_id`)
);

-- --------------------------------------------------------

--
-- Table structure for table `sys_std_pages`
--
CREATE TABLE `sys_std_pages` (
  `id` int(11) unsigned NOT NULL auto_increment,
  `index` int(11) unsigned NOT NULL default '0',
  `name` varchar(64) NOT NULL default '',
  `header` varchar(255) NOT NULL default '',
  `caption` varchar(255) NOT NULL default '',
  `icon` varchar(255) NOT NULL default '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
);

-- --------------------------------------------------------

--
-- Table structure for table `sys_std_widgets`
--
CREATE TABLE `sys_std_widgets` (
  `id` int(11) unsigned NOT NULL auto_increment,
  `page_id` varchar(255) NOT NULL default '',
  `module` varchar(32) NOT NULL default '',
  `type` varchar(32) NOT NULL default '',
  `url` varchar(255) NOT NULL default '',
  `click` text NOT NULL default '',
  `icon` varchar(255) NOT NULL default '',
  `caption` varchar(255) NOT NULL default '',
  `cnt_notices` text NOT NULL default '',
  `cnt_actions` text NOT NULL default '',
  `featured` tinyint(4) unsigned NOT NULL default '0',
  PRIMARY KEY (`ID`),
  UNIQUE KEY `widget-page` (`id`, `page_id`(187))
);

--
-- Table structure for table `sys_std_widgets_bookmarks`
--
CREATE TABLE `sys_std_widgets_bookmarks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `widget_id` int(11) unsigned NOT NULL default '0',
  `profile_id` int(11) unsigned NOT NULL default '0',
  `bookmark` tinyint(4) unsigned NOT NULL default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `bookmark` (`widget_id`, `profile_id`)
);

-- --------------------------------------------------------

--
-- Table structure for table `sys_std_pages_widgets`
--
CREATE TABLE `sys_std_pages_widgets` (
  `id` int(11) unsigned NOT NULL auto_increment,
  `page_id` int(11) unsigned NOT NULL default '0',
  `widget_id` int(11) unsigned NOT NULL default '0',
  `order` int(11) unsigned NOT NULL default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `wid_pag` (`widget_id`, `page_id`)
);
  

--
-- Dumping data for table `sys_std_pages`
--
INSERT INTO `sys_std_pages`(`index`, `name`, `header`, `caption`, `icon`) VALUES
(3, 'home', '_adm_page_cpt_home', '_adm_page_cpt_home', 'bc-home.svg');
SET @iIdHome = LAST_INSERT_ID();

INSERT INTO `sys_std_pages`(`index`, `name`, `header`, `caption`, `icon`) VALUES
(4, 'dashboard', '_adm_page_cpt_dashboard', '_adm_page_cpt_dashboard', 'wi-dashboard.svg');
SET @iIdDashboard = LAST_INSERT_ID();

INSERT INTO `sys_std_pages`(`index`, `name`, `header`, `caption`, `icon`) VALUES
(3, 'settings', '_adm_page_cpt_settings', '_adm_page_cpt_settings', 'wi-settings.svg');
SET @iIdSettings = LAST_INSERT_ID();

INSERT INTO `sys_std_pages`(`index`, `name`, `header`, `caption`, `icon`) VALUES
(3, 'store', '_adm_page_cpt_store', '_adm_page_cpt_store', 'wi-store.svg');
SET @iIdStore = LAST_INSERT_ID();

INSERT INTO `sys_std_pages`(`index`, `name`, `header`, `caption`, `icon`) VALUES
(3, 'designer', '_adm_page_cpt_designer', '_adm_page_cpt_designer', 'wi-designer.svg');
SET @iIdDesigner = LAST_INSERT_ID();

INSERT INTO `sys_std_pages`(`index`, `name`, `header`, `caption`, `icon`) VALUES
(3, 'polyglot', '_adm_page_cpt_polyglot', '_adm_page_cpt_polyglot', 'wi-polyglot.svg');
SET @iIdPolyglot = LAST_INSERT_ID();

INSERT INTO `sys_std_pages`(`index`, `name`, `header`, `caption`, `icon`) VALUES
(3, 'builder_pages', '_adm_page_cpt_builder_pages', '_adm_page_cpt_builder_pages', 'wi-bld-pages.svg');
SET @iIdBuilderPages = LAST_INSERT_ID();

INSERT INTO `sys_std_pages`(`index`, `name`, `header`, `caption`, `icon`) VALUES
(3, 'builder_menus', '_adm_page_cpt_builder_menus', '_adm_page_cpt_builder_menus', 'wi-bld-navigation.svg');
SET @iIdBuilderMenus = LAST_INSERT_ID();

INSERT INTO `sys_std_pages`(`index`, `name`, `header`, `caption`, `icon`) VALUES
(3, 'builder_forms', '_adm_page_cpt_builder_forms', '_adm_page_cpt_builder_forms', 'wi-bld-forms.svg');
SET @iIdBuilderForms = LAST_INSERT_ID();

INSERT INTO `sys_std_pages`(`index`, `name`, `header`, `caption`, `icon`) VALUES
(3, 'builder_permissions', '_adm_page_cpt_builder_permissions', '_adm_page_cpt_builder_permissions', 'wi-bld-permissions.svg');
SET @iIdBuilderPermissions = LAST_INSERT_ID();

INSERT INTO `sys_std_pages`(`index`, `name`, `header`, `caption`, `icon`) VALUES
(3, 'builder_roles', '_adm_page_cpt_builder_roles', '_adm_page_cpt_builder_roles', 'wi-bld-roles.svg');
SET @iIdBuilderRoles = LAST_INSERT_ID();

INSERT INTO `sys_std_pages`(`index`, `name`, `header`, `caption`, `icon`) VALUES
(3, 'storages', '_adm_page_cpt_storages', '_adm_page_cpt_storages', 'wi-storages.svg');
SET @iIdManagerStorages = LAST_INSERT_ID();

INSERT INTO `sys_std_pages`(`index`, `name`, `header`, `caption`, `icon`) VALUES
(3, 'audit', '_adm_page_cpt_audit', '_adm_page_cpt_audit', 'wi-audit.svg');
SET @iIdAudit = LAST_INSERT_ID();

INSERT INTO `sys_std_pages`(`index`, `name`, `header`, `caption`, `icon`) VALUES
(3, 'badges', '_adm_page_cpt_badges', '_adm_page_cpt_badges', 'wi-badges.svg');
SET @iIdBadges = LAST_INSERT_ID();

INSERT INTO `sys_std_pages`(`index`, `name`, `header`, `caption`, `icon`) VALUES
(3, 'api', '_adm_page_cpt_api', '_adm_page_cpt_api', 'wi-api.svg');
SET @iIdAPI = LAST_INSERT_ID();

INSERT INTO `sys_std_pages`(`index`, `name`, `header`, `caption`, `icon`) VALUES
(3, 'agents', '_adm_page_cpt_agents', '_adm_page_cpt_agents', 'wi-agents.svg');
SET @iIdAgents = LAST_INSERT_ID();

--
-- Dumping data for table `sys_std_widgets` and `sys_std_pages_widgets`
-- Home Page
--
INSERT INTO `sys_std_widgets`(`page_id`, `module`, `type`, `url`, `click`, `icon`, `caption`, `cnt_notices`, `cnt_actions`) VALUES
(@iIdSettings, 'system', 'configuration', '{url_studio}settings.php', '', 'wi-settings.svg', '_adm_wgt_cpt_settings', '', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_actions";s:6:"params";a:0:{}s:5:"class";s:18:"TemplStudioModules";}');
INSERT INTO `sys_std_pages_widgets`(`page_id`, `widget_id`, `order`) VALUES(@iIdHome, LAST_INSERT_ID(), 3);

INSERT INTO `sys_std_widgets`(`page_id`, `module`, `type`, `url`, `click`, `icon`, `caption`, `cnt_notices`, `cnt_actions`) VALUES
(@iIdStore, 'system', 'extensions', '{url_studio}store.php', '', 'wi-store.svg', '_adm_wgt_cpt_store', '', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_actions";s:6:"params";a:0:{}s:5:"class";s:18:"TemplStudioModules";}');
INSERT INTO `sys_std_pages_widgets`(`page_id`, `widget_id`, `order`) VALUES(@iIdHome, LAST_INSERT_ID(), 2);

INSERT INTO `sys_std_widgets`(`page_id`, `module`, `type`, `url`, `click`, `icon`, `caption`, `cnt_notices`, `cnt_actions`, `featured`) VALUES
(@iIdDashboard, 'system', '', '{url_studio}dashboard.php', '', 'wi-dashboard.svg', '_adm_wgt_cpt_dashboard', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:18:"get_widget_notices";s:6:"params";a:0:{}s:5:"class";s:20:"TemplStudioDashboard";}', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_actions";s:6:"params";a:0:{}s:5:"class";s:18:"TemplStudioModules";}', 1);
INSERT INTO `sys_std_pages_widgets`(`page_id`, `widget_id`, `order`) VALUES(@iIdHome, LAST_INSERT_ID(), 1);


--
-- Templates Page
--
INSERT INTO `sys_std_widgets`(`page_id`, `module`, `type`, `url`, `click`, `icon`, `caption`, `cnt_notices`, `cnt_actions`) VALUES
(@iIdDesigner, 'system', 'appearance', '{url_studio}designer.php', '', 'wi-designer.svg', '_adm_wgt_cpt_designer', '', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_actions";s:6:"params";a:0:{}s:5:"class";s:18:"TemplStudioModules";}');
INSERT INTO `sys_std_pages_widgets`(`page_id`, `widget_id`, `order`) VALUES(@iIdHome, LAST_INSERT_ID(), 6);


--
-- Languages Page
--
INSERT INTO `sys_std_widgets`(`page_id`, `module`, `type`, `url`, `click`, `icon`, `caption`, `cnt_notices`, `cnt_actions`) VALUES
(@iIdPolyglot, 'system', 'appearance', '{url_studio}polyglot.php', '', 'wi-polyglot.svg', '_adm_wgt_cpt_polyglot', '', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_actions";s:6:"params";a:0:{}s:5:"class";s:18:"TemplStudioModules";}');
INSERT INTO `sys_std_pages_widgets`(`page_id`, `widget_id`, `order`) VALUES(@iIdHome, LAST_INSERT_ID(), 5);


--
-- Builders Page
--
INSERT INTO `sys_std_widgets`(`page_id`, `module`, `type`, `url`, `click`, `icon`, `caption`, `cnt_notices`, `cnt_actions`) VALUES
(@iIdBuilderPages, 'system', 'structure', '{url_studio}builder_page.php', '', 'wi-bld-pages.svg', '_adm_wgt_cpt_builder_pages', '', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_actions";s:6:"params";a:0:{}s:5:"class";s:18:"TemplStudioModules";}');
INSERT INTO `sys_std_pages_widgets`(`page_id`, `widget_id`, `order`) VALUES(@iIdHome, LAST_INSERT_ID(), 7);

INSERT INTO `sys_std_widgets`(`page_id`, `module`, `type`, `url`, `click`, `icon`, `caption`, `cnt_notices`, `cnt_actions`) VALUES
(@iIdBuilderMenus, 'system', 'structure', '{url_studio}builder_menu.php', '', 'wi-bld-navigation.svg', '_adm_wgt_cpt_builder_menus', '', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_actions";s:6:"params";a:0:{}s:5:"class";s:18:"TemplStudioModules";}');
INSERT INTO `sys_std_pages_widgets`(`page_id`, `widget_id`, `order`) VALUES(@iIdHome, LAST_INSERT_ID(), 8);

INSERT INTO `sys_std_widgets`(`page_id`, `module`, `type`, `url`, `click`, `icon`, `caption`, `cnt_notices`, `cnt_actions`) VALUES
(@iIdBuilderForms, 'system', 'structure', '{url_studio}builder_forms.php', '', 'wi-bld-forms.svg', '_adm_wgt_cpt_builder_forms', '', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_actions";s:6:"params";a:0:{}s:5:"class";s:18:"TemplStudioModules";}');
INSERT INTO `sys_std_pages_widgets`(`page_id`, `widget_id`, `order`) VALUES(@iIdHome, LAST_INSERT_ID(), 9);

INSERT INTO `sys_std_widgets`(`page_id`, `module`, `type`, `url`, `click`, `icon`, `caption`, `cnt_notices`, `cnt_actions`) VALUES
(@iIdBuilderPermissions, 'system', 'configuration', '{url_studio}builder_permissions.php', '', 'wi-bld-permissions.svg', '_adm_wgt_cpt_builder_permissions', '', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_actions";s:6:"params";a:0:{}s:5:"class";s:18:"TemplStudioModules";}');
INSERT INTO `sys_std_pages_widgets`(`page_id`, `widget_id`, `order`) VALUES(@iIdHome, LAST_INSERT_ID(), 10);

INSERT INTO `sys_std_widgets`(`page_id`, `module`, `type`, `url`, `click`, `icon`, `caption`, `cnt_notices`, `cnt_actions`) VALUES
(@iIdBuilderRoles, 'system', 'configuration', '{url_studio}builder_roles.php', '', 'wi-bld-roles.svg', '_adm_wgt_cpt_builder_roles', '', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_actions";s:6:"params";a:0:{}s:5:"class";s:18:"TemplStudioModules";}');
INSERT INTO `sys_std_pages_widgets`(`page_id`, `widget_id`, `order`) VALUES(@iIdHome, LAST_INSERT_ID(), 11);


--
-- Storages Page
--
INSERT INTO `sys_std_widgets`(`page_id`, `module`, `type`, `url`, `click`, `icon`, `caption`, `cnt_notices`, `cnt_actions`) VALUES
(@iIdManagerStorages, 'system', 'content', '{url_studio}storages.php', '', 'wi-storages.svg', '_adm_wgt_cpt_storages', '', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_actions";s:6:"params";a:0:{}s:5:"class";s:18:"TemplStudioModules";}');
INSERT INTO `sys_std_pages_widgets`(`page_id`, `widget_id`, `order`) VALUES(@iIdHome, LAST_INSERT_ID(), 4);


--
-- Audit Page
--
INSERT INTO `sys_std_widgets`(`page_id`, `module`, `type`, `url`, `click`, `icon`, `caption`, `cnt_notices`, `cnt_actions`) VALUES
(@iIdAudit, 'system', 'extensions', '{url_studio}audit.php', '', 'wi-audit.svg', '_adm_wgt_cpt_audit', '', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_actions";s:6:"params";a:0:{}s:5:"class";s:18:"TemplStudioModules";}');
INSERT INTO `sys_std_pages_widgets`(`page_id`, `widget_id`, `order`) VALUES(@iIdHome, LAST_INSERT_ID(), 12);


--
-- Badges Page
--
INSERT INTO `sys_std_widgets`(`page_id`, `module`, `type`, `url`, `click`, `icon`, `caption`, `cnt_notices`, `cnt_actions`) VALUES
(@iIdBadges, 'system', 'structure', '{url_studio}badges.php', '', 'wi-badges.svg', '_adm_wgt_cpt_badges', '', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_actions";s:6:"params";a:0:{}s:5:"class";s:18:"TemplStudioModules";}');
INSERT INTO `sys_std_pages_widgets`(`page_id`, `widget_id`, `order`) VALUES(@iIdHome, LAST_INSERT_ID(), 13);

--
-- API Page
--
INSERT INTO `sys_std_widgets`(`page_id`, `module`, `type`, `url`, `click`, `icon`, `caption`, `cnt_notices`, `cnt_actions`) VALUES
(@iIdAPI, 'system', 'configuration', '{url_studio}api.php', '', 'wi-api.svg', '_adm_wgt_cpt_api', '', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_actions";s:6:"params";a:0:{}s:5:"class";s:18:"TemplStudioModules";}');
INSERT INTO `sys_std_pages_widgets`(`page_id`, `widget_id`, `order`) VALUES(@iIdHome, LAST_INSERT_ID(), 14);

--
-- Agents Page
--
INSERT INTO `sys_std_widgets`(`page_id`, `module`, `type`, `url`, `click`, `icon`, `caption`, `cnt_notices`, `cnt_actions`, `featured`) VALUES
(@iIdAgents, 'system', 'configuration', '{url_studio}agents.php', '', 'wi-agents.svg', '_adm_wgt_cpt_agents', '', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_actions";s:6:"params";a:0:{}s:5:"class";s:18:"TemplStudioModules";}', 1);
INSERT INTO `sys_std_pages_widgets`(`page_id`, `widget_id`, `order`) VALUES(@iIdHome, LAST_INSERT_ID(), 15);

-- Logger 

CREATE TABLE `sys_logger` (
    `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `level`      VARCHAR(16)     NOT NULL,
    `message`    TEXT            NOT NULL,
    `context`    TEXT            NULL,
    `channel`    VARCHAR(64)     NOT NULL DEFAULT 'system',
    `created_at` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`),
    INDEX `idx_level`      (`level`),
    INDEX `idx_channel`    (`channel`),
    INDEX `idx_created_at` (`created_at`)
);
