-- TABLE: entries
CREATE TABLE IF NOT EXISTS `bx_tasks_tasks` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `author` int(11) NOT NULL,
  `added` int(11) NOT NULL,
  `changed` int(11) NOT NULL,
  `published` int(11) NOT NULL,
  `thumb` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `stickers` int(11) NOT NULL default '0',
  `type` int(11) NOT NULL default '0',
  `priority` int(11) NOT NULL default '0',
  `estimate` int(11) NOT NULL default '0',
  `state` int(11) NOT NULL default '0',
  `cat` int(11) NOT NULL,
  `multicat` text NOT NULL,
  `text` mediumtext NOT NULL,
  `labels` text NOT NULL,
  `time` int(11) NOT NULL default '0',
  `views` int(11) NOT NULL default '0',
  `rate` float NOT NULL default '0',
  `votes` int(11) NOT NULL default '0',
  `rrate` float NOT NULL default '0',
  `rvotes` int(11) NOT NULL default '0',
  `score` int(11) NOT NULL default '0',
  `sc_up` int(11) NOT NULL default '0',
  `sc_down` int(11) NOT NULL default '0',
  `favorites` int(11) NOT NULL default '0',
  `comments` int(11) NOT NULL default '0',
  `reports` int(11) NOT NULL default '0',
  `featured` int(11) NOT NULL default '0',
  `due_date` int(11) NOT NULL,
  `tasks_list` int(11) NOT NULL,
  `gh_issue` int(11) NOT NULL default '0',
  `gh_issue_url` varchar(255) NOT NULL default '',
  `completed` tinyint(4) NOT NULL DEFAULT '0', 
  `expired` tinyint(4) NOT NULL DEFAULT '0', 
  `cf` int(11) NOT NULL default '1',
  `allow_view_to` varchar(16) NOT NULL DEFAULT '3',
  `allow_comments` tinyint(4) NOT NULL DEFAULT '1',
  `status` enum('active','awaiting','failed','hidden') NOT NULL DEFAULT 'active',
  `status_admin` enum('active','hidden','pending') NOT NULL DEFAULT 'active',
  PRIMARY KEY (`id`),
  FULLTEXT KEY `title_text` (`title`,`text`)
);

-- TABLE: task-lists
CREATE TABLE IF NOT EXISTS `bx_tasks_lists` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `context_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
);

-- TABLE: contexts
CREATE TABLE IF NOT EXISTS `bx_tasks_contexts` (
  `id` int(11) NOT NULL DEFAULT '0',
  `gh_app_id` int(11) NOT NULL DEFAULT '0',
  `gh_username` varchar(64) NOT NULL DEFAULT '',
  `gh_repository` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
);

-- TABLE: assignment
CREATE TABLE IF NOT EXISTS `bx_tasks_assignments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `initiator` int(11) NOT NULL,
  `content` int(11) NOT NULL,
  `added` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `initiator` (`initiator`,`content`),
  KEY `content` (`content`)
);

-- TABLE: lists and values
CREATE TABLE IF NOT EXISTS `bx_tasks_pre_lists` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(32) NOT NULL DEFAULT '',
  `title` varchar(255) NOT NULL DEFAULT '',
  `use_color` tinyint(4) unsigned NOT NULL DEFAULT '0',
  `use_multiselect` tinyint(4) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
);

INSERT INTO `bx_tasks_pre_lists` (`name`, `title`, `use_color`, `use_multiselect`) VALUES
('type', '_bx_tasks_pre_lists_types', 0, 0),
('sticker', '_bx_tasks_pre_lists_stickers', 1, 1);

CREATE TABLE IF NOT EXISTS `bx_tasks_pre_values` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `context_id` int(11) NOT NULL DEFAULT '0',
  `list` varchar(32) NOT NULL DEFAULT '',
  `value` varchar(255) NOT NULL DEFAULT '',
  `order` int(11) NOT NULL DEFAULT '0',
  `title` varchar(255) NOT NULL DEFAULT '',
  `color` varchar(128) NOT NULL DEFAULT '',
  `active` tinyint(4) NOT NULL DEFAULT '1', 
  PRIMARY KEY (`id`),
  UNIQUE KEY `list_value` (`list`, `value`(191))
);

-- TABLE: filters
CREATE TABLE IF NOT EXISTS `bx_tasks_filters` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `context_id` int(11) NOT NULL DEFAULT '0',
  `author` int(11) NOT NULL DEFAULT '0',
  `added` int(11) NOT NULL DEFAULT '0',
  `title` varchar(255) NOT NULL,
  `conditions` text NOT NULL,
  `permanent` TINYINT NOT NULL DEFAULT '0',
  `active` TINYINT NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
);

INSERT INTO `bx_tasks_filters` (`author`, `added`, `title`, `conditions`, `permanent`, `active`) VALUES
('0', '0', '_bx_tasks_filter_title_by_author', '{"where":{"cnd":true,"t":"te","f":"author","v":"{logged_pid}","o":"="}}', 1, 1), 
('0', '0', '_bx_tasks_filter_title_by_author_uncompleted', '{"where":{"grp":true,"o":"AND","cnds":[{"cnd":true,"t":"te","f":"author","v":"{logged_pid}","o":"="},{"cnd":true,"t":"te","f":"completed","v":"0","o":"="}]}}', 1, 1),
('0', '0', '_bx_tasks_filter_title_by_author_completed', '{"where":{"grp":true,"o":"AND","cnds":[{"cnd":true,"t":"te","f":"author","v":"{logged_pid}","o":"="},{"cnd":true,"t":"te","f":"completed","v":"1","o":"="}]}}', 1, 1),
('0', '0', '_bx_tasks_filter_title_by_assignee', '{"join":{"cnd":true,"j":"LEFT","tj":"bx_tasks_assignments","taj":"ta","fj":"content","tam":"te","fm":"id"},"where":{"cnd":true,"t":"ta","f":"initiator","v":"{logged_pid}","o":"="}}', 1, 1),
('0', '0', '_bx_tasks_filter_title_by_assignee_uncompleted', '{"join":{"cnd":true,"j":"LEFT","tj":"bx_tasks_assignments","taj":"ta","fj":"content","tam":"te","fm":"id"},"where":{"grp":true,"o":"AND","cnds":[{"cnd":true,"t":"ta","f":"initiator","v":"{logged_pid}","o":"="},{"cnd":true,"t":"te","f":"completed","v":"0","o":"="}]}}', 1, 1),
('0', '0', '_bx_tasks_filter_title_by_assignee_completed', '{"join":{"cnd":true,"j":"LEFT","tj":"bx_tasks_assignments","taj":"ta","fj":"content","tam":"te","fm":"id"},"where":{"grp":true,"o":"AND","cnds":[{"cnd":true,"t":"ta","f":"initiator","v":"{logged_pid}","o":"="},{"cnd":true,"t":"te","f":"completed","v":"1","o":"="}]}}', 1, 1);

