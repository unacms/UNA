
-- SETTINGS
SET @iTypeOrder = (SELECT MAX(`order`) FROM `sys_options_types` WHERE `group` = 'modules');
INSERT INTO `sys_options_types`(`group`, `name`, `caption`, `icon`, `order`) VALUES 
('modules', 'bx_feedback', '_bx_feedback', 'bx_feedback@modules/boonex/feedback/|std-icon.svg', IF(ISNULL(@iTypeOrder), 1, @iTypeOrder + 1));
SET @iTypeId = LAST_INSERT_ID();

INSERT INTO `sys_options_categories` (`type_id`, `name`, `caption`, `order`)
VALUES (@iTypeId, 'bx_feedback', '_bx_feedback', 1);
SET @iCategId = LAST_INSERT_ID();

INSERT INTO `sys_options` (`name`, `value`, `category_id`, `caption`, `type`, `check`, `check_error`, `extra`, `order`) VALUES
('bx_feedback_enable_questions', 'on', @iCategId, '_bx_feedback_option_enable_questions', 'checkbox', '', '', '', 1),
('bx_feedback_question_lifetime', '', @iCategId, '_bx_feedback_option_question_lifetime', 'digit', '', '', '', 2),

('bx_feedback_enable_answer_ntf_important_only', 'on', @iCategId, '_bx_feedback_option_answer_ntf_important_only', 'checkbox', '', '', '', 10);


-- PAGE: add block on homepage
SET @iPBCellHomepage = 2;
SET @iPBOrderHomepage = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_pages_blocks` WHERE `object`='sys_home' AND `cell_id`=@iPBCellHomepage ORDER BY `order` DESC LIMIT 1);
INSERT INTO `sys_pages_blocks`(`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES 
('sys_home', @iPBCellHomepage, 'bx_feedback', '_bx_feedback_page_block_title_question', 13, 2147483647, 'service', 'a:2:{s:6:"module";s:11:"bx_feedback";s:6:"method";s:18:"get_block_question";}', 0, 1, 1, @iPBOrderHomepage + 1);

-- PAGES: add block on dashboard
SET @iPBCellDashboard = 3;
SET @iPBOrderDashboard = (SELECT IFNULL(MAX(`order`), 0) FROM `sys_pages_blocks` WHERE `object` = 'sys_dashboard' AND `cell_id` = @iPBCellDashboard LIMIT 1);
INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `order`) VALUES
('sys_dashboard', @iPBCellDashboard, 'bx_feedback', '_bx_feedback_page_block_title_question', 13, 2147483644, 'service', 'a:2:{s:6:"module";s:11:"bx_feedback";s:6:"method";s:18:"get_block_question";}', 0, 0, 1, @iPBOrderDashboard + 1);


-- GRIDS: questions
INSERT INTO `sys_objects_grid` (`object`, `source_type`, `source`, `table`, `field_id`, `field_order`, `field_active`, `paginate_url`, `paginate_per_page`, `paginate_simple`, `paginate_get_start`, `paginate_get_per_page`, `filter_fields`, `filter_fields_translatable`, `filter_mode`, `sorting_fields`, `sorting_fields_translatable`, `visible_for_levels`, `override_class_name`, `override_class_file`) VALUES
('bx_feedback_questions', 'Sql', 'SELECT * FROM `bx_fdb_questions` WHERE 1 ', 'bx_fdb_questions', 'id', 'added', 'status_admin', '', 100, NULL, 'start', '', 'text', '', 'like', '', '', 192, 'BxFdbGridQuestions', 'modules/boonex/feedback/classes/BxFdbGridQuestions.php');

INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES
('bx_feedback_questions', 'checkbox', '_sys_select', '2%', 0, '', '', 1),
('bx_feedback_questions', 'switcher', '_bx_feedback_grid_question_column_switcher', '5%', 0, '', '', 2),
('bx_feedback_questions', 'text', '_bx_feedback_grid_question_column_text', '63%', 1, 32, '', 3),
('bx_feedback_questions', 'added', '_bx_feedback_grid_question_column_title_added', '10%', 0, 16, '', 4),
('bx_feedback_questions', 'actions', '', '20%', 0, '', '', 5);

INSERT INTO `sys_grid_actions` (`object`, `type`, `name`, `title`, `icon`, `icon_only`, `confirm`, `order`) VALUES
('bx_feedback_questions', 'independent', 'add', '_bx_feedback_grid_question_action_title_add', '', 0, 0, 1),
('bx_feedback_questions', 'single', 'edit', '_bx_feedback_grid_question_action_title_edit', 'pencil-alt', 1, 0, 1),
('bx_feedback_questions', 'single', 'delete', '_bx_feedback_grid_question_action_title_delete', 'remove', 1, 1, 2),
('bx_feedback_questions', 'bulk', 'delete', '_bx_feedback_grid_question_action_title_delete', '', 0, 1, 1);
