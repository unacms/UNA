-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Messenger's left column (Inbox, Direct, Threads, ...) has plain icons in the text colour, as other menus do,
-- not one colour per item. An icon the site has changed is left as it is.
UPDATE `sys_menu_items` SET `icon`='inbox' WHERE `set_name`='bx_messenger_nav_menu' AND `name`='inbox' AND `icon`='inbox col-red3';
UPDATE `sys_menu_items` SET `icon`='comment' WHERE `set_name`='bx_messenger_nav_menu' AND `name`='direct' AND `icon`='comment col-blue1';
UPDATE `sys_menu_items` SET `icon`='comments' WHERE `set_name`='bx_messenger_nav_menu' AND `name`='threads' AND `icon`='comments col-blue2';
UPDATE `sys_menu_items` SET `icon`='at' WHERE `set_name`='bx_messenger_nav_menu' AND `name`='mentions_reactions' AND `icon`='at col-green2';
UPDATE `sys_menu_items` SET `icon`='bookmark' WHERE `set_name`='bx_messenger_nav_menu' AND `name`='saved' AND `icon`='bookmark col-red1';
UPDATE `sys_menu_items` SET `icon`='star' WHERE `set_name`='bx_messenger_nav_menu' AND `name`='favorites' AND `icon`='star col-red2';
