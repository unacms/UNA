<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    SocialEngineMigration SocialEngine Migration
 * @ingroup     UnaModules
 *
 * @{
 */

/** 
 * BxSEDb Class duplicate for connecting with Social Engine database
 * It allows to create two connections for different databases
 */	
class BxSEDb {
	static $_rLink;
    static $_aDbCacheData;
    static $_sErrorKey = 'bx_db_error';	
    static $_aErrors = array(
    	BX_DB_ERR_CONNECT_FAILD => 'Database connect failed',
    	BX_DB_ERR_QUERY_ERROR => 'Database query error',
    	BX_DB_ERR_ESCAPE => 'Escape string error'
    );

	var $_bPdoPersistent;
	var $_iPdoFetchType;
	var $_iPdoErrorMode;

	var $_bErrorChecking;
    var $_aError;

	var $_sHost, $_sPort, $_sSocket, $_sDbname, $_sUser, $_sPassword, $_sCharset, $_sStorageEngine;

    var $_oStatement = null;
    var $_oDbCacheObject = null;
	
	public function __construct($aDbConf = false)
    {

        $this->_iPdoFetchType = PDO::FETCH_ASSOC;
        $this->_iPdoErrorMode = BX_DB_MODE_EXCEPTION;

        $this->_bErrorChecking = true;
        $this->_aError = array();

        $this->_sStorageEngine = 'MYISAM';
				
		$this->_sHost = $aDbConf['host'];
        $this->_sPort = $aDbConf['port'];
        $this->_sSocket = $aDbConf['sock'];
        $this->_sDbname = $aDbConf['name'];
        $this->_sUser = $aDbConf['user'];
        $this->_sPassword = $aDbConf['pwd'];
        if(isset($aDbConf['charset']))
        	$this->_sCharset = $aDbConf['charset'];

       @set_exception_handler(array($this, 'pdoExceptionHandler'));
    }
	
	public function connect()
    {
    	if(self::$_rLink)
    		return true;

    	try {
	    	$sDsn = "mysql:host=" . $this->_sHost . ";";
	   		$sDsn .= $this->_sPort ? "port=" . $this->_sPort . ";" : "";
	   		$sDsn .= $this->_sSocket ? "unix_socket=" . $this->_sSocket . ";" : "";
	    	$sDsn .= "dbname=" . $this->_sDbname . ";charset=" . $this->_sCharset;

	        self::$_rLink = new PDO($sDsn, $this->_sUser, $this->_sPassword, array(
				PDO::ATTR_ERRMODE => $this->_iPdoErrorMode,
				PDO::ATTR_DEFAULT_FETCH_MODE => $this->_iPdoFetchType,
				PDO::ATTR_PERSISTENT => $this->_bPdoPersistent
	        ));

	    	$this->pdoExec("SET NAMES 'utf8'");
	        $this->pdoExec("SET sql_mode = ''");
			$this->pdoExec("SET storage_engine=" . $this->_sStorageEngine);

			self::$_aDbCacheData = array();
    	}
    	catch (PDOException $oException) {
    		$oException->errorInfo[self::$_sErrorKey] = array(
    			'code' => BX_DB_ERR_CONNECT_FAILD,
    			'message' => $oException->getMessage(),
    			'trace' => $oException->getTrace()
    		);

    		throw $oException;
    	}
		
		return true;
    }
	
	public function res($oStatement, $aBindings = array(), $bVerbose = null)
    {
		if(!$oStatement || !($oStatement instanceof PDOStatement))
            return false;

		if($oStatement->errorCode() == BX_PDO_STATE_SUCCESS)
			return true;

		$bResult = $this->executeStatement($oStatement, $aBindings, $bVerbose);

		//if mysql connection is lost - reconnect and try again
        if(!$bResult && !$this->ping()) {
            $this->disconnect();
            $this->connect();

            $bResult = $this->executeStatement($oStatement, $aBindings, $bVerbose);
        }

        if(isset($GLOBALS['bx_profiler']))
        	$GLOBALS['bx_profiler']->endQuery($bResult);

		//is needed for SILENT mode
		if(!$bResult && !empty($this->_aError))
			$this->error($this->_aError);

        return $bResult;
    }
	
	public function ping()
    {
    	try {
    		$this->pdoQuery("SELECT 1");
    	}
    	catch (PDOException $e) {
    		return false;
    	}

    	return true;
    }
	
	public function pdoQuery($sQuery)
    {
    	return self::$_rLink->query($sQuery);
    }
	
	public function pdoExec($sQuery)
    {
    	return self::$_rLink->exec($sQuery);
    }
	
	 public function getOne($oStatement, $aBindings = array(), $iIndex = 0)
    {
        if(!$oStatement)
			return false;
		else if(!($oStatement instanceof PDOStatement) && is_string($oStatement))
			$oStatement = $this->prepare($oStatement);

		$aResult = array();
		if($this->res($oStatement, $aBindings))
            $aResult = $oStatement->fetch(PDO::FETCH_NUM);

        return is_array($aResult) && count($aResult) ? $aResult[$iIndex] : false;
    }
	
	public function prepare($sQuery)
    {
    	if(!self::$_rLink)
    		return false;

        $aArgs = func_get_args();
        $sQuery = array_shift($aArgs);

        $oStatement = self::$_rLink->prepare($sQuery);

        $iIndex = 1;
        foreach($aArgs as $mixedArg) {
        	if(is_null($mixedArg))
				$iValueType = PDO::PARAM_NULL;
            else if(is_numeric($mixedArg))
                $iValueType = PDO::PARAM_INT;
            else
                $iValueType = PDO::PARAM_STR;

        	$oStatement->bindValue($iIndex++, $mixedArg, $iValueType);
        }

        return $oStatement;
    }
	
	protected function executeStatement($oStatement, $aBindings = array(), $bVerbose = null)
    {
    	$bResult = false;

    	switch (self::$_rLink->getAttribute(PDO::ATTR_ERRMODE)) {
    		case PDO::ERRMODE_SILENT:
    			$bResult = $this->executeStatementSilent($oStatement, $aBindings, $bVerbose);
    			break;

    		case PDO::ERRMODE_EXCEPTION:
    			$bResult = $this->executeStatementException($oStatement, $aBindings, $bVerbose);
    			break;
    	}

    	return $bResult;
    }

    protected function executeStatementException($oStatement, $aBindings = array(), $bVerbose = null)
    {
    	$bResult = false;

    	try {
			$bResult = $oStatement->execute(!empty($aBindings) && is_array($aBindings) ? $aBindings : null);
		}
		catch (PDOException $oException) {
			$aError = $oStatement->errorInfo();

			$oException->errorInfo[self::$_sErrorKey] = array(
				'code' => BX_DB_ERR_QUERY_ERROR,
				'message' => !empty($aError[2]) ? $aError[2] : $oException->getMessage(),
				'query' => $oStatement->queryString,
				'trace' => $oException->getTrace(),
				'verbose' => $bVerbose
			);

			throw $oException;
		}

		return $bResult;
    }

    protected function executeStatementSilent($oStatement, $aBindings = array(), $bVerbose = null)
    {
    	$bResult = $oStatement->execute(!empty($aBindings) && is_array($aBindings) ? $aBindings : null);
    	if($bResult)
    		return true;

		$aError = $oStatement->errorInfo();

        $aTrace = debug_backtrace();
        unset($aTrace[0]);

		$this->_aError = array(
			'code' => BX_DB_ERR_QUERY_ERROR,
			'message' => !empty($aError[2]) ? $aError[2] : '',
			'query' => $oStatement->queryString,
			'trace' => $aTrace,
			'verbose' => $bVerbose
		);

		return false;
    }
	
	function getRow($oStatement, $aBindings = array(), $iFetchType = PDO::FETCH_ASSOC)
    {
    	$aResult = array();
        if(!$oStatement)
            return $aResult;
		else if(!($oStatement instanceof PDOStatement) && is_string($oStatement))
			$oStatement = $this->prepare($oStatement);

        if(!in_array($iFetchType, array(PDO::FETCH_NUM, PDO::FETCH_ASSOC, PDO::FETCH_BOTH)))
            $iFetchType = $this->_iPdoFetchType;

        if(!$this->res($oStatement, $aBindings))
        	return array();

		$aResult = $oStatement->fetch($iFetchType);
		if($aResult === false)
        	return array();

        return $aResult;
    }
	
	public function query($oStatement, $aBindings = array(), $bVerbose = null)
    {
    	if(!$oStatement)
            return false;
		else if(!($oStatement instanceof PDOStatement) && is_string($oStatement))
			$oStatement = $this->prepare($oStatement);

        if($this->res($oStatement, $aBindings, $bVerbose))
            return $oStatement->rowCount();

        return false;
    }
	
	public function getAll($oStatement, $aBindings = array(), $iFetchType = PDO::FETCH_ASSOC)
    {
    	$aResult = array();
        if(!$oStatement)
            return $aResult;
		else if(!($oStatement instanceof PDOStatement) && is_string($oStatement))
			$oStatement = $this->prepare($oStatement);

        if(!in_array($iFetchType, array(PDO::FETCH_NUM, PDO::FETCH_ASSOC, PDO::FETCH_BOTH)))
            $iFetchType = $this->_iPdoFetchType;

        if(!$this->res($oStatement, $aBindings))
        	return array();

		$aResult = $oStatement->fetchAll($iFetchType);
		if($aResult === false)
        	return array();

        return $aResult;
    }

    public function getPairs($oStatement, $sFieldKey, $sFieldValue, $aBindings = array())
    {
    	$aResult = array();
        if(!$oStatement)
            return $aResult;
		else if(!($oStatement instanceof PDOStatement) && is_string($oStatement))
			$oStatement = $this->prepare($oStatement);

        $aRow = $this->getFirstRow($oStatement, $aBindings, PDO::FETCH_ASSOC);
        while(!empty($aRow)) {
        	$aResult[$aRow[$sFieldKey]] = $aRow[$sFieldValue];

        	$aRow = $this->getNextRow(PDO::FETCH_ASSOC);
        }

        return $aResult;
    }
	
	public function getFirstRow($oStatement, $aBindings = array(), $iFetchType = PDO::FETCH_ASSOC)
    {
        if(!$oStatement)
            return array();
		else if(!($oStatement instanceof PDOStatement) && is_string($oStatement))
			$oStatement = $this->prepare($oStatement);

        if(!in_array($iFetchType, array(PDO::FETCH_NUM, PDO::FETCH_ASSOC, PDO::FETCH_BOTH)))
            $iFetchType = $this->_iPdoFetchType;

        if(!$this->res($oStatement, $aBindings)) 
        	return array();

        $aResult = $oStatement->fetch($iFetchType);
        if($aResult === false)
        	return array();

		$this->_oStatement = $oStatement;
        return $aResult;
    }

    public function getNextRow($iFetchType = PDO::FETCH_ASSOC)
    {
    	if(!$this->_oStatement)
            return array();

		if(!in_array($iFetchType, array(PDO::FETCH_NUM, PDO::FETCH_ASSOC, PDO::FETCH_BOTH)))
            $iFetchType = $this->_iPdoFetchType;

		$aResult = $this->_oStatement->fetch($iFetchType);
		if($aResult !== false)
			return $aResult;

		$this->_oStatement = null;
    	return array();
    }
		
	public function isTableExists($sTable){
		$sQuery = $this -> prepare("SHOW TABLES LIKE ?", $sTable);
		$aResult = $this -> getRow($sQuery);
		return !empty($aResult);
   }

   public function getSEParam($sTable, $sName){
		if (!$this -> isTableExists($sTable)) return '';
		
		$sQuery = $this -> prepare("SELECT `value` FROM `{$sTable}` WHERE `name` = ?", $sName);
		return $this -> getOne($sQuery);
   }

}

/** @} */
