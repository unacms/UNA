
SET @sStorageEngine = (SELECT `value` FROM `sys_options` WHERE `name` = 'sys_storage_default');

-- TABLE: EVENTS
CREATE TABLE IF NOT EXISTS `bx_events_data` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `author` int(10) unsigned NOT NULL,
  `added` int(11) NOT NULL,
  `changed` int(11) NOT NULL,
  `published` int(11) NOT NULL,
  `picture` int(11) NOT NULL,
  `cover` int(11) NOT NULL,
  `cover_data` varchar(50) NOT NULL,
  `event_name` varchar(255) NOT NULL,
  `event_cat` int(11) NOT NULL,
  `event_desc` text NOT NULL,
  `hashtag` varchar(32) NOT NULL,
  `date_start` int(11) DEFAULT NULL,
  `date_end` int(11) DEFAULT NULL,
  `date_max` int(11) DEFAULT NULL,
  `timezone` varchar(255) DEFAULT NULL,
  `labels` text NOT NULL,
  `location` text NOT NULL,
  `threshold` int(11) unsigned NOT NULL default '0',
  `members` int(11) NOT NULL default '0',
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
  `cf` int(11) NOT NULL default '1',
  `join_confirmation` tinyint(4) NOT NULL DEFAULT '0',
  `reminder` int(11) NOT NULL DEFAULT '1',
  `allow_view_to` varchar(16) NOT NULL DEFAULT '3',
  `allow_post_to` varchar(16) NOT NULL DEFAULT '3',
  `status` enum('active','awaiting','hidden') NOT NULL DEFAULT 'active',
  `status_admin` enum('active','hidden','pending') NOT NULL DEFAULT 'active',
  PRIMARY KEY (`id`),
  FULLTEXT KEY `search_fields` (`event_name`, `event_desc`)
);

-- TABLE: REPEATING INTERVALS
CREATE TABLE IF NOT EXISTS `bx_events_intervals` (
  `interval_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `event_id` int(10) unsigned NOT NULL,
  `repeat_year` int(11) NOT NULL,
  `repeat_month` int(11) NOT NULL,
  `repeat_week_of_month` int(11) NOT NULL,
  `repeat_day_of_month` int(11) NOT NULL,
  `repeat_day_of_week` int(11) NOT NULL,
  `repeat_stop` int(10) unsigned NOT NULL,
  PRIMARY KEY (`interval_id`),
  KEY `event_id` (`event_id`)
) AUTO_INCREMENT=1000;


-- TABLE: QUESTIONS
CREATE TABLE IF NOT EXISTS `bx_events_qnr_questions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `content_id` int(10) unsigned NOT NULL DEFAULT '0',
  `added` int(10) NOT NULL DEFAULT '0',
  `action` varchar(16) NOT NULL DEFAULT 'add',
  `question` varchar(255) NOT NULL DEFAULT '',
  `answer` varchar(16) NOT NULL DEFAULT 'text',
  `extra` text NOT NULL,
  `order` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
);

-- TABLE: ANSWERS
CREATE TABLE IF NOT EXISTS `bx_events_qnr_answers` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `question_id` int(10) unsigned NOT NULL DEFAULT '0',
  `profile_id` int(10) unsigned NOT NULL DEFAULT '0',
  `added` int(10) NOT NULL DEFAULT '0',
  `answer` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `answer` (`question_id`, `profile_id`)
);

-- TABLE: SESSIONS
CREATE TABLE IF NOT EXISTS `bx_events_sessions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `event_id` int(10) unsigned NOT NULL DEFAULT '0',
  `added` int(11) NOT NULL DEFAULT '0',
  `title` varchar(255) NOT NULL DEFAULT '',
  `description` text NOT NULL,
  `date_start` int(11) DEFAULT NULL,
  `date_end` int(11) DEFAULT NULL,
  `order` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
);

-- TABLE: STORAGES & TRANSCODERS
CREATE TABLE `bx_events_pics` (
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

CREATE TABLE `bx_events_pics_resized` (
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
CREATE TABLE IF NOT EXISTS `bx_events_cmts` (
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

CREATE TABLE IF NOT EXISTS `bx_events_cmts_notes` (
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

-- TABLE: VIEWS
CREATE TABLE `bx_events_views_track` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `viewer_id` int(11) NOT NULL default '0',
  `viewer_nip` int(11) unsigned NOT NULL default '0',
  `date` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  KEY `id` (`object_id`,`viewer_id`,`viewer_nip`)
);

-- TABLE: VOTES
CREATE TABLE IF NOT EXISTS `bx_events_votes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `count` int(11) NOT NULL default '0',
  `sum` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `object_id` (`object_id`)
);

CREATE TABLE IF NOT EXISTS `bx_events_votes_track` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `author_id` int(11) NOT NULL default '0',
  `author_nip` int(11) unsigned NOT NULL default '0',
  `value` tinyint(4) NOT NULL default '0',
  `date` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  KEY `vote` (`object_id`, `author_nip`)
);

CREATE TABLE IF NOT EXISTS `bx_events_reactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `reaction` varchar(32) NOT NULL default '',
  `count` int(11) NOT NULL default '0',
  `sum` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `reaction` (`object_id`, `reaction`)
);

CREATE TABLE IF NOT EXISTS `bx_events_reactions_track` (
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

-- TABLE: REPORTS
CREATE TABLE IF NOT EXISTS `bx_events_reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `count` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `object_id` (`object_id`)
);

CREATE TABLE IF NOT EXISTS `bx_events_reports_track` (
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

-- TABLE: metas
CREATE TABLE IF NOT EXISTS `bx_events_meta_keywords` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(10) unsigned NOT NULL,
  `keyword` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `object_id` (`object_id`),
  KEY `keyword` (`keyword`)
);

CREATE TABLE IF NOT EXISTS `bx_events_meta_locations` (
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

CREATE TABLE `bx_events_meta_mentions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(10) unsigned NOT NULL,
  `profile_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `object_id` (`object_id`),
  KEY `profile_id` (`profile_id`)
);

-- TABLE: fans
CREATE TABLE IF NOT EXISTS `bx_events_fans` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `initiator` int(11) NOT NULL,
  `content` int(11) NOT NULL,
  `mutual` tinyint(4) NOT NULL,
  `added` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `initiator` (`initiator`,`content`),
  KEY `content` (`content`)
);

-- TABLE: admins
CREATE TABLE IF NOT EXISTS `bx_events_admins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `group_profile_id` int(10) unsigned NOT NULL,
  `fan_id` int(10) unsigned NOT NULL,
  `role` int(10) unsigned NOT NULL default '0',
  `order` varchar(32) NOT NULL default '',
  `added` int(11) unsigned NOT NULL default '0',
  `expired` int(11) unsigned NOT NULL default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `admin` (`group_profile_id`,`fan_id`)
);

-- TABLE: check-in
CREATE TABLE IF NOT EXISTS `bx_events_check_in` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `profile_id` int(10) unsigned NOT NULL,
  `event_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `profile_id` (`profile_id`)
);

-- TABLE: favorites
CREATE TABLE `bx_events_favorites_track` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `author_id` int(11) NOT NULL default '0',
  `list_id` int(11) NOT NULL default '0',
  `date` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  KEY `id` (`object_id`,`author_id`)
);

CREATE TABLE `bx_events_favorites_lists` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `author_id` int(11) NOT NULL default '0',
  `date` int(11) NOT NULL default '0',
  `allow_view_favorite_list_to` varchar(16) NOT NULL DEFAULT '3',
   PRIMARY KEY (`id`)
);

-- TABLE: scores
CREATE TABLE IF NOT EXISTS `bx_events_scores` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `count_up` int(11) NOT NULL default '0',
  `count_down` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `object_id` (`object_id`)
);

