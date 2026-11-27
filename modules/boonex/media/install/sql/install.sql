-- TABLE: PROFILES
CREATE TABLE IF NOT EXISTS `bx_media_input_settings` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `input_id` int(10) unsigned NOT NULL,
  `value` varchar(255) NOT NULL,
  `values` text NOT NULL,
  PRIMARY KEY (`id`)
  );

  -- UPLOADERS
INSERT INTO `sys_objects_uploader` (`object`, `active`, `override_class_name`, `override_class_file`) VALUES
('bx_media_uploader', 1, 'BxMediaUploader', 'modules/boonex/media/classes/BxMediaUploader.php'),
('bx_media_uploader_attachments', 1, 'BxMediaUploaderAttachments', 'modules/boonex/media/classes/BxMediaUploaderAttachments.php');

-- STUDIO: page & widget
INSERT INTO `sys_std_pages`(`index`, `name`, `header`, `caption`, `icon`) VALUES
(3, @sName, '_bx_media', '_bx_media', 'bx_media@modules/boonex/media/|std-icon.svg');

SET @iPageId = LAST_INSERT_ID();

INSERT INTO `sys_std_widgets` (`page_id`, `module`, `url`, `click`, `icon`, `caption`, `cnt_notices`, `cnt_actions`) 
VALUES(@iPageId, @sName, '{url_studio}module.php?name=bx_media', '', 'bx_media@modules/boonex/media/|std-icon.svg', '_bx_media', '', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_actions";s:6:"params";a:0:{}s:5:"class";s:18:"TemplStudioModules";}');

SET @iParentPageId = (SELECT `id` FROM `sys_std_pages` WHERE `name` = 'home');
SET @iParentPageOrder = (SELECT IFNULL(MAX(`order`), 0) + 1 FROM `sys_std_pages_widgets` WHERE `page_id` = @iParentPageId);

INSERT INTO `sys_std_pages_widgets` (`page_id`, `widget_id`, `order`) VALUES
(@iParentPageId, LAST_INSERT_ID(), @iParentPageOrder);
