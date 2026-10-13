SET @sName = 'bx_messenger';

-- STUDIO PAGE & WIDGET
INSERT INTO `sys_std_pages`(`index`, `name`, `header`, `caption`, `icon`) VALUES
(3, @sName, '_bx_messenger', '_bx_messenger', 'bx_messenger@modules/boonex/messenger/|std-icon.svg');
SET @iPageId = LAST_INSERT_ID();

SET @iParentPageId = (SELECT `id` FROM `sys_std_pages` WHERE `name` = 'home');
SET @iParentPageOrder = (SELECT MAX(`order`) FROM `sys_std_pages_widgets` WHERE `page_id` = @iParentPageId);
INSERT INTO `sys_std_widgets` (`page_id`, `module`, `url`, `click`, `icon`, `caption`, `cnt_notices`, `cnt_actions`) VALUES
(@iPageId, @sName, '{url_studio}module.php?name=bx_messenger', '', 'bx_messenger@modules/boonex/messenger/|std-icon.svg', '_bx_messenger', '', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_actions";s:6:"params";a:0:{}s:5:"class";s:18:"TemplStudioModules";}');
INSERT INTO `sys_std_pages_widgets` (`page_id`, `widget_id`, `order`) VALUES
(@iParentPageId, LAST_INSERT_ID(), IF(ISNULL(@iParentPageOrder), 1, @iParentPageOrder + 1));


CREATE TABLE IF NOT EXISTS `bx_messenger_jots` (
   `id` int(11) NOT NULL auto_increment,
   `lot_id` int(11) unsigned NOT NULL default '0',   
   `message` text NOT NULL,
   `created` int(11) NOT NULL default '0',
   `user_id` int(11) unsigned NOT NULL default '0',
   `attachment_type` varchar(255) NOT NULL default '',
   `attachment` text NOT NULL default '',
   `last_edit` int(11) NOT NULL default '0',
   `edit_by` int(11) unsigned NOT NULL default '0',
   `trash` tinyint(1) unsigned NOT NULL default 0,
   `vc` int(11) NOT NULL default 0,
   `rrate` float NOT NULL default '0',
   `rvotes` int(11) NOT NULL default '0',
   `reply` int(11) NOT NULL default 0,
   PRIMARY KEY (`id`),
   KEY `lot_id` (`lot_id`),
   KEY `user_lot` (`user_id`,`lot_id`)
);

CREATE TABLE IF NOT EXISTS `bx_messenger_jot_reactions` (
   `id` int(11) NOT NULL auto_increment,
   `jot_id` int(11) unsigned NOT NULL default 0,
   `native` varchar(10) NOT NULL,
   `emoji_id` varchar(50) NOT NULL,
   `user_id` int(11) unsigned NOT NULL default 0,
   `added` int(11) NOT NULL default 0,
   PRIMARY KEY  (`id`),
   KEY `jot_id` (`jot_id`),
   UNIQUE KEY `jot` (`jot_id`,`emoji_id`, `user_id`)
);

CREATE TABLE IF NOT EXISTS `bx_messenger_jots_media_tracker` (
   `file_id` int(11) NOT NULL default 0,
   `user_id` int(11) unsigned NOT NULL default 0,
   `collapsed` tinyint(1) NOT NULL default 1,
    PRIMARY KEY (`file_id`, `user_id`)
);

CREATE TABLE IF NOT EXISTS `bx_messenger_jots_rvotes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `reaction` varchar(32) NOT NULL default '',
  `count` int(11) NOT NULL default '0',
  `sum` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),    
  UNIQUE KEY `reaction` (`object_id`, `reaction`)
);

CREATE TABLE IF NOT EXISTS `bx_messenger_jots_rvotes_track` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `author_id` int(11) NOT NULL default '0',
  `author_nip` int(11) unsigned NOT NULL default '0',
  `reaction` varchar(32) NOT NULL default '',
  `value` tinyint(4) NOT NULL default '0',
  `date` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  KEY `vote` (`object_id`, `author_nip`)
);

CREATE TABLE IF NOT EXISTS `bx_messenger_lots` (
   `id` int(11) NOT NULL auto_increment,
   `title` varchar(255) NOT NULL,
   `url` varchar(255) NOT NULL default '',
   `type` tinyint(3) NOT NULL default 1,
   `created` int(11) NOT NULL default 0,
   `updated` int(11) NOT NULL default 0,
   `author` int(11) unsigned NOT NULL default 0,
   `participants` text NOT NULL default '',
   `class` varchar(20) NOT NULL default 'custom',
   `parent_jot` int(11) unsigned NOT NULL default 0,
   `visibility` tinyint(1) NOT NULL default 0,
   `hash` varchar(32) NOT NULL,
   PRIMARY KEY  (`id`),
   UNIQUE KEY `hash` (`hash`)
);

CREATE TABLE IF NOT EXISTS `bx_messenger_attachments` (
  `name` varchar(50) NOT NULL default '',
  `service` varchar(255) NOT NULL,
  PRIMARY KEY (`name`)
);

INSERT INTO `bx_messenger_attachments` (`name`, `service`) VALUES
('bx_messenger', 'a:3:{s:6:"module";s:12:"bx_messenger";s:6:"method";s:18:"get_broadcast_card";s:6:"params";a:0:{}}');

INSERT INTO `bx_messenger_lots` (`id`, `title`, `url`, `type`, `created`, `author`, `participants`, `class`) VALUES
(1, '_bx_messenger_lots_class_my_members', '', 3, UNIX_TIMESTAMP(), 0, '', 'members');

CREATE TABLE IF NOT EXISTS `bx_messenger_lots_types` (
   `id` int(11) NOT NULL auto_increment,
   `name` varchar(50) NOT NULL default '',
   `show_link` tinyint(1) NOT NULL default 0,
    PRIMARY KEY (`id`)
);

INSERT INTO `bx_messenger_lots_types` (`id`, `name`, `show_link`) VALUES
(1, 'public', 1),
(2, 'private', 0),
(3, 'sets', 0),
(4, 'groups', 1),
(5, 'events', 1),
(6, 'broadcast', 0);


CREATE TABLE IF NOT EXISTS `bx_messenger_users_info` (
    `lot_id` int(11) unsigned NOT NULL default 0,
    `user_id` int(11) unsigned NOT NULL default 0,
    `params` text NOT NULL,
    `star` tinyint(1) NOT NULL default '0',
    PRIMARY KEY (`lot_id`,`user_id`)
);

CREATE TABLE IF NOT EXISTS `bx_messenger_lots_settings` (
    `lot_id` int(11) NOT NULL,
    `actions` varchar(255) NOT NULL default '',
    `settings` varchar(255) NOT NULL default '',
    `icon` int(11) NOT NULL default '0',
    PRIMARY KEY (`lot_id`)
);

CREATE TABLE IF NOT EXISTS `bx_messenger_unread_jots` (
   `id` int(11) unsigned auto_increment,
   `lot_id` int(11) NOT NULL default 0,
   `first_jot_id` int(11) NOT NULL default 0,
   `unread_count` int(11) NOT NULL default 0,
   `user_id` int(11) NOT NULL default 0,
    PRIMARY KEY (`id`),
    UNIQUE KEY `id` (`lot_id`, `user_id`),
    KEY `user` (`user_id`),
    KEY `jot` (`first_jot_id`)
);

CREATE TABLE IF NOT EXISTS `bx_messenger_jvc` (
   `id` int(11) NOT NULL AUTO_INCREMENT,
   `lot_id` int(11) NOT NULL,
   `room` varchar(64) NOT NULL,
   `number` tinyint(255) NOT NULL default 0,
   `active` int(11) unsigned NOT NULL default 1,
    PRIMARY KEY (`id`),
    UNIQUE KEY `lot_id` (`lot_id`),
    UNIQUE KEY `room` (`room`)
);

CREATE TABLE IF NOT EXISTS `bx_messenger_public_jvc` (
   `id` int(11) NOT NULL AUTO_INCREMENT,
   `room` varchar(100) NOT NULL,
   `participants` varchar(255) NOT NULL default 0,
   `active` tinyint(1) unsigned NOT NULL default 1,
   `created` int(11) unsigned NOT NULL default 0,
    PRIMARY KEY (`id`),
    UNIQUE KEY `room` (`room`)
);

CREATE TABLE IF NOT EXISTS `bx_messenger_jvc_track` (
   `id` int(11) NOT NULL AUTO_INCREMENT,
   `jvc_id` int(11) NOT NULL,
   `author_id` int(11) NOT NULL,
   `start` int(11) NOT NULL,
   `end` int(11) NOT NULL,
   `participants` varchar(255) NOT NULL default '',
   `joined` varchar(255) NOT NULL default '',
    PRIMARY KEY (`id`)
);

-- TABLE: storages & transcoders
CREATE TABLE IF NOT EXISTS `bx_messenger_files` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `profile_id` int(10) unsigned NOT NULL,
  `jot_id` int(10) unsigned NOT NULL,
  `remote_id` varchar(128) NOT NULL,
  `path` varchar(255) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `mime_type` varchar(128) NOT NULL,
  `ext` varchar(32) NOT NULL,
  `size` bigint(20) NOT NULL,
  `added` int(11) NOT NULL,
  `modified` int(11) NOT NULL,
  `private` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `remote_id` (`remote_id`)
);

CREATE TABLE IF NOT EXISTS `bx_messenger_photos_resized` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `profile_id` int(10) unsigned NOT NULL,
  `remote_id` varchar(128) NOT NULL,
  `path` varchar(255) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `mime_type` varchar(128) NOT NULL,
  `ext` varchar(32) NOT NULL,
  `size` bigint(20) NOT NULL,
  `added` int(11) NOT NULL,
  `modified` int(11) NOT NULL,
  `private` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `remote_id` (`remote_id`)
);

CREATE TABLE IF NOT EXISTS `bx_messenger_videos_processed` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `profile_id` int(10) unsigned NOT NULL,
  `remote_id` varchar(128) NOT NULL,
  `path` varchar(255) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `mime_type` varchar(128) NOT NULL,
  `ext` varchar(32) NOT NULL,
  `size` bigint(20) NOT NULL,
  `added` int(11) NOT NULL,
  `modified` int(11) NOT NULL,
  `private` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `remote_id` (`remote_id`)
);

CREATE TABLE IF NOT EXISTS `bx_messenger_mp3_processed` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `profile_id` int(10) unsigned NOT NULL,
  `remote_id` varchar(128) NOT NULL,
  `path` varchar(255) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `mime_type` varchar(128) NOT NULL,
  `ext` varchar(32) NOT NULL,
  `size` bigint(20) NOT NULL,
  `added` int(11) NOT NULL,
  `modified` int(11) NOT NULL,
  `private` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `remote_id` (`remote_id`)
);

CREATE TABLE IF NOT EXISTS `bx_messenger_groups` (
    `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
    `author` int(11) unsigned NOT NULL,
    `added` int(11) unsigned NOT NULL,
    `allow_view_to` int(10) unsigned NOT NULL DEFAULT 3,
    `name` varchar(50) NOT NULL,
    `desc` varchar(255) NOT NULL,
    `url` varchar(255) NOT NULL,
    `module` varchar(50) NOT NULL,
    `count` int(10) unsigned NOT NULL DEFAULT 0,
    `profile_id` int(11) unsigned NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    KEY `module` (`module`)
);

