<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Share card.
 *
 * A share card is the 1200x630 picture social networks and chat apps show when a page of the site is
 * pasted somewhere. This class owns everything about a card except the drawing itself:
 * - it describes a page as a "card spec" - a plain, viewer independent array (@see normalizeSpec),
 * - it decides whether an anonymous visitor may see that content at all (@see isGuestVisible),
 * - it turns a spec into the stable, content addressed endpoint URL that goes into `og:image`
 *   (@see getImageUrl), and back again in the endpoint (@see getSpecForEntity),
 * - it produces the resolved meta tag values for BxDolTemplate::getMetaInfo() (@see resolve).
 *
 * Nothing on the page render path generates an image or writes anything: a page render only ever
 * computes a spec and a hash. The picture itself is drawn on demand by `share_card.php`, using
 * BxDolShareCardLayout for the block list and BxDolShareCardRenderer for the pixels. The renderer
 * resolves its own inputs to local files.
 *
 * @section example Example of usage
 *
 * @code
 *  $oShareCard = BxDolShareCard::getInstance();
 *  if ($oShareCard->isEnabled()) {
 *      $aMeta = $oShareCard->resolve($aPage, $oPage); // ready to emit meta tag values
 *  }
 * @endcode
 */
class BxDolShareCard extends BxDolFactory implements iBxDolSingleton
{
    /**
     * Card format version. It is part of every cache key, so bumping it invalidates every card on
     * the site at once - do it whenever the layouts or the renderer start drawing something else.
     */
    const VERSION = 2;

    const PRUNE_ENTITY_LIFETIME = 7776000; ///< 90 days: how old a card must be before its entity is probed, @see BxDolShareCard::pruning
    const PRUNE_ENTITIES_PER_RUN = 500; ///< how many entities one pruning run probes

    /**
     * Spec keys which describe the page rather than the picture. They are deliberately excluded
     * from the cache key, so that editing something nobody can see on the card - the canonical URL,
     * the og:type, an extra meta pair - does not retire a cached image which is still correct.
     * It does not make two pages share one image: they are separate entities and each keeps its own.
     */
    protected $_aVolatileKeys = ['private', 'type', 'url', 'meta'];

    protected $_aFontPaths = [];

    protected function __construct()
    {
        if (isset($GLOBALS['bxDolClasses'][__CLASS__]))
            trigger_error ('Multiple instances are not allowed for the BxDolShareCard class.', E_USER_ERROR);

        parent::__construct();
    }

    /**
     * Prevent cloning the instance
     */
    public function __clone()
    {
        if (isset($GLOBALS['bxDolClasses'][__CLASS__]))
            trigger_error('Clone is not allowed for the BxDolShareCard class.', E_USER_ERROR);
    }

    /**
     * Get share card object instance
     * @return object instance
     */
    public static function getInstance()
    {
        if (!isset($GLOBALS['bxDolClasses'][__CLASS__]))
            $GLOBALS['bxDolClasses'][__CLASS__] = new BxDolShareCard();

        return $GLOBALS['bxDolClasses'][__CLASS__];
    }

    /**
     * Determine whether generated share cards are enabled globally or not.
     * When they are off every caller keeps the output it produced before this feature existed.
     */
    public function isEnabled()
    {
        return getParam('sys_share_cards_enable') == 'on';
    }

    /**
     * The generic site card spec - the home page card, and the substitute for anything an anonymous
     * visitor is not allowed to see.
     * @param $aOverride - optional array of spec keys to override before normalisation
     * @return normalised spec array
     */
    public function getDefaultSpec($aOverride = [])
    {
        $aSpec = [
            'module' => 'system',
            'id' => 0,
            'type' => 'website',
            'url' => BX_DOL_URL_ROOT,
            'title' => self::cleanText((string)getParam('site_title'), 200),
            'subtitle' => self::cleanText((string)getParam('sys_site_description'), 200),
            'layout' => 'default',
            'bg' => $this->_getSiteBackground(),
        ];

        if (is_array($aOverride) && $aOverride)
            $aSpec = array_merge($aSpec, $aOverride);

        return $this->normalizeSpec($aSpec);
    }

    /**
     * Fill every spec key with its default and coerce every value to its declared type.
     * The result is built in a fixed key order on purpose - it is serialised into the cache key.
     * @param $aSpec - raw spec, from a module, a page or nowhere at all
     * @return normalised spec array
     */
    public function normalizeSpec($aSpec)
    {
        if (!is_array($aSpec))
            $aSpec = [];

        $sModule = $this->_normalizeName($aSpec['module'] ?? '');
        if ($sModule === '')
            $sModule = 'system';

        return [
            'module' => $sModule,
            'id' => max(0, (int)($aSpec['id'] ?? 0)),
            'page' => $this->_normalizeName($aSpec['page'] ?? ''),
            'private' => !empty($aSpec['private']),
            'type' => $this->_normalizeType($aSpec['type'] ?? ''),
            'url' => !empty($aSpec['url']) && is_string($aSpec['url']) ? bx_absolute_url($aSpec['url']) : '',
            'title' => self::normalizeText($aSpec['title'] ?? '', 200),
            'description' => self::normalizeText($aSpec['description'] ?? '', 300),
            'subtitle' => self::normalizeText($aSpec['subtitle'] ?? '', 200),
            'layout' => $this->_normalizeLayout($aSpec),
            'image' => $this->_normalizeImage($aSpec['image'] ?? null),
            'bg' => $this->_normalizeImage($aSpec['bg'] ?? null),
            'extra' => $this->_normalizeExtra($aSpec['extra'] ?? []),
            'meta' => $this->_normalizeMeta($aSpec['meta'] ?? []),
        ];
    }

