SET @sName = 'bx_analytics';

-- TABLES
DROP TABLE IF EXISTS `bx_analytics_sessions`, `bx_analytics_events`, `bx_analytics_salts`, `bx_analytics_bots`, `bx_analytics_bot_pages`, `bx_analytics_goals`, `bx_analytics_funnels`, `bx_analytics_revenue`, `bx_analytics_subscriptions`, `bx_analytics_errors`, `bx_analytics_error_hits`, `bx_analytics_vitals`;

-- STUDIO WIDGET
DELETE FROM `tp`, `tw`, `twb`, `tpw` 
USING `sys_std_pages` AS `tp` LEFT JOIN `sys_std_widgets` AS `tw` ON `tp`.`id` = `tw`.`page_id` LEFT JOIN `sys_std_widgets_bookmarks` AS `twb` ON `tw`.`id` = `twb`.`widget_id` LEFT JOIN `sys_std_pages_widgets` AS `tpw` ON `tw`.`id` = `tpw`.`widget_id`
WHERE  `tp`.`name` = @sName;
