SET @sName = 'bx_reputation';


-- TABLE: handlers
CREATE TABLE IF NOT EXISTS `bx_reputation_handlers` (
  `id` int(11) NOT NULL auto_increment,
  `group` varchar(64) NOT NULL default '',
  `type` enum('insert','update','delete') NOT NULL DEFAULT 'insert',
  `alert_unit` varchar(64) NOT NULL default '',
  `alert_action` varchar(64) NOT NULL default '',
  `points_active` int(11) NOT NULL default '0',
  `points_passive` int(11) NOT NULL default '0',
  `active` tinyint(4) NOT NULL default '1',
  PRIMARY KEY (`id`),
  UNIQUE `alert` (`alert_unit`, `alert_action`)
);

-- Friendship
INSERT INTO `bx_reputation_handlers`(`group`, `type`, `alert_unit`, `alert_action`, `points_active`, `points_passive`, `active`) VALUES 
('friendship', 'insert', 'sys_profiles_friends', 'connection_added', '2', '0', '1'),
('friendship', 'delete', 'sys_profiles_friends', 'connection_removed', '-2', '0', '1');

-- Subscription
INSERT INTO `bx_reputation_handlers`(`group`, `type`, `alert_unit`, `alert_action`, `points_active`, `points_passive`, `active`) VALUES 
('subscription', 'insert', 'sys_profiles_subscriptions', 'connection_added', '1', '0', '1'),
('subscription', 'delete', 'sys_profiles_subscriptions', 'connection_removed', '-1', '0', '1');

-- TABLES: events
CREATE TABLE IF NOT EXISTS `bx_reputation_events` (
  `id` int(11) NOT NULL auto_increment,
  `owner_id` int(11) NOT NULL default '0',
  `context_id` int(11) NOT NULL default '0',
  `type` varchar(64) NOT NULL default '',
  `action` varchar(64) NOT NULL default '',
  `object_id` int(11) NOT NULL default '0',
  `object_owner_id` int(11) NOT NULL default '0',
  `points` int(11) NOT NULL DEFAULT '0',
  `date` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  KEY `owner_id` (`owner_id`),
  KEY `object_id` (`object_id`)
);

-- TABLE: levels
CREATE TABLE IF NOT EXISTS `bx_reputation_levels` (
  `id` int(11) NOT NULL auto_increment,
  `name` varchar(32) NOT NULL default '',
  `title` varchar(64) NOT NULL default '',
  `icon` text NOT NULL,
  `points_in` int(11) NOT NULL DEFAULT '0',
  `points_out` int(11) NOT NULL DEFAULT '0',
  `date` int(11) NOT NULL default '0',
  `active` tinyint(4) NOT NULL DEFAULT '1',
  `order` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
);

INSERT INTO `bx_reputation_levels` (`name`, `title`, `icon`, `points_in`, `points_out`, `date`, `active`, `order`) VALUES
('newcomer', '_bx_reputation_txt_level_newcomer', '', 1, 4, UNIX_TIMESTAMP(), 1, 1),
('explorer', '_bx_reputation_txt_level_explorer', '', 5, 19, UNIX_TIMESTAMP(), 1, 2),
('contributor', '_bx_reputation_txt_level_contributor', '', 20, 49, UNIX_TIMESTAMP(), 1, 3),
('collaborator', '_bx_reputation_txt_level_collaborator', '', 50, 99, UNIX_TIMESTAMP(), 1, 4),
('enthusiast', '_bx_reputation_txt_level_enthusiast', '', 100, 499, UNIX_TIMESTAMP(), 1, 5),
('advocate', '_bx_reputation_txt_level_advocate', '', 500, 1999, UNIX_TIMESTAMP(), 1, 6),
('visionary', '_bx_reputation_txt_level_visionary', '', 2000, 9999, UNIX_TIMESTAMP(), 1, 7),
('luminary', '_bx_reputation_txt_level_luminary', '', 10000, 49999, UNIX_TIMESTAMP(), 1, 8),
('origin', '_bx_reputation_txt_level_origin', '', 50000, 0, UNIX_TIMESTAMP(), 1, 9);

-- TABLE: profiles
CREATE TABLE IF NOT EXISTS `bx_reputation_profiles` (
  `id` int(11) NOT NULL auto_increment,
  `profile_id` int(11) NOT NULL DEFAULT '0',
  `context_id` int(11) NOT NULL default '0',
  `points` int(11) NOT NULL DEFAULT '0',
  `visible` tinyint(4) NOT NULL default '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `profile` (`profile_id`, `context_id`)
);

