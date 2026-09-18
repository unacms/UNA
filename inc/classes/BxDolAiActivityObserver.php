<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * NeuronAI observer that turns every write tool call of an agent into a
 * BxDolAiActivity row. Attached in BxDolAiAgent alongside the debug LogObserver.
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

use NeuronAI\Observability\ObserverInterface;

class BxDolAiActivityObserver implements ObserverInterface
{
    public function __construct(protected array $aAgent, protected array $aParams = [])
    {
    }

    public function onEvent(string $event, object $source, mixed $data = null, ?string $branchId = null): void
    {
        if ($event !== 'tool-called' || !is_object($data))
            return;

        $oTool = $data->tool ?? null;
        if (!is_object($oTool) || !method_exists($oTool, 'getName'))
            return;

        try {
            $aInputs = method_exists($oTool, 'getInputs') ? (array)$oTool->getInputs() : [];
            $mixedResult = method_exists($oTool, 'getResult') ? $oTool->getResult() : null;
            BxDolAiActivity::record($this->aAgent, $this->aParams, (string)$oTool->getName(), $aInputs, $mixedResult);
        } catch (Throwable $o) {
            bx_log('sys_agents', 'activity observer: ' . $o->getMessage(), BX_LOG_WARN);
        }
    }
}

/** @} */
