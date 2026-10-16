<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * MariaDB vector store on the site database connection.
 * Embeddings of width 1024 and 384 live in separate tables, created in install SQL.
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

class BxDolAIVectorStoreMariaDb
{
    public const MARIADB_MIN_VERSION = '11.7.0';
    public const DIMENSIONS = [1024, 384];

    /**
     * @return array{engine:string, version:string, supported:bool}
     */
    public static function describe(string $sVersion): array
    {
        $sVersion = trim($sVersion);
        if ($sVersion === '')
            return ['engine' => '', 'version' => '', 'supported' => false];

        $bMaria = stripos($sVersion, 'mariadb') !== false;
        $sEngine = $bMaria ? 'mariadb' : 'mysql';
        $sNumber = self::versionNumber($sVersion, $bMaria);
        $bSupported = $bMaria && $sNumber !== '' && self::atLeast($sNumber, self::MARIADB_MIN_VERSION);

        return [
            'engine' => $sEngine,
            'version' => $sNumber,
            'supported' => $bSupported,
        ];
    }

    public static function compatibilityMessage(array $aServer): string
    {
        if (($aServer['engine'] ?? '') === 'mariadb')
            $sEngine = 'MariaDB';
        elseif (($aServer['engine'] ?? '') === 'mysql')
            $sEngine = 'MySQL';
        else
            $sEngine = 'unknown';

        $sVersion = (string)($aServer['version'] ?? '');
        if ($sVersion === '')
            $sVersion = 'unknown';

        return 'MariaDB vector store needs MariaDB ' . self::MARIADB_MIN_VERSION . ' or newer (connected: ' . $sEngine . ' ' . $sVersion . ')';
    }

    public static function tableName(string $sTable): string
    {
        if (!preg_match('/^[A-Za-z0-9_]+$/', $sTable))
            throw new Exception('MariaDB vector store table name is invalid');

        return $sTable;
    }

    public static function tableForDimension(int $iDimension): string
    {
        if (!in_array($iDimension, self::DIMENSIONS, true))
            throw new Exception('MariaDB vector store expects embedding width 1024 or 384, got ' . $iDimension);

        return self::tableName('sys_agents_vector_mariadb_' . $iDimension);
    }

    public static function pdo(): PDO
    {
        BxDolDb::getInstance();
        $oPdo = BxDolDb::getLink();
        if (!$oPdo instanceof PDO)
            throw new Exception('Database is not connected');

        return $oPdo;
    }

    public static function open(int $iStoreId, int $iTopK): BxDolAIVectorStoreMariaDbStore
    {
        if ($iStoreId < 1)
            throw new Exception('MariaDB vector store id is missing');
        if ($iTopK < 1)
            $iTopK = 4;

        $oDb = BxDolDb::getInstance();
        $sVersion = $oDb ? (string)$oDb->getOne('SELECT VERSION()') : '';
        $aServer = self::describe($sVersion);
        if (empty($aServer['supported'])) {
            $sMessage = self::compatibilityMessage($aServer);
            bx_log('sys_agents', $sMessage, BX_LOG_ERR);
            throw new Exception($sMessage);
        }

        foreach (self::DIMENSIONS as $iDimension)
            self::assertTable($iDimension);

        return new BxDolAIVectorStoreMariaDbStore(self::pdo(), $iTopK, (string)$iStoreId);
    }

    protected static function versionNumber(string $sVersion, bool $bMaria): string
    {
        if ($bMaria && preg_match('/(\d+\.\d+(?:\.\d+)?)-MariaDB/i', $sVersion, $aMatch))
            return $aMatch[1];
        if (preg_match('/(\d+\.\d+(?:\.\d+)?)/', $sVersion, $aMatch))
            return $aMatch[1];

        return '';
    }

    protected static function atLeast(string $sVersion, string $sMinimum): bool
    {
        return version_compare(self::normalizeVersion($sVersion), self::normalizeVersion($sMinimum), '>=');
    }

    protected static function normalizeVersion(string $sVersion): string
    {
        $aParts = explode('.', $sVersion);
        $aParts = array_slice(array_pad($aParts, 3, '0'), 0, 3);
        return implode('.', $aParts);
    }

    protected static function assertTable(int $iDimension): void
    {
        $sTable = self::tableForDimension($iDimension);
        $iExisting = self::embeddingDimensions($sTable);
        if ($iExisting === null)
            throw new Exception('MariaDB vector store table ' . $sTable . ' is missing');
        if ($iExisting !== $iDimension)
            throw new Exception('MariaDB vector store ' . $sTable . ' must use dimension ' . $iDimension);
    }

    protected static function embeddingDimensions(string $sTable): ?int
    {
        $oDb = BxDolDb::getInstance();
        if (!$oDb)
            return null;

        $sType = $oDb->getOne(
            'SELECT `COLUMN_TYPE` FROM `information_schema`.`COLUMNS` WHERE `TABLE_SCHEMA` = DATABASE() AND `TABLE_NAME` = ? AND `COLUMN_NAME` = ?',
            [$sTable, 'embedding']
        );
        if (!is_string($sType) || !preg_match('/vector\((\d+)\)/i', $sType, $aMatch))
            return null;

        return (int)$aMatch[1];
    }
}

/** @} */
