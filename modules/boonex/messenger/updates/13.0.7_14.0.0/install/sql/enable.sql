SET @sName = 'bx_messenger';

SET @iCategId = (SELECT `id` FROM `sys_options_categories` WHERE `name` = CONCAT(@sName, '_settings'));
SET @iOrder = (SELECT MAX(`order`) FROM `sys_options` WHERE `category_id` = @iCategId);

DELETE FROM `sys_options` WHERE `name` = 'bx_messenger_quill_toolbar' AND `category_id` = @iCategId;
INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `check`, `check_error`, `extra`, `order`) VALUES
('bx_messenger_quill_toolbar', '[[''bold'', ''italic'', ''underline'', ''strike'', ''link''],[''blockquote'', ''code-block''],[{''color'':[]},{''background'':[]}]]', @iCategId, '_bx_messenger_quill_toolbar_settings', 'digit', '', '', '', @iOrder + 1);
