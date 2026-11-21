-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Icons: stored Font Awesome names become the Lucide names they already draw (the Lucide set's map
-- drew them), so the apps and the site name the same icon. Share buttons get brand marks.
-- Only rows that still hold the old name change, and only while the site draws icons with Lucide:
-- the Font Awesome set knows only Font Awesome names.
SET @bLucide = (SELECT COUNT(*) FROM `sys_options` WHERE `name` = 'sys_iconset_default' AND `value` = 'sys_lucide');
UPDATE `sys_grid_actions` SET `icon` = 'x' WHERE `object` = 'bx_timeline_administration' AND `type` = 'single' AND `name` = 'delete' AND `icon` = 'remove' AND @bLucide > 0;
UPDATE `sys_grid_actions` SET `icon` = 'x' WHERE `object` = 'bx_timeline_common' AND `type` = 'single' AND `name` = 'delete' AND `icon` = 'remove' AND @bLucide > 0;
UPDATE `sys_grid_actions` SET `icon` = 'x' WHERE `object` = 'bx_timeline_mute' AND `type` = 'single' AND `name` = 'delete' AND `icon` = 'remove' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'clock' WHERE `set_name` = 'bx_events_view_submenu' AND `name` = 'timeline-view' AND `icon` = 'far clock' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'clock' WHERE `set_name` = 'bx_groups_view_submenu' AND `name` = 'timeline-view' AND `icon` = 'far clock' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'clock' WHERE `set_name` = 'bx_organizations_view_submenu' AND `name` = 'timeline-view' AND `icon` = 'far clock' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'clock' WHERE `set_name` = 'bx_persons_view_submenu' AND `name` = 'timeline-view' AND `icon` = 'far clock' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'message-circle' WHERE `set_name` = 'bx_timeline_menu_item_actions' AND `name` = 'item-comment' AND `icon` = 'comment' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'ellipsis-vertical' WHERE `set_name` = 'bx_timeline_menu_item_actions' AND `name` = 'item-more' AND `icon` = 'ellipsis-v' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'share-2' WHERE `set_name` = 'bx_timeline_menu_item_actions' AND `name` = 'item-share' AND `icon` = 'share-alt' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'ellipsis-vertical' WHERE `set_name` = 'bx_timeline_menu_item_actions_all' AND `name` = 'more-auto' AND `icon` = 'ellipsis-v' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'x' WHERE `set_name` = 'bx_timeline_menu_item_manage' AND `name` = 'item-delete' AND `icon` = 'remove' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'pencil-line' WHERE `set_name` = 'bx_timeline_menu_item_manage' AND `name` = 'item-edit' AND `icon` = 'pencil-alt' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'user-x' WHERE `set_name` = 'bx_timeline_menu_item_manage' AND `name` = 'item-mute' AND `icon` = 'user-slash' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'triangle-exclamation-point' WHERE `set_name` = 'bx_timeline_menu_item_manage' AND `name` = 'item-notes' AND `icon` = 'exclamation-triangle' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'pin' WHERE `set_name` = 'bx_timeline_menu_item_manage' AND `name` = 'item-pin' AND `icon` = 'thumbtack' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'award' WHERE `set_name` = 'bx_timeline_menu_item_manage' AND `name` = 'item-promote' AND `icon` = 'certificate ' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'pin' WHERE `set_name` = 'bx_timeline_menu_item_manage' AND `name` = 'item-stick' AND `icon` = 'thumbtack' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'pin' WHERE `set_name` = 'bx_timeline_menu_item_manage' AND `name` = 'item-unpin' AND `icon` = 'thumbtack' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'award' WHERE `set_name` = 'bx_timeline_menu_item_manage' AND `name` = 'item-unpromote' AND `icon` = 'certificate' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'pin' WHERE `set_name` = 'bx_timeline_menu_item_manage' AND `name` = 'item-unstick' AND `icon` = 'thumbtack' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'mail' WHERE `set_name` = 'bx_timeline_menu_item_share' AND `name` = 'item-send' AND `icon` = 'envelope' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'square-check' WHERE `set_name` = 'bx_timeline_menu_post_attachments' AND `name` = 'add-poll' AND `icon` = 'tasks' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'circle' WHERE `set_name` = 'bx_timeline_menu_post_attachments' AND `name` = 'add-video-record' AND `icon` = 'fas circle' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'clock' WHERE `set_name` = 'sys_add_content_links' AND `name` = 'create-item' AND `icon` = 'far clock' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'clock' WHERE `set_name` = 'sys_create_post' AND `name` = 'create-item' AND `icon` = 'far clock' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'clock' WHERE `set_name` = 'sys_profile_stats' AND `name` = 'profile-stats-my-timeline' AND `icon` = 'far clock' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'clock' WHERE `set_name` = 'trigger_group_view_submenu' AND `name` = 'timeline-view' AND `icon` = 'far clock' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'clock' WHERE `set_name` = 'trigger_profile_view_submenu' AND `name` = 'timeline-view' AND `icon` = 'far clock' AND @bLucide > 0;
