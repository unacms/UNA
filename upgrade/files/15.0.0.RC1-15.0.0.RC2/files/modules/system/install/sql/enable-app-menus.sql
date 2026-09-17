--
-- NEO APP: menus
---

--
-- 'config_api' settings
--

--
-- 'active_api' switch
--
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_site' AND `module`='system' AND `name`='about';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_site_panel' AND `module`='system' AND `name`='member-avatar';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_site_panel' AND `module`='system' AND `name`='member-menu';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_site_panel' AND `module`='system' AND `name`='member-followings';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_application' AND `module`='system' AND `name`='home';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_application' AND `module`='system' AND `name`='about';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_application' AND `module`='system' AND `name`='more-auto';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_homepage_submenu' AND `module`='system' AND `name`='explore';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_homepage_submenu' AND `module`='system' AND `name`='updates';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_homepage_submenu' AND `module`='system' AND `name`='trends';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_footer' AND `module`='system' AND `name`='about';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_footer' AND `module`='system' AND `name`='terms';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_footer' AND `module`='system' AND `name`='privacy';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_toolbar_site' AND `module`='system' AND `name`='main-menu';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_toolbar_site' AND `module`='system' AND `name`='search';
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
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_account_settings' AND `module`='system' AND `name`='account-settings-email';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_account_settings' AND `module`='system' AND `name`='account-settings-password';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_account_settings' AND `module`='system' AND `name`='account-settings-delete';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_account_dashboard' AND `module`='system' AND `name`='dashboard';
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
