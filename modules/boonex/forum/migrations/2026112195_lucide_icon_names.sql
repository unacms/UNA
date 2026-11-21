-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Icons: stored Font Awesome names become the Lucide names they already draw (the Lucide set's map
-- drew them), so the apps and the site name the same icon. Share buttons get brand marks.
-- Only rows that still hold the old name change, and only while the site draws icons with Lucide:
-- the Font Awesome set knows only Font Awesome names.
SET @bLucide = (SELECT COUNT(*) FROM `sys_options` WHERE `name` = 'sys_iconset_default' AND `value` = 'sys_lucide');
UPDATE `sys_grid_actions` SET `icon` = 'x' WHERE `object` = 'bx_forum_administration' AND `type` = 'single' AND `name` = 'delete' AND `icon` = 'remove' AND @bLucide > 0;
UPDATE `sys_grid_actions` SET `icon` = 'pencil-line' WHERE `object` = 'bx_forum_administration' AND `type` = 'single' AND `name` = 'edit' AND `icon` = 'pencil-alt' AND @bLucide > 0;
UPDATE `sys_grid_actions` SET `icon` = 'settings' WHERE `object` = 'bx_forum_administration' AND `type` = 'single' AND `name` = 'settings' AND `icon` = 'cog' AND @bLucide > 0;
UPDATE `sys_grid_actions` SET `icon` = 'pencil-line' WHERE `object` = 'bx_forum_categories' AND `type` = 'single' AND `name` = 'edit' AND `icon` = 'pencil-alt' AND @bLucide > 0;
UPDATE `sys_grid_actions` SET `icon` = 'x' WHERE `object` = 'bx_forum_common' AND `type` = 'single' AND `name` = 'delete' AND `icon` = 'remove' AND @bLucide > 0;
UPDATE `sys_grid_actions` SET `icon` = 'pencil-line' WHERE `object` = 'bx_forum_common' AND `type` = 'single' AND `name` = 'edit' AND `icon` = 'pencil-alt' AND @bLucide > 0;
UPDATE `sys_grid_actions` SET `icon` = 'settings' WHERE `object` = 'bx_forum_common' AND `type` = 'single' AND `name` = 'settings' AND `icon` = 'cog' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'messages-square' WHERE `set_name` = 'bx_events_view_submenu' AND `name` = 'discussions-context' AND `icon` = 'far comments' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'square-check' WHERE `set_name` = 'bx_forum_entry_attachments' AND `name` = 'poll' AND `icon` = 'tasks' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'circle' WHERE `set_name` = 'bx_forum_entry_attachments' AND `name` = 'video_record_video' AND `icon` = 'fas circle' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'messages-square' WHERE `set_name` = 'bx_forum_snippet_meta_main' AND `name` = 'comments' AND `icon` = 'comments' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'pin' WHERE `set_name` = 'bx_forum_snippet_meta_main' AND `name` = 'sticked' AND `icon` = 'thumbtack' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'circle-stop' WHERE `set_name` = 'bx_forum_view' AND `name` = 'hide-discussion' AND `icon` = 'stop-circle' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'settings' WHERE `set_name` = 'bx_forum_view' AND `name` = 'more' AND `icon` = 'cog' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'circle-check' WHERE `set_name` = 'bx_forum_view' AND `name` = 'resolve-discussion' AND `icon` = 'check-circle' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'pin' WHERE `set_name` = 'bx_forum_view' AND `name` = 'stick-discussion' AND `icon` = 'thumbtack' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'rotate-ccw-clock' WHERE `set_name` = 'bx_forum_view_actions' AND `name` = 'audit' AND `icon` = 'history' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'ellipsis-vertical' WHERE `set_name` = 'bx_forum_view_actions' AND `name` = 'more-auto' AND `icon` = 'ellipsis-v' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'triangle-exclamation-point' WHERE `set_name` = 'bx_forum_view_actions' AND `name` = 'notes' AND `icon` = 'exclamation-triangle' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'circle-check' WHERE `set_name` = 'bx_forum_view_actions' AND `name` = 'set-badges' AND `icon` = 'check-circle' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'x' WHERE `set_name` = 'bx_forum_view_more' AND `name` = 'delete-discussion' AND `icon` = 'remove' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'pencil-line' WHERE `set_name` = 'bx_forum_view_more' AND `name` = 'edit-discussion' AND `icon` = 'pencil-alt' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'circle-play' WHERE `set_name` = 'bx_forum_view_more' AND `name` = 'unhide-discussion' AND `icon` = 'play-circle' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'lock-open' WHERE `set_name` = 'bx_forum_view_more' AND `name` = 'unlock-discussion' AND `icon` = 'unlock' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'circle-check' WHERE `set_name` = 'bx_forum_view_more' AND `name` = 'unresolve-discussion' AND `icon` = 'check-circle' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'pin' WHERE `set_name` = 'bx_forum_view_more' AND `name` = 'unstick-discussion' AND `icon` = 'thumbtack' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'messages-square' WHERE `set_name` = 'bx_groups_view_submenu' AND `name` = 'discussions-context' AND `icon` = 'far comments' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'messages-square' WHERE `set_name` = 'bx_organizations_view_submenu' AND `name` = 'discussions-author' AND `icon` = 'far comments' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'messages-square' WHERE `set_name` = 'bx_persons_view_submenu' AND `name` = 'discussions-author' AND `icon` = 'far comments' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'messages-square' WHERE `set_name` = 'sys_account_dashboard_manage_tools' AND `name` = 'discussions-administration' AND `icon` = 'far comments' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'messages-square' WHERE `set_name` = 'sys_add_content_links' AND `name` = 'create-discussion' AND `icon` = 'far comments' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'messages-square' WHERE `set_name` = 'sys_create_post' AND `name` = 'create-discussion' AND `icon` = 'far comments' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'messages-square' WHERE `set_name` = 'sys_homepage' AND `name` = 'discussions-home' AND `icon` = 'far comments' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'messages-square' WHERE `set_name` = 'sys_profile_stats' AND `name` = 'profile-stats-my-forum' AND `icon` = 'far comments' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'messages-square' WHERE `set_name` = 'sys_site' AND `name` = 'discussions-home' AND `icon` = 'far comments' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'messages-square' WHERE `set_name` = 'trigger_group_view_submenu' AND `name` = 'discussions-context' AND `icon` = 'far comments' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'messages-square' WHERE `set_name` = 'trigger_profile_view_submenu' AND `name` = 'discussions-author' AND `icon` = 'far comments' AND @bLucide > 0;
UPDATE `sys_statistics` SET `icon` = 'messages-square' WHERE `name` = 'bx_forum' AND `icon` = 'far comments' AND @bLucide > 0;
