-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Module titles in the agreed vocabulary (una-vocabulary skill). Names, URIs and prefixes stay.
UPDATE `sys_modules` SET `title` = 'People' WHERE `name` = 'bx_persons' AND `title` = 'Persons';
UPDATE `sys_modules` SET `title` = 'Memberships' WHERE `name` = 'bx_acl' AND `title` = 'Paid Levels';
UPDATE `sys_modules` SET `title` = 'Email campaigns' WHERE `name` = 'bx_massmailer' AND `title` = 'Mass mailer';
UPDATE `sys_modules` SET `title` = 'Private messages' WHERE `name` = 'bx_convos' AND `title` = 'Conversations';
