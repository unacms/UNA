SET @sName = 'bx_messenger';

-- PAGE: service my contacts block
DELETE FROM  `sys_pages_blocks` WHERE `module` = @sName AND `title` = '_bx_messenger_page_block_contacts_title';
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `tabs`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `order`, `active`) VALUES
('', 0, @sName, '_bx_messenger_page_block_contacts_title', 11, 1, 2147483647, 'service', 'a:2:{s:6:"module";s:12:"bx_messenger";s:6:"method";s:28:"get_block_contacts_messenger";}}', 1, 1, 0, 0);


UPDATE `sys_form_inputs` SET `name` = 'payload', `caption` = '_bx_messenger_neo_app_form_input_caption_payload' WHERE `object` = 'bx_messenger_send' AND `name` = 'parent_id';
UPDATE `sys_form_display_inputs` SET `input_name` = 'payload' WHERE `display_name` = 'bx_messenger_send' AND `input_name` = 'parent_id';

UPDATE `sys_objects_vote` SET `Module` = @sName WHERE `Name` = 'bx_messenger_jot';

--- UPLOADERS
DELETE FROM `sys_objects_uploader` WHERE `object` = 'bx_messenger_html5';
INSERT IGNORE INTO `sys_objects_uploader` (`object`, `active`, `override_class_name`, `override_class_file`) VALUES
('bx_messenger_html5', 1, 'BxTemplCmtsUploaderHTML5', '');

-- MENU: custom menu for snippet meta info
DELETE FROM `sys_objects_menu` WHERE `object` = 'bx_messenger_profile_snippet_meta';
INSERT IGNORE INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES
('bx_messenger_profile_snippet_meta', '_bx_messenger_profile_title_snippet_meta', 'bx_messenger_profile_snippet_meta', @sName, 15, 0, 1, 'BxMessengerProfileMenuSnippetMeta', 'modules/boonex/messenger/classes/BxMessengerProfileMenuSnippetMeta.php');

DELETE FROM `sys_menu_sets` WHERE `set_name` = 'bx_messenger_profile_snippet_meta';
INSERT IGNORE INTO `sys_menu_sets`(`set_name`, `module`, `title`, `deletable`) VALUES
('bx_messenger_profile_snippet_meta', @sName, '_bx_messenger_set_title_profile_snippet_meta', 0);

DELETE FROM `sys_menu_items` WHERE `set_name` = 'bx_messenger_profile_snippet_meta';
INSERT IGNORE INTO `sys_menu_items`(`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `active`, `copyable`, `editable`, `order`) VALUES
('bx_messenger_profile_snippet_meta', @sName, 'message', '_bx_messenger_item_title_sm_message', '_bx_messenger_item_title_sm_message', 'page.php?i=messenger', '', '', 'comments', '', 2147483647, 0, 0, 1, 1);

