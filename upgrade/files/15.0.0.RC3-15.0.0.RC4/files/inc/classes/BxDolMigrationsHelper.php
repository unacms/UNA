<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Shorthands for PHP migrations, for what the update packs did in their installer.php and
 * config.php. Database only: a migration never changes files, those come with git.
 *
 * - addColumn(), addIndex(): add one only when it is missing (MySQL 5.7 has no
 *   `ADD COLUMN IF NOT EXISTS`), so the migration is safe to run twice.
 * - moduleUpdated(): the module's version (and `note` from its config.php) as the update pack
 *   would have left it.
 *
 * Every method throws on an error, which fails the migration.
 */
class BxDolMigrationsHelper
{
    protected static ?BxDolMigrationsQuery $_oQuery = null;

    /**
     * @param string $sDefinition as in install SQL, e.g. "tinyint(4) NOT NULL DEFAULT '0' AFTER `data`"
     * @return bool whether the column was added
     */
    public static function addColumn(string $sTable, string $sColumn, string $sDefinition): bool
    {
        $oQuery = self::_getQuery();
        return $oQuery->withExceptions(function () use ($oQuery, $sTable, $sColumn, $sDefinition) {
            if ($oQuery->isColumn($sTable, $sColumn))
                return false;

            $oQuery->addColumn($sTable, $sColumn, $sDefinition);
            return true;
        });
    }

    /**
     * @param string|list<string> $mixedColumns
     * @return bool whether the index was added
     */
    public static function addIndex(string $sTable, string $sIndex, $mixedColumns): bool
    {
        $oQuery = self::_getQuery();
        $aColumns = (array)$mixedColumns;
        return $oQuery->withExceptions(function () use ($oQuery, $sTable, $sIndex, $aColumns) {
            if ($oQuery->isIndex($sTable, $sIndex))
                return false;

            $oQuery->addIndex($sTable, $sIndex, $aColumns);
            return true;
        });
    }

    /**
     * Set a module's version, like a finished update pack: only while it still has $sFrom, so a
     * site that has $sTo (or something newer) is left alone. The module's `note` follows its
     * install/config.php, as in the update pack.
     *
     * @param string $sUri module uri (`sys_modules`.`uri`, `module_uri` in the pack's config.php), `system` for the system module
     * @return bool whether the version was changed
     */
    public static function moduleUpdated(string $sUri, string $sFrom, string $sTo): bool
    {
        $oQuery = self::_getQuery();
        return $oQuery->withExceptions(function () use ($oQuery, $sUri, $sFrom, $sTo) {
            if (($aModule = $oQuery->getModuleByUri($sUri)) === null)
                return false;

            $bResult = $oQuery->setModuleVersion($sUri, self::getVersionVariants($sFrom), $sTo);

            $aConfig = BxDolInstallerUtils::getModuleConfig($aModule);
            if (isset($aConfig['note']) && is_string($aConfig['note']))
                $oQuery->setModuleNote($sUri, $aConfig['note']);

            return $bResult;
        });
    }

    /**
     * The ways a version is written in `sys_modules`: UNA used both 15.0.0.RC3 and 15.0.0-RC3.
     *
     * @return list<string>
     */
    public static function getVersionVariants(string $sVersion): array
    {
        $sDots = preg_replace('/-(?=[A-Za-z])/', '.', $sVersion);
        $sDash = preg_replace('/\.(?=[A-Za-z])/', '-', $sVersion);
        return array_values(array_unique([$sVersion, $sDots, $sDash]));
    }

    protected static function _getQuery(): BxDolMigrationsQuery
    {
        if (self::$_oQuery === null)
            self::$_oQuery = new BxDolMigrationsQuery();

        return self::$_oQuery;
    }
}

/** @} */
