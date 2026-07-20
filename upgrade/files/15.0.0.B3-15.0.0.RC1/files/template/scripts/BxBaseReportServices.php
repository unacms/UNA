<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * System services related to Reports.
 */
class BxBaseReportServices extends BxDol
{
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * @page service Service Calls
     * @section bx_system_general System Services 
     * @subsection bx_system_general-report Report
     * @subsubsection bx_system_general-do do
     * 
     * @code bx_srv('system', 'do', [[...]], 'TemplReportServices'); @endcode
     * @code {{~system:do:TemplReportServices[[...]]~}} @endcode
     * 
     * Performs Do (Report) action
     * @param $aParams an array with necessary parameters 
     * 
     * @see BxBaseReportServices::serviceDo
     */
    /** 
     * @ref bx_system_general-do "do"
     * @api @ref bx_system_general-do "do"
     */
    public function serviceDo($aParams)
    {
        if(is_string($aParams))
            $aParams = json_decode($aParams, true);

        if(!$aParams['s'] || !$aParams['o'])
            return ['code' => BX_DOL_OBJECT_ERR_NOT_AVAILABLE];

        $oReport = BxDolReport::getObjectInstance($aParams['s'], $aParams['o']);
        if(!$oReport || !$oReport->isEnabled())
            return ['code' => BX_DOL_OBJECT_ERR_NOT_AVAILABLE];

        $aResult = $oReport->report(array_diff_key($aParams, array_flip(['s', 'o'])));
        return (int)$aResult['code'] != 0 ? $aResult : $aResult['api'];
    }

    /**
     * @page service Service Calls
     * @section bx_system_general System Services 
     * @subsection bx_system_general-report Report
     * @subsubsection bx_system_general-get_performed_by get_performed_by
     * 
     * @code bx_srv('system', 'get_performed_by', [[...]], 'TemplReportServices'); @endcode
     * @code {{~system:get_performed_by:TemplReportServices[[...]]~}} @endcode
     * 
     * Gets a list of PerformedBy users.
     * @param $aParams an array with necessary parameters 
     * 
     * @see BxBaseReportServices::serviceGetPerformedBy
     */
    /** 
     * @ref bx_system_general-get_performed_by "get_performed_by"
     * @api @ref bx_system_general-get_performed_by "get_performed_by"
     */
    public function serviceGetPerformedBy($aParams)
    {
        if(is_string($aParams))
            $aParams = json_decode($aParams, true);

        if(!$aParams['s'] || !$aParams['o'])
            return ['code' => BX_DOL_OBJECT_ERR_NOT_AVAILABLE];

        $oReport = BxDolReport::getObjectInstance($aParams['s'], $aParams['o']);
        if(!$oReport || !$oReport->isEnabled())
            return ['code' => BX_DOL_OBJECT_ERR_NOT_AVAILABLE];

        return $oReport->getPerformedByAPI($aParams);
    }
}

/** @} */
