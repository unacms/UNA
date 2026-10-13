SET @sName = 'bx_messenger';

UPDATE `sys_options` SET `value` = 30 WHERE `name` = 'bx_messenger_max_jot_number_in_history';

-- ALERTS
SET @iHandler = (SELECT `id` FROM `sys_alerts_handlers` WHERE `name` = 'bx_messenger_actions' LIMIT 1);
DELETE FROM `sys_alerts_handlers` WHERE `name` = 'bx_messenger_actions';
DELETE FROM `sys_alerts` WHERE `handler_id` = @iHandler;

INSERT INTO `sys_alerts_handlers` (`name`, `class`, `file`, `service_call`) VALUES
('bx_messenger_actions', '', '', 'a:2:{s:6:"module";s:12:"bx_messenger";s:6:"method";s:8:"response";}');

SET @iHandler := LAST_INSERT_ID();
INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES
('bx_groups', 'fan_added', @iHandler),
('bx_events', 'fan_added', @iHandler),
('bx_organizations', 'fan_added', @iHandler),
('bx_spaces', 'fan_added', @iHandler),
('bx_events_fans','connection_removed', @iHandler),
('bx_groups_fans','connection_removed', @iHandler),
('bx_organizations_fans','connection_removed', @iHandler),
('bx_spaces_fans','connection_removed', @iHandler);

--- Membership actions
DELETE FROM `sys_acl_actions` WHERE `Module` = @sName AND `Name` IN ('edit messages', 'delete messages');
INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
(@sName, 'edit messages', NULL, '_bx_messenger_acl_action_edit_messages', '', 1, 0);
SET @iIdActionEditMessages = LAST_INSERT_ID();

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`) VALUES
(@sName, 'delete messages', NULL, '_bx_messenger_acl_action_delete_messages', '', 1, 0);
SET @iIdActionDeleteMessages = LAST_INSERT_ID();

SET @iModerator = 7;
SET @iAdministrator = 8;

DELETE FROM `sys_acl_matrix` WHERE `IDLevel` IN (@iModerator, @iAdministrator) AND `IDAction` IN (@iIdActionEditMessages, @iIdActionDeleteMessages);
INSERT INTO `sys_acl_matrix` (`IDLevel`, `IDAction`) VALUES
(@iModerator, @iIdActionEditMessages),
(@iAdministrator, @iIdActionEditMessages),
(@iModerator, @iIdActionDeleteMessages),
(@iAdministrator, @iIdActionDeleteMessages);

--- Menu objects
DELETE FROM `sys_menu_items` WHERE `module` =  @sName AND `name` NOT IN ('notifications-messenger', 'messenger', 'public-vc-messenger');
DELETE FROM `sys_objects_menu` WHERE `module` =  @sName;
DELETE FROM `sys_menu_sets` WHERE `module` =  @sName;

INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES
(CONCAT(@sName, '_lot_menu'), '_bx_messenger_menu_title_view', CONCAT(@sName, '_lot_menu'), @sName, 22, 0, 1, 'BxMessengerLotMenu', 'modules/boonex/messenger/classes/BxMessengerLotMenu.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES
(CONCAT(@sName, '_lot_menu'), @sName, '_bx_messenger_menu_set_title_talk_menu', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`, `visibility_custom`) VALUES
(CONCAT(@sName, '_lot_menu'), @sName, 'parent', '_bx_messenger_menu_item_title_parent_lot', '_bx_messenger_menu_item_title_parent_lot', 'javascript:void(0);', 'oMessenger.loadThreadsParent({id},''{type}'',{jot});', '_self', 'reply-all', '', 2147483647, 1, 0, 0, ''),
(CONCAT(@sName, '_lot_menu'), @sName, 'list', '_bx_messenger_menu_item_title_group_list', '_bx_messenger_menu_item_title_group_list', 'javascript:void(0);', 'oMessenger.onSelectItem(this, {id});', '_self', 'bars', '', 2147483647, 1, 0, 1, 'a:3:{s:6:"module";s:12:"bx_messenger";s:6:"method";s:16:"is_block_version";s:6:"params";a:1:{i:0;s:2:"{}";}}'),
(CONCAT(@sName, '_lot_menu'), @sName, 'video_call', '_bx_messenger_menu_item_title_video_call', '_bx_messenger_menu_item_title_video_call', 'javascript:void(0);', 'oMessenger.onStartVideoCall(this, {id}, ''{room}'');', '_self', 'video', '', 2147483647, 1, 0, 1, ''),
(CONCAT(@sName, '_lot_menu'), @sName, 'star', '_bx_messenger_menu_item_title_star', '_bx_messenger_menu_item_title_star', 'javascript:void(0);', 'oMessenger.onStarLot(this, {id});', '_self', 'star', '', 2147483647, 1, 0, 2, ''),
(CONCAT(@sName, '_lot_menu'), @sName, 'mute', '_bx_messenger_menu_item_title_mute', '_bx_messenger_menu_item_title_mute', 'javascript:void(0);', 'oMessenger.onMuteLot(this, {id});', '_self', 'bell', '', 2147483647, 1, 0, 3, ''),
(CONCAT(@sName, '_lot_menu'), @sName, 'settings', '_bx_messenger_lots_menu_settings_title', '_bx_messenger_lots_menu_settings_title', 'javascript:void(0)', 'oMessenger.showInfoMenu(this, ''{lot_menu_id}'')', '_self', 'info-circle', '', 2147483647, 1, 0, 4, '');

