DROP TABLE IF EXISTS `bx_messenger_mass_convo_tracker`;
CREATE TABLE IF NOT EXISTS `bx_messenger_mass_convo_tracker` (
  `convo_id` int(11) unsigned NOT NULL default 0,
  `user_id` int(11) unsigned NOT NULL default 0,
  PRIMARY KEY (`convo_id`, `user_id`)
);

DROP TABLE IF EXISTS `bx_messenger_jots_rvotes`;
CREATE TABLE IF NOT EXISTS `bx_messenger_jots_rvotes` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `object_id` int(11) NOT NULL default '0',
    `reaction` varchar(32) NOT NULL default '',
    `count` int(11) NOT NULL default '0',
    `sum` int(11) NOT NULL default '0',
    PRIMARY KEY (`id`),
    UNIQUE KEY `reaction` (`object_id`, `reaction`)
);

DROP TABLE IF EXISTS `bx_messenger_jots_rvotes_track`;
CREATE TABLE IF NOT EXISTS `bx_messenger_jots_rvotes_track` (
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
