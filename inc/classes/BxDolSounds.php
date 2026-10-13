<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Interface sounds settings (Studio > Settings > Global > Sounds) for Cuelume's cues: where they play, the sound set
 * and volume, the level people start at, and a set (or silence) for each kind of action.
 *
 * The site and Studio read it in BxBaseFunctions::getInjHeadSounds; apps get the same config with every page
 * (BxBasePage::getPageAPI), so playing a sound never waits on a request.
 */
class BxDolSounds extends BxDolFactory implements iBxDolSingleton
{
    public const PLATFORMS = ['site', 'studio', 'neo_web', 'ios', 'android'];

    /** What each person can pick for themselves; the option sets where they start. */
    public const LEVELS = ['full', 'quiet', 'off'];

    /** Cuelume's themes: the same cues in another material. */
    public const SETS = ['default', 'mech', 'bubble', 'press'];

    public const VOLUMES = [100, 75, 50, 25];

    /** Kinds of action that can have their own set, or no sound. */
    public const GROUPS = ['buttons', 'choices', 'reactions', 'menus', 'navigation', 'results', 'notifications'];

    public const GROUP_OFF = 'off';

    protected function __construct()
    {
        parent::__construct();
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
            $GLOBALS['bxDolClasses'][__CLASS__] = new BxDolSounds();

        return $GLOBALS['bxDolClasses'][__CLASS__];
    }

    public function isOn($sPlatform)
    {
        return in_array($sPlatform, $this->getPlatforms(), true);
    }

    public function getPlatforms()
    {
        return array_values(array_intersect(self::PLATFORMS, explode(',', (string)getParam('sys_sounds_platforms'))));
    }

    /**
     * The config every client applies: `level` is where people start until they pick their own, `volume` is 0-1,
     * `groups` lists only the kinds of action that differ from `set` (a set name or 'off').
     */
    public function getConfig()
    {
        $sLevel = getParam('sys_sounds_level');
        $sSet = getParam('sys_sounds_set');
        $iVolume = (int)getParam('sys_sounds_volume');

        $aGroups = [];
        foreach(self::GROUPS as $sGroup) {
            $sGroupSet = getParam('sys_sounds_' . $sGroup);
            if($sGroupSet == self::GROUP_OFF || (in_array($sGroupSet, self::SETS, true) && $sGroupSet != $sSet))
                $aGroups[$sGroup] = $sGroupSet;
        }

        return [
            'platforms' => $this->getPlatforms(),
            'level' => in_array($sLevel, self::LEVELS, true) ? $sLevel : self::LEVELS[0],
            'set' => in_array($sSet, self::SETS, true) ? $sSet : self::SETS[0],
            'volume' => (in_array($iVolume, self::VOLUMES, true) ? $iVolume : self::VOLUMES[0]) / 100,
            'groups' => (object)$aGroups,
        ];
    }
}

/** @} */
