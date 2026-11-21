-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- The "Get started" checklist is hidden in the mobile apps (Hidden on: mobile app, BX_DB_HIDDEN_MOBILE = bit 8): its steps are
-- set in Studio, which the apps don't have. The web app and the site keep it. Adding the bit is safe to repeat.
UPDATE `sys_pages_blocks` SET `hidden_on`=CAST(`hidden_on` AS UNSIGNED) | 8 WHERE `module`='system' AND `title_system` IN ('_sys_page_block_title_system_onboarding_operator', '_sys_page_block_title_system_onboarding');
