
CREATE TABLE `bx_drupal_accounts` (
  `local_profile` int(10) unsigned NOT NULL,
  `remote_profile` varchar(16) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  PRIMARY KEY (`local_profile`),
  KEY `remote_profile` (`remote_profile`)
) ENGINE=MyISAM;

-- Forms

INSERT INTO `sys_objects_form` (`object`, `module`, `title`, `action`, `form_attrs`, `submit_name`, `table`, `key`, `uri`, `uri_title`, `params`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES
('bx_drupal_login', 'bx_drupal', '_bx_drupal_form_login', 'modules/?r=drupal/login_submit', 'a:3:{s:2:"id";s:14:"sys-form-login";s:6:"action";s:30:"modules/?r=drupal/login_submit";s:8:"onsubmit";s:31:"return validateLoginForm(this);";}', 'a:3:{i:0;s:4:"role";i:1;s:10:"do_sendsms";i:2;s:12:"do_checkcode";}', '', '', '', '', 'a:1:{s:14:"checker_helper";s:24:"BxFormLoginCheckerHelper";}', 0, 1, 'BxDrupalFormLogin', 'modules/boonex/drupal_connect/classes/BxDrupalFormLogin.php');

INSERT INTO `sys_form_displays` (`display_name`, `module`, `object`, `title`, `view_mode`) VALUES
('bx_drupal_login', 'bx_drupal', 'bx_drupal_login', '_bx_drupal_display_login', 0);

INSERT INTO `sys_form_inputs` (`object`, `module`, `name`, `value`, `values`, `checked`, `type`, `caption_system`, `caption`, `info`, `required`, `collapsed`, `html`, `attrs`, `attrs_tr`, `attrs_wrapper`, `checker_func`, `checker_params`, `checker_error`, `db_pass`, `db_params`, `editable`, `deletable`) VALUES
('bx_drupal_login', 'bx_drupal', 'role', '1', '', 0, 'hidden', '_sys_form_login_input_caption_system_role', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_drupal_login', 'bx_drupal', 'relocate', '', '', 0, 'hidden', '_sys_form_login_input_caption_system_relocate', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_drupal_login', 'bx_drupal', 'ID', '', '', 0, 'text', '_sys_form_login_input_caption_system_id', '_sys_form_login_input_email', '', 1, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_drupal_login', 'bx_drupal', 'Password', '', '', 0, 'password', '_sys_form_login_input_caption_system_password', '_sys_form_login_input_password', '', 1, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_drupal_login', 'bx_drupal', 'rememberMe', '1', '', 0, 'switcher', '_sys_form_login_input_caption_system_remember_me', '_sys_form_login_input_remember_me', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_drupal_login', 'bx_drupal', 'login', '_sys_form_login_input_submit', '', 0, 'submit', '_sys_form_login_input_caption_system_submit', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_drupal_login', 'bx_drupal', 'submit_text', '', '', 0, 'custom', '_sys_form_login_input_caption_system_submit_text', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0);

INSERT INTO `sys_form_display_inputs` (`display_name`, `input_name`, `visible_for_levels`, `active`, `order`) VALUES
('bx_drupal_login', 'role', 2147483647, 1, 1),
('bx_drupal_login', 'relocate', 2147483647, 1, 2),
('bx_drupal_login', 'ID', 2147483647, 1, 3),
('bx_drupal_login', 'Password', 2147483647, 1, 4),
('bx_drupal_login', 'rememberMe', 2147483647, 1, 5),
('bx_drupal_login', 'login', 2147483647, 1, 6);

-- Studio page and widget

INSERT INTO `sys_std_pages`(`index`, `name`, `header`, `caption`, `icon`) VALUES
(3, 'bx_drupal', '_bx_drupal', '_bx_drupal', 'bx_drupal@modules/boonex/drupal_connect/|std-icon.svg');
SET @iPageId = LAST_INSERT_ID();

SET @iParentPageId = (SELECT `id` FROM `sys_std_pages` WHERE `name` = 'home');
SET @iParentPageOrder = (SELECT MAX(`order`) FROM `sys_std_pages_widgets` WHERE `page_id` = @iParentPageId);
INSERT INTO `sys_std_widgets` (`page_id`, `module`, `type`, `url`, `click`, `icon`, `caption`, `cnt_notices`, `cnt_actions`) VALUES
(@iPageId, 'bx_drupal', 'integrations', '{url_studio}module.php?name=bx_drupal', '', 'bx_drupal@modules/boonex/drupal_connect/|std-icon.svg', '_bx_drupal', '', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_actions";s:6:"params";a:0:{}s:5:"class";s:18:"TemplStudioModules";}');
INSERT INTO `sys_std_pages_widgets` (`page_id`, `widget_id`, `order`) VALUES
(@iParentPageId, LAST_INSERT_ID(), IF(ISNULL(@iParentPageOrder), 1, @iParentPageOrder + 1));