    /**
     * Resolve a page into the values BxDolTemplate::getMetaInfo() emits.
     *
     * This method is total: it never throws and it always returns an array. When anything at all
     * goes wrong - including a disabled feature flag - it returns array('disabled' => true) and the
     * caller keeps whatever it used to output.
     *
     * Every string returned is UNESCAPED plain text: the caller must pass it through
     * bx_html_attribute() before putting it into an attribute.
     *
     * @param $aPage - the BxDolTemplate page array
     * @param $oPage - BxDolPage instance of the current page, or null
     * @return array('type', 'title', 'description', 'url', 'site_name', 'locale', 'twitter_card',
     *               'image' => array('url', 'width', 'height', 'alt', 'type')|null, 'meta' => array)
     *         or array('disabled' => true)
     */
    public function resolve($aPage, $oPage = null)
    {
        if (!$this->isEnabled())
            return ['disabled' => true];

        try {
            return $this->_resolve(is_array($aPage) ? $aPage : [], $oPage);
        }
        catch (Throwable $oThrowable) {
            // a broken card must never break a page render, and half a card is worse than none:
            // degrade to the output the site produced before share cards existed
            // bx_trigger_error() raises E_USER_ERROR, which would turn a caught problem back into
            // a fatal one, so the failure only ever goes to the log
            bx_log('sys_debug', 'BxDolShareCard::resolve failed: ' . $oThrowable->getMessage(), BX_LOG_ERR);
            return ['disabled' => true];
        }
    }

    /**
     * The entity a card belongs to. One entity has exactly one current card.
     * @return 'page:<object>' | '<module>:<id>' | 'site'
     */
    public function getEntityKey($aSpec)
    {
        $aSpec = $this->normalizeSpec($aSpec);

        // a private spec is answered with the generic site card, so it shares the site entity and
        // therefore the very same URL as the home page card
        if ($aSpec['private'])
            return 'site';

        if ($aSpec['module'] != 'system' && $aSpec['id'] > 0)
            return $aSpec['module'] . ':' . $aSpec['id'];

        if ($aSpec['page'] !== '')
            return 'page:' . $aSpec['page'];

        return 'site';
    }

    /**
     * The content hash of a card: everything which changes the drawn picture, and nothing else.
     *
     * BX_DOL_SECRET is used as a keyed digest only to keep the key opaque and cheap to compute -
     * this is a cache key, not a secret, and a stock install has a well known default secret.
     * @return 'v<VERSION>-' . 40 hex characters
     */
    public function getCacheKey($aSpec)
    {
        $aSpec = $this->normalizeSpec($aSpec);
        foreach ($this->_aVolatileKeys as $sKey)
            unset($aSpec[$sKey]);

        $aInputs = [
            'site' => $this->getSiteInputs(),
            'spec' => $aSpec,
        ];

        $sInputs = json_encode($aInputs, JSON_UNESCAPED_SLASHES | JSON_PARTIAL_OUTPUT_ON_ERROR);
        if (!is_string($sInputs))
            $sInputs = serialize($aInputs);

        return 'v' . self::VERSION . '-' . substr(hash_hmac('sha256', $sInputs, BX_DOL_SECRET), 0, 40);
    }

    /**
     * The card URL for `og:image`. It is always the endpoint URL, never a storage URL: the endpoint
     * is content addressed, so a scraper which caches it by URL never has to come back for a second
     * look, and Local and S3 installs behave identically.
     *
     * This is called on every page render, so it must stay cheap: it reads site options, hashes
     * them together with the spec, and stops there - no storage lookup, and no drawing.
     */
    public function getImageUrl($aSpec)
    {
        $aSpec = $this->normalizeSpec($aSpec);

        return BX_DOL_URL_ROOT . 'share_card.php?e=' . rawurlencode($this->getEntityKey($aSpec)) . '&h=' . rawurlencode($this->getCacheKey($aSpec));
    }

    /**
     * Is this entry visible to a visitor who is not logged in?
     *
     * Every test here is a plain value test against the stored row. BxDolPrivacy::check() and
     * isEntryActive() cannot be used: they answer for the *current viewer*, and substitute the
     * logged in profile when asked about viewer 0, which would leak a private entry into the card
     * of whoever happened to render the page first.
     *
     * @param $sModule - module name the entry belongs to
     * @param $aContentInfo - the stored entry row
     * @param $CNF - the module's CNF array
     * @return boolean, false means the caller must produce a `private` spec
     */
    public static function isGuestVisible($sModule, $aContentInfo, $CNF)
    {
        if (!is_array($aContentInfo) || !$aContentInfo || !is_array($CNF) || !$CNF)
            return false;

        // the whole site is behind a login wall, so nothing at all may be described
        if (getParam('sys_lock_from_unauthenticated') == 'on')
            return false;

        // BX_DOL_PG_ALL is defined in BxDolPrivacy.php, which is not necessarily loaded yet
        if (!defined('BX_DOL_PG_ALL'))
            require_once(BX_DIRECTORY_PATH_CLASSES . 'BxDolPrivacy.php');

        // A module which does not declare FIELD_ALLOW_VIEW_TO is refused rather than waved through.
        // This test used to be skipped when the key was absent, which is fail-OPEN: bx_timeline keeps
        // its privacy in another column (FIELD_OBJECT_PRIVACY_VIEW) and declares no FIELD_ALLOW_VIEW_TO,
        // so every mirrored entry - and timeline mirrors the whole site - passed the gate on status
        // alone and put the title and author of friends-only content onto a public card.
        // Reading that other column here would not be enough either: a timeline event inherits the
        // visibility of the content it mirrors AND of the context it was posted into, which only the
        // module itself can work out. So core refuses to vouch for it, and a module that stores
        // privacy anywhere but FIELD_ALLOW_VIEW_TO has to ship a getShareCard() with a gate of its own.
        if (empty($CNF['FIELD_ALLOW_VIEW_TO']))
            return false;

        if (!array_key_exists($CNF['FIELD_ALLOW_VIEW_TO'], $aContentInfo))
            return false;

        if ((string)$aContentInfo[$CNF['FIELD_ALLOW_VIEW_TO']] !== BX_DOL_PG_ALL)
            return false;

        foreach (['FIELD_STATUS', 'FIELD_STATUS_ADMIN'] as $sKey) {
            if (empty($CNF[$sKey]))
                continue;
            if (!array_key_exists($CNF[$sKey], $aContentInfo))
                return false;
            if ((string)$aContentInfo[$CNF[$sKey]] !== BX_PROFILE_STATUS_ACTIVE)
                return false;
        }

        // anything the content filter does not rate as "everybody" is not for anonymous visitors.
        // BxDolContentFilter::isAllowedByViewer() reads a stored 0 as the default rating, so a row
        // which simply never wrote the field is an ordinary public row and is normalised the same way
        if (!empty($CNF['FIELD_CF'])) {
            if (!array_key_exists($CNF['FIELD_CF'], $aContentInfo))
                return false;

            $iDefaultCf = (int)BxDolContentFilter::getInstance()->getDefaultValue();
            $iCf = (int)$aContentInfo[$CNF['FIELD_CF']];
            if ($iCf && $iCf !== $iDefaultCf)
                return false;
        }

        // the entry page itself can be limited to some membership levels
        if (!empty($CNF['URI_VIEW_ENTRY'])) {
            // resolved by module and URI rather than by URI alone: getObjectInstanceByURI() can send
            // a 301 and exit() on a force redirect, which is fatal in a meta tag or an image endpoint
            $oPage = BxDolPage::getObjectInstanceByModuleAndURI($sModule, $CNF['URI_VIEW_ENTRY']);
            if ($oPage) {
                $aObject = $oPage->getObject();
                if (isset($aObject['visible_for_levels']) && !self::isLevelInSet($aObject['visible_for_levels'], MEMBERSHIP_ID_NON_MEMBER))
                    return false;
            }
        }

        return true;
    }

