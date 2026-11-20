-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- The module's items in shared menus (header, account and profile menus, the homepage apps) get the plain icon the
-- other items have, without a colour of their own. An icon the site has changed is left as it is.
UPDATE `sys_menu_items` SET `icon`='shield-alt' WHERE `set_name`='sys_account_settings' AND `module`='bx_acl' AND `name`='acl-view' AND `icon`='shield-alt col-red2';
