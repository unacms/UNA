<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

define('BX_DOL_STUDIO_PAGE_HOME', 'home');
define('BX_DOL_STUDIO_PAGE_JS_OBJECT', 'oBxDolStudioPage');

define('BX_DOL_STUDIO_MIT_CAPTION', 'caption');
define('BX_DOL_STUDIO_MIT_ITEM', 'item');

class BxDolStudioPage extends BxDol
{
    protected $oDb;

    protected $aPage;
    protected $bPage;
    protected $bPageMultiple;
    protected $sPageUrl;
    protected $sPageSelected;


    protected $_sTypesPreList;

    protected $aActions;
    protected $aMarkers;

    protected $iError;
    protected $sError;

    protected $_bShowHeaderBreadcrumb;
    protected $_bShowHeaderRightSearch;
    protected $_bShowHeaderRightSite;
    protected $_bShowHeaderRightAssistant;

    function __construct($mixedPageName)
    {
        parent::__construct();

        $this->oDb = BxDolStudioPageQuery::getInstance();

        $this->aPage = [];
        $this->bPage = false;
        $this->bPageMultiple = false;
        $this->sPageSelected = '';       

        $this->_sTypesPreList = 'sys_studio_widget_types';

        $this->aActions = [];
        $this->aMarkers = [
            'url_root' => BX_DOL_URL_ROOT,
            'url_studio' => BX_DOL_URL_STUDIO
        ];

        $this->iError = 0;
        $this->sError = false;

        $this->_bShowHeaderBreadcrumb = getParam('sys_std_show_header_left') == 'on';
        $this->_bShowHeaderRightSearch = getParam('sys_std_show_header_right_search') == 'on';
        $this->_bShowHeaderRightSite = getParam('sys_std_show_header_right_site') == 'on';
        $this->_bShowHeaderRightAssistant = false;

        if(is_string($mixedPageName)) {
            $this->aPage = $this->oDb->getPages(array('type' => 'by_page_name_full', 'value' => $mixedPageName));
            if(empty($this->aPage) || !is_array($this->aPage))
                return;
        } 
        else if(is_array($mixedPageName)) {
            $aPages = $this->oDb->getPages(array('type' => 'by_page_names_full', 'value' => array_keys($mixedPageName)));
            if(empty($aPages) || !is_array($aPages))
                return;

            $this->bPageMultiple = true;
            foreach($aPages as $aPage) {
                if((int)$mixedPageName[$aPage['name']] == 1)
                    $this->sPageSelected = $aPage['name'];

                $this->aPage[$aPage['name']] = $aPage;
            }
        }

        $this->bPage = true;
    }
    
    public function checkAction()
    {
        return false;
    }

    /**
     * Whether the operator's Studio role lets them use this page: the role needs "use <type>" for the type of the page's app.
     * It holds for the page's actions too, not only for showing it.
     */
    public function isAccessAllowed()
    {
        if(!$this->bPage || $this->bPageMultiple || empty($this->aPage['wid_type']))
            return true;

        return (bool)BxDolStudioRolesUtils::getInstance()->isActionAllowed('use ' . $this->aPage['wid_type']);
    }

    /**
     * Whether a request that changes something came the way the Studio sends it: a POST with the page's CSRF token. The token is
     * kept, as grid actions keep theirs, so the page can make more changes without reloading.
     */
    public static function isWriteRequest()
    {
        if(!isset($_SERVER['REQUEST_METHOD']) || strtoupper($_SERVER['REQUEST_METHOD']) != 'POST')
            return false;

        $sToken = isset($_POST['csrf_token']) && is_string($_POST['csrf_token']) ? bx_process_input($_POST['csrf_token']) : '';
        return BxDolForm::isCsrfTokenValid($sToken, false);
    }

    /**
     * The answer to a change that didn't come as a POST with a valid CSRF token.
     */
    public static function getWriteRequestError()
    {
        return ['code' => 3, 'message' => _t('_sys_txt_form_submission_error_csrf_expired')];
    }

    /**
     * The answer to an action the operator's Studio role doesn't allow.
     */
    public static function getAccessDeniedError()
    {
        return ['code' => 1, 'message' => _t('_Access denied')];
    }

    public function getDb()
    {
        return $this->oDb;
    }

    public function getPageUrl()
    {
        if(empty($this->sPageUrl) && !empty($this->aPage['wid_url']))
            $this->sPageUrl = $this->aPage['wid_url'];

        return bx_replace_markers($this->sPageUrl, $this->aMarkers);
    }

    public function getPageTypeUrl()
    {
        $sUrl = BxTemplStudioLauncher::getInstance()->getPageUrl();
        if(empty($this->aPage['wid_type']))
            return $sUrl;

        return bx_append_url_params($sUrl, array(
            'type' => $this->aPage['wid_type']
        ));
    }

    public function getPageTypes($bFullInfo = true)    
    {
        return BxDolFormQuery::getDataItems($this->_sTypesPreList, false, $bFullInfo ? BX_DATA_VALUES_ALL : BX_DATA_VALUES_DEFAULT);
    }

    public function getPageTypeIcon()
    {
        if(empty($this->aPage['wid_type']))
            return false;

        $sType = $this->aPage['wid_type'];
        $aTypes = $this->getPageTypes();
        if(empty($aTypes[$sType]) || empty($aTypes[$sType]['Data']))
            return false;

        $aTypeData = unserialize($aTypes[$sType]['Data']);
        if(empty($aTypeData['icon']))
            return false;

        return $aTypeData['icon'];
    }

    /**
     * Add replace markers.
     * @param $a array of markers as key => value
     * @return true on success or false on error
     */
    public function addMarkers ($a)
    {
        if(empty($a) || !is_array($a))
            return false;

        $this->aMarkers = array_merge($this->aMarkers, $a);
        return true;
    }

    public function setError($mixedError)
    {
        if(is_array($mixedError))
            list($this->iError, $this->sError) = $mixedError;
        else
            $this->sError = $mixedError;
    }

    public function getError($bToDisplay = true)
    {
        $sError = $this->sError;
        if($bToDisplay)
            $sError = MsgBox(_t($sError));

        return $this->iError ? [$this->iError, $sError]: $sError;
    }

    protected function getSystemName($sValue)
    {
        return BxDolStudioUtils::getSystemName($sValue);
    }

    protected function getClassName($sValue)
    {
        return BxDolStudioUtils::getClassName($sValue);
    }

    protected function getModuleTitle($sName)
    {
        return BxDolStudioUtils::getModuleTitle($sName);
    }

    protected function getModuleIcon($sName, $sType = 'menu', $bReturnAsUrl = true)
    {
        return BxDolStudioUtils::getModuleIcon($sName, $sType, $bReturnAsUrl);
    }

    protected function getModules($bShowCustom = true, $bShowSystem = true)
    {
        return BxDolStudioUtils::getModules($bShowCustom, $bShowSystem);
    }

    protected function updateHistory()
    {
        if(empty($this->aPage['wid_id'])) 
            return;

        BxTemplStudioMenuTop::historyAdd($this->aPage);
    }
}

/** @} */
