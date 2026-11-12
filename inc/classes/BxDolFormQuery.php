<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

bx_import('BxDolForm');

/**
 * Database queries for forms.
 * @see BxDolForm
 */
class BxDolFormQuery extends BxDolDb
{
    protected $_aObject;

    protected static $TYPES_SET = array (
        'select_multiple' => 1,
        'checkbox_set' => 1,
    );
    protected static $TYPES_TRANSLATABLE = array (
        'submit' => 1,
        'reset' => 1,
        'button' => 1,
    );

    public function __construct($aObject)
    {
        parent::__construct();
        $this->_aObject = $aObject;
    }

    static public function getFormObject ($sObject)
    {
        $oDb = BxDolDb::getInstance();

        $sQuery = $oDb->prepare("SELECT * FROM `sys_objects_form` WHERE `object` = ?", $sObject);
        return $oDb->fromMemory('sys_objects_form_' . $sObject, 'getRow', $sQuery);
    }
    
    static public function getNestedFormObjects ($sParentObject)
    {
        $oDb = BxDolDb::getInstance();

        $sQuery = $oDb->prepare("SELECT * FROM `sys_objects_form` WHERE `parent_form` = ?", $sParentObject);
        return $oDb->fromMemory('sys_objects_form_' . $sParentObject . '_nested', 'getAll', $sQuery);
    }
    
    static public function deleteDataFromNestedForm ($sTableName, $iContentId)
    {
        $oDb = BxDolDb::getInstance();

        $sQuery = $oDb->prepare("DELETE FROM  `" . $sTableName ."`  WHERE `content_id` = ?", $iContentId);
        $oDb->query($sQuery);
    }
    