    /**
     * Is a membership level present in a `visible_for_levels` bit field?
     *
     * BxDolAcl::isMemberLevelInSet() reads its second argument as a profile id and falls back to the
     * logged in profile for 0, so it cannot answer this question for the anonymous audience. The bit
     * test it performs internally is done here directly instead.
     * @param $mixedLevels - bit field, or an array of level ids
     * @param $iLevel - membership level id to look for
     */
    public static function isLevelInSet($mixedLevels, $iLevel)
    {
        $iLevels = 0;
        if (is_array($mixedLevels))
            foreach ($mixedLevels as $iOne)
                $iLevels |= 1 << ((int)$iOne - 1);
        else if (is_numeric($mixedLevels))
            $iLevels = (int)$mixedLevels;

        if (!$iLevels)
            return false;

        return (bool)($iLevels & (1 << ((int)$iLevel - 1)));
    }

    /**
     * The layout to draw with, which is 'text_free' whenever the words cannot be drawn at all.
     *
     * hasTextSupport() existed but nothing ever called it, so a Japanese or Arabic title went to the
     * normal layout and the renderer drew one "NO GLYPH" box per character - a card that passes every
     * mechanical check (1200x630, small, fast) and is unreadable to a human. The decision belongs in
     * the spec, so that it is part of the hash and both producers reach it alike.
     */
    protected function _normalizeLayout($aSpec)
    {
        $sLayout = $this->_normalizeName($aSpec['layout'] ?? '') ?: 'default';
        if ($sLayout === 'text_free')
            return $sLayout;

        // the title carries the card; when it cannot be drawn there is nothing worth drawing
        $sTitle = (string)($aSpec['title'] ?? '');

        return $sTitle !== '' && !self::hasTextSupport($sTitle) ? 'text_free' : $sLayout;
    }

    /**
     * Normalise arbitrary stored text into one plain, single line string.
     * bx_process_output(), bx_html_attribute() and BxDolMetatags::metaParse() are deliberately not
     * used: they produce markup and entities, and a card draws glyphs, not HTML.
     * @param $sText - raw text, possibly with markup and entities
     * @param $iMaxLen - truncate on a word boundary at this many characters, 0 for no truncation
     */
    public static function cleanText($sText, $iMaxLen = 0)
    {
        if (!is_string($sText) || $sText === '')
            return '';

        // invalid UTF-8 makes every /u pattern below return null, so scrub it up front
        if (!preg_match('//u', $sText))
            $sText = mb_convert_encoding($sText, 'UTF-8', 'UTF-8');

        // block level markup carries an implied space; stripping it blindly runs words together
        $sText = preg_replace('#<(?:br\s*/?|/p|/li)>#i', ' ', $sText);
        $sText = strip_tags($sText);
        $sText = html_entity_decode($sText, ENT_QUOTES | ENT_HTML5, 'UTF-8');

        return self::normalizeText($sText, $iMaxLen);
    }

    /**
     * Shape a string which is ALREADY plain text: drop what cannot be drawn or measured, collapse
     * runs of space, and truncate on a word boundary.
     *
     * Separate from cleanText(), and the ONLY one of the two that normalizeSpec() applies, because
     * cleanText() is not a fixed point and a spec is normalised more than once on its way to a hash.
     * cleanText() strips tags and only then decodes entities, so text an author wrote as
     * `&lt;div class=&quot;wrap&quot;&gt;` survives the first pass as a literal `<div class="wrap">`
     * - and a second pass would strip that as if it were markup, silently deleting the author's own
     * words from the picture and from og:description. Turning stored markup into plain text is the
     * producer's job and happens exactly once; from then on only this runs, and running it any
     * number of times changes nothing.
     *
     * @param $sText - text which has already been through cleanText()
     * @param $iMaxLen - truncate on a word boundary at this many characters, 0 for no truncation
     */
    public static function normalizeText($sText, $iMaxLen = 0)
    {
        if (!is_string($sText) || $sText === '')
            return '';

        if (!preg_match('//u', $sText))
            $sText = mb_convert_encoding($sText, 'UTF-8', 'UTF-8');

        // control characters and zero width marks survive the steps above and break text measuring
        $sText = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', ' ', $sText);
        $sText = preg_replace('/[\x{200B}-\x{200F}\x{2028}\x{2029}\x{202A}-\x{202E}\x{2060}\x{FEFF}]/u', '', $sText);

        $sText = preg_replace('/\s+/u', ' ', $sText);
        $sText = trim($sText);

        $iMaxLen = (int)$iMaxLen;
        if ($iMaxLen > 0 && mb_strlen($sText) > $iMaxLen) {
            $sText = mb_substr($sText, 0, $iMaxLen);
            $sText = preg_replace('/\s+\S*$/u', '', $sText);
            $sText = rtrim($sText, " ,;:-");
            $sText .= '...';
        }

        return $sText;
    }

