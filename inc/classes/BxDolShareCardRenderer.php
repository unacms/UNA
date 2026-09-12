<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Share card renderer - the drawing engine behind share_card.php.
 *
 * It takes a normalised card spec (@see BxDolShareCard::normalizeSpec) together with the block list
 * composed by a layout (@see BxDolShareCardLayout::compose) and writes a 1200x630 JPEG of no more
 * than 300 KB.
 *
 * @section example Example of usage
 *
 * @code
 *  $oRenderer = BxDolShareCardRenderer::getInstance();
 *  if (!$oRenderer->render($aCard, $sFile))
 *      bx_log('sys_share_cards', $oRenderer->getError(), BX_LOG_ERR);
 * @endcode
 *
 * The renderer never throws - every failure is reported via @see BxDolShareCardRenderer::getError.
 */
class BxDolShareCardRenderer extends BxDolFactory
{
    // the constant which invalidates already generated cards when the drawing changes is
    // BxDolShareCard::VERSION - it is part of the cache key, this class has no version of its own

    /**
     * The encoder walks this ladder until the output fits MAX_BYTES. Real cards are done at 82;
     * the lower rungs only exist so a pathologically noisy background still respects the budget.
     */
    const JPEG_QUALITIES = array(82, 70, 55, 40);
    const MAX_BYTES = 307200; ///< 300 KB
    const MAX_BLOCKS = 32;

    const FONT_DEFAULT = 'fonts/inter/Inter-Variable.ttf'; ///< relative to BX_DIRECTORY_PATH_BASE

    const DOWNLOAD_TIMEOUT = 5; ///< seconds, for image specs which can only be reached over http
    const DOWNLOAD_MAX_BYTES = 16777216; ///< 16 MB
    const MAX_PIXELS = 40000000; ///< refuse decompression bombs, 40 MP

    const PAD_X = 72;
    const PAD_TOP = 60;
    const PAD_BOTTOM = 54;
    const BRAND_H = 46; ///< band at the bottom reserved for the brand line the renderer always draws
    const GAP = 26;

    const SIDE_IMAGE_W = 440; ///< full height bleed on the right for an 'image' block with slot 'right'
    const TOP_IMAGE_H = 260;
    const LOGO_H = 44;
    const LOGO_MAX_W = 320;
    const AVATAR_D = 72; ///< 'header' block avatar
    const AVATARS_D = 64; ///< 'avatars' block items
    const AVATARS_STEP = 48; ///< overlapping row

    const SCRIM_BANDS = 60;
    const SCRIM_TOP = 250;
    const SCRIM_BRIGHTNESS = 0.45; ///< share of the block strength taken off the whole picture
    const SCRIM_ALPHA = 0.85; ///< share of the block strength reached by the bottom gradient

    const COLOR_FALLBACK = '#1f2937';

    const LEGIBLE_RATIO = 4.5; ///< WCAG AA for body text, the floor every drawn string has to clear
    const LEGIBLE_PASSES = 4; ///< how many times the scrim may be strengthened before giving up
    const LEGIBLE_VEIL = 0.22; ///< alpha one strengthening pass lays over the whole card
    const LEGIBLE_GRID_W = 32; ///< the text region is averaged through a grid of this size
    const LEGIBLE_GRID_H = 16;

    protected $_sError = '';
    protected $_oManager; ///< Intervention\Image\ImageManager, GD or Imagick per getParam('enable_gd')
    protected $_bGd;
    protected $_aFonts = array(); ///< weight => absolute font file, resolved once per instance
    protected $_aLogos = array(); ///< dark flag => absolute logo file, resolved once per instance
    protected $_aTmp = array(); ///< files materialised for the current render, removed when it ends
    protected $_bDark = true; ///< light text on a dark card, recalculated for every render
    protected $_aColors = array();

    /**
     * Colours for letter avatars, indexed by the item seed. Fixed on purpose - the same participant
     * has to get the same colour in every card, otherwise the cache key would not describe the output.
     */
    protected $_aPalette = array('#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#64748b');

    protected function __construct()
    {
        if (isset($GLOBALS['bxDolClasses'][get_class($this)]))
            trigger_error ('Multiple instances are not allowed for the class: ' . get_class($this), E_USER_ERROR);

        parent::__construct();

        $oImage = BxDolImageResize::getInstance();
        $this->_oManager = $oImage->getManager();
        $this->_bGd = $oImage->isUsedGD();
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
        if(!isset($GLOBALS['bxDolClasses'][__CLASS__]))
            $GLOBALS['bxDolClasses'][__CLASS__] = new BxDolShareCardRenderer();

        return $GLOBALS['bxDolClasses'][__CLASS__];
    }

    public function getError()
    {
        return $this->_sError;
    }

    /**
     * Draw the card and write it as a JPEG.
     * @param $aCard normalised card spec, the composed block list is expected in $aCard['blocks']
     * @param $sOutFile absolute path of the file to write
     * @return boolean, false on any error - @see getError for the reason
     */
    public function render($aCard, $sOutFile)
    {
        $this->_sError = '';
        $this->_aTmp = array();

        // a logo which came from a remote storage engine lives in the tmp folder, and _cleanup()
        // deletes it when the render ends - the memo must not outlive the files it points at
        $this->_aLogos = array();

        if (!is_array($aCard))
            return $this->_error('card spec is not an array');

        if (!is_string($sOutFile) || !$sOutFile)
            return $this->_error('output file is not specified');

        $sDir = dirname($sOutFile);
        if (!is_dir($sDir) || !is_writable($sDir))
            return $this->_error('output folder is not writable: ' . $sDir);

        // a broken image, a missing font or an unreadable spec must never surface as an exception -
        // share_card.php runs in a scraper request and has to answer with bytes no matter what
        try {
            $sData = $this->_render($aCard);
        }
        catch (Throwable $oException) {
            $sData = false;
            $this->_error($oException->getMessage());
        }
        finally {
            $this->_cleanup();
        }

        if (!$sData)
            return false;

        if (!@file_put_contents($sOutFile, $sData))
            return $this->_error('can not write the card to ' . $sOutFile);

        @chmod($sOutFile, BX_DOL_FILE_RIGHTS);
        return true;
    }

    // private functions are below -------------------------------

    protected function _error($sMessage)
    {
        $this->_sError = $sMessage;
        return false;
    }

    protected function _cleanup()
    {
        foreach ($this->_aTmp as $sFile)
            @unlink($sFile);

        $this->_aTmp = array();
    }

    protected function _w()
    {
        return defined('BX_DOL_SHARE_CARD_W') ? (int)constant('BX_DOL_SHARE_CARD_W') : 1200;
    }

    protected function _h()
    {
        return defined('BX_DOL_SHARE_CARD_H') ? (int)constant('BX_DOL_SHARE_CARD_H') : 630;
    }

