<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    OpenCV OpenCV integration
 * @ingroup     UnaModules
 *
 * @{
 */

class BxOpencvAlerts extends BxDolAlertsResponse
{
    function __construct()
    {
        parent::__construct();
        
    }

    public function response($o)
    {
        if ('system' == $o->sUnit && 'store_file' == $o->sAction && in_array($o->aExtras['store_method'], ['Form', 'Xhr', ])) {
            $sStorages = getParam('bx_opencv_option_storages');
            $aStorages = explode(',', $sStorages);
            if (in_array($o->aExtras['storage_object'], $aStorages)) {
                $bObfuscateFaces = false;
                if(($oProfile = BxDolProfile::getInstance($o->iSender)) !== false) {
                    $aInfo = bx_srv($oProfile->getModule(), 'get_content_info_by_profile_id', [$o->iSender]);
                    $bObfuscateFaces = isset($aInfo['obfuscate_faces']) && $aInfo['obfuscate_faces'];
                }

                if(($mixedObfuscateFaces = bx_get('obfuscate_faces')) !== false)
                    $bObfuscateFaces = (int)$mixedObfuscateFaces == 1;

                if ($bObfuscateFaces)
                    bx_srv('bx_opencv', 'process_image', [$o->aExtras['file_path'], isset($o->aExtras['ext']) ? $o->aExtras['ext'] : 'jpg']);
            }
        }
    }    
}

/** @} */
