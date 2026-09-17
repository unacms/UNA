<?php

    if (!$this->oDb->isFieldExists('sys_form_inputs', 'area_label'))
        $this->oDb->query("ALTER TABLE `sys_form_inputs` ADD COLUMN `area_label` varchar(255) NOT NULL DEFAULT '' AFTER `help`");
 
    if (!$this->oDb->isFieldExists('sys_agents_agents', 'acl_levels'))
        $this->oDb->query("ALTER TABLE `sys_agents_agents` ADD COLUMN `acl_levels` int(10) unsigned NOT NULL DEFAULT 0 AFTER `profile_id`");

    if (!$this->oDb->isFieldExists('sys_agents_agents', 'max_turns'))
        $this->oDb->query("ALTER TABLE `sys_agents_agents` ADD COLUMN `max_turns` int(11) NOT NULL DEFAULT 0 AFTER `tools_max_run`");

    if (!$this->oDb->isFieldExists('sys_agents_agents', 'chat_ttl_min'))
        $this->oDb->query("ALTER TABLE `sys_agents_agents` ADD COLUMN `chat_ttl_min` int(11) NOT NULL DEFAULT 0 AFTER `max_turns`");

    if (!$this->oDb->isFieldExists('sys_agents_agents', 'limit_message'))
        $this->oDb->query("ALTER TABLE `sys_agents_agents` ADD COLUMN `limit_message` text NOT NULL AFTER `chat_ttl_min`");

    if (!$this->oDb->isFieldExists('sys_agents_agents', 'max_input_chars'))
        $this->oDb->query("ALTER TABLE `sys_agents_agents` ADD COLUMN `max_input_chars` int(11) NOT NULL DEFAULT 0 AFTER `limit_message`");

    if (!$this->oDb->isFieldExists('sys_agents_agents', 'max_tokens'))
        $this->oDb->query("ALTER TABLE `sys_agents_agents` ADD COLUMN `max_tokens` int(11) NOT NULL DEFAULT 0 AFTER `max_input_chars`");

    if (!$this->oDb->isFieldExists('sys_agents_agents', 'max_sessions_per_hour'))
        $this->oDb->query("ALTER TABLE `sys_agents_agents` ADD COLUMN `max_sessions_per_hour` int(11) NOT NULL DEFAULT 0 AFTER `max_tokens`");

    if (!$this->oDb->isFieldExists('sys_agents_agents', 'max_sessions_per_day'))
        $this->oDb->query("ALTER TABLE `sys_agents_agents` ADD COLUMN `max_sessions_per_day` int(11) NOT NULL DEFAULT 0 AFTER `max_sessions_per_hour`");

    if (!$this->oDb->isFieldExists('sys_agents_agents', 'hidden_first_message'))
        $this->oDb->query("ALTER TABLE `sys_agents_agents` ADD COLUMN `hidden_first_message` varchar(64) NOT NULL DEFAULT '' AFTER `max_sessions_per_day`");


    if (!$this->oDb->isFieldExists('sys_agents_chat_history', 'ip'))
        $this->oDb->query("ALTER TABLE `sys_agents_chat_history` ADD COLUMN `ip` bigint(20) unsigned NOT NULL DEFAULT 0 AFTER `thread_id`");

    if (!$this->oDb->isFieldExists('sys_agents_chat_history', 'closed_reason'))
        $this->oDb->query("ALTER TABLE `sys_agents_chat_history` ADD COLUMN `closed_reason` varchar(16) NOT NULL DEFAULT '' AFTER `updated_at`");

    if (!$this->oDb->isIndexExists('sys_agents_chat_history', 'ip_created'))
        $this->oDb->query("ALTER TABLE `sys_agents_chat_history` ADD KEY `ip_created` (`ip`, `created_at`)");
  
    $aPathInfo = pathinfo(__FILE__);
    $this->oDb->executeSQL($aPathInfo['dirname'] . '/sys-alerts-desc.sql');

    return true;
