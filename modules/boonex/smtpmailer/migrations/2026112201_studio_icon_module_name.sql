-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Studio finds an app's own art by the module name in front of "@" in the icon (studio/template/images/modules/bx_smtp.svg).
-- SMTP Mailer named itself bx_smtpmailer there, so Studio showed its old std-icon.svg on the launcher, its page and in Settings. Only rows that still hold the old value change.
UPDATE `sys_std_pages` SET `icon` = 'bx_smtp@modules/boonex/smtpmailer/|std-icon.svg' WHERE `name` = 'bx_smtp' AND `icon` = 'bx_smtpmailer@modules/boonex/smtpmailer/|std-icon.svg';
UPDATE `sys_std_widgets` SET `icon` = 'bx_smtp@modules/boonex/smtpmailer/|std-icon.svg' WHERE `module` = 'bx_smtp' AND `icon` = 'bx_smtpmailer@modules/boonex/smtpmailer/|std-icon.svg';
UPDATE `sys_options_types` SET `icon` = 'bx_smtp@modules/boonex/smtpmailer/|std-icon.svg' WHERE `name` = 'bx_smtp' AND `icon` = 'bx_smtpmailer@modules/boonex/smtpmailer/|std-icon.svg';
