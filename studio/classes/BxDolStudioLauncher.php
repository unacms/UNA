<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

class BxDolStudioLauncher extends BxTemplStudioWidgets implements iBxDolSingleton
{
    protected $aIncludes;

    function __construct()
    {
        parent::__construct(BX_DOL_STUDIO_PAGE_HOME);

        $aClasses = array(
            'BxTemplStudioModules',
            'BxTemplStudioDesigns',
            'BxTemplStudioLanguages'
        );

        $this->aIncludes = array();
        foreach($aClasses as $sClass)
            $this->aIncludes[] = new $sClass();
    }

    public static function getInstance()
    {
        if (!isset($GLOBALS['bxDolClasses'][__CLASS__]))
            $GLOBALS['bxDolClasses'][__CLASS__] = new BxTemplStudioLauncher();

        return $GLOBALS['bxDolClasses'][__CLASS__];
    }

    public function checkAction()
    {
        $sAction = bx_get('action');
    	if($sAction === false)
            return false;

        $sAction = bx_process_input($sAction);

        // Pins, order and an app's type are changes: a POST with the Studio's CSRF token. The apps browser and the cache refresh
        // every page asks for change nothing.
        if(!in_array($sAction, ['launcher-browser', 'launcher-update-cache']) && !self::isWriteRequest())
            return self::getWriteRequestError();

        // The shared pin and an app's type (which decides the roles that may use it) are for app managers.
        if(in_array($sAction, ['page-featured', 'widget-rearrange']) && !BxDolStudioRolesUtils::getInstance()->isActionAllowed(BX_SRA_MANAGE_APPS))
            return self::getAccessDeniedError();

        $aResult = array('code' => 1, 'message' => _t('_adm_err_operation_failed'));
        switch($sAction) {
            case 'launcher-browser':
                $sType = bx_process_input(bx_get('type'));

                $aResult = array('code' => 0, 'popup' => $this->getPopupBrowser($sType));
                break;

            case 'launcher-update-cache':
                $aResult = $this->updateCache();
                break;

            case 'launcher-reorder':
                $sPage = bx_process_input(bx_get('page'));
                $aItems = bx_process_input(bx_get('items'));

                BxDolStudioWidgetsQuery::getInstance()->reorder($sPage, $aItems);
                $aResult = array('code' => 0, 'message' => _t('_adm_scs_operation_done'));
                break;

            case 'page-featured':
                $sPage = bx_process_input(bx_get('page'));

                bx_import('BxDolStudioWidget');
                $oPage = new BxDolStudioWidget($sPage);

                $aResult = $oPage->featured();
                break;

            case 'page-bookmark':
                $sPage = bx_process_input(bx_get('page'));

                bx_import('BxDolStudioWidget');
                $oPage = new BxDolStudioWidget($sPage);

                $aResult = $oPage->bookmark();
                break;

            case 'widget-rearrange':
                $iWidgetId = bx_process_input(bx_get('widget_id'), BX_DATA_INT);
                $sType = bx_process_input(bx_get('type'));

                if(BxDolStudioWidgetsQuery::getInstance()->updateWidget(array('type' => $sType), array('id' => $iWidgetId)) !== false)
                    $aResult = array('code' => 0, 'redirect' => bx_append_url_params ($this->sPageUrl, array('type' => $sType)));
                else
                    $aResult = array('code' => 1, 'message' => _t('_error occured'));
                break;
        }

        return $aResult;
    }

    public function isLeftColumn()
    {
        return getParam('sys_std_show_launcher_left') == 'on';
    }
}

/** @} */
