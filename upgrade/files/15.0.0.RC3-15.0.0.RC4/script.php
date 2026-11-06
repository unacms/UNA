<?php

    // Added columns and indexes: MySQL 5.7 has no ADD COLUMN IF NOT EXISTS, so they are checked here.
    if (!$this->oDb->isFieldExists('sys_keys', 'scope'))
        $this->oDb->query("ALTER TABLE `sys_keys` ADD COLUMN `scope` tinyint(4) NOT NULL DEFAULT '0' AFTER `data`");

    if (!$this->oDb->isFieldExists('sys_objects_page', 'cover_hidden_on'))
        $this->oDb->query("ALTER TABLE `sys_objects_page` ADD COLUMN `cover_hidden_on` varchar(255) NOT NULL DEFAULT '' AFTER `cover_title`");

    if (!$this->oDb->isFieldExists('sys_pages_blocks', 'title_hidden_on'))
        $this->oDb->query("ALTER TABLE `sys_pages_blocks` ADD COLUMN `title_hidden_on` varchar(255) NOT NULL DEFAULT '' AFTER `hidden_on`");

    if (!$this->oDb->isFieldExists('sys_pages_blocks', 'bg_hidden_on'))
        $this->oDb->query("ALTER TABLE `sys_pages_blocks` ADD COLUMN `bg_hidden_on` varchar(255) NOT NULL DEFAULT '' AFTER `title_hidden_on`");

    if (!$this->oDb->isFieldExists('sys_pages_blocks', 'padding_hidden_on'))
        $this->oDb->query("ALTER TABLE `sys_pages_blocks` ADD COLUMN `padding_hidden_on` varchar(255) NOT NULL DEFAULT '' AFTER `bg_hidden_on`");

    if (!$this->oDb->isIndexExists('sys_menu_items', 'set_name'))
        $this->oDb->query("ALTER TABLE `sys_menu_items` ADD KEY `set_name` (`set_name`)");


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

    return true;
