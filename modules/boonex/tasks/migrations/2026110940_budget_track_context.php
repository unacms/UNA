<?php defined('BX_DOL') or die('hack attempt');
/*
 * UNA-Migration-Min-System-Version: 15.0.0-RC4
 *
 * Tasks: a context's budget entries are read by their context, the newest first (the site's Budget
 * table, API v2's GET /task-contexts/{id}/budget/entries), as install.sql has it. An index only:
 * nothing reads or writes differently. In PHP, since MySQL has no ADD INDEX IF NOT EXISTS.
 */

BxDolMigrationsHelper::addIndex('bx_tasks_budget_track', 'context_id', ['context_id', 'id']);
