-- PAGES: config_api


-- PAGES: active_api
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_payment_join' AND `module`='bx_payment' AND `title_system`='' AND `title`='_bx_payment_page_block_title_join';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_payment_carts' AND `module`='bx_payment' AND `title_system`='' AND `title`='_bx_payment_page_block_title_carts';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_payment_cart' AND `module`='bx_payment' AND `title_system`='' AND `title`='_bx_payment_page_block_title_cart';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_payment_cart_thank_you' AND `module`='bx_payment' AND `title_system`='' AND `title`='_bx_payment_page_block_title_cart_thank_you';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_payment_history' AND `module`='bx_payment' AND `title_system`='' AND `title`='_bx_payment_page_block_title_history';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_payment_sbs_list_my' AND `module`='bx_payment' AND `title_system`='' AND `title`='_bx_payment_page_block_title_sbs_list_my';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_payment_sbs_list_all' AND `module`='bx_payment' AND `title_system`='' AND `title`='_bx_payment_page_block_title_sbs_list_all';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_payment_sbs_history' AND `module`='bx_payment' AND `title_system`='' AND `title`='_bx_payment_page_block_title_sbs_history';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_payment_orders' AND `module`='bx_payment' AND `title_system`='' AND `title`='_bx_payment_page_block_title_orders';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_payment_details' AND `module`='bx_payment' AND `title_system`='' AND `title`='_bx_payment_page_block_title_details';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_payment_invoices' AND `module`='bx_payment' AND `title_system`='' AND `title`='_bx_payment_page_block_title_invoices';
UPDATE `sys_pages_blocks` SET `active_api`=1 WHERE `object`='bx_payment_checkout_offline' AND `module`='bx_payment' AND `title_system`='_bx_payment_page_block_title_sys_checkout_offline' AND `title`='_bx_payment_page_block_title_checkout_offline';


-- MENUS:
UPDATE `sys_menu_items` SET `link`='page.php?i=payment-carts' WHERE `set_name`='sys_account_notifications' AND `module`='system' AND `name`='cart';
UPDATE `sys_menu_items` SET `link`='page.php?i=payment-orders' WHERE `set_name`='sys_account_notifications' AND `module`='system' AND `name`='orders';
UPDATE `sys_menu_items` SET `link`='page.php?i=payment-orders' WHERE `set_name`='sys_account_dashboard' AND `module`='system' AND `name`='dashboard-orders';

-- MENUS: config_api

-- MENUS: active_api
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_account_settings' AND `module`='bx_payment' AND `name`='payment-details';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_payment_menu_cart_submenu' AND `module`='bx_payment' AND `name`='cart';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_payment_menu_cart_submenu' AND `module`='bx_payment' AND `name`='cart-history';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_payment_menu_sbs_submenu' AND `module`='bx_payment' AND `name`='sbs-list-all';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_payment_menu_sbs_submenu' AND `module`='bx_payment' AND `name`='sbs-list-my';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_payment_menu_sbs_submenu' AND `module`='bx_payment' AND `name`='sbs-history';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_payment_menu_sbs_actions' AND `module`='bx_payment' AND `name`='sbs-request-cancelation';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_payment_menu_orders_submenu' AND `module`='bx_payment' AND `name`='orders-processed';
UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='bx_payment_menu_orders_submenu' AND `module`='bx_payment' AND `name`='orders-pending';