-- TABLE: storages & transcoders
CREATE TABLE IF NOT EXISTS `bx_tasks_covers` (
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

CREATE TABLE IF NOT EXISTS `bx_tasks_files` (
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

CREATE TABLE IF NOT EXISTS `bx_tasks_photos` (
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

CREATE TABLE IF NOT EXISTS `bx_tasks_photos_resized` (
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

CREATE TABLE IF NOT EXISTS `bx_tasks_videos` (
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

CREATE TABLE IF NOT EXISTS `bx_tasks_videos_resized` (
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
CREATE TABLE IF NOT EXISTS `bx_tasks_cmts` (
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

CREATE TABLE IF NOT EXISTS `bx_tasks_cmts_notes` (
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
  PRIMARY KEY (`cmt_id`),
  KEY `cmt_object_id` (`cmt_object_id`,`cmt_parent_id`),
  FULLTEXT KEY `search_fields` (`cmt_text`)
);

-- TABLE: votes
CREATE TABLE IF NOT EXISTS `bx_tasks_votes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `count` int(11) NOT NULL default '0',
  `sum` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `object_id` (`object_id`)
);

CREATE TABLE IF NOT EXISTS `bx_tasks_votes_track` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `author_id` int(11) NOT NULL default '0',
  `author_nip` int(11) unsigned NOT NULL default '0',
  `value` tinyint(4) NOT NULL default '0',
  `date` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  KEY `vote` (`object_id`, `author_nip`)
);

CREATE TABLE IF NOT EXISTS `bx_tasks_reactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `reaction` varchar(32) NOT NULL default '',
  `count` int(11) NOT NULL default '0',
  `sum` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `reaction` (`object_id`, `reaction`)
);

CREATE TABLE IF NOT EXISTS `bx_tasks_reactions_track` (
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
CREATE TABLE `bx_tasks_views_track` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `viewer_id` int(11) NOT NULL default '0',
  `viewer_nip` int(11) unsigned NOT NULL default '0',
  `date` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  KEY `id` (`object_id`,`viewer_id`,`viewer_nip`)
);

-- TABLE: metas
CREATE TABLE `bx_tasks_meta_keywords` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(10) unsigned NOT NULL,
  `keyword` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `object_id` (`object_id`),
  KEY `keyword` (`keyword`)
);

CREATE TABLE `bx_tasks_meta_mentions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(10) unsigned NOT NULL,
  `profile_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `object_id` (`object_id`),
  KEY `profile_id` (`profile_id`)
);

-- TABLE: reports
CREATE TABLE IF NOT EXISTS `bx_tasks_reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `count` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `object_id` (`object_id`)
);

CREATE TABLE IF NOT EXISTS `bx_tasks_reports_track` (
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

-- TABLE: time
CREATE TABLE IF NOT EXISTS `bx_tasks_time` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `count` int(11) NOT NULL default '0',
  `sum` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `object_id` (`object_id`)
);

CREATE TABLE IF NOT EXISTS `bx_tasks_time_track` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `author_id` int(11) NOT NULL default '0',
  `author_nip` int(11) unsigned NOT NULL default '0',
  `value` int(11) NOT NULL default '0',
  `value_date` int(11) NOT NULL default '0',
  `text` text NOT NULL default '',
  `date` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`)
);

-- TABLE: timers
CREATE TABLE IF NOT EXISTS `bx_tasks_timers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `content_id` int(11) NOT NULL default '0',
  `profile_id` int(11) NOT NULL default '0',
  `started` int(11) NOT NULL default '0',
  `duration` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `timer` (`content_id`, `profile_id`)
);

-- TABLE: favorites
CREATE TABLE `bx_tasks_favorites_track` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `author_id` int(11) NOT NULL default '0',
  `date` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  KEY `id` (`object_id`,`author_id`)
);

-- TABLE: scores
CREATE TABLE IF NOT EXISTS `bx_tasks_scores` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `count_up` int(11) NOT NULL default '0',
  `count_down` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `object_id` (`object_id`)
);

CREATE TABLE IF NOT EXISTS `bx_tasks_scores_track` (
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
('bx_tasks_covers', @sStorageEngine, '', 360, 2592000, 3, 'bx_tasks_covers', 'allow-deny', '{image}', '', 0, 0, 0, 0, 0, 0),

('bx_tasks_photos', @sStorageEngine, '', 360, 2592000, 3, 'bx_tasks_photos', 'allow-deny', '{image}', '', 0, 0, 0, 0, 0, 0),
('bx_tasks_photos_resized', @sStorageEngine, '', 360, 2592000, 3, 'bx_tasks_photos_resized', 'allow-deny', '{image}', '', 0, 0, 0, 0, 0, 0),

('bx_tasks_videos', @sStorageEngine, '', 360, 2592000, 3, 'bx_tasks_videos', 'allow-deny', '{video}', '', 0, 0, 0, 0, 0, 0),
('bx_tasks_videos_resized', @sStorageEngine, '', 360, 2592000, 3, 'bx_tasks_videos_resized', 'allow-deny', '{imagevideo}', '', 0, 0, 0, 0, 0, 0),

('bx_tasks_files', @sStorageEngine, '', 360, 2592000, 3, 'bx_tasks_files', 'deny-allow', '', '{dangerous}', 0, 0, 0, 0, 0, 0);

INSERT INTO `sys_objects_transcoder` (`object`, `storage_object`, `source_type`, `source_params`, `private`, `atime_tracking`, `atime_pruning`, `ts`, `override_class_name`, `override_class_file`) VALUES 
('bx_tasks_preview', 'bx_tasks_photos_resized', 'Storage', 'a:1:{s:6:"object";s:15:"bx_tasks_covers";}', 'no', '1', '2592000', '0', '', ''),
('bx_tasks_gallery', 'bx_tasks_photos_resized', 'Storage', 'a:1:{s:6:"object";s:15:"bx_tasks_covers";}', 'no', '1', '2592000', '0', '', ''),
('bx_tasks_cover', 'bx_tasks_photos_resized', 'Storage', 'a:1:{s:6:"object";s:15:"bx_tasks_covers";}', 'no', '1', '2592000', '0', '', ''),

('bx_tasks_preview_photos', 'bx_tasks_photos_resized', 'Storage', 'a:1:{s:6:"object";s:15:"bx_tasks_photos";}', 'no', '1', '2592000', '0', '', ''),
('bx_tasks_gallery_photos', 'bx_tasks_photos_resized', 'Storage', 'a:1:{s:6:"object";s:15:"bx_tasks_photos";}', 'no', '1', '2592000', '0', '', ''),

('bx_tasks_videos_poster', 'bx_tasks_videos_resized', 'Storage', 'a:1:{s:6:"object";s:15:"bx_tasks_videos";}', 'no', '0', '0', '0', 'BxDolTranscoderVideo', ''),
('bx_tasks_videos_poster_preview', 'bx_tasks_videos_resized', 'Storage', 'a:1:{s:6:"object";s:15:"bx_tasks_videos";}', 'no', '0', '0', '0', 'BxDolTranscoderVideo', ''),
('bx_tasks_videos_mp4', 'bx_tasks_videos_resized', 'Storage', 'a:1:{s:6:"object";s:15:"bx_tasks_videos";}', 'no', '0', '0', '0', 'BxDolTranscoderVideo', ''),
('bx_tasks_videos_mp4_hd', 'bx_tasks_videos_resized', 'Storage', 'a:1:{s:6:"object";s:15:"bx_tasks_videos";}', 'no', '0', '0', '0', 'BxDolTranscoderVideo', ''),

('bx_tasks_preview_files', 'bx_tasks_photos_resized', 'Storage', 'a:1:{s:6:"object";s:14:"bx_tasks_files";}', 'no', '1', '2592000', '0', '', ''),
('bx_tasks_gallery_files', 'bx_tasks_photos_resized', 'Storage', 'a:1:{s:6:"object";s:14:"bx_tasks_files";}', 'no', '1', '2592000', '0', '', '');

INSERT INTO `sys_transcoder_filters` (`transcoder_object`, `filter`, `filter_params`, `order`) VALUES 
('bx_tasks_preview', 'Resize', 'a:3:{s:1:"w";s:3:"300";s:1:"h";s:3:"200";s:11:"crop_resize";s:1:"1";}', '0'),
('bx_tasks_gallery', 'Resize', 'a:1:{s:1:"w";s:3:"500";}', '0'),
('bx_tasks_cover', 'Resize', 'a:1:{s:1:"w";s:4:"1200";}', '0'),

('bx_tasks_preview_photos', 'Resize', 'a:3:{s:1:"w";s:3:"300";s:1:"h";s:3:"200";s:11:"crop_resize";s:1:"1";}', '0'),
('bx_tasks_gallery_photos', 'Resize', 'a:1:{s:1:"w";s:4:"1200";}', '0'),

('bx_tasks_videos_poster_preview', 'Resize', 'a:3:{s:1:"w";s:3:"300";s:1:"h";s:3:"200";s:13:"square_resize";s:1:"1";}', 10),
('bx_tasks_videos_poster_preview', 'Poster', 'a:2:{s:1:"h";s:3:"480";s:10:"force_type";s:3:"jpg";}', 0),
('bx_tasks_videos_poster', 'Poster', 'a:2:{s:1:"h";s:3:"318";s:10:"force_type";s:3:"jpg";}', 0),
('bx_tasks_videos_mp4', 'Mp4', 'a:2:{s:1:"h";s:3:"318";s:10:"force_type";s:3:"mp4";}', 0),
('bx_tasks_videos_mp4_hd', 'Mp4', 'a:3:{s:1:"h";s:3:"720";s:13:"video_bitrate";s:4:"1536";s:10:"force_type";s:3:"mp4";}', 0),

('bx_tasks_preview_files', 'Resize', 'a:3:{s:1:"w";s:3:"300";s:1:"h";s:3:"200";s:11:"crop_resize";s:1:"1";}', '0'),
('bx_tasks_gallery_files', 'Resize', 'a:1:{s:1:"w";s:3:"500";}', '0');


-- FORMS: entry (task)
INSERT INTO `sys_objects_form`(`object`, `module`, `title`, `action`, `form_attrs`, `table`, `key`, `uri`, `uri_title`, `submit_name`, `params`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_tasks', 'bx_tasks', '_bx_tasks_form_entry', '', 'a:1:{s:7:"enctype";s:19:"multipart/form-data";}', 'bx_tasks_tasks', 'id', '', '', 'a:2:{i:0;s:9:"do_submit";i:1;s:10:"do_publish";}', '', 0, 1, 'BxTasksFormEntry', 'modules/boonex/tasks/classes/BxTasksFormEntry.php');

INSERT INTO `sys_form_displays`(`object`, `display_name`, `module`, `view_mode`, `title`) VALUES 
('bx_tasks', 'bx_tasks_entry_add', 'bx_tasks', 0, '_bx_tasks_form_entry_display_add'),
('bx_tasks', 'bx_tasks_entry_delete', 'bx_tasks', 0, '_bx_tasks_form_entry_display_delete'),
('bx_tasks', 'bx_tasks_entry_edit', 'bx_tasks', 0, '_bx_tasks_form_entry_display_edit'),
('bx_tasks', 'bx_tasks_entry_edit_body', 'bx_tasks', 0, '_bx_tasks_form_entry_display_edit_body'),
('bx_tasks', 'bx_tasks_entry_edit_tasks_list', 'bx_tasks', 0, '_bx_tasks_form_entry_display_edit_tasks_list'),
('bx_tasks', 'bx_tasks_entry_edit_type', 'bx_tasks', 0, '_bx_tasks_form_entry_display_edit_type'),
('bx_tasks', 'bx_tasks_entry_edit_priority', 'bx_tasks', 0, '_bx_tasks_form_entry_display_edit_priority'),
('bx_tasks', 'bx_tasks_entry_edit_estimate', 'bx_tasks', 0, '_bx_tasks_form_entry_display_edit_estimate'),
('bx_tasks', 'bx_tasks_entry_edit_due_date', 'bx_tasks', 0, '_bx_tasks_form_entry_display_edit_due_date'),
('bx_tasks', 'bx_tasks_entry_edit_state', 'bx_tasks', 0, '_bx_tasks_form_entry_display_edit_state'),
('bx_tasks', 'bx_tasks_entry_view', 'bx_tasks', 1, '_bx_tasks_form_entry_display_view');

INSERT INTO `sys_form_inputs`(`object`, `module`, `name`, `value`, `values`, `checked`, `type`, `caption_system`, `caption`, `info`, `required`, `collapsed`, `html`, `attrs`, `attrs_tr`, `attrs_wrapper`, `checker_func`, `checker_params`, `checker_error`, `db_pass`, `db_params`, `editable`, `deletable`) VALUES 
('bx_tasks', 'bx_tasks', 'cf', '1', '#!sys_content_filter', 0, 'select', '_sys_form_entry_input_sys_cf', '_sys_form_entry_input_cf', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 1, 0),
('bx_tasks', 'bx_tasks', 'tasks_list', '', '', 0, 'select', '_bx_tasks_form_entry_input_sys_tasks_list', '_bx_tasks_form_entry_input_tasks_list', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 1, 0),
('bx_tasks', 'bx_tasks', 'allow_view_to', '', '', 0, 'custom', '_bx_tasks_form_entry_input_sys_allow_view_to', '_bx_tasks_form_entry_input_allow_view_to', '', 1, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_tasks', 'bx_tasks', 'delete_confirm', 1, '', 0, 'checkbox', '_bx_tasks_form_entry_input_sys_delete_confirm', '_bx_tasks_form_entry_input_delete_confirm', '_bx_tasks_form_entry_input_delete_confirm_info', 1, 0, 0, '', '', '', 'Avail', '', '_bx_tasks_form_entry_input_delete_confirm_error', '', '', 1, 0),
('bx_tasks', 'bx_tasks', 'do_publish', '_bx_tasks_form_entry_input_do_publish', '', 0, 'submit', '_bx_tasks_form_entry_input_sys_do_publish', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_tasks', 'bx_tasks', 'do_submit', '_bx_tasks_form_entry_input_do_submit', '', 0, 'submit', '_bx_tasks_form_entry_input_sys_do_submit', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_tasks', 'bx_tasks', 'do_cancel', '_bx_tasks_form_entry_input_do_cancel', '', 0, 'button', '_bx_tasks_form_entry_input_sys_do_cancel', '', '', 0, 0, 0, 'a:2:{s:7:"onclick";s:45:"$(''.bx-popup-applied:visible'').dolPopupHide()";s:5:"class";s:22:"bx-def-margin-sec-left";}', '', '', '', '', '', '', '', 1, 0),
('bx_tasks', 'bx_tasks', 'do_cancel_edit', '_bx_tasks_form_entry_input_do_cancel_edit', '', 0, 'button', '_bx_tasks_form_entry_input_sys_do_cancel_edit', '', '', 0, 0, 0, 'a:2:{s:7:"onclick";s:41:"window.open(''{edit_cancel_url}'', ''_self'')";s:5:"class";s:22:"bx-def-margin-sec-left";}', '', '', '', '', '', '', '', 0, 0),
('bx_tasks', 'bx_tasks', 'controls', '', 'do_publish,do_cancel', 0, 'input_set', '_bx_tasks_form_entry_input_sys_controls', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_tasks', 'bx_tasks', 'controls_edit', '', 'do_submit,do_cancel_edit', 0, 'input_set', '_bx_tasks_form_entry_input_sys_controls_edit', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_tasks', 'bx_tasks', 'controls_edit_popup', '', 'do_submit,do_cancel', 0, 'input_set', '_bx_tasks_form_entry_input_sys_controls_edit_popup', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_tasks', 'bx_tasks', 'covers', 'a:1:{i:0;s:14:"bx_tasks_html5";}', 'a:1:{s:14:"bx_tasks_html5";s:25:"_sys_uploader_html5_title";}', 0, 'files', '_bx_tasks_form_entry_input_sys_covers', '_bx_tasks_form_entry_input_covers', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_tasks', 'bx_tasks', 'pictures', 'a:1:{i:0;s:21:"bx_tasks_photos_html5";}', 'a:1:{s:21:"bx_tasks_photos_html5";s:25:"_sys_uploader_html5_title";}', 0, 'files', '_bx_tasks_form_entry_input_sys_pictures', '_bx_tasks_form_entry_input_pictures', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_tasks', 'bx_tasks', 'videos', 'a:2:{i:0;s:21:"bx_tasks_videos_html5";i:1;s:28:"bx_tasks_videos_record_video";}', 'a:2:{s:21:"bx_tasks_videos_html5";s:25:"_sys_uploader_html5_title";s:28:"bx_tasks_videos_record_video";s:32:"_sys_uploader_record_video_title";}', 0, 'files', '_bx_tasks_form_entry_input_sys_videos', '_bx_tasks_form_entry_input_videos', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_tasks', 'bx_tasks', 'files', 'a:1:{i:0;s:20:"bx_tasks_files_html5";}', 'a:1:{s:20:"bx_tasks_files_html5";s:25:"_sys_uploader_html5_title";}', 0, 'files', '_bx_tasks_form_entry_input_sys_files', '_bx_tasks_form_entry_input_files', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_tasks', 'bx_tasks', 'text', '', '', 0, 'textarea', '_bx_tasks_form_entry_input_sys_text', '_bx_tasks_form_entry_input_text', '', 0, 0, 2, '', '', '', '', '', '', 'XssHtml', '', 1, 0),
('bx_tasks', 'bx_tasks', 'title', '', '', 0, 'text', '_bx_tasks_form_entry_input_sys_title', '_bx_tasks_form_entry_input_title', '', 1, 0, 0, '', '', '', 'Length', 'a:2:{s:3:"min";i:3;s:3:"max";i:160;}', '_bx_tasks_form_entry_input_title_err', 'Xss', '', 1, 0),
('bx_tasks', 'bx_tasks', 'stickers', '', '#!bx_tasks_stickers', 0, 'checkbox_set', '_bx_tasks_form_entry_input_sys_stickers', '_bx_tasks_form_entry_input_stickers', '', 0, 0, 0, '', '', '', '', '', '', 'Set', '', 1, 0),
('bx_tasks', 'bx_tasks', 'type', '', '#!bx_tasks_types', 0, 'select', '_bx_tasks_form_entry_input_sys_type', '_bx_tasks_form_entry_input_type', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 1, 0),
('bx_tasks', 'bx_tasks', 'priority', '', '#!bx_tasks_priorities', 0, 'select', '_bx_tasks_form_entry_input_sys_priority', '_bx_tasks_form_entry_input_priority', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 1, 0),
('bx_tasks', 'bx_tasks', 'state', '', '#!bx_tasks_states', 0, 'select', '_bx_tasks_form_entry_input_sys_state', '_bx_tasks_form_entry_input_state', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 1, 0),
('bx_tasks', 'bx_tasks', 'cat', '', '#!bx_tasks_cats', 0, 'select', '_bx_tasks_form_entry_input_sys_cat', '_bx_tasks_form_entry_input_cat', '', 1, 0, 0, '', '', '', 'avail', '', '_bx_tasks_form_entry_input_cat_err', 'Xss', '', 1, 0),
('bx_tasks', 'bx_tasks', 'multicat', '', '', 0, 'custom', '_bx_tasks_form_entry_input_sys_multicat', '_bx_tasks_form_entry_input_multicat', '', 1, 0, 0, '', '', '', 'avail', '', '_bx_tasks_form_entry_input_multicat_err', 'Xss', '', 1, 0),
('bx_tasks', 'bx_tasks', 'added', '', '', 0, 'datetime', '_bx_tasks_form_entry_input_sys_date_added', '_bx_tasks_form_entry_input_date_added', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_tasks', 'bx_tasks', 'changed', '', '', 0, 'datetime', '_bx_tasks_form_entry_input_sys_date_changed', '_bx_tasks_form_entry_input_date_changed', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_tasks', 'bx_tasks', 'published', '', '', 0, 'datetime', '_bx_tasks_form_entry_input_sys_date_published', '_bx_tasks_form_entry_input_date_published', '_bx_tasks_form_entry_input_date_published_info', 0, 0, 0, '', '', '', '', '', '', 'DateTimeTs', '', 1, 0),
('bx_tasks', 'bx_tasks', 'initial_members', '', '', 0, 'custom', '_bx_tasks_form_entry_input_sys_initial_members', '_bx_tasks_form_entry_input_initial_members', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 1),
('bx_tasks', 'bx_tasks', 'estimate', '', '#!bx_tasks_estimates', 0, 'select', '_bx_tasks_form_entry_input_sys_estimate', '_bx_tasks_form_entry_input_estimate', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 1, 0),
('bx_tasks', 'bx_tasks', 'due_date', '', '', 0, 'datepicker', '_bx_tasks_form_entry_input_sys_date_due_date', '_bx_tasks_form_entry_input_date_due_date', '', 0, 0, 0, '', '', '', '', '', '', 'DateTimeUtc', '', 1, 0),
('bx_tasks', 'bx_tasks', 'attachments', '', '', 0, 'custom', '_bx_tasks_form_entry_input_sys_attachments', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_tasks', 'bx_tasks', 'labels', '', '', 0, 'custom', '_sys_form_input_sys_labels', '_sys_form_input_labels', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_tasks', 'bx_tasks', 'anonymous', '', '', 0, 'switcher', '_sys_form_input_sys_anonymous', '_sys_form_input_anonymous', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_tasks', 'bx_tasks', 'allow_comments', '1', '', 1, 'switcher', '_bx_tasks_form_entry_input_sys_allow_comments', '_bx_tasks_form_entry_input_allow_comments', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 1, 0),
('bx_tasks', 'bx_tasks', 'gh_issue_url', '', '', 0, 'value', '_bx_tasks_form_entry_input_sys_gh_issue_url', '_bx_tasks_form_entry_input_gh_issue_url', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 1, 0);

INSERT INTO `sys_form_display_inputs`(`display_name`, `input_name`, `visible_for_levels`, `active`, `order`) VALUES 
('bx_tasks_entry_add', 'title', 2147483647, 1, 1),
('bx_tasks_entry_add', 'text', 2147483647, 1, 2),
('bx_tasks_entry_add', 'type', 2147483647, 1, 3),
('bx_tasks_entry_add', 'priority', 2147483647, 1, 4),
('bx_tasks_entry_add', 'estimate', 2147483647, 1, 5),
('bx_tasks_entry_add', 'initial_members', 192, 1, 6),
('bx_tasks_entry_add', 'due_date', 192, 1, 7),
('bx_tasks_entry_add', 'stickers', 2147483647, 1, 8),
('bx_tasks_entry_add', 'controls', 2147483647, 1, 9),
('bx_tasks_entry_add', 'do_publish', 2147483647, 1, 10),
('bx_tasks_entry_add', 'do_cancel', 2147483647, 1, 11),

('bx_tasks_entry_delete', 'delete_confirm', 2147483647, 1, 1),
('bx_tasks_entry_delete', 'do_submit', 2147483647, 1, 2),

('bx_tasks_entry_edit', 'title', 2147483647, 1, 1),
('bx_tasks_entry_edit', 'text', 2147483647, 1, 2),
('bx_tasks_entry_edit', 'attachments', 2147483647, 1, 3),
('bx_tasks_entry_edit', 'pictures', 2147483647, 1, 4),
('bx_tasks_entry_edit', 'videos', 2147483647, 1, 5),
('bx_tasks_entry_edit', 'files', 2147483647, 1, 6),
('bx_tasks_entry_edit', 'allow_view_to', 2147483647, 1, 7),
('bx_tasks_entry_edit', 'cf', 2147483647, 1, 8),
('bx_tasks_entry_edit', 'initial_members', 192, 1, 9),
('bx_tasks_entry_edit', 'due_date', 192, 1, 10),
('bx_tasks_entry_edit', 'stickers', 2147483647, 1, 11),
('bx_tasks_entry_edit', 'type', 2147483647, 1, 12),
('bx_tasks_entry_edit', 'priority', 2147483647, 1, 13),
('bx_tasks_entry_edit', 'estimate', 2147483647, 1, 14),
('bx_tasks_entry_edit', 'controls_edit', 2147483647, 1, 15),
('bx_tasks_entry_edit', 'do_submit', 2147483647, 1, 16),
('bx_tasks_entry_edit', 'do_cancel_edit', 2147483647, 1, 17),

('bx_tasks_entry_edit_body', 'title', 2147483647, 1, 1),
('bx_tasks_entry_edit_body', 'text', 2147483647, 1, 2),
('bx_tasks_entry_edit_body', 'do_submit', 2147483647, 1, 3),

('bx_tasks_entry_edit_tasks_list', 'tasks_list', 2147483647, 1, 1),
('bx_tasks_entry_edit_tasks_list', 'controls_edit_popup', 2147483647, 1, 2),
('bx_tasks_entry_edit_tasks_list', 'do_submit', 2147483647, 1, 3),
('bx_tasks_entry_edit_tasks_list', 'do_cancel', 2147483647, 1, 4),

('bx_tasks_entry_edit_state', 'state', 2147483647, 1, 1),
('bx_tasks_entry_edit_state', 'controls_edit_popup', 2147483647, 1, 2),
('bx_tasks_entry_edit_state', 'do_submit', 2147483647, 1, 3),
('bx_tasks_entry_edit_state', 'do_cancel', 2147483647, 1, 4),

('bx_tasks_entry_edit_type', 'type', 2147483647, 1, 1),
('bx_tasks_entry_edit_type', 'controls_edit_popup', 2147483647, 1, 2),
('bx_tasks_entry_edit_type', 'do_submit', 2147483647, 1, 3),
('bx_tasks_entry_edit_type', 'do_cancel', 2147483647, 1, 4),

('bx_tasks_entry_edit_priority', 'priority', 2147483647, 1, 1),
('bx_tasks_entry_edit_priority', 'controls_edit_popup', 2147483647, 1, 2),
('bx_tasks_entry_edit_priority', 'do_submit', 2147483647, 1, 3),
('bx_tasks_entry_edit_priority', 'do_cancel', 2147483647, 1, 4),

('bx_tasks_entry_edit_estimate', 'estimate', 2147483647, 1, 1),
('bx_tasks_entry_edit_estimate', 'controls_edit_popup', 2147483647, 1, 2),
('bx_tasks_entry_edit_estimate', 'do_submit', 2147483647, 1, 3),
('bx_tasks_entry_edit_estimate', 'do_cancel', 2147483647, 1, 4),

('bx_tasks_entry_edit_due_date', 'due_date', 192, 1, 1),
('bx_tasks_entry_edit_due_date', 'controls_edit_popup', 2147483647, 1, 2),
('bx_tasks_entry_edit_due_date', 'do_submit', 2147483647, 1, 3),
('bx_tasks_entry_edit_due_date', 'do_cancel', 2147483647, 1, 4),

('bx_tasks_entry_view', 'tasks_list', 2147483647, 1, 0),
('bx_tasks_entry_view', 'stickers', 2147483647, 1, 1),
('bx_tasks_entry_view', 'type', 2147483647, 1, 2),
('bx_tasks_entry_view', 'priority', 2147483647, 1, 3),
('bx_tasks_entry_view', 'estimate', 2147483647, 1, 4),
('bx_tasks_entry_view', 'cat', 2147483647, 1, 5),
('bx_tasks_entry_view', 'added', 2147483647, 1, 6),
('bx_tasks_entry_view', 'changed', 2147483647, 1, 7),
('bx_tasks_entry_view', 'due_date', 192, 1, 8),
('bx_tasks_entry_view', 'state', 2147483647, 1, 9),
('bx_tasks_entry_view', 'gh_issue_url', 2147483647, 1, 10);


-- FORMS: entry (tasklist)
INSERT INTO `sys_objects_form`(`object`, `module`, `title`, `action`, `form_attrs`, `table`, `key`, `uri`, `uri_title`, `submit_name`, `params`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_tasks_list', 'bx_tasks', '_bx_tasks_form_list_entry', '', 'a:1:{s:7:"enctype";s:19:"multipart/form-data";}', 'bx_tasks_lists', 'id', '', '', 'do_submit', '', 0, 1, 'BxTasksFormListEntry', 'modules/boonex/tasks/classes/BxTasksFormListEntry.php');

INSERT INTO `sys_form_displays`(`object`, `display_name`, `module`, `view_mode`, `title`) VALUES 
('bx_tasks_list', 'bx_tasks_list_entry_add', 'bx_tasks', 0, '_bx_tasks_form_list_entry_display_add'),
('bx_tasks_list', 'bx_tasks_list_entry_edit', 'bx_tasks', 0, '_bx_tasks_form_list_entry_display_edit');

INSERT INTO `sys_form_inputs`(`object`, `module`, `name`, `value`, `values`, `checked`, `type`, `caption_system`, `caption`, `info`, `required`, `collapsed`, `html`, `attrs`, `attrs_tr`, `attrs_wrapper`, `checker_func`, `checker_params`, `checker_error`, `db_pass`, `db_params`, `editable`, `deletable`) VALUES 
('bx_tasks_list', 'bx_tasks', 'do_submit', '_bx_tasks_form_list_entry_input_do_submit', '', 0, 'submit', '_bx_tasks_form_list_entry_input_sys_do_submit', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_tasks_list', 'bx_tasks', 'title', '', '', 0, 'text', '_bx_tasks_form_list_entry_input_sys_title', '_bx_tasks_form_list_entry_input_title', '', 1, 0, 0, '', '', '', 'Length', 'a:2:{s:3:"min";i:3;s:3:"max";i:160;}', '_bx_tasks_form_list_entry_input_title_err', 'Xss', '', 1, 0),
('bx_tasks_list', 'bx_tasks', 'do_cancel', '_bx_tasks_form_entry_input_do_cancel', '', 0, 'button', '_bx_tasks_form_entry_input_sys_do_cancel', '', '', 0, 0, 0, 'a:2:{s:7:"onclick";s:45:"$(''.bx-popup-applied:visible'').dolPopupHide()";s:5:"class";s:22:"bx-def-margin-sec-left";}', '', '', '', '', '', '', '', 1, 0),
('bx_tasks_list', 'bx_tasks', 'controls', '', 'do_submit,do_cancel', 0, 'input_set', '', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0);

INSERT INTO `sys_form_display_inputs`(`display_name`, `input_name`, `visible_for_levels`, `active`, `order`) VALUES 
('bx_tasks_list_entry_add', 'title', 2147483647, 1, 1),
('bx_tasks_list_entry_add', 'controls', 2147483647, 1, 2),
('bx_tasks_list_entry_add', 'do_submit', 2147483647, 1, 3),
('bx_tasks_list_entry_add', 'do_cancel', 2147483647, 1, 4),

('bx_tasks_list_entry_edit', 'title', 2147483647, 1, 1),
('bx_tasks_list_entry_edit', 'controls', 2147483647, 1, 2),
('bx_tasks_list_entry_edit', 'do_submit', 2147483647, 1, 3),
('bx_tasks_list_entry_edit', 'do_cancel', 2147483647, 1, 4);

-- FORMS: context
INSERT INTO `sys_objects_form` (`object`, `module`, `title`, `action`, `form_attrs`, `submit_name`, `table`, `key`, `uri`, `uri_title`, `params`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES
('bx_tasks_context', 'bx_tasks', '_bx_tasks_form_context', '', '', 'do_submit', 'bx_tasks_contexts', 'id', '', '', '', 0, 1, 'BxTasksFormContext', 'modules/boonex/tasks/classes/BxTasksFormContext.php');

INSERT INTO `sys_form_displays` (`display_name`, `module`, `object`, `title`, `view_mode`) VALUES
('bx_tasks_context_edit', 'bx_tasks', 'bx_tasks_context', '_bx_tasks_form_display_context_edit', 0);

INSERT INTO `sys_form_inputs` (`object`, `module`, `name`, `value`, `values`, `checked`, `type`, `caption_system`, `caption`, `info`, `required`, `collapsed`, `html`, `attrs`, `attrs_tr`, `attrs_wrapper`, `checker_func`, `checker_params`, `checker_error`, `db_pass`, `db_params`, `editable`, `deletable`) VALUES
('bx_tasks_context', 'bx_tasks', 'gh_app_id', '', '', 0, 'select', '_bx_tasks_form_context_input_sys_gh_app_id', '_bx_tasks_form_context_input_gh_app_id', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('bx_tasks_context', 'bx_tasks', 'gh_username', '', '', 0, 'text', '_bx_tasks_form_context_input_sys_gh_username', '_bx_tasks_form_context_input_gh_username', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_tasks_context', 'bx_tasks', 'gh_repository', '', '', 0, 'text', '_bx_tasks_form_context_input_sys_gh_repository', '_bx_tasks_form_context_input_gh_repository', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_tasks_context', 'bx_tasks', 'do_submit', '_bx_tasks_form_context_input_do_submit', '', 0, 'submit', '_bx_tasks_form_context_input_sys_do_submit', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_tasks_context', 'bx_tasks', 'do_cancel', '_bx_tasks_form_context_input_do_cancel', '', 0, 'button', '_bx_tasks_form_context_input_sys_do_cancel', '', '', 0, 0, 0, 'a:2:{s:7:"onclick";s:45:"$(''.bx-popup-applied:visible'').dolPopupHide()";s:5:"class";s:22:"bx-def-margin-sec-left";}', '', '', '', '', '', '', '', 1, 0),
('bx_tasks_context', 'bx_tasks', 'controls', '', 'do_submit,do_cancel', 0, 'input_set', '_bx_tasks_form_context_input_sys_controls', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0);

INSERT INTO `sys_form_display_inputs` (`display_name`, `input_name`, `visible_for_levels`, `active`, `order`) VALUES
('bx_tasks_context_edit', 'gh_username', 2147483647, 1, 1),
('bx_tasks_context_edit', 'gh_repository', 2147483647, 1, 2),
('bx_tasks_context_edit', 'gh_app_id', 2147483647, 1, 3),
('bx_tasks_context_edit', 'do_submit', 2147483647, 1, 4);

-- FORMS: time
INSERT INTO `sys_objects_form` (`object`, `module`, `title`, `action`, `form_attrs`, `submit_name`, `table`, `key`, `uri`, `uri_title`, `params`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES
('bx_tasks_time', 'bx_tasks', '_bx_tasks_form_time', 'report.php', 'a:3:{s:2:"id";s:0:"";s:4:"name";s:0:"";s:5:"class";s:17:"bx-report-do-form";}', 'submit', '', 'id', '', '', '', 0, 1, 'BxTasksFormTime', 'modules/boonex/tasks/classes/BxTasksFormTime.php');

INSERT INTO `sys_form_displays` (`display_name`, `module`, `object`, `title`, `view_mode`) VALUES
('bx_tasks_time_add', 'bx_tasks', 'bx_tasks_time', '_bx_tasks_form_display_time_add', 0),
('bx_tasks_time_edit', 'bx_tasks', 'bx_tasks_time', '_bx_tasks_form_display_time_edit', 0);

INSERT INTO `sys_form_inputs` (`object`, `module`, `name`, `value`, `values`, `checked`, `type`, `caption_system`, `caption`, `info`, `required`, `collapsed`, `html`, `attrs`, `attrs_tr`, `attrs_wrapper`, `checker_func`, `checker_params`, `checker_error`, `db_pass`, `db_params`, `editable`, `deletable`) VALUES
('bx_tasks_time', 'bx_tasks', 'sys', '', '', 0, 'hidden', '_bx_tasks_form_time_input_sys_sys', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_tasks_time', 'bx_tasks', 'object_id', '', '', 0, 'hidden', '_bx_tasks_form_time_input_sys_object_id', '_bx_tasks_form_time_input_object_id', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 0, 0),
('bx_tasks_time', 'bx_tasks', 'action', '', '', 0, 'hidden', '_bx_tasks_form_time_input_sys_action', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_tasks_time', 'bx_tasks', 'value', '', 'value_h,value_div,value_m', 0, 'input_set', '_bx_tasks_form_time_input_sys_value', '_bx_tasks_form_time_input_value', '', 1, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_tasks_time', 'bx_tasks', 'value_h', '', '', 0, 'text', '_bx_tasks_form_time_input_sys_value_h', '', '', 0, 0, 0, 'a:1:{s:11:"placeholder";s:45:"_bx_tasks_form_time_input_value_h_placeholder";}', '', '', '', '', '', '', '', 1, 0),
('bx_tasks_time', 'bx_tasks', 'value_div', '_bx_tasks_form_time_input_value_div', '', 0, 'value', '_bx_tasks_form_time_input_sys_value_div', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_tasks_time', 'bx_tasks', 'value_m', '', '', 0, 'text', '_bx_tasks_form_time_input_sys_value_m', '', '', 0, 0, 0, 'a:1:{s:11:"placeholder";s:45:"_bx_tasks_form_time_input_value_m_placeholder";}', '', '', '', '', '', '', '', 1, 0),
('bx_tasks_time', 'bx_tasks', 'value_date', '', '', 0, 'datepicker', '_bx_tasks_form_time_input_sys_value_date', '_bx_tasks_form_time_input_value_date', '', 0, 0, 0, '', '', '', '', '', '', 'DateUtc', '', 1, 0),
('bx_tasks_time', 'bx_tasks', 'text', '', '', 0, 'textarea', '_bx_tasks_form_time_input_sys_text', '_bx_tasks_form_time_input_text', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 1, 0),
('bx_tasks_time', 'bx_tasks', 'submit', '_bx_tasks_form_time_input_submit', '', 0, 'submit', '_bx_tasks_form_time_input_sys_submit', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_tasks_time', 'bx_tasks', 'cancel', '_bx_tasks_form_time_input_cancel', '', 0, 'button', '_bx_tasks_form_time_input_sys_cancel', '', '', 0, 0, 0, 'a:2:{s:7:"onclick";s:45:"$(''.bx-popup-applied:visible'').dolPopupHide()";s:5:"class";s:22:"bx-def-margin-sec-left";}', '', '', '', '', '', '', '', 1, 0),
('bx_tasks_time', 'bx_tasks', 'controls', '', 'submit,cancel', 0, 'input_set', '_bx_tasks_form_time_input_sys_controls', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0);

INSERT INTO `sys_form_display_inputs` (`display_name`, `input_name`, `visible_for_levels`, `active`, `order`) VALUES
('bx_tasks_time_add', 'sys', 2147483647, 1, 1),
('bx_tasks_time_add', 'object_id', 2147483647, 1, 2),
('bx_tasks_time_add', 'action', 2147483647, 1, 3),
('bx_tasks_time_add', 'value', 2147483647, 1, 4),
('bx_tasks_time_add', 'value_h', 2147483647, 1, 5),
('bx_tasks_time_add', 'value_div', 2147483647, 1, 6),
('bx_tasks_time_add', 'value_m', 2147483647, 1, 7),
('bx_tasks_time_add', 'value_date', 2147483647, 1, 8),
('bx_tasks_time_add', 'text', 2147483647, 1, 9),
('bx_tasks_time_add', 'controls', 2147483647, 1, 10),
('bx_tasks_time_add', 'submit', 2147483647, 1, 11),
('bx_tasks_time_add', 'cancel', 2147483647, 1, 12),

('bx_tasks_time_edit', 'value', 2147483647, 1, 1),
('bx_tasks_time_edit', 'value_h', 2147483647, 1, 2),
('bx_tasks_time_edit', 'value_div', 2147483647, 1, 3),
('bx_tasks_time_edit', 'value_m', 2147483647, 1, 4),
('bx_tasks_time_edit', 'value_date', 2147483647, 1, 5),
('bx_tasks_time_edit', 'text', 2147483647, 1, 6),
('bx_tasks_time_edit', 'controls', 2147483647, 1, 7),
('bx_tasks_time_edit', 'submit', 2147483647, 1, 8),
('bx_tasks_time_edit', 'cancel', 2147483647, 1, 9);

-- PRE-VALUES
INSERT INTO `sys_form_pre_lists`(`key`, `title`, `module`, `use_for_sets`) VALUES
('bx_tasks_types', '_bx_tasks_pre_lists_types', 'bx_tasks', '0');

INSERT INTO `sys_form_pre_values`(`Key`, `Value`, `Order`, `LKey`, `LKey2`) VALUES
('bx_tasks_types', '', 0, '_sys_please_select', ''),
('bx_tasks_types', '1', 1, '_bx_tasks_type_1', ''),
('bx_tasks_types', '2', 2, '_bx_tasks_type_2', ''),
('bx_tasks_types', '3', 3, '_bx_tasks_type_3', '');

INSERT INTO `sys_form_pre_lists`(`key`, `title`, `module`, `use_for_sets`) VALUES
('bx_tasks_stickers', '_bx_tasks_pre_lists_stickers', 'bx_tasks', '1');

INSERT INTO `sys_form_pre_values`(`Key`, `Value`, `Order`, `LKey`, `LKey2`) VALUES
('bx_tasks_stickers', '', 0, '_sys_please_select', ''),
('bx_tasks_stickers', '1', 1, '_bx_tasks_sticker_1', ''),
('bx_tasks_stickers', '2', 2, '_bx_tasks_sticker_2', ''),
('bx_tasks_stickers', '3', 3, '_bx_tasks_sticker_3', ''),
('bx_tasks_stickers', '4', 4, '_bx_tasks_sticker_4', ''),
('bx_tasks_stickers', '5', 5, '_bx_tasks_sticker_5', '');

INSERT INTO `sys_form_pre_lists`(`key`, `title`, `module`, `use_for_sets`) VALUES
('bx_tasks_priorities', '_bx_tasks_pre_lists_priorities', 'bx_tasks', '0');

INSERT INTO `sys_form_pre_values`(`Key`, `Value`, `Order`, `LKey`, `LKey2`) VALUES
('bx_tasks_priorities', '', 0, '_sys_please_select', ''),
('bx_tasks_priorities', '1', 1, '_bx_tasks_priority_1', ''),
('bx_tasks_priorities', '2', 2, '_bx_tasks_priority_2', ''),
('bx_tasks_priorities', '3', 3, '_bx_tasks_priority_3', ''),
('bx_tasks_priorities', '4', 4, '_bx_tasks_priority_4', ''),
('bx_tasks_priorities', '5', 5, '_bx_tasks_priority_5', '');

INSERT INTO `sys_form_pre_lists`(`key`, `title`, `module`, `use_for_sets`) VALUES
('bx_tasks_estimates', '_bx_tasks_pre_lists_estimates', 'bx_tasks', '0');

INSERT INTO `sys_form_pre_values`(`Key`, `Value`, `Order`, `LKey`, `LKey2`) VALUES
('bx_tasks_estimates', '', 0, '_sys_please_select', ''),
('bx_tasks_estimates', '2', 1, '_bx_tasks_estimate_2', ''),
('bx_tasks_estimates', '4', 1, '_bx_tasks_estimate_4', ''),
('bx_tasks_estimates', '8', 1, '_bx_tasks_estimate_8', ''),
('bx_tasks_estimates', '16', 1, '_bx_tasks_estimate_16', ''),
('bx_tasks_estimates', '32', 1, '_bx_tasks_estimate_32', ''),
('bx_tasks_estimates', '64', 1, '_bx_tasks_estimate_64', '');

INSERT INTO `sys_form_pre_lists`(`key`, `title`, `module`, `use_for_sets`) VALUES
('bx_tasks_states', '_bx_tasks_pre_lists_states', 'bx_tasks', '0');

INSERT INTO `sys_form_pre_values`(`Key`, `Value`, `Order`, `LKey`, `LKey2`) VALUES
('bx_tasks_states', '', 0, '_sys_please_select', ''),
('bx_tasks_states', '1', 1, '_bx_tasks_state_1', ''),
('bx_tasks_states', '2', 2, '_bx_tasks_state_2', ''),
('bx_tasks_states', '3', 3, '_bx_tasks_state_3', ''),
('bx_tasks_states', '4', 4, '_bx_tasks_state_4', ''),
('bx_tasks_states', '5', 5, '_bx_tasks_state_5', ''),
('bx_tasks_states', '6', 6, '_bx_tasks_state_6', ''),
('bx_tasks_states', '7', 7, '_bx_tasks_state_7', '');

INSERT INTO `sys_form_pre_lists`(`key`, `title`, `module`, `use_for_sets`) VALUES
('bx_tasks_cats', '_bx_tasks_pre_lists_cats', 'bx_tasks', '0');

INSERT INTO `sys_form_pre_values`(`Key`, `Value`, `Order`, `LKey`, `LKey2`) VALUES
('bx_tasks_cats', '', 0, '_sys_please_select', ''),
('bx_tasks_cats', '1', 1, '_bx_tasks_cat_Animals_Pets', ''),
('bx_tasks_cats', '2', 2, '_bx_tasks_cat_Architecture', ''),
('bx_tasks_cats', '3', 3, '_bx_tasks_cat_Art', ''),
('bx_tasks_cats', '4', 4, '_bx_tasks_cat_Cars_Motorcycles', ''),
('bx_tasks_cats', '5', 5, '_bx_tasks_cat_Celebrities', ''),
('bx_tasks_cats', '6', 6, '_bx_tasks_cat_Design', ''),
('bx_tasks_cats', '7', 7, '_bx_tasks_cat_DIY_Crafts', ''),
('bx_tasks_cats', '8', 8, '_bx_tasks_cat_Education', ''),
('bx_tasks_cats', '9', 9, '_bx_tasks_cat_Film_Music_Books', ''),
('bx_tasks_cats', '10', 10, '_bx_tasks_cat_Food_Drink', ''),
('bx_tasks_cats', '11', 11, '_bx_tasks_cat_Gardening', ''),
('bx_tasks_cats', '12', 12, '_bx_tasks_cat_Geek', ''),
('bx_tasks_cats', '13', 13, '_bx_tasks_cat_Hair_Beauty', ''),
('bx_tasks_cats', '14', 14, '_bx_tasks_cat_Health_Fitness', ''),
('bx_tasks_cats', '15', 15, '_bx_tasks_cat_History', ''),
('bx_tasks_cats', '16', 16, '_bx_tasks_cat_Holidays_Events', ''),
('bx_tasks_cats', '17', 17, '_bx_tasks_cat_Home_Decor', ''),
('bx_tasks_cats', '18', 18, '_bx_tasks_cat_Humor', ''),
('bx_tasks_cats', '19', 19, '_bx_tasks_cat_Illustrations_Posters', ''),
('bx_tasks_cats', '20', 20, '_bx_tasks_cat_Kids_Parenting', ''),
('bx_tasks_cats', '21', 21, '_bx_tasks_cat_Mens_Fashion', ''),
('bx_tasks_cats', '22', 22, '_bx_tasks_cat_Outdoors', ''),
('bx_tasks_cats', '23', 23, '_bx_tasks_cat_Photography', ''),
('bx_tasks_cats', '24', 24, '_bx_tasks_cat_Products', ''),
('bx_tasks_cats', '25', 25, '_bx_tasks_cat_Quotes', ''),
('bx_tasks_cats', '26', 26, '_bx_tasks_cat_Science_Nature', ''),
('bx_tasks_cats', '27', 27, '_bx_tasks_cat_Sports', ''),
('bx_tasks_cats', '28', 28, '_bx_tasks_cat_Tattoos', ''),
('bx_tasks_cats', '29', 29, '_bx_tasks_cat_Technology', ''),
('bx_tasks_cats', '30', 30, '_bx_tasks_cat_Travel', ''),
('bx_tasks_cats', '31', 31, '_bx_tasks_cat_Weddings', ''),
('bx_tasks_cats', '32', 32, '_bx_tasks_cat_Womens_Fashion', '');

-- COMMENTS
INSERT INTO `sys_objects_cmts` (`Name`, `Module`, `Table`, `CharsPostMin`, `CharsPostMax`, `CharsDisplayMax`, `Html`, `PerView`, `PerViewReplies`, `BrowseType`, `IsBrowseSwitch`, `PostFormPosition`, `NumberOfLevels`, `IsDisplaySwitch`, `IsRatable`, `ViewingThreshold`, `IsOn`, `RootStylePrefix`, `BaseUrl`, `ObjectVote`, `TriggerTable`, `TriggerFieldId`, `TriggerFieldAuthor`, `TriggerFieldTitle`, `TriggerFieldComments`, `ClassName`, `ClassFile`) VALUES
('bx_tasks', 'bx_tasks', 'bx_tasks_cmts', 1, 5000, 1000, 3, 50, 10, 'tail', 1, 'bottom', 1, 1, 1, -3, 1, 'cmt', 'page.php?i=view-task&id={object_id}', '', 'bx_tasks_tasks', 'id', 'author', 'title', 'comments', 'BxTasksCmts', 'modules/boonex/tasks/classes/BxTasksCmts.php'),
('bx_tasks_notes', 'bx_tasks', 'bx_tasks_cmts_notes', 1, 5000, 1000, 0, 5, 3, 'tail', 1, 'bottom', 1, 1, 1, -3, 1, 'cmt', 'page.php?i=view-task&id={object_id}', '', 'bx_tasks_tasks', 'id', 'author', 'title', '', 'BxTemplCmtsNotes', '');

-- VOTES
INSERT INTO `sys_objects_vote` (`Name`, `Module`, `TableMain`, `TableTrack`, `PostTimeout`, `MinValue`, `MaxValue`, `IsUndo`, `IsOn`, `TriggerTable`, `TriggerFieldId`, `TriggerFieldAuthor`, `TriggerFieldRate`, `TriggerFieldRateCount`, `ClassName`, `ClassFile`) VALUES 
('bx_tasks', 'bx_tasks', 'bx_tasks_votes', 'bx_tasks_votes_track', '604800', '1', '1', '0', '1', 'bx_tasks_tasks', 'id', 'author', 'rate', 'votes', '', ''),
('bx_tasks_reactions', 'bx_tasks', 'bx_tasks_reactions', 'bx_tasks_reactions_track', '604800', '1', '1', '1', '1', 'bx_tasks_tasks', 'id', 'author', 'rrate', 'rvotes', 'BxTemplVoteReactions', '');

-- SCORES
INSERT INTO `sys_objects_score` (`name`, `module`, `table_main`, `table_track`, `post_timeout`, `is_on`, `trigger_table`, `trigger_field_id`, `trigger_field_author`, `trigger_field_score`, `trigger_field_cup`, `trigger_field_cdown`, `class_name`, `class_file`) VALUES 
('bx_tasks', 'bx_tasks', 'bx_tasks_scores', 'bx_tasks_scores_track', '604800', '0', 'bx_tasks_tasks', 'id', 'author', 'score', 'sc_up', 'sc_down', '', '');

-- REPORTS
INSERT INTO `sys_objects_report` (`name`, `module`, `table_main`, `table_track`, `pruning`, `is_on`, `base_url`, `object_comment`, `trigger_table`, `trigger_field_id`, `trigger_field_author`, `trigger_field_count`, `class_name`, `class_file`) VALUES 
('bx_tasks', 'bx_tasks', 'bx_tasks_reports', 'bx_tasks_reports_track', '31536000', '1', 'page.php?i=view-task&id={object_id}', 'bx_tasks_notes', 'bx_tasks_tasks', 'id', 'author', 'reports', '', ''),
('bx_tasks_time', 'bx_tasks', 'bx_tasks_time', 'bx_tasks_time_track', '0', '1', 'page.php?i=view-task&id={object_id}', '', 'bx_tasks_tasks', 'id', 'author', 'time', 'BxTasksTime', 'modules/boonex/tasks/classes/BxTasksTime.php');

-- VIEWS
INSERT INTO `sys_objects_view` (`name`, `module`, `table_track`, `period`, `is_on`, `trigger_table`, `trigger_field_id`, `trigger_field_author`, `trigger_field_count`, `class_name`, `class_file`) VALUES 
('bx_tasks', 'bx_tasks', 'bx_tasks_views_track', '86400', '1', 'bx_tasks_tasks', 'id', 'author', 'views', '', '');

-- FAFORITES
INSERT INTO `sys_objects_favorite` (`name`, `table_track`, `is_on`, `is_undo`, `is_public`, `base_url`, `trigger_table`, `trigger_field_id`, `trigger_field_author`, `trigger_field_count`, `class_name`, `class_file`) VALUES 
('bx_tasks', 'bx_tasks_favorites_track', '1', '1', '1', 'page.php?i=view-task&id={object_id}', 'bx_tasks_tasks', 'id', 'author', 'favorites', '', '');

-- FEATURED
INSERT INTO `sys_objects_feature` (`name`, `module`, `is_on`, `is_undo`, `base_url`, `trigger_table`, `trigger_field_id`, `trigger_field_author`, `trigger_field_flag`, `class_name`, `class_file`) VALUES 
('bx_tasks', 'bx_tasks', '1', '1', 'page.php?i=view-task&id={object_id}', 'bx_tasks_tasks', 'id', 'author', 'featured', '', '');

-- CONTENT INFO
INSERT INTO `sys_objects_content_info` (`name`, `title`, `alert_unit`, `alert_action_add`, `alert_action_update`, `alert_action_delete`, `class_name`, `class_file`) VALUES
('bx_tasks', '_bx_tasks', 'bx_tasks', 'added', 'edited', 'deleted', '', ''),
('bx_tasks_cmts', '_bx_tasks_cmts', 'bx_tasks', 'commentPost', 'commentUpdated', 'commentRemoved', 'BxDolContentInfoCmts', '');

-- SEARCH EXTENDED
INSERT INTO `sys_objects_search_extended` (`object`, `object_content_info`, `module`, `title`, `active`, `class_name`, `class_file`) VALUES
('bx_tasks', 'bx_tasks', 'bx_tasks', '_bx_tasks_search_extended', 1, '', ''),
('bx_tasks_cmts', 'bx_tasks_cmts', 'bx_tasks', '_bx_tasks_search_extended_cmts', 1, 'BxTemplSearchExtendedCmts', '');

-- STUDIO: page & widget
INSERT INTO `sys_std_pages`(`index`, `name`, `header`, `caption`, `icon`) VALUES
(3, 'bx_tasks', '_bx_tasks', '_bx_tasks', 'bx_tasks@modules/boonex/tasks/|std-icon.svg');
SET @iPageId = LAST_INSERT_ID();

SET @iParentPageId = (SELECT `id` FROM `sys_std_pages` WHERE `name` = 'home');
SET @iParentPageOrder = (SELECT MAX(`order`) FROM `sys_std_pages_widgets` WHERE `page_id` = @iParentPageId);
INSERT INTO `sys_std_widgets` (`page_id`, `module`, `type`, `url`, `click`, `icon`, `caption`, `cnt_notices`, `cnt_actions`) VALUES
(@iPageId, 'bx_tasks', 'content', '{url_studio}module.php?name=bx_tasks', '', 'bx_tasks@modules/boonex/tasks/|std-icon.svg', '_bx_tasks', '', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_actions";s:6:"params";a:0:{}s:5:"class";s:18:"TemplStudioModules";}');
INSERT INTO `sys_std_pages_widgets` (`page_id`, `widget_id`, `order`) VALUES
(@iParentPageId, LAST_INSERT_ID(), IF(ISNULL(@iParentPageOrder), 1, @iParentPageOrder + 1));

