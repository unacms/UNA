-- TABLE: entries
CREATE TABLE IF NOT EXISTS `bx_reviews_reviews` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `author` int(11) NOT NULL,
  `added` int(11) NOT NULL,
  `changed` int(11) NOT NULL,
  `thumb` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `voting_options` text NOT NULL,
  `voting_avg` float NOT NULL,
  `cat` int(11) NOT NULL,
  `multicat` text NOT NULL,
  `text` mediumtext NOT NULL,
  `labels` text NOT NULL,
  `location` text NOT NULL,
  `views` int(11) NOT NULL default '0',
  `rate` float NOT NULL default '0',
  `votes` int(11) NOT NULL default '0',
  `srate` float NOT NULL default '0',
  `svotes` int(11) NOT NULL default '0',
  `rrate` float NOT NULL default '0',
  `rvotes` int(11) NOT NULL default '0',
  `score` int(11) NOT NULL default '0',
  `sc_up` int(11) NOT NULL default '0',
  `sc_down` int(11) NOT NULL default '0',
  `favorites` int(11) NOT NULL default '0',
  `comments` int(11) NOT NULL default '0',
  `reports` int(11) NOT NULL default '0',
  `featured` int(11) NOT NULL default '0',
  `cf` int(11) NOT NULL default '1',
  `allow_view_to` varchar(16) NOT NULL DEFAULT '3',
  `reviewed_profile` int(11) NOT NULL DEFAULT '0',
  `product` varchar(255) NOT NULL,
  `allow_comments` tinyint(4) NOT NULL DEFAULT '1',
  `status` enum('active','awaiting','failed','hidden') NOT NULL DEFAULT 'active',
  `status_admin` enum('active','hidden','pending') NOT NULL DEFAULT 'active',
  PRIMARY KEY (`id`),
  KEY `reviewed_profile` (`reviewed_profile`),
  FULLTEXT KEY `title_text` (`title`,`text`)
);

-- TABLE: storages & transcoders
CREATE TABLE IF NOT EXISTS `bx_reviews_covers` (
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

CREATE TABLE IF NOT EXISTS `bx_reviews_files` (
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

CREATE TABLE IF NOT EXISTS `bx_reviews_photos` (
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

CREATE TABLE IF NOT EXISTS `bx_reviews_photos_resized` (
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

CREATE TABLE IF NOT EXISTS `bx_reviews_videos` (
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

CREATE TABLE IF NOT EXISTS `bx_reviews_videos_resized` (
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
CREATE TABLE IF NOT EXISTS `bx_reviews_cmts` (
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

CREATE TABLE IF NOT EXISTS `bx_reviews_cmts_notes` (
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
CREATE TABLE IF NOT EXISTS `bx_reviews_votes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `count` int(11) NOT NULL default '0',
  `sum` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `object_id` (`object_id`)
);

CREATE TABLE IF NOT EXISTS `bx_reviews_votes_track` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `author_id` int(11) NOT NULL default '0',
  `author_nip` int(11) unsigned NOT NULL default '0',
  `value` tinyint(4) NOT NULL default '0',
  `date` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  KEY `vote` (`object_id`, `author_nip`)
);

CREATE TABLE IF NOT EXISTS `bx_reviews_svotes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `count` int(11) NOT NULL default '0',
  `sum` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `object_id` (`object_id`)
);

CREATE TABLE IF NOT EXISTS `bx_reviews_svotes_track` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `author_id` int(11) NOT NULL default '0',
  `author_nip` int(11) unsigned NOT NULL default '0',
  `value` tinyint(4) NOT NULL default '0',
  `date` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  KEY `vote` (`object_id`, `author_nip`)
);


CREATE TABLE IF NOT EXISTS `bx_reviews_reactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `reaction` varchar(32) NOT NULL default '',
  `count` int(11) NOT NULL default '0',
  `sum` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `reaction` (`object_id`, `reaction`)
);

CREATE TABLE IF NOT EXISTS `bx_reviews_reactions_track` (
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
CREATE TABLE `bx_reviews_views_track` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `viewer_id` int(11) NOT NULL default '0',
  `viewer_nip` int(11) unsigned NOT NULL default '0',
  `date` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  KEY `id` (`object_id`,`viewer_id`,`viewer_nip`)
);

-- TABLE: metas
CREATE TABLE `bx_reviews_meta_keywords` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(10) unsigned NOT NULL,
  `keyword` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `object_id` (`object_id`),
  KEY `keyword` (`keyword`)
);

CREATE TABLE `bx_reviews_meta_mentions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(10) unsigned NOT NULL,
  `profile_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `object_id` (`object_id`),
  KEY `profile_id` (`profile_id`)
);

CREATE TABLE `bx_reviews_meta_locations` (
  `object_id` int(10) unsigned NOT NULL,
  `lat` double NOT NULL,
  `lng` double NOT NULL,
  `country` varchar(2) NOT NULL,
  `state` varchar(255) NOT NULL,
  `city` varchar(255) NOT NULL,
  `zip` varchar(255) NOT NULL,
  `street` varchar(255) NOT NULL,
  `street_number` varchar(255) NOT NULL,
  PRIMARY KEY (`object_id`),
  KEY `country_state_city` (`country`,`state`(8),`city`(8))
);

-- TABLE: reports
CREATE TABLE IF NOT EXISTS `bx_reviews_reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `count` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `object_id` (`object_id`)
);

CREATE TABLE IF NOT EXISTS `bx_reviews_reports_track` (
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

-- TABLE: favorites
CREATE TABLE `bx_reviews_favorites_track` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `author_id` int(11) NOT NULL default '0',
  `list_id` int(11) NOT NULL default '0',
  `date` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  KEY `id` (`object_id`,`author_id`)
);

CREATE TABLE `bx_reviews_favorites_lists` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `author_id` int(11) NOT NULL default '0',
  `date` int(11) NOT NULL default '0',
  `allow_view_favorite_list_to` varchar(16) NOT NULL DEFAULT '3',
  PRIMARY KEY (`id`)
);


-- TABLE: scores
CREATE TABLE IF NOT EXISTS `bx_reviews_scores` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `count_up` int(11) NOT NULL default '0',
  `count_down` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `object_id` (`object_id`)
);

CREATE TABLE IF NOT EXISTS `bx_reviews_scores_track` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `author_id` int(11) NOT NULL default '0',
  `author_nip` int(11) unsigned NOT NULL default '0',
  `type` varchar(8) NOT NULL default '',
  `date` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  KEY `vote` (`object_id`, `author_nip`)
);

-- TABLE: polls
CREATE TABLE IF NOT EXISTS `bx_reviews_polls` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `author_id` int(11) NOT NULL default '0',
  `content_id` int(11) NOT NULL default '0',
  `text` text NOT NULL,
  PRIMARY KEY (`id`),
  KEY `content_id` (`content_id`),
  FULLTEXT KEY `search_fields` (`text`)
);

CREATE TABLE IF NOT EXISTS `bx_reviews_polls_answers` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `poll_id` int(11) unsigned NOT NULL default '0',
  `title` varchar(255) NOT NULL,
  `rate` float NOT NULL default '0',
  `votes` int(11) NOT NULL default '0',
  `order` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  KEY `poll_id` (`poll_id`),
  FULLTEXT KEY `title` (`title`)
);

