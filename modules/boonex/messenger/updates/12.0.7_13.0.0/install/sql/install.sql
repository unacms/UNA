DROP TABLE IF EXISTS `bx_messenger_jots_media_tracker`;
CREATE TABLE IF NOT EXISTS `bx_messenger_jots_media_tracker` (
   `file_id` int(11) NOT NULL default 0,
   `user_id` int(11) unsigned NOT NULL default 0,
   `collapsed` tinyint(1) NOT NULL default 1,
    PRIMARY KEY (`file_id`, `user_id`)
);

DROP TABLE IF EXISTS `bx_messenger_groups`;
CREATE TABLE IF NOT EXISTS `bx_messenger_groups` (
    `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
    `author` int(11) unsigned NOT NULL,
    `added` int(11) unsigned NOT NULL,
    `allow_view_to` int(10) unsigned NOT NULL DEFAULT 3,
    `name` varchar(50) NOT NULL,
    `desc` varchar(255) NOT NULL,
    `url` varchar(255) NOT NULL,
    `module` varchar(50) NOT NULL,
    `count` int(10) unsigned NOT NULL DEFAULT 0,
    `profile_id` int(11) unsigned NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    KEY `module` (`module`)
);

INSERT INTO `bx_messenger_groups` (`id`, `author`, `added`, `allow_view_to`, `name`, `desc`, `url`, `module`, `count`, `profile_id`) VALUES
(1, 0, UNIX_TIMESTAMP(), 3, 'Homepage', '', 'i=index', 'bx_messenger_pages', 0, 0);

DROP TABLE IF EXISTS `bx_messenger_groups_lots`;
CREATE TABLE IF NOT EXISTS `bx_messenger_groups_lots` (
    `lot_id` int(11) unsigned NOT NULL,
    `group_id` int(11) unsigned NOT NULL,
    UNIQUE KEY (`lot_id`, `group_id`)
);


DROP TABLE IF EXISTS `bx_messenger_saved_jots`;
CREATE TABLE IF NOT EXISTS `bx_messenger_saved_jots` (
    `jot_id` int(11) NOT NULL default 0,
    `profile_id` int(11) NOT NULL default 0,
    UNIQUE KEY `id` (`jot_id`, `profile_id`),
    KEY `profile` (`profile_id`)
);