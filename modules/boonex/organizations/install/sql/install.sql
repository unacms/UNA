
SET @sStorageEngine = (SELECT `value` FROM `sys_options` WHERE `name` = 'sys_storage_default');

-- TABLE: PROFILES
CREATE TABLE IF NOT EXISTS `bx_organizations_data` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `author` int(10) unsigned NOT NULL,
  `added` int(11) NOT NULL,
  `changed` int(11) NOT NULL,
  `picture` int(11) NOT NULL,
  `cover` int(11) NOT NULL,
  `cover_data` varchar(50) NOT NULL,
  `badge` int(11) NOT NULL default '0',
  `badge_link` varchar(255) NOT NULL default '',
  `org_name` varchar(255) NOT NULL,
  `org_cat` int(11) NOT NULL,
  `multicat` text NOT NULL,
  `org_desc` text NOT NULL,
  `labels` text NOT NULL,
  `location` text NOT NULL,
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
  `join_confirmation` tinyint(4) NOT NULL DEFAULT '1',
  `allow_view_to` varchar(16) NOT NULL DEFAULT '3',
  `allow_post_to` varchar(16) NOT NULL DEFAULT '5',
  `allow_contact_to` varchar(16) NOT NULL DEFAULT '3',
  `status` enum('active','awaiting','hidden') NOT NULL DEFAULT 'active',
  `settings` text NOT NULL,
  PRIMARY KEY (`id`),
  FULLTEXT KEY `search_fields` (`org_name`,`org_desc`)
);

-- TABLE: STORAGES & TRANSCODERS
CREATE TABLE IF NOT EXISTS `bx_organizations_pics` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `profile_id` int(10) unsigned NOT NULL,
  `remote_id` varchar(128) NOT NULL,
  `path` varchar(255) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `mime_type` varchar(128) NOT NULL,
  `ext` varchar(32) NOT NULL,
  `dimensions` varchar(12) NOT NULL,
  `size` bigint(20) NOT NULL,
  `added` int(11) NOT NULL,
  `modified` int(11) NOT NULL,
  `private` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `remote_id` (`remote_id`)
);

CREATE TABLE IF NOT EXISTS `bx_organizations_pics_resized` (
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
CREATE TABLE IF NOT EXISTS `bx_organizations_cmts` (
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

CREATE TABLE IF NOT EXISTS `bx_organizations_cmts_notes` (
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
CREATE TABLE IF NOT EXISTS `bx_organizations_views_track` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `viewer_id` int(11) NOT NULL default '0',
  `viewer_nip` int(11) unsigned NOT NULL default '0',
  `date` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  KEY `id` (`object_id`,`viewer_id`,`viewer_nip`)
);

-- TABLE: VOTES
CREATE TABLE IF NOT EXISTS `bx_organizations_votes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `count` int(11) NOT NULL default '0',
  `sum` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `object_id` (`object_id`)
);

CREATE TABLE IF NOT EXISTS `bx_organizations_votes_track` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `author_id` int(11) NOT NULL default '0',
  `author_nip` int(11) unsigned NOT NULL default '0',
  `value` tinyint(4) NOT NULL default '0',
  `date` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  KEY `vote` (`object_id`, `author_nip`)
);

CREATE TABLE IF NOT EXISTS `bx_organizations_reactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `reaction` varchar(32) NOT NULL default '',
  `count` int(11) NOT NULL default '0',
  `sum` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `reaction` (`object_id`, `reaction`)
);

CREATE TABLE IF NOT EXISTS `bx_organizations_reactions_track` (
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

-- TABLE: favorites
CREATE TABLE IF NOT EXISTS `bx_organizations_favorites_track` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `author_id` int(11) NOT NULL default '0',
  `list_id` int(11) NOT NULL default '0',
  `date` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  KEY `id` (`object_id`,`author_id`)
);

CREATE TABLE IF NOT EXISTS `bx_organizations_favorites_lists` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `author_id` int(11) NOT NULL default '0',
  `date` int(11) NOT NULL default '0',
  `allow_view_favorite_list_to` varchar(16) NOT NULL DEFAULT '3',
   PRIMARY KEY (`id`)
);

-- TABLE: reports
CREATE TABLE IF NOT EXISTS `bx_organizations_reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `count` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `object_id` (`object_id`)
);

CREATE TABLE IF NOT EXISTS `bx_organizations_reports_track` (
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
CREATE TABLE IF NOT EXISTS `bx_organizations_meta_keywords` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(10) unsigned NOT NULL,
  `keyword` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `object_id` (`object_id`),
  KEY `keyword` (`keyword`)
);

CREATE TABLE IF NOT EXISTS `bx_organizations_meta_locations` (
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

CREATE TABLE `bx_organizations_meta_mentions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(10) unsigned NOT NULL,
  `profile_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `object_id` (`object_id`),
  KEY `profile_id` (`profile_id`)
);

-- TABLE: Invites
CREATE TABLE IF NOT EXISTS `bx_organizations_invites` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `key` varchar(128) NOT NULL default '0',
  `group_profile_id` int(11) NOT NULL default '0',
  `author_profile_id` int(11) NOT NULL default '0',
  `invited_profile_id` int(11) NOT NULL default '0',
  `added` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`)
);

