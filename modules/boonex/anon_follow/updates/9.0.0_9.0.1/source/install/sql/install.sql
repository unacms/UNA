-- TABLES
CREATE TABLE `bx_anon_follow_subscriptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `initiator` int(11) NOT NULL,
  `content` int(11) NOT NULL,
  `added` int(10) UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `content` (`content`),
  UNIQUE INDEX `initiator` (`initiator`, `content`)
);

-- STUDIO WIDGET
INSERT INTO `sys_std_pages`(`index`, `name`, `header`, `caption`, `icon`) VALUES
(3, 'bx_anon_follow', '_bx_anon_follow', '_bx_anon_follow', 'bx_anon_follow@modules/boonex/anon_follow/|std-icon.svg');
SET @iPageId = LAST_INSERT_ID();

SET @iParentPageId = (SELECT `id` FROM `sys_std_pages` WHERE `name` = 'home');
SET @iParentPageOrder = (SELECT MAX(`order`) FROM `sys_std_pages_widgets` WHERE `page_id` = @iParentPageId);
INSERT INTO `sys_std_widgets` (`page_id`, `module`, `type`, `url`, `click`, `icon`, `caption`, `cnt_notices`, `cnt_actions`) VALUES
(@iPageId, 'bx_anon_follow', 'extensions', '{url_studio}module.php?name=bx_anon_follow', '', 'bx_anon_follow@modules/boonex/anon_follow/|std-icon.svg', '_bx_anon_follow', '', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_actions";s:6:"params";a:0:{}s:5:"class";s:18:"TemplStudioModules";}');

INSERT INTO `sys_std_pages_widgets` (`page_id`, `widget_id`, `order`) VALUES
(@iParentPageId, LAST_INSERT_ID(), IF(ISNULL(@iParentPageOrder), 1, @iParentPageOrder + 1));

