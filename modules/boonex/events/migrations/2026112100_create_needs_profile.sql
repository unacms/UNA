-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- An account without a profile can't create a event: it would be owned by the account's system profile, which
-- isn't a member who can be shown, followed or contacted. The "Account" level loses "create entry", as in Posts.
DELETE `m` FROM `sys_acl_matrix` AS `m`
INNER JOIN `sys_acl_actions` AS `a` ON `a`.`ID` = `m`.`IDAction`
WHERE `m`.`IDLevel` = 2 AND `a`.`Module` = 'bx_events' AND `a`.`Name` = 'create entry';
