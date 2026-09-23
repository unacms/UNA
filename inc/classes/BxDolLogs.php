<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * This class unifies the usage of logs.
 *
 * Add record to sys_objects_logs table, like you are doing this for Comments or Voting objects:
 * - object: your logs object name, usually it is in the following format - vendor prefix, underscore, module prefix;
 * - module: module name
 * - logs_storage: logs storage, supported storages: 
 *      - `Auto`: log to the storage currently configured in settings
 *      - `Folder`: files in `logs` folder
 *      - `PHPLog`: php log
 *      - `STDErr`: standard error output, usually written to web server error log
 * - title: translatable title
 * - active: 0 or 1
 * - class_name: user defined class name which is derived from BxDolLogs.
 * - class_file: the location of the user defined class, leave it empty if class is located in system folders.
 * 
 * It's also possible to not add record to sys_objects_logs table, 
 * then it will use default settings for logging.
 *
 * @section example Example of usage
 *
 * Log data to the logs object
 *
 * @code
 *  if ($o = BxDolLogs::getObjectInstance('my_module_logs_object'))
 *      $o->add($s);
 * @endcode
 *
 * or
 *
 * @code
 *  bx_log('my_module_logs_object', $s);
 * @endcode
 *
 */
class BxDolLogs extends BxDolFactory implements iBxDolFactoryObject
{
	protected $_oDb;
	protected $_sObject;
    protected $_aObject;
    protected $_oLogsStorage;

    /**
     * Constructor
     */
    protected function __construct($aObject, $oLogsStorage)
    {
        parent::__construct();

        $this->_aObject = $aObject;
        $this->_sObject = $aObject['object'];

        $this->_oLogsStorage = $oLogsStorage;
        $this->_oDb = new BxDolLogsQuery($this->_aObject);
    }

   /**
     * Get logs object instance by object name
     * @param $sObject object name
     * @return object instance or false on error
     */
    public static function getObjectInstance($sObject)
    {
        if(isset($GLOBALS['bxDolClasses']['BxDolLogs!' . $sObject]))
            return $GLOBALS['bxDolClasses']['BxDolLogs!' . $sObject];

        $aObject = BxDolLogsQuery::getLogsObject($sObject);
        if($aObject && is_array($aObject) && !$aObject['active'])
            return false;
        if(!$aObject) {
            $aObject = array(
                'object' => $sObject,
                'module' => 'system',
                'logs_storage' => getParam('sys_logs_storage_default') ?: 'Folder',
            );
        }

        $sClass = 'BxDolLogs';
        if(!empty($aObject['class_name'])) {
            $sClass = $aObject['class_name'];
            if(!empty($aObject['class_file']))
                require_once(BX_DIRECTORY_PATH_ROOT . $aObject['class_file']);
        }        

        $sLogsStorage = (empty($aObject['logs_storage']) ? 'Auto' : $aObject['logs_storage']);
        if ('Auto' == $sLogsStorage)
            $sLogsStorage = getParam('sys_logs_storage_default') ?: 'Folder';
        $sClassLogsStorage = 'BxDolLogsStorage' . $sLogsStorage;
        $oLogsStorage = $sClassLogsStorage::getInstance();

        $o = new $sClass($aObject, $oLogsStorage);
        return ($GLOBALS['bxDolClasses']['BxDolLogs!' . $sObject] = $o);
    }

    static public function getLevel2NameMap()
    {
        return [
            BX_LOG_ERR => 'ERROR',
            BX_LOG_WARN => 'WARNING',
            BX_LOG_INFO => 'INFO',
            BX_LOG_DEBUG => 'DEBUG',
        ];
    }

    static public function getName2LevelsMap()
    {
        return [
            'ERROR' => BX_LOG_ERR,
            'WARNING' => BX_LOG_WARN | BX_LOG_ERR,
            'INFO' => BX_LOG_INFO | BX_LOG_WARN | BX_LOG_ERR,
            'DEBUG' => BX_LOG_DEBUG | BX_LOG_INFO | BX_LOG_WARN | BX_LOG_ERR,
        ];
    }

    /**
     * Get current logs object name
     */
    public function getObjectName()
    {
        return $this->_aObject['object'];
    }

    /**
     * Log to the current logs storage object
     * @param $mixed string or array to log
     * @return true on success or false on error
     */
    public function add($mixed, $iLevel = BX_LOG_DEBUG)
    {
        $a = $this->getName2LevelsMap();
        $sLogLevel = getParam('sys_logs_level');
        if (isset($a[$sLogLevel]) && ($a[$sLogLevel] & $iLevel))
            return $this->_oLogsStorage->add($this, $mixed, $iLevel);
        return true;
    }

    /**
     * Get logs from current logs storage
     * @param $iLines number of lines from the tail to return
     * @param $sFilter filter lines by keyword
     * @return array of strings or false on error
     */
    public function get($iLines = 30, $sFilter = '')
    {
        if (!$this->_oLogsStorage->isGetAvail())
            return false;
        return $this->_oLogsStorage->get($this, $iLines, $sFilter);
    }

    /**
     * Check if filtering supported in `get` method
     */
    public function isFilterAvail()
    {
        return $this->_oLogsStorage->isFilterAvail();
    }

    /**
     * Check if `get` method available
     */
    public function isGetAvail()
    {
        return $this->_oLogsStorage->isGetAvail();
    }
}

/** @} */
