
SET @sStorageEngine = (SELECT `value` FROM `sys_options` WHERE `name` = 'sys_storage_default');

-- TABLE: PROFILES
CREATE TABLE IF NOT EXISTS `bx_workspaces_data` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `author` int(10) unsigned NOT NULL,
  `added` int(11) NOT NULL,
  `changed` int(11) NOT NULL,
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
  `allow_view_to` varchar(16) NOT NULL DEFAULT '3',
  `allow_post_to` varchar(16) NOT NULL DEFAULT '5',
  `allow_contact_to` varchar(16) NOT NULL DEFAULT '3',
  `settings` text NOT NULL,
  PRIMARY KEY (`id`)
);

-- TABLE: comments
CREATE TABLE IF NOT EXISTS `bx_workspaces_cmts` (
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

CREATE TABLE IF NOT EXISTS `bx_workspaces_cmts_notes` (
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
CREATE TABLE IF NOT EXISTS `bx_workspaces_views_track` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `viewer_id` int(11) NOT NULL default '0',
  `viewer_nip` int(11) unsigned NOT NULL default '0',
  `date` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  KEY `id` (`object_id`,`viewer_id`,`viewer_nip`)
);

-- TABLE: VOTES
CREATE TABLE IF NOT EXISTS `bx_workspaces_votes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `count` int(11) NOT NULL default '0',
  `sum` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `object_id` (`object_id`)
);

CREATE TABLE IF NOT EXISTS `bx_workspaces_votes_track` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `author_id` int(11) NOT NULL default '0',
  `author_nip` int(11) unsigned NOT NULL default '0',
  `value` tinyint(4) NOT NULL default '0',
  `date` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  KEY `vote` (`object_id`, `author_nip`)
);

CREATE TABLE IF NOT EXISTS `bx_workspaces_reactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `reaction` varchar(32) NOT NULL default '',
  `count` int(11) NOT NULL default '0',
  `sum` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `reaction` (`object_id`, `reaction`)
);

CREATE TABLE IF NOT EXISTS `bx_workspaces_reactions_track` (
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
CREATE TABLE IF NOT EXISTS `bx_workspaces_favorites_track` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `author_id` int(11) NOT NULL default '0',
  `date` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  KEY `id` (`object_id`,`author_id`)
);

-- TABLE: reports
CREATE TABLE IF NOT EXISTS `bx_workspaces_reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `count` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `object_id` (`object_id`)
);

CREATE TABLE IF NOT EXISTS `bx_workspaces_reports_track` (
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
CREATE TABLE IF NOT EXISTS `bx_workspaces_scores` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `count_up` int(11) NOT NULL default '0',
  `count_down` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `object_id` (`object_id`)
);

CREATE TABLE IF NOT EXISTS `bx_workspaces_scores_track` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_id` int(11) NOT NULL default '0',
  `author_id` int(11) NOT NULL default '0',
  `author_nip` int(11) unsigned NOT NULL default '0',
  `type` varchar(8) NOT NULL default '',
  `date` int(11) NOT NULL default '0',
  PRIMARY KEY (`id`),
  KEY `vote` (`object_id`, `author_nip`)
);

-- FORMS
INSERT INTO `sys_objects_form`(`object`, `module`, `title`, `action`, `form_attrs`, `table`, `key`, `uri`, `uri_title`, `submit_name`, `params`, `deletable`, `active`, `override_class_name`, `override_class_file`, `parent_form`) VALUES 
('bx_workspace', 'bx_workspaces', '_bx_workspaces_form_profile', '', 'a:1:{s:7:\"enctype\";s:19:\"multipart/form-data\";}', 'bx_workspaces_data', 'id', '', '', 'do_submit', '', 0, 1, 'BxWorkspacesFormEntry', 'modules/boonex/workspaces/classes/BxWorkspacesFormEntry.php', '');

INSERT INTO `sys_form_displays`(`object`, `display_name`, `module`, `view_mode`, `title`) VALUES 
('bx_workspace', 'bx_workspace_add', 'bx_workspaces', 0, '_bx_workspaces_form_profile_display_add'),
('bx_workspace', 'bx_workspace_delete', 'bx_workspaces', 0, '_bx_workspaces_form_profile_display_delete'),
('bx_workspace', 'bx_workspace_edit', 'bx_workspaces', 0, '_bx_workspaces_form_profile_display_edit'),
('bx_workspace', 'bx_workspace_view', 'bx_workspaces', 1, '_bx_workspaces_form_profile_display_view'),
('bx_workspace', 'bx_workspace_view_full', 'bx_workspaces', 1, '_bx_workspaces_form_profile_display_view_full');