    static public function getFormArray ($sObject, $sDisplayName)
    {
        $oDb = BxDolDb::getInstance();

        $sQuery = $oDb->prepare("SELECT * FROM `sys_objects_form` WHERE `active` = 1 AND `object` = ?", $sObject);
        $aObject = $oDb->fromMemory('sys_objects_form_' . $sObject, 'getRow', $sQuery);
        if (!$aObject || !is_array($aObject))
            return false;

        $sQuery = $oDb->prepare("SELECT * FROM `sys_form_displays` WHERE `object` = ? AND `display_name` = ?", $sObject, $sDisplayName);
        $aDisplay = $oDb->fromMemory('sys_form_displays_' . $sObject . '_' . $sDisplayName, 'getRow', $sQuery);
        if (!$aDisplay || !is_array($aDisplay))
            return false;

        $aForm = array ();

        // form attrs
        if (!empty($aObject['form_attrs']))
            $aAddFormAttrs = unserialize($aObject['form_attrs']);

        $aDefaultsFormAttrs = array(
            'action' => $aObject['action'],
            'name' => $aObject['object'],
            'id' => $aObject['object'],
        );

        $aForm['form_attrs'] = array_merge($aDefaultsFormAttrs, !empty($aAddFormAttrs) && is_array($aAddFormAttrs) ? $aAddFormAttrs : array());

        // form action
        if (!empty($aForm['form_attrs']['action']) && 0 !== strncasecmp($aForm['form_attrs']['action'], 'http://', 7) && 0 !== strncasecmp($aForm['form_attrs']['action'], 'https://', 8))
            $aForm['form_attrs']['action'] = bx_absolute_url(BxDolPermalinks::getInstance()->permalink($aForm['form_attrs']['action']));

        // params
        if (!empty($aObject['params']))
            $aAddFormParams = unserialize($aObject['params']);

        $mixedSubminName = '';
        if (!empty($aObject['submit_name'])) {
            $mixedSubminName = @unserialize($aObject['submit_name']);
            if($mixedSubminName === false)
                $mixedSubminName = $aObject['submit_name'];
        }

        $aDefaultsFormParams = array(
            'db' => array(
                'submit_name' => $mixedSubminName,
                'table' => $aObject['table'],
                'key' => $aObject['key'],
                'uri' => $aObject['uri'],
                'uri_title' => $aObject['uri_title'],
            ),
            'module' => $aObject['module'],
            'object' => $sObject,
            'display' => $sDisplayName,
            'view_mode' => $aDisplay['view_mode'],
            'label_style' => $aDisplay['label_style'] ?? '', // '' follows the site's style (sys_form_label_style)
        );

        $aForm['params'] = array_merge_recursive($aDefaultsFormParams, !empty($aAddFormParams) && is_array($aAddFormParams) ? $aAddFormParams : array());

        // form inputs
        $sQuery = $oDb->prepare("SELECT `i`.*, `d`.`visible_for_levels` FROM `sys_form_inputs` AS `i` INNER JOIN `sys_form_display_inputs` AS `d` ON (`d`.`input_name` = `i`.`name`) WHERE `d`.`active` = 1 AND `d`.`display_name` = ? AND `i`.`object` = ? ORDER BY `d`.`order` ASC", $aDisplay['display_name'], $sObject);
        $aInputs = $oDb->getAllWithKey($sQuery, 'name');
        $aForm['inputs'] = array();
        $aInputSets = array();
        foreach ($aInputs as $a) {

            // main attributes
            $aInput = array (
                'id' => $a['id'],
                'type' => $a['type'],
                'name' => $a['name'],
                'caption_system_src' => $a['caption_system'],
            	'caption_src' => $a['caption'],
                'caption' => _t($a['caption']),
            	'info_src' => $a['info'] ? $a['info'] : '',
                'info' => $a['info'] ? _t($a['info']) : '',
                'help_src' => $a['help'] ? $a['help'] : '',
                'help' => $a['help'] ? _t($a['help']) : '',
                'icon' => $a['icon'],
                'required' => $a['required'] ? true : false,
            	'unique' => $a['unique'] ? true : false,
                'collapsed' => $a['collapsed'] ? true : false,
                'privacy' => $a['privacy'] ? true : false,
                'rateable' => $a['rateable'],
                'html' => $a['html'],
                'attrs' => $a['attrs'] ? unserialize($a['attrs']) : [],
                'tr_attrs' => $a['attrs_tr'] ? unserialize($a['attrs_tr']) : [],
                'attrs_wrapper' => $a['attrs_wrapper'] ? unserialize($a['attrs_wrapper']) : [],
                'visible_for_levels' => $a['visible_for_levels'],
            );

            // if type is input set stop to process other attribnutes
            if ('input_set' == $a['type']) {
                $aForm['inputs'][$a['name']] = $aInput;
                $aInputSets[] = $a['name'];
                continue;
            }

            // default value
            if (!empty($a['value']))
                $aInput['value'] = isset(self::$TYPES_TRANSLATABLE[$aInput['type']]) ? _t($a['value']) : $a['value'];

            if (!empty($a['values'])) {
                $aInput['values_src'] = $a['values'];

                if (0 === strncmp(BX_DATA_LISTS_KEY_PREFIX, $a['values'], 2)) {
                    $aInput['values_list_name'] = trim($a['values'], BX_DATA_LISTS_KEY_PREFIX . ' ');
                    $aInput['values'] = self::getDataItems(trim($a['values'], BX_DATA_LISTS_KEY_PREFIX . ' '), isset(self::$TYPES_SET[$aInput['type']]));
                } else {
                    $aInput['values'] = unserialize($a['values']);
                }
            }

            $aInput['checked'] = $a['checked'] ? true : false;

            // checker function options
            if (!empty($a['checker_func'])) {
                $aChecker = array ('func' => $a['checker_func']);
                if ($a['checker_error'])
                    $aChecker['error'] = _t($a['checker_error']);
                if ($a['checker_params'])
                    $aChecker['params'] = unserialize($a['checker_params']);
                $aInput['checker'] = $aChecker;
            }

            // db processing options
            if (!empty($a['db_pass'])) {
                $aDb = array ('pass' => $a['db_pass']);
                if ($a['db_params'])
                    $a['params'] = unserialize($a['db_params']);
                $aInput['db'] = $aDb;
            }

            $aForm['inputs'][$a['name']] = $aInput;
        }

        foreach ($aInputSets as $sName) {
            $a = explode(',', $aInputs[$sName]['values']);
            foreach ($a as $sInputName) {
                if (!isset($aForm['inputs'][$sInputName]))
                    continue;
                $aForm['inputs'][$sName][] = $aForm['inputs'][$sInputName];
                unset($aForm['inputs'][$sInputName]);
            }
        }

        $aForm['override_class_name'] = $aObject['override_class_name'];
        $aForm['override_class_file'] = $aObject['override_class_file'];

        return $aForm;
    }

