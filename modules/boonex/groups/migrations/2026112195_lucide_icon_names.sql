-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Icons: stored Font Awesome names become the Lucide names they already draw (the Lucide set's map
-- drew them), so the apps and the site name the same icon. Share buttons get brand marks.
-- Only rows that still hold the old name change, and only while the site draws icons with Lucide:
-- the Font Awesome set knows only Font Awesome names.
SET @bLucide = (SELECT COUNT(*) FROM `sys_options` WHERE `name` = 'sys_iconset_default' AND `value` = 'sys_lucide');
UPDATE `sys_grid_actions` SET `icon` = 'search-check' WHERE `object` = 'bx_groups_administration' AND `type` = 'single' AND `name` = 'audit_context' AND `icon` = 'search-location' AND @bLucide > 0;
UPDATE `sys_grid_actions` SET `icon` = 'settings' WHERE `object` = 'bx_groups_administration' AND `type` = 'single' AND `name` = 'settings' AND `icon` = 'cog' AND @bLucide > 0;
UPDATE `sys_grid_actions` SET `icon` = 'x' WHERE `object` = 'bx_groups_bans' AND `type` = 'single' AND `name` = 'delete' AND `icon` = 'remove' AND @bLucide > 0;
UPDATE `sys_grid_actions` SET `icon` = 'settings' WHERE `object` = 'bx_groups_common' AND `type` = 'single' AND `name` = 'settings' AND `icon` = 'cog' AND @bLucide > 0;
UPDATE `sys_grid_actions` SET `icon` = 'x' WHERE `object` = 'bx_groups_fans' AND `type` = 'single' AND `name` = 'delete' AND `icon` = 'remove' AND @bLucide > 0;
UPDATE `sys_grid_actions` SET `icon` = 'user-x' WHERE `object` = 'bx_groups_fans' AND `type` = 'single' AND `name` = 'delete_and_ban' AND `icon` = 'user-slash' AND @bLucide > 0;
UPDATE `sys_grid_actions` SET `icon` = 'x' WHERE `object` = 'bx_groups_invites' AND `type` = 'single' AND `name` = 'delete' AND `icon` = 'remove' AND @bLucide > 0;
UPDATE `sys_grid_actions` SET `icon` = 'x' WHERE `object` = 'bx_groups_prices_manage' AND `type` = 'single' AND `name` = 'delete' AND `icon` = 'remove' AND @bLucide > 0;
UPDATE `sys_grid_actions` SET `icon` = 'pencil-line' WHERE `object` = 'bx_groups_prices_manage' AND `type` = 'single' AND `name` = 'edit' AND `icon` = 'pencil-alt' AND @bLucide > 0;
UPDATE `sys_grid_actions` SET `icon` = 'shopping-cart' WHERE `object` = 'bx_groups_prices_view' AND `type` = 'single' AND `name` = 'buy' AND `icon` = 'cart-plus' AND @bLucide > 0;
UPDATE `sys_grid_actions` SET `icon` = 'square-check-big' WHERE `object` = 'bx_groups_prices_view' AND `type` = 'single' AND `name` = 'choose' AND `icon` = 'far check-square' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'users-round' WHERE `set_name` = 'bx_events_view_submenu' AND `name` = 'groups-context' AND `icon` = 'users' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'trash' WHERE `set_name` = 'bx_groups_menu_manage_tools' AND `name` = 'delete' AND `icon` = 'far trash-alt' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'trash' WHERE `set_name` = 'bx_groups_menu_manage_tools' AND `name` = 'delete-with-content' AND `icon` = 'far trash-alt' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'log-in' WHERE `set_name` = 'bx_groups_view_actions' AND `name` = 'join-group-profile' AND `icon` = 'sign-in-alt' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'settings' WHERE `set_name` = 'bx_groups_view_actions' AND `name` = 'profile-actions-more' AND `icon` = 'cog' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'log-in' WHERE `set_name` = 'bx_groups_view_actions' AND `name` = 'profile-fan-add' AND `icon` = 'sign-in-alt' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'log-out' WHERE `set_name` = 'bx_groups_view_actions' AND `name` = 'profile-fan-remove' AND `icon` = 'sign-out-alt' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'circle-check' WHERE `set_name` = 'bx_groups_view_actions' AND `name` = 'profile-set-badges' AND `icon` = 'check-circle' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'ellipsis-vertical' WHERE `set_name` = 'bx_groups_view_actions_all' AND `name` = 'more-auto' AND `icon` = 'ellipsis-v' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'rotate-ccw-clock' WHERE `set_name` = 'bx_groups_view_actions_more' AND `name` = 'audit' AND `icon` = 'history' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'x' WHERE `set_name` = 'bx_groups_view_actions_more' AND `name` = 'delete-group-profile' AND `icon` = 'remove' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'wallet-cards' WHERE `set_name` = 'bx_groups_view_actions_more' AND `name` = 'edit-group-pricing' AND `icon` = 'money-check-alt' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'pencil-line' WHERE `set_name` = 'bx_groups_view_actions_more' AND `name` = 'edit-group-profile' AND `icon` = 'pencil-alt' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'tool-case' WHERE `set_name` = 'bx_groups_view_actions_more' AND `name` = 'edit-group-settings' AND `icon` = 'toolbox' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'users-round' WHERE `set_name` = 'bx_groups_view_actions_more' AND `name` = 'group-manage' AND `icon` = 'users' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'users-round' WHERE `set_name` = 'bx_groups_view_actions_more' AND `name` = 'invite-to-group' AND `icon` = 'user-friends' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'triangle-exclamation-point' WHERE `set_name` = 'bx_groups_view_actions_more' AND `name` = 'notes' AND `icon` = 'exclamation-triangle' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'users-round col-blue3' WHERE `set_name` = 'bx_groups_view_submenu' AND `name` = 'group-fans' AND `icon` = 'users col-blue3' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'info col-gray' WHERE `set_name` = 'bx_groups_view_submenu' AND `name` = 'group-profile-info' AND `icon` = 'info-circle col-gray' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'users-round' WHERE `set_name` = 'bx_groups_view_submenu' AND `name` = 'groups-context' AND `icon` = 'users' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'ellipsis-vertical' WHERE `set_name` = 'bx_groups_view_submenu' AND `name` = 'more-auto' AND `icon` = 'ellipsis-v' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'users-round' WHERE `set_name` = 'bx_groups_view_submenu' AND `name` = 'view-group-profile' AND `icon` = 'users' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'users-round' WHERE `set_name` = 'bx_organizations_view_submenu' AND `name` = 'joined-groups' AND `icon` = 'users' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'users-round' WHERE `set_name` = 'bx_persons_view_submenu' AND `name` = 'joined-groups' AND `icon` = 'users' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'users-round' WHERE `set_name` = 'sys_account_dashboard_manage_tools' AND `name` = 'groups-administration' AND `icon` = 'users' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'users-round' WHERE `set_name` = 'sys_add_content_links' AND `name` = 'create-group-profile' AND `icon` = 'users' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'users-round' WHERE `set_name` = 'sys_homepage' AND `name` = 'groups-home' AND `icon` = 'users' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'users-round' WHERE `set_name` = 'sys_profile_followings' AND `name` = 'groups' AND `icon` = 'users' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'users-round' WHERE `set_name` = 'sys_profile_memberships' AND `name` = 'groups' AND `icon` = 'users' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'users-round' WHERE `set_name` = 'sys_profile_stats' AND `name` = 'profile-stats-my-groups' AND `icon` = 'users' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'users-round' WHERE `set_name` = 'sys_site' AND `name` = 'groups-home' AND `icon` = 'users' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'users-round' WHERE `set_name` = 'trigger_group_view_submenu' AND `name` = 'groups-context' AND `icon` = 'users' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'users-round' WHERE `set_name` = 'trigger_profile_view_submenu' AND `name` = 'joined-groups' AND `icon` = 'users' AND @bLucide > 0;
UPDATE `sys_statistics` SET `icon` = 'users-round' WHERE `name` = 'bx_groups' AND `icon` = 'users' AND @bLucide > 0;
