-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- A person's card in the apps has the site's buttons: the friend and follow toggles of the snippet meta menu
-- (obj-friends, obj-subscriptions), which were on for the site only, and Friend Suggestions' Add friend (befriend),
-- which the apps had for organizations but not for people. The apps draw the first two.
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_persons_snippet_meta' AND `module`='bx_persons' AND `name` IN ('obj-friends', 'obj-subscriptions', 'befriend') AND `active_api`=0;
