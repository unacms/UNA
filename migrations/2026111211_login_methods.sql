-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Sign-in methods are always a list of full-width buttons under the form: the "compact view" setting is gone.
DELETE FROM `sys_options` WHERE `name`='site_login_social_compact';