    /**
     * Can this text be drawn with the available font at all?
     * A false here sends the card to the text free layout rather than to a row of empty boxes.
     */
    public static function hasTextSupport($sText)
    {
        if (!is_string($sText) || $sText === '')
            return true;

        if (!preg_match('//u', $sText))
            $sText = mb_convert_encoding($sText, 'UTF-8', 'UTF-8');

        // emoji are never drawn from a text font, so they must not decide the question
        $sText = preg_replace('/\p{Extended_Pictographic}/u', '', $sText);
        $sText = preg_replace('/[\x{FE00}-\x{FE0F}\x{200D}\x{E0020}-\x{E007F}]/u', '', $sText);

        // neither GD nor Imagick does bidi reordering or shaping, so RTL is never drawable,
        // whatever font the site supplies
        if (preg_match('/[\p{Arabic}\p{Hebrew}]/u', $sText))
            return false;

        if (!preg_match('/[\p{Han}\p{Hiragana}\p{Katakana}\p{Hangul}\p{Devanagari}\p{Thai}]/u', $sText))
            return true;

        // a site which supplied its own font is trusted to have supplied the glyphs with it - but
        // only once that font has actually been accepted: a path which is missing, unreadable or
        // simply mistyped falls back to the bundled Inter, which would draw a row of tofu
        $sCustom = trim((string)getParam('sys_share_card_font'));

        return $sCustom !== '' && self::getInstance()->getFontPath() === $sCustom;
    }

    /**
     * Absolute path of the font to draw with, or '' when there is none and text cannot be drawn.
     * @param $sWeight - accepted for call site readability only: the bundled Inter is a variable
     *                   font rendered at its default instance, and bolder weights are drawn faux
     *                   bold by the renderer rather than loaded from a second file
     */
    public function getFontPath($sWeight = 'regular')
    {
        $sWeight = $sWeight == 'bold' ? 'bold' : 'regular';
        if (isset($this->_aFontPaths[$sWeight]))
            return $this->_aFontPaths[$sWeight];

        $sPath = '';

        // a site which supplies its own font supplies one face, and it is used at every weight:
        // guessing a sibling file from its name would be guessing at somebody else's filesystem
        $sCustom = trim((string)getParam('sys_share_card_font'));
        if ($sCustom !== '' && $this->_isFontReadable($sCustom))
            $sPath = $sCustom;
        else {
            // a real SemiBold face rather than the same outlines drawn twice a pixel apart, which
            // thickens a glyph on one axis only and reads as smeared rather than bold. It is an
            // instance of the variable font beside it - same family, same licence.
            $sBundled = BX_DIRECTORY_PATH_BASE . 'fonts/inter/' . ($sWeight == 'bold' ? 'Inter-SemiBold.ttf' : 'Inter-Variable.ttf');
            if ($this->_isFontReadable($sBundled))
                $sPath = $sBundled;
            else if ($this->_isFontReadable($sFallback = BX_DIRECTORY_PATH_BASE . 'fonts/inter/Inter-Variable.ttf'))
                $sPath = $sFallback;
        }

        return ($this->_aFontPaths[$sWeight] = $sPath);
    }

    /**
     * Layout object for a spec's layout name.
     * @see BxDolShareCardLayout::getObjectInstance
     */
    public function getLayoutObject($sLayout, $sModule = '')
    {
        return BxDolShareCardLayout::getObjectInstance($sLayout, $sModule);
    }

    /**
     * Rebuild a spec from an entity key, with no page render around it. This is what the endpoint
     * uses: it is handed nothing but the query string, so it has to look everything up again.
     * @param $sEntity - 'site' | 'page:<object>' | '<module>:<id>'
     * @return normalised spec array, or false when the entity is unknown or not public
     */
    public function getSpecForEntity($sEntity)
    {
        if (!is_string($sEntity) || $sEntity === '' || strlen($sEntity) > 128)
            return false;

        if ($sEntity == 'site')
            return $this->getDefaultSpec();

        if (($iPos = strpos($sEntity, ':')) === false)
            return false;

        $sType = substr($sEntity, 0, $iPos);
        $sRest = substr($sEntity, $iPos + 1);
        if ($sType === '' || $sRest === '')
            return false;

        try {
            if ($sType == 'page')
                return $this->_getSpecForPage($sRest);

            return $this->_getSpecForContent($sType, (int)$sRest);
        }
        catch (Throwable $oThrowable) {
            bx_log('sys_debug', 'BxDolShareCard::getSpecForEntity failed for "' . $sEntity . '": ' . $oThrowable->getMessage(), BX_LOG_ERR);
            return false;
        }
    }

