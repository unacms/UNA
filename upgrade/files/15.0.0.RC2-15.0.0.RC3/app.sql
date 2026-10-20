--
-- NEO app flags added since 15.0.0-RC2.
-- Difference between the RC2 enable-app snapshots and
-- modules/system/install/sql/enable-app-menus.sql
-- modules/system/install/sql/enable-app-pages.sql
-- Rows these updates target are inserted by sql.sql, which runs first.
--

-- menus
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_toolbar_member' AND `module`='system' AND `name`='search';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_toolbar_member' AND `module`='system' AND `name`='main-menu';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_account_dashboard' AND `module`='system' AND `name`='dashboard-admin';

-- pages
UPDATE `sys_objects_page` SET `config_api`='{"layout":"chat"}' WHERE `object`='sys_cooperator';
UPDATE `sys_pages_blocks` SET `config_api`='{"designbox": {"bg": true, "padding": true, "title": false, "solid": ["mobile"]}}' WHERE `object`='sys_home' AND `module`='system' AND `title_system`='_sys_page_block_title_sys_create_post' AND `config_api` IN ('', '{"designbox": {"bg": true, "padding": true}}');
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_cooperator' AND `module`='system' AND `title_system`='_sys_page_block_title_system_cooperator' AND `title`='_sys_page_block_title_cooperator';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='sys_dashboard_admin' AND `module`='system' AND `title_system`='_sys_page_block_title_system_dashboard_admin' AND `title`='_sys_page_block_title_dashboard_admin';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `module`='system' AND `title_system`='_sys_page_block_title_sys_search_ai';
