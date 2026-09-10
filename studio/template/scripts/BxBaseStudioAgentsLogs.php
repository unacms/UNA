<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

class BxBaseStudioAgentsLogs extends BxTemplStudioGridAgents
{
    public function __construct ($aOptions, $oTemplate = false)
    {
        parent::__construct ($aOptions, $oTemplate);
        $this->addMarkers($this->_aBrowseParams);
    }

    protected function _getCellLevel ($mixedValue, $sKey, $aField, $aRow) 
    {
        switch ($mixedValue) {
            case 'info':
                $mixedValue = '<span title="Info">ℹ️</span>';
                break;
            case 'error':
                $mixedValue = '<span title="Error">❗️</span>';
                break;
            default:
                $mixedValue = '<span title="' . bx_html_attribute($mixedValue) . '">⚠️</span>';
                break;
        }        
        return parent::_getCellDefault ($mixedValue, $sKey, $aField, $aRow);
    } 

    protected function _getCellMessage ($mixedValue, $sKey, $aField, $aRow) 
    {
        switch ($mixedValue) {
            case 'workflow-start':
            case 'workflow-end':            
                $mixedValue = '❇️ ' . $mixedValue . ' ❇️';
                break;
            case 'error':
                $mixedValue = '❗️ ' . $mixedValue;
                break;
            case 'tool-calling':
            case 'tool-called':
                $mixedValue = '🛠️ ' . $mixedValue;
                break;
            default:
                if (preg_match('/^message-/', $mixedValue)) {
                    $mixedValue = '💬 ' . $mixedValue;
                } elseif (preg_match('/^rag-/', $mixedValue)) {
                    $mixedValue = '🔍 ' . $mixedValue;
                }
                elseif (preg_match('/^inference-/', $mixedValue)) {
                    $mixedValue = '⚛️ ' . $mixedValue;
                }
                break;
        }        
        return parent::_getCellDefault ($mixedValue, $sKey, $aField, $aRow);
    } 

    protected function _getCellContext ($mixedValue, $sKey, $aField, $aRow) 
    {
        $sPopupString = '<div style="width: 100vw; max-width: 800px;"><textarea class="bx-def-font-inputs bx-form-input-textarea">' . $mixedValue . '</textarea></div>';
        $mixedValue = BxTemplFunctions::getInstance()->getStringWithLimitedLength($mixedValue, 55, true, true, $sPopupString);
        return parent::_getCellDefault ($mixedValue, $sKey, $aField, $aRow);
    } 

    protected function _getCellCreatedAt ($mixedValue, $sKey, $aField, $aRow) 
    {
        return parent::_getCellDefault ($mixedValue, $sKey, $aField, $aRow);
    } 
}

/** @} */
