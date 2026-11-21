-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- "Who can join" (sys_account_join) replaces "Disable join form" (sys_account_disable_join_form) and the
-- Invitations app's "Enable registration by invitation only" (bx_invites_enable_reg_by_inv). It takes the site's
-- current choice; a site that chose neither keeps it empty, "Anyone" not chosen yet.
INSERT INTO `sys_options` (`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`)
SELECT `c`.`id`, 'sys_account_join', '_adm_stg_cpt_option_sys_account_join',
    IF(EXISTS (SELECT 1 FROM `sys_options` WHERE `name` = 'sys_account_disable_join_form' AND `value` = 'on'), 'closed',
        IF(EXISTS (SELECT 1 FROM `sys_options` WHERE `name` = 'bx_invites_enable_reg_by_inv' AND `value` = 'on')
            AND EXISTS (SELECT 1 FROM `sys_modules` WHERE `name` = 'bx_invites' AND `enabled` = 1), 'invite', '')),
    'select', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:14:"get_join_modes";s:5:"class";s:18:"BaseServiceAccount";}', 'JoinMode', '_adm_stg_err_option_sys_account_join', 0
FROM `sys_options_categories` AS `c`
WHERE `c`.`name` = 'account' AND NOT EXISTS (SELECT 1 FROM `sys_options` WHERE `name` = 'sys_account_join');

DELETE FROM `sys_options_mixes2options` WHERE `option` = 'sys_account_disable_join_form';
DELETE FROM `sys_options` WHERE `name` = 'sys_account_disable_join_form';

-- "Choose who can join" in the operators' "Get started" is a step: done once who can join is chosen.
UPDATE `sys_menu_items` SET `addon` = 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:25:"get_onboarding_step_state";s:6:"params";a:1:{i:0;s:4:"join";}s:5:"class";s:19:"TemplServiceAccount";}'
WHERE `set_name` = 'sys_onboarding_operator' AND `module` = 'system' AND `name` = 'join' AND `addon` = '';
