-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- A default /robots.txt and a generated /sitemap.xml (BxDolSitemap), and no indexing of the sign-in, sign-up and
-- forgot password pages.
INSERT INTO `sys_rewrite_rules` (`preg`, `service`, `active`)
SELECT '^robots\\.txt$', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:10:"robots_txt";s:6:"params";a:0:{}}', 1
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `sys_rewrite_rules` WHERE `preg` = '^robots\\.txt$');

INSERT INTO `sys_rewrite_rules` (`preg`, `service`, `active`)
SELECT '^sitemap\\.xml$', 'a:3:{s:6:"module";s:6:"system";s:6:"method";s:11:"sitemap_xml";s:6:"params";a:0:{}}', 1
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `sys_rewrite_rules` WHERE `preg` = '^sitemap\\.xml$');

UPDATE `sys_objects_page` SET `meta_robots` = 'noindex' WHERE `object` IN ('sys_login', 'sys_create_account', 'sys_forgot_password') AND `meta_robots` = '';
