<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Share card layout.
 *
 * A layout turns a card spec (@see BxDolShareCard::normalizeSpec) into an ordered list of blocks -
 * plain arrays saying what goes on the card and in which order it is painted. A layout decides
 * nothing about fonts, colours, sizes or wrapping: that is the renderer's business, and keeping the
 * split sharp is what lets a module add a layout without knowing anything about drawing.
 *
 * Block vocabulary:
 * @code
 *  array('type' => 'background', 'image' => image|null)
 *  array('type' => 'scrim',      'strength' => int)               // 0..100, darkening under text
 *  array('type' => 'logo')                                        // renderer picks the site logo
 *  array('type' => 'header',     'avatar' => image|null, 'name' => string, 'meta' => string)
 *  array('type' => 'title',      'text' => string, 'maxLines' => int)
 *  array('type' => 'text',       'text' => string, 'maxLines' => int)
 *  array('type' => 'image',      'image' => image, 'slot' => 'right'|'top'|'full')
 *  array('type' => 'avatars',    'items' => array(image|array('letter', 'seed'), ...), 'overflow' => int)
 *  array('type' => 'label',      'text' => string)
 *  array('type' => 'badges',     'items' => array(string, ...))
 *  array('type' => 'footer',     'text' => string)
 * @endcode
 * The renderer appends the brand footer itself, so a layout never emits one.
 *
 * @section example Example of usage
 *
 * @code
 *  $oLayout = BxDolShareCardLayout::getObjectInstance($aSpec['layout'], $aSpec['module']);
 *  $aBlocks = $oLayout->compose($aSpec);
 * @endcode
 */
abstract class BxDolShareCardLayout extends BxDolFactory
{
    /**
     * Core layouts. They all live in this file, so they are never autoloaded by class name.
     */
    protected static $_aCoreLayouts = [
        'default' => 'BxDolShareCardLayoutDefault',
        'text_free' => 'BxDolShareCardLayoutTextFree',
        'entry' => 'BxDolShareCardLayoutEntry',
        'profile' => 'BxDolShareCardLayoutProfile',
        'discussion' => 'BxDolShareCardLayoutDiscussion',
    ];

    protected $_sLayout = '';

    protected function __construct($sLayout = '')
    {
        parent::__construct();

        $this->_sLayout = $sLayout;
    }

    /**
     * Get a layout object by name.
     * Resolution order: a core layout, then a layout the module registered in
     * CNF['OBJECT_SHARE_CARD_LAYOUTS'], then 'entry', then 'default'. A module registers either a
     * class name or array('class_name' => .., 'class_file' => ..) with a path relative to the root,
     * the same shape sys_objects_content_info uses.
     * @param $sLayout - layout name from the spec
     * @param $sModule - module the spec belongs to, for module registered layouts
     * @return BxDolShareCardLayout instance, never false
     */
    public static function getObjectInstance($sLayout, $sModule = '')
    {
        //--- separators are not significant: text-free and textfree both mean text_free
        $sLayout = str_replace('-', '_', trim((string)$sLayout));
        if ('textfree' === strtolower($sLayout))
            $sLayout = 'text_free';

        $sLayout = is_string($sLayout) ? strtolower(trim($sLayout)) : '';

        if (isset(self::$_aCoreLayouts[$sLayout])) {
            $sClass = self::$_aCoreLayouts[$sLayout];
            return new $sClass($sLayout);
        }

        if (($o = self::_getModuleLayout($sLayout, $sModule)))
            return $o;

        // an entry-ish layout is the closest thing to a sane default for content, and the generic
        // one is the last resort for everything else
        if ($sLayout !== '' && $sModule !== '' && $sModule != 'system')
            return new BxDolShareCardLayoutEntry('entry');

        return new BxDolShareCardLayoutDefault('default');
    }

    /**
     * Turn a card spec into the ordered block list to paint.
     * @param $aCard - normalised card spec
     * @return array of blocks
     */
    abstract public function compose($aCard);

