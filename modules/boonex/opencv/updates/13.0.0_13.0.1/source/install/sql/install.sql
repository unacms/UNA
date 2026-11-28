
-- Forms 

INSERT INTO `sys_form_inputs`(`object`, `module`, `name`, `value`, `values`, `checked`, `type`, `caption_system`, `caption`, `info`, `required`, `collapsed`, `html`, `attrs`, `attrs_tr`, `attrs_wrapper`, `checker_func`, `checker_params`, `checker_error`, `db_pass`, `db_params`, `editable`, `deletable`, `rateable`) VALUES 
('bx_person', 'bx_opencv', 'obfuscate_faces', '1', '', 0, 'switcher', '', '_bx_opencv_form_profile_input_obfuscate_faces', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 1, 0, '');

INSERT INTO `sys_form_inputs`(`object`, `module`, `name`, `value`, `values`, `checked`, `type`, `caption_system`, `caption`, `info`, `required`, `collapsed`, `html`, `attrs`, `attrs_tr`, `attrs_wrapper`, `checker_func`, `checker_params`, `checker_error`, `db_pass`, `db_params`, `editable`, `deletable`) VALUES 
('bx_organization', 'bx_opencv', 'obfuscate_faces', '1', '', 0, 'switcher', '', '_bx_opencv_form_profile_input_obfuscate_faces', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 1, 0);

-- Studio page and widget

INSERT INTO `sys_std_pages`(`index`, `name`, `header`, `caption`, `icon`) VALUES
(3, 'bx_opencv', '_bx_opencv', '_bx_opencv', 'bx_opencv@modules/boonex/opencv/|std-icon.svg');
SET @iPageId = LAST_INSERT_ID();

SET @iParentPageId = (SELECT `id` FROM `sys_std_pages` WHERE `name` = 'home');
SET @iParentPageOrder = (SELECT MAX(`order`) FROM `sys_std_pages_widgets` WHERE `page_id` = @iParentPageId);
INSERT INTO `sys_std_widgets` (`page_id`, `module`, `type`, `url`, `click`, `icon`, `caption`, `cnt_notices`, `cnt_actions`) VALUES
(@iPageId, 'bx_opencv', 'integrations', '{url_studio}module.php?name=bx_opencv', '', 'bx_opencv@modules/boonex/opencv/|std-icon.svg', '_bx_opencv', '', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_actions";s:6:"params";a:0:{}s:5:"class";s:18:"TemplStudioModules";}');
INSERT INTO `sys_std_pages_widgets` (`page_id`, `widget_id`, `order`) VALUES
(@iParentPageId, LAST_INSERT_ID(), IF(ISNULL(@iParentPageOrder), 1, @iParentPageOrder + 1));

