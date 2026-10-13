SET @sName = 'bx_messenger';

-- SETTINGS
SET @iCategId = (SELECT `id` FROM `sys_options_categories` WHERE `name`=@sName LIMIT 1);

UPDATE `sys_options` 
	SET `extra` = 'native,apple,google,twitter,facebook', 
		`value` = IF (`value` = 'emojione' || `value` = 'messenger', 'native', `value`)		
WHERE `name` = 'bx_messenger_emoji_set' AND `category_id` = @iCategId;