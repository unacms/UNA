<?php

    // The database changes of this release are its migrations: migrations/ and modules/system/migrations/,
    // which the files of this update brought. They run here whatever the site's update channel, each once,
    // and are recorded in sys_migrations. Modules' migrations run with the modules' own update packs.

    if (!method_exists('BxDolMigrations', 'forUpdate'))
        return 'This update was started by a process that had the previous version of BxDolMigrations loaded. Run the update again.';

    $aResult = BxDolMigrations::getInstance()->forUpdate()->run();

    if ($aResult['problems'])
        return 'Migrations did not run: ' . implode('; ', $aResult['problems']);
    if ($aResult['failed'] !== '')
        return 'Migration ' . $aResult['failed'] . ' failed: ' . $aResult['error'];
    if ($aResult['refresh_error'] !== '')
        return 'Migrations ran, but ' . $aResult['refresh_error'] . ' failed';

    // The version moves only now: a site whose migrations failed stays on the previous version, so the update
    // can be run again and module update packs (which need the new version) wait until it has gone through.
    BxDolDb::getInstance()->query("UPDATE `sys_modules` SET `version` = '15.0.0-RC5' WHERE (`version` = '15.0.0.RC4' OR `version` = '15.0.0-RC4') AND `name` = 'system'");

    return true;
