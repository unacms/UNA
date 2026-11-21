<?php defined('BX_DOL') or die('hack attempt');
/*
 * UNA-Migration-Min-System-Version: 15.0.0-RC4
 * Account settings: a new email waits in `email_pending` until it is confirmed, the account keeps its current
 * email meanwhile. Form fields with privacy get a default group (`privacy_default`, '' is everybody).
 */

BxDolMigrationsHelper::addColumn('sys_accounts', 'email_pending', "varchar(255) NOT NULL DEFAULT '' AFTER `email_confirmed`");
BxDolMigrationsHelper::addColumn('sys_form_inputs', 'privacy_default', "varchar(16) NOT NULL DEFAULT '' AFTER `privacy`");
