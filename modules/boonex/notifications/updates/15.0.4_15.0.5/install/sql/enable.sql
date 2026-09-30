-- SETTINGS
SET @iCategId = (SELECT `id` FROM `sys_options_categories` WHERE `name` = 'bx_notifications' LIMIT 1);

DELETE FROM `sys_options` WHERE `name` = 'bx_notifications_enable_group_events_db';
INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `info`, `type`, `check`, `check_params`, `check_error`, `extra`, `order`) VALUES
('bx_notifications_enable_group_events_db', '', @iCategId, '_bx_ntfs_option_enable_group_events_db', '', 'checkbox', '', '', '', '', 13);

DELETE FROM `sys_options` WHERE `name` = 'bx_notifications_enable_own_actions';
INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `info`, `type`, `check`, `check_params`, `check_error`, `extra`, `order`) VALUES
('bx_notifications_enable_own_actions', '', @iCategId, '_bx_ntfs_option_enable_own_actions', '', 'checkbox', '', '', '', '', 40);

UPDATE `sys_options` SET `order`='41' WHERE `name` = 'bx_notifications_enable_comment_post_ext';
UPDATE `sys_options` SET `value`='90' WHERE `name` = 'bx_notifications_email_subject_chars';