    /**
     * The whole pipeline, called from inside the try/catch of @see render
     * @return encoded JPEG data or false
     */
    protected function _render($aCard)
    {
        $iW = $this->_w();
        $iH = $this->_h();

        $aBlocks = $this->_getBlocks($aCard);
        $aByType = $this->_indexBlocks($aBlocks);

        // 'right' is the default slot of an 'image' block
        $sSlot = isset($aByType['image']) ? ($this->_str($aByType['image'], 'slot') ?: 'right') : '';

        $sBgFile = '';
        if (isset($aByType['background']))
            $sBgFile = $this->_resolveImage($this->_arr($aByType['background'], 'image'));

        // an 'image' block with slot 'full' is a background which the layout wants scrimmed
        if (!$sBgFile && 'full' == $sSlot)
            $sBgFile = $this->_resolveImage($this->_arr($aByType['image'], 'image'));

        $sBase = $this->_baseColor();
        $this->_bDark = $sBgFile ? true : $this->_isDarkColor($sBase);
        $this->_setColors();

        if ($sBgFile)
            $oCanvas = $this->_prepare($this->_oManager->make($sBgFile)->fit($iW, $iH));
        else
            $oCanvas = $this->_prepare($this->_oManager->canvas($iW, $iH, $sBase));

        // text over a photo is only legible with a scrim, so add one even when the layout forgot it
        if ($sBgFile) {
            $iStrength = isset($aByType['scrim']) ? (int)$this->_str($aByType['scrim'], 'strength') : 25;
            $this->_drawScrim($oCanvas, $iStrength ? $iStrength : 25);
        }

        $aBox = array('x' => self::PAD_X, 'w' => $iW - 2 * self::PAD_X, 'y' => self::PAD_TOP, 'h' => $iH - self::PAD_TOP - self::PAD_BOTTOM - self::BRAND_H);

        if ($sSlot && 'full' != $sSlot) {
            $sFile = $this->_resolveImage($this->_arr($aByType['image'], 'image'));
            if ($sFile && 'top' == $sSlot) {
                $oCanvas->insert($this->_prepare($this->_oManager->make($sFile)->fit($iW, self::TOP_IMAGE_H)), 'top-left', 0, 0);
                $aBox['y'] = self::TOP_IMAGE_H + 40;
                $aBox['h'] = $iH - $aBox['y'] - self::PAD_BOTTOM - self::BRAND_H;
            }
            elseif ($sFile) {
                $oCanvas->insert($this->_prepare($this->_oManager->make($sFile)->fit(self::SIDE_IMAGE_W, $iH)), 'top-left', $iW - self::SIDE_IMAGE_W, 0);
                $aBox['w'] = $iW - self::SIDE_IMAGE_W - 48 - self::PAD_X;
            }
        }

        // the scrim is a fixed recipe and can leave a bright picture bright, so measure what the
        // text is about to sit on before choosing its colour - and wash the card down when neither
        // colour clears the contrast floor on its own
        $this->_ensureLegible($oCanvas, array('x' => $aBox['x'], 'y' => $aBox['y'], 'w' => $aBox['w'], 'h' => $iH - self::PAD_BOTTOM - $aBox['y']), (bool)$sBgFile);

        if (isset($aByType['logo'])) {
            $iLogoH = $this->_drawLogo($oCanvas, $aBox);
            if ($iLogoH) {
                $aBox['y'] += $iLogoH + 32;
                $aBox['h'] -= $iLogoH + 32;
            }
        }

        if ($aBox['h'] > 0 && $aBox['w'] > 0)
            $this->_flow($oCanvas, $aBlocks, $aBox);

        $this->_drawBrand($oCanvas, $aBox['x'], $iH - self::PAD_BOTTOM, $aBox['w']);

        if ($oCanvas->width() != $iW || $oCanvas->height() != $iH)
            $oCanvas = $this->_prepare($oCanvas->fit($iW, $iH));

        return $this->_encode($oCanvas);
    }

    /**
     * Encode walking down the quality ladder until the result fits the 300 KB budget.
     */
    protected function _encode($oCanvas)
    {
        $sData = '';
        foreach (self::JPEG_QUALITIES as $iQuality) {
            $sData = (string)$oCanvas->encode('jpg', $iQuality)->getEncoded();
            if (!$sData)
                return $this->_error('jpeg encoding failed');

            if (strlen($sData) <= self::MAX_BYTES)
                return $sData;
        }

        return $sData;
    }

    // blocks ----------------------------------------------------

    protected function _getBlocks($aCard)
    {
        if (!empty($aCard['blocks']) && is_array($aCard['blocks']))
            return $this->_cap($aCard['blocks']);

        // share_card.php hands over the spec alone - composing it is the layout's job, so ask the
        // layout here rather than painting the minimal stack and calling every layout dead code
        $aBlocks = $this->_compose($aCard);

        return $aBlocks ? $this->_cap($aBlocks) : $this->_getBlocksDefault($aCard);
    }

    /**
     * Ask the layout of the spec for its block list.
     * @return array of blocks, empty when there is no usable layout - the caller then falls back
     *         to @see _getBlocksDefault, so a broken layout still produces a readable card
     */
    protected function _compose($aCard)
    {
        // BxDolShareCard owns the layout registry. It is a sibling class, but bx_import() fatals
        // on a missing file, so check that it is there before touching it.
        if (!class_exists('BxDolShareCard', false) && !file_exists(BX_DIRECTORY_PATH_CLASSES . 'BxDolShareCard.php'))
            return array();

        try {
            $oLayout = BxDolShareCard::getInstance()->getLayoutObject($this->_str($aCard, 'layout'), $this->_str($aCard, 'module'));
            $aBlocks = $oLayout ? $oLayout->compose($aCard) : array();
        }
        catch (Throwable $oException) {
            return array();
        }

        return is_array($aBlocks) ? $aBlocks : array();
    }

    /**
     * A card has room for a handful of blocks, cap what a layout can make the renderer measure.
     */
    protected function _cap($aBlocks)
    {
        return count($aBlocks) > self::MAX_BLOCKS ? array_slice($aBlocks, 0, self::MAX_BLOCKS) : $aBlocks;
    }

    /**
     * Minimal composition for a spec which arrived without a block list, so that a missing or broken
     * layout still produces a readable card instead of a blank one.
     */
    protected function _getBlocksDefault($aCard)
    {
        $aBlocks = array(
            array('type' => 'background', 'image' => isset($aCard['bg']) ? $aCard['bg'] : null),
            array('type' => 'scrim', 'strength' => 25),
            array('type' => 'title', 'text' => isset($aCard['title']) ? $aCard['title'] : '', 'maxLines' => 3),
        );

        if (!empty($aCard['subtitle']))
            $aBlocks[] = array('type' => 'text', 'text' => $aCard['subtitle'], 'maxLines' => 2);
        elseif (!empty($aCard['description']))
            $aBlocks[] = array('type' => 'text', 'text' => $aCard['description'], 'maxLines' => 2);

        return $aBlocks;
    }

    /**
     * First occurrence of every block type - used for the blocks which are positioned absolutely
     * (background, scrim, logo, the image column) rather than flowed.
     */
    protected function _indexBlocks($aBlocks)
    {
        $aRet = array();
        foreach ($aBlocks as $aBlock) {
            if (!is_array($aBlock) || empty($aBlock['type']))
                continue;

            if (!isset($aRet[$aBlock['type']]))
                $aRet[$aBlock['type']] = $aBlock;
        }
        return $aRet;
    }

    // layout flow -----------------------------------------------

    /**
     * Measure every flowed block, drop the optional ones until the stack fits, then draw it
     * vertically centred inside the content box.
     */
    protected function _flow($oCanvas, $aBlocks, $aBox)
    {
        $aItems = array();
        foreach ($aBlocks as $aBlock) {
            if (!is_array($aBlock) || empty($aBlock['type']))
                continue;

            $aItem = $this->_prepareBlock($aBlock, $aBox['w']);
            if ($aItem)
                $aItems[] = $aItem;
        }

        $aItems = $this->_fitStack($aItems, $aBox['h']);
        if (!$aItems)
            return;

        $iY = $aBox['y'] + (int)max(0, floor(($aBox['h'] - $this->_stackHeight($aItems)) / 2));

        $bFirst = true;
        foreach ($aItems as $aItem) {
            if (!$bFirst)
                $iY += $aItem['gap'];
            $bFirst = false;

            $this->_drawBlock($oCanvas, $aItem, $aBox['x'], $iY);
            $iY += $aItem['h'];
        }
    }

    protected function _stackHeight($aItems)
    {
        $iRet = 0;
        $bFirst = true;
        foreach ($aItems as $aItem) {
            $iRet += $aItem['h'] + ($bFirst ? 0 : $aItem['gap']);
            $bFirst = false;
        }
        return $iRet;
    }

    /**
     * Shrink an overflowing stack: first drop the optional blocks from the bottom up, then take
     * lines off the tallest multi line block until everything fits.
     */
    protected function _fitStack($aItems, $iMaxH)
    {
        while ($this->_stackHeight($aItems) > $iMaxH) {
            $iDrop = -1;
            for ($i = count($aItems) - 1; $i >= 0; $i--)
                if (!empty($aItems[$i]['drop'])) {
                    $iDrop = $i;
                    break;
                }

            if ($iDrop < 0)
                break;

            array_splice($aItems, $iDrop, 1);
        }

        for ($iGuard = 0; $iGuard < 32 && $this->_stackHeight($aItems) > $iMaxH; $iGuard++) {
            $iTallest = -1;
            foreach ($aItems as $i => $aItem)
                if (!empty($aItem['lines']) && count($aItem['lines']) > 1 && ($iTallest < 0 || $aItem['h'] > $aItems[$iTallest]['h']))
                    $iTallest = $i;

            if ($iTallest < 0)
                break;

            array_pop($aItems[$iTallest]['lines']);

            // a line was taken away, so the text is cut whether or not the new last line fits
            $iLast = count($aItems[$iTallest]['lines']) - 1;
            $aItems[$iTallest]['lines'][$iLast] = $this->_truncate($aItems[$iTallest]['lines'][$iLast], $aItems[$iTallest]['size'], $aItems[$iTallest]['weight'], $aItems[$iTallest]['maxw']);
            $aItems[$iTallest]['h'] = count($aItems[$iTallest]['lines']) * $aItems[$iTallest]['lh'];
        }

        return $aItems;
    }