-- TABLE: profiles' levels
CREATE TABLE IF NOT EXISTS `bx_reputation_profiles_levels` (
  `id` int(11) NOT NULL auto_increment,
  `profile_id` int(11) NOT NULL DEFAULT '0',
  `context_id` int(11) NOT NULL default '0',
  `level_id` int(11) NOT NULL DEFAULT '0',
  `date` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `level` (`profile_id`, `context_id`, `level_id`)
);


-- FORMS: handler
INSERT INTO `sys_objects_form` (`object`, `module`, `title`, `action`, `form_attrs`, `submit_name`, `table`, `key`, `uri`, `uri_title`, `params`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES
('bx_reputation_handler', @sName, '_bx_reputation_form_handler', '', '', 'do_submit', 'bx_reputation_handlers', 'id', '', '', '', 0, 1, '', '');

INSERT INTO `sys_form_displays` (`display_name`, `module`, `object`, `title`, `view_mode`) VALUES
('bx_reputation_handler_edit', @sName, 'bx_reputation_handler', '_bx_reputation_form_handler_display_edit', 0);

INSERT INTO `sys_form_inputs` (`object`, `module`, `name`, `value`, `values`, `checked`, `type`, `caption_system`, `caption`, `info`, `required`, `collapsed`, `html`, `attrs`, `attrs_tr`, `attrs_wrapper`, `checker_func`, `checker_params`, `checker_error`, `db_pass`, `db_params`, `editable`, `deletable`) VALUES
('bx_reputation_handler', @sName, 'points_active', '', '', 0, 'text', '_bx_reputation_form_handler_input_sys_points_active', '_bx_reputation_form_handler_input_points_active', '_bx_reputation_form_handler_input_points_active_info', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 1, 0),
('bx_reputation_handler', @sName, 'points_passive', '', '', 0, 'text', '_bx_reputation_form_handler_input_sys_points_passive', '_bx_reputation_form_handler_input_points_passive', '_bx_reputation_form_handler_input_points_passive_info', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 1, 0),
('bx_reputation_handler', @sName, 'controls', '', 'do_submit,do_cancel', 0, 'input_set', '_bx_reputation_form_handler_input_sys_controls', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_reputation_handler', @sName, 'do_submit', '_bx_reputation_form_handler_input_do_submit', '', 0, 'submit', '_bx_reputation_form_handler_input_sys_do_submit', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_reputation_handler', @sName, 'do_cancel', '_bx_reputation_form_handler_input_do_cancel', '', 0, 'button', '_bx_reputation_form_handler_input_sys_do_cancel', '', '', 0, 0, 0, 'a:2:{s:7:"onclick";s:45:"$(''.bx-popup-applied:visible'').dolPopupHide()";s:5:"class";s:22:"bx-def-margin-sec-left";}', '', '', '', '', '', '', '', 1, 0);

INSERT INTO `sys_form_display_inputs` (`display_name`, `input_name`, `visible_for_levels`, `active`, `order`) VALUES
('bx_reputation_handler_edit', 'points_active', 2147483647, 1, 1),
('bx_reputation_handler_edit', 'points_passive', 2147483647, 1, 2),
('bx_reputation_handler_edit', 'controls', 2147483647, 1, 3),
('bx_reputation_handler_edit', 'do_submit', 2147483647, 1, 4),
('bx_reputation_handler_edit', 'do_cancel', 2147483647, 1, 5);

-- FORMS: level
INSERT INTO `sys_objects_form` (`object`, `module`, `title`, `action`, `form_attrs`, `submit_name`, `table`, `key`, `uri`, `uri_title`, `params`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES
('bx_reputation_level', @sName, '_bx_reputation_form_level', '', '', 'do_submit', 'bx_reputation_levels', 'id', '', '', '', 0, 1, 'BxReputationFormLevel', 'modules/boonex/reputation/classes/BxReputationFormLevel.php');

INSERT INTO `sys_form_displays` (`display_name`, `module`, `object`, `title`, `view_mode`) VALUES
('bx_reputation_level_add', @sName, 'bx_reputation_level', '_bx_reputation_form_level_display_add', 0),
('bx_reputation_level_edit', @sName, 'bx_reputation_level', '_bx_reputation_form_level_display_edit', 0);

INSERT INTO `sys_form_inputs` (`object`, `module`, `name`, `value`, `values`, `checked`, `type`, `caption_system`, `caption`, `info`, `required`, `collapsed`, `html`, `attrs`, `attrs_tr`, `attrs_wrapper`, `checker_func`, `checker_params`, `checker_error`, `db_pass`, `db_params`, `editable`, `deletable`) VALUES
('bx_reputation_level', @sName, 'name', '', '', 0, 'text', '_bx_reputation_form_level_input_sys_name', '_bx_reputation_form_level_input_name', '', 1, 0, 0, '', '', '', 'Avail', '', '_bx_reputation_form_input_err', 'Xss', '', 1, 0),
('bx_reputation_level', @sName, 'title', '', '', 0, 'text_translatable', '_bx_reputation_form_level_input_sys_title', '_bx_reputation_form_level_input_title', '', 1, 0, 0, '', '', '', 'AvailTranslatable', 'a:1:{i:0;s:5:"title";}', '_bx_reputation_form_input_err', 'Xss', '', 1, 0),
('bx_reputation_level', @sName, 'icon', '', '', 0, 'textarea', '_bx_reputation_form_level_input_sys_icon', '_bx_reputation_form_level_input_icon', '_bx_reputation_form_level_input_icon_info', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 1, 0),
('bx_reputation_level', @sName, 'points_in', '', '', 0, 'text', '_bx_reputation_form_level_input_sys_points_in', '_bx_reputation_form_level_input_points_in', '_bx_reputation_form_level_input_points_in_info', 1, 0, 0, '', '', '', 'Avail', '', '_bx_reputation_form_input_err', 'Int', '', 1, 0),
('bx_reputation_level', @sName, 'points_out', '', '', 0, 'text', '_bx_reputation_form_level_input_sys_points_out', '_bx_reputation_form_level_input_points_out', '_bx_reputation_form_level_input_points_out_info', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 1, 0),
('bx_reputation_level', @sName, 'controls', '', 'do_submit,do_cancel', 0, 'input_set', '_bx_reputation_form_level_input_sys_controls', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_reputation_level', @sName, 'do_submit', '_bx_reputation_form_level_input_do_submit', '', 0, 'submit', '_bx_reputation_form_level_input_sys_do_submit', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_reputation_level', @sName, 'do_cancel', '_bx_reputation_form_level_input_do_cancel', '', 0, 'button', '_bx_reputation_form_level_input_sys_do_cancel', '', '', 0, 0, 0, 'a:2:{s:7:"onclick";s:45:"$(''.bx-popup-applied:visible'').dolPopupHide()";s:5:"class";s:22:"bx-def-margin-sec-left";}', '', '', '', '', '', '', '', 1, 0);

INSERT INTO `sys_form_display_inputs` (`display_name`, `input_name`, `visible_for_levels`, `active`, `order`) VALUES
('bx_reputation_level_add', 'name', 2147483647, 1, 1),
('bx_reputation_level_add', 'title', 2147483647, 1, 2),
('bx_reputation_level_add', 'icon', 2147483647, 1, 3),
('bx_reputation_level_add', 'points_in', 2147483647, 1, 4),
('bx_reputation_level_add', 'points_out', 2147483647, 1, 5),
('bx_reputation_level_add', 'controls', 2147483647, 1, 6),
('bx_reputation_level_add', 'do_submit', 2147483647, 1, 7),
('bx_reputation_level_add', 'do_cancel', 2147483647, 1, 8),

('bx_reputation_level_edit', 'title', 2147483647, 1, 1),
('bx_reputation_level_edit', 'icon', 2147483647, 1, 2),
('bx_reputation_level_edit', 'points_in', 2147483647, 1, 3),
('bx_reputation_level_edit', 'points_out', 2147483647, 1, 4),
('bx_reputation_level_edit', 'controls', 2147483647, 1, 5),
('bx_reputation_level_edit', 'do_submit', 2147483647, 1, 6),
('bx_reputation_level_edit', 'do_cancel', 2147483647, 1, 7);


-- STUDIO PAGE & WIDGET
INSERT INTO `sys_std_pages`(`index`, `name`, `header`, `caption`, `icon`) VALUES
(3, @sName, '_bx_reputation', '_bx_reputation', 'bx_reputation@modules/boonex/reputation/|std-icon.svg');
SET @iPageId = LAST_INSERT_ID();

SET @iParentPageId = (SELECT `id` FROM `sys_std_pages` WHERE `name` = 'home');
SET @iParentPageOrder = (SELECT MAX(`order`) FROM `sys_std_pages_widgets` WHERE `page_id` = @iParentPageId);
INSERT INTO `sys_std_widgets` (`page_id`, `module`, `url`, `click`, `icon`, `caption`, `cnt_notices`, `cnt_actions`) VALUES
(@iPageId, @sName, '{url_studio}module.php?name=bx_reputation', '', 'bx_reputation@modules/boonex/reputation/|std-icon.svg', '_bx_reputation', '', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_actions";s:6:"params";a:0:{}s:5:"class";s:18:"TemplStudioModules";}');
INSERT INTO `sys_std_pages_widgets` (`page_id`, `widget_id`, `order`) VALUES
(@iParentPageId, LAST_INSERT_ID(), IF(ISNULL(@iParentPageOrder), 1, @iParentPageOrder + 1));
