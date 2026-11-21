-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Member account and privacy: notices when the email or password changes, the "use connectors" membership action,
-- and Connectors in account settings only for levels with it, while the MCP server is on or the account has tokens.
INSERT INTO `sys_email_templates` (`Module`, `NameSystem`, `Name`, `Subject`, `Body`)
SELECT 'system', '_sys_et_txt_name_system_confirm_email_change', 't_ConfirmEmailChange', '_sys_et_txt_subject_confirm_email_change', '_sys_et_txt_body_confirm_email_change' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_email_templates` WHERE `Name` = 't_ConfirmEmailChange');

INSERT INTO `sys_email_templates` (`Module`, `NameSystem`, `Name`, `Subject`, `Body`)
SELECT 'system', '_sys_et_txt_name_system_email_change_requested', 't_EmailChangeRequested', '_sys_et_txt_subject_email_change_requested', '_sys_et_txt_body_email_change_requested' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_email_templates` WHERE `Name` = 't_EmailChangeRequested');

INSERT INTO `sys_email_templates` (`Module`, `NameSystem`, `Name`, `Subject`, `Body`)
SELECT 'system', '_sys_et_txt_name_system_email_changed', 't_EmailChanged', '_sys_et_txt_subject_email_changed', '_sys_et_txt_body_email_changed' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_email_templates` WHERE `Name` = 't_EmailChanged');

INSERT INTO `sys_email_templates` (`Module`, `NameSystem`, `Name`, `Subject`, `Body`)
SELECT 'system', '_sys_et_txt_name_system_password_changed', 't_PasswordChanged', '_sys_et_txt_subject_password_changed', '_sys_et_txt_body_password_changed' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_email_templates` WHERE `Name` = 't_PasswordChanged');

INSERT INTO `sys_acl_actions` (`Module`, `Name`, `AdditionalParamName`, `Title`, `Desc`, `Countable`, `DisabledForLevels`)
SELECT 'system', 'use connectors', NULL, '_sys_acl_action_use_connectors', '', 0, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `sys_acl_actions` WHERE `Module` = 'system' AND `Name` = 'use connectors');

INSERT IGNORE INTO `sys_acl_matrix` (`IDLevel`, `IDAction`)
SELECT `l`.`ID`, `a`.`ID` FROM `sys_acl_levels` AS `l`, `sys_acl_actions` AS `a`
WHERE `l`.`ID` IN (2, 3, 7, 8, 9) AND `a`.`Module` = 'system' AND `a`.`Name` = 'use connectors';

UPDATE `sys_menu_items` SET `visibility_custom` = 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:23:"is_connectors_available";s:5:"class";s:19:"TemplServiceAccount";}'
WHERE `set_name` = 'sys_account_settings' AND `module` = 'system' AND `name` = 'account-settings-connectors' AND `visibility_custom` = '';
