-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Studio > Audit: the search looks in the names of the profile, the content and the context (there is no `value`
-- column), and the table is not sorted by `author_id`, which it doesn't have.
UPDATE `sys_objects_grid` SET `filter_fields` = 'profile_title,content_title,context_profile_title,content_module' WHERE `object` = 'sys_audit_administration' AND `filter_fields` = 'value';
UPDATE `sys_objects_grid` SET `sorting_fields` = 'content_module,profile_id,content_id,context_profile_id,added' WHERE `object` = 'sys_audit_administration' AND `sorting_fields` = 'content_module,profile_id,content_id,author_id,context_profile_id,added';