    /**
     * Turn one block into a measured item: ['type', 'h', 'gap', 'drop', ...payload]
     * @return array or false when the block draws nothing
     */
    protected function _prepareBlock($aBlock, $iMaxW)
    {
        switch ($aBlock['type']) {
            case 'background':
            case 'scrim':
            case 'logo':
            case 'image':
                return false; // positioned blocks, not part of the vertical flow

            case 'title':
                return $this->_prepareText($aBlock, $iMaxW, 60, 1.18, 'bold', 3, false);

            case 'text':
                return $this->_prepareText($aBlock, $iMaxW, 28, 1.42, 'regular', 2, true);

            case 'footer':
                return $this->_prepareText($aBlock, $iMaxW, 24, 1.35, 'regular', 1, true);

            case 'header':
                return $this->_prepareHeader($aBlock, $iMaxW);

            case 'avatars':
                return $this->_prepareAvatars($aBlock, $iMaxW);

            case 'label':
                return $this->_preparePills(array($this->_str($aBlock, 'text')), $iMaxW);

            case 'badges':
                return $this->_preparePills($this->_arr($aBlock, 'items'), $iMaxW);
        }

        return false;
    }

    protected function _prepareText($aBlock, $iMaxW, $iSize, $fLineHeight, $sWeight, $iDefaultLines, $bDrop)
    {
        $sText = $this->_str($aBlock, 'text');
        if (!$sText)
            return false;

        $iLines = isset($aBlock['maxLines']) ? (int)$aBlock['maxLines'] : $iDefaultLines;
        if ($iLines < 1)
            $iLines = $iDefaultLines;

        $aLines = $this->_wrap($sText, $iSize, $sWeight, $iMaxW, $iLines);
        if (!$aLines)
            return false;

        $iLh = (int)round($iSize * $fLineHeight);
        return array(
            'type' => 'lines',
            'lines' => $aLines,
            'size' => $iSize,
            'weight' => $sWeight,
            'lh' => $iLh,
            'maxw' => $iMaxW,
            'color' => 'bold' == $sWeight ? $this->_aColors['text'] : $this->_aColors['muted'],
            'h' => count($aLines) * $iLh,
            'gap' => 'bold' == $sWeight ? self::GAP : (int)round(self::GAP * 0.7),
            'drop' => $bDrop,
        );
    }

    protected function _prepareHeader($aBlock, $iMaxW)
    {
        $sName = $this->_str($aBlock, 'name');
        $sMeta = $this->_str($aBlock, 'meta');
        $sAvatar = $this->_resolveImage($this->_arr($aBlock, 'avatar'));

        if (!$sName && !$sMeta && !$sAvatar)
            return false;

        $iTextW = $iMaxW - ($sAvatar ? self::AVATAR_D + 22 : 0);
        $aName = $sName ? $this->_wrap($sName, 30, 'bold', $iTextW, 1) : array();
        $aMeta = $sMeta ? $this->_wrap($sMeta, 24, 'regular', $iTextW, 1) : array();

        return array(
            'type' => 'header',
            'avatar' => $sAvatar,
            'name' => $aName ? $aName[0] : '',
            'meta' => $aMeta ? $aMeta[0] : '',
            'h' => $sAvatar ? self::AVATAR_D : ($aMeta ? 66 : 36),
            'gap' => self::GAP,
            'drop' => false,
        );
    }

    protected function _prepareAvatars($aBlock, $iMaxW)
    {
        $aItems = $this->_arr($aBlock, 'items');
        if (!$aItems)
            return false;

        $iOverflow = (int)(isset($aBlock['overflow']) ? $aBlock['overflow'] : 0);
        $iRoom = $iMaxW - self::AVATARS_D - ($iOverflow > 0 ? self::AVATARS_D + (self::AVATARS_D - self::AVATARS_STEP) + 10 : 0);

        $iMax = (int)floor($iRoom / self::AVATARS_STEP);
        if ($iMax < 1)
            return false;

        $aReady = array();
        foreach ($aItems as $mixedItem) {
            if (count($aReady) >= $iMax)
                break;

            if (!is_array($mixedItem))
                continue;

            if (isset($mixedItem['letter'])) {
                $aReady[] = array('letter' => $this->_firstLetter($this->_str($mixedItem, 'letter')), 'seed' => (int)(isset($mixedItem['seed']) ? $mixedItem['seed'] : 0));
                continue;
            }

            $sFile = $this->_resolveImage($mixedItem);
            if ($sFile)
                $aReady[] = array('file' => $sFile);
        }

        if (!$aReady)
            return false;

        return array(
            'type' => 'avatars',
            'items' => $aReady,
            'overflow' => $iOverflow,
            'h' => self::AVATARS_D + 6,
            'gap' => self::GAP,
            'drop' => true,
        );
    }

    protected function _preparePills($aItems, $iMaxW)
    {
        if (!$aItems)
            return false;

        $aReady = array();
        $iX = 0;
        foreach ($aItems as $sItem) {
            $sItem = $this->_clean((string)$sItem);
            if (!$sItem)
                continue;

            $aBox = $this->_measure($sItem, 22, 'bold');
            $iW = $aBox['w'] + 40;
            if ($iX + $iW > $iMaxW)
                break;

            $aReady[] = array('text' => $sItem, 'x' => $iX, 'w' => $iW);
            $iX += $iW + 12;
        }

        if (!$aReady)
            return false;

        return array(
            'type' => 'pills',
            'items' => $aReady,
            'h' => 38,
            'gap' => self::GAP,
            'drop' => true,
        );
    }

    // drawing ---------------------------------------------------

    protected function _drawBlock($oCanvas, $aItem, $iX, $iY)
    {
        switch ($aItem['type']) {
            case 'lines':
                $iBaseline = $iY + (int)round($aItem['size'] * 0.86);
                foreach ($aItem['lines'] as $sLine) {
                    $this->_text($oCanvas, $sLine, $iX, $iBaseline, $aItem['size'], $aItem['color'], 'bold' == $aItem['weight']);
                    $iBaseline += $aItem['lh'];
                }
                break;

            case 'header':
                $iTextX = $iX;
                if ($aItem['avatar']) {
                    $this->_drawAvatar($oCanvas, $aItem['avatar'], $iX, $iY, self::AVATAR_D);
                    $iTextX = $iX + self::AVATAR_D + 22;
                }

                if ($aItem['name'] && $aItem['meta']) {
                    $this->_text($oCanvas, $aItem['name'], $iTextX, $iY + 28, 30, $this->_aColors['text'], true);
                    $this->_text($oCanvas, $aItem['meta'], $iTextX, $iY + 64, 24, $this->_aColors['muted'], false);
                }
                elseif ($aItem['name']) {
                    $this->_text($oCanvas, $aItem['name'], $iTextX, $iY + (int)round($aItem['h'] / 2) + 10, 30, $this->_aColors['text'], true);
                }
                elseif ($aItem['meta']) {
                    $this->_text($oCanvas, $aItem['meta'], $iTextX, $iY + (int)round($aItem['h'] / 2) + 8, 24, $this->_aColors['muted'], false);
                }
                break;

            case 'avatars':
                $this->_drawAvatars($oCanvas, $aItem, $iX, $iY);
                break;

            case 'pills':
                foreach ($aItem['items'] as $aPill)
                    $this->_drawPill($oCanvas, $aPill['text'], $iX + $aPill['x'], $iY, $aPill['w'], $aItem['h']);
                break;
        }
    }

