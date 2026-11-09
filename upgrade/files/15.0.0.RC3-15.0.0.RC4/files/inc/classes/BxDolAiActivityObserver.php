<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * NeuronAI listener of the tool-called event that turns every write tool call of an agent into a
 * BxDolAiActivity row. Attached in BxDolAiAgent alongside the debug log listener.
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

use NeuronAI\Agent\Observability\ToolCalled;

class BxDolAiActivityObserver
{
    public function __construct(protected array $aAgent, protected array $aParams = [])
    {
    }

    public function __invoke(ToolCalled $oEvent): void
    {
        $oCall = $oEvent->tool;
        if (!is_object($oCall))
            return;

        try {
            $aInputs = (array)$oCall->getInputs();
            $mixedResult = $oCall->hasResult() ? $oCall->getResult() : null;
            if (is_object($mixedResult))
                $mixedResult = (string)$mixedResult;
            BxDolAiActivity::record($this->aAgent, $this->aParams, (string)$oCall->getName(), $aInputs, $mixedResult);
        } catch (Throwable $o) {
            bx_log('sys_agents', 'activity observer: ' . $o->getMessage(), BX_LOG_WARN);
        }
    }
}

/** @} */
