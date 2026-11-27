-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Menu template "Cards with descriptions"; the profile types of "Create your profile" use it on the site, and the apps
-- draw them as cards too.
INSERT IGNORE INTO `sys_menu_templates` (`id`, `template`, `title`, `visible`) VALUES
(36, 'menu_list_desc_cards.html', '_sys_menu_template_title_list_desc_cards', 1);

UPDATE `sys_objects_menu` SET `template_id` = 36 WHERE `object` = 'sys_add_profile' AND `template_id` IN (7, 14);
UPDATE `sys_objects_menu` SET `config_api` = '{"view":"cards"}' WHERE `object` = 'sys_add_profile' AND (`config_api` IS NULL OR `config_api` = '' OR `config_api` = '{"view":"grid"}');
