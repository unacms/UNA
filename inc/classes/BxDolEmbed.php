<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Embed provider.
 *
 * Create an embed from a link.
 *
 * @section embed_provider_create Creating the Editor object:
 *
 *
 * Add record to 'sys_objects_embeds' table:
 *
 * - object: name of the embed object, in the format: vendor prefix, underscore, module prefix, underscore, internal identifier or nothing
 * - title: title of the embed provider, dmay be isplayed in the Studio.
 * - override_class_name: user defined class name which is derived from one of base embed provider classes.
 * - override_class_file: the location of the user defined class, leave it empty if class is located in system folders.
 *
 *
 * @section example Example of usage
 *
 * Generate HTML for a link which will be converted to an embed later:
 *
 * @code
 *  $oEmbed = BxDolEmbed::getObjectInstance(); // get default embed object instance
 *  if ($oEmbed) // check if embed provider is available for using
 *      echo $oEmbed->getLinkHTML ('https://una.io', 'UNA.IO'); // output HTML which will be automatically converted into embed upon page load
 *  else
 *      echo '<a href="https://una.io">UNA.IO</a>';
 * @endcode
 *
 */
class BxDolEmbed extends BxDolFactoryObject
{
    /**
     * Longest link which is fetched and stored, it is the width of the `url` field of the data table.
     * A longer link would be cut on insert, would never be found in the table and so would be fetched on every request.
     */
    const URL_MAX_LENGTH = 255;

    /**
     * Fetches of links which are not in the data table yet, per profile and per IP address, in a time window.
     */
    const FETCH_WINDOW = 3600;
    const FETCH_LIMIT_PROFILE = 30;
    const FETCH_LIMIT_IP = 60;

    /**
     * Seconds to wait for the lock of a counter of fetches. A request which doesn't get it is refused as limited.
     */
    const FETCH_LOCK_TIMEOUT = 3;

    const FETCH_REFUSED_GUEST = 'guest';
    const FETCH_REFUSED_LIMIT = 'limit';

    protected $_bAsync = false;
    protected $_sSocketName = 'sys_embed';

    protected $_sTableData = '';

    protected $_iLifetime;

    protected $_bCssJsAdded = false;

    protected $_sFetchRefused = '';
        
    public function __construct ($aObject, $oTemplate = null)
    {
        parent::__construct($aObject, $oTemplate, 'BxDolEmbedQuery');

        $this->_oDb->setParams([
            'table_data' => $this->_sTableData
        ]);

        $this->_iLifetime = 86400 * (int)getParam('sys_embed_lifetime');
    }

    /**
     * Get embed provider object instance by object name
     * @param $sObject object name
     * @return object instance or false on error
     */
    static public function getObjectInstance($sObject = false, $oTemplate = false)
    {
        if (!$sObject)
            $sObject = getParam('sys_embed_default');

        return parent::getObjectInstanceByClassNames($sObject, $oTemplate, 'BxDolEmbed', 'BxDolEmbedQuery');
    }

    /**
     * Print HTML which will be automatically converted into embed upon page load
     * @param $sLink - link
     * @param $sTitle - title or use link for the title if omitted
     * @param $sMaxWidth - try to restrict max width of embed (works in supported embed providers only)
     */
    public function getLinkHTML ($sLink, $sTitle = '', $sMaxWidth = '')
    {
        // override this function in particular embed provider class
    }

    /**
     * Execute an initialization JS code
     */
    public function addProcessLinkMethod ()
    {
        // override this function in particular embed provider class
        return '';
    }
    
    /**
     * Add css/js files which are needed for embed display and functionality.
     */
    public function addJsCss ()
    {
        // override this function in particular embed provider class
    }

    /**
     * Get data of a link.
     * A link which is not in the data table yet is fetched from the remote site (or from the embed API) only
     * for a signed in profile which is under the fetch limit, otherwise nothing is fetched and stored and
     * the result has the link and its domain only. Stored data is returned to everybody.
     */
    public function getData ($sUrl, $sTheme, $bForcedly = false)
    {
        $sUrl = $this->cleanYoutubeUrl($sUrl);

        $this->_sFetchRefused = '';

        if(!is_string($sUrl) || $sUrl === '' || get_mb_len($sUrl) > self::URL_MAX_LENGTH)
            return json_decode($this->_getDataEmpty((string)$sUrl, $sTheme), true);

        if($this->_sTableData) {
            $aLocal = $this->_oDb->getLocalInfo($sUrl, $sTheme);

            // expired data is replaced only when a new one can be fetched, otherwise the old one is still served
            $bRevalidate = false;
            if($this->_iLifetime && ($iAdded = (int)($aLocal['added'] ?? 0)) && $iAdded + $this->_iLifetime < time() && $this->_canFetch()) {
                $this->deleteLocalWithFiles($aLocal);

                $bRevalidate = true;
            }

            $sData = false;
            if($bRevalidate || (($sKey = 'data') && !($sData = $aLocal[$sKey] ?? false)))
                $sData = $this->{'_getData' . ($sData !== false ? 'Empty' : ($this->_bAsync && !$bForcedly ? 'Async' : ''))}($sUrl, $sTheme);
        }
        else
            $sData = $this->_getData($sUrl, $sTheme);

        return json_decode($sData, true);
    }