    /**
     * Delete card files nothing can reach any more. Called once a day from BxDolCronPruning.
     *
     * Two kinds of garbage accumulate, and only these two are swept - a card which is merely old is
     * NOT deleted, because its URL is already out in the world inside someone's post and a scraper
     * which re-checks it would find a 404 where a perfectly good picture used to be:
     *
     *   1. files no map row points at. The endpoint stores the file first and points the map row at
     *      it second, so a crash between the two leaves a file nothing will ever serve. Only files
     *      older than the ghost lifetime are considered, or this would race a live request.
     *   2. map rows whose entity no longer exists - a deleted post, a page object removed with its
     *      module. The check is an existence probe, deliberately not a spec rebuild: a module which
     *      has no card of its own also produces no spec, and pruning on that would delete the
     *      generic card the endpoint legitimately stores for it and re-render it on the next scrape.
     *      A row is only probed once its card is PRUNE_ENTITY_LIFETIME old, and at most
     *      PRUNE_ENTITIES_PER_RUN rows are probed per run, oldest first.
     *
     * @return int number of deleted files
     */
    public static function pruning()
    {
        $oStorage = BxDolStorage::getObjectInstance(BX_DOL_STORAGE_OBJ_SHARE_CARDS);
        if (!$oStorage)
            return 0;

        $oDb = BxDolDb::getInstance();
        $iDeleted = 0;

        try {
            $aOrphans = $oDb->getAll("SELECT `f`.`id` FROM `sys_share_cards` AS `f` LEFT JOIN `sys_share_cards_map` AS `m` ON `m`.`file_id` = `f`.`id` WHERE `m`.`id` IS NULL AND `f`.`added` < :added LIMIT :limit", [
                'added' => time() - BX_DOL_STORAGE_GHOST_LIFETIME,
                'limit' => self::PRUNE_ENTITIES_PER_RUN,
            ]);

            foreach ($aOrphans as $aOrphan)
                $iDeleted += $oStorage->deleteFile((int)$aOrphan['id']) ? 1 : 0;

            $aRows = $oDb->getAll("SELECT `id`, `entity`, `file_id` FROM `sys_share_cards_map` WHERE `added` < :added ORDER BY `added` ASC LIMIT :limit", [
                'added' => time() - self::PRUNE_ENTITY_LIFETIME,
                'limit' => self::PRUNE_ENTITIES_PER_RUN,
            ]);

            $iNow = time();
            foreach ($aRows as $aRow) {
                if (self::isEntityAlive($aRow['entity'])) {
                    // stamp it so it leaves the oldest-N window. `added` is otherwise only written
                    // when a card is re-stored, so a live entity's row would sit in that window for
                    // ever - and once PRUNE_ENTITIES_PER_RUN live rows are older than the lifetime,
                    // which every site reaches eventually, the sweep would never see a dead one again
                    $oDb->query("UPDATE `sys_share_cards_map` SET `added` = :now WHERE `id` = :id LIMIT 1", ['now' => $iNow, 'id' => (int)$aRow['id']]);
                    continue;
                }

                if ((int)$aRow['file_id'] > 0)
                    $iDeleted += $oStorage->deleteFile((int)$aRow['file_id']) ? 1 : 0;

                // a row whose file_id is 0 was claimed by a render which then failed; deleting it
                // reclaims something too, and the cron report should not read 0 for a run that worked
                if ($oDb->query("DELETE FROM `sys_share_cards_map` WHERE `id` = :id LIMIT 1", ['id' => (int)$aRow['id']]) && (int)$aRow['file_id'] <= 0)
                    $iDeleted++;
            }
        }
        catch (Throwable $oThrowable) {
            bx_log('sys_debug', 'BxDolShareCard::pruning failed: ' . $oThrowable->getMessage(), BX_LOG_ERR);
        }

        return $iDeleted;
    }

    /**
     * Does the thing an entity key names still exist? Existence only - a private or an empty entity
     * is alive, it simply shares the generic card.
     * On any doubt the answer is yes: never delete a card because a module misbehaved.
     */
    public static function isEntityAlive($sEntity)
    {
        if (!is_string($sEntity) || $sEntity === '')
            return true;

        if ($sEntity == 'site')
            return true;

        if (($iPos = strpos($sEntity, ':')) === false)
            return true;

        $sType = substr($sEntity, 0, $iPos);
        $sRest = substr($sEntity, $iPos + 1);
        if ($sType === '' || $sRest === '')
            return true;

        try {
            if ($sType == 'page')
                return (bool)BxDolPage::getObjectInstance($sRest);

            $oContentInfo = BxDolContentInfo::getObjectInstance($sType);
            if (!$oContentInfo)
                return false;

            $mixedInfo = $oContentInfo->getContentInfo((int)$sRest);

            return !empty($mixedInfo);
        }
        catch (Throwable $oThrowable) {
            return true;
        }
    }

    /**
     * Site wide values which change the look of every card. They are part of every cache key, so a
     * change to any of them retires every cached card at once.
     * `sys_revision` is deliberately absent: it is bumped on every cache clear, and cards must
     * survive those.
     */
    public function getSiteInputs()
    {
        return [
            'version' => self::VERSION,
            'ts' => (int)getParam('sys_share_card_ts'),
            'lang' => (string)bx_lang_name(),
            'site_title' => (string)getParam('site_title'),
            'site_description' => (string)getParam('sys_site_description'),
            'share_image' => (int)getParam('sys_site_share_image'),
            'cover_common' => (int)getParam('sys_site_cover_common'),
            'cover_disabled' => (string)getParam('sys_site_cover_disabled'),
            'branding' => self::getBrandingIds(),
            'theme_color' => (string)getParam('sys_pwa_manifest_theme_color'),
            'font' => (string)getParam('sys_share_card_font'),
            'gd' => (string)getParam('enable_gd'),
        ];
    }

