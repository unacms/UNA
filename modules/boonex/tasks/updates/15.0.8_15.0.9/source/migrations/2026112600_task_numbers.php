<?php defined('BX_DOL') or die('hack attempt');
/*
 * UNA-Migration-Min-System-Version: 15.0.0-RC4
 *
 * Tasks: numbers as Linear has them (UNA-12), as install.sql has it. A task's number and the counter
 * it took it from (its community, 0 for none), a community's prefix and last number, every
 * prefix a community had, and the SEO links tasks had before their numbers. In PHP, since MySQL
 * has no ADD COLUMN IF NOT EXISTS.
 */

BxDolMigrationsHelper::addColumn('bx_tasks_tasks', 'number', "int(11) NOT NULL default '0' AFTER `gh_issue_url`");
BxDolMigrationsHelper::addColumn('bx_tasks_tasks', 'number_context_id', "int(11) NOT NULL default '0' AFTER `number`");
BxDolMigrationsHelper::addIndex('bx_tasks_tasks', 'number', ['number_context_id', 'number']);

BxDolMigrationsHelper::addColumn('bx_tasks_contexts', 'prefix', "varchar(16) NOT NULL DEFAULT '' AFTER `gh_repository`");
BxDolMigrationsHelper::addColumn('bx_tasks_contexts', 'last_number', "int(11) NOT NULL DEFAULT '0' AFTER `prefix`");

BxDolDb::getInstance()->query("CREATE TABLE IF NOT EXISTS `bx_tasks_prefixes` (
  `prefix` varchar(16) NOT NULL,
  `context_id` int(11) NOT NULL DEFAULT '0',
  `added` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`prefix`),
  KEY `context_id` (`context_id`)
)");

BxDolDb::getInstance()->query("CREATE TABLE IF NOT EXISTS `bx_tasks_former_links` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `page_uri` varchar(255) NOT NULL,
  `uri` varchar(50) NOT NULL,
  `content_id` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `page_uri` (`page_uri`(109),`uri`),
  KEY `content_id` (`content_id`)
)");