    static public function getDataItems($sKey, $isUseForSet = false, $sUseValues = BX_DATA_VALUES_DEFAULT)
    {
        bx_import('BxDolLanguages');
        
        $oDb = BxDolDb::getInstance();

        if(!in_array($sUseValues, array(BX_DATA_VALUES_DEFAULT, BX_DATA_VALUES_ADDITIONAL, BX_DATA_VALUES_ALL)))
            $sUseValues = BX_DATA_VALUES_DEFAULT;

        $sQuery = $oDb->prepare("SELECT `Value`, `LKey`, `LKey2`, `Data` FROM `sys_form_pre_values` WHERE `Key` = ? ORDER BY `Order` ASC", $sKey);
        if($sUseValues == BX_DATA_VALUES_ALL) {
            return $oDb->fromCache('sys_form_pre_values_with_key_' . $sKey, 'getAllWithKey', $sQuery, 'Value');
        }

        $a = $oDb->fromCache('sys_form_pre_values_' . $sKey, 'getAll', $sQuery);

        $iMaxValue = 0;
        if ($isUseForSet)
            $iMaxValue = log(BX_DOL_INT_MAX, 2) + 1;

        $aRet = array();
        foreach ($a as $r) {
            if ($isUseForSet && (!is_numeric($r['Value']) || $r['Value'] < 1 || $r['Value'] > $iMaxValue))
                continue;
            $aRet[$r['Value']] = BX_DATA_VALUES_ADDITIONAL == $sUseValues && !empty($r[BX_DATA_VALUES_ADDITIONAL]) ? _t($r[BX_DATA_VALUES_ADDITIONAL]) : _t($r[BX_DATA_VALUES_DEFAULT]);
        }

        return $aRet;
    }

    static public function fieldCheckUnique($sTable, $sField, $sValue)
    {
        return uriCheckUniq($sValue, $sTable, $sField);
    } 

    static public function fieldGetValue($sTable, $sField, $sFieldKey, $sFieldKeyValue)
    {
        return BxDolDb::getInstance()->getOne("SELECT `" . $sField . "` FROM `" . $sTable . "` WHERE `" . $sFieldKey . "`=:field_key LIMIT 1", array(
            'field_key' => $sFieldKeyValue
        ));
    }

    static public function getInputByName($sObject, $sName)
    {
        return BxDolDb::getInstance()->getRow("SELECT * FROM `sys_form_inputs` WHERE `object`=:object AND `name`=:name LIMIT 1", array(
            'object' => $sObject, 
            'name' => $sName
        ));
    }

    static public function getInputPrivacy($iInputId, $iAuthorId, $sPrivacyField = '')
    {
        $sMethod = 'getRow';
        $sSelectClause = '*';

        if(!empty($sPrivacyField)) {
            $sMethod = 'getOne';
            $sSelectClause = '`' . $sPrivacyField . '`';
        }

        return BxDolDb::getInstance()->$sMethod("SELECT " . $sSelectClause . " FROM `sys_form_inputs_privacy` WHERE `input_id`=:input_id AND `author_id`=:author_id LIMIT 1", array(
            'input_id' => $iInputId,
            'author_id' => $iAuthorId,
        ));
    }