INSERT INTO `sys_form_inputs`(`object`, `module`, `name`, `value`, `values`, `checked`, `type`, `caption_system`, `caption`, `info`, `required`, `collapsed`, `html`, `attrs`, `attrs_tr`, `attrs_wrapper`, `checker_func`, `checker_params`, `checker_error`, `db_pass`, `db_params`, `editable`, `deletable`, `rateable`) VALUES 
('bx_workspace', 'bx_workspaces', 'allow_view_to', 3, '', 0, 'custom', '_bx_workspaces_form_profile_input_sys_allow_view_to', '_bx_workspaces_form_profile_input_allow_view_to', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0, ''),
('bx_workspace', 'bx_workspaces', 'allow_post_to', 5, '', 0, 'custom', '_bx_workspaces_form_profile_input_sys_allow_post_to', '_bx_workspaces_form_profile_input_allow_post_to', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0, ''),
('bx_workspace', 'bx_workspaces', 'allow_contact_to', 3, '', 0, 'custom', '_bx_workspaces_form_profile_input_sys_allow_contact_to', '_bx_workspaces_form_profile_input_allow_contact_to', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0, ''),
('bx_workspace', 'bx_workspaces', 'delete_confirm', 1, '', 0, 'checkbox', '_bx_workspaces_form_profile_input_sys_delete_confirm', '_bx_workspaces_form_profile_input_delete_confirm', '_bx_workspaces_form_profile_input_delete_confirm_info', 1, 0, 0, '', '', '', 'Avail', '', '_bx_workspaces_form_profile_input_delete_confirm_error', '', '', 1, 0, ''),
('bx_workspace', 'bx_workspaces', 'do_submit', '_bx_workspaces_form_profile_input_submit', '', 0, 'submit', '_bx_workspaces_form_profile_input_sys_do_submit', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0, ''),
('bx_workspace', 'bx_workspaces', 'do_cancel', '_sys_form_input_cancel', '', 0, 'button', '_sys_form_input_sys_cancel', '', '', 0, 0, 0, 'a:2:{s:7:"onclick";s:41:"window.open(''{edit_cancel_url}'', ''_self'')";s:5:"class";s:22:"bx-def-margin-sec-left";}', '', '', '', '', '', '', '', 0, 0, ''),
('bx_workspace', 'bx_workspaces', 'controls', '', 'do_submit,do_cancel', 0, 'input_set', '_sys_form_input_sys_controls', '', '', 0, 0, 0, '', '', '', '', '', '', '', '', 0, 0, ''),
('bx_workspace', 'bx_workspaces', 'profile_email', '', '', 0, 'text', '_bx_workspaces_form_profile_input_sys_profile_email', '_bx_workspaces_form_profile_input_profile_email', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0, ''),
('bx_workspace', 'bx_workspaces', 'profile_status', '', '', 0, 'text', '_bx_workspaces_form_profile_input_sys_profile_status', '_bx_workspaces_form_profile_input_profile_status', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0, ''),
('bx_workspace', 'bx_workspaces', 'profile_ip', '', '', 0, 'text', '_bx_workspaces_form_profile_input_sys_profile_ip', '_bx_workspaces_form_profile_input_profile_ip', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0, ''),
('bx_workspace', 'bx_workspaces', 'profile_last_active', '', '', 0, 'text', '_bx_workspaces_form_profile_input_sys_profile_last_active', '_bx_workspaces_form_profile_input_profile_last_active', '', 0, 0, 0, '', '', '', '', '', '', 'Xss', '', 0, 0, ''),
('bx_workspace', 'bx_workspaces', 'added', '', '', 0, 'datetime', '_bx_workspaces_form_profile_input_sys_date_added', '_bx_workspaces_form_profile_input_date_added', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0, ''),
('bx_workspace', 'bx_workspaces', 'changed', '', '', 0, 'datetime', '_bx_workspaces_form_profile_input_sys_date_changed', '_bx_workspaces_form_profile_input_date_changed', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0, ''),
('bx_workspace', 'bx_workspaces', 'friends_count', '', '', 0, 'text', '_bx_workspaces_form_profile_input_sys_friends_count', '_bx_workspaces_form_profile_input_friends_count', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0, ''),
('bx_workspace', 'bx_workspaces', 'followers_count', '', '', 0, 'text', '_bx_workspaces_form_profile_input_sys_followers_count', '_bx_workspaces_form_profile_input_followers_count', '', 0, 0, 0, '', '', '', '', '', '', '', '', 1, 0, '');

INSERT INTO `sys_form_display_inputs`(`display_name`, `input_name`, `visible_for_levels`, `active`, `order`) VALUES 
('bx_workspace_add', 'allow_view_to', 2147483647, 1, 8),
('bx_workspace_add', 'allow_post_to', 2147483647, 1, 9),
('bx_workspace_add', 'allow_contact_to', 2147483647, 1, 10),
('bx_workspace_add', 'do_submit', 2147483647, 1, 11),

