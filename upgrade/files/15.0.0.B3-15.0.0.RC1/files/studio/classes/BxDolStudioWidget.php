<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

define('BX_DOL_STUDIO_WGT_TYPE_SETTINGS', 'settings');
define('BX_DOL_STUDIO_WGT_TYPE_DEFAULT', BX_DOL_STUDIO_WGT_TYPE_SETTINGS);

class BxDolStudioWidget extends BxTemplStudioPage
{
    protected $sPage;
    protected $sPageDefault = BX_DOL_STUDIO_WGT_TYPE_DEFAULT;

    public function __construct($mixedPageName)
    {
        parent::__construct($mixedPageName);

        $this->sPage = $this->sPageDefault;

        if(!$this->bPage)
            return;

        if(!$this->bPageMultiple) {
            $this->sPageRssHelpId = $this->aPage['name'];

            $this->aPage['featured'] = $this->oDb->isFeatured($this->aPage);
            $this->aPage['bookmark'] = $this->oDb->isBookmarked($this->aPage, bx_get_logged_profile_id());

            $sJsObjectLauncher = BxTemplStudioLauncher::getInstance()->getPageJsObject();

            if(BxDolStudioRolesUtils::getInstance()->isActionAllowed(BX_SRA_MANAGE_APPS))
                $this->addAction(array(
                    'type' => 'switcher',
                    'name' => 'featured',
                    'caption' => '_adm_txt_pca_featured',
                    'checked' => $this->aPage['featured'],
                    'onchange' => "javascript:" . $sJsObjectLauncher . ".featured('" . $this->aPage['name'] . "', this)"
                ));

            $this->addAction(array(
                'type' => 'switcher',
                'name' => 'bookmark',
                'caption' => '_adm_txt_pca_bookmark',
                'checked' => $this->aPage['bookmark'],
                'onchange' => "javascript:" . $sJsObjectLauncher . ".bookmark('" . $this->aPage['name'] . "', this)"
            ));

            $this->addAction(array(
                'type' => 'select',
                'name' => 'rearrange',
                'caption' => '_adm_txt_pca_rearrange',
                'value' => '{widget_type}',
                'values' => BxDolFormQuery::getDataItems($this->_sTypesPreList),
                'onchange' => "javascript:" . $sJsObjectLauncher . ".rearrange({widget_id}, this)"
            ));

            $this->aMarkers['page_name'] = $this->aPage['name'];
        }
        else
            foreach($this->aPage as $sName => $aPage) 
                $this->aPage[$sName]['featured'] = $this->oDb->isFeatured($aPage);
    }

    public function addAction($aAction, $bOnRight = true)
    {
        if($bOnRight)
            $this->aActions[] = $aAction;
        else
            $this->aActions = array_merge(array($aAction), $this->aActions);
    }

    public function removeActions()
    {
        $this->aActions = array();
    }

    public function featured()
    {
        $bResult = $this->oDb->featured($this->aPage);
        if(!$bResult)
            return array('code' => 1, 'message' => _t('_adm_err_operation_failed'));

        $iWidgetId = (int)$this->aPage['wid_id'];
        return array(
            'code' => 0, 
            'message' => _t('_adm_scs_operation_done'),
            'widget_id' => $iWidgetId,
            'widget' => !empty($this->aPage['wid_id']) ? BxTemplStudioFunctions::getInstance()->getWidget($iWidgetId) : ''
        );
    }
    
    public function bookmark()
    {
        $iProfileId = bx_get_logged_profile_id();

        $bResult = $this->oDb->bookmark($this->aPage, $iProfileId);
        if(!$bResult)
            return array('code' => 1, 'message' => _t('_adm_err_operation_failed'));

        return array('code' => 0, 'message' => _t('_adm_scs_operation_done'));
    }
}

/** @} */
