-- TABLE: entries
CREATE TABLE IF NOT EXISTS `bx_resources_entries` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `author` int(11) NOT NULL,
  `list` int(11) NOT NULL,	
  `added` int(11) NOT NULL,
  `changed` int(11) NOT NULL,
  `published` int(11) NOT NULL,
  `thumb` int(11) NOT NULL,
  `thumb_data` varchar(50) NOT NULL,
  `link` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `cat` int(11) NOT NULL,
  `text` mediumtext NOT NULL,
  `labels` text NOT NULL,
  `views` int(11) NOT NULL default '0',
  `rate` float NOT NULL default '0',
  `votes` int(11) NOT NULL default '0',
  `rrate` float NOT NULL default '0',
  `rvotes` int(11) NOT NULL default '0',
  `score` int(11) NOT NULL default '0',
  `sc_up` int(11) NOT NULL default '0',
  `sc_down` int(11) NOT NULL default '0',
  `comments` int(11) NOT NULL default '0',
  `reports` int(11) NOT NULL default '0',
  `cf` int(11) NOT NULL default '1',
  `allow_view_to` varchar(16) NOT NULL DEFAULT '3',
  `allow_comments` tinyint(4) NOT NULL DEFAULT '0',
  `status` enum('active','awaiting','failed','hidden') NOT NULL DEFAULT 'active',
  `status_admin` enum('active','hidden','pending') NOT NULL DEFAULT 'active',
  PRIMARY KEY (`id`),
  FULLTEXT KEY `title_text` (`title`,`text`)
);

-- TABLE: lists
CREATE TABLE IF NOT EXISTS `bx_resources_lists` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `context_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `default` tinyint(4) NOT NULL default '0',
  PRIMARY KEY (`id`)
);

-- TABLE: storages & transcoders
CREATE TABLE IF NOT EXISTS `bx_resources_covers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `profile_id` int(10) unsigned NOT NULL,
  `remote_id` varchar(128) NOT NULL,
  `path` varchar(255) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `mime_type` varchar(128) NOT NULL,
  `ext` varchar(32) NOT NULL,
  `size` bigint(20) NOT NULL,
  `dimensions` varchar(12) NOT NULL,
  `added` int(11) NOT NULL,
  `modified` int(11) NOT NULL,
  `private` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `remote_id` (`remote_id`)
);

CREATE TABLE IF NOT EXISTS `bx_resources_photos_resized` (
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

-- TABLE: comments
CREATE TABLE IF NOT EXISTS `bx_resources_cmts` (
  `cmt_id` int(11) NOT NULL AUTO_INCREMENT,
  `cmt_parent_id` int(11) NOT NULL DEFAULT '0',
  `cmt_vparent_id` int(11) NOT NULL DEFAULT '0',
  `cmt_object_id` int(11) NOT NULL DEFAULT '0',
  `cmt_author_id` int(11) NOT NULL DEFAULT '0',
  `cmt_level` int(11) NOT NULL DEFAULT '0',
  `cmt_text` text NOT NULL,
  `cmt_mood` tinyint(4) NOT NULL DEFAULT '0',
  `cmt_rate` int(11) NOT NULL DEFAULT '0',
  `cmt_rate_count` int(11) NOT NULL DEFAULT '0',
  `cmt_time` int(11) unsigned NOT NULL DEFAULT '0',
  `cmt_replies` int(11) NOT NULL DEFAULT '0',
  `cmt_pinned` int(11) NOT NULL default '0',
  `cmt_cf` int(11) NOT NULL default '1',
  PRIMARY KEY (`cmt_id`),
  KEY `cmt_object_id` (`cmt_object_id`,`cmt_parent_id`),
  FULLTEXT KEY `search_fields` (`cmt_text`)
);

-- TABLE: votes
CREATE TABLE IF NOT EXISTS `bx_resources_votes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `count` int(11) NOT NULL default '0',
  `sum` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `object_id` (`object_id`)
);

CREATE TABLE IF NOT EXISTS `bx_resources_votes_track` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `author_id` int(11) NOT NULL default '0',
  `author_nip` int(11) unsigned NOT NULL default '0',
  `value` tinyint(4) NOT NULL default '0',
  `date` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  KEY `vote` (`object_id`, `author_nip`)
);

CREATE TABLE IF NOT EXISTS `bx_resources_reactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `reaction` varchar(32) NOT NULL default '',
  `count` int(11) NOT NULL default '0',
  `sum` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `reaction` (`object_id`, `reaction`)
);

