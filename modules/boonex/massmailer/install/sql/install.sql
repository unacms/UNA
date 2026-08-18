SET @sName = 'bx_massmailer';

-- TABLES
CREATE TABLE `bx_massmailer_campaigns` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) DEFAULT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `from_name` varchar(255) DEFAULT NULL,
  `reply_to` varchar(255) DEFAULT NULL,
  `body` text DEFAULT NULL,
  `segments` varchar(255) DEFAULT NULL,
  `author` int(11) NOT NULL,
  `added` int(11) NOT NULL default '0',
  `changed` int(11) NOT NULL default '0',
  `date_sent` int(11) NOT NULL default '0',
  `email_list` text DEFAULT NULL,
  `is_one_per_account` smallint(1) NOT NULL,
  `is_track_links` smallint(1) NOT NULL,  
  PRIMARY KEY (`id`),
  FULLTEXT KEY `title_text` (`title`, `subject`)
);

CREATE TABLE `bx_massmailer_segments` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) DEFAULT NULL,
  `info` text DEFAULT NULL,
  `email_list` text DEFAULT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE `bx_massmailer_letters` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `campaign_id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `date_sent` int(11) NOT NULL default '0',
  `date_seen` int(11) NOT NULL default '0',
  `date_click` int(11) NOT NULL default '0',
  `hash` varchar(35) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `campaign_id` (`campaign_id`),
  INDEX `hash` (`hash`)
);

CREATE TABLE `bx_massmailer_links` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `letter_hash` varchar(35) DEFAULT NULL,
  `hash` varchar(35) DEFAULT NULL,
  `link` varchar(255) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `campaign_id` int(11) DEFAULT NULL,
  `date_click` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  INDEX `campaign_id` (`campaign_id`),
  INDEX `hash` (`hash`),
  INDEX `letter_hash` (`letter_hash`)
);

CREATE TABLE `bx_massmailer_unsubscribe` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `account_id` int(11) DEFAULT NULL,
  `campaign_id` int(11) DEFAULT NULL,
  `unsubscribed` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  INDEX `campaign_id` (`campaign_id`)
);

-- STUDIO: page & widget
INSERT INTO `sys_std_pages`(`index`, `name`, `header`, `caption`, `icon`) VALUES
(3, @sName, '_bx_massmailer', '_bx_massmailer', 'bx_massmailer@modules/boonex/massmailer/|std-icon.svg');

SET @iPageId = LAST_INSERT_ID();

INSERT INTO `sys_std_widgets` (`page_id`, `module`, `type`, `url`, `click`, `icon`, `caption`, `cnt_notices`, `cnt_actions`, `featured`) 
VALUES(@iPageId, @sName, 'extensions', '{url_studio}module.php?name=bx_massmailer', '', 'bx_massmailer@modules/boonex/massmailer/|std-icon.svg', '_bx_massmailer', '', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_actions";s:6:"params";a:0:{}s:5:"class";s:18:"TemplStudioModules";}', 0);

SET @iParentPageId = (SELECT `id` FROM `sys_std_pages` WHERE `name` = 'home');
SET @iParentPageOrder = (SELECT IFNULL(MAX(`order`), 0) + 1 FROM `sys_std_pages_widgets` WHERE `page_id` = @iParentPageId);

INSERT INTO `sys_std_pages_widgets` (`page_id`, `widget_id`, `order`) VALUES
(@iParentPageId, LAST_INSERT_ID(), @iParentPageOrder);

-- FORMS
INSERT INTO `sys_objects_form` (`object`, `module`, `title`, `action`, `form_attrs`, `submit_name`, `table`, `key`, `uri`, `uri_title`, `params`, `deletable`, `active`, `override_class_name`, `override_class_file`) 
VALUES(@sName, @sName, '_bx_massmailer_form_campaign', '', 'a:1:{s:7:"enctype";s:19:"multipart/form-data";}', 'a:2:{i:0;s:9:"do_submit";i:1;s:7:"do_send";}', 'bx_massmailer_campaigns', 'id', '', '', 'a:1:{s:14:"checker_helper";s:29:"BxMassMailerFormCheckerHelper";}', 0, 1, 'BxMassMailerFormEntry', 'modules/boonex/massmailer/classes/BxMassMailerFormEntry.php');

INSERT INTO `sys_form_displays` (`display_name`, `module`, `object`, `title`, `view_mode`) VALUES
('bx_massmailer_campaign_add', @sName, @sName, '_bx_massmailer_form_campaign_add_display', 0),
('bx_massmailer_campaign_edit', @sName, @sName, '_bx_massmailer_form_campaign_edit_display', 0),
('bx_massmailer_campaign_send_test', @sName, @sName, '_bx_massmailer_form_campaign_send_test_display', 0),
('bx_massmailer_campaign_send_all', @sName, @sName, '_bx_massmailer_form_campaign_send_all_display', 0);

INSERT INTO `sys_form_inputs` (`object`, `module`, `name`, `value`, `values`, `checked`, `type`, `caption_system`, `caption`, `info`, `required`, `unique`, `collapsed`, `html`, `attrs`, `attrs_tr`, `attrs_wrapper`, `checker_func`, `checker_params`, `checker_error`, `db_pass`, `db_params`, `editable`, `deletable`) VALUES
(@sName, @sName, 'do_submit', '_bx_massmailer_form_entry_input_do_submit', '', 0, 'submit', '_bx_massmailer_form_entry_input_sys_do_submit', '', '', 0, 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
(@sName, @sName, 'do_send', '_bx_massmailer_form_entry_input_do_send', '', 0, 'submit', '_bx_massmailer_form_entry_input_sys_do_send', '', '', 0, 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
(@sName, @sName, 'title', '', '', 0, 'text', '_bx_massmailer_form_campaign_input_sys_title', '_bx_massmailer_form_campaign_input_title', '', 1, 0, 0, 2, '', '', '', 'Avail', '', '_bx_massmailer_form_campaign_input_title_err', 'XssHtml', '', 1, 0),
(@sName, @sName, 'segments', '', '', 0, 'select', '_bx_massmailer_form_campaign_input_sys_segments', '_bx_massmailer_form_campaign_input_segments', '', 1, 0, 0, 2, '', '', '', 'Avail', '', '_bx_massmailer_form_campaign_input_segments_err', 'XssHtml', '', 1, 0),
(@sName, @sName, 'subject', '', '', 0, 'text', '_bx_massmailer_form_campaign_input_sys_subject', '_bx_massmailer_form_campaign_input_subject', '', 1, 0, 0, 2, '', '', '', 'Avail', '', '_bx_massmailer_form_campaign_input_subject_err', 'XssHtml', '', 1, 0),
(@sName, @sName, 'from_name', '', '', 0, 'text', '_bx_massmailer_form_campaign_input_sys_from_name', '_bx_massmailer_form_campaign_input_from_name', '_bx_massmailer_form_campaign_input_from_name_info', 0, 0, 0, 2, '', '', '', '', '', '', 'XssHtml', '', 1, 0),
(@sName, @sName, 'reply_to', '', '', 0, 'text', '_bx_massmailer_form_campaign_input_sys_reply_to', '_bx_massmailer_form_campaign_input_reply_to', '_bx_massmailer_form_campaign_input_reply_to_info', 0, 0, 0, 2, '', '', '', 'EmailOrEmpty', '', '_bx_massmailer_form_campaign_input_reply_to_err', 'XssHtml', '', 1, 0),
(@sName, @sName, 'body', '', '', 0, 'textarea', '_bx_massmailer_form_campaign_input_sys_body', '_bx_massmailer_form_campaign_input_body', '', 1, 0, 0, 2, '', '', '', 'UnsubscribeUrl', '', '_bx_massmailer_form_campaign_input_body_err', 'XssHtml', '', 1, 0),
(@sName, @sName, 'body_info', '', '', 0, 'custom', '_bx_massmailer_form_campaign_input_sys_body_info', '_bx_massmailer_form_campaign_input_body_info', '', 0, 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
(@sName, @sName, 'is_one_per_account', '1', '', 1, 'switcher', '_bx_massmailer_form_campaign_input_sys_is_one_per_account', '_bx_massmailer_form_campaign_input_is_one_per_account', '', 0, 0, 0, 0, '', '', '', '', '', '', 'Int', '', 1, 0),
(@sName, @sName, 'is_track_links', '1', '', 1, 'switcher', '_bx_massmailer_form_campaign_input_sys_is_track_links', '_bx_massmailer_form_campaign_input_is_track_links', '', 0, 0, 0, 0, '', '', '', '', '', '', 'Int', '', 1, 0),
(@sName, @sName, 'email', '', '', 0, 'text', '_bx_massmailer_form_campaign_input_sys_test_email', '_bx_massmailer_form_campaign_input_email', '', 1, 0, 0, 2, '', '', '', 'Email', '', '_sys_form_account_input_email_error', 'XssHtml', '', 1, 0),
(@sName, @sName, 'campaign_info', '_bx_massmailer_form_campaign_input_from_name_info_value', '', 0, 'value', '_bx_massmailer_form_campaign_input_sys_campaign_info', '_bx_massmailer_form_campaign_input_campaign_info', '', 0, 0, 0, 2, '', '', '', '', '', '', 'XssHtml', '', 1, 0),
(@sName, @sName, 'cancel', '_bx_massmailer_form_entry_input_cancel', '', 0, 'button', '_bx_dev_bp_btn_sys_block_cancel', '', '', 0, 0, 0, 0, 'a:2:{s:7:"onclick";s:45:"$(''.bx-popup-applied:visible'').dolPopupHide()";s:5:"class";s:22:"bx-def-margin-sec-left";}', '', '', 'Avail', '', '', '', '', 0, 0),
(@sName, @sName, 'controls', '', 'do_send,cancel', 0, 'input_set', '', '', '', 0, 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0);

INSERT INTO `sys_form_display_inputs` (`display_name`, `input_name`, `visible_for_levels`, `active`, `order`) VALUES
('bx_massmailer_campaign_add', 'title', 2147483647, 1, 1),
('bx_massmailer_campaign_add', 'segments', 2147483647, 1, 2),
('bx_massmailer_campaign_add', 'subject', 2147483647, 1, 3),
('bx_massmailer_campaign_add', 'from_name', 2147483647, 1, 4),
('bx_massmailer_campaign_add', 'reply_to', 2147483647, 1, 5),
('bx_massmailer_campaign_add', 'body', 2147483647, 1, 6),
('bx_massmailer_campaign_add', 'body_info', 2147483647, 1, 7),
('bx_massmailer_campaign_add', 'is_one_per_account', 2147483647, 1, 8),
('bx_massmailer_campaign_add', 'is_track_links', 2147483647, 1, 9),
('bx_massmailer_campaign_add', 'do_submit', 2147483647, 1, 10),

('bx_massmailer_campaign_edit', 'title', 2147483647, 1, 1),
('bx_massmailer_campaign_edit', 'segments', 2147483647, 1, 2),
('bx_massmailer_campaign_edit', 'subject', 2147483647, 1, 3),
('bx_massmailer_campaign_edit', 'from_name', 2147483647, 1, 4),
('bx_massmailer_campaign_edit', 'reply_to', 2147483647, 1, 5),
('bx_massmailer_campaign_edit', 'body', 2147483647, 1, 6),
('bx_massmailer_campaign_edit', 'body_info', 2147483647, 1, 7),
('bx_massmailer_campaign_edit', 'is_one_per_account', 2147483647, 1, 8),
('bx_massmailer_campaign_edit', 'is_track_links', 2147483647, 1, 9),
('bx_massmailer_campaign_edit', 'do_submit', 2147483647, 1, 10),

('bx_massmailer_campaign_send_test', 'email', 2147483647, 1, 1),
('bx_massmailer_campaign_send_test', 'controls', 2147483647, 1, 2),
('bx_massmailer_campaign_send_test', 'do_send', 2147483647, 1, 3),
('bx_massmailer_campaign_send_test', 'cancel', 2147483647, 1, 4),

('bx_massmailer_campaign_send_all', 'campaign_info', 2147483647, 1, 1),
('bx_massmailer_campaign_send_all', 'controls', 2147483647, 1, 2),
('bx_massmailer_campaign_send_all', 'do_send', 2147483647, 1, 3),
('bx_massmailer_campaign_send_all', 'cancel', 2147483647, 1, 4);
