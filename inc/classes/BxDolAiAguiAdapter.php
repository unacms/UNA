<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

use NeuronAI\Agent\Adapters\AGUIAdapter;

/**
 * AG-UI stream adapter of the chat: the text of a failed run is the one UNA shows
 * to the visitor, not the neutral text of the library.
 */
class BxDolAiAguiAdapter extends AGUIAdapter
{
    protected function errorMessage(Throwable $oError): string
    {
        $s = isAdmin() ? BxDolAiTrigger::visibleError($oError) : $oError->getMessage();
        return $s !== '' ? $s : _t('_sys_agents_exception');
    }
}

/** @} */
