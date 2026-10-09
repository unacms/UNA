
-- default admin account

INSERT INTO `sys_accounts` (`name`, `email`, `email_confirmed`, `receive_updates`, `receive_news`, `password`, `salt`, `role`, `added`) VALUES 
({admin_username}, {admin_email}, 1, 1, 1, {admin_pwd_hash}, {admin_pwd_salt}, 3, {current_timestamp});

SET @iAccountId = LAST_INSERT_ID();

INSERT INTO `sys_profiles` (`account_id`, `type`, `content_id`, `status`) VALUES
(@iAccountId, 'system', @iAccountId, 'active');

INSERT INTO `sys_std_roles_members` (`account_id`, `role`) VALUES
(@iAccountId, 1);

-- default bot profile

INSERT INTO `sys_accounts` (`name`, `email`, `email_confirmed`, `receive_updates`, `receive_news`, `password`, `salt`, `role`, `added`) VALUES 
('Robot', '', 1, 0, 0, '', '', 3, {current_timestamp});

SET @iAccountIdBot = LAST_INSERT_ID();

INSERT INTO `sys_profiles` (`account_id`, `type`, `content_id`, `status`) VALUES
(@iAccountIdBot, 'system', @iAccountIdBot, 'active');

SET @iProfileIdBot = LAST_INSERT_ID();

-- install time

UPDATE `sys_modules` SET `date` = {time} WHERE `name` = 'system' AND `date` = 0;

-- site settings

UPDATE `sys_options` SET `VALUE` = {admin_email} WHERE `Name` = 'site_email';
UPDATE `sys_options` SET `VALUE` = {site_title} WHERE `Name` = 'site_title';
UPDATE `sys_options` SET `VALUE` = {site_email} WHERE `Name` = 'site_email_notify';
UPDATE `sys_options` SET `VALUE` = {language} WHERE `Name` = 'lang_default';
UPDATE `sys_options` SET `VALUE` = {oauth_key} WHERE `Name` = 'sys_oauth_key';
UPDATE `sys_options` SET `VALUE` = {oauth_secret} WHERE `Name` = 'sys_oauth_secret';
UPDATE `sys_options` SET `VALUE` = @iProfileIdBot WHERE `Name` = 'sys_profile_bot';

-- UNA operator proxy: the master holds the provider key.
INSERT INTO `sys_agents_models` SET
    `type` = 'una-proxy',
    `model` = 'una-proxy',
    `title` = 'UNA proxy',
    `duplicate` = 0;
SET @iUnaProxyModel = LAST_INSERT_ID();

INSERT INTO `sys_agents_agents` SET
    `name` = 'una_operator',
    `title` = 'UNA operator',
    `model_id` = @iUnaProxyModel,
    `profile_id` = @iProfileIdBot,
    `prompt_system` = 'You are the site operator assistant. Answer questions about this site content. Use content_structure, content_search, content_get, and comments_get. Do not change data.',
    `tools` = CONCAT_WS(',',
        (SELECT `id` FROM `sys_agents_tools` WHERE `type` = 'content_structure' ORDER BY `id` LIMIT 1),
        (SELECT `id` FROM `sys_agents_tools` WHERE `type` = 'content_search' ORDER BY `id` LIMIT 1),
        (SELECT `id` FROM `sys_agents_tools` WHERE `type` = 'content_get' ORDER BY `id` LIMIT 1),
        (SELECT `id` FROM `sys_agents_tools` WHERE `type` = 'comments_get' ORDER BY `id` LIMIT 1)
    ),
    `trigger` = 'manual',
    `added` = {current_timestamp},
    `active` = 1;

UPDATE `sys_options` SET `VALUE` = LAST_INSERT_ID() WHERE `Name` = 'sys_agents_operator_agent';

UPDATE `sys_modules` SET `version` = {version} WHERE `name` = 'system';