    public function getLayout()
    {
        return $this->_sLayout;
    }

    protected static function _getModuleLayout($sLayout, $sModule)
    {
        if ($sLayout === '' || !is_string($sModule) || $sModule === '' || $sModule == 'system')
            return false;

        $oModule = BxDolModule::getInstance($sModule);
        if (!$oModule || !isset($oModule->_oConfig->CNF))
            return false;

        $CNF = &$oModule->_oConfig->CNF;
        if (empty($CNF['OBJECT_SHARE_CARD_LAYOUTS']) || !is_array($CNF['OBJECT_SHARE_CARD_LAYOUTS']))
            return false;
        if (!isset($CNF['OBJECT_SHARE_CARD_LAYOUTS'][$sLayout]))
            return false;

        $mixed = $CNF['OBJECT_SHARE_CARD_LAYOUTS'][$sLayout];
        $sClass = is_array($mixed) ? ($mixed['class_name'] ?? '') : $mixed;
        $sFile = is_array($mixed) ? ($mixed['class_file'] ?? '') : '';

        if (!is_string($sClass) || $sClass === '')
            return false;

        if (is_string($sFile) && $sFile !== '' && strpos($sFile, '..') === false && file_exists(BX_DIRECTORY_PATH_ROOT . $sFile))
            require_once(BX_DIRECTORY_PATH_ROOT . $sFile);

        // no autoloading here: a module class name means nothing to bx_autoload(), and a BxTempl
        // prefixed one would make it require a file which does not exist
        if (!class_exists($sClass, false) || !is_subclass_of($sClass, 'BxDolShareCardLayout'))
            return false;

        return new $sClass($sLayout);
    }

    /**
     * The picture a card shows in its own right, not as a background.
     */
    protected function _image($aCard)
    {
        return $aCard['image'] ?? null;
    }

    protected function _background($aCard)
    {
        return $aCard['bg'] ?? null;
    }

    protected function _title($aCard)
    {
        return (string)($aCard['title'] ?? '');
    }

    /**
     * The body copy of a card: the subtitle is written for the card, so it wins over the page
     * description, which is written for a search engine.
     */
    protected function _text($aCard)
    {
        // the entry's own words come first. `subtitle` is the site tagline, which getDefaultSpec()
        // puts into EVERY spec - including the ones modules build for one particular post - and on a
        // card about one particular thing the tagline says nothing about it. It is the fallback, for
        // the site and page cards which have no description of their own to draw.
        $sText = (string)($aCard['description'] ?? '');

        return $sText !== '' ? $sText : (string)($aCard['subtitle'] ?? '');
    }

    protected function _extra($aCard, $sKey, $mixedDefault = null)
    {
        return isset($aCard['extra'][$sKey]) ? $aCard['extra'][$sKey] : $mixedDefault;
    }

    protected function _counter($aCard, $sKey)
    {
        return (int)($aCard['extra']['counters'][$sKey] ?? 0);
    }

    /**
     * The header line of a content card: who wrote it, and where.
     */
    protected function _header($aCard, $sMeta = '')
    {
        $aAuthor = $this->_extra($aCard, 'author');
        $aContext = $this->_extra($aCard, 'context');

        $aAvatar = null;
        $sName = '';
        if (is_array($aAuthor)) {
            $aAvatar = $aAuthor['avatar'] ?? null;
            $sName = (string)($aAuthor['name'] ?? '');
        }
        else if (is_array($aContext)) {
            $aAvatar = $aContext['avatar'] ?? null;
            $sName = (string)($aContext['name'] ?? '');
        }

        if ($aAvatar === null && $sName === '' && $sMeta === '')
            return null;

        return ['type' => 'header', 'avatar' => $aAvatar, 'name' => $sName, 'meta' => $sMeta];
    }

