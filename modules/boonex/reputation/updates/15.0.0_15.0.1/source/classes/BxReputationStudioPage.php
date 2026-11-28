<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Reputation Reputation
 * @ingroup     UnaModules
 *
 * @{
 */

class BxReputationStudioPage extends BxBaseModNotificationsStudioPage
{
    public function __construct($sModule, $mixedPageName, $sPage = "")
    {
    	$this->_sModule = 'bx_reputation';

        parent::__construct($sModule, $mixedPageName, $sPage);

        $this->aMenuItems = array_merge($this->aMenuItems, [
            'handlers' => ['name' => 'manage', 'icon' => 'wrench', 'title' => '_bx_reputation_menu_item_title_handlers'],
            'levels' => ['name' => 'levels', 'icon' => 'user-tag', 'title' => '_bx_reputation_menu_item_title_levels'],
        ]);
    }

    public function checkAction()
    {
        $sAction = bx_get($this->sParamPrefix . '_action');
        if($sAction === false)
            return false;

        if(empty($this->aModule) || !is_array($this->aModule))
            return array('code' => 1, 'message' => _t('_sys_request_page_not_found_cpt'));

        $sAction = bx_process_input($sAction);

        $aResult = array('code' => 2, 'message' => _t('_adm_mod_err_cannot_process_action'));
        switch($sAction) {
            case 'assign_levels':
                $iUpdated = 0;

                $aLevels = $this->_oModule->_oDb->getLevels();
                foreach($aLevels as $aLevel) {
                    $aProfiles = $this->_oModule->_oDb->getProfiles(['sample' => 'points_range', 'points_in' => $aLevel['points_in'], 'points_out' => $aLevel['points_out']]);
                    if(empty($aProfiles) || !is_array($aProfiles))
                        continue;

                    foreach($aProfiles as $aProfile)
                        if($this->_oModule->_oDb->insertProfilesLevels($aProfile['profile_id'], $aProfile['context_id'], $aLevel['id']))
                            $iUpdated++;
                }

                $aResult = ['code' => 0, 'message' => _t('_bx_reputation_msg_assign_levels', $iUpdated)];
                break;

            default:
                $aResult = parent::checkAction();
        }

        return $aResult;
    }

    protected function getHandlers()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $oGrid = BxDolGrid::getObjectInstance($CNF['OBJECT_GRID_HANDLERS'], BxDolStudioTemplate::getInstance());
        if(!$oGrid)
            return '';

        $this->_oModule->_oTemplate->addStudioCss(['handlers.css']);
        $this->_oModule->_oTemplate->addStudioJs(['handlers.js']);
        $this->_oModule->_oTemplate->addStudioJsTranslation(['_sys_grid_search']);
        return $oGrid->getCode();
    }

    protected function getLevels()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $oGrid = BxDolGrid::getObjectInstance($CNF['OBJECT_GRID_LEVELS'], BxDolStudioTemplate::getInstance());
        if(!$oGrid)
            return '';

        $this->_oModule->_oTemplate->addStudioCss(['levels.css']);
        $this->_oModule->_oTemplate->addStudioJs(['levels.js']);
        return $oGrid->getCode();
    }
}

/** @} */
