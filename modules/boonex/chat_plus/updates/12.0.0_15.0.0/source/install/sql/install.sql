-- Studio page and widget

INSERT INTO `sys_std_pages`(`index`, `name`, `header`, `caption`, `icon`) VALUES
(3, 'bx_chat_plus', '_bx_chat_plus', '_bx_chat_plus', 'bx_chat_plus@modules/boonex/chat_plus/|std-icon.svg');
SET @iPageId = LAST_INSERT_ID();

SET @iParentPageId = (SELECT `id` FROM `sys_std_pages` WHERE `name` = 'home');
SET @iParentPageOrder = (SELECT MAX(`order`) FROM `sys_std_pages_widgets` WHERE `page_id` = @iParentPageId);
INSERT INTO `sys_std_widgets` (`page_id`, `module`, `type`, `url`, `click`, `icon`, `caption`, `cnt_notices`, `cnt_actions`) VALUES
(@iPageId, 'bx_chat_plus', 'integrations', '{url_studio}module.php?name=bx_chat_plus', '', 'bx_chat_plus@modules/boonex/chat_plus/|std-icon.svg', '_bx_chat_plus_wgt_cpt', '', 'a:4:{s:6:"module";s:12:"bx_chat_plus";s:6:"method";s:11:"get_actions";s:6:"params";a:0:{}s:5:"class";s:6:"Module";}');
INSERT INTO `sys_std_pages_widgets` (`page_id`, `widget_id`, `order`) VALUES
(@iParentPageId, LAST_INSERT_ID(), IF(ISNULL(@iParentPageOrder), 1, @iParentPageOrder + 1));