    /**
     * The site's own pictures - the wordmark, the square mark, the home screen icons - as file ids.
     *
     * The design module in front of the site may keep logo settings of its own (Artificer stores
     * them as bx_artificer_site_mark and friends) and only falls back to the sys_site_* options, so
     * reading those options directly would leave a site which uploaded its logo through the design
     * with no branding on its cards at all. This is @see BxDolDesigns::getSiteLogoParam's resolution
     * without BxDolDesigns itself: constructing it reads every logo's dimensions over HTTP through
     * getimagesize(), which the process drawing a card has no reason to pay for and, off a web
     * server, no way to complete.
     *
     * The renderer draws from this and @see getSiteInputs hashes it, so what a card is keyed on is
     * exactly what was drawn onto it - replacing a logo retires every cached card, as it must.
     *
     * @return array of name => file id, always with the same keys in the same order
     */
    public static function getBrandingIds()
    {
        $aParams = self::getBrandingParams();

        $aIds = ['logo' => 0, 'logo_dark' => 0, 'mark' => 0, 'mark_dark' => 0];
        foreach (array_keys($aIds) as $sName) {
            $iId = empty($aParams[$sName]) ? 0 : (int)getParam($aParams[$sName]);
            if ($iId < 1)
                $iId = (int)getParam('sys_site_' . $sName);

            $aIds[$sName] = max(0, $iId);
        }

        // the pictures a site uploads for its home screen icon are the next best mark: square
        // rasters of a known shape, and far more sites have one than have uploaded a mark
        $aIds['icon_apple'] = max(0, (int)getParam('sys_site_icon_apple'));
        $aIds['icon_android'] = max(0, (int)getParam('sys_site_icon_android'));

        return $aIds;
    }

    /**
     * Option names the active design keeps its own logo settings under, empty when it keeps none.
     */
    protected static function getBrandingParams()
    {
        try {
            $aDesign = BxDolModuleQuery::getInstance()->getModuleByUri(BxDolTemplate::getInstance()->getCode());
            if (empty($aDesign['name']))
                return [];

            // no isset() on _oConfig: BxDolModule creates it on demand in __get() and declares no
            // __isset(), so isset() answers false for a config which is perfectly reachable
            $oDesign = BxDolModule::getInstance($aDesign['name']);
            if (!$oDesign || !method_exists($oDesign->_oConfig, 'getLogoParams'))
                return [];

            $aParams = $oDesign->_oConfig->getLogoParams();
        }
        catch (Exception|Error $oError) {
            return [];
        }

        return is_array($aParams) ? $aParams : [];
    }

    /**
     * isFileReady() dispatches to `isFileReady_` . the transcoder's source type, and BxDolTranscoderProxy
     * defines no isFileReady_Proxy(), so asking a Proxy transcoder raises an Error rather than answering.
     * Proxy transcoders are the ordinary image handle for albums, timeline and stories, so every caller
     * here goes through this guard: an unanswerable transcoder simply counts as "no derivative".
     */
    public static function isTranscodedFileReady($oTranscoder, $mixedHandler)
    {
        try {
            return (bool)$oTranscoder->isFileReady($mixedHandler, false);
        }
        catch (Exception|Error $oError) {
            return false;
        }
    }

    /**
     * Resolve an image spec array to an absolute URL, '' when there is none.
     * The branch order is the one BxDolMetatags::addPageMetaInfo() uses, so an image which resolves
     * for a meta tag today resolves the same way here.
     * @param $mixedImage - array('id', 'object'), array('id', 'transcoder'), array('url') or null
     */
    public function getImageSpecUrl($mixedImage)
    {
        $mixedImage = $this->_normalizeImage($mixedImage);
        if (!$mixedImage)
            return '';

        if (!empty($mixedImage['url']))
            return $mixedImage['url'];

        $o = false;
        if (!empty($mixedImage['object']))
            $o = BxDolStorage::getObjectInstance($mixedImage['object']);
        else if (!empty($mixedImage['transcoder'])) {
            $o = BxDolTranscoder::getObjectInstance($mixedImage['transcoder']);

            // a derivative which is not ready yet is answered with an image_transcoder.php URL
            // carrying a `t=<time()>` parameter: it is different on every render, and og:image has
            // to stay stable, so a not ready derivative is simply no URL at all here
            if ($o && !self::isTranscodedFileReady($o, $mixedImage['id']))
                return '';
        }

        if (!$o)
            return '';

        $sUrl = $o->getFileUrlById($mixedImage['id']);

        return $sUrl ? $sUrl : '';
    }

    /**
     * @see self::resolve - this is the part which is allowed to throw
     */
    protected function _resolve($aPage, $oPage)
    {
        // getDefaultSpec(), not normalizeSpec(): share_card.php rebuilds the spec through
        // getDefaultSpec() too, and the hash is taken over the whole spec. Filling the defaults on
        // only one of the two paths is what makes an advertised hash miss the recomputed one.
        $aSpec = $this->getDefaultSpec($aPage['share_card'] ?? []);

        if ($aSpec['private']) {
            // the page array describes content an anonymous visitor cannot see, so not one value of
            // it is allowed through: the generic site card replaces the spec wholesale
            $aSpec = $this->getDefaultSpec();
            $aPage = [];
            $oPage = null;
        }

        $sTitle = $aSpec['title'];
        if ($sTitle === '' && !empty($aPage['header']) && is_string($aPage['header']))
            $sTitle = self::cleanText($aPage['header'], 200);
        if ($sTitle === '')
            $sTitle = self::cleanText((string)getParam('site_title'), 200);

        $sDescription = $aSpec['description'];
        if ($sDescription === '' && !empty($aPage['description']) && is_string($aPage['description']))
            $sDescription = $aPage['description'];
        if ($sDescription === '' && $oPage instanceof BxDolPage && ($sMeta = $oPage->getMetaDescription()))
            $sDescription = _t($sMeta);
        if ($sDescription === '')
            $sDescription = (string)getParam('sys_site_description');
        $sDescription = self::cleanText($sDescription, 300);

        // the canonical this page already computed wins. It has to: og:url and <link rel="canonical">
        // disagreeing is worse than either being wrong, and getDefaultSpec() fills `url` with
        // BX_DOL_URL_ROOT, so taking the spec first made every non-content page claim to BE the home
        // page. Deriving it from the page's own uri is not the answer either - sys_home's uri is
        // 'home', and /home is a 301 to /.
        $sUrl = '';
        if (!empty($aPage['url']) && is_string($aPage['url']))
            $sUrl = bx_absolute_url($aPage['url']);
        if ($sUrl === '')
            $sUrl = $aSpec['url'];
        if ($sUrl === '')
            $sUrl = BX_DOL_URL_ROOT;

        $aImage = null;
        if ($this->_canGenerate($aSpec))
            $aImage = [
                'url' => $this->getImageUrl($aSpec),
                'width' => BX_DOL_SHARE_CARD_W,
                'height' => BX_DOL_SHARE_CARD_H,
                'alt' => $sTitle,
                'type' => 'image/jpeg',
            ];

        if (!$aImage && ($sFallback = $this->_getFallbackImageUrl($aSpec, $aPage)) !== '')
            // nothing can be drawn on this install, so point at the best picture which already
            // exists; its dimensions and type are unknown, and empty values are not emitted
            $aImage = ['url' => $sFallback, 'width' => 0, 'height' => 0, 'alt' => $sTitle, 'type' => ''];

        return [
            'type' => $aSpec['type'],
            'title' => $sTitle,
            'description' => $sDescription,
            'url' => $sUrl,
            'site_name' => self::cleanText((string)getParam('site_title'), 200),
            'locale' => $this->_getLocale(),
            'twitter_card' => $aImage ? 'summary_large_image' : 'summary',
            'image' => $aImage,
            'meta' => $aSpec['meta'],
        ];
    }