CREATE TABLE IF NOT EXISTS `bx_events_scores_track` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `author_id` int(11) NOT NULL default '0',
  `author_nip` int(11) unsigned NOT NULL default '0',
  `type` varchar(8) NOT NULL default '',
  `date` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  KEY `vote` (`object_id`, `author_nip`)
);

CREATE TABLE IF NOT EXISTS `bx_events_invites` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `key` varchar(128) NOT NULL default '0',
  `group_profile_id` int(11) NOT NULL default '0',
  `author_profile_id` int(11) NOT NULL default '0',
  `invited_profile_id` int(11) NOT NULL default '0',
  `added` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`)
);

-- TABLE: Pricing
CREATE TABLE IF NOT EXISTS `bx_events_prices` (
  `id` int(11) NOT NULL auto_increment,
  `profile_id` int(11) NOT NULL default '0',
  `role_id` int(11) unsigned NOT NULL default '0',
  `name` varchar(128) NOT NULL default '',
  `caption` varchar(128) NOT NULL default '',
  `period` int(11) unsigned NOT NULL default '1',
  `period_unit` varchar(32) NOT NULL default '',
  `price` float unsigned NOT NULL default '1',
  `added` int(11) NOT NULL default '0',
  `order` int(11) NOT NULL,
  `default` tinyint(4) NOT NULL default '0',
  `active` tinyint(4) NOT NULL default '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `type` (`profile_id`, `role_id`,`period`, `period_unit`)
);

-- STORAGES & TRANSCODERS
INSERT INTO `sys_objects_storage` (`object`, `engine`, `params`, `token_life`, `cache_control`, `levels`, `table_files`, `ext_mode`, `ext_allow`, `ext_deny`, `quota_size`, `current_size`, `quota_number`, `current_number`, `max_file_size`, `ts`) VALUES
('bx_events_pics', @sStorageEngine, '', 360, 2592000, 3, 'bx_events_pics', 'allow-deny', '{image}', '', 0, 0, 0, 0, 0, 0),
('bx_events_pics_resized', @sStorageEngine, '', 360, 2592000, 3, 'bx_events_pics_resized', 'allow-deny', '{image}', '', 0, 0, 0, 0, 0, 0);

INSERT INTO `sys_objects_transcoder` (`object`, `storage_object`, `source_type`, `source_params`, `private`, `atime_tracking`, `atime_pruning`, `ts`) VALUES 
('bx_events_icon', 'bx_events_pics_resized', 'Storage', 'a:1:{s:6:"object";s:14:"bx_events_pics";}', 'no', '1', '2592000', '0'),
('bx_events_thumb', 'bx_events_pics_resized', 'Storage', 'a:1:{s:6:"object";s:14:"bx_events_pics";}', 'no', '1', '2592000', '0'),
('bx_events_avatar', 'bx_events_pics_resized', 'Storage', 'a:1:{s:6:"object";s:14:"bx_events_pics";}', 'no', '1', '2592000', '0'),
('bx_events_avatar_big', 'bx_events_pics_resized', 'Storage', 'a:1:{s:6:"object";s:14:"bx_events_pics";}', 'no', '1', '2592000', '0'),
('bx_events_picture', 'bx_events_pics_resized', 'Storage', 'a:1:{s:6:"object";s:14:"bx_events_pics";}', 'no', '1', '2592000', '0'),
('bx_events_cover', 'bx_events_pics_resized', 'Storage', 'a:1:{s:6:"object";s:14:"bx_events_pics";}', 'no', '1', '2592000', '0'),
('bx_events_cover_thumb', 'bx_events_pics_resized', 'Storage', 'a:1:{s:6:"object";s:14:"bx_events_pics";}', 'no', '1', '2592000', '0'),
('bx_events_gallery', 'bx_events_pics_resized', 'Storage', 'a:1:{s:6:"object";s:14:"bx_events_pics";}', 'no', '1', '2592000', '0');

INSERT INTO `sys_transcoder_filters` (`transcoder_object`, `filter`, `filter_params`, `order`) VALUES 
('bx_events_icon', 'Resize', 'a:3:{s:1:"w";s:2:"30";s:1:"h";s:2:"30";s:13:"square_resize";s:1:"1";}', '0'),
('bx_events_thumb', 'Resize', 'a:3:{s:1:"w";s:2:"50";s:1:"h";s:2:"50";s:13:"square_resize";s:1:"1";}', '0'),
('bx_events_avatar', 'Resize', 'a:3:{s:1:"w";s:3:"100";s:1:"h";s:3:"100";s:13:"square_resize";s:1:"1";}', '0'),
('bx_events_avatar_big', 'Resize', 'a:3:{s:1:"w";s:3:"200";s:1:"h";s:3:"200";s:13:"square_resize";s:1:"1";}', '0'),
('bx_events_picture', 'Resize', 'a:3:{s:1:"w";s:4:"1024";s:1:"h";s:4:"1024";s:13:"square_resize";s:1:"0";}', '0'),
('bx_events_cover', 'Resize', 'a:1:{s:1:"w";s:4:"1200";}', '0'),
('bx_events_cover_thumb', 'Resize', 'a:3:{s:1:"w";s:2:"48";s:1:"h";s:2:"48";s:13:"square_resize";s:1:"1";}', '0'),
('bx_events_gallery', 'Resize', 'a:1:{s:1:"w";s:3:"500";}', '0');

-- FORMS
INSERT INTO `sys_objects_form`(`object`, `module`, `title`, `action`, `form_attrs`, `table`, `key`, `uri`, `uri_title`, `submit_name`, `params`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_event', 'bx_events', '_bx_events_form_profile', '', 'a:1:{s:7:\"enctype\";s:19:\"multipart/form-data\";}', 'bx_events_data', 'id', '', '', 'do_submit', '', 0, 1, 'BxEventsFormEntry', 'modules/boonex/events/classes/BxEventsFormEntry.php');

INSERT INTO `sys_form_displays`(`object`, `display_name`, `module`, `view_mode`, `title`) VALUES 
('bx_event', 'bx_event_add', 'bx_events', 0, '_bx_events_form_profile_display_add'),
('bx_event', 'bx_event_delete', 'bx_events', 0, '_bx_events_form_profile_display_delete'),
('bx_event', 'bx_event_edit', 'bx_events', 0, '_bx_events_form_profile_display_edit'),
('bx_event', 'bx_event_edit_cover', 'bx_events', 0, '_bx_events_form_profile_display_edit_cover'),
('bx_event', 'bx_event_view', 'bx_events', 1, '_bx_events_form_profile_display_view'),
('bx_event', 'bx_event_view_full', 'bx_events', 1, '_bx_events_form_profile_display_view_full'),
('bx_event', 'bx_event_invite', 'bx_events', 0, '_bx_events_form_profile_display_invite');

INSERT INTO `sys_form_inputs`(`object`, `module`, `name`, `value`, `values`, `checked`, `type`, `caption_system`, `caption`, `info`, `required`, `collapsed`, `html`, `attrs`, `attrs_tr`, `attrs_wrapper`, `checker_func`, `checker_params`, `checker_error`, `db_pass`, `db_params`, `editable`, `deletable`) VALUES 
('bx_event', 'bx_events', 'cf', '1', '#!sys_content_filter', 0, 'select', '_sys_form_entry_input_sys_cf', '_sys_form_entry_input_cf', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 1, 0),
('bx_event', 'bx_events', 'allow_view_to', 3, '', 0, 'custom', '_bx_events_form_profile_input_sys_allow_view_to', '_bx_events_form_profile_input_allow_view_to', '_bx_events_form_profile_input_allow_view_to_desc', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_event', 'bx_events', 'allow_post_to', 'p', '', 0, 'custom', '_bx_events_form_profile_input_sys_allow_post_to', '_bx_events_form_profile_input_allow_post_to', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_event', 'bx_events', 'cover', 'a:1:{i:0;s:20:\"bx_events_cover_crop\";}', 'a:1:{s:20:\"bx_events_cover_crop\";s:24:\"_sys_uploader_crop_title\";}', 0, 'files', '_bx_events_form_profile_input_sys_cover', '_bx_events_form_profile_input_cover', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_event', 'bx_events', 'date_end', 0, '', 0, 'datetime', '_bx_events_form_profile_input_sys_date_end', '_bx_events_form_profile_input_date_end', '', 0, 0, 0, '', '', '', '', '', '_bx_events_form_profile_input_date_end_err', 'DateTimeUtc', '', 1, 0),
('bx_event', 'bx_events', 'date_start', 0, '', 0, 'datetime', '_bx_events_form_profile_input_sys_date_start', '_bx_events_form_profile_input_date_start', '', 0, 0, 0, '', '', '', '', '', '_bx_events_form_profile_input_date_start_err', 'DateTimeUtc', '', 1, 0),
('bx_event', 'bx_events', 'delete_confirm', 1, '', 0, 'checkbox', '_bx_events_form_profile_input_sys_delete_confirm', '_bx_events_form_profile_input_delete_confirm', '_bx_events_form_profile_input_delete_confirm_info', 1, 0, 0, '', '', '', 'avail', '', '_bx_events_form_profile_input_delete_confirm_error', '', '', 1, 0),
('bx_event', 'bx_events', 'do_submit', '_sys_form_account_input_submit', '', 0, 'submit', '_bx_events_form_profile_input_sys_do_submit', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_event', 'bx_events', 'do_cancel', '_sys_form_input_cancel', '', 0, 'button', '_sys_form_input_sys_cancel', '', '', 0, 0, 0, 'a:2:{s:7:"onclick";s:41:"window.open(''{edit_cancel_url}'', ''_self'')";s:5:"class";s:22:"bx-def-margin-sec-left";}', '', '', '', '', '', '', '', 0, 0),
('bx_event', 'bx_events', 'controls', '', 'do_submit,do_cancel', 0, 'input_set', '_sys_form_input_sys_controls', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_event', 'bx_events', 'event_cat', '', '#!bx_events_cats', 0, 'select', '_bx_events_form_profile_input_sys_event_cat', '_bx_events_form_profile_input_event_cat', '', 1, 0, 0, '', '', '', 'avail', '', '_bx_events_form_profile_input_event_cat_err', 'Xss', '', 1, 1),
('bx_event', 'bx_events', 'reminder', '', '#!bx_events_reminder', 0, 'select', '_bx_events_form_profile_input_sys_reminder', '_bx_events_form_profile_input_reminder', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 1, 1),
('bx_event', 'bx_events', 'event_desc', '', '', 0, 'textarea', '_bx_events_form_profile_input_sys_event_desc', '_bx_events_form_profile_input_event_desc', '', 0, 0, 2, '', '', '', '', '', '', 'XssHtml', '', 1, 1),
('bx_event', 'bx_events', 'event_name', '', '', 0, 'text', '_bx_events_form_profile_input_sys_event_name', '_bx_events_form_profile_input_event_name', '', 1, 0, 0, '', '', '', 'Length', 'a:2:{s:3:"min";i:3;s:3:"max";i:160;}', '_bx_events_form_profile_input_event_name_err', 'Xss', '', 1, 0),
('bx_event', 'bx_events', 'hashtag', '', '', 0, 'text', '_bx_events_form_profile_input_sys_hashtag', '_bx_events_form_profile_input_hashtag', '', 1, 0, 0, '', '', '', '', '', '', 'Xss', '', 1, 0),
('bx_event', 'bx_events', 'initial_members', '', '', 0, 'custom', '_bx_events_form_profile_input_sys_initial_members', '_bx_events_form_profile_input_initial_members', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 1),
('bx_event', 'bx_events', 'join_confirmation', 1, '', 0, 'switcher', '_bx_events_form_profile_input_sys_join_confirm', '_bx_events_form_profile_input_join_confirm', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 1, 0),
('bx_event', 'bx_events', 'picture', 'a:1:{i:0;s:22:\"bx_events_picture_crop\";}', 'a:1:{s:22:\"bx_events_picture_crop\";s:24:\"_sys_uploader_crop_title\";}', 0, 'files', '_bx_events_form_profile_input_sys_picture', '_bx_events_form_profile_input_picture', '', 0, 0, 0, '', '', '', '', '', '_bx_events_form_profile_input_picture_err', '', '', 1, 0),
('bx_event', 'bx_events', 'reoccurring', '', '', 0, 'custom', '_bx_events_form_profile_input_sys_reoccurring', '_bx_events_form_profile_input_reoccurring', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 1),
('bx_event', 'bx_events', 'time', '', '', 0, 'custom', '_bx_events_form_profile_input_sys_time', '_bx_events_form_profile_input_time', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_event', 'bx_events', 'timezone', 'UTC', '', 0, 'select', '_bx_events_form_profile_input_sys_timezone', '_bx_events_form_profile_input_timezone', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 1, 0),
('bx_event', 'bx_events', 'added', '', '', 0, 'datetime', '_bx_events_form_profile_input_sys_date_added', '_bx_events_form_profile_input_date_added', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_event', 'bx_events', 'changed', '', '', 0, 'datetime', '_bx_events_form_profile_input_sys_date_changed', '_bx_events_form_profile_input_date_changed', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_event', 'bx_events', 'published', '', '', 0, 'datetime', '_bx_events_form_profile_input_sys_date_published', '_bx_events_form_profile_input_date_published', '_bx_events_form_profile_input_date_published_info', 0, 0, 0, '', '', '', '', '', '', 'DateTimeTs', '', 1, 0),
('bx_event', 'bx_events', 'location', '', '', 0, 'location', '_sys_form_input_sys_location', '_sys_form_input_location', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_event', 'bx_events', 'threshold', '', '', 0, 'text', '_bx_events_form_profile_input_sys_threshold', '_bx_events_form_profile_input_threshold', '', 0, 0, 0, '', '', '', '', '', '', 'Int', '', 1, 0),
('bx_event', 'bx_events', 'labels', '', '', 0, 'custom', '_sys_form_input_sys_labels', '_sys_form_input_labels', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0);

INSERT INTO `sys_form_display_inputs`(`display_name`, `input_name`, `visible_for_levels`, `active`, `order`) VALUES 
('bx_event_add', 'time', 2147483647, 0, 1),
('bx_event_add', 'delete_confirm', 2147483647, 0, 2),
('bx_event_add', 'cover', 2147483647, 0, 3),
('bx_event_add', 'initial_members', 2147483647, 1, 4),
('bx_event_add', 'picture', 2147483647, 0, 5),
('bx_event_add', 'event_name', 2147483647, 1, 6),
('bx_event_add', 'event_cat', 2147483647, 1, 7),
('bx_event_add', 'event_desc', 2147483647, 1, 8),
('bx_event_add', 'location', 2147483647, 1, 9),
('bx_event_add', 'threshold', 2147483647, 1, 10),
('bx_event_add', 'date_start', 2147483647, 1, 11),
('bx_event_add', 'date_end', 2147483647, 1, 12),
('bx_event_add', 'timezone', 2147483647, 1, 13),
('bx_event_add', 'reoccurring', 2147483647, 1, 14),
('bx_event_add', 'join_confirmation', 2147483647, 1, 15),
('bx_event_add', 'reminder', 2147483647, 1, 16),
('bx_event_add', 'allow_view_to', 2147483647, 1, 17),
('bx_event_add', 'allow_post_to', 2147483647, 1, 18),
('bx_event_add', 'cf', 2147483647, 1, 19),
('bx_event_add', 'published', 192, 1, 20),
('bx_event_add', 'do_submit', 2147483647, 1, 21),

('bx_event_invite', 'initial_members', 2147483647, 1, 1),
('bx_event_invite', 'do_submit', 2147483647, 1, 2),

('bx_event_delete', 'cover', 2147483647, 0, 0),
('bx_event_delete', 'picture', 2147483647, 0, 0),
('bx_event_delete', 'delete_confirm', 2147483647, 1, 0),
('bx_event_delete', 'do_submit', 2147483647, 1, 1),
('bx_event_delete', 'event_name', 2147483647, 0, 2),
('bx_event_delete', 'event_cat', 2147483647, 0, 3),

('bx_event_edit', 'time', 2147483647, 0, 1),
('bx_event_edit', 'initial_members', 2147483647, 0, 2),
('bx_event_edit', 'delete_confirm', 2147483647, 0, 3),
('bx_event_edit', 'cover', 2147483647, 0, 4),
('bx_event_edit', 'picture', 2147483647, 0, 5),
('bx_event_edit', 'event_name', 2147483647, 1, 6),
('bx_event_edit', 'event_cat', 2147483647, 1, 7),
('bx_event_edit', 'event_desc', 2147483647, 1, 8),
('bx_event_edit', 'location', 2147483647, 1, 9),
('bx_event_edit', 'threshold', 2147483647, 1, 10),
('bx_event_edit', 'date_start', 2147483647, 1, 11),
('bx_event_edit', 'date_end', 2147483647, 1, 12),
('bx_event_edit', 'timezone', 2147483647, 1, 13),
('bx_event_edit', 'reoccurring', 2147483647, 1, 14),
('bx_event_edit', 'join_confirmation', 2147483647, 1, 15),
('bx_event_edit', 'reminder', 2147483647, 1, 16),
('bx_event_edit', 'allow_view_to', 2147483647, 1, 17),
('bx_event_edit', 'allow_post_to', 2147483647, 1, 18),
('bx_event_edit', 'cf', 2147483647, 1, 19),
('bx_event_edit', 'published', 192, 1, 20),
('bx_event_edit', 'controls', 2147483647, 1, 21),
('bx_event_edit', 'do_submit', 2147483647, 1, 22),
('bx_event_edit', 'do_cancel', 2147483647, 1, 23),

('bx_event_edit_cover', 'allow_view_to', 2147483647, 0, 1),
('bx_event_edit_cover', 'time', 2147483647, 0, 2),
('bx_event_edit_cover', 'reoccurring', 2147483647, 0, 3),
('bx_event_edit_cover', 'join_confirmation', 2147483647, 0, 4),
('bx_event_edit_cover', 'initial_members', 2147483647, 0, 5),
('bx_event_edit_cover', 'timezone', 2147483647, 0, 6),
('bx_event_edit_cover', 'event_desc', 2147483647, 0, 7),
('bx_event_edit_cover', 'date_start', 2147483647, 0, 8),
('bx_event_edit_cover', 'date_end', 2147483647, 0, 9),
('bx_event_edit_cover', 'delete_confirm', 2147483647, 0, 10),
('bx_event_edit_cover', 'event_name', 2147483647, 0, 11),
('bx_event_edit_cover', 'location', 2147483647, 0, 12),
('bx_event_edit_cover', 'picture', 2147483647, 0, 13),
('bx_event_edit_cover', 'event_cat', 2147483647, 0, 14),
('bx_event_edit_cover', 'cover', 2147483647, 1, 15),
('bx_event_edit_cover', 'do_submit', 2147483647, 1, 16),

('bx_event_view', 'allow_view_to', 2147483647, 0, 1),
('bx_event_view', 'reoccurring', 2147483647, 0, 2),
('bx_event_view', 'join_confirmation', 2147483647, 0, 3),
('bx_event_view', 'initial_members', 2147483647, 0, 4),
('bx_event_view', 'delete_confirm', 2147483647, 0, 5),
('bx_event_view', 'picture', 2147483647, 0, 6),
('bx_event_view', 'cover', 2147483647, 0, 7),
('bx_event_view', 'do_submit', 2147483647, 0, 8),
('bx_event_view', 'event_name', 2147483647, 1, 9),
('bx_event_view', 'event_cat', 2147483647, 1, 10),
('bx_event_view', 'date_start', 2147483647, 1, 11),
('bx_event_view', 'date_end', 2147483647, 1, 12),
('bx_event_view', 'time', 2147483647, 1, 13),
('bx_event_view', 'timezone', 2147483647, 1, 14),
('bx_event_view', 'event_desc', 2147483647, 0, 15),
('bx_event_view', 'added', 192, 1, 16),
('bx_event_view', 'changed', 192, 1, 17),
('bx_event_view', 'published', 192, 1, 18),

('bx_event_view_full', 'allow_view_to', 2147483647, 0, 1),
('bx_event_view_full', 'reoccurring', 2147483647, 0, 2),
('bx_event_view_full', 'picture', 2147483647, 0, 3),
('bx_event_view_full', 'join_confirmation', 2147483647, 0, 4),
('bx_event_view_full', 'initial_members', 2147483647, 0, 5),
('bx_event_view_full', 'do_submit', 2147483647, 0, 6),
('bx_event_view_full', 'delete_confirm', 2147483647, 0, 7),
('bx_event_view_full', 'cover', 2147483647, 0, 8),
('bx_event_view_full', 'event_name', 2147483647, 1, 9),
('bx_event_view_full', 'event_cat', 2147483647, 1, 10),
('bx_event_view_full', 'date_start', 2147483647, 1, 11),
('bx_event_view_full', 'date_end', 2147483647, 1, 12),
('bx_event_view_full', 'time', 2147483647, 1, 13),
('bx_event_view_full', 'timezone', 2147483647, 1, 14),
('bx_event_view_full', 'event_desc', 2147483647, 0, 15),
('bx_event_view_full', 'added', 192, 1, 16),
('bx_event_view_full', 'changed', 192, 1, 17),
('bx_event_view_full', 'published', 192, 1, 18);

-- FORMS: Question
INSERT INTO `sys_objects_form`(`object`, `module`, `title`, `action`, `form_attrs`, `table`, `key`, `uri`, `uri_title`, `submit_name`, `params`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_events_question', 'bx_events', '_bx_events_form_question', '', 'a:1:{s:7:\"enctype\";s:19:\"multipart/form-data\";}', 'bx_events_qnr_questions', 'id', '', '', 'do_submit', '', 0, 1, 'BxEventsFormQuestion', 'modules/boonex/events/classes/BxEventsFormQuestion.php');

INSERT INTO `sys_form_displays`(`object`, `display_name`, `module`, `view_mode`, `title`) VALUES 
('bx_events_question', 'bx_events_question_add', 'bx_events', 0, '_bx_events_form_question_display_add'),
('bx_events_question', 'bx_events_question_edit', 'bx_events', 0, '_bx_events_form_question_display_edit');

INSERT INTO `sys_form_inputs`(`object`, `module`, `name`, `value`, `values`, `checked`, `type`, `caption_system`, `caption`, `info`, `required`, `collapsed`, `html`, `attrs`, `attrs_tr`, `attrs_wrapper`, `checker_func`, `checker_params`, `checker_error`, `db_pass`, `db_params`, `editable`, `deletable`) VALUES 
('bx_events_question', 'bx_events', 'action', 'add', '', 0, 'hidden', '_bx_events_form_question_input_sys_action', '', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_events_question', 'bx_events', 'question', '', '', 0, 'text', '_bx_events_form_question_input_sys_question', '_bx_events_form_question_input_question', '', 1, 0, 0, '', '', '', 'Avail', '', '_bx_events_form_question_input_question_err', 'Xss', '', 1, 0),
('bx_events_question', 'bx_events', 'answer', 'text', '', 0, 'hidden', '_bx_events_form_question_input_sys_answer', '', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_events_question', 'bx_events', 'controls', '_bx_events_form_question_input_sys_controls', 'do_submit,do_cancel', 0, 'input_set', '', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_events_question', 'bx_events', 'do_submit', '_bx_events_form_question_input_do_submit', '', 0, 'submit', '_bx_events_form_question_input_sys_do_submit', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_events_question', 'bx_events', 'do_cancel', '_bx_events_form_question_input_do_cancel', '', 0, 'button', '_bx_events_form_question_input_sys_do_cancel', '', '', 0, 0, 0, 'a:2:{s:7:"onclick";s:45:"$(''.bx-popup-applied:visible'').dolPopupHide()";s:5:"class";s:22:"bx-def-margin-sec-left";}', '', '', '', '', '', '', '', 1, 0);

INSERT INTO `sys_form_display_inputs`(`display_name`, `input_name`, `visible_for_levels`, `active`, `order`) VALUES 
('bx_events_question_add', 'action', 2147483647, 1, 1),
('bx_events_question_add', 'question', 2147483647, 1, 2),
('bx_events_question_add', 'answer', 2147483647, 1, 3),
('bx_events_question_add', 'controls', 2147483647, 1, 4),
('bx_events_question_add', 'do_submit', 2147483647, 1, 5),
('bx_events_question_add', 'do_cancel', 2147483647, 1, 6),

('bx_events_question_edit', 'action', 2147483647, 1, 1),
('bx_events_question_edit', 'question', 2147483647, 1, 2),
('bx_events_question_edit', 'answer', 2147483647, 1, 3),
('bx_events_question_edit', 'controls', 2147483647, 1, 4),
('bx_events_question_edit', 'do_submit', 2147483647, 1, 5),
('bx_events_question_edit', 'do_cancel', 2147483647, 1, 6);

-- FORMS: Session
INSERT INTO `sys_objects_form`(`object`, `module`, `title`, `action`, `form_attrs`, `table`, `key`, `uri`, `uri_title`, `submit_name`, `params`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_events_session', 'bx_events', '_bx_events_form_session', '', 'a:1:{s:7:\"enctype\";s:19:\"multipart/form-data\";}', 'bx_events_sessions', 'id', '', '', 'do_submit', '', 0, 1, 'BxEventsFormSession', 'modules/boonex/events/classes/BxEventsFormSession.php');

INSERT INTO `sys_form_displays`(`object`, `display_name`, `module`, `view_mode`, `title`) VALUES 
('bx_events_session', 'bx_events_session_add', 'bx_events', 0, '_bx_events_form_session_display_add'),
('bx_events_session', 'bx_events_session_edit', 'bx_events', 0, '_bx_events_form_session_display_edit');

INSERT INTO `sys_form_inputs`(`object`, `module`, `name`, `value`, `values`, `checked`, `type`, `caption_system`, `caption`, `info`, `required`, `collapsed`, `html`, `attrs`, `attrs_tr`, `attrs_wrapper`, `checker_func`, `checker_params`, `checker_error`, `db_pass`, `db_params`, `editable`, `deletable`) VALUES 
('bx_events_session', 'bx_events', 'title', '', '', 0, 'text', '_bx_events_form_session_input_sys_title', '_bx_events_form_session_input_title', '', 1, 0, 0, '', '', '', 'Length', 'a:2:{s:3:"min";i:3;s:3:"max";i:160;}', '_bx_events_form_session_input_title_err', 'Xss', '', 1, 0),
('bx_events_session', 'bx_events', 'description', '', '', 0, 'textarea', '_bx_events_form_session_input_sys_description', '_bx_events_form_session_input_description', '', 0, 0, 2, '', '', '', '', '', '', 'XssHtml', '', 1, 1),
('bx_events_session', 'bx_events', 'date_start', 0, '', 0, 'datetime', '_bx_events_form_session_input_sys_date_start', '_bx_events_form_session_input_date_start', '', 1, 0, 0, '', '', '', 'DateTime', '', '_bx_events_form_session_input_date_start_err', 'DateTimeTs', '', 1, 0),
('bx_events_session', 'bx_events', 'date_end', 0, '', 0, 'datetime', '_bx_events_form_session_input_sys_date_end', '_bx_events_form_session_input_date_end', '', 1, 0, 0, '', '', '', 'DateTime', '', '_bx_events_form_session_input_date_end_err', 'DateTimeTs', '', 1, 0),
('bx_events_session', 'bx_events', 'controls', '_bx_events_form_session_input_sys_controls', 'do_submit,do_cancel', 0, 'input_set', '', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_events_session', 'bx_events', 'do_submit', '_bx_events_form_session_input_do_submit', '', 0, 'submit', '_bx_events_form_session_input_sys_do_submit', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_events_session', 'bx_events', 'do_cancel', '_bx_events_form_session_input_do_cancel', '', 0, 'button', '_bx_events_form_session_input_sys_do_cancel', '', '', 0, 0, 0, 'a:2:{s:7:"onclick";s:45:"$(''.bx-popup-applied:visible'').dolPopupHide()";s:5:"class";s:22:"bx-def-margin-sec-left";}', '', '', '', '', '', '', '', 1, 0);

INSERT INTO `sys_form_display_inputs`(`display_name`, `input_name`, `visible_for_levels`, `active`, `order`) VALUES 
('bx_events_session_add', 'title', 2147483647, 1, 1),
('bx_events_session_add', 'description', 2147483647, 1, 2),
('bx_events_session_add', 'date_start', 2147483647, 1, 3),
('bx_events_session_add', 'date_end', 2147483647, 1, 4),
('bx_events_session_add', 'controls', 2147483647, 1, 5),
('bx_events_session_add', 'do_submit', 2147483647, 1, 6),
('bx_events_session_add', 'do_cancel', 2147483647, 1, 7),

('bx_events_session_edit', 'title', 2147483647, 1, 1),
('bx_events_session_edit', 'description', 2147483647, 1, 2),
('bx_events_session_edit', 'date_start', 2147483647, 1, 3),
('bx_events_session_edit', 'date_end', 2147483647, 1, 4),
('bx_events_session_edit', 'controls', 2147483647, 1, 5),
('bx_events_session_edit', 'do_submit', 2147483647, 1, 6),
('bx_events_session_edit', 'do_cancel', 2147483647, 1, 7);

-- FORMS: Price
INSERT INTO `sys_objects_form` (`object`, `module`, `title`, `action`, `form_attrs`, `submit_name`, `table`, `key`, `uri`, `uri_title`, `params`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES
('bx_events_price', 'bx_events', '_bx_events_form_price', '', '', 'do_submit', 'bx_events_prices', 'id', '', '', '', 0, 1, 'BxEventsFormPrice', 'modules/boonex/events/classes/BxEventsFormPrice.php');

INSERT INTO `sys_form_displays` (`display_name`, `module`, `object`, `title`, `view_mode`) VALUES
('bx_events_price_add', 'bx_events', 'bx_events_price', '_bx_events_form_price_display_add', 0),
('bx_events_price_edit', 'bx_events', 'bx_events_price', '_bx_events_form_price_display_edit', 0);

INSERT INTO `sys_form_inputs` (`object`, `module`, `name`, `value`, `values`, `checked`, `type`, `caption_system`, `caption`, `info`, `required`, `collapsed`, `html`, `attrs`, `attrs_tr`, `attrs_wrapper`, `checker_func`, `checker_params`, `checker_error`, `db_pass`, `db_params`, `editable`, `deletable`) VALUES
('bx_events_price', 'bx_events', 'id', '', '', 0, 'hidden', '_bx_events_form_price_input_sys_id', '', '', 1, 0, 0, '', '', '', '', '', '', 'Int', '', 1, 0),
('bx_events_price', 'bx_events', 'role_id', '', '', 0, 'select', '_bx_events_form_price_input_sys_role_id', '_bx_events_form_price_input_role_id', '', 1, 0, 0, '', '', '', '', '', '_bx_events_form_price_input_err_role_id', 'Xss', '', 1, 0),
('bx_events_price', 'bx_events', 'name', '', '', 0, 'text', '_bx_events_form_price_input_sys_name', '_bx_events_form_price_input_name', '_bx_events_form_price_input_inf_name', 1, 0, 0, '', '', '', 'Avail', '', '_bx_events_form_price_input_err_name', 'Xss', '', 1, 0),
('bx_events_price', 'bx_events', 'caption', '', '', 0, 'text', '_bx_events_form_price_input_sys_caption', '_bx_events_form_price_input_caption', '_bx_events_form_price_input_inf_caption', 1, 0, 0, '', '', '', 'Avail', '', '_bx_events_form_price_input_err_caption', 'Xss', '', 1, 0),
('bx_events_price', 'bx_events', 'period', '', '', 0, 'text', '_bx_events_form_price_input_sys_period', '_bx_events_form_price_input_period', '_bx_events_form_price_input_inf_period', 1, 0, 0, '', '', '', '', '', '', 'Int', '', 1, 0),
('bx_events_price', 'bx_events', 'period_unit', '', '#!bx_events_period_units', 0, 'select', '_bx_events_form_price_input_sys_period_unit', '_bx_events_form_price_input_period_unit', '_bx_events_form_price_input_inf_period_unit', 1, 0, 0, '', '', '', '', '', '', 'Xss', '', 1, 0),
('bx_events_price', 'bx_events', 'price', '', '', 0, 'price', '_bx_events_form_price_input_sys_price', '_bx_events_form_price_input_price', '_bx_events_form_price_input_inf_price', 1, 0, 0, '', '', '', '', '', '', 'Float', '', 1, 0),
('bx_events_price', 'bx_events', 'default', 1, '', 0, 'switcher', '_bx_events_form_price_input_sys_default', '_bx_events_form_price_input_default', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 1, 0),
('bx_events_price', 'bx_events', 'controls', '', 'do_submit,do_cancel', 0, 'input_set', '', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_events_price', 'bx_events', 'do_submit', '_bx_events_form_price_input_do_submit', '', 0, 'submit', '_bx_events_form_price_input_sys_do_submit', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_events_price', 'bx_events', 'do_cancel', '_bx_events_form_price_input_do_cancel', '', 0, 'button', '_bx_events_form_price_input_sys_do_cancel', '', '', 0, 0, 0, 'a:2:{s:7:"onclick";s:45:"$(''.bx-popup-applied:visible'').dolPopupHide()";s:5:"class";s:22:"bx-def-margin-sec-left";}', '', '', '', '', '', '', '', 1, 0);

INSERT INTO `sys_form_display_inputs` (`display_name`, `input_name`, `visible_for_levels`, `active`, `order`) VALUES
('bx_events_price_add', 'id', 2147483647, 0, 1),
('bx_events_price_add', 'role_id', 2147483647, 1, 2),
('bx_events_price_add', 'name', 2147483647, 1, 3),
('bx_events_price_add', 'caption', 2147483647, 1, 4),
('bx_events_price_add', 'price', 2147483647, 1, 5),
('bx_events_price_add', 'period', 2147483647, 1, 6),
('bx_events_price_add', 'period_unit', 2147483647, 1, 7),
('bx_events_price_add', 'default', 2147483647, 1, 8),
('bx_events_price_add', 'controls', 2147483647, 1, 9),
('bx_events_price_add', 'do_submit', 2147483647, 1, 10),
('bx_events_price_add', 'do_cancel', 2147483647, 1, 11),

('bx_events_price_edit', 'id', 2147483647, 1, 1),
('bx_events_price_edit', 'role_id', 2147483647, 1, 2),
('bx_events_price_edit', 'name', 2147483647, 1, 3),
('bx_events_price_edit', 'caption', 2147483647, 1, 4),
('bx_events_price_edit', 'price', 2147483647, 1, 5),
('bx_events_price_edit', 'period', 2147483647, 1, 6),
('bx_events_price_edit', 'period_unit', 2147483647, 1, 7),
('bx_events_price_edit', 'default', 2147483647, 1, 8),
('bx_events_price_edit', 'controls', 2147483647, 1, 9),
('bx_events_price_edit', 'do_submit', 2147483647, 1, 10),
('bx_events_price_edit', 'do_cancel', 2147483647, 1, 11);

-- PRE-VALUES
INSERT INTO `sys_form_pre_lists`(`key`, `title`, `module`, `use_for_sets`) VALUES
('bx_events_reminder', '_bx_events_pre_lists_reminder', 'bx_events', '0');

INSERT INTO `sys_form_pre_values`(`Key`, `Value`, `Order`, `LKey`, `LKey2`) VALUES
('bx_events_reminder', '0', 0, '_bx_events_reminder_none', ''),
('bx_events_reminder', '1', 1, '_bx_events_reminder_1h', ''),
('bx_events_reminder', '2', 2, '_bx_events_reminder_2h', ''),
('bx_events_reminder', '3', 3, '_bx_events_reminder_3h', ''),
('bx_events_reminder', '6', 4, '_bx_events_reminder_6h', ''),
('bx_events_reminder', '12', 5, '_bx_events_reminder_12h', ''),
('bx_events_reminder', '24', 6, '_bx_events_reminder_24h', '');

INSERT INTO `sys_form_pre_lists`(`key`, `title`, `module`, `use_for_sets`) VALUES
('bx_events_cats', '_bx_events_pre_lists_cats', 'bx_events', '0');

INSERT INTO `sys_form_pre_values`(`Key`, `Value`, `Order`, `LKey`, `LKey2`) VALUES
('bx_events_cats', '', 0, '_sys_please_select', ''),
('bx_events_cats', '1', 1, '_bx_events_cat_Conference', ''),
('bx_events_cats', '2', 2, '_bx_events_cat_Festival', ''),
('bx_events_cats', '3', 3, '_bx_events_cat_Fundraiser', ''),
('bx_events_cats', '4', 4, '_bx_events_cat_Lecture', ''),
('bx_events_cats', '5', 5, '_bx_events_cat_Market', ''),
('bx_events_cats', '6', 6, '_bx_events_cat_Meal', ''),
('bx_events_cats', '7', 7, '_bx_events_cat_Social_Mixer', ''),
('bx_events_cats', '8', 8, '_bx_events_cat_Tour', ''),
('bx_events_cats', '9', 9, '_bx_events_cat_Volunteering', ''),
('bx_events_cats', '10', 10, '_bx_events_cat_Workshop', ''),
('bx_events_cats', '11', 11, '_bx_events_cat_Other', '');

INSERT INTO `sys_form_pre_lists`(`key`, `title`, `module`, `use_for_sets`) VALUES
('bx_events_roles', '_bx_events_pre_lists_roles', 'bx_events', '1');

INSERT INTO `sys_form_pre_values`(`Key`, `Value`, `Order`, `LKey`, `LKey2`) VALUES
('bx_events_roles', '0', 1, '_bx_events_role_regular', ''),
('bx_events_roles', '1', 2, '_bx_events_role_administrator', ''),
('bx_events_roles', '2', 3, '_bx_events_role_moderator', '');

INSERT INTO `sys_form_pre_lists`(`key`, `title`, `module`, `use_for_sets`) VALUES
('bx_events_period_units', '_bx_events_pre_lists_period_units', 'bx_events', '0');

INSERT INTO `sys_form_pre_values`(`Key`, `Value`, `Order`, `LKey`, `LKey2`) VALUES
('bx_events_period_units', '', 0, '_sys_please_select', ''),
('bx_events_period_units', 'day', 1, '_bx_events_period_unit_day', ''),
('bx_events_period_units', 'week', 2, '_bx_events_period_unit_week', ''),
('bx_events_period_units', 'month', 3, '_bx_events_period_unit_month', ''),
('bx_events_period_units', 'year', 4, '_bx_events_period_unit_year', '');

INSERT INTO `sys_form_pre_lists`(`key`, `title`, `module`, `use_for_sets`) VALUES
('bx_events_repeat_year', '_bx_events_pre_lists_repeat_year', 'bx_events', '0');

INSERT INTO `sys_form_pre_values`(`Key`, `Value`, `Order`, `LKey`, `LKey2`) VALUES
('bx_events_repeat_year', '1', 1, '_bx_events_cat_repeat_year_every_year', ''),
('bx_events_repeat_year', '2', 2, '_bx_events_cat_repeat_year_every_2_years', ''),
('bx_events_repeat_year', '3', 3, '_bx_events_cat_repeat_year_every_3_years', ''),
('bx_events_repeat_year', '4', 4, '_bx_events_cat_repeat_year_every_4_years', '');

INSERT INTO `sys_form_pre_lists`(`key`, `title`, `module`, `use_for_sets`) VALUES
('bx_events_repeat_month', '_bx_events_pre_lists_repeat_month', 'bx_events', '0');

INSERT INTO `sys_form_pre_values`(`Key`, `Value`, `Order`, `LKey`, `LKey2`) VALUES
('bx_events_repeat_month', '0', 0, '_bx_events_cat_repeat_month_every_month', ''),
('bx_events_repeat_month', '1', 1, '_bx_events_cat_repeat_month_jan', ''),
('bx_events_repeat_month', '2', 2, '_bx_events_cat_repeat_month_feb', ''),
('bx_events_repeat_month', '3', 3, '_bx_events_cat_repeat_month_mar', ''),
('bx_events_repeat_month', '4', 4, '_bx_events_cat_repeat_month_apr', ''),
('bx_events_repeat_month', '5', 5, '_bx_events_cat_repeat_month_may', ''),
('bx_events_repeat_month', '6', 6, '_bx_events_cat_repeat_month_jun', ''),
('bx_events_repeat_month', '7', 7, '_bx_events_cat_repeat_month_jul', ''),
('bx_events_repeat_month', '8', 8, '_bx_events_cat_repeat_month_aug', ''),
('bx_events_repeat_month', '9', 9, '_bx_events_cat_repeat_month_sep', ''),
('bx_events_repeat_month', '10', 10, '_bx_events_cat_repeat_month_oct', ''),
('bx_events_repeat_month', '11', 11, '_bx_events_cat_repeat_month_nov', ''),
('bx_events_repeat_month', '12', 12, '_bx_events_cat_repeat_month_dec', '');

INSERT INTO `sys_form_pre_lists`(`key`, `title`, `module`, `use_for_sets`) VALUES
('bx_events_repeat_week_of_month', '_bx_events_pre_lists_repeat_week_of_month', 'bx_events', '0');

INSERT INTO `sys_form_pre_values`(`Key`, `Value`, `Order`, `LKey`, `LKey2`) VALUES
('bx_events_repeat_week_of_month', '0', 0, '_bx_events_cat_repeat_week_of_month_every_week', ''),
('bx_events_repeat_week_of_month', '1', 1, '_bx_events_cat_repeat_week_of_month_first_week_of_month', ''),
('bx_events_repeat_week_of_month', '2', 2, '_bx_events_cat_repeat_week_of_month_second_week_of_month', ''),
('bx_events_repeat_week_of_month', '3', 3, '_bx_events_cat_repeat_week_of_month_third_week_of_month', ''),
('bx_events_repeat_week_of_month', '4', 4, '_bx_events_cat_repeat_week_of_month_fourth_week_of_month', ''),
('bx_events_repeat_week_of_month', '5', 5, '_bx_events_cat_repeat_week_of_month_fifth_week_of_month', ''),
('bx_events_repeat_week_of_month', '6', 6, '_bx_events_cat_repeat_week_of_month_sixth_week_of_month', '');

INSERT INTO `sys_form_pre_lists`(`key`, `title`, `module`, `use_for_sets`) VALUES
('bx_events_repeat_day_of_month', '_bx_events_pre_lists_repeat_day_of_month', 'bx_events', '0');

INSERT INTO `sys_form_pre_values`(`Key`, `Value`, `Order`, `LKey`, `LKey2`) VALUES
('bx_events_repeat_day_of_month', '0', 0, '_bx_events_cat_repeat_day_of_month_every_day', ''),
('bx_events_repeat_day_of_month', '1', 1, '1', ''),
('bx_events_repeat_day_of_month', '2', 2, '2', ''),
('bx_events_repeat_day_of_month', '3', 3, '3', ''),
('bx_events_repeat_day_of_month', '4', 4, '4', ''),
('bx_events_repeat_day_of_month', '5', 5, '5', ''),
('bx_events_repeat_day_of_month', '6', 6, '6', ''),
('bx_events_repeat_day_of_month', '7', 7, '7', ''),
('bx_events_repeat_day_of_month', '8', 8, '8', ''),
('bx_events_repeat_day_of_month', '9', 9, '9', ''),
('bx_events_repeat_day_of_month', '10', 10, '10', ''),
('bx_events_repeat_day_of_month', '11', 11, '11', ''),
('bx_events_repeat_day_of_month', '12', 12, '12', ''),
('bx_events_repeat_day_of_month', '13', 13, '13', ''),
('bx_events_repeat_day_of_month', '14', 14, '14', ''),
('bx_events_repeat_day_of_month', '15', 15, '15', ''),
('bx_events_repeat_day_of_month', '16', 16, '16', ''),
('bx_events_repeat_day_of_month', '17', 17, '17', ''),
('bx_events_repeat_day_of_month', '18', 18, '18', ''),
('bx_events_repeat_day_of_month', '19', 19, '19', ''),
('bx_events_repeat_day_of_month', '20', 20, '20', ''),
('bx_events_repeat_day_of_month', '21', 21, '21', ''),
('bx_events_repeat_day_of_month', '22', 22, '22', ''),
('bx_events_repeat_day_of_month', '23', 23, '23', ''),
('bx_events_repeat_day_of_month', '24', 24, '24', ''),
('bx_events_repeat_day_of_month', '25', 25, '25', ''),
('bx_events_repeat_day_of_month', '26', 26, '26', ''),
('bx_events_repeat_day_of_month', '27', 27, '27', ''),
('bx_events_repeat_day_of_month', '28', 28, '28', ''),
('bx_events_repeat_day_of_month', '29', 29, '29', ''),
('bx_events_repeat_day_of_month', '30', 30, '30', ''),
('bx_events_repeat_day_of_month', '31', 31, '31', '');

INSERT INTO `sys_form_pre_lists`(`key`, `title`, `module`, `use_for_sets`) VALUES
('bx_events_repeat_day_of_week', '_bx_events_pre_lists_repeat_day_of_week', 'bx_events', '0');

INSERT INTO `sys_form_pre_values`(`Key`, `Value`, `Order`, `LKey`, `LKey2`) VALUES
('bx_events_repeat_day_of_week', '0', 0, '_bx_events_cat_repeat_day_of_week_every_day', ''),
('bx_events_repeat_day_of_week', '1', 1, '_bx_events_cat_repeat_day_of_week_mon', ''),
('bx_events_repeat_day_of_week', '2', 2, '_bx_events_cat_repeat_day_of_week_tue', ''),
('bx_events_repeat_day_of_week', '3', 3, '_bx_events_cat_repeat_day_of_week_wed', ''),
('bx_events_repeat_day_of_week', '4', 4, '_bx_events_cat_repeat_day_of_week_thu', ''),
('bx_events_repeat_day_of_week', '5', 5, '_bx_events_cat_repeat_day_of_week_fri', ''),
('bx_events_repeat_day_of_week', '6', 6, '_bx_events_cat_repeat_day_of_week_sat', ''),
('bx_events_repeat_day_of_week', '7', 7, '_bx_events_cat_repeat_day_of_week_sun', '');

-- COMMENTS
INSERT INTO `sys_objects_cmts` (`Name`, `Module`, `Table`, `CharsPostMin`, `CharsPostMax`, `CharsDisplayMax`, `Html`, `PerView`, `PerViewReplies`, `BrowseType`, `IsBrowseSwitch`, `PostFormPosition`, `NumberOfLevels`, `IsDisplaySwitch`, `IsRatable`, `ViewingThreshold`, `IsOn`, `RootStylePrefix`, `BaseUrl`, `ObjectVote`, `TriggerTable`, `TriggerFieldId`, `TriggerFieldAuthor`, `TriggerFieldTitle`, `TriggerFieldComments`, `ClassName`, `ClassFile`) VALUES
('bx_events', 'bx_events', 'bx_events_cmts', 1, 5000, 1000, 3, 5, 3, 'tail', 1, 'bottom', 1, 1, 1, -3, 1, 'cmt', 'page.php?i=view-event-profile&id={object_id}', '', 'bx_events_data', 'id', 'author', 'event_name', 'comments', 'BxEventsCmts', 'modules/boonex/events/classes/BxEventsCmts.php'),
('bx_events_notes', 'bx_events', 'bx_events_cmts_notes', 1, 5000, 1000, 0, 5, 3, 'tail', 1, 'bottom', 1, 1, 1, -3, 1, 'cmt', 'page.php?i=view-post&id={object_id}', '', 'bx_events_data', 'id', 'author', 'event_name', '', 'BxTemplCmtsNotes', '');

-- VIEWS
INSERT INTO `sys_objects_view` (`name`, `module`, `table_track`, `period`, `is_on`, `trigger_table`, `trigger_field_id`, `trigger_field_author`, `trigger_field_count`, `class_name`, `class_file`) VALUES 
('bx_events', 'bx_events', 'bx_events_views_track', '86400', '1', 'bx_events_data', 'id', 'author', 'views', '', '');

-- VOTES
INSERT INTO `sys_objects_vote` (`Name`, `Module`, `TableMain`, `TableTrack`, `PostTimeout`, `MinValue`, `MaxValue`, `IsUndo`, `IsOn`, `TriggerTable`, `TriggerFieldId`, `TriggerFieldAuthor`, `TriggerFieldRate`, `TriggerFieldRateCount`, `ClassName`, `ClassFile`) VALUES 
('bx_events', 'bx_events', 'bx_events_votes', 'bx_events_votes_track', '604800', '1', '1', '0', '1', 'bx_events_data', 'id', 'author', 'rate', 'votes', '', ''),
('bx_events_reactions', 'bx_events', 'bx_events_reactions', 'bx_events_reactions_track', '604800', '1', '1', '1', '1', 'bx_events_data', 'id', 'author', 'rrate', 'rvotes', 'BxTemplVoteReactions', '');

-- SCORES
INSERT INTO `sys_objects_score` (`name`, `module`, `table_main`, `table_track`, `post_timeout`, `is_on`, `trigger_table`, `trigger_field_id`, `trigger_field_author`, `trigger_field_score`, `trigger_field_cup`, `trigger_field_cdown`, `class_name`, `class_file`) VALUES 
('bx_events', 'bx_events', 'bx_events_scores', 'bx_events_scores_track', '604800', '1', 'bx_events_data', 'id', 'author', 'score', 'sc_up', 'sc_down', '', '');

-- REPORTS
INSERT INTO `sys_objects_report` (`name`, `module`, `table_main`, `table_track`, `is_on`, `base_url`, `object_comment`, `trigger_table`, `trigger_field_id`, `trigger_field_author`, `trigger_field_count`, `class_name`, `class_file`) VALUES 
('bx_events', 'bx_events', 'bx_events_reports', 'bx_events_reports_track', '1', 'page.php?i=view-event-profile&id={object_id}', 'bx_events_notes', 'bx_events_data', 'id', 'author', 'reports', '', '');

-- FAVORITES
INSERT INTO `sys_objects_favorite` (`name`, `table_track`, `table_lists`, `is_on`, `is_undo`, `is_public`, `base_url`, `trigger_table`, `trigger_field_id`, `trigger_field_author`, `trigger_field_count`, `class_name`, `class_file`) VALUES 
('bx_events', 'bx_events_favorites_track', 'bx_events_favorites_lists', '1', '1', '1', 'page.php?i=view-event-profile&id={object_id}', 'bx_events_data', 'id', 'author', 'favorites', '', '');

-- FEATURED
INSERT INTO `sys_objects_feature` (`name`, `module`, `is_on`, `is_undo`, `base_url`, `trigger_table`, `trigger_field_id`, `trigger_field_author`, `trigger_field_flag`, `class_name`, `class_file`) VALUES 
('bx_events', 'bx_events', '1', '1', 'page.php?i=view-event-profile&id={object_id}', 'bx_events_data', 'id', 'author', 'featured', '', '');

-- CONTENT INFO
INSERT INTO `sys_objects_content_info` (`name`, `title`, `alert_unit`, `alert_action_add`, `alert_action_update`, `alert_action_delete`, `class_name`, `class_file`) VALUES
('bx_events', '_bx_events', 'bx_events', 'added', 'edited', 'deleted', '', ''),
('bx_events_cmts', '_bx_events_cmts', 'bx_events', 'commentPost', 'commentUpdated', 'commentRemoved', 'BxDolContentInfoCmts', '');

INSERT INTO `sys_content_info_grids` (`object`, `grid_object`, `grid_field_id`, `condition`, `selection`) VALUES
('bx_events', 'bx_events_administration', 'td`.`id', '', ''),
('bx_events', 'bx_events_common', 'td`.`id', '', '');

-- SEARCH EXTENDED
INSERT INTO `sys_objects_search_extended` (`object`, `object_content_info`, `module`, `title`, `active`, `class_name`, `class_file`) VALUES
('bx_events', 'bx_events', 'bx_events', '_bx_events_search_extended', 1, '', ''),
('bx_events_cmts', 'bx_events_cmts', 'bx_events', '_bx_events_search_extended_cmts', 1, 'BxTemplSearchExtendedCmts', '');

-- STUDIO PAGE & WIDGET
INSERT INTO `sys_std_pages`(`index`, `name`, `header`, `caption`, `icon`) VALUES
(3, 'bx_events', '_bx_events', '_bx_events', 'bx_events@modules/boonex/events/|std-icon.svg');
SET @iPageId = LAST_INSERT_ID();

SET @iParentPageId = (SELECT `id` FROM `sys_std_pages` WHERE `name` = 'home');
SET @iParentPageOrder = (SELECT MAX(`order`) FROM `sys_std_pages_widgets` WHERE `page_id` = @iParentPageId);
INSERT INTO `sys_std_widgets` (`page_id`, `module`, `type`, `url`, `click`, `icon`, `caption`, `cnt_notices`, `cnt_actions`) VALUES
(@iPageId, 'bx_events', 'content', '{url_studio}module.php?name=bx_events', '', 'bx_events@modules/boonex/events/|std-icon.svg', '_bx_events', '', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_actions";s:6:"params";a:0:{}s:5:"class";s:18:"TemplStudioModules";}');
INSERT INTO `sys_std_pages_widgets` (`page_id`, `widget_id`, `order`) VALUES
(@iParentPageId, LAST_INSERT_ID(), IF(ISNULL(@iParentPageOrder), 1, @iParentPageOrder + 1));