CREATE TABLE IF NOT EXISTS `bx_reviews_polls_answers_votes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `count` int(11) NOT NULL default '0',
  `sum` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `object_id` (`object_id`)
);

CREATE TABLE IF NOT EXISTS `bx_reviews_polls_answers_votes_track` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `author_id` int(11) NOT NULL default '0',
  `author_nip` int(11) unsigned NOT NULL default '0',
  `value` tinyint(4) NOT NULL default '0',
  `date` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  KEY `vote` (`object_id`, `author_nip`)
);

-- VOTING OPTIONS
CREATE TABLE IF NOT EXISTS `bx_reviews_voting_options` (
    `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
    `lkey` varchar(255) NOT NULL DEFAULT '',
    `order` int(11) NOT NULL,
    PRIMARY KEY (`id`)
);

-- STORAGES & TRANSCODERS
SET @sStorageEngine = (SELECT `value` FROM `sys_options` WHERE `name` = 'sys_storage_default');

INSERT INTO `sys_objects_storage` (`object`, `engine`, `params`, `token_life`, `cache_control`, `levels`, `table_files`, `ext_mode`, `ext_allow`, `ext_deny`, `quota_size`, `current_size`, `quota_number`, `current_number`, `max_file_size`, `ts`) VALUES
('bx_reviews_covers', @sStorageEngine, '', 360, 2592000, 3, 'bx_reviews_covers', 'allow-deny', '{image}', '', 0, 0, 0, 0, 0, 0),

('bx_reviews_photos', @sStorageEngine, '', 360, 2592000, 3, 'bx_reviews_photos', 'allow-deny', '{image}', '', 0, 0, 0, 0, 0, 0),
('bx_reviews_photos_resized', @sStorageEngine, '', 360, 2592000, 3, 'bx_reviews_photos_resized', 'allow-deny', '{image}', '', 0, 0, 0, 0, 0, 0),

('bx_reviews_videos', @sStorageEngine, '', 360, 2592000, 3, 'bx_reviews_videos', 'allow-deny', '{video}', '', 0, 0, 0, 0, 0, 0),
('bx_reviews_videos_resized', @sStorageEngine, '', 360, 2592000, 3, 'bx_reviews_videos_resized', 'allow-deny', '{imagevideo}', '', 0, 0, 0, 0, 0, 0),

('bx_reviews_files', @sStorageEngine, '', 360, 2592000, 3, 'bx_reviews_files', 'deny-allow', '', '{dangerous}', 0, 0, 0, 0, 0, 0);

INSERT INTO `sys_objects_transcoder` (`object`, `storage_object`, `source_type`, `source_params`, `private`, `atime_tracking`, `atime_pruning`, `ts`, `override_class_name`, `override_class_file`) VALUES 
('bx_reviews_preview', 'bx_reviews_photos_resized', 'Storage', 'a:1:{s:6:"object";s:17:"bx_reviews_covers";}', 'no', '1', '2592000', '0', '', ''),
('bx_reviews_gallery', 'bx_reviews_photos_resized', 'Storage', 'a:1:{s:6:"object";s:17:"bx_reviews_covers";}', 'no', '1', '2592000', '0', '', ''),
('bx_reviews_cover', 'bx_reviews_photos_resized', 'Storage', 'a:1:{s:6:"object";s:17:"bx_reviews_covers";}', 'no', '1', '2592000', '0', '', ''),