    /**
     * A card can be drawn as long as there is either a font to write with or a picture to show.
     */
    protected function _canGenerate($aSpec)
    {
        return $this->getFontPath() !== '' || $aSpec['bg'] !== null || $aSpec['image'] !== null;
    }

    protected function _getFallbackImageUrl($aSpec, $aPage)
    {
        if (($sUrl = $this->getImageSpecUrl($aSpec['bg'])) !== '')
            return $sUrl;

        if (($sUrl = $this->getImageSpecUrl($aSpec['image'])) !== '')
            return $sUrl;

        if (!empty($aPage['image']) && is_string($aPage['image']))
            return bx_absolute_url($aPage['image']);

        return '';
    }

    /**
     * `og:locale` wants language_COUNTRY, and a bare language is worse than no tag at all, so an
     * install which does not know the country of its language gets no locale.
     */
    protected function _getLocale()
    {
        $sLang = strtolower(substr((string)bx_lang_name(), 0, 2));
        if (!preg_match('/^[a-z]{2}$/', $sLang))
            return '';

        $sCountry = str_replace('-', '_', trim((string)BxDolLanguages::getInstance()->getLangCountryCode()));

        if (preg_match('/^([a-zA-Z]{2})_([a-zA-Z]{2})$/', $sCountry, $aMatch))
            return strtolower($aMatch[1]) . '_' . strtoupper($aMatch[2]);

        if (preg_match('/^[a-zA-Z]{2}$/', $sCountry))
            return $sLang . '_' . strtoupper($sCountry);

        return '';
    }

    /**
     * The background of the generic site card: the dedicated share image if the site set one, then
     * the common site cover - but only while covers are actually switched on, since a site which
     * turned them off does not expect to see that picture anywhere.
     */
    protected function _getSiteBackground()
    {
        // through the transcoder the Designer's own `cover_share` slot declares, not the raw
        // storage object: Studio stores site images in sys_images with private = 1 and publishes
        // them as a derivative, so the raw reference resolved to nothing and every card fell back
        // to the plain background
        if (($iImage = (int)getParam('sys_site_share_image')) != 0)
            return ['id' => $iImage, 'transcoder' => BX_DOL_TRANSCODER_OBJ_SHARE_IMAGE];

        if (getParam('sys_site_cover_disabled') != 'on' && ($iCover = (int)getParam('sys_site_cover_common')) != 0)
            return ['id' => $iCover, 'transcoder' => BX_DOL_TRANSCODER_OBJ_COVER];

        return null;
    }

    protected function _getSpecForPage($sObject)
    {
        if ($this->_normalizeName($sObject) !== $sObject)
            return false;

        // looked up by object name, not by URI: the entity key stores the object name, and
        // getObjectInstanceByURI() can send a 301 and exit() on a force redirect
        $oPage = BxDolPage::getObjectInstance($sObject);
        if (!$oPage)
            return false;

        $aObject = $oPage->getObject();
        if (!is_array($aObject) || !$aObject)
            return false;

        // a page an anonymous visitor cannot open gets the generic site card
        if (isset($aObject['visible_for_levels']) && !self::isLevelInSet($aObject['visible_for_levels'], MEMBERSHIP_ID_NON_MEMBER))
            return false;

        // The page class is the single producer: it replaces the {site_title} style markers a page
        // title carries, and it already resolves the cover through the same chain a page render uses.
        // Re-deriving any of that here would let the endpoint's hash drift from the advertised one.
        $aOverride = [];
        if (method_exists($oPage, 'getShareCardSpec'))
            $aOverride = $oPage->getShareCardSpec();

        if (!is_array($aOverride) || !$aOverride)
            return false;

        $aOverride['page'] = $sObject;

        // the page class sets `description` itself. This fills only `url`, and only for a third
        // party page class returning a partial spec - `description` is deliberately NOT filled here
        // because it is part of the hash, and filling it on one path only is what broke the caching
        if (empty($aOverride['url']) && !empty($aObject['uri']))
            $aOverride['url'] = bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=' . $aObject['uri']));

        return $this->getDefaultSpec($aOverride);
    }

    protected function _getSpecForContent($sModule, $iId)
    {
        if ($iId <= 0 || $this->_normalizeName($sModule) !== $sModule || $sModule == 'system')
            return false;

        $oContentInfo = BxDolContentInfo::getObjectInstance($sModule);

        // getContentShareCard() lands in a later phase; until then a module simply has no card of
        // its own and the endpoint falls back to the generic site card
        if (!$oContentInfo || !method_exists($oContentInfo, 'getContentShareCard'))
            return false;

        $aSpec = $oContentInfo->getContentShareCard($iId);
        if (!is_array($aSpec) || !$aSpec)
            return false;

        $aSpec['module'] = $sModule;
        $aSpec['id'] = $iId;

        // getDefaultSpec(), not normalizeSpec(), for the same reason _getSpecForPage() uses it: the
        // page render resolves this very card through getDefaultSpec() too, and the hash is taken
        // over the whole spec. They agree today only because every module override happens to return
        // a complete spec; a module that returned a hand-built partial array would have the two
        // sides fill different defaults and put every one of its cards on the stale-hash path.
        $aSpec = $this->getDefaultSpec($aSpec);

        // the module decided this entry is not for anonymous eyes
        return $aSpec['private'] ? false : $aSpec;
    }