    /**
     * "in Some Category", or just the category when the site has no string for it.
     */
    protected function _inCategory($aCard)
    {
        $sCategory = (string)$this->_extra($aCard, 'category', '');
        if ($sCategory === '') {
            $aContext = $this->_extra($aCard, 'context');
            $sCategory = is_array($aContext) ? (string)($aContext['name'] ?? '') : '';
        }

        if ($sCategory === '')
            return '';

        $s = $this->_t('_sys_share_card_in_category', $sCategory);

        return $s !== '' ? $s : $sCategory;
    }

    /**
     * The faces of everybody taking part, plus "+N" for whoever did not fit.
     */
    protected function _avatars($aCard)
    {
        $aParticipants = $this->_extra($aCard, 'participants', []);
        if (!is_array($aParticipants) || !$aParticipants)
            return null;

        $aItems = [];
        $iSeed = 0;
        foreach ($aParticipants as $aOne) {
            $iSeed++;

            if (!empty($aOne['avatar'])) {
                $aItems[] = $aOne['avatar'];
                continue;
            }

            // no picture: the renderer draws an initial on a colour picked by the seed, so the same
            // person keeps the same colour on every card
            $sName = (string)($aOne['name'] ?? '');
            if ($sName === '')
                continue;

            // an id of 0 means "nobody in particular", so it falls back to the position in the row
            // rather than painting every id-less face the same colour
            $aItems[] = ['letter' => mb_substr($sName, 0, 1), 'seed' => (int)($aOne['id'] ?? 0) ?: $iSeed];
        }

        if (!$aItems)
            return null;

        $iOverflow = (int)$this->_extra($aCard, 'participants_total', 0) - count($aItems);

        return ['type' => 'avatars', 'items' => $aItems, 'overflow' => max(0, $iOverflow)];
    }

    /**
     * The counters line, e.g. "12 replies - 340 views". Counters with nothing to say are left out.
     */
    protected function _counters($aCard, $aKeys = ['replies', 'views'])
    {
        $aParts = [];
        foreach ($aKeys as $sKey) {
            if (($iValue = $this->_counter($aCard, $sKey)) <= 0)
                continue;

            if (($s = $this->_t('_sys_share_card_n_' . $sKey, $iValue)) !== '')
                $aParts[] = $s;
        }

        if (!$aParts)
            return null;

        return ['type' => 'label', 'text' => implode(' · ', $aParts)];
    }

    protected function _badges($aCard)
    {
        $aBadges = $this->_extra($aCard, 'badges', []);

        return is_array($aBadges) && $aBadges ? ['type' => 'badges', 'items' => $aBadges] : null;
    }

    /**
     * An absolute date, never a relative one: a card is drawn once and cached for a year, so
     * "2 hours ago" would be a lie by tomorrow.
     */
    protected function _date($iTimestamp)
    {
        $iTimestamp = (int)$iTimestamp;

        return $iTimestamp > 0 ? date('j M Y', $iTimestamp) : '';
    }

    /**
     * _t() echoes the key back when a language string is missing, and a raw key on a shared picture
     * looks like a bug to everyone who sees it - so an untranslated key becomes nothing at all.
     */
    protected function _t($sKey, $mixedArg = null)
    {
        $s = $mixedArg === null ? _t($sKey) : _t($sKey, $mixedArg);

        return $s === $sKey ? '' : $s;
    }

    /**
     * Drop the blocks which had nothing to show.
     */
    protected function _blocks($aBlocks)
    {
        return array_values(array_filter($aBlocks));
    }
}

/**
 * The generic card: a site wide picture, the title, and one line about the site. Everything which
 * is not a known kind of content ends up here.
 */
class BxDolShareCardLayoutDefault extends BxDolShareCardLayout
{
    public function compose($aCard)
    {
        return $this->_blocks([
            ['type' => 'background', 'image' => $this->_background($aCard)],
            ['type' => 'scrim', 'strength' => 45],
            ['type' => 'logo'],
            ['type' => 'title', 'text' => $this->_title($aCard), 'maxLines' => 2],
            ($sText = $this->_text($aCard)) !== '' ? ['type' => 'text', 'text' => $sText, 'maxLines' => 2] : null,
        ]);
    }
}