-- MENU: NAV MENU
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES
(CONCAT(@sName, '_nav_menu'), '_bx_messenger_nav_menu_title_view', CONCAT(@sName, '_nav_menu'), @sName, 21, 0, 1, 'BxMessengerMainMenu', 'modules/boonex/messenger/classes/BxMessengerMainMenu.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES
(CONCAT(@sName, '_nav_menu'), @sName, '_bx_messenger_nav_menu_title_view', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`) VALUES
(CONCAT(@sName, '_nav_menu'), @sName, 'inbox', '_bx_messenger_nav_menu_item_title_inbox', '_bx_messenger_nav_menu_item_title_inbox', 'javascript:void(0);', 'oMessenger.loadTalksList(this, {group : ''inbox''})', '_self', 'inbox col-red3', '', 2147483647, 1, 0, 0),
(CONCAT(@sName, '_nav_menu'), @sName, 'direct', '_bx_messenger_nav_menu_item_title_direct', '_bx_messenger_nav_menu_item_title_direct', 'javascript:void(0);', 'oMessenger.loadTalksList(this, {group : ''direct''})', '_self', 'comment col-blue1', '', 2147483647, 1, 0, 1),
(CONCAT(@sName, '_nav_menu'), @sName, 'threads', '_bx_messenger_nav_menu_item_title_threads', '_bx_messenger_nav_menu_item_title_threads', 'javascript:void(0);', 'oMessenger.loadTalksList(this, {group : ''threads''});', '_self', 'comments col-blue2', '', 2147483647, 1, 0, 2),
(CONCAT(@sName, '_nav_menu'), @sName, 'reply', '_bx_messenger_nav_menu_item_title_replies', '_bx_messenger_nav_menu_item_title_replies', 'javascript:void(0);', 'oMessenger.loadTalksList(this, {group : ''replies''});', '_self', 'reply', '', 2147483647, 1, 0, 3),
(CONCAT(@sName, '_nav_menu'), @sName, 'mentions_reactions', '_bx_messenger_nav_menu_item_title_mr', '_bx_messenger_nav_menu_item_title_mr', 'javascript:void(0)', 'oMessenger.loadTalksList(this, {group : ''mr''});', '_self', 'at col-green2', '', 2147483647, 1, 0, 4),
(CONCAT(@sName, '_nav_menu'), @sName, 'saved', '_bx_messenger_nav_menu_item_title_saved', '_bx_messenger_nav_menu_item_title_saved', 'javascript:void(0);', 'oMessenger.loadTalksList(this, {group : ''saved''});', '_self', 'bookmark col-red1', '', 2147483647, 1, 0, 5);

-- MENU: Groups Menu
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES
(CONCAT(@sName, '_groups_menu'), '_bx_messenger_groups_menu_title_view', CONCAT(@sName, '_groups_menu'), @sName, 27, 0, 1, 'BxMessengerNavGroupsMenu', 'modules/boonex/messenger/classes/BxMessengerNavGroupsMenu.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES
(CONCAT(@sName, '_groups_menu'), @sName, '_bx_messenger_groups_menu_title_view', 0);

-- MENU: Talk Info Menu
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES
(CONCAT(@sName, '_lot_info_menu'), '_bx_messenger_menu_lot_info_title', CONCAT(@sName, '_lot_info_menu'), @sName, 6, 0, 1, 'BxMessengerLotInfoMenu', 'modules/boonex/messenger/classes/BxMessengerLotInfoMenu.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES
(CONCAT(@sName, '_lot_info_menu'), @sName, '_bx_messenger_menu_set_title_talk_info_menu', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`, `visibility_custom`) VALUES
(CONCAT(@sName, '_lot_info_menu'), @sName, 'add_participants', '_bx_messenger_lots_menu_add_part', '_bx_messenger_lots_menu_add_part', 'javascript:void(0);', 'oMessenger.createList(''edit'');', '_self', 'plus-circle', '', 2147483647, 1, 0, 0, ''),
(CONCAT(@sName, '_lot_info_menu'), @sName, 'delete', '_bx_messenger_lots_menu_delete', '_bx_messenger_lots_menu_delete', 'javascript:void(0);', 'oMessenger.onDeleteLot({id});', '_self', 'backspace', '', 2147483647, 1, 0, 1, ''),
(CONCAT(@sName, '_lot_info_menu'), @sName, 'leave', '_bx_messenger_lots_menu_leave', '_bx_messenger_lots_menu_leave', 'javascript:void(0);', 'oMessenger.onLeaveLot({id});', '_self', 'sign-out-alt', '', 2147483647, 1, 0, 2, ''),
(CONCAT(@sName, '_lot_info_menu'), @sName, 'media', '_bx_messenger_lots_menu_media', '_bx_messenger_lots_menu_media', 'javascript:void(0);', 'oMessenger.onMedia({id});', '_self', 'photo-video', '', 2147483647, 1, 0, 3, ''),
(CONCAT(@sName, '_lot_info_menu'), @sName, 'clear', '_bx_messenger_lots_menu_clear', '_bx_messenger_lots_menu_clear', 'javascript:void(0);', 'oMessenger.onClearLot({id});', '_self', 'trash', '', 2147483647, 1, 0, 4, ''),
(CONCAT(@sName, '_lot_info_menu'), @sName, 'settings', '_bx_messenger_lots_menu_settings', '_bx_messenger_lots_menu_settings', 'javascript:void(0)', 'oMessenger.onLotSettings(this, ''{lot_menu_id}'')', '_self', 'cogs', '', 2147483647, 1, 0, 5, '');

-- MENU: Message menu
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES
(CONCAT(@sName, '_jot_menu'), '_bx_messenger_menu_jot_title', CONCAT(@sName, '_jot_menu'), @sName, 20, 0, 1, 'BxMessengerJotMenu', 'modules/boonex/messenger/classes/BxMessengerJotMenu.php');

INSERT INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES
(CONCAT(@sName, '_jot_menu'), @sName, '_bx_messenger_menu_set_title_jot_menu', 0);

INSERT INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `order`, `visibility_custom`) VALUES
(CONCAT(@sName, '_jot_menu'), @sName, 'reaction', '_bx_messenger_jot_menu_reaction', '_bx_messenger_jot_menu_reaction', 'javascript:void(0);', 'oMessenger.onAddReaction(this);', '_self', 'smile', '', 2147483647, 1, 0, 0, ''),
(CONCAT(@sName, '_jot_menu'), @sName, 'reply', '_bx_messenger_jot_menu_reply', '_bx_messenger_jot_menu_reply', 'javascript:void(0);', 'oMessenger.onReplyJot(this);', '_self', 'reply', '', 2147483647, 1, 0, 1, ''),
(CONCAT(@sName, '_jot_menu'), @sName, 'share', '_bx_messenger_jot_menu_share', '_bx_messenger_jot_menu_share', 'javascript:void(0);', 'oMessenger.onCopyJotLink(this);', '_self', 'share', '', 2147483647, 1, 0, 2, ''),
(CONCAT(@sName, '_jot_menu'), @sName, 'edit', '_bx_messenger_jot_menu_edit', '_bx_messenger_jot_menu_edit', 'javascript:void(0);', 'oMessenger.onEditJot(this);', '_self', 'edit', '', 2147483647, 1, 0, 3, ''),
(CONCAT(@sName, '_jot_menu'), @sName, 'remove', '_bx_messenger_jot_menu_remove', '_bx_messenger_jot_menu_remove', 'javascript:void(0);', 'oMessenger.onDeleteJot(this);', '_self', 'backspace', '', 2147483647, 1, 0, 4, ''),
(CONCAT(@sName, '_jot_menu'), @sName, 'thread', '_bx_messenger_jot_menu_thread', '_bx_messenger_jot_menu_thread', 'javascript:void(0);', 'oMessenger.onReplyInThread(this);', '_self', 'comment-dots', '', 2147483647, 1, 0, 5, ''),
(CONCAT(@sName, '_jot_menu'), @sName, 'save', '_bx_messenger_jot_menu_save', '_bx_messenger_jot_menu_save', 'javascript:void(0);', 'oMessenger.onSaveJotItem(this);', '_self', 'bookmark', '', 2147483647, 1, 0, 6, '');