    protected function _drawAvatars($oCanvas, $aItem, $iX, $iY)
    {
        $iD = self::AVATARS_D;
        $iCurrent = $iX;

        foreach ($aItem['items'] as $aOne) {
            // a light ring keeps the overlapping circles apart, the same way the web units do it
            $this->_drawRounded($oCanvas, $iCurrent - 3, $iY, $iD + 6, $iD + 6, ($iD + 6) / 2, 'rgba(255, 255, 255, 0.90)');

            if (isset($aOne['file']))
                $this->_drawAvatar($oCanvas, $aOne['file'], $iCurrent, $iY + 3, $iD);
            else
                $this->_drawLetterAvatar($oCanvas, $aOne['letter'], $aOne['seed'], $iCurrent, $iY + 3, $iD);

            $iCurrent += self::AVATARS_STEP;
        }

        if ($aItem['overflow'] > 0) {
            // $iCurrent is the next overlapping slot, push the counter clear of the last avatar
            $iLeft = $iCurrent + (self::AVATARS_D - self::AVATARS_STEP) + 10;
            $this->_drawRounded($oCanvas, $iLeft, $iY + 3, $iD, $iD, $iD / 2, $this->_aColors['pill']);
            $this->_textCentered($oCanvas, '+' . $aItem['overflow'], $iLeft + (int)round($iD / 2), $iY + 3 + (int)round($iD / 2), 24, $this->_aColors['text'], true);
        }
    }

    protected function _drawPill($oCanvas, $sText, $iX, $iY, $iW, $iH)
    {
        $this->_drawRounded($oCanvas, $iX, $iY, $iW, $iH, $iH / 2, $this->_aColors['pill']);
        $this->_textCentered($oCanvas, $sText, $iX + (int)round($iW / 2), $iY + (int)round($iH / 2), 22, $this->_aColors['text'], true);
    }

    /**
     * Filled rounded rectangle - also the only circle primitive used here, with a radius of half the
     * side. Intervention offers rectangle() and circle() but no rounded rectangle, and on GD both are
     * jagged; composing a pill out of them would stack the alpha where the shapes overlap.
     */
    protected function _drawRounded($oCanvas, $iX, $iY, $iW, $iH, $iR, $sColor)
    {
        $iX = (int)round($iX);
        $iY = (int)round($iY);
        $iW = (int)round($iW);
        $iH = (int)round($iH);
        if ($iW < 1 || $iH < 1)
            return;

        $iR = (int)max(0, min(round($iR), floor(min($iW, $iH) / 2)));

        if (!$this->_bGd) {
            $oDraw = new ImagickDraw();
            $oDraw->setFillColor(new ImagickPixel($sColor));
            $oDraw->roundRectangle($iX, $iY, $iX + $iW - 1, $iY + $iH - 1, $iR, $iR);
            $oCanvas->getCore()->drawImage($oDraw);
            return;
        }

        // GD antialiases nothing it fills, so draw the whole figure once on its own layer at 4x with
        // blending off - overlapping parts then overwrite instead of stacking their alpha - and let
        // the downscale produce the smooth edge
        $iScale = 4;
        $iBw = $iW * $iScale;
        $iBh = $iH * $iScale;
        $iBr = $iR * $iScale;

        $rLayer = $this->_layer($iBw, $iBh);
        $aRgba = $this->_parseColor($sColor);
        $iColor = imagecolorallocatealpha($rLayer, $aRgba[0], $aRgba[1], $aRgba[2], (int)round(127 * (1 - $aRgba[3])));

        if ($iBr > 0) {
            imagefilledrectangle($rLayer, $iBr, 0, $iBw - 1 - $iBr, $iBh - 1, $iColor);
            imagefilledrectangle($rLayer, 0, $iBr, $iBw - 1, $iBh - 1 - $iBr, $iColor);
            imagefilledellipse($rLayer, $iBr, $iBr, $iBr * 2, $iBr * 2, $iColor);
            imagefilledellipse($rLayer, $iBw - 1 - $iBr, $iBr, $iBr * 2, $iBr * 2, $iColor);
            imagefilledellipse($rLayer, $iBr, $iBh - 1 - $iBr, $iBr * 2, $iBr * 2, $iColor);
            imagefilledellipse($rLayer, $iBw - 1 - $iBr, $iBh - 1 - $iBr, $iBr * 2, $iBr * 2, $iColor);
        }
        else {
            imagefilledrectangle($rLayer, 0, 0, $iBw - 1, $iBh - 1, $iColor);
        }

        $rOut = $this->_layer($iW, $iH);
        imagecopyresampled($rOut, $rLayer, 0, 0, 0, 0, $iW, $iH, $iBw, $iBh);
        imagedestroy($rLayer);

        imagealphablending($oCanvas->getCore(), true);
        imagecopy($oCanvas->getCore(), $rOut, $iX, $iY, 0, 0, $iW, $iH);
        imagedestroy($rOut);
    }

    /**
     * Fully transparent GD canvas, ready to be composed onto and then resampled with its alpha kept.
     */
    protected function _layer($iW, $iH)
    {
        $rLayer = imagecreatetruecolor($iW, $iH);
        imagealphablending($rLayer, false);
        imagesavealpha($rLayer, true);
        imagefill($rLayer, 0, 0, imagecolorallocatealpha($rLayer, 0, 0, 0, 127));
        return $rLayer;
    }

    protected function _drawAvatar($oCanvas, $sFile, $iX, $iY, $iD)
    {
        $oAvatar = $this->_circle($sFile, $iD);
        if ($oAvatar)
            $oCanvas->insert($oAvatar, 'top-left', $iX, $iY);
    }

    protected function _drawLetterAvatar($oCanvas, $sLetter, $iSeed, $iX, $iY, $iD)
    {
        $this->_drawRounded($oCanvas, $iX, $iY, $iD, $iD, $iD / 2, $this->_aPalette[abs($iSeed) % count($this->_aPalette)]);

        if ($sLetter)
            $this->_textCentered($oCanvas, $sLetter, $iX + (int)round($iD / 2), $iY + (int)round($iD / 2), (int)round($iD * 0.44), '#ffffff', true);
    }

    protected function _drawScrim($oCanvas, $iStrength)
    {
        $iStrength = max(0, min(100, (int)$iStrength));
        if (!$iStrength)
            return;

        // The block strength is a 0..100 intensity, not a brightness delta: the layouts ask for
        // 25..60 and a one to one map would crush a photo to black well before the top of that
        // range. Part of it comes off the whole picture, the rest builds the bottom gradient.
        $iBrightness = (int)round($iStrength * self::SCRIM_BRIGHTNESS);

        if ($this->_bGd)
            // the same filter Intervention's brightness() applies, but with an integer argument:
            // the library hands imagefilter() a float ($level * 2.55), deprecated since PHP 8.1
            imagefilter($oCanvas->getCore(), IMG_FILTER_BRIGHTNESS, (int)round(-$iBrightness * 2.55));
        else
            $oCanvas->brightness(-$iBrightness);

        // Intervention has no gradient primitive, so the bottom fade is a stack of thin bands of
        // rising black alpha - 60 of them is enough to look continuous at this size
        $iW = $this->_w();
        $iH = $this->_h();
        $iTop = min(self::SCRIM_TOP, $iH - 1);
        $fBand = ($iH - $iTop) / self::SCRIM_BANDS;
        $fAlpha = self::SCRIM_ALPHA * $iStrength / 100;

        for ($i = 0; $i < self::SCRIM_BANDS; $i++) {
            $iY1 = $iTop + (int)floor($i * $fBand);
            // rectangle() paints both edges, so stop one row short of the next band - a shared row
            // would take the alpha twice and show up as a seam
            $iY2 = min($iH - 1, $iTop + (int)floor(($i + 1) * $fBand) - 1);
            if ($iY2 < $iY1)
                continue;

            $sColor = 'rgba(0, 0, 0, ' . number_format($fAlpha * pow(($i + 1) / self::SCRIM_BANDS, 1.6), 2, '.', '') . ')';
            $oCanvas->rectangle(0, $iY1, $iW - 1, $iY2, function ($oShape) use ($sColor) {
                $oShape->background($sColor);
            });
        }
    }

