<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Turns UNA objects into API v2 shapes that every endpoint shares (Profile, dates, ids).
 */
class BxDolApiV2Map
{
    /** How much of a profile's description Profile.about carries. */
    const ABOUT_LENGTH = 1000;

    /** The most links a new post takes (`links`). */
    const LINKS_MAX = 5;

    protected static $_aProfiles = [];
    protected static $_aSummaries = [];
    protected static $_aContents = [];
    protected static $_aKinds = [];
    protected static $_aBadges = [];
    protected static $_aBadgeIcons = [];
    protected static $_aBadgeImages = [];

    /**
     * The copy of a badge's uploaded picture the API links: the site's 180x180 square icon copy
     * (one size for every density), never the upload itself.
     */
    const BADGE_IMAGE_TRANSCODER = BX_DOL_TRANSCODER_OBJ_ICON_APPLE;

    /** Tailwind's 600 shades, the colours Studio offers a badge (sys_colors), as hex. */
    const BADGE_COLORS = [
        'slate-600' => '#475569', 'gray-600' => '#4b5563', 'zinc-600' => '#52525b', 'neutral-600' => '#525252',
        'stone-600' => '#57534e', 'red-600' => '#dc2626', 'orange-600' => '#ea580c', 'amber-600' => '#d97706',
        'yellow-600' => '#ca8a04', 'lime-600' => '#65a30d', 'green-600' => '#16a34a', 'emerald-600' => '#059669',
        'teal-600' => '#0d9488', 'cyan-600' => '#0891b2', 'sky-600' => '#0284c7', 'blue-600' => '#2563eb',
        'indigo-600' => '#4f46e5', 'violet-600' => '#7c3aed', 'purple-600' => '#9333ea', 'fuchsia-600' => '#c026d3',
        'pink-600' => '#db2777', 'rose-600' => '#e11d48',
    ];

    /**
     * The Lucide faces for the Font Awesome reaction icons Lucide has no icon of its own for (UNA's
     * default reactions: Haha, Wow, Sad), as NEO's web set draws them: Wow is a smile, as there.
     */
    const REACTION_ICONS = [
        'laugh-squint' => 'laugh', 'laugh-beam' => 'laugh', 'grin-squint' => 'laugh', 'grin-beam' => 'laugh', 'grin' => 'smile',
        'surprise' => 'smile', 'sad-tear' => 'frown', 'sad-cry' => 'frown', 'grin-hearts' => 'heart',
    ];

    /** UNA's own colour classes (template/css/colors.css), which the reaction list names (`col-red1`), as hex. */
    const SITE_COLORS = [
        'col-red1' => '#d80960', 'col-red2' => '#e7441e', 'col-red3' => '#f38f00', 'col-green1' => '#60ae00',
        'col-green2' => '#d1d300', 'col-green3' => '#307424', 'col-blue1' => '#0a3d8f', 'col-blue2' => '#00a4a5',
        'col-blue3' => '#00a0ce', 'col-gray' => '#616161',
    ];

    public static function id($i)
    {
        return (string)(int)$i;
    }

    public static function idOrNull($i)
    {
        return (int)$i > 0 ? (string)(int)$i : null;
    }

    public static function date($iTimestamp)
    {
        return gmdate('Y-m-d\TH:i:s\Z', (int)$iTimestamp);
    }

    public static function absoluteUrl($sUrl)
    {
        if (!is_string($sUrl) || $sUrl === '')
            return null;
        return self::stableUrl(bx_absolute_url($sUrl));
    }

    /**
     * A link with nothing in it that changes from one request to the next, so the same answer
     * has the same ETag and `version`: the link of an image copy the site has not made yet
     * (image_transcoder.php, BxDolTranscoderImage::getFileUrlNotReady) carries `t=<time()>`,
     * which only keeps browsers from caching it. image_transcoder.php never reads it, and its
     * signature `s` does not cover it, so it is left out.
     */
    public static function stableUrl($sUrl)
    {
        if (!is_string($sUrl) || strpos($sUrl, 'image_transcoder.php?') === false)
            return $sUrl;
        return rtrim(preg_replace('/(?<=[?&])t=\d*(?:&|$)/', '', $sUrl), '&');
    }

    /**
     * Width and height from a storage file's `dimensions` ("640x480"), or nulls when the site
     * does not know them.
     * @return array [width or null, height or null]
     */
    public static function dimensions($sDimensions)
    {
        if (!is_string($sDimensions) || !preg_match('/^\s*(\d{1,6})\s*x\s*(\d{1,6})\s*$/i', $sDimensions, $m) || !(int)$m[1] || !(int)$m[2])
            return [null, null];
        return [(int)$m[1], (int)$m[2]];
    }

