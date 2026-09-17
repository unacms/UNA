-- PAGES: config_api

-- PAGES: active_api
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_massmailer_create_campaign' AND `module`='bx_massmailer' AND `title`='_bx_massmailer_page_block_title_create_campaign';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_massmailer_edit_campaign' AND `module`='bx_massmailer' AND `title`='_bx_massmailer_page_block_title_edit_campaign';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_massmailer_view_campaign' AND `module`='bx_massmailer' AND `title`='_bx_massmailer_page_block_title_view_campaign_info';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_massmailer_view_campaign' AND `module`='bx_massmailer' AND `title`='_bx_massmailer_page_block_title_view_campaign_subscribers';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_massmailer_view_campaign' AND `module`='bx_massmailer' AND `title`='_bx_massmailer_page_block_title_view_campaign_links';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_massmailer_campaigns' AND `module`='bx_massmailer' AND `title_system`='_bx_massmailer_page_block_title_system_manage_campaigns' AND `title`='_bx_massmailer_page_block_title_manage_campaigns';

-- MENUS:

-- MENUS: config_api

-- MENUS: active_api
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_account_dashboard' AND `module`='bx_massmailer' AND `name`='dashboard-massmailer';