    /**
     * @return the height the logo occupies, 0 when no usable raster logo is configured
     */
    protected function _drawLogo($oCanvas, $aBox)
    {
        $sFile = $this->_getLogoFile($this->_bDark);
        if (!$sFile)
            return 0;

        try {
            $oLogo = $this->_prepare($this->_oManager->make($sFile)->resize(self::LOGO_MAX_W, self::LOGO_H, function ($oConstraint) {
                $oConstraint->aspectRatio();
            }));
        }
        catch (Throwable $oException) {
            return 0;
        }

        $oCanvas->insert($oLogo, 'top-left', $aBox['x'], $aBox['y']);
        return $oLogo->height();
    }

    /**
     * The brand line the renderer always appends, whatever the layout composed.
     */
    protected function _drawBrand($oCanvas, $iX, $iBaseline, $iMaxW)
    {
        $sTitle = $this->_clean((string)getParam('site_title'));
        if (!$sTitle)
            return;

        $aLines = $this->_wrap($sTitle, 26, 'bold', $iMaxW, 1);
        if ($aLines)
            $this->_text($oCanvas, $aLines[0], $iX, $iBaseline, 26, $this->_aColors['muted'], true);
    }

    // colours ---------------------------------------------------

    protected function _setColors()
    {
        $this->_aColors = $this->_palette($this->_bDark);
    }

    /**
     * @param $bDark - light text for a dark card, dark text for a light one
     */
    protected function _palette($bDark)
    {
        if ($bDark)
            return array(
                'text' => '#ffffff',
                'muted' => 'rgba(255, 255, 255, 0.78)',
                'pill' => 'rgba(255, 255, 255, 0.18)',
            );

        return array(
            'text' => '#111827',
            'muted' => 'rgba(17, 24, 39, 0.70)',
            'pill' => 'rgba(17, 24, 39, 0.08)',
        );
    }

    /**
     * Legibility, measured rather than assumed: average the region the text will occupy, take the
     * text colour from that luminance, and if neither colour reaches LEGIBLE_RATIO against it -
     * which happens on a mid tone photograph - wash the whole card away from the text colour until
     * it does. Called once the background, the scrim and the picture columns are on the canvas.
     */
    protected function _ensureLegible($oCanvas, $aBox, $bScrimmed)
    {
        $aBg = $this->_sampleRegion($oCanvas, $aBox);
        if (!$aBg)
            return; // nothing measurable, keep what the base colour suggested

        // A scrimmed card also carries a black gradient along its bottom edge, and the brand line
        // sits inside that gradient, so a picture commits the card to light text however bright
        // its average is - there the second half of this pass does the work. A flat canvas has no
        // such constraint and simply takes the colour which measures better on it.
        if ($bScrimmed)
            $this->_bDark = true;
        else {
            $aLightText = $this->_palette(true);
            $aDarkText = $this->_palette(false);
            $this->_bDark = $this->_contrast($aLightText['muted'], $aBg) >= $this->_contrast($aDarkText['muted'], $aBg);
        }

        $this->_setColors();

        // 'muted' is the weakest colour the card draws, so clearing the floor with it clears it
        // for the title and the brand line too
        for ($i = 0; $i < self::LEGIBLE_PASSES && $this->_contrast($this->_aColors['muted'], $aBg) < self::LEGIBLE_RATIO; $i++) {
            // the wash covers the whole canvas - over the text box alone it would draw an edge
            $this->_veil($oCanvas, $this->_bDark ? '#000000' : '#ffffff', self::LEGIBLE_VEIL);

            $aBg = $this->_sampleRegion($oCanvas, $aBox);
            if (!$aBg)
                return;
        }
    }

    protected function _veil($oCanvas, $sColor, $fAlpha)
    {
        $aRgb = $this->_parseColor($sColor);
        $sRgba = 'rgba(' . (int)$aRgb[0] . ', ' . (int)$aRgb[1] . ', ' . (int)$aRgb[2] . ', ' . number_format($fAlpha, 2, '.', '') . ')';

        $oCanvas->rectangle(0, 0, $this->_w() - 1, $this->_h() - 1, function ($oShape) use ($sRgba) {
            $oShape->background($sRgba);
        });
    }

    /**
     * Mean colour of a rectangle of the canvas, read through a small grid so a whole region costs
     * a few hundred pixel reads instead of half a million.
     * @return array(r, g, b) or null when the region can not be read
     */
    protected function _sampleRegion($oCanvas, $aBox)
    {
        $iX = (int)max(0, $aBox['x']);
        $iY = (int)max(0, $aBox['y']);
        $iW = (int)min($this->_w() - $iX, $aBox['w']);
        $iH = (int)min($this->_h() - $iY, $aBox['h']);
        if ($iW < 2 || $iH < 2)
            return null;

        try {
            return $this->_bGd ? $this->_sampleGd($oCanvas, $iX, $iY, $iW, $iH) : $this->_sampleImagick($oCanvas, $iX, $iY, $iW, $iH);
        }
        catch (Throwable $oException) {
            return null;
        }
    }

    protected function _sampleGd($oCanvas, $iX, $iY, $iW, $iH)
    {
        $iGw = (int)min(self::LEGIBLE_GRID_W, $iW);
        $iGh = (int)min(self::LEGIBLE_GRID_H, $iH);

        $rGrid = imagecreatetruecolor($iGw, $iGh);
        imagealphablending($rGrid, false);
        imagecopyresampled($rGrid, $oCanvas->getCore(), 0, 0, $iX, $iY, $iGw, $iGh, $iW, $iH);

        $aSum = array(0, 0, 0);
        for ($iRow = 0; $iRow < $iGh; $iRow++)
            for ($iCol = 0; $iCol < $iGw; $iCol++) {
                $iColor = imagecolorat($rGrid, $iCol, $iRow);
                $aSum[0] += ($iColor >> 16) & 0xff;
                $aSum[1] += ($iColor >> 8) & 0xff;
                $aSum[2] += $iColor & 0xff;
            }

        imagedestroy($rGrid);

        $iCount = $iGw * $iGh;
        return array($aSum[0] / $iCount, $aSum[1] / $iCount, $aSum[2] / $iCount);
    }

    protected function _sampleImagick($oCanvas, $iX, $iY, $iW, $iH)
    {
        $oCrop = clone $oCanvas->getCore();
        $oCrop->cropImage($iW, $iH, $iX, $iY);
        $oCrop->setImagePage(0, 0, 0, 0);

        // a one pixel box filter is the mean of the region
        $oCrop->resizeImage(1, 1, Imagick::FILTER_BOX, 1);
        $aColor = $oCrop->getImagePixelColor(0, 0)->getColor();
        $oCrop->destroy();

        return array((float)$aColor['r'], (float)$aColor['g'], (float)$aColor['b']);
    }

    /**
     * WCAG contrast ratio of a text colour against a background, compositing the colour over that
     * background first when it is translucent - 'muted' and 'pill' always are.
     */
    protected function _contrast($sColor, $aBg)
    {
        $aText = $this->_parseColor($sColor);
        $fAlpha = $aText[3];

        $aOver = array(
            $fAlpha * $aText[0] + (1 - $fAlpha) * $aBg[0],
            $fAlpha * $aText[1] + (1 - $fAlpha) * $aBg[1],
            $fAlpha * $aText[2] + (1 - $fAlpha) * $aBg[2],
        );

        $fText = $this->_luminance($aOver);
        $fBack = $this->_luminance($aBg);

        return (max($fText, $fBack) + 0.05) / (min($fText, $fBack) + 0.05);
    }

    /**
     * WCAG relative luminance of an array(r, g, b), 0 .. 1.
     */
    protected function _luminance($aRgb)
    {
        $fRet = 0;
        $aWeights = array(0.2126, 0.7152, 0.0722);

        foreach ($aWeights as $i => $fWeight) {
            $f = max(0, min(255, (float)$aRgb[$i])) / 255;
            $fRet += $fWeight * ($f <= 0.03928 ? $f / 12.92 : pow(($f + 0.055) / 1.055, 2.4));
        }

        return $fRet;
    }

