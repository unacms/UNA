<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * A tool refused or failed its call. NeuronAI catches it like any other
 * Throwable and hands the message back to the model as the tool result.
 */
class BxDolAIToolException extends Exception
{
}

/** @} */
