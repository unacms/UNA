<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * An onboarding checklist ("Get started", BxDolTours): a menu whose items are its steps. Each item's add-on is a
 * service call answering the step's state (BxDolTours::STEP_*), drawn in the add-on's place as a mark: a check when
 * the step is done, a lock while it waits for an earlier step, an arrow while it is to do. A step that waits has no
 * link. The item "join" (operators) tells who can join the site in its Info and links to that setting.
 */
class BxBaseMenuOnboarding extends BxTemplMenu
{
    protected $_aStates = [];

    public function __construct($aObject, $oTemplate = false)
    {
        parent::__construct($aObject, $oTemplate);

        $this->_bDisplayAddons = true;
        $this->addMarkers(['url_studio' => BX_DOL_URL_STUDIO]);
    }

    /**
     * The states of the steps drawn so far (getCode or getCodeAPI first), by item name.
     */
    public function getStates()
    {
        return $this->_aStates;
    }

    /**
     * How many of the steps are done and how many there are: a note isn't a step.
     */
    public function getProgress()
    {
        $aSteps = array_filter($this->_aStates, function($sState) {
            return in_array($sState, [BxDolTours::STEP_DONE, BxDolTours::STEP_TODO, BxDolTours::STEP_LOCKED]);
        });

        return [count(array_keys($aSteps, BxDolTours::STEP_DONE)), count($aSteps)];
    }

    protected function _getMenuItem($a)
    {
        return parent::_getMenuItem($this->_prepareStep($a));
    }

    protected function _getMenuItemAPI($a)
    {
        $a = $this->_prepareStep($a);

        $aResult = parent::_getMenuItemAPI($a);
        if(is_array($aResult)) {
            $sState = $this->_aStates[$a['name']];
            $aResult['state'] = $sState;
            $aResult['state_title'] = $sState != BxDolTours::STEP_NOTE ? _t('_sys_onboarding_state_' . $sState) : '';
        }

        return $aResult;
    }

    /**
     * The step's state, asked once; "join" says who can join and links to that setting; a step that waits for an
     * earlier one has no link yet.
     */
    protected function _prepareStep($a)
    {
        if($a['name'] == 'join') {
            $oTours = BxDolTours::getInstance();
            $a['info'] = '_sys_onboarding_join_' . $oTours->getJoinMode();
            $a['link'] = $oTours->getJoinSettingsUrl();
        }

        $sState = !empty($a['addon']) ? BxDolService::callSerialized($a['addon'], $this->_aMarkers) : '';
        if(!in_array($sState, [BxDolTours::STEP_DONE, BxDolTours::STEP_TODO, BxDolTours::STEP_LOCKED], true))
            $sState = BxDolTours::STEP_NOTE;
        $this->_aStates[$a['name']] = $sState;

        if($sState == BxDolTours::STEP_LOCKED) {
            $a['link'] = 'javascript:void(0);';
            $a['onclick'] = '';
            $a['attrs_add'] = trim((!empty($a['attrs_add']) ? $a['attrs_add'] : '') . ' aria-disabled="true"');
        }

        $a['addon_state'] = $sState;

        return $a;
    }

    protected function _getMenuAddon($aMenuItem)
    {
        $sState = isset($aMenuItem['addon_state']) ? $aMenuItem['addon_state'] : BxDolTours::STEP_NOTE;

        return $this->_bIsApi ? $sState : $this->_getStateMark($sState);
    }

    /**
     * The mark of a step's state, with its name for screen readers (the icon is decoration).
     */
    protected function _getStateMark($sState)
    {
        $aMarks = [
            BxDolTours::STEP_DONE => ['circle-check', 'w-5 h-5 text-green-700 dark:text-green-400', '_sys_onboarding_state_done'],
            BxDolTours::STEP_LOCKED => ['lock', 'w-5 h-5 text-gray-500 dark:text-gray-400', '_sys_onboarding_state_locked'],
            BxDolTours::STEP_TODO => ['chevron-right', 'w-5 h-5 text-gray-500 dark:text-gray-400', '_sys_onboarding_state_todo'],
            BxDolTours::STEP_NOTE => ['chevron-right', 'w-5 h-5 text-gray-500 dark:text-gray-400', ''],
        ];
        list($sIcon, $sClass, $sLabel) = $aMarks[$sState];

        $oIconset = BxDolIconset::getObjectInstance('sys_lucide', $this->_oTemplate);

        return $this->_oTemplate->parseHtmlByName('menu_list_desc_mark.html', [
            'icon' => $oIconset ? $oIconset->getIconHtml($sIcon, ['class' => $sClass]) : '',
            'bx_if:label' => [
                'condition' => $sLabel !== '',
                'content' => ['label' => $sLabel ? _t($sLabel) : ''],
            ],
        ]);
    }
}

/** @} */