---- Pages
DELETE FROM  `sys_objects_page` WHERE `module` = @sName AND `object` = 'bx_messenger_main';
DELETE FROM  `sys_pages_blocks` WHERE `module` = @sName AND `object` = 'bx_messenger_main';

-- PAGE: module home
INSERT INTO `sys_objects_page`(`object`, `title_system`, `title`, `module`, `layout_id`, `visible_for_levels`, `visible_for_levels_editable`, `uri`, `url`, `meta_description`, `meta_keywords`, `meta_robots`, `cache_lifetime`, `cache_editable`, `deletable`, `override_class_name`, `override_class_file`, `cover`) VALUES 
('bx_messenger_main', '_bx_messenger_page_title_sys_main', '_bx_messenger_page_title_main', @sName, 5, 2147483647, 1, 'messenger', 'page.php?i=messenger', '', '', '', 0, 1, 0, 'BxMessengerPageMain', 'modules/boonex/messenger/classes/BxMessengerPageMain.php', 0);

INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`) VALUES 
('bx_messenger_main', 1, @sName, '_bx_messenger_page_main_messenger_block', 0, 2147483647, 'service', 'a:2:{s:6:"module";s:12:"bx_messenger";s:6:"method";s:23:"get_main_messenger_page";}', 0, 0, 0);

UPDATE `sys_menu_items` SET `onclick` = "javascript:oMUtils.showConferenceWindow('modules/?r=messenger/get_video_conference_form/{profile_id}')"  WHERE `name` = 'public-vc-messenger' AND `module` = @sName;

---- NEO APP FORM DELETE
DELETE FROM `sys_objects_form` WHERE `module` = @sName;
DELETE FROM `sys_form_displays` WHERE `module` = @sName;
DELETE FROM `sys_form_inputs` WHERE `module` = @sName;
DELETE FROM `sys_form_display_inputs` WHERE `display_name` = 'bx_messenger_send';

---- NEO APP FORM
INSERT INTO `sys_objects_form` (`object`, `module`, `title`, `action`, `form_attrs`, `submit_name`, `table`, `key`, `uri`, `uri_title`, `params`, `deletable`, `active`, `parent_form`, `override_class_name`, `override_class_file`) VALUES
('bx_messenger_send', @sName, '_bx_messenger_neo_app_form', '', 'a:1:{s:7:"enctype";s:19:"multipart/form-data";}', 'submit', '', 'id', '', '', '', 0, 1, '', 'BxMessengerFormEntry', 'modules/boonex/messenger/classes/BxMessengerFormEntry.php');

INSERT INTO `sys_form_displays` (`display_name`, `module`, `object`, `title`) VALUES
('bx_messenger_send', @sName, 'bx_messenger_send', '_bx_messenger_neo_app_form_display_send_message');

INSERT INTO `sys_form_inputs` (`object`, `module`, `name`, `value`, `values`, `checked`, `type`, `caption_system`, `caption`, `info`, `help`, `required`, `unique`, `collapsed`, `html`, `privacy`, `rateable`, `attrs`, `attrs_tr`, `attrs_wrapper`, `checker_func`, `checker_params`, `checker_error`, `db_pass`, `db_params`, `editable`, `deletable`) VALUES
('bx_messenger_send', @sName, 'submit', '_bx_messenger_neo_app_form_input_submit', '', 0, 'submit', '_bx_messenger_neo_app_form_input_caption_submit', '', '', '', 0, 0, 0, 0, 0, '', '', '', '', '', '', '', '', '', 0, 0),
('bx_messenger_send', @sName, 'cancel', '_bx_messenger_neo_app_form_input_cancel', '', 0, 'button', '_bx_messenger_neo_app_form_input_caption_cancel', '', '', '', 0, 0, 0, 0, 0, '', 'a:1:{s:5:"class";s:22:"bx-def-margin-sec-left";}', '', '', '', '', '', '', '', 0, 0),
('bx_messenger_send', @sName, 'controls', '', 'submit,cancel', 0, 'input_set', '', '', '', '', 0, 0, 0, 0, 0, '', '', '', '', '', '', '', '', '', 0, 0),
('bx_messenger_send', @sName, 'cf', '', '#!sys_content_filter', 0, 'select', '_sys_form_entry_input_sys_cf', '_sys_form_entry_input_cf', '', '', 0, 0, 0, 0, 0, '', '', '', '', '', '', '', '', '', 1, 0),
('bx_messenger_send', @sName, 'files', 'a:1:{i:0;s:18:"bx_messenger_html5";}', 'a:1:{s:18:"bx_messenger_html5";s:25:"_sys_uploader_html5_title";}', 0, 'files', '_bx_messenger_neo_app_form_input_caption_files', '', '', '', 0, 0, 0, 0, 0, '', '', '', '', '', '', '', '', '', 1, 0),
('bx_messenger_send', @sName, 'message', '', '', 0, 'textarea', '_bx_messenger_neo_app_form_input_caption_message', '', '', '', 0, 0, 0, 3, 0, '', 'a:1:{s:12:"autocomplete";s:3:"off";}', '', '', '', '', '', 'XssHtml', '', 1, 0),
('bx_messenger_send', @sName, 'parent_id', '', '', 0, 'hidden', '_bx_messenger_neo_app_form_input_caption_parent_id', '', '', '', 0, 0, 0, 0, 0, '', '', '', '', '', '', '', 'Int', '', 0, 0),
('bx_messenger_send', @sName, 'message_id', '', '', 0, 'hidden', '_bx_messenger_neo_app_form_input_caption_message_id', '', '', '', 0, 0, 0, 0, 0, '', '', '', '', '', '', '', 'Int', '', 0, 0),
('bx_messenger_send', @sName, 'action', '', '', 0, 'hidden', '_bx_messenger_neo_app_form_input_caption_action', '', '', '', 0, 0, 0, 0, 0, '', '', '', '', '', '', '', '', '', 0, 0),
('bx_messenger_send', @sName, 'send', '', '', 0, 'hidden', '_bx_messenger_neo_app_form_input_caption_messenger_send', '', '', '', 0, 0, 0, 0, 0, '', '', '', '', '', '', '', '', '', 0, 0);

INSERT INTO `sys_form_display_inputs` (`display_name`, `input_name`, `visible_for_levels`, `active`, `order`) VALUES
('bx_messenger_send', 'controls', 2147483647, 0, 0),
('bx_messenger_send', 'cancel', 2147483647, 0, 0),
('bx_messenger_send', 'files', 2147483647, 1, 9),
('bx_messenger_send', 'submit', 2147483647, 1, 8),
('bx_messenger_send', 'cf', 2147483647, 1, 7),
('bx_messenger_send', 'message', 2147483647, 1, 6),
('bx_messenger_send', 'parent_id', 2147483647, 1, 5),
('bx_messenger_send', 'message_id', 2147483647, 0, 4),
('bx_messenger_send', 'action', 2147483647, 1, 3),
('bx_messenger_send', 'id', 2147483647, 1, 2),
('bx_messenger_send', 'send', 2147483647, 1, 1);

----- NEO REACTION DELETE
DELETE FROM `sys_objects_vote` WHERE `Name` = 'bx_messenger_jot';

---- NEO REACTIONS
INSERT INTO `sys_objects_vote` (`Name`, `TableMain`, `TableTrack`, `PostTimeout`, `MinValue`, `MaxValue`, `Pruning`, `IsUndo`, `IsOn`, `TriggerTable`, `TriggerFieldId`, `TriggerFieldAuthor`, `TriggerFieldRate`, `TriggerFieldRateCount`, `ClassName`, `ClassFile`) VALUES
('bx_messenger_jot', 'bx_messenger_jot_reactions', 'bx_messenger_jot_reactions', 604800, 1, 1, 31536000, 1, 1, 'bx_messenger_jots', 'id', 'user_id', 'rrate', 'rvotes', 'BxMessengerJotReactions', 'modules/boonex/messenger/classes/BxMessengerJotReactions.php');