INSERT INTO `bx_messenger_groups` (`id`, `author`, `added`, `allow_view_to`, `name`, `desc`, `url`, `module`, `count`, `profile_id`) VALUES
(1, 0, UNIX_TIMESTAMP(), 3, 'Homepage', '', 'i=index', 'bx_messenger_pages', 0, 0);

CREATE TABLE IF NOT EXISTS `bx_messenger_groups_lots` (
    `lot_id` int(11) unsigned NOT NULL,
    `group_id` int(11) unsigned NOT NULL,
    UNIQUE KEY (`lot_id`, `group_id`)
);

INSERT INTO `bx_messenger_groups_lots` (`lot_id`, `group_id`) VALUES
(1, 1);

CREATE TABLE IF NOT EXISTS `bx_messenger_saved_jots` (
    `jot_id` int(11) NOT NULL default 0,
    `profile_id` int(11) NOT NULL default 0,
    UNIQUE KEY `id` (`jot_id`, `profile_id`),
    KEY `profile` (`profile_id`)
);

CREATE TABLE IF NOT EXISTS `bx_messenger_mass_convo_tracker` (
   `convo_id` int(11) unsigned NOT NULL default 0,
   `user_id` int(11) unsigned NOT NULL default 0,
    PRIMARY KEY (`convo_id`, `user_id`)
);

