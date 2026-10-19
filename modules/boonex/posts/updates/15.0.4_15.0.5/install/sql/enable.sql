-- SETTINGS
SET @iCategId = (SELECT `id` FROM `sys_options_categories` WHERE `name`='bx_posts' LIMIT 1);

DELETE FROM `sys_options` WHERE `name`='bx_posts_visible_categories';
INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `check`, `check_error`, `extra`, `order`) VALUES
('bx_posts_visible_categories', '10', @iCategId, '_bx_posts_option_visible_categories', 'digit', '', '', '', 40);

-- PAGES & BLOCKS
UPDATE `sys_pages_blocks` SET `active`='0', `order`='3' WHERE `object`='bx_posts_home' AND `module`='bx_posts' AND `title`='_bx_posts_page_block_title_cats' AND `type`='service';

DELETE FROM `sys_pages_blocks` WHERE `object`='bx_posts_home' AND `module`='bx_posts' AND `title`='_bx_posts_page_block_title_cats' AND `type`='menu';
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES
('bx_posts_home', 2, 'bx_posts', '', '_bx_posts_page_block_title_cats', 11, 2147483647, 'menu', 'bx_posts_categories', 0, 1, 1, 1);

-- MENUS
DELETE FROM `sys_objects_menu` WHERE `object`='bx_posts_categories';
INSERT INTO `sys_objects_menu`(`object`, `title`, `set_name`, `module`, `template_id`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES
('bx_posts_categories', '_bx_posts_menu_title_categories', '', 'bx_posts', 21, 0, 1, 'BxPostsMenuCategories', 'modules/boonex/posts/classes/BxPostsMenuCategories.php');
