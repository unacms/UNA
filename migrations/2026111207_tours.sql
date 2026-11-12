-- UNA-Migration-Min-System-Version: 15.0.0-RC3
-- Introduction tours: what an account has closed or finished is kept in the database (BxDolTours), and operators
-- get an "Introduction Tour" item in the site's account menu to start the homepage tour again.
CREATE TABLE IF NOT EXISTS `sys_accounts_tours` (
  `account_id` int(10) unsigned NOT NULL,
  `tour` varchar(32) NOT NULL,
  `added` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`account_id`, `tour`)
);

INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `addon`, `submenu_object`, `visible_for_levels`, `visibility_custom`, `active`, `copyable`, `order`)
SELECT 'sys_account_notifications', 'system', 'tour', '_sys_menu_item_title_system_tour', '_sys_menu_item_title_tour', 'index.php?tour=1', 'if(typeof glTour !== ''undefined'') { glTour.start(); return false; }', '', 'compass', '', '', 2147483646, 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:17:"is_tour_available";s:6:"params";a:1:{i:0;s:4:"home";}s:5:"class";s:19:"TemplServiceAccount";}', 1, 1, 9997
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_items` WHERE `set_name`='sys_account_notifications' AND `module`='system' AND `name`='tour');
