<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Database queries for embed objects.
 * @see BxDolEmbed
 */
class BxDolEmbedQuery extends BxDolFactoryObjectQuery
{
    protected $_sTableData;

    static public function getObject($sObject)
    {
        return parent::getObjectFromTable($sObject, 'sys_objects_embeds', true);
    }

    static public function getObjects ()
    {
        return parent::getObjectsFromTable('sys_objects_embeds');
    }

    public function setParams($aParams)
    {
        $this->_sTableData = $aParams['table_data'] ?? '';
    }

    public function getLocal ($sUrl, $sTheme)
    {
        return $this->getOne("SELECT `data` FROM `" . $this->_sTableData . "` WHERE `url` = :url AND  `theme` = :theme", [
            'url' => $sUrl, 
            'theme' => $sTheme
        ]);
    }

    public function getLocalInfo ($sUrl, $sTheme)
    {
        return $this->getRow("SELECT * FROM `" . $this->_sTableData . "` WHERE `url` = :url AND  `theme` = :theme", [
            'url' => $sUrl, 
            'theme' => $sTheme
        ]);
    }

    public function getLocalInfoById ($iId)
    {
        return $this->getRow("SELECT * FROM `" . $this->_sTableData . "` WHERE `id` = :id", [
            'id' => $iId
        ]);
    }

    public function getLocalUnprocessed ()
    {
        return $this->getAll("SELECT * FROM `" . $this->_sTableData . "` WHERE `data` = ''");
    }

    public function getLocalExpired ($iBefore, $iLimit = 500)
    {
        return $this->getAll("SELECT * FROM `" . $this->_sTableData . "` WHERE `added` IS NOT NULL AND `added` < :before ORDER BY `id` ASC LIMIT " . max(1, (int)$iLimit), [
            'before' => (int)$iBefore
        ]);
    }

    public function insertLocal ($sUrl, $sTheme, $sData = '')
    {
        return (int)$this->query("INSERT INTO `" . $this->_sTableData . "` (`url`, `theme`, `data`, `added`) VALUES (:url, :theme, :data, :added)", [
            'url' => $sUrl,
            'theme' => $sTheme,
            'data' => $sData,
            'added' => time(),
        ]) > 0 ? $this->lastId() : false;
    }

    /**
     * Take a named lock, waiting up to a number of seconds. MySQL releases it when the connection closes,
     * so a request that dies can't keep it.
     * @return bool the lock is held
     */
    public function lockFetch ($sName, $iTimeout)
    {
        return (int)$this->getOne("SELECT GET_LOCK(:name, :timeout)", ['name' => $sName, 'timeout' => (int)$iTimeout]) === 1;
    }

    public function unlockFetch ($sName)
    {
        return (int)$this->getOne("SELECT RELEASE_LOCK(:name)", ['name' => $sName]) === 1;
    }

    public function updateLocal($aParamsSet, $aParamsWhere)
    {
        if(empty($aParamsSet) || empty($aParamsWhere))
            return false;

        return $this->query("UPDATE `{$this->_sTableData}` SET " . $this->arrayToSQL($aParamsSet) . " WHERE " . $this->arrayToSQL($aParamsWhere, " AND "));
    }
    
    public function deleteLocal($aParamsWhere)
    {
        if(empty($aParamsWhere))
            return false;

        return $this->query("DELETE FROM `{$this->_sTableData}` WHERE " . $this->arrayToSQL($aParamsWhere, " AND "));
    }
}

/** @} */
