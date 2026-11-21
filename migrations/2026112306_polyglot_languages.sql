-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Polyglot opens on Languages, a grid of the installed languages. Both tables have a unique key on these rows
-- (`object`; `object` + `name`), so INSERT IGNORE adds them once.
INSERT IGNORE INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `override_class_name`, `override_class_file`) VALUES
('sys_studio_lang_languages', 'Sql', 'SELECT `tl`.`ID` AS `id`, `tl`.`Name` AS `name`, `tl`.`Title` AS `title`, `tl`.`Enabled` AS `enabled`, `tm`.`name` AS `module` FROM `sys_localization_languages` AS `tl` LEFT JOIN `sys_modules` AS `tm` ON `tm`.`type`=\'language\' AND `tm`.`uri`=`tl`.`Name` WHERE 1 ', 'sys_localization_languages', 'id', '', '', '', 20, NULL, 'start', '', '', '', 'auto', '', '', 'BxTemplStudioPolyglotLanguages', '');

INSERT IGNORE INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('sys_studio_lang_languages', 'title', '_adm_pgt_txt_language', '50%', 0, '', '', 1),
('sys_studio_lang_languages', 'name', '_adm_pgt_txt_code', '20%', 0, '', '', 2),
('sys_studio_lang_languages', 'enabled', '_adm_pgt_txt_status', '30%', 0, '', '', 3);

-- Text Keys show a language category by the title of its module ("English", "Artificer"), so they sort by it too.
UPDATE `sys_objects_grid` SET `source` = 'SELECT `tlk`.`ID` AS `id`, `tlk`.`Key` AS `key`, IFNULL((SELECT `tm`.`title` FROM `sys_modules` AS `tm` WHERE `tm`.`lang_category`=`tlc`.`Name` LIMIT 1), `tlc`.`Name`) AS `module`, `tls`.`String` AS `string` FROM `sys_localization_keys` AS `tlk` LEFT JOIN `sys_localization_categories` AS `tlc` ON `tlk`.`IDCategory`=`tlc`.`ID` LEFT JOIN `sys_localization_strings` AS `tls` ON `tlk`.`ID`=`tls`.`IDKey` WHERE `tls`.`IDLanguage`=\'%d\'' WHERE `object` = 'sys_studio_lang_keys' AND `source` = 'SELECT `tlk`.`ID` AS `id`, `tlk`.`Key` AS `key`, `tlc`.`Name` AS `module`, `tls`.`String` AS `string` FROM `sys_localization_keys` AS `tlk` LEFT JOIN `sys_localization_categories` AS `tlc` ON `tlk`.`IDCategory`=`tlc`.`ID` LEFT JOIN `sys_localization_strings` AS `tls` ON `tlk`.`ID`=`tls`.`IDKey` WHERE `tls`.`IDLanguage`=\'%d\'';
