-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Icons: stored Font Awesome names become the Lucide names they already draw (the Lucide set's map
-- drew them), so the apps and the site name the same icon. Share buttons get brand marks.
-- Only rows that still hold the old name change, and only while the site draws icons with Lucide:
-- the Font Awesome set knows only Font Awesome names.
SET @bLucide = (SELECT COUNT(*) FROM `sys_options` WHERE `name` = 'sys_iconset_default' AND `value` = 'sys_lucide');
UPDATE `sys_grid_actions` SET `icon` = 'search-check' WHERE `object` = 'bx_organizations_administration' AND `type` = 'single' AND `name` = 'audit_profile' AND `icon` = 'search-location' AND @bLucide > 0;
UPDATE `sys_grid_actions` SET `icon` = 'award' WHERE `object` = 'bx_organizations_administration' AND `type` = 'single' AND `name` = 'set_acl_level' AND `icon` = 'certificate' AND @bLucide > 0;
UPDATE `sys_grid_actions` SET `icon` = 'settings' WHERE `object` = 'bx_organizations_administration' AND `type` = 'single' AND `name` = 'settings' AND `icon` = 'cog' AND @bLucide > 0;
UPDATE `sys_grid_actions` SET `icon` = 'settings' WHERE `object` = 'bx_organizations_common' AND `type` = 'single' AND `name` = 'settings' AND `icon` = 'cog' AND @bLucide > 0;
UPDATE `sys_grid_actions` SET `icon` = 'x' WHERE `object` = 'bx_organizations_fans' AND `type` = 'single' AND `name` = 'delete' AND `icon` = 'remove' AND @bLucide > 0;
UPDATE `sys_grid_actions` SET `icon` = 'x' WHERE `object` = 'bx_organizations_invites' AND `type` = 'single' AND `name` = 'delete' AND `icon` = 'remove' AND @bLucide > 0;
UPDATE `sys_grid_actions` SET `icon` = 'x' WHERE `object` = 'bx_organizations_prices_manage' AND `type` = 'single' AND `name` = 'delete' AND `icon` = 'remove' AND @bLucide > 0;
UPDATE `sys_grid_actions` SET `icon` = 'pencil-line' WHERE `object` = 'bx_organizations_prices_manage' AND `type` = 'single' AND `name` = 'edit' AND `icon` = 'pencil-alt' AND @bLucide > 0;
UPDATE `sys_grid_actions` SET `icon` = 'shopping-cart' WHERE `object` = 'bx_organizations_prices_view' AND `type` = 'single' AND `name` = 'buy' AND `icon` = 'cart-plus' AND @bLucide > 0;
UPDATE `sys_grid_actions` SET `icon` = 'square-check-big' WHERE `object` = 'bx_organizations_prices_view' AND `type` = 'single' AND `name` = 'choose' AND `icon` = 'far check-square' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'trash' WHERE `set_name` = 'bx_organizations_menu_manage_tools' AND `name` = 'delete-with-content' AND `icon` = 'far trash-alt' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'log-in' WHERE `set_name` = 'bx_organizations_view_actions' AND `name` = 'join-organization-profile' AND `icon` = 'sign-in-alt' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'settings' WHERE `set_name` = 'bx_organizations_view_actions' AND `name` = 'profile-actions-more' AND `icon` = 'cog' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'log-in' WHERE `set_name` = 'bx_organizations_view_actions' AND `name` = 'profile-fan-add' AND `icon` = 'sign-in-alt' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'log-out' WHERE `set_name` = 'bx_organizations_view_actions' AND `name` = 'profile-fan-remove' AND `icon` = 'sign-out-alt' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'user-round-plus' WHERE `set_name` = 'bx_organizations_view_actions' AND `name` = 'profile-friend-add' AND `icon` = 'user-plus' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'refresh-ccw' WHERE `set_name` = 'bx_organizations_view_actions' AND `name` = 'profile-relation-add' AND `icon` = 'sync' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'refresh-ccw' WHERE `set_name` = 'bx_organizations_view_actions' AND `name` = 'profile-relation-remove' AND `icon` = 'sync' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'award' WHERE `set_name` = 'bx_organizations_view_actions' AND `name` = 'profile-set-acl-level' AND `icon` = 'certificate' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'circle-check' WHERE `set_name` = 'bx_organizations_view_actions' AND `name` = 'profile-set-badges' AND `icon` = 'check-circle' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'ellipsis-vertical' WHERE `set_name` = 'bx_organizations_view_actions_all' AND `name` = 'more-auto' AND `icon` = 'ellipsis-v' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'rotate-ccw-clock' WHERE `set_name` = 'bx_organizations_view_actions_more' AND `name` = 'audit' AND `icon` = 'history' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'user-round-x' WHERE `set_name` = 'bx_organizations_view_actions_more' AND `name` = 'delete-organization-account' AND `icon` = 'user-times' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'x' WHERE `set_name` = 'bx_organizations_view_actions_more' AND `name` = 'delete-organization-profile' AND `icon` = 'remove' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'badge' WHERE `set_name` = 'bx_organizations_view_actions_more' AND `name` = 'edit-organization-badge' AND `icon` = 'fa-certificate' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'wallet-cards' WHERE `set_name` = 'bx_organizations_view_actions_more' AND `name` = 'edit-organization-pricing' AND `icon` = 'money-check-alt' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'pencil-line' WHERE `set_name` = 'bx_organizations_view_actions_more' AND `name` = 'edit-organization-profile' AND `icon` = 'pencil-alt' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'users-round' WHERE `set_name` = 'bx_organizations_view_actions_more' AND `name` = 'invite-to-organization' AND `icon` = 'user-friends' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'triangle-exclamation-point' WHERE `set_name` = 'bx_organizations_view_actions_more' AND `name` = 'notes' AND `icon` = 'exclamation-triangle' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'users-round' WHERE `set_name` = 'bx_organizations_view_actions_more' AND `name` = 'organization-manage' AND `icon` = 'users' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'ellipsis-vertical' WHERE `set_name` = 'bx_organizations_view_submenu' AND `name` = 'more-auto' AND `icon` = 'ellipsis-v' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'users-round' WHERE `set_name` = 'bx_organizations_view_submenu' AND `name` = 'organization-profile-fans' AND `icon` = 'users' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'users-round' WHERE `set_name` = 'bx_organizations_view_submenu' AND `name` = 'organization-profile-friends' AND `icon` = 'users' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'info' WHERE `set_name` = 'bx_organizations_view_submenu' AND `name` = 'organization-profile-info' AND `icon` = 'info-circle' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'refresh-ccw' WHERE `set_name` = 'bx_organizations_view_submenu' AND `name` = 'organization-profile-relations' AND `icon` = 'sync' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'users-round' WHERE `set_name` = 'sys_account_notifications' AND `name` = 'notifications-friend-requests' AND `icon` = 'users' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'refresh-ccw' WHERE `set_name` = 'sys_account_notifications' AND `name` = 'notifications-relation-requests' AND `icon` = 'sync' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'refresh-ccw' WHERE `set_name` = 'sys_profile_stats' AND `name` = 'profile-stats-related-me' AND `icon` = 'sync' AND @bLucide > 0;
UPDATE `sys_menu_items` SET `icon` = 'refresh-ccw' WHERE `set_name` = 'sys_profile_stats' AND `name` = 'profile-stats-relations' AND `icon` = 'sync' AND @bLucide > 0;
