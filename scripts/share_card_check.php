<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCoreScripts Scripts
 * @{
 */

$aPathInfo = pathinfo(__FILE__);
require_once ($aPathInfo['dirname'] . '/../inc/header.inc.php');
require_once(BX_DIRECTORY_PATH_INC . 'design.inc.php');

/**
 * Command line interface for exercising the share card generator.
 *
 * It draws every card this install can draw, without a web server and without the endpoint, and
 * checks each one against the promises `og:image` makes about it: exactly 1200x630, small enough
 * for the strictest scraper, drawn quickly and without raising a single PHP notice. Two kinds of
 * card are produced:
 *
 *   - synthetic cases, which do not depend on the content of this site: the default site card, one
 *     card per layout, and the text a renderer is most likely to break on - a 200 character title,
 *     an unsupported script, emoji, HTML entities, an empty title.
 *   - live cases, which are the real entities of this site: every entity that already has a card,
 *     plus anything named with --entity.
 *
 * Run it twice, with `enable_gd` on and off, if the install has Imagick: the two draw text through
 * completely different code and only one of them is exercised per run.
 *
 * @code
 *  php scripts/share_card_check.php
 *  php scripts/share_card_check.php --out=/tmp/cards --entity=bx_forum:1 --entity=bx_persons:1
 *  php scripts/share_card_check.php --gd=off --quiet
 * @endcode
 */
class BxDolShareCardCheckCmd
{
    const MAX_BYTES = 307200;       ///< WhatsApp stops fetching at ~300KB
    const MAX_MS = 800;             ///< a scraper gives up long before this
    const MAX_MEMORY = 100663296;   ///< 96MB, well under the 192MB an install is expected to allow

    protected $sOutDir = '';
    protected $bQuiet = false;
    protected $aEntities = array();
    protected $iPassed = 0;
    protected $iFailed = 0;
    protected $iStale = 0;

    public function __construct($aArgs)
    {
        $this->sOutDir = rtrim(BX_DIRECTORY_PATH_TMP, '/') . '/share_card_check';

        foreach ($aArgs as $sArg) {
            if (0 === strpos($sArg, '--out='))
                $this->sOutDir = rtrim(substr($sArg, 6), '/');
            elseif (0 === strpos($sArg, '--entity='))
                $this->aEntities[] = substr($sArg, 9);
            elseif (0 === strpos($sArg, '--gd='))
                setParam('enable_gd', substr($sArg, 5) == 'off' ? '' : 'on');
            elseif ($sArg == '--quiet')
                $this->bQuiet = true;
            elseif ($sArg == '--help' || $sArg == '-h') {
                $this->usage();
                exit(0);
            }
        }
    }

    public function usage()
    {
        echo "usage: php scripts/share_card_check.php [--out=DIR] [--entity=KEY]... [--gd=on|off] [--quiet]\n";
    }

    public function run()
    {
        if (!is_dir($this->sOutDir) && !@mkdir($this->sOutDir, 0777, true)) {
            echo "cannot create " . $this->sOutDir . "\n";
            return 1;
        }

        $this->out('renderer: ' . (getParam('enable_gd') == 'on' ? 'GD' : 'Imagick')
            . ', font: ' . (BxDolShareCard::getInstance()->getFontPath() ?: 'NONE')
            . ', out: ' . $this->sOutDir);

        foreach ($this->getCases() as $sName => $aSpec)
            $this->check($sName, $aSpec);

        $this->out('');
        $this->out($this->iPassed . ' passed, ' . $this->iFailed . ' failed'
            . ($this->iStale ? ', ' . $this->iStale . ' stale map rows' : ''));

        return $this->iFailed ? 1 : 0;
    }

    /**
     * Every card to draw, as name => spec.
     */
    protected function getCases()
    {
        $oCard = BxDolShareCard::getInstance();

        // whatever this site uses as its own background, so the cases exercise a real picture
        $aBg = $oCard->getDefaultSpec()['bg'];

        $sLong = trim(str_repeat('Everything you ever wanted to know about link previews and never dared to ask ', 3));
        $aPeople = array();
        foreach (array('Andrey', 'Bao', 'Chidi', 'Dmitri', 'Eve') as $i => $sName)
            $aPeople[] = array('id' => $i + 1, 'name' => $sName, 'avatar' => null);

        $aCases = array(
            'default' => array(),
            'default_no_bg' => array('bg' => null),
            'title_long' => array('title' => $sLong),
            'title_empty' => array('title' => '', 'subtitle' => ''),
            'title_entities' => array('title' => 'Tom &amp; Jerry &lt;b&gt;bold&lt;/b&gt; &quot;quoted&quot;'),
            'title_emoji' => array('title' => 'Shipping it 🚀🚀🚀 today'),
            'title_cjk' => array('title' => '共有カードのテスト'),
            'title_arabic' => array('title' => 'اختبار بطاقة المشاركة'),

            'entry' => array('layout' => 'entry', 'title' => 'A post with a picture', 'bg' => $aBg, 'image' => $aBg,
                'description' => 'The first couple of sentences of the post, which is how a reader decides whether to open it at all.',
                'extra' => array('author' => array('id' => 0, 'name' => 'Andrey Yasko'), 'published' => 1757000000)),
            'entry_no_image' => array('layout' => 'entry', 'title' => 'A post with no picture at all',
                'description' => 'Nothing but words.',
                'extra' => array('author' => array('id' => 0, 'name' => 'Andrey Yasko'), 'published' => 1757000000)),

            'profile' => array('layout' => 'profile', 'title' => 'Andrey Yasko', 'image' => $aBg,
                'description' => 'Builds things with other people.',
                'extra' => array('counters' => array('members' => 128, 'views' => 4200))),
            'profile_letter' => array('layout' => 'profile', 'title' => 'Nameless Person',
                'extra' => array('author' => array('id' => 7, 'name' => 'Nameless Person'))),

            'discussion_0' => array('layout' => 'discussion', 'title' => 'A discussion nobody has answered yet',
                'description' => 'The opening post, as much of it as fits.',
                'extra' => array('author' => array('id' => 1, 'name' => 'Andrey Yasko'), 'category' => 'General',
                    'counters' => array('replies' => 0, 'views' => 3))),
            'discussion_1' => array('layout' => 'discussion', 'title' => 'A discussion with one reply',
                'description' => 'The opening post, as much of it as fits.',
                'extra' => array('author' => array('id' => 1, 'name' => 'Andrey Yasko'), 'category' => 'General',
                    'counters' => array('replies' => 1, 'views' => 9),
                    'participants' => array_slice($aPeople, 0, 1), 'participants_total' => 1)),
            'discussion_5' => array('layout' => 'discussion', 'title' => 'How do we reach a 100 Lighthouse score?',
                'description' => 'Every audited page is at 90 today and the gap is almost all colour contrast and unnamed icon links.',
                'extra' => array('author' => array('id' => 1, 'name' => 'Andrey Yasko'), 'category' => 'Front end',
                    'counters' => array('replies' => 42, 'views' => 1337),
                    'participants' => $aPeople, 'participants_total' => 12,
                    'badges' => array('Resolved', 'Sticky'))),

            'text_free' => array('layout' => 'text_free', 'image' => $aBg),
        );

        $aResult = array();
        foreach ($aCases as $sName => $aOverride)
            $aResult['syn_' . $sName] = $oCard->getDefaultSpec($aOverride);

        // the live entities of this site: the ones that already have a card, plus anything asked for
        $aLive = $this->aEntities;
        try {
            foreach (BxDolDb::getInstance()->getAll("SELECT `entity` FROM `sys_share_cards_map` ORDER BY `entity`") as $aRow)
                $aLive[] = $aRow['entity'];
        }
        catch (Throwable $oThrowable) {
            $this->out('live entities could not be listed: ' . $oThrowable->getMessage());
        }

        foreach (array_unique($aLive) as $sEntity) {
            $aSpec = $oCard->getSpecForEntity($sEntity);
            if (!$aSpec) {
                // an entity asked for by hand had better exist. One picked up from the map table is
                // a different matter: a `page:` row left behind by a per entry page, which now gets
                // its card from its module and so has no spec of its own any more, is stale rather
                // than broken - it is reported, and the next scrape of that page files its card
                // under the module entity instead
                if (in_array($sEntity, $this->aEntities))
                    $this->fail('live_' . $sEntity, 'entity does not resolve to a spec');
                else {
                    $this->iStale++;
                    $this->out('  stale ' . $sEntity . ' - map row whose entity no longer has a spec');
                }
                continue;
            }

            $aResult['live_' . preg_replace('/[^a-z0-9_]+/i', '_', $sEntity)] = $aSpec;
        }

        return $aResult;
    }

    /**
     * Draw one card and hold it to every promise og:image makes about it.
     */
    protected function check($sName, $aSpec)
    {
        $sFile = $this->sOutDir . '/' . $sName . '.jpg';
        @unlink($sFile);

        $aWarnings = array();
        set_error_handler(function ($iNo, $sStr, $sFile, $iLine) use (&$aWarnings) {
            $aWarnings[] = $sStr . ' (' . basename($sFile) . ':' . $iLine . ')';
            return true;
        });

        $iMemoryBefore = memory_get_peak_usage(true);
        $fStart = microtime(true);

        $oRenderer = BxDolShareCardRenderer::getInstance();
        $bRendered = false;
        $sError = '';
        try {
            $bRendered = $oRenderer->render($aSpec, $sFile);
            if (!$bRendered)
                $sError = $oRenderer->getError();
        }
        catch (Throwable $oThrowable) {
            $sError = get_class($oThrowable) . ': ' . $oThrowable->getMessage();
        }

        $iMs = (int)round((microtime(true) - $fStart) * 1000);
        $iMemory = memory_get_peak_usage(true);

        restore_error_handler();

        if (!$bRendered)
            return $this->fail($sName, 'not rendered: ' . ($sError ?: 'no reason given'));

        if (!file_exists($sFile) || !($iSize = filesize($sFile)))
            return $this->fail($sName, 'rendered but wrote no file');

        $aProblems = array();

        $aSize = @getimagesize($sFile);
        if (!$aSize)
            $aProblems[] = 'not an image';
        else {
            if ($aSize[0] != BX_DOL_SHARE_CARD_W || $aSize[1] != BX_DOL_SHARE_CARD_H)
                $aProblems[] = $aSize[0] . 'x' . $aSize[1] . ' instead of ' . BX_DOL_SHARE_CARD_W . 'x' . BX_DOL_SHARE_CARD_H;
            if ($aSize['mime'] != 'image/jpeg' && $aSize['mime'] != 'image/png')
                $aProblems[] = 'mime ' . $aSize['mime'];
        }

        if ($iSize > self::MAX_BYTES)
            $aProblems[] = 'size ' . $this->kb($iSize) . ' over ' . $this->kb(self::MAX_BYTES);
        if ($iMs > self::MAX_MS)
            $aProblems[] = $iMs . 'ms over ' . self::MAX_MS . 'ms';
        if ($iMemory > self::MAX_MEMORY)
            $aProblems[] = 'peak memory ' . $this->kb($iMemory) . ' over ' . $this->kb(self::MAX_MEMORY);
        foreach ($aWarnings as $sWarning)
            $aProblems[] = 'php: ' . $sWarning;

        if ($aProblems)
            return $this->fail($sName, implode('; ', $aProblems));

        $this->iPassed++;
        $this->out(sprintf('  ok   %-34s %6s  %4dms  peak %s', $sName, $this->kb($iSize), $iMs, $this->kb($iMemory)));

        return true;
    }

    protected function fail($sName, $sWhy)
    {
        $this->iFailed++;
        echo sprintf('  FAIL %-34s %s', $sName, $sWhy) . "\n";
        return false;
    }

    protected function kb($i)
    {
        return round($i / 1024) . 'K';
    }

    protected function out($s)
    {
        if (!$this->bQuiet)
            echo $s . "\n";
    }
}

$oCmd = new BxDolShareCardCheckCmd(array_slice($argv, 1));
exit($oCmd->run());

/** @} */
