-- GRID: help tours
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`, `show_total_count`) VALUES
('bx_help_tours_tours', 'Sql', 'SELECT * FROM `bx_help_tours` WHERE 1', 'bx_help_tours', 'id', 'order', '', '', 100, NULL, 'start', '', '', '', 'auto', '', '', 2147483647, 'BxHelpToursGridTours', 'modules/boonex/help_tours/classes/BxHelpToursGridTours.php', 0);

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_help_tours_tours', 'checkbox', '', '2%', 0, 0, '', 1),
('bx_help_tours_tours', 'order', '', '1%', 0, 0, '', 2),
('bx_help_tours_tours', 'page', '_bx_help_tours_grid_col_page', '37%', 0, 0, '', 3),
('bx_help_tours_tours', 'items', '_bx_help_tours_grid_col_items', '30%', 0, 0, '', 4),
('bx_help_tours_tours', 'actions', '', '30%', 0, 0, '', 5);


INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('bx_help_tours_tours', 'single', 'preview', '_bx_help_tours_grid_action_preview', 'eye', 1, 0, 1),
('bx_help_tours_tours', 'single', 'edit', '_bx_help_tours_grid_action_edit', 'edit', 1, 0, 2),
('bx_help_tours_tours', 'single', 'edit_items', '_bx_help_tours_grid_action_edit_items', 'list', 1, 0, 3),
('bx_help_tours_tours', 'single', 'delete', '_bx_help_tours_grid_action_delete', 'remove', 1, 1, 4),
('bx_help_tours_tours', 'bulk', 'delete', '_bx_help_tours_grid_action_delete', 'remove', 0, 1, 1),
('bx_help_tours_tours', 'independent', 'add', '_bx_help_tours_grid_action_add', 'plus', 0, 0, 1);

-- GRID: help tour items
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`, `show_total_count`) VALUES
('bx_help_tours_items', 'Sql', 'SELECT * FROM `bx_help_tours_items` WHERE 1', 'bx_help_tours_items', 'id', 'order', '', '', 100, NULL, 'start', '', 'element', 'title,text', 'auto', '', '', 2147483647, 'BxHelpToursGridItems', 'modules/boonex/help_tours/classes/BxHelpToursGridItems.php', 0);

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_help_tours_items', 'checkbox', '', '2%', 0, 0, '', 1),
('bx_help_tours_items', 'order', '', '1%', 0, 0, '', 2),
('bx_help_tours_items', 'name', '_bx_help_tours_grid_col_name', '32%', 0, 0, '', 3),
('bx_help_tours_items', 'element', '_bx_help_tours_grid_col_element', '18%', 0, 0, '', 4),
('bx_help_tours_items', 'title', '_bx_help_tours_grid_col_title', '32%', 1, 0, '', 5),
('bx_help_tours_items', 'actions', '', '15%', 0, 0, '', 6);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('bx_help_tours_items', 'single', 'preview', '_bx_help_tours_grid_action_preview_item', 'eye', 1, 0, 1),
('bx_help_tours_items', 'single', 'edit', '_bx_help_tours_grid_action_edit_item', 'edit', 1, 0, 2),
('bx_help_tours_items', 'single', 'delete', '_bx_help_tours_grid_action_delete_item', 'remove', 1, 1, 3),
('bx_help_tours_items', 'bulk', 'delete', '_bx_help_tours_grid_action_delete_item', 'remove', 0, 1, 1),
('bx_help_tours_items', 'independent', 'add', '_bx_help_tours_grid_action_add_item', 'plus', 0, 0, 1);
