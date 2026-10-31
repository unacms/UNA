-- UNA-Migration-Min-System-Version: 15.0.0-RC3
-- The update channel gets a third value, dev: a site on it runs every migration in its files.
UPDATE `sys_options` SET `extra` = 'stable,beta,dev' WHERE `name` = 'sys_upgrade_channel' AND `extra` = 'stable,beta';
