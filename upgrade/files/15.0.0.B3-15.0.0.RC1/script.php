<?php

    if (!$this->oDb->isFieldExists('sys_agents_models', 'icon'))
        $this->oDb->query("ALTER TABLE `sys_agents_models` ADD `icon` text NOT NULL AFTER `title`");
   
    if ($this->oDb->isFieldExists('sys_agents_models', 'icon')) {
        $this->oDb->query("UPDATE `sys_agents_models` SET `icon` = 'ai-claude.svg' WHERE `type` = 'anthropic'");
        $this->oDb->query("UPDATE `sys_agents_models` SET `icon` = 'ai-openai.svg' WHERE `type` IN('openai-responses', 'openai-like', 'openai-embeddings', 'openai-like-embeddings')");
        $this->oDb->query("UPDATE `sys_agents_models` SET `icon` = 'ai-azure.svg' WHERE `type` = 'azure-openai'");
        $this->oDb->query("UPDATE `sys_agents_models` SET `icon` = 'ai-ollama.svg' WHERE `type` IN('ollama', 'ollama-embeddings')");
        $this->oDb->query("UPDATE `sys_agents_models` SET `icon` = 'ai-gemini.svg' WHERE `type` = 'gemini'");
        $this->oDb->query("UPDATE `sys_agents_models` SET `icon` = 'ai-mistral.svg' WHERE `type` = 'mistral'");
        $this->oDb->query("UPDATE `sys_agents_models` SET `icon` = 'ai-huggingface.svg' WHERE `type` = 'huggingface'");
        $this->oDb->query("UPDATE `sys_agents_models` SET `icon` = 'ai-deepseek.svg' WHERE `type` = 'deepseek'");
        $this->oDb->query("UPDATE `sys_agents_models` SET `icon` = 'ai-bedrock.svg' WHERE `type` IN('aws-bedrock', 'aws-bedrock-embeddings')");
        $this->oDb->query("UPDATE `sys_agents_models` SET `icon` = 'ai-cohere.svg' WHERE `type` = 'cohere'");
        $this->oDb->query("UPDATE `sys_agents_models` SET `icon` = 'ai-voyage.svg' WHERE `type` = 'voyageai-embeddings'");
        $this->oDb->query("UPDATE `sys_agents_models` SET `icon` = 'ai-grok.svg' WHERE `type` = 'grok'");
        $this->oDb->query("
SET @j = JSON_OBJECT(
    'url', 'http://localhost:11434/api',
    'parameters', JSON_OBJECT()
)");
        $this->oDb->query("UPDATE `sys_agents_models` SET `model` = 'llama3.2:1b', `params` = CAST(@j AS CHAR) WHERE `type` = 'ollama' AND `model` = ''");

        $this->oDb->query("
SET @j = JSON_OBJECT(
    'baseUri', 'https://api.moonshot.ai/v1',
    'parameters', JSON_OBJECT(
      'thinking', JSON_OBJECT(
        'type', 'disabled'
      )
    )
 )");
        $this->oDb->query("INSERT INTO `sys_agents_models` (`type`, `model`, `title`, `icon`, `docs`, `key`, `params`, `params_user`, `capabilities`, `duplicate`, `active`, `changed`) VALUES
('openai-like', 'kimi-k2.6', 'Kimi', 'ai-kimi.svg', 'Kimi - https://www.kimi.com/ai-models/kimi-k2-6', '', CAST(@j AS CHAR), NULL, 'chatvlm', 0, 0, 0)");


    }

    if (!$this->oDb->isFieldExists('sys_agents_agents', 'title'))
        $this->oDb->query("ALTER TABLE `sys_agents_agents` ADD `title` varchar(128) NOT NULL DEFAULT '' AFTER `name`");
    if (!$this->oDb->isFieldExists('sys_agents_agents', 'description'))
        $this->oDb->query("ALTER TABLE `sys_agents_agents` ADD `description` text NOT NULL AFTER `title`");
    if (!$this->oDb->isFieldExists('sys_agents_agents', 'icon'))
        $this->oDb->query("ALTER TABLE `sys_agents_agents` ADD `icon` text NOT NULL AFTER `description`");
    if (!$this->oDb->isFieldExists('sys_agents_agents', 'form_object'))
        $this->oDb->query("ALTER TABLE `sys_agents_agents` ADD `form_object` varchar(128) NOT NULL AFTER `webhook_sample`");
    if (!$this->oDb->isFieldExists('sys_agents_agents', 'form_input'))
        $this->oDb->query("ALTER TABLE `sys_agents_agents` ADD `form_input` varchar(128) NOT NULL AFTER `form_object`");

    $this->oDb->query("ALTER TABLE `sys_agents_agents` MODIFY COLUMN `trigger` enum('alert','scheduler','webhook','manual','agent','message','form-input') NOT NULL DEFAULT 'message'");

    if (!$this->oDb->isIndexExists('sys_agents_agents', 'name'))
        $this->oDb->query("ALTER TABLE `sys_agents_agents` ADD UNIQUE KEY `name` (`name`)");

    return true;
