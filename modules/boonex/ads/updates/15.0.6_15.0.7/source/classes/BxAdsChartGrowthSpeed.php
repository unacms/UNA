<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Ads Ads
 * @ingroup     UnaModules
 *
 * @{
 */

class BxAdsChartGrowthSpeed extends BxDolChartGrowthSpeed
{
    protected $_sModule;
    protected $_oModule;

    protected function __construct($aObject)
    {
        $this->_sModule = 'bx_ads';
        $this->_oModule = BxDolModule::getInstance($this->_sModule);

        parent::__construct($aObject);
    }

    public function actionLoadDataByInterval()
    {
        $this->addMarkers([
            'content_id' => (int)bx_get('content_id')
        ]);

        return parent::actionLoadDataByInterval();
    }

    public function checkAllowedView($isPerformAction = false)
    {
        $iContentId = (int)($this->_aMarkers['content_id'] ?? 0);
        if (!$iContentId || !$this->_oModule)
            return _t('_sys_txt_access_denied');

        $aContentInfo = $this->_oModule->_oDb->getContentInfoById($iContentId);
        if (empty($aContentInfo) || !is_array($aContentInfo))
            return _t('_sys_txt_access_denied');

        return $this->_oModule->checkAllowedEdit($aContentInfo);
    }
}

/** @} */