    protected function _baseColor()
    {
        $sColor = trim((string)getParam('sys_pwa_manifest_theme_color'));
        if (preg_match('/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i', $sColor))
            return '#' . ltrim($sColor, '#');

        $sLogo = $this->_getLogoFile(false);
        if ($sLogo) {
            $aRgb = BxDolImageResize::getInstance()->getAverageColor($sLogo);
            if (is_array($aRgb) && isset($aRgb['r']))
                return sprintf('#%02x%02x%02x', (int)$aRgb['r'], (int)$aRgb['g'], (int)$aRgb['b']);
        }

        return self::COLOR_FALLBACK;
    }

    protected function _isDarkColor($sColor)
    {
        $aRgba = $this->_parseColor($sColor);
        return (0.299 * $aRgba[0] + 0.587 * $aRgba[1] + 0.114 * $aRgba[2]) / 255 < 0.62;
    }

    /**
     * '#abc', '#aabbcc', 'rgb(1, 2, 3)' and 'rgba(1, 2, 3, 0.5)' to array(r, g, b, alpha 0..1).
     */
    protected function _parseColor($sColor)
    {
        $sColor = trim((string)$sColor);

        $aMatch = array();
        if (preg_match('/^rgba?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([0-9.]+)\s*)?\)$/i', $sColor, $aMatch))
            return array(
                min(255, (int)$aMatch[1]),
                min(255, (int)$aMatch[2]),
                min(255, (int)$aMatch[3]),
                isset($aMatch[4]) ? max(0, min(1, (float)$aMatch[4])) : 1.0,
            );

        $sHex = ltrim($sColor, '#');
        if (3 == strlen($sHex))
            $sHex = $sHex[0] . $sHex[0] . $sHex[1] . $sHex[1] . $sHex[2] . $sHex[2];

        if (6 == strlen($sHex) && ctype_xdigit($sHex))
            return array((int)hexdec(substr($sHex, 0, 2)), (int)hexdec(substr($sHex, 2, 2)), (int)hexdec(substr($sHex, 4, 2)), 1.0);

        return array(255, 255, 255, 1.0);
    }

    // text ------------------------------------------------------

    /**
     * Absolute path of the font file for a weight, '' when text can not be drawn at all.
     */
    protected function _font($sWeight = 'regular')
    {
        if (isset($this->_aFonts[$sWeight]))
            return $this->_aFonts[$sWeight];

        $sPath = '';

        // BxDolShareCard owns the font policy (the sys_share_card_font option, then the bundled
        // Inter). It is a sibling class, but bx_import() fatals on a missing file, so check first.
        if (class_exists('BxDolShareCard', false) || file_exists(BX_DIRECTORY_PATH_CLASSES . 'BxDolShareCard.php'))
            $sPath = (string)BxDolShareCard::getInstance()->getFontPath($sWeight);

        if (!$sPath) {
            $sCustom = trim((string)getParam('sys_share_card_font'));
            if ($sCustom && is_readable($sCustom))
                $sPath = $sCustom;
            elseif (is_readable(BX_DIRECTORY_PATH_BASE . self::FONT_DEFAULT))
                $sPath = BX_DIRECTORY_PATH_BASE . self::FONT_DEFAULT;
        }

        if ($sPath && !is_readable($sPath))
            $sPath = '';

        return ($this->_aFonts[$sWeight] = $sPath);
    }

    /**
     * Draw one line of text, $iBaseline is the baseline of the line and $iX its left edge.
     *
     * Bold is faked by redrawing the same string one pixel to the right: the bundled Inter is a
     * variable font and both GD and Imagick render its default (Regular) instance only. Every
     * coordinate is an integer - floats are deprecated in the PHP 8 drawing functions.
     */
    protected function _text($oImg, $sText, $iX, $iBaseline, $iSize, $sColor, $bBold = false)
    {
        $sFile = $this->_font($bBold ? 'bold' : 'regular');
        if (!$sFile || '' === $sText)
            return;

        $bFaux = $bBold && $sFile === $this->_font('regular');
        $bGd = $this->_bGd;

        $iX = (int)round($iX);
        $iBaseline = (int)round($iBaseline);
        $iSize = (int)round($iSize);

        for ($i = 0; $i <= ($bFaux ? 1 : 0); $i++) {
            $iPosX = $iX + $i;
            $oImg->text($sText, $iPosX, $iBaseline, function ($oFont) use ($sFile, $iSize, $sColor, $bGd) {
                $oFont->file($sFile);
                $oFont->size($iSize);
                $oFont->color($sColor);

                // GD treats a null alignment as "draw at the baseline", which is what the caller
                // passes; Imagick would emit a deprecation for the null, so name the same defaults
                if (!$bGd) {
                    $oFont->align('left');
                    $oFont->valign('bottom');
                }
            });
        }
    }

    protected function _textCentered($oImg, $sText, $iCx, $iCy, $iSize, $sColor, $bBold = false)
    {
        $aBox = $this->_measure($sText, $iSize, $bBold ? 'bold' : 'regular');
        $this->_text($oImg, $sText, $iCx - (int)round($aBox['w'] / 2), $iCy + (int)round($iSize * 0.36), $iSize, $sColor, $bBold);
    }

    /**
     * Width and height of a string, measured with the same engine which will draw it.
     */
    protected function _measure($sText, $iSize, $sWeight = 'regular')
    {
        $aRet = array('w' => 0, 'h' => 0);

        $sFile = $this->_font($sWeight);
        if (!$sFile || '' === $sText)
            return $aRet;

        if ($this->_bGd) {
            // Intervention's GD font converts pixels to points the same way, keep them in step
            $aBox = @imagettfbbox((int)ceil($iSize * 0.75), 0, $sFile, $sText);
            if (!is_array($aBox))
                return $aRet;

            return array('w' => (int)abs($aBox[4] - $aBox[0]), 'h' => (int)abs($aBox[5] - $aBox[1]));
        }

        $oDraw = new ImagickDraw();
        $oDraw->setFont($sFile);
        $oDraw->setFontSize($iSize);
        $aMetrics = (new Imagick())->queryFontMetrics($oDraw, $sText);

        return array('w' => (int)round($aMetrics['textWidth']), 'h' => (int)round($aMetrics['textHeight']));
    }

    /**
     * Greedy word wrap into at most $iMaxLines lines of at most $iMaxW pixels, with an ellipsis
     * on the last line when there is more text than fits.
     */
    protected function _wrap($sText, $iSize, $sWeight, $iMaxW, $iMaxLines)
    {
        $sText = $this->_clean($sText);
        if ('' === $sText || $iMaxW < 1 || $iMaxLines < 1)
            return array();

        $aWords = preg_split('/\s+/u', $sText, -1, PREG_SPLIT_NO_EMPTY);
        if (!$aWords)
            return array();

        $aLines = array();
        $sLine = '';
        $bMore = false;

        foreach ($aWords as $sWord) {
            $sCandidate = '' === $sLine ? $sWord : $sLine . ' ' . $sWord;
            $aBox = $this->_measure($sCandidate, $iSize, $sWeight);

            if ($aBox['w'] <= $iMaxW || '' === $sLine) {
                // a single word wider than the box still goes on its own line, it is cut below
                $sLine = $sCandidate;
                continue;
            }

            $aLines[] = $sLine;
            $sLine = $sWord;

            if (count($aLines) >= $iMaxLines) {
                $bMore = true;
                break;
            }
        }

        if (!$bMore && '' !== $sLine)
            $aLines[] = $sLine;
        elseif ($bMore && '' !== $sLine)
            $aLines[count($aLines) - 1] = $this->_truncate($aLines[count($aLines) - 1] . ' ' . $sLine, $iSize, $sWeight, $iMaxW);

        if (count($aLines) > $iMaxLines)
            $aLines = array_slice($aLines, 0, $iMaxLines);

        return $this->_ellipsize($aLines, $iSize, $sWeight, $iMaxW);
    }

    /**
     * Make sure every line fits the box, cutting the ones which do not on a character boundary
     * with an ellipsis. Not only the last one: the wrapper puts a token which is wider than the
     * box on a line of its own wherever it falls, and urls and long compound words do that in the
     * middle of a title as readily as at its end.
     */
    protected function _ellipsize($aLines, $iSize, $sWeight, $iMaxW)
    {
        foreach ($aLines as $i => $sLine) {
            $aBox = $this->_measure($sLine, $iSize, $sWeight);
            if ($aBox['w'] > $iMaxW)
                $aLines[$i] = $this->_truncate($sLine, $iSize, $sWeight, $iMaxW);
        }

        return $aLines;
    }