('bx_workspace_delete', 'delete_confirm', 2147483647, 1, 0),
('bx_workspace_delete', 'do_submit', 2147483647, 1, 1),

('bx_workspace_edit', 'allow_view_to', 2147483647, 1, 8),
('bx_workspace_edit', 'allow_post_to', 2147483647, 1, 9),
('bx_workspace_edit', 'allow_contact_to', 2147483647, 1, 10),
('bx_workspace_edit', 'controls', 2147483647, 1, 11),
('bx_workspace_edit', 'do_submit', 2147483647, 1, 12),
('bx_workspace_edit', 'do_cancel', 2147483647, 1, 13),

('bx_workspace_view', 'profile_email', 192, 1, 5),
('bx_workspace_view', 'profile_status', 192, 1, 6),
('bx_workspace_view', 'profile_ip', 192, 1, 7),
('bx_workspace_view', 'profile_last_active', 192, 1, 8),
('bx_workspace_view', 'added', 192, 1, 9),
('bx_workspace_view', 'changed', 192, 1, 10),
('bx_workspace_view', 'friends_count', 2147483647, 1, 11),
('bx_workspace_view', 'followers_count', 2147483647, 1, 12),

('bx_workspace_view_full', 'profile_email', 192, 1, 6),
('bx_workspace_view_full', 'profile_status', 192, 1, 7),
('bx_workspace_view_full', 'profile_last_active', 192, 1, 8);

-- COMMENTS
INSERT INTO `sys_objects_cmts` (`Name`, `Module`, `Table`, `CharsPostMin`, `CharsPostMax`, `CharsDisplayMax`, `Html`, `PerView`, `PerViewReplies`, `BrowseType`, `IsBrowseSwitch`, `PostFormPosition`, `NumberOfLevels`, `IsDisplaySwitch`, `IsRatable`, `ViewingThreshold`, `IsOn`, `RootStylePrefix`, `BaseUrl`, `ObjectVote`, `TriggerTable`, `TriggerFieldId`, `TriggerFieldAuthor`, `TriggerFieldTitle`, `TriggerFieldComments`, `ClassName`, `ClassFile`) VALUES
('bx_workspaces', 'bx_workspaces', 'bx_workspaces_cmts', 1, 5000, 1000, 3, 5, 3, 'tail', 1, 'bottom', 1, 1, 1, -3, 1, 'cmt', 'page.php?i=view-workspaces-profile&id={object_id}', '', 'bx_workspaces_data', 'id', 'author', 'fullname', 'comments', 'BxWorkspacesCmts', 'modules/boonex/workspaces/classes/BxWorkspacesCmts.php'),
('bx_workspaces_notes', 'bx_workspaces', 'bx_workspaces_cmts_notes', 1, 5000, 1000, 0, 5, 3, 'tail', 1, 'bottom', 1, 1, 1, -3, 1, 'cmt', 'page.php?i=view-post&id={object_id}', '', 'bx_workspaces_data', 'id', 'author', 'fullname', '', 'BxTemplCmtsNotes', '');

-- VIEWS
INSERT INTO `sys_objects_view` (`name`, `module`, `table_track`, `period`, `is_on`, `trigger_table`, `trigger_field_id`, `trigger_field_author`, `trigger_field_count`, `class_name`, `class_file`) VALUES 
('bx_workspaces', 'bx_workspaces', 'bx_workspaces_views_track', '86400', '1', 'bx_workspaces_data', 'id', 'author', 'views', '', '');

-- VOTES
INSERT INTO `sys_objects_vote` (`Name`, `Module`, `TableMain`, `TableTrack`, `PostTimeout`, `MinValue`, `MaxValue`, `IsUndo`, `IsOn`, `TriggerTable`, `TriggerFieldId`, `TriggerFieldAuthor`, `TriggerFieldRate`, `TriggerFieldRateCount`, `ClassName`, `ClassFile`) VALUES 
('bx_workspaces', 'bx_workspaces', 'bx_workspaces_votes', 'bx_workspaces_votes_track', '604800', '1', '1', '0', '1', 'bx_workspaces_data', 'id', '', 'rate', 'votes', 'BxWorkspacesVote', 'modules/boonex/workspaces/classes/BxWorkspacesVote.php'),
('bx_workspaces_reactions', 'bx_workspaces', 'bx_workspaces_reactions', 'bx_workspaces_reactions_track', '604800', '1', '1', '1', '1', 'bx_workspaces_data', 'id', 'author', 'rrate', 'rvotes', 'BxTemplVoteReactions', '');

