-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- A feed item's actions: reactions (likes, reactions or score) first, then comments, then sharing.
-- Only rows still at the installed order change, so an operator's own order stays.

UPDATE `sys_menu_items` SET `order` = 5 WHERE `set_name` IN ('bx_timeline_menu_item_actions', 'bx_timeline_menu_item_actions_all') AND `module` = 'bx_timeline' AND `name` = 'item-vote' AND `order` = 20;
UPDATE `sys_menu_items` SET `order` = 6 WHERE `set_name` IN ('bx_timeline_menu_item_actions', 'bx_timeline_menu_item_actions_all') AND `module` = 'bx_timeline' AND `name` = 'item-reaction' AND `order` = 30;
UPDATE `sys_menu_items` SET `order` = 7 WHERE `set_name` IN ('bx_timeline_menu_item_actions', 'bx_timeline_menu_item_actions_all') AND `module` = 'bx_timeline' AND `name` = 'item-score' AND `order` = 40;
