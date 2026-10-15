<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * MariaDB vector store on the site database from header.inc.php.
 *
 * The embeddings table is created on first use. Install SQL cannot create it:
 * MariaDB before 11.7 and MySQL before 9 reject the VECTOR type, and MySQL 9
 * uses different vector functions than this store.
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

class BxDolAIVectorStoreMariaDb
{
    public const MARIADB_MIN_VERSION = '11.7.0';

    protected static ?PDO $oPdo = null;

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

    public static function tableName(int $iId): string
    {
        if ($iId < 1)
            throw new Exception('MariaDB vector store id is missing');

        return 'sys_agents_vs_' . $iId;
    }

    public static function open(int $iId, int $iTopK, int $iDimensions): NeuronAI\RAG\VectorStore\MariaDBVectorStore
    {
        if ($iDimensions < 1 || $iDimensions > 16383)
            throw new Exception('MariaDB vector store dimension must be between 1 and 16383');
        if ($iTopK < 1)
            $iTopK = 4;

        $sTable = self::tableName($iId);
        $oPdo = self::connect();
        $sVersion = $oPdo->query('SELECT VERSION()');
        $sVersion = $sVersion ? (string)$sVersion->fetchColumn() : '';
        $aServer = self::describe($sVersion);
        if (empty($aServer['supported'])) {
            $sMessage = self::compatibilityMessage($aServer);
            bx_log('sys_agents', $sMessage, BX_LOG_ERR);
            throw new Exception($sMessage);
        }

        $iExisting = self::embeddingDimensions($oPdo, $sTable);
        if ($iExisting === null) {
            $oPdo->exec('SET default_storage_engine = InnoDB');
            (new NeuronAI\RAG\VectorStore\MariaDBVectorStore($oPdo, $sTable, $iTopK))->setupTable($iDimensions);
        }
        elseif ($iExisting !== $iDimensions)
            throw new Exception('MariaDB vector store ' . $sTable . ' has dimension ' . $iExisting . '; params ask for ' . $iDimensions);

        return new NeuronAI\RAG\VectorStore\MariaDBVectorStore($oPdo, $sTable, $iTopK);
    }

    public static function connect(): PDO
    {
        if (self::$oPdo instanceof PDO)
            return self::$oPdo;

        $sHost = self::credential('BX_DATABASE_HOST');
        $sUser = self::credential('BX_DATABASE_USER');
        $sPassword = self::credential('BX_DATABASE_PASS');
        $sName = self::credential('BX_DATABASE_NAME');
        if ($sHost === '' || $sName === '')
            throw new Exception('Database credentials are not configured');

        $sPort = defined('BX_DATABASE_PORT') ? self::credential('BX_DATABASE_PORT') : '';
        $sSocket = defined('BX_DATABASE_SOCK') ? self::credential('BX_DATABASE_SOCK') : '';
        $sCollate = defined('BX_DATABASE_COLLATE') ? self::credential('BX_DATABASE_COLLATE') : 'utf8mb4_unicode_ci';
        if (!preg_match('/^[A-Za-z0-9_]+$/', $sCollate))
            $sCollate = 'utf8mb4_unicode_ci';

        $sDsn = 'mysql:host=' . $sHost . ';';
        $sDsn .= $sPort !== '' ? 'port=' . $sPort . ';' : '';
        $sDsn .= $sSocket !== '' ? 'unix_socket=' . $sSocket . ';' : '';
        $sDsn .= 'dbname=' . $sName . ';charset=utf8mb4';

        try {
            $oPdo = new PDO($sDsn, $sUser, $sPassword, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_PERSISTENT => false,
            ]);
            $oPdo->exec("SET NAMES 'utf8mb4' COLLATE '" . $sCollate . "'");
            $oPdo->exec("SET sql_mode = ''");
        }
        catch (PDOException $oException) {
            bx_log('sys_agents', 'MariaDB vector store connection failed: ' . $oException->getMessage(), BX_LOG_ERR);
            throw new Exception('MariaDB vector store could not connect to the site database');
        }

        self::$oPdo = $oPdo;
        return self::$oPdo;
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

    protected static function credential(string $sConstant): string
    {
        if (!defined($sConstant))
            throw new Exception('Database credentials are not configured');

        $mValue = constant($sConstant);
        if (is_array($mValue))
            $mValue = reset($mValue);

        return (string)$mValue;
    }

    protected static function embeddingDimensions(PDO $oPdo, string $sTable): ?int
    {
        $oStatement = $oPdo->prepare(
            'SELECT COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?'
        );
        $oStatement->execute([$sTable, 'embedding']);
        $sType = $oStatement->fetchColumn();
        if (!is_string($sType) || !preg_match('/vector\((\d+)\)/i', $sType, $aMatch))
            return null;

        return (int)$aMatch[1];
    }
}

/** @} */