    static public function setInputPrivacy($iInputId, $iAuthorId, $sPrivacyField, $sPrivacyValue)
    {
        $oDb = BxDolDb::getInstance();

        $sTable = 'sys_form_inputs_privacy';
        $aBindingsSet = array(
            $sPrivacyField => $sPrivacyValue
        );
        $aBindingsWhere = array(
            'input_id' => $iInputId,
            'author_id' => $iAuthorId,
        );

        $bResult = false;
        if((int)$oDb->getOne("SELECT `id` FROM `" . $sTable . "` WHERE `input_id`=:input_id AND `author_id`=:author_id LIMIT 1", $aBindingsWhere) != 0)
            $bResult = $oDb->query("UPDATE `" . $sTable . "` SET " . $oDb->arrayToSQL($aBindingsSet) . " WHERE " . $oDb->arrayToSQL($aBindingsWhere, ' AND ')) !== false;
        else
            $bResult = (int)$oDb->query("INSERT `" . $sTable . "` SET " . $oDb->arrayToSQL(array_merge($aBindingsSet, $aBindingsWhere))) > 0;

        return $bResult;
    }
    
    static public function addFormField($sObjectForm, $sFieldName, $iContentId, $iAuthorId, $sModuleName, $iNestedContentId = 0)
    {
        $oDb = BxDolDb::getInstance();
        $aBindings = array(
            'object_form' => $sObjectForm,
            'field_name' => $sFieldName,
            'content_id' => $iContentId,
            'author_id' => $iAuthorId,
            'module' => $sModuleName,
            'nested_content_id' => $iNestedContentId
        );
        $oDb->query("INSERT `sys_form_fields_ids` SET `object_form`=:object_form, `field_name`=:field_name, `content_id`=:content_id, `author_id`=:author_id, `module`=:module, nested_content_id=:nested_content_id", $aBindings);
    }
    
    static public function getFormField($sObjectForm, $sFieldName, $iContentId, $iNestedContentId = 0)
    {
        $oDb = BxDolDb::getInstance();
        $aBindings = array(
            'object_form' => $sObjectForm,
            'field_name' => $sFieldName,
            'content_id' => $iContentId,
            'nested_content_id' => $iNestedContentId
        );
        return $oDb->getOne("SELECT `id` FROM `sys_form_fields_ids` WHERE `object_form`=:object_form AND `field_name`=:field_name AND `content_id`=:content_id AND nested_content_id=:nested_content_id", $aBindings);
    }
    
    static public function removeFormField($sObjectForm, $iContentId = 0)
    {
        $oDb = BxDolDb::getInstance();
        if ($iContentId > 0){
            $aBindings = array(
                'object_form' => $sObjectForm,
                'content_id' => $iContentId
            );
            $oDb->query("DELETE FROM `sys_form_fields_ids` WHERE  `object_form` = :object_form AND `content_id` = :content_id", $aBindings);
        }
        else{
            $aBindings = array(
                'object_form' => $sObjectForm
            );
            $oDb->query("DELETE FROM `sys_form_fields_ids` WHERE  `object_form` = :object_form", $aBindings);
        }
    }
        
    static public function removeFormFields($sModule)
    {
        $oDb = BxDolDb::getInstance();
        $aBindings = array(
            'module' => $sModule,
        );
        $oDb->query("DELETE FROM `sys_form_fields_ids` WHERE  `module` = :module", $aBindings);
    }

    static public function getFormInputs($sObject, $mDisplay = '')
    {
        $oDb = BxDolDb::getInstance();
        if ($mDisplay == ''){
            $sQuery = $oDb->prepare("SELECT * FROM `sys_form_inputs` WHERE `object` = ?", $sObject);
            return $oDb->getAll($sQuery);
        }
        else{
            if (!is_array($mDisplay))
                $mDisplay = [$mDisplay];
            $sQuery = $oDb->prepare("
            SELECT DISTINCT `sys_form_inputs`.* FROM `sys_form_inputs`  
            INNER JOIN `sys_form_display_inputs` ON `sys_form_display_inputs`.`input_name` =`sys_form_inputs`.`name`
            WHERE `sys_form_display_inputs`.`display_name` IN (" . $oDb->implode_escape($mDisplay) . ")
            AND `sys_form_inputs`.`object` = ? AND `sys_form_display_inputs`.`active` = 1", $sObject);
            return $oDb->getAll($sQuery);
        }
    }
}

/** @} */
