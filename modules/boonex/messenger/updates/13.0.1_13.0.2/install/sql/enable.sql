SET @sName = 'bx_messenger';

DELETE FROM `bx_messenger_attachments` WHERE `name` = @sName AND `service` like '%get_broadcast_card%';
INSERT INTO `bx_messenger_attachments` (`name`, `service`) VALUES
(@sName, 'a:3:{s:6:"module";s:12:"bx_messenger";s:6:"method";s:18:"get_broadcast_card";s:6:"params";a:0:{}}');

DELETE FROM `bx_messenger_lots_types` WHERE `name` = 'broadcast' AND `id` = 6;
INSERT INTO `bx_messenger_lots_types` (`id`, `name`, `show_link`) VALUES
(6, 'broadcast', 0);

-- SETTINGS
DELETE FROM `sys_options` WHERE `name` = 'bx_messenger_broadcast_fields';
SET @iCategId = (SELECT `id` FROM `sys_options_categories` WHERE `name`=@sName LIMIT 1);

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `check`, `check_error`, `extra`, `order`) VALUES
('bx_messenger_broadcast_fields', 'membership,gender,countries,birthday', @iCategId, '_bx_messenger_broadcast_fields', 'list', '', '', 'a:2:{s:6:"module";s:12:"bx_messenger";s:6:"method";s:20:"get_broadcast_fields";}', 46);

-- ACTIONS
DELETE FROM `sys_acl_actions` WHERE `Module` = @sName AND `Name` = 'create broadcasts';
INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
(@sName, 'create broadcasts', NULL, '_bx_messenger_acl_action_create_broadcast', '', 1, 0);
SET @iIdActionBroadcastTalks = LAST_INSERT_ID();

SET @iModerator = 7;
SET @iAdministrator = 8;

DELETE FROM `sys_acl_matrix` WHERE `IDLevel` IN (@iModerator, @iAdministrator) AND `IDAction` = @iIdActionBroadcastTalks;
INSERT INTO `sys_acl_matrix` (`IDLevel`, `IDAction`) VALUES
(@iModerator, @iIdActionBroadcastTalks),
(@iAdministrator, @iIdActionBroadcastTalks);

