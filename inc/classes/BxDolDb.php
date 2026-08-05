<?php defined('BX_DOL') or defined('BX_DOL_INSTALL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

define('BX_DB_MODE_SILENT', PDO::ERRMODE_SILENT);
define('BX_DB_MODE_EXCEPTION', PDO::ERRMODE_EXCEPTION);

define('BX_DB_ERR_CONNECT_FAILD', 1);
define('BX_DB_ERR_QUERY_ERROR', 2);
define('BX_DB_ERR_ESCAPE', 3);

define('BX_PDO_STATE_NOT_EXECUTED', NULL);
define('BX_PDO_STATE_SUCCESS', '00000');

class BxDolDb extends BxDolFactory implements iBxDolSingleton
{	
    protected static $_rLink;
    protected static $_iQueriesCounter = 0;
    protected static $_aDbCacheData = [];

    protected static $_aParams;
    protected static $_sParamsCacheName = 'sys_options';
    protected static $_sParamsCacheNameMixed = 'sys_options_mixed_';
    protected static $_sParamsCacheNameMix = 'sys_options_mix_';

    protected static $_sErrorKey = 'bx_db_error';
    protected static $_aErrors = array(
    	BX_DB_ERR_CONNECT_FAILD => 'Database connect failed',
    	BX_DB_ERR_QUERY_ERROR => 'Database query error',
    	BX_DB_ERR_ESCAPE => 'Escape string error'
    );

    protected static $_bReadOnlyMode = true;
    protected static $_bMultuServersMode = false;

	protected $_bPdoPersistent;
	protected $_iPdoFetchType;
	protected $_iPdoErrorMode;

	protected $_bErrorChecking;
    protected $_aError;

	protected $_sHost, $_sPort, $_sSocket, $_sDbname, $_sUser, $_sPassword, $_sCharset, $_sStorageEngine;

    protected $_oStatement = null;
    protected $_oDbCacheObject = null;

    /**
     * set database parameters and connect to it
     */
    protected function __construct($aDbConf = false)
    {
        if (isset($GLOBALS['bxDolClasses'][get_class($this)]))
            trigger_error ('Multiple instances are not allowed for the class: ' . get_class($this), E_USER_ERROR);

        parent::__construct();

		$this->_bPdoPersistent = true;
        if (defined('BX_DATABASE_PERSISTENT'))
            $this->_bPdoPersistent = (bool)BX_DATABASE_PERSISTENT;

        $this->_iPdoFetchType = PDO::FETCH_ASSOC;
        $this->_iPdoErrorMode = BX_DB_MODE_EXCEPTION;

        $this->_bErrorChecking = true;
        $this->_aError = array();

        $this->_sStorageEngine = 'MYISAM';
        if (defined('BX_DATABASE_ENGINE'))
            $this->_sStorageEngine = BX_DATABASE_ENGINE;

        $this->_sCharset = 'utf8mb4';
        if($aDbConf === false) {
            $this->_sHost = BX_DATABASE_HOST;
            $this->_sPort = BX_DATABASE_PORT;
            $this->_sSocket = BX_DATABASE_SOCK;
            $this->_sDbname = BX_DATABASE_NAME;
            $this->_sUser = BX_DATABASE_USER;
            $this->_sPassword = BX_DATABASE_PASS;
        } 
        else {
            $this->_sHost = $aDbConf['host'];
            $this->_sPort = $aDbConf['port'];
            $this->_sSocket = $aDbConf['sock'];
            $this->_sDbname = $aDbConf['name'];
            $this->_sUser = $aDbConf['user'];
            $this->_sPassword = $aDbConf['pwd'];
            if(isset($aDbConf['charset']))
            	$this->_sCharset = $aDbConf['charset'];
            if(isset($aDbConf['error_checking']))
                $this->_bErrorChecking = $aDbConf['error_checking'];
            if(isset($aDbConf['storage_engine']))
            	$this->_sStorageEngine = $aDbConf['storage_engine'];
        }

        @set_exception_handler(array($this, 'pdoExceptionHandler'));
    }

    /**
     * Prevent cloning the instance
     */
    public function __clone()
    {
        if (isset($GLOBALS['bxDolClasses'][get_class($this)]))
            trigger_error('Clone is not allowed for the class: ' . get_class($this), E_USER_ERROR);
    }

    /**
     * Get singleton instance of the class
     */
    public static function getInstance()
    {
        $null = null;
        return self::getInstanceWithConf(false, $null);
    }
    
    public static function getInstanceWithConf($aDbConf, &$sError)
    {
        if(!isset($GLOBALS['bxDolClasses'][__CLASS__])) {
            if($aDbConf === false && !defined('BX_DATABASE_HOST'))
                return null;

            $o = new BxDolDb($aDbConf);
            $sErrorMessage = $o->connect();
            if($sErrorMessage) {
                if($sError !== null)
                    $sError = $sErrorMessage;

                return null;
            }

			$GLOBALS['bxDolClasses'][__CLASS__] = $o;
        }

        return $GLOBALS['bxDolClasses'][__CLASS__];
    }

    public static function getLink()
    {
    	return self::$_rLink;
    }

    public static function getQueriesCounter()
    {
    	return self::$_iQueriesCounter;
    }

    public function setReadOnlyMode($b)
    {
        if ($b == self::$_bReadOnlyMode)
            return;
        self::$_bReadOnlyMode = $b;
        if (self::$_bMultuServersMode) {
            $this->disconnect();
            $this->connect();
        }
    }

    protected function balancer()
    {
        self::$_bMultuServersMode = false;

        // regular mode - one DB server
        if (!is_array($this->_sHost))
            return array($this->_sHost, $this->_sPort, $this->_sSocket, $this->_sUser, $this->_sPassword, $this->_sDbname);

        $iServersNum = count($this->_sHost);
        if ($iServersNum > 1)
            self::$_bMultuServersMode = true;

        // in read/write mode always use first server, which should be always master (also check for regular mode but with array with 1 item)        
        if (!self::$_bReadOnlyMode || 1 == $iServersNum)
            $i = 0;
        // in case of 2 servers - always use second server, in read only mode
        elseif (2 == $iServersNum)
            $i = 1;
        // when there are more that 2 servers, randomly select read only server
        else
            $i = rand(1, $iServersNum-1);
            
        return array($this->_sHost[$i], $this->_sPort[$i], $this->_sSocket[$i], $this->_sUser[$i], $this->_sPassword[$i], $this->_sDbname[$i]);
    }

    /**
     * connect to database with appointed parameters
     */
    public function connect()
    {
    	if(self::$_rLink)
    		return;

        list ($sHost, $sPort, $sSocket, $sUser, $sPassword, $sDBName) = $this->balancer();

    	try {   
	    	$sDsn = "mysql:host=" . $sHost . ";";
	   		$sDsn .= $sPort ? "port=" . $sPort . ";" : "";
	   		$sDsn .= $sSocket ? "unix_socket=" . $sSocket . ";" : "";
	    	$sDsn .= "dbname=" . $sDBName . ";charset=" . $this->_sCharset;

	        self::$_rLink = new PDO($sDsn, $sUser, $sPassword, array(
				PDO::ATTR_ERRMODE => $this->_iPdoErrorMode,
				PDO::ATTR_DEFAULT_FETCH_MODE => $this->_iPdoFetchType,
				PDO::ATTR_PERSISTENT => $this->_bPdoPersistent
	        ));

            $this->pdoExec("SET NAMES 'utf8mb4' COLLATE '" . (defined('BX_DATABASE_COLLATE') ? BX_DATABASE_COLLATE : 'utf8mb4_unicode_ci') . "'");
            $this->pdoExec("SET sql_mode = ''");
            if (0 == strcasecmp($this->_sStorageEngine, 'INNODB'))
                $this->pdoExec("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE");

            $sVer = $this->getVersion();
            $sStorageEngine = !$sVer || version_compare($sVer, '5.7.5', '>=') ? 'default_storage_engine' : 'storage_engine';
            $this->pdoExec("SET $sStorageEngine=" . $this->_sStorageEngine);

			$this->cleanMemoryAll();
    	}
    	catch (PDOException $oException) {
    		$oException->errorInfo[self::$_sErrorKey] = array(
    			'code' => BX_DB_ERR_CONNECT_FAILD,
    			'message' => $oException->getMessage(),
    			'trace' => $oException->getTrace()
    		);

    		throw $oException;
    	}
    }

    /**
     * close mysql connection
     */
    public function disconnect()
    {
        self::$_rLink = null;
    }

    /**
     * check mysql connection
     */
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

    /**
     * Can be used to execute queries which shouldn't return data
     */
    public function pdoExec($sQuery)
    {
    	return self::$_rLink->exec($sQuery);
    }

    /**
     * Executes query and returns PDOStatement object or false 
     */
	public function pdoQuery($sQuery)
    {
    	return self::$_rLink->query($sQuery);
    }

    /**
     * database query exception handler for exceptions appeared out of the try/catch block
     */
    public function pdoExceptionHandler($oException)
    {
        if(!($oException instanceof PDOException)) {
            throw $oException;
            return;
        }

		if(!isset($oException->errorInfo[self::$_sErrorKey]))
			$oException->errorInfo[self::$_sErrorKey] = array(
				'code' => BX_DB_ERR_QUERY_ERROR,
				'message' => !empty($oException->errorInfo[2]) ? $oException->errorInfo[2] : $oException->getMessage(),
				'trace' => $oException->getTrace()
			);

    	$this->error($oException->errorInfo[self::$_sErrorKey]);

        exit(255);
    }

    /**
     * get mysql option
     */
    function getOption($sName)
    {
    	$oStatement = $this->pdoQuery("SELECT @@{$sName}");
    	return $this->getOne($oStatement);
    }

    /**
     * execute sql query and return one value result
     */
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

    /**
     * execute sql query and return one row result
     */
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

    /**
     * execute sql query and return a column as result
     */
    function getColumn($oStatement, $aBindings = array(), $iFetchColumnNumber = 0)
    {
    	$aResult = array();
        if(!$oStatement)
            return $aResult;
		else if(!($oStatement instanceof PDOStatement) && is_string($oStatement))
			$oStatement = $this->prepare($oStatement);

        if(!$this->res($oStatement, $aBindings))
        	return array();

		$aResult = $oStatement->fetchAll(PDO::FETCH_COLUMN, $iFetchColumnNumber);
		if($aResult === false)
        	return array();

        return $aResult;
    }

	/**
     * execute sql query and return the first row of result
     * and keep $array type and poiter to all data
     */
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

    /**
     * return next row of pointed last getFirstRow calling data
     */
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

	/**
     * execute sql query and return table of records as result
     */
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

    /**
     * Executes sql query and returns table of records as result.
     * 
     * @deprecated use getAll instead.
     */
    public function fillArray($oStatement, $aBindings = array(), $iFetchType = PDO::FETCH_ASSOC)
    {
    	return $this->getAll($oStatement, $aBindings, $iFetchType);
    }

	/**
     * execute sql query and return table of records as result
     */
    public function getAllWithKey($oStatement, $sFieldKey, $aBindings = array(), $iFetchType = PDO::FETCH_ASSOC)
    {
    	$aResult = array();
        if(!$oStatement)
            return $aResult;
		else if(!($oStatement instanceof PDOStatement) && is_string($oStatement))
			$oStatement = $this->prepare($oStatement);

        $aRow = $this->getFirstRow($oStatement, $aBindings, $iFetchType);
        while(!empty($aRow)) {
        	$aResult[$aRow[$sFieldKey]] = $aRow;

        	$aRow = $this->getNextRow($iFetchType);
        }

        return $aResult;
    }

    /**
     * execute sql query and return table of records as result
     */
    public function getPairs($oStatement, $sFieldKey, $sFieldValue, $aBindings = [], $iFetchType = PDO::FETCH_ASSOC)
    {
    	$aResult = [];
        if(!$oStatement)
            return $aResult;
        else if(!($oStatement instanceof PDOStatement) && is_string($oStatement))
            $oStatement = $this->prepare($oStatement);

        $aRow = $this->getFirstRow($oStatement, $aBindings, $iFetchType);
        while(!empty($aRow)) {
            $aResult[$aRow[$sFieldKey] ?? ''] = $aRow[$sFieldValue];

            $aRow = $this->getNextRow($iFetchType);
        }

        return $aResult;
    }

    /**
     * return number of affected rows in current mysql result
     * 
     * NOTE: PDOStatement::rowCount works for SELECT queries in MySQL.
     * So, this method should be rewritten if the other DB engine will be used.
     */
    public function getNumRows($oStatement = null)
    {
    	if($oStatement && ($oStatement instanceof PDOStatement))
    		return $oStatement->rowCount();

    	if($this->_oStatement && ($this->_oStatement instanceof PDOStatement))
    		return $this->_oStatement->rowCount();

    	return 0;
    }

    /**
     * returns the number of rows affected by the last DELETE, INSERT, or UPDATE statement. 
     */
    public function getAffectedRows($oStatement = null)
    {
        return $this->getNumRows($oStatement);
    }

    public function lastId()
    {
        return self::$_rLink->lastInsertId();
    }

    /**
     * execute any query return number of rows affected/false
     */
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

    /**
     * execute any query
     */
    public function res($oStatement, $aBindings = array(), $bVerbose = null)
    {
		if(!$oStatement || !($oStatement instanceof PDOStatement))
            return false;

		if($oStatement->errorCode() == BX_PDO_STATE_SUCCESS)
			return true;

        if(isset($GLOBALS['bx_profiler']))
        	$GLOBALS['bx_profiler']->beginQuery($oStatement->queryString);

        for ($iAttempts = 3; $iAttempts > 0; --$iAttempts) {

            $oException = null;
            $iErrorCode = 0;
            $bResult = false;
            try {
                $bResult = $this->executeStatement($oStatement, $aBindings, $bVerbose, $iErrorCode);
            } catch (PDOException $oException) {
                $iErrorCode = $oException->errorInfo[1];
            }

            // if deadlock timeout - try again, make sure that deadlock timeout is short
            if (!$bResult && (1205 == $iErrorCode || 1213 == $iErrorCode)) {
                continue;
            }

	    	// if mysql connection is lost - reconnect and try again
            if(!$bResult && (2006 == $iErrorCode || !$this->ping())) {
                $this->disconnect();
                $this->connect();
                continue;
            }

            // in all other cases exit from the loop
            if ($oException)
                throw $oException;
            break;
        }

        if(isset($GLOBALS['bx_profiler']))
        	$GLOBALS['bx_profiler']->endQuery($oStatement);

        ++self::$_iQueriesCounter;

		//is needed for SILENT mode
		if(!$bResult && !empty($this->_aError))
			$this->error($this->_aError);

        return $bResult;
    }

    /**
     * get mysql server info
     */
    public function getServerInfo()
    {
    	return self::$_rLink->getAttribute(PDO::ATTR_SERVER_VERSION);
    }

    /**
     * get mysql version
     */
    public function getVersion()
    {
        $s = $this->getOne("SELECT VERSION()");
        return preg_match("/([0-9\.]+)/", $s, $m) ? $m[1] : false;
    }
    
    /**
     * get list of tables in database
     */
    public function listTables()
    {
        $sDBName = is_array($this->_sDbname) ? $this->_sDbname[0] : $this->_sDbname;
    	$oStatement = $this->pdoQuery("SHOW TABLES FROM `" . $sDBName . "`");

        return $this->getColumn($oStatement);
    }

    public function getFields($sTable)
    {
    	$oStatement = $this->pdoQuery("SHOW COLUMNS FROM `" . $sTable . "`");
    	$aFields = $this->getAll($oStatement);

        $aResult = array('original' => array(), 'uppercase' => array());
        foreach($aFields as $aField) {
            $aResult['original'][] = $aField['Field'];
            $aResult['uppercase'][] = strtoupper($aField['Field']);
        }

        return $aResult;
    }

    public function fetchField($oStatement, $iField, $aBindings = array())
    {
        $aResult = array();
        if(!$oStatement)
            return $aResult;

        else if(!($oStatement instanceof PDOStatement) && is_string($oStatement)) {
            $oStatement = $this->prepare($oStatement);
            if(!$this->res($oStatement, $aBindings))
                return $aResult;
        }

        return $oStatement->getColumnMeta($iField);
    }

    public function isTableExists($sTable)
    {
        $aTableNames = $this->listTables();
        foreach($aTableNames as $iKey => $sTableName)
            $aTableNames[$iKey] = strtoupper($sTableName);

        return in_array(strtoupper($sTable), $aTableNames);
    }

    public function isFieldExists($sTable, $sFieldName)
    {
        $aFields = $this->getFields($sTable);
        return in_array(strtoupper($sFieldName), $aFields['uppercase']);
    }

	public function isIndexExists($sTable, $sIndexName)
	{
		$bIndex = false;

        $aIndexes = $this->getAll("SHOW INDEXES FROM `" . $sTable . "`");
        foreach($aIndexes as $aIndex)
			if($aIndex['Key_name'] == $sIndexName) {
				$bIndex = true;
				break;
			}

		return $bIndex;
	}

    public function error($aError)
    {
    	$sErrorType = self::$_aErrors[$aError['code']];

    	$bVerbose = isset($aError['verbose']) ? (bool)$aError['verbose'] : $this->_bErrorChecking;
        if(!$bVerbose) {
            $this->log($sErrorType . ': ' . $aError['message']);
            if (!defined('BX_DOL_INSTALL')) // this is needed to display error during installation
    			return;
        }

        if((defined('BX_DB_FULL_VISUAL_PROCESSING') && BX_DB_FULL_VISUAL_PROCESSING) || defined('BX_DOL_INSTALL')) {
            $sOutput = '<div style="border:2px solid red;padding:4px;width:600px;margin:0px auto;">'."\n";
            $sOutput .= '<div style="text-align:center;background-color:red;color:white;font-weight:bold;">Error</div>'."\n";
            $sOutput .= '<div style="text-align:center;">' . $sErrorType . '</div>'."\n";
            if((defined('BX_DB_FULL_DEBUG_MODE') && BX_DB_FULL_DEBUG_MODE) || defined('BX_DOL_INSTALL'))
				$sOutput .= $this->errorOutput($aError);
            $sOutput .= '</div>';
        } 

        if (self::$_rLink) { // connection errors aren't logged since bx_log required DB connection
            bx_log('sys_db', "$sErrorType\n" . 
                (empty($aError['message']) ? '' : "  Error: {$aError['message']}\n") . 
                (empty($aError['query']) ? '' : "  Query: {$aError['query']}\n") . 
                (!function_exists('getLoggedId') || !getLoggedId() ? '' : "  Account ID: " . getLoggedId() . "\n"),
                BX_LOG_ERR
            );
        }

        if(defined('BX_DB_DO_EMAIL_ERROR_REPORT') && BX_DB_DO_EMAIL_ERROR_REPORT) {
            $sSiteTitle = $this->getParam('site_title');

            $sMailBody = "Database error in " . $sSiteTitle . "<br /><br /> \n";
            $sMailBody .= $this->errorOutput($aError);
            $sMailBody .= "<hr />Auto-report system";

            sendMail($this->getParam('site_email'), "Database error in " . $sSiteTitle, $sMailBody, 0, array(), BX_EMAIL_SYSTEM, 'html', true);
        }

        bx_show_service_unavailable_error_and_exit($sOutput);
    }

    public function isParamInCache($sKey)
    {
        return is_array(self::$_aParams) && isset(self::$_aParams[$sKey]);
    }

    public function cacheParams($bForceCacheInvalidate = false, $bForceCacheInvalidateMixed = false)
    {
        if ($bForceCacheInvalidate)
            $this->cacheParamsClear();

        self::$_aParams = $this->getPairs("SELECT `name`, `value` FROM `sys_options`", "name", "value");

        list($sTmplCode, $sTmplName) = BxDolTemplate::retrieveCode();
        if(!empty($sTmplCode) && !empty($sTmplName)) {
            $iTmplMix = 0;
            if(is_array($sTmplCode))
                list($sTmplCode, $iTmplMix) = $sTmplCode;

            $bMixesDiabled = ($GLOBALS['glMixesDisabled'] ?? false);
            if(empty($iTmplMix) && !$bMixesDiabled)
                $iTmplMix = (int)$this->getParam($sTmplName . '_default_mix');

            if(!empty($iTmplMix) && !$bMixesDiabled) {
                $sCacheNameMixed = self::$_sParamsCacheNameMixed . $sTmplCode .  '_' . $iTmplMix;
                if($bForceCacheInvalidateMixed)
                    $this->cacheParamsClear($sCacheNameMixed);

                $aMixed = $this->fromCache($sCacheNameMixed, 'getPairs', "SELECT `option`, `value` FROM `sys_options_mixes2options` WHERE `mix_id`=:mix_id", "option", "value", array(
                    'mix_id' => $iTmplMix
                ));

                if(!empty($aMixed) && is_array($aMixed))
                    self::$_aParams = array_merge(self::$_aParams, $aMixed);
            }
        }

        if (empty(self::$_aParams)) {
            self::$_aParams = array();

            return false;
        }

        return true;
    }

    public function cacheParamsClear($sCacheName = '')
    {
        if(empty($sCacheName)) {
            self::$_aParams = [];
            $sCacheName = self::$_sParamsCacheName;
        }

        return $this->cleanCache($sCacheName);
    }

    public function isParam($sKey, $bFromCache = true)
    {
        if ($bFromCache && $this->isParamInCache($sKey))
           return true;

        $sQuery = $this->prepare("SELECT `name` FROM `sys_options` WHERE `name` = ? LIMIT 1", $sKey);
        return $this->getOne($sQuery) == $sKey;
    }

    public function addParam($sName, $sValue, $iKateg, $sDesc, $sType)
    {
        $sQuery = $this->prepare("INSERT INTO `sys_options` SET `category_id` = ?, `name` = ?, `caption` = ?, `value` = ?, `type` = ?", $iKateg, $sName, $sDesc, $sValue, $sType);
        $this->query($sQuery);

        // renew params cache
        $this->cacheParams(true);
    }

    public function getParam($sKey, $bFromCache = true)
    {
        if (!$sKey)
            return false;

        if ($bFromCache) {
            return $this->isParamInCache($sKey) ? self::$_aParams[$sKey] : false;
        } else {
            $sQuery = $this->prepare("SELECT `tmo`.`value` AS `value` FROM `sys_options_mixes2options` AS `tmo` INNER JOIN `sys_options_mixes` AS `tm` ON `tmo`.`mix_id`=`tm`.`id` AND `tm`.`active`='1' WHERE `tmo`.`option`=? LIMIT 1", $sKey);
            $s = $this->getOne($sQuery);
            if($s === false) {
                $sQuery = $this->prepare("SELECT `value` FROM `sys_options` WHERE `name` = ? LIMIT 1", $sKey);            
                $s = $this->getOne($sQuery);
            }
            self::$_aParams[$sKey] = $s; // cache it
            return $s;
        }
    }

    public function setParam($sKey, $mixedValue, $iMixId = 0)
    {
    	if(empty($iMixId))
            $sQuery = $this->prepare("UPDATE `sys_options` SET `value` = ? WHERE `name` = ? LIMIT 1", $mixedValue, $sKey);
        else
            $sQuery = $this->prepare("REPLACE INTO `sys_options_mixes2options` SET `option` = ?, `mix_id` = ?, `value` = ?", $sKey, $iMixId, $mixedValue);

        $bResult = (int)$this->query($sQuery) > 0;

        // renew params cache
        self::$_aParams[$sKey] = $mixedValue;

        return $bResult;
    }

    public function getParamsMix($iId)
    {
        return $this->fromCache(self::$_sParamsCacheNameMix . $iId, 'getRow', 'SELECT * FROM `sys_options_mixes` WHERE `id`=:id', array(
            'id' => $iId
        ));
    }

    public function getParamsMixActive($sType)
    {
        return $this->getRow("SELECT * FROM `sys_options_mixes` WHERE `type`=:type AND `active`='1'", array(
            'type' => $sType
        ));
    }

    public function getParamsMixes($sType, $mixedPublished = false)
    {
        $aBindings = array('type' => $sType);

        $sQuery = "SELECT * FROM `sys_options_mixes` WHERE `type`=:type";
        if($mixedPublished !== false) {
            $aBindings['published'] = (int)$mixedPublished;

            $sQuery .= " AND `published`=:published";
        }

        return $this->getAll($sQuery, $aBindings);
    }

    public function setTimezone($sTimezone)
    {
        $oDate = new DateTime('now', new DateTimeZone($sTimezone));
        return $this->pdoExec('SET time_zone = "' . $oDate->format('P') . '"') !== false;
    }

    public function getEncoding()
    {
    	$oStatement = $this->pdoQuery('SELECT @@character_set_database');
    	if($oStatement !== false)
    		return $this->getOne($oStatement);

    	return false;
    }

    public function setErrorChecking ($b)
    {
        $this->_bErrorChecking = $b;
    }

    /**
     * Cache functions.
     */
    public function getDbCacheObject ()
    {
        if($this->_oDbCacheObject != null)
			return $this->_oDbCacheObject;

		$sEngine = $this->getParam('sys_db_cache_engine');
		$this->_oDbCacheObject = bx_instance('BxDolCache'.$sEngine);
		if(!$this->_oDbCacheObject->isAvailable())
			$this->_oDbCacheObject = bx_instance('BxDolCacheFile');

		return $this->_oDbCacheObject;
    }

    public function genDbCacheKey ($sName)
    {
        return 'db_' . $sName . '_' . bx_site_hash() . '.php';
    }

    public function getCache ($sName, $sFunc)
    {
        if (!$this->getParam('sys_db_cache_enable'))
            return false;
        
        $oCache = $this->getDbCacheObject ();
        $sKey = $this->genDbCacheKey($sName);
        return $oCache->getData($sKey);
    }
    
    public function setCache ($sName, $mData)
    {
        if (!$this->getParam('sys_db_cache_enable'))
            return false;
        
        $oCache = $this->getDbCacheObject ();
        $sKey = $this->genDbCacheKey($sName);
        $oCache->setData($sKey, $mData);
    }
    
    public function fromCache ($sName, $sFunc)
    {
        $aArgs = func_get_args();
        array_shift ($aArgs); // shift $sName
        array_shift ($aArgs); // shift $sFunc

        if (!$this->getParam('sys_db_cache_enable'))
            return call_user_func_array (array ($this, $sFunc), $aArgs); // pass other function parameters as database function parameters

        $oCache = $this->getDbCacheObject ();

        $sKey = $this->genDbCacheKey($sName);

        $mixedRet = $oCache->getData($sKey);

        if ($mixedRet !== null) {

            return $mixedRet;

        } else {

            $mixedRet = call_user_func_array (array ($this, $sFunc), $aArgs); // pass other function parameters as database function parameters

            $oCache->setData($sKey, $mixedRet);
        }

        return $mixedRet;
    }

    public function cleanCache ($sName)
    {
        $oCache = $this->getDbCacheObject();

        $sKey = $this->genDbCacheKey($sName);

        return $oCache->delData($sKey);
    }

    public function &fromMemory ($sName, $sFunc)
    {
        if(array_key_exists($sName, self::$_aDbCacheData) && !defined('BX_DOL_INSTALL') && !defined('BX_DOL_CRON_EXECUTE'))
			return self::$_aDbCacheData[$sName];

		$aArgs = func_get_args();
		array_shift($aArgs); // shift $sName
		array_shift($aArgs); // shift $sFunc
		self::$_aDbCacheData[$sName] = call_user_func_array (array ($this, $sFunc), $aArgs); // pass other function parameters as database function parameters

		return self::$_aDbCacheData[$sName];
    }

    public function cleanMemory ($sName)
    {
        if(!isset(self::$_aDbCacheData[$sName])) 
        	return false;

		unset(self::$_aDbCacheData[$sName]);
		return true;
    }

    public function cleanMemoryAll ()
    {
        self::$_aDbCacheData = array();
		return true;
    }

    /**
     * It escapes string to pass to mysql query.
     * Try to use "prepare" function always (@see BxDolDb::prepare), use "escape" only if "prepare" function is not possible at all.
     * Also consider using "implode_escape" function (@see BxDolDb::implode_escape).
     *
     * @param  string  $s string to escape
     * @return escaped string whcich is ready to pass to SQL query.
     */
    public function escape($s)
    {
    	try {
    		$s = self::$_rLink->quote($s);
    	}
    	catch (PDOException $oException) {
    		$oException->errorInfo[self::$_sErrorKey] = array(
    			'code' => BX_DB_ERR_ESCAPE,
    			'message' => $oException->getMessage(),
    			'trace' => $oException->getTrace()
    		);

    		throw $oException;
    	}

        return $s;
    }

    public function isValidFieldName($s)
    {
        if (false !== strpos($s, '`.`')) {
            $a = explode('`.`', $s, 2);
            foreach ($a as $sField) {
                if (false === $this->isValidFieldName($sField))
                    return false;
            }
            return true;
        }

        $inner = $s;

        // Disallow trailing space
        if ($inner === '' || preg_match('/\s$/u', $inner)) {
            return false;
        }

        // Disallow all-numeric content (even if quoted)
        if (preg_match('/^\d+$/u', $inner)) {
            return false;
        }

        $i = 0;
        $len = mb_strlen($inner, 'UTF-8');

        while ($i < $len) {
            $char = mb_substr($inner, $i, 1, 'UTF-8');

            // Allow escaped backtick (``)
            if ($char === '`') {
                if ($i + 1 >= $len || mb_substr($inner, $i + 1, 1, 'UTF-8') !== '`') {
                    return false; // Single backtick is invalid
                }
                $i += 2;
                continue;
            }

            // Convert to UTF-8 bytes to check for supplementary chars
            $utf8 = mb_convert_encoding($char, 'UTF-8');
            $byteLen = strlen($utf8);

            // 1-byte to 3-byte UTF-8 sequences = BMP (valid)
            // 4-byte UTF-8 sequences = Supplementary chars (invalid)
            if ($byteLen === 4) {
                return false;
            }

            // Disallow ASCII NUL (0x00)
            if ($utf8 === "\x00") {
                return false;
            }

            $i++;
        }

        return true;
/*
        // alternative quick checking without checking BMP range
        if (preg_match('/^[0-9]+$/', $s))
            return false;

        return preg_match('/^(?:(?!`)[\x01-\x7F\x{0080}-\x{FFFF}]|``)*[^[:space:]]$/u', $s);
*/
    }

    /**
     * This function is usefull when you need to form array of parameters to pass to IN(...) SQL construction.
     * Example:
     * @code
     * $a = array(2, 4.5, 'apple', 'car');
     * $s = "SELECT * FROM `t` WHERE `a` IN (" . $oDb->implode_escape($a) . ")";
     * echo $s; // outputs: SELECT * FROM `t` WHERE `a` IN (2, 4.5, 'apple', 'car')
     * @endcode
     *
     * @param $mixed array or parameters or just one paramter
     * @return string which is ready to pass to IN(...) SQL construction
     */
    public function implode_escape ($mixed)
    {
        if (is_array($mixed)) {
            $s = '';
            foreach ($mixed as $v)
                $s .= (is_numeric($v) ? $v : $this->escape($v)) . ',';
            if ($s)
                return substr($s, 0, -1);
            else
                return 'NULL';
        }

        return is_numeric($mixed) ? $mixed : ($mixed ? $this->escape($mixed) : 'NULL');
    }

    /**
     * @deprecated
     */
    public function unescape ($mixed)
    {
        if(is_array($mixed)) {
            foreach($mixed as $k => $v)
				$mixed[$k] = $this->getOne("SELECT '$v'");

            return $mixed;
        } 
        else
            return $this->getOne("SELECT '$mixed'");
    }

    /**
     * Prepare SQL query before execution if some arguments are need to be passed to it.
     * All parameters marked with question (?) symbol in SQL query are replaced with parameters passed after SQL query parameter.
     * Parameters are properly excaped and surrounded by qutes if needed.
     * Example:
     * @code
     * $sSql = $oDb->prepare("SELECT `a`, `b` from `t` WHERE `c` = ? and `d` = ?", 12, 'aa');
     * echo $sSql;// outputs: SELECT `a`, `b` from `t` WHERE `c` = 12 and `d` = 'aa'
     * $a = $oDb->getAll($sSql);
     * @endcode
     *
     * @param  string $sQuery SQL query, parameters for replacing are marked with ? symbol
     * @param  mixed  $mixed  any number if parameters to replace, number of parameters whould match number of ? symbols in SQL query
     * @return PDOStatement object with SQL query ready for execution
     */
    public function prepare($sQuery)
    {
    	if(!self::$_rLink)
    		return false;

        if (self::$_bMultuServersMode && (0 != strncasecmp(ltrim($sQuery, " \t\n\r(\0\x0B"), 'SELECT', 6)))
            $this->setReadOnlyMode(false);

        $aArgs = func_get_args();
        $sQuery = array_shift($aArgs);

        $oStatement = self::$_rLink->prepare($sQuery);

        $iIndex = 1;
        foreach($aArgs as $mixedArg) {
        	if(is_null($mixedArg))
				$iValueType = PDO::PARAM_NULL;
            else if(is_numeric($mixedArg) && is_int($mixedArg))
                $iValueType = PDO::PARAM_INT;
            else
                $iValueType = PDO::PARAM_STR;

        	$oStatement->bindValue($iIndex++, $mixedArg, $iValueType);
        }

        return $oStatement;
    }

    /**
     * Prepare SQL query before execution if some arguments are need to be passed to it.
     * All parameters marked with question (?) symbol in SQL query are replaced with parameters passed after SQL query parameter.
     * Parameters are properly excaped and surrounded by qutes if needed.
     * Example:
     * @code
     * $sSql = $oDb->prepare("SELECT `a`, `b` from `t` WHERE `c` = ? and `d` = ?", 12, 'aa');
     * echo $sSql;// outputs: SELECT `a`, `b` from `t` WHERE `c` = 12 and `d` = 'aa'
     * $a = $oDb->getAll($sSql);
     * @endcode
     *
     * @param  string $sQuery SQL query, parameters for replacing are marked with ? symbol
     * @param  mixed  $mixed  any number if parameters to replace, number of parameters whould match number of ? symbols in SQL query
     * @return string with SQL query. 
     */
    function prepareAsString($sQuery)
    {
        $aArgs = func_get_args();
        $sQuery = array_shift($aArgs);

        $iPos = 0;
        foreach ($aArgs as $mixedArg) {
            if (is_null($mixedArg))
                $s = 'NULL';
            elseif (is_numeric($mixedArg))
                $s = $mixedArg;
            else
                $s = $this->escape($mixedArg);

            $i = bx_mb_strpos($sQuery, '?', $iPos);
            $sQuery = bx_mb_substr_replace($sQuery, $s, $i, 1);
            $iPos = $i + get_mb_len($s);
        }

        return $sQuery;
    }

    /**
     * Convert array of key => values to SQL query.
     * Array keys are field names and array values are field values.
     * @param $a array
     * @param $sDiv fields separator, by default it is ',', another useful value is ' AND '
     * @param $sOperator operator for comparision: '=' or 'LIKE'
     * @param $bWildcardSpaceChars substiture any space and dash characters with single wildcard symbol
     * @return part of SQL query string
     */
    public function arrayToSQL($a, $sDiv = ',', $sOperator = '=', $bWildcardSpaceChars = false)
    {
        $aOperators = ['=', 'LIKE', 'like'];
        $sOperator = in_array($sOperator, $aOperators) ? $sOperator : '=';
        $s = '';
        foreach($a as $k => $v) {
            if (!$this->isValidFieldName($k))
                throw new Exception('Invalid field name in arrayToSQL method');
            if ($bWildcardSpaceChars)
                $v = preg_replace('/[\p{Zs}\p{Cc}\p{Pd}]/', '_', $v);
            $s .= "`{$k}` {$sOperator} " . (is_null($v) ? 'NULL' : $this->escape($v)) . $sDiv;
        }
        return trim($s, $sDiv);
    }

    protected function log($s)
    {
        if (defined('BX_DIRECTORY_PATH_LOGS')) {
            $sPath = BX_DIRECTORY_PATH_LOGS;
        }
        else {
            $sDirName = pathinfo(__FILE__, PATHINFO_DIRNAME);
            $sPath = $sDirName . '/../../logs/';
        }
        return file_put_contents($sPath . 'db.err.log', date('Y-m-d H:i:s') . "\t" . $s . "\n", FILE_APPEND);
    }

    public function executeSQL($sPath, $aReplace = array (), $isBreakOnError = true)
    {
        if(!file_exists($sPath) || !($rHandler = fopen($sPath, "r")))
            return array(array ('query' => "fopen($sPath, 'r')", 'error' => 'file not found or permission denied'));

		self::$_rLink->setAttribute(PDO::ATTR_ERRMODE, BX_DB_MODE_SILENT);

        $sQuery = "";
        $sDelimiter = ';';
        $aResult = array();
        while(!feof($rHandler)) {
            $sStr = trim(fgets($rHandler));

            if(empty($sStr) || $sStr[0] == "" || $sStr[0] == "#" || ($sStr[0] == "-" && $sStr[1] == "-"))
                continue;

            //--- Change delimiter ---//
            if(strpos($sStr, "DELIMITER //") !== false || strpos($sStr, "DELIMITER ;") !== false) {
                $sDelimiter = trim(str_replace('DELIMITER', '', $sStr));
                continue;
            }

            $sQuery .= $sStr;

            //--- Check for multiline query ---//
            if(substr($sStr, -strlen($sDelimiter)) != $sDelimiter)
                continue;

            //--- Execute query ---//
            if ($aReplace)
                $sQuery = str_replace($aReplace['from'], $aReplace['to'], $sQuery);
            if($sDelimiter != ';')
                $sQuery = str_replace($sDelimiter, "", $sQuery);

            if($this->query(trim($sQuery), array(), false) === false) {
                $aResult[] = array('query' => $sQuery, 'error' => $this->_aError['message']);
                if ($isBreakOnError)
                    break;
            }

            $sQuery = "";
        }
        fclose($rHandler);

        self::$_rLink->setAttribute(PDO::ATTR_ERRMODE, $this->_iPdoErrorMode);

        return empty($aResult) ? true : $aResult;
    }

    protected function executeStatement($oStatement, $aBindings = array(), $bVerbose = null, &$iErrorCode = null)
    {
        $bResult = false;

        if (!isset($aBindings[0])) {
    		foreach($aBindings as $sKey => $mixedValue) {
	    		if(is_null($mixedValue))
		    		$oStatement->bindValue(":{$sKey}", $mixedValue, PDO::PARAM_NULL);
                else if(is_numeric($mixedValue) && is_int($mixedValue))
                    $oStatement->bindValue(":{$sKey}", $mixedValue, PDO::PARAM_INT);
                else
                    $oStatement->bindValue(":{$sKey}", $mixedValue, PDO::PARAM_STR);
            }
            $aBindings = array();
        }

    	switch (self::$_rLink->getAttribute(PDO::ATTR_ERRMODE)) {
    		case PDO::ERRMODE_SILENT:
    			$bResult = $this->executeStatementSilent($oStatement, $aBindings, $bVerbose);
    			break;

    		case PDO::ERRMODE_EXCEPTION:
    			$bResult = $this->executeStatementException($oStatement, $aBindings, $bVerbose);
    			break;
    	}

        if (!$bResult && !is_null($iErrorCode)) {
            $aError = $oStatement->errorInfo();
            $iErrorCode = $aError[1];
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

    protected function errorOutput($aError)
    {
        $aErrorLocation = [];

        if(!empty($aError['query']) && !empty($aError['trace']))
            foreach($aError['trace'] as $aCall )
                if(isset($aCall['args']) && is_array($aCall['args']))
                    foreach($aCall['args'] as $argNum => $argVal)
                        if((is_string($argVal) && strcmp($argVal, $aError['query']) == 0) || ($argVal instanceof PDOStatement && strcmp($argVal->queryString, $aError['query']) == 0)) {
                            $aErrorLocation['file'] = isset($aCall['file']) ? $aCall['file'] : (isset($aCall['class']) ? 'class: ' . $aCall['class'] : 'undefined');
                            $aErrorLocation['line'] = isset($aCall['line']) ? $aCall['line'] : 'undefined';
                            $aErrorLocation['function'] = $aCall['function'];
                            $aErrorLocation['arg'] = $argNum;
                        }

        $sOutput = '';
        if(!empty($aError['query']))
            $sOutput .= '<p><b>Query:</b><br />' . bx_process_output($aError['query']) . '</p>'."\n";

        if(!empty($aError['message']))
            $sOutput .= '<p><b>Mysql error:</b><br />' . $aError['message'] . '</p>'."\n";

        if(!empty($aErrorLocation))
            $sOutput .= '<p><b>Location:</b><br />The error was found in <b>' . $aErrorLocation['function'] . '</b> function in the file <b>' . $aErrorLocation['file'] . '</b> at line <b>' . $aErrorLocation['line'] . '</b>.</p>'."\n";

        $sOutput .= '<p><b>collation_connection:</b><br />' . $this->getOne("SELECT @@collation_connection") . '</p>'."\n";

        if(!empty($aError['trace'])) {
            $sBackTrace = print_r($aError['trace'], true);
            if(defined ('BX_DATABASE_USER') && !is_array(BX_DATABASE_USER))
                $sBackTrace = str_replace('[_sUser:protected] => ' . BX_DATABASE_USER, '[_sUser:protected] => *****', $sBackTrace);
            if(defined ('BX_DATABASE_PASS') && !is_array(BX_DATABASE_PASS))
                $sBackTrace = str_replace('[_sPassword:protected] => ' . BX_DATABASE_PASS, '[_sPassword:protected] => *****', $sBackTrace);

            $sOutput .= '<div><b>Debug backtrace:</b></div><div style="overflow:scroll;height:300px;border:1px solid gray;"><pre>' . htmlspecialchars_adv($sBackTrace) . '</pre></div>';
        }

        if(!empty(self::$_aParams)) {
            $aParams = self::$_aParams;
            $aParamsSecret = $this->getColumn("SELECT `name` FROM `sys_options` WHERE `type`='secret'", "name");
            if($aParamsSecret && is_array($aParamsSecret))
                array_walk($aParams, function(&$sValue, $sKey) use ($aParamsSecret) {
                    if(in_array($sKey, $aParamsSecret))
                        $sValue = bx_gen_secret($sValue);
                });

            $sOutput .= '<div><b>Settings:</b></div><div style="overflow:scroll;height:300px;border:1px solid gray;"><pre>' . htmlspecialchars_adv(var_export($aParams, true)) . '</pre></div>';
        }

        $sOutput .= '<p><b>Called script:</b><br />' . htmlspecialchars_adv($_SERVER['PHP_SELF']) . '</p>';

        if(!empty($_REQUEST))
            $sOutput .= '<p><b>Request parameters:</b><br /><pre>' . htmlspecialchars_adv(var_export($_REQUEST, true)) . '</pre></p>';

        return $sOutput;
    }
}

/**
 * Create the very first instance and initiate connetion to database.
 */
BxDolDb::getInstance();

function getParam($sParamName, $bUseCache = true)
{
    if (bx_is_api() && $sParamName == 'permalinks_seo_links')
        return true;
    
    $oObj = BxDolDb::getInstance();
    if ($oObj === null)
        return false;
       
     return $oObj->getParam($sParamName, $bUseCache);
}

function setParam($sParamName, $sParamVal)
{
    $oObj = BxDolDb::getInstance();
    if ($oObj === null)
        return false;
    
    return $oObj->setParam($sParamName, $sParamVal);
}

/** @} */
