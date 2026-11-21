-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Icons: stored Font Awesome names become the Lucide names they already draw (the Lucide set's map
-- drew them), so the apps and the site name the same icon. Share buttons get brand marks.
-- Only rows that still hold the old name change, and only while the site draws icons with Lucide:
-- the Font Awesome set knows only Font Awesome names.
SET @bLucide = (SELECT COUNT(*) FROM `sys_options` WHERE `name` = 'sys_iconset_default' AND `value` = 'sys_lucide');
UPDATE `sys_grid_actions` SET `icon` = 'search-check' WHERE `object` = 'bx_events_administration' AND `type` = 'single' AND `name` = 'audit_context' AND `icon` = 'search-location' AND @bLucide > 0;
UPDATE `sys_grid_actions` SET `icon` = 'settings' WHERE `object` = 'bx_events_administration' AND `type` = 'single' AND `name` = 'settings' AND `icon` = 'cog' AND @bLucide > 0;
UPDATE `sys_grid_actions` SET `icon` = 'settings' WHERE `object` = 'bx_events_common' AND `type` = 'single' AND `name` = 'settings' AND `icon` = 'cog' AND @bLucide > 0;
UPDATE `sys_grid_actions` SET `icon` = 'x' WHERE `object` = 'bx_events_fans' AND `type` = 'single' AND `name` = 'delete' AND `icon` = 'remove' AND @bLucide > 0;
UPDATE `sys_grid_actions` SET `icon` = 'check-check' WHERE `object` = 'bx_events_fans' AND `type` = 'single' AND `name` = 'questionnaire' AND `icon` = 'check-double' AND @bLucide > 0;
UPDATE `sys_grid_actions` SET `icon` = 'x' WHERE `object` = 'bx_events_invites' AND `type` = 'single' AND `name` = 'delete' AND `icon` = 'remove' AND @bLucide > 0;
UPDATE `sys_grid_actions` SET `icon` = 'x' WHERE `object` = 'bx_events_prices_manage' AND `type` = 'single' AND `name` = 'delete' AND `icon` = 'remove' AND @bLucide > 0;
UPDATE `sys_grid_actions` SET `icon` = 'pencil-line' WHERE `object` = 'bx_events_prices_manage' AND `type` = 'single' AND `name` = 'edit' AND `icon` = 'pencil-alt' AND @bLucide > 0;
UPDATE `sys_grid_actions` SET `icon` = 'shopping-cart' WHERE `object` = 'bx_events_prices_view' AND `type` = 'single' AND `name` = 'buy' AND `icon` = 'cart-plus' AND @bLucide > 0;
UPDATE `sys_grid_actions` SET `icon` = 'square-check-big' WHERE `object` = 'bx_events_prices_view' AND `type` = 'single' AND `name` = 'choose' AND `icon` = 'far check-square' AND @bLucide > 0;
UPDATE `sys_grid_actions` SET `icon` = 'x' WHERE `object` = 'bx_events_questions_manage' AND `type` = 'single' AND `name` = 'delete' AND `icon` = 'remove' AND @bLucide > 0;
UPDATE `sys_grid_actions` SET `icon` = 'pencil-line' WHERE `object` = 'bx_events_questions_manage' AND `type` = 'single' AND `name` = 'edit' AND `icon` = 'pencil-alt' AND @bLucide > 0;
UPDATE `sys_grid_actions` SET `icon` = 'x' WHERE `object` = 'bx_events_sessions_manage' AND `type` = 'single' AND `name` = 'delete' AND `icon` = 'remove' AND @bLucide > 0;
UPDATE `sys_grid_actions` SET `icon` = 'pencil-line' WHERE `object` = 'bx_events_sessions_manage' AND `type` = 'single' AND `name` = 'edit' AND `icon` = 'pencil-alt' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'trash' WHERE `set_name` = 'bx_events_menu_manage_tools' AND `name` = 'delete' AND `icon` = 'far trash-alt' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'trash' WHERE `set_name` = 'bx_events_menu_manage_tools' AND `name` = 'delete-with-content' AND `icon` = 'far trash-alt' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'log-in' WHERE `set_name` = 'bx_events_view_actions' AND `name` = 'join-event-profile' AND `icon` = 'sign-in-alt' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'settings' WHERE `set_name` = 'bx_events_view_actions' AND `name` = 'profile-actions-more' AND `icon` = 'cog' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'log-in' WHERE `set_name` = 'bx_events_view_actions' AND `name` = 'profile-fan-add' AND `icon` = 'sign-in-alt' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'log-out' WHERE `set_name` = 'bx_events_view_actions' AND `name` = 'profile-fan-remove' AND `icon` = 'sign-out-alt' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'circle-check' WHERE `set_name` = 'bx_events_view_actions' AND `name` = 'profile-set-badges' AND `icon` = 'check-circle' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'ellipsis-vertical' WHERE `set_name` = 'bx_events_view_actions_all' AND `name` = 'more-auto' AND `icon` = 'ellipsis-v' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'rotate-ccw-clock' WHERE `set_name` = 'bx_events_view_actions_more' AND `name` = 'audit' AND `icon` = 'history' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'x' WHERE `set_name` = 'bx_events_view_actions_more' AND `name` = 'delete-event-profile' AND `icon` = 'remove' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'pencil-line' WHERE `set_name` = 'bx_events_view_actions_more' AND `name` = 'edit-event-profile' AND `icon` = 'pencil-alt' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'users-round' WHERE `set_name` = 'bx_events_view_actions_more' AND `name` = 'event-manage' AND `icon` = 'users' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'wallet-cards' WHERE `set_name` = 'bx_events_view_actions_more' AND `name` = 'event-pricing' AND `icon` = 'money-check-alt' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'check-check' WHERE `set_name` = 'bx_events_view_actions_more' AND `name` = 'event-questionnaire' AND `icon` = 'check-double' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'calendar-days' WHERE `set_name` = 'bx_events_view_actions_more' AND `name` = 'event-sessions' AND `icon` = 'calendar-day' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'users-round' WHERE `set_name` = 'bx_events_view_actions_more' AND `name` = 'invite-to-event' AND `icon` = 'user-friends' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'triangle-exclamation-point' WHERE `set_name` = 'bx_events_view_actions_more' AND `name` = 'notes' AND `icon` = 'exclamation-triangle' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'info col-gray' WHERE `set_name` = 'bx_events_view_submenu' AND `name` = 'event-profile-info' AND `icon` = 'info-circle col-gray' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'ellipsis-vertical' WHERE `set_name` = 'bx_events_view_submenu' AND `name` = 'more-auto' AND `icon` = 'ellipsis-v' AND @bLucide > 0;