    protected function _truncate($sText, $iSize, $sWeight, $iMaxW)
    {
        $sEllipsis = "\xE2\x80\xA6";

        for ($iLen = mb_strlen($sText, 'UTF-8'); $iLen > 0; $iLen--) {
            $sCut = rtrim(mb_substr($sText, 0, $iLen, 'UTF-8')) . $sEllipsis;
            $aBox = $this->_measure($sCut, $iSize, $sWeight);
            if ($aBox['w'] <= $iMaxW)
                return $sCut;
        }

        return $sEllipsis;
    }

    /**
     * Whitespace and control character normaliser. Producers are supposed to hand over plain text
     * already, this only guards the drawing functions against what slipped through.
     */
    protected function _clean($sText)
    {
        if (!is_string($sText) || '' === $sText)
            return '';

        if (class_exists('BxDolShareCard', false) || file_exists(BX_DIRECTORY_PATH_CLASSES . 'BxDolShareCard.php'))
            return (string)BxDolShareCard::cleanText($sText);

        $sText = preg_replace('/[\x00-\x1f\x7f]/u', ' ', $sText);
        $sText = preg_replace('/[\x{200b}-\x{200f}\x{feff}]/u', '', $sText);
        return trim(preg_replace('/\s+/u', ' ', $sText));
    }

    protected function _firstLetter($sText)
    {
        $sText = trim((string)$sText);
        if ('' === $sText)
            return '';

        $sLetter = function_exists('grapheme_substr') ? grapheme_substr($sText, 0, 1) : mb_substr($sText, 0, 1, 'UTF-8');
        return mb_strtoupper((string)$sLetter, 'UTF-8');
    }

    // images ----------------------------------------------------

    /**
     * GD builds the destination of fit()/resize() with alpha blending off and save alpha on, which
     * would make every semi transparent shape drawn afterwards replace pixels instead of blending
     * with them. Put the core back into the state the drawing code expects.
     */
    protected function _prepare($oImg)
    {
        if ($this->_bGd && $oImg && is_object($oImg->getCore())) {
            imagealphablending($oImg->getCore(), true);
            imagesavealpha($oImg->getCore(), false);
        }

        return $oImg;
    }

    /**
     * Square, circularly masked copy of an image file.
     * @return Intervention image or null
     */
    protected function _circle($sFile, $iD)
    {
        try {
            $oImg = $this->_oManager->make($sFile);
            return $this->_bGd ? $this->_circleGd($oImg, $iD) : $this->_circleImagick($oImg->fit($iD, $iD), $iD);
        }
        catch (Throwable $oException) {
            return null;
        }
    }

    /**
     * GD has no clipping region and Intervention's mask() walks the image pixel by pixel through the
     * command dispatcher, which is far too slow here. Copy the disc row by row at 4x and scale the
     * result down instead - that is one imagecopy() per row and the downscale gives the antialiasing.
     */
    protected function _circleGd($oImg, $iD)
    {
        $iScale = 4;
        $iBig = $iD * $iScale;

        $oImg->fit($iBig, $iBig);
        $rSrc = $oImg->getCore();
        $rBig = $this->_layer($iBig, $iBig);

        $fR = $iBig / 2;
        for ($iY = 0; $iY < $iBig; $iY++) {
            $fDy = $iY + 0.5 - $fR;
            $fDx = $fR * $fR - $fDy * $fDy;
            if ($fDx <= 0)
                continue;

            $fDx = sqrt($fDx);
            $iX1 = (int)max(0, ceil($fR - $fDx));
            $iX2 = (int)min($iBig - 1, floor($fR + $fDx));
            if ($iX2 >= $iX1)
                imagecopy($rBig, $rSrc, $iX1, $iY, $iX1, $iY, $iX2 - $iX1 + 1, 1);
        }

        $rOut = $this->_layer($iD, $iD);
        imagecopyresampled($rOut, $rBig, 0, 0, 0, 0, $iD, $iD, $iBig, $iBig);
        imagedestroy($rBig);

        $oImg->setCore($rOut);
        return $oImg;
    }

    /**
     * The mask carries the disc in its alpha channel and DSTIN keeps the source only where the mask
     * is opaque. COPYOPACITY would look like the obvious call, but ImageMagick 7 aliases it to
     * COPYALPHA, which copies the mask alpha rather than its luminance and so cuts nothing.
     */
    protected function _circleImagick($oImg, $iD)
    {
        $oMask = new Imagick();
        $oMask->newImage($iD, $iD, new ImagickPixel('transparent'));
        $oMask->setImageFormat('png');

        $oDraw = new ImagickDraw();
        $oDraw->setFillColor(new ImagickPixel('white'));
        $oDraw->circle($iD / 2, $iD / 2, $iD / 2, 0);
        $oMask->drawImage($oDraw);

        $oCore = $oImg->getCore();
        $oCore->setImageFormat('png');
        $oCore->setImageAlphaChannel(defined('Imagick::ALPHACHANNEL_OPAQUE') ? Imagick::ALPHACHANNEL_OPAQUE : Imagick::ALPHACHANNEL_SET);
        $oCore->compositeImage($oMask, Imagick::COMPOSITE_DSTIN, 0, 0);
        $oMask->destroy();

        return $oImg;
    }

    /**
     * Turn an image spec into a readable local file.
     * Accepts ['id' => .., 'object' => storage], ['id' => .., 'transcoder' => transcoder] and
     * ['url' => ..], the shapes BxDolMetatags::addPageMetaInfo() takes.
     * @return absolute path or '' when the picture can not be used
     */
    protected function _resolveImage($mixedImage)
    {
        if (!is_array($mixedImage) || !$mixedImage)
            return '';

        // same order of preference as BxDolMetatags::addPageMetaInfo()
        $sFile = '';
        if (!empty($mixedImage['object']) && !empty($mixedImage['id']))
            $sFile = $this->_resolveStored((string)$mixedImage['object'], (int)$mixedImage['id']);
        elseif (!empty($mixedImage['transcoder']) && !empty($mixedImage['id']))
            $sFile = $this->_resolveTranscoded((string)$mixedImage['transcoder'], (int)$mixedImage['id']);
        elseif (!empty($mixedImage['url']))
            $sFile = $this->_resolveUrl((string)$mixedImage['url']);

        return $sFile && $this->_isDrawableFile($sFile) ? $sFile : '';
    }

    protected function _resolveStored($sObject, $iFileId)
    {
        if ($iFileId < 1)
            return '';

        $oStorage = BxDolStorage::getObjectInstance($sObject);
        return $oStorage ? $this->_resolveStorageFile($oStorage, $iFileId) : '';
    }

    /**
     * A site branding file read straight out of its storage, private flag and all.
     * Only for pictures an administrator chose in Studio - the logo, the mark - which UNA keeps in
     * private storage and publishes through a transcoder anyway.
     */
    protected function _resolveStoredBranding($sObject, $iFileId)
    {
        if ($iFileId < 1)
            return '';

        $oStorage = BxDolStorage::getObjectInstance($sObject);
        if (!$oStorage)
            return '';

        $sFile = $this->_resolveStorageFile($oStorage, $iFileId, true);

        return $sFile && $this->_isDrawableFile($sFile) ? $sFile : '';
    }

