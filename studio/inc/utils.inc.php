<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

function bx_get_js_result($aParams)
{
    $aResult = [];
    if(isset($aParams['code']))
        $aResult['code'] = $aParams['code'];

    // 'message' opens a dialog, for an error or a question; 'toast' shows a success without blocking
    foreach(['message', 'toast'] as $sKey) {
        if(empty($aParams[$sKey]))
            continue;

        $aResult[$sKey] = $aParams[$sKey];

        if(!isset($aParams['translate']) || !empty($aParams['translate'])) {
            $aTrtParams = array($aResult[$sKey]);
            if(!empty($aParams['translate']) && is_array($aParams['translate']))
                $aTrtParams = array_merge($aTrtParams, $aParams['translate']);

            $aResult[$sKey] = call_user_func_array ('_t', $aTrtParams);
        }
    }

    if(isset($aParams['redirect']) && $aParams['redirect'] !== false)
        $aResult['redirect'] = is_string($aParams['redirect']) ? $aParams['redirect'] : BX_DOL_URL_STUDIO;

    if(!empty($aParams['eval']))
        $aResult['eval'] = $aParams['eval'];

    // the reply's interface sound, played by processJsonData: 'error' or ['cue' => 'success', 'emphasis' => 'subtle']
    if(!empty($aParams['cue']))
        $aResult['cue'] = $aParams['cue'];

    $sResult = "window.parent.processJsonData(" . json_encode($aResult) . ");";
    if(isset($aParams['on_page_load']) && $aParams['on_page_load'] === true)
        $sResult = "$(document).ready(function() {" . $sResult . "});";

    return BxDolStudioTemplate::getInstance()->_wrapInTagJsCode($sResult);
}

function bx_array_insert_before($aInsert, $aSource, $sKey)
{
    return bx_array_insert($aInsert, $aSource, $sKey, 0);
}

function bx_array_insert_after($aInsert, $aSource, $sKey)
{
    return bx_array_insert($aInsert, $aSource, $sKey, 1);
}

function bx_array_insert($aInsert, $aSource, $sKey, $iDirection = 1)
{
    $iPosition = array_search($sKey, array_keys($aSource)) + $iDirection;

    if($iPosition == 0)
        return $aInsert + $aSource;

    if($iPosition == count($aSource))
        return $aSource + $aInsert;

    return array_slice($aSource, 0, $iPosition, true) + $aInsert + array_slice($aSource, $iPosition, NULL, true);
}

/** @} */
