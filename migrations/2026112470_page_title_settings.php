<?php defined('BX_DOL') or die('hack attempt');
/*
 * UNA-Migration-Min-System-Version: 15.0.0-RC4
 *
 * Pages: the page title has settings of its own, apart from the cover (Studio > Pages > page > Title).
 * NULL, the default, makes a page's title follow its cover, as before: shown where the cover shows, to the same
 * viewers and on the same screen sizes. Saving the page's settings in Studio stores both values.
 */

BxDolMigrationsHelper::addColumn('sys_objects_page', 'title_show', "tinyint(4) DEFAULT NULL AFTER `cover_hidden_on`");
BxDolMigrationsHelper::addColumn('sys_objects_page', 'title_hidden_on', "varchar(255) DEFAULT NULL AFTER `title_show`");
