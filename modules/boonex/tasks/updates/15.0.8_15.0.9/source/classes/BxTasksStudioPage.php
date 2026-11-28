<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT 
 * @defgroup    Tasks Tasks
 * @ingroup     UnaModules
 *
 * @{
 */

define('BX_DOL_STUDIO_MOD_TYPE_IMPORT', 'import');

class BxTasksStudioPage extends BxTemplStudioModule
{
    protected $_sModule;
    protected $_oModule;
    
    function __construct($sModule, $mixedPageName, $sPage = "")
    {
    	$this->_sModule = 'bx_tasks';
    	$this->_oModule = BxDolModule::getInstance($this->_sModule);

        parent::__construct($sModule, $mixedPageName, $sPage);

        $this->aMenuItems += [
            BX_DOL_STUDIO_MOD_TYPE_IMPORT => ['name' => BX_DOL_STUDIO_MOD_TYPE_IMPORT, 'icon' => 'file-import', 'title' => '_bx_tasks_menu_item_title_import']
        ];
    }

    protected function getImport()
    {
        $sResult = '';

        bx_import('FormImport', $this->_oModule->_aModule);
        $oForm = new BxTasksFormImport([], BxDolStudioTemplate::getInstance());
        $oForm->aInputs['page']['value'] = $this->sPage;

        $oForm->initChecker();
        if($oForm->isSubmittedAndValid()) {
            $sSource = $oForm->getCleanValue('source');
            $iDestination = $oForm->getCleanValue('destination');

            $sBgJobName = $this->_sModule . '-' . $sSource . '-' . $iDestination;
            $aBgJobCall = [$this->_sModule, 'import_from', [$sSource, $iDestination, json_decode($oForm->getCleanValue('params'), true)]];
            if(BxDolBackgroundJobs::getInstance()->add($sBgJobName, $aBgJobCall))
                $sResult = MsgBox(_t('_bx_tasks_txt_msg_schedule_action'), 3);
            else
                $sResult = MsgBox(_t('_bx_tasks_txt_err_cannot_perform_action'));
        }

        $this->_oModule->_oTemplate->addStudioJs(['import.js']);
        return $this->_oModule->_oTemplate->parseHtmlByName('import_form.html', [
            'form' => $sResult . $oForm->getCode(),
            'js_code' => $this->_oModule->_oTemplate->getJsCode('import')
        ]);
    }
}

/** @} */
