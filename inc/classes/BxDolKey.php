<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

define('BX_KEY_SCOPE_GENERAL', 0); ///< The key has general/broad access and is not tied to a specific area of ​​application.
define('BX_KEY_SCOPE_ACCOUNT_EMAIL_CONFIRM', 1); 
define('BX_KEY_SCOPE_ACCOUNT_PASSWORD_RESET', 2); 

/**
 * Key objects - automatically generate hashed keys.
 *
 * @section example Example of usage
 *
 * Generate new hashed key:
 *
 * @code
 *  $oKeys = BxDolKey::getInstance(); // get object instance
 *  if ($oKeys) // check if object is available for using
 *      echo $oKeys->getNewKey (false, 3600); // get new hashed key, which will be automatically deleted after 1 hour
 * @endcode
 *
 * Check if hashed key exists:
 *
 * @code
 *  $oKeys = BxDolKey::getInstance(); // get object instance
 *  if ($oKeys && $oKeys->isKeyExists ($sKey)) // check key exists
 *      echo 'key exists';
 *  else
 *      echo 'key is invalid';
 * @endcode
 */
class BxDolKey extends BxDolFactory implements iBxDolSingleton
{
    protected $_oQuery;
    protected $_iScope;
    protected $_aScopes;

    /**
     * Constructor
     */
    protected function __construct()
    {
        parent::__construct();

        $this->_oQuery = new BxDolKeyQuery();

        $this->_iScope = BX_KEY_SCOPE_GENERAL;
        $this->_aScopes = [
            BX_KEY_SCOPE_GENERAL,
            BX_KEY_SCOPE_ACCOUNT_EMAIL_CONFIRM,
            BX_KEY_SCOPE_ACCOUNT_PASSWORD_RESET
        ];
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
        return self::getInstanceWithScope(BX_KEY_SCOPE_GENERAL);
    }

    public static function getInstanceWithScope($iScope)
    {
        $sClass = __CLASS__;
        if($iScope)
            $sClass .= '!' . $iScope;

        if(!isset($GLOBALS['bxDolClasses'][$sClass]))
            $GLOBALS['bxDolClasses'][$sClass] = new BxDolKey();

        $GLOBALS['bxDolClasses'][$sClass]->setScope($iScope);

        return $GLOBALS['bxDolClasses'][$sClass];
    }

    public function setScope($iScope)
    {
        if(!in_array($iScope, $this->_aScopes))
            return false;

        $this->_iScope = $iScope;

        return true;
    }

    /**
     * Get new key.
     * @param $aData - some data to associate with the key
     * @param $iExpire - number of seconds to generated key after, by default - 1 week
     * @return newly generated key string
     */
    public function getNewKey ($aData = false, $iExpire = 604800, $sSalt = '')
    {
        $sKey = md5(time() . rand() . BX_DOL_SECRET . $sSalt);

        return $this->_insertKey($sKey, $aData, $iExpire, $sSalt);
    }

    /**
     * Get new key with params.
     * @param $aData - some data to associate with the key
     * @param $iExpire - number of seconds to generated key after, by default - 1 week
     * @return newly generated key string
     */
    public function getNewKeyExt ($aData = false, $iExpire = 604800, $aParams = [])
    {
        $iLenth = !empty($aParams['length']) ? (int)$aParams['length'] : 32;
        $sKey = !empty($aParams['key']) ? $aParams['key'] : genRndPwd($iLenth, false);

        while(true) {
            if(!$this->isKeyExists($sKey))
                break;

            $sKey = genRndPwd($iLenth, false);
        }

        return $this->_insertKey($sKey, $aData, $iExpire);
    }

    /**
     * Get new key (numeric).
     * @param $aData - some data to associate with the key
     * @param $iExpire - number of seconds to generated key after, by default - 1 week
     * @return newly generated key string
     */
    public function getNewKeyNumeric ($aData = false, $iExpire = 604800)
    {
        $sKey = '';
        while(true) {
            $sKey = mt_rand(100000, 999999);
            if(!$this->isKeyExists($sKey))
                break;
        }

        return $this->_insertKey($sKey, $aData, $iExpire);
    }

    /**
     * Get new key that counts its uses, @see useCounterKey.
     * @param $iExpire - number of seconds the key works, by default - 1 week
     * @return newly generated key string or false
     */
    public function getNewCounterKey ($iExpire = 604800)
    {
        $sKey = bin2hex(random_bytes(16));

        return $this->_insertKey($sKey, '0', $iExpire);
    }

    /**
     * Count one use of a key from getNewCounterKey. The check and the count are one query,
     * so parallel requests can't use the key more than $iMax times between them.
     * @param $sKey - key string
     * @param $iMax - number of uses the key allows
     * @return number of uses so far, this one included, or false if the key is used up, expired or missing
     */
    public function useCounterKey ($sKey, $iMax)
    {
        if (!$this->_oQuery->increaseCounter($sKey, $iMax))
            return false;
        return (int)$this->_oQuery->getData($sKey);
    }

    /**
     * Give back a use counted by useCounterKey, when it shouldn't count after all.
     * @param $sKey - key string
     * @return true if a use was given back
     */
    public function giveBackCounterKey ($sKey)
    {
        return $this->_oQuery->decreaseCounter($sKey);
    }

    /**
     * Check that a key from getNewCounterKey has uses left and works for some more time.
     * @param $sKey - key string
     * @param $iMax - number of uses the key allows
     * @param $iFor - number of seconds the key has to work for yet
     * @return true if the key can be used
     */
    public function canUseCounterKey ($sKey, $iMax, $iFor = 0)
    {
        return $this->_oQuery->isCounterBelow($sKey, $iMax, time() + (int)$iFor);
    }

    /**
     * Check if provided key exists.
     * @param $sKey - key string
     * @return true if key exists or false if key is missing
     */
    public function isKeyExists ($sKey, $sSalt = '')
    {
        return $this->_oQuery->get($sKey, $sSalt) ? true : false;
    }

    /**
     * Get key data.
     * @param $sKey - key string
     * @return true if key exists or false if key is missing
     */
    public function getKeyData ($sKey, $sSalt = '')
    {
        $sData = $this->_oQuery->getData($sKey, $sSalt);
        if ($sData)
            return unserialize($sData);
        return '';
    }

    /**
     * Delete provided key.
     * @param $sKey - key string
     * @return true if key was successfully found and delete if false otherwise
     */
    public function removeKey ($sKey)
    {
        return $this->_oQuery->remove($sKey);
    }

    /**
     * Delete expired keys.
     */
    public function prune ()
    {
        return $this->_oQuery->prune();
    }

    protected function _insertKey($sKey, $mixedData = false, $iExpire = 604800, $sSalt = '')
    {
        if($mixedData && is_array($mixedData))
            $mixedData = serialize($mixedData);

        switch($this->_iScope) {
            case BX_KEY_SCOPE_ACCOUNT_EMAIL_CONFIRM:
            case BX_KEY_SCOPE_ACCOUNT_PASSWORD_RESET:
                $this->_oQuery->removeByParams([
                    'sample' => 'similar', 
                    'data' => $mixedData, 
                    'scope' => $this->_iScope
                ]);
                break;
        }

        return $this->_oQuery->insertByParams([
            'key' => $sKey, 
            'data' => $mixedData, 
            'scope' => $this->_iScope,
            'expire' => (int)$iExpire,  
            'salt' => $sSalt
        ]) ? $sKey : false;
    }
}

/** @} */
