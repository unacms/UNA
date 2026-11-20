<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    SocialEngineMigration SocialEngine Migration
 * @ingroup     UnaModules
 * 
 * @{
 */

class BxSEMigTransfers extends BxTemplGrid
{
    protected $MODULE;
    protected $_oModule;

    public function __construct ($aOptions, $oTemplate = false)
    {
    	$this -> MODULE = 'bx_se_migration';
		$this -> _oModule = BxDolModule::getInstance('bx_se_migration');
		$this -> _aConfirmMessages['run'] = _t('_bx_se_migration_start_transfer_confirmation');
		
        parent::__construct ($aOptions, $oTemplate);
    }
	
	protected function _getCellStatusText($mixedValue, $sKey, $aField, $aRow) {        
		$sAttr = $this->_convertAttrs($aField, 'attr_cell', false, isset($aField['width']) ? 'width:' . $aField['width'] : false);				
		
		if ($aRow['status'] != 'finished') $mixedValue = _t('_bx_se_migration_status_' . $aRow['status']);
		
		return '<td ' . $sAttr . '><span class="' . ($aRow['status'] == 'finished' ? 'bx-se-migrate-not-finished' : ($aRow['status'] == 'error' ? 'bx-se-migrate-error' : '')) . '">' . $mixedValue . '</span></td>';
	} 
	
	protected function _getCellModule($mixedValue, $sKey, $aField, $aRow) {        
		return '<td>' .  _t('_bx_se_migration_data_' . $mixedValue) . '</td>';
	} 
	
	 public function performActionRun() {
		$aElements = bx_get('ids');		
		echoJson(array(
			'msg' => $this-> _oModule -> actionStartTransfer($aElements), 
			'grid' => $this -> getCode(false),
			'blink' => $aElements,
		));		   
	 }
	 
	 protected function _getFilterControls() {
        $aForm = array(
            'form_attrs' => array(),
            'inputs' => array (
                'path' => array(
                    'type' => 'text',
                    'name' => 'se_migration_location',
                    'caption' => $this -> _oModule -> _oDb -> isConfigInstalled() ? _t('_bx_se_migration_se_defined_path') : _t('_bx_se_migration_cpt_put_path'),
                    'value' => $this -> _oModule -> _oDb -> getExtraParam('root'),
					'attrs_wrap'
                ),   
				
				'save' => array (
                    'type' => 'submit',
                    'name' => 'save',
                    'value' => _t('_bx_se_migration_cpt_' . ($this -> _oModule -> _oDb -> getExtraParam('root') ? 'update' : 'save'))					
                )
            )
        );
        
		
		if ($this -> _oModule -> _oDb -> isConfigInstalled()) 
				$aForm['inputs']['save']['attrs'] = array('onclick' => "javascript:return confirm('" . bx_js_string(_t('_bx_se_migration_reupload_data')) . "');");
		
		$oForm = new BxTemplStudioFormView($aForm);
        return $oForm -> getCode();
    }
}

/** @} */