    protected function _isFontReadable($sPath)
    {
        // an absolute path only: a relative one would resolve against the working directory of
        // whatever happens to be running, which is not the same in a page render and in cron
        if (!preg_match('#^(/|[A-Za-z]:[\\\\/])#', $sPath) || strpos($sPath, '..') !== false)
            return false;

        return (bool)preg_match('/\.(ttf|otf)$/i', $sPath) && is_file($sPath) && is_readable($sPath);
    }

    protected function _normalizeName($sName)
    {
        if (!is_string($sName))
            return '';

        $sName = substr(trim($sName), 0, 64);

        return preg_match('/^[A-Za-z0-9_\-]+$/', $sName) ? $sName : '';
    }

    protected function _normalizeType($sType)
    {
        if (!is_string($sType))
            return 'website';

        $sType = strtolower(substr(trim($sType), 0, 32));

        return preg_match('/^[a-z0-9][a-z0-9_.\-]*$/', $sType) ? $sType : 'website';
    }

    protected function _normalizeImage($mixedImage)
    {
        if (!is_array($mixedImage) || !$mixedImage)
            return null;

        if (!empty($mixedImage['url']) && is_string($mixedImage['url']))
            return ['url' => bx_absolute_url($mixedImage['url'])];

        $iId = (int)($mixedImage['id'] ?? 0);
        if ($iId <= 0)
            return null;

        if (($sObject = $this->_normalizeName($mixedImage['object'] ?? '')) !== '')
            return ['id' => $iId, 'object' => $sObject];

        if (($sTranscoder = $this->_normalizeName($mixedImage['transcoder'] ?? '')) !== '')
            return ['id' => $iId, 'transcoder' => $sTranscoder];

        return null;
    }

    protected function _normalizeExtra($aExtra)
    {
        if (!is_array($aExtra))
            $aExtra = [];

        $aCounters = is_array($aExtra['counters'] ?? null) ? $aExtra['counters'] : [];

        return [
            'author' => $this->_normalizePerson($aExtra['author'] ?? null, true),
            'published' => max(0, (int)($aExtra['published'] ?? 0)),
            'updated' => max(0, (int)($aExtra['updated'] ?? 0)),
            'category' => self::normalizeText($aExtra['category'] ?? '', 64),
            'counters' => [
                'replies' => max(0, (int)($aCounters['replies'] ?? 0)),
                'views' => max(0, (int)($aCounters['views'] ?? 0)),
                'members' => max(0, (int)($aCounters['members'] ?? 0)),
            ],
            'participants' => $this->_normalizeParticipants($aExtra['participants'] ?? []),
            'participants_total' => max(0, (int)($aExtra['participants_total'] ?? 0)),
            'badges' => $this->_normalizeBadges($aExtra['badges'] ?? []),
            'context' => $this->_normalizePerson($aExtra['context'] ?? null, false),
        ];
    }

    protected function _normalizePerson($aPerson, $bWithLink)
    {
        if (!is_array($aPerson) || !$aPerson)
            return null;

        $aResult = [];
        if ($bWithLink)
            $aResult['id'] = max(0, (int)($aPerson['id'] ?? 0));

        $aResult['name'] = self::normalizeText($aPerson['name'] ?? '', 64);
        $aResult['avatar'] = $this->_normalizeImage($aPerson['avatar'] ?? null);

        if ($bWithLink)
            $aResult['url'] = !empty($aPerson['url']) && is_string($aPerson['url']) ? bx_absolute_url($aPerson['url']) : '';

        if ($aResult['name'] === '' && $aResult['avatar'] === null)
            return null;

        return $aResult;
    }

    protected function _normalizeParticipants($aParticipants)
    {
        if (!is_array($aParticipants))
            return [];

        $aResult = [];
        foreach ($aParticipants as $aOne) {
            if (!is_array($aOne))
                continue;

            $aName = [
                'id' => max(0, (int)($aOne['id'] ?? 0)),
                'name' => self::normalizeText($aOne['name'] ?? '', 64),
                'avatar' => $this->_normalizeImage($aOne['avatar'] ?? null),
            ];

            if ($aName['name'] === '' && $aName['avatar'] === null)
                continue;

            $aResult[] = $aName;

            // a card has room for eight faces and the hash has to stay small
            if (count($aResult) >= 8)
                break;
        }

        return $aResult;
    }

    protected function _normalizeBadges($aBadges)
    {
        if (!is_array($aBadges))
            return [];

        $aResult = [];
        foreach ($aBadges as $sBadge) {
            if (!is_string($sBadge) || ($sBadge = self::normalizeText($sBadge, 32)) === '')
                continue;

            $aResult[] = $sBadge;

            if (count($aResult) >= 8)
                break;
        }

        return $aResult;
    }

    protected function _normalizeMeta($aMeta)
    {
        if (!is_array($aMeta))
            return [];

        $aResult = [];
        foreach ($aMeta as $sKey => $sValue) {
            if (!is_string($sKey) || !preg_match('/^[A-Za-z0-9][A-Za-z0-9_:.\-]{0,63}$/', $sKey))
                continue;
            if (is_array($sValue) || is_object($sValue))
                continue;

            $aResult[$sKey] = self::normalizeText((string)$sValue, 300);

            if (count($aResult) >= 16)
                break;
        }

        ksort($aResult);

        return $aResult;
    }
}

/** @} */
