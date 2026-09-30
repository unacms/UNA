-- SETTINGS
SET @iCategId = (SELECT `id` FROM `sys_options_categories` WHERE `name` = 'bx_market' LIMIT 1);

DELETE FROM `sys_options` WHERE `name` = 'bx_market_visible_categories';
INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `check`, `check_error`, `extra`, `order`) VALUES
('bx_market_visible_categories', '10', @iCategId, '_bx_market_option_visible_categories', 'digit', '', '', '', 50);


-- PAGES
UPDATE `sys_pages_blocks` SET `active`='0', `order`='1' WHERE `object`='bx_market_home' AND `title`='_bx_market_page_block_title_cats' AND `type`='service';

DELETE FROM `sys_pages_blocks` WHERE `object`='bx_market_home' AND `title`='_bx_market_page_block_title_cats' AND `type`='menu';
INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('bx_market_home', 1, 'bx_market', '', '_bx_market_page_block_title_cats', 11, 2147483647, 'menu', 'bx_market_categories', 0, 0, 1, 0);


-- MENUS
DELETE FROM `sys_objects_menu` WHERE `object`='bx_market_categories';
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_market_categories', '_bx_market_menu_title_categories', '', 'bx_market', 21, 0, 1, 'BxMarketMenuCategories', 'modules/boonex/market/classes/BxMarketMenuCategories.php');