-- STORAGES & TRANSCODERS
SET @sStorageEngine = (SELECT `value` FROM `sys_options` WHERE `name` = 'sys_storage_default');

INSERT INTO `sys_objects_storage` (`object`, `engine`, `params`, `token_life`, `cache_control`, `levels`, `table_files`, `ext_mode`, `ext_allow`, `ext_deny`, `quota_size`, `current_size`, `quota_number`, `current_number`, `max_file_size`, `ts`) VALUES
('bx_messenger_files', @sStorageEngine, '', 360, 2592000, 3, 'bx_messenger_files', 'deny-allow', '', 'action,apk,app,bat,bin,cmd,com,command,cpl,csh,exe,gadget,inf,ins,inx,ipa,isu,job,jse,ksh,lnk,msc,msi,msp,mst,osx,out,paf,pif,prg,ps1,reg,rgs,run,sct,shb,shs,u3p,vb,vbe,vbs,vbscript,workflow,ws,wsf', 0, 0, 0, 0, 0, 0),
('bx_messenger_photos_resized', @sStorageEngine, '', 360, 2592000, 3, 'bx_messenger_photos_resized', 'allow-deny', 'jpg,jpeg,jpe,gif,png', '', 0, 0, 0, 0, 0, 0),
('bx_messenger_videos_processed', @sStorageEngine, '', 360, 2592000, 3, 'bx_messenger_videos_processed', 'allow-deny', 'avi,flv,mpg,mpeg,wmv,mp4,m4v,mov,divx,xvid,3gp,webm,jpg', '', 0, 0, 0, 0, 0, 0),
('bx_messenger_mp3_processed', @sStorageEngine, '', 360, 2592000, 3, 'bx_messenger_mp3_processed', 'allow-deny', '3gp,aa,aac,aax,act,aiff,amr,ape,au,awb,dct,dss,dvf,flac,gsm,iklax,ivs,m4a,m4b,m4p,mmf,mp3,mpc,msv,nmf,nsf,ogg,opus,ra,raw,sln,tta,vox,wav,wma,wv,webm,8svx', '', 0, 0, 0, 0, 0, 0);