    public function getDataFromApi ($sUrl, $sTheme)
    {
        // override this function in particular embed provider class
    }

    public function onGetDataFromApi ($iId)
    {
        // override this function in particular embed provider class
    }

    public function process ()
    {
        $aEmbeds = $this->_oDb->getLocalUnprocessed();
        if(empty($aEmbeds) || !is_array($aEmbeds))
            return;

        $oSockets = BxDolSockets::getInstance();
        $bSockets = $oSockets->isEnabled();

        foreach($aEmbeds as $aEmbed)
            if(($sData = $this->getDataFromApi($aEmbed['url'], $aEmbed['theme']))) {
                $this->_oDb->updateLocal(['data' => $sData], ['id' => $aEmbed['id']]);

                $this->onGetDataFromApi($aEmbed['id']);

                if($bSockets)
                    $oSockets->sendEvent($this->_sSocketName, $aEmbed['id'], 'processed', $sData);
            }
    }

    public function cleanYoutubeUrl($url)
    {
        $parsedUrl = parse_url($url);
        if (isset($parsedUrl['host']) && $parsedUrl['host'] === 'youtu.be') {
            if (isset($parsedUrl['query'])) {
                parse_str($parsedUrl['query'], $queryParams);
                if (isset($queryParams['si'])) {
                    unset($queryParams['si']);
                }
                $queryString = http_build_query($queryParams);
                $cleanUrl = $parsedUrl['scheme'] . '://' . $parsedUrl['host'] . $parsedUrl['path'];
                if (!empty($queryString)) {
                    $cleanUrl .= '?' . $queryString;
                }
                return $cleanUrl;
            }
            return $url;
        }
        return $url;
    }
    
    /**
     * Why the last getData call did not fetch a new link: FETCH_REFUSED_GUEST, FETCH_REFUSED_LIMIT or an empty string.
     */
    public function getFetchRefused ()
    {
        return $this->_sFetchRefused;
    }

    /**
     * Check if the current visitor is under the limit of fetches. It doesn't count a fetch.
     * @param $iProfileId profile id, the logged in profile by default
     */
    public function isFetchLimited ($iProfileId = 0)
    {
        if(!$iProfileId)
            $iProfileId = (int)bx_get_logged_profile_id();

        foreach($this->_getFetchScopes($iProfileId) as $sScope => $aScope)
            if($this->_getFetchCount($sScope, $aScope['id']) >= $aScope['limit'])
                return true;

        return false;
    }

    /**
     * Delete stored data of a link together with the files it has stored.
     * @param $aLocal row of the data table
     */
    public function deleteLocalWithFiles ($aLocal)
    {
        if(empty($aLocal) || !is_array($aLocal))
            return false;

        if(!empty($aLocal['data']) && ($aData = json_decode($aLocal['data'], true)) && is_array($aData))
            $this->_deleteLocalFiles($aData);

        return $this->_oDb->deleteLocal(!empty($aLocal['id']) ? ['id' => (int)$aLocal['id']] : [
            'url' => $aLocal['url'] ?? '',
            'theme' => $aLocal['theme'] ?? ''
        ]);
    }

    /**
     * Delete stored data of links which are older than the embed lifetime, with their files.
     * It is called on cron. Content which still has such a link fetches it again when it is shown to a signed in member.
     * @param $iLimit max number of deleted records
     * @return number of deleted records
     */
    public function pruneExpired ($iLimit = 500)
    {
        if(!$this->_sTableData || !$this->_iLifetime)
            return 0;

        $iDeleted = 0;
        $aLocals = $this->_oDb->getLocalExpired(time() - $this->_iLifetime, $iLimit);
        foreach($aLocals as $aLocal)
            if($this->deleteLocalWithFiles($aLocal))
                $iDeleted += 1;

        return $iDeleted;
    }

    /**
     * Clean expired data of the system embed provider, which is the one which stores files.
     * @return number of deleted records
     */
    public static function pruning ()
    {
        if(($oEmbed = self::getObjectInstance('sys_system')) === false)
            return 0;

        return $oEmbed->pruneExpired();
    }

    /**
     * Override it to delete files which a provider has stored for a link.
     * @param $aData decoded data of a link
     */
    protected function _deleteLocalFiles ($aData)
    {
    }

    /**
     * New links are fetched for signed in profiles under the limit and on cron, never for guests.
     */
    protected function _canFetch ()
    {
        if(defined('BX_DOL_CRON_EXECUTE'))
            return true;

        if(!isLogged()) {
            $this->_sFetchRefused = self::FETCH_REFUSED_GUEST;
            return false;
        }

        if($this->isFetchLimited()) {
            $this->_sFetchRefused = self::FETCH_REFUSED_LIMIT;
            return false;
        }

        return true;
    }

