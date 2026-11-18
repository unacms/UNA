-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Moment in the scripts every page loads: its core and the locale of the viewer's language only, chosen by the
-- preloader's service (BxBaseServices::serviceGetPreloaderContent, 'datetime_js'), where the build with every locale
-- was loaded for all. Only the row that still names that build changes, so running it again changes nothing.
UPDATE `sys_preloader` SET `content` = 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:21:"get_preloader_content";s:6:"params";a:1:{i:0;s:11:"datetime_js";}s:5:"class";s:12:"BaseServices";}'
WHERE `module` = 'system' AND `type` = 'js_system' AND `content` = 'moment-with-locales.min.js';