('bx_reviews_preview_photos', 'bx_reviews_photos_resized', 'Storage', 'a:1:{s:6:"object";s:17:"bx_reviews_photos";}', 'no', '1', '2592000', '0', '', ''),
('bx_reviews_gallery_photos', 'bx_reviews_photos_resized', 'Storage', 'a:1:{s:6:"object";s:17:"bx_reviews_photos";}', 'no', '1', '2592000', '0', '', ''),

('bx_reviews_videos_poster', 'bx_reviews_videos_resized', 'Storage', 'a:1:{s:6:"object";s:17:"bx_reviews_videos";}', 'no', '0', '0', '0', 'BxDolTranscoderVideo', ''),
('bx_reviews_videos_poster_preview', 'bx_reviews_videos_resized', 'Storage', 'a:1:{s:6:"object";s:17:"bx_reviews_videos";}', 'no', '0', '0', '0', 'BxDolTranscoderVideo', ''),
('bx_reviews_videos_mp4', 'bx_reviews_videos_resized', 'Storage', 'a:1:{s:6:"object";s:17:"bx_reviews_videos";}', 'no', '0', '0', '0', 'BxDolTranscoderVideo', ''),
('bx_reviews_videos_mp4_hd', 'bx_reviews_videos_resized', 'Storage', 'a:1:{s:6:"object";s:17:"bx_reviews_videos";}', 'no', '0', '0', '0', 'BxDolTranscoderVideo', ''),

('bx_reviews_preview_files', 'bx_reviews_photos_resized', 'Storage', 'a:1:{s:6:"object";s:16:"bx_reviews_files";}', 'no', '1', '2592000', '0', '', ''),
('bx_reviews_gallery_files', 'bx_reviews_photos_resized', 'Storage', 'a:1:{s:6:"object";s:16:"bx_reviews_files";}', 'no', '1', '2592000', '0', '', '');

INSERT INTO `sys_transcoder_filters` (`transcoder_object`, `filter`, `filter_params`, `order`) VALUES 
('bx_reviews_preview', 'Resize', 'a:3:{s:1:"w";s:3:"300";s:1:"h";s:3:"200";s:11:"crop_resize";s:1:"1";}', '0'),
('bx_reviews_gallery', 'Resize', 'a:1:{s:1:"w";s:3:"500";}', '0'),
('bx_reviews_cover', 'Resize', 'a:1:{s:1:"w";s:4:"1200";}', '0'),

('bx_reviews_preview_photos', 'Resize', 'a:3:{s:1:"w";s:3:"300";s:1:"h";s:3:"200";s:11:"crop_resize";s:1:"1";}', '0'),
('bx_reviews_gallery_photos', 'Resize', 'a:1:{s:1:"w";s:4:"1200";}', '0'),

('bx_reviews_videos_poster_preview', 'Resize', 'a:3:{s:1:"w";s:3:"300";s:1:"h";s:3:"200";s:13:"square_resize";s:1:"1";}', 10),
('bx_reviews_videos_poster_preview', 'Poster', 'a:2:{s:1:"h";s:3:"480";s:10:"force_type";s:3:"jpg";}', 0),
('bx_reviews_videos_poster', 'Poster', 'a:2:{s:1:"h";s:3:"318";s:10:"force_type";s:3:"jpg";}', 0),
('bx_reviews_videos_mp4', 'Mp4', 'a:2:{s:1:"h";s:3:"318";s:10:"force_type";s:3:"mp4";}', 0),
('bx_reviews_videos_mp4_hd', 'Mp4', 'a:3:{s:1:"h";s:3:"720";s:13:"video_bitrate";s:4:"1536";s:10:"force_type";s:3:"mp4";}', 0),

('bx_reviews_preview_files', 'Resize', 'a:3:{s:1:"w";s:3:"300";s:1:"h";s:3:"200";s:11:"crop_resize";s:1:"1";}', '0'),
('bx_reviews_gallery_files', 'Resize', 'a:1:{s:1:"w";s:3:"500";}', '0');


