-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Icons: stored Font Awesome names become the Lucide names they already draw (the Lucide set's map
-- drew them), so the apps and the site name the same icon. Share buttons get brand marks.
-- Only rows that still hold the old name change, and only while the site draws icons with Lucide:
-- the Font Awesome set knows only Font Awesome names.
SET @bLucide = (SELECT COUNT(*) FROM `sys_options` WHERE `name` = 'sys_iconset_default' AND `value` = 'sys_lucide');
UPDATE `sys_menu_items` SET `icon` = 'megaphone' WHERE `set_name` = 'bx_messenger_create_convo_menu' AND `name` = 'broadcast' AND `icon` = 'bullhorn' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'users-round' WHERE `set_name` = 'bx_messenger_create_convo_menu' AND `name` = 'followers' AND `icon` = 'group' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'users-round' WHERE `set_name` = 'bx_messenger_create_convo_menu' AND `name` = 'friends' AND `icon` = 'user-friends' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'users-round' WHERE `set_name` = 'bx_messenger_create_convo_menu' AND `name` = 'standard' AND `icon` = 'users' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'square-pen' WHERE `set_name` = 'bx_messenger_jot_menu' AND `name` = 'edit' AND `icon` = 'edit' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'face-slightly-smiling' WHERE `set_name` = 'bx_messenger_jot_menu' AND `name` = 'reaction' AND `icon` = 'smile' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'delete' WHERE `set_name` = 'bx_messenger_jot_menu' AND `name` = 'remove' AND `icon` = 'backspace' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'message-square-dashed' WHERE `set_name` = 'bx_messenger_jot_menu' AND `name` = 'thread' AND `icon` = 'comment-dots' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'circle-plus' WHERE `set_name` = 'bx_messenger_lot_info_menu' AND `name` = 'add_participants' AND `icon` = 'plus-circle' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'delete' WHERE `set_name` = 'bx_messenger_lot_info_menu' AND `name` = 'delete' AND `icon` = 'backspace' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'info' WHERE `set_name` = 'bx_messenger_lot_info_menu' AND `name` = 'info' AND `icon` = 'info-circle' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'log-out' WHERE `set_name` = 'bx_messenger_lot_info_menu' AND `name` = 'leave' AND `icon` = 'sign-out-alt' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'image-play' WHERE `set_name` = 'bx_messenger_lot_info_menu' AND `name` = 'media' AND `icon` = 'photo-video' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'settings' WHERE `set_name` = 'bx_messenger_lot_info_menu' AND `name` = 'settings' AND `icon` = 'cogs' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'menu' WHERE `set_name` = 'bx_messenger_lot_menu' AND `name` = 'list' AND `icon` = 'bars' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'info' WHERE `set_name` = 'bx_messenger_lot_menu' AND `name` = 'settings' AND `icon` = 'info-circle' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'message-circle col-blue1' WHERE `set_name` = 'bx_messenger_nav_menu' AND `name` = 'direct' AND `icon` = 'comment col-blue1' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'at-sign col-green2' WHERE `set_name` = 'bx_messenger_nav_menu' AND `name` = 'mentions_reactions' AND `icon` = 'at col-green2' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'messages-square col-blue2' WHERE `set_name` = 'bx_messenger_nav_menu' AND `name` = 'threads' AND `icon` = 'comments col-blue2' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'messages-square' WHERE `set_name` = 'bx_messenger_profile_snippet_meta' AND `name` = 'message' AND `icon` = 'comments' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'messages-square' WHERE `set_name` = 'bx_organizations_view_actions' AND `name` = 'messenger' AND `icon` = 'comments' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'messages-square' WHERE `set_name` = 'bx_organizations_view_actions_all' AND `name` = 'messenger' AND `icon` = 'comments' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'messages-square' WHERE `set_name` = 'bx_persons_view_actions' AND `name` = 'messenger' AND `icon` = 'comments' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'messages-square' WHERE `set_name` = 'bx_persons_view_actions_all' AND `name` = 'messenger' AND `icon` = 'comments' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'messages-square' WHERE `set_name` = 'sys_account_notifications' AND `name` = 'notifications-messenger' AND `icon` = 'comments' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'messages-square' WHERE `set_name` = 'sys_toolbar_member' AND `name` = 'notifications-messenger' AND `icon` = 'comments' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'messages-square' WHERE `set_name` = 'trigger_profile_view_actions' AND `name` = 'messenger' AND `icon` = 'comments' AND @bLucide > 0;