-- SCORES
INSERT INTO `sys_objects_score` (`name`, `module`, `table_main`, `table_track`, `post_timeout`, `is_on`, `trigger_table`, `trigger_field_id`, `trigger_field_author`, `trigger_field_score`, `trigger_field_cup`, `trigger_field_cdown`, `class_name`, `class_file`) VALUES 
('bx_workspaces', 'bx_workspaces', 'bx_workspaces_scores', 'bx_workspaces_scores_track', '604800', '1', 'bx_workspaces_data', 'id', 'author', 'score', 'sc_up', 'sc_down', '', '');

-- FAFORITES
INSERT INTO `sys_objects_favorite` (`name`, `table_track`, `is_on`, `is_undo`, `is_public`, `base_url`, `trigger_table`, `trigger_field_id`, `trigger_field_author`, `trigger_field_count`, `class_name`, `class_file`) VALUES 
('bx_workspaces', 'bx_workspaces_favorites_track', '1', '1', '0', 'page.php?i=view-workspaces-profile&id={object_id}', 'bx_workspaces_data', 'id', 'author', 'favorites', 'BxWorkspacesFavorite', 'modules/boonex/workspaces/classes/BxWorkspacesFavorite.php');

-- FEATURED
INSERT INTO `sys_objects_feature` (`name`, `module`, `is_on`, `is_undo`, `base_url`, `trigger_table`, `trigger_field_id`, `trigger_field_author`, `trigger_field_flag`, `class_name`, `class_file`) VALUES 
('bx_workspaces', 'bx_workspaces', '1', '1', 'page.php?i=view-workspaces-profile&id={object_id}', 'bx_workspaces_data', 'id', 'author', 'featured', '', '');

-- REPORTS
INSERT INTO `sys_objects_report` (`name`, `module`, `table_main`, `table_track`, `is_on`, `base_url`, `object_comment`, `trigger_table`, `trigger_field_id`, `trigger_field_author`, `trigger_field_count`, `class_name`, `class_file`) VALUES 
('bx_workspaces', 'bx_workspaces', 'bx_workspaces_reports', 'bx_workspaces_reports_track', '1', 'page.php?i=view-workspaces-profile&id={object_id}', 'bx_workspaces_notes', 'bx_workspaces_data', 'id', 'author', 'reports', 'BxWorkspacesReport', 'modules/boonex/workspaces/classes/BxWorkspacesReport.php');

-- CONTENT INFO
INSERT INTO `sys_objects_content_info` (`name`, `title`, `alert_unit`, `alert_action_add`, `alert_action_update`, `alert_action_delete`, `class_name`, `class_file`) VALUES
('bx_workspaces', '_bx_workspaces', 'bx_workspaces', 'added', 'edited', 'deleted', '', ''),
('bx_workspaces_cmts', '_bx_workspaces_cmts', 'bx_workspaces', 'commentPost', 'commentUpdated', 'commentRemoved', 'BxDolContentInfoCmts', '');

INSERT INTO `sys_content_info_grids` (`object`, `grid_object`, `grid_field_id`, `condition`, `selection`) VALUES
('bx_workspaces', 'bx_workspaces_administration', 'td`.`id', '', ''),
('bx_workspaces', 'bx_workspaces_common', 'td`.`id', '', '');


-- STUDIO PAGE & WIDGET
INSERT INTO `sys_std_pages`(`index`, `name`, `header`, `caption`, `icon`) VALUES
(3, 'bx_workspaces', '_bx_workspaces', '_bx_workspaces', 'bx_workspaces@modules/boonex/workspaces/|std-icon.svg');
SET @iPageId = LAST_INSERT_ID();

SET @iParentPageId = (SELECT `id` FROM `sys_std_pages` WHERE `name` = 'home');
SET @iParentPageOrder = (SELECT MAX(`order`) FROM `sys_std_pages_widgets` WHERE `page_id` = @iParentPageId);
INSERT INTO `sys_std_widgets` (`page_id`, `module`, `type`, `url`, `click`, `icon`, `caption`, `cnt_notices`, `cnt_actions`) VALUES
(@iPageId, 'bx_workspaces', 'users', '{url_studio}module.php?name=bx_workspaces', '', 'bx_workspaces@modules/boonex/workspaces/|std-icon.svg', '_bx_workspaces', '', 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:11:"get_actions";s:6:"params";a:0:{}s:5:"class";s:18:"TemplStudioModules";}');
INSERT INTO `sys_std_pages_widgets` (`page_id`, `widget_id`, `order`) VALUES
(@iParentPageId, LAST_INSERT_ID(), IF(ISNULL(@iParentPageOrder), 1, @iParentPageOrder + 1));