INSERT INTO `sys_objects_transcoder` (`object`, `storage_object`, `source_type`, `source_params`, `private`, `atime_tracking`, `atime_pruning`, `ts`, `override_class_name`) VALUES 
('bx_messenger_preview', 'bx_messenger_photos_resized', 'Storage', 'a:1:{s:6:"object";s:18:"bx_messenger_files";}', 'no', '1', '2592000', '0', ''),
('bx_messenger_videos_poster', 'bx_messenger_videos_processed', 'Storage', 'a:1:{s:6:"object";s:18:"bx_messenger_files";}', 'no', '0', '0', '0', 'BxDolTranscoderVideo'),
('bx_messenger_icon', 'bx_messenger_photos_resized', 'Storage', 'a:1:{s:6:"object";s:18:"bx_messenger_files";}', 'no', '1', '0', '0', ''),
('bx_messenger_videos_mp4', 'bx_messenger_videos_processed', 'Storage', 'a:1:{s:6:"object";s:18:"bx_messenger_files";}', 'no', '0', '0', '0', 'BxDolTranscoderVideo'),
('bx_messenger_videos_mp4_hd', 'bx_messenger_videos_processed', 'Storage', 'a:1:{s:6:"object";s:18:"bx_messenger_files";}', 'no', '0', '0', '0', 'BxDolTranscoderVideo'),
('bx_messenger_videos_webm', 'bx_messenger_videos_processed', 'Storage', 'a:1:{s:6:"object";s:18:"bx_messenger_files";}', 'no', '0', '0', '0', 'BxDolTranscoderVideo'),
('bx_messenger_mp3', 'bx_messenger_mp3_processed', 'Storage', 'a:1:{s:6:"object";s:18:"bx_messenger_files";}', 'no', '0', '0', '0', 'BxDolTranscoderAudio');

