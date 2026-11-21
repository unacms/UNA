<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * First-run help: onboarding checklists ("Get started") and the Studio tour.
 *
 * A checklist is a menu object (sys_onboarding_operator for operators; Studio > Navigation) whose items are its
 * steps: title, Info as the description, icon, link, levels. An item's add-on is a service call that answers the
 * step's state (STEP_*), and BxBaseMenuOnboarding draws it with the "List with descriptions" template. The
 * "Get started" block (system:get_block_onboarding, with the menu as its parameter) shows it until every step is
 * done or the account hides it, so it can be placed on any page in Studio > Pages.
 *
 * The Studio tour (studio/template/launcher_tour.html, bx_tour() in inc/js/functions.js) starts by itself until its
 * viewer closes or finishes it. Hidden checklists and closed tours are kept per account in `sys_accounts_tours`
 * (tour.php writes it), under the menu's or the tour's name. The account menu's "Get started"
 * (index.php?onboarding=1) brings the operators' checklist back; the account popup in Studio starts the tour.
 */
class BxDolTours extends BxDolFactory implements iBxDolSingleton
{
    const HOME = 'home';
    const STUDIO = 'studio';

    const ONBOARDING_OPERATOR = 'sys_onboarding_operator';

    const STEP_DONE = 'done';
    const STEP_TODO = 'todo';
    const STEP_LOCKED = 'locked';
    const STEP_NOTE = 'note';

    const JOIN_OPEN = BxDolAccount::JOIN_OPEN;
    const JOIN_INVITE = BxDolAccount::JOIN_INVITE;
    const JOIN_CLOSED = BxDolAccount::JOIN_CLOSED;

    protected $_oQuery;

    protected function __construct()
    {
        parent::__construct();

        $this->_oQuery = BxDolToursQuery::getInstance();
    }

    public function __clone()
    {
        if(isset($GLOBALS['bxDolClasses'][get_class($this)]))
            trigger_error('Clone is not allowed for the class: ' . get_class($this), E_USER_ERROR);
    }

    public static function getInstance()
    {
        if(!isset($GLOBALS['bxDolClasses'][__CLASS__]))
            $GLOBALS['bxDolClasses'][__CLASS__] = new BxDolTours();

        return $GLOBALS['bxDolClasses'][__CLASS__];
    }

    /**
     * Whether the homepage checklist (HOME) or the Studio tour (STUDIO) is on for the logged in account. Both are for operators.
     */
    public function isAvailable($sTour)
    {
        if(!isAdmin())
            return false;

        if(self::isOnboardingName($sTour))
            return $this->isOnboardingAvailable($sTour);

        switch($sTour) {
            case self::HOME:
                return getParam('site_tour_home') == 'on';

            case self::STUDIO:
                return getParam('site_tour_studio') == 'on';
        }

        return false;
    }

    /**
     * Whether the account has closed or finished the tour.
     */
    public function isSeen($sTour, $iAccountId = 0)
    {
        if(!$iAccountId)
            $iAccountId = getLoggedId();

        return $iAccountId && $this->_oQuery->isSeen($iAccountId, $sTour);
    }

    /**
     * Remember that the logged in account has closed or finished the tour.
     */
    public function setSeen($sTour)
    {
        $iAccountId = getLoggedId();
        if(!$iAccountId || !$this->isAvailable($sTour))
            return false;

        return $this->_oQuery->setSeen($iAccountId, $sTour);
    }

    public function onAccountDelete($iAccountId)
    {
        return $this->_oQuery->deleteByAccount($iAccountId);
    }

    /**
     * Who can join the site (BxDolAccount::getJoinMode): JOIN_OPEN, JOIN_INVITE or JOIN_CLOSED.
     */
    public function getJoinMode()
    {
        return BxDolAccount::getJoinMode();
    }

    /**
     * Where the operator changes who can join: "Who can join", the first option of Studio > Settings > Account.
     */
    public function getJoinSettingsUrl()
    {
        return BX_DOL_URL_STUDIO . 'settings.php?page=system&category=account';
    }

    /**
     * Whether the onboarding checklist that the menu $sMenu holds is there for the logged in account. The operators'
     * one (ONBOARDING_OPERATOR) is for operators while "Get started checklist for operators" (site_tour_home) is on;
     * any other checklist (a member checklist an operator builds in Studio) is for every signed-in account.
     */
    public function isOnboardingAvailable($sMenu)
    {
        if(!self::isOnboardingName($sMenu) || !isLogged())
            return false;

        if($sMenu == self::ONBOARDING_OPERATOR)
            return $this->isAvailable(self::HOME);

        return true;
    }

    /**
     * Whether the checklist shows: it's available, the account hasn't hidden it, or $bForced (index.php?onboarding=1,
     * the account menu's "Get started") brings it back.
     */
    public function isOnboardingShown($sMenu, $bForced = false)
    {
        return $this->isOnboardingAvailable($sMenu) && ($bForced || !$this->isSeen($sMenu));
    }

    /**
     * A checklist's name: its menu object, sys_onboarding_* or a module's <module>_onboarding_*.
     */
    public static function isOnboardingName($sName)
    {
        return is_string($sName) && preg_match('/^[a-z0-9_]{1,64}$/', $sName) && strpos($sName, '_onboarding') !== false;
    }

    /**
     * The state of one of the built-in steps of the operators' checklist, for its menu item's add-on: STEP_DONE,
     * STEP_TODO or STEP_LOCKED (it needs an earlier step). "join" is done once the operator has chosen who can join.
     */
    public function getStepState($sStep)
    {
        switch($sStep) {
            case 'profile':
                return $this->hasProfile() ? self::STEP_DONE : self::STEP_TODO;

            case 'logo':
                return (int)getParam('sys_site_logo') || (int)getParam('sys_site_mark') || trim(getParam('sys_site_logo_inline')) !== '' || trim(getParam('sys_site_mark_inline')) !== '' ? self::STEP_DONE : self::STEP_TODO;

            case 'cover':
                return (int)getParam('sys_site_cover_common') ? self::STEP_DONE : self::STEP_TODO;

            case 'join':
                return BxDolAccount::isJoinModeChosen() ? self::STEP_DONE : self::STEP_TODO;
        }

        return '';
    }

    /**
     * The profiles of the logged in account, without its system profile.
     */
    public function getProfileIds()
    {
        $oAccount = BxDolAccount::getInstance();
        return $oAccount ? $oAccount->getProfilesIds(false) : [];
    }

    public function hasProfile()
    {
        return !empty($this->getProfileIds());
    }

    /**
     * Template variables both tour templates share.
     */
    public function getTemplateVars($sTour)
    {
        return [
            'name' => $sTour,
            'autostart' => $this->isSeen($sTour) ? 0 : 1,
        ];
    }
}

/** @} */
