<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudioView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */
defined('BX_DOL') or die('hack attempt');

class BxTemplStudioPolyglotLanguages extends BxBaseStudioPolyglotLanguages // NOSONAR php:S110, the Dol/Base/Templ layering every Studio grid has
{
    public function __construct($aOptions, $oTemplate = false)
    {
        parent::__construct($aOptions, $oTemplate);
    }
}
/** @} */