INSERT INTO `sys_transcoder_filters` (`transcoder_object`, `filter`, `filter_params`, `order`) VALUES 
('bx_messenger_preview', 'Resize', 'a:3:{s:1:"w";s:3:"720";s:1:"h";s:3:"720";s:11:"crop_resize";s:1:"0";}', 0),
('bx_messenger_videos_poster', 'Poster', 'a:2:{s:1:"h";s:3:"720";s:10:"force_type";s:3:"jpg";}', 0),
('bx_messenger_icon', 'Resize', 'a:3:{s:1:"w";s:2:"96";s:1:"h";s:2:"96";s:11:"crop_resize";s:1:"0";}', 0),
('bx_messenger_videos_mp4', 'Mp4', 'a:2:{s:1:"h";s:3:"480";s:10:"force_type";s:3:"mp4";}', 0),
('bx_messenger_videos_mp4_hd', 'Mp4', 'a:3:{s:1:"h";s:3:"720";s:13:"video_bitrate";s:4:"1536";s:10:"force_type";s:3:"mp4";}', 0),
('bx_messenger_videos_webm', 'Webm', 'a:2:{s:1:"h";s:3:"480";s:10:"force_type";s:4:"webm";}', 0),
('bx_messenger_mp3', 'Mp3', 'a:2:{s:13:"audio_bitrate";s:3:"128";s:10:"force_type";s:3:"mp3";}', 0);

--- SEARCH CRITERIA FORM
INSERT INTO `sys_objects_form` (`object`, `module`, `title`, `action`, `form_attrs`, `submit_name`, `table`, `key`, `uri`, `uri_title`, `params`, `deletable`, `active`, `parent_form`, `override_class_name`, `override_class_file`) VALUES
('bx_messenger_filter_criteria', @sName, '_bx_messenger_filter_criteria_form', '', 'a:1:{s:7:"enctype";s:19:"multipart/form-data";}', '', '', '', '', '', '', 0, 1, '', 'BxMessengerFilterForm', 'modules/boonex/messenger/classes/BxMessengerFilterForm.php');

INSERT INTO `sys_form_displays` (`display_name`, `module`, `object`, `title`) VALUES
('bx_messenger_filter_criteria', @sName, 'bx_messenger_filter_criteria', '_bx_messenger_filter_criteria_form_display');

-- FORMS: for NEO
INSERT INTO `sys_objects_form` (`object`, `module`, `title`, `action`, `form_attrs`, `submit_name`, `table`, `key`, `uri`, `uri_title`, `params`, `deletable`, `active`, `parent_form`, `override_class_name`, `override_class_file`) VALUES
('bx_messenger_send', @sName, '_bx_messenger_neo_app_form', '', 'a:1:{s:7:"enctype";s:19:"multipart/form-data";}', 'submit', '', 'id', '', '', '', 0, 1, '', 'BxMessengerFormEntry', 'modules/boonex/messenger/classes/BxMessengerFormEntry.php');

INSERT INTO `sys_form_displays` (`display_name`, `module`, `object`, `title`) VALUES
('bx_messenger_send', @sName, 'bx_messenger_send', '_bx_messenger_neo_app_form_display_send_message');

