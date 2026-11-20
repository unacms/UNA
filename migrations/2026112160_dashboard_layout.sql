-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Dashboard: "Get started" (operators) and "Create your profile" (accounts without a profile) on the left, the
-- membership block and "Your profiles" on the right. The apps get all but "Your profiles": their dashboard has a
-- profile switcher of its own.
UPDATE `sys_pages_blocks` SET `cell_id` = 3, `order` = 1 WHERE `object` = 'sys_dashboard' AND `module` = 'system' AND `title` = '_sys_page_block_title_membership_stats' AND `cell_id` = 2;
UPDATE `sys_pages_blocks` SET `active_api` = 1 WHERE `object` = 'sys_dashboard' AND `module` = 'system' AND `title_system` = '' AND `title` = '_sys_page_block_title_membership_stats';

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `tabs`, `async`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `active_api`, `order`)
SELECT 'sys_dashboard', 2, 'system', '_sys_page_block_title_system_onboarding_operator', '_sys_page_block_title_onboarding', 11, 0, 0, 2147483646, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:20:"get_block_onboarding";s:6:"params";a:1:{i:0;s:23:"sys_onboarding_operator";}s:5:"class";s:19:"TemplServiceAccount";}', 0, 1, 1, 1, 1
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `sys_pages_blocks` WHERE `object` = 'sys_dashboard' AND `module` = 'system' AND `title_system` = '_sys_page_block_title_system_onboarding_operator');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `tabs`, `async`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `active_api`, `order`)
SELECT 'sys_dashboard', 2, 'system', '_sys_page_block_title_system_create_profile', '_sys_page_block_title_account_profile_create', 11, 0, 0, 2147483646, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:20:"create_profile_block";s:6:"params";a:0:{}s:5:"class";s:20:"TemplServiceProfiles";}', 0, 1, 1, 1, 2
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `sys_pages_blocks` WHERE `object` = 'sys_dashboard' AND `module` = 'system' AND `title_system` = '_sys_page_block_title_system_create_profile');

INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `tabs`, `async`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `active_api`, `order`)
SELECT 'sys_dashboard', 3, 'system', '_sys_page_block_title_system_dashboard_profiles', '_sys_page_block_title_dashboard_profiles', 11, 0, 0, 2147483644, 'service', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:28:"account_profile_switcher_all";s:6:"params";a:0:{}s:5:"class";s:20:"TemplServiceProfiles";}', 0, 1, 1, 0, 2
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `sys_pages_blocks` WHERE `object` = 'sys_dashboard' AND `module` = 'system' AND `title_system` = '_sys_page_block_title_system_dashboard_profiles');
