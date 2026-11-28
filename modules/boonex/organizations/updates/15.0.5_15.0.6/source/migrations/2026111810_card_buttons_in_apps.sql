-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- An organization's card in the apps has the site's buttons: the friend and follow toggles of the snippet meta menu
-- (obj-friends, obj-subscriptions), which were on for the site only, and the suggestion lists' Follow and Remove
-- (subscribe, ignore-befriend, ignore-subscribe), which the apps had for people but not for organizations.
-- The apps draw the first two, and Remove as the card's dismiss button.
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_organizations_snippet_meta' AND `module`='bx_organizations' AND `name` IN ('obj-friends', 'obj-subscriptions', 'subscribe', 'ignore-befriend', 'ignore-subscribe') AND `active_api`=0;
