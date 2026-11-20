<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * First-run help for operators: the setup checklist on the homepage (template/homepage_setup.html)
 * and the Studio tour (studio/template/launcher_tour.html, run by bx_tour() in inc/js/functions.js).
 *
 * The checklist shows the steps a new site needs, each ticked from the site's real state, until
 * every step is done or the operator dismisses it. The Studio tour starts by itself until its viewer
 * closes or finishes it. Both are kept per account in `sys_accounts_tours` (tour.php writes it), so
 * they hold across browsers and after cookies are cleared. After that the checklist opens from the
 * account menu ("Set up your site", index.php?setup=1) and the tour from the account popup in Studio.
 */
class BxDolTours extends BxDolFactory implements iBxDolSingleton
{
    const HOME = 'home';
    const STUDIO = 'studio';

    const JOIN_OPEN = 'open';
    const JOIN_INVITE = 'invite';
    const JOIN_CLOSED = 'closed';

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
     * The homepage setup checklist's steps for the logged in operator, in order. Each step is
     * ['done' => bool, 'url' => where it is done, 'locked' => true when it needs a step before it].
     * A step for something the site doesn't have (covers off, no Timeline) is left out.
     */
    public function getSetupSteps()
    {
        $oAccount = BxDolAccount::getInstance();
        $aProfileIds = $oAccount ? $oAccount->getProfilesIds(false) : [];

        $aSteps = [
            'profile' => [
                'done' => !empty($aProfileIds),
                'url' => bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=account-profile-switcher')),
            ],
            'logo' => [
                'done' => (int)getParam('sys_site_logo') || (int)getParam('sys_site_mark') || trim(getParam('sys_site_logo_inline')) !== '' || trim(getParam('sys_site_mark_inline')) !== '',
                'url' => BX_DOL_URL_STUDIO . 'designer.php?page=logo',
            ],
        ];

        if(getParam('sys_site_cover_disabled') != 'on')
            $aSteps['cover'] = [
                'done' => (bool)(int)getParam('sys_site_cover_common'),
                'url' => BX_DOL_URL_STUDIO . 'designer.php?page=cover',
            ];

        if(BxDolModuleQuery::getInstance()->isEnabledByName('bx_timeline'))
            $aSteps['post'] = [
                'done' => !empty($aProfileIds) && BxDolService::call('bx_timeline', 'has_posts_by', [$aProfileIds]),
                'url' => BX_DOL_URL_ROOT, // bx_setup_step() opens the homepage's post form
                'locked' => empty($aProfileIds),
            ];

        foreach($aSteps as $sName => $aStep)
            $aSteps[$sName] = array_merge(['locked' => false], $aStep);

        return $aSteps;
    }

    /**
     * Who can join the site: anyone (JOIN_OPEN), only people with an invitation (JOIN_INVITE) or nobody,
     * because the sign-up form is off (JOIN_CLOSED).
     */
    public function getJoinMode()
    {
        if(getParam('sys_account_disable_join_form') == 'on')
            return self::JOIN_CLOSED;

        if(BxDolModuleQuery::getInstance()->isEnabledByName('bx_invites') && getParam('bx_invites_enable_reg_by_inv') == 'on')
            return self::JOIN_INVITE;

        return self::JOIN_OPEN;
    }

    /**
     * Where the operator changes who can join.
     */
    public function getJoinSettingsUrl()
    {
        if($this->getJoinMode() == self::JOIN_INVITE)
            return BX_DOL_URL_STUDIO . 'module.php?name=bx_invites&page=settings';

        return BX_DOL_URL_STUDIO . 'settings.php?page=system&category=account';
    }

    /**
     * Whether the homepage shows the setup checklist: it's on in settings, the viewer is an operator and
     * hasn't dismissed it, and a step is left. With $bForced (index.php?setup=1, the account menu item)
     * a dismissed checklist shows again.
     */
    public function isSetupShown($bForced = false)
    {
        if(!$this->isAvailable(self::HOME))
            return false;

        if(!$bForced && $this->isSeen(self::HOME))
            return false;

        foreach($this->getSetupSteps() as $aStep)
            if(!$aStep['done'])
                return true;

        return $bForced;
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
