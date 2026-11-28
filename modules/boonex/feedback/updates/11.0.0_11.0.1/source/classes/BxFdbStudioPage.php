<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Credits Credits
 * @ingroup     UnaModules
 *
 * @{
 */

define('BX_DOL_STUDIO_MOD_TYPE_QUESTIONS', 'questions');

class BxFdbStudioPage extends BxTemplStudioModule
{
    protected $_sModule;
    protected $_oModule;

    function __construct($sModule, $mixedPageName, $sPage = "")
    {
    	$this->_sModule = 'bx_feedback';
    	$this->_oModule = BxDolModule::getInstance($this->_sModule);

        parent::__construct($sModule, $mixedPageName, $sPage);

        $this->aMenuItems[BX_DOL_STUDIO_MOD_TYPE_QUESTIONS] = array('name' => BX_DOL_STUDIO_MOD_TYPE_QUESTIONS, 'icon' => 'question', 'title' => '_bx_feedback_lmi_cpt_questions');
    }

    protected function getQuestions()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $oGrid = BxDolGrid::getObjectInstance($CNF['OBJECT_GRID_QUESTIONS'], BxDolStudioTemplate::getInstance());
        if(!$oGrid)
            return '';

        $this->_oModule->_oTemplate->addStudioJs(array('question.js'));
        $this->_oModule->_oTemplate->addStudioCss(array('question.css'));
        return $oGrid->getCode();
    }
}

/** @} */
