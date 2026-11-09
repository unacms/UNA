-- UNA-Migration-Min-System-Version: 15.0.0-RC3

-- enable.sql of the update pack
-- MENUS
UPDATE `sys_menu_items` SET `icon`='shopping-bag' WHERE `set_name`='sys_site' AND `module`='bx_shopify' AND `name`='shopify-home' AND `icon`='shopping-cart';
UPDATE `sys_menu_items` SET `icon`='shopping-bag' WHERE `set_name`='sys_homepage' AND `module`='bx_shopify' AND `name`='shopify-home' AND `icon`='shopping-cart';
UPDATE `sys_menu_items` SET `icon`='shopping-bag' WHERE `set_name`='sys_add_content_links' AND `module`='bx_shopify' AND `name`='create-shopify-entry' AND `icon`='shopping-cart';
UPDATE `sys_menu_items` SET `icon`='shopping-bag' WHERE `set_name`='sys_profile_stats' AND `module`='bx_shopify' AND `name`='profile-stats-my-shopify' AND `icon`='shopping-cart';
UPDATE `sys_menu_items` SET `icon`='shopping-bag' WHERE `set_name`='sys_account_dashboard_manage_tools' AND `module`='bx_shopify' AND `name`='shopify-administration' AND `icon`='shopping-cart';
UPDATE `sys_menu_items` SET `icon`='shopping-bag' WHERE `module`='bx_shopify' AND `name`='shopify-author' AND `title_system`='_bx_shopify_menu_item_title_system_view_entries_author' AND `icon`='shopping-cart';
UPDATE `sys_menu_items` SET `icon`='shopping-bag' WHERE `module`='bx_shopify' AND `name`='shopify-context' AND `title_system`='_bx_shopify_menu_item_title_system_view_entries_in_context' AND `icon`='shopping-cart';

-- STATS
UPDATE `sys_statistics` SET `icon`='shopping-bag' WHERE `module`='bx_shopify' AND `name`='bx_shopify' AND `icon`='shopping-cart';
