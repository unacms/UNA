--
-- NEO APP: menus
---

--
-- 'config_api' settings
--
UPDATE `sys_objects_menu` SET `config_api`='{"icon":"compass"}' WHERE `object`='sys_homepage_submenu';
UPDATE `sys_objects_menu` SET `config_api`='{}' WHERE `object`='sys_ntfs_submenu';
-- Settings: `hub` is the page that lists the section; `group` puts an item under Account or the current profile
UPDATE `sys_objects_menu` SET `config_api`='{"hub":"settings"}' WHERE `object`='sys_account_settings_submenu';
UPDATE `sys_menu_items` SET `config_api`='{"group":"account"}' WHERE `set_name`='sys_account_settings' AND `module`='system' AND `name` IN ('account-profile-switcher', 'account-settings-info', 'account-settings-email', 'account-settings-password');
UPDATE `sys_menu_items` SET `config_api`=IF(`name`='account-settings-delete', '{"group":"danger"}', '{"group":"profile"}') WHERE `set_name`='sys_account_settings' AND `module`='system' AND `name` IN ('profile-settings-cfilter', 'account-settings-delete');
UPDATE `sys_menu_items` SET `config_api`='{"badge":"friends"}' WHERE `set_name`='sys_tabbar' AND `module`='system' AND `name`='friends';
-- Site menu: Log in and Sign up show as buttons above the other items, in the apps and in UNA's phone sidebar (`primary` picks the prominent one)
UPDATE `sys_menu_items` SET `config_api`='{"button":true}' WHERE `set_name`='sys_site' AND `module`='system' AND `name` IN ('login', 'create-account');

