<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * The site's default `/robots.txt` and its `/sitemap.xml`, served through `sys_rewrite_rules` (r.php) for every
 * server that sends missing files to r.php. A real `robots.txt` file in the site's folder is served by the web
 * server instead, so an operator can replace the default one.
 *
 * The sitemap lists only what a guest can open: the links of the guests' menus (the site menu, the home page links
 * and the footer) and the entries of content modules that anyone may see (privacy "Public", active, allowed for
 * guests by the content filter; profiles only while active).
 */
class BxDolSitemap extends BxDolFactory implements iBxDolSingleton
{
    /** Menus whose guest links the sitemap lists. */
    public const MENUS = ['sys_site', 'sys_homepage', 'sys_footer'];

    /** At most this many entries of one module, newest first. */
    public const LIMIT_MODULE = 1000;

    /** A sitemap file may list 50,000 links at most. */
    public const LIMIT_TOTAL = 50000;

    protected $_oDb;

    protected function __construct()
    {
        parent::__construct();

        $this->_oDb = new BxDolSitemapQuery();
    }

    public function __clone()
    {
        if(isset($GLOBALS['bxDolClasses'][get_class($this)]))
            trigger_error('Clone is not allowed for the class: ' . get_class($this), E_USER_ERROR);
    }

    public static function getInstance()
    {
        if(!isset($GLOBALS['bxDolClasses'][__CLASS__]))
            $GLOBALS['bxDolClasses'][__CLASS__] = new BxDolSitemap();

        return $GLOBALS['bxDolClasses'][__CLASS__];
    }

    /**
     * The default robots.txt: Studio and the search results are left out, and the sitemap is named.
     * @return string plain text
     */
    public function getRobotsTxt()
    {
        $sPath = rtrim((string)parse_url(BX_DOL_URL_ROOT, PHP_URL_PATH), '/');

        $aLines = ['User-agent: *'];
        // A renamed Studio folder is kept private: its pages ask not to be indexed anyway.
        if(BX_DOL_STUDIO_FOLDER == 'studio')
            $aLines[] = 'Disallow: ' . $sPath . '/studio/';

        $aLines = array_merge($aLines, [
            'Disallow: ' . $sPath . '/searchKeyword.php',
            'Disallow: ' . $sPath . '/searchKeywordContent.php',
            'Disallow: ' . $sPath . '/searchExtended.php',
            '',
            'Sitemap: ' . BX_DOL_URL_ROOT . 'sitemap.xml',
        ]);

        return implode("\n", $aLines) . "\n";
    }

    /**
     * The links of the sitemap.
     * @return array of ['loc' => absolute URL, 'lastmod' => unix time or 0]
     */
    public function getUrls()
    {
        $aUrls = [BX_DOL_URL_ROOT => ['loc' => BX_DOL_URL_ROOT, 'lastmod' => 0]];

        $oPermalinks = BxDolPermalinks::getInstance();

        // Sign in, sign up and other pages that ask not to be indexed.
        $aSkip = [];
        foreach($this->_oDb->getNoindexPageUrls() as $sLink)
            $aSkip[bx_absolute_url($oPermalinks->permalink($sLink))] = true;

        foreach(self::MENUS as $sMenu)
            foreach($this->_oDb->getGuestMenuLinks($sMenu) as $aItem) {
                $sUrl = $this->_getMenuUrl($aItem['link'], $oPermalinks);
                if($sUrl !== '' && !isset($aUrls[$sUrl]) && !isset($aSkip[$sUrl]))
                    $aUrls[$sUrl] = ['loc' => $sUrl, 'lastmod' => 0];
            }

        foreach($this->_getContentModules() as $aModule) {
            foreach($this->getModuleEntries($aModule['name']) as $aEntry) {
                if(count($aUrls) >= self::LIMIT_TOTAL)
                    break 2;

                $aUrls[$aEntry['loc']] = $aEntry;
            }
        }

        return array_values($aUrls);
    }

