-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- The module's items in shared menus (header, account and profile menus, the homepage apps) get the plain icon the
-- other items have, without a colour of their own. An icon the site has changed is left as it is.
UPDATE `sys_menu_items` SET `icon`='comment-alt' WHERE `set_name`='sys_homepage' AND `module`='bx_chat_plus' AND `name`='chat-plus' AND `icon`='comment-alt col-blue3';
UPDATE `sys_menu_items` SET `icon`='comment-alt' WHERE `set_name`='sys_site' AND `module`='bx_chat_plus' AND `name`='chat-plus' AND `icon`='comment-alt col-blue3';