    /**
     * A ready derivative is preferred, because it is small and already the right shape. When there is
     * none, the ORIGINAL is read from the transcoder's source storage instead of transcoding on demand:
     * BxDolTranscoder::transcode() pulls the original through bx_file_get_contents(BX_DOL_URL_ROOT . ...)
     * and the site host is not necessarily resolvable from the process which renders a card. The card is
     * resized from whatever it gets anyway, so the original is a perfectly good input - it is only
     * heavier, which is why it is the second choice rather than the first.
     */
    protected function _resolveTranscoded($sObject, $iFileId)
    {
        if ($iFileId < 1)
            return '';

        $oTranscoder = BxDolTranscoder::getObjectInstance($sObject);
        if (!$oTranscoder)
            return '';

        // The card must not depend on the device pixel ratio of whoever triggered the render, but
        // the transcoder is a singleton shared with the rest of the request. So touch it only when
        // the ratio is not already 1, and hand it back the way a fresh one comes out of
        // getObjectInstance() - forceDevicePixelRatio(0) is that state, and the raw flag can not
        // be read back to restore anything more specific.
        $bForced = 1 != (int)$oTranscoder->getDevicePixelRatio();
        if ($bForced)
            $oTranscoder->forceDevicePixelRatio(1);

        // $isCheckOutdated defaults to true and its branch DELETES an outdated derivative - a card
        // render is a read, it has no business dropping files the site is still serving
        $bReady = $oTranscoder->isFileReady($iFileId, false);

        if ($bForced)
            $oTranscoder->forceDevicePixelRatio(0);

        if (!$bReady)
            return $this->_resolveTranscoderOriginal($sObject, $iFileId);

        $oStorage = $oTranscoder->getStorage();
        $iTranscodedId = (int)$oTranscoder->getDb()->getFileIdByHandler($iFileId);
        if (!$oStorage || !$iTranscodedId)
            return $this->_resolveTranscoderOriginal($sObject, $iFileId);

        $sFile = $this->_resolveStorageFile($oStorage, $iTranscodedId);

        return $sFile !== '' ? $sFile : $this->_resolveTranscoderOriginal($sObject, $iFileId);
    }

    /**
     * The file a transcoder was going to be made from, straight out of its source storage. Without this
     * a cover which no page has happened to render at this size yet would simply be missing from the card.
     */
    protected function _resolveTranscoderOriginal($sObject, $iFileId)
    {
        $aObject = BxDolTranscoderQuery::getTranscoderObject($sObject);
        if (!$aObject || empty($aObject['source_params']))
            return '';

        // allowed_classes => false: source_params is a plain array, and refusing to instantiate objects
        // costs nothing while taking object injection off the table entirely
        $aParams = unserialize($aObject['source_params'], ['allowed_classes' => false]);
        if (!is_array($aParams) || empty($aParams['object']))
            return '';

        $oSource = BxDolStorage::getObjectInstance($aParams['object']);

        // true: what this substitutes for is the transcoder's own output, which the site already
        // serves publicly, so the private flag on the source says nothing about the derivative
        return $oSource ? $this->_resolveStorageFile($oSource, $iFileId, true) : '';
    }

    protected function _resolveStorageFile($oStorage, $iFileId, $bAllowPrivate = false)
    {
        $aFile = $oStorage->getFile($iFileId);
        if (!$aFile || empty($aFile['path']))
            return '';

        // belt and braces: the privacy gate lives in BxDolShareCard, but a private file must never
        // end up baked into a picture served to anonymous scrapers.
        //
        // $bAllowPrivate is for ONE case: standing in for a transcoder whose derivative is not built
        // yet. UNA stores the site's own branding - the cover, the share image, the logo - in
        // `sys_images` / `sys_images_custom` with private = 1 and serves it through a transcoder,
        // whose output is public. Refusing the original there hid the picture an admin had just
        // uploaded in Studio and left every card on the fallback background.
        if (!$bAllowPrivate && !empty($aFile['private']))
            return '';

        $aObject = $oStorage->getObjectData();
        if (!empty($aObject['engine']) && 'Local' == $aObject['engine']) {
            $sPath = BX_DIRECTORY_STORAGE . $aObject['object'] . '/' . $aFile['path'];
            return is_readable($sPath) ? $sPath : '';
        }

        // remote engines keep nothing on disk, materialise the derivative in the tmp folder
        $sUrl = $oStorage->getFileUrlById($iFileId);
        return $sUrl ? $this->_download($sUrl) : '';
    }

    protected function _resolveUrl($sUrl)
    {
        $sUrl = trim($sUrl);
        if (!$sUrl)
            return '';

        if (defined('BX_DOL_URL_ROOT') && 0 === strpos($sUrl, BX_DOL_URL_ROOT)) {
            // our own host may be unreachable from here, map the url onto the filesystem instead
            $sRelative = substr($sUrl, strlen(BX_DOL_URL_ROOT));
            if ('' === $sRelative || false !== strpos($sRelative, '?') || false !== strpos($sRelative, '..'))
                return '';

            $sPath = realpath(BX_DIRECTORY_PATH_ROOT . $sRelative);

            return $sPath && $this->_isUnderMediaRoot($sPath) && is_readable($sPath) ? $sPath : '';
        }

        return preg_match('#^https?://#i', $sUrl) ? $this->_download($sUrl) : '';
    }

    /**
     * Only the folders the site serves media from. The document root as a whole is far too wide:
     * every decodable file below it would then be reachable by naming it in an image url, which
     * would make the private file guard of @see _resolveStorageFile pointless.
     */
    protected function _isUnderMediaRoot($sPath)
    {
        foreach (array(BX_DIRECTORY_STORAGE, BX_DIRECTORY_PATH_CACHE_PUBLIC, BX_DIRECTORY_PATH_BASE) as $sRoot) {
            $sRoot = realpath($sRoot);
            if ($sRoot && 0 === strpos($sPath, rtrim($sRoot, '/') . '/'))
                return true;
        }

        return false;
    }

    protected function _download($sUrl)
    {
        $iCode = 0;
        $sData = bx_file_get_contents($sUrl, array(), 'get', array(), $iCode, array(), self::DOWNLOAD_TIMEOUT, array(CURLOPT_MAXFILESIZE => self::DOWNLOAD_MAX_BYTES));
        if (!is_string($sData) || '' === $sData || strlen($sData) > self::DOWNLOAD_MAX_BYTES)
            return '';

        $sTmp = tempnam(BX_DIRECTORY_PATH_TMP, 'share_card_src_');
        if (!$sTmp)
            return '';

        $this->_aTmp[] = $sTmp; // registered before the write, so a half written file is cleaned up too

        return @file_put_contents($sTmp, $sData) ? $sTmp : '';
    }

    /**
     * Accept only raster formats the drivers can decode, and refuse anything big enough to be a
     * decompression bomb before it reaches the image manager.
     */
    protected function _isDrawableFile($sPath)
    {
        $aInfo = @getimagesize($sPath);
        if (!is_array($aInfo) || empty($aInfo[0]) || empty($aInfo[1]))
            return false;

        if (!in_array($aInfo[2], array(IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_GIF, IMAGETYPE_WEBP, IMAGETYPE_BMP)))
            return false;

        return (int)$aInfo[0] * (int)$aInfo[1] <= self::MAX_PIXELS;
    }

    /**
     * The best raster logo the site has. The dark variants are the ones drawn for dark surfaces, so
     * they come first on a dark card.
     */
    protected function _getLogoFile($bDark)
    {
        $sKey = $bDark ? 'dark' : 'light';

        // a memo hit is only good while the file behind it is still there - on a remote storage
        // engine it points into the tmp folder, which _cleanup() empties at the end of a render
        if (isset($this->_aLogos[$sKey]) && ('' === $this->_aLogos[$sKey] || is_readable($this->_aLogos[$sKey])))
            return $this->_aLogos[$sKey];

        $aParams = $bDark
            ? array('sys_site_logo_dark', 'sys_site_logo', 'sys_site_mark_dark', 'sys_site_mark')
            : array('sys_site_logo', 'sys_site_logo_dark', 'sys_site_mark', 'sys_site_mark_dark');

        $sFile = '';
        foreach ($aParams as $sParam) {
            $iFileId = (int)getParam($sParam);
            if ($iFileId < 1)
                continue;

            $sFile = $this->_resolveImage(array('id' => $iFileId, 'transcoder' => 'sys_custom_images'));
            if (!$sFile)
                $sFile = $this->_resolveStoredBranding('sys_images_custom', $iFileId);

            if ($sFile)
                break;
        }

        return ($this->_aLogos[$sKey] = $sFile);
    }

    // spec helpers ----------------------------------------------

    protected function _str($aBlock, $sKey)
    {
        return isset($aBlock[$sKey]) && is_scalar($aBlock[$sKey]) ? trim((string)$aBlock[$sKey]) : '';
    }

    protected function _arr($aBlock, $sKey)
    {
        return isset($aBlock[$sKey]) && is_array($aBlock[$sKey]) ? $aBlock[$sKey] : array();
    }
}

/** @} */
