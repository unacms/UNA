<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

define('BX_DOL_STUDIO_API_TYPE_SETTINGS', 'settings');
define('BX_DOL_STUDIO_API_TYPE_CONFIG', 'api_config');
define('BX_DOL_STUDIO_API_TYPE_KEYS', 'keys');
define('BX_DOL_STUDIO_API_TYPE_ORIGINS', 'origins');

define('BX_DOL_STUDIO_API_TYPE_DEFAULT', BX_DOL_STUDIO_API_TYPE_SETTINGS);

class BxDolStudioAPI extends BxTemplStudioWidget
{
    protected $sPage;

    function __construct($sPage = "")
    {
        parent::__construct('api');

        $this->sPage = BX_DOL_STUDIO_API_TYPE_DEFAULT;
        if(is_string($sPage) && !empty($sPage))
            $this->sPage = $sPage;
    }
    
    public function checkAction()
    {
        $sAction = '';
    	if(($sAction = bx_get('api_action')) !== false)
            $sAction = bx_process_input($sAction);
        else
            return false;

        $aResult = ['code' => 1, 'message' => _t('_adm_api_err_action_handler_not_found')];
        switch($sAction) {
            default:
                $sMethod = 'action' . $this->getClassName($sAction);
                if(method_exists($this, $sMethod))
                    $aResult = $this->$sMethod();
        }

        return $aResult;
    }

    protected function actionDownload()
    {
        $sFile = '';
        if(($sFile = bx_get('api_value')) === false) 
            return ['code' => 2];

        $sPath = BX_DIRECTORY_PATH_TMP . $sFile;

        $sContent = '';
        if(!file_exists($sPath) || !($sContent = file_get_contents($sPath)))
            return ['code' => 3, 'msg' => _t('_adm_api_err_action_file_not_found')];

        @unlink($sPath);

        header("Cache-Control: must-revalidate, post-check=0, pre-check=0");
        header("Content-type: text/plain");
        header("Content-Length: " . strlen($sContent));
        header("Content-Disposition: attachment; filename=\"" . $sFile . "\"");
        echo $sContent;
        exit;
    }
}

/** @} */