    /**
     * Check if a new link can be fetched and count the fetch.
     * Checking the limit and counting are done under a lock of every counter, so parallel requests
     * can't pass the same check and overwrite the increments of each other.
     * The locks are held for the check and the counting only, not for the fetch itself.
     */
    protected function _acquireFetch ()
    {
        if(defined('BX_DOL_CRON_EXECUTE'))
            return true;

        if(!isLogged()) {
            $this->_sFetchRefused = self::FETCH_REFUSED_GUEST;
            return false;
        }

        $aScopes = $this->_getFetchScopes((int)bx_get_logged_profile_id());

        // locks are taken in the order of scopes, which is always the same, so requests can't deadlock
        $aLocks = [];
        try {
            foreach($aScopes as $sScope => $aScope) {
                $sLock = $this->_getFetchLockName($sScope, $aScope['id']);
                if(!$this->_oDb->lockFetch($sLock, self::FETCH_LOCK_TIMEOUT)) {
                    $this->_sFetchRefused = self::FETCH_REFUSED_LIMIT;
                    return false;
                }

                $aLocks[] = $sLock;
            }

            if(!$this->_canFetch())
                return false;

            foreach($aScopes as $sScope => $aScope)
                $this->_setFetchCount($sScope, $aScope['id'], $this->_getFetchCount($sScope, $aScope['id']) + 1);

            return true;
        }
        finally {
            foreach(array_reverse($aLocks) as $sLock)
                $this->_oDb->unlockFetch($sLock);
        }
    }

    /**
     * MySQL limits a name of a lock to 64 characters, the cache key has the hash of the site in it.
     */
    protected function _getFetchLockName ($sScope, $sId)
    {
        return 'una_embed_fetch_' . md5($this->_getFetchCacheKey($sScope, $sId));
    }

    protected function _getFetchScopes ($iProfileId)
    {
        $aScopes = [
            'ip' => ['id' => bx_get_ip_hash(getVisitorIP()), 'limit' => self::FETCH_LIMIT_IP]
        ];

        if($iProfileId)
            $aScopes['profile'] = ['id' => (string)(int)$iProfileId, 'limit' => self::FETCH_LIMIT_PROFILE];

        return $aScopes;
    }

    protected function _getFetchCacheKey ($sScope, $sId)
    {
        return BxDolDb::getInstance()->genDbCacheKey('embed_fetch_' . $sScope . '_' . $sId);
    }

    protected function _getFetchCount ($sScope, $sId)
    {
        $oCache = BxDolDb::getInstance()->getDbCacheObject();
        $a = $oCache->getData($this->_getFetchCacheKey($sScope, $sId), self::FETCH_WINDOW);
        if(!is_array($a) || (int)($a['start'] ?? 0) + self::FETCH_WINDOW <= time())
            return 0;

        return (int)($a['count'] ?? 0);
    }

    protected function _setFetchCount ($sScope, $sId, $iCount)
    {
        $oCache = BxDolDb::getInstance()->getDbCacheObject();
        $sKey = $this->_getFetchCacheKey($sScope, $sId);

        $a = $oCache->getData($sKey, self::FETCH_WINDOW);
        $iStart = is_array($a) && (int)($a['start'] ?? 0) + self::FETCH_WINDOW > time() ? (int)$a['start'] : time();

        $oCache->setData($sKey, ['start' => $iStart, 'count' => $iCount], self::FETCH_WINDOW);
    }

    protected function _getData($sUrl, $sTheme)
    {
        if(!$this->_acquireFetch())
            return $this->_getDataEmpty($sUrl, $sTheme);

        $sData = $this->getDataFromApi($sUrl, $sTheme);
        if($sData) {
            $iId = $this->_oDb->insertLocal($sUrl, $sTheme, $sData);

            $this->onGetDataFromApi($iId);
        }

        return $sData;
    }

    protected function _getDataAsync($sUrl, $sTheme)
    {
        if(!$this->_acquireFetch())
            return $this->_getDataEmpty($sUrl, $sTheme);

        $iId = $this->_oDb->insertLocal($sUrl, $sTheme);

        if(($sName = 'bx_embed_processing') && ($oCronQuery = BxDolCronQuery::getInstance()) && !$oCronQuery->isTransientJobService($sName))
            $oCronQuery->addTransientJobService($sName, ['system', 'process_embed', [], 'TemplServices']);

        return $this->_getDataEmpty($sUrl, $sTheme, [
            'id' => $iId,
            'processing' => true
        ]);
    }

    protected function _getDataEmpty($sUrl, $sTheme, $aAddons = [])
    {
        return json_encode(array_merge([
            'url' => $sUrl,
            'domain' => parse_url($sUrl, PHP_URL_HOST),
        ], $aAddons));
    }
}

/** @} */