-- TABLE: fans
CREATE TABLE IF NOT EXISTS `bx_organizations_fans` (
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
CREATE TABLE IF NOT EXISTS `bx_organizations_admins` (
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

-- TABLE: scores
CREATE TABLE IF NOT EXISTS `bx_organizations_scores` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `count_up` int(11) NOT NULL default '0',
  `count_down` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `object_id` (`object_id`)
);

CREATE TABLE IF NOT EXISTS `bx_organizations_scores_track` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `author_id` int(11) NOT NULL default '0',
  `author_nip` int(11) unsigned NOT NULL default '0',
  `type` varchar(8) NOT NULL default '',
  `date` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  KEY `vote` (`object_id`, `author_nip`)
);

-- TABLE: Pricing
CREATE TABLE IF NOT EXISTS `bx_organizations_prices` (
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
('bx_organizations_pics', @sStorageEngine, '', 360, 2592000, 3, 'bx_organizations_pics', 'allow-deny', '{image}', '', 0, 0, 0, 0, 0, 0),
('bx_organizations_pics_resized', @sStorageEngine, '', 360, 2592000, 3, 'bx_organizations_pics_resized', 'allow-deny', '{image}', '', 0, 0, 0, 0, 0, 0);

INSERT INTO `sys_objects_transcoder` (`object`, `storage_object`, `source_type`, `source_params`, `private`, `atime_tracking`, `atime_pruning`, `ts`) VALUES 
('bx_organizations_icon', 'bx_organizations_pics_resized', 'Storage', 'a:1:{s:6:"object";s:21:"bx_organizations_pics";}', 'no', '1', '2592000', '0'),
('bx_organizations_thumb', 'bx_organizations_pics_resized', 'Storage', 'a:1:{s:6:"object";s:21:"bx_organizations_pics";}', 'no', '1', '2592000', '0'),
('bx_organizations_avatar', 'bx_organizations_pics_resized', 'Storage', 'a:1:{s:6:"object";s:21:"bx_organizations_pics";}', 'no', '1', '2592000', '0'),
('bx_organizations_avatar_big', 'bx_organizations_pics_resized', 'Storage', 'a:1:{s:6:"object";s:21:"bx_organizations_pics";}', 'no', '1', '2592000', '0'),
('bx_organizations_picture', 'bx_organizations_pics_resized', 'Storage', 'a:1:{s:6:"object";s:21:"bx_organizations_pics";}', 'no', '1', '2592000', '0'),
('bx_organizations_cover', 'bx_organizations_pics_resized', 'Storage', 'a:1:{s:6:"object";s:21:"bx_organizations_pics";}', 'no', '1', '2592000', '0'),
('bx_organizations_cover_thumb', 'bx_organizations_pics_resized', 'Storage', 'a:1:{s:6:"object";s:21:"bx_organizations_pics";}', 'no', '1', '2592000', '0'),
('bx_organizations_gallery', 'bx_organizations_pics_resized', 'Storage', 'a:1:{s:6:"object";s:21:"bx_organizations_pics";}', 'no', '1', '2592000', '0'),
('bx_organizations_badge', 'bx_organizations_pics_resized', 'Storage', 'a:1:{s:6:"object";s:21:"bx_organizations_pics";}', 'no', '1', '2592000', '0');

INSERT INTO `sys_transcoder_filters` (`transcoder_object`, `filter`, `filter_params`, `order`) VALUES 
('bx_organizations_icon', 'Resize', 'a:3:{s:1:"w";s:2:"30";s:1:"h";s:2:"30";s:13:"square_resize";s:1:"1";}', '0'),
('bx_organizations_thumb', 'Resize', 'a:3:{s:1:"w";s:2:"50";s:1:"h";s:2:"50";s:13:"square_resize";s:1:"1";}', '0'),
('bx_organizations_avatar', 'Resize', 'a:3:{s:1:"w";s:3:"100";s:1:"h";s:3:"100";s:13:"square_resize";s:1:"1";}', '0'),
('bx_organizations_avatar_big', 'Resize', 'a:3:{s:1:"w";s:3:"200";s:1:"h";s:3:"200";s:13:"square_resize";s:1:"1";}', '0'),
('bx_organizations_picture', 'Resize', 'a:3:{s:1:"w";s:4:"1024";s:1:"h";s:4:"1024";s:13:"square_resize";s:1:"0";}', '0'),
('bx_organizations_cover', 'Resize', 'a:2:{s:1:"w";s:3:"960";s:1:"h";s:3:"480";}', '0'),
('bx_organizations_cover_thumb', 'Resize', 'a:3:{s:1:"w";s:2:"48";s:1:"h";s:2:"48";s:13:"square_resize";s:1:"1";}', '0'),
('bx_organizations_gallery', 'Resize', 'a:1:{s:1:"w";s:3:"500";}', '0'),
('bx_organizations_badge', 'Resize', 'a:3:{s:1:"w";s:2:"32";s:1:"h";s:2:"32";s:13:"square_resize";s:1:"1";}', '0');


-- FORMS
INSERT INTO `sys_objects_form`(`object`, `module`, `title`, `action`, `form_attrs`, `table`, `key`, `uri`, `uri_title`, `submit_name`, `params`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES 
('bx_organization', 'bx_organizations', '_bx_orgs_form_profile', '', 'a:1:{s:7:\"enctype\";s:19:\"multipart/form-data\";}', 'bx_organizations_data', 'id', '', '', 'do_submit', '', 0, 1, 'BxOrgsFormEntry', 'modules/boonex/organizations/classes/BxOrgsFormEntry.php');

INSERT INTO `sys_form_displays`(`object`, `display_name`, `module`, `view_mode`, `title`) VALUES 
('bx_organization', 'bx_organization_add', 'bx_organizations', 0, '_bx_orgs_form_profile_display_add'),
('bx_organization', 'bx_organization_delete', 'bx_organizations', 0, '_bx_orgs_form_profile_display_delete'),
('bx_organization', 'bx_organization_edit', 'bx_organizations', 0, '_bx_orgs_form_profile_display_edit'),
('bx_organization', 'bx_organization_edit_cover', 'bx_organizations', 0, '_bx_orgs_form_profile_display_edit_cover'),
('bx_organization', 'bx_organization_edit_badge', 'bx_organizations', 0, '_bx_orgs_form_profile_display_edit_badge'),
('bx_organization', 'bx_organization_edit_privacy', 'bx_organizations', 0, '_bx_orgs_form_profile_display_edit_privacy'),
('bx_organization', 'bx_organization_view', 'bx_organizations', 1, '_bx_orgs_form_profile_display_view'),
('bx_organization', 'bx_organization_view_full', 'bx_organizations', 1, '_bx_orgs_form_profile_display_view_full'),
('bx_organization', 'bx_organization_invite', 'bx_organizations', 0, '_bx_orgs_form_profile_display_invite');

INSERT INTO `sys_form_inputs`(`object`, `module`, `name`, `value`, `values`, `checked`, `type`, `caption_system`, `caption`, `info`, `required`, `collapsed`, `html`, `attrs`, `attrs_tr`, `attrs_wrapper`, `checker_func`, `checker_params`, `checker_error`, `db_pass`, `db_params`, `editable`, `deletable`) VALUES 
('bx_organization', 'bx_organizations', 'allow_view_to', 3, '', 0, 'custom', '_bx_orgs_form_profile_input_sys_allow_view_to', '_bx_orgs_form_profile_input_allow_view_to', '_bx_orgs_form_profile_input_allow_view_to_info', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_organization', 'bx_organizations', 'allow_post_to', 5, '', 0, 'custom', '_bx_orgs_form_profile_input_sys_allow_post_to', '_bx_orgs_form_profile_input_allow_post_to', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_organization', 'bx_organizations', 'allow_contact_to', 3, '', 0, 'custom', '_bx_orgs_form_profile_input_sys_allow_contact_to', '_bx_orgs_form_profile_input_allow_contact_to', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_organization', 'bx_organizations', 'delete_confirm', 1, '', 0, 'checkbox', '_bx_orgs_form_profile_input_sys_delete_confirm', '_bx_orgs_form_profile_input_delete_confirm', '_bx_orgs_form_profile_input_delete_confirm_info', 1, 0, 0, '', '', '', 'avail', '', '_bx_orgs_form_profile_input_delete_confirm_error', '', '', 1, 0),
('bx_organization', 'bx_organizations', 'do_submit', '_sys_form_account_input_submit', '', 0, 'submit', '_bx_orgs_form_profile_input_sys_do_submit', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_organization', 'bx_organizations', 'do_cancel', '_sys_form_input_cancel', '', 0, 'button', '_sys_form_input_sys_cancel', '', '', 0, 0, 0, 'a:2:{s:7:"onclick";s:41:"window.open(''{edit_cancel_url}'', ''_self'')";s:5:"class";s:22:"bx-def-margin-sec-left";}', '', '', '', '', '', '', '', 0, 0),
('bx_organization', 'bx_organizations', 'controls', '', 'do_submit,do_cancel', 0, 'input_set', '_sys_form_input_sys_controls', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0),
('bx_organization', 'bx_organizations', 'org_desc', '', '', 0, 'textarea', '_bx_orgs_form_profile_input_sys_org_desc', '_bx_orgs_form_profile_input_org_desc', '', 0, 0, 1, '', '', '', '', '', '', 'XssHtml', '', 1, 1),
('bx_organization', 'bx_organizations', 'org_cat', '', '#!bx_organizations_cats', 0, 'select', '_bx_orgs_form_profile_input_sys_org_cat', '_bx_orgs_form_profile_input_org_cat', '', 1, 0, 0, '', '', '', 'avail', '', '_bx_orgs_form_profile_input_org_cat_err', 'Xss', '', 1, 1),
('bx_organization', 'bx_organizations', 'multicat', '', '', 0, 'custom', '_bx_orgs_form_entry_input_sys_multicat', '_bx_orgs_form_entry_input_multicat', '', 1, 0, 0, '', '', '', 'avail', '', '_bx_orgs_form_entry_input_multicat_err', 'Xss', '', 1, 0),
('bx_organization', 'bx_organizations', 'org_name', '', '', 0, 'text', '_bx_orgs_form_profile_input_sys_org_name', '_bx_orgs_form_profile_input_org_name', '', 1, 0, 0, '', '', '', 'ProfileName', '', '_bx_orgs_form_profile_input_org_name_err', 'Xss', '', 1, 0),
('bx_organization', 'bx_organizations', 'initial_members', '', '', 0, 'custom', '_bx_orgs_form_profile_input_sys_initial_members', '_bx_orgs_form_profile_input_initial_members', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 1),
('bx_organization', 'bx_organizations', 'join_confirmation', 1, '', 1, 'switcher', '_bx_orgs_form_profile_input_sys_join_confirm', '_bx_orgs_form_profile_input_join_confirm', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 1, 0),
('bx_organization', 'bx_organizations', 'cover', 'a:1:{i:0;s:27:"bx_organizations_cover_crop";}', 'a:1:{s:27:"bx_organizations_cover_crop";s:24:"_sys_uploader_crop_title";}', 0, 'files', '_bx_orgs_form_profile_input_sys_cover', '_bx_orgs_form_profile_input_cover', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_organization', 'bx_organizations', 'picture', 'a:1:{i:0;s:29:"bx_organizations_picture_crop";}', 'a:1:{s:29:"bx_organizations_picture_crop";s:24:"_sys_uploader_crop_title";}', 0, 'files', '_bx_orgs_form_profile_input_sys_picture', '_bx_orgs_form_profile_input_picture', '', 0, 0, 0, '', '', '', '', '', '_bx_orgs_form_profile_input_picture_err', '', '', 1, 0),
('bx_organization', 'bx_organizations', 'badge', 'a:1:{i:0;s:27:"bx_organizations_badge_crop";}', 'a:1:{s:27:"bx_organizations_badge_crop";s:24:"_sys_uploader_crop_title";}', 0, 'files', '_bx_orgs_form_profile_input_sys_badge', '_bx_orgs_form_profile_input_badge', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_organization', 'bx_organizations', 'badge_link_select', '', '', 0, 'select', '_bx_orgs_form_profile_input_sys_badge_link_select', '_bx_orgs_form_profile_input_badge_link_select', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_organization', 'bx_organizations', 'badge_link_custom', '', '', 0, 'text', '_bx_orgs_form_profile_input_sys_badge_link_custom', '_bx_orgs_form_profile_input_badge_link_custom', '', 0, 0, 0, 'a:1:{s:11:"placeholder";s:57:"_bx_orgs_form_profile_input_badge_link_custom_placeholder";}', '', '', '', '', '', '', '', 1, 0),
('bx_organization', 'bx_organizations', 'location', '', '', 0, 'location', '_sys_form_input_sys_location', '_sys_form_input_location', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_organization', 'bx_organizations', 'profile_email', '', '', 0, 'text', '_bx_orgs_form_profile_input_sys_profile_email', '_bx_orgs_form_profile_input_profile_email', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_organization', 'bx_organizations', 'profile_status', '', '', 0, 'custom', '_bx_orgs_form_profile_input_sys_profile_status', '_bx_orgs_form_profile_input_profile_status', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_organization', 'bx_organizations', 'profile_ip', '', '', 0, 'text', '_bx_orgs_form_profile_input_sys_profile_ip', '_bx_orgs_form_profile_input_profile_ip', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_organization', 'bx_organizations', 'profile_last_active', '', '', 0, 'datetime', '_bx_orgs_form_profile_input_sys_profile_last_active', '_bx_orgs_form_profile_input_profile_last_active', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0),
('bx_organization', 'bx_organizations', 'labels', '', '', 0, 'custom', '_sys_form_input_sys_labels', '_sys_form_input_labels', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_organization', 'bx_organizations', 'added', '', '', 0, 'datetime', '_bx_orgs_form_profile_input_sys_date_added', '_bx_orgs_form_profile_input_date_added', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_organization', 'bx_organizations', 'changed', '', '', 0, 'datetime', '_bx_orgs_form_profile_input_sys_date_changed', '_bx_orgs_form_profile_input_date_changed', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_organization', 'bx_organizations', 'friends_count', '', '', 0, 'text', '_bx_orgs_form_profile_input_sys_friends_count', '_bx_orgs_form_profile_input_friends_count', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_organization', 'bx_organizations', 'followers_count', '', '', 0, 'text', '_bx_orgs_form_profile_input_sys_followers_count', '_bx_orgs_form_profile_input_followers_count', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0);

INSERT INTO `sys_form_display_inputs`(`display_name`, `input_name`, `visible_for_levels`, `active`, `order`) VALUES
('bx_organization_add', 'initial_members', 2147483647, 1, 1),
('bx_organization_add', 'picture', 2147483647, 1, 2),
('bx_organization_add', 'org_name', 2147483647, 1, 3),
('bx_organization_add', 'org_cat', 2147483647, 1, 4),
('bx_organization_add', 'org_desc', 2147483647, 1, 5),
('bx_organization_add', 'location', 2147483647, 1, 6),
('bx_organization_add', 'join_confirmation', 2147483647, 1, 7),
('bx_organization_add', 'allow_view_to', 2147483647, 1, 8),
('bx_organization_add', 'allow_post_to', 2147483647, 1, 9),
('bx_organization_add', 'allow_contact_to', 2147483647, 1, 10),
('bx_organization_add', 'do_submit', 2147483647, 1, 11),

('bx_organization_invite', 'initial_members', 2147483647, 1, 1),
('bx_organization_invite', 'do_submit', 2147483647, 1, 2),

('bx_organization_delete', 'delete_confirm', 2147483647, 1, 1),
('bx_organization_delete', 'do_submit', 2147483647, 1, 2),

('bx_organization_edit', 'picture', 2147483647, 1, 1),
('bx_organization_edit', 'org_name', 2147483647, 1, 2),
('bx_organization_edit', 'org_cat', 2147483647, 1, 3),
('bx_organization_edit', 'org_desc', 2147483647, 1, 4),
('bx_organization_edit', 'location', 2147483647, 1, 5),
('bx_organization_edit', 'join_confirmation', 2147483647, 1, 6),
('bx_organization_edit', 'allow_view_to', 2147483647, 1, 7),
('bx_organization_edit', 'allow_post_to', 2147483647, 1, 8),
('bx_organization_edit', 'allow_contact_to', 2147483647, 1, 9),
('bx_organization_edit', 'controls', 2147483647, 1, 10),
('bx_organization_edit', 'do_submit', 2147483647, 1, 11),
('bx_organization_edit', 'do_cancel', 2147483647, 1, 12),

('bx_organization_edit_cover', 'cover', 2147483647, 1, 1),
('bx_organization_edit_cover', 'do_submit', 2147483647, 1, 2),

('bx_organization_edit_badge', 'badge', 2147483647, 1, 1),
('bx_organization_edit_badge', 'badge_link_select', 2147483647, 1, 2),
('bx_organization_edit_badge', 'badge_link_custom', 2147483647, 0, 3),
('bx_organization_edit_badge', 'do_submit', 2147483647, 1, 4),
('bx_organization_edit_privacy', 'allow_view_to', 2147483647, 1, 1),
('bx_organization_edit_privacy', 'allow_post_to', 2147483647, 1, 2),
('bx_organization_edit_privacy', 'allow_contact_to', 2147483647, 1, 3),
('bx_organization_edit_privacy', 'do_submit', 2147483647, 1, 4),

('bx_organization_view', 'org_name', 2147483647, 1, 1),
('bx_organization_view', 'org_cat', 2147483647, 1, 2),
('bx_organization_view', 'profile_email', 192, 1, 3),
('bx_organization_view', 'profile_status', 192, 1, 4),
('bx_organization_view', 'profile_ip', 192, 1, 5),
('bx_organization_view', 'profile_last_active', 192, 1, 6),
('bx_organization_view', 'added', 192, 1, 7),
('bx_organization_view', 'changed', 192, 1, 8),
('bx_organization_view', 'friends_count', 2147483647, 1, 9),
('bx_organization_view', 'followers_count', 2147483647, 1, 10),

('bx_organization_view_full', 'org_name', 2147483647, 1, 1),
('bx_organization_view_full', 'org_cat', 2147483647, 1, 2),
('bx_organization_view_full', 'org_desc', 2147483647, 0, 3),
('bx_organization_view_full', 'profile_email', 192, 1, 4),
('bx_organization_view_full', 'profile_status', 192, 1, 5),
('bx_organization_view_full', 'profile_last_active', 192, 1, 6);

-- FORMS: Price
INSERT INTO `sys_objects_form` (`object`, `module`, `title`, `action`, `form_attrs`, `submit_name`, `table`, `key`, `uri`, `uri_title`, `params`, `deletable`, `active`, `override_class_name`, `override_class_file`) VALUES
('bx_organizations_price', 'bx_organizations', '_bx_orgs_form_price', '', '', 'do_submit', 'bx_organizations_prices', 'id', '', '', '', 0, 1, 'BxOrgsFormPrice', 'modules/boonex/organizations/classes/BxOrgsFormPrice.php');

INSERT INTO `sys_form_displays` (`display_name`, `module`, `object`, `title`, `view_mode`) VALUES
('bx_organizations_price_add', 'bx_organizations', 'bx_organizations_price', '_bx_orgs_form_price_display_add', 0),
('bx_organizations_price_edit', 'bx_organizations', 'bx_organizations_price', '_bx_orgs_form_price_display_edit', 0);

INSERT INTO `sys_form_inputs` (`object`, `module`, `name`, `value`, `values`, `checked`, `type`, `caption_system`, `caption`, `info`, `required`, `collapsed`, `html`, `attrs`, `attrs_tr`, `attrs_wrapper`, `checker_func`, `checker_params`, `checker_error`, `db_pass`, `db_params`, `editable`, `deletable`) VALUES
('bx_organizations_price', 'bx_organizations', 'id', '', '', 0, 'hidden', '_bx_orgs_form_price_input_sys_id', '', '', 1, 0, 0, '', '', '', '', '', '', 'Int', '', 1, 0),
('bx_organizations_price', 'bx_organizations', 'role_id', '', '', 0, 'select', '_bx_orgs_form_price_input_sys_role_id', '_bx_orgs_form_price_input_role_id', '', 1, 0, 0, '', '', '', '', '', '_bx_orgs_form_price_input_err_role_id', 'Xss', '', 1, 0),
('bx_organizations_price', 'bx_organizations', 'name', '', '', 0, 'text', '_bx_orgs_form_price_input_sys_name', '_bx_orgs_form_price_input_name', '_bx_orgs_form_price_input_inf_name', 1, 0, 0, '', '', '', 'Avail', '', '_bx_orgs_form_price_input_err_name', 'Xss', '', 1, 0),
('bx_organizations_price', 'bx_organizations', 'caption', '', '', 0, 'text', '_bx_orgs_form_price_input_sys_caption', '_bx_orgs_form_price_input_caption', '_bx_orgs_form_price_input_inf_caption', 1, 0, 0, '', '', '', 'Avail', '', '_bx_orgs_form_price_input_err_caption', 'Xss', '', 1, 0),
('bx_organizations_price', 'bx_organizations', 'period', '', '', 0, 'text', '_bx_orgs_form_price_input_sys_period', '_bx_orgs_form_price_input_period', '_bx_orgs_form_price_input_inf_period', 1, 0, 0, '', '', '', '', '', '', 'Int', '', 1, 0),
('bx_organizations_price', 'bx_organizations', 'period_unit', '', '#!bx_organizations_period_units', 0, 'select', '_bx_orgs_form_price_input_sys_period_unit', '_bx_orgs_form_price_input_period_unit', '_bx_orgs_form_price_input_inf_period_unit', 1, 0, 0, '', '', '', '', '', '', 'Xss', '', 1, 0),
('bx_organizations_price', 'bx_organizations', 'price', '', '', 0, 'price', '_bx_orgs_form_price_input_sys_price', '_bx_orgs_form_price_input_price', '_bx_orgs_form_price_input_inf_price', 1, 0, 0, '', '', '', '', '', '', 'Float', '', 1, 0),
('bx_organizations_price', 'bx_organizations', 'default', 1, '', 0, 'switcher', '_bx_orgs_form_price_input_sys_default', '_bx_orgs_form_price_input_default', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 1, 0),
('bx_organizations_price', 'bx_organizations', 'controls', '', 'do_submit,do_cancel', 0, 'input_set', '', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_organizations_price', 'bx_organizations', 'do_submit', '_bx_orgs_form_price_input_do_submit', '', 0, 'submit', '_bx_orgs_form_price_input_sys_do_submit', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0),
('bx_organizations_price', 'bx_organizations', 'do_cancel', '_bx_orgs_form_price_input_do_cancel', '', 0, 'button', '_bx_orgs_form_price_input_sys_do_cancel', '', '', 0, 0, 0, 'a:2:{s:7:"onclick";s:45:"$(''.bx-popup-applied:visible'').dolPopupHide()";s:5:"class";s:22:"bx-def-margin-sec-left";}', '', '', '', '', '', '', '', 1, 0);

INSERT INTO `sys_form_display_inputs` (`display_name`, `input_name`, `visible_for_levels`, `active`, `order`) VALUES
('bx_organizations_price_add', 'id', 2147483647, 0, 1),
('bx_organizations_price_add', 'role_id', 2147483647, 1, 2),
('bx_organizations_price_add', 'name', 2147483647, 1, 3),
('bx_organizations_price_add', 'caption', 2147483647, 1, 4),
('bx_organizations_price_add', 'price', 2147483647, 1, 5),
('bx_organizations_price_add', 'period', 2147483647, 1, 6),
('bx_organizations_price_add', 'period_unit', 2147483647, 1, 7),
('bx_organizations_price_add', 'default', 2147483647, 1, 8),
('bx_organizations_price_add', 'controls', 2147483647, 1, 9),
('bx_organizations_price_add', 'do_submit', 2147483647, 1, 10),
('bx_organizations_price_add', 'do_cancel', 2147483647, 1, 11),

('bx_organizations_price_edit', 'id', 2147483647, 1, 1),
('bx_organizations_price_edit', 'role_id', 2147483647, 1, 2),
('bx_organizations_price_edit', 'name', 2147483647, 1, 3),
('bx_organizations_price_edit', 'caption', 2147483647, 1, 4),
('bx_organizations_price_edit', 'price', 2147483647, 1, 5),
('bx_organizations_price_edit', 'period', 2147483647, 1, 6),
('bx_organizations_price_edit', 'period_unit', 2147483647, 1, 7),
('bx_organizations_price_edit', 'default', 2147483647, 1, 8),
('bx_organizations_price_edit', 'controls', 2147483647, 1, 9),
('bx_organizations_price_edit', 'do_submit', 2147483647, 1, 10),
('bx_organizations_price_edit', 'do_cancel', 2147483647, 1, 11);

-- PRE-VALUES
INSERT INTO `sys_form_pre_lists`(`key`, `title`, `module`, `use_for_sets`) VALUES
('bx_organizations_cats', '_bx_orgs_pre_lists_cats', 'bx_organizations', '0');

INSERT INTO `sys_form_pre_values`(`Key`, `Value`, `Order`, `LKey`, `LKey2`) VALUES
('bx_organizations_cats', '', 0, '_sys_please_select', ''),
('bx_organizations_cats', '1', 1, '_bx_orgs_cat_Agriculture', ''),
('bx_organizations_cats', '2', 2, '_bx_orgs_cat_Financial', ''),
('bx_organizations_cats', '3', 3, '_bx_orgs_cat_Biotech', ''),
('bx_organizations_cats', '4', 4, '_bx_orgs_cat_Cause', ''),
('bx_organizations_cats', '5', 5, '_bx_orgs_cat_Chemical', ''),
('bx_organizations_cats', '6', 6, '_bx_orgs_cat_Religious', ''),
('bx_organizations_cats', '7', 7, '_bx_orgs_cat_Community', ''),
('bx_organizations_cats', '8', 8, '_bx_orgs_cat_Company', ''),
('bx_organizations_cats', '9', 9, '_bx_orgs_cat_Entertainment', ''),
('bx_organizations_cats', '10', 10, '_bx_orgs_cat_Technology', ''),
('bx_organizations_cats', '11', 11, '_bx_orgs_cat_Consulting', ''),
('bx_organizations_cats', '12', 12, '_bx_orgs_cat_Education', ''),
('bx_organizations_cats', '13', 13, '_bx_orgs_cat_Energy', ''),
('bx_organizations_cats', '14', 14, '_bx_orgs_cat_Engineering', ''),
('bx_organizations_cats', '15', 15, '_bx_orgs_cat_Food', ''),
('bx_organizations_cats', '16', 16, '_bx_orgs_cat_Government', ''),
('bx_organizations_cats', '17', 17, '_bx_orgs_cat_Health', ''),
('bx_organizations_cats', '18', 18, '_bx_orgs_cat_Medical', ''),
('bx_organizations_cats', '19', 19, '_bx_orgs_cat_Industrial', ''),
('bx_organizations_cats', '20', 20, '_bx_orgs_cat_Insurance', ''),
('bx_organizations_cats', '21', 21, '_bx_orgs_cat_Internet', ''),
('bx_organizations_cats', '22', 22, '_bx_orgs_cat_Software', ''),
('bx_organizations_cats', '23', 23, '_bx_orgs_cat_Legal', ''),
('bx_organizations_cats', '24', 24, '_bx_orgs_cat_Media', ''),
('bx_organizations_cats', '25', 25, '_bx_orgs_cat_School', ''),
('bx_organizations_cats', '26', 26, '_bx_orgs_cat_NGO', ''),
('bx_organizations_cats', '27', 27, '_bx_orgs_cat_NPO', ''),
('bx_organizations_cats', '28', 28, '_bx_orgs_cat_Political', ''),
('bx_organizations_cats', '29', 29, '_bx_orgs_cat_Retail', ''),
('bx_organizations_cats', '30', 30, '_bx_orgs_cat_Small_Business', ''),
('bx_organizations_cats', '31', 31, '_bx_orgs_cat_Telecommunication', ''),
('bx_organizations_cats', '32', 32, '_bx_orgs_cat_Transport', ''),
('bx_organizations_cats', '33', 33, '_bx_orgs_cat_Travel', ''),
('bx_organizations_cats', '34', 34, '_bx_orgs_cat_University', ''),
('bx_organizations_cats', '35', 35, '_bx_orgs_cat_Other', '');

INSERT INTO `sys_form_pre_lists`(`key`, `title`, `module`, `use_for_sets`) VALUES
('bx_organizations_roles', '_bx_orgs_pre_lists_roles', 'bx_organizations', '1');

INSERT INTO `sys_form_pre_values`(`Key`, `Value`, `Order`, `LKey`, `LKey2`) VALUES
('bx_organizations_roles', '0', 1, '_bx_orgs_role_regular', ''),
('bx_organizations_roles', '1', 2, '_bx_orgs_role_administrator', ''),
('bx_organizations_roles', '2', 3, '_bx_orgs_role_moderator', '');

INSERT INTO `sys_form_pre_lists`(`key`, `title`, `module`, `use_for_sets`) VALUES
('bx_organizations_period_units', '_bx_orgs_pre_lists_period_units', 'bx_organizations', '0');

INSERT INTO `sys_form_pre_values`(`Key`, `Value`, `Order`, `LKey`, `LKey2`) VALUES
('bx_organizations_period_units', '', 0, '_sys_please_select', ''),
('bx_organizations_period_units', 'day', 1, '_bx_orgs_period_unit_day', ''),
('bx_organizations_period_units', 'week', 2, '_bx_orgs_period_unit_week', ''),
('bx_organizations_period_units', 'month', 3, '_bx_orgs_period_unit_month', ''),
('bx_organizations_period_units', 'year', 4, '_bx_orgs_period_unit_year', '');


-- COMMENTS
INSERT INTO `sys_objects_cmts` (`Name`, `Module`, `Table`, `CharsPostMin`, `CharsPostMax`, `CharsDisplayMax`, `Html`, `PerView`, `PerViewReplies`, `BrowseType`, `IsBrowseSwitch`, `PostFormPosition`, `NumberOfLevels`, `IsDisplaySwitch`, `IsRatable`, `ViewingThreshold`, `IsOn`, `RootStylePrefix`, `BaseUrl`, `ObjectVote`, `TriggerTable`, `TriggerFieldId`, `TriggerFieldAuthor`, `TriggerFieldTitle`, `TriggerFieldComments`, `ClassName`, `ClassFile`) VALUES
('bx_organizations', 'bx_organizations', 'bx_organizations_cmts', 1, 5000, 1000, 3, 5, 3, 'tail', 1, 'bottom', 1, 1, 1, -3, 1, 'cmt', 'page.php?i=view-organization-profile&id={object_id}', '', 'bx_organizations_data', 'id', 'author', 'org_name', 'comments', 'BxOrgsCmts', 'modules/boonex/organizations/classes/BxOrgsCmts.php'),
('bx_organizations_notes', 'bx_organizations', 'bx_organizations_cmts_notes', 1, 5000, 1000, 0, 5, 3, 'tail', 1, 'bottom', 1, 1, 1, -3, 1, 'cmt', 'page.php?i=view-post&id={object_id}', '', 'bx_organizations_data', 'id', 'author', 'org_name', '', 'BxTemplCmtsNotes', '');


-- VIEWS
INSERT INTO `sys_objects_view` (`name`, `module`, `table_track`, `period`, `is_on`, `trigger_table`, `trigger_field_id`, `trigger_field_author`, `trigger_field_count`, `class_name`, `class_file`) VALUES 
('bx_organizations', 'bx_organizations', 'bx_organizations_views_track', '86400', '1', 'bx_organizations_data', 'id', 'author', 'views', '', '');


-- VOTES
INSERT INTO `sys_objects_vote` (`Name`, `Module`, `TableMain`, `TableTrack`, `PostTimeout`, `MinValue`, `MaxValue`, `IsUndo`, `IsOn`, `TriggerTable`, `TriggerFieldId`, `TriggerFieldAuthor`, `TriggerFieldRate`, `TriggerFieldRateCount`, `ClassName`, `ClassFile`) VALUES 
('bx_organizations', 'bx_organizations', 'bx_organizations_votes', 'bx_organizations_votes_track', '604800', '1', '1', '0', '1', 'bx_organizations_data', 'id', '', 'rate', 'votes', 'BxOrgsVote', 'modules/boonex/organizations/classes/BxOrgsVote.php'),
('bx_organizations_reactions', 'bx_organizations', 'bx_organizations_reactions', 'bx_organizations_reactions_track', '604800', '1', '1', '1', '1', 'bx_organizations_data', 'id', 'author', 'rrate', 'rvotes', 'BxTemplVoteReactions', '');


-- SCORES
INSERT INTO `sys_objects_score` (`name`, `module`, `table_main`, `table_track`, `post_timeout`, `is_on`, `trigger_table`, `trigger_field_id`, `trigger_field_author`, `trigger_field_score`, `trigger_field_cup`, `trigger_field_cdown`, `class_name`, `class_file`) VALUES 
('bx_organizations', 'bx_organizations', 'bx_organizations_scores', 'bx_organizations_scores_track', '604800', '1', 'bx_organizations_data', 'id', 'author', 'score', 'sc_up', 'sc_down', '', '');


-- FAFORITES
INSERT INTO `sys_objects_favorite` (`name`, `table_track`, `table_lists`, `is_on`, `is_undo`, `is_public`, `base_url`, `trigger_table`, `trigger_field_id`, `trigger_field_author`, `trigger_field_count`, `class_name`, `class_file`) VALUES 
('bx_organizations', 'bx_organizations_favorites_track', 'bx_organizations_favorites_lists', '1', '1', '0', 'page.php?i=view-organization-profile&id={object_id}', 'bx_organizations_data', 'id', 'author', 'favorites', 'BxOrgsFavorite', 'modules/boonex/organizations/classes/BxOrgsFavorite.php');


-- FEATURED
INSERT INTO `sys_objects_feature` (`name`, `module`, `is_on`, `is_undo`, `base_url`, `trigger_table`, `trigger_field_id`, `trigger_field_author`, `trigger_field_flag`, `class_name`, `class_file`) VALUES 
('bx_organizations', 'bx_organizations', '1', '1', 'page.php?i=view-organization-profile&id={object_id}', 'bx_organizations_data', 'id', 'author', 'featured', '', '');


-- REPORTS
INSERT INTO `sys_objects_report` (`name`, `module`, `table_main`, `table_track`, `is_on`, `base_url`, `object_comment`, `trigger_table`, `trigger_field_id`, `trigger_field_author`, `trigger_field_count`, `class_name`, `class_file`) VALUES 
('bx_organizations', 'bx_organizations', 'bx_organizations_reports', 'bx_organizations_reports_track', '1', 'page.php?i=view-organization-profile&id={object_id}', 'bx_organizations_notes', 'bx_organizations_data', 'id', 'author', 'reports', 'BxOrgsReport', 'modules/boonex/organizations/classes/BxOrgsReport.php');


-- CONTENT INFO
INSERT INTO `sys_objects_content_info` (`name`, `title`, `alert_unit`, `alert_action_add`, `alert_action_update`, `alert_action_delete`, `class_name`, `class_file`) VALUES
('bx_organizations', '_bx_orgs', 'bx_organizations', 'added', 'edited', 'deleted', '', ''),
('bx_organizations_cmts', '_bx_orgs_cmts', 'bx_organizations', 'commentPost', 'commentUpdated', 'commentRemoved', 'BxDolContentInfoCmts', '');

INSERT INTO `sys_content_info_grids` (`object`, `grid_object`, `grid_field_id`, `condition`, `selection`) VALUES
('bx_organizations', 'bx_organizations_administration', 'td`.`id', '', ''),
('bx_organizations', 'bx_organizations_common', 'td`.`id', '', '');


-- SEARCH EXTENDED
INSERT INTO `sys_objects_search_extended` (`object`, `object_content_info`, `module`, `title`, `active`, `class_name`, `class_file`) VALUES
('bx_organizations', 'bx_organizations', 'bx_organizations', '_bx_orgs_search_extended', 1, '', ''),
('bx_organizations_cmts', 'bx_organizations_cmts', 'bx_organizations', '_bx_orgs_search_extended_cmts', 1, 'BxTemplSearchExtendedCmts', '');


-- STUDIO PAGE & WIDGET
INSERT INTO `sys_std_pages`(`index`, `name`, `header`, `caption`, `icon`) VALUES
(3, 'bx_organizations', '_bx_orgs', '_bx_orgs', 'bx_organizations@modules/boonex/organizations/|std-icon.svg');
SET @iPageId = LAST_INSERT_ID();

SET @iParentPageId = (SELECT `id` FROM `sys_std_pages` WHERE `name` = 'home');
SET @iParentPageOrder = (SELECT MAX(`order`) FROM `sys_std_pages_widgets` WHERE `page_id` = @iParentPageId);
INSERT INTO `sys_std_widgets` (`page_id`, `module`, `type`, `url`, `click`, `icon`, `caption`, `cnt_notices`, `cnt_actions`) VALUES
(@iPageId, 'bx_organizations', 'users', '{url_studio}module.php?name=bx_organizations', '', 'bx_organizations@modules/boonex/organizations/|std-icon.svg', '_bx_orgs', '', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_actions";s:6:"params";a:0:{}s:5:"class";s:18:"TemplStudioModules";}');
INSERT INTO `sys_std_pages_widgets` (`page_id`, `widget_id`, `order`) VALUES
(@iParentPageId, LAST_INSERT_ID(), IF(ISNULL(@iParentPageOrder), 1, @iParentPageOrder + 1));