-- FORMS: entry (review)
INSERT INTO `sys_objects_form`(`object`, `module`, `title`, `action`, `form_attrs`, `table`, `key`, `uri`, `uri_title`, `submit_name`, `params`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_reviews', 'bx_reviews', '_bx_reviews_form_entry', '', 'a:1:{s:7:"enctype";s:19:"multipart/form-data";}', 'bx_reviews_reviews', 'id', '', '', 'a:1:{i:0;s:9:"do_submit";}', 'a:1:{s:14:"checker_helper";s:31:"BxReviewsFormEntryCheckerHelper";}', 0, 1, 'BxReviewsFormEntry', 'modules/boonex/reviews/classes/BxReviewsFormEntry.php');

INSERT INTO `sys_form_displays`(`object`, `display_name`, `module`, `view_mode`, `title`) VALUES 
('bx_reviews', 'bx_reviews_entry_add', 'bx_reviews', 0, '_bx_reviews_form_entry_display_add'),
('bx_reviews', 'bx_reviews_entry_delete', 'bx_reviews', 0, '_bx_reviews_form_entry_display_delete'),
('bx_reviews', 'bx_reviews_entry_edit', 'bx_reviews', 0, '_bx_reviews_form_entry_display_edit'),
('bx_reviews', 'bx_reviews_entry_view', 'bx_reviews', 1, '_bx_reviews_form_entry_display_view');

INSERT INTO `sys_form_inputs`(`object`, `module`, `name`, `value`, `values`, `checked`, `type`, `caption_system`, `caption`, `info`, `required`, `collapsed`, `html`, `attrs`, `attrs_tr`, `attrs_wrapper`, `checker_func`, `checker_params`, `checker_error`, `db_pass`, `db_params`, `editable`, `deletable`) VALUES 
('bx_reviews', 'bx_reviews', 'cf', '1', '#!sys_content_filter', 0, 'select', '_sys_form_entry_input_sys_cf', '_sys_form_entry_input_cf', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 1, 0),
('bx_reviews', 'bx_reviews', 'allow_view_to', '', '', 0, 'custom', '_bx_reviews_form_entry_input_sys_allow_view_to', '_bx_reviews_form_entry_input_allow_view_to', '', 1, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_reviews', 'bx_reviews', 'delete_confirm', 1, '', 0, 'checkbox', '_bx_reviews_form_entry_input_sys_delete_confirm', '_bx_reviews_form_entry_input_delete_confirm', '_bx_reviews_form_entry_input_delete_confirm_info', 1, 0, 0, '', '', '', 'Avail', '', '_bx_reviews_form_entry_input_delete_confirm_error', '', '', 1, 0),
('bx_reviews', 'bx_reviews', 'do_submit', '_bx_reviews_form_entry_input_do_submit', '', 0, 'submit', '_bx_reviews_form_entry_input_sys_do_submit', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_reviews', 'bx_reviews', 'location', '', '', 0, 'location', '_sys_form_input_sys_location', '_sys_form_input_location', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_reviews', 'bx_reviews', 'covers', 'a:1:{i:0;s:16:"bx_reviews_html5";}', 'a:1:{s:16:"bx_reviews_html5";s:25:"_sys_uploader_html5_title";}', 0, 'files', '_bx_reviews_form_entry_input_sys_covers', '_bx_reviews_form_entry_input_covers', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_reviews', 'bx_reviews', 'pictures', 'a:1:{i:0;s:23:"bx_reviews_photos_html5";}', 'a:1:{s:23:"bx_reviews_photos_html5";s:25:"_sys_uploader_html5_title";}', 0, 'files', '_bx_reviews_form_entry_input_sys_pictures', '_bx_reviews_form_entry_input_pictures', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_reviews', 'bx_reviews', 'videos', 'a:2:{i:0;s:23:"bx_reviews_videos_html5";i:1;s:30:"bx_reviews_videos_record_video";}', 'a:2:{s:23:"bx_reviews_videos_html5";s:25:"_sys_uploader_html5_title";s:30:"bx_reviews_videos_record_video";s:32:"_sys_uploader_record_video_title";}', 0, 'files', '_bx_reviews_form_entry_input_sys_videos', '_bx_reviews_form_entry_input_videos', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_reviews', 'bx_reviews', 'files', 'a:1:{i:0;s:22:"bx_reviews_files_html5";}', 'a:1:{s:22:"bx_reviews_files_html5";s:25:"_sys_uploader_html5_title";}', 0, 'files', '_bx_reviews_form_entry_input_sys_files', '_bx_reviews_form_entry_input_files', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_reviews', 'bx_reviews', 'polls', '', '', 0, 'custom', '_bx_reviews_form_entry_input_sys_polls', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_reviews', 'bx_reviews', 'text', '', '', 0, 'textarea', '_bx_reviews_form_entry_input_sys_text', '_bx_reviews_form_entry_input_text', '', 1, 0, 2, '', '', '', 'Avail', '', '_bx_reviews_form_entry_input_text_err', 'XssHtml', '', 1, 0),
('bx_reviews', 'bx_reviews', 'title', '', '', 0, 'text', '_bx_reviews_form_entry_input_sys_title', '_bx_reviews_form_entry_input_title', '', 1, 0, 0, '', '', '', 'Length', 'a:2:{s:3:"min";i:3;s:3:"max";i:160;}', '_bx_reviews_form_entry_input_title_err', 'Xss', '', 1, 0),
('bx_reviews', 'bx_reviews', 'cat', '', '#!bx_reviews_cats', 0, 'select', '_bx_reviews_form_entry_input_sys_cat', '_bx_reviews_form_entry_input_cat', '', 1, 0, 0, '', '', '', 'avail', '', '_bx_reviews_form_entry_input_cat_err', 'Xss', '', 1, 0),
('bx_reviews', 'bx_reviews', 'multicat', '', '', 0, 'custom', '_bx_reviews_form_entry_input_sys_multicat', '_bx_reviews_form_entry_input_multicat', '', 1, 0, 0, '', '', '', 'avail', '', '_bx_reviews_form_entry_input_multicat_err', 'Xss', '', 1, 0),
('bx_reviews', 'bx_reviews', 'added', '', '', 0, 'datetime', '_bx_reviews_form_entry_input_sys_date_added', '_bx_reviews_form_entry_input_date_added', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_reviews', 'bx_reviews', 'changed', '', '', 0, 'datetime', '_bx_reviews_form_entry_input_sys_date_changed', '_bx_reviews_form_entry_input_date_changed', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_reviews', 'bx_reviews', 'attachments', '', '', 0, 'custom', '_bx_reviews_form_entry_input_sys_attachments', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_reviews', 'bx_reviews', 'labels', '', '', 0, 'custom', '_sys_form_input_sys_labels', '_sys_form_input_labels', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_reviews', 'bx_reviews', 'anonymous', '', '', 0, 'switcher', '_sys_form_input_sys_anonymous', '_sys_form_input_anonymous', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_reviews', 'bx_reviews', 'allow_comments', '1', '', 1, 'switcher', '_bx_reviews_form_entry_input_sys_allow_comments', '_bx_reviews_form_entry_input_allow_comments', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 1, 0),
('bx_reviews', 'bx_reviews', 'voting_options', '', '', 0, 'custom', '_bx_reviews_form_entry_input_sys_voting_options', '_bx_reviews_form_entry_input_voting_options', '', 0, 0, 0, '', '', '', '', '', '', 'VotingOptions', '', 1, 0),
('bx_reviews', 'bx_reviews', 'reviewed_profile', '', '', 0, 'custom', '_bx_reviews_form_entry_input_sys_reviewed_profile', '_bx_reviews_form_entry_input_reviewed_profile', '', 0, 0, 0, '', '', '', '', '', '', 'OneIntArray', '', 1, 0),
('bx_reviews', 'bx_reviews', 'product', '', '', 0, 'text', '_bx_reviews_form_entry_input_sys_product', '_bx_reviews_form_entry_input_product', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 1, 0);



INSERT INTO `sys_form_display_inputs`(`display_name`, `input_name`, `visible_for_levels`, `active`, `order`) VALUES
('bx_reviews_entry_add', 'reviewed_profile', 2147483647, 1, 1),
('bx_reviews_entry_add', 'product', 2147483647, 1, 2),
('bx_reviews_entry_add', 'title', 2147483647, 1, 3),
('bx_reviews_entry_add', 'cat', 2147483647, 1, 4),
('bx_reviews_entry_add', 'text', 2147483647, 1, 5),
('bx_reviews_entry_add', 'voting_options', 2147483647, 1, 6),
('bx_reviews_entry_add', 'attachments', 2147483647, 1, 7),
('bx_reviews_entry_add', 'pictures', 2147483647, 1, 8),
('bx_reviews_entry_add', 'videos', 2147483647, 1, 9),
('bx_reviews_entry_add', 'files', 2147483647, 1, 10),
('bx_reviews_entry_add', 'polls', 2147483647, 1, 11),
('bx_reviews_entry_add', 'covers', 2147483647, 1, 12),
('bx_reviews_entry_add', 'allow_view_to', 2147483647, 1, 13),
('bx_reviews_entry_add', 'cf', 2147483647, 1, 14),
('bx_reviews_entry_add', 'location', 2147483647, 0, 15),
('bx_reviews_entry_add', 'allow_comments', 192, 0, 16),
('bx_reviews_entry_add', 'do_submit', 2147483647, 1, 17),

('bx_reviews_entry_delete', 'delete_confirm', 2147483647, 1, 1),
('bx_reviews_entry_delete', 'do_submit', 2147483647, 1, 2),

('bx_reviews_entry_edit', 'reviewed_profile', 2147483647, 1, 1),
('bx_reviews_entry_edit', 'product', 2147483647, 1, 2),
('bx_reviews_entry_edit', 'title', 2147483647, 1, 3),
('bx_reviews_entry_edit', 'voting_options', 2147483647, 1, 4),
('bx_reviews_entry_edit', 'cat', 2147483647, 1, 5),
('bx_reviews_entry_edit', 'text', 2147483647, 1, 6),
('bx_reviews_entry_edit', 'attachments', 2147483647, 1, 7),
('bx_reviews_entry_edit', 'pictures', 2147483647, 1, 8),
('bx_reviews_entry_edit', 'videos', 2147483647, 1, 9),
('bx_reviews_entry_edit', 'files', 2147483647, 1, 10),
('bx_reviews_entry_edit', 'polls', 2147483647, 1, 11),
('bx_reviews_entry_edit', 'covers', 2147483647, 1, 12),
('bx_reviews_entry_edit', 'allow_view_to', 2147483647, 1, 13),
('bx_reviews_entry_edit', 'cf', 2147483647, 1, 14),
('bx_reviews_entry_edit', 'location', 2147483647, 0, 15),
('bx_reviews_entry_edit', 'allow_comments', 192, 0, 16),
('bx_reviews_entry_edit', 'do_submit', 2147483647, 1, 17),

('bx_reviews_entry_view', 'cat', 2147483647, 1, 1),
('bx_reviews_entry_view', 'reviewed_profile', 2147483647, 1, 2),
('bx_reviews_entry_view', 'product', 2147483647, 1, 3),
('bx_reviews_entry_view', 'added', 2147483647, 1, 4),
('bx_reviews_entry_view', 'changed', 2147483647, 1, 5);

-- FORMS: poll
INSERT INTO `sys_objects_form` (`object`, `module`, `title`, `action`, `form_attrs`, `submit_name`, `table`, `key`, `uri`, `uri_title`, `params`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES
('bx_reviews_poll', 'bx_reviews', '_bx_reviews_form_poll', '', '', 'do_submit', 'bx_reviews_polls', 'id', '', '', 'a:1:{s:14:"checker_helper";s:30:"BxReviewsFormPollCheckerHelper";}', 0, 1, 'BxReviewsFormPoll', 'modules/boonex/reviews/classes/BxReviewsFormPoll.php');

INSERT INTO `sys_form_displays` (`display_name`, `module`, `object`, `title`, `view_mode`) VALUES
('bx_reviews_poll_add', 'bx_reviews', 'bx_reviews_poll', '_bx_reviews_form_poll_display_add', 0);

INSERT INTO `sys_form_inputs` (`object`, `module`, `name`, `value`, `values`, `checked`, `type`, `caption_system`, `caption`, `info`, `required`, `collapsed`, `html`, `attrs`, `attrs_tr`, `attrs_wrapper`, `checker_func`, `checker_params`, `checker_error`, `db_pass`, `db_params`, `editable`, `deletable`) VALUES
('bx_reviews_poll', 'bx_reviews', 'text', '', '', 0, 'text', '_bx_reviews_form_poll_input_sys_text', '_bx_reviews_form_poll_input_text', '', 1, 0, 0, '', '', '', 'Avail', '', '_bx_reviews_form_poll_input_text_err', 'Xss', '', 1, 0),
('bx_reviews_poll', 'bx_reviews', 'answers', '', '', 0, 'custom', '_bx_reviews_form_poll_input_sys_answers', '_bx_reviews_form_poll_input_answers', '', 1, 0, 0, '', '', '', 'AvailAnswers', '', '_bx_reviews_form_poll_input_answers_err', '', '', 1, 0),
('bx_reviews_poll', 'bx_reviews', 'controls', '', 'do_submit,do_cancel', 0, 'input_set', '', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_reviews_poll', 'bx_reviews', 'do_submit', '_bx_reviews_form_poll_input_do_submit', '', 0, 'submit', '_bx_reviews_form_poll_input_sys_do_submit', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_reviews_poll', 'bx_reviews', 'do_cancel', '_bx_reviews_form_poll_input_do_cancel', '', 0, 'button', '_bx_reviews_form_poll_input_do_cancel', '', '', 0, 0, 0, 'a:2:{s:7:"onclick";s:45:"$(''.bx-popup-applied:visible'').dolPopupHide()";s:5:"class";s:22:"bx-def-margin-sec-left";}', '', '', '', '', '', '', '', 0, 0);

INSERT INTO `sys_form_display_inputs` (`display_name`, `input_name`, `visible_for_levels`, `active`, `order`) VALUES
('bx_reviews_poll_add', 'text', 2147483647, 1, 1),
('bx_reviews_poll_add', 'answers', 2147483647, 1, 2),
('bx_reviews_poll_add', 'controls', 2147483647, 1, 3),
('bx_reviews_poll_add', 'do_submit', 2147483647, 1, 4),
('bx_reviews_poll_add', 'do_cancel', 2147483647, 1, 5);

-- PRE-VALUES
INSERT INTO `sys_form_pre_lists`(`key`, `title`, `module`, `use_for_sets`) VALUES
('bx_reviews_cats', '_bx_reviews_pre_lists_cats', 'bx_reviews', '0');

INSERT INTO `sys_form_pre_values`(`Key`, `Value`, `Order`, `LKey`, `LKey2`, `Data`) VALUES
('bx_reviews_cats', '', 0, '_sys_please_select', '', ''),
('bx_reviews_cats', '1', 1, '_bx_reviews_cat_Animals', '', ''),
('bx_reviews_cats', '2', 2, '_bx_reviews_cat_Appliances_and_Electronics', '', ''),
('bx_reviews_cats', '3', 3, '_bx_reviews_cat_Arts_and_Fine_Arts', '', ''),
('bx_reviews_cats', '4', 4, '_bx_reviews_cat_Astrology', '', ''),
('bx_reviews_cats', '5', 5, '_bx_reviews_cat_Auto', '', ''),
('bx_reviews_cats', '6', 6, '_bx_reviews_cat_Cigarettes_and_Tobacco', '', ''),
('bx_reviews_cats', '7', 7, '_bx_reviews_cat_Construction_and_Repair', '', ''),
('bx_reviews_cats', '8', 8, '_bx_reviews_cat_E_commerce', '', ''),
('bx_reviews_cats', '9', 9, '_bx_reviews_cat_Education', '', ''),
('bx_reviews_cats', '10', 10, '_bx_reviews_cat_Entertainment', '', ''),
('bx_reviews_cats', '11', 11, '_bx_reviews_cat_Equipment', '', ''),
('bx_reviews_cats', '12', 12, '_bx_reviews_cat_Events', '', ''),
('bx_reviews_cats', '13', 13, '_bx_reviews_cat_Financial_Services', '', ''),
('bx_reviews_cats', '14', 14, '_bx_reviews_cat_Food', '', ''),
('bx_reviews_cats', '15', 15, '_bx_reviews_cat_Furniture_and_Decor', '', ''),
('bx_reviews_cats', '16', 16, '_bx_reviews_cat_Governmental_Organizations_and_Politics', '', ''),
('bx_reviews_cats', '17', 17, '_bx_reviews_cat_Health_and_Beauty', '', ''),
('bx_reviews_cats', '18', 18, '_bx_reviews_cat_Hospitals_Clinics_and_Medical_Centers', '', ''),
('bx_reviews_cats', '19', 19, '_bx_reviews_cat_Household_Services', '', ''),
('bx_reviews_cats', '20', 20, '_bx_reviews_cat_Insurance', '', ''),
('bx_reviews_cats', '21', 21, '_bx_reviews_cat_IT_Services_and_Solutions', '', ''),
('bx_reviews_cats', '22', 22, '_bx_reviews_cat_Kids', '', ''),
('bx_reviews_cats', '23', 23, '_bx_reviews_cat_Liquidators_and_Closeouts', '', ''),
('bx_reviews_cats', '24', 24, '_bx_reviews_cat_Mechanical_Engineering', '', ''),
('bx_reviews_cats', '25', 25, '_bx_reviews_cat_Media', '', ''),
('bx_reviews_cats', '26', 26, '_bx_reviews_cat_Non_Profit_Organizations', '', ''),
('bx_reviews_cats', '27', 26, '_bx_reviews_cat_PR_and_Marketing', '', ''),
('bx_reviews_cats', '28', 28, '_bx_reviews_cat_Professional_Services', '', ''),
('bx_reviews_cats', '29', 29, '_bx_reviews_cat_Real_Estate', '', ''),
('bx_reviews_cats', '30', 30, '_bx_reviews_cat_Rentals', '', ''),
('bx_reviews_cats', '31', 31, '_bx_reviews_cat_Security_and_Protection_Services', '', ''),
('bx_reviews_cats', '32', 32, '_bx_reviews_cat_Service_Centers_and_Repairs', '', ''),
('bx_reviews_cats', '33', 33, '_bx_reviews_cat_Sport', '', ''),
('bx_reviews_cats', '34', 34, '_bx_reviews_cat_Staff', '', ''),
('bx_reviews_cats', '35', 35, '_bx_reviews_cat_Supermarkets_and_Malls', '', ''),
('bx_reviews_cats', '36', 36, '_bx_reviews_cat_Transportation_and_Logistics', '', ''),
('bx_reviews_cats', '37', 37, '_bx_reviews_cat_Travel', '', ''),
('bx_reviews_cats', '38', 38, '_bx_reviews_cat_Weapons', '', ''),
('bx_reviews_cats', '39', 39, '_bx_reviews_cat_Miscellaneous', '', '');

-- COMMENTS
INSERT INTO `sys_objects_cmts` (`Name`, `Module`, `Table`, `CharsPostMin`, `CharsPostMax`, `CharsDisplayMax`, `Html`, `PerView`, `PerViewReplies`, `BrowseType`, `IsBrowseSwitch`, `PostFormPosition`, `NumberOfLevels`, `IsDisplaySwitch`, `IsRatable`, `ViewingThreshold`, `IsOn`, `RootStylePrefix`, `BaseUrl`, `ObjectVote`, `TriggerTable`, `TriggerFieldId`, `TriggerFieldAuthor`, `TriggerFieldTitle`, `TriggerFieldComments`, `ClassName`, `ClassFile`) VALUES
('bx_reviews', 'bx_reviews', 'bx_reviews_cmts', 1, 5000, 1000, 3, 5, 3, 'tail', 1, 'bottom', 1, 1, 1, -3, 1, 'cmt', 'page.php?i=view-review&id={object_id}', '', 'bx_reviews_reviews', 'id', 'author', 'title', 'comments', '', ''),
('bx_reviews_notes', 'bx_reviews', 'bx_reviews_cmts_notes', 1, 5000, 1000, 0, 5, 3, 'tail', 1, 'bottom', 1, 1, 1, -3, 1, 'cmt', 'page.php?i=view-review&id={object_id}', '', 'bx_reviews_reviews', 'id', 'author', 'title', '', 'BxTemplCmtsNotes', '');

-- VOTES
INSERT INTO `sys_objects_vote` (`Name`, `Module`, `TableMain`, `TableTrack`, `PostTimeout`, `MinValue`, `MaxValue`, `IsUndo`, `IsOn`, `TriggerTable`, `TriggerFieldId`, `TriggerFieldAuthor`, `TriggerFieldRate`, `TriggerFieldRateCount`, `ClassName`, `ClassFile`) VALUES 
('bx_reviews', 'bx_reviews', 'bx_reviews_votes', 'bx_reviews_votes_track', '604800', '1', '1', '0', '1', 'bx_reviews_reviews', 'id', 'author', 'rate', 'votes', '', ''),
('bx_reviews_stars', 'bx_reviews', 'bx_reviews_svotes', 'bx_reviews_svotes_track', '604800', '1', '5', '0', '1', 'bx_reviews_reviews', 'id', 'author', 'srate', 'svotes', 'BxReviewsVoteStars', 'modules/boonex/reviews/classes/BxReviewsVoteStars.php'),
('bx_reviews_reactions', 'bx_reviews', 'bx_reviews_reactions', 'bx_reviews_reactions_track', '604800', '1', '1', '1', '1', 'bx_reviews_reviews', 'id', 'author', 'rrate', 'rvotes', 'BxTemplVoteReactions', ''),
('bx_reviews_poll_answers', 'bx_reviews', 'bx_reviews_polls_answers_votes', 'bx_reviews_polls_answers_votes_track', '604800', '1', '1', '0', '1', 'bx_reviews_polls_answers', 'id', '', 'rate', 'votes', 'BxReviewsVotePollAnswers', 'modules/boonex/reviews/classes/BxReviewsVotePollAnswers.php');

-- SCORES
INSERT INTO `sys_objects_score` (`name`, `module`, `table_main`, `table_track`, `post_timeout`, `is_on`, `trigger_table`, `trigger_field_id`, `trigger_field_author`, `trigger_field_score`, `trigger_field_cup`, `trigger_field_cdown`, `class_name`, `class_file`) VALUES 
('bx_reviews', 'bx_reviews', 'bx_reviews_scores', 'bx_reviews_scores_track', '604800', '0', 'bx_reviews_reviews', 'id', 'author', 'score', 'sc_up', 'sc_down', '', '');

-- REPORTS
INSERT INTO `sys_objects_report` (`name`, `module`, `table_main`, `table_track`, `is_on`, `base_url`, `object_comment`, `trigger_table`, `trigger_field_id`, `trigger_field_author`, `trigger_field_count`, `class_name`, `class_file`) VALUES 
('bx_reviews', 'bx_reviews', 'bx_reviews_reports', 'bx_reviews_reports_track', '1', 'page.php?i=view-review&id={object_id}', 'bx_reviews_notes', 'bx_reviews_reviews', 'id', 'author', 'reports', '', '');

-- VIEWS
INSERT INTO `sys_objects_view` (`name`, `module`, `table_track`, `period`, `is_on`, `trigger_table`, `trigger_field_id`, `trigger_field_author`, `trigger_field_count`, `class_name`, `class_file`) VALUES 
('bx_reviews', 'bx_reviews', 'bx_reviews_views_track', '86400', '1', 'bx_reviews_reviews', 'id', 'author', 'views', '', '');

-- FAVORITES
INSERT INTO `sys_objects_favorite` (`name`, `table_track`, `table_lists`, `is_on`, `is_undo`, `is_public`, `base_url`, `trigger_table`, `trigger_field_id`, `trigger_field_author`, `trigger_field_count`, `class_name`, `class_file`) VALUES 
('bx_reviews', 'bx_reviews_favorites_track', 'bx_reviews_favorites_lists', '1', '1', '1', 'page.php?i=view-review&id={object_id}', 'bx_reviews_reviews', 'id', 'author', 'favorites', '', '');

-- FEATURED
INSERT INTO `sys_objects_feature` (`name`, `module`, `is_on`, `is_undo`, `base_url`, `trigger_table`, `trigger_field_id`, `trigger_field_author`, `trigger_field_flag`, `class_name`, `class_file`) VALUES 
('bx_reviews', 'bx_reviews', '1', '1', 'page.php?i=view-review&id={object_id}', 'bx_reviews_reviews', 'id', 'author', 'featured', '', '');

-- CONTENT INFO
INSERT INTO `sys_objects_content_info` (`name`, `title`, `alert_unit`, `alert_action_add`, `alert_action_update`, `alert_action_delete`, `class_name`, `class_file`) VALUES
('bx_reviews', '_bx_reviews', 'bx_reviews', 'added', 'edited', 'deleted', '', ''),
('bx_reviews_cmts', '_bx_reviews_cmts', 'bx_reviews', 'commentPost', 'commentUpdated', 'commentRemoved', 'BxDolContentInfoCmts', '');

INSERT INTO `sys_content_info_grids` (`object`, `grid_object`, `grid_field_id`, `condition`, `selection`) VALUES
('bx_reviews', 'bx_reviews_administration', 'id', '', ''),
('bx_reviews', 'bx_reviews_common', 'id', '', '');

-- SEARCH EXTENDED
INSERT INTO `sys_objects_search_extended` (`object`, `object_content_info`, `module`, `title`, `active`, `class_name`, `class_file`) VALUES
('bx_reviews', 'bx_reviews', 'bx_reviews', '_bx_reviews_search_extended', 1, '', ''),
('bx_reviews_cmts', 'bx_reviews_cmts', 'bx_reviews', '_bx_reviews_search_extended_cmts', 1, 'BxTemplSearchExtendedCmts', '');

-- STUDIO: page & widget
INSERT INTO `sys_std_pages`(`index`, `name`, `header`, `caption`, `icon`) VALUES
(3, 'bx_reviews', '_bx_reviews', '_bx_reviews', 'bx_reviews@modules/boonex/reviews/|std-icon.svg');
SET @iPageId = LAST_INSERT_ID();

SET @iParentPageId = (SELECT `id` FROM `sys_std_pages` WHERE `name` = 'home');
SET @iParentPageOrder = (SELECT MAX(`order`) FROM `sys_std_pages_widgets` WHERE `page_id` = @iParentPageId);
INSERT INTO `sys_std_widgets` (`page_id`, `module`, `type`, `url`, `click`, `icon`, `caption`, `cnt_notices`, `cnt_actions`) VALUES
(@iPageId, 'bx_reviews', 'content', '{url_studio}module.php?name=bx_reviews', '', 'bx_reviews@modules/boonex/reviews/|std-icon.svg', '_bx_reviews', '', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_actions";s:6:"params";a:0:{}s:5:"class";s:18:"TemplStudioModules";}');
INSERT INTO `sys_std_pages_widgets` (`page_id`, `widget_id`, `order`) VALUES
(@iParentPageId, LAST_INSERT_ID(), IF(ISNULL(@iParentPageOrder), 1, @iParentPageOrder + 1));
