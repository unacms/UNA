-- UNA-Migration-Min-System-Version: 15.0.0-RC3

-- enable.sql of the update pack
-- CRON
DELETE FROM `sys_cron_jobs` WHERE `name`='bx_ads_publishing';

-- enable-app.sql changes since RC3 (NEO flags); a block that left the app is switched off
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_site' AND `module`='bx_ads' AND `name`='ads-home';
