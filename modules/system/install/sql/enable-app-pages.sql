--
-- NEO APP: pages
--

-- 'config_api' settings
UPDATE `sys_objects_page` SET `config_api`='{\r\n    layout: \'create-account\',\r\n    blocks: {\r\n        form_join: {\r\n            name: \'system:create_account_form\',\r\n            showTitle: false,\r\n            showBg: false,\r\n        },\r\n        form_invitation: {\r\n            name: \'bx_invites:get_block_form_request\',\r\n            showTitle: false,\r\n            showBg: false,\r\n        },\r\n    },\r\n}' WHERE `object`='sys_create_account';
UPDATE `sys_objects_page` SET `config_api`='{\r\n    layout: \'login\',\r\n}' WHERE `object`='sys_forgot_password';
UPDATE `sys_objects_page` SET `config_api`='{\r\n    layout: \'post\',\r\n   \r\n}' WHERE `object`='sys_cmts_view';
UPDATE `sys_objects_page` SET `config_api`='{\r\n            layout: \'navigator_search\',\r\n            blocks: {\r\n                browse: {\r\n                    name: \'system:search_keyword_result\',\r\n                    showTitle: false,\r\n                    perLine: 4,\r\n                    showBg: false,\r\n                },\r\n            },\r\n            icon: \'Search\',\r\n            headerSettings: { backButton: false, header: true, menu: true },\r\n        }' WHERE `object`='sys_search_keyword';

UPDATE `sys_pages_blocks` SET `config_api`='{\r\n\"content_type\": \"browse_simple\", \r\n\"header_more_url\": \"/friend-suggestions\", \r\n\"header_more_text\": \"View All\"\r\n}' WHERE `object`='sys_home' AND `module`='system' AND `title_system`='_sys_page_block_title_sys_recom_friends';
UPDATE `sys_pages_blocks` SET `config_api`='{\r\n\"content_type\": \"browse_simple\", \r\n\"header_more_url\": \"/follow-suggestions\", \r\n\"header_more_text\": \"View All\"\r\n}' WHERE `object`='sys_home' AND `module`='system' AND `title_system`='_sys_page_block_title_sys_recom_subscriptions';
UPDATE `sys_pages_blocks` SET `config_api`='{\"rounded\": true}' WHERE `object`='sys_home' AND `module`='system' AND `title_system`='_sys_page_block_system_title_login';
UPDATE `sys_pages_blocks` SET `config_api`='{\r\n\"content_type\":\"browse_simple\", \r\n\"header_more_url\": \"/context-invitations\", \r\n\"header_more_text\": \"View All\"\r\n}' WHERE `object`='sys_home' AND `module`='system' AND `title_system`='_sys_page_block_title_sys_invitations';

-- 'active_api' switch
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_home' AND `module`='system' AND `title`='_sys_page_block_title_create_account';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_home' AND `module`='system' AND `title_system`='_sys_page_block_system_title_login';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_home' AND `module`='system' AND `title`='_sys_page_block_title_forgot_password';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_home' AND `module`='system' AND `title`='_sys_page_block_title_profile_menu';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_home' AND `module`='system' AND `title_system`='_sys_page_block_title_sys_create_post';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_home' AND `module`='system' AND `title_system`='_sys_page_block_title_sys_recom_friends';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_home' AND `module`='system' AND `title_system`='_sys_page_block_title_sys_recom_subscriptions';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_home' AND `module`='system' AND `title_system`='_sys_page_block_title_sys_invitations';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_home' AND `module`='system' AND `title_system`='_sys_page_block_system_title_login';

UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_about' AND `module`='system' AND `title_system`='' AND `title`='_sys_page_block_title_about';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_terms' AND `module`='system' AND `title_system`='' AND `title`='_sys_page_block_title_terms';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_privacy' AND `module`='system' AND `title_system`='' AND `title`='_sys_page_block_title_privacy';

UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_dashboard' AND `module`='system' AND `title_system`='_sys_page_block_title_dash_stats';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_dashboard_content' AND `module`='system' AND `title_system`='' AND `title`='_sys_page_block_title_dashboard_content';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_dashboard_audit' AND `module`='system' AND `title_system`='' AND `title`='_sys_page_block_title_dashboard_audit';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_dashboard_reports' AND `module`='system' AND `title_system`='' AND `title`='_sys_page_block_title_dashboard_reports';

UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_create_account' AND `module`='system' AND `title_system`='' AND `title`='_sys_page_block_title_create_account';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_login' AND `module`='system' AND `title_system`='_sys_page_block_system_title_login' AND `title`='_sys_page_block_title_login';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_login_step2' AND `module`='system' AND `title_system`='_sys_page_block_system_title_login_step2' AND `title`='_sys_page_block_title_login_step2';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_login_step3' AND `module`='system' AND `title_system`='_sys_page_block_system_title_login_step3' AND `title`='_sys_page_block_title_login_step3';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_logout' AND `module`='system' AND `title_system`='' AND `title`='_sys_page_block_title_logout';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_forgot_password' AND `module`='system' AND `title_system`='' AND `title`='_sys_page_block_title_forgot_password';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_confirm_email' AND `module`='system' AND `title_system`='' AND `title`='_sys_page_block_title_confirm_email';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_confirm_phone' AND `module`='system' AND `title_system`='' AND `title`='_sys_page_block_title_confirm_phone';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_account_settings_email' AND `module`='system' AND `title_system`='' AND `title`='_sys_page_block_title_account_settings_email';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_account_settings_pwd' AND `module`='system' AND `title_system`='' AND `title`='_sys_page_block_title_account_settings_pwd';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_account_settings_info' AND `module`='system' AND `title_system`='' AND `title`='_sys_page_block_title_account_settings_info';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_account_settings_delete' AND `module`='system' AND `title_system`='' AND `title`='_sys_page_block_title_account_settings_delete';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_account_profile_switcher' AND `module`='system' AND `title_system`='' AND `title`='_sys_page_block_title_account_profile_create';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_account_profile_switcher' AND `module`='system' AND `title_system`='' AND `title`='_sys_page_block_title_account_profile_switcher';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_profile_settings_cfilter' AND `module`='system' AND `title_system`='' AND `title`='_sys_page_block_title_profile_settings_cfilter';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_unsubscribe_notifications' AND `module`='system' AND `title_system`='' AND `title`='_sys_page_block_title_unsubscribe_notifications';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_unsubscribe_news' AND `module`='system' AND `title_system`='' AND `title`='_sys_page_block_title_unsubscribe_news';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_cmts_administration' AND `module`='system' AND `title_system`='_sys_page_block_title_system_cmts_administration' AND `title`='_sys_page_block_title_cmts_administration';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_redirect' AND `module`='system' AND `title_system`='' AND `title`='_sys_page_block_title_redirect';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_search_keyword' AND `module`='system' AND `title_system`='' AND `title`='_sys_page_block_title_search_keyword_result';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_wiki_add_page' AND `module`='system' AND `title_system`='' AND `title`='_sys_page_block_title_wiki_add_page';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_sub_wiki_page_contents' AND `module`='system' AND `title_system`='' AND `title`='_sys_page_block_title_wiki_page_contents';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_std_dashboard' AND `module`='system' AND `title_system`='' AND `title`='_sys_page_block_title_std_dash_version';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_std_dashboard' AND `module`='system' AND `title_system`='' AND `title`='_sys_page_block_title_std_dash_space';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_std_dashboard' AND `module`='system' AND `title_system`='' AND `title`='_sys_page_block_title_std_dash_host_tools';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_std_dashboard' AND `module`='system' AND `title_system`='' AND `title`='_sys_page_block_title_std_dash_cache';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_std_dashboard' AND `module`='system' AND `title_system`='' AND `title`='_sys_page_block_title_std_dash_queues';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_con_friends' AND `module`='system' AND `title_system`='' AND `title`='_sys_page_block_title_con_friends';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_con_friend_requests' AND `module`='system' AND `title_system`='' AND `title`='_sys_page_block_title_con_friend_requests';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_con_friend_requested' AND `module`='system' AND `title_system`='' AND `title`='_sys_page_block_title_con_friend_requested';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_con_following' AND `module`='system' AND `title_system`='' AND `title`='_sys_page_block_title_con_following';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_con_followers' AND `module`='system' AND `title_system`='' AND `title`='_sys_page_block_title_con_followers';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_recom_friends' AND `module`='system' AND `title_system`='' AND `title`='_sys_page_block_title_recom_friends';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_recom_subscriptions' AND `module`='system' AND `title_system`='' AND `title`='_sys_page_block_title_recom_subscriptions';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_cmts_view' AND `module`='system' AND `title_system`='_sys_page_block_title_system_cmts_view_author' AND `title`='_cmt_page_view_title_author';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_cmts_view' AND `module`='system' AND `title_system`='_sys_page_block_title_system_cmts_view' AND `title`='_cmt_page_view_title';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_cmts_view' AND `module`='system' AND `title_system`='_sys_page_block_title_system_cmts_view_content' AND `title`='_cmt_page_view_title_content';
