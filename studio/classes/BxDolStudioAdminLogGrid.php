<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

class BxDolStudioAdminLogGrid extends BxDolStudioGrid
{
    protected $_sSource = '';

    protected $_sFilterSource = '';
    protected $_sFilterProfile = '';
    protected $_sFilterAgent = '';
    protected $_sFilterObject = '';
    protected $_sFilterFrom = '';
    protected $_sFilterTo = '';

    protected $_aProfiles = [];
    protected $_aAgents = [];
    protected $_aObjects = [];

    public function __construct($aOptions, $oTemplate = false)
    {
        parent::__construct($aOptions, $oTemplate);

        $this->_sSource = (string)($aOptions['source'] ?? '');
        $this->_sDefaultSortingOrder = 'DESC';

        $this->_aFilterAreaLabels = [
            'source' => '_adm_txt_admin_log_source',
            'profile_id' => '_adm_form_txt_admin_log_profile',
            'agent_id' => '_adm_form_txt_admin_log_agent',
            'object_type' => '_adm_form_txt_admin_log_object',
            'from_date' => '_adm_txt_admin_log_from',
            'to_date' => '_adm_txt_admin_log_to',
        ];

        $this->loadFilters();
    }

    protected function loadFilters(): void
    {
        try {
            $oQuery = BxDolAdminLogQuery::getInstance();
            foreach ($oQuery->getColumnValues('profile_id') as $iProfile) {
                $iProfile = (int)$iProfile;
                $oProfile = BxDolProfile::getInstance($iProfile);
                $this->_aProfiles[$iProfile] = $oProfile ? $oProfile->getDisplayName() : (string)$iProfile;
            }
            $this->_aAgents = $oQuery->getAgents();
            foreach ($oQuery->getColumnValues('object_type') as $sType)
                $this->_aObjects[(string)$sType] = (string)$sType;
        }
        catch (Throwable $e) {
            $this->_aProfiles = [];
            $this->_aAgents = [];
            $this->_aObjects = [];
        }
    }
}

/** @} */
