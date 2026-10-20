<?php

    if (!$this->oDb->isFieldExists('sys_modules', 'note'))
        $this->oDb->query("ALTER TABLE `sys_modules` ADD COLUMN `note` varchar(255) NOT NULL DEFAULT '' AFTER `title`");

    if (!$this->oDb->isFieldExists('sys_agents_chat_history', 'title'))
        $this->oDb->query("ALTER TABLE `sys_agents_chat_history` ADD COLUMN `title` varchar(255) NOT NULL DEFAULT '' AFTER `closed_reason`");

    $aPathInfo = pathinfo(__FILE__);
    $mixedResult = $this->oDb->executeSQL($aPathInfo['dirname'] . '/app.sql');
    if (true !== $mixedResult) {
        if (!is_array($mixedResult))
            return $mixedResult;

        $s = '';
        foreach ($mixedResult as $a)
            $s .= "<b>{$a['query']}</b>: {$a['error']} <br />";
        return $s;
    }

    // UUID and VECTOR. MariaDB 11.7 and newer only. MySQL and older MariaDB cannot create these tables.
    $sVersion = (string)$this->oDb->getOne('SELECT VERSION()');
    $aServer = BxDolAIVectorStoreMariaDb::describe($sVersion);
    if (($aServer['engine'] ?? '') === 'mariadb' && !empty($aServer['supported'])) {
        $mixedResult = $this->oDb->executeSQL($aPathInfo['dirname'] . '/mariadb.sql');
        if (true !== $mixedResult) {
            if (!is_array($mixedResult))
                return $mixedResult;

            $s = '';
            foreach ($mixedResult as $a)
                $s .= "<b>{$a['query']}</b>: {$a['error']} <br />";
            return $s;
        }
    }

/*
    $aPathInfo = pathinfo(__FILE__);
    $this->oDb->executeSQL($aPathInfo['dirname'] . '/sys-alerts-desc.sql');

    if (($oStorage = BxDolStorage::getObjectInstance('sys_agents_assistants_chats_files')) !== false) {
        $aFiles = $oStorage->getFiles(false);
        if (is_array($aFiles)) {
            foreach ($aFiles as $aFile)
                $oStorage->deleteFile($aFile['id']);
        }

        $this->oDb->query("DELETE FROM `sys_objects_storage` WHERE `object` = 'sys_agents_assistants_chats_files'");
        $this->oDb->query("DROP TABLE IF EXISTS `sys_agents_assistants_chats_files`");
    }
*/
    return true;
