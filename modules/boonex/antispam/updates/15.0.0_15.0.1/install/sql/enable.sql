-- OPTIONS
UPDATE `sys_options` SET `type`='secret' WHERE `name`='bx_antispam_akismet_api_key';
UPDATE `sys_options` SET `type`='secret' WHERE `name`='bx_antispam_stopforumspam_api_key';
UPDATE `sys_options` SET `type`='secret' WHERE `name`='bx_antispam_toxicity_filter_api_key';
UPDATE `sys_options` SET `type`='secret' WHERE `name`='bx_antispam_lasso_moderation_api_key';
UPDATE `sys_options` SET `type`='secret' WHERE `name`='bx_antispam_lasso_moderation_webhook_secret';
