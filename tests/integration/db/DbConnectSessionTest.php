<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * BxDolDb::connect sets the session up in one statement: utf8mb4 with the site's collation,
 * an empty sql_mode and the site's storage engine, without asking the server for its version.
 */
#[Group('integration')]
class DbConnectSessionTest extends BxDolIntegrationTestCase
{
    /**
     * Statement counters of the current server session.
     */
    protected function counters(BxDolDb $oDb): array
    {
        $a = [];
        foreach ($oDb->getAll("SHOW SESSION STATUS WHERE `Variable_name` IN ('Com_set_option', 'Com_select')") as $r)
            $a[$r['Variable_name']] = (int)$r['Value'];
        return $a;
    }

    /**
     * Connects again and returns what connect() itself sent: counter deltas when the server session
     * is reused (persistent connections), the new session's counters otherwise.
     */
    protected function reconnect(BxDolDb $oDb): array
    {
        $iIdBefore = (int)$oDb->getOne("SELECT CONNECTION_ID()");
        $aBefore = $this->counters($oDb);

        $oDb->disconnect();
        $oDb->connect();

        // Read the counters before any other query: the id check below runs a SELECT of its own.
        $aAfter = $this->counters($oDb);
        $bSameSession = (int)$oDb->getOne("SELECT CONNECTION_ID()") === $iIdBefore;

        $aSent = [];
        foreach ($aAfter as $k => $v)
            $aSent[$k] = $bSameSession ? $v - $aBefore[$k] : $v;
        return $aSent;
    }

    public function testConnectSetsTheSession(): void
    {
        $oDb = BxDolDb::getInstance();
        $this->reconnect($oDb);

        $sEngine = (new ReflectionProperty(BxDolDb::class, '_sStorageEngine'))->getValue($oDb);
        $aState = $oDb->getRow("SELECT @@character_set_client AS `client`, @@character_set_connection AS `conn`, @@character_set_results AS `results`, @@collation_connection AS `coll`, @@sql_mode AS `mode`, @@default_storage_engine AS `engine`");

        $this->assertSame(['utf8mb4', 'utf8mb4', 'utf8mb4'], [$aState['client'], $aState['conn'], $aState['results']]);
        $this->assertSame(defined('BX_DATABASE_COLLATE') ? BX_DATABASE_COLLATE : 'utf8mb4_unicode_ci', $aState['coll']);
        $this->assertSame('', $aState['mode']);
        $this->assertSame(strtoupper($sEngine), strtoupper($aState['engine']));
    }

    public function testConnectSendsOneSetAndNoSelect(): void
    {
        $oDb = BxDolDb::getInstance();
        $sEngine = (new ReflectionProperty(BxDolDb::class, '_sStorageEngine'))->getValue($oDb);

        $aSent = $this->reconnect($oDb);

        // InnoDB adds SET TRANSACTION, which applies to the next transaction only, so it stays apart.
        $this->assertSame(0 == strcasecmp($sEngine, 'INNODB') ? 2 : 1, $aSent['Com_set_option'], 'One SET for the session.');
        $this->assertSame(0, $aSent['Com_select'], 'No SELECT VERSION().');
    }
}
