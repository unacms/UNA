SET @sName = 'bx_messenger';
SET @iTypeId = (SELECT `id` FROM `sys_options_types` WHERE `name`=@sName LIMIT 1);

DELETE FROM `sys_options_categories` WHERE `name` = 'bx_messenger' AND `caption` ='_bx_messenger';
DELETE FROM `sys_options_categories` WHERE `name` = CONCAT(@sName, '_settings');
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `hidden`, `order`) VALUES (@iTypeId, CONCAT(@sName, '_settings'), '_bx_messenger_cpt_category_settings', 0, 1);
SET @iCategId = LAST_INSERT_ID();
UPDATE `sys_options` SET `category_id` = @iCategId WHERE `name` IN ('bx_messenger_broadcast_fields','bx_messenger_server_url', 'bx_messenger_max_symbols_number', 'bx_messenger_max_files_send', 'bx_messenger_max_video_length_minutes','bx_messenger_max_ntfs_number', 'bx_messenger_max_parts_views', 'bx_messenger_use_embedly', 'bx_messenger_enable_mentions');

DELETE FROM `sys_options_categories` WHERE `name` = CONCAT(@sName, '_security');
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `hidden`, `order`) VALUES (@iTypeId, CONCAT(@sName, '_security'), '_bx_messenger_cpt_category_security', 0, 2);
SET @iCategId = LAST_INSERT_ID();
UPDATE `sys_options` SET `category_id` = @iCategId WHERE `name` IN ('bx_messenger_jwt_app_id','bx_messenger_jwt_app_secret','bx_messenger_check_toxic','bx_messenger_jot_server_jwt');

DELETE FROM `sys_options_categories` WHERE `name` = CONCAT(@sName, '_moderation');
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `hidden`, `order`) VALUES (@iTypeId, CONCAT(@sName, '_moderation'), '_bx_messenger_cpt_category_moderation', 0, 3);
SET @iCategId = LAST_INSERT_ID();
UPDATE `sys_options` SET `category_id` = @iCategId WHERE `name` IN ('bx_messenger_allow_to_remove_messages','bx_messenger_allow_to_moderate_messages','bx_messenger_remove_messages_immediately');

DELETE FROM `sys_options_categories` WHERE `name` = CONCAT(@sName, '_emoji');
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `hidden`, `order`) VALUES (@iTypeId, CONCAT(@sName, '_emoji'), '_bx_messenger_cpt_category_emoji', 0, 4);
SET @iCategId = LAST_INSERT_ID();
UPDATE `sys_options` SET `category_id` = @iCategId WHERE `name` IN ('bx_messenger_emoji_set', 'bx_messenger_reactions_size','bx_messenger_show_emoji_preview');

DELETE FROM `sys_options_categories` WHERE `name` = CONCAT(@sName, '_giphy');
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `hidden`, `order`) VALUES (@iTypeId, CONCAT(@sName, '_giphy'), '_bx_messenger_cpt_category_giphy', 0, 5);
SET @iCategId = LAST_INSERT_ID();
UPDATE `sys_options` SET `category_id` = @iCategId WHERE `name` IN ('bx_messenger_giphy_key','bx_messenger_giphy_type','bx_messenger_giphy_content_rating','bx_messenger_giphy_limit');
INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `check`, `check_error`, `extra`, `order`) VALUES
('bx_messenger_giphy_powered_by', '', @iCategId, '_bx_messenger_giphy_powered_by', 'checkbox', '', '', '', 6);

DELETE FROM `sys_options_categories` WHERE `name` = CONCAT(@sName, '_jitsi');
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `hidden`, `order`) VALUES (@iTypeId, CONCAT(@sName, '_jitsi'), '_bx_messenger_cpt_category_jitsi', 0, 6);
SET @iCategId = LAST_INSERT_ID();
UPDATE `sys_options` SET `category_id` = @iCategId WHERE `name` IN ('bx_messenger_jitsi_enable', 'bx_messenger_jitsi_server','bx_messenger_jitsi_chat','bx_messenger_jitsi_sync','bx_messenger_jitsi_hide_info','bx_messenger_jitsi_enable_watermark','bx_messenger_jitsi_watermark_link','bx_messenger_jitsi_only_for_private','bx_messenger_jitsi_support_url');

DELETE FROM `sys_options_categories` WHERE `name` = CONCAT(@sName, '_privacy');
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `hidden`, `order`) VALUES (@iTypeId, CONCAT(@sName, '_privacy'), '_bx_messenger_cpt_category_privacy', 0, 7);
SET @iCategId = LAST_INSERT_ID();
UPDATE `sys_options` SET `category_id` = @iCategId WHERE `name` IN ('bx_messenger_enable_joined_organizations', 'bx_messenger_disable_contact_privacy', 'bx_messenger_connect_friends_only');

DELETE FROM `sys_options_categories` WHERE `name` = CONCAT(@sName, '_search');
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `hidden`, `order`) VALUES (@iTypeId, CONCAT(@sName, '_search'), '_bx_messenger_cpt_category_search', 0, 8);
SET @iCategId = LAST_INSERT_ID();
UPDATE `sys_options` SET `category_id` = @iCategId WHERE `name` IN ('bx_messenger_dont_show_search_desc', 'bx_messenger_search_criteria');

DELETE FROM `sys_options_categories` WHERE `name` = CONCAT(@sName, '_view');
INSERT INTO `sys_options_categories`(`type_id`, `name`, `caption`, `hidden`, `order`) VALUES (@iTypeId, CONCAT(@sName, '_view'), '_bx_messenger_cpt_category_view', 0, 9);
SET @iCategId = LAST_INSERT_ID();
UPDATE `sys_options` SET `category_id` = @iCategId WHERE `name` IN ('bx_messenger_max_symbols_brief_jot', 'bx_messenger_max_jot_number_default', 'bx_messenger_max_jot_number_in_history', 'bx_messenger_max_lots_number',
																   'bx_messenger_max_drop_down_select', 'bx_messenger_time_in_history', 'bx_messenger_use_unique_mode',
																   'bx_messenger_show_friends', 'bx_messenger_dont_update_title', 'bx_messenger_hide_parts', 'bx_messenger_show_search_box');
INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `check`, `check_error`, `extra`, `order`) VALUES
('bx_messenger_hide_parts', '', @iCategId, '_bx_messenger_hide_parts', 'checkbox', '', '', '', 10),
('bx_messenger_show_search_box', '', @iCategId, '_bx_messenger_show_search_box', 'checkbox', '', '', '', 11);


UPDATE `sys_menu_items` SET `order` = 0 WHERE `set_name` = 'sys_toolbar_member' AND `module` = @sName AND `order` IN (3,4);
UPDATE `sys_menu_items` SET `icon` = 'comments col-green1' WHERE `module` = @sName AND `icon` = 'far comments col-green1';
UPDATE `sys_menu_items` SET `icon` = 'comments' WHERE `module` = @sName AND `icon` = 'far comments';
UPDATE `sys_menu_items` SET `icon` = 'comments col-green1' WHERE `set_name` = 'sys_account_notifications' AND `module` = @sName AND `icon` = 'far comments col-green1';
