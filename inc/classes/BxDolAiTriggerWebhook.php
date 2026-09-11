<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

class BxDolAiTriggerWebhook extends BxDolAiTrigger
{
    protected $_sType = 'webhook';

    protected function getSampleField()
    {
        return 'webhook_sample';
    }

    public function handle($mixed = null)
    {
        if (!BxDolAi::getInstance()) {
            header('Content-Type: application/json');
            header('HTTP/1.0 403 Forbidden');
            BxDolLanguages::getInstance();
            echo json_encode(['status' => 403, 'error' => _t("_Access denied")]);
            exit;
        }

        header('Content-Type: application/json');

        $aHeaders = function_exists('getallheaders') ? getallheaders() : false;
        if ($aHeaders) {
            $sAuthHeader = isset($aHeaders['Authorization']) ? $aHeaders['Authorization'] : (isset($aHeaders['authorization']) ? $aHeaders['authorization'] : false);
        } else {
            $sAuthHeader = isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : false;
        }
        $sKey = str_replace('Bearer ', '', $sAuthHeader);

        $aAgent = $sKey ? $this->getAgentByKey($sKey) : false;
        if (!$aAgent) {
            header('HTTP/1.0 403 Forbidden');
            BxDolLanguages::getInstance();
            echo json_encode(['status' => 403, 'error' => _t("_Access denied")]);
            exit;
        }

        $aParams = is_array($mixed) ? $mixed : $_REQUEST;
        $aParams['trigger'] = $this->getType();

        if (!empty($aAgent['async'])) {
            $this->enqueue($aAgent, $aParams);
            echo json_encode(['result' => 'scheduled']);
            return;
        }

        echo json_encode($this->call($aAgent, $aParams));
    }

    public function getAgentByKey($sKey)
    {
        $oDb = new BxDolAiQuery();
        return $oDb->getAgentByTriggerWebhookKey($sKey);
    }
}

/** @} */
