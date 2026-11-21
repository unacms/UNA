-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Page weight: Pusher's client loads only where a sockets server is set up, at.js (mentions) only for members
-- (BxBaseServices::serviceGetPreloaderContent).
UPDATE `sys_preloader` SET `content` = 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:21:"get_preloader_content";s:6:"params";a:1:{i:0;s:9:"pusher_js";}s:5:"class";s:12:"BaseServices";}' WHERE `module` = 'system' AND `type` = 'js_system' AND `content` = 'pusher/pusher.min.js';
UPDATE `sys_preloader` SET `content` = 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:21:"get_preloader_content";s:6:"params";a:1:{i:0;s:8:"atwho_js";}s:5:"class";s:12:"BaseServices";}' WHERE `module` = 'system' AND `type` = 'js_system' AND `content` = 'at.js/js/jquery.atwho.min.js';
UPDATE `sys_preloader` SET `content` = 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:21:"get_preloader_content";s:6:"params";a:1:{i:0;s:9:"atwho_css";}s:5:"class";s:12:"BaseServices";}' WHERE `module` = 'system' AND `type` = 'css_system' AND `content` = '{dir_plugins_public}at.js/css/|jquery.atwho.min.css';
