<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * A block's design box per screen size: the screen sizes its title, background and padding are hidden on
 * (Studio > Pages > block: "Title / Background / Padding hidden on"), as BX_DB_HIDDEN_* bits in the block's
 * `title_hidden_on`, `bg_hidden_on` and `padding_hidden_on`, like its "Hidden on". The site hides the part with
 * classes (css/page_layouts.css); the apps get the screen size names (phone, tablet, desktop, mobile-app).
 * A part the block's design box doesn't have (designbox_id) stays off whatever is set.
 */
class BxDolPageDesignbox
{
    const PARTS = ['title', 'bg', 'padding'];

    /** Design boxes without each part, as the design box templates (designbox_<id>.html) draw them. */
    protected static $_aWithout = [
        'title' => [0, 2, 3, 10, 13],
        'bg' => [0, 2, 4, 10, 14],
        'padding' => [0, 1, 2, 3, 4],
    ];

    /**
     * Whether design box $iDesignboxId has $sPart (title, bg, padding).
     */
    public static function hasPart($iDesignboxId, $sPart)
    {
        return isset(self::$_aWithout[$sPart]) && !in_array((int)$iDesignboxId, self::$_aWithout[$sPart]);
    }

    /**
     * Classes for the block's container on the site: bx-db-hide-<part>-<phone|tablet|desktop> where a part is hidden.
     */
    public static function getHiddenOnClasses($aBlock)
    {
        $aNames = [BX_DB_HIDDEN_PHONE => 'phone', BX_DB_HIDDEN_TABLET => 'tablet', BX_DB_HIDDEN_DESKTOP => 'desktop'];

        $aClasses = [];
        foreach(self::PARTS as $sPart) {
            $iBits = isset($aBlock[$sPart . '_hidden_on']) ? (int)$aBlock[$sPart . '_hidden_on'] : 0;
            if(!$iBits || !self::hasPart(isset($aBlock['designbox_id']) ? $aBlock['designbox_id'] : 0, $sPart))
                continue;

            foreach($aNames as $iBit => $sName)
                if($iBits & pow(2, $iBit - 1))
                    $aClasses[] = 'bx-db-hide-' . $sPart . '-' . $sName;
        }

        return implode(' ', $aClasses);
    }
}

/** @} */
