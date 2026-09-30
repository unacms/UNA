-- PAGES
UPDATE `sys_pages_blocks` SET `order`='2' WHERE `object`='bx_massmailer_view_campaign' AND `title`='_bx_massmailer_page_block_title_view_campaign_links';
UPDATE `sys_pages_blocks` SET `order`='3' WHERE `object`='bx_massmailer_view_campaign' AND `title`='_bx_massmailer_page_block_title_view_campaign_subscribers';


-- GRIDS
DELETE FROM `sys_objects_grid` WHERE `object`='bx_massmailer_letters';
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_massmailer_letters', 'Sql', 'SELECT * FROM `bx_massmailer_letters` WHERE 1 ', 'bx_massmailer_letters', 'id', 'date_sent', '', '', 20, NULL, 'start', '', 'email', '', 'like', 'email,date_sent,date_seen,date_click', '', 2147483647, 'BxMassMailerGridLetters', 'modules/boonex/massmailer/classes/BxMassMailerGridLetters.php');

DELETE FROM `sys_grid_fields` WHERE `object`='bx_massmailer_letters';
INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_massmailer_letters', 'email', '_bx_massmailer_txt_title_email', '55%', 0, '48', '', 1),
('bx_massmailer_letters', 'date_sent', '_bx_massmailer_txt_title_date_sent', '15%', 0, '0', '', 2),
('bx_massmailer_letters', 'date_seen', '_bx_massmailer_txt_title_date_seen', '15%', 0, '0', '', 3),
('bx_massmailer_letters', 'date_click', '_bx_massmailer_txt_title_date_click', '15%', 0, '0', '', 4);