    /**
     * Plain text of user HTML, for summaries and profile descriptions.
     */
    public static function text($sHtml, $iMaxLength = 0)
    {
        $s = trim(html_entity_decode(strip_tags(str_replace(['<br>', '<br/>', '<br />', '</p>'], "\n", (string)$sHtml)), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
        if ($iMaxLength > 0 && mb_strlen($s) > $iMaxLength)
            $s = rtrim(mb_substr($s, 0, $iMaxLength - 1)) . '…';
        return $s;
    }

    /**
     * HTML for plain text a client sent, for a field the site stores as HTML: the text is
     * escaped, so a literal `<` stays text, and each line is a paragraph, as the site's editor
     * writes them. text() turns it back into the same lines (blank lines are dropped).
     *
     * The paragraphs are the template api_v2_text_paragraphs.html. Its key is written
     * `<bx_api_v2:text />`, not `__text__`: without the templates cache the parser looks for
     * system keys (`__lang__`, `__main_logo__`) in the filled template too, so in what a member
     * wrote, and escaped text has no `<` for it to find.
     */
    public static function htmlFromText($sText)
    {
        $aLines = [];
        foreach (preg_split('/\r\n|\r|\n/', (string)$sText) as $sLine)
            if (trim($sLine) !== '')
                $aLines[] = ['text' => htmlspecialchars(rtrim($sLine), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')];
        if (!$aLines)
            return '';
        return BxDolTemplate::getInstance()->parseHtmlByName('api_v2_text_paragraphs.html', ['bx_repeat:lines' => $aLines], ['<bx_api_v2:', ' />']);
    }

    /**
     * The `links` of a new post: absolute http(s) URLs to public addresses (the site's own
     * check, bx_remote_url_is_allowed, which its fetch of each page repeats), each once, at most
     * LINKS_MAX. A comma is written %2C: the site's post form takes them as one comma-separated
     * value.
     * @return array the URLs, or a 422 problem naming `links[i]`
     */
    public static function links($mLinks, $sField = 'links')
    {
        if (!is_array($mLinks))
            throw BxDolApiV2Problem::validation([['field' => $sField, 'code' => 'invalid', 'message' => 'Send a list of links']]);
        if (count($mLinks) > self::LINKS_MAX)
            throw BxDolApiV2Problem::validation([['field' => $sField, 'code' => 'too_many', 'message' => 'At most ' . self::LINKS_MAX . ' links']]);

        $aResult = [];
        foreach (array_values($mLinks) as $i => $sUrl) {
            $sUrl = is_string($sUrl) ? trim($sUrl) : '';
            if ($sUrl === '' || get_mb_len($sUrl) > 2000 || !preg_match('#^https?://#i', $sUrl))
                throw BxDolApiV2Problem::validation([['field' => $sField . '[' . $i . ']', 'code' => 'invalid', 'message' => 'An absolute http or https link']]);
            if (!bx_remote_url_is_allowed($sUrl))
                throw BxDolApiV2Problem::validation([['field' => $sField . '[' . $i . ']', 'code' => 'not_allowed', 'message' => 'The site does not read links to this address']]);
            $aResult[] = str_replace(',', '%2C', $sUrl);
        }
        return array_values(array_unique($aResult));
    }

    /**
     * Whether user HTML is only text in paragraphs and line breaks, so that text() and
     * htmlFromText() keep all of it. Links, mentions and formatting are markup that plain text
     * would lose.
     */
    public static function isPlainHtml($sHtml)
    {
        return !preg_match('/<(?!\/?p>|br\s*\/?>)/i', (string)$sHtml);
    }

    /**
     * Whether a profile's description is longer than Profile.about carries.
     */
    public static function aboutTruncated($sHtml)
    {
        return get_mb_len(self::text($sHtml)) > self::ABOUT_LENGTH;
    }

    /**
     * A profile as the full Profile schema (description, cover, dates), or null when it doesn't
     * exist (anymore). Only for a profile the viewer may open: the caller checks that (GET
     * /profiles/{id} through the module's view check, /me for the account's own profiles).
     * Everywhere else a profile is embedded as profileSummary(), the same Profile shape with
     * no description or cover.
     */
    public static function profile($iProfileId)
    {
        $iProfileId = (int)$iProfileId;
        if (array_key_exists($iProfileId, self::$_aProfiles))
            return self::$_aProfiles[$iProfileId];

        $oProfile = $iProfileId > 0 ? BxDolProfile::getInstance($iProfileId) : false;
        if (!$oProfile)
            return self::$_aProfiles[$iProfileId] = null;

        $sModule = $oProfile->getModule();
        $aContent = self::profileContent($oProfile);
        $CNF = self::profileCnf($sModule);
        $sUrl = self::absoluteUrl($oProfile->getUrl()); // makes the page's SEO link the handle comes from
        $bPicture = !empty($aContent[$CNF['FIELD_PICTURE'] ?? '']);

        return self::$_aProfiles[$iProfileId] = [
            'id' => self::id($iProfileId),
            'kind' => self::profileKind($sModule),
            'module' => $sModule,
            'handle' => self::profileHandle($oProfile),
            'display_name' => $oProfile->getDisplayName(),
            'about' => self::text($aContent[$CNF['FIELD_TEXT'] ?? ''] ?? '', self::ABOUT_LENGTH),
            'about_truncated' => self::aboutTruncated($aContent[$CNF['FIELD_TEXT'] ?? ''] ?? ''),
            'status' => self::profileStatus($oProfile),
            // null when there is none, rather than the site's placeholder picture
            'avatar' => $bPicture ? self::absoluteUrl($oProfile->getAvatar()) : null,
            'avatar_large' => $bPicture ? self::absoluteUrl($oProfile->getAvatarBig()) : null,
            'cover' => !empty($aContent[$CNF['FIELD_COVER'] ?? '']) ? self::absoluteUrl($oProfile->getCover()) : null,
            'url' => $sUrl,
            'created_at' => self::date($aContent[$CNF['FIELD_ADDED'] ?? ''] ?? 0),
        ] + self::badgesField($iProfileId);
    }

    /**
     * The profile's handle: the last part of its page's address on the site, its SEO link
     * (`lily-carter` in `/view-persons-profile/lily-carter`). Unique within a profile module;
     * null while the site has SEO links off or the page has none yet.
     */
    public static function profileHandle($oProfile)
    {
        if (!getParam('permalinks_seo_links'))
            return null;

        $sModule = $oProfile->getModule();
        $CNF = self::profileCnf($sModule);
        if (empty($CNF['URI_VIEW_ENTRY']))
            return null;

        $a = BxDolPageQuery::getSeoLink($sModule, $CNF['URI_VIEW_ENTRY'], ['param_value' => (string)(int)$oProfile->getContentId()]);
        return is_array($a) && ($a['param_name'] ?? '') === 'id' && ($a['uri'] ?? '') !== '' ? (string)$a['uri'] : null;
    }

    /**
     * The profile a handle names, 0 when none does. A handle is unique only within its module,
     * so when two profile modules have the same one the oldest profile (lowest id) wins.
     */
    public static function profileIdByHandle($sHandle)
    {
        $sHandle = mb_strtolower(trim((string)$sHandle));
        if ($sHandle === '' || get_mb_len($sHandle) > 50 || !getParam('permalinks_seo_links'))
            return 0;

        // persons and organizations, and contexts (groups, events, ...), which are profiles too
        $aModules = [];
        foreach (['profile', 'context'] as $sType)
            foreach (bx_srv('system', 'get_modules_by_type', [$sType]) as $aModule)
                $aModules[$aModule['name']] = $aModule;

        $aIds = [];
        foreach ($aModules as $aModule) {
            $CNF = self::profileCnf($aModule['name']);
            if (empty($CNF['URI_VIEW_ENTRY']))
                continue;

            $a = BxDolPageQuery::getSeoLink($aModule['name'], $CNF['URI_VIEW_ENTRY'], ['uri' => $sHandle]);
            if (!is_array($a) || ($a['param_name'] ?? '') !== 'id')
                continue;

            if (($oProfile = BxDolProfile::getInstanceByContentAndType((int)$a['param_value'], $aModule['name'])))
                $aIds[] = (int)$oProfile->id();
        }

        return $aIds ? min($aIds) : 0;
    }

    /**
     * A profile as embedded in other resources (authors, actors, participants), in the Profile
     * shape: what an author unit on the site shows, the name, picture,
     * handle and page, and no more. `about` is empty and `cover` null, since only the
     * module's view check (GET /profiles/{id}) shows those. The picture follows the profile's
     * own privacy (the module's checkAllowedViewProfileImage), as on the site. Null when the
     * profile doesn't exist (anymore).
     */
    public static function profileSummary($iProfileId)
    {
        $iProfileId = (int)$iProfileId;
        if (array_key_exists($iProfileId, self::$_aSummaries))
            return self::$_aSummaries[$iProfileId];

        $oProfile = $iProfileId > 0 ? BxDolProfile::getInstance($iProfileId) : false;
        if (!$oProfile)
            return self::$_aSummaries[$iProfileId] = null;

        $sModule = $oProfile->getModule();
        $aContent = self::profileContent($oProfile);
        $CNF = self::profileCnf($sModule);

        $bPicture = !empty($aContent[$CNF['FIELD_PICTURE'] ?? '']);
        if ($bPicture && $sModule !== 'system' && ($oModule = BxDolModule::getInstance($sModule)) && method_exists($oModule, 'checkAllowedViewProfileImage'))
            $bPicture = $oModule->checkAllowedViewProfileImage($aContent) === CHECK_ACTION_RESULT_ALLOWED;

        $sUrl = self::absoluteUrl($oProfile->getUrl()); // makes the page's SEO link the handle comes from

        // the join date is on the profile's page: only for a viewer who may open it (a private
        // person who comments in a public group shows a name and a picture, as on the site)
        $iAdded = (int)($aContent[$CNF['FIELD_ADDED'] ?? ''] ?? 0);
        if ($iAdded > 0 && $sModule !== 'system' && ($oModule = $oModule ?? BxDolModule::getInstance($sModule)) && method_exists($oModule, 'checkAllowedView') && $oModule->checkAllowedView($aContent) !== CHECK_ACTION_RESULT_ALLOWED)
            $iAdded = 0;

        return self::$_aSummaries[$iProfileId] = [
            'id' => self::id($iProfileId),
            'kind' => self::profileKind($sModule),
            'module' => $sModule,
            'handle' => self::profileHandle($oProfile),
            'display_name' => $oProfile->getDisplayName(),
            'about' => '',
            'status' => self::profileStatus($oProfile),
            'avatar' => $bPicture ? self::absoluteUrl($oProfile->getAvatar()) : null,
            'cover' => null,
            'url' => $sUrl,
            'created_at' => self::date($iAdded),
        ] + self::badgesField($iProfileId);
    }

    /**
     * Read the badges of a page's profiles in one query, so that profile() and profileSummary()
     * of each need none. An endpoint that lists many profiles (authors, actors, members) calls
     * it with their ids before it maps them; a profile not read this way is read alone.
     */
    public static function primeBadges($aProfileIds)
    {
        $aIds = [];
        foreach ((array)$aProfileIds as $mId)
            if (($i = (int)$mId) > 0 && !array_key_exists($i, self::$_aBadges))
                $aIds[$i] = $i;
        if (!$aIds)
            return;

        $aRows = BxDolBadges::getInstance()->getByProfileIds(array_values($aIds));
        foreach ($aIds as $i) {
            $aBadges = [];
            foreach ($aRows[$i] ?? [] as $aRow)
                $aBadges[] = self::badge($aRow);
            self::$_aBadges[$i] = $aBadges;
        }
    }

    /**
     * What profileSummary() of a page's profiles reads, read at once: their badges, rows,
     * entries and those entries' privacy (kept in memory as the site keeps them), and inside
     * the scopes a page opens (BxDolStorageQuery::openFileRowsScope with
     * BxDolTranscoderQuery::openHandlersScope, BxDolPageQuery::openSeoLinksScope) their
     * pictures' avatar copies and the SEO links of their pages, a query per module and table
     * instead of a few per profile. Outside the scopes only the badges.
     */
    public static function primeProfiles($aProfileIds)
    {
        $aIds = array_values(array_unique(array_filter(array_map('intval', (array)$aProfileIds), function ($i) { return $i > 0; })));
        self::primeBadges($aIds);
        BxDolProfileQuery::getInstance()->primeInfos($aIds);

        $aByModule = [];
        foreach ($aIds as $iId)
            if (!array_key_exists($iId, self::$_aSummaries) && ($oProfile = BxDolProfile::getInstance($iId)) && ($sModule = $oProfile->getModule()) !== 'system')
                $aByModule[$sModule][] = $oProfile;

        $bSeo = (bool)getParam('permalinks_seo_links');
        foreach ($aByModule as $sModule => $aProfiles) {
            $CNF = self::profileCnf($sModule);
            if (!$CNF)
                continue;
            // their entries and those entries' privacy (the picture's and the page's checks)
            $aContentIds = array_map(function ($oProfile) { return (int)$oProfile->getContentId(); }, $aProfiles);
            $oModule = BxDolModule::getInstance($sModule);
            if ($oModule && is_object($oDb = $oModule->_oDb) && method_exists($oDb, 'primeContentInfos'))
                $oDb->primeContentInfos($aContentIds);
            if (!empty($CNF['OBJECT_PRIVACY_VIEW']) && ($oPrivacy = BxDolPrivacy::getObjectInstance($CNF['OBJECT_PRIVACY_VIEW'])))
                $oPrivacy->primeObjects($aContentIds);

            $aPictures = [];
            foreach ($aProfiles as $oProfile) {
                $aContent = self::profileContent($oProfile);
                if (!empty($CNF['FIELD_PICTURE']) && (int)($aContent[$CNF['FIELD_PICTURE']] ?? 0) > 0)
                    $aPictures[] = (int)$aContent[$CNF['FIELD_PICTURE']];
            }
            if ($bSeo && !empty($CNF['URI_VIEW_ENTRY']))
                BxDolPageQuery::primeSeoLinks($sModule, $CNF['URI_VIEW_ENTRY'], $aContentIds);
            if ($aPictures && !empty($CNF['OBJECT_STORAGE']) && ($oStorage = BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE']))) {
                $oStorage->primeFileRows($aPictures);
                BxDolTranscoder::primeFiles([$CNF['OBJECT_IMAGES_TRANSCODER_AVATAR'] ?? ''], $aPictures);
            }
        }
    }

    /**
     * The Profile's `badges`: the badges the site shows next to the profile's name (its
     * module's get_badges: every badge of the module given to the profile's entry, for any
     * viewer), in that order; [] when it has none, which leaves the field out.
     */
    public static function profileBadges($iProfileId)
    {
        $iProfileId = (int)$iProfileId;
        if ($iProfileId <= 0)
            return [];
        if (!array_key_exists($iProfileId, self::$_aBadges))
            self::primeBadges([$iProfileId]);
        return self::$_aBadges[$iProfileId];
    }

    protected static function badgesField($iProfileId)
    {
        $a = self::profileBadges($iProfileId);
        return $a ? ['badges' => $a] : [];
    }

    /**
     * A badge (a sys_badges row) as a Badge: the text in the viewer's language, the
     * icon as a Lucide name, the colour as hex; `image` for a badge whose icon is an uploaded
     * picture and `icon_only` for one the site shows without its text, each left out otherwise.
     */
    public static function badge($aRow)
    {
        $sIcon = (string)$aRow['icon'];
        $a = [
            'id' => self::id($aRow['id']),
            'name' => self::text(_t((string)$aRow['text'])),
            'icon' => self::badgeIcon($sIcon),
            'color' => self::badgeColor((string)$aRow['color']),
        ];
        if (($sImage = self::badgeImage($sIcon)) !== null)
            $a['image'] = $sImage;
        if ((int)($aRow['is_icon_only'] ?? 0) === 1)
            $a['icon_only'] = true;
        return $a;
    }

    /**
     * The link of a badge's uploaded picture: Studio keeps it in the site's image storage and
     * its id in the badge's icon. A display copy (BADGE_IMAGE_TRANSCODER), as an absolute URL
     * that is the same from one request to the next; null for an icon that is no upload, or
     * an upload that is gone, no image, or an SVG (which has no copy).
     */
    public static function badgeImage($sIcon)
    {
        $sIcon = trim($sIcon);
        if (!ctype_digit($sIcon) || ($iFileId = (int)$sIcon) <= 0)
            return null;
        // the same badge comes once per profile that has it: link each picture once a request
        if (array_key_exists($iFileId, self::$_aBadgeImages))
            return self::$_aBadgeImages[$iFileId];

        $sUrl = null;
        $aFile = self::fileRow(BX_DOL_STORAGE_OBJ_IMAGES, $iFileId);
        $sMime = $aFile ? (string)$aFile['mime_type'] : '';
        // an SVG has no resized copy: the transcoder would link the upload itself
        if (str_starts_with($sMime, 'image/') && !BxDolStorage::getObjectInstance(BX_DOL_STORAGE_OBJ_IMAGES)->isMimeTypeSvg($sMime) && ($oTranscoder = BxDolTranscoderImage::getObjectInstance(self::BADGE_IMAGE_TRANSCODER)))
            $sUrl = self::absoluteUrl((string)$oTranscoder->getFileUrl($iFileId));
        return self::$_aBadgeImages[$iFileId] = $sUrl;
    }

    /**
     * The Lucide icon a badge's icon code draws: a Lucide name, or a Font Awesome one the
     * site's Lucide set maps (`shield-alt` is `shield`); null for none, an uploaded image, an
     * emoji or HTML, which the shape has no place for.
     */
    public static function badgeIcon($sIcon)
    {
        $sIcon = trim($sIcon);
        if ($sIcon === '' || is_numeric($sIcon))
            return null;
        // the same badge comes once per profile that has it: map each code once a request
        if (array_key_exists($sIcon, self::$_aBadgeIcons))
            return self::$_aBadgeIcons[$sIcon];
        $oIconset = BxDolIconset::getObjectInstance('sys_lucide');
        $s = $oIconset && method_exists($oIconset, 'getLucideName') ? $oIconset->getLucideName($sIcon) : false;
        return self::$_aBadgeIcons[$sIcon] = is_string($s) && $s !== '' ? $s : null;
    }

    /**
     * The Lucide icon a reaction's icon code draws, as for a badge (badgeIcon), and for the Font
     * Awesome faces Lucide lacks (`fa-laugh-squint`), the face NEO's web set draws for it
     * (REACTION_ICONS); null for none.
     */
    public static function reactionIcon($sIcon)
    {
        if (($s = self::badgeIcon($sIcon)) !== null)
            return $s;
        foreach (preg_split('/\s+/', mb_strtolower(trim((string)$sIcon))) as $sPart) {
            $sName = str_starts_with($sPart, 'fa-') ? mb_substr($sPart, 3) : $sPart;
            if (isset(self::REACTION_ICONS[$sName]))
                return self::REACTION_ICONS[$sName];
        }
        return null;
    }

    /**
     * A reaction's colour as CSS hex: the reaction list names one of UNA's colour classes
     * (`sys-colored col-red1`), or a value a badge could have (badgeColor); null for none.
     */
    public static function reactionColor($sColor)
    {
        $sColor = mb_strtolower(trim((string)$sColor));
        if ($sColor === '')
            return null;
        foreach (preg_split('/\s+/', $sColor) as $sPart)
            if (isset(self::SITE_COLORS[$sPart]))
                return self::SITE_COLORS[$sPart];
        return str_contains($sColor, ' ') ? null : self::badgeColor($sColor);
    }

    /**
     * A badge's colour as CSS hex: Studio stores a Tailwind colour name (`blue-600`), an
     * `rgb()` value, or nothing, which the site draws as `purple-600`. Null for anything else.
     */
    public static function badgeColor($sColor)
    {
        $sColor = mb_strtolower(trim($sColor));
        if ($sColor === '')
            $sColor = 'purple-600';
        if (isset(self::BADGE_COLORS[$sColor]))
            return self::BADGE_COLORS[$sColor];
        if (preg_match('/^#([0-9a-f]{3}|[0-9a-f]{6})$/', $sColor))
            return $sColor;
        if (preg_match('/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(,\s*[0-9.]+\s*)?\)$/', $sColor, $m) && max($m[1], $m[2], $m[3]) <= 255)
            return sprintf('#%02x%02x%02x', $m[1], $m[2], $m[3]);
        return null;
    }

    public static function profileStatus($oProfile)
    {
        $s = $oProfile->getStatus();
        return in_array($s, ['active', 'pending', 'suspended'], true) ? $s : 'pending';
    }

    /**
     * person, organization or group, from what the module says about itself, so a new
     * profile module needs no change here. The answer is per module, so it is asked once.
     */
    public static function profileKind($sModule)
    {
        if (isset(self::$_aKinds[$sModule]))
            return self::$_aKinds[$sModule];

        $sKind = 'person';
        if ($sModule !== 'system' && BxDolRequest::serviceExists($sModule, 'act_as_profile')) {
            $bActsAsProfile = (bool)bx_srv($sModule, 'act_as_profile');
            if (BxDolRequest::serviceExists($sModule, 'is_group_profile') && bx_srv($sModule, 'is_group_profile'))
                $sKind = $bActsAsProfile ? 'organization' : 'group';
        }

        return self::$_aKinds[$sModule] = $sKind;
    }

    /**
     * The profile's content entry in its module, read once per request.
     */
    public static function profileContent($oProfile)
    {
        $iProfileId = (int)$oProfile->id();
        if (isset(self::$_aContents[$iProfileId]))
            return self::$_aContents[$iProfileId];

        $sModule = $oProfile->getModule();
        $a = BxDolRequest::serviceExists($sModule, 'get_content_info_by_id') ? bx_srv($sModule, 'get_content_info_by_id', [$oProfile->getContentId()]) : [];
        return self::$_aContents[$iProfileId] = is_array($a) ? $a : [];
    }

    /**
     * Forget what this request read (tests, and after a change in the same request).
     */
    public static function reset()
    {
        self::$_aProfiles = self::$_aSummaries = self::$_aContents = self::$_aKinds = self::$_aBadges = self::$_aBadgeIcons = self::$_aBadgeImages = [];
    }

    /**
     * A ModuleInfo of GET /api/v2: the module, the tag of its paths, its title as the site
     * names it (Studio's title, in the viewer's language) and the kind of its entries.
     */
    public static function moduleInfo($sModule, $sTag, $sKind)
    {
        $aModule = BxDolModuleQuery::getInstance()->getModuleByName($sModule);
        $sTitle = is_array($aModule) && !empty($aModule['title']) ? self::text(_t($aModule['title'])) : '';
        return ['module' => $sModule, 'tag' => $sTag, 'title' => $sTitle !== '' ? $sTitle : $sTag, 'kind' => $sKind];
    }

    public static function profileCnf($sModule)
    {
        $oModule = $sModule !== 'system' ? BxDolModule::getInstance($sModule) : null;
        return $oModule && isset($oModule->_oConfig->CNF) ? $oModule->_oConfig->CNF : [];
    }

    public static function profileSchema()
    {
        return [
            'type' => 'object',
            'description' => 'A profile, with `module` and `url`. Embedded in other resources (authors, actors, members, search hits) it has no description or cover: `about` is empty and `cover` null; GET /profiles/{id} has them.',
            'required' => ['id', 'kind', 'display_name', 'about', 'status', 'created_at'],
            'properties' => [
                'id' => ['$ref' => '#/components/schemas/Id'],
                'kind' => ['$ref' => '#/components/schemas/ProfileKind'],
                'module' => ['type' => 'string', 'description' => 'The UNA module the profile belongs to (v2 only)', 'example' => 'bx_persons'],
                'handle' => ['type' => ['string', 'null'], 'description' => 'The last part of the profile page\'s address on the site, for GET /profiles/by-handle/{handle}; null when the site has none', 'example' => 'lily-carter'],
                'display_name' => ['type' => 'string'],
                'about' => ['type' => 'string', 'maxLength' => self::ABOUT_LENGTH, 'description' => 'Plain text, at most ' . self::ABOUT_LENGTH . ' characters: a longer description is cut, ending in …. Empty in an embedded profile'],
                'about_truncated' => ['type' => 'boolean', 'description' => 'The description is longer than `about` carries; PATCH /profiles/{id} does not change such an about (409 `too_long`): it is edited on the site. Not in an embedded profile (v2 only)'],
                'status' => ['$ref' => '#/components/schemas/ProfileStatus'],
                'avatar' => ['type' => ['string', 'null'], 'format' => 'uri', 'description' => 'The square picture (100x100); null when there is none or the viewer may not see it. An absolute URL; resolve it against the API\'s origin (`new URL(avatar, origin)`)'],
                'avatar_large' => ['type' => ['string', 'null'], 'format' => 'uri', 'description' => 'The same picture at 200x200, for large places; null exactly when `avatar` is. Not in an embedded profile (v2 only)'],
                'cover' => ['type' => ['string', 'null'], 'format' => 'uri', 'description' => 'The wide banner; null in an embedded profile'],
                'url' => ['type' => ['string', 'null'], 'format' => 'uri', 'description' => 'The profile page on the site (v2 only)'],
                'created_at' => ['type' => 'string', 'format' => 'date-time', 'description' => 'When the profile joined. In an embedded profile only for a viewer who may open the profile\'s page; otherwise, and for a profile with no date (the site\'s own), `1970-01-01T00:00:00Z`: unknown'],
                'badges' => [
                    'type' => 'array',
                    'minItems' => 1,
                    'items' => ['$ref' => '#/components/schemas/ProfileBadge'],
                    'description' => 'The badges the site shows next to the name, to any viewer, in the order to show them; left out when the profile has none',
                ],
            ],
        ];
    }

    public static function badgeSchema()
    {
        return [
            'type' => 'object',
            'description' => 'A badge given to a profile (Studio > Badges)',
            'required' => ['id', 'name', 'icon', 'color'],
            'properties' => [
                'id' => ['$ref' => '#/components/schemas/Id'],
                'name' => ['type' => 'string', 'description' => 'The badge\'s text in the viewer\'s language, sent for an `icon_only` badge too, where it labels the icon for screen readers; may be empty', 'example' => 'Moderator'],
                'icon' => ['type' => ['string', 'null'], 'description' => 'A Lucide icon name; null when the badge has none, or one that is not a Lucide or Font Awesome name (an uploaded image, which is `image`; an emoji)', 'example' => 'shield-check'],
                'color' => ['type' => ['string', 'null'], 'pattern' => '^#([0-9a-f]{3}|[0-9a-f]{6})$', 'description' => 'The badge\'s colour, CSS hex; null when the site\'s value is not a colour', 'example' => '#2563eb'],
                'image' => ['type' => 'string', 'format' => 'uri', 'description' => 'The picture uploaded as the badge\'s icon: an absolute URL of a 180x180 square copy; resolve it against the API\'s origin. Clients draw it instead of `icon`. Left out when the badge has none, or its picture is an SVG, which has no such copy', 'example' => 'https://example.com/storage/resized/abc.png'],
                'icon_only' => ['type' => 'boolean', 'description' => 'The site shows the badge as its icon or `image` alone, without `name` (Studio\'s "Icon only"); clients do too and give `name` to screen readers and tooltips. Left out when false'],
            ],
        ];
    }

    /**
     * An embedded Profile or null, for properties of other schemas.
     */
    public static function profileOrNullSchema()
    {
        return ['oneOf' => [['$ref' => '#/components/schemas/Profile'], ['type' => 'null']]];
    }

    /**
     * The id of an upload, and of a media item of a known storage: the storage object's id in
     * the high 32 bits, the file id in the low ones. File ids are unique only within a storage.
     */
    public static function uploadId($iStorageId, $iFileId)
    {
        return self::id(((int)$iStorageId << 32) | ((int)$iFileId & 0xFFFFFFFF));
    }

    /**
     * The storage object id and the file id an upload id holds ([0, 0] for one that is none).
     * @return array [storage object id, file id]
     */
    public static function uploadParts($mId)
    {
        if (!is_scalar($mId) || !preg_match('/^[1-9][0-9]{0,18}$/', (string)$mId))
            return [0, 0];
        $iId = (int)$mId;
        return [$iId >> 32, $iId & 0xFFFFFFFF];
    }

    /**
     * A file's row of a storage, read with the storage's query object, not BxDolStorage::getFile,
     * which fills in missing dimensions by downloading the file: a list must not do that.
     */
    public static function fileRow($sStorage, $iFileId)
    {
        static $aQueries = [];

        if (!array_key_exists($sStorage, $aQueries)) {
            $aObject = BxDolStorageQuery::getStorageObject($sStorage);
            $aQueries[$sStorage] = !empty($aObject['table_files']) ? new BxDolStorageQuery($aObject) : null;
        }
        $aFile = $aQueries[$sStorage] ? $aQueries[$sStorage]->getFileById((int)$iFileId) : null;
        return is_array($aFile) && $aFile ? $aFile : null;
    }

    /**
     * The link of a stored file's original: for a private file a token link, whose token is
     * reused while it has at least half its life left (BxDolStorage::getFileUrlByIdShared), so
     * repeated GETs give the same body and ETag and write no token row. Null when the storage
     * or the file is not there.
     */
    public static function fileUrl($sStorage, $iFileId)
    {
        static $aUrls = [];

        $sKey = $sStorage . ':' . (int)$iFileId;
        if (!array_key_exists($sKey, $aUrls)) {
            $oStorage = $sStorage !== '' && (int)$iFileId > 0 ? BxDolStorage::getObjectInstance($sStorage) : null;
            $aUrls[$sKey] = $oStorage ? self::absoluteUrl((string)$oStorage->getFileUrlByIdShared((int)$iFileId)) : null;
        }
        return $aUrls[$sKey];
    }

    /**
     * Inside the scopes a page opens (BxDolStorageQuery::openFileRowsScope), with the files' rows
     * primed: the links of the originals that go to the viewer as their owner (photoMedia,
     * videoMedia: a private file's reused token) read at once, so a member's own page costs no
     * query per file.
     */
    public static function primeOwnOriginals($sStorage, $aFileIds)
    {
        $iViewerId = (int)bx_get_logged_profile_id();
        if ($iViewerId <= 0 || $sStorage === '' || !($oStorage = BxDolStorage::getObjectInstance($sStorage)))
            return;
        $aOwn = [];
        foreach ((array)$aFileIds as $iFileId)
            if (($aFile = self::fileRow($sStorage, (int)$iFileId)) && (int)($aFile['profile_id'] ?? 0) === $iViewerId)
                $aOwn[] = (int)$iFileId;
        if ($aOwn)
            $oStorage->primeFileUrlsShared($aOwn);
    }

    /**
     * The size of a transcoder's copy of a file of this size: the original fitted into the
     * transcoder's Resize box (never enlarged), or the box itself for a square or cropped copy.
     * [0, 0] when the original's size or the transcoder is not known: the site does not keep
     * the sizes of its copies.
     * @return array [width, height]
     */
    public static function variantSize($sTranscoder, $iWidth, $iHeight)
    {
        $o = $sTranscoder !== '' ? BxDolTranscoder::getObjectInstance($sTranscoder) : null;
        if (!$o)
            return [0, 0];

        $a = $o->getFilterParams('Resize');
        $iBoxW = is_array($a) ? (int)($a['w'] ?? 0) : 0;
        $iBoxH = is_array($a) ? (int)($a['h'] ?? 0) : 0;
        if (is_array($a) && (!empty($a['square_resize']) || !empty($a['crop_resize'])) && ($iBoxW || $iBoxH))
            return !empty($a['square_resize']) ? [$iBoxW ?: $iBoxH, $iBoxW ?: $iBoxH] : [$iBoxW ?: $iBoxH, $iBoxH ?: $iBoxW];

        if (!$iWidth || !$iHeight)
            return [0, 0];

        $f = 1.0;
        if ($iBoxW > 0)
            $f = min($f, $iBoxW / $iWidth);
        if ($iBoxH > 0)
            $f = min($f, $iBoxH / $iHeight);
        return [max(1, (int)round($iWidth * $f)), max(1, (int)round($iHeight * $f))];
    }

    /**
     * Media: the original file's facts from its storage row, its link as `url`
     * and `download_url`, and its copies as `variants`.
     * @param string $sId the media id (uploadId)
     * @param string $sKind image or video
     * @param string $sState ready, processing or failed
     * @param string $sStorage the storage object, '' when the file is not of a known storage
     * @param int $iFileId the file id in that storage
     * @param array $aVariants name => [url or null, transcoder object or ''], the copies there are; one without a url is left out
     * @param string|null $sFallbackUrl the url when the original's is not known (a file of no known storage)
     * @param bool $bOriginalToAll a private original goes to every viewer of the media (the
     *        site hands it to them too: a message's photo); otherwise only to the file's owner,
     *        and everyone else gets the largest copy as `url`, as the site shows only copies
     *        (an original keeps the camera's metadata, its location included)
     * @param bool $bOwnerOnly the original goes only to the file's owner even when the storage
     *        keeps it public (a content module's upload: the site plays and shows its copies)
     */
    public static function media($sId, $sKind, $sState, $sStorage, $iFileId, array $aVariants, $sFallbackUrl = null, $bOriginalToAll = false, $bOwnerOnly = false)
    {
        $aFile = $sStorage !== '' && (int)$iFileId > 0 ? self::fileRow($sStorage, $iFileId) : null;
        $aSize = self::dimensions($aFile['dimensions'] ?? '');

        $iViewerId = (int)bx_get_logged_profile_id();
        $bOwner = $iViewerId > 0 && (int)($aFile['profile_id'] ?? 0) === $iViewerId;
        $bOriginal = $aFile && ($bOwnerOnly ? $bOwner : ($bOriginalToAll || empty($aFile['private']) || $bOwner));
        $sUrl = $bOriginal ? self::fileUrl($sStorage, $iFileId) : null;

        $aCopies = [];
        foreach ($aVariants as $sName => list($sCopyUrl, $sTranscoder)) {
            if (($sCopyUrl = self::absoluteUrl((string)$sCopyUrl)) === null)
                continue;
            // a copy that is the original itself has the original's size
            list($iW, $iH) = $sTranscoder === null ? [(int)$aSize[0], (int)$aSize[1]] : self::variantSize($sTranscoder, (int)$aSize[0], (int)$aSize[1]);
            $aCopies[$sName] = ['url' => $sCopyUrl, 'width' => $iW, 'height' => $iH];
        }

        $sMime = !empty($aFile['mime_type']) ? (string)$aFile['mime_type'] : 'application/octet-stream';
        if ($sUrl === null && $aFile && !$bOriginal)
            foreach ($sKind === 'video' ? ['mp4', 'poster', 'large', 'medium', 'thumb'] : ['large', 'medium', 'thumb', 'mp4', 'poster'] as $sName)
                if (isset($aCopies[$sName])) {
                    $sUrl = $aCopies[$sName]['url'];
                    // the type of the copy `url` is: the site's video copies are mp4 and their
                    // stills jpeg; an image's copies keep its type
                    if ($sName === 'mp4')
                        $sMime = 'video/mp4';
                    elseif ($sKind === 'video')
                        $sMime = 'image/jpeg';
                    break;
                }
        if ($sUrl === null)
            $sUrl = self::absoluteUrl((string)$sFallbackUrl) ?? '';

        return [
            'id' => (string)$sId,
            'kind' => $sKind,
            'mime' => $sMime,
            // the original's size and name only with the original: its name often tells who or
            // where, and its size is not that of the copy `url` is
            'size' => $bOriginal && isset($aFile['size']) ? (int)$aFile['size'] : 0,
            'state' => $sState,
            'original_name' => $bOriginal && isset($aFile['file_name']) ? (string)$aFile['file_name'] : '',
            'url' => $sUrl,
            // the site sends images and videos inline and other files as downloads: it has no other link
            'download_url' => $sUrl,
            // an object even when empty (a processing video)
            'variants' => $aCopies ?: new stdClass(),
            'width' => $aSize[0],
            'height' => $aSize[1],
            // the site keeps no video length (only ffmpeg could tell it)
            'duration_ms' => null,
        ];
    }

    /**
     * A stored image as Media: copies of $sThumbTranscoder as `thumb` and of $sUrlTranscoder as
     * `medium` (the original where one is not given or not there), the original as `large`.
     * Null for a file that is not there or not an image. For the files whose originals the
     * site hands to everyone who sees them (a message's photos, the viewer's own uploads).
     */
    public static function imageMedia($sStorage, $iFileId, $sThumbTranscoder = '', $sUrlTranscoder = '')
    {
        $aObject = BxDolStorageQuery::getStorageObject($sStorage);
        $aFile = !empty($aObject['id']) ? self::fileRow($sStorage, $iFileId) : null;
        if (!$aFile || !str_starts_with((string)$aFile['mime_type'], 'image/') || ($sOriginal = self::fileUrl($sStorage, $iFileId)) === null)
            return null;

        $fCopy = function ($sTranscoder) use ($iFileId, $sOriginal) {
            $o = $sTranscoder !== '' ? BxDolTranscoderImage::getObjectInstance($sTranscoder) : null;
            $sUrl = $o ? self::absoluteUrl((string)$o->getFileUrl((int)$iFileId)) : null;
            return $sUrl !== null ? [$sUrl, $sTranscoder] : [$sOriginal, null];
        };

        return self::media(self::uploadId((int)$aObject['id'], (int)$iFileId), 'image', 'ready', $sStorage, $iFileId, [
            'thumb' => $fCopy($sThumbTranscoder),
            'medium' => $fCopy($sUrlTranscoder),
            'large' => [$sOriginal, null],
        ], null, true);
    }

    /**
     * A content module's stored photo as Media: the copies of its transcoders as `thumb`,
     * `medium` and `large` (each one that is given; one not given or not there is left out), and
     * the original only for its owner, as the site shows others its copies (an original keeps
     * the camera's metadata, its location included). Null for a file that is not there or not an
     * image.
     * @param array $aTranscoders 'thumb', 'medium', 'large' => transcoder object ('' for none)
     */
    public static function photoMedia($sStorage, $iFileId, array $aTranscoders)
    {
        $aObject = BxDolStorageQuery::getStorageObject($sStorage);
        $aFile = !empty($aObject['id']) && (int)$iFileId > 0 ? self::fileRow($sStorage, $iFileId) : null;
        if (!$aFile || !str_starts_with((string)$aFile['mime_type'], 'image/'))
            return null;

        $aVariants = [];
        foreach (['thumb', 'medium', 'large'] as $sName) {
            $sTranscoder = (string)($aTranscoders[$sName] ?? '');
            $o = $sTranscoder !== '' ? BxDolTranscoderImage::getObjectInstance($sTranscoder) : null;
            // the source's type is known: no look at the original (a token for a private one)
            $sUrl = $o ? (string)($o instanceof BxDolTranscoderImage ? $o->getCopyUrl((int)$iFileId, (string)$aFile['mime_type']) : $o->getFileUrl((int)$iFileId)) : '';
            if ($sUrl !== '')
                $aVariants[$sName] = [$sUrl, $sTranscoder];
        }

        return self::media(self::uploadId((int)$aObject['id'], (int)$iFileId), 'image', 'ready', $sStorage, $iFileId, $aVariants, null, false, true);
    }

    /**
     * A stored video as Media: `processing` until the mp4 transcoder has its copy (read without
     * the outdated check: a GET never changes files), then its mp4 (the HD one for an original
     * as high as the HD box, once made), the poster and a smaller still (`thumb`, a v2 extra for
     * lists). $sPosterUrl and $sThumbUrl are stills the author chose (the video's own otherwise).
     * The original goes only to its owner: the site plays its copies. Null for a file that is
     * not there or not a video.
     * @param array $aTranscoders the transcoder objects of the copies: 'mp4' (required),
     *        'mp4_hd', 'poster', 'thumb' (the empty string for one there is not)
     */
    public static function videoMedia($sStorage, $iFileId, array $aTranscoders, $sPosterUrl = null, $sThumbUrl = null)
    {
        $aObject = BxDolStorageQuery::getStorageObject($sStorage);
        $aFile = !empty($aObject['id']) && (int)$iFileId > 0 ? self::fileRow($sStorage, $iFileId) : null;
        if (!$aFile || !str_starts_with((string)$aFile['mime_type'], 'video/'))
            return null;

        $oMp4 = !empty($aTranscoders['mp4']) ? BxDolTranscoder::getObjectInstance($aTranscoders['mp4']) : null;
        $sState = !$oMp4 || $oMp4->isFileReady((int)$iFileId, false) ? 'ready' : 'processing';

        $aVariants = [];
        if ($sState === 'ready' && $oMp4) {
            $oHd = !empty($aTranscoders['mp4_hd']) ? BxDolTranscoder::getObjectInstance($aTranscoders['mp4_hd']) : null;
            $bHd = $oHd && !empty($aFile['dimensions']) && method_exists($oHd, 'isProcessHD') && $oHd->isProcessHD($aFile['dimensions']) && $oHd->isFileReady((int)$iFileId, false);
            $aVariants['mp4'] = $bHd ? [$oHd->getFileUrl((int)$iFileId), $aTranscoders['mp4_hd']] : [$oMp4->getFileUrl((int)$iFileId), $aTranscoders['mp4']];
            foreach (['poster' => $sPosterUrl, 'thumb' => $sThumbUrl] as $sName => $sChosen) {
                if ($sChosen) {
                    $aVariants[$sName] = [$sChosen, ''];
                    continue;
                }
                $o = !empty($aTranscoders[$sName]) ? BxDolTranscoder::getObjectInstance($aTranscoders[$sName]) : null;
                if ($o && $o->isFileReady((int)$iFileId, false))
                    $aVariants[$sName] = [$o->getFileUrl((int)$iFileId), $aTranscoders[$sName]];
            }
        }

        return self::media(self::uploadId((int)$aObject['id'], (int)$iFileId), 'video', $sState, $sStorage, $iFileId, $aVariants, null, false, true);
    }

    /**
     * A file module's stored file as Media (Files): `kind` by its type (`image`, `video`,
     * `audio`, else `file`), the original as `url` and `download_url` for everyone who sees the
     * entry (the site hands it to them too: its download is the view check), and the copies the
     * site makes of it: `thumb` and `medium` of an image of a type its previews are made of
     * ($aImageExts, by extension), a video's `mp4` and `poster` once its transcoders made them
     * (read without the outdated check, never queued by a GET), with `state` `processing` while
     * the mp4 converter's queue has it and `failed` when converting it failed (`ready` otherwise:
     * the file itself is there). Null for a file that is not there.
     * @param array $aTranscoders 'thumb', 'medium' (images), 'mp4', 'poster' (videos) => transcoder object ('' for none)
     * @param array $aImageExts the extensions of the images the site previews ([] for none)
     */
    public static function fileMedia($sStorage, $iFileId, array $aTranscoders, array $aImageExts)
    {
        $aObject = BxDolStorageQuery::getStorageObject($sStorage);
        $aFile = !empty($aObject['id']) && (int)$iFileId > 0 ? self::fileRow($sStorage, $iFileId) : null;
        if (!$aFile)
            return null;

        $sMime = (string)$aFile['mime_type'];
        $sKind = str_starts_with($sMime, 'image/') ? 'image' : (str_starts_with($sMime, 'video/') ? 'video' : (str_starts_with($sMime, 'audio/') ? 'audio' : 'file'));
        $sExt = mb_strtolower((string)($aFile['ext'] ?? ''));

        $sState = 'ready';
        $aVariants = [];
        if ($sKind === 'image' && in_array($sExt, $aImageExts, true)) {
            foreach (['thumb', 'medium'] as $sName) {
                $sTranscoder = (string)($aTranscoders[$sName] ?? '');
                $o = $sTranscoder !== '' ? BxDolTranscoderImage::getObjectInstance($sTranscoder) : null;
                $sUrl = $o ? (string)($o instanceof BxDolTranscoderImage ? $o->getCopyUrl((int)$iFileId, $sMime) : $o->getFileUrl((int)$iFileId)) : '';
                if ($sUrl !== '')
                    $aVariants[$sName] = [$sUrl, $sTranscoder];
            }
        }
        elseif ($sKind === 'video') {
            // a file's video plays once the site converted it; until then it is a download
            foreach (['mp4', 'poster'] as $sName) {
                $o = !empty($aTranscoders[$sName]) ? BxDolTranscoder::getObjectInstance($aTranscoders[$sName]) : null;
                if ($o && $o->isFileReady((int)$iFileId, false))
                    $aVariants[$sName] = [$o->getFileUrl((int)$iFileId), $aTranscoders[$sName]];
            }
            // not converted: `processing` while it waits in the converter's queue or is being
            // converted, `failed` when converting it failed, else `ready` (the file is there to
            // download; nothing converts it until the site's page first shows it)
            $oMp4 = !isset($aVariants['mp4']) && !empty($aTranscoders['mp4']) ? BxDolTranscoder::getObjectInstance($aTranscoders['mp4']) : null;
            $sQueue = $oMp4 ? $oMp4->getDb()->getQueueStatus((int)$iFileId) : null;
            if ($sQueue === 'failed')
                $sState = 'failed';
            elseif (in_array($sQueue, ['pending', 'processing', 'complete'], true))
                $sState = 'processing';
        }

        return self::media(self::uploadId((int)$aObject['id'], (int)$iFileId), $sKind, $sState, $sStorage, $iFileId, $aVariants, null, true);
    }

    /**
     * Puts a stored video in its transcoders' queue (mp4, the stills, and the HD copy for an
     * original as high as its box), as the site's pages do when they first show it, so the
     * cron makes its copies. For a write (an upload), never a GET.
     * @param array $aTranscoders as videoMedia's
     */
    public static function queueVideo($sStorage, $iFileId, array $aTranscoders)
    {
        $aFile = self::fileRow($sStorage, $iFileId);
        if (!$aFile || !str_starts_with((string)$aFile['mime_type'], 'video/'))
            return;
        foreach ($aTranscoders as $sName => $sTranscoder) {
            $o = $sTranscoder !== '' ? BxDolTranscoder::getObjectInstance($sTranscoder) : null;
            if (!$o || ($sName === 'mp4_hd' && (empty($aFile['dimensions']) || !method_exists($o, 'isProcessHD') || !$o->isProcessHD($aFile['dimensions']))))
                continue;
            $o->getFileUrl((int)$iFileId);
        }
    }

    /**
     * Media: a photo or video of a post or a message, or an upload. Every module class that
     * answers with it declares it (and Variant), since a site may not have the others.
     */
    public static function mediaSchema()
    {
        return [
            'type' => 'object',
            'description' => 'A photo or video of a post or a message, or an upload (POST /uploads) a post or message may take. UNA keeps no alt text for these files.',
            'required' => ['id', 'kind', 'mime', 'size', 'state', 'original_name', 'url', 'download_url', 'variants'],
            'properties' => [
                'id' => ['type' => 'string', 'description' => 'Opaque, unique within the site for the files of known storages: the id of the upload it was, which `media_ids` takes'],
                'kind' => ['type' => 'string', 'enum' => ['image', 'video', 'audio', 'file'], 'description' => '`image` and `video`, and for the Files module\'s files also `audio` and `file` (anything else)'],
                'mime' => ['type' => 'string', 'example' => 'image/jpeg', 'description' => 'The original file\'s type, or the type of the copy `url` is for a viewer not given the original; `application/octet-stream` when the site does not know it'],
                'size' => ['type' => 'integer', 'format' => 'int64', 'minimum' => 0, 'description' => 'The original file\'s size in bytes; 0 when the site does not know it, and for a viewer not given the original'],
                'width' => ['type' => ['integer', 'null'], 'minimum' => 1, 'description' => 'Width of the original file in pixels; null when the site does not know it. Use width and height for the aspect ratio, and reserve the space before a copy loads.'],
                'height' => ['type' => ['integer', 'null'], 'minimum' => 1, 'description' => 'Height of the original file in pixels; null when the site does not know it'],
                'state' => ['type' => 'string', 'enum' => ['processing', 'ready', 'failed'], 'description' => 'A video is `processing` until the site has converted it: its `variants` are empty until then. A Files video is `processing` only while the site\'s converter has it queued or converts it, `failed` when that failed, and `ready` with no `mp4` when nothing converts it (the file is there to download)'],
                'original_name' => ['type' => 'string', 'description' => 'The file name it was uploaded with; empty when the site does not know it, and for a viewer not given the original'],
                'duration_ms' => ['type' => ['integer', 'null'], 'description' => 'A video\'s length. Always null here: the site keeps no length'],
                'url' => ['type' => 'string', 'description' => 'The original file. A private one\'s link carries a token that is valid for a few minutes (the same token for a few minutes, so a repeated GET has the same body). A post\'s private original goes only to its owner, as the site shows others only copies: for everyone else this is the largest copy (`variants.large`, else the next one there is). A Files module\'s file goes to everyone who may see it, as the site\'s download does. Empty only for a file the site no longer has'],
                'download_url' => ['type' => 'string', 'description' => 'The original as a download, under the same rule as `url`. The site has no separate download link: it is `url`, which the site sends as a download for files other than images, videos and audio'],
                'variants' => [
                    'type' => 'object',
                    'description' => 'Copies by name, once processed: resized images (`thumb`, `medium`, `large`); for a video an MP4 to play (`mp4`) and a still (`poster`). Show `medium` in a feed and `large` full-screen, and play `mp4`, not the original.',
                    'additionalProperties' => ['$ref' => '#/components/schemas/Variant'],
                    'propertyNames' => ['type' => 'string'],
                ],
            ],
        ];
    }

    public static function variantSchema()
    {
        return [
            'type' => 'object',
            'required' => ['url', 'width', 'height'],
            'properties' => [
                'url' => ['type' => 'string', 'format' => 'uri'],
                'width' => ['type' => 'integer', 'minimum' => 0, 'description' => 'The original\'s size fitted into the copy\'s box (the site keeps no sizes of its copies); 0 when not known'],
                'height' => ['type' => 'integer', 'minimum' => 0],
            ],
        ];
    }

    /**
     * An Activity's or Item's `version`: 24 hex digits of the sha256 of it as the viewer sees
     * it, without `version` and view counts (which change with every look), and without the
     * tokens of private file links (renewed every few minutes) and the times in links of image
     * copies not made yet.
     */
    public static function version($a)
    {
        unset($a['version'], $a['object']['version']);
        if (isset($a['object']['stats']['views']))
            $a['object']['stats']['views'] = 0;
        if (isset($a['stats']['views']))
            $a['stats']['views'] = 0;
        // an item's poll (Item.poll) keeps its own view count
        if (isset($a['poll']['stats']['views']))
            $a['poll']['stats']['views'] = 0;
        if (isset($a['object']['poll']['stats']['views']))
            $a['object']['poll']['stats']['views'] = 0;
        // a storage token (32 hex) and a not-yet-made copy's time (absoluteUrl leaves that out
        // already; a link built some other way may still have it)
        $s = preg_replace('/([?&])t=(?:[0-9a-f]{32}|\d+)(?=[&"\\\\]|$)/', '$1t=', (string)BxDolApiV2Router::json($a));
        return substr(hash('sha256', $s), 0, 24);
    }

    /**
     * A `Change`'s `version` for an entity with no `version` of its own (a notification): 24 hex
     * digits of the sha256 of it as sent.
     */
    public static function digest($a)
    {
        return substr(hash('sha256', (string)BxDolApiV2Router::json($a)), 0, 24);
    }

    /**
     * LinkPreview and LinkImage, and ItemViewer, ContentState and Moderation:
     * declared by every class that answers with them, since a site may lack the others.
     */
    public static function linkPreviewSchema()
    {
        return [
            'type' => 'object',
            'description' => 'A link\'s preview. The site reads a link\'s preview when the post is made, so `state` is always `ready`.',
            'required' => ['id', 'url', 'host', 'state', 'title', 'description', 'site_name'],
            'properties' => [
                'id' => ['$ref' => '#/components/schemas/Id'],
                'url' => ['type' => 'string'],
                'host' => ['type' => 'string', 'description' => 'The URL\'s host, for showing where a link goes'],
                'state' => ['type' => 'string', 'enum' => ['pending', 'ready', 'failed']],
                'title' => ['type' => 'string'],
                'description' => ['type' => 'string'],
                'site_name' => ['type' => 'string', 'description' => 'The site keeps no site name: the host'],
                'image' => ['oneOf' => [['$ref' => '#/components/schemas/LinkImage'], ['type' => 'null']]],
            ],
        ];
    }

    public static function linkImageSchema()
    {
        return [
            'type' => 'object',
            'required' => ['path', 'width', 'height'],
            'properties' => [
                'path' => ['type' => 'string', 'description' => 'An absolute URL; resolve it against the API\'s origin'],
                'width' => ['type' => 'integer', 'description' => '0: the site keeps no size'],
                'height' => ['type' => 'integer', 'description' => '0: the site keeps no size'],
            ],
        ];
    }

    public static function itemViewerSchema()
    {
        return [
            'type' => 'object',
            'description' => 'What the signed-in viewer has done with an item and may do with it. Clients show actions by it; every action is still checked when made.',
            'required' => ['reaction', 'favorited', 'can_react', 'can_comment', 'can_edit', 'can_delete'],
            'properties' => [
                'reaction' => ['type' => ['string', 'null'], 'description' => 'The viewer\'s reaction, e.g. like'],
                'favorited' => ['type' => 'boolean', 'description' => 'In the viewer\'s favorites: content of a module that has favorites; feed posts never are'],
                'can_react' => ['type' => 'boolean'],
                'can_comment' => ['type' => 'boolean'],
                'can_edit' => ['type' => 'boolean'],
                'can_delete' => ['type' => 'boolean'],
            ],
        ];
    }

    public static function contentStateSchema()
    {
        return ['type' => 'string', 'enum' => ['draft', 'scheduled', 'processing', 'published', 'hidden', 'deleted'], 'description' => 'The state of an item. This site has published, scheduled (an event waiting for its publishing time), processing (a video being converted) and hidden'];
    }

    public static function moderationSchema()
    {
        return ['type' => 'string', 'enum' => ['approved', 'pending', 'rejected'], 'description' => 'The moderation status of an item'];
    }

    /**
     * Poll and what it is made of, as Polls (BxPollsApiV2) answers it and the feeds'
     * Item.poll carries it. Here because Item names it: the Timeline's schemas give it too.
     */
    public static function pollSchemas()
    {
        $aId = ['$ref' => '#/components/schemas/Id'];
        $aIdOrNull = ['oneOf' => [$aId, ['type' => 'null']]];
        $aCount = ['type' => 'integer', 'minimum' => 0];

        return [
            'Audience' => ['type' => 'string', 'enum' => ['public', 'members', 'friends', 'context', 'private']],
            'ContentState' => self::contentStateSchema(),
            'Moderation' => self::moderationSchema(),
            'Media' => self::mediaSchema(),
            'Variant' => self::variantSchema(),
            'PollOption' => [
                'type' => 'object',
                'required' => ['id', 'title', 'votes'],
                'description' => 'An option of a poll.',
                'properties' => [
                    'id' => $aId,
                    'title' => ['type' => 'string', 'description' => 'Plain text'],
                    'votes' => ['type' => ['integer', 'null'], 'minimum' => 0, 'description' => 'null while the results are hidden from the viewer (`results_visible` false)'],
                ],
            ],
            'PollViewer' => [
                'type' => 'object',
                'description' => 'The viewer\'s part in a poll; null for guests.',
                'required' => ['voted', 'can_vote'],
                'properties' => [
                    'voted' => $aIdOrNull + ['description' => 'The option they chose; null before they voted'],
                    'can_vote' => ['type' => 'boolean', 'description' => 'They have not voted, the poll is published and approved, and their membership level may vote in polls. A vote is never changed or taken back'],
                    'can_delete' => ['type' => 'boolean', 'description' => 'v2 only: the module\'s delete check (DELETE /polls/{id})'],
                ],
            ],
            'PollStats' => [
                'type' => 'object',
                'required' => ['comments', 'reactions', 'views'],
                'properties' => [
                    'comments' => $aCount,
                    'reactions' => $aCount,
                    'views' => $aCount,
                ],
            ],
            'Poll' => [
                'type' => 'object',
                'description' => 'A poll. A poll is an entry of the Polls module, not something put on another item; `content_id` is the Item that shows it in the feeds (its comments and reactions are the poll\'s), null when the Timeline shows none. One answer per voter, never changed: `voters` is the sum of the votes.',
                'required' => ['id', 'content_id', 'question', 'options', 'voters', 'hidden_results', 'results_visible', 'viewer'],
                'properties' => [
                    'id' => $aId,
                    'content_id' => $aIdOrNull + ['description' => 'The Item that shows it (GET /content/{id}); null when the Timeline shows none'],
                    'module' => ['type' => 'string', 'description' => 'The UNA module (v2 only)', 'example' => 'bx_polls'],
                    'question' => ['type' => 'string', 'description' => 'Plain text'],
                    'text_html' => ['type' => ['string', 'null'], 'description' => 'v2 only: the question as the site keeps it (user HTML the site filtered: sanitize it again before showing it). Only on single answers (GET /polls/{id}, a vote, a new poll); null in lists and feed items'],
                    'options' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/PollOption'], 'description' => 'In the poll\'s order'],
                    'voters' => ['type' => 'integer', 'minimum' => 0, 'description' => 'How many people voted; always shown'],
                    'hidden_results' => ['type' => 'boolean', 'description' => 'The counts are shown only to people who voted'],
                    'results_visible' => ['type' => 'boolean', 'description' => 'Whether the options\' `votes` are filled for this viewer'],
                    'image' => ['oneOf' => [['$ref' => '#/components/schemas/Media'], ['type' => 'null']], 'description' => 'v2 only: the picture its author chose for it, as the module\'s copies (the original for its owner only); null for none'],
                    'author' => self::profileOrNullSchema(),
                    'audience' => ['$ref' => '#/components/schemas/Audience'],
                    'context_id' => $aIdOrNull + ['description' => 'v2 only: the group or other context it is in'],
                    'state' => ['$ref' => '#/components/schemas/ContentState'],
                    'moderation' => ['$ref' => '#/components/schemas/Moderation'],
                    'stats' => ['$ref' => '#/components/schemas/PollStats'],
                    'url' => ['type' => ['string', 'null'], 'format' => 'uri', 'description' => 'v2 only: its page on the site'],
                    'viewer' => ['oneOf' => [['$ref' => '#/components/schemas/PollViewer'], ['type' => 'null']], 'description' => 'null for guests (they see the results the poll shows everyone, and vote on the site)'],
                    'published_at' => ['type' => 'string', 'format' => 'date-time', 'description' => 'v2 only'],
                    'created_at' => ['type' => 'string', 'format' => 'date-time', 'description' => 'v2 only'],
                    'updated_at' => ['type' => 'string', 'format' => 'date-time', 'description' => 'v2 only'],
                ],
            ],
        ];
    }

    /**
     * A page of items of a component schema: {items, next_cursor}.
     */
    public static function pageSchema($sItemSchema)
    {
        return [
            'type' => 'object',
            // next_cursor is always sent, null on the last page
            'required' => ['items', 'next_cursor'],
            'properties' => [
                'items' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/' . $sItemSchema]],
                'next_cursor' => ['type' => ['string', 'null'], 'description' => 'Send it as `cursor` for the next page; `null` on the last one'],
            ],
        ];
    }
}

/** @} */
