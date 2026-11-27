-- TABLE: entries
CREATE TABLE IF NOT EXISTS `bx_fdb_questions` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `author` int(11) unsigned NOT NULL,
  `added` int(11) NOT NULL default '0',
  `changed` int(11) NOT NULL default '0',
  `text` text NOT NULL,
  `lifetime` int(11) NOT NULL default '0',
  `allow_view_to` varchar(16) NOT NULL DEFAULT '3',
  `status_admin` enum('active','hidden') NOT NULL DEFAULT 'active',
  PRIMARY KEY (`id`),
  FULLTEXT KEY `search_fields` (`text`)
);

CREATE TABLE IF NOT EXISTS `bx_fdb_answers` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `question_id` int(11) unsigned NOT NULL default '0',
  `title` varchar(255) NOT NULL,
  `important` tinyint(4) NOT NULL default '0',
  `data` text NOT NULL default '',
  `votes` int(11) NOT NULL default '0',
  `order` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  FULLTEXT KEY `title` (`title`)
);

CREATE TABLE IF NOT EXISTS `bx_fdb_answers2users` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `answer_id` int(11) unsigned NOT NULL default '0',
  `profile_id` int(11) unsigned NOT NULL default '0',
  `text` varchar(255) NOT NULL default '',
  `added` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `answer` (`answer_id`, `profile_id`)
);