INSERT INTO `sys_form_inputs` (`object`, `module`, `name`, `value`, `values`, `checked`, `type`, `caption_system`, `caption`, `info`, `help`, `required`, `unique`, `collapsed`, `html`, `privacy`, `rateable`, `attrs`, `attrs_tr`, `attrs_wrapper`, `checker_func`, `checker_params`, `checker_error`, `db_pass`, `db_params`, `editable`, `deletable`) VALUES
('bx_messenger_send', @sName, 'submit', '_bx_messenger_neo_app_form_input_submit', '', 0, 'submit', '_bx_messenger_neo_app_form_input_caption_submit', '', '', '', 0, 0, 0, 0, 0, '', '', '', '', '', '', '', '', '', 0, 0),
('bx_messenger_send', @sName, 'cancel', '_bx_messenger_neo_app_form_input_cancel', '', 0, 'button', '_bx_messenger_neo_app_form_input_caption_cancel', '', '', '', 0, 0, 0, 0, 0, '', 'a:1:{s:5:"class";s:22:"bx-def-margin-sec-left";}', '', '', '', '', '', '', '', 0, 0),
('bx_messenger_send', @sName, 'controls', '', 'submit,cancel', 0, 'input_set', '', '', '', '', 0, 0, 0, 0, 0, '', '', '', '', '', '', '', '', '', 0, 0),
('bx_messenger_send', @sName, 'cf', '', '#!sys_content_filter', 0, 'select', '_sys_form_entry_input_sys_cf', '_sys_form_entry_input_cf', '', '', 0, 0, 0, 0, 0, '', '', '', '', '', '', '', '', '', 1, 0),
('bx_messenger_send', @sName, 'files', 'a:1:{i:0;s:18:"bx_messenger_html5";}', 'a:1:{s:18:"bx_messenger_html5";s:25:"_sys_uploader_html5_title";}', 0, 'files', '_bx_messenger_neo_app_form_input_caption_files', '', '', '', 0, 0, 0, 0, 0, '', '', '', '', '', '', '', '', '', 1, 0),
('bx_messenger_send', @sName, 'message', '', '', 0, 'textarea', '_bx_messenger_neo_app_form_input_caption_message', '', '', '', 0, 0, 0, 3, 0, '', 'a:1:{s:12:"autocomplete";s:3:"off";}', '', '', '', '', '', 'XssHtml', '', 1, 0),
('bx_messenger_send', @sName, 'payload', '', '', 0, 'hidden', '_bx_messenger_neo_app_form_input_caption_payload', '', '', '', 0, 0, 0, 0, 0, '', '', '', '', '', '', '', '', '', 0, 0),
('bx_messenger_send', @sName, 'reply', '', '', 0, 'hidden', '_bx_messenger_neo_app_form_input_caption_reply', '', '', '', 0, 0, 0, 0, 0, '', '', '', '', '', '', '', 'Int', '', 0, 0),
('bx_messenger_send', @sName, 'message_id', '', '', 0, 'hidden', '_bx_messenger_neo_app_form_input_caption_message_id', '', '', '', 0, 0, 0, 0, 0, '', '', '', '', '', '', '', 'Int', '', 0, 0),
('bx_messenger_send', @sName, 'id', '', '', 0, 'hidden', '_bx_messenger_neo_app_form_input_caption_id', '', '', '', 0, 0, 0, 0, 0, '', '', '', '', '', '', '', 'Int', '', 0, 0),
('bx_messenger_send', @sName, 'action', '', '', 0, 'hidden', '_bx_messenger_neo_app_form_input_caption_action', '', '', '', 0, 0, 0, 0, 0, '', '', '', '', '', '', '', '', '', 0, 0),
('bx_messenger_send', @sName, 'send', '', '', 0, 'hidden', '_bx_messenger_neo_app_form_input_caption_messenger_send', '', '', '', 0, 0, 0, 0, 0, '', '', '', '', '', '', '', '', '', 0, 0);

INSERT INTO `sys_form_display_inputs` (`display_name`, `input_name`, `visible_for_levels`, `active`, `order`) VALUES
('bx_messenger_send', 'send', 2147483647, 1, 1),
('bx_messenger_send', 'id', 2147483647, 1, 2),
('bx_messenger_send', 'action', 2147483647, 1, 3),
('bx_messenger_send', 'message_id', 2147483647, 1, 4),
('bx_messenger_send', 'reply', 2147483647, 1, 5),
('bx_messenger_send', 'payload', 2147483647, 1, 6),
('bx_messenger_send', 'message', 2147483647, 1, 7),
('bx_messenger_send', 'cf', 2147483647, 1, 8),
('bx_messenger_send', 'submit', 2147483647, 1, 9),
('bx_messenger_send', 'files', 2147483647, 1, 10),
('bx_messenger_send', 'cancel', 2147483647, 0, 11),
('bx_messenger_send', 'controls', 2147483647, 0, 12);

-- VOTES
INSERT INTO `sys_objects_vote` (`Name`, `Module`, `TableMain`, `TableTrack`, `PostTimeout`, `MinValue`, `MaxValue`, `IsUndo`, `IsOn`, `TriggerTable`, `TriggerFieldId`, `TriggerFieldAuthor`, `TriggerFieldRate`, `TriggerFieldRateCount`, `ClassName`, `ClassFile`) VALUES 
('bx_messenger_jots_rvotes', 'bx_messenger', 'bx_messenger_jots_rvotes', 'bx_messenger_jots_rvotes_track', '604800', '1', '1', '1', '1', 'bx_messenger_jots', 'id', 'user_id', 'rrate', 'rvotes', 'BxMessengerJotVoteReactions', 'modules/boonex/messenger/classes/BxMessengerJotVoteReactions.php');