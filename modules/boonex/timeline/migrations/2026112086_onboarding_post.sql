-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- The "Write the first post" step of the operators' "Get started" checklist (sys_onboarding_operator).
INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `info`, `link`, `onclick`, `target`, `icon`, `addon`, `visible_for_levels`, `visibility_custom`, `active`, `active_api`, `copyable`, `order`)
SELECT 'sys_onboarding_operator', 'bx_timeline', 'post', '_bx_timeline_menu_item_title_system_onboarding_post', '_bx_timeline_menu_item_title_onboarding_post', '_bx_timeline_menu_item_info_onboarding_post', 'index.php', 'return bx_onboarding_post();', '', 'square-pen', 'a:3:{s:6:"module";s:11:"bx_timeline";s:6:"method";s:25:"get_onboarding_step_state";s:6:"params";a:1:{i:0;s:4:"post";}}', 2147483646, '', 1, 1, 1, 4
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_items` WHERE `set_name` = 'sys_onboarding_operator' AND `module` = 'bx_timeline' AND `name` = 'post');
