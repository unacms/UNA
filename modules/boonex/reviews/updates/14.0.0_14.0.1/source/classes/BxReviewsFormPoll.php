<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Reviews Reviews
 * @ingroup     UnaModules
 *
 * @{
 */

class BxReviewsFormPoll extends BxBaseModTextFormPoll
{
    public function __construct($aInfo, $oTemplate = false)
    {
        $this->_sModule = 'bx_reviews';
        $this->_aFieldsCheckForSpam = array('answers');
        parent::__construct($aInfo, $oTemplate);
    }
}

class BxReviewsFormPollCheckerHelper extends BxBaseModTextFormPollCheckerHelper {}

/** @} */
