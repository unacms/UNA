SET @sName = 'bx_stripe_connect';


-- TABLES
CREATE TABLE IF NOT EXISTS `bx_stripe_connect_accounts` (
  `id` int(11) NOT NULL auto_increment,
  `added` int(11) NOT NULL default '0',
  `changed` int(11) NOT NULL default '0',
  `profile_id` int(11) NOT NULL default '0',
  `live_account_id` varchar(64) NOT NULL default '',
  `live_details` tinyint(4) NOT NULL default '0',
  `test_account_id` varchar(64) NOT NULL default '',
  `test_details` tinyint(4) NOT NULL default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `profile_id` (`profile_id`)
);

-- Logs Objects
INSERT INTO `sys_objects_logs` (`object`, `module`, `logs_storage`, `title`, `active`, `class_name`, `class_file`) VALUES
('bx_stripe_connect', 'bx_stripe_connect', 'Auto', '_bx_stripe_connect_log', 1, '', '');

-- Studio page and widget
INSERT INTO `sys_std_pages`(`index`, `name`, `header`, `caption`, `icon`) VALUES
(3, @sName, '_bx_stripe_connect', '_bx_stripe_connect', 'bx_stripe_connect@modules/boonex/stripe_connect/|std-icon.svg');
SET @iPageId = LAST_INSERT_ID();

SET @iParentPageId = (SELECT `id` FROM `sys_std_pages` WHERE `name` = 'home');
SET @iParentPageOrder = (SELECT MAX(`order`) FROM `sys_std_pages_widgets` WHERE `page_id` = @iParentPageId);
INSERT INTO `sys_std_widgets` (`page_id`, `module`, `type`, `url`, `click`, `icon`, `caption`, `cnt_notices`, `cnt_actions`) VALUES
(@iPageId, @sName, 'integrations', '{url_studio}module.php?name=bx_stripe_connect', '', 'bx_stripe_connect@modules/boonex/stripe_connect/|std-icon.svg', '_bx_stripe_connect', '', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_actions";s:6:"params";a:0:{}s:5:"class";s:18:"TemplStudioModules";}');
INSERT INTO `sys_std_pages_widgets` (`page_id`, `widget_id`, `order`) VALUES
(@iParentPageId, LAST_INSERT_ID(), IF(ISNULL(@iParentPageOrder), 1, @iParentPageOrder + 1));