--TALK INFO MENU
DELETE FROM `sys_menu_items` WHERE `set_name`= CONCAT(@sName, '_lot_info_menu') AND `name` = 'info';
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`, `visibility_custom`) VALUES
(CONCAT(@sName, '_lot_info_menu'), @sName, 'info', '_bx_messenger_lots_menu_info', '_bx_messenger_lots_menu_info', 'javascript:void(0)', 'oMessenger.onLotInfo(this, ''{lot_menu_id}'')', '_self', 'info-circle', '', 2147483647, 1, 0, 6, '');

-- MENU: CREATE CONVO
DELETE FROM `sys_menu_templates` WHERE `template`='menu-create-convo.html';
INSERT INTO `sys_menu_templates` (`id`, `template`, `title`, `visible`) VALUES
(ROUND(RAND()*(9999 - 1000) + 1000), 'menu-create-convo.html', '_bx_messenger_create_convo_template_title', 1);
SET @iTemplId = (SELECT `id` FROM `sys_menu_templates` WHERE `template`='menu-create-convo.html' AND `title`='_bx_messenger_create_convo_template_title' LIMIT 1);

DELETE FROM `sys_objects_menu` WHERE `object`=CONCAT(@sName, '_create_convo_menu');
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES
(CONCAT(@sName, '_create_convo_menu'), '_bx_messenger_create_convo_menu_title', CONCAT(@sName, '_create_convo_menu'), @sName, @iTemplId, 0, 1, 'BxMessengerCreateConvoMenu', 'modules/boonex/messenger/classes/BxMessengerCreateConvoMenu.php');

DELETE FROM `sys_menu_sets` WHERE `set_name`=CONCAT(@sName, '_create_convo_menu');
INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES
(CONCAT(@sName, '_create_convo_menu'), @sName, '_bx_messenger_create_convo_menu_set_title', 0);

DELETE FROM `sys_menu_items` WHERE `set_name`=CONCAT(@sName, '_create_convo_menu');
INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES
(CONCAT(@sName, '_create_convo_menu'), @sName, 'standard', '_bx_messenger_create_convo_menu_standard_system', '_bx_messenger_create_convo_menu_standard', 'javascript:void(0);', '{js_object}.onSelectConvoFilter();', '_self', 'users', '', 2147483647, 1, 0, 0),
(CONCAT(@sName, '_create_convo_menu'), @sName, 'followers', '_bx_messenger_create_convo_menu_followers_system', '_bx_messenger_create_convo_menu_followers_system', 'javascript:void(0);', '{js_object}.onSelectConvoFilter(''followers'');', '_self', 'group', '', 2147483647, 1, 0, 1),
(CONCAT(@sName, '_create_convo_menu'), @sName, 'friends', '_bx_messenger_create_convo_menu_friends_system', '_bx_messenger_create_convo_menu_friends_system', 'javascript:void(0);', '{js_object}.onSelectConvoFilter(''friends'');', '_self', 'user-friends', '', 2147483647, 1, 0, 1),
(CONCAT(@sName, '_create_convo_menu'), @sName, 'broadcast', '_bx_messenger_create_convo_menu_broadcast_system', '_bx_messenger_create_convo_menu_broadcast_system', 'javascript:void(0);', '{js_object}.onSelectConvoFilter(''broadcast'');', '_self', 'bullhorn', '', 2147483647, 1, 0, 2);

DELETE FROM `sys_form_inputs` WHERE `object`='bx_messenger_send' AND `name` IN ('id', 'reply');
INSERT INTO `sys_form_inputs` (`object`, `module`, `name`, `value`, `values`, `checked`, `type`, `caption_system`, `caption`, `info`, `help`, `required`, `unique`, `collapsed`, `html`, `privacy`, `rateable`, `attrs`, `attrs_tr`, `attrs_wrapper`, `checker_func`, `checker_params`, `checker_error`, `db_pass`, `db_params`, `editable`, `deletable`) VALUES
('bx_messenger_send', @sName, 'id', '', '', 0, 'hidden', '_bx_messenger_neo_app_form_input_caption_id', '', '', '', 0, 0, 0, 0, 0, '', '', '', '', '', '', '', 'Int', '', 0, 0),
('bx_messenger_send', @sName, 'reply', '', '', 0, 'hidden', '_bx_messenger_neo_app_form_input_caption_reply', '', '', '', 0, 0, 0, 0, 0, '', '', '', '', '', '', '', 'Int', '', 0, 0);

DELETE FROM `sys_form_display_inputs` WHERE `display_name` = 'bx_messenger_send' AND `input_name` = 'reply';
INSERT INTO `sys_form_display_inputs` (`display_name`, `input_name`, `visible_for_levels`, `active`, `order`) VALUES
('bx_messenger_send', 'reply', 2147483647, 1, 5);

UPDATE `sys_form_display_inputs` SET `active` = 1 WHERE `display_name` = 'bx_messenger_send' AND `input_name` = 'id';

UPDATE `sys_objects_uploader`
SET
    `override_class_name` = 'BxMessengerUploaderHTML5',
    `override_class_file` = 'modules/boonex/messenger/classes/BxMessengerUploaderHTML5.php'
WHERE `object` = 'bx_messenger_html5';

---- SEARCH CRITERIA FORM
DELETE FROM `sys_objects_form` WHERE `object` = 'bx_messenger_filter_criteria' AND `module`=@sName;
INSERT INTO `sys_objects_form` (`object`, `module`, `title`, `action`, `form_attrs`, `submit_name`, `table`, `key`, `uri`, `uri_title`, `params`, `deletable`, `active`, `parent_form`, `override_class_name`, `override_class_file`) VALUES
('bx_messenger_filter_criteria', @sName, '_bx_messenger_filter_criteria_form', '', 'a:1:{s:7:"enctype";s:19:"multipart/form-data";}', '', '', '', '', '', '', 0, 1, '', 'BxMessengerFilterForm', 'modules/boonex/messenger/classes/BxMessengerFilterForm.php');

DELETE FROM `sys_form_displays` WHERE `display_name` = 'bx_messenger_filter_criteria' AND `module`=@sName;
INSERT INTO `sys_form_displays` (`display_name`, `module`, `object`, `title`) VALUES
('bx_messenger_filter_criteria', @sName, 'bx_messenger_filter_criteria', '_bx_messenger_filter_criteria_form_display');

-- VOTES
DELETE FROM `sys_objects_vote` WHERE `Module` = @sName;
INSERT INTO `sys_objects_vote` (`Name`, `Module`, `TableMain`, `TableTrack`, `PostTimeout`, `MinValue`, `MaxValue`, `IsUndo`, `IsOn`, `TriggerTable`, `TriggerFieldId`, `TriggerFieldAuthor`, `TriggerFieldRate`, `TriggerFieldRateCount`, `ClassName`, `ClassFile`) VALUES
('bx_messenger_jots_rvotes', 'bx_messenger', 'bx_messenger_jots_rvotes', 'bx_messenger_jots_rvotes_track', '604800', '1', '1', '1', '1', 'bx_messenger_jots', 'id', 'user_id', 'rrate', 'rvotes', 'BxMessengerJotVoteReactions', 'modules/boonex/messenger/classes/BxMessengerJotVoteReactions.php');