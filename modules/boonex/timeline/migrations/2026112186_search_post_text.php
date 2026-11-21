<?php defined('BX_DOL') or die('hack attempt');
/*
 * UNA-Migration-Min-System-Version: 15.0.0-RC4
 *
 * Search finds posts by their text, not only by the start of it (the title): the searchable fields are the title and
 * the content, which a FULLTEXT index covers for sites that search with MATCH (useLikeOperator off).
 */

$oDb = BxDolDb::getInstance();

foreach (['bx_timeline_events', 'bx_timeline_events_slice'] as $sTable) {
    if (!$oDb->isTableExists($sTable)) {
        continue;
    }

    $aIndex = $oDb->getAll("SHOW INDEX FROM `" . $sTable . "` WHERE `Key_name` = 'search_text'");
    if (empty($aIndex)) {
        $oDb->query("ALTER TABLE `" . $sTable . "` ADD FULLTEXT KEY `search_text` (`title`, `content`)");
    }
}

$oDb->query("UPDATE `sys_options` SET `value` = 'title,content' WHERE `name` = 'bx_timeline_searchable_fields' AND `value` = 'title,description'");