    /**
     * Public entries of one content module.
     * @param string $sModule module name
     * @return array of ['loc' => absolute URL, 'lastmod' => unix time or 0]
     */
    public function getModuleEntries($sModule)
    {
        $oModule = BxDolModule::getInstance($sModule);
        if(!$oModule || !($oModule instanceof BxBaseModGeneralModule) || empty($oModule->_oConfig->CNF))
            return [];

        $CNF = $oModule->_oConfig->CNF;
        foreach(['TABLE_ENTRIES', 'FIELD_ID', 'FIELD_ALLOW_VIEW_TO', 'URI_VIEW_ENTRY'] as $sKey)
            if(empty($CNF[$sKey]))
                return [];

        $aParams = [
            'table' => $CNF['TABLE_ENTRIES'],
            'field_id' => $CNF['FIELD_ID'],
            'field_allow_view_to' => $CNF['FIELD_ALLOW_VIEW_TO'],
            'field_date' => !empty($CNF['FIELD_CHANGED']) ? $CNF['FIELD_CHANGED'] : ($CNF['FIELD_ADDED'] ?? ''),
            'field_status' => $CNF['FIELD_STATUS'] ?? '',
            'field_status_admin' => $CNF['FIELD_STATUS_ADMIN'] ?? '',
            'profile_type' => $oModule instanceof BxBaseModProfileModule ? $sModule : '',
            'limit' => self::LIMIT_MODULE,
        ];

        $oCf = BxDolContentFilter::getInstance();
        if(!empty($CNF['FIELD_CF']) && $oCf->isEnabled()) {
            $aParams['field_cf'] = $CNF['FIELD_CF'];
            $aParams['cf_guest'] = $oCf->getDefaultValueUnauthenticated();
            $aParams['cf_default'] = (int)$oCf->getDefaultValue();
            $aParams['cf_prohibited'] = $oCf->getProhibited();
        }

        try {
            $aRows = $this->_oDb->getPublicEntries($aParams);
        }
        catch(Exception $e) {
            return [];
        }

        $oPermalinks = BxDolPermalinks::getInstance();

        $aResult = [];
        foreach($aRows as $aRow)
            $aResult[] = [
                'loc' => bx_absolute_url($oPermalinks->permalink('page.php?i=' . $CNF['URI_VIEW_ENTRY'] . '&id=' . (int)$aRow['id'])),
                'lastmod' => (int)$aRow['date'],
            ];

        return $aResult;
    }

    /** The sitemap is made at most this often (seconds): it costs a query per module and a link per entry. */
    public const CACHE_TTL = 21600;

    /**
     * The sitemap in the sitemaps.org format, from the cache while it is fresh.
     * @param boolean $bCache false to make it now
     * @return string XML
     */
    public function getSitemapXml($bCache = true)
    {
        $oDb = BxDolDb::getInstance();
        $oCache = $oDb->getDbCacheObject();
        $sKey = $oDb->genDbCacheKey('sys_sitemap');

        if($bCache && ($sXml = $oCache->getData($sKey, self::CACHE_TTL)) && is_string($sXml))
            return $sXml;

        $sXml = $this->_makeSitemapXml();
        if($bCache)
            $oCache->setData($sKey, $sXml, self::CACHE_TTL);

        return $sXml;
    }

    protected function _makeSitemapXml()
    {
        $oXml = new XMLWriter();
        $oXml->openMemory();
        $oXml->startDocument('1.0', 'UTF-8');
        $oXml->startElement('urlset');
        // A namespace name, not an address to fetch: the protocol defines it with http.
        $oXml->writeAttribute('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9'); // NOSONAR

        foreach($this->getUrls() as $aUrl) {
            $oXml->startElement('url');
            $oXml->writeElement('loc', $aUrl['loc']);
            if(!empty($aUrl['lastmod']))
                $oXml->writeElement('lastmod', gmdate('Y-m-d', $aUrl['lastmod']));
            $oXml->endElement();
        }

        $oXml->endElement();
        $oXml->endDocument();

        return $oXml->outputMemory();
    }

    /**
     * Enabled modules that have content entries.
     */
    protected function _getContentModules()
    {
        return BxDolModuleQuery::getInstance()->getModulesBy(['type' => 'modules', 'active' => 1]);
    }

    /**
     * An absolute URL of the site for a menu link, or '' for a link to another site, a script or a link with markers.
     */
    protected function _getMenuUrl($sLink, $oPermalinks)
    {
        $sLink = trim($sLink);
        if($sLink === '' || str_contains($sLink, '{') || str_starts_with($sLink, '#'))
            return '';

        // Another scheme (javascript:, mailto:) or another site.
        if(preg_match('#^[a-z][a-z0-9+.-]*:#i', $sLink)) {
            if(!str_starts_with($sLink, BX_DOL_URL_ROOT))
                return '';

            return $sLink;
        }

        $sUrl = bx_absolute_url($oPermalinks->permalink($sLink));
        if(in_array($sUrl, [BX_DOL_URL_ROOT . 'index.php', BX_DOL_URL_ROOT . 'page.php?i=home', BX_DOL_URL_ROOT . 'home']))
            return BX_DOL_URL_ROOT;

        return $sUrl;
    }
}

/** @} */
