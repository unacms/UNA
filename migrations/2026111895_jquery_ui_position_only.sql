-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- jQuery UI in the scripts every page loads: its position utility only (the popups use it), chosen by the preloader's
-- service (BxBaseServices::serviceGetPreloaderContent, 'jquery_ui_js'), where the whole library was loaded for all.
-- The pages that use its widgets (sortable, slider, autocomplete) add the whole library themselves. Only the row that
-- still names the whole library changes, so running it again changes nothing.
UPDATE `sys_preloader` SET `content` = 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:21:"get_preloader_content";s:6:"params";a:1:{i:0;s:12:"jquery_ui_js";}s:5:"class";s:12:"BaseServices";}'
WHERE `module` = 'system' AND `type` = 'js_system' AND `content` = 'jquery-ui/jquery-ui.min.js';