/**
 * The card for text which cannot be drawn at all - a script the font has no glyphs for, or one
 * neither GD nor Imagick can shape. It shows pictures and the site mark, and says nothing.
 */
class BxDolShareCardLayoutTextFree extends BxDolShareCardLayout
{
    public function compose($aCard)
    {
        return $this->_blocks([
            ['type' => 'background', 'image' => $this->_background($aCard)],
            ['type' => 'scrim', 'strength' => 25],
            ($aImage = $this->_image($aCard)) !== null ? ['type' => 'image', 'image' => $aImage, 'slot' => 'full'] : null,
            ['type' => 'logo'],
        ]);
    }
}

/**
 * A single piece of content: who posted it, what it is called, how it starts, and its picture.
 */
class BxDolShareCardLayoutEntry extends BxDolShareCardLayout
{
    public function compose($aCard)
    {
        return $this->_blocks([
            ['type' => 'background', 'image' => $this->_background($aCard)],
            ['type' => 'scrim', 'strength' => 55],
            $this->_header($aCard, $this->_date($this->_extra($aCard, 'published', 0))),
            ['type' => 'title', 'text' => $this->_title($aCard), 'maxLines' => 3],
            ($sText = $this->_text($aCard)) !== '' ? ['type' => 'text', 'text' => $sText, 'maxLines' => 2] : null,
            ($aImage = $this->_image($aCard)) !== null ? ['type' => 'image', 'image' => $aImage, 'slot' => 'right'] : null,
            $this->_badges($aCard),
        ]);
    }
}

/**
 * A profile or a context: the face first, then the name and what it is about.
 */
class BxDolShareCardLayoutProfile extends BxDolShareCardLayout
{
    public function compose($aCard)
    {
        // one item in an avatars block is how a profile picture is asked for: the renderer masks it
        // into a circle, which a plain image slot would not do
        $aAvatar = $this->_image($aCard);
        if ($aAvatar === null && is_array($aAuthor = $this->_extra($aCard, 'author')))
            $aAvatar = $aAuthor['avatar'] ?? null;

        return $this->_blocks([
            ['type' => 'background', 'image' => $this->_background($aCard)],
            ['type' => 'scrim', 'strength' => 45],
            $aAvatar !== null ? ['type' => 'avatars', 'items' => [$aAvatar], 'overflow' => 0] : null,
            ['type' => 'title', 'text' => $this->_title($aCard), 'maxLines' => 2],
            ($sText = $this->_text($aCard)) !== '' ? ['type' => 'text', 'text' => $sText, 'maxLines' => 2] : null,
            $this->_counters($aCard, ['members', 'views']),
            $this->_badges($aCard),
        ]);
    }
}

/**
 * A conversation: who started it and where, what it is about, who is in it, and how busy it is.
 */
class BxDolShareCardLayoutDiscussion extends BxDolShareCardLayout
{
    public function compose($aCard)
    {
        return $this->_blocks([
            ['type' => 'background', 'image' => $this->_background($aCard)],
            ['type' => 'scrim', 'strength' => 60],
            $this->_header($aCard, $this->_inCategory($aCard)),
            ['type' => 'title', 'text' => $this->_title($aCard), 'maxLines' => 2],
            ($sText = $this->_text($aCard)) !== '' ? ['type' => 'text', 'text' => $sText, 'maxLines' => 3] : null,
            ($aImage = $this->_image($aCard)) !== null ? ['type' => 'image', 'image' => $aImage, 'slot' => 'right'] : null,
            $this->_avatars($aCard),
            // counters before badges: _fitStack() drops optional blocks from the bottom up, and on a
            // crowded discussion card "42 replies - 1337 views" is the part worth keeping
            $this->_counters($aCard, ['replies', 'views']),
            $this->_badges($aCard),
        ]);
    }
}

/** @} */
