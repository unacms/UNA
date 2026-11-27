<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    OktaConnect Okta Connect
 * @ingroup     UnaModules
 *
 * @{
 */

class BxOktaConStudioPage extends BxTemplStudioModule
{
    function __construct($sModule, $mixedPageName, $sPage = "")
    {
        parent::__construct($sModule, $mixedPageName, $sPage);

        $this->aMenuItems = array(
            'settings' => array('name' => 'settings', 'icon' => 'cogs', 'title' => '_adm_lmi_cpt_settings'),
            'help' => array('name' => 'help', 'icon' => 'question', 'title' => '_sys_connect_information'),
        );
    }
    
    function getHelp ()
    {
        $oModule = BxDolModule::getInstance('bx_oktacon'); 
        return _t('_bx_oktacon_information_block', BX_DOL_URL_ROOT . $oModule -> _oConfig -> getBaseUri() . 'handle');
    }

    function getImport ()
    {
        $aForm = array(
            'form_attrs' => ['enctype' => 'multipart/form-data'],
            'params' => ['db' => ['submit_name' => 'do_submit']],
            'inputs' => array(
                'file' => array(
                    'type' => 'file',
                    'name' => 'file',
                    'caption' => 'CSV File',
                    'required' => true,
                ),

                'field_email' => array(
                    'type' => 'text',
                    'name' => 'field_email',
                    'caption' => 'Email field',
                    'required' => true,
                ),

                'field_remote_id' => array(
                    'type' => 'text',
                    'name' => 'field_remote_id',
                    'caption' => 'Remote ID field',
                    'required' => true,
                ),

                'do_submit' => array(
                    'type' => 'submit',
                    'name' => 'do_submit',
                    'value' => 'Submit',
                ),
            ),
        );

        $oForm =new BxTemplFormView($aForm);

        $oForm->initChecker(); // init form checker witout any data - adding new record
        if ($oForm->isSubmittedAndValid()) {
            $aFields = [];
            $iEmail = false;
            $iRemId = false;
            $sOutput = '<style>.err { color:red; } .ok { color:green; } </style>';
            if (!empty($_FILES["file"]["tmp_name"]) && ($handle = fopen($_FILES["file"]["tmp_name"], "r")) !== FALSE) {
                $row = 1;
                while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
                    $num = count($data);
                    if (1 === $row) {
                        for ($c=0; $c < $num; $c++) {
                            $aFields[$data[$c]] = $c;
                        }
                        $iEmail = isset($aFields[$_POST['field_email']]) ? $aFields[$_POST['field_email']] : false;
                        $iRemId = isset($aFields[$_POST['field_remote_id']]) ? $aFields[$_POST['field_remote_id']] : false;
                        if (!isset($aFields[$_POST['field_email']]) || !isset($aFields[$_POST['field_remote_id']])) {
                            $sOutput = 'no matching fields were found';
                            break;
                        }
                    }
                    else {
                        if (empty($data[$iEmail]) || empty($data[$iRemId])) {
                            $sOutput .= "$row. EMPTY : <b class=\"err\">ERR - input data is empty</b><br />";
                        } else { 
                            $oAccount = BxDolAccount::getInstance(trim($data[$iEmail]));
                            $oProfile = $oAccount ? BxDolProfile::getInstanceByAccount($oAccount->id()) : false;
                            if (!$oAccount || !$oProfile) {
                                $sOutput .= "$row. {$data[$iEmail]} : <b class=\"err\">ERR - no matching account or profile was found</b><br />";
                            }
                            else {
                                $res = BxDolDb::getInstance()->query("INSERT IGNORE INTO `bx_oktacon_accounts` (`local_profile`, `remote_profile`) VALUES (:lp, :rp)", ['lp' => $oProfile->id(), 'rp' => $data[$iRemId]]);         
                                if ($res)
                                    $sOutput .= "$row. {$data[$iEmail]} :  <b class=\"ok\">OK</b> {$data[$iRemId]} => " . $oProfile->id() . " <br />";
                                else
                                    $sOutput .= "$row. {$data[$iEmail]} :  <b class=\"err\">ERR - DB insert query failed (maybe duplicate record)</b> {$data[$iRemId]} => " . $oProfile->id() . " <br />";
                            }                            
                        }
                        $sOutput .= "<hr />";
                    }
                    $row++;
                }
                fclose($handle);
                return $sOutput;
            }
        }

        return $oForm->getCode();
    }
}

/** @} */
