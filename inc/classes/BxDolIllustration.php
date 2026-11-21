<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * A picture of plain shapes that the site and the apps draw the same: a template file, `<name>_illustration.html`,
 * holding one `<svg>` of filled `<path>` elements. The site shows the file as it is (its classes give the light and
 * dark colours). The apps have no web view on iOS and Android, so they get the shapes as data and draw them with their
 * own vector views: each path's `d` and its tone, the name of the colour it has (`data-tone`), which the apps map to
 * their own theme colours.
 *
 * A template (Studio's or a custom one) that replaces the file changes the picture on the site and in the apps.
 */
class BxDolIllustration
{
    /** The tones the apps know (NEO's illustration tones), as a path's `data-tone` names them. */
    const TONES = ['muted', 'accent', 'accent-foreground', 'primary', 'primary-foreground'];

    /** No picture needs more shapes; a longer file is cut here. */
    const SHAPES_MAX = 64;

    /** A path's `d` longer than this is left out. */
    const PATH_MAX = 2000;

    const VIEW_BOX_DEFAULT = '0 0 200 200';

    /**
     * The site's picture: the template file as it is.
     * @param string $sName the picture's name, `create_account` for `create_account_illustration.html`
     */
    public static function getCode($sName)
    {
        return BxDolTemplate::getInstance()->parseHtmlByName(self::getTemplateName($sName), []);
    }

    /**
     * The picture for the apps: its name, view box and shapes; false when the file has no shape the apps can draw.
     * @param string $sName the picture's name
     * @return array|false ['name' => ..., 'view_box' => '0 0 200 200', 'shapes' => [['d' => ..., 'tone' => ...], ...]];
     *         a shape whose inner subpaths are holes also has 'even_odd' => true
     */
    public static function getAPI($sName)
    {
        $aPicture = self::parse(self::getCode($sName));
        if(empty($aPicture['shapes']))
            return false;

        return ['name' => $sName] + $aPicture;
    }

    public static function getTemplateName($sName)
    {
        return preg_replace('/[^a-z0-9_]/', '', mb_strtolower((string)$sName)) . '_illustration.html';
    }

    /**
     * The shapes of an `<svg>`: every `<path>` with a `d` of path commands and numbers only and a tone the apps know.
     * Anything else in the file (other elements, a path without a tone) is for the site alone.
     * @return array ['view_box' => ..., 'shapes' => [...]], with no shapes for code that is not one `<svg>`
     */
    public static function parse($sSvg)
    {
        $aResult = ['view_box' => self::VIEW_BOX_DEFAULT, 'shapes' => []];

        $sSvg = trim((string)$sSvg);
        if($sSvg === '')
            return $aResult;

        $bErrors = libxml_use_internal_errors(true);
        $oDoc = new DOMDocument('1.0', 'UTF-8');
        $bLoaded = $oDoc->loadXML($sSvg, LIBXML_NONET);
        libxml_clear_errors();
        libxml_use_internal_errors($bErrors);

        $oSvg = $bLoaded ? $oDoc->documentElement : null;
        if(!$oSvg || mb_strtolower($oSvg->localName) != 'svg')
            return $aResult;

        $sViewBox = trim($oSvg->getAttribute('viewBox'));
        if(preg_match('/^-?\d+(\.\d+)?([\s,]+-?\d+(\.\d+)?){3}$/', $sViewBox))
            $aResult['view_box'] = preg_replace('/[\s,]+/', ' ', $sViewBox);

        foreach($oSvg->getElementsByTagName('path') as $oPath) {
            if(count($aResult['shapes']) >= self::SHAPES_MAX)
                break;

            $sPath = trim($oPath->getAttribute('d'));
            $sTone = trim($oPath->getAttribute('data-tone'));
            if($sPath === '' || get_mb_len($sPath) > self::PATH_MAX || !preg_match('/^[MmZzLlHhVvCcSsQqTtAa0-9eE\s,.+-]+$/', $sPath) || !in_array($sTone, self::TONES, true))
                continue;

            $aShape = ['d' => $sPath, 'tone' => $sTone];
            if(mb_strtolower(trim($oPath->getAttribute('fill-rule'))) == 'evenodd')
                $aShape['even_odd'] = true;

            $aResult['shapes'][] = $aShape;
        }

        return $aResult;
    }
}

/** @} */
