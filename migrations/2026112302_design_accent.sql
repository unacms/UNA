-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Accent color (Studio > Designer > Settings): a preset of BxDolDesigns::getAccentPresets for the site, Studio and NEO,
-- a hidden option of the templates category like Corners. Blue, the site's colour so far, until another is picked.
INSERT INTO `sys_options` (`category_id`, `name`, `caption`, `value`, `type`, `extra`, `check`, `check_error`, `order`)
SELECT `id`, 'sys_design_accent', '_adm_stg_cpt_option_sys_design_accent', 'blue', 'select', 'blue,indigo,violet,rose,orange,green,teal,graphite', '', '', 28
FROM `sys_options_categories`
WHERE `name` = 'templates' AND NOT EXISTS (SELECT 1 FROM `sys_options` WHERE `name` = 'sys_design_accent');
