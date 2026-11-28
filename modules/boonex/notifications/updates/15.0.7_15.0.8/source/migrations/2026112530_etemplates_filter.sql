-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Email templates: the search looks in the type, the action, the subject and the body as they are (they are not
-- language keys, and there is no `content` column), with LIKE, as the table has no full-text index.
UPDATE `sys_objects_grid` SET `filter_fields` = 'type,action,subject,body', `filter_fields_translatable` = '', `filter_mode` = 'like' WHERE `object` = 'bx_notifications_etemplates' AND `filter_fields_translatable` = 'type,action,subject,content';
