-- PAGES: config_api

-- PAGES: active_api
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_analytics_page' AND `module`='bx_analytics' AND `title_system`='_bx_analytics_page_block_title_system_filters' AND `title`='_bx_analytics_page_block_title_filters';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_analytics_page' AND `module`='bx_analytics' AND `title_system`='_bx_analytics_page_block_title_system_overview' AND `title`='_bx_analytics_page_block_title_overview';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_analytics_page' AND `module`='bx_analytics' AND `title_system`='_bx_analytics_page_block_title_system_top_pages' AND `title`='_bx_analytics_page_block_title_top_pages';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_analytics_page' AND `module`='bx_analytics' AND `title_system`='_bx_analytics_page_block_title_system_top_sources' AND `title`='_bx_analytics_page_block_title_top_sources';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_analytics_page' AND `module`='bx_analytics' AND `title_system`='_bx_analytics_page_block_title_system_top_locations' AND `title`='_bx_analytics_page_block_title_top_locations';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_analytics_page' AND `module`='bx_analytics' AND `title_system`='_bx_analytics_page_block_title_system_top_devices' AND `title`='_bx_analytics_page_block_title_top_devices';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_analytics_page' AND `module`='bx_analytics' AND `title_system`='_bx_analytics_page_block_title_system_top_platforms' AND `title`='_bx_analytics_page_block_title_top_platforms';
-- library blocks (object ''), copies the page builder places on other pages; only reports NEO has an element for
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='' AND `module`='bx_analytics' AND `title_system`='_bx_analytics_page_block_title_system_filters' AND `title`='_bx_analytics_page_block_title_filters';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='' AND `module`='bx_analytics' AND `title_system`='_bx_analytics_page_block_title_system_overview' AND `title`='_bx_analytics_page_block_title_overview';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='' AND `module`='bx_analytics' AND `title_system`='_bx_analytics_page_block_title_system_top_pages' AND `title`='_bx_analytics_page_block_title_top_pages';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='' AND `module`='bx_analytics' AND `title_system`='_bx_analytics_page_block_title_system_top_sources' AND `title`='_bx_analytics_page_block_title_top_sources';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='' AND `module`='bx_analytics' AND `title_system`='_bx_analytics_page_block_title_system_top_locations' AND `title`='_bx_analytics_page_block_title_top_locations';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='' AND `module`='bx_analytics' AND `title_system`='_bx_analytics_page_block_title_system_top_devices' AND `title`='_bx_analytics_page_block_title_top_devices';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='' AND `module`='bx_analytics' AND `title_system`='_bx_analytics_page_block_title_system_top_platforms' AND `title`='_bx_analytics_page_block_title_top_platforms';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='' AND `module`='bx_analytics' AND `title_system`='_bx_analytics_page_block_title_system_revenue' AND `title`='_bx_analytics_page_block_title_revenue';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='' AND `module`='bx_analytics' AND `title_system`='_bx_analytics_page_block_title_system_subscriptions' AND `title`='_bx_analytics_page_block_title_subscriptions';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='' AND `module`='bx_analytics' AND `title_system`='_bx_analytics_page_block_title_system_sales' AND `title`='_bx_analytics_page_block_title_sales';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='' AND `module`='bx_analytics' AND `title_system`='_bx_analytics_page_block_title_system_credits' AND `title`='_bx_analytics_page_block_title_credits';
-- the revenue page (account dashboard > Revenue); its blocks return nothing without "view analytics revenue"
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_analytics_revenue' AND `module`='bx_analytics';

-- MENUS:

-- MENUS: config_api

-- MENUS: active_api
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_account_dashboard' AND `module`='bx_analytics' AND `name`='dashboard-analytics';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_account_dashboard' AND `module`='bx_analytics' AND `name`='analytics-revenue';