CREATE TABLE IF NOT EXISTS `bx_resources_reactions_track` (
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

-- TABLE: views
CREATE TABLE `bx_resources_views_track` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `viewer_id` int(11) NOT NULL default '0',
  `viewer_nip` int(11) unsigned NOT NULL default '0',
  `date` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  KEY `id` (`object_id`,`viewer_id`,`viewer_nip`)
);

-- TABLE: reports
CREATE TABLE IF NOT EXISTS `bx_resources_reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `count` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `object_id` (`object_id`)
);

CREATE TABLE IF NOT EXISTS `bx_resources_reports_track` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `author_id` int(11) NOT NULL default '0',
  `author_nip` int(11) unsigned NOT NULL default '0',
  `type` varchar(32) NOT NULL default '',
  `text` text NOT NULL default '',
  `date` int(11) NOT NULL default '0',
  `checked_by` int(11) NOT NULL default '0',
  `status` tinyint(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  KEY `report` (`object_id`, `author_nip`)
);

-- TABLE: scores
CREATE TABLE IF NOT EXISTS `bx_resources_scores` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `count_up` int(11) NOT NULL default '0',
  `count_down` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `object_id` (`object_id`)
);

CREATE TABLE IF NOT EXISTS `bx_resources_scores_track` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `author_id` int(11) NOT NULL default '0',
  `author_nip` int(11) unsigned NOT NULL default '0',
  `type` varchar(8) NOT NULL default '',
  `date` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  KEY `vote` (`object_id`, `author_nip`)
);


-- STORAGES & TRANSCODERS
SET @sStorageEngine = (SELECT `value` FROM `sys_options` WHERE `name` = 'sys_storage_default');

INSERT INTO `sys_objects_storage` (`object`, `engine`, `params`, `token_life`, `cache_control`, `levels`, `table_files`, `ext_mode`, `ext_allow`, `ext_deny`, `quota_size`, `current_size`, `quota_number`, `current_number`, `max_file_size`, `ts`) VALUES
('bx_resources_covers', @sStorageEngine, '', 360, 2592000, 3, 'bx_resources_covers', 'allow-deny', '{image}', '', 0, 0, 0, 0, 0, 0),
('bx_resources_photos_resized', @sStorageEngine, '', 360, 2592000, 3, 'bx_resources_photos_resized', 'allow-deny', '{image}', '', 0, 0, 0, 0, 0, 0);

INSERT INTO `sys_objects_transcoder` (`object`, `storage_object`, `source_type`, `source_params`, `private`, `atime_tracking`, `atime_pruning`, `ts`, `override_class_name`, `override_class_file`) VALUES 
('bx_resources_preview', 'bx_resources_photos_resized', 'Storage', 'a:1:{s:6:"object";s:19:"bx_resources_covers";}', 'no', '1', '2592000', '0', '', ''),
('bx_resources_miniature', 'bx_resources_photos_resized', 'Storage', 'a:1:{s:6:"object";s:19:"bx_resources_covers";}', 'no', '1', '2592000', '0', '', ''),
('bx_resources_gallery', 'bx_resources_photos_resized', 'Storage', 'a:1:{s:6:"object";s:19:"bx_resources_covers";}', 'no', '1', '2592000', '0', '', ''),
('bx_resources_cover', 'bx_resources_photos_resized', 'Storage', 'a:1:{s:6:"object";s:19:"bx_resources_covers";}', 'no', '1', '2592000', '0', '', '');

INSERT INTO `sys_transcoder_filters` (`transcoder_object`, `filter`, `filter_params`, `order`) VALUES 
('bx_resources_preview', 'Resize', 'a:3:{s:1:"w";s:3:"300";s:1:"h";s:3:"200";s:11:"crop_resize";s:1:"1";}', '0'),
('bx_resources_miniature', 'Resize', 'a:1:{s:1:"w";s:3:"300";}', '0'),
('bx_resources_gallery', 'Resize', 'a:1:{s:1:"w";s:3:"500";}', '0'),
('bx_resources_cover', 'Resize', 'a:1:{s:1:"w";s:4:"1200";}', '0');


-- FORMS: entry (resource)
INSERT INTO `sys_objects_form`(`object`, `module`, `title`, `action`, `form_attrs`, `table`, `key`, `uri`, `uri_title`, `submit_name`, `params`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_resources', 'bx_resources', '_bx_resources_form_entry', '', 'a:1:{s:7:"enctype";s:19:"multipart/form-data";}', 'bx_resources_entries', 'id', '', '', 'a:2:{i:0;s:9:"do_submit";i:1;s:10:"do_publish";}', '', 0, 1, 'BxResourcesFormEntry', 'modules/boonex/resources/classes/BxResourcesFormEntry.php');

INSERT INTO `sys_form_displays`(`object`, `display_name`, `module`, `view_mode`, `title`) VALUES 
('bx_resources', 'bx_resources_entry_add', 'bx_resources', 0, '_bx_resources_form_entry_display_add'),
('bx_resources', 'bx_resources_entry_delete', 'bx_resources', 0, '_bx_resources_form_entry_display_delete'),
('bx_resources', 'bx_resources_entry_edit', 'bx_resources', 0, '_bx_resources_form_entry_display_edit'),
('bx_resources', 'bx_resources_entry_view', 'bx_resources', 1, '_bx_resources_form_entry_display_view');

INSERT INTO `sys_form_inputs`(`object`, `module`, `name`, `value`, `values`, `checked`, `type`, `caption_system`, `caption`, `info`, `required`, `collapsed`, `html`, `attrs`, `attrs_tr`, `attrs_wrapper`, `checker_func`, `checker_params`, `checker_error`, `db_pass`, `db_params`, `editable`, `deletable`) VALUES 
('bx_resources', 'bx_resources', 'allow_view_to', '', '', 0, 'custom', '_bx_resources_form_entry_input_sys_allow_view_to', '_bx_resources_form_entry_input_allow_view_to', '', 1, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_resources', 'bx_resources', 'delete_confirm', 1, '', 0, 'checkbox', '_bx_resources_form_entry_input_sys_delete_confirm', '_bx_resources_form_entry_input_delete_confirm', '_bx_resources_form_entry_input_delete_confirm_info', 1, 0, 0, '', '', '', 'Avail', '', '_bx_resources_form_entry_input_delete_confirm_error', '', '', 1, 0),
('bx_resources', 'bx_resources', 'do_publish', '_bx_resources_form_entry_input_do_publish', '', 0, 'submit', '_bx_resources_form_entry_input_sys_do_publish', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_resources', 'bx_resources', 'do_submit', '_bx_resources_form_entry_input_do_submit', '', 0, 'submit', '_bx_resources_form_entry_input_sys_do_submit', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_resources', 'bx_resources', 'do_cancel', '_bx_resources_form_entry_input_do_cancel', '', 0, 'button', '_bx_resources_form_entry_input_sys_do_cancel', '', '', 0, 0, 0, 'a:2:{s:7:"onclick";s:45:"$(''.bx-popup-applied:visible'').dolPopupHide()";s:5:"class";s:22:"bx-def-margin-sec-left";}', '', '', '', '', '', '', '', 1, 0),
('bx_resources', 'bx_resources', 'do_cancel_edit', '_bx_resources_form_entry_input_do_cancel_edit', '', 0, 'button', '_bx_resources_form_entry_input_sys_do_cancel_edit', '', '', 0, 0, 0, 'a:2:{s:7:"onclick";s:41:"window.open(''{edit_cancel_url}'', ''_self'')";s:5:"class";s:22:"bx-def-margin-sec-left";}', '', '', '', '', '', '', '', 0, 0),
('bx_resources', 'bx_resources', 'controls', '', 'do_publish,do_cancel', 0, 'input_set', '_bx_resources_form_entry_input_sys_controls', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_resources', 'bx_resources', 'controls_edit', '', 'do_submit,do_cancel_edit', 0, 'input_set', '_bx_resources_form_entry_input_sys_controls_edit', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_resources', 'bx_resources', 'controls_edit_popup', '', 'do_submit,do_cancel', 0, 'input_set', '_bx_resources_form_entry_input_sys_controls_edit_popup', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_resources', 'bx_resources', 'covers', 'a:1:{i:0;s:18:"bx_resources_html5";}', 'a:1:{s:18:"bx_resources_html5";s:25:"_sys_uploader_html5_title";}', 0, 'files', '_bx_resources_form_entry_input_sys_covers', '_bx_resources_form_entry_input_covers', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_resources', 'bx_resources', 'link', '', '', 0, 'text', '_bx_resources_form_entry_input_sys_link', '_bx_resources_form_entry_input_link', '', 1, 0, 0, '', '', '', 'Avail', '', '_bx_resources_form_entry_input_link_err', 'Xss', '', 1, 0),
('bx_resources', 'bx_resources', 'title', '', '', 0, 'text', '_bx_resources_form_entry_input_sys_title', '_bx_resources_form_entry_input_title', '_bx_resources_form_entry_input_title_inf', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 1, 0),
('bx_resources', 'bx_resources', 'text', '', '', 0, 'textarea', '_bx_resources_form_entry_input_sys_text', '_bx_resources_form_entry_input_text', '', 0, 0, 2, '', '', '', '', '', '', 'XssHtml', '', 1, 0),
('bx_resources', 'bx_resources', 'cat', '', '#!bx_resources_cats', 0, 'select', '_bx_resources_form_entry_input_sys_cat', '_bx_resources_form_entry_input_cat', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 1, 0),
('bx_resources', 'bx_resources', 'added', '', '', 0, 'datetime', '_bx_resources_form_entry_input_sys_date_added', '_bx_resources_form_entry_input_date_added', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_resources', 'bx_resources', 'changed', '', '', 0, 'datetime', '_bx_resources_form_entry_input_sys_date_changed', '_bx_resources_form_entry_input_date_changed', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_resources', 'bx_resources', 'published', '', '', 0, 'datetime', '_bx_resources_form_entry_input_sys_date_published', '_bx_resources_form_entry_input_date_published', '_bx_resources_form_entry_input_date_published_info', 0, 0, 0, '', '', '', '', '', '', 'DateTimeTs', '', 1, 0),
('bx_resources', 'bx_resources', 'allow_comments', '1', '', 0, 'switcher', '_bx_resources_form_entry_input_sys_allow_comments', '_bx_resources_form_entry_input_allow_comments', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 1, 0);

INSERT INTO `sys_form_display_inputs`(`display_name`, `input_name`, `visible_for_levels`, `active`, `order`) VALUES 
('bx_resources_entry_add', 'link', 2147483647, 1, 1),
('bx_resources_entry_add', 'title', 2147483647, 1, 2),
('bx_resources_entry_add', 'covers', 2147483647, 1, 3),
('bx_resources_entry_add', 'controls', 2147483647, 1, 4),
('bx_resources_entry_add', 'do_publish', 2147483647, 1, 5),
('bx_resources_entry_add', 'do_cancel', 2147483647, 1, 6),

('bx_resources_entry_delete', 'delete_confirm', 2147483647, 1, 1),
('bx_resources_entry_delete', 'do_submit', 2147483647, 1, 2),

('bx_resources_entry_edit', 'link', 2147483647, 1, 1),
('bx_resources_entry_edit', 'title', 2147483647, 1, 2),
('bx_resources_entry_edit', 'covers', 2147483647, 1, 3),
('bx_resources_entry_edit', 'controls_edit', 2147483647, 1, 4),
('bx_resources_entry_edit', 'do_submit', 2147483647, 1, 5),
('bx_resources_entry_edit', 'do_cancel_edit', 2147483647, 1, 6),

('bx_resources_entry_view', 'link', 2147483647, 1, 1),
('bx_resources_entry_view', 'added', 2147483647, 1, 2),
('bx_resources_entry_view', 'changed', 2147483647, 1, 3);


-- FORMS: list (resources list)
INSERT INTO `sys_objects_form`(`object`, `module`, `title`, `action`, `form_attrs`, `table`, `key`, `uri`, `uri_title`, `submit_name`, `params`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_resources_list', 'bx_resources', '_bx_resources_form_list_entry', '', 'a:1:{s:7:"enctype";s:19:"multipart/form-data";}', 'bx_resources_lists', 'id', '', '', 'do_submit', '', 0, 1, 'BxResourcesFormListEntry', 'modules/boonex/resources/classes/BxResourcesFormListEntry.php');

INSERT INTO `sys_form_displays`(`object`, `display_name`, `module`, `view_mode`, `title`) VALUES 
('bx_resources_list', 'bx_resources_list_entry_add', 'bx_resources', 0, '_bx_resources_form_list_entry_display_add'),
('bx_resources_list', 'bx_resources_list_entry_edit', 'bx_resources', 0, '_bx_resources_form_list_entry_display_edit');

INSERT INTO `sys_form_inputs`(`object`, `module`, `name`, `value`, `values`, `checked`, `type`, `caption_system`, `caption`, `info`, `required`, `collapsed`, `html`, `attrs`, `attrs_tr`, `attrs_wrapper`, `checker_func`, `checker_params`, `checker_error`, `db_pass`, `db_params`, `editable`, `deletable`) VALUES 
('bx_resources_list', 'bx_resources', 'do_submit', '_bx_resources_form_list_entry_input_do_submit', '', 0, 'submit', '_bx_resources_form_list_entry_input_sys_do_submit', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_resources_list', 'bx_resources', 'title', '', '', 0, 'text', '_bx_resources_form_list_entry_input_sys_title', '_bx_resources_form_list_entry_input_title', '', 1, 0, 0, '', '', '', 'Length', 'a:2:{s:3:"min";i:3;s:3:"max";i:160;}', '_bx_resources_form_list_entry_input_title_err', 'Xss', '', 1, 0),
('bx_resources_list', 'bx_resources', 'do_cancel', '_bx_resources_form_entry_input_do_cancel', '', 0, 'button', '_bx_resources_form_entry_input_sys_do_cancel', '', '', 0, 0, 0, 'a:2:{s:7:"onclick";s:45:"$(''.bx-popup-applied:visible'').dolPopupHide()";s:5:"class";s:22:"bx-def-margin-sec-left";}', '', '', '', '', '', '', '', 1, 0),
('bx_resources_list', 'bx_resources', 'controls', '', 'do_submit,do_cancel', 0, 'input_set', '', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0);

INSERT INTO `sys_form_display_inputs`(`display_name`, `input_name`, `visible_for_levels`, `active`, `order`) VALUES 
('bx_resources_list_entry_add', 'title', 2147483647, 1, 1),
('bx_resources_list_entry_add', 'controls', 2147483647, 1, 2),
('bx_resources_list_entry_add', 'do_submit', 2147483647, 1, 3),
('bx_resources_list_entry_add', 'do_cancel', 2147483647, 1, 4),

('bx_resources_list_entry_edit', 'title', 2147483647, 1, 1),
('bx_resources_list_entry_edit', 'controls', 2147483647, 1, 2),
('bx_resources_list_entry_edit', 'do_submit', 2147483647, 1, 3),
('bx_resources_list_entry_edit', 'do_cancel', 2147483647, 1, 4);

-- PRE-VALUES
INSERT INTO `sys_form_pre_lists`(`key`, `title`, `module`, `use_for_sets`) VALUES
('bx_resources_cats', '_bx_resources_pre_lists_cats', 'bx_resources', '0');

INSERT INTO `sys_form_pre_values`(`Key`, `Value`, `Order`, `LKey`, `LKey2`) VALUES
('bx_resources_cats', '', 0, '_sys_please_select', ''),
('bx_resources_cats', '1', 1, '_bx_resources_cat_links', ''),
('bx_resources_cats', '2', 2, '_bx_resources_cat_media', ''),
('bx_resources_cats', '3', 3, '_bx_resources_cat_other', '');

-- COMMENTS
INSERT INTO `sys_objects_cmts` (`Name`, `Module`, `Table`, `CharsPostMin`, `CharsPostMax`, `CharsDisplayMax`, `Html`, `PerView`, `PerViewReplies`, `BrowseType`, `IsBrowseSwitch`, `PostFormPosition`, `NumberOfLevels`, `IsDisplaySwitch`, `IsRatable`, `ViewingThreshold`, `IsOn`, `RootStylePrefix`, `BaseUrl`, `ObjectVote`, `TriggerTable`, `TriggerFieldId`, `TriggerFieldAuthor`, `TriggerFieldTitle`, `TriggerFieldComments`, `ClassName`, `ClassFile`) VALUES
('bx_resources', 'bx_resources', 'bx_resources_cmts', 1, 5000, 1000, 3, 50, 10, 'tail', 1, 'bottom', 1, 1, 1, -3, 1, 'cmt', 'page.php?i=view-resource&id={object_id}', '', 'bx_resources_entries', 'id', 'author', 'title', 'comments', 'BxResourcesCmts', 'modules/boonex/resources/classes/BxResourcesCmts.php');

-- VOTES
INSERT INTO `sys_objects_vote` (`Name`, `Module`, `TableMain`, `TableTrack`, `PostTimeout`, `MinValue`, `MaxValue`, `IsUndo`, `IsOn`, `TriggerTable`, `TriggerFieldId`, `TriggerFieldAuthor`, `TriggerFieldRate`, `TriggerFieldRateCount`, `ClassName`, `ClassFile`) VALUES 
('bx_resources', 'bx_resources', 'bx_resources_votes', 'bx_resources_votes_track', '604800', '1', '1', '0', '1', 'bx_resources_entries', 'id', 'author', 'rate', 'votes', '', ''),
('bx_resources_reactions', 'bx_resources', 'bx_resources_reactions', 'bx_resources_reactions_track', '604800', '1', '1', '1', '1', 'bx_resources_entries', 'id', 'author', 'rrate', 'rvotes', 'BxTemplVoteReactions', '');

-- SCORES
INSERT INTO `sys_objects_score` (`name`, `module`, `table_main`, `table_track`, `post_timeout`, `is_on`, `trigger_table`, `trigger_field_id`, `trigger_field_author`, `trigger_field_score`, `trigger_field_cup`, `trigger_field_cdown`, `class_name`, `class_file`) VALUES 
('bx_resources', 'bx_resources', 'bx_resources_scores', 'bx_resources_scores_track', '604800', '0', 'bx_resources_entries', 'id', 'author', 'score', 'sc_up', 'sc_down', '', '');

-- REPORTS
INSERT INTO `sys_objects_report` (`name`, `module`, `table_main`, `table_track`, `pruning`, `is_on`, `base_url`, `object_comment`, `trigger_table`, `trigger_field_id`, `trigger_field_author`, `trigger_field_count`, `class_name`, `class_file`) VALUES 
('bx_resources', 'bx_resources', 'bx_resources_reports', 'bx_resources_reports_track', '31536000', '1', 'page.php?i=view-resource&id={object_id}', '', 'bx_resources_entries', 'id', 'author', 'reports', '', '');

-- VIEWS
INSERT INTO `sys_objects_view` (`name`, `module`, `table_track`, `period`, `is_on`, `trigger_table`, `trigger_field_id`, `trigger_field_author`, `trigger_field_count`, `class_name`, `class_file`) VALUES 
('bx_resources', 'bx_resources', 'bx_resources_views_track', '86400', '1', 'bx_resources_entries', 'id', 'author', 'views', '', '');

-- CONTENT INFO
INSERT INTO `sys_objects_content_info` (`name`, `title`, `alert_unit`, `alert_action_add`, `alert_action_update`, `alert_action_delete`, `class_name`, `class_file`) VALUES
('bx_resources', '_bx_resources', 'bx_resources', 'added', 'edited', 'deleted', '', ''),
('bx_resources_cmts', '_bx_resources_cmts', 'bx_resources', 'commentPost', 'commentUpdated', 'commentRemoved', 'BxDolContentInfoCmts', '');

-- SEARCH EXTENDED
INSERT INTO `sys_objects_search_extended` (`object`, `object_content_info`, `module`, `title`, `active`, `class_name`, `class_file`) VALUES
('bx_resources', 'bx_resources', 'bx_resources', '_bx_resources_search_extended', 1, '', ''),
('bx_resources_cmts', 'bx_resources_cmts', 'bx_resources', '_bx_resources_search_extended_cmts', 1, 'BxTemplSearchExtendedCmts', '');

-- STUDIO: page & widget
INSERT INTO `sys_std_pages`(`index`, `name`, `header`, `caption`, `icon`) VALUES
(3, 'bx_resources', '_bx_resources', '_bx_resources', 'bx_resources@modules/boonex/resources/|std-icon.svg');
SET @iPageId = LAST_INSERT_ID();

SET @iParentPageId = (SELECT `id` FROM `sys_std_pages` WHERE `name` = 'home');
SET @iParentPageOrder = (SELECT MAX(`order`) FROM `sys_std_pages_widgets` WHERE `page_id` = @iParentPageId);
INSERT INTO `sys_std_widgets` (`page_id`, `module`, `type`, `url`, `click`, `icon`, `caption`, `cnt_notices`, `cnt_actions`) VALUES
(@iPageId, 'bx_resources', 'content', '{url_studio}module.php?name=bx_resources', '', 'bx_resources@modules/boonex/resources/|std-icon.svg', '_bx_resources', '', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_actions";s:6:"params";a:0:{}s:5:"class";s:18:"TemplStudioModules";}');
INSERT INTO `sys_std_pages_widgets` (`page_id`, `widget_id`, `order`) VALUES
(@iParentPageId, LAST_INSERT_ID(), IF(ISNULL(@iParentPageOrder), 1, @iParentPageOrder + 1));
