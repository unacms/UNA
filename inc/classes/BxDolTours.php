<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Introduction tours: the homepage tour for operators (template/homepage_tour.html) and
 * the Studio tour (studio/template/launcher_tour.html), both run by bx_tour() in
 * inc/js/functions.js.
 *
 * A tour starts by itself until its viewer closes or finishes it. That is kept per account
 * in `sys_accounts_tours` (tour.php writes it), so it holds across browsers and after
 * cookies are cleared. After that the tour starts only from its menu item
 * ("Introduction Tour": account menu on the site, account popup in Studio).
 */
class BxDolTours extends BxDolFactory implements iBxDolSingleton
{
    const HOME = 'home';
    const STUDIO = 'studio';

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
     * Whether the tour exists and is on for the logged in account. Both tours are for operators.
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
