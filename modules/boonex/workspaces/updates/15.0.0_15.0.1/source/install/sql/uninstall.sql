
-- TABLES
DROP TABLE IF EXISTS `bx_workspaces_data`, `bx_workspaces_cmts`, `bx_workspaces_cmts_notes`, `bx_workspaces_views_track`, `bx_workspaces_votes`, `bx_workspaces_votes_track`, `bx_workspaces_reactions`, `bx_workspaces_reactions_track`, `bx_workspaces_favorites_track`, `bx_workspaces_reports`, `bx_workspaces_reports_track`, `bx_workspaces_scores`, `bx_workspaces_scores_track`;

-- PROFILES
DELETE FROM sys_profiles WHERE `type` = 'bx_workspaces';

-- FORMS
DELETE FROM `sys_objects_form` WHERE `module` = 'bx_workspaces';
DELETE FROM `sys_form_displays` WHERE `module` = 'bx_workspaces';
DELETE FROM `sys_form_inputs` WHERE `module` = 'bx_workspaces';
DELETE FROM `sys_form_display_inputs` WHERE `display_name` IN('bx_workspace_add', 'bx_workspace_delete', 'bx_workspace_edit', 'bx_workspace_edit_cover', 'bx_workspace_view', 'bx_workspace_view_full', 'bx_workspace_skills', 'bx_workspace_skills_view');

-- COMMENTS
DELETE FROM `sys_objects_cmts` WHERE `Name` LIKE 'bx_workspaces%';

-- VIEWS
DELETE FROM `sys_objects_view` WHERE `name` = 'bx_workspaces';

-- VOTES
DELETE FROM `sys_objects_vote` WHERE `Name` IN ('bx_workspaces', 'bx_workspaces_reactions');

-- SCORES
DELETE FROM `sys_objects_score` WHERE `name` = 'bx_workspaces';

-- FAFORITES
DELETE FROM `sys_objects_favorite` WHERE `name` = 'bx_workspaces';

-- FEATURED
DELETE FROM `sys_objects_feature` WHERE `name` = 'bx_workspaces';

-- REPORTS
DELETE FROM `sys_objects_report` WHERE `name` = 'bx_workspaces';

-- CONTENT INFO
DELETE FROM `sys_objects_content_info` WHERE `name` IN ('bx_workspaces', 'bx_workspaces_cmts');

DELETE FROM `sys_content_info_grids` WHERE `object` IN ('bx_workspaces');

-- STUDIO PAGE & WIDGET
DELETE FROM `tp`, `tw`, `twb`, `tpw` 
USING `sys_std_pages` AS `tp` LEFT JOIN `sys_std_widgets` AS `tw` ON `tp`.`id` = `tw`.`page_id` LEFT JOIN `sys_std_widgets_bookmarks` AS `twb` ON `tw`.`id` = `twb`.`widget_id` LEFT JOIN `sys_std_pages_widgets` AS `tpw` ON `tw`.`id` = `tpw`.`widget_id`
WHERE  `tp`.`name` = 'bx_workspaces';
