<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT 
 * @defgroup    Tasks Tasks
 * @ingroup     UnaModules
 *
 * @{
 */

class BxTasksFormContext extends BxTemplFormView
{
    protected $_sModule;
    protected $_oModule;
    protected $_iContextId;

    public function __construct($aInfo, $oTemplate = false)
    {
        $this->_sModule = 'bx_tasks';
    	$this->_oModule = BxDolModule::getInstance($this->_sModule);
        $this->_iContextId = 0;

        parent::__construct($aInfo, $oTemplate);
    }

    public function setContextId($iContextId)
    {
        $this->_iContextId = (int)$iContextId;
    }

    public function initChecker($aValues = [], $aSpecificValues = [])
    {
        parent::initChecker($aValues, $aSpecificValues);

        // the prefix's format is the input's checker; here: no other community has or had it
        if(($sKey = 'prefix') && isset($this->aInputs[$sKey]) && $this->isSubmitted() && $this->isValid()) {
            $sPrefix = trim((string)$this->getCleanValueByPass($sKey));
            if(!$this->_oModule->isPrefixAvailable($sPrefix, $this->_iContextId)) {
                $this->aInputs[$sKey]['error'] = _t('_bx_tasks_form_context_input_prefix_err_taken');
                $this->setValid(false);
            }
        }
    }

    public function insert($aValsToAdd = [], $isIgnore = false)
    {
        $mixedResult = parent::insert($aValsToAdd, $isIgnore);
        if($mixedResult !== false && !$this->_savePrefix())
            return false;

        return $mixedResult;
    }

    public function update($val, $aValsToAdd = [], &$aTrackTextFieldsChanges = null)
    {
        $mixedResult = parent::update($val, $aValsToAdd, $aTrackTextFieldsChanges);
        if($mixedResult !== false && !$this->_savePrefix())
            return false;

        return $mixedResult;
    }

    /**
     * The prefix isn't a column the form writes: the module keeps the former one, so its links still work.
     */
    protected function _savePrefix()
    {
        if(!isset($this->aInputs['prefix']) || !$this->_iContextId)
            return true;

        return $this->_oModule->setContextPrefix($this->_iContextId, trim((string)$this->getCleanValueByPass('prefix')));
    }

    public function setProfileId($iProfileId)
    {
        if(($sKey = 'gh_app_id') && isset($this->aInputs[$sKey])) {
            $sModule = 'bx_github';
            $sMethod = 'get_apps';
            if(bx_is_srv($sModule, $sMethod)) {
                $aApps = bx_srv($sModule, $sMethod, [$iProfileId]);
                if($aApps !== false) {
                    $this->aInputs[$sKey]['values'][] = [
                        'key' => '',
                        'value' => _t('_sys_please_select'),
                    ];

                    foreach($aApps as $aApp)
                        $this->aInputs[$sKey]['values'][] = [
                            'key' => $aApp['id'],
                            'value' => $aApp['title'],
                        ];
                }
                else
                    unset($this->aInputs[$sKey]);
            }
        }
    }
}

/** @} */
