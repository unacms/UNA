-- TABLES
CREATE TABLE IF NOT EXISTS `bx_notifications_aggregator` (
  `id` int(11) NOT NULL auto_increment,
  `profile_id` int(11) NOT NULL DEFAULT '0',
  `event_id` int(11) NOT NULL DEFAULT '0',
  `delivery` varchar(64) NOT NULL default '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `item` (`profile_id`, `event_id`, `delivery`(16))
);

UPDATE `bx_notifications_handlers` SET `priority`='0' WHERE `alert_unit`='meta_mention' AND `alert_action`='added';