-- FORMS
INSERT INTO `sys_objects_form`(`object`, `module`, `title`, `action`, `form_attrs`, `table`, `key`, `uri`, `uri_title`, `submit_name`, `params`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_feedback_question', 'bx_feedback', '_bx_feedback_form_question', '', 'a:1:{s:7:"enctype";s:19:"multipart/form-data";}', 'bx_fdb_questions', 'id', '', '', 'a:1:{i:0;s:9:"do_submit";}', 'a:2:{s:7:"checker";s:24:"BxFdbFormQuestionChecker";s:14:"checker_helper";s:30:"BxFdbFormQuestionCheckerHelper";}', 0, 1, 'BxFdbFormQuestion', 'modules/boonex/feedback/classes/BxFdbFormQuestion.php');

INSERT INTO `sys_form_displays`(`object`, `display_name`, `module`, `view_mode`, `title`) VALUES 
('bx_feedback_question', 'bx_feedback_question_add', 'bx_feedback', 0, '_bx_feedback_form_question_display_add'),
('bx_feedback_question', 'bx_feedback_question_delete', 'bx_feedback', 0, '_bx_feedback_form_question_display_delete'),
('bx_feedback_question', 'bx_feedback_question_edit', 'bx_feedback', 0, '_bx_feedback_form_question_display_edit'),
('bx_feedback_question', 'bx_feedback_question_view', 'bx_feedback', 1, '_bx_feedback_form_question_display_view');

INSERT INTO `sys_form_inputs`(`object`, `module`, `name`, `value`, `values`, `checked`, `type`, `caption_system`, `caption`, `info`, `required`, `collapsed`, `html`, `attrs`, `attrs_tr`, `attrs_wrapper`, `checker_func`, `checker_params`, `checker_error`, `db_pass`, `db_params`, `editable`, `deletable`) VALUES 
('bx_feedback_question', 'bx_feedback', 'text', '', '', 0, 'textarea_translatable', '_bx_feedback_form_question_input_sys_text', '_bx_feedback_form_question_input_text', '', 1, 0, 0, '', '', '', 'AvailTranslatable', 'a:1:{i:0;s:4:"text";}', '_bx_feedback_form_question_input_text_err', 'Xss', '', 1, 0),
('bx_feedback_question', 'bx_feedback', 'answers', '', '', 0, 'list_translatable', '_bx_feedback_form_question_input_sys_answers', '_bx_feedback_form_question_input_answers', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_feedback_question', 'bx_feedback', 'lifetime', '', '', 0, 'text', '_bx_feedback_form_question_input_sys_lifetime', '_bx_feedback_form_question_input_lifetime', '_bx_feedback_form_question_input_lifetime_inf', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 1, 0),
('bx_feedback_question', 'bx_feedback', 'allow_view_to', '', '', 0, 'custom', '_bx_feedback_form_question_input_sys_allow_view_to', '_bx_feedback_form_question_input_allow_view_to', '', 1, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_feedback_question', 'bx_feedback', 'delete_confirm', 1, '', 0, 'checkbox', '_bx_feedback_form_question_input_sys_delete_confirm', '_bx_feedback_form_question_input_delete_confirm', '_bx_feedback_form_question_input_delete_confirm_info', 1, 0, 0, '', '', '', 'Avail', '', '_bx_feedback_form_question_input_delete_confirm_error', '', '', 1, 0),
('bx_feedback_question', 'bx_feedback', 'controls', '', 'do_submit,do_cancel', 0, 'input_set', '', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_feedback_question', 'bx_feedback', 'do_submit', '_bx_feedback_form_question_input_do_submit', '', 0, 'submit', '_bx_feedback_form_question_input_sys_do_submit', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_feedback_question', 'bx_feedback', 'do_cancel', '_bx_feedback_form_question_input_do_cancel', '', 0, 'button', '_bx_feedback_form_question_input_sys_do_cancel', '', '', 0, 0, 0, 'a:2:{s:7:"onclick";s:45:"$(''.bx-popup-applied:visible'').dolPopupHide()";s:5:"class";s:22:"bx-def-margin-sec-left";}', '', '', '', '', '', '', '', 1, 0),
('bx_feedback_question', 'bx_feedback', 'added', '', '', 0, 'datetime', '_bx_feedback_form_question_input_sys_date_added', '_bx_feedback_form_question_input_date_added', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_feedback_question', 'bx_feedback', 'changed', '', '', 0, 'datetime', '_bx_feedback_form_question_input_sys_date_changed', '_bx_feedback_form_question_input_date_changed', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0);


INSERT INTO `sys_form_display_inputs`(`display_name`, `input_name`, `visible_for_levels`, `active`, `order`) VALUES 
('bx_feedback_question_add', 'text', 2147483647, 1, 1),
('bx_feedback_question_add', 'answers', 2147483647, 1, 2),
('bx_feedback_question_add', 'lifetime', 2147483647, 1, 3),
('bx_feedback_question_add', 'allow_view_to', 2147483647, 0, 4),
('bx_feedback_question_add', 'controls', 2147483647, 1, 5),
('bx_feedback_question_add', 'do_submit', 2147483647, 1, 6),
('bx_feedback_question_add', 'do_cancel', 2147483647, 1, 7),

('bx_feedback_question_delete', 'delete_confirm', 2147483647, 1, 1),
('bx_feedback_question_delete', 'do_submit', 2147483647, 1, 2),

('bx_feedback_question_edit', 'text', 2147483647, 1, 1),
('bx_feedback_question_edit', 'answers', 2147483647, 1, 2),
('bx_feedback_question_edit', 'lifetime', 2147483647, 1, 3),
('bx_feedback_question_edit', 'allow_view_to', 2147483647, 0, 4),
('bx_feedback_question_edit', 'controls', 2147483647, 1, 5),
('bx_feedback_question_edit', 'do_submit', 2147483647, 1, 6),
('bx_feedback_question_edit', 'do_cancel', 2147483647, 1, 7),

('bx_feedback_question_view', 'added', 2147483647, 1, 1),
('bx_feedback_question_view', 'changed', 2147483647, 1, 2);


-- STUDIO: page & widget
INSERT INTO `sys_std_pages`(`index`, `name`, `header`, `caption`, `icon`) VALUES
(3, 'bx_feedback', '_bx_feedback', '_bx_feedback', 'bx_feedback@modules/boonex/feedback/|std-icon.svg');
SET @iPageId = LAST_INSERT_ID();

SET @iParentPageId = (SELECT `id` FROM `sys_std_pages` WHERE `name` = 'home');
SET @iParentPageOrder = (SELECT MAX(`order`) FROM `sys_std_pages_widgets` WHERE `page_id` = @iParentPageId);
INSERT INTO `sys_std_widgets` (`page_id`, `module`, `type`, `url`, `click`, `icon`, `caption`, `cnt_notices`, `cnt_actions`) VALUES
(@iPageId, 'bx_feedback', 'content', '{url_studio}module.php?name=bx_feedback', '', 'bx_feedback@modules/boonex/feedback/|std-icon.svg', '_bx_feedback', '', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_actions";s:6:"params";a:0:{}s:5:"class";s:18:"TemplStudioModules";}');
INSERT INTO `sys_std_pages_widgets` (`page_id`, `widget_id`, `order`) VALUES
(@iParentPageId, LAST_INSERT_ID(), IF(ISNULL(@iParentPageOrder), 1, @iParentPageOrder + 1));