--
-- 'active_api' switch
--
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_site' AND `module`='system' AND `name`='home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_site' AND `module`='system' AND `name`='about';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_site' AND `module`='system' AND `name`='login';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_site' AND `module`='system' AND `name`='create-account';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_site_panel' AND `module`='system' AND `name`='member-avatar';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_site_panel' AND `module`='system' AND `name`='member-menu';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_site_panel' AND `module`='system' AND `name`='member-followings';
-- the apps' sidebar (API v2 GET /navigation): its groups and the Apps Menu's items; Member Menu and Member Following stay off as installed
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_apps_sidebar' AND `module`='system' AND `name`='member-avatar';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_apps_sidebar' AND `module`='system' AND `name`='apps-menu';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_apps_sidebar' AND `module`='system' AND `name`='public-menu';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_apps_sidebar' AND `module`='system' AND `name`='member-memberships';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_apps_menu' AND `module`='system' AND `name`='home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_apps_menu' AND `module`='system' AND `name`='explore';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_apps_menu' AND `module`='system' AND `name`='profile';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_apps_menu' AND `module`='system' AND `name`='connections';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_application' AND `module`='system' AND `name`='home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_application' AND `module`='system' AND `name`='about';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_application' AND `module`='system' AND `name`='more-auto';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_homepage_submenu' AND `module`='system' AND `name`='explore';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_homepage_submenu' AND `module`='system' AND `name`='updates';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_homepage_submenu' AND `module`='system' AND `name`='trends';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_footer' AND `module`='system' AND `name`='about';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_footer' AND `module`='system' AND `name`='terms';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_footer' AND `module`='system' AND `name`='privacy';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_footer' AND `module`='system' AND `name`='copyright';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_footer' AND `module`='system' AND `name`='switch_language';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_footer' AND `module`='system' AND `name`='powered_by';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_toolbar_site' AND `module`='system' AND `name`='main-menu';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_toolbar_member' AND `module`='system' AND `name`='search';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_toolbar_member' AND `module`='system' AND `name`='add-content';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_toolbar_member' AND `module`='system' AND `name`='apps';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_toolbar_member' AND `module`='system' AND `name`='account';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_toolbar_member' AND `module`='system' AND `name`='login';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_account_popup' AND `module`='system' AND `name`='profile-active';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_account_popup' AND `module`='system' AND `name`='profile-notifications';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_account_popup' AND `module`='system' AND `name`='profile-switcher';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_account_popup' AND `module`='system' AND `name`='profile-create';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_account_notifications' AND `module`='system' AND `name`='dashboard';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_account_notifications' AND `module`='system' AND `name`='profile';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_account_notifications' AND `module`='system' AND `name`='account-settings';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_account_notifications' AND `module`='system' AND `name`='studio';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_account_notifications' AND `module`='system' AND `name`='cart';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_account_notifications' AND `module`='system' AND `name`='logout';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_account_settings' AND `module`='system' AND `name`='settings';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_account_settings' AND `module`='system' AND `name`='account-settings-email';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_account_settings' AND `module`='system' AND `name`='account-settings-password';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_account_settings' AND `module`='system' AND `name`='account-settings-delete';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_account_dashboard' AND `module`='system' AND `name`='dashboard';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_account_dashboard' AND `module`='system' AND `name`='dashboard-admin';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_account_dashboard' AND `module`='system' AND `name`='dashboard-subscriptions';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_cmts_item_manage' AND `module`='system' AND `name`='item-report';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_cmts_item_manage' AND `module`='system' AND `name`='item-edit';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_cmts_item_manage' AND `module`='system' AND `name`='item-delete';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_cmts_item_actions' AND `module`='system' AND `name`='item-reaction';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_cmts_item_actions' AND `module`='system' AND `name`='item-reply';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_cmts_item_actions' AND `module`='system' AND `name`='item-quote';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_cmts_item_actions' AND `module`='system' AND `name`='item-more';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_cmts_item_counters' AND `module`='system' AND `name`='item-vote';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_cmts_item_counters' AND `module`='system' AND `name`='item-reaction';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_cmts_item_meta' AND `module`='system' AND `name`='author';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_cmts_item_meta' AND `module`='system' AND `name`='in-reply-to';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_cmts_item_meta' AND `module`='system' AND `name`='date';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_social_sharing' AND `module`='system' AND `name`='social-sharing-facebook';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_social_sharing' AND `module`='system' AND `name`='social-sharing-twitter';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_social_sharing' AND `module`='system' AND `name`='social-sharing-pinterest';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_social_sharing' AND `module`='system' AND `name`='social-sharing-linked_in';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_social_sharing' AND `module`='system' AND `name`='social-sharing-whatsapp';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_account_dashboard_manage_tools' AND `module`='system' AND `name`='cmts-administration';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_dashboard_content_manage' AND `module`='system' AND `name`='cmts';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_profile_stats' AND `module`='system' AND `name`='profile-stats-profile';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_wiki' AND `module`='system' AND `name`='edit';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_wiki' AND `module`='system' AND `name`='delete-version';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_wiki' AND `module`='system' AND `name`='delete-block';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_wiki' AND `module`='system' AND `name`='translate';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_wiki' AND `module`='system' AND `name`='history';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_favorite_list' AND `module`='system' AND `name`='edit';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_favorite_list' AND `module`='system' AND `name`='delete';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_studio_account_popup' AND `module`='system' AND `name`='account';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_studio_account_popup' AND `module`='system' AND `name`='edit';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_studio_account_popup' AND `module`='system' AND `name`='language';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_studio_account_popup' AND `module`='system' AND `name`='logout';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_con_submenu' AND `module`='system' AND `name`='friends';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_con_submenu' AND `module`='system' AND `name`='friend-suggestions';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_con_submenu' AND `module`='system' AND `name`='friend-requests';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_con_submenu' AND `module`='system' AND `name`='sent-friend-requests';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_con_submenu' AND `module`='system' AND `name`='follow-suggestions';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_con_submenu' AND `module`='system' AND `name`='followers';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_con_submenu' AND `module`='system' AND `name`='following';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_ntfs_submenu' AND `module`='system' AND `name`='context-invitations';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_tabbar' AND `module`='system' AND `name`='home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_tabbar' AND `module`='system' AND `name`='explore';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_tabbar' AND `module`='system' AND `name`='friends';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_tabbar' AND `module`='system' AND `name`='about';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_tabbar' AND `module`='system' AND `name`='terms';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_tabbar' AND `module`='system' AND `name`='privacy';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_tabbar' AND `module`='system' AND `name`='profile';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_tabbar' AND `module`='system' AND `name`='dashboard';
