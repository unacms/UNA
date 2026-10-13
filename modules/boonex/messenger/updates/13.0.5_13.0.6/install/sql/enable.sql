SET @sName = 'bx_messenger';

SET @iCategId = (SELECT `id` FROM `sys_options_categories` WHERE `name` = CONCAT(@sName, '_jitsi'));
UPDATE `sys_options` SET `category_id` = @iCategId, `order` = 9 WHERE `name` = 'bx_messenger_jwt_app_id';
UPDATE `sys_options` SET `category_id` = @iCategId, `order` = 10 WHERE `name` = 'bx_messenger_jwt_app_secret';
