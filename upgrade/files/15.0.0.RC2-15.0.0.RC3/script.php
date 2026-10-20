<?php

    if (!$this->oDb->isFieldExists('sys_modules', 'note'))
        $this->oDb->query("ALTER TABLE `sys_modules` ADD COLUMN `note` varchar(255) NOT NULL DEFAULT '' AFTER `title`");

    if (!$this->oDb->isFieldExists('sys_agents_chat_history', 'title'))
        $this->oDb->query("ALTER TABLE `sys_agents_chat_history` ADD COLUMN `title` varchar(255) NOT NULL DEFAULT '' AFTER `closed_reason`");

    // app related changes
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

    // migrate AI chat threads
    if ($this->oDb->isFieldExists('sys_agents_chat_history', 'thread_id')) {
        $aRows = $this->oDb->getAll("SELECT `id`, `thread_id` FROM `sys_agents_chat_history` WHERE `thread_id` LIKE '%.%'");
        foreach ($aRows as $aRow) {
            $sThreadId = (string)$aRow['thread_id'];
            $iColon = strrpos($sThreadId, ':');
            $sSub = $iColon === false ? $sThreadId : substr($sThreadId, $iColon + 1);
            $sPrefix = $iColon === false ? '' : substr($sThreadId, 0, $iColon + 1);
            $iDot = strrpos($sSub, '.');
            if ($iDot === false)
                continue;
            $sOwner = substr($sSub, 0, $iDot);
            $sChat = substr($sSub, $iDot + 1);
            if (!preg_match('/^[A-Za-z0-9_-]{8,64}$/', $sChat))
                continue;
            $bMember = (strpos($sSub, '.') === $iDot && preg_match('/^[0-9]+$/', $sOwner));
            $bGuest = (strlen($sOwner) === 32);
            if (!$bMember && !$bGuest)
                continue;
            $sNew = $sPrefix . $sOwner . '#' . $sChat;
            if ($sNew === $sThreadId)
                continue;
            $aTaken = $this->oDb->getRow("SELECT `id` FROM `sys_agents_chat_history` WHERE `thread_id` = :t LIMIT 1", [
                't' => $sNew,
            ]);
            if (!empty($aTaken['id']))
                continue;
            $this->oDb->query("UPDATE `sys_agents_chat_history` SET `thread_id` = :n WHERE `id` = :id AND `thread_id` = :o", [
                'n' => $sNew,
                'id' => (int)$aRow['id'],
                'o' => $sThreadId,
            ]);
        }
    }

    return true;
