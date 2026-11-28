-- TABLE: types of categories
CREATE TABLE IF NOT EXISTS `bx_editor_toolbar_buttons` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `active` tinyint(4) NOT NULL default '0',
  `order` tinyint(4) NOT NULL default '0',
  `name` varchar(64) NOT NULL DEFAULT '',
  `mode` varchar(10) NOT NULL DEFAULT '',
  `inline` tinyint(4) NOT NULL default '0',
  PRIMARY KEY (`id`)
);

INSERT INTO `bx_editor_toolbar_buttons`(`active`, `order`, `name`, `mode`, `inline`) VALUES
(1, 0, 'bold', 'full', 0),
(1, 1, 'italic', 'full', 0),
(1, 2, 'link', 'full', 0),
(1, 3, 'marker', 'full', 0),
(1, 4, 'inlineCode', 'full', 0),

(1, 5, 'header', 'full', 1),
(1, 6, 'list', 'full', 1),
(1, 7, 'image', 'full', 1),
(1, 8, 'embed', 'full', 1),
(1, 9, 'code', 'full', 1),
(1, 10, 'delimiter', 'full', 1),

(1, 0, 'bold', 'standard', 0),
(1, 1, 'italic', 'standard', 0),
(1, 2, 'link', 'standard', 0),
(0, 3, 'marker', 'standard', 0),
(0, 4, 'inlineCode', 'standard', 0),

(1, 5, 'header', 'standard', 1),
(1, 6, 'list', 'standard', 1),
(1, 7, 'image', 'standard', 1),
(1, 8, 'embed', 'standard', 1),
(0, 9, 'code', 'standard', 1),
(0, 10, 'delimiter', 'standard', 1),

(1, 0, 'bold', 'mini', 0),
(1, 1, 'italic', 'mini', 0),
(1, 2, 'link', 'mini', 0),
(0, 3, 'marker', 'mini', 0),
(0, 4, 'inlineCode', 'mini', 0),

(0, 5, 'header', 'mini', 1),
(0, 6, 'list', 'mini', 1),
(0, 7, 'image', 'mini', 1),
(0, 8, 'embed', 'mini', 1),
(0, 9, 'code', 'mini', 1),
(0, 10, 'delimiter', 'mini', 1);

-- Studio page and widget

INSERT INTO `sys_std_pages`(`index`, `name`, `header`, `caption`, `icon`) VALUES
(3, 'bx_editor', '_bx_editor', '_bx_editor', 'bx_editor@modules/boonex/editor/|std-icon.svg');
SET @iPageId = LAST_INSERT_ID();

SET @iParentPageId = (SELECT `id` FROM `sys_std_pages` WHERE `name` = 'home');
SET @iParentPageOrder = (SELECT MAX(`order`) FROM `sys_std_pages_widgets` WHERE `page_id` = @iParentPageId);
INSERT INTO `sys_std_widgets` (`page_id`, `module`, `type`, `url`, `click`, `icon`, `caption`, `cnt_notices`, `cnt_actions`) VALUES
(@iPageId, 'bx_editor', 'integrations', '{url_studio}module.php?name=bx_editor', '', 'bx_editor@modules/boonex/editor/|std-icon.svg', '_bx_editor', '', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_actions";s:6:"params";a:0:{}s:5:"class";s:18:"TemplStudioModules";}');
INSERT INTO `sys_std_pages_widgets` (`page_id`, `widget_id`, `order`) VALUES
(@iParentPageId, LAST_INSERT_ID(), IF(ISNULL(@iParentPageOrder), 1, @iParentPageOrder + 1));